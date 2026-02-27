import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { useParams } from 'react-router-dom';
import { doc, onSnapshot } from 'firebase/firestore';
import { signInWithCustomToken, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { Heart, Sun, Smile, Music, Camera, PenTool, Coffee, Star, X, Zap } from 'lucide-react';
import { db, auth } from '../../firebase';
import CardViewHeader from '../../components/CardViewHeader';
import CardFooter from '../../components/CardFooter';
import { normalizeCardData, resolveCardId } from '../../utils/slugs';

// --- AUDIO ENGINE (Web Audio API) ---
class AudioEngine {
    constructor() {
        this.ctx = null;
        this.osc = null;
        this.gain = null;
    }

    init() {
        if (!this.ctx) {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    playTone(freq = 440, type = 'sine', duration = 0.5, vol = 0.1) {
        if (!this.ctx) this.init();
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

        gain.gain.setValueAtTime(vol, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start();
        osc.stop(this.ctx.currentTime + duration);
    }

    playMelody() {
        if (!this.ctx) this.init();
        const notes = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25]; // C Major
        notes.forEach((note, i) => {
            setTimeout(() => {
                this.playTone(note, 'triangle', 0.6, 0.1);
            }, i * 200);
        });
    }

    playBoop() {
        this.playTone(600, 'sine', 0.1, 0.2);
    }

    playPaperSound() {
        // White noise burst
        if (!this.ctx) this.init();
        const bufferSize = this.ctx.sampleRate * 0.5;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.05, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.2);
        noise.connect(gain);
        gain.connect(this.ctx.destination);
        noise.start();
    }
}

const audio = new AudioEngine();

// --- COMPONENTS ---

// 1. The Note (Cover) - Enhanced Interactivity
const NoteSection = ({ sender, recipient, onOpen }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const [tapCount, setTapCount] = useState(0);

    const handleOpen = () => {
        setTapCount(prev => prev + 1);
        audio.playPaperSound();
        
        if (tapCount >= 2) {
            setIsOpen(true);
            setTimeout(onOpen, 800);
        }
    };

    const handleHover = () => {
        if (!isOpen) {
            setIsHovered(true);
            audio.playBoop();
        }
    };

    return (
        <section className="scroll-section note-section">
            <div 
                className={`envelope ${isOpen ? 'open' : ''} ${isHovered ? 'hovered' : ''}`} 
                onClick={handleOpen}
                onMouseEnter={handleHover}
                onMouseLeave={() => setIsHovered(false)}
            >
                <div className="flap"></div>
                <div className="pocket"></div>
                <div className="letter">
                    <p>For: {recipient}</p>
                    <p>From: {sender}</p>
                    <div className="touch-hint">
                        {tapCount < 2 ? `Tap ${3 - tapCount} more times to open` : 'Opening...'}
                    </div>
                </div>
                {isHovered && !isOpen && (
                    <div className="sparkles">
                        <span className="sparkle">✨</span>
                        <span className="sparkle">✨</span>
                        <span className="sparkle">✨</span>
                    </div>
                )}
            </div>
            <div className="bg-texture"></div>
        </section>
    );
};

// 2. Random Fact (Slot Machine) - Enhanced Interactivity
const SlotMachineSection = () => {
    const facts = [
        "You light up every room.",
        "Your laugh is contagious.",
        "You make the world better.",
        "You are incredibly creative.",
        "You have great taste in music.",
        "You're a great listener.",
        "You inspire others.",
        "Your smile is magical."
    ];
    const [fact, setFact] = useState("Roll for a compliment");
    const [spinning, setSpinning] = useState(false);
    const [streak, setStreak] = useState(0);
    const [lastFact, setLastFact] = useState("");

    const spin = () => {
        if (spinning) return;
        setSpinning(true);
        audio.playBoop();

        let counter = 0;
        const interval = setInterval(() => {
            const randomFact = facts[Math.floor(Math.random() * facts.length)];
            setFact(randomFact);
            counter++;
            if (counter > 10) {
                clearInterval(interval);
                setSpinning(false);
                audio.playMelody(); // Victory sound!
                
                if (fact !== randomFact) {
                    setStreak(prev => prev + 1);
                }
                setLastFact(randomFact);
            }
        }, 100);
    };

    return (
        <section className="scroll-section slot-section">
            <div className="content-card">
                <h2>Why You're Cool {streak > 0 && <span className="streak">🔥 {streak}</span>}</h2>
                <div className="slot-window">
                    <p className={spinning ? 'blur' : ''}>{fact}</p>
                    {spinning && (
                        <div className="spinning-indicator">
                            <span className="spin-dot"></span>
                            <span className="spin-dot"></span>
                            <span className="spin-dot"></span>
                        </div>
                    )}
                </div>
                <button className="btn-primary" onClick={spin}>
                    {spinning ? 'Rolling...' : 'Spin It'}
                </button>
                {lastFact && !spinning && (
                    <p className="last-fact">Last: {lastFact}</p>
                )}
            </div>
        </section>
    );
};

// 3. Doodle (Canvas)
const DoodleSection = () => {
    const canvasRef = useRef(null);
    const [isDrawing, setIsDrawing] = useState(false);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');

        // Resize handling
        const resize = () => {
            const parent = canvas.parentElement;
            canvas.width = parent.clientWidth;
            canvas.height = parent.clientHeight;
            ctx.lineCap = 'round';
            ctx.lineWidth = 3;
            ctx.strokeStyle = '#2d3436';
        };
        resize();
        window.addEventListener('resize', resize);
        return () => window.removeEventListener('resize', resize);
    }, []);

    const getPos = (e) => {
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const x = (e.clientX || e.touches[0].clientX) - rect.left;
        const y = (e.clientY || e.touches[0].clientY) - rect.top;
        return { x, y };
    };

    const startDraw = (e) => {
        setIsDrawing(true);
        const { x, y } = getPos(e);
        const ctx = canvasRef.current.getContext('2d');
        ctx.beginPath();
        ctx.moveTo(x, y);
    };

    const draw = (e) => {
        if (!isDrawing) return;
        const { x, y } = getPos(e);
        const ctx = canvasRef.current.getContext('2d');
        ctx.lineTo(x, y);
        ctx.stroke();
    };

    const stopDraw = () => {
        setIsDrawing(false);
    };

    return (
        <section className="scroll-section doodle-section">
            <div className="post-it">
                <h3>Quick Doodle</h3>
                <p className="tiny-text">Draw a smiley face :)</p>
                <div className="canvas-wrapper">
                    <canvas
                        ref={canvasRef}
                        onMouseDown={startDraw}
                        onMouseMove={draw}
                        onMouseUp={stopDraw}
                        onMouseLeave={stopDraw}
                        onTouchStart={startDraw}
                        onTouchMove={draw}
                        onTouchEnd={stopDraw}
                    />
                </div>
            </div>
        </section>
    );
};

