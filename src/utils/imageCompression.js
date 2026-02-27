/**
 * Image Compression Utility
 * Compresses images to reduce file size while maintaining reasonable quality
 * Target: 1MB image -> ~100KB (90% compression ratio)
 */

export const compressImage = async (file, options = {}) => {
    const {
        maxWidth = 1920,
        maxHeight = 1080,
        quality = 0.3,
        outputFormat = 'image/jpeg'
    } = options;

    return new Promise((resolve, reject) => {
        if (!file || !file.type.startsWith('image/')) {
            reject(new Error('Invalid file type. Please select an image.'));
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');

                // Calculate new dimensions
                let { width, height } = img;
                
                if (width > maxWidth || height > maxHeight) {
                    const aspectRatio = width / height;
                    
                    if (width > height) {
                        width = maxWidth;
                        height = width / aspectRatio;
                    } else {
                        height = maxHeight;
                        width = height * aspectRatio;
                    }
                }

                canvas.width = width;
                canvas.height = height;

                // Draw and compress image
                ctx.drawImage(img, 0, 0, width, height);
                
                canvas.toBlob((blob) => {
                    if (!blob) {
                        reject(new Error('Failed to compress image.'));
                        return;
                    }

                    // Create new File object with compressed data
                    const compressedFile = new File([blob], file.name, {
                        type: outputFormat,
                        lastModified: Date.now()
                    });

                    resolve(compressedFile);
                }, outputFormat, quality);
            };
            
            img.onerror = () => reject(new Error('Failed to load image.'));
            img.src = e.target.result;
        };
        
        reader.onerror = () => reject(new Error('Failed to read file.'));
        reader.readAsDataURL(file);
    });
};

/**
 * Progressive compression - tries multiple quality levels to achieve target size
 */
export const compressImageToTargetSize = async (file, targetSizeKB = 100) => {
    const targetSizeBytes = targetSizeKB * 1024;
    const qualities = [0.8, 0.6, 0.4, 0.3, 0.2, 0.1];
    
    for (const quality of qualities) {
        try {
            const compressed = await compressImage(file, { quality });
            
            if (compressed.size <= targetSizeBytes || quality === qualities[qualities.length - 1]) {
                return compressed;
            }
        } catch (error) {
            console.error(`Compression failed at quality ${quality}:`, error);
        }
    }
    
    throw new Error('Unable to compress image to target size.');
};

/**
 * Get file size in human readable format
 */
export const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Validate image file
 */
export const validateImageFile = (file, maxSizeMB = 10) => {
    if (!file) {
        return { valid: false, error: 'No file selected.' };
    }
    
    if (!file.type.startsWith('image/')) {
        return { valid: false, error: 'Please select an image file.' };
    }
    
    if (file.size > maxSizeMB * 1024 * 1024) {
        return { valid: false, error: `Image size should be less than ${maxSizeMB}MB.` };
    }
    
    return { valid: true };
};

/**
 * Create preview URL for image
 */
export const createImagePreview = (file) => {
    return URL.createObjectURL(file);
};

/**
 * Revoke preview URL to prevent memory leaks
 */
export const revokeImagePreview = (url) => {
    if (url && url.startsWith('blob:')) {
        URL.revokeObjectURL(url);
    }
};
