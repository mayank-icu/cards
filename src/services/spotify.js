import axios from 'axios';

export const searchTracks = async (query) => {
    if (!query) return [];

    try {
        const response = await axios.get('https://itunes.apple.com/search', {
            params: {
                term: query,
                media: 'music',
                entity: 'song',
                limit: 20,
            },
        });

        return response.data.results.map((track) => ({
            id: track.trackId.toString(),
            name: track.trackName,
            artist: track.artistName,
            albumArt: track.artworkUrl100.replace('100x100', '300x300'), // Get higher res image
            previewUrl: track.previewUrl,
            externalUrl: track.trackViewUrl,
        }));
    } catch (error) {
        console.error('Error searching iTunes tracks:', error);
        return [];
    }
};
