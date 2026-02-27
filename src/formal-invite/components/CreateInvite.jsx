import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { v4 as uuidv4 } from 'uuid';
import { Mail, User, MessageSquare, Upload, Image as ImageIcon, Calendar, MapPin, Music, Play, Pause, X, Plus } from 'lucide-react';
import { uploadToCloudinary } from '../../utils/cloudinary';
import ShareModal from '../../components/ShareModal';
import SpotifyModal from '../../components/SpotifyModal';
import Loader from '../../components/Loader';
import SlugInput from '../../components/SlugInput';
import FormBackButton from '../../components/FormBackButton';
import { useAuth } from '../../contexts/AuthContext';
import '../../components/SharedFormStyles.css';
import formalInviteBg from '../../assets/backgrounds/formal-invite.webp';

const CreateInvite = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        eventName: '',
        host: '',
        date: '',
        time: '',
        venue: '',
        message: '',
        imageUrl: '',
        password: ''
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
    const songPlayerRef = useRef(null);

    const handleBack = () => {
        navigate('/');
    };

    const messageSuggestions = [
        "You are cordially invited to join us for a special celebration. Your presence would be an honor!",
        "We request the pleasure of your company at this formal event. Please join us for an evening of elegance.",
        "It would be our privilege to have you attend this special occasion. We look forward to celebrating with you!",
        "Your presence is requested at this distinguished gathering. We hope you can join us!"
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
            const inviteId = uuidv4();
            const inviteDoc = doc(db, 'invites', inviteId);
            await setDoc(inviteDoc, {
                ...formData,
                hostName: formData.host,
                location: formData.venue,
                details: formData.message,
                song: selectedSong,
                createdAt: Date.now()
            });

            // Save custom slug if provided and user is logged in
            if (customSlug) {
                const slugDoc = doc(db, 'slugs', customSlug);
                await setDoc(slugDoc, {
                    slug: customSlug,
                    cardType: 'invite',
                    cardId: inviteId,
                    userId: currentUser?.uid || null,
                    createdAt: Date.now()
                });
            }

            const url = customSlug
                ? `${window.location.origin}/invite/${customSlug}`
                : `${window.location.origin}/invite/${inviteId}`;
            setCardUrl(url);
            setShowShareModal(true);
        } catch (error) {
            console.error("Error creating formal invite:", error);
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
                    style={{ backgroundImage: `url(${formalInviteBg})` }}
                />

                <div className="glass-form-card">
                    <div className="glass-form-header">

                        <h1 className="glass-form-title">Create Formal Invitation</h1>
                        <p className="glass-form-subtitle">Professional event invitations</p>
                    </div>

                    <form onSubmit={handleSubmit} className="glass-form">
                        <div className="glass-form-section">
                            <h3 className="glass-section-title">
                                <User size={20} /> Event Information
                            </h3>
                            <div className="glass-form-row">
                                <div className="glass-form-group">
                                    <label className="glass-form-label">Event Name</label>
                                    <input
                                        type="text"
                                        required
                                        className="glass-form-input"
                                        placeholder="e.g., Annual Gala, Corporate Dinner"
                                        value={formData.eventName}
                                        onChange={(e) => setFormData({ ...formData, eventName: e.target.value })}
                                    />
                                </div>
                                <div className="glass-form-group">
                                    <label className="glass-form-label">Host</label>
                                    <input
                                        type="text"
                                        required
                                        className="glass-form-input"
                                        placeholder="Host name or organization"
                                        value={formData.host}
                                        onChange={(e) => setFormData({ ...formData, host: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="glass-form-row">
                                <div className="glass-form-group">
                                    <label className="glass-form-label">Date</label>
                                    <input
                                        type="date"
                                        required
                                        className="glass-form-input"
                                        value={formData.date}
                                        min={new Date().toISOString().split('T')[0]}
                                        onChange={(e) => {
                                            const selectedDate = new Date(e.target.value);
                                            const today = new Date();
                                            today.setHours(0, 0, 0, 0);
                                            if (selectedDate >= today) {
                                                setFormData({ ...formData, date: e.target.value });
                                            } else {
                                                alert('Please select a future date for the event');
                                                e.target.value = formData.date; // Reset to previous value
                                            }
                                        }}
                                    />
                                </div>
                                <div className="glass-form-group">
                                    <label className="glass-form-label">Time</label>
                                    <input
                                        type="time"
                                        required
                                        className="glass-form-input"
                                        value={formData.time}
                                        onChange={(e) => {
                                            const selectedTime = e.target.value;
                                            const selectedDate = new Date(formData.date + 'T' + selectedTime);
                                            const now = new Date();
                                            if (formData.date && selectedDate >= now) {
                                                setFormData({ ...formData, time: e.target.value });
                                            } else {
                                                alert('Please select a future time for the event');
                                                e.target.value = formData.time; // Reset to previous value
                                            }
                                        }}
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="glass-form-row">
                            <div className="glass-form-group">
                                <label className="glass-form-label">Venue</label>
                                <input
                                    type="text"
                                    required
                                    className="glass-form-input"
                                    placeholder="Event location"
                                    value={formData.venue}
                                    onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                                />
                            </div>
                            <div className="glass-form-group">
                                <label className="glass-form-label">Entry Password (Optional)</label>
                                <input
                                    type="text"
                                    className="glass-form-input"
                                    placeholder="Secret Code (e.g. GATSBY)"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
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
                                cardType="invite"
                            />
                        </div>
                    <button type="submit" className="glass-submit-btn" disabled={loading || uploading}>
                        {loading ? 'Creating...' : 'CREATE'}
                    </button>
                </form>
            </div>

            <ShareModal
                isOpen={showShareModal}
                onClose={() => setShowShareModal(false)}
                cardUrl={cardUrl}
                cardType="Formal Invite"
            />

            <SpotifyModal
                isOpen={showSpotifyModal}
                onClose={() => setShowSpotifyModal(false)}
                onSongSelect={(song) => setSelectedSong(song)}
                currentSong={selectedSong}
            />
            </div>
        </>
    );
};

export default CreateInvite;

