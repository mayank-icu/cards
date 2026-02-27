const SPOTIFY_TRACK_PATH = /spotify\.com\/track\/([a-zA-Z0-9]+)/i;
const SPOTIFY_URI_TRACK = /^spotify:track:([a-zA-Z0-9]+)$/i;
const FALLBACK_TRACK_ID = /^[a-zA-Z0-9]{8,30}$/;

export const extractSpotifyTrackId = (value) => {
  if (!value) return null;

  if (typeof value === 'object') {
    const candidate = value.externalUrl || value.url || value.songUrl || value.spotify || value.previewUrl || value.id;
    return extractSpotifyTrackId(candidate);
  }

  if (typeof value !== 'string') return null;
  const input = value.trim();
  if (!input) return null;

  const uriMatch = input.match(SPOTIFY_URI_TRACK);
  if (uriMatch?.[1]) return uriMatch[1];

  const urlMatch = input.match(SPOTIFY_TRACK_PATH);
  if (urlMatch?.[1]) return urlMatch[1];

  return FALLBACK_TRACK_ID.test(input) ? input : null;
};

export const resolveCardSong = (cardData) => {
  if (!cardData || typeof cardData !== 'object') return null;

  if (cardData.song && typeof cardData.song === 'object') return cardData.song;
  if (cardData.selectedSong && typeof cardData.selectedSong === 'object') return cardData.selectedSong;

  const trackId =
    extractSpotifyTrackId(cardData.song) ||
    extractSpotifyTrackId(cardData.spotify) ||
    extractSpotifyTrackId(cardData.songUrl) ||
    extractSpotifyTrackId(cardData.musicUrl);

  if (!trackId) return null;

  return {
    id: trackId,
    externalUrl: `https://open.spotify.com/track/${trackId}`,
    name: cardData.songName || 'Selected Song',
    artist: cardData.songArtist || cardData.artist || 'Unknown Artist',
    albumArt: cardData.songAlbumArt || cardData.albumArt || null,
  };
};

export const resolveCardImageUrl = (cardData) => {
  if (!cardData || typeof cardData !== 'object') return null;
  const candidate =
    cardData.imageUrl ||
    cardData.imageURL ||
    cardData.image ||
    cardData.photoUrl ||
    cardData.photoURL ||
    cardData.photo ||
    cardData.avatar ||
    null;

  return typeof candidate === 'string' && candidate.trim() ? candidate.trim() : null;
};
