import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { gsap } from 'gsap';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import CardViewHeader from '../../components/CardViewHeader';
import {
    Ghost, Music, Play, Pause, Skull, CloudFog,
    DoorOpen, Mic, PenTool, Grip, Moon, Sun,
    Rat, ShieldAlert
} from 'lucide-react';
import { normalizeCardData, resolveCardId } from '../../utils/slugs';

// --- STYLES (NO TAILWIND/BOOTSTRAP) ---
const cssStyles = `
@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700&family=Inter:wght@300;400;600&family=Creepster&display=swap');

:root {
    --color-bg: #0f0518;
    --color-purple: #2d1b4e;
    --color-purple-light: #764abc;
    --color-orange: #ff7518;
    --color-orange-glow: #ff9d5c;
    --color-green: #84e32d;
    --color-text: #f0f0f0;
    --font-heading: 'Cinzel', serif;
    --font-creepy: 'Creepster', cursive;
    --font-body: 'Inter', sans-serif;
}

* {
    box-sizing: border-box;
    user-select: none;
    -webkit-user-drag: none;
}

body {
    margin: 0;
    padding: 0;
    background-color: var(--color-bg);
    color: var(--color-text);
    font-family: var(--font-body);
    overflow: hidden; /* Main scroll handled by container */
}

/* --- SCROLL SNAP LAYOUT --- */
.halloween-scroller {
    height: 100dvh;
    width: 100vw;
    overflow-y: scroll;
    scroll-snap-type: y mandatory;
    scroll-behavior: smooth;
    position: relative;
    z-index: 10;
}

section.story-section {
    height: 100dvh;
    width: 100vw;
    scroll-snap-align: start;
    position: relative;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    border-bottom: 1px solid rgba(255,255,255,0.05);
}

/* --- TYPOGRAPHY & COMMON --- */
h1, h2, h3 {
    font-family: var(--font-heading);
    margin: 0;
    text-align: center;
    text-shadow: 0 0 20px rgba(0,0,0,0.8);
}

h1 { font-size: 3rem; color: var(--color-orange); }
h2 { font-size: 2rem; margin-bottom: 1rem; }
p { font-size: 1rem; line-height: 1.6; max-width: 600px; text-align: center; color: #ccc; }

.interaction-hint {
    position: absolute;
    bottom: 40px;
    font-size: 0.8rem;
    opacity: 0.6;
    letter-spacing: 2px;
    text-transform: uppercase;
    animation: pulse 2s infinite;
    pointer-events: none;
}

.btn-primary {
    background: transparent;
    border: 2px solid var(--color-orange);
    color: var(--color-orange);
    padding: 12px 32px;
    font-family: var(--font-heading);
    font-size: 1.2rem;
    cursor: pointer;
    transition: all 0.3s ease;
    border-radius: 50px;
    margin-top: 20px;
}

.btn-primary:hover {
    background: var(--color-orange);
    color: #000;
    box-shadow: 0 0 20px var(--color-orange);
}

@keyframes pulse {
    0%, 100% { opacity: 0.4; }
    50% { opacity: 1; }
}

/* --- SECTION 1: GATES --- */
.gate-container {
    position: absolute;
    inset: 0;
    display: flex;
    z-index: 5;
    pointer-events: none; /* Logic handles pointer */
}

.gate {
    width: 50%;
    height: 100%;
    background: repeating-linear-gradient(90deg, #1a1a1a 0px, #0f0f0f 20px, #2a2a2a 22px);
    position: relative;
    transition: transform 0.1s linear;
    border: 4px solid #000;
    box-shadow: inset 0 0 50px #000;
    display: flex;
    align-items: center;
    justify-content: center;
}

.gate-left { transform-origin: left; border-right: 2px solid #333; }
.gate-right { transform-origin: right; border-left: 2px solid #333; }
.gate-bars {
    font-family: var(--font-creepy);
    font-size: 8rem;
    opacity: 0.1;
    color: #000;
}

/* --- SECTION 3: DOORS --- */
.doors-wrapper { display: flex; gap: 40px; }
.spooky-door {
    width: 140px;
    height: 220px;
    background: #2a1b3d;
    border: 4px solid #4a3b5d;
    cursor: pointer;
    position: relative;
    transition: transform 0.3s;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 10px 30px rgba(0,0,0,0.5);
}
.spooky-door:hover { transform: scale(1.05); border-color: var(--color-orange); }
.door-result { font-size: 3rem; animation: popIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275); }

/* --- SECTION 4: CARVING --- */
canvas.carve-canvas {
    background: radial-gradient(circle, #ff7518 30%, #a64200 70%);
    border-radius: 50% 50% 45% 45%;
    box-shadow: 0 0 50px #ff751822;
    cursor: crosshair;
    touch-action: none;
}
.lights-off canvas.carve-canvas {
    background: #220e00;
    box-shadow: inset 0 0 50px #000;
}

/* --- SECTION 7: BREW --- */
.cauldron {
    width: 200px;
    height: 180px;
    background: #111;
    border-radius: 0 0 100px 100px;
    position: relative;
    margin-top: 100px;
    border-top: 10px solid #333;
}
.liquid {
    position: absolute;
    top: 10px; left: 10px; right: 10px; height: 20px;
    background: var(--color-green);
    border-radius: 50%;
    animation: bubble 2s infinite alternate;
    box-shadow: 0 0 20px var(--color-green);
}
.ingredient {
    width: 60px;
    height: 60px;
    background: rgba(255,255,255,0.1);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: grab;
    position: absolute;
    transition: transform 0.1s;
}
.ingredient:active { cursor: grabbing; }

/* --- SECTION 8: BAT --- */
.game-overlay {
    position: absolute;
    top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(0,0,0,0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    z-index: 20;
}

/* --- SECTION 9: SKELETON --- */
.skeleton-joint {
    cursor: pointer;
    transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}
.skeleton-joint:hover { stroke: var(--color-green); }

/* --- SECTION 10: DAWN --- */
.dawn-bg {
    background: linear-gradient(to top, #ff9d5c, #87CEEB);
    color: #1a0b2e;
}

@keyframes bubble { from { transform: scale(0.95); opacity: 0.8; } to { transform: scale(1.05); opacity: 1; } }
@keyframes popIn { from { transform: scale(0); } to { transform: scale(1); } }
`;

