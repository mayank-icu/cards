import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { doc, onSnapshot } from 'firebase/firestore';
import {
    Heart,
    Thermometer,
    BatteryCharging,
    Sun,
    CloudRain,
    Pill,
    ArrowDown,
    Cloud,
    Star,
    Music,
    Play,
    Pause,
    X
} from 'lucide-react';
import CardViewHeader from '../../components/CardViewHeader';
import CardFooter from '../../components/CardFooter';
import SongPlayer from '../../components/SongPlayer';
import { db } from '../../firebase';
import { normalizeCardData, resolveCardId } from '../../utils/slugs';

const GetWellPage = () => {
    const { id } = useParams();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    // --- Interactive States ---
    const [started, setStarted] = useState(false);
    const [tempValue, setTempValue] = useState(38.5);
    const [batteryLevel, setBatteryLevel] = useState(20);
    const [pillCount, setPillCount] = useState(0);
    const [isCozy, setIsCozy] = useState(false);

    // Flower State
    const [isWatering, setIsWatering] = useState(false);
    const [flowersBloomed, setFlowersBloomed] = useState(false);

    const [teaDunked, setTeaDunked] = useState(false);

    // Sun State
    const [sunPosition, setSunPosition] = useState(0); // 0 = night, 100 = day

    const [soupLevel, setSoupLevel] = useState(100);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

    // Refs
    const rainCanvasRef = useRef(null);
    const flowerSectionRef = useRef(null);
    const sunSectionRef = useRef(null);

    // --- Data Fetching ---
    useEffect(() => {
        if (!id) return;

        let unsubscribe = () => { };

        const setupSubscription = async () => {
            try {
                const result = await resolveCardId(id, 'get-well', 'get-well');

                if (result) {
                    const realId = result.id;
                    const docRef = doc(db, 'get-well', realId);

                    unsubscribe = onSnapshot(docRef, (snapshot) => {
                        if (snapshot.exists()) {
                            setData(normalizeCardData(snapshot.data()));
                        } else {
                            // Fallback data for preview/demo
                            setData({
                                recipient: "Friend",
                                sender: "Your Friends",
                                message: "Wishing you a speedy recovery! Take care of yourself and get well soon.",
                                song: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"
                            });
                        }
                        setLoading(false);
                    }, (err) => {
                        console.error(err);
                        // Still provide fallback data on error
                        setData({
                            recipient: "Friend",
                            sender: "Your Friends",
                            message: "Wishing you a speedy recovery! Take care of yourself and get well soon.",
                            song: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"
                        });
                        setLoading(false);
                    });
                } else {
                    // Fallback data when resolveCardId returns null
                    setData({
                        recipient: "Friend",
                        sender: "Your Friends",
                        message: "Wishing you a speedy recovery! Take care of yourself and get well soon.",
                        song: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"
                    });
                    setLoading(false);
                }
            } catch (error) {
                console.error("Error resolving get-well card:", error);
                // Fallback data on error
                setData({
                    recipient: "Friend",
                    sender: "Your Friends",
                    message: "Wishing you a speedy recovery! Take care of yourself and get well soon.",
                    song: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"
                });
                setLoading(false);
            }
        };

        setupSubscription();

        return () => unsubscribe();
    }, [id]);

    // --- Rain Animation ---
    useEffect(() => {
        if (!rainCanvasRef.current) return;
        const canvas = rainCanvasRef.current;
        const ctx = canvas.getContext('2d');
        let w = canvas.width = window.innerWidth;
        let h = canvas.height = window.innerHeight;
        let animId;

        const drops = [];
        const maxDrops = 150;

        for (let i = 0; i < maxDrops; i++) {
            drops.push({
                x: Math.random() * w,
                y: Math.random() * h,
                l: Math.random() * 20 + 10,
                s: Math.random() * 4 + 2,
                drift: 0
            });
        }

        const draw = () => {
            ctx.clearRect(0, 0, w, h);
            ctx.lineWidth = 2;
            ctx.lineCap = 'round';

            const centerX = w / 2;
            const windForce = (mousePos.x - centerX) * 0.005;

            for (let i = 0; i < maxDrops; i++) {
                let d = drops[i];
                ctx.strokeStyle = `rgba(179, 229, 252, ${d.y / h})`;
                ctx.beginPath();
                ctx.moveTo(d.x, d.y);
                ctx.lineTo(d.x + windForce, d.y + d.l);
                ctx.stroke();

                d.y += d.s;
                d.x += windForce;

                if (d.y > h) {
                    d.y = -20;
                    d.x = Math.random() * w;
                }
                if (d.x > w) d.x = 0;
                if (d.x < 0) d.x = w;
            }
            animId = requestAnimationFrame(draw);
        };

        draw();

        const handleResize = () => {
            w = canvas.width = window.innerWidth;
            h = canvas.height = window.innerHeight;
        };
        window.addEventListener('resize', handleResize);

        return () => {
            cancelAnimationFrame(animId);
            window.removeEventListener('resize', handleResize);
        };
    }, [started, mousePos]);

    const handleMouseMove = (e) => {
        setMousePos({ x: e.clientX, y: e.clientY });
    };

    // --- Helpers ---
    const getBgColorForTemp = () => {
        if (tempValue > 39) return '#ffcdd2';
        if (tempValue > 37.5) return '#ffe0b2';
        if (tempValue >= 36 && tempValue <= 37.5) return '#c8e6c9';
        return '#bbdefb';
    };

    const drinkSoup = () => {
        if (soupLevel > 0) setSoupLevel(prev => Math.max(0, prev - 20));
    };

    const waterFlowers = () => {
        setIsWatering(true);
        // Delay bloom until after "watering" animation
        setTimeout(() => {
            setFlowersBloomed(true);
            setIsWatering(false);
        }, 1500);
    };

    // Calculate sky color based on sun slider
    const getSkyColor = () => {
        if (sunPosition < 30) return '#1a237e'; // Deep Night
        if (sunPosition < 60) return `linear-gradient(to top, #ff9800 ${sunPosition}%, #1a237e 100%)`; // Sunrise
        return `linear-gradient(to bottom, #4fc3f7, #81d4fa)`; // Day
    };

    const getSunMessage = () => {
        if (sunPosition < 20) return "It's always darkest before dawn.";
        if (sunPosition < 50) return "Here comes the sun...";
        if (sunPosition < 80) return "A bright new day is starting.";
        return "Shine bright!";
    }

    // --- ENHANCED SPOTIFY PLAYER COMPONENT ---
    const EnhancedSongPlayer = ({ song }) => {
        const [isPlaying, setIsPlaying] = useState(false);
        
        return (
            <div className="floating-spotify-player">
                <div className="spotify-disc" style={{ animationPlayState: isPlaying ? 'running' : 'paused' }}>
                    {song.albumArt ? (
                        <img src={song.albumArt} alt="Album Art" />
                    ) : (
                        <Music size={20} color="white" style={{ margin: '10px' }} />
                    )}
                </div>
                <div className="spotify-info-mini">
                    <span className="scrolling-text">{song.name || "Get Well Song"} - {song.artist || "Artist"}</span>
                </div>
                <button 
                    className="mini-play-btn" 
                    onClick={() => setIsPlaying(!isPlaying)}
                >
                    {isPlaying ? <X size={14} /> : <Play size={14} />}
                </button>
                <SongPlayer song={song} isPlaying={isPlaying} setIsPlaying={setIsPlaying} />
            </div>
        );
    };

    // Helper to get Spotify ID
    const getSpotifyId = (url) => {
        if (!url || typeof url !== 'string') return null;
        try {
            const parts = url.split('/');
            return parts[parts.length - 1].split('?')[0];
        } catch (e) { return null; }
    };
    const spotifyId = getSpotifyId(data?.song);

    if (loading) return <div className="loader">Preparing care package...</div>;

    return (
        <div onMouseMove={handleMouseMove}>
            <div style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100 }}>
                <CardViewHeader
                    cardType="get-well"
                    cardId={id}
                    title="Get Well Soon"
                    subtitle={data?.recipient ? `For ${data.recipient}` : undefined}
                />
            </div>

            {/* Enhanced Floating Spotify Player */}
            {data?.song && <EnhancedSongPlayer song={data.song} />}

            <div className="scrolly-container">
                <style>{`
                    :root {
                        --soft-teal: #e0f2f1;
                        --deep-teal: #00695c;
                        --warm-orange: #ffcc80;
                        --soup-color: #ffb74d;
                        --medicinal-red: #ef5350;
                        --text-dark: #37474f;
                        --paper-white: #fdfbf7;
                    }

                    * { box-sizing: border-box; margin: 0; padding: 0; }
                    
                    body {
                        font-family: 'Georgia', serif; 
                        color: var(--text-dark);
                        overflow: hidden; /* Prevent body scroll, container handles it */
                    }

                    .loader {
                        height: 100vh;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        background: var(--soft-teal);
                        font-size: 1.5rem;
                        color: var(--deep-teal);
                    }

                    .scrolly-container {
                        height: 100dvh; 
                        overflow-y: scroll;
                        scroll-snap-type: y mandatory; /* Strict snapping for page effect */
                        scroll-behavior: smooth;
                        touch-action: pan-y;
                        -webkit-overflow-scrolling: touch;
                    }

                    section {
                        height: 100dvh;
                        width: 100%;
                        scroll-snap-align: start;
                        scroll-snap-stop: always; /* Force stop at each section */
                        position: relative;
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        justify-content: center;
                        padding: 2rem;
                        overflow: hidden; /* Prevent scroll inside section */
                        transition: background-color 1s ease;
                    }

                    h2 {
                        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                        font-weight: 300;
                        font-size: 2.5rem;
                        margin-bottom: 0.5rem;
                        text-align: center;
                        z-index: 10;
                    }

                    p {
                        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                        opacity: 0.8;
                        margin-bottom: 2rem;
                        text-align: center;
                        z-index: 10;
                        max-width: 500px;
                        line-height: 1.6;
                    }

                    .interactive-btn {
                        margin-top: 2rem;
                        background: white; border: 2px solid var(--text-dark);
                        padding: 12px 24px; border-radius: 30px;
                        cursor: pointer; font-family: inherit;
                        font-weight: bold;
                        transition: all 0.2s;
                        z-index: 10;
                        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                    }
                    .interactive-btn:active { transform: scale(0.95); }
                    .interactive-btn:disabled { opacity: 0.5; cursor: default; }

                    /* --- Gift Box --- */
                    .intro-section { background: radial-gradient(circle, #ffffff 0%, #e0f2f1 100%); }
                    .gift-container {
                        position: relative; width: 150px; height: 150px; cursor: pointer; transition: transform 0.3s;
                    }
                    .gift-container:hover { transform: scale(1.05); }
                    .gift-container.opened { pointer-events: none; }
                    .gift-box {
                        position: absolute; bottom: 0; width: 100%; height: 100px;
                        background: var(--medicinal-red); border-radius: 8px; z-index: 2;
                    }
                    .gift-lid {
                        position: absolute; top: 20px; left: -5%; width: 110%; height: 40px;
                        background: #e53935; border-radius: 4px; z-index: 3;
                        transition: all 0.8s cubic-bezier(0.68, -0.55, 0.265, 1.55);
                    }
                    .gift-container.shaking { animation: shake 0.5s ease-in-out; }
                    .gift-container.opened .gift-lid { top: -200px; opacity: 0; transform: rotate(-20deg); }
                    @keyframes shake { 0%, 100% { transform: translateX(0); } 25% { transform: rotate(-5deg); } 75% { transform: rotate(5deg); } }
                    
                    .scroll-hint { margin-top: 3rem; animation: bounce 2s infinite; opacity: 0; transition: opacity 1s; }
                    .scroll-hint.visible { opacity: 1; }
                    @keyframes bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(10px); } }

                    /* --- Soup --- */
                    .soup-section { background: #fff8e1; }
                    .soup-container { position: relative; width: 260px; height: 140px; margin-top: 2rem; cursor: pointer; }
                    .soup-bowl {
                        width: 100%; height: 100%; background: white; border-radius: 0 0 130px 130px;
                        border: 6px solid #e0e0e0; overflow: hidden; position: relative; z-index: 2;
                    }
                    .soup-liquid {
                        position: absolute; bottom: 0; left: 0; right: 0; background: var(--soup-color);
                        transition: height 0.5s ease;
                    }
                    .steam-puff {
                        width: 15px; height: 40px; background: white; filter: blur(8px); opacity: 0.6;
                        border-radius: 20px; animation: rise 2s infinite linear;
                    }
                    @keyframes rise { 0% { transform: translateY(20px) scale(0.5); opacity: 0; } 100% { transform: translateY(-40px) scale(1.5); opacity: 0; } }

                    /* --- Thermometer --- */
                    .temp-section.fever { animation: feverShake 0.1s infinite; }
                    @keyframes feverShake { 0% { transform: translate(1px, 1px); } 100% { transform: translate(-1px, -1px); } }
                    .frost-overlay {
                        position: absolute; top: 0; left: 0; width: 100%; height: 100%;
                        background: radial-gradient(circle, transparent 50%, rgba(255,255,255,0.8) 100%);
                        pointer-events: none; opacity: 0; z-index: 1;
                    }
                    .slider-container {
                        position: relative; width: 60px; height: 300px; background: white;
                        border-radius: 30px; padding: 10px; z-index: 5;
                    }
                    input[type=range][orient=vertical] {
                        writing-mode: bt-lr; -webkit-appearance: slider-vertical;
                        width: 100%; height: 100%; cursor: grab;
                    }

                    /* --- Flowers --- */
                    .garden-section { background: #f1f8e9; }
                    .garden-bed { display: flex; gap: 40px; align-items: flex-end; height: 250px; position: relative; }
                    .stem {
                        width: 8px; background: #66bb6a; margin: 0 auto; height: 0;
                        transition: height 1.5s ease-out; border-radius: 4px; position: relative;
                    }
                    .flower-head {
                        width: 60px; height: 60px; background: #f06292; border-radius: 50%;
                        position: absolute; top: -60px; left: -26px; transform: scale(0);
                        transition: transform 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                    }
                    .flower-petal { position: absolute; width: 100%; height: 100%; background: #f06292; border-radius: 50%; }
                    .petal-2 { transform: rotate(45deg); } .petal-3 { transform: rotate(90deg); } .petal-4 { transform: rotate(135deg); }
                    
                    .bloomed .stem { height: 150px; }
                    .bloomed .flower-head { transform: scale(1); }
                    
                    /* Watering Can */
                    .water-can {
                        position: absolute; top: -80px; left: 50%; font-size: 4rem; z-index: 20;
                        transform: translate(-50%, 0) rotate(0deg);
                        transition: all 0.5s ease;
                        opacity: 0; pointer-events: none;
                    }
                    .watering .water-can {
                        opacity: 1;
                        transform: translate(-50%, -20px) rotate(-45deg);
                    }
                    .water-drops {
                        position: absolute; top: -30px; left: 50%; width: 10px; height: 10px;
                        background: #2196f3; border-radius: 50%; opacity: 0;
                    }
                    .watering .water-drops {
                        animation: drop 0.5s infinite;
                    }
                    @keyframes drop {
                        0% { transform: translateY(0); opacity: 1; }
                        100% { transform: translateY(100px); opacity: 0; }
                    }

                    /* --- Sunrise --- */
                    .sunrise-section { transition: background 0.1s; overflow: hidden; }
                    .sky-orb {
                        width: 120px; height: 120px; border-radius: 50%; background: #fdd835;
                        position: absolute; left: 50%; margin-left: -60px;
                        pointer-events: none; transition: bottom 0.1s, box-shadow 0.5s;
                    }
                    .star {
                        position: absolute; background: white; border-radius: 50%;
                        animation: twinkle 2s infinite ease-in-out;
                    }
                    @keyframes twinkle { 0%, 100% { opacity: 0.3; } 50% { opacity: 1; } }
                    
                    .sun-slider-wrapper {
                        position: absolute; right: 20px; top: 50%; transform: translateY(-50%);
                        height: 200px; background: rgba(255,255,255,0.1); backdrop-filter: blur(4px);
                        padding: 10px; border-radius: 20px; z-index: 20;
                        border: 1px solid rgba(255,255,255,0.3);
                    }

                    /* --- Tea --- */
                    .tea-section { background: #efebe9; }
                    .tea-cup {
                        width: 160px; height: 110px; background: #fff; border-radius: 0 0 70px 70px;
                        position: relative; overflow: hidden; border: 4px solid #d7ccc8; z-index: 2;
                    }
                    .tea-fill { width: 100%; height: 80%; background: #795548; margin-top: 30px; opacity: 0.9; }
                    .biscuit {
                        width: 60px; height: 80px; background: #d7ccc8; border-radius: 8px;
                        position: absolute; top: -90px; left: 50px; z-index: 1;
                        transition: top 1s cubic-bezier(0.68, -0.55, 0.265, 1.55);
                    }
                    .biscuit.dunked { top: 30px; }
                    
                    /* --- Note --- */
                    .note-section { background: #eceff1; }
                    .letter-paper {
                        background: var(--paper-white); padding: 3rem; max-width: 600px; width: 90%;
                        box-shadow: 0 10px 40px rgba(0,0,0,0.1); position: relative;
                    }
                    
                    /* Enhanced Floating Spotify Player */
                    .floating-spotify-player {
                        position: fixed;
                        top: 20px;
                        right: 20px;
                        z-index: 2000;
                        background: rgba(0, 105, 92, 0.1);
                        backdrop-filter: blur(15px);
                        padding: 12px;
                        border-radius: 50px;
                        box-shadow: 0 8px 32px rgba(0, 105, 92, 0.15);
                        display: flex;
                        align-items: center;
                        gap: 12px;
                        border: 2px solid var(--deep-teal);
                        transition: all 0.3s ease;
                        animation: slideInRight 0.6s ease-out;
                    }

                    .floating-spotify-player:hover {
                        transform: scale(1.05);
                        box-shadow: 0 12px 40px rgba(0, 105, 92, 0.25);
                        background: rgba(0, 105, 92, 0.2);
                    }

                    .spotify-disc {
                        width: 40px;
                        height: 40px;
                        border-radius: 50%;
                        background: linear-gradient(135deg, #1db954, #191414);
                        overflow: hidden;
                        animation: spin 4s linear infinite;
                        border: 2px solid var(--deep-teal);
                        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
                    }

                    .spotify-disc img { 
                        width: 100%; 
                        height: 100%; 
                        object-fit: cover; 
                    }

                    .spotify-info-mini {
                        max-width: 140px;
                        overflow: hidden;
                        white-space: nowrap;
                        font-size: 0.85rem;
                        color: var(--text-dark);
                        font-family: 'Inter', sans-serif;
                        font-weight: 600;
                    }

                    .scrolling-text {
                        display: inline-block;
                        white-space: nowrap;
                        animation: scrollText 12s linear infinite;
                    }

                    .mini-play-btn {
                        background: var(--deep-teal);
                        border: none;
                        color: white;
                        cursor: pointer;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        width: 32px;
                        height: 32px;
                        border-radius: 50%;
                        transition: all 0.3s ease;
                    }

                    .mini-play-btn:hover {
                        background: var(--warm-orange);
                        transform: scale(1.1);
                    }

                    @keyframes slideInRight { 
                        from { transform: translateX(120%); opacity: 0; } 
                        to { transform: translateX(0); opacity: 1; } 
                    }

                    @keyframes scrollText {
                        0% { transform: translateX(0); }
                        100% { transform: translateX(-100%); }
                    }

                    @keyframes spin { 
                        to { transform: rotate(360deg); } 
                    }
                    .wax-seal {
                        width: 50px; height: 50px; background: #b71c1c; border-radius: 50%;
                        position: absolute; top: -25px; right: 30px;
                        display: flex; align-items: center; justify-content: center;
                    }

                `}</style>

                {/* 1. Gift Box */}
                <section className="intro-section">
                    {!started ? (
                        <>
                            <h2>Delivery for {data.recipient}</h2>
                            <p>A package has arrived for you.</p>
                            <div
                                className={`gift-container ${started ? 'opened' : ''}`}
                                onClick={() => {
                                    const el = document.querySelector('.gift-container');
                                    el.classList.add('shaking');
                                    setTimeout(() => {
                                        el.classList.remove('shaking');
                                        setStarted(true);
                                    }, 500);
                                }}
                            >
                                <div className="gift-lid"></div>
                                <div className="gift-box"></div>
                            </div>
                        </>
                    ) : (
                        <>
                            <h2>Care Package Opened</h2>
                            <Heart size={48} color="#ef5350" fill="#ef5350" style={{ margin: '20px 0', animation: 'pulse 1s infinite' }} />
                            <div className="scroll-hint visible">
                                <p>Scroll down</p>
                                <ArrowDown />
                            </div>
                        </>
                    )}
                </section>

                {/* 2. Rain */}
                <section className="rain-section" style={{ background: '#263238' }}>
                    <canvas ref={rainCanvasRef} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }} />
                    <div style={{ zIndex: 2, textAlign: 'center', color: 'white', pointerEvents: 'none' }}>
                        <CloudRain size={48} />
                        <h2>Rainy Days</h2>
                        <p>Swipe to push the clouds away.</p>
                    </div>
                </section>

                {/* 3. Soup */}
                <section className="soup-section">
                    <h2>Warm Soul Soup</h2>
                    <p>Click to sip.</p>
                    <div className="soup-container" onClick={drinkSoup}>
                        <div className="steam-container">
                            <div className="steam-puff" style={{ animationDelay: '0s' }}></div>
                            <div className="steam-puff" style={{ animationDelay: '1s' }}></div>
                            <div className="steam-puff" style={{ animationDelay: '0.5s' }}></div>
                        </div>
                        <div className="soup-bowl">
                            <div className="soup-liquid" style={{ height: `${soupLevel}%` }}>
                                <div className="soup-chunks"></div>
                                <div className="soup-chunks" style={{ animationDelay: '1s' }}></div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* 4. Thermometer */}
                <section className={`temp-section ${tempValue > 39 ? 'fever' : ''}`} style={{ background: getBgColorForTemp() }}>
                    {tempValue < 37 && (
                        <div className="frost-overlay" style={{ opacity: (37 - tempValue) / 2 }}></div>
                    )}

                    <h2>Cooling Down</h2>
                    <p>Adjust to break the fever.</p>
                    <div className="slider-container">
                        <input
                            type="range"
                            min="35" max="40" step="0.1"
                            value={tempValue}
                            onChange={(e) => setTempValue(parseFloat(e.target.value))}
                            orient="vertical"
                        />
                    </div>
                    <div className="temp-val-display" style={{ marginTop: '1rem', fontSize: '2rem', fontWeight: 'bold' }}>{tempValue.toFixed(1)}°C</div>
                </section>

                {/* 5. Battery */}
                <section className="battery-section" style={{ background: '#e8f5e9' }}>
                    <BatteryCharging size={48} color="#43a047" />
                    <h2>Recharge</h2>
                    <div
                        onClick={() => setBatteryLevel(b => Math.min(100, b + 20))}
                        style={{
                            width: '200px', height: '80px', border: '4px solid #37474f', margin: '2rem 0',
                            borderRadius: '12px', padding: '4px', position: 'relative', cursor: 'pointer'
                        }}
                    >
                        <div style={{
                            width: `${batteryLevel}%`, height: '100%',
                            background: batteryLevel > 50 ? '#66bb6a' : '#ef5350',
                            borderRadius: '6px', transition: 'width 0.5s'
                        }}></div>
                        <div style={{ position: 'absolute', right: '-12px', top: '25%', width: '8px', height: '50%', background: '#37474f', borderRadius: '0 4px 4px 0' }}></div>
                    </div>
                    <p>{batteryLevel}% Energy</p>
                </section>

                {/* 6. Dose */}
                <section className="dose-section">
                    <h2>Daily Dose</h2>
                    <p>Prescription: Unlimited Love.</p>
                    <div className="pill-bottle-container" style={{ margin: '2rem' }} onClick={() => setPillCount(p => p + 1)}>
                        <div className="bottle-cap"></div>
                        <div className="bottle-body">
                            <div className="bottle-label">RX: 143</div>
                        </div>
                        {Array.from({ length: pillCount }).map((_, i) => (
                            <div key={i} className="emitted-heart" style={{ left: `${Math.random() * 60 + 20}%` }}>
                                <Heart fill="#e91e63" size={20} />
                            </div>
                        ))}
                    </div>
                    <button className="interactive-btn" onClick={() => setPillCount(p => p + 1)}>Dispense Dose</button>
                </section>

                {/* 7. Cozy */}
                <section style={{ background: isCozy ? '#3e2723' : '#d7ccc8', color: isCozy ? 'white' : 'var(--text-dark)' }}>
                    <h2>Tuck In</h2>
                    <div
                        onClick={() => setIsCozy(!isCozy)}
                        style={{
                            width: '80px', height: '40px', background: isCozy ? '#8d6e63' : '#ccc', margin: '2rem',
                            borderRadius: '20px', padding: '4px', cursor: 'pointer', transition: 'background 0.3s'
                        }}
                    >
                        <div style={{
                            width: '32px', height: '32px', background: 'white', borderRadius: '50%',
                            transform: isCozy ? 'translateX(40px)' : 'translateX(0)', transition: 'transform 0.3s'
                        }}></div>
                    </div>
                </section>

                {/* 8. Flowers - Fixed Animation */}
                <section ref={flowerSectionRef} className={`garden-section ${isWatering ? 'watering' : ''}`}>
                    <h2>Grow Again</h2>
                    <p>Water the plants to see them bloom.</p>

                    <div className={`garden-bed ${flowersBloomed ? 'bloomed' : ''}`}>
                        <div className="water-can">
                            🫖
                            <div className="water-drops" style={{ animationDelay: '0s' }}></div>
                            <div className="water-drops" style={{ animationDelay: '0.2s', left: '60%' }}></div>
                        </div>

                        {[1, 2, 3].map(i => (
                            <div key={i} className="flower-container">
                                <div className="flower-head" style={{ transitionDelay: `${0.5 + i * 0.2}s` }}>
                                    <div className="flower-petal petal-1"></div>
                                    <div className="flower-petal petal-2"></div>
                                    <div className="flower-petal petal-3"></div>
                                    <div className="flower-petal petal-4"></div>
                                </div>
                                <div className="stem" style={{ transitionDelay: `${i * 0.1}s` }}></div>
                            </div>
                        ))}
                    </div>

                    <button
                        className="interactive-btn"
                        onClick={waterFlowers}
                        disabled={flowersBloomed || isWatering}
                        style={{ opacity: flowersBloomed ? 0 : 1 }}
                    >
                        {isWatering ? "Watering..." : "Water Plants"}
                    </button>
                </section>

                {/* 9. Sunrise - Enhanced Interaction */}
                <section ref={sunSectionRef} className="sunrise-section" style={{ background: getSkyColor() }}>
                    {/* Stars that fade as sun rises */}
                    {Array.from({ length: 20 }).map((_, i) => (
                        <div key={i} className="star" style={{
                            top: `${Math.random() * 60}%`,
                            left: `${Math.random() * 100}%`,
                            width: `${Math.random() * 3 + 1}px`,
                            height: `${Math.random() * 3 + 1}px`,
                            opacity: Math.max(0, 1 - sunPosition / 40),
                            animationDelay: `${Math.random() * 2}s`
                        }}></div>
                    ))}

                    {/* The Sun */}
                    <div className="sky-orb" style={{
                        bottom: `${sunPosition - 20}%`,
                        boxShadow: `0 0 ${20 + sunPosition}px ${10 + sunPosition / 2}px #fdd835`
                    }}></div>

                    {/* Clouds */}
                    <div style={{ position: 'absolute', top: '10%', left: '10%', opacity: 1 - (sunPosition / 80), transition: 'opacity 0.5s' }}>
                        <Cloud color="white" size={64} fill="rgba(255,255,255,0.5)" />
                    </div>

                    <div style={{ zIndex: 2, textAlign: 'center', color: sunPosition < 30 ? 'white' : '#3e2723' }}>
                        <Sun size={64} style={{ marginBottom: '20px', opacity: sunPosition > 20 ? 1 : 0.5 }} />
                        <h2>A New Day</h2>
                        <p>{getSunMessage()}</p>
                    </div>

                    {/* Interactive Slider */}
                    <div className="sun-slider-wrapper">
                        <input
                            type="range"
                            min="0" max="100"
                            value={sunPosition}
                            onChange={(e) => setSunPosition(parseInt(e.target.value))}
                            orient="vertical"
                            style={{ height: '100%', width: '40px', cursor: 'grab' }}
                        />
                    </div>
                    <p style={{ position: 'absolute', right: '80px', top: '50%', transform: 'translateY(-50%)', width: '60px', fontSize: '0.8rem', color: 'white', textShadow: '0 1px 2px black' }}>
                        Drag Up
                    </p>
                </section>

                {/* 10. Tea */}
                <section className="tea-section">
                    <h2>Comfort Tea</h2>
                    <div className="tea-wrapper" style={{ marginTop: '40px', position: 'relative' }}>
                        <div className={`biscuit ${teaDunked ? 'dunked' : ''}`}></div>
                        <div className="tea-cup">
                            <div className="tea-fill"></div>
                        </div>
                    </div>
                    <button className="interactive-btn" onClick={() => {
                        setTeaDunked(true);
                        setTimeout(() => setTeaDunked(false), 2000);
                    }}>
                        Dunk It
                    </button>
                </section>

                {/* 11. Note */}
                <section className="note-section">
                    <div className="letter-paper">
                        <div className="wax-seal">
                            <Heart size={24} fill="white" color="white" />
                        </div>
                        <h2>Get Well Soon, {data.recipient}</h2>
                        <div className="letter-content" style={{ marginTop: '2rem', textAlign: 'left' }}>
                            "{data.message}"
                        </div>
                        {data.imageUrl && (
                            <div style={{ margin: '2rem 0', transform: 'rotate(-2deg)', border: '10px solid white', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }}>
                                <img src={data.imageUrl} alt="Memory" style={{ width: '100%', display: 'block' }} />
                            </div>
                        )}
                        <div className="sender-line">
                            Sending antibodies and hugs,<br />
                            <strong>— {data.sender}</strong>
                        </div>
                    </div>
                </section>
                <CardFooter />
            </div>
        </div>
    );
};

export default GetWellPage;

