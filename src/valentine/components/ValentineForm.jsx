import React, { useState, useRef } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { v4 as uuidv4 } from 'uuid';
import { Heart, User, MessageSquare, Upload, Image as ImageIcon, Music, Globe, Plus, X, Play, Pause } from 'lucide-react';
import { compressImageToTargetSize, validateImageFile, formatFileSize, createImagePreview, revokeImagePreview } from '../../utils/imageCompression';
import { validateAudioFile, createAudioPreview, revokeAudioPreview, getAudioMetadata, formatFileSize as formatAudioSize } from '../../utils/audioUpload';
import Select from 'react-select';
import ShareModal from '../../components/ShareModal';
import SpotifyModal from '../../components/SpotifyModal';
import Loader from '../../components/Loader';
import FormBackButton from '../../components/FormBackButton';
import SlugInput from '../../components/SlugInput';
import { uploadToCloudinary } from '../../utils/cloudinary';
import '../../components/SharedFormStyles.css';
import './css/ValentineForm.css';
import valentineBg from '../../assets/backgrounds/valentine.webp';

const countries = [
  { value: 'AF', label: 'Afghanistan' },
  { value: 'AL', label: 'Albania' },
  { value: 'DZ', label: 'Algeria' },
  { value: 'AD', label: 'Andorra' },
  { value: 'AO', label: 'Angola' },
  { value: 'AG', label: 'Antigua and Barbuda' },
  { value: 'AR', label: 'Argentina' },
  { value: 'AM', label: 'Armenia' },
  { value: 'AU', label: 'Australia' },
  { value: 'AT', label: 'Austria' },
  { value: 'AZ', label: 'Azerbaijan' },
  { value: 'BS', label: 'Bahamas' },
  { value: 'BH', label: 'Bahrain' },
  { value: 'BD', label: 'Bangladesh' },
  { value: 'BB', label: 'Barbados' },
  { value: 'BY', label: 'Belarus' },
  { value: 'BE', label: 'Belgium' },
  { value: 'BZ', label: 'Belize' },
  { value: 'BJ', label: 'Benin' },
  { value: 'BT', label: 'Bhutan' },
  { value: 'BO', label: 'Bolivia' },
  { value: 'BA', label: 'Bosnia and Herzegovina' },
  { value: 'BW', label: 'Botswana' },
  { value: 'BR', label: 'Brazil' },
  { value: 'BN', label: 'Brunei' },
  { value: 'BG', label: 'Bulgaria' },
  { value: 'BF', label: 'Burkina Faso' },
  { value: 'BI', label: 'Burundi' },
  { value: 'CV', label: 'Cabo Verde' },
  { value: 'KH', label: 'Cambodia' },
  { value: 'CM', label: 'Cameroon' },
  { value: 'CA', label: 'Canada' },
  { value: 'CF', label: 'Central African Republic' },
  { value: 'TD', label: 'Chad' },
  { value: 'CL', label: 'Chile' },
  { value: 'CN', label: 'China' },
  { value: 'CO', label: 'Colombia' },
  { value: 'KM', label: 'Comoros' },
  { value: 'CG', label: 'Congo' },
  { value: 'CD', label: 'Congo (Democratic Republic)' },
  { value: 'CR', label: 'Costa Rica' },
  { value: 'HR', label: 'Croatia' },
  { value: 'CU', label: 'Cuba' },
  { value: 'CY', label: 'Cyprus' },
  { value: 'CZ', label: 'Czech Republic' },
  { value: 'CI', label: 'Côte d\'Ivoire' },
  { value: 'DK', label: 'Denmark' },
  { value: 'DJ', label: 'Djibouti' },
  { value: 'DM', label: 'Dominica' },
  { value: 'DO', label: 'Dominican Republic' },
  { value: 'EC', label: 'Ecuador' },
  { value: 'EG', label: 'Egypt' },
  { value: 'SV', label: 'El Salvador' },
  { value: 'GQ', label: 'Equatorial Guinea' },
  { value: 'ER', label: 'Eritrea' },
  { value: 'EE', label: 'Estonia' },
  { value: 'SZ', label: 'Eswatini' },
  { value: 'ET', label: 'Ethiopia' },
  { value: 'FJ', label: 'Fiji' },
  { value: 'FI', label: 'Finland' },
  { value: 'FR', label: 'France' },
  { value: 'GA', label: 'Gabon' },
  { value: 'GM', label: 'Gambia' },
  { value: 'GE', label: 'Georgia' },
  { value: 'DE', label: 'Germany' },
  { value: 'GH', label: 'Ghana' },
  { value: 'GR', label: 'Greece' },
  { value: 'GD', label: 'Grenada' },
  { value: 'GT', label: 'Guatemala' },
  { value: 'GN', label: 'Guinea' },
  { value: 'GW', label: 'Guinea-Bissau' },
  { value: 'GY', label: 'Guyana' },
  { value: 'HT', label: 'Haiti' },
  { value: 'HN', label: 'Honduras' },
  { value: 'HU', label: 'Hungary' },
  { value: 'IS', label: 'Iceland' },
  { value: 'IN', label: 'India' },
  { value: 'ID', label: 'Indonesia' },
  { value: 'IR', label: 'Iran' },
  { value: 'IQ', label: 'Iraq' },
  { value: 'IE', label: 'Ireland' },
  { value: 'IL', label: 'Israel' },
  { value: 'IT', label: 'Italy' },
  { value: 'JM', label: 'Jamaica' },
  { value: 'JP', label: 'Japan' },
  { value: 'JO', label: 'Jordan' },
  { value: 'KZ', label: 'Kazakhstan' },
  { value: 'KE', label: 'Kenya' },
  { value: 'KI', label: 'Kiribati' },
  { value: 'KP', label: 'Korea (North)' },
  { value: 'KR', label: 'Korea (South)' },
  { value: 'KW', label: 'Kuwait' },
  { value: 'KG', label: 'Kyrgyzstan' },
  { value: 'LA', label: 'Laos' },
  { value: 'LV', label: 'Latvia' },
  { value: 'LB', label: 'Lebanon' },
  { value: 'LS', label: 'Lesotho' },
  { value: 'LR', label: 'Liberia' },
  { value: 'LY', label: 'Libya' },
  { value: 'LI', label: 'Liechtenstein' },
  { value: 'LT', label: 'Lithuania' },
  { value: 'LU', label: 'Luxembourg' },
  { value: 'MG', label: 'Madagascar' },
  { value: 'MW', label: 'Malawi' },
  { value: 'MY', label: 'Malaysia' },
  { value: 'MV', label: 'Maldives' },
  { value: 'ML', label: 'Mali' },
  { value: 'MT', label: 'Malta' },
  { value: 'MH', label: 'Marshall Islands' },
  { value: 'MR', label: 'Mauritania' },
  { value: 'MU', label: 'Mauritius' },
  { value: 'MX', label: 'Mexico' },
  { value: 'FM', label: 'Micronesia' },
  { value: 'MD', label: 'Moldova' },
  { value: 'MC', label: 'Monaco' },
  { value: 'MN', label: 'Mongolia' },
  { value: 'ME', label: 'Montenegro' },
  { value: 'MA', label: 'Morocco' },
  { value: 'MZ', label: 'Mozambique' },
  { value: 'MM', label: 'Myanmar' },
  { value: 'NA', label: 'Namibia' },
  { value: 'NR', label: 'Nauru' },
  { value: 'NP', label: 'Nepal' },
  { value: 'NL', label: 'Netherlands' },
  { value: 'NZ', label: 'New Zealand' },
  { value: 'NI', label: 'Nicaragua' },
  { value: 'NE', label: 'Niger' },
  { value: 'NG', label: 'Nigeria' },
  { value: 'MK', label: 'North Macedonia' },
  { value: 'NO', label: 'Norway' },
  { value: 'OM', label: 'Oman' },
  { value: 'PK', label: 'Pakistan' },
  { value: 'PW', label: 'Palau' },
  { value: 'PS', label: 'Palestine' },
  { value: 'PA', label: 'Panama' },
  { value: 'PG', label: 'Papua New Guinea' },
  { value: 'PY', label: 'Paraguay' },
  { value: 'PE', label: 'Peru' },
  { value: 'PH', label: 'Philippines' },
  { value: 'PL', label: 'Poland' },
  { value: 'PT', label: 'Portugal' },
  { value: 'QA', label: 'Qatar' },
  { value: 'RO', label: 'Romania' },
  { value: 'RU', label: 'Russia' },
  { value: 'RW', label: 'Rwanda' },
  { value: 'KN', label: 'Saint Kitts and Nevis' },
  { value: 'LC', label: 'Saint Lucia' },
  { value: 'VC', label: 'Saint Vincent and the Grenadines' },
  { value: 'WS', label: 'Samoa' },
  { value: 'SM', label: 'San Marino' },
  { value: 'ST', label: 'Sao Tome and Principe' },
  { value: 'SA', label: 'Saudi Arabia' },
  { value: 'SN', label: 'Senegal' },
  { value: 'RS', label: 'Serbia' },
  { value: 'SC', label: 'Seychelles' },
  { value: 'SL', label: 'Sierra Leone' },
  { value: 'SG', label: 'Singapore' },
  { value: 'SK', label: 'Slovakia' },
  { value: 'SI', label: 'Slovenia' },
  { value: 'SB', label: 'Solomon Islands' },
  { value: 'SO', label: 'Somalia' },
  { value: 'ZA', label: 'South Africa' },
  { value: 'SS', label: 'South Sudan' },
  { value: 'ES', label: 'Spain' },
  { value: 'LK', label: 'Sri Lanka' },
  { value: 'SD', label: 'Sudan' },
  { value: 'SR', label: 'Suriname' },
  { value: 'SE', label: 'Sweden' },
  { value: 'CH', label: 'Switzerland' },
  { value: 'SY', label: 'Syria' },
  { value: 'TW', label: 'Taiwan' },
  { value: 'TJ', label: 'Tajikistan' },
  { value: 'TZ', label: 'Tanzania' },
  { value: 'TH', label: 'Thailand' },
  { value: 'TL', label: 'Timor-Leste' },
  { value: 'TG', label: 'Togo' },
  { value: 'TO', label: 'Tonga' },
  { value: 'TT', label: 'Trinidad and Tobago' },
  { value: 'TN', label: 'Tunisia' },
  { value: 'TR', label: 'Turkey' },
  { value: 'TM', label: 'Turkmenistan' },
  { value: 'TV', label: 'Tuvalu' },
  { value: 'UG', label: 'Uganda' },
  { value: 'UA', label: 'Ukraine' },
  { value: 'AE', label: 'United Arab Emirates' },
  { value: 'GB', label: 'United Kingdom' },
  { value: 'US', label: 'United States' },
  { value: 'UY', label: 'Uruguay' },
  { value: 'UZ', label: 'Uzbekistan' },
  { value: 'VU', label: 'Vanuatu' },
  { value: 'VA', label: 'Vatican City' },
  { value: 'VE', label: 'Venezuela' },
  { value: 'VN', label: 'Vietnam' },
  { value: 'YE', label: 'Yemen' },
  { value: 'ZM', label: 'Zambia' },
  { value: 'ZW', label: 'Zimbabwe' }
].sort((a, b) => a.label.localeCompare(b.label));