// --- AUDIO ENGINE (Synthesized Sounds) ---
const AudioEngine = {
    ctx: null,
    init: () => {
        if (!AudioEngine.ctx) {
            AudioEngine.ctx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (AudioEngine.ctx.state === 'suspended') {
            AudioEngine.ctx.resume();
        }
    },
    playTone: (freq, type, duration, vol = 0.1) => {
        if (!AudioEngine.ctx) return;
        const osc = AudioEngine.ctx.createOscillator();
        const gain = AudioEngine.ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, AudioEngine.ctx.currentTime);
        gain.gain.setValueAtTime(vol, AudioEngine.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, AudioEngine.ctx.currentTime + duration);
        osc.connect(gain);
        gain.connect(AudioEngine.ctx.destination);
        osc.start();
        osc.stop(AudioEngine.ctx.currentTime + duration);
    },
    playCreak: () => {
        if (!AudioEngine.ctx) return;
        const osc = AudioEngine.ctx.createOscillator();
        const gain = AudioEngine.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(100, AudioEngine.ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(50, AudioEngine.ctx.currentTime + 1.5);
        gain.gain.setValueAtTime(0.1, AudioEngine.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0, AudioEngine.ctx.currentTime + 1.5);
        osc.connect(gain);
        gain.connect(AudioEngine.ctx.destination);
        osc.start();
        osc.stop(AudioEngine.ctx.currentTime + 1.5);
    }
};

// --- SECTIONS ---

// 1. THE GATE
const GateSection = ({ recipientName, onOpen }) => {
    const [open, setOpen] = useState(0);
    const startX = useRef(0);

    const handleStart = (x) => startX.current = x;
    const handleMove = (x) => {
        const diff = Math.abs(x - startX.current);
        const progress = Math.min(diff / 200, 1); // 200px swipe to open
        setOpen(progress);
        if (progress > 0.1 && Math.random() > 0.9) AudioEngine.playCreak();
    };
    const handleEnd = () => {
        if (open > 0.6) {
            setOpen(1);
            onOpen();
            AudioEngine.playTone(440, 'sine', 1);
        } else {
            setOpen(0);
        }
    };

    return (
        <section className="story-section"
            onTouchStart={(e) => handleStart(e.touches[0].clientX)}
            onTouchMove={(e) => handleMove(e.touches[0].clientX)}
            onTouchEnd={handleEnd}
            onMouseDown={(e) => handleStart(e.clientX)}
            onMouseMove={(e) => e.buttons === 1 && handleMove(e.clientX)}
            onMouseUp={handleEnd}
        >
            <div className="gate-container">
                <div className="gate gate-left" style={{ transform: `perspective(1000px) rotateY(${open * -80}deg)` }}>
                    <div className="gate-bars">†</div>
                </div>
                <div className="gate gate-right" style={{ transform: `perspective(1000px) rotateY(${open * 80}deg)` }}>
                    <div className="gate-bars">†</div>
                </div>
            </div>
            <div style={{ zIndex: 1, opacity: 1 - open, transition: 'opacity 0.5s' }}>
                <h1 style={{ fontFamily: 'Creepster', color: '#84e32d' }}>Enter...</h1>
                <h2>if you dare</h2>
                <p>For {recipientName}</p>
                <div className="interaction-hint">Swipe to Open</div>
            </div>
            <div style={{ position: 'absolute', opacity: open, transition: 'opacity 1s', zIndex: 0 }}>
                <h1>Welcome</h1>
            </div>
        </section>
    );
};

// 2. THE FOG
const FogSection = () => {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            // Fill with fog
            ctx.fillStyle = '#1a1a1a';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        };
        resize();
        window.addEventListener('resize', resize);

        return () => window.removeEventListener('resize', resize);
    }, []);

    const wipe = (x, y) => {
        const ctx = canvasRef.current.getContext('2d');
        ctx.globalCompositeOperation = 'destination-out';
        ctx.beginPath();
        ctx.arc(x, y, 60, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalCompositeOperation = 'source-over';
    };

    return (
        <section className="story-section">
            <Ghost size={200} color="#fff" style={{ opacity: 0.5, filter: 'blur(5px)' }} />
            <h2 style={{ position: 'absolute', top: '20%' }}>Something hides in the mist...</h2>
            <div className="interaction-hint">Wipe the Screen</div>
            <canvas
                ref={canvasRef}
                style={{ position: 'absolute', inset: 0, touchAction: 'none' }}
                onMouseMove={(e) => wipe(e.clientX, e.clientY - canvasRef.current.getBoundingClientRect().top)}
                onTouchMove={(e) => {
                    const rect = canvasRef.current.getBoundingClientRect();
                    wipe(e.touches[0].clientX, e.touches[0].clientY - rect.top);
                }}
            />
        </section>
    );
};

