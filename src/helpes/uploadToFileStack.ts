import axios from "axios";
import fs from "fs";
import FormData from "form-data";

const uploadToFileStack = async (filePath: string, originalName: string, mimeType: string): Promise<any> => {
  try {
    const fileStackApiKey = process.env.FILE_STACK_API_KEY;
    
    if (!fileStackApiKey) {
      throw new Error('FILE_STACK_API_KEY is not defined in environment variables');
    }

    // Create FormData and append the file
    const formData = new FormData();
    const fileStream = fs.createReadStream(filePath);
    formData.append('fileUpload', fileStream, {
      filename: originalName,
      contentType: mimeType,
    });

    const uploadUrl = `https://www.filestackapi.com/api/store/S3?key=${fileStackApiKey}`;
    const response = await axios.post(uploadUrl, formData, {
      headers: {
        ...formData.getHeaders(),
      },
    });
    
    // Check if response contains error message
    if (typeof response.data === 'string') {
      throw new Error(response.data);
    }
    
    if (!response.data.url) {
      throw new Error('Invalid response from FileStack: missing URL');
    }
    
    return response.data;
  } catch (error) {
    console.error('Error uploading to FileStack:', error);
    throw new Error(`Failed to upload file to FileStack: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

export default uploadToFileStack;