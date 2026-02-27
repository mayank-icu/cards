import React, { useEffect, useRef, useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { gsap } from 'gsap';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import CardViewHeader from '../../components/CardViewHeader';
import SongPlayer from '../../components/SongPlayer';
import { resolveCardId } from '../../utils/slugs';
import {
    Wind,
    Mic,
    MousePointer2,
    Target,
    Droplets,
    Flame,
    Dog,
    Cloud,
    ArrowUp,
    Sparkles,
    Music,
    Volume2,
    Play,
    Pause
} from 'lucide-react';

/* ========================================
  AUDIO ENGINE (Web Audio API)
  Generates sounds procedurally to avoid external asset loading issues.
  ========================================
*/
class AudioEngine {
    constructor() {
        this.ctx = null;
        this.masterGain = null;
        this.analyser = null;
        this.dataArray = null;
        this.microphoneStream = null;
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

    playPop() {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(200, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(50, this.ctx.currentTime + 0.1);

        gain.gain.setValueAtTime(1, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.1);

        osc.start();
        osc.stop(this.ctx.currentTime + 0.1);
    }

    playInflate() {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.connect(gain);
        gain.connect(this.masterGain);

        // Squeaky rubber sound
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(300, this.ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(400, this.ctx.currentTime + 0.1);

        gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.1);

        osc.start();
        osc.stop(this.ctx.currentTime + 0.15);
    }

    playSplash() {
        if (!this.ctx) return;
        const bufferSize = this.ctx.sampleRate * 0.5; // 0.5 seconds
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 2);
        }

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;
        const gain = this.ctx.createGain();

        // Lowpass filter for "watery" sound
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 1000;

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);

        gain.gain.setValueAtTime(0.8, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.5);

        noise.start();
    }

    async initMicrophone() {
        if (this.microphoneStream) return true;
        try {
            this.init();
            this.microphoneStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
            const source = this.ctx.createMediaStreamSource(this.microphoneStream);
            this.analyser = this.ctx.createAnalyser();
            this.analyser.fftSize = 256;
            source.connect(this.analyser);
            this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
            return true;
        } catch (err) {
            console.warn("Microphone access denied or not supported", err);
            return false;
        }
    }

    getVolume() {
        if (!this.analyser || !this.dataArray) return 0;
        this.analyser.getByteFrequencyData(this.dataArray);
        let sum = 0;
        for (let i = 0; i < this.dataArray.length; i++) {
            sum += this.dataArray[i];
        }
        return sum / this.dataArray.length;
    }
}

const audioController = new AudioEngine();

