import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { resolveCardImageUrl, resolveCardSong } from './cardMedia';

export const normalizeCardData = (rawData) => {
    if (!rawData || typeof rawData !== 'object') return rawData;

    const song = resolveCardSong(rawData);
    const imageUrl = resolveCardImageUrl(rawData);

    return {
        ...rawData,
        song: song || rawData.song || null,
        spotify: rawData.spotify || song?.externalUrl || null,
        songUrl: rawData.songUrl || song?.externalUrl || null,
        imageUrl: imageUrl || rawData.imageUrl || null,
    };
};

/**
 * Resolves a card ID or slug to the actual card data.
 * 
 * @param {string} idOrSlug - The ID or slug from the URL parameters.
 * @param {string} collectionName - The Firestore collection name for the card (e.g., 'wishes', 'valentines').
 * @param {string} cardType - The card type stored in the slugs collection (e.g., 'birthday', 'valentine').
 * @returns {Promise<{id: string, data: any} | null>} - The resolved card ID and data, or null if not found.
 */
export const resolveCardId = async (idOrSlug, collectionName, cardType) => {
    try {
        // 1. Try to fetch directly from the collection (assuming it's an ID)
        const directDocRef = doc(db, collectionName, idOrSlug);
        const directSnapshot = await getDoc(directDocRef);

        if (directSnapshot.exists()) {
            return { id: idOrSlug, data: normalizeCardData(directSnapshot.data()) };
        }

        // 2. If not found, check if it's a slug in the 'slugs' collection
        const slugDocRef = doc(db, 'slugs', idOrSlug);
        const slugSnapshot = await getDoc(slugDocRef);

        if (slugSnapshot.exists()) {
            const slugData = slugSnapshot.data();

            // Verify the card type matches
            if (!cardType || slugData.cardType === cardType) {
                const realDocRef = doc(db, collectionName, slugData.cardId);
                const realSnapshot = await getDoc(realDocRef);

                if (realSnapshot.exists()) {
                    return { id: slugData.cardId, data: normalizeCardData(realSnapshot.data()) };
                }
            }
        }

        return null;
    } catch (error) {
        console.error("Error resolving card ID:", error);
        return null;
    }
};
