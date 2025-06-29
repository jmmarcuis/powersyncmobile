from fastapi import FastAPI, WebSocket, Request  # type: ignore
from fastapi.responses import HTMLResponse, StreamingResponse  # type: ignore
from fastapi.templating import Jinja2Templates  # type: ignore

from aiortc import RTCPeerConnection, RTCSessionDescription, RTCIceCandidate, VideoStreamTrack  # type: ignore
# from aiortc.contrib.media import MediaRelay  # type: ignore  # Uncomment if you need relaying

import cv2  # type: ignore
import numpy as np  # type: ignore
import asyncio
import logging
import os

# ----------------------------------------------------------------------------
# Logging
# ----------------------------------------------------------------------------
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("webrtc-fastapi")

# ----------------------------------------------------------------------------
# FastAPI initialisation
# ----------------------------------------------------------------------------
app = FastAPI()
base_dir = os.path.dirname(__file__)
templates = Jinja2Templates(directory=os.path.join(base_dir, "templates"))

# ----------------------------------------------------------------------------
# Data-structures holding state
# ----------------------------------------------------------------------------
peer_connections = set()

# ----------------------------------------------------------------------------
# Startup / shutdown hooks
# ----------------------------------------------------------------------------
@app.on_event("startup")
async def _startup() -> None:
    logger.info("FastAPI server started.")

@app.on_event("shutdown")
async def _shutdown() -> None:
    for pc in list(peer_connections):
        await pc.close()
    peer_connections.clear()
    logger.info("Clean shutdown – peer connections closed.")

# ----------------------------------------------------------------------------
# Custom VideoTrack that keeps latest received frame so that it can be exposed
# as an MJPEG HTTP stream later on.
# ----------------------------------------------------------------------------
class WebCamStreamTrack(VideoStreamTrack):
    """A VideoStreamTrack that only *receives* video. We store the latest frame
    in a small asyncio.Queue so we can retrieve it from outside the WebRTC
    connection (i.e. inside the /video_feed endpoint)."""

    def __init__(self) -> None:
        super().__init__()
        self._frame_queue: asyncio.Queue = asyncio.Queue(maxsize=1)

    # ---------------------------------------------------------------------
    # For simplicity we expose a `push_frame` helper that consumer coroutines
    # (spawned in websocket_signalling) can call each time they receive a new
    # frame from the remote track.
    # ---------------------------------------------------------------------
    def push_frame(self, frame) -> None:  # aiortc VideoFrame
        """Push the latest frame into the internal queue (dropping older ones)"""
        if not self._frame_queue.empty():
            try:
                self._frame_queue.get_nowait()
            except asyncio.QueueEmpty:
                pass
        try:
            self._frame_queue.put_nowait(frame)
        except asyncio.QueueFull:
            pass  # should never happen thanks to the earlier dequeue

    # ---------------------------------------------------------------------
    # Public helper – awaited by /video_feed to obtain the latest frame.
    # ---------------------------------------------------------------------
    async def get_latest_ndarray(self) -> np.ndarray | None:
        try:
            frame = await asyncio.wait_for(self._frame_queue.get(), timeout=1)
        except asyncio.TimeoutError:
            return None
        return frame.to_ndarray(format="bgr24")

    # ------------------------------------------------------------------
    # We are *not* going to send anything back via WebRTC, so recv() just
    # returns blank frames (to keep the aiortc machinery happy).
    # ------------------------------------------------------------------
    async def recv(self):  # type: ignore[override]
        height, width = 480, 640
        dummy = np.zeros((height, width, 3), np.uint8)
        from av import VideoFrame  # type: ignore

        frame = VideoFrame.from_ndarray(dummy, format="bgr24")
        frame.pts, frame.time_base = 0, 1 / 30
        await asyncio.sleep(1 / 30)
        return frame

# ----------------------------------------------------------------------------
# Routes
# ----------------------------------------------------------------------------
@app.get("/", response_class=HTMLResponse)
async def index(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})


