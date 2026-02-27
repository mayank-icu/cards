/**
 * Audio Upload Utility
 * Handles audio file validation, compression, and upload
 */

export const validateAudioFile = (file, maxSizeMB = 10) => {
    if (!file) {
        return { valid: false, error: 'No file selected.' };
    }
    
    if (!file.type.startsWith('audio/')) {
        return { valid: false, error: 'Please select an audio file.' };
    }
    
    const validTypes = [
        'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 
        'audio/m4a', 'audio/aac', 'audio/flac'
    ];
    
    if (!validTypes.includes(file.type)) {
        return { valid: false, error: 'Please select a valid audio file (MP3, WAV, M4A, AAC, FLAC).' };
    }
    
    if (file.size > maxSizeMB * 1024 * 1024) {
        return { valid: false, error: `Audio size should be less than ${maxSizeMB}MB.` };
    }
    
    return { valid: true };
};

export const compressAudio = async (file, options = {}) => {
    const {
        targetBitrate = 128000, // 128 kbps
        outputFormat = 'audio/mp3'
    } = options;

    return new Promise((resolve, reject) => {
        // For now, we'll return the original file
        // In a real implementation, you might use Web Audio API or FFmpeg.wasm
        // for actual audio compression
        
        if (file.size > 5 * 1024 * 1024) { // If larger than 5MB
            // For demonstration, we'll create a smaller file
            // In production, you'd use actual audio compression
            console.warn('Audio compression not implemented. Using original file.');
        }
        
        resolve(file);
    });
};

export const createAudioPreview = (file) => {
    return URL.createObjectURL(file);
};

export const revokeAudioPreview = (url) => {
    if (url && url.startsWith('blob:')) {
        URL.revokeObjectURL(url);
    }
};

export const formatAudioDuration = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

export const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const getAudioMetadata = (file) => {
    return new Promise((resolve) => {
        const audio = new Audio();
        audio.addEventListener('loadedmetadata', () => {
            resolve({
                duration: audio.duration,
                formattedDuration: formatAudioDuration(audio.duration)
            });
        });
        audio.addEventListener('error', () => {
            resolve({
                duration: 0,
                formattedDuration: '0:00'
            });
        });
        audio.src = URL.createObjectURL(file);
    });
};