// 4. Coffee Break (Liquid Physics)
const CoffeeSection = () => {
    const [sips, setSips] = useState(100);

    const sip = () => {
        if (sips > 0) {
            setSips(prev => Math.max(0, prev - 20));
            audio.playTone(300 + (100 - sips) * 2, 'sine', 0.3, 0.1); // Pitch goes up as cup empties
        }
    };

    return (
        <section className="scroll-section coffee-section">
            <h2>Coffee Break</h2>
            <div className="mug-container" onClick={sip}>
                <div className="steam">
                    <span style={{ "--i": 11 }}></span>
                    <span style={{ "--i": 16 }}></span>
                    <span style={{ "--i": 24 }}></span>
                </div>
                <div className="mug">
                    <div className="coffee" style={{ height: `${sips}%` }}></div>
                </div>
                <div className="handle"></div>
            </div>
            <p>Tap to take a sip</p>
        </section>
    );
};

// 5. The Nudge (Haptics/Shake)
const NudgeSection = () => {
    const [shaking, setShaking] = useState(false);

    const boop = () => {
        setShaking(true);
        audio.playBoop();
        if (navigator.vibrate) navigator.vibrate(50);
        setTimeout(() => setShaking(false), 500);
    };

    return (
        <section className={`scroll-section nudge-section ${shaking ? 'shake-screen' : ''}`}>
            <button className="boop-btn" onClick={boop}>
                BOOP
            </button>
            <p>Just checking in.</p>
        </section>
    );
};

