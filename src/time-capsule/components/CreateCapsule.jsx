import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { v4 as uuidv4 } from 'uuid';
import { Clock, User, MessageSquare, Upload, Image as ImageIcon, Calendar, Music, Play, Pause, X, Plus } from 'lucide-react';
import { uploadToCloudinary } from '../../utils/cloudinary';
import ShareModal from '../../components/ShareModal';
import SpotifyModal from '../../components/SpotifyModal';
import Loader from '../../components/Loader';
import SlugInput from '../../components/SlugInput';
import FormBackButton from '../../components/FormBackButton';
import { useAuth } from '../../contexts/AuthContext';
import '../../components/SharedFormStyles.css';
import timeCapsuleBg from '../../assets/backgrounds/time-capsule.webp';

const CreateCapsule = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        recipient: '',
        openDate: '',
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
    const { currentUser } = useAuth();
    const [customSlug, setCustomSlug] = useState('');
    const [dateOption, setDateOption] = useState('custom');
    const songPlayerRef = useRef(null);

    const handleBack = () => {
        navigate('/');
    };

    // Helper function to add time to current date
    const getFutureDate = (amount, unit) => {
        const date = new Date();
        switch (unit) {
            case 'week':
                date.setDate(date.getDate() + amount * 7);
                break;
            case 'month':
                date.setMonth(date.getMonth() + amount);
                break;
            case 'year':
                date.setFullYear(date.getFullYear() + amount);
                break;
            default:
                break;
        }
        return date.toISOString().split('T')[0];
    };

    // Handle date option change
    const handleDateOptionChange = (option) => {
        setDateOption(option);
        let newDate = '';
        
        switch (option) {
            case '1week':
                newDate = getFutureDate(1, 'week');
                break;
            case '1month':
                newDate = getFutureDate(1, 'month');
                break;
            case '1year':
                newDate = getFutureDate(1, 'year');
                break;
            case 'custom':
                // Keep current date or set to tomorrow as default
                newDate = formData.openDate || getFutureDate(1, 'day');
                break;
            default:
                break;
        }
        
        setFormData({ ...formData, openDate: newDate });
    };

    const messageSuggestions = [
        "This is a message from the past! I hope when you read this, you're exactly where you want to be. Remember how far you've come!",
        "Future you - I hope life has been kind to you. Remember to stay true to yourself and keep chasing your dreams!",
        "Opening this capsule means time has passed. I hope you've grown, learned, and achieved amazing things. Never forget where you started!",
        "To my future self: Remember this moment. Remember your dreams. I hope you've made them come true!"
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
            const capsuleId = uuidv4();
            const capsuleDoc = doc(db, 'capsules', capsuleId);
            await setDoc(capsuleDoc, {
                ...formData,
                unlockDate: formData.openDate,
                creator: formData.sender,
                title: `Time Capsule for ${formData.recipient}`,
                song: selectedSong,
                createdAt: Date.now()
            });

            // Save custom slug if provided and user is logged in
            if (customSlug) {
                const slugDoc = doc(db, 'slugs', customSlug);
                await setDoc(slugDoc, {
                    slug: customSlug,
                    cardType: 'time-capsule',
                    cardId: capsuleId,
                    userId: currentUser?.uid || null,
                    createdAt: Date.now()
                });
            }

            const url = customSlug
                ? `${window.location.origin}/capsule/${customSlug}`
                : `${window.location.origin}/capsule/${capsuleId}`;
            setCardUrl(url);
            setShowShareModal(true);
        } catch (error) {
            console.error("Error creating time capsule:", error);
            alert("Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <Loader />;

    return (
        <>
            <div className="form-page-container">
                <FormBackButton onClick={handleBack} />
                <div
                    className="form-page-background"
                    style={{ backgroundImage: `url(${timeCapsuleBg})` }}
                />

                <div className="glass-form-card">
                    <div className="glass-form-header">

                        <h1 className="glass-form-title">Create Time Capsule</h1>
                        <p className="glass-form-subtitle">Preserve memories for the future</p>
                    </div>

                    <form onSubmit={handleSubmit} className="glass-form">
                        <div className="glass-form-section">
                            <h3 className="glass-section-title">
                                <User size={20} /> Capsule Information
                            </h3>
                            <div className="glass-form-row">
                                <div className="glass-form-group">
                                    <label className="glass-form-label">To</label>
                                    <input
                                        type="text"
                                        required
                                        className="glass-form-input"
                                        placeholder="Recipient's name (or 'Future Me')"
                                        value={formData.recipient}
                                        onChange={(e) => setFormData({ ...formData, recipient: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="glass-form-row">
                                <div className="glass-form-group">
                                    <label className="glass-form-label">Open Date</label>
                                    
                                    {/* Quick Options */}
                                    <div className="date-options" style={{ display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
                                        <button
                                            type="button"
                                            className={`date-option-btn ${dateOption === '1week' ? 'active' : ''}`}
                                            onClick={() => handleDateOptionChange('1week')}
                                        >
                                            1 Week
                                        </button>
                                        <button
                                            type="button"
                                            className={`date-option-btn ${dateOption === '1month' ? 'active' : ''}`}
                                            onClick={() => handleDateOptionChange('1month')}
                                        >
                                            1 Month
                                        </button>
                                        <button
                                            type="button"
                                            className={`date-option-btn ${dateOption === '1year' ? 'active' : ''}`}
                                            onClick={() => handleDateOptionChange('1year')}
                                        >
                                            1 Year
                                        </button>
                                        <button
                                            type="button"
                                            className={`date-option-btn ${dateOption === 'custom' ? 'active' : ''}`}
                                            onClick={() => handleDateOptionChange('custom')}
                                        >
                                            Custom
                                        </button>
                                    </div>
                                    
                                    {/* Date Input */}
                                    <input
                                        type="date"
                                        required
                                        className="glass-form-input"
                                        value={formData.openDate}
                                        min={new Date().toISOString().split('T')[0]}
                                        onChange={(e) => {
                                            const selectedDate = new Date(e.target.value);
                                            const today = new Date();
                                            today.setHours(0, 0, 0, 0);
                                            
                                            if (selectedDate >= today) {
                                                setFormData({ ...formData, openDate: e.target.value });
                                                setDateOption('custom');
                                            } else {
                                                alert('Please select a future date for the time capsule');
                                                e.target.value = formData.openDate;
                                            }
                                        }}
                                        disabled={dateOption !== 'custom'}
                                        style={{ 
                                            opacity: dateOption === 'custom' ? '1' : '0.6',
                                            cursor: dateOption === 'custom' ? 'pointer' : 'not-allowed'
                                        }}
                                    />
                                    {dateOption !== 'custom' && (
                                        <p style={{ 
                                            fontSize: '0.8rem', 
                                            color: '#6b7280', 
                                            marginTop: '4px',
                                            fontStyle: 'italic'
                                        }}>
                                            {new Date(formData.openDate).toLocaleDateString('en-US', { 
                                                weekday: 'long', 
                                                year: 'numeric', 
                                                month: 'long', 
                                                day: 'numeric' 
                                            })}
                                        </p>
                                    )}
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
                                <MessageSquare size={20} /> Your Message to the Future
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
                                    placeholder="Write your message to the future or choose a suggestion above..."
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
                                    cardType="time-capsule"
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
                cardType="Time Capsule"
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

export default CreateCapsule;

