import { uploadImageBuffer } from '../config/cloudinary.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';

export const uploadImages = async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      return sendError(res, 400, 'Please select at least one image to upload');
    }

    const uploadPromises = req.files.map((file) =>
      uploadImageBuffer(file.buffer, file.originalname)
    );

    const uploadedImages = await Promise.all(uploadPromises);

    return sendSuccess(res, 201, 'Images uploaded successfully', { images: uploadedImages });
  } catch (error) {
    next(error);
  }
};
