// src/utils/imageCompression.ts
import imageCompression from 'browser-image-compression';
import { COMPRESSED_IMAGE_SIZE_MB, MAX_IMAGE_DIMENSION } from './constants';

/**
 * Compress an image file to < 1MB for Firebase Storage upload
 * Converts HEIC to JPEG automatically
 * 
 * @param file - Original image file (max 10MB, jpg/png/heic)
 * @returns Compressed image file (< 1MB)
 */
export async function compressImage(file: File): Promise<File> {
  const options = {
    maxSizeMB: COMPRESSED_IMAGE_SIZE_MB,     // Target < 1MB
    maxWidthOrHeight: MAX_IMAGE_DIMENSION,   // Max 1920px
    useWebWorker: true,                      // Better performance
    fileType: 'image/jpeg',                  // Convert HEIC/PNG to JPEG
    initialQuality: 0.8,                     // Good quality/size balance
  };

  try {
    console.log(`Original file size: ${(file.size / 1024 / 1024).toFixed(2)}MB`);
    
    const compressedFile = await imageCompression(file, options);
    
    console.log(`Compressed file size: ${(compressedFile.size / 1024 / 1024).toFixed(2)}MB`);
    
    return compressedFile;
  } catch (error) {
    console.error('Image compression failed:', error);
    throw new Error('Failed to compress image. Please try a different image.');
  }
}

/**
 * Validate image file before upload
 * 
 * @param file - File to validate
 * @returns true if valid, throws error if invalid
 */
export function validateImageFile(file: File): boolean {
  const maxSizeBytes = 10 * 1024 * 1024; // 10MB
  const allowedTypes = ['image/jpeg', 'image/png', 'image/heic', 'image/heif'];

  // Check file size
  if (file.size > maxSizeBytes) {
    throw new Error('Image must be less than 10MB');
  }

  // Check file type
  if (!allowedTypes.includes(file.type.toLowerCase())) {
    throw new Error('Only JPG, PNG, and HEIC images are allowed');
  }

  return true;
}
