import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { v4 as uuidv4 } from 'uuid';
import { Heart, User, MessageSquare, Upload, Image as ImageIcon, Sparkles, Music, Play, Pause, X, Plus } from 'lucide-react';
import { uploadToCloudinary } from '../../utils/cloudinary';
import ShareModal from '../../components/ShareModal';
import SpotifyModal from '../../components/SpotifyModal';
import Loader from '../../components/Loader';
import '../../components/SharedFormStyles.css';
import useFormDraft from '../../utils/useFormDraft';
import FormBackButton from '../../components/FormBackButton';
import UnsavedChangesModal from '../../components/UnsavedChangesModal';
import SlugInput from '../../components/SlugInput';
import getWellSoonBg from '../../assets/backgrounds/get-well-soon.webp';

const CreateGetWell = () => {
    const navigate = useNavigate();
    const {
        value: formData,
        setValue: setFormData,
        isDirty,
        clearDraft,
        markClean
    } = useFormDraft('draft:get-well', {
        recipient: '',
        sender: '',
        message: '',
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
    const [showUnsavedModal, setShowUnsavedModal] = useState(false);
    const [customSlug, setCustomSlug] = useState('');
    const songPlayerRef = useRef(null);

    useEffect(() => {
        const onBeforeUnload = (e) => {
            if (!isDirty) return;
            e.preventDefault();
            e.returnValue = '';
        };
        window.addEventListener('beforeunload', onBeforeUnload);
        return () => window.removeEventListener('beforeunload', onBeforeUnload);
    }, [isDirty]);

    const messageSuggestions = [
        "Wishing you a speedy recovery! Get well soon and take care of yourself.",
        "Sending healing thoughts your way. Hope you feel better soon!",
        "Take all the time you need to rest and recover. We're thinking of you!",
        "Hoping each day brings you closer to a full and speedy recovery."
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
            const getWellId = uuidv4();
            const getWellDoc = doc(db, 'get-well', getWellId);
            await setDoc(getWellDoc, {
                ...formData,
                song: selectedSong,
                createdAt: Date.now()
            });

            // Save custom slug if provided
            if (customSlug) {
                const slugDoc = doc(db, 'slugs', customSlug);
                await setDoc(slugDoc, {
                    slug: customSlug,
                    cardType: 'get-well',
                    cardId: getWellId,
                    createdAt: Date.now()
                });
            }

            const url = customSlug
                ? `${window.location.origin}/get-well/${customSlug}`
                : `${window.location.origin}/get-well/${getWellId}`;
            setCardUrl(url);
            setShowShareModal(true);
            clearDraft();
            markClean({
                recipient: '',
                sender: '',
                message: '',
                imageUrl: ''
            });
        } catch (error) {
            console.error("Error creating get well card:", error);
            alert("Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleBack = () => {
        if (isDirty) {
            setShowUnsavedModal(true);
            return;
        }
        navigate(-1);
    };

    const handleDiscardAndBack = () => {
        clearDraft();
        setShowUnsavedModal(false);
        navigate(-1);
    };

    if (loading) return <Loader />;

    return (
        <>
            <div className="form-page-container">
                <FormBackButton onClick={handleBack} />
                <div
                    className="form-page-background"
                    style={{ backgroundImage: `url(${getWellSoonBg})` }}
                />

                <div className="glass-form-card">
                    <div className="glass-form-header">

                        <h1 className="glass-form-title">Get Well Soon Card</h1>
                    </div>

                    <form onSubmit={handleSubmit} className="glass-form">
                        <div className="glass-form-section">
                            <h3 className="glass-section-title">
                                <User size={20} /> Recipient Information
                            </h3>
                            <div className="glass-form-group">
                                <label className="glass-form-label">To</label>
                                <input
                                    type="text"
                                    required
                                    className="glass-form-input"
                                    placeholder="Recipient's Name"
                                    value={formData.recipient}
                                    onChange={(e) => setFormData({ ...formData, recipient: e.target.value })}
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
                                    placeholder="Write your get well message or choose a suggestion above..."
                                    value={formData.message}
                                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
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
                            <SlugInput
                                value={customSlug}
                                onChange={setCustomSlug}
                                cardType="get-well"
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
                cardType="Get Well Soon"
            />

            <SpotifyModal
                isOpen={showSpotifyModal}
                onClose={() => setShowSpotifyModal(false)}
                onSongSelect={(song) => setSelectedSong(song)}
                currentSong={selectedSong}
            />

            <UnsavedChangesModal
                isOpen={showUnsavedModal}
                onStay={() => setShowUnsavedModal(false)}
                onDiscard={handleDiscardAndBack}
            />
        </>
    );
};

export default CreateGetWell;
