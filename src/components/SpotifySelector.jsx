import React, { useState, useRef, useEffect } from 'react';
import { Music, Search, X, Play, Pause } from 'lucide-react';
import { searchTracks } from '../services/spotify';
import './SpotifySelector.css';

const SpotifySelector = ({ selectedSong, onSongSelect, onSongRemove }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentPreview, setCurrentPreview] = useState(null);
    const audioRef = useRef(null);

    useEffect(() => {
        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current = null;
            }
        };
    }, []);

    const handleSearch = async () => {
        if (!searchQuery.trim()) return;
        setIsSearching(true);
        const results = await searchTracks(searchQuery);
        setSearchResults(results);
        setIsSearching(false);
    };

    const handleSongSelect = (song) => {
        onSongSelect(song);
        setSearchResults([]);
        setSearchQuery('');
        stopPreview();
    };

    const playPreview = (previewUrl, songId) => {
        if (!previewUrl) {
            alert('Preview not available for this song');
            return;
        }

        if (currentPreview === songId && isPlaying) {
            // Pause current
            audioRef.current?.pause();
            setIsPlaying(false);
            setCurrentPreview(null);
        } else {
            // Stop any current audio
            if (audioRef.current) {
                audioRef.current.pause();
            }

            // Play new audio
            audioRef.current = new Audio(previewUrl);
            audioRef.current.loop = true;
            audioRef.current.play();
            setIsPlaying(true);
            setCurrentPreview(songId);

            audioRef.current.onended = () => {
                setIsPlaying(false);
                setCurrentPreview(null);
            };
        }
    };

    const stopPreview = () => {
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current = null;
        }
        setIsPlaying(false);
        setCurrentPreview(null);
    };

    return (
        <div className="spotify-selector">
            {!selectedSong ? (
                <>
                    <div className="spotify-search-box">
                        <input
                            type="text"
                            className="glass-form-input"
                            placeholder="Search for a song..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleSearch())}
                        />
                        <button
                            type="button"
                            onClick={handleSearch}
                            disabled={isSearching}
                            className="spotify-search-btn"
                        >
                            <Search size={18} />
                            {isSearching ? 'Searching...' : 'Search'}
                        </button>
                    </div>

                    {searchResults.length > 0 && (
                        <div className="spotify-results">
                            {searchResults.map((song) => (
                                <div key={song.id} className="spotify-result-item">
                                    <img src={song.albumArt} alt={song.name} className="spotify-album-art" />
                                    <div className="spotify-song-info">
                                        <p className="spotify-song-name">{song.name}</p>
                                        <p className="spotify-artist-name">{song.artist}</p>
                                    </div>
                                    <div className="spotify-actions">
                                        {song.previewUrl && (
                                            <button
                                                type="button"
                                                onClick={() => playPreview(song.previewUrl, song.id)}
                                                className="spotify-preview-btn"
                                                title="Preview"
                                            >
                                                {currentPreview === song.id && isPlaying ? (
                                                    <Pause size={16} />
                                                ) : (
                                                    <Play size={16} />
                                                )}
                                            </button>
                                        )}
                                        <button
                                            type="button"
                                            onClick={() => handleSongSelect(song)}
                                            className="spotify-select-btn"
                                        >
                                            Select
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </>
            ) : (
                <div className="spotify-selected">
                    <Music size={20} />
                    <div className="spotify-selected-info">
                        <p className="spotify-selected-name">{selectedSong.name}</p>
                        <p className="spotify-selected-artist">{selectedSong.artist}</p>
                    </div>
                    {selectedSong.previewUrl && (
                        <button
                            type="button"
                            onClick={() => playPreview(selectedSong.previewUrl, selectedSong.id)}
                            className="spotify-preview-btn"
                            title="Preview"
                        >
                            {currentPreview === selectedSong.id && isPlaying ? (
                                <Pause size={16} />
                            ) : (
                                <Play size={16} />
                            )}
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={() => {
                            onSongRemove();
                            stopPreview();
                        }}
                        className="spotify-remove-btn"
                        title="Remove"
                    >
                        <X size={16} />
                    </button>
                </div>
            )}
        </div>
    );
};

export default SpotifySelector;
