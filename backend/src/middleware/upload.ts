/**
 * File Upload Middleware
 *
 * Handles multipart/form-data file uploads using Multer.
 * Configured for reference images for Gemini API.
 *
 * Security Features:
 * - File type validation (only JPEG, PNG, WebP)
 * - File size limits (10MB per file)
 * - Maximum number of files (14 files - Gemini API limit)
 * - Memory storage (files stored in memory, not disk)
 */

import multer, { FileFilterCallback, MulterError } from 'multer';
import { Request, Response, NextFunction } from 'express';
import path from 'path';

// Configuration
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB in bytes
const MAX_FILES = 14; // Gemini API supports up to 14 reference images (6 objects + 5 humans)

// Allowed MIME types
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp'
];

// Allowed file extensions
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];

// Type definitions
interface MulterFile extends Express.Multer.File {}

interface UploadError extends Error {
  code?: string;
}

interface FileValidationResult {
  valid: boolean;
  errors: string[];
  fileCount?: number;
}

interface Base64File {
  data: string;
  mimeType: string;
  size: number;
  originalName: string;
}

/**
 * Configure multer storage
 * Using memory storage to avoid writing files to disk
 * Files will be available as Buffer in req.files[].buffer
 */
const storage = multer.memoryStorage();

/**
 * File filter function
 * Validates file type and extension
 *
 * @param req - Express request object
 * @param file - Multer file object
 * @param cb - Callback function
 */
function fileFilter(req: Request, file: MulterFile, cb: FileFilterCallback): void {
  // Check MIME type
  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    const error: UploadError = new Error(
      `Invalid file type. Only ${ALLOWED_MIME_TYPES.join(', ')} are allowed.`
    );
    error.code = 'INVALID_FILE_TYPE';
    return cb(error as any, false);
  }

  // Check file extension
  const ext = path.extname(file.originalname).toLowerCase();
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    const error: UploadError = new Error(
      `Invalid file extension. Only ${ALLOWED_EXTENSIONS.join(', ')} are allowed.`
    );
    error.code = 'INVALID_FILE_EXTENSION';
    return cb(error as any, false);
  }

  // File is valid
  cb(null, true);
}

/**
 * Create multer upload instance
 * Configured for reference images
 */
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: MAX_FILES
  }
});

/**
 * Middleware to handle file upload errors
 * Provides user-friendly error messages
 *
 * @param err - The error object
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function
 */
function handleUploadError(err: any, req: Request, res: Response, next: NextFunction): void {
  if (err instanceof MulterError) {
    // Multer-specific errors
    if (err.code === 'LIMIT_FILE_SIZE') {
      res.status(400).json({
        error: 'File too large',
        message: `Maximum file size is ${MAX_FILE_SIZE / 1024 / 1024}MB`,
        code: 'FILE_TOO_LARGE'
      });
      return;
    }

    if (err.code === 'LIMIT_FILE_COUNT') {
      res.status(400).json({
        error: 'Too many files',
        message: `Maximum ${MAX_FILES} files allowed`,
        code: 'TOO_MANY_FILES'
      });
      return;
    }

    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      res.status(400).json({
        error: 'Unexpected file field',
        message: 'Unexpected file field in request',
        code: 'UNEXPECTED_FILE_FIELD'
      });
      return;
    }

    // Other multer errors
    res.status(400).json({
      error: 'File upload error',
      message: err.message,
      code: 'UPLOAD_ERROR'
    });
    return;
  }

  // Custom file filter errors
  if ((err as UploadError).code === 'INVALID_FILE_TYPE' || (err as UploadError).code === 'INVALID_FILE_EXTENSION') {
    res.status(400).json({
      error: 'Invalid file',
      message: err.message,
      code: (err as UploadError).code
    });
    return;
  }

  // Other errors
  next(err);
}

/**
 * Validate uploaded files
 * Additional validation beyond multer's built-in checks
 *
 * @param files - Array of uploaded files
 * @returns Validation result { valid: boolean, errors: string[] }
 */
function validateUploadedFiles(files: Express.Multer.File[] | undefined): FileValidationResult {
  const errors: string[] = [];

  if (!files || !Array.isArray(files)) {
    return { valid: true, errors: [] }; // No files is valid (optional upload)
  }

  if (files.length > MAX_FILES) {
    errors.push(`Too many files. Maximum ${MAX_FILES} files allowed.`);
  }

  files.forEach((file, index) => {
    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      errors.push(`File ${index + 1} exceeds maximum size of ${MAX_FILE_SIZE / 1024 / 1024}MB`);
    }

    // Check buffer exists
    if (!file.buffer) {
      errors.push(`File ${index + 1} has no data`);
    }

    // Check MIME type
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      errors.push(`File ${index + 1} has invalid type: ${file.mimetype}`);
    }
  });

  return {
    valid: errors.length === 0,
    errors,
    fileCount: files.length
  };
}

/**
 * Convert uploaded file buffer to base64
 * Used for sending images to Gemini API
 *
 * @param file - Multer file object
 * @returns Object with base64 data and mime type
 */
function fileToBase64(file: Express.Multer.File): Base64File {
  if (!file || !file.buffer) {
    throw new Error('Invalid file object');
  }

  return {
    data: file.buffer.toString('base64'),
    mimeType: file.mimetype,
    size: file.size,
    originalName: file.originalname
  };
}

/**
 * Convert all uploaded files to base64
 *
 * @param files - Array of multer file objects
 * @returns Array of base64 encoded files
 */
function filesToBase64(files: Express.Multer.File[] | undefined): Base64File[] {
  if (!files || !Array.isArray(files)) {
    return [];
  }

  return files.map(fileToBase64);
}

export {
  upload,
  handleUploadError,
  validateUploadedFiles,
  fileToBase64,
  filesToBase64,
  MAX_FILE_SIZE,
  MAX_FILES,
  ALLOWED_MIME_TYPES
};
