import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { v2 as cloudinary } from 'cloudinary';
import { env } from '../config/env.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const chatUploadsDir = path.resolve(__dirname, '../../uploads/chat');

if (!fs.existsSync(chatUploadsDir)) {
  fs.mkdirSync(chatUploadsDir, { recursive: true });
}

const isCloudinaryConfigured = Boolean(
  env.cloudinaryCloudName &&
  env.cloudinaryApiKey &&
  env.cloudinaryApiSecret
);

const storage = multer.memoryStorage();

const allowedMimeTypes = [
  // Images
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
  // Documents
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/zip',
  'application/x-zip-compressed',
  'text/csv',
];

const fileFilter = (_req, file, cb) => {
  const mime = file.mimetype.toLowerCase();
  if (allowedMimeTypes.includes(mime)) {
    cb(null, true);
  } else {
    const error = new Error(
      `File format "${file.mimetype}" is not supported. Please upload an image, PDF, or document.`
    );
    error.statusCode = 400;
    cb(error, false);
  }
};

export const chatUpload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 15 * 1024 * 1024, // 15 MB max per file
    files: 5, // max 5 files per message
  },
});

export const processChatAttachment = async (file) => {
  const isImage = file.mimetype.startsWith('image/');
  const fileType = isImage ? 'image' : 'document';
  const originalName = file.originalname || 'attachment';
  const fileSize = file.size || (file.buffer ? file.buffer.length : 0);
  const mimeType = file.mimetype;

  // If image and Cloudinary is configured, upload to Cloudinary
  if (isImage && isCloudinaryConfigured) {
    try {
      const uploadResult = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: 'pg_finder_chat',
            resource_type: 'image',
            transformation: [
              { width: 1600, height: 1600, crop: 'limit', quality: 'auto', fetch_format: 'auto' },
            ],
          },
          (error, result) => {
            if (error) return reject(error);
            resolve(result);
          }
        );
        uploadStream.end(file.buffer);
      });

      return {
        url: uploadResult.secure_url,
        fileType,
        originalName,
        fileSize,
        mimeType,
      };
    } catch (err) {
      console.warn('Cloudinary chat upload fallback to disk:', err.message);
    }
  }

  // Local storage in uploads/chat directory
  const ext = path.extname(originalName) || (isImage ? '.jpg' : '.dat');
  const safeBaseName = path.basename(originalName, ext).replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 40);
  const uniqueName = `chat_${Date.now()}_${safeBaseName}${ext}`;
  const targetPath = path.join(chatUploadsDir, uniqueName);

  await fs.promises.writeFile(targetPath, file.buffer);

  const baseUrl = process.env.SERVER_URL || `http://localhost:${env.port}`;
  const fileUrl = `${baseUrl}/uploads/chat/${uniqueName}`;

  return {
    url: fileUrl,
    fileType,
    originalName,
    fileSize,
    mimeType,
  };
};