// 3. TRICK OR TREAT
const TrickSection = () => {
    const [result, setResult] = useState(null);

    const pick = (type) => {
        setResult(type);
        if (type === 'trick') AudioEngine.playTone(100, 'sawtooth', 0.2); // Low buzz
        if (type === 'treat') AudioEngine.playTone(600, 'sine', 0.1); // High ding
    };

    return (
        <section className="story-section">
            <h2>Trick or Treat?</h2>
            <div className="doors-wrapper">
                <div className="spooky-door" onClick={() => pick('trick')}>
                    {result === 'trick' ? <div className="door-result">🕷️</div> : <DoorOpen color="#888" size={40} />}
                </div>
                <div className="spooky-door" onClick={() => pick('treat')}>
                    {result === 'treat' ? <div className="door-result">🍬</div> : <DoorOpen color="#888" size={40} />}
                </div>
            </div>
            <p style={{ marginTop: 20 }}>{result ? (result === 'trick' ? "Eek! A spider!" : "Yum! Candy!") : "Choose a door..."}</p>
        </section>
    );
};

// 4. PUMPKIN CARVE
const PumpkinSection = () => {
    const canvasRef = useRef(null);
    const [lightsOff, setLightsOff] = useState(false);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (canvas) {
            canvas.width = 300;
            canvas.height = 300;
        }
    }, []);

    const draw = (e) => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const rect = canvas.getBoundingClientRect();
        const x = (e.clientX || e.touches[0].clientX) - rect.left;
        const y = (e.clientY || e.touches[0].clientY) - rect.top;

        ctx.fillStyle = '#ffe066'; // Glowing yellow inside
        ctx.beginPath();
        ctx.arc(x, y, 10, 0, Math.PI * 2);
        ctx.fill();
    };

    return (
        <section className={`story-section ${lightsOff ? 'lights-off' : ''}`}>
            <h2>Carve the Pumpkin</h2>
            <canvas
                ref={canvasRef}
                className="carve-canvas"
                onMouseMove={(e) => e.buttons === 1 && draw(e)}
                onTouchMove={draw}
            />
            <button className="btn-primary" onClick={() => setLightsOff(!lightsOff)}>
                {lightsOff ? "Lights On" : "Lights Off"}
            </button>
        </section>
    );
};