// 6. Playlist (Cassette) - Now just displays song info without player
const PlaylistSection = ({ songName }) => {
    return (
        <section className="scroll-section tape-section">
            <div className="cassette">
                <div className="tape-label">
                    <span>{songName?.name || songName || "Funky Beats"}</span>
                </div>
                <div className="wheels">
                    <div className="wheel left"></div>
                    <div className="wheel right"></div>
                </div>
            </div>
            <p>🎵 Now Playing in the Corner</p>
        </section>
    );
};

// 7. Sticker Book (Drag & Drop)
const StickerSection = () => {
    const [stickers, setStickers] = useState([
        { id: 1, type: 'heart', x: 50, y: 50 },
        { id: 2, type: 'star', x: 150, y: 50 },
        { id: 3, type: 'sun', x: 250, y: 50 },
    ]);

    const moveSticker = (id, dx, dy) => {
        setStickers(prev => prev.map(s =>
            s.id === id ? { ...s, x: s.x + dx, y: s.y + dy } : s
        ));
    };

    // Simple non-perfect drag implementation for demo
    // In prod, use a gesture library for robust touch drag

    return (
        <section className="scroll-section sticker-section">
            <h2>Sticker Book</h2>
            <div className="sticker-canvas">
                <div className="photo-frame">
                    <div className="placeholder-face">:)</div>
                </div>
                {stickers.map(s => (
                    <div
                        key={s.id}
                        className="sticker"
                        style={{ left: s.x, top: s.y, position: 'absolute' }}
                        // A real implementation would need full pointer events here
                        onClick={() => {
                            audio.playBoop();
                            moveSticker(s.id, (Math.random() - 0.5) * 50, (Math.random() - 0.5) * 50 + 50);
                        }}
                    >
                        {s.type === 'heart' && <Heart color="#ff6b6b" fill="#ff6b6b" />}
                        {s.type === 'star' && <Star color="#feca57" fill="#feca57" />}
                        {s.type === 'sun' && <Sun color="#ff9f43" fill="#ff9f43" />}
                    </div>
                ))}
            </div>
            <p>Tap stickers to scramble them onto the frame</p>
        </section>
    );
};

// 8. No Reason
const NoReasonSection = () => {
    const [revealed, setRevealed] = useState(false);

    return (
        <section className="scroll-section reason-section" onClick={() => setRevealed(true)}>
            <h1 className="big-type">Do I need a reason?</h1>
            <h1 className={`big-type answer ${revealed ? 'visible' : ''}`}>Nope.</h1>
        </section>
    );
};

// 9. Instant Photo
const PhotoSection = ({ imageUrl }) => {
    const [developed, setDeveloped] = useState(false);

    const develop = () => {
        if (developed) return;
        audio.playTone(1000, 'sawtooth', 0.1, 0.1); // Flash sound
        setDeveloped(true);
    };

    // Only show photo section if there's an actual image
    if (!imageUrl) {
        return null;
    }

    return (
        <section className="scroll-section photo-section">
            <div className="polaroid" onClick={develop}>
                <div className={`flash-overlay ${developed ? 'flash' : ''}`}></div>
                <div className={`photo-film ${developed ? 'developed' : ''}`}>
                    <img src={imageUrl} alt="Memory" />
                </div>
                <div className="caption">Best Memory</div>
            </div>
            <p>{developed ? 'Developed!' : 'Tap to Snap'}</p>
        </section>
    );
};

// 10. Sign Off
const SignOffSection = ({ message, sender }) => {
    return (
        <section className="scroll-section final-section">
            <div className="message-card">
                <p className="handwritten">{message}</p>
                <div className="divider"></div>
                <h3>Love, {sender}</h3>
                <button className="btn-reset" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                    Read Again
                </button>
            </div>
        </section>
    );
};

