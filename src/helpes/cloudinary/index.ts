// Require the cloudinary library
import { v2 as cloudinary } from 'cloudinary'
import dotenv from 'dotenv';
dotenv.config();

const cloudName = process.env.CLOUDINARY_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

// Only configure Cloudinary if all environment variables are present
// This allows the app to start even if Cloudinary is not configured
if (cloudName && apiKey && apiSecret) {
  // Return "https" URLs by setting secure: true
  cloudinary.config({
    secure: true,
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
  });
  
  console.log('Cloudinary configuration initialized successfully');
} else {
  console.warn('Cloudinary environment variables not found. Cloudinary features will be disabled.');
  console.warn('To enable Cloudinary, set CLOUDINARY_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET environment variables');
}

// Export a helper function to check if Cloudinary is configured
export const isCloudinaryConfigured = (): boolean => {
  return !!(cloudName && apiKey && apiSecret);
};

// Export cloudinary instance
export { cloudinary };