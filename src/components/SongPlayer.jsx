import React, { useState, useRef, useEffect, memo } from 'react';
import { Play, Pause, ChevronDown, ChevronUp } from 'lucide-react';
import './SongPlayer.css';

const SongPlayer = ({ song }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const audioRef = useRef(null);

    useEffect(() => {
        if (!song?.previewUrl) return;

        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current = null;
        }

        audioRef.current = new Audio(song.previewUrl);
        audioRef.current.loop = true;
        audioRef.current.onended = () => setIsPlaying(false);

        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current = null;
            }
        };
    }, [song?.previewUrl]);

    const togglePlay = () => {
        if (!audioRef.current) return;

        if (isPlaying) {
            audioRef.current.pause();
        } else {
            audioRef.current.play();
        }
        setIsPlaying(!isPlaying);
    };

    const toggleMinimize = () => {
        setIsMinimized(!isMinimized);
    };

    if (!song || !song.previewUrl) return null;

    return (
        <div className={`song-player ${isMinimized ? 'minimized' : ''}`}>
            {!isMinimized ? (
                <>
                    <div className="song-player-header">
                        <button onClick={toggleMinimize} className="song-player-toggle" title="Minimize">
                            <ChevronDown size={18} />
                        </button>
                    </div>
                    <div className="song-player-content">
                        {song.albumArt && (
                            <img src={song.albumArt} alt={song.name} className="song-player-album" />
                        )}
                        <div className="song-player-info">
                            <div className="song-player-name">{song.name}</div>
                            <div className="song-player-artist">{song.artist}</div>
                        </div>
                    </div>
                    <div className="song-player-controls">
                        <button onClick={togglePlay} className="song-player-btn" title={isPlaying ? 'Pause' : 'Play'}>
                            {isPlaying ? <Pause size={18} /> : <Play size={18} />}
                        </button>
                    </div>
                </>
            ) : (
                <div className="song-player-minimized">
                    <button onClick={togglePlay} className="song-player-btn-mini" title={isPlaying ? 'Pause' : 'Play'}>
                        {isPlaying ? <Pause size={16} /> : <Play size={16} />}
                    </button>
                    <button onClick={toggleMinimize} className="song-player-btn-mini" title="Expand">
                        <ChevronUp size={16} />
                    </button>
                </div>
            )}
        </div>
    );
};

export default memo(SongPlayer);