// 5. SCREAM METER
const ScreamSection = () => {
    const [level, setLevel] = useState(0);
    const [scared, setScared] = useState(false);
    const [hasPerm, setHasPerm] = useState(false);

    const startMic = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const src = ctx.createMediaStreamSource(stream);
            const analyser = ctx.createAnalyser();
            analyser.fftSize = 32;
            src.connect(analyser);
            const dataArray = new Uint8Array(analyser.frequencyBinCount);
            setHasPerm(true);

            const checkVolume = () => {
                analyser.getByteFrequencyData(dataArray);
                const avg = dataArray.reduce((a, b) => a + b) / dataArray.length;
                setLevel(avg);
                if (avg > 100) setScared(true);
                else if (avg < 50) setScared(false); // Reset if quiet
                requestAnimationFrame(checkVolume);
            };
            checkVolume();
        } catch (e) {
            console.error("Mic error", e);
            alert("Microphone access denied. Scream in your heart instead!");
        }
    };

    return (
        <section className="story-section">
            {!hasPerm ? (
                <div style={{ textAlign: 'center' }}>
                    <Mic size={60} />
                    <h2>Scream for me!</h2>
                    <button className="btn-primary" onClick={startMic}>Enable Microphone</button>
                </div>
            ) : (
                <div style={{ textAlign: 'center' }}>
                    <h2>SCREAM!</h2>
                    <div style={{
                        width: 200, height: 200,
                        border: '4px solid #fff',
                        borderRadius: '50%',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: '0.1s'
                    }}>
                        <div style={{
                            width: level * 2, height: level * 2,
                            background: scared ? 'red' : 'var(--color-green)',
                            borderRadius: '50%',
                            transition: '0.05s'
                        }} />
                    </div>
                    {scared && <h1 style={{ color: 'red', position: 'absolute', top: 100 }}>AHHHH!</h1>}
                    <div className="floating-ghosts" style={{ opacity: scared ? 0 : 1, transition: '0.5s' }}>
                        {!scared && <Ghost size={50} style={{ position: 'absolute', top: '20%', right: '20%' }} />}
                    </div>
                </div>
            )}
        </section>
    );
};

// 6. SPIDERWEB
const WebSection = () => {
    const [shake, setShake] = useState(0);

    const handleMove = () => {
        if (Math.random() > 0.8) setShake(s => s + 5);
        if (shake > 100) setShake(0); // Break free
    };

    return (
        <section className="story-section" onMouseMove={handleMove} onClick={handleMove}>
            {shake < 50 ? (
                <>
                    <h2 style={{ zIndex: 2 }}>You're stuck in a web!</h2>
                    <div className="interaction-hint">Shake / Tap to break free</div>
                    <svg width="100%" height="100%" style={{ position: 'absolute', pointerEvents: 'none' }}>
                        <line x1="0" y1="0" x2="100%" y2="100%" stroke="rgba(255,255,255,0.5)" strokeWidth="2" />
                        <line x1="100%" y1="0" x2="0" y2="100%" stroke="rgba(255,255,255,0.5)" strokeWidth="2" />
                        {/* Procedural web lines */}
                        <circle cx="50%" cy="50%" r="50" fill="none" stroke="rgba(255,255,255,0.5)" />
                        <circle cx="50%" cy="50%" r="150" fill="none" stroke="rgba(255,255,255,0.5)" />
                    </svg>
                </>
            ) : (
                <h1>Free!</h1>
            )}
        </section>
    );
};

