# 🏋️ PowerSync

**PowerSync** is a mobile app designed for powerlifters to track and analyze their form through real-time pose estimation. It streams video to a FastAPI backend for AI-based feedback using models like MoveNet. Built with **React Native (Expo)** and native modules, the app must be built and sideloaded—it is **not compatible with Expo Go**.

---

## 📱 Features

* Live video streaming from your phone camera
* Real-time pose estimation using AI models
* Backend processing with FastAPI + WebRTC
* Frontend built with React Native + Expo (with native modules)
* Easy connection to server with STUN/TURN ICE configuration

---

## 🛠️ Requirements

### Local Development

| Tool          | Version Recommended                    |
| ------------- | -------------------------------------- |
| Node.js       | `>= 18.x`                              |
| Yarn          | `>= 1.x`                               |
| Expo CLI      | `>= 7.x`                               |
| EAS CLI       | `>= 3.x`                               |
| Android Phone | APK installer or USB Debugging enabled |
| Git           | Any recent version                     |

---

## 🚀 Getting Started

### 1. Clone the Repository

```sh
git clone https://github.com/jmmarcuis/powersyncmobile.git
cd powersyncmobile
```

---

### 2. Install Dependencies

```sh
yarn install
# OR if yarn doesn't work:
npm install
```

---

### 3. Install Expo & EAS CLI (if not installed)

```sh
npm install -g expo-cli eas-cli
```

---

### 4. Configure EAS Build

Make sure your `eas.json` is properly configured. Here's a sample:

```json
{
  "build": {
    "production": {
      "android": {
        "buildType": "apk"
      }
    }
  }
}
```

---

### 5. Build and Sideload the APK

Build the project using EAS:

```sh
eas build -p android --profile production
```

After the build completes, download the APK from the Expo dashboard.

Then sideload it to your Android phone:

```sh
adb install app-release.apk
```

> ⚠️ Ensure that **USB debugging is enabled** on your Android device and **apps from unknown sources** are allowed.

---

## 🌐 Connect to FastAPI Backend

This app is designed to stream video to a WebRTC-compatible **FastAPI** server for pose estimation.

Update your WebSocket signaling server URL and ICE servers in the config:

```ts
const configuration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'turn:your.turn.server:3478', username: 'user', credential: 'pass' },
  ],
};

const SIGNALING_SERVER_URL = 'http://<YOUR_BACKEND_IP>:8000';
```

Replace `<YOUR_BACKEND_IP>` with the LAN IP of your FastAPI backend server.

---

## ⚙️ FastAPI Backend Setup (Pose Estimation)

This app is meant to connect to a separate backend using WebRTC + AI.

You can clone the backend repository and set it up like this:

```sh
git clone https://github.com/jmmarcuis/powersync-backend.git
cd powersync-backend

# Create conda env (optional)
conda create -n powersync python=3.10
conda activate powersync

# Install dependencies
pip install -r requirements.txt

# Run server
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

Backend handles:

* WebRTC signaling via socket.io
* Frame capture and decoding via aiortc
* Pose estimation using MoveNet via TensorFlow
* Processed frame queue + optional return video stream

---

## 📂 Project Structure

```
powersyncmobile/
├── App.js
├── components/
├── screens/
├── utils/
├── assets/
├── constants/
└── package.json
```

---

## 🧪 Troubleshooting

* **App stuck reconnecting**: Make sure backend is accessible and CORS is configured.
* **Blank remote stream**: Verify STUN/TURN servers work or are regionally close.
* **Camera/mic permissions**: Ensure Android permissions are granted after installation.
* **APK fails to install**: Ensure the device allows apps from unknown sources and USB debugging is enabled.
* **Build fails**: Make sure your app doesn't contain Expo Go-only libraries. Use `expo doctor` to validate.

---
