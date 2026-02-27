import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowRight, Shuffle, Image as ImageIcon, Music, Plus, Play, Pause, X, Info, Eye } from 'lucide-react';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import { v4 as uuidv4 } from 'uuid';
import ShareModal from '../../components/ShareModal';
import SpotifyModal from '../../components/SpotifyModal';
import UnsavedChangesModal from '../../components/UnsavedChangesModal';
import SlugInput from '../../components/SlugInput';
import { useAuth } from '../../contexts/AuthContext';
import { verifyCardCreate } from '../../utils/recaptcha';
import './Bouquet.css';

// Import flower images
import roseImg from '../../assets/bouquet/rose.webp';
import tulipImg from '../../assets/bouquet/tulip.webp';
import lilyImg from '../../assets/bouquet/lily.webp';
import orchidImg from '../../assets/bouquet/orchid.webp';
import peonyImg from '../../assets/bouquet/peony.webp';
import daisyImg from '../../assets/bouquet/daisy.webp';
import carnationImg from '../../assets/bouquet/carnation.webp';
import chrysanthemumImg from '../../assets/bouquet/chrysanthemum.webp';
import lotusImg from '../../assets/bouquet/lotus.webp';
import camelliaImg from '../../assets/bouquet/camellia.webp';

// Import background images
import bg1 from '../../assets/bouquet/1.webp';
import bg2 from '../../assets/bouquet/2.webp';
import bg3 from '../../assets/bouquet/3.webp';
import bg4 from '../../assets/bouquet/4.webp';
import bg5 from '../../assets/bouquet/5.webp';

const FLOWERS = [
    {
        id: 'rose',
        name: 'Rose',
        image: roseImg,
        meaning: 'Love & Passion',
        purpose: 'Perfect for expressing deep romantic love.'
    },
    {
        id: 'tulip',
        name: 'Tulip',
        image: tulipImg,
        meaning: 'Perfect Love',
        purpose: 'Ideal for declaring new love or happy thoughts.'
    },
    {
        id: 'lily',
        name: 'Lily',
        image: lilyImg,
        meaning: 'Purity & Refined Beauty',
        purpose: 'Great for weddings or showing admiration.'
    },
    {
        id: 'orchid',
        name: 'Orchid',
        image: orchidImg,
        meaning: 'Exotic Beauty & Strength',
        purpose: 'For someone unique, strong, and beautiful.'
    },
    {
        id: 'peony',
        name: 'Peony',
        image: peonyImg,
        meaning: 'Prosperity & Romance',
        purpose: 'Often used for good luck and happy relationships.'
    },
    {
        id: 'daisy',
        name: 'Daisy',
        image: daisyImg,
        meaning: 'Innocence & New Beginnings',
        purpose: 'Cheer up a friend or celebrate a fresh start.'
    },
    {
        id: 'carnation',
        name: 'Carnation',
        image: carnationImg,
        meaning: 'Fascination & Love',
        purpose: 'A versatile flower for friends, family, or lovers.'
    },
    {
        id: 'chrysanthemum',
        name: 'Chrysanthemum',
        image: chrysanthemumImg,
        meaning: 'Joy & Optimism',
        purpose: 'Bring happiness and positivity to someone\'s day.'
    },
    {
        id: 'lotus',
        name: 'Lotus',
        image: lotusImg,
        meaning: 'Purity & Enlightenment',
        purpose: 'For spiritual growth or overcoming challenges.'
    },
    {
        id: 'camellia',
        name: 'Camellia',
        image: camelliaImg,
        meaning: 'Adoration & Longing',
        purpose: 'Expressing that you mean it deeply.'
    }
];

const BACKGROUNDS = [bg1, bg2, bg3, bg4, bg5];

