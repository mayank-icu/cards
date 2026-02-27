import React, { useEffect, useRef, useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import CardViewHeader from '../../components/CardViewHeader';
import {
    Cloud,
    Wind,
    Send,
    Wifi,
    HandHeart,
    CloudRain,
    Sun,
    Gift,
    MessageCircle,
    Music,
    User,
    Heart,
    Sparkles,
    ArrowDown
} from 'lucide-react';
import { normalizeCardData, resolveCardId } from '../../utils/slugs';

const styles = `
    :root {
        --bg-color: #F0F4F8;
        --text-color: #2D3748;
        --accent-blue: #63B3ED;
        --accent-teal: #4FD1C5;
        --font-main: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
    }

    * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
    
    body {
        margin: 0;
        padding: 0;
        font-family: var(--font-main);
        background-color: var(--bg-color);
        color: var(--text-color);
        overflow: hidden; /* Main container handles scroll */
    }

    /* SCROLL SNAP CONTAINER */
    .scrolly-container {
        height: 100dvh;
        width: 100vw;
        overflow-y: scroll;
        overflow-x: hidden;
        scroll-snap-type: y mandatory;
        scroll-behavior: smooth;
    }

    .snap-section {
        height: 100dvh;
        width: 100vw;
        scroll-snap-align: start;
        scroll-snap-stop: always;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        position: relative;
        text-align: center;
        padding: 2rem;
        background: radial-gradient(circle at 50% 50%, #ffffff 0%, #E0F7FA 100%);
        opacity: 0.99; /* Fix for stacking context */
    }

    /* UTILS */
    .card-glass {
        background: rgba(255, 255, 255, 0.7);
        backdrop-filter: blur(10px);
        padding: 3rem;
        border-radius: 24px;
        box-shadow: 0 10px 30px rgba(99, 179, 237, 0.2);
        border: 1px solid rgba(255,255,255,0.8);
        max-width: 90%;
        width: 400px;
    }

    button {
        border: none;
        background: var(--text-color);
        color: white;
        padding: 1rem 2rem;
        border-radius: 50px;
        font-size: 1rem;
        font-weight: 600;
        cursor: pointer;
        transition: transform 0.2s;
        display: flex;
        align-items: center;
        gap: 10px;
        margin: 2rem auto 0;
    }

    button:active { transform: scale(0.95); }
    button:disabled { opacity: 0.5; }

    /* ANIMATIONS */
    @keyframes float {
        0% { transform: translateY(0px); }
        50% { transform: translateY(-10px); }
        100% { transform: translateY(0px); }
    }

    @keyframes pulse-ring {
        0% { transform: scale(0.8); opacity: 0.8; }
        100% { transform: scale(2); opacity: 0; }
    }

    @keyframes spin-slow {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
    }

    .spin-slow { animation: spin-slow 10s linear infinite; }
    .bounce { animation: float 2s ease-in-out infinite; }
    .fade-in { animation: fadeIn 1s ease forwards; opacity: 0; }
    @keyframes fadeIn { to { opacity: 1; } }

    /* SECTION 1: COVER */
    .section-cover .main-header { font-size: 3rem; margin: 0.5rem 0; letter-spacing: -1px; }
    .section-cover .sub-header { text-transform: uppercase; letter-spacing: 2px; font-size: 0.8rem; color: #718096; }
    .scroll-hint { position: absolute; bottom: 2rem; opacity: 0.6; font-size: 0.8rem; }
    
    /* SECTION 2: CLOUDS */
    .sky-container { display: flex; flex-wrap: wrap; justify-content: center; gap: 2rem; margin-top: 2rem; }
    .cloud-wrapper { position: relative; cursor: pointer; transition: transform 0.3s; }
    .cloud-wrapper:hover { transform: scale(1.05); }
    .hidden-shape { 
        position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%) scale(0);
        transition: transform 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        display: flex; flex-direction: column; align-items: center; pointer-events: none;
    }
    .cloud-puff { transition: opacity 0.5s; filter: drop-shadow(0 10px 10px rgba(0,0,0,0.05)); }
    .cloud-wrapper.revealed .cloud-puff { opacity: 0.2; }
    .cloud-wrapper.revealed .hidden-shape { transform: translate(-50%, -50%) scale(1); }

    /* SECTION 3: FOG */
    .mind-knot { width: 200px; height: 200px; margin: 0 auto; transition: all 1s; }
    .mind-knot svg { width: 100%; height: 100%; overflow: visible; }
    .mind-knot.untangled { transform: scale(1.2); opacity: 0; }
    .clarity-btn { background: var(--accent-blue); }
    .clarity-btn.hide { display: none; }
    
    /* SECTION 4: PLANE */
    .paper-plane { 
        transition: all 1.5s cubic-bezier(0.4, 0, 0.2, 1); 
        transform: rotate(-10deg);
    }
    .paper-plane.fly-away {
        transform: translate(100vw, -50vh) rotate(20deg) scale(0.5);
        opacity: 0;
    }
    .manual-launch-btn { background: transparent; color: var(--text-color); border: 1px solid var(--text-color); }

    /* SECTION 5: TELEPATHY */
    .tower-container { position: relative; width: 100px; height: 100px; display: flex; align-items: center; justify-content: center; margin-bottom: 2rem; }
    .signal-ring {
        position: absolute; border: 2px solid var(--accent-teal); border-radius: 50%; width: 100%; height: 100%;
        animation: pulse-ring 2s linear infinite;
    }
    .ring-1 { animation-delay: 0s; }
    .ring-2 { animation-delay: 0.6s; }
    .ring-3 { animation-delay: 1.2s; }

    /* SECTION 6: HUG */
    .section-hug { overflow: hidden; }
    .arm { 
        position: absolute; top: 50%; width: 300px; height: 100px; 
        background: var(--text-color); border-radius: 50px; 
        transition: transform 0.8s cubic-bezier(0.34, 1.56, 0.64, 1);
        display: flex; align-items: center; padding: 0 20px;
    }
    .left-arm { left: -250px; justify-content: flex-end; }
    .right-arm { right: -250px; justify-content: flex-start; }
    .hand-icon { color: white; }
    .hand-icon.flipped { transform: scaleX(-1); }
    .left-arm.hugging { transform: translateX(200px) rotate(10deg); }
    .right-arm.hugging { transform: translateX(-200px) rotate(-10deg); }
    .avatar-center { font-size: 2rem; z-index: 2; background: white; padding: 20px; border-radius: 50%; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }

    /* SECTION 7: RAIN */
    .rain-container, .rain-canvas { position: absolute; top:0; left:0; width:100%; height:100%; }
    .cloud-btn-container { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); z-index: 10; color: #4A5568; }
    .rainbow {
        width: 300px; height: 150px; background: radial-gradient(circle at 50% 100%, transparent 40%, #a8e6cf 40%, #a8e6cf 50%, #dcedc1 50%, #dcedc1 60%, #ffd3b6 60%, #ffd3b6 70%, #ff8b94 70%);
        border-radius: 150px 150px 0 0; margin-bottom: 2rem;
    }
    .rainbow-container { display: flex; flex-direction: column; align-items: center; }

    /* SECTION 8: BUBBLES */
    .bubble-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 10px; background: rgba(0,0,0,0.05); padding: 20px; border-radius: 10px; }
    .bubble { width: 40px; height: 40px; background: linear-gradient(135deg, rgba(255,255,255,0.8), rgba(255,255,255,0.2)); border-radius: 50%; box-shadow: inset 2px 2px 5px rgba(255,255,255,1), 2px 2px 5px rgba(0,0,0,0.1); cursor: pointer; transition: transform 0.1s; }
    .bubble.popped { transform: scale(0.8); background: transparent; box-shadow: none; border: 1px dashed #cbd5e0; }

    /* SECTION 9: THOUGHTS */
    .thought-container { position: relative; width: 300px; height: 300px; display: flex; align-items: center; justify-content: center; transition: transform 3s ease-in; }
    .thought-bg { color: white; fill: white; filter: drop-shadow(0 10px 20px rgba(0,0,0,0.1)); }
    .thought-content { position: absolute; z-index: 2; width: 60%; }
    .thought-content textarea { width: 100%; border: none; background: #f7fafc; padding: 10px; border-radius: 8px; resize: none; font-family: inherit; }
    .floating-away { transform: translateY(-120vh) translateX(50px) rotate(10deg); opacity: 0; }

    /* SECTION 10: FLOWER */
    .doorbell-btn { width: 100px; height: 100px; border-radius: 50%; background: white; color: var(--text-color); box-shadow: 0 4px 6px rgba(0,0,0,0.1); flex-direction: column; justify-content: center; }
    .ring-outer { width: 120px; height: 120px; position: absolute; border: 1px solid var(--text-color); border-radius: 50%; animation: pulse-ring 2s infinite paused; }
    .doorbell-btn:active .ring-outer { animation-play-state: running; }
    .flower-bouquet { font-size: 4rem; margin-top: 1rem; animation: float 3s ease-in-out infinite; }
    
    .loading-screen {
        height: 100vh;
        display: flex;
        justify-content: center;
        align-items: center;
        color: var(--text-color);
        background: var(--bg-color);
    }
`;

/**
 * AUDIO ENGINE
 * Generates procedural ambient sounds using Web Audio API
 */
class AudioManager {
    constructor() {
        this.ctx = null;
        this.masterGain = null;
        this.oscillators = [];
        this.isMuted = false;
    }

    init() {
        if (!this.ctx) {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
            this.masterGain = this.ctx.createGain();
            this.masterGain.gain.value = 0.3;
            this.masterGain.connect(this.ctx.destination);
        }
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    playChime(note = 440, type = 'sine') {
        if (!this.ctx || this.isMuted) return;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(note, this.ctx.currentTime);

        gain.gain.setValueAtTime(0, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.2, this.ctx.currentTime + 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 3);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start();
        osc.stop(this.ctx.currentTime + 3.1);
    }

    playAmbience() {
        if (!this.ctx) return;
        // Low drone
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.frequency.value = 110;
        osc.type = 'triangle';
        gain.gain.value = 0.05;
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start();
        this.oscillators.push(osc);
    }
}

const audioManager = new AudioManager();

/**
 * MICROPHONE HOOK
 */
const useMicrophone = (onBlow) => {
    const [permission, setPermission] = useState('prompt');

    const startListening = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            setPermission('granted');
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const analyser = audioContext.createAnalyser();
            const microphone = audioContext.createMediaStreamSource(stream);
            const scriptProcessor = audioContext.createScriptProcessor(2048, 1, 1);

            analyser.smoothingTimeConstant = 0.8;
            analyser.fftSize = 1024;

            microphone.connect(analyser);
            analyser.connect(scriptProcessor);
            scriptProcessor.connect(audioContext.destination);

            scriptProcessor.onaudioprocess = function () {
                const array = new Uint8Array(analyser.frequencyBinCount);
                analyser.getByteFrequencyData(array);
                let values = 0;
                const length = array.length;
                for (let i = 0; i < length; i++) {
                    values += (array[i]);
                }
                const average = values / length;
                // Threshold for "blowing"
                if (average > 40) {
                    onBlow();
                }
            };
        } catch (err) {
            console.error("Mic denied", err);
            setPermission('denied');
        }
    };

    return { startListening, permission };
};

