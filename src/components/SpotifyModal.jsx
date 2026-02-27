import React, { useState, useRef, useEffect, useCallback, memo } from 'react';
import { Music, Search, X, Play, Pause } from 'lucide-react';
import { searchTracks } from '../services/spotify';
import './SpotifyModal.css';

const SpotifyModal = ({ isOpen, onClose, onSongSelect, currentSong }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [playingPreview, setPlayingPreview] = useState(null);
    const audioRef = useRef(null);

    const stopAudio = useCallback(() => {
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current = null;
        }
        setPlayingPreview(null);
    }, []);

    useEffect(() => {
        return () => {
            stopAudio();
        };
    }, [stopAudio]);

    useEffect(() => {
        if (!isOpen) {
            stopAudio();
            setSearchQuery('');
            setSearchResults([]);
        }
    }, [isOpen, stopAudio]);

    const handleSearch = useCallback(async () => {
        if (!searchQuery.trim()) return;
        setIsSearching(true);
        try {
            const results = await searchTracks(searchQuery);
            setSearchResults(results);
        } catch (error) {
            console.error('Search error:', error);
            alert('Failed to search songs. Please try again.');
        } finally {
            setIsSearching(false);
        }
    }, [searchQuery]);

    const handlePreview = useCallback((song) => {
        if (!song.previewUrl) {
            alert('Preview not available for this song');
            return;
        }

        if (playingPreview === song.id) {
            stopAudio();
        } else {
            stopAudio();
            audioRef.current = new Audio(song.previewUrl);
            audioRef.current.loop = true;
            audioRef.current.play().catch(err => {
                console.error('Playback error:', err);
                alert('Could not play preview. Please try again.');
            });
            setPlayingPreview(song.id);
            audioRef.current.onended = () => {
                setPlayingPreview(null);
            };
        }
    }, [playingPreview, stopAudio]);

    const handleSelectSong = useCallback((song) => {
        stopAudio();
        onSongSelect(song);
        onClose();
    }, [onSongSelect, onClose, stopAudio]);

    if (!isOpen) return null;

    return (
        <div className="spotify-modal-overlay" onClick={onClose}>
            <div className="spotify-modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="spotify-modal-header">
                    <div className="spotify-modal-title">
                        <Music size={24} />
                        <h2>Select Music</h2>
                    </div>
                    <button className="spotify-modal-close" onClick={onClose}>
                        <X size={24} />
                    </button>
                </div>

                <div className="spotify-modal-body">
                    <div className="spotify-search-container">
                        <input
                            type="text"
                            className="spotify-search-input"
                            placeholder="Search for a song..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    handleSearch();
                                }
                            }}
                            autoFocus
                        />
                        <button
                            className="spotify-search-button"
                            onClick={handleSearch}
                            disabled={isSearching}
                        >
                            <Search size={20} />
                            {isSearching ? 'Searching...' : 'Search'}
                        </button>
                    </div>

                    {searchResults.length > 0 && (
                        <div className="spotify-results-container">
                            {searchResults.map((song) => (
                                <div key={song.id} className="spotify-song-card">
                                    <img
                                        src={song.albumArt}
                                        alt={song.name}
                                        className="spotify-song-album"
                                    />
                                    <div className="spotify-song-details">
                                        <p className="spotify-song-title">{song.name}</p>
                                        <p className="spotify-song-artist">{song.artist}</p>
                                    </div>
                                    <div className="spotify-song-actions">
                                        {song.previewUrl && (
                                            <button
                                                className="spotify-preview-button"
                                                onClick={() => handlePreview(song)}
                                                title={playingPreview === song.id ? 'Pause' : 'Preview'}
                                            >
                                                {playingPreview === song.id ? (
                                                    <Pause size={20} />
                                                ) : (
                                                    <Play size={20} />
                                                )}
                                            </button>
                                        )}
                                        <button
                                            className="spotify-add-button"
                                            onClick={() => handleSelectSong(song)}
                                        >
                                            Select
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {searchResults.length === 0 && searchQuery && !isSearching && (
                        <div className="spotify-no-results">
                            <Music size={48} />
                            <p>No songs found. Try a different search.</p>
                        </div>
                    )}

                    {searchResults.length === 0 && !searchQuery && (
                        <div className="spotify-empty-state">
                            <Music size={64} />
                            <h3>Search for a Song</h3>
                            <p>Find the perfect song to add to your card</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default memo(SpotifyModal);