const CreateBouquet = () => {
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const location = useLocation();
    const [currentStep, setCurrentStep] = useState(location.state?.currentStep || 1);

    // Store flower objects: { id, uniqueId, x, y, rotation, scale }
    const [selectedFlowers, setSelectedFlowers] = useState(location.state?.selectedFlowers || []);

    const [background, setBackground] = useState(location.state?.background || 0);
    const [messageCard, setMessageCard] = useState(location.state?.messageCard || {
        message: '',
        senderName: '',
        recipientName: ''
    });
    const [selectedSong, setSelectedSong] = useState(location.state?.song || null);
    const [isPlayingSong, setIsPlayingSong] = useState(false);
    const [showSpotifyModal, setShowSpotifyModal] = useState(false);
    const [showShareModal, setShowShareModal] = useState(false);
    const [showUnsavedModal, setShowUnsavedModal] = useState(false);
    const [cardUrl, setCardUrl] = useState('');
    const [loading, setLoading] = useState(false);
    const [viewingMeaning, setViewingMeaning] = useState(null);
    const [customSlug, setCustomSlug] = useState(location.state?.customSlug || '');

    const songPlayerRef = useRef(null);

    const handlePreview = () => {
        const previewData = {
            selectedFlowers,
            background,
            message: messageCard.message,
            senderName: messageCard.senderName,
            recipientName: messageCard.recipientName,
            messageCard: { ...messageCard },
            song: selectedSong,
            customSlug, // Pass this too
            type: 'bouquet',
            version: 2
        };
        // Pass current state so we can restore it when coming back
        navigate('/bouquet/preview', {
            state: {
                previewData,
                returnState: {
                    currentStep: 3, // Return to step 3 always
                    selectedFlowers,
                    background,
                    messageCard,
                    song: selectedSong,
                    customSlug
                }
            }
        });
    };

    // Initial arrangement generation
    const generateRandomPosition = (existingFlowers = []) => {
        let bestCandidate = null;
        let maxMinDist = -1;

        // Try multiple times to find a position with good separation
        for (let i = 0; i < 20; i++) {
            // "Bouquet" cluster logic: Bias towards bottom-center
            const randomX = (Math.random() + Math.random() + Math.random()) / 3;
            const x = 25 + randomX * 50; // 25-75% width
            const y = 30 + Math.random() * 50; // 30-80% height

            // Calculate distance to nearest neighbor
            let minDist = 1000;
            if (existingFlowers.length > 0) {
                for (const f of existingFlowers) {
                    const dx = f.x - x;
                    const dy = f.y - y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < minDist) minDist = dist;
                }
            } else {
                minDist = 100; // First flower has no constraints
            }

            // Keep the candidate that has the best separation so far
            if (minDist > 15 || minDist > maxMinDist) {
                maxMinDist = minDist;
                bestCandidate = { x, y };
                if (minDist > 18) break; // Found a great spot, stop searching
            }
        }

        const { x, y } = bestCandidate || { x: 50, y: 50 };
        const rotation = -15 + Math.random() * 30;
        const scale = 0.9 + Math.random() * 0.35;
        const zIndex = Math.floor(y); // Lower flowers (higher y) appear in front

        return { x, y, rotation, scale, zIndex };
    };

    const handleFlowerInteraction = (flowerId) => {
        // Always ADD (Multiple selection allowed)
        if (selectedFlowers.length < 8) {
            const pos = generateRandomPosition(selectedFlowers);
            const newFlower = {
                id: flowerId,
                uniqueId: uuidv4(),
                ...pos
            };
            setSelectedFlowers([...selectedFlowers, newFlower]);
        }
    };

    const handleFlowerDeselectOne = (e, flowerId) => {
        e.stopPropagation();
        // Remove LAST added instance of this flower
        const flowers = [...selectedFlowers];
        let indexToRemove = -1;
        for (let i = flowers.length - 1; i >= 0; i--) {
            if (flowers[i].id === flowerId) {
                indexToRemove = i;
                break;
            }
        }
        if (indexToRemove !== -1) {
            flowers.splice(indexToRemove, 1);
            setSelectedFlowers(flowers);
        }
    };

    // Explicit Add Button (for Meaning Modal) - always adds if space
    const addFlowerExplicit = (flowerId) => {
        if (selectedFlowers.length < 8) {
            const pos = generateRandomPosition(selectedFlowers);
            const newFlower = {
                id: flowerId,
                uniqueId: uuidv4(),
                ...pos
            };
            setSelectedFlowers([...selectedFlowers, newFlower]);
        }
    };

    const handleFlowerRemove = (uniqueId) => {
        setSelectedFlowers(selectedFlowers.filter(f => f.uniqueId !== uniqueId));
    };

    const shuffleArrangement = () => {
        // Re-randomize positions sequentially to maintain separation
        let placedVertices = [];
        const newFlowers = selectedFlowers.map(f => {
            const pos = generateRandomPosition(placedVertices);
            placedVertices.push({ ...f, ...pos });
            return { ...f, ...pos };
        });
        setSelectedFlowers(newFlowers);
    };

    const cycleBackground = () => {
        setBackground((prev) => (prev + 1) % BACKGROUNDS.length);
    };

    const toggleSongPlayback = () => {
        if (selectedSong?.previewUrl) {
            if (isPlayingSong) {
                songPlayerRef.current?.pause();
                setIsPlayingSong(false);
            } else {
                if (!songPlayerRef.current || songPlayerRef.current.src !== selectedSong.previewUrl) {
                    songPlayerRef.current = new Audio(selectedSong.previewUrl);
                    songPlayerRef.current.loop = true;
                    songPlayerRef.current.onended = () => setIsPlayingSong(false);
                }
                songPlayerRef.current.play();
                setIsPlayingSong(true);
            }
        }
    };

    const handleExit = () => {
        if (selectedFlowers.length > 0 || messageCard.message.length > 0) {
            setShowUnsavedModal(true);
        } else {
            navigate(-1);
        }
    };

    const handleSubmit = async () => {
        setLoading(true);
        try {
            await verifyCardCreate();

            const bouquetId = uuidv4();
            const docRef = doc(db, 'bouquet-cards', bouquetId);

            const bouquetData = {
                selectedFlowers,
                background,
                message: messageCard.message,
                senderName: messageCard.senderName,
                recipientName: messageCard.recipientName,
                messageCard: {
                    ...messageCard
                },
                song: selectedSong,
                createdAt: serverTimestamp(),
                type: 'bouquet',
                userId: currentUser?.uid || 'anonymous',
                version: 2
            };

            await setDoc(docRef, bouquetData);

            if (customSlug) {
                const slugDoc = doc(db, 'slugs', customSlug);
                await setDoc(slugDoc, {
                    slug: customSlug,
                    cardType: 'bouquet',
                    cardId: bouquetId,
                    userId: currentUser?.uid || 'anonymous',
                    createdAt: Date.now()
                });
            }

            const url = customSlug
                ? `${window.location.origin}/bouquet/${customSlug}`
                : `${window.location.origin}/bouquet/${bouquetId}`;

            setCardUrl(url);
            setShowShareModal(true);
        } catch (error) {
            console.error('Error creating bouquet:', error);
            alert('Failed to create bouquet. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const canProceedStep1 = selectedFlowers.length >= 3;
    const canProceedStep3 = messageCard.message.trim().length > 0 && messageCard.senderName.trim().length > 0;

    const nextStep = () => {
        if (currentStep === 1 && canProceedStep1) setCurrentStep(2);
        else if (currentStep === 2) setCurrentStep(3);
    };

    const prevStep = () => {
        if (currentStep > 1) setCurrentStep(currentStep - 1);
    };

    useEffect(() => {
        if (viewingMeaning) document.body.style.overflow = 'hidden';
        else document.body.style.overflow = 'auto';
        return () => { document.body.style.overflow = 'auto'; };
    }, [viewingMeaning]);

    return (
        <div className="bouquet-minimal-container">
            {/* Top Navigation */}
            <div className="bouquet-nav">
                <button className="nav-exit-btn" onClick={handleExit}>
                    <X size={24} />
                    <span className="mobile-hide">Exit</span>
                </button>
                <div className="nav-step-indicator">
                    <span className={`nav-step ${currentStep === 1 ? 'active' : ''}`}>1. Select</span>
                    <span className="nav-divider"></span>
                    <span className={`nav-step ${currentStep === 2 ? 'active' : ''}`}>2. Arrange</span>
                    <span className="nav-divider"></span>
                    <span className={`nav-step ${currentStep === 3 ? 'active' : ''}`}>3. Message</span>
                </div>
                <div style={{ width: '60px' }}></div>
            </div>

            <div className="bouquet-main-content">
                {/* Step 1: Selection */}
                {currentStep === 1 && (
                    <div className="step-content fade-in">
                        <div className="step-header-minimal">
                            <h1>Choose Your Flowers</h1>
                            {selectedFlowers.length < 3 ? (
                                <p className="text-warning">Select at least 3 flowers ({selectedFlowers.length}/8)</p>
                            ) : (
                                <p className="text-success">{selectedFlowers.length}/8 flowers selected</p>
                            )}
                        </div>

                        <div className="flowers-grid-minimal">
                            {FLOWERS.map(flower => {
                                const count = selectedFlowers.filter(f => f.id === flower.id).length;
                                return (
                                    <div key={flower.id} className="flower-item-minimal">
                                        <div
                                            className={`flower-image-container ${count > 0 ? 'selected' : ''}`}
                                            onClick={() => handleFlowerInteraction(flower.id)}
                                        >
                                            <img src={flower.image} alt={flower.name} />
                                            {count > 0 && (
                                                <>
                                                    <span className="flower-count-badge">{count}</span>
                                                    <button
                                                        className="flower-deselect-btn"
                                                        onClick={(e) => handleFlowerDeselectOne(e, flower.id)}
                                                    >
                                                        <X size={14} />
                                                    </button>
                                                </>
                                            )}
                                            <button
                                                className="flower-info-btn"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setViewingMeaning(flower);
                                                }}
                                            >
                                                <Info size={16} />
                                            </button>
                                        </div>
                                        <div className="flower-label">{flower.name}</div>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="floating-action-bar">
                            <button
                                className="primary-btn"
                                disabled={!canProceedStep1}
                                onClick={nextStep}
                            >
                                Continue <ArrowRight size={20} />
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 2: Arrangement */}
                {currentStep === 2 && (
                    <div className="step-content fade-in">
                        <div className="step-header-minimal">
                            <h1>Arrange Your Bouquet</h1>
                            <p>To move a flower, just shuffle the arrangement.</p>
                        </div>

                        <div className="arrangement-workspace">
                            <div
                                className="bouquet-canvas"
                                style={{ backgroundImage: `url(${BACKGROUNDS[background]})` }}
                            >
                                <div className="bouquet-flowers-layer">
                                    {selectedFlowers.map((flower) => {
                                        const flowerDef = FLOWERS.find(f => f.id === flower.id);
                                        return (
                                            <div
                                                key={flower.uniqueId}
                                                className="placed-flower"
                                                style={{
                                                    left: `${flower.x}%`,
                                                    top: `${flower.y}%`,
                                                    transform: `translate(-50%, -50%) rotate(${flower.rotation}deg) scale(${flower.scale})`,
                                                    zIndex: flower.zIndex
                                                }}
                                            >
                                                <img src={flowerDef.image} alt={flowerDef.name} />
                                                <button
                                                    className="remove-flower-btn"
                                                    onClick={() => handleFlowerRemove(flower.uniqueId)}
                                                >
                                                    <X size={12} />
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="tools-panel">
                                <button className="tool-btn" onClick={shuffleArrangement}>
                                    <Shuffle size={20} />
                                    <span>Shuffle</span>
                                </button>
                                <button className="tool-btn" onClick={cycleBackground}>
                                    <ImageIcon size={20} />
                                    <span>Background</span>
                                </button>
                                <button className="tool-btn" onClick={() => setCurrentStep(1)}>
                                    <Plus size={20} />
                                    <span>Add More</span>
                                </button>
                            </div>
                        </div>

                        <div className="floating-action-bar">
                            <button className="secondary-btn" onClick={prevStep}>Back</button>
                            <button className="primary-btn" onClick={nextStep}>
                                Add Message <ArrowRight size={20} />
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 3: Message & Song */}
                {currentStep === 3 && (
                    <div className="step-content fade-in">
                        <div className="step-header-minimal">
                            <h1>Add Your Note</h1>
                            <p>Write a heartfelt message and add a song.</p>
                        </div>

                        <div className="message-container">
                            <div className="postcard-form">
                                <div className="postcard-content">
                                    <input
                                        type="text"
                                        className="postcard-recipient-input"
                                        placeholder="To: Recipient Name"
                                        value={messageCard.recipientName}
                                        onChange={(e) => setMessageCard({ ...messageCard, recipientName: e.target.value })}
                                        maxLength={30}
                                    />
                                    <div className="postcard-divider-line"></div>
                                    <textarea
                                        className="postcard-textarea"
                                        placeholder="Write your message here..."
                                        value={messageCard.message}
                                        onChange={(e) => setMessageCard({ ...messageCard, message: e.target.value })}
                                        maxLength={150}
                                    ></textarea>
                                    <div className="postcard-footer">
                                        <input
                                            type="text"
                                            className="postcard-signature"
                                            placeholder="- Your Name"
                                            value={messageCard.senderName}
                                            onChange={(e) => setMessageCard({ ...messageCard, senderName: e.target.value })}
                                            maxLength={30}
                                        />
                                        <span className="char-count">{messageCard.message.length}/150</span>
                                    </div>
                                </div>
                            </div>

                            <div className="song-integration-section">
                                {!selectedSong ? (
                                    <button
                                        className="add-music-btn-minimal"
                                        onClick={() => setShowSpotifyModal(true)}
                                    >
                                        <div className="icon-circle"><Music size={20} /></div>
                                        <span>Add a Song to this card</span>
                                    </button>
                                ) : (
                                    <div className="selected-song-minimal">
                                        <img src={selectedSong.albumArt} alt="Album Art" />
                                        <div className="song-info-min">
                                            <p className="song-name-min">{selectedSong.name}</p>
                                            <p className="song-artist-min">{selectedSong.artist}</p>
                                            {selectedSong.previewUrl && (
                                                <button
                                                    className="mini-play-btn"
                                                    onClick={toggleSongPlayback}
                                                >
                                                    {isPlayingSong ? <Pause size={14} /> : <Play size={14} />}
                                                    {isPlayingSong ? 'Pause Preview' : 'Play Preview'}
                                                </button>
                                            )}
                                        </div>
                                        <button
                                            className="remove-song-min"
                                            onClick={() => {
                                                setSelectedSong(null);
                                                setIsPlayingSong(false);
                                                if (songPlayerRef.current) songPlayerRef.current.pause();
                                            }}
                                        >
                                            <X size={18} />
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div style={{ maxWidth: '600px', margin: '20px auto' }}>
                            <SlugInput
                                value={customSlug}
                                onChange={setCustomSlug}
                                cardType="bouquet"
                            />
                        </div>

                        <div className="floating-action-bar">
                            <button className="secondary-btn" onClick={prevStep}>Back</button>
                            <button className="secondary-btn" onClick={handlePreview} style={{ marginRight: '10px' }}>
                                <Eye size={20} /> <span className="mobile-hide">Preview</span>
                            </button>
                            <button
                                className="primary-btn finish-btn"
                                onClick={handleSubmit}
                                disabled={loading || !canProceedStep3}
                            >
                                {loading ? 'Creating...' : 'Finish Bouquet'}
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Meaning Modal */}
            {viewingMeaning && (
                <div className="meaning-modal-overlay" onClick={() => setViewingMeaning(null)}>
                    <div className="meaning-modal" onClick={e => e.stopPropagation()}>
                        <button className="close-modal-btn" onClick={() => setViewingMeaning(null)}>
                            <X size={24} />
                        </button>
                        <img src={viewingMeaning.image} alt={viewingMeaning.name} className="meaning-img" />
                        <h2>{viewingMeaning.name}</h2>
                        <div className="meaning-content">
                            <div className="meaning-item">
                                <h3>Meaning</h3>
                                <p>{viewingMeaning.meaning}</p>
                            </div>
                            <div className="meaning-item">
                                <h3>Best For</h3>
                                <p>{viewingMeaning.purpose}</p>
                            </div>
                        </div>
                        <button
                            className="add-flower-btn"
                            onClick={() => {
                                addFlowerExplicit(viewingMeaning.id);
                                setViewingMeaning(null);
                            }}
                        >
                            Add to Bouquet
                        </button>
                    </div>
                </div>
            )}

            <ShareModal
                isOpen={showShareModal}
                onClose={() => setShowShareModal(false)}
                cardUrl={cardUrl}
                cardType="Digital Bouquet"
            />

            <UnsavedChangesModal
                isOpen={showUnsavedModal}
                onDiscard={() => navigate('/')}
                onStay={() => setShowUnsavedModal(false)}
            />

            <SpotifyModal
                isOpen={showSpotifyModal}
                onClose={() => setShowSpotifyModal(false)}
                onSongSelect={(song) => setSelectedSong(song)}
                currentSong={selectedSong}
            />
        </div>
    );
};

export default CreateBouquet;
