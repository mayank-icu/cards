import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { v4 as uuidv4 } from 'uuid';
import { Heart, Calendar, User, Upload, Image as ImageIcon, Sparkles, Music, Play, Pause, X, Plus } from 'lucide-react';
import { uploadToCloudinary } from '../../utils/cloudinary';
import { compressImageToTargetSize, validateImageFile, formatFileSize, createImagePreview, revokeImagePreview } from '../../utils/imageCompression';
import ShareModal from '../../components/ShareModal';
import SpotifyModal from '../../components/SpotifyModal';
import SlugInput from '../../components/SlugInput';
import Loader from '../../components/Loader';
import '../../components/SharedFormStyles.css';
import useFormDraft from '../../utils/useFormDraft';
import FormBackButton from '../../components/FormBackButton';
import UnsavedChangesModal from '../../components/UnsavedChangesModal';
import anniversaryBg from '../../assets/backgrounds/anniversary.webp';

const CreateAnniversary = () => {
    const navigate = useNavigate();
    const {
        value: formData,
        setValue: setFormData,
        isDirty,
        clearDraft,
        markClean
    } = useFormDraft('draft:anniversary', {
        partner1: '',
        partner2: '',
        years: '',
        message: '',
        date: '',
        imageUrl: ''
    });
    const [imagePreview, setImagePreview] = useState(null);
    const [originalImageSize, setOriginalImageSize] = useState(null);
    const [compressedImageSize, setCompressedImageSize] = useState(null);
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
        "Happy Anniversary! Here's to many more years of love and laughter together.",
        "Celebrating another year of our beautiful journey together. I love you more each day!",
        "To the love of my life, happy anniversary! Thank you for making every day special.",
        "Another year down, forever to go. Happy Anniversary, my love!"
    ];

    const handleImageChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Validate file
        const validation = validateImageFile(file, 10);
        if (!validation.valid) {
            alert(validation.error);
            e.target.value = '';
            return;
        }

        // Store original size
        setOriginalImageSize(file.size);
        
        setUploading(true);
        try {
            // Compress image to target ~100KB
            const compressedFile = await compressImageToTargetSize(file, 100);
            setCompressedImageSize(compressedFile.size);

            // Create preview
            const previewUrl = createImagePreview(compressedFile);
            setImagePreview(previewUrl);

            // Upload compressed image
            const url = await uploadToCloudinary(compressedFile);
            setFormData({ ...formData, imageUrl: url });
        } catch (error) {
            console.error('Image processing error:', error);
            alert('Failed to process image. Please try again.');
            e.target.value = '';
        } finally {
            setUploading(false);
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

    const handleSuggestionClick = (suggestion) => {
        setFormData({ ...formData, message: suggestion });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const anniversaryId = uuidv4();
            const anniversaryDoc = doc(db, 'anniversaries', anniversaryId);
            await setDoc(anniversaryDoc, {
                ...formData,
                selectedSong: selectedSong,
                createdAt: Date.now()
            });

            // Save custom slug if provided
            if (customSlug) {
                const slugDoc = doc(db, 'slugs', customSlug);
                await setDoc(slugDoc, {
                    slug: customSlug,
                    cardType: 'anniversary',
                    cardId: anniversaryId,
                    createdAt: Date.now()
                });
            }

            const url = customSlug
                ? `${window.location.origin}/anniversary/${customSlug}`
                : `${window.location.origin}/anniversary/${anniversaryId}`;
            setCardUrl(url);
            setShowShareModal(true);
            clearDraft();
            markClean({
                partner1: '',
                partner2: '',
                years: '',
                message: '',
                date: '',
                imageUrl: ''
            });
        } catch (error) {
            console.error("Error creating anniversary card:", error);
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
                    style={{ backgroundImage: `url(${anniversaryBg})` }}
                />

                <div className="glass-form-card">
                    <div className="glass-form-header">

                        <h1 className="glass-form-title">Anniversary Card</h1>
                    </div>

                    <form onSubmit={handleSubmit} className="glass-form">
                        <div className="glass-form-section">
                            <h3 className="glass-section-title">
                                <User size={20} /> Partner Information
                            </h3>
                            <div className="glass-form-row">
                                <div className="glass-form-group">
                                    <label className="glass-form-label">Partner 1 Name</label>
                                    <input
                                        type="text"
                                        required
                                        className="glass-form-input"
                                        placeholder="First partner's name"
                                        value={formData.partner1}
                                        onChange={(e) => setFormData({ ...formData, partner1: e.target.value })}
                                    />
                                </div>

                                <div className="glass-form-group">
                                    <label className="glass-form-label">Partner 2 Name</label>
                                    <input
                                        type="text"
                                        required
                                        className="glass-form-input"
                                        placeholder="Second partner's name"
                                        value={formData.partner2}
                                        onChange={(e) => setFormData({ ...formData, partner2: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="glass-form-section">
                            <h3 className="glass-section-title">
                                <Sparkles size={20} /> Your Message
                            </h3>
                            <div className="suggestion-buttons">
                                {messageSuggestions.map((suggestion, index) => (
                                    <button
                                        key={index}
                                        type="button"
                                        className="suggestion-btn"
                                        onClick={() => handleSuggestionClick(suggestion)}
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
                                    placeholder="Write a heartfelt anniversary message or choose a suggestion above..."
                                    value={formData.message}
                                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="glass-form-section">
                            <h3 className="glass-section-title">
                                <Calendar size={20} /> Anniversary Details
                            </h3>
                            <div className="glass-form-row">
                                <div className="glass-form-group">
                                    <label className="glass-form-label">Years Together</label>
                                    <input
                                        type="number"
                                        required
                                        className="glass-form-input"
                                        placeholder="e.g., 5"
                                        value={formData.years}
                                        onChange={(e) => setFormData({ ...formData, years: e.target.value })}
                                    />
                                </div>

                                <div className="glass-form-group">
                                    <label className="glass-form-label">Anniversary Date</label>
                                    <input
                                        type="date"
                                        required
                                        className="glass-form-input"
                                        value={formData.date}
                                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                        min="1900-01-01"
                                        max={new Date().toISOString().split('T')[0]}
                                    />
                                </div>
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
                                        {(originalImageSize && compressedImageSize) && (
                                            <div className="image-size-info" style={{
                                                fontSize: '0.8rem',
                                                color: '#666',
                                                marginTop: '0.5rem',
                                                textAlign: 'center'
                                            }}>
                                                Original: {formatFileSize(originalImageSize)} → Compressed: {formatFileSize(compressedImageSize)}
                                            </div>
                                        )}
                                        <button
                                            type="button"
                                            className="remove-image-btn"
                                            onClick={() => {
                                                revokeImagePreview(imagePreview);
                                                setImagePreview(null);
                                                setFormData({ ...formData, imageUrl: '' });
                                                setOriginalImageSize(null);
                                                setCompressedImageSize(null);
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
                            <SlugInput value={customSlug} onChange={setCustomSlug} cardType="anniversary" />
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
                cardType="Anniversary"
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

export default CreateAnniversary;
