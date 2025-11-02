// src/services/storage.ts
import { storage } from './firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { compressImage, validateImageFile } from '../utils/imageCompression';

/**
 * Upload and compress profile image to Firebase Storage
 * 
 * @param file - Image file to upload (max 10MB)
 * @param userId - User's Firebase Auth UID
 * @returns Download URL for the uploaded image
 */
export async function uploadProfileImage(file: File, userId: string): Promise<string> {
  try {
    // 1. Validate file
    validateImageFile(file);
    
    // 2. Compress image
    console.log('Compressing image...');
    const compressedFile = await compressImage(file);
    
    // 3. Create storage reference
    const timestamp = Date.now();
    const filename = `profile_${timestamp}.jpg`; // Always save as JPEG after compression
    const storageRef = ref(storage, `profile_images/${userId}/${filename}`);
    
    // 4. Upload to Firebase Storage
    console.log('Uploading to Firebase Storage...');
    const snapshot = await uploadBytes(storageRef, compressedFile);
    
    // 5. Get download URL
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    console.log('Upload successful:', downloadURL);
    return downloadURL;
  } catch (error) {
    console.error('Error uploading profile image:', error);
    throw error;
  }
}

/**
 * Get download URL for an existing image
 * 
 * @param path - Full storage path (e.g., profile_images/userId/filename.jpg)
 * @returns Download URL
 */
export async function getImageUrl(path: string): Promise<string> {
  try {
    const storageRef = ref(storage, path);
    const url = await getDownloadURL(storageRef);
    return url;
  } catch (error) {
    console.error('Error getting image URL:', error);
    throw error;
  }
}
