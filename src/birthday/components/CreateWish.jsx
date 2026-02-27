import React, { useEffect, useRef, useState } from 'react';
import { addDoc, collection, doc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { Cake, User, MessageSquare, Upload, Image as ImageIcon, Music, Play, Pause, X, Plus } from 'lucide-react';
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
import birthdayBg from '../../assets/backgrounds/birthday.webp';

const fileToDataUrl = (file) =>
    new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(new Error('Failed to read image file'));
        reader.readAsDataURL(file);
    });

const CreateWish = () => {
    const navigate = useNavigate();
    const {
        value: formData,
        setValue: setFormData,
        isDirty,
        clearDraft,
        markClean
    } = useFormDraft('draft:birthday', {
        recipientName: '',
        sender: '',
        message: '',
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
    const [isSlugValid, setIsSlugValid] = useState(true);
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
        "Happy Birthday! Wishing you a day filled with love, laughter, and all your favorite things!",
        "Another year older, another year wiser! May this year bring you endless joy and success.",
        "Happy Birthday to someone who makes the world brighter just by being in it!",
        "Cheers to you on your special day! May all your birthday wishes come true!"
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
            let imageUrl = null;
            try {
                imageUrl = await uploadToCloudinary(compressedFile);
            } catch (uploadError) {
                console.warn('Cloudinary upload failed. Falling back to inline image data.', uploadError);
            }

            if (!imageUrl) {
                imageUrl = await fileToDataUrl(compressedFile);
            }

            setFormData((prev) => ({ ...prev, imageUrl }));
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

        if (customSlug && !isSlugValid) {
            alert('Please fix slug validation errors before creating the card.');
            return;
        }

        setLoading(true);

        try {
            // Execute reCAPTCHA verification in background (non-blocking)
            await verifyCardCreate();
            
            const docRef = await addDoc(collection(db, 'wishes'), {
                ...formData,
                song: selectedSong,
                createdAt: Date.now()
            });

            // Save custom slug if provided
            if (customSlug) {
                const slugDoc = doc(db, 'slugs', customSlug);
                await setDoc(slugDoc, {
                    slug: customSlug,
                    cardType: 'birthday',
                    cardId: docRef.id,
                    createdAt: Date.now()
                });
            }

            const url = customSlug
                ? `${window.location.origin}/birthday/${customSlug}`
                : `${window.location.origin}/birthday/${docRef.id}`;
            setCardUrl(url);
            setShowShareModal(true);
            clearDraft();
            markClean({
                recipientName: '',
                sender: '',
                message: '',
                imageUrl: ''
            });
        } catch (error) {
            console.error("Error creating birthday card:", error);
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
                    style={{ backgroundImage: `url(${birthdayBg})` }}
                />

                <div className="glass-form-card">
                    <div className="glass-form-header">
                        <h1 className="glass-form-title">Birthday Card</h1>
                    </div>

                    <form onSubmit={handleSubmit} className="glass-form">
                        <div className="glass-form-section">
                            <h3 className="glass-section-title">
                                <User size={20} /> Birthday Person
                            </h3>
                            <div className="glass-form-row">
                                <div className="glass-form-group">
                                    <label className="glass-form-label">Name</label>
                                    <input
                                        type="text"
                                        required
                                        className="glass-form-input"
                                        placeholder="Birthday person's name"
                                        value={formData.recipientName}
                                        onChange={(e) => setFormData((prev) => ({ ...prev, recipientName: e.target.value }))}
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
                                    onChange={(e) => setFormData((prev) => ({ ...prev, sender: e.target.value }))}
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
                                        onClick={() => setFormData((prev) => ({ ...prev, message: suggestion }))}
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
                                    placeholder="Write your birthday message or choose a suggestion above..."
                                    value={formData.message}
                                    onChange={(e) => setFormData((prev) => ({ ...prev, message: e.target.value }))}
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
                                                setFormData((prev) => ({ ...prev, imageUrl: '' }));
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
                            <SlugInput
                                value={customSlug}
                                onChange={setCustomSlug}
                                cardType="birthday"
                                onValidationChange={setIsSlugValid}
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
                cardType="Birthday"
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

export default CreateWish;
