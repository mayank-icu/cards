import { useState, useRef } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { v4 as uuidv4 } from 'uuid';
import { User, MessageSquare, Upload, Image as ImageIcon, Calendar, MapPin, Music, Play, Pause, X, Plus, Sparkles } from 'lucide-react';
import { uploadToCloudinary } from '../../utils/cloudinary';
import { compressImageToTargetSize, validateImageFile, formatFileSize, createImagePreview, revokeImagePreview } from '../../utils/imageCompression';
import ShareModal from '../../components/ShareModal';
import SpotifyModal from '../../components/SpotifyModal';
import Loader from '../../components/Loader';
import SlugInput from '../../components/SlugInput';
import '../../components/SharedFormStyles.css';
import weddingBg from '../../assets/backgrounds/wedding-bg.webp';

const CreateWedding = () => {
    const [formData, setFormData] = useState({
        bride: '',
        groom: '',
        date: '',
        venue: '',
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
    const [customSlug, setCustomSlug] = useState('');
    const songPlayerRef = useRef(null);

    const messageSuggestions = [
        "You are cordially invited to celebrate the wedding of our lives. Join us as we begin our journey together!",
        "Together with our families, we invite you to share in our joy as we exchange vows and celebrate our love.",
        "Please join us for a celebration of love, laughter, and happily ever after!",
        "We request the honor of your presence at the marriage celebration of our hearts."
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

            const weddingId = uuidv4();
            const weddingDoc = doc(db, 'weddings', weddingId);
            await setDoc(weddingDoc, {
                ...formData,
                partner1: formData.bride,
                partner2: formData.groom,
                sender: formData.bride,
                song: selectedSong,
                createdAt: Date.now()
            });

            // Save custom slug if provided
            if (customSlug) {
                const slugDoc = doc(db, 'slugs', customSlug);
                await setDoc(slugDoc, {
                    slug: customSlug,
                    cardType: 'wedding',
                    cardId: weddingId,
                    createdAt: Date.now()
                });
            }

            const url = customSlug
                ? `${window.location.origin}/wedding/${customSlug}`
                : `${window.location.origin}/wedding/${weddingId}`;
            setCardUrl(url);
            setShowShareModal(true);
        } catch (error) {
            console.error("Error creating wedding card:", error);
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
                    style={{ backgroundImage: `url(${weddingBg})` }}
                />

                <div className="glass-form-card">
                    <div className="glass-form-header">
                        <h1 className="glass-form-title">Create Wedding Invitation</h1>
                    </div>

                    <form onSubmit={handleSubmit} className="glass-form">
                        <div className="glass-form-section">
                            <h3 className="glass-section-title">
                                <User size={20} /> Couple Information
                            </h3>
                            <div className="glass-form-row">
                                <div className="glass-form-group">
                                    <label className="glass-form-label">Bride's Name</label>
                                    <input
                                        type="text"
                                        required
                                        className="glass-form-input"
                                        placeholder="Bride's name"
                                        value={formData.bride}
                                        onChange={(e) => setFormData({ ...formData, bride: e.target.value })}
                                    />
                                </div>
                                <div className="glass-form-group">
                                    <label className="glass-form-label">Groom's Name</label>
                                    <input
                                        type="text"
                                        required
                                        className="glass-form-input"
                                        placeholder="Groom's name"
                                        value={formData.groom}
                                        onChange={(e) => setFormData({ ...formData, groom: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="glass-form-section">
                            <h3 className="glass-section-title">
                                <Calendar size={20} /> Event Details
                            </h3>
                            <div className="glass-form-row">
                                <div className="glass-form-group">
                                    <label className="glass-form-label">Wedding Date</label>
                                    <input
                                        type="date"
                                        required
                                        className="glass-form-input"
                                        value={formData.date}
                                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                    />
                                </div>
                                <div className="glass-form-group">
                                    <label className="glass-form-label">Venue</label>
                                    <input
                                        type="text"
                                        required
                                        className="glass-form-input"
                                        placeholder="Venue name and location"
                                        value={formData.venue}
                                        onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
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
                                <MessageSquare size={20} /> Invitation Message
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
                                    placeholder="Write your invitation message or choose a suggestion above..."
                                    value={formData.message}
                                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="glass-form-section">
                            <SlugInput
                                value={customSlug}
                                onChange={setCustomSlug}
                                cardType="wedding"
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
                cardType="Wedding"
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

export default CreateWedding;
