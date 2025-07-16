🏋️ PowerSync

PowerSync is a mobile app designed for powerlifters to track and analyze their form through real-time pose estimation. It streams video to a FastAPI backend for AI-based feedback using models like MoveNet. Built with React Native (Expo), the app is compatible with Android devices via Expo Go.

📱 Features

    Live video streaming from your phone camera

    Real-time pose estimation using AI models

    Backend processing with FastAPI + WebRTC

    Frontend built with React Native + Expo

    Easy connection to server with STUN/TURN ICE configuration

🛠️ Requirements
Local Development
Tool	Version Recommended
Node.js	>= 18.x
Yarn	>= 1.x
Expo CLI	>= 7.x
Android Phone	Expo Go App (latest)
Git	Any recent version
🚀 Getting Started
1. Clone the Repository

git clone https://github.com/jmmarcuis/powersyncmobile.git
cd powersyncmobile

2. Install Dependencies

yarn install
# OR if yarn doesn't work:
npm install

3. Install Expo CLI (if not installed)

npm install -g expo-cli

4. Run the App on Android

Make sure your Android phone and development machine are on the same WiFi network.

expo start

    This will open a QR code in your terminal or browser.

    Open the Expo Go app on your Android phone.

    Scan the QR code.

    The app will launch on your phone.

🌐 Connect to FastAPI Backend

This app is designed to stream video to a WebRTC-compatible FastAPI server for pose estimation.

Update your WebSocket signaling server URL and ICE servers in the config:

const configuration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'turn:your.turn.server:3478', username: 'user', credential: 'pass' },
  ],
};

const SIGNALING_SERVER_URL = 'http://<YOUR_BACKEND_IP>:8000';

Replace <YOUR_BACKEND_IP> with the LAN IP of your FastAPI backend server.
⚙️ FastAPI Backend Setup (Pose Estimation)

This app is meant to connect to a separate backend using WebRTC + AI.

You can clone the backend repository and set it up like this:

git clone https://github.com/jmmarcuis/powersync-backend.git
cd powersync-backend

# Create conda env (optional)
conda create -n powersync python=3.10
conda activate powersync

# Install dependencies
pip install -r requirements.txt

# Run server
uvicorn app.main:app --host 0.0.0.0 --port 8000

Backend handles:

    WebRTC signaling via socket.io

    Frame capture and decoding via aiortc

    Pose estimation using MoveNet via TensorFlow

    Processed frame queue + optional return video stream

📂 Project Structure

powersyncmobile/
├── App.js
├── components/
├── screens/
├── utils/
├── assets/
├── constants/
└── package.json

🧪 Troubleshooting

    App stuck reconnecting: Make sure backend is accessible and CORS is configured.

    Blank remote stream: Verify STUN/TURN servers work or are regionally close.

    Camera permissions issue: Ensure Expo Go has camera & mic access.

    QR not scanning: Use LAN IP or tunnel via npx expo start --tunnel.

📋 To-Do / Coming Soon

    Auto rep-count detection

    History & analytics dashboard

    Offline feedback mode

    Enhanced feedback using joint velocity and symmetry