const messageSuggestions = [
  "You make my heart skip a beat every single day. Happy Valentine's Day to the love of my life!",
  "Roses are red, violets are blue, no one in this world means more to me than you!",
  "Every moment with you is a treasure. Thank you for being my Valentine today and always!",
  "You're my favorite person, my best friend, and my forever Valentine. I love you more than words can say!"
];

const fileToDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Failed to read image file'));
    reader.readAsDataURL(file);
  });

const ValentineForm = ({ onSubmit }) => {
  const [formData, setFormData] = useState({
    name: '',
    country: null,
    partnerCountry: null,
    note: '',
  });
  const [image, setImage] = useState(null);
  const [originalImageSize, setOriginalImageSize] = useState(null);
  const [compressedImageSize, setCompressedImageSize] = useState(null);
  // Audio state removed

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [imagePreview, setImagePreview] = useState(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [cardUrl, setCardUrl] = useState('');
  const [selectedSong, setSelectedSong] = useState(null);
  const [showSpotifyModal, setShowSpotifyModal] = useState(false);
  const [isPlayingSong, setIsPlayingSong] = useState(false);
  const [customSlug, setCustomSlug] = useState('');
  const [isSlugValid, setIsSlugValid] = useState(true);
  const songPlayerRef = useRef(null);

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleCountryChange = (selectedOption) => {
    setFormData({
      ...formData,
      country: selectedOption?.value || null
    });
  };

  const handlePartnerCountryChange = (selectedOption) => {
    setFormData({
      ...formData,
      partnerCountry: selectedOption?.value || null
    });
  };

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file
    const validation = validateImageFile(file, 5);
    if (!validation.valid) {
      setError(validation.error);
      e.target.value = '';
      return;
    }

    // Store original size
    setOriginalImageSize(file.size);

    try {
      // Compress image to target ~100KB
      const compressedFile = await compressImageToTargetSize(file, 100);
      setCompressedImageSize(compressedFile.size);

      // Create preview
      const previewUrl = createImagePreview(compressedFile);
      setImagePreview(previewUrl);
      setImage(compressedFile);
      setError('');
    } catch (error) {
      console.error('Image processing error:', error);
      setError('Failed to process image. Please try again.');
      e.target.value = '';
    }
  };

  // Audio handlers removed

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

    if (!formData.name.trim() || !formData.note.trim() || !formData.country || !formData.partnerCountry) {
      setError('Please complete all required fields before creating your card.');
      return;
    }

    // Prevent submission if slug is invalid
    if (customSlug && !isSlugValid) {
      setError('Please fix the slug validation errors before submitting');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const valentineId = uuidv4();
      let imageUrl = null;
      // Audio URL removed

      // Upload image if exists
      if (image) {
        try {
          imageUrl = await uploadToCloudinary(image);
        } catch (uploadError) {
          console.warn('Cloudinary upload failed. Falling back to inline image data.', uploadError);
        }

        // Fallback: persist compressed image directly when remote upload is unavailable
        if (!imageUrl) {
          imageUrl = await fileToDataUrl(image);
        }
      }

      // Upload audio if exists
      // Audio upload logic removed

      // Save to Firebase
      const valentineDoc = doc(db, 'valentines', valentineId);
      await setDoc(valentineDoc, {
        name: formData.name,
        country: formData.country,
        partnerCountry: formData.partnerCountry,
        note: formData.note,
        slug: customSlug,
        imageUrl,
        // Audio fields removed
        song: selectedSong,
        response: null,
        createdAt: Date.now(),
      });

      // Save custom slug if provided
      if (customSlug) {
        const slugDoc = doc(db, 'slugs', customSlug);
        await setDoc(slugDoc, {
          slug: customSlug,
          cardType: 'valentine',
          cardId: valentineId,
          createdAt: Date.now()
        });
      }

      const url = customSlug
        ? `${window.location.origin}/valentine/${customSlug}`
        : `${window.location.origin}/valentine/${valentineId}`;
      setCardUrl(url);
      setShowShareModal(true);
      onSubmit?.(customSlug || valentineId);
    } catch (err) {
      setError('Error creating valentine. Please try again.');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loader />;

  return (
    <>
      <div className="form-page-container">
        <FormBackButton onClick={() => window.history.back()} />
        <div
          className="form-page-background"
          style={{ backgroundImage: `url(${valentineBg})` }}
        />

        <div className="glass-form-card">
          <div className="glass-form-header">

            <h1 className="glass-form-title">Create Valentine Card</h1>
            <p className="glass-form-subtitle">Express your love</p>
          </div>

          {error && (
            <div style={{
              padding: '1rem',
              background: 'rgba(255, 0, 0, 0.1)',
              border: '1px solid rgba(255, 0, 0, 0.3)',
              borderRadius: '8px',
              color: '#c00',
              marginBottom: '1rem'
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="glass-form">
            <div className="glass-form-section">
              <h3 className="glass-section-title">
                <User size={20} /> Recipient Information
              </h3>
              <div className="glass-form-row">
                <div className="glass-form-group">
                  <label className="glass-form-label">Recipient's Name</label>
                  <input
                    type="text"
                    name="name"
                    required
                    className="glass-form-input"
                    placeholder="Their name"
                    value={formData.name}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="glass-form-group">
                  <label className="glass-form-label">
                    <Globe size={16} style={{ display: 'inline', marginRight: '0.5rem' }} />
                    Country
                  </label>
                  <Select
                    options={countries}
                    value={countries.find((country) => country.value === formData.country) || null}
                    onChange={handleCountryChange}
                    placeholder="Select a country"
                    isSearchable
                    required
                    styles={{
                      control: (base) => ({
                        ...base,
                        background: 'rgba(255, 255, 255, 0.4)',
                        border: '1px solid rgba(255, 255, 255, 0.5)',
                        borderRadius: '12px',
                        padding: '0.375rem 0.5rem',
                        color: '#1a1a1a'
                      }),
                      menu: (base) => ({
                        ...base,
                        background: 'rgba(255, 255, 255, 0.95)',
                        backdropFilter: 'blur(10px)',
                        borderRadius: '12px'
                      }),
                      option: (base, state) => ({
                        ...base,
                        background: state.isFocused ? 'rgba(0, 0, 0, 0.1)' : 'transparent',
                        color: '#1a1a1a'
                      })
                    }}
                  />
                </div>
                <div className="glass-form-group">
                  <label className="glass-form-label">
                    <Globe size={16} style={{ display: 'inline', marginRight: '0.5rem' }} />
                    Your Country
                  </label>
                  <Select
                    options={countries}
                    value={countries.find((country) => country.value === formData.partnerCountry) || null}
                    onChange={handlePartnerCountryChange}
                    placeholder="Select your country"
                    isSearchable
                    required
                    styles={{
                      control: (base) => ({
                        ...base,
                        background: 'rgba(255, 255, 255, 0.4)',
                        border: '1px solid rgba(255, 255, 255, 0.5)',
                        borderRadius: '12px',
                        padding: '0.375rem 0.5rem',
                        color: '#1a1a1a'
                      }),
                      menu: (base) => ({
                        ...base,
                        background: 'rgba(255, 255, 255, 0.95)',
                        backdropFilter: 'blur(10px)',
                        borderRadius: '12px'
                      }),
                      option: (base, state) => ({
                        ...base,
                        background: state.isFocused ? 'rgba(0, 0, 0, 0.1)' : 'transparent',
                        color: '#1a1a1a'
                      })
                    }}
                  />
                </div>
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
                    onClick={() => setFormData({ ...formData, note: suggestion })}
                  >
                    Suggestion {index + 1}
                  </button>
                ))}
              </div>
              <div className="glass-form-group">
                <textarea
                  name="note"
                  required
                  className="glass-form-textarea"
                  rows="5"
                  placeholder="Write your Valentine's message or choose a suggestion above..."
                  value={formData.note}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <div className="glass-form-section">
              <SlugInput
                value={customSlug}
                onChange={setCustomSlug}
                cardType="valentine"
                onValidationChange={setIsSlugValid}
              />
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
                <ImageIcon size={20} /> Special Memory Photo (Optional)
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
                        setImage(null);
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
                    <span>Upload Photo</span>
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
            {/* Voice Message Section Removed */}

            <button type="submit" className="glass-submit-btn" disabled={loading}>
              {loading ? 'Creating...' : 'Create'}
            </button>
          </form>
        </div>
      </div>

      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        cardUrl={cardUrl}
        cardType="Valentine"
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

export default ValentineForm;