// 7. BREW
const BrewSection = () => {
    const [ingredients, setIngredients] = useState([{ id: 1, icon: <Rat />, x: 20, y: -100 }, { id: 2, icon: <Skull />, x: 250, y: -100 }]);
    const [brewed, setBrewed] = useState(false);

    const handleDrop = (id) => {
        setIngredients(prev => prev.filter(i => i.id !== id));
        AudioEngine.playTone(200, 'sine', 0.5); // Plop
        if (ingredients.length <= 1) setBrewed(true);
    };

    // Simple implementation: Click to drop instead of complex drag for reliability across mobile
    return (
        <section className="story-section">
            <h2>Witch's Brew</h2>
            <div className="interaction-hint">Tap ingredients to drop them</div>
            <div style={{ position: 'relative', width: 300, height: 400 }}>
                {ingredients.map(ing => (
                    <div key={ing.id} className="ingredient"
                        style={{ top: ing.y, left: ing.x }}
                        onClick={() => handleDrop(ing.id)}
                    >
                        {ing.icon}
                    </div>
                ))}
                <div className="cauldron" style={{ margin: '0 auto', left: 50 }}>
                    <div className="liquid" style={{ background: brewed ? '#d900ff' : 'var(--color-green)' }}></div>
                </div>
            </div>
            {brewed && <h3 style={{ color: '#d900ff' }}>Magic Complete!</h3>}
        </section>
    );
};

// 8. BAT FLY (Mini Game)
const BatSection = () => {
    const canvasRef = useRef(null);
    const [playing, setPlaying] = useState(false);
    const [score, setScore] = useState(0);
    const gameState = useRef({ y: 150, vel: 0, obstacles: [] });

    const flap = () => {
        if (!playing) {
            setPlaying(true);
            setScore(0);
            gameState.current = { y: 150, vel: -5, obstacles: [] };
        } else {
            gameState.current.vel = -6;
            AudioEngine.playTone(300, 'square', 0.1);
        }
    };

    useEffect(() => {
        if (!playing) return;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        let frameId;

        const loop = () => {
            // Physics
            gameState.current.vel += 0.3; // Gravity
            gameState.current.y += gameState.current.vel;

            // Obstacles
            if (Math.random() < 0.02) gameState.current.obstacles.push({ x: 300, h: Math.random() * 100 + 50 });
            gameState.current.obstacles.forEach(o => o.x -= 2);
            gameState.current.obstacles = gameState.current.obstacles.filter(o => o.x > -50);

            // Draw
            ctx.clearRect(0, 0, 300, 400);

            // Bat
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.arc(50, gameState.current.y, 10, 0, Math.PI * 2);
            ctx.fill();
            // Wings
            ctx.beginPath();
            ctx.moveTo(50, gameState.current.y);
            ctx.lineTo(30, gameState.current.y - (gameState.current.vel * 2));
            ctx.lineTo(70, gameState.current.y - (gameState.current.vel * 2));
            ctx.stroke();

            // Pipes
            ctx.fillStyle = 'green';
            gameState.current.obstacles.forEach(o => {
                ctx.fillRect(o.x, 0, 30, o.h); // Top
                ctx.fillRect(o.x, o.h + 100, 30, 400); // Bottom
            });

            // Collision (Simple floor/ceiling)
            if (gameState.current.y > 400 || gameState.current.y < 0) {
                setPlaying(false);
            }

            frameId = requestAnimationFrame(loop);
        };
        frameId = requestAnimationFrame(loop);
        return () => cancelAnimationFrame(frameId);
    }, [playing]);

    return (
        <section className="story-section">
            <h2>Bat Flight</h2>
            <div style={{ position: 'relative', width: 300, height: 400, border: '2px solid #555', overflow: 'hidden', background: '#222' }}
                onClick={flap}>
                <canvas ref={canvasRef} width={300} height={400} />
                {!playing && (
                    <div className="game-overlay">
                        <h3>Tap to Flap</h3>
                        {score > 0 && <p>Score: {score}</p>}
                    </div>
                )}
            </div>
        </section>
    );
};

