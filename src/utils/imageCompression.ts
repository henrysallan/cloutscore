import { compressAccurately } from 'compress.js';

export const compressImage = async (file: File): Promise<File | null> => {
    try {
        const imageCompressor = new compressAccurately();
        const compressedFiles = await imageCompressor.compress([file], {
            size: 4, // Maximum size in MB
            quality: 0.7, // Quality of the image
            maxWidth: 1920, // Maximum width
            maxHeight: 1920, // Maximum height
            resize: true, // Resize the image
        });

        if (compressedFiles.length > 0) {
            const compressedFile = compressedFiles[0];
            const blob = await fetch(compressedFile.base64).then(res => res.blob());
            return new File([blob], file.name, { type: file.type });
        }

        return null;
    } catch (error) {
        console.error('Image compression failed:', error);
        return null;
    }
};