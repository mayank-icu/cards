import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { Music, Play, Pause, X, ArrowLeft, ArrowRight } from 'lucide-react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import './BouquetView.css';

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

const FLOWER_IMAGES = {
    rose: roseImg,
    tulip: tulipImg,
    lily: lilyImg,
    orchid: orchidImg,
    peony: peonyImg,
    daisy: daisyImg,
    carnation: carnationImg,
    chrysanthemum: chrysanthemumImg,
    lotus: lotusImg,
    camellia: camelliaImg
};

const BACKGROUNDS = [bg1, bg2, bg3, bg4, bg5];

const BouquetView = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();

    const [bouquetData, setBouquetData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isPlayingSong, setIsPlayingSong] = useState(false);
    const audioPlayerRef = useRef(null);

    const isPreview = id === 'preview' && location.state?.previewData;

    useEffect(() => {
        const fetchBouquet = async () => {
            // Handle Preview Mode
            if (id === 'preview') {
                if (location.state?.previewData) {
                    setBouquetData(location.state.previewData);
                    setLoading(false);
                } else {
                    // Preview with no data -> redirect home
                    navigate('/');
                }
                return;
            }

            try {
                let bouquetId = id;

                // Check for custom slug
                // Crude check: UUIDs are usually 36 chars. Slugs are user-defined.
                // We'll try fetching from 'slugs' collection first.
                const slugRef = doc(db, 'slugs', id);
                const slugSnap = await getDoc(slugRef);

                if (slugSnap.exists()) {
                    const slugData = slugSnap.data();
                    if (slugData.cardType === 'bouquet' || slugData.type === 'bouquet') {
                        bouquetId = slugData.cardId;
                    }
                }

                const docRef = doc(db, 'bouquet-cards', bouquetId);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    setBouquetData(docSnap.data());
                } else {
                    console.error('Bouquet not found');
                }
            } catch (error) {
                console.error('Error fetching bouquet:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchBouquet();
    }, [id, location.state, navigate]);

    useEffect(() => {
        return () => {
            if (audioPlayerRef.current) {
                audioPlayerRef.current.pause();
            }
        };
    }, []);

    const toggleSongPlayback = () => {
        if (bouquetData?.song?.previewUrl) {
            if (isPlayingSong) {
                audioPlayerRef.current?.pause();
                setIsPlayingSong(false);
            } else {
                if (!audioPlayerRef.current || audioPlayerRef.current.src !== bouquetData.song.previewUrl) {
                    audioPlayerRef.current = new Audio(bouquetData.song.previewUrl);
                    audioPlayerRef.current.loop = true;
                    audioPlayerRef.current.onended = () => setIsPlayingSong(false);
                }
                audioPlayerRef.current.play();
                setIsPlayingSong(true);
            }
        }
    };

    if (loading) {
        return (
            <div className="bouquet-view-loader">
                <div className="spinner"></div>
            </div>
        );
    }

    if (!bouquetData) {
        return (
            <div className="bouquet-view-error">
                <h2>Bouquet Not Found</h2>
                <button onClick={() => navigate('/')}>Go Home</button>
            </div>
        );
    }

    const isV2 = bouquetData.version === 2;

    return (
        <div className="bouquet-view-page-minimal">
            <Navbar />

            {isPreview && (
                <div className="preview-banner">
                    <p>Preview Mode - Not Saved</p>
                </div>
            )}

            <div className="bouquet-view-content">
                <div className="view-grid">
                    {/* Visual Section */}
                    <div className="view-visual-column">
                        <div
                            className="bouquet-canvas-view"
                            style={{ backgroundImage: `url(${BACKGROUNDS[bouquetData.background]})` }}
                        >
                            <div className="bouquet-flowers-layer-view">
                                {isV2 ? (
                                    // Render V2 (Absolute Positioning)
                                    bouquetData.selectedFlowers.map((flower) => (
                                        <div
                                            key={flower.uniqueId}
                                            className="placed-flower-view"
                                            style={{
                                                left: `${flower.x}%`,
                                                top: `${flower.y}%`,
                                                transform: `translate(-50%, -50%) rotate(${flower.rotation}deg) scale(${flower.scale})`,
                                                zIndex: flower.zIndex
                                            }}
                                        >
                                            <img src={FLOWER_IMAGES[flower.id]} alt={flower.id} />
                                        </div>
                                    ))
                                ) : (
                                    // Render V1 (Legacy CSS Classes)
                                    <div className={`bouquet-arrangement-view arrangement-${bouquetData.arrangement}`}>
                                        {bouquetData.selectedFlowers.map((flowerId, index) => (
                                            <img
                                                key={index}
                                                src={FLOWER_IMAGES[flowerId]}
                                                alt={flowerId}
                                                className={`bouquet-flower-legacy flower-${index}`}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Message Section */}
                    <div className="view-message-column">
                        <div className="postcard-display">
                            <div className="postcard-body">
                                <p className="postcard-text">
                                    {bouquetData.message || bouquetData.messageCard?.message}
                                </p>
                                <p className="postcard-signature">
                                    - {bouquetData.senderName || bouquetData.messageCard?.senderName}
                                </p>
                            </div>

                            {/* Metadata if V1 (Greeting/Closing were separate) */}
                            {!isV2 && bouquetData.messageCard && (
                                <div className="legacy-metadata">
                                    <small>To: {bouquetData.messageCard.recipientName}</small>
                                </div>
                            )}
                            {/* Metadata V2 Recipient is handled inline if needed, or we can add it */}
                            {isV2 && bouquetData.recipientName && (
                                <div className="postcard-recipient-display">
                                    <small>To: {bouquetData.recipientName}</small>
                                </div>
                            )}
                        </div>

                        {/* Song Player */}
                        {bouquetData.song && (
                            <div className="song-player-minimal">
                                <img src={bouquetData.song.albumArt} alt="Album Art" />
                                <div className="song-info">
                                    <p className="song-title">{bouquetData.song.name}</p>
                                    <p className="song-artist">{bouquetData.song.artist}</p>
                                </div>
                                {bouquetData.song.previewUrl && (
                                    <button
                                        className={`play-btn ${isPlayingSong ? 'playing' : ''}`}
                                        onClick={toggleSongPlayback}
                                    >
                                        {isPlayingSong ? <Pause size={20} /> : <Play size={20} />}
                                    </button>
                                )}
                            </div>
                        )}

                        {!isPreview ? (
                            <button className="create-own-btn" onClick={() => navigate('/bouquet/create')}>
                                Create Your Own Bouquet <ArrowRight size={18} />
                            </button>
                        ) : (
                            <button
                                className="create-own-btn"
                                onClick={() => {
                                    if (location.state?.returnState) {
                                        navigate('/bouquet/create', { state: location.state.returnState });
                                    } else {
                                        navigate(-1);
                                    }
                                }}
                            >
                                <ArrowLeft size={18} /> Edit Bouquet
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <Footer />
        </div>
    );
};

export default BouquetView;
