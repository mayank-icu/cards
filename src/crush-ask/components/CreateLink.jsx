import React, { useState, useRef } from 'react';
import { User, ArrowLeft, Music, ImageIcon, MessageSquare, Plus, Play, Pause, X, Upload } from 'lucide-react';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import { uploadToCloudinary } from '../../utils/cloudinary';
import { compressImageToTargetSize, validateImageFile, formatFileSize, createImagePreview, revokeImagePreview } from '../../utils/imageCompression';
import ShareModal from '../../components/ShareModal';
import SpotifyModal from '../../components/SpotifyModal';
import SlugInput from '../../components/SlugInput';
import FormBackButton from '../../components/FormBackButton';
import { useAuth } from '../../contexts/AuthContext';
import { v4 as uuidv4 } from 'uuid';
import { verifyCardCreate } from '../../utils/recaptcha';
import '../../components/SharedFormStyles.css';
import crushAskBg from '../../assets/backgrounds/crush-ask.webp';

const CreateLink = () => {
  const [formData, setFormData] = useState({
    crushName: '',
    yourName: '',
    message: '',
    imageUrl: ''
  });
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [originalImageSize, setOriginalImageSize] = useState(null);
  const [compressedImageSize, setCompressedImageSize] = useState(null);
  const [selectedSong, setSelectedSong] = useState(null);
  const [isPlayingSong, setIsPlayingSong] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showSpotifyModal, setShowSpotifyModal] = useState(false);
  const [cardUrl, setCardUrl] = useState('');
  const { currentUser } = useAuth();
  const [customSlug, setCustomSlug] = useState('');
  const songPlayerRef = useRef(null);

  const messageSuggestions = [
    "I've been meaning to tell you something...",
    "Would you like to go out sometime?",
    "I think you're amazing and I'd love to get to know you better.",
    "Coffee this weekend? My treat!",
    "I have a crush on you... what do you think?"
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Execute reCAPTCHA verification in background (non-blocking)
      await verifyCardCreate();
      
      const cardId = uuidv4();
      const docRef = doc(db, 'crush-ask-cards', cardId);
      const cardData = {
        ...formData,
        song: selectedSong,
        createdAt: serverTimestamp(),
        type: 'crush-ask'
      };

      await setDoc(docRef, cardData);

      // Save custom slug if provided
      if (customSlug) {
        const slugDoc = doc(db, 'slugs', customSlug);
        await setDoc(slugDoc, {
          slug: customSlug,
          cardType: 'crush-ask',
          cardId: cardId,
          userId: (currentUser && currentUser.uid) || 'anonymous',
          createdAt: Date.now()
        });
      }

      const url = customSlug
        ? `${window.location.origin}/ask/${customSlug}`
        : `${window.location.origin}/ask/${cardId}`;
      setCardUrl(url);
      setShowShareModal(true);
    } catch (error) {
      console.error('Error creating card:', error);
    } finally {
      setLoading(false);
    }
  };

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
      const imageUrl = await uploadToCloudinary(compressedFile);
      setFormData({ ...formData, imageUrl });
    } catch (error) {
      console.error('Image processing error:', error);
      alert('Failed to process image. Please try again.');
      e.target.value = '';
    } finally {
      setUploading(false);
    }
  };

  const toggleSongPlayback = () => {
    if (selectedSong?.previewUrl) {
      if (isPlayingSong) {
        songPlayerRef.current?.pause();
        setIsPlayingSong(false);
      } else {
        songPlayerRef.current = new Audio(selectedSong.previewUrl);
        songPlayerRef.current.loop = true;
        songPlayerRef.current.play();
        setIsPlayingSong(true);
        songPlayerRef.current.onended = () => setIsPlayingSong(false);
      }
    }
  };

  return (
    <>
      <div className="form-page-container">
        <FormBackButton onClick={() => window.history.back()} />
        <div
          className="form-page-background"
          style={{ backgroundImage: `url(${crushAskBg})` }}
        />
        <div className="glass-form-card">
          <div className="glass-form-header">
            <h1 className="glass-form-title">Create Your Crush Card</h1>
            <p className="glass-form-subtitle">Take the leap!</p>
          </div>

          <form onSubmit={handleSubmit} className="glass-form">
            <div className="glass-form-section">
              <h3 className="glass-section-title">
                <User size={20} /> Information
              </h3>
              <div className="glass-form-row">
                <div className="glass-form-group">
                  <label className="glass-form-label">Your Crush's Name</label>
                  <input
                    type="text"
                    required
                    className="glass-form-input"
                    placeholder="Their name"
                    value={formData.crushName}
                    onChange={(e) => setFormData({ ...formData, crushName: e.target.value })}
                  />
                </div>
                <div className="glass-form-group">
                  <label className="glass-form-label">Your Name</label>
                  <input
                    type="text"
                    required
                    className="glass-form-input"
                    placeholder="Your name"
                    value={formData.yourName}
                    onChange={(e) => setFormData({ ...formData, yourName: e.target.value })}
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
                <User size={20} /> Custom URL (Optional)
              </h3>
              <div className="glass-form-group">
                <label className="glass-form-label">URL Slug</label>
                <input
                  type="text"
                  className="glass-form-input"
                  placeholder="my-crush-ask-2024"
                  value={customSlug}
                  onChange={(e) => setCustomSlug(e.target.value)}
                />
                <small style={{ color: '#666', marginTop: '0.5rem', display: 'block' }}>
                  Leave empty for automatic URL. Use only letters, numbers, and hyphens.
                </small>
              </div>
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
        cardType="Crush Ask Out"
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

export default CreateLink;