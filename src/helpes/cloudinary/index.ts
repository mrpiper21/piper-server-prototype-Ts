// Require the cloudinary library
import { v2 as cloudinary } from 'cloudinary'

const cloudName = process.env.CLOUDINARY_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

if (!cloudName || !apiKey || !apiSecret) {
  throw new Error('Missing Cloudinary environment variables');
}

// Return "https" URLs by setting secure: true
cloudinary.config({
  secure: true,
  cloud_name: cloudName,
  api_key: apiKey,
  api_secret: apiSecret,
});

// Log the configuration
console.log(cloudinary.config(), 'Cloudinary configuration set');