@app.websocket("/ws")
async def websocket_signalling(socket: WebSocket):
    await socket.accept()
    logger.info("WebSocket signalling channel opened.")

    pc = RTCPeerConnection()
    peer_connections.add(pc)

    local_track = WebCamStreamTrack()
    # Expose on the PeerConnection instance for retrieval by /video_feed
    pc.webcam_track = local_track  # type: ignore[attr-defined]

    # ------------------------------------------------------------------
    # Signalling helpers
    # ------------------------------------------------------------------
    @pc.on("icecandidate")
    async def _on_ice(candidate):  # type: ignore[no-redef]
        if candidate:
            await socket.send_json(
                {
                    "type": "candidate",
                    "candidate": {
                        "sdpMid": candidate.sdpMid,
                        "sdpMLineIndex": candidate.sdpMLineIndex,
                        "candidate": candidate.candidate,
                    },
                }
            )

    @pc.on("track")
    async def _on_track(track):  # type: ignore[no-redef]
        logger.info("Track %s received", track.kind)
        if track.kind == "video":
            async def _consume():
                try:
                    while True:
                        frame = await track.recv()
                        local_track.push_frame(frame)
                except Exception:
                    logger.info("Video track finished/errored – consumer task ending.")

            asyncio.create_task(_consume())

    @pc.on("connectionstatechange")
    async def _on_state():  # type: ignore[no-redef]
        logger.info("Connection state: %s", pc.connectionState)
        if pc.connectionState in {"failed", "closed", "disconnected"}:
            await pc.close()
            peer_connections.discard(pc)

    try:
        while True:
            message = await socket.receive_json()
            if message["type"] == "offer":
                offer = RTCSessionDescription(**message)  # type: ignore[arg-type]
                await pc.setRemoteDescription(offer)
                answer = await pc.createAnswer()
                await pc.setLocalDescription(answer)
                await socket.send_json(
                    {"type": pc.localDescription.type, "sdp": pc.localDescription.sdp}
                )

            elif message["type"] == "candidate":
                c = message["candidate"]
                candidate = RTCIceCandidate(
                    candidate=c["candidate"],
                    sdpMid=c["sdpMid"],
                    sdpMLineIndex=c["sdpMLineIndex"],
                )
                await pc.addIceCandidate(candidate)

            elif message["type"] == "close":
                break

    except Exception as exc:
        logger.exception("WebSocket error: %s", exc)

    finally:
        await pc.close()
        peer_connections.discard(pc)
        await socket.close()
        logger.info("WebSocket signalling channel closed.")


@app.get("/video_feed")
async def video_feed():
    # Pick the first active WebCamStreamTrack (only one mobile client expected)
    active_track: WebCamStreamTrack | None = None
    for pc in peer_connections:
        if hasattr(pc, "webcam_track"):
            active_track = pc.webcam_track  # type: ignore[attr-defined]
            break

    if active_track is None:
        # Fallback generator sending blank frames
        async def _blank_frames():
            while True:
                frame = np.zeros((480, 640, 3), np.uint8)
                _, buffer = cv2.imencode(".jpg", frame)
                yield (
                    b"--frame\r\nContent-Type: image/jpeg\r\n\r\n" + buffer.tobytes() + b"\r\n"
                )
                await asyncio.sleep(0.5)

        return StreamingResponse(
            _blank_frames(),
            media_type="multipart/x-mixed-replace; boundary=frame",
        )

    async def _gen():
        while True:
            frame_nd = await active_track.get_latest_ndarray()
            if frame_nd is None:
                frame_nd = np.zeros((480, 640, 3), np.uint8)
            _, buffer = cv2.imencode(".jpg", frame_nd)
            yield (
                b"--frame\r\nContent-Type: image/jpeg\r\n\r\n" + buffer.tobytes() + b"\r\n"
            )
            await asyncio.sleep(1 / 30)

    return StreamingResponse(_gen(), media_type="multipart/x-mixed-replace; boundary=frame")


# ----------------------------------------------------------------------------
# Local dev entry-point
# ----------------------------------------------------------------------------
if __name__ == "__main__":
    import uvicorn  # type: ignore

    uvicorn.run(app, host="0.0.0.0", port=8000)