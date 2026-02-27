import React, { useEffect, useRef, useState } from 'react';
import { addDoc, collection, setDoc, doc } from 'firebase/firestore';
import { db } from '../../firebase';
import { Brain, User, MessageSquare, Upload, Image as ImageIcon, Music, Play, Pause, X, Plus } from 'lucide-react';
import { uploadToCloudinary } from '../../utils/cloudinary';
import { compressImageToTargetSize, validateImageFile, formatFileSize, createImagePreview, revokeImagePreview } from '../../utils/imageCompression';
import ShareModal from '../../components/ShareModal';
import SpotifyModal from '../../components/SpotifyModal';
import Loader from '../../components/Loader';
import '../../components/SharedFormStyles.css';
import { useNavigate } from 'react-router-dom';
import useFormDraft from '../../utils/useFormDraft';
import FormBackButton from '../../components/FormBackButton';
import UnsavedChangesModal from '../../components/UnsavedChangesModal';
import SlugInput from '../../components/SlugInput';
import { verifyCardCreate } from '../../utils/recaptcha';
import valentineBg from '../../assets/backgrounds/valentine.webp';

const CreateThinkingOfYou = () => {
    const navigate = useNavigate();
    const {
        value: formData,
        setValue: setFormData,
        isDirty,
        clearDraft,
        markClean
    } = useFormDraft('draft:thinking-of-you', {
        recipientName: '',
        sender: '',
        message: '',
        thoughts: '',
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
        "Just wanted to let you know you're on my mind today and always.",
        "Thinking of you and sending you warm thoughts and love.",
        "You crossed my mind today and brought a smile to my face.",
        "In this busy world, I wanted to pause and say I'm thinking of you."
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

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            await verifyCardCreate();
            
            const docRef = await addDoc(collection(db, 'wishes'), {
                ...formData,
                song: selectedSong,
                cardType: 'thinking-of-you',
                createdAt: Date.now()
            });

            // Save custom slug if provided
            if (customSlug) {
                const slugDoc = doc(db, 'slugs', customSlug);
                await setDoc(slugDoc, {
                    slug: customSlug,
                    cardType: 'thinking-of-you',
                    cardId: docRef.id,
                    createdAt: Date.now()
                });
            }

            const url = customSlug
                ? `${window.location.origin}/thinking-of-you/${customSlug}`
                : `${window.location.origin}/thinking-of-you/${docRef.id}`;
            setCardUrl(url);
            setShowShareModal(true);
            clearDraft();
            markClean({
                recipientName: '',
                sender: '',
                message: '',
                thoughts: '',
                imageUrl: ''
            });
        } catch (error) {
            console.error("Error creating thinking of you card:", error);
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
                    style={{ backgroundImage: `url(${valentineBg})` }}
                />

                <div className="glass-form-card">
                    <div className="glass-form-header">
                        <h1 className="glass-form-title">Thinking of You Card</h1>
                    </div>

                    <form onSubmit={handleSubmit} className="glass-form">
                        <div className="glass-form-section">
                            <h3 className="glass-section-title">
                                <User size={20} /> Recipient
                            </h3>
                            <div className="glass-form-row">
                                <div className="glass-form-group">
                                    <label className="glass-form-label">Name</label>
                                    <input
                                        type="text"
                                        required
                                        className="glass-form-input"
                                        placeholder="Who are you thinking of?"
                                        value={formData.recipientName}
                                        onChange={(e) => setFormData({ ...formData, recipientName: e.target.value })}
                                    />
                                </div>
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
                                    placeholder="Write your thoughtful message..."
                                    value={formData.message}
                                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="glass-form-section">
                            <h3 className="glass-section-title">
                                <Brain size={20} /> What Made Me Think of You (Optional)
                            </h3>
                            <div className="glass-form-group">
                                <textarea
                                    className="glass-form-textarea"
                                    rows="3"
                                    placeholder="Share what made you think of them today..."
                                    value={formData.thoughts}
                                    onChange={(e) => setFormData({ ...formData, thoughts: e.target.value })}
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
                                cardType="thinking-of-you"
                            />
                        </div>

                        <button type="submit" className="glass-submit-btn" disabled={loading || uploading}>
                            {loading ? 'Creating...' : 'CREATE'}
                        </button>
                    </form>
                </div>
            </div>

            <UnsavedChangesModal
                isOpen={showUnsavedModal}
                onStay={() => setShowUnsavedModal(false)}
                onDiscard={handleDiscardAndBack}
            />

            <ShareModal
                isOpen={showShareModal}
                onClose={() => setShowShareModal(false)}
                cardUrl={cardUrl}
                cardType="Thinking of You"
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

export default CreateThinkingOfYou;