// --- MAIN PAGE ---
const JustBecausePage = () => {
    const { id } = useParams();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [started, setStarted] = useState(false);

    // --- AUTH & DATA ---
    useEffect(() => {
        const initAuth = async () => {
            if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
                await signInWithCustomToken(auth, __initial_auth_token);
            } else {
                await signInAnonymously(auth);
            }
        };
        initAuth();

        const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
            if (user) {
                if (!id) {
                    // Fallback Data for demo if no ID
                    setData({
                        sender: "Secret Admirer",
                        recipient: "You",
                        message: "Just because you're awesome and I was thinking about you today.",
                        song: "Your Favorite Song",
                        imageUrl: null
                    });
                    setLoading(false);
                    return;
                }

                try {
                    const result = await resolveCardId(id, 'just_because_cards', 'just-because');
                    if (result && result.id) {
                        const docRef = doc(db, 'just_because_cards', result.id);
                        onSnapshot(docRef, (docSnap) => {
                            if (docSnap.exists()) setData(normalizeCardData(docSnap.data()));
                            else setData(null); // Handle not found
                            setLoading(false);
                        });
                    } else {
                        setLoading(false);
                    }
                } catch (error) {
                    console.error("Error:", error);
                    setLoading(false);
                }
            }
        });
        return () => unsubscribeAuth();
    }, [id]);

    // Helper to get Spotify ID
    const getSpotifyId = (url) => {
        if (!url || typeof url !== 'string') return null;
        try {
            const parts = url.split('/');
            return parts[parts.length - 1].split('?')[0];
        } catch (e) { return null; }
    };
    const spotifyId = getSpotifyId(data?.song);

    if (loading) return <div className="loader">Loading Magic...</div>;
    if (!data) return <div className="loader">Card Not Found</div>;

    return (
        <>
            {/* Header overlay */}
            <div style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100 }}>
                <CardViewHeader
                    cardType="just-because"
                    cardId={id}
                    title="Just Because"
                    subtitle={data?.recipient ? `For ${data.recipient}` : undefined}
                />
            </div>

            {/* Floating Spotify Player */}
            {spotifyId && (
                <div className="spotify-float">
                    <div className="spotify-icon"><Music size={18} /></div>
                    <iframe
                        src={`https://open.spotify.com/embed/track/${spotifyId}?utm_source=generator&theme=0`}
                        frameBorder="0"
                        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                        loading="lazy"
                        title="Spotify Player"
                    ></iframe>
                </div>
            )}

            <div className="origami-container">
                <style>{`
                    /* --- RESET & FONTS --- */
                    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600&family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=Caveat:wght@400;700&display=swap');
                    
                    :root {
                        --bg-paper: #fdfbf7;
                        --ink: #2d3436;
                        --accent: #ff7675;
                        --gold: #fdcb6e;
                        --shadow: rgba(0,0,0,0.1);
                    }

                    * { box-sizing: border-box; }
                    body { margin: 0; background: var(--bg-paper); font-family: 'Inter', sans-serif; color: var(--ink); overflow: hidden; }

                    /* --- SCROLL SNAP LAYOUT --- */
                    .origami-container {
                        height: 100dvh;
                        overflow-y: scroll;
                        scroll-snap-type: y mandatory;
                        scroll-behavior: smooth;
                        -webkit-overflow-scrolling: touch;
                    }

                    .scroll-section {
                        height: 100dvh;
                        width: 100%;
                        scroll-snap-align: start;
                        position: relative;
                        display: flex;
                        flex-direction: column;
                        justify-content: center;
                        align-items: center;
                        overflow: hidden;
                        padding: 20px;
                        background: var(--bg-paper);
                        background-image: radial-gradient(#e6e6e6 1px, transparent 1px);
                        background-size: 20px 20px;
                    }

                    /* --- TYPOGRAPHY --- */
                    h1, h2, h3 { font-family: 'Playfair Display', serif; margin: 0; }
                    p { line-height: 1.6; color: #636e72; }
                    .handwritten { font-family: 'Caveat', cursive; font-size: 1.8rem; }
                    .big-type { font-size: 3rem; font-weight: 900; text-transform: uppercase; letter-spacing: -2px; }

                    /* --- LOADER --- */
                    .loader { display: flex; height: 100vh; justify-content: center; align-items: center; font-family: 'Playfair Display'; font-style: italic; }

                    /* --- SECTION 1: NOTE --- */
                    .envelope {
                        width: 300px;
                        height: 200px;
                        background: #dfe6e9;
                        position: relative;
                        display: flex;
                        justify-content: center;
                        align-items: flex-end;
                        cursor: pointer;
                        transition: all 0.5s ease;
                        box-shadow: 0 10px 20px var(--shadow);
                    }
                    .envelope.open { transform: translateY(100px) scale(0.8); opacity: 0; pointer-events: none; }
                    .envelope.hovered { transform: scale(1.05); box-shadow: 0 15px 30px var(--shadow); }
                    
                    .flap {
                        position: absolute;
                        top: 0;
                        left: 0;
                        width: 0; 
                        height: 0; 
                        border-left: 150px solid transparent;
                        border-right: 150px solid transparent;
                        border-top: 100px solid #b2bec3;
                        transform-origin: top;
                        transition: transform 0.4s;
                        z-index: 2;
                    }
                    .envelope:hover .flap { transform: rotateX(180deg); }
                    .envelope.hovered .flap { transform: rotateX(90deg); }
                    
                    .pocket {
                        position: absolute;
                        bottom: 0;
                        left: 0;
                        width: 0; 
                        height: 0; 
                        border-left: 150px solid #bdc3c7;
                        border-right: 150px solid #bdc3c7;
                        border-bottom: 100px solid #ced6e0;
                        z-index: 3;
                    }
                    
                    .letter {
                        background: white;
                        width: 90%;
                        height: 90%;
                        padding: 20px;
                        text-align: center;
                        font-family: 'Caveat', cursive;
                        font-size: 1.5rem;
                        z-index: 1;
                        box-shadow: 0 -5px 10px rgba(0,0,0,0.05);
                        transition: transform 0.3s ease;
                    }
                    .envelope.hovered .letter { transform: translateY(-5px); }
                    
                    .sparkles {
                        position: absolute;
                        top: -20px;
                        left: 50%;
                        transform: translateX(-50%);
                        pointer-events: none;
                    }
                    .sparkle {
                        position: absolute;
                        font-size: 1.2rem;
                        animation: sparkleFloat 1.5s ease-in-out infinite;
                    }
                    .sparkle:nth-child(1) { left: -20px; animation-delay: 0s; }
                    .sparkle:nth-child(2) { left: 0px; animation-delay: 0.3s; }
                    .sparkle:nth-child(3) { left: 20px; animation-delay: 0.6s; }
                    
                    @keyframes sparkleFloat {
                        0%, 100% { transform: translateY(0) rotate(0deg); opacity: 0; }
                        50% { transform: translateY(-10px) rotate(180deg); opacity: 1; }
                    }

                    /* --- SECTION 2: SLOT --- */
                    .slot-window {
                        background: white;
                        border: 4px solid var(--ink);
                        padding: 2rem;
                        border-radius: 12px;
                        margin: 2rem 0;
                        min-width: 300px;
                        text-align: center;
                        font-weight: bold;
                        font-size: 1.2rem;
                        position: relative;
                        overflow: hidden;
                    }
                    .blur { filter: blur(4px); transition: 0.1s; }
                    .streak { color: var(--accent); font-size: 0.8em; margin-left: 10px; }
                    .spinning-indicator {
                        position: absolute;
                        bottom: 10px;
                        left: 50%;
                        transform: translateX(-50%);
                        display: flex;
                        gap: 5px;
                    }
                    .spin-dot {
                        width: 8px;
                        height: 8px;
                        background: var(--accent);
                        border-radius: 50%;
                        animation: spinBounce 0.6s infinite;
                    }
                    .spin-dot:nth-child(2) { animation-delay: 0.2s; }
                    .spin-dot:nth-child(3) { animation-delay: 0.4s; }
                    @keyframes spinBounce {
                        0%, 80%, 100% { transform: scale(0.8); opacity: 0.5; }
                        40% { transform: scale(1.2); opacity: 1; }
                    }
                    .last-fact {
                        margin-top: 10px;
                        font-style: italic;
                        color: #636e72;
                        font-size: 0.9rem;
                    }
                    .btn-primary {
                        background: var(--ink);
                        color: white;
                        border: none;
                        padding: 1rem 2rem;
                        font-family: 'Inter', sans-serif;
                        text-transform: uppercase;
                        letter-spacing: 2px;
                        cursor: pointer;
                        border-radius: 50px;
                        transition: all 0.2s;
                        position: relative;
                        overflow: hidden;
                    }
                    .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 5px 15px rgba(0,0,0,0.3); }
                    .btn-primary:active { transform: scale(0.95); }

                    /* --- SECTION 3: DOODLE --- */
                    .post-it {
                        background: #ffeaa7;
                        width: 320px;
                        height: 320px;
                        padding: 20px;
                        box-shadow: 5px 5px 15px var(--shadow);
                        transform: rotate(-2deg);
                    }
                    .canvas-wrapper {
                        background: white;
                        width: 100%;
                        height: 220px;
                        cursor: crosshair;
                        border: 1px dashed #dcdde1;
                        touch-action: none;
                    }
                    canvas { width: 100%; height: 100%; }

                    /* --- SECTION 4: COFFEE --- */
                    .mug-container { position: relative; cursor: pointer; margin-bottom: 20px; }
                    .mug {
                        width: 120px;
                        height: 140px;
                        background: white;
                        border: 4px solid var(--ink);
                        border-radius: 0 0 60px 60px;
                        position: relative;
                        overflow: hidden;
                        z-index: 2;
                    }
                    .coffee {
                        background: #6f4e37;
                        width: 100%;
                        position: absolute;
                        bottom: 0;
                        transition: height 0.5s ease;
                    }
                    .handle {
                        position: absolute;
                        right: -30px;
                        top: 30px;
                        width: 50px;
                        height: 80px;
                        border: 4px solid var(--ink);
                        border-radius: 0 20px 20px 0;
                        z-index: 1;
                    }
                    .steam span {
                        position: absolute;
                        display: block;
                        top: -40px;
                        width: 8px;
                        height: 40px;
                        background: rgba(0,0,0,0.1);
                        border-radius: 50%;
                        animation: steam 2s infinite linear;
                        filter: blur(4px);
                        opacity: 0;
                    }
                    .steam span:nth-child(1) { left: 30px; animation-delay: 0.5s; }
                    .steam span:nth-child(2) { left: 60px; animation-delay: 1s; }
                    .steam span:nth-child(3) { left: 90px; animation-delay: 1.5s; }

                    @keyframes steam {
                        0% { transform: translateY(0) scaleX(1); opacity: 0; }
                        50% { opacity: 0.6; }
                        100% { transform: translateY(-40px) scaleX(1.5); opacity: 0; }
                    }

                    /* --- SECTION 5: NUDGE --- */
                    .boop-btn {
                        width: 150px;
                        height: 150px;
                        border-radius: 50%;
                        background: var(--accent);
                        color: white;
                        border: none;
                        font-size: 1.5rem;
                        font-weight: bold;
                        box-shadow: 0 10px 0 #d63031;
                        transition: all 0.1s;
                        cursor: pointer;
                    }
                    .boop-btn:active {
                        transform: translateY(10px);
                        box-shadow: 0 0 0 #d63031;
                    }
                    .shake-screen { animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both; }
                    @keyframes shake {
                        10%, 90% { transform: translate3d(-4px, 0, 0); }
                        20%, 80% { transform: translate3d(8px, 0, 0); }
                        30%, 50%, 70% { transform: translate3d(-8px, 0, 0); }
                        40%, 60% { transform: translate3d(8px, 0, 0); }
                    }

                    /* --- SECTION 6: CASSETTE --- */
                    .cassette {
                        width: 280px;
                        height: 180px;
                        background: #333;
                        border-radius: 10px;
                        position: relative;
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        justify-content: center;
                        color: white;
                        cursor: pointer;
                    }
                    .tape-label {
                        background: #fab1a0;
                        color: var(--ink);
                        width: 80%;
                        padding: 5px;
                        text-align: center;
                        font-family: 'Caveat', cursive;
                        font-weight: bold;
                        margin-bottom: 10px;
                        border-radius: 4px;
                    }
                    .wheels { display: flex; gap: 40px; }
                    .wheel {
                        width: 40px;
                        height: 40px;
                        border-radius: 50%;
                        background: white;
                        border: 4px solid #555;
                    }
                    .cassette.playing .wheel { animation: spin 2s infinite linear; }
                    @keyframes spin { 100% { transform: rotate(360deg); } }

                    /* --- SECTION 7: STICKERS --- */
                    .sticker-canvas {
                        width: 300px;
                        height: 400px;
                        position: relative;
                        background: white;
                        border: 1px solid #ddd;
                        margin-bottom: 1rem;
                    }
                    .photo-frame {
                        width: 100%;
                        height: 100%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        background: #f5f5f5;
                    }
                    .placeholder-face { font-size: 4rem; opacity: 0.2; }
                    .sticker { cursor: grab; transition: transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
                    .sticker:active { transform: scale(1.2); cursor: grabbing; }

                    /* --- SECTION 8: REASON --- */
                    .answer { color: var(--accent); opacity: 0; transform: translateY(20px); transition: all 0.6s ease; }
                    .answer.visible { opacity: 1; transform: translateY(0); }

                    /* --- SECTION 9: PHOTO --- */
                    .polaroid {
                        background: white;
                        padding: 15px 15px 50px 15px;
                        box-shadow: 0 5px 15px rgba(0,0,0,0.2);
                        transform: rotate(3deg);
                        cursor: pointer;
                        position: relative;
                        overflow: hidden;
                    }
                    .flash-overlay {
                        position: absolute; top:0; left:0; right:0; bottom:0;
                        background: white; opacity: 0; pointer-events: none; z-index: 10;
                    }
                    .flash-overlay.flash { animation: flashAnim 1.5s ease-out; }
                    @keyframes flashAnim { 0% { opacity: 1; } 100% { opacity: 0; } }
                    
                    .photo-film {
                        width: 250px;
                        height: 250px;
                        background: #2d3436;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        overflow: hidden;
                        filter: brightness(0) contrast(1.5);
                        transition: filter 3s ease-in;
                    }
                    .photo-film.developed { filter: brightness(1) contrast(1); }
                    .photo-film img { width: 100%; height: 100%; object-fit: cover; }
                    .caption {
                        position: absolute;
                        bottom: 15px;
                        width: 100%;
                        text-align: center;
                        left: 0;
                        font-family: 'Caveat', cursive;
                        color: #555;
                    }

                    /* --- SECTION 10: END --- */
                    .message-card {
                        max-width: 500px;
                        padding: 3rem;
                        text-align: center;
                    }
                    .divider { height: 1px; width: 100px; background: var(--accent); margin: 2rem auto; }
                    .btn-reset {
                        background: transparent;
                        border: 1px solid var(--ink);
                        padding: 0.5rem 1rem;
                        margin-top: 2rem;
                        cursor: pointer;
                        opacity: 0.5;
                    }
                    .btn-reset:hover { opacity: 1; }
                `}</style>

                {/* Global Spotify Player Styles */}
                <style>{`
                    /* Floating Spotify - Global Styles */
                    .spotify-float {
                        position: fixed !important;
                        top: 80px !important;
                        right: 24px !important;
                        z-index: 9999 !important;
                        background: rgba(255,255,255,0.95) !important;
                        backdrop-filter: blur(8px) !important;
                        border-radius: 50px !important;
                        width: 44px !important;
                        height: 44px !important;
                        display: flex !important;
                        align-items: center !important;
                        justify-content: center !important;
                        border: 1px solid rgba(0,0,0,0.1) !important;
                        cursor: pointer !important;
                        transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1) !important;
                        overflow: hidden !important;
                        box-shadow: 0 4px 20px rgba(0,0,0,0.15) !important;
                    }
                    .spotify-float:hover {
                        width: 300px !important;
                        height: 84px !important;
                        border-radius: 12px !important;
                        background: rgba(0,0,0,0.9) !important;
                    }
                    .spotify-icon { 
                        color: #1db954 !important; 
                        transition: opacity 0.3s !important; 
                        z-index: 2 !important;
                        position: relative !important;
                    }
                    .spotify-float:hover .spotify-icon { 
                        opacity: 0 !important; 
                        display: none !important; 
                    }
                    .spotify-float iframe { 
                        opacity: 0 !important; 
                        transition: opacity 0.5s ease 0.2s !important; 
                        width: 100% !important; 
                        height: 100% !important; 
                        position: absolute !important;
                        top: 0 !important;
                        left: 0 !important;
                        border-radius: 8px !important;
                    }
                    .spotify-float:hover iframe { 
                        opacity: 1 !important; 
                    }
                `}</style>

                <NoteSection
                    sender={data.sender}
                    recipient={data.recipient}
                    onOpen={() => setStarted(true)}
                />

                <SlotMachineSection />

                <DoodleSection />

                <CoffeeSection />

                <NudgeSection />

                <PlaylistSection songName={data.song} />

                <StickerSection />

                <NoReasonSection />

                <PhotoSection imageUrl={data.imageUrl} />

                <SignOffSection message={data.message} sender={data.sender} />
            </div>
        </>
    );
};

export default JustBecausePage;

