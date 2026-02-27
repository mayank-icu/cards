import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { v4 as uuidv4 } from 'uuid';
import { Heart, User, MessageSquare, Upload, Image as ImageIcon, MapPin, Music, Play, Pause, X, Plus } from 'lucide-react';
import { uploadToCloudinary } from '../../utils/cloudinary';
import { compressImageToTargetSize, validateImageFile, formatFileSize, createImagePreview, revokeImagePreview } from '../../utils/imageCompression';
import ShareModal from '../../components/ShareModal';
import SpotifyModal from '../../components/SpotifyModal';
import Loader from '../../components/Loader';
import SlugInput from '../../components/SlugInput';
import FormBackButton from '../../components/FormBackButton';
import { useAuth } from '../../contexts/AuthContext';
import '../../components/SharedFormStyles.css';
import longDistanceBg from '../../assets/backgrounds/long-distance.webp';

const CreateLongDistance = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        partnerName: '',
        yourName: '',
        distance: '',
        message: '',
        imageUrl: '',
        yourCountry: '',
        theirCountry: '',
        yourTimezone: '',
        theirTimezone: '',
        willMeet: false
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
    const { currentUser } = useAuth();
    const [customSlug, setCustomSlug] = useState('');
    const songPlayerRef = useRef(null);

    const handleBack = () => {
        navigate('/');
    };

    // Complete list of all countries
    const allCountries = [
        'Afghanistan', 'Albania', 'Algeria', 'Andorra', 'Angola', 'Antigua and Barbuda', 'Argentina', 'Armenia', 'Australia', 'Austria', 'Azerbaijan',
        'Bahamas', 'Bahrain', 'Bangladesh', 'Barbados', 'Belarus', 'Belgium', 'Belize', 'Benin', 'Bhutan', 'Bolivia', 'Bosnia and Herzegovina', 'Botswana', 'Brazil', 'Brunei', 'Bulgaria', 'Burkina Faso', 'Burundi',
        'Cabo Verde', 'Cambodia', 'Cameroon', 'Canada', 'Central African Republic', 'Chad', 'Chile', 'China', 'Colombia', 'Comoros', 'Congo', 'Costa Rica', 'Croatia', 'Cuba', 'Cyprus', 'Czech Republic',
        'Denmark', 'Djibouti', 'Dominica', 'Dominican Republic',
        'Ecuador', 'Egypt', 'El Salvador', 'Equatorial Guinea', 'Eritrea', 'Estonia', 'Eswatini', 'Ethiopia',
        'Fiji', 'Finland', 'France',
        'Gabon', 'Gambia', 'Georgia', 'Germany', 'Ghana', 'Greece', 'Grenada', 'Guatemala', 'Guinea', 'Guinea-Bissau', 'Guyana',
        'Haiti', 'Holy See', 'Honduras', 'Hungary',
        'Iceland', 'India', 'Indonesia', 'Iran', 'Iraq', 'Ireland', 'Israel', 'Italy',
        'Jamaica', 'Japan', 'Jordan',
        'Kazakhstan', 'Kenya', 'Kiribati', 'Kuwait', 'Kyrgyzstan',
        'Laos', 'Latvia', 'Lebanon', 'Lesotho', 'Liberia', 'Libya', 'Liechtenstein', 'Lithuania', 'Luxembourg',
        'Madagascar', 'Malawi', 'Malaysia', 'Maldives', 'Mali', 'Malta', 'Marshall Islands', 'Mauritania', 'Mauritius', 'Mexico', 'Micronesia', 'Moldova', 'Monaco', 'Mongolia', 'Montenegro', 'Morocco', 'Mozambique', 'Myanmar',
        'Namibia', 'Nauru', 'Nepal', 'Netherlands', 'New Zealand', 'Nicaragua', 'Niger', 'Nigeria', 'North Korea', 'North Macedonia', 'Norway',
        'Oman',
        'Pakistan', 'Palau', 'Palestine State', 'Panama', 'Papua New Guinea', 'Paraguay', 'Peru', 'Philippines', 'Poland', 'Portugal',
        'Qatar',
        'Romania', 'Russia', 'Rwanda',
        'Saint Kitts and Nevis', 'Saint Lucia', 'Saint Vincent and the Grenadines', 'Samoa', 'San Marino', 'Sao Tome and Principe', 'Saudi Arabia', 'Senegal', 'Serbia', 'Seychelles', 'Sierra Leone', 'Singapore', 'Slovakia', 'Slovenia', 'Solomon Islands', 'Somalia', 'South Africa', 'South Korea', 'South Sudan', 'Spain', 'Sri Lanka', 'Sudan', 'Suriname', 'Sweden', 'Switzerland', 'Syria',
        'Taiwan', 'Tajikistan', 'Tanzania', 'Thailand', 'Timor-Leste', 'Togo', 'Tonga', 'Trinidad and Tobago', 'Tunisia', 'Turkey', 'Turkmenistan', 'Tuvalu',
        'Uganda', 'Ukraine', 'United Arab Emirates', 'United Kingdom', 'United States', 'Uruguay', 'Uzbekistan',
        'Vanuatu', 'Venezuela', 'Vietnam',
        'Yemen',
        'Zambia', 'Zimbabwe'
    ];

    // Searchable country input component
    const CountrySearchInput = ({ value, onChange, placeholder, label }) => {
        const [searchTerm, setSearchTerm] = useState(value || '');
        const [showDropdown, setShowDropdown] = useState(false);
        const [filteredCountries, setFilteredCountries] = useState([]);

        useEffect(() => {
            if (searchTerm) {
                const filtered = allCountries.filter(country =>
                    country.toLowerCase().includes(searchTerm.toLowerCase())
                );
                setFilteredCountries(filtered.slice(0, 10)); // Limit to 10 results
            } else {
                setFilteredCountries([]);
            }
        }, [searchTerm]);

        const handleInputChange = (e) => {
            setSearchTerm(e.target.value);
            setShowDropdown(true);
        };

        const handleCountrySelect = (country) => {
            setSearchTerm(country);
            onChange(country);
            setShowDropdown(false);
        };

        const handleInputFocus = () => {
            setShowDropdown(true);
            if (!searchTerm) {
                setFilteredCountries(allCountries.slice(0, 10)); // Show first 10 countries
            }
        };

        const handleInputBlur = () => {
            // Delay hiding dropdown to allow click on options
            setTimeout(() => setShowDropdown(false), 200);
        };

        return (
            <div className="glass-form-group">
                <label className="glass-form-label">{label}</label>
                <div className="country-search-container" style={{ position: 'relative' }}>
                    <input
                        type="text"
                        required
                        className="glass-form-input"
                        placeholder={placeholder}
                        value={searchTerm}
                        onChange={handleInputChange}
                        onFocus={handleInputFocus}
                        onBlur={handleInputBlur}
                        style={{ paddingRight: '30px' }}
                    />
                    <MapPin size={18} style={{ 
                        position: 'absolute', 
                        right: '12px', 
                        top: '50%', 
                        transform: 'translateY(-50%)',
                        color: '#64748b'
                    }} />
                    
                    {showDropdown && filteredCountries.length > 0 && (
                        <div className="country-dropdown" style={{
                            position: 'absolute',
                            top: '100%',
                            left: 0,
                            right: 0,
                            background: 'white',
                            border: '1px solid #e2e8f0',
                            borderRadius: '8px',
                            maxHeight: '200px',
                            overflowY: 'auto',
                            zIndex: 1000,
                            boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                        }}>
                            {filteredCountries.map((country, index) => (
                                <div
                                    key={index}
                                    className="country-option"
                                    style={{
                                        padding: '10px 15px',
                                        cursor: 'pointer',
                                        borderBottom: index < filteredCountries.length - 1 ? '1px solid #f1f5f9' : 'none',
                                        transition: 'background-color 0.2s'
                                    }}
                                    onMouseEnter={(e) => e.target.style.backgroundColor = '#f8fafc'}
                                    onMouseLeave={(e) => e.target.style.backgroundColor = 'white'}
                                    onClick={() => handleCountrySelect(country)}
                                >
                                    {country}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        );
    };

    // Country timezone mappings (UTC offset)
    const countryTimezones = {
        'Afghanistan': 4.5, 'Albania': 1, 'Algeria': 1, 'Andorra': 1, 'Angola': 1, 'Antigua and Barbuda': -4, 'Argentina': -3, 'Armenia': 4, 'Australia': 10, 'Austria': 1, 'Azerbaijan': 4,
        'Bahamas': -5, 'Bahrain': 3, 'Bangladesh': 6, 'Barbados': -4, 'Belarus': 3, 'Belgium': 1, 'Belize': -6, 'Benin': 1, 'Bhutan': 6, 'Bolivia': -4, 'Bosnia and Herzegovina': 1, 'Botswana': 2, 'Brazil': -3, 'Brunei': 8, 'Bulgaria': 2, 'Burkina Faso': 0, 'Burundi': 2,
        'Cabo Verde': -1, 'Cambodia': 7, 'Cameroon': 1, 'Canada': -5, 'Central African Republic': 1, 'Chad': 1, 'Chile': -4, 'China': 8, 'Colombia': -5, 'Comoros': 3, 'Congo': 1, 'Costa Rica': -6, 'Croatia': 1, 'Cuba': -5, 'Cyprus': 2, 'Czech Republic': 1,
        'Denmark': 1, 'Djibouti': 3, 'Dominica': -4, 'Dominican Republic': -4,
        'Ecuador': -5, 'Egypt': 2, 'El Salvador': -6, 'Equatorial Guinea': 1, 'Eritrea': 3, 'Estonia': 2, 'Eswatini': 2, 'Ethiopia': 3,
        'Fiji': 12, 'Finland': 2, 'France': 1,
        'Gabon': 1, 'Gambia': 0, 'Georgia': 4, 'Germany': 1, 'Ghana': 0, 'Greece': 2, 'Grenada': -4, 'Guatemala': -6, 'Guinea': 0, 'Guinea-Bissau': 0, 'Guyana': -4,
        'Haiti': -5, 'Holy See': 1, 'Honduras': -6, 'Hungary': 1,
        'Iceland': 0, 'India': 5.5, 'Indonesia': 7, 'Iran': 3.5, 'Iraq': 3, 'Ireland': 0, 'Israel': 2, 'Italy': 1,
        'Jamaica': -5, 'Japan': 9, 'Jordan': 3,
        'Kazakhstan': 6, 'Kenya': 3, 'Kiribati': 12, 'Kuwait': 3, 'Kyrgyzstan': 6,
        'Laos': 7, 'Latvia': 2, 'Lebanon': 2, 'Lesotho': 2, 'Liberia': 0, 'Libya': 2, 'Liechtenstein': 1, 'Lithuania': 2, 'Luxembourg': 1,
        'Madagascar': 3, 'Malawi': 2, 'Malaysia': 8, 'Maldives': 5, 'Mali': 0, 'Malta': 1, 'Marshall Islands': 12, 'Mauritania': 0, 'Mauritius': 4, 'Mexico': -6, 'Micronesia': 10, 'Moldova': 2, 'Monaco': 1, 'Mongolia': 8, 'Montenegro': 1, 'Morocco': 1, 'Mozambique': 2, 'Myanmar': 6.5,
        'Namibia': 2, 'Nauru': 12, 'Nepal': 5.75, 'Netherlands': 1, 'New Zealand': 12, 'Nicaragua': -6, 'Niger': 1, 'Nigeria': 1, 'North Korea': 9, 'North Macedonia': 1, 'Norway': 1,
        'Oman': 4,
        'Pakistan': 5, 'Palau': 9, 'Palestine State': 3, 'Panama': -5, 'Papua New Guinea': 10, 'Paraguay': -4, 'Peru': -5, 'Philippines': 8, 'Poland': 1, 'Portugal': 0,
        'Qatar': 3,
        'Romania': 2, 'Russia': 3, 'Rwanda': 2,
        'Saint Kitts and Nevis': -4, 'Saint Lucia': -4, 'Saint Vincent and the Grenadines': -4, 'Samoa': -11, 'San Marino': 1, 'Sao Tome and Principe': 0, 'Saudi Arabia': 3, 'Senegal': 0, 'Serbia': 1, 'Seychelles': 4, 'Sierra Leone': 0, 'Singapore': 8, 'Slovakia': 1, 'Slovenia': 1, 'Solomon Islands': 11, 'Somalia': 3, 'South Africa': 2, 'South Korea': 9, 'South Sudan': 3, 'Spain': 1, 'Sri Lanka': 5.5, 'Sudan': 2, 'Suriname': -3, 'Sweden': 1, 'Switzerland': 1, 'Syria': 2,
        'Taiwan': 8, 'Tajikistan': 5, 'Tanzania': 3, 'Thailand': 7, 'Timor-Leste': 9, 'Togo': 0, 'Tonga': 13, 'Trinidad and Tobago': -4, 'Tunisia': 1, 'Turkey': 3, 'Turkmenistan': 5, 'Tuvalu': 12,
        'Uganda': 3, 'Ukraine': 2, 'United Arab Emirates': 4, 'United Kingdom': 0, 'United States': -5, 'Uruguay': -3, 'Uzbekistan': 5,
        'Vanuatu': 11, 'Venezuela': -4, 'Vietnam': 7,
        'Yemen': 3,
        'Zambia': 2, 'Zimbabwe': 2
    };

    // Calculate distance between countries (rough estimates)
    const calculateDistance = (country1, country2) => {
        const countryCoordinates = {
            'Afghanistan': { lat: 33.9391, lng: 67.7100 },
            'Albania': { lat: 41.1533, lng: 20.1683 },
            'Algeria': { lat: 28.0339, lng: 1.6596 },
            'Andorra': { lat: 42.5063, lng: 1.5218 },
            'Angola': { lat: -11.2027, lng: 17.8739 },
            'Antigua and Barbuda': { lat: 17.0608, lng: -61.7964 },
            'Argentina': { lat: -38.4161, lng: -63.6167 },
            'Armenia': { lat: 40.0691, lng: 45.0382 },
            'Australia': { lat: -25.2744, lng: 133.7751 },
            'Austria': { lat: 47.5162, lng: 14.5501 },
            'Azerbaijan': { lat: 40.1431, lng: 47.5769 },
            'Bahamas': { lat: 25.0343, lng: -77.3963 },
            'Bahrain': { lat: 26.0667, lng: 50.5577 },
            'Bangladesh': { lat: 23.6850, lng: 90.3563 },
            'Barbados': { lat: 13.1939, lng: -59.5432 },
            'Belarus': { lat: 53.7098, lng: 27.9564 },
            'Belgium': { lat: 50.5039, lng: 4.4699 },
            'Belize': { lat: 17.1899, lng: -88.4976 },
            'Benin': { lat: 9.3077, lng: 2.3158 },
            'Bhutan': { lat: 27.5142, lng: 90.4336 },
            'Bolivia': { lat: -16.2902, lng: -63.5887 },
            'Bosnia and Herzegovina': { lat: 43.9159, lng: 17.6791 },
            'Botswana': { lat: -22.3285, lng: 24.6849 },
            'Brazil': { lat: -14.2350, lng: -51.9253 },
            'Brunei': { lat: 4.5353, lng: 114.7277 },
            'Bulgaria': { lat: 42.7339, lng: 25.4858 },
            'Burkina Faso': { lat: 12.2383, lng: -1.5616 },
            'Burundi': { lat: -3.3731, lng: 29.9189 },
            'Cabo Verde': { lat: 16.0021, lng: -24.0132 },
            'Cambodia': { lat: 12.5657, lng: 104.9910 },
            'Cameroon': { lat: 7.3697, lng: 12.3547 },
            'Canada': { lat: 56.1304, lng: -106.3468 },
            'Central African Republic': { lat: 6.6111, lng: 20.9394 },
            'Chad': { lat: 15.4542, lng: 18.7322 },
            'Chile': { lat: -35.6751, lng: -71.5430 },
            'China': { lat: 35.8617, lng: 104.1954 },
            'Colombia': { lat: 4.5709, lng: -74.2973 },
            'Comoros': { lat: -11.8750, lng: 43.8722 },
            'Congo': { lat: -4.0383, lng: 21.7587 },
            'Costa Rica': { lat: 9.7489, lng: -83.7534 },
            'Croatia': { lat: 45.1000, lng: 15.2000 },
            'Cuba': { lat: 23.1136, lng: -82.3666 },
            'Cyprus': { lat: 35.1264, lng: 33.4299 },
            'Czech Republic': { lat: 49.8175, lng: 15.4730 },
            'Denmark': { lat: 56.2639, lng: 9.5018 },
            'Djibouti': { lat: 11.8251, lng: 42.5903 },
            'Dominica': { lat: 15.4150, lng: -61.3710 },
            'Dominican Republic': { lat: 18.7357, lng: -70.1627 },
            'Ecuador': { lat: -1.8312, lng: -78.1834 },
            'Egypt': { lat: 26.8206, lng: 30.8025 },
            'El Salvador': { lat: 13.7942, lng: -88.8965 },
            'Equatorial Guinea': { lat: 1.6508, lng: 10.2679 },
            'Eritrea': { lat: 15.1794, lng: 39.7823 },
            'Estonia': { lat: 58.5953, lng: 25.0136 },
            'Eswatini': { lat: -26.5225, lng: 31.4659 },
            'Ethiopia': { lat: 9.1450, lng: 40.4897 },
            'Fiji': { lat: -17.7134, lng: 178.0650 },
            'Finland': { lat: 61.9241, lng: 25.7482 },
            'France': { lat: 46.2276, lng: 2.2137 },
            'Gabon': { lat: -0.8037, lng: 11.6094 },
            'Gambia': { lat: 13.4432, lng: -15.3101 },
            'Georgia': { lat: 42.3154, lng: 43.3569 },
            'Germany': { lat: 51.1657, lng: 10.4515 },
            'Ghana': { lat: 7.9465, lng: -1.0232 },
            'Greece': { lat: 39.0742, lng: 21.8243 },
            'Grenada': { lat: 12.2628, lng: -61.6042 },
            'Guatemala': { lat: 15.7835, lng: -90.2308 },
            'Guinea': { lat: 9.9456, lng: -9.6966 },
            'Guinea-Bissau': { lat: 11.8037, lng: -15.1804 },
            'Guyana': { lat: 4.8604, lng: -58.9302 },
            'Haiti': { lat: 18.9719, lng: -72.2852 },
            'Holy See': { lat: 41.9029, lng: 12.4534 },
            'Honduras': { lat: 14.0723, lng: -87.1921 },
            'Hungary': { lat: 47.1625, lng: 19.5033 },
            'Iceland': { lat: 64.1466, lng: -21.9426 },
            'India': { lat: 20.5937, lng: 78.9629 },
            'Indonesia': { lat: -0.7893, lng: 113.9213 },
            'Iran': { lat: 32.4279, lng: 53.6880 },
            'Iraq': { lat: 33.2232, lng: 43.6793 },
            'Ireland': { lat: 53.4129, lng: -8.2439 },
            'Israel': { lat: 31.0461, lng: 34.8516 },
            'Italy': { lat: 41.8719, lng: 12.5674 },
            'Jamaica': { lat: 18.1096, lng: -77.2975 },
            'Japan': { lat: 36.2048, lng: 138.2529 },
            'Jordan': { lat: 30.5852, lng: 36.2384 },
            'Kazakhstan': { lat: 48.0196, lng: 66.9237 },
            'Kenya': { lat: -0.0236, lng: 37.9062 },
            'Kiribati': { lat: -3.3704, lng: -168.6988 },
            'Kuwait': { lat: 29.3117, lng: 47.4818 },
            'Kyrgyzstan': { lat: 41.2044, lng: 74.7661 },
            'Laos': { lat: 19.8563, lng: 102.4955 },
            'Latvia': { lat: 56.8796, lng: 24.6032 },
            'Lebanon': { lat: 33.8547, lng: 35.8623 },
            'Lesotho': { lat: -29.6099, lng: 28.2336 },
            'Liberia': { lat: 6.4281, lng: -9.4295 },
            'Libya': { lat: 26.3351, lng: 17.2283 },
            'Liechtenstein': { lat: 47.1660, lng: 9.5554 },
            'Lithuania': { lat: 55.1694, lng: 23.8813 },
            'Luxembourg': { lat: 49.6153, lng: 6.1296 },
            'Madagascar': { lat: -18.7669, lng: 46.8691 },
            'Malawi': { lat: -13.2543, lng: 34.3015 },
            'Malaysia': { lat: 4.2105, lng: 101.9758 },
            'Maldives': { lat: 3.2028, lng: 73.2207 },
            'Mali': { lat: 17.5707, lng: -3.9962 },
            'Malta': { lat: 35.9375, lng: 14.3754 },
            'Marshall Islands': { lat: 7.1315, lng: 171.1845 },
            'Mauritania': { lat: 21.0079, lng: -10.9408 },
            'Mauritius': { lat: -20.3484, lng: 57.5522 },
            'Mexico': { lat: 23.6345, lng: -102.5528 },
            'Micronesia': { lat: 7.4256, lng: 150.5508 },
            'Moldova': { lat: 47.4116, lng: 28.3699 },
            'Monaco': { lat: 43.7503, lng: 7.4128 },
            'Mongolia': { lat: 46.8625, lng: 103.8467 },
            'Montenegro': { lat: 42.7087, lng: 19.3744 },
            'Morocco': { lat: 31.7917, lng: -7.0926 },
            'Mozambique': { lat: -18.6657, lng: 35.5296 },
            'Myanmar': { lat: 21.9162, lng: 95.9560 },
            'Namibia': { lat: -22.9576, lng: 18.4904 },
            'Nauru': { lat: -0.5478, lng: 166.9313 },
            'Nepal': { lat: 28.3949, lng: 84.1240 },
            'Netherlands': { lat: 52.1326, lng: 5.2913 },
            'New Zealand': { lat: -40.9006, lng: 174.8860 },
            'Nicaragua': { lat: 12.8654, lng: -85.2072 },
            'Niger': { lat: 17.6078, lng: 8.0817 },
            'Nigeria': { lat: 9.0820, lng: 8.6753 },
            'North Korea': { lat: 40.3399, lng: 127.5101 },
            'North Macedonia': { lat: 41.6086, lng: 21.7453 },
            'Norway': { lat: 60.4720, lng: 8.4689 },
            'Oman': { lat: 21.4735, lng: 55.9754 },
            'Pakistan': { lat: 30.3753, lng: 69.3451 },
            'Palau': { lat: 7.51498, lng: 134.5825 },
            'Palestine State': { lat: 31.9522, lng: 35.2332 },
            'Panama': { lat: 8.5380, lng: -80.7821 },
            'Papua New Guinea': { lat: -6.314993, lng: 143.95555 },
            'Paraguay': { lat: -23.4425, lng: -58.4438 },
            'Peru': { lat: -9.1900, lng: -75.0152 },
            'Philippines': { lat: 12.8797, lng: 121.7740 },
            'Poland': { lat: 51.9194, lng: 19.1451 },
            'Portugal': { lat: 39.3999, lng: -8.2245 },
            'Qatar': { lat: 25.3548, lng: 51.1839 },
            'Romania': { lat: 45.9432, lng: 24.9668 },
            'Russia': { lat: 61.5240, lng: 105.3188 },
            'Rwanda': { lat: -1.9403, lng: 29.8739 },
            'Saint Kitts and Nevis': { lat: 17.3578, lng: -62.7823 },
            'Saint Lucia': { lat: 13.9094, lng: -60.9789 },
            'Saint Vincent and the Grenadines': { lat: 12.9843, lng: -61.2872 },
            'Samoa': { lat: -13.8506, lng: -171.7513 },
            'San Marino': { lat: 43.9424, lng: 12.4578 },
            'Sao Tome and Principe': { lat: 0.1864, lng: 6.6131 },
            'Saudi Arabia': { lat: 23.8859, lng: 45.0792 },
            'Senegal': { lat: 14.4974, lng: -14.4524 },
            'Serbia': { lat: 44.8176, lng: 20.4677 },
            'Seychelles': { lat: -4.6796, lng: 55.4920 },
            'Sierra Leone': { lat: 8.4606, lng: -11.7799 },
            'Singapore': { lat: 1.3521, lng: 103.8198 },
            'Slovakia': { lat: 48.6690, lng: 19.6990 },
            'Slovenia': { lat: 46.1512, lng: 14.9955 },
            'Solomon Islands': { lat: -9.6457, lng: 160.1562 },
            'Somalia': { lat: 5.1521, lng: 46.1996 },
            'South Africa': { lat: -30.5595, lng: 22.9375 },
            'South Korea': { lat: 35.9078, lng: 127.7669 },
            'South Sudan': { lat: 6.8770, lng: 31.3070 },
            'Spain': { lat: 40.4637, lng: -3.7492 },
            'Sri Lanka': { lat: 7.8731, lng: 80.7718 },
            'Sudan': { lat: 12.8628, lng: 30.2176 },
            'Suriname': { lat: 3.9193, lng: -56.0278 },
            'Sweden': { lat: 60.1282, lng: 18.6435 },
            'Switzerland': { lat: 46.8182, lng: 8.2275 },
            'Syria': { lat: 34.8021, lng: 38.9968 },
            'Taiwan': { lat: 23.6978, lng: 120.9605 },
            'Tajikistan': { lat: 38.8610, lng: 71.2761 },
            'Tanzania': { lat: -6.3690, lng: 34.8888 },
            'Thailand': { lat: 15.8700, lng: 100.9925 },
            'Timor-Leste': { lat: -8.8742, lng: 125.7275 },
            'Togo': { lat: 8.6195, lng: 0.8248 },
            'Tonga': { lat: -21.1789, lng: -175.1982 },
            'Trinidad and Tobago': { lat: 10.6918, lng: -61.2225 },
            'Tunisia': { lat: 33.8869, lng: 9.5375 },
            'Turkey': { lat: 38.9637, lng: 35.2433 },
            'Turkmenistan': { lat: 38.9697, lng: 59.5563 },
            'Tuvalu': { lat: -7.1095, lng: 177.6493 },
            'Uganda': { lat: 1.3733, lng: 32.2903 },
            'Ukraine': { lat: 48.3794, lng: 31.1656 },
            'United Arab Emirates': { lat: 23.4241, lng: 53.8478 },
            'United Kingdom': { lat: 55.3781, lng: -3.4360 },
            'United States': { lat: 39.8283, lng: -98.5795 },
            'Uruguay': { lat: -32.5228, lng: -55.7658 },
            'Uzbekistan': { lat: 41.3775, lng: 64.5853 },
            'Vanuatu': { lat: -15.3767, lng: 166.9592 },
            'Venezuela': { lat: 6.4238, lng: -66.5897 },
            'Vietnam': { lat: 14.0583, lng: 108.2772 },
            'Yemen': { lat: 15.5527, lng: 48.5164 },
            'Zambia': { lat: -13.1339, lng: 27.8493 },
            'Zimbabwe': { lat: -19.0154, lng: 29.1549 }
        };

        const coords1 = countryCoordinates[country1];
        const coords2 = countryCoordinates[country2];
        
        if (!coords1 || !coords2) return 'Calculating...';

        const R = 6371; // Earth's radius in km
        const dLat = (coords2.lat - coords1.lat) * Math.PI / 180;
        const dLon = (coords2.lng - coords1.lng) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(coords1.lat * Math.PI / 180) * Math.cos(coords2.lat * Math.PI / 180) *
                  Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        const distance = R * c;

        if (distance < 1000) {
            return `${Math.round(distance)} km`;
        } else {
            return `${(distance / 1000).toFixed(1)}k km`;
        }
    };

    // Auto-calculate timezone and distance when countries change
    useEffect(() => {
        if (formData.yourCountry && formData.theirCountry) {
            const yourTimezone = countryTimezones[formData.yourCountry] || 0;
            const theirTimezone = countryTimezones[formData.theirCountry] || 0;
            const distance = calculateDistance(formData.yourCountry, formData.theirCountry);
            
            setFormData(prev => ({
                ...prev,
                yourTimezone: yourTimezone.toString(),
                theirTimezone: theirTimezone.toString(),
                distance: distance
            }));
        }
    }, [formData.yourCountry, formData.theirCountry]);

    const messageSuggestions = [
        "Distance means so little when you mean so much. Missing you every day and counting down until we're together again!",
        "Even though we're miles apart, you're always in my heart. Can't wait to see you soon!",
        "The distance may be far, but my love for you knows no bounds. Thinking of you always!",
        "Missing you more than words can say. Distance is temporary, but our love is forever!"
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
            const longDistanceId = uuidv4();
            const longDistanceDoc = doc(db, 'long-distance', longDistanceId);
            await setDoc(longDistanceDoc, {
                ...formData,
                names: `${formData.yourName} & ${formData.partnerName}`,
                location1: formData.yourName,
                location2: formData.partnerName,
                song: selectedSong,
                createdAt: Date.now()
            });

            // Save custom slug if provided and user is logged in
            if (customSlug) {
                const slugDoc = doc(db, 'slugs', customSlug);
                await setDoc(slugDoc, {
                    slug: customSlug,
                    cardType: 'long-distance',
                    cardId: longDistanceId,
                    userId: currentUser?.uid || null,
                    createdAt: Date.now()
                });
            }

            const url = customSlug
                ? `${window.location.origin}/long-distance/${customSlug}`
                : `${window.location.origin}/long-distance/${longDistanceId}`;
            setCardUrl(url);
            setShowShareModal(true);
        } catch (error) {
            console.error("Error creating long distance card:", error);
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
                    style={{ backgroundImage: `url(${longDistanceBg})` }}
                />

                <div className="glass-form-card">
                    <div className="glass-form-header">

                        <h1 className="glass-form-title">Long Distance Love Card</h1>
                        <p className="glass-form-subtitle">Bridge the distance with love</p>
                    </div>

                    <form onSubmit={handleSubmit} className="glass-form">
                        <div className="glass-form-section">
                            <h3 className="glass-section-title">
                                <User size={20} /> Connection Details
                            </h3>
                            <div className="glass-form-row">
                                <div className="glass-form-group">
                                    <label className="glass-form-label">Partner's Name</label>
                                    <input
                                        type="text"
                                        required
                                        className="glass-form-input"
                                        placeholder="Their name"
                                        value={formData.partnerName}
                                        onChange={(e) => setFormData({ ...formData, partnerName: e.target.value })}
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

                            {/* Locations & Timezones */}
                            <div className="glass-form-row">
                                <CountrySearchInput
                                    value={formData.yourCountry}
                                    onChange={(value) => setFormData({ ...formData, yourCountry: value })}
                                    placeholder="Search for your country..."
                                    label="Your Country/City"
                                />
                                <CountrySearchInput
                                    value={formData.theirCountry}
                                    onChange={(value) => setFormData({ ...formData, theirCountry: value })}
                                    placeholder="Search for their country..."
                                    label="Their Country/City"
                                />
                            </div>

                            {/* Auto-calculated fields */}
                            {(formData.yourCountry && formData.theirCountry) && (
                                <div className="glass-form-row">
                                    <div className="glass-form-group">
                                        <label className="glass-form-label">Distance (Auto-calculated)</label>
                                        <div className="glass-form-input" style={{ background: '#f0f9ff', color: '#1e40af' }}>
                                            {formData.distance || 'Calculating...'}
                                        </div>
                                    </div>
                                    <div className="glass-form-group">
                                        <label className="glass-form-label">Time Difference (Auto-calculated)</label>
                                        <div className="glass-form-input" style={{ background: '#f0f9ff', color: '#1e40af' }}>
                                            {formData.yourTimezone && formData.theirTimezone ? 
                                                `${Math.abs(parseFloat(formData.theirTimezone) - parseFloat(formData.yourTimezone))} hours` : 
                                                'Calculating...'
                                            }
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div className="glass-form-row">
                                <div className="glass-form-group">
                                    <label className="glass-form-label">Will You Meet?</label>
                                    <div className="radio-group">
                                        <label className={`radio-option ${formData.willMeet === true ? 'selected' : ''}`}>
                                            <input
                                                type="radio"
                                                name="willMeet"
                                                value="true"
                                                checked={formData.willMeet === true}
                                                onChange={() => setFormData({ ...formData, willMeet: true })}
                                            />
                                            <span className="radio-custom"></span>
                                            <span className="radio-label">Yes, we'll meet!</span>
                                        </label>
                                        <label className={`radio-option ${formData.willMeet === false ? 'selected' : ''}`}>
                                            <input
                                                type="radio"
                                                name="willMeet"
                                                value="false"
                                                checked={formData.willMeet === false}
                                                onChange={() => setFormData({ ...formData, willMeet: false })}
                                            />
                                            <span className="radio-custom"></span>
                                            <span className="radio-label">No, long distance</span>
                                        </label>
                                    </div>
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
                                <SlugInput
                                    value={customSlug}
                                    onChange={setCustomSlug}
                                    cardType="long-distance"
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
                cardType="Long Distance"
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

export default CreateLongDistance;