/**
 * SECTIONS
 */

// 1. Cover
const SectionCover = ({ recipient, sender, onStart }) => (
    <section className="snap-section section-cover">
        <div className="content-center">
            <div className="card-glass">
                <h3 className="sub-header">A Digital Card</h3>
                <h1 className="main-header">Thinking of You</h1>
                <p className="recipient-tag">For {recipient}</p>
                <button className="start-btn" onClick={onStart}>
                    <span className="icon-pulse"><Heart fill="currentColor" /></span>
                    <span>Open Card</span>
                </button>
            </div>
            <div className="scroll-hint">
                <p>Scroll to flip pages</p>
                <ArrowDown className="bounce" />
            </div>
        </div>
    </section>
);

// 2. Cloud Watching
const SectionClouds = () => {
    const [shapes, setShapes] = useState([false, false, false]);

    const reveal = (idx) => {
        const newShapes = [...shapes];
        newShapes[idx] = true;
        setShapes(newShapes);
        audioManager.playChime(300 + (idx * 100));
    };

    return (
        <section className="snap-section section-clouds">
            <h2 className="section-title">Cloud Nine</h2>
            <p className="section-instruction">Tap the clouds to see what they are.</p>
            <div className="sky-container">
                {[
                    { icon: <Heart size={60} color="#ff6b6b" />, label: "Love" },
                    { icon: <Sparkles size={60} color="#f6e05e" />, label: "Joy" },
                    { icon: <p style={{ fontSize: '2rem', margin: 0 }}>😊</p>, label: "Smiles" }
                ].map((item, i) => (
                    <div
                        key={i}
                        className={`cloud-wrapper cloud-${i} ${shapes[i] ? 'revealed' : ''}`}
                        onClick={() => reveal(i)}
                    >
                        <div className="cloud-puff">
                            <Cloud size={120} fill="white" color="white" />
                        </div>
                        <div className="hidden-shape">
                            {item.icon}
                            <span>{item.label}</span>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
};

// 3. Brain Fog
const SectionFog = () => {
    const [cleared, setCleared] = useState(false);

    const handleClear = () => {
        setCleared(true);
        audioManager.playChime(600, 'triangle');
    };

    return (
        <section className="snap-section section-fog">
            <div className="fog-content">
                <h2>Sometimes things feel messy...</h2>
                <div className={`mind-knot ${cleared ? 'untangled' : ''}`}>
                    <svg viewBox="0 0 200 200" className="scribble-svg">
                        <path d="M10,100 Q50,190 90,100 T190,100" stroke="#718096" strokeWidth="2" fill="none" className="line-1" />
                        <path d="M10,50 Q90,150 190,50" stroke="#718096" strokeWidth="2" fill="none" className="line-2" />
                        <path d="M20,150 Q100,20 180,150" stroke="#718096" strokeWidth="2" fill="none" className="line-3" />
                    </svg>
                </div>
                <button className={`clarity-btn ${cleared ? 'hide' : ''}`} onClick={handleClear}>
                    Tap for Clarity
                </button>
                {cleared && <p className="fade-in-text">...but I'm here to help you untangle.</p>}
            </div>
        </section>
    );
};

// 4. Paper Plane (Mic)
const SectionPlane = () => {
    const [launched, setLaunched] = useState(false);
    const { startListening, permission } = useMicrophone(() => launch());

    const launch = () => {
        if (launched) return;
        setLaunched(true);
        audioManager.playChime(880, 'sawtooth');
    };

    return (
        <section className="snap-section section-plane">
            <h2>Sending good vibes...</h2>
            <div className="plane-stage">
                <div className={`paper-plane ${launched ? 'fly-away' : ''}`}>
                    <Send size={80} strokeWidth={1} />
                </div>
            </div>

            {!launched && (
                <div className="interaction-area">
                    {permission === 'granted' ? (
                        <p className="mic-instruction">Blow into your microphone to launch!</p>
                    ) : (
                        <button className="manual-launch-btn" onClick={() => { startListening(); launch(); }}>
                            {permission === 'denied' ? 'Tap to Launch' : 'Enable Mic or Tap'}
                        </button>
                    )}
                </div>
            )}
        </section>
    );
};

// 5. Telepathy
const SectionTelepathy = () => (
    <section className="snap-section section-telepathy">
        <h2>Mental Connection</h2>
        <div className="tower-container">
            <Wifi size={60} className="tower-icon" />
            <div className="signal-ring ring-1"></div>
            <div className="signal-ring ring-2"></div>
            <div className="signal-ring ring-3"></div>
        </div>
        <p>Transmitting positive energy...</p>
    </section>
);

// 6. Hug
const SectionHug = () => {
    const [hugged, setHugged] = useState(false);

    return (
        <section
            className="snap-section section-hug"
            onClick={() => {
                setHugged(prev => !prev);
                if (!hugged) audioManager.playChime(300);
            }}
        >
            <div className={`arm left-arm ${hugged ? 'hugging' : ''}`}>
                <HandHeart size={100} className="hand-icon" />
            </div>
            <div className="avatar-center">
                {hugged ? "🫂" : "Tap for a hug"}
            </div>
            <div className={`arm right-arm ${hugged ? 'hugging' : ''}`}>
                <HandHeart size={100} className="hand-icon flipped" />
            </div>
        </section>
    );
};

// 7. Rain to Rainbow
const SectionRain = () => {
    const [raining, setRaining] = useState(true);
    const canvasRef = useRef(null);

    useEffect(() => {
        if (!raining) return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        let animationFrame;

        // Resize
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        const drops = Array.from({ length: 100 }).map(() => ({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            speed: 2 + Math.random() * 5,
            len: 10 + Math.random() * 20
        }));

        const draw = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.strokeStyle = 'rgba(174, 194, 224, 0.6)';
            ctx.lineWidth = 1;

            drops.forEach(drop => {
                ctx.beginPath();
                ctx.moveTo(drop.x, drop.y);
                ctx.lineTo(drop.x, drop.y + drop.len);
                ctx.stroke();

                drop.y += drop.speed;
                if (drop.y > canvas.height) {
                    drop.y = -drop.len;
                    drop.x = Math.random() * canvas.width;
                }
            });
            animationFrame = requestAnimationFrame(draw);
        };

        draw();
        return () => cancelAnimationFrame(animationFrame);
    }, [raining]);

    return (
        <section className="snap-section section-rain">
            {raining ? (
                <div className="rain-container" onClick={() => { setRaining(false); audioManager.playChime(523); }}>
                    <canvas ref={canvasRef} className="rain-canvas" />
                    <div className="cloud-btn-container">
                        <CloudRain size={64} className="rain-cloud" />
                        <p>Tap to stop the rain</p>
                    </div>
                </div>
            ) : (
                <div className="rainbow-container fade-in">
                    <div className="rainbow"></div>
                    <Sun size={80} className="sun spin-slow" color="#F6E05E" />
                    <p>Every storm runs out of rain.</p>
                </div>
            )}
        </section>
    );
};

// 8. Bubble Wrap
const SectionBubbles = () => {
    const [poppedCount, setPoppedCount] = useState(0);

    const pop = (e) => {
        if (e.target.classList.contains('popped')) return;
        e.target.classList.add('popped');
        setPoppedCount(c => c + 1);
        audioManager.playChime(600 + (Math.random() * 400), 'square');

        // Haptic feedback if available
        if (navigator.vibrate) navigator.vibrate(50);
    };

    return (
        <section className="snap-section section-bubbles">
            <h2>Pop the stress away</h2>
            <div className="bubble-grid">
                {Array.from({ length: 25 }).map((_, i) => (
                    <div key={i} className="bubble" onClick={pop}></div>
                ))}
            </div>
            <p className="pop-counter">{poppedCount} pops</p>
        </section>
    );
};

// 9. Thought Bubble
const SectionThoughts = ({ senderThoughts }) => {
    const [thought, setThought] = useState('');
    const [sent, setSent] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        setSent(true);
        audioManager.playChime(400);
    };

    return (
        <section className="snap-section section-thoughts">
            <h2>Send a thought back</h2>
            <div className={`thought-container ${sent ? 'floating-away' : ''}`}>
                <MessageCircle size={300} className="thought-bg" strokeWidth={0.5} />
                <div className="thought-content">
                    {sent ? (
                        <h3>Floated away...</h3>
                    ) : (
                        <form onSubmit={handleSubmit}>
                            <textarea
                                placeholder="Type a thought..."
                                value={thought}
                                onChange={e => setThought(e.target.value)}
                            />
                            <button type="submit" disabled={!thought}>Float It</button>
                        </form>
                    )}
                </div>
            </div>
        </section>
    );
};

// 10. Flower Delivery
const SectionFlowers = () => {
    const [delivered, setDelivered] = useState(false);

    const ringBell = () => {
        setDelivered(true);
        audioManager.playChime(600, 'sine');
        setTimeout(() => audioManager.playChime(450, 'sine'), 300); // Ding-dong
    };

    return (
        <section className="snap-section section-flowers">
            {!delivered ? (
                <button className="doorbell-btn" onClick={ringBell}>
                    <div className="ring-outer"></div>
                    Tap Bell
                </button>
            ) : (
                <div className="flowers-reveal fade-in">
                    <Gift size={120} color="#ff6b6b" />
                    <h3>A small delivery for you.</h3>
                    <div className="flower-bouquet">💐 🌻 🌹</div>
                </div>
            )}
        </section>
    );
};

// 11. Closing
const SectionClosing = ({ sender, message, song }) => (
    <section className="snap-section section-closing">
        <div className="card-glass">
            <p className="final-message">"{message}"</p>
            <div className="signature">
                <p>Warmly,</p>
                <h2>{sender}</h2>
            </div>
            {song && (
                <div className="mini-player">
                    <Music size={16} />
                    <span>Listening to: {song.name} - {song.artist}</span>
                </div>
            )}
        </div>
    </section>
);


/**
 * MAIN COMPONENT
 */
const ThinkingOfYouView = () => {
    const { wishId } = useParams();
    const [wishData, setWishData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [started, setStarted] = useState(false);

    useEffect(() => {
        const fetchWishData = async () => {
            try {
                const result = await resolveCardId(wishId, 'wishes', 'thinking-of-you');
                if (result) {
                    setWishData(normalizeCardData(result.data));
                } else {
                    // Fallback for demo purposes if ID doesn't exist
                    setWishData({
                        recipientName: "Friend",
                        sender: "Secret Admirer",
                        message: "Just wanted to say hi and hope you are having a wonderful day!",
                        thoughts: "I saw a cloud that looked like a bunny and thought of you.",
                        song: {
                            name: "Weightless",
                            artist: "Marconi Union",
                            previewUrl: null
                        }
                    });
                }
            } catch (error) {
                console.log("Using default data due to connection/id error");
                setWishData({
                    recipientName: "Friend",
                    sender: "Secret Admirer",
                    message: "Just wanted to say hi and hope you are having a wonderful day!",
                    thoughts: "I saw a cloud that looked like a bunny and thought of you.",
                    song: {
                        name: "Weightless",
                        artist: "Marconi Union",
                        previewUrl: null
                    }
                });
            } finally {
                setLoading(false);
            }
        };

        fetchWishData();
    }, [wishId]);

    const handleStart = () => {
        setStarted(true);
        audioManager.init();
        audioManager.playAmbience();

        // Auto scroll to next section after a beat
        setTimeout(() => {
            const el = document.querySelector('.section-clouds');
            el?.scrollIntoView({ behavior: 'smooth' });
        }, 800);
    };

    if (loading) return <div className="loading-screen">Preparing Cloud Nine...</div>;

    // Helper to get Spotify ID
    const getSpotifyId = (url) => {
        if (!url) return null;
        try {
            const parts = url.split('/');
            return parts[parts.length - 1].split('?')[0];
        } catch (e) { return null; }
    };
    const spotifyId = getSpotifyId(wishData?.spotify);

    return (
        <>
            <style>{styles}</style>

            {/* Header overlay */}
            <div style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100 }}>
                <CardViewHeader
                    cardType="thinking-of-you"
                    cardId={wishId}
                    title="Thinking of You"
                    subtitle={wishData?.recipientName ? `For ${wishData.recipientName}` : undefined}
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

            <div className="scrolly-container">
                <SectionCover
                    recipient={wishData?.recipientName}
                    onStart={handleStart}
                />

                <SectionClouds />

                <SectionFog />

                <SectionPlane />

                <SectionTelepathy />

                <SectionHug />

                <SectionRain />

                <SectionBubbles />

                <SectionThoughts />

                <SectionFlowers />

                <SectionClosing
                    sender={wishData?.sender}
                    message={wishData?.message}
                    song={wishData?.song}
                />
            </div>
        </>
    );
};

export default ThinkingOfYouView;
