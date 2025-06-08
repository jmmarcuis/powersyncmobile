// server.js
// This server runs on your laptop to receive video uploads from the Expo Go app.

const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const os = require('os');

const app = express();
const port = 3000;

// --- Middleware ---
// Enable Cross-Origin Resource Sharing (CORS) to allow your app to connect.
app.use(cors());
// Middleware to parse URL-encoded bodies (as sent by HTML forms)
app.use(express.urlencoded({ extended: true }));
// Middleware to parse json bodies
app.use(express.json());


// --- File Storage Configuration (Multer) ---
const storage = multer.diskStorage({
  /**
   * Specifies the destination directory for uploaded files.
   * @param req - The Express request object.
   * @param file - The uploaded file object.
   * @param cb - The callback to complete the destination setup.
   */
  destination: function (req, file, cb) {
    // Get the exercise and form type from the request body.
    const { exercise, form } = req.body;
    if (!exercise || !form) {
      console.error('Validation Error: Exercise and form type are required.');
      return cb(new Error("Exercise and form type are required in the request body."), false);
    }

    // Construct the target directory path (e.g., /path/to/project/dataset/squat/correct).
    const dir = path.join(__dirname, 'dataset', exercise, form);

    // Create the directory recursively if it does not exist.
    fs.mkdir(dir, { recursive: true }, (err) => {
      if (err) {
        console.error("Failed to create directory:", err);
        return cb(err, null);
      }
      cb(null, dir);
    });
  },
  /**
   * Specifies the filename for the uploaded file.
   * @param req - The Express request object.
   * @param file - The uploaded file object.
   * @param cb - The callback to complete the filename setup.
   */
  filename: function (req, file, cb) {
    // Use the original filename sent from the client app.
    cb(null, file.originalname);
  }
});

const upload = multer({ 
    storage: storage,
    fileFilter: function (req, file, cb) {
        if (!file.originalname.match(/\.(mp4|mov)$/)) {
            return cb(new Error('Only .mp4 and .mov video files are allowed!'), false);
        }
        cb(null, true);
    }
});


// --- API Routes ---
/**
 * POST /upload
 * Handles the video file upload. It expects a 'multipart/form-data' request
 * with a 'video' field containing the file, and 'exercise' and 'form' fields in the body.
 */
app.post('/upload', upload.single('video'), (req, res) => {
  if (!req.file) {
    return res.status(400).send('No file uploaded or file was rejected.');
  }
  
  const relativePath = path.relative(__dirname, req.file.path);
  console.log(`✅ File received and saved to: ${relativePath}`);
  res.status(200).send({ message: 'File uploaded successfully', path: relativePath });
});


// --- Server Startup ---
app.listen(port, () => {
  const networkInterfaces = os.networkInterfaces();
  let ipAddress = 'localhost';
  // Find the local IP address of your machine
  for (const interfaceName in networkInterfaces) {
      const interfaces = networkInterfaces[interfaceName];
      for (const iface of interfaces) {
          if (iface.family === 'IPv4' && !iface.internal) {
              ipAddress = iface.address;
              break;
          }
      }
  }

  console.log('----------------------------------------------------');
  console.log('🚀 Server is running and ready for uploads!');
  console.log(`   - Network: http://${ipAddress}:${port}`);
  console.log(`   - Local:   http://localhost:${port}`);
  console.log('----------------------------------------------------');
  console.log('Will save videos to the "dataset" directory in your project.');
  console.log('Waiting for video uploads from your app...');
});