// 9. SKELETON
const SkeletonSection = () => {
    // Simple SVG Skeleton that reacts to clicks
    const [pose, setPose] = useState(0);
    return (
        <section className="story-section">
            <h2>Dance, Bone Daddy!</h2>
            <svg width="200" height="300" viewBox="0 0 100 200" onClick={() => setPose(p => p + 1)}>
                {/* Head */}
                <circle cx="50" cy="30" r="15" fill="white" />
                {/* Spine */}
                <line x1="50" y1="45" x2="50" y2="100" stroke="white" strokeWidth="4" />
                {/* Arms - Rotate based on pose */}
                <line x1="50" y1="60" x2={pose % 2 === 0 ? "20" : "80"} y2={pose % 2 === 0 ? "80" : "40"} stroke="white" strokeWidth="4" className="skeleton-joint" />
                <line x1="50" y1="60" x2={pose % 2 === 0 ? "80" : "20"} y2={pose % 2 === 0 ? "80" : "40"} stroke="white" strokeWidth="4" className="skeleton-joint" />
                {/* Legs */}
                <line x1="50" y1="100" x2="30" y2="180" stroke="white" strokeWidth="4" />
                <line x1="50" y1="100" x2="70" y2="180" stroke="white" strokeWidth="4" />
            </svg>
            <div className="interaction-hint">Tap to Dance</div>
        </section>
    );
};

// 10. DAWN (Closing)
const DawnSection = ({ message, sender }) => (
    <section className="story-section dawn-bg">
        <Sun size={80} color="#ffeb3b" style={{ marginBottom: 20 }} />
        <h1>The Sun Rises</h1>
        <div style={{ background: 'rgba(255,255,255,0.2)', padding: 30, borderRadius: 10, backdropFilter: 'blur(10px)' }}>
            <p style={{ color: '#1a0b2e', fontSize: '1.2rem' }}>"{message}"</p>
            <h3 style={{ color: '#1a0b2e', marginTop: 20 }}>- {sender}</h3>
        </div>
        <p style={{ color: '#1a0b2e', marginTop: 40, fontWeight: 'bold' }}>Stay Spooky.</p>
    </section>
);


// --- MAIN VIEW ---

const HalloweenView = () => {
    const { wishId } = useParams();
    const [wishData, setWishData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [audioStarted, setAudioStarted] = useState(false);

    useEffect(() => {
        const fetchWishData = async () => {
            try {
                const result = await resolveCardId(wishId, 'wishes', 'halloween');
                if (result) {
                    setWishData(normalizeCardData(result.data));
                } else {
                    // Fallback for demo visualization if no data found
                    setWishData({
                        recipientName: "Friend",
                        sender: "Ghost",
                        message: "Boo!",
                        spotify: ""
                    });
                }
            } catch (error) {
                console.error("Error fetching wish:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchWishData();
    }, [wishId]);

    const handleStart = () => {
        if (!audioStarted) {
            AudioEngine.init();
            setAudioStarted(true);
        }
    };

    if (loading) return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#000', color: '#ff7518' }}>Summoning Spirits...</div>;
    if (!wishData) return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#000', color: 'red' }}>This grave is empty. (Card not found)</div>;

    // Helper to get Spotify ID
    const getSpotifyId = (url) => {
        if (!url) return null;
        try {
            const parts = url.split('/');
            return parts[parts.length - 1].split('?')[0];
        } catch (e) { return null; }
    };
    const spotifyId = getSpotifyId(wishData.spotify);

    return (
        <>
            <style>{cssStyles}</style>

            {/* Header overlay */}
            <div style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100 }}>
                <CardViewHeader
                    cardType="halloween"
                    cardId={wishId}
                    title="Halloween"
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

            <main className="halloween-scroller">
                <GateSection recipientName={wishData.recipientName} onOpen={handleStart} />
                <FogSection />
                <TrickSection />
                <PumpkinSection />
                <ScreamSection />
                <WebSection />
                <BrewSection />
                <BatSection />
                <SkeletonSection />
                <DawnSection message={wishData.message} sender={wishData.sender} />
            </main>
        </>
    );
};

export default HalloweenView;
