import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

/**
 * Sanitize a slug to be URL-safe
 * - Lowercase
 * - Replace spaces with hyphens
 * - Remove special characters except hyphens
 * - Remove consecutive hyphens
 */
export const sanitizeSlug = (input) => {
    return input
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
};

/**
 * Validate slug format
 * - 3-50 characters
 * - Only lowercase letters, numbers, and hyphens
 * - Cannot start or end with hyphen
 */
export const validateSlug = (slug) => {
    if (!slug || slug.length < 3) {
        return { valid: false, error: 'Slug must be at least 3 characters' };
    }
    if (slug.length > 50) {
        return { valid: false, error: 'Slug must be 50 characters or less' };
    }
    if (!/^[a-z0-9-]+$/.test(slug)) {
        return { valid: false, error: 'Slug can only contain lowercase letters, numbers, and hyphens' };
    }
    if (slug.startsWith('-') || slug.endsWith('-')) {
        return { valid: false, error: 'Slug cannot start or end with a hyphen' };
    }
    return { valid: true };
};

/**
 * Check if a slug is available (not already taken)
 */
export const checkSlugAvailability = async (slug) => {
    try {
        const slugsRef = collection(db, 'slugs');
        const q = query(slugsRef, where('slug', '==', slug));
        const snapshot = await getDocs(q);
        return snapshot.empty;
    } catch (error) {
        console.error('Error checking slug availability:', error);
        throw error;
    }
};