/* ========================================
  STYLES & VISUALS
  No Tailwind/Bootstrap. Pure CSS.
  ========================================
*/
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;700;900&display=swap');

  :root {
    --bg-dark: #0f1014;
    --text-light: #f4f4f5;
    --accent-red: #ff3b30;
    --accent-blue: #007aff;
    --accent-yellow: #ffcc00;
    --accent-purple: #af52de;
    --glass: rgba(255, 255, 255, 0.1);
    --border: rgba(255, 255, 255, 0.15);
  }

  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
    -webkit-font-smoothing: antialiased;
  }

  body {
    background-color: var(--bg-dark);
    color: var(--text-light);
    font-family: 'Inter', sans-serif;
    overflow: hidden; /* Prevent default scroll */
  }

  /* MAIN SCROLL CONTAINER */
  .scrolly-container {
    height: 100dvh;
    overflow-y: scroll;
    scroll-snap-type: y mandatory;
    scroll-behavior: smooth;
    position: relative;
  }

  /* SECTIONS */
  section {
    height: 100dvh;
    width: 100%;
    scroll-snap-align: start;
    position: relative;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    overflow: hidden;
    padding: 2rem;
    perspective: 1000px;
  }

  /* TYPOGRAPHY */
  h1 { font-size: 3rem; font-weight: 900; letter-spacing: -0.05em; margin-bottom: 1rem; text-align: center; }
  h2 { font-size: 2rem; font-weight: 700; margin-bottom: 1.5rem; text-align: center; }
  p { font-size: 1.1rem; color: #a1a1aa; max-width: 500px; text-align: center; line-height: 1.6; }
  .instruction {
    margin-top: 2rem;
    font-size: 0.9rem;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--accent-blue);
    display: flex;
    align-items: center;
    gap: 0.5rem;
    animation: pulse 2s infinite;
  }

  /* UI ELEMENTS */
  .btn {
    background: var(--text-light);
    color: var(--bg-dark);
    border: none;
    padding: 1rem 2rem;
    font-size: 1rem;
    font-weight: 700;
    border-radius: 50px;
    cursor: pointer;
    transition: transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    margin-top: 2rem;
  }
  .btn:active { transform: scale(0.95); }
  .btn.outline { background: transparent; border: 2px solid var(--text-light); color: var(--text-light); }
  
  /* MICRO-INTERACTIONS */
  .balloon-wrapper {
    position: relative;
    transition: transform 0.3s ease;
    cursor: pointer;
  }

  .canvas-layer {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    z-index: 1;
  }
  
  .touch-layer {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 2;
    touch-action: none; /* Critical for custom gestures */
  }

  /* Section Specifics */
  .helium-text { transition: transform 0.1s; display: inline-block; }
  .grid-wall { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; width: 100%; max-width: 400px; z-index: 5; }
  .grid-balloon { 
    aspect-ratio: 1; background: var(--accent-red); border-radius: 50%; 
    box-shadow: inset -5px -5px 10px rgba(0,0,0,0.2); cursor: crosshair;
    transition: transform 0.2s, opacity 0.2s;
  }
  .grid-balloon:hover { transform: scale(1.1); }
  
  .target-zone {
    width: 200px; height: 200px; border: 4px dashed var(--border);
    border-radius: 50%; display: flex; justify-content: center; align-items: center;
    position: relative;
  }

  /* Animations */
  @keyframes float {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-20px); }
  }
  @keyframes pulse {
    0%, 100% { opacity: 0.5; }
    50% { opacity: 1; }
  }
  @keyframes popBurst {
    0% { transform: scale(0); opacity: 1; }
    100% { transform: scale(2); opacity: 0; }
  }
  @keyframes cloudFloat {
    from { transform: translateX(0); }
    to { transform: translateX(calc(100vw + 200px)); }
  }
  @keyframes windPulse {
    0%, 100% { opacity: 0.3; transform: translateX(-50%) scaleX(1); }
    50% { opacity: 0.8; transform: translateX(-50%) scaleX(1.2); }
  }
  @keyframes balloonWiggle {
    0%, 100% { transform: rotate(-2deg); }
    50% { transform: rotate(2deg); }
  }
  @keyframes dogWag {
    0%, 100% { transform: rotate(-2deg); }
    50% { transform: rotate(2deg); }
  }
  @keyframes bunnyHop {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-10px); }
  }
  @keyframes birdFly {
    0%, 100% { transform: translateY(0) rotate(-2deg); }
    50% { transform: translateY(-5px) rotate(2deg); }
  }
  @keyframes wingFlap {
    0%, 100% { transform: rotate(-20deg); }
    50% { transform: rotate(-40deg); }
  }

  /* Utilities */
  .color-red { color: var(--accent-red); }
  .color-blue { color: var(--accent-blue); }
  .color-yellow { color: var(--accent-yellow); }
  .hidden { opacity: 0; pointer-events: none; }
  .visible { opacity: 1; pointer-events: auto; }

  /* Enhanced Floating Spotify Player */
  .floating-spotify-player {
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 2000;
    background: rgba(15, 16, 20, 0.95);
    backdrop-filter: blur(15px);
    padding: 12px;
    border-radius: 50px;
    box-shadow: 0 8px 32px rgba(255, 204, 0, 0.15);
    display: flex;
    align-items: center;
    gap: 12px;
    border: 2px solid var(--accent-yellow);
    transition: all 0.3s ease;
    animation: slideInRight 0.6s ease-out;
  }
  
  .floating-spotify-player:hover {
    transform: scale(1.05);
    box-shadow: 0 12px 40px rgba(255, 204, 0, 0.25);
    background: rgba(15, 16, 20, 1);
  }
  
  .spotify-disc {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: linear-gradient(135deg, #1db954, #191414);
    overflow: hidden;
    animation: spin 4s linear infinite;
    border: 2px solid var(--accent-yellow);
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
    color: var(--text-light);
    font-family: 'Inter', sans-serif;
    font-weight: 600;
  }
  
  .scrolling-text {
    display: inline-block;
    white-space: nowrap;
    animation: scrollText 12s linear infinite;
  }
  
  .mini-play-btn {
    background: var(--accent-yellow);
    border: none;
    color: var(--bg-dark);
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
    background: var(--accent-red);
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

  /* Mobile Responsive Fixes */
  @media (max-width: 768px) {
    .scrolly-container {
      -webkit-overflow-scrolling: touch;
      scroll-snap-type: y mandatory;
    }
    
    section {
      touch-action: pan-y;
      -webkit-touch-callout: none;
      -webkit-user-select: none;
      user-select: none;
    }
    
    .grid-wall {
      grid-template-columns: repeat(3, 1fr);
      gap: 0.5rem;
      max-width: 300px;
    }
    
    .grid-balloon {
      min-height: 80px;
    }
    
    .target-zone {
      width: 150px;
      height: 150px;
    }
    
    h1 { font-size: 2rem; }
    h2 { font-size: 1.5rem; }
    p { font-size: 1rem; }
    
    .btn {
      padding: 0.8rem 1.5rem;
      font-size: 0.9rem;
    }
  }
`;

/* ========================================
  ENHANCED COMPONENTS
  ========================================
*/

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
                <span className="scrolling-text">{song.name || "Our Song"} - {song.artist || "Artist"}</span>
            </div>
            <button 
                className="mini-play-btn" 
                onClick={() => setIsPlaying(!isPlaying)}
            >
                {isPlaying ? <Pause size={14} /> : <Play size={14} />}
            </button>
            <SongPlayer song={song} isPlaying={isPlaying} setIsPlaying={setIsPlaying} />
        </div>
    );
};

/* ========================================
  BALLOON COMPONENTS
  ========================================
*/

const Balloon = ({ color = "red", scale = 1, rotation = 0, style }) => (
    <svg
        width="100" height="120" viewBox="0 0 100 120"
        style={{ transform: `scale(${scale}) rotate(${rotation}deg)`, ...style }}
        className="balloon-svg"
    >
        <path
            d="M50 0 C20 0 0 25 0 55 C0 90 40 100 48 115 L52 115 C60 100 100 90 100 55 C100 25 80 0 50 0 Z"
            fill={color === 'red' ? 'var(--accent-red)' : color === 'blue' ? 'var(--accent-blue)' : 'var(--accent-yellow)'}
            stroke="rgba(0,0,0,0.1)"
            strokeWidth="1"
        />
        <path
            d="M48 115 L52 115 L50 125 Z"
            fill="#666"
        />
    </svg>
);

const GridBalloon = ({ index }) => {
    const [popped, setPopped] = React.useState(false);
    const colors = ['red', 'blue', 'yellow', 'green', 'purple', 'orange'];
    const color = colors[index % colors.length];
    
    const handleClick = () => {
        if (!popped) {
            setPopped(true);
            // Play pop sound if audio engine is available
            try {
                const audio = new AudioEngine();
                audio.init();
                audio.playPop();
            } catch (e) {
                // Ignore audio errors
            }
        }
    };
    
    if (popped) {
        return (
            <div style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative'
            }}>
                <div style={{
                    position: 'absolute',
                    width: '60%',
                    height: '60%',
                    background: 'radial-gradient(circle, rgba(255,255,255,0.8) 0%, transparent 70%)',
                    borderRadius: '50%',
                    animation: 'popBurst 0.3s ease-out'
                }} />
                <div style={{
                    position: 'absolute',
                    width: '30%',
                    height: '30%',
                    background: 'rgba(255,255,255,0.4)',
                    borderRadius: '50%',
                    animation: 'popBurst 0.3s ease-out 0.1s'
                }} />
                <div style={{
                    position: 'absolute',
                    width: '15%',
                    height: '15%',
                    background: 'rgba(255,255,255,0.2)',
                    borderRadius: '50%',
                    animation: 'popBurst 0.3s ease-out 0.2s'
                }} />
            </div>
        );
    }
    
    return (
        <div onClick={handleClick} className="grid-balloon">
            <Balloon color={color} scale={0.8} />
        </div>
    );
};

const Section = ({ id, children, onVisible }) => {
    const ref = useRef(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    onVisible && onVisible();
                    // GSAP Reveal
                    gsap.fromTo(ref.current.children,
                        { y: 50, opacity: 0 },
                        { y: 0, opacity: 1, duration: 0.8, stagger: 0.1, ease: "power3.out" }
                    );
                }
            },
            { threshold: 0.5 }
        );
        if (ref.current) observer.observe(ref.current);
        return () => observer.disconnect();
    }, [onVisible]);

    return (
        <section id={id} ref={ref}>
            {children}
        </section>
    );
};

/* ========================================
  MAIN APP COMPONENT
  ========================================
*/
const BalloonCelebrationView = () => {
    const { wishId } = useParams();
    const [wishData, setWishData] = useState(null);
    const [loading, setLoading] = useState(true);

    // -- State --
    const [started, setStarted] = useState(false);

    // Section 1: Pump
    const [pumpScale, setPumpScale] = useState(1);
    const [popped, setPopped] = useState(false);

    // Section 3: Mic
    const [micActive, setMicActive] = useState(false);
    const [volume, setVolume] = useState(0);
    const [micFailed, setMicFailed] = useState(false);
    const micRef = useRef(null); // Animation frame

    // Section 4: Hair
    const canvasHairRef = useRef(null);

    // Section 6: Water
    const [waterDropY, setWaterDropY] = useState(0);
    const [splashed, setSplashed] = useState(false);

    // Section 7: Hot Air
    const [altitude, setAltitude] = useState(0);

    // Section 8: Twist
    const [twistStep, setTwistStep] = useState(0);

    // --- DATA FETCHING ---
    useEffect(() => {
        const fetchWishData = async () => {
            try {
                const result = await resolveCardId(wishId, 'wishes', 'balloon-celebration');
                if (result) {
                    setWishData(result.data);
                } else {
                    // Fallback
                    setWishData({
                        recipientName: "Friend",
                        sender: "Me",
                        message: "Let's celebrate with balloons and joy!",
                        celebrationReason: "Just Because!",
                    });
                }
            } catch (error) {
                console.error("Error fetching wish:", error);
                setWishData({
                    recipientName: "Friend",
                    sender: "Me",
                    message: "Let's celebrate with balloons and joy!",
                    celebrationReason: "Just Because!",
                });
            } finally {
                setLoading(false);
            }
        };
        fetchWishData();
    }, [wishId]);

    // -- Handlers --

    const handleStart = () => {
        setStarted(true);
        audioController.init();
        // Smooth scroll to next section
        document.getElementById('pump').scrollIntoView({ behavior: 'smooth' });
    };

    const handlePump = () => {
        if (popped) return;
        audioController.playInflate();
        const newScale = pumpScale + 0.15;
        setPumpScale(newScale);

        if (newScale > 2.5) {
            setPopped(true);
            audioController.playPop();
            triggerConfetti();
        }
    };

    const triggerConfetti = () => {
        // Basic DOM confetti fallback or specialized logic
        // Using a simple state visual change for this demo complexity
    };

    const startMicListener = async () => {
        const success = await audioController.initMicrophone();
        if (success) {
            setMicActive(true);
            const loop = () => {
                const vol = audioController.getVolume();
                setVolume(vol);
                micRef.current = requestAnimationFrame(loop);
            };
            loop();
        } else {
            setMicFailed(true);
        }
    };

    const handleHairMove = (e) => {
        const canvas = canvasHairRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const rect = canvas.getBoundingClientRect();

        // Support touch or mouse
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;

        const x = clientX - rect.left;
        const y = clientY - rect.top;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw "Hair"
        const centerX = canvas.width / 2;
        const centerY = canvas.height;

        for (let i = 0; i < 50; i++) {
            const baseX = (canvas.width / 50) * i;
            const baseY = canvas.height;

            const angle = Math.atan2(y - baseY, x - baseX);
            const len = 100; // Hair length

            ctx.beginPath();
            ctx.moveTo(baseX, baseY);
            ctx.lineTo(baseX + Math.cos(angle) * len, baseY + Math.sin(angle) * len);
            ctx.strokeStyle = `rgba(255, 255, 255, ${0.2 + (i / 100)})`;
            ctx.lineWidth = 2;
            ctx.stroke();
        }
    };

    const dropWaterBalloon = () => {
        if (splashed) {
            setSplashed(false);
            setWaterDropY(0);
            return;
        }

        // Simple JS animation loop for drop
        let pos = 0;
        const dropAnim = setInterval(() => {
            pos += 15;
            setWaterDropY(pos);
            if (pos > 200) {
                clearInterval(dropAnim);
                setSplashed(true);
                audioController.playSplash();
            }
        }, 16);
    };

    // Render Loop for Static Hair Canvas init
    useEffect(() => {
        if (canvasHairRef.current) {
            const cvs = canvasHairRef.current;
            cvs.width = cvs.parentElement.offsetWidth;
            cvs.height = cvs.parentElement.offsetHeight;
        }
    }, []);

    if (loading) return <div className="loading-screen">Loading celebration...</div>;
    if (!wishData) return <div className="loading-screen">Message not found.</div>;

    return (
        <div className="scrolly-container">
            <style>{styles}</style>
            
            <CardViewHeader
                cardType="balloon-celebration"
                cardId={wishId}
                title="Balloon Celebration"
                subtitle={wishData.recipientName ? `For ${wishData.recipientName}` : undefined}
            />

            {/* Enhanced Floating Spotify Player */}
            {wishData?.song && <EnhancedSongPlayer song={wishData.song} />}

            {/* SECTION 1: COVER */}
            <Section id="cover">
                <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'radial-gradient(circle at 50% 50%, #1a1b26 0%, #000 100%)', zIndex: -1 }} />
                <h2 style={{ color: 'var(--accent-yellow)', textTransform: 'uppercase', letterSpacing: '4px', fontSize: '1rem' }}>
                    Interactive Wish
                </h2>
                <h1 className="title-text">
                    <span style={{ display: 'block' }}>Let's Celebrate</span>
                    <span style={{ display: 'block', color: 'var(--accent-blue)' }}>{wishData.recipientName}</span>
                </h1>
                <p>A scrollytelling experience made just for you.</p>
                {!started ? (
                    <button className="btn" onClick={handleStart}>
                        Start Celebration <Sparkles size={16} style={{ marginLeft: 8 }} />
                    </button>
                ) : (
                    <div className="instruction">
                        Scroll Down <ArrowUp style={{ transform: 'rotate(180deg)' }} />
                    </div>
                )}
            </Section>

            {/* SECTION 2: THE PUMP */}
            <Section id="pump">
                <h2>Pump it Up</h2>
                <p>Tap repeatedly to inflate.</p>

                <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '2rem 0' }}>
                    {!popped ? (
                        <Balloon scale={pumpScale} />
                    ) : (
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '4rem' }}>💥</div>
                            <div style={{ position: 'absolute', width: '10px', height: '10px', background: 'red', boxShadow: '0 0 10px red', animation: 'float 1s infinite' }} />
                            {/* Simplified particles for React cleanliness */}
                        </div>
                    )}
                </div>

                <button
                    className="btn outline"
                    onClick={handlePump}
                    style={{ transform: 'scale(1)', transition: 'transform 0.05s' }}
                >
                    {popped ? "Done!" : "PUMP!"}
                </button>
            </Section>

            {/* SECTION 3: HELIUM VOICE (TEXT EFFECT) */}
            <Section id="helium">
                <h2>Helium Voice</h2>
                <p>Read the text below in your squeakiest voice.</p>
                <div style={{ marginTop: '3rem', fontSize: '2.5rem', fontWeight: 'bold', textAlign: 'center', lineHeight: 1.2 }}>
                    {"I sound like a chipmunk!".split("").map((char, i) => (
                        <span
                            key={i}
                            className="helium-text"
                            style={{
                                animation: `float ${0.5 + Math.random()}s infinite alternate`,
                                color: i % 2 === 0 ? 'var(--accent-purple)' : 'white'
                            }}
                        >
                            {char === " " ? "\u00A0" : char}
                        </span>
                    ))}
                </div>
                <div className="instruction">
                    <Wind size={16} /> Keep Scrolling
                </div>
            </Section>

            {/* SECTION 4: LIFT OFF (MIC) */}
            <Section id="liftoff" onVisible={() => !micActive && !micFailed && startMicListener()}>
                <h2>Lift Off</h2>
                <p>
                    {micFailed
                        ? "Microphone unavailable. Tap to fly!"
                        : "Blow into your microphone to lift the balloon."}
                </p>

                <div style={{
                    height: '400px',
                    width: '100%',
                    position: 'relative',
                    borderBottom: '1px solid var(--border)',
                    marginTop: '2rem',
                    overflow: 'hidden',
                    background: 'linear-gradient(to bottom, #87CEEB 0%, #E0F7FA 50%, #fff 100%)'
                }}>
                    {/* Animated Clouds */}
                    <div style={{
                        position: 'absolute',
                        top: '10%',
                        left: '-100px',
                        width: '80px',
                        height: '40px',
                        background: 'rgba(255,255,255,0.8)',
                        borderRadius: '40px',
                        animation: 'cloudFloat 15s linear infinite',
                        boxShadow: '0 5px 10px rgba(0,0,0,0.1)'
                    }} />
                    <div style={{
                        position: 'absolute',
                        top: '30%',
                        right: '-100px',
                        width: '100px',
                        height: '50px',
                        background: 'rgba(255,255,255,0.6)',
                        borderRadius: '50px',
                        animation: 'cloudFloat 20s linear infinite 5s',
                        boxShadow: '0 5px 10px rgba(0,0,0,0.1)'
                    }} />
                    <div style={{
                        position: 'absolute',
                        top: '60%',
                        left: '-120px',
                        width: '90px',
                        height: '45px',
                        background: 'rgba(255,255,255,0.7)',
                        borderRadius: '45px',
                        animation: 'cloudFloat 18s linear infinite 10s',
                        boxShadow: '0 5px 10px rgba(0,0,0,0.1)'
                    }} />

                    <div style={{
                        position: 'absolute',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        transition: 'bottom 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                        bottom: micFailed ? `${volume}%` : `${Math.min(volume * 2, 90)}%`,
                        filter: volume > 50 ? 'drop-shadow(0 10px 20px rgba(0,0,0,0.2))' : 'none'
                    }}>
                        <Balloon color="blue" scale={1.2} />
                        {/* String */}
                        <div style={{
                            position: 'absolute',
                            bottom: '-30px',
                            left: '50%',
                            width: '2px',
                            height: '30px',
                            background: '#666',
                            transform: 'translateX(-50%)'
                        }} />
                        {/* Basket */}
                        <div style={{
                            position: 'absolute',
                            bottom: '-50px',
                            left: '50%',
                            width: '40px',
                            height: '20px',
                            background: 'brown',
                            borderRadius: '0 0 10px 10px',
                            transform: 'translateX(-50%)',
                            boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
                        }} />
                    </div>

                    {/* Wind Effect */}
                    {volume > 30 && (
                        <div style={{
                            position: 'absolute',
                            bottom: '10%',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            width: `${volume * 2}px`,
                            height: '20px',
                            background: 'linear-gradient(to right, transparent, rgba(255,255,255,0.6), transparent)',
                            borderRadius: '50%',
                            animation: 'windPulse 0.5s ease-in-out infinite'
                        }} />
                    )}
                </div>

                {micActive && (
                    <div className="instruction" style={{ marginTop: '1rem' }}>
                        <Mic size={16} /> Volume: {Math.round(volume)}
                        <div style={{
                            width: '200px',
                            height: '10px',
                            background: 'rgba(255,255,255,0.2)',
                            borderRadius: '5px',
                            marginTop: '10px',
                            overflow: 'hidden'
                        }}>
                            <div style={{
                                width: `${Math.min(volume * 2, 100)}%`,
                                height: '100%',
                                background: 'var(--accent-yellow)',
                                borderRadius: '5px',
                                transition: 'width 0.1s'
                            }} />
                        </div>
                    </div>
                )}

                {micFailed && (
                    <button
                        className="btn"
                        onMouseDown={() => setVolume(80)}
                        onMouseUp={() => setVolume(0)}
                        onTouchStart={() => setVolume(80)}
                        onTouchEnd={() => setVolume(0)}
                    >
                        Hold to Fly
                    </button>
                )}
            </Section>

            {/* SECTION 5: STATIC HAIR */}
            <Section id="static">
                <h2>Static Electricity</h2>
                <p>Rub the balloon against the screen.</p>

                <div
                    style={{ width: '100%', height: '400px', position: 'relative', touchAction: 'none' }}
                    onMouseMove={handleHairMove}
                    onTouchMove={handleHairMove}
                >
                    {/* Visual Guide Balloon following cursor logic would go here, 
               but for simplicity we assume the user's finger is the balloon */}
                    <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', pointerEvents: 'none' }}>
                        <div style={{ width: '100px', height: '100px', background: 'var(--border)', borderRadius: '50%' }}>
                            <div style={{ padding: '40px 0', textAlign: 'center', opacity: 0.5 }}>HEAD</div>
                        </div>
                    </div>

                    <canvas
                        ref={canvasHairRef}
                        className="touch-layer"
                        style={{ width: '100%', height: '100%' }}
                    />
                </div>
                <div className="instruction"><MousePointer2 size={16} /> Rub Area</div>
            </Section>

            {/* SECTION 6: DART THROW */}
            <Section id="darts">
                <h2>Pop the Wall</h2>
                <p>Click balloons to pop them.</p>
                <div className="grid-wall">
                    {Array.from({ length: 12 }).map((_, i) => (
                        <GridBalloon key={i} index={i} />
                    ))}
                </div>
                <div className="instruction"><Target size={16} /> Aim True</div>
            </Section>

            {/* SECTION 7: WATER BALLOON */}
            <Section id="water">
                <h2>Water Balloon</h2>
                <p>Tap to drop.</p>

                <div className="target-zone" onClick={dropWaterBalloon}>
                    {!splashed ? (
                        <div style={{
                            position: 'absolute',
                            top: waterDropY,
                            transition: 'none',
                            transform: `scaleY(${1 + waterDropY / 400})` // Stretch effect
                        }}>
                            <Balloon color="blue" scale={0.8} style={{ filter: 'drop-shadow(0 5px 10px rgba(0,0,0,0.5))' }} />
                        </div>
                    ) : (
                        <div style={{ color: 'var(--accent-blue)' }}>
                            <Droplets size={80} />
                        </div>
                    )}

                    <div style={{ position: 'absolute', bottom: -20, opacity: 0.5 }}>TARGET</div>
                </div>
            </Section>

            {/* SECTION 8: HOT AIR (Parallax) */}
            <Section id="hotair">
                <h2>Rise Above</h2>
                <p>Hold to ignite the burner.</p>

                <div
                    style={{
                        height: '400px',
                        width: '100%',
                        position: 'relative',
                        overflow: 'hidden',
                        borderRadius: '12px',
                        background: 'linear-gradient(to bottom, #87CEEB 0%, #E0F7FA 100%)'
                    }}
                    onMouseDown={() => setAltitude(200)}
                    onMouseUp={() => setAltitude(0)}
                    onTouchStart={() => setAltitude(200)}
                    onTouchEnd={() => setAltitude(0)}
                >
                    {/* Moving Background (Clouds) */}
                    <div style={{
                        position: 'absolute',
                        width: '100%',
                        height: '200%',
                        top: altitude > 0 ? '0%' : '-50%',
                        transition: 'top 4s linear',
                        background: 'url("data:image/svg+xml,%3Csvg width=\'100\' height=\'100\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M10 50 Q25 30 40 50 T70 50 T100 50\' stroke=\'white\' fill=\'none\'/%3E%3C/svg%3E")',
                        opacity: 0.5
                    }} />

                    {/* Balloon Assembly */}
                    <div style={{
                        position: 'absolute',
                        left: '50%',
                        top: '50%',
                        transform: 'translate(-50%, -50%)',
                        textAlign: 'center'
                    }}>
                        <div style={{
                            width: '120px',
                            height: '140px',
                            background: 'var(--accent-red)',
                            borderRadius: '50% 50% 50% 50% / 60% 60% 40% 40%',
                            position: 'relative',
                            boxShadow: 'inset -10px -10px 20px rgba(0,0,0,0.2)'
                        }}>
                            <div style={{ position: 'absolute', top: '100%', left: '35%', width: '30%', height: '40px', background: 'brown' }}></div> {/* Basket */}
                        </div>

                        {/* Fire */}
                        <div style={{
                            position: 'absolute',
                            top: '100%', left: '50%', transform: 'translateX(-50%)',
                            opacity: altitude > 0 ? 1 : 0,
                            transition: 'opacity 0.2s'
                        }}>
                            <Flame color="orange" size={40} fill="yellow" />
                        </div>
                    </div>
                </div>
            </Section>

            {/* SECTION 9: TWISTING */}
            <Section id="twist">
                <h2>Animal Magic</h2>
                <p>Click to twist the balloon into different animals.</p>

                <div
                    onClick={() => {
                        audioController.playInflate();
                        setTwistStep(prev => prev >= 3 ? 0 : prev + 1);
                    }}
                    style={{ 
                        cursor: 'pointer', 
                        height: '300px', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        position: 'relative',
                        transition: 'all 0.5s ease'
                    }}
                >
                    {twistStep === 0 && (
                        <div style={{ 
                            width: '300px', 
                            height: '40px', 
                            background: 'var(--accent-yellow)', 
                            borderRadius: '20px', 
                            boxShadow: '0 5px 15px rgba(255, 204, 0, 0.4)',
                            position: 'relative',
                            animation: 'balloonWiggle 2s ease-in-out infinite'
                        }}>
                            <div style={{
                                position: 'absolute',
                                top: '-10px',
                                left: '50%',
                                transform: 'translateX(-50%)',
                                width: '20px',
                                height: '20px',
                                background: 'var(--accent-yellow)',
                                borderRadius: '50%'
                            }} />
                        </div>
                    )}
                    {twistStep === 1 && (
                        <div style={{ 
                            display: 'flex', 
                            alignItems: 'center',
                            animation: 'dogWag 1s ease-in-out infinite'
                        }}>
                            {/* Dog Body */}
                            <div style={{ 
                                width: '120px', 
                                height: '60px', 
                                background: 'var(--accent-yellow)', 
                                borderRadius: '30px',
                                position: 'relative'
                            }}>
                                {/* Head */}
                                <div style={{
                                    position: 'absolute',
                                    right: '-30px',
                                    top: '-20px',
                                    width: '50px',
                                    height: '50px',
                                    background: 'var(--accent-yellow)',
                                    borderRadius: '50%'
                                }}>
                                    {/* Eye */}
                                    <div style={{
                                        position: 'absolute',
                                        right: '10px',
                                        top: '15px',
                                        width: '8px',
                                        height: '8px',
                                        background: '#000',
                                        borderRadius: '50%'
                                    }} />
                                    {/* Ear */}
                                    <div style={{
                                        position: 'absolute',
                                        right: '5px',
                                        top: '-10px',
                                        width: '20px',
                                        height: '30px',
                                        background: 'var(--accent-yellow)',
                                        borderRadius: '50%',
                                        transform: 'rotate(20deg)'
                                    }} />
                                </div>
                                {/* Tail */}
                                <div style={{
                                    position: 'absolute',
                                    left: '-20px',
                                    top: '10px',
                                    width: '30px',
                                    height: '8px',
                                    background: 'var(--accent-yellow)',
                                    borderRadius: '4px',
                                    transform: 'rotate(-20deg)',
                                    transformOrigin: 'right center'
                                }} />
                            </div>
                            {/* Legs */}
                            <div style={{
                                position: 'absolute',
                                bottom: '-20px',
                                left: '20px',
                                width: '10px',
                                height: '20px',
                                background: 'var(--accent-yellow)',
                                borderRadius: '5px'
                            }} />
                            <div style={{
                                position: 'absolute',
                                bottom: '-20px',
                                left: '40px',
                                width: '10px',
                                height: '20px',
                                background: 'var(--accent-yellow)',
                                borderRadius: '5px'
                            }} />
                            <div style={{
                                position: 'absolute',
                                bottom: '-20px',
                                left: '60px',
                                width: '10px',
                                height: '20px',
                                background: 'var(--accent-yellow)',
                                borderRadius: '5px'
                            }} />
                            <div style={{
                                position: 'absolute',
                                bottom: '-20px',
                                left: '80px',
                                width: '10px',
                                height: '20px',
                                background: 'var(--accent-yellow)',
                                borderRadius: '5px'
                            }} />
                        </div>
                    )}
                    {twistStep === 2 && (
                        <div style={{ 
                            position: 'relative',
                            animation: 'bunnyHop 1.5s ease-in-out infinite'
                        }}>
                            {/* Bunny Body */}
                            <div style={{ 
                                width: '80px', 
                                height: '100px', 
                                background: 'var(--accent-yellow)', 
                                borderRadius: '40px',
                                position: 'relative'
                            }}>
                                {/* Head */}
                                <div style={{
                                    position: 'absolute',
                                    top: '-30px',
                                    left: '50%',
                                    transform: 'translateX(-50%)',
                                    width: '60px',
                                    height: '60px',
                                    background: 'var(--accent-yellow)',
                                    borderRadius: '50%'
                                }}>
                                    {/* Eyes */}
                                    <div style={{
                                        position: 'absolute',
                                        left: '15px',
                                        top: '20px',
                                        width: '8px',
                                        height: '8px',
                                        background: '#000',
                                        borderRadius: '50%'
                                    }} />
                                    <div style={{
                                        position: 'absolute',
                                        right: '15px',
                                        top: '20px',
                                        width: '8px',
                                        height: '8px',
                                        background: '#000',
                                        borderRadius: '50%'
                                    }} />
                                    {/* Nose */}
                                    <div style={{
                                        position: 'absolute',
                                        left: '50%',
                                        top: '35px',
                                        transform: 'translateX(-50%)',
                                        width: '6px',
                                        height: '6px',
                                        background: 'pink',
                                        borderRadius: '50%'
                                    }} />
                                </div>
                                {/* Ears */}
                                <div style={{
                                    position: 'absolute',
                                    top: '-60px',
                                    left: '10px',
                                    width: '15px',
                                    height: '40px',
                                    background: 'var(--accent-yellow)',
                                    borderRadius: '10px',
                                    transform: 'rotate(-10deg)'
                                }} />
                                <div style={{
                                    position: 'absolute',
                                    top: '-60px',
                                    right: '10px',
                                    width: '15px',
                                    height: '40px',
                                    background: 'var(--accent-yellow)',
                                    borderRadius: '10px',
                                    transform: 'rotate(10deg)'
                                }} />
                                {/* Tail */}
                                <div style={{
                                    position: 'absolute',
                                    right: '-15px',
                                    top: '30px',
                                    width: '20px',
                                    height: '20px',
                                    background: 'white',
                                    borderRadius: '50%'
                                }} />
                            </div>
                        </div>
                    )}
                    {twistStep === 3 && (
                        <div style={{ 
                            position: 'relative',
                            animation: 'birdFly 2s ease-in-out infinite'
                        }}>
                            {/* Bird Body */}
                            <div style={{ 
                                width: '100px', 
                                height: '60px', 
                                background: 'var(--accent-yellow)', 
                                borderRadius: '30px',
                                position: 'relative'
                            }}>
                                {/* Head */}
                                <div style={{
                                    position: 'absolute',
                                    right: '-20px',
                                    top: '10px',
                                    width: '40px',
                                    height: '40px',
                                    background: 'var(--accent-yellow)',
                                    borderRadius: '50%'
                                }}>
                                    {/* Beak */}
                                    <div style={{
                                        position: 'absolute',
                                        right: '-15px',
                                        top: '18px',
                                        width: '0',
                                        height: '0',
                                        borderLeft: '15px solid orange',
                                        borderTop: '4px solid transparent',
                                        borderBottom: '4px solid transparent'
                                    }} />
                                    {/* Eye */}
                                    <div style={{
                                        position: 'absolute',
                                        right: '10px',
                                        top: '15px',
                                        width: '6px',
                                        height: '6px',
                                        background: '#000',
                                        borderRadius: '50%'
                                    }} />
                                </div>
                                {/* Wings */}
                                <div style={{
                                    position: 'absolute',
                                    left: '-30px',
                                    top: '10px',
                                    width: '40px',
                                    height: '30px',
                                    background: 'var(--accent-yellow)',
                                    borderRadius: '20px',
                                    transform: 'rotate(-20deg)',
                                    animation: 'wingFlap 0.5s ease-in-out infinite'
                                }} />
                                <div style={{
                                    position: 'absolute',
                                    left: '-30px',
                                    top: '20px',
                                    width: '40px',
                                    height: '30px',
                                    background: 'var(--accent-yellow)',
                                    borderRadius: '20px',
                                    transform: 'rotate(20deg)',
                                    animation: 'wingFlap 0.5s ease-in-out infinite 0.25s'
                                }} />
                            </div>
                        </div>
                    )}
                </div>
                <div className="instruction">
                    <Sparkles size={16} /> Click to Transform ({twistStep + 1}/4)
                </div>
            </Section>

            {/* MESSAGE DISPLAY */}
            <Section id="message">
                <h2>Celebration Message</h2>
                <div style={{ 
                    maxWidth: '400px', 
                    margin: '0 auto', 
                    textAlign: 'center',
                    padding: '2rem',
                    background: 'rgba(255, 255, 255, 0.1)',
                    borderRadius: '15px',
                    backdropFilter: 'blur(10px)'
                }}>
                    <p style={{ fontSize: '1.2rem', lineHeight: 1.6, fontStyle: 'italic', marginBottom: '1rem' }}>
                        "{wishData.message}"
                    </p>
                    {wishData.celebrationReason && (
                        <p style={{ fontSize: '1rem', opacity: 0.8, marginTop: '1rem' }}>
                            Celebrating: {wishData.celebrationReason}
                        </p>
                    )}
                </div>
            </Section>

            {/* SECTION 10: CLOSING */}
            <Section id="closing">
                <div style={{
                    position: 'absolute', width: '100%', height: '100%',
                    background: 'linear-gradient(to top, #000 0%, #1a1b26 100%)',
                    zIndex: -1
                }} />

                {/* Release Animation (CSS only for perf) */}
                {Array.from({ length: 20 }).map((_, i) => (
                    <div key={i} style={{
                        position: 'absolute',
                        bottom: '-100px',
                        left: `${Math.random() * 100}%`,
                        animation: `float-up ${5 + Math.random() * 5}s linear infinite`,
                        animationDelay: `${Math.random() * 5}s`,
                        opacity: 0.6
                    }}>
                        <Balloon scale={0.5} color={['red', 'blue', 'yellow'][Math.floor(Math.random() * 3)]} />
                    </div>
                ))}

                <style>{`
          @keyframes float-up {
            0% { transform: translateY(0) rotate(0deg); }
            100% { transform: translateY(-120vh) rotate(360deg); }
          }
        `}</style>

                <h1 style={{ marginBottom: '2rem' }}>Soaring to New Heights</h1>
                <p>From {wishData.sender || 'Anonymous'}</p>
                <button className="btn" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                    Back to Top <ArrowUp size={16} />
                </button>
            </Section>
        </div>
    );
};

export default BalloonCelebrationView;