import React, { useState, useRef } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { v4 as uuidv4 } from 'uuid';
import { Baby, User, MessageSquare, Upload, Image as ImageIcon, Calendar, Music, Play, Pause, X, Plus } from 'lucide-react';
import { uploadToCloudinary } from '../../utils/cloudinary';
import { compressImageToTargetSize, validateImageFile, formatFileSize, createImagePreview, revokeImagePreview } from '../../utils/imageCompression';
import ShareModal from '../../components/ShareModal';
import SpotifyModal from '../../components/SpotifyModal';
import Loader from '../../components/Loader';
import SlugInput from '../../components/SlugInput';
import '../../components/SharedFormStyles.css';
import newBabyBg from '../../assets/backgrounds/new-baby.webp';

const CreateNewBaby = () => {
    const [formData, setFormData] = useState({
        babyName: '',
        parents: '',
        birthDate: '',
        message: '',
        sender: '',
        imageUrl: ''
    });
    const [imagePreview, setImagePreview] = useState(null);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [showShareModal, setShowShareModal] = useState(false);
    const [cardUrl, setCardUrl] = useState('');
    const [selectedSong, setSelectedSong] = useState(null);
    const [showSpotifyModal, setShowSpotifyModal] = useState(false);
    const [isPlayingSong, setIsPlayingSong] = useState(false);
    const [customSlug, setCustomSlug] = useState('');
    const songPlayerRef = useRef(null);

    const messageSuggestions = [
        "Congratulations on your new bundle of joy! Wishing you all the love and happiness in the world.",
        "Welcome to the world, little one! May your life be filled with love, laughter, and endless blessings.",
        "So happy for you! Congratulations on your beautiful new baby. Enjoy every precious moment!",
        "A new baby is like the beginning of all things - wonder, hope, a dream of possibilities. Congratulations!"
    ];

    const handleImageChange = async (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 10 * 1024 * 1024) {
                alert('Image size should be less than 10MB');
                return;
            }
            setImagePreview(URL.createObjectURL(file));

            setUploading(true);
            try {
                const url = await uploadToCloudinary(file);
                setFormData({ ...formData, imageUrl: url });
            } catch (error) {
                console.error('Upload error:', error);
            } finally {
                setUploading(false);
            }
        }
    };

    const toggleSongPlayback = () => {
        if (!selectedSong?.previewUrl) {
            alert('Preview not available for this song');
            return;
        }

        if (isPlayingSong) {
            songPlayerRef.current?.pause();
            setIsPlayingSong(false);
        } else {
            if (!songPlayerRef.current) {
                songPlayerRef.current = new Audio(selectedSong.previewUrl);
                songPlayerRef.current.loop = true;
                songPlayerRef.current.onended = () => setIsPlayingSong(false);
            }
            songPlayerRef.current.play();
            setIsPlayingSong(true);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const newBabyId = uuidv4();
            const newBabyDoc = doc(db, 'new-babies', newBabyId);
            await setDoc(newBabyDoc, {
                ...formData,
                song: selectedSong,
                createdAt: Date.now()
            });

            // Save custom slug if provided
            if (customSlug) {
                const slugDoc = doc(db, 'slugs', customSlug);
                await setDoc(slugDoc, {
                    slug: customSlug,
                    cardType: 'new-baby',
                    cardId: newBabyId,
                    createdAt: Date.now()
                });
            }

            const url = customSlug
                ? `${window.location.origin}/new-baby/${customSlug}`
                : `${window.location.origin}/new-baby/${newBabyId}`;
            setCardUrl(url);
            setShowShareModal(true);
        } catch (error) {
            console.error("Error creating new baby card:", error);
            alert("Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <Loader />;

    return (
        <>
            <div className="form-page-container">
                <div
                    className="form-page-background"
                    style={{ backgroundImage: `url(${newBabyBg})` }}
                />

                <div className="glass-form-card">
                    <div className="glass-form-header">

                        <h1 className="glass-form-title">Create New Baby Card</h1>
                        <p className="glass-form-subtitle">Welcome the new arrival</p>
                    </div>

                    <form onSubmit={handleSubmit} className="glass-form">
                        <div className="glass-form-section">
                            <h3 className="glass-section-title">
                                <User size={20} /> Baby Information
                            </h3>
                            <div className="glass-form-row">
                                <div className="glass-form-group">
                                    <label className="glass-form-label">Baby's Name</label>
                                    <input
                                        type="text"
                                        required
                                        className="glass-form-input"
                                        placeholder="Baby's name"
                                        value={formData.babyName}
                                        onChange={(e) => setFormData({ ...formData, babyName: e.target.value })}
                                    />
                                </div>
                                <div className="glass-form-group">
                                    <label className="glass-form-label">Parents' Names</label>
                                    <input
                                        type="text"
                                        required
                                        className="glass-form-input"
                                        placeholder="Parents' names"
                                        value={formData.parents}
                                        onChange={(e) => setFormData({ ...formData, parents: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="glass-form-group">
                                <label className="glass-form-label">Birth Date</label>
                                <input
                                    type="date"
                                    required
                                    className="glass-form-input"
                                    value={formData.birthDate}
                                    onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="glass-form-section">
                            <h3 className="glass-section-title">
                                <Music size={20} /> Add a Song (Optional)
                            </h3>
                            {!selectedSong ? (
                                <button
                                    type="button"
                                    onClick={() => setShowSpotifyModal(true)}
                                    className="spotify-add-song-btn"
                                >
                                    <Plus size={20} />
                                    Add Song
                                </button>
                            ) : (
                                <div className="selected-song-card">
                                    <img src={selectedSong.albumArt} alt={selectedSong.name} className="song-album-art" />
                                    <div className="song-details">
                                        <p className="song-name">{selectedSong.name}</p>
                                        <p className="song-artist">{selectedSong.artist}</p>
                                    </div>
                                    <div className="song-actions">
                                        <button
                                            type="button"
                                            onClick={toggleSongPlayback}
                                            className={`song-play-btn ${!selectedSong.previewUrl ? 'disabled' : ''}`}
                                            title={!selectedSong.previewUrl ? 'No preview available' : (isPlayingSong ? 'Pause' : 'Play Preview')}
                                        >
                                            {isPlayingSong ? <Pause size={18} /> : <Play size={18} />}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setSelectedSong(null);
                                                if (songPlayerRef.current) {
                                                    songPlayerRef.current.pause();
                                                    songPlayerRef.current = null;
                                                }
                                                setIsPlayingSong(false);
                                            }}
                                            className="song-remove-btn"
                                            title="Remove"
                                        >
                                            <X size={18} />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="glass-form-section">
                            <h3 className="glass-section-title">
                                <ImageIcon size={20} /> Photo (Optional)
                            </h3>
                            <div className="image-upload-section">
                                {imagePreview ? (
                                    <div className="image-preview-container">
                                        <img src={imagePreview} alt="Preview" />
                                        <button
                                            type="button"
                                            className="remove-image-btn"
                                            onClick={() => {
                                                setImagePreview(null);
                                                setFormData({ ...formData, imageUrl: '' });
                                            }}
                                        >
                                            Remove
                                        </button>
                                    </div>
                                ) : (
                                    <label className="upload-label-glass">
                                        <Upload size={32} />
                                        <span>{uploading ? 'Uploading...' : 'Upload Photo'}</span>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleImageChange}
                                            style={{ display: 'none' }}
                                        />
                                    </label>
                                )}
                            </div>
                        </div>

                        <div className="glass-form-section">
                            <h3 className="glass-section-title">
                                <MessageSquare size={20} /> Your Message
                            </h3>
                            <div className="suggestion-buttons">
                                {messageSuggestions.map((suggestion, index) => (
                                    <button
                                        key={index}
                                        type="button"
                                        className="suggestion-btn"
                                        onClick={() => setFormData({ ...formData, message: suggestion })}
                                    >
                                        Suggestion {index + 1}
                                    </button>
                                ))}
                            </div>
                            <div className="glass-form-group">
                                <textarea
                                    required
                                    className="glass-form-textarea"
                                    rows="5"
                                    placeholder="Write your message or choose a suggestion above..."
                                    value={formData.message}
                                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="glass-form-section">
                            <h3 className="glass-section-title">
                                <User size={20} /> Your Information
                            </h3>
                            <div className="glass-form-group">
                                <label className="glass-form-label">From</label>
                                <input
                                    type="text"
                                    required
                                    className="glass-form-input"
                                    placeholder="Your Name"
                                    value={formData.sender}
                                    onChange={(e) => setFormData({ ...formData, sender: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="glass-form-section">
                            <SlugInput
                                value={customSlug}
                                onChange={setCustomSlug}
                                cardType="new-baby"
                            />
                        </div>

                        <button type="submit" className="glass-submit-btn" disabled={loading || uploading}>
                            {loading ? 'Creating...' : 'CREATE'}
                        </button>
                    </form>
                </div>
            </div>

            <ShareModal
                isOpen={showShareModal}
                onClose={() => setShowShareModal(false)}
                cardUrl={cardUrl}
                cardType="New Baby"
            />

            <SpotifyModal
                isOpen={showSpotifyModal}
                onClose={() => setShowSpotifyModal(false)}
                onSongSelect={(song) => setSelectedSong(song)}
                currentSong={selectedSong}
            />
        </>
    );
};

export default CreateNewBaby;
