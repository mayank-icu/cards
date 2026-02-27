import React, { useEffect, useRef, useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import CardViewHeader from '../../components/CardViewHeader';
import SongPlayer from '../../components/SongPlayer';
import { Egg, Music, Play, Pause, Flower, Sun, Rabbit, Sparkles, Check, ChevronDown } from 'lucide-react';
import { normalizeCardData, resolveCardId } from '../../utils/slugs'; // Adjust path if necessary

gsap.registerPlugin(ScrollTrigger);

// --- 1. PROPRIETARY AUDIO ENGINE (Web Audio API) ---
// Generates sounds procedurally to avoid external asset dependencies
class AudioEngine {
    constructor() {
        this.ctx = null;
        this.masterGain = null;
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

    playTone(freq, type = 'sine', duration = 0.5, vol = 1) {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

        gain.gain.setValueAtTime(0, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(vol, this.ctx.currentTime + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start();
        osc.stop(this.ctx.currentTime + duration);
    }

    playSparkle() {
        this.playTone(880, 'sine', 0.1, 0.5);
        setTimeout(() => this.playTone(1100, 'sine', 0.1, 0.4), 100);
        setTimeout(() => this.playTone(1320, 'sine', 0.3, 0.3), 200);
    }

    playCrack() {
        this.playTone(200, 'sawtooth', 0.1, 0.5);
    }

    playPop() {
        this.playTone(600, 'triangle', 0.1, 0.8);
    }

    playSuccess() {
        this.playTone(440, 'sine', 0.2); // A4
        setTimeout(() => this.playTone(554, 'sine', 0.2), 150); // C#5
        setTimeout(() => this.playTone(659, 'sine', 0.4), 300); // E5
    }
}

const audio = new AudioEngine();


// --- 2. CUSTOM CSS & THEME ---
const styles = `
@import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=Inter:wght@300;400;600&display=swap');

:root {
    --mint: #E0F2F1;
    --mint-dark: #26A69A;
    --pink: #FCE4EC;
    --pink-dark: #EC407A;
    --lilac: #F3E5F5;
    --lilac-dark: #AB47BC;
    --text: #2c3e50;
    --white: #ffffff;
    --gold: #FFD700;
}

* { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }

body, html {
    margin: 0;
    padding: 0;
    overflow: hidden; /* Prevent native scroll, we manage container */
    font-family: 'Inter', sans-serif;
    color: var(--text);
    background: var(--white);
}

.scrolly-container {
    height: 100dvh;
    overflow-y: scroll;
    scroll-snap-type: y mandatory;
    scroll-behavior: smooth;
    position: relative;
}

section {
    height: 100dvh;
    width: 100%;
    scroll-snap-align: start;
    position: relative;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 2rem;
    background: var(--white);
    transition: background 0.5s ease;
}

/* Typography */
h1, h2, h3 {
    font-family: 'DM Serif Display', serif;
    font-weight: 400;
    margin: 0 0 1rem 0;
    text-align: center;
}

h1 { font-size: 3.5rem; line-height: 1.1; color: var(--mint-dark); }
h2 { font-size: 2.5rem; color: var(--lilac-dark); }
p { font-size: 1.1rem; line-height: 1.6; max-width: 600px; text-align: center; color: #555; }

/* Themes */
section.mint { background: var(--mint); }
section.pink { background: var(--pink); }
section.lilac { background: var(--lilac); }

/* UI Elements */
button.interact-btn {
    background: var(--white);
    border: 2px solid currentColor;
    color: var(--text);
    padding: 1rem 2rem;
    border-radius: 50px;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-top: 1rem;
    box-shadow: 0 4px 15px rgba(0,0,0,0.05);
}

button.interact-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0,0,0,0.1);
}

button.interact-btn:active {
    transform: scale(0.95);
}

.scroll-indicator {
    position: absolute;
    bottom: 2rem;
    left: 50%;
    transform: translateX(-50%);
    animation: bounce 2s infinite;
    opacity: 0.5;
}

@keyframes bounce {
    0%, 20%, 50%, 80%, 100% {transform: translateX(-50%) translateY(0);}
    40% {transform: translateX(-50%) translateY(-10px);}
    60% {transform: translateX(-50%) translateY(-5px);}
}

/* Section Specifics */

/* Grass */
.grass-curtain {
    position: absolute;
    top: 0; left: 0; width: 100%; height: 100%;
    z-index: 10;
    display: flex;
    justify-content: center;
    align-items: flex-end;
    pointer-events: none; /* Let clicks pass through after animation */
}
.blade {
    background: #4CAF50;
    width: 2%;
    border-radius: 50px 50px 0 0;
    transform-origin: bottom center;
    transition: transform 0.5s ease, opacity 0.5s ease;
}

/* Egg Hunt */
.hidden-egg {
    position: absolute;
    cursor: pointer;
    transition: transform 0.3s ease;
    opacity: 0.8;
}
.hidden-egg.found {
    animation: popUp 0.5s forwards;
    pointer-events: none;
    filter: drop-shadow(0 0 10px gold);
}
@keyframes popUp {
    0% { transform: scale(1); }
    50% { transform: scale(1.4); }
    100% { transform: scale(0); opacity: 0; }
}

/* Hatch */
.hatch-egg-container {
    width: 200px;
    height: 250px;
    position: relative;
    cursor: pointer;
}
.chick {
    position: absolute;
    top: 50%; left: 50%;
    transform: translate(-50%, -50%) scale(0);
    transition: transform 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55);
}
.chick.visible { transform: translate(-50%, -50%) scale(1); }

/* Dye Station */
.dye-pot {
    width: 60px; height: 60px;
    border-radius: 50%;
    cursor: pointer;
    border: 3px solid rgba(0,0,0,0.1);
    transition: transform 0.2s;
}
.dye-pot:active { transform: scale(0.9); }
.white-egg {
    transition: fill 0.5s ease;
}

/* Basket */
.candy-dragger {
    touch-action: none;
    cursor: grab;
    transition: transform 0.1s linear;
}

/* Loading */
.loader {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100vh;
    background: var(--mint);
    font-family: 'DM Serif Display';
    font-size: 1.5rem;
    color: var(--mint-dark);
}

/* Enhanced Floating Spotify Player */
.floating-spotify-player {
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 2000;
    background: rgba(224, 242, 241, 0.95);
    backdrop-filter: blur(15px);
    padding: 12px;
    border-radius: 50px;
    box-shadow: 0 8px 32px rgba(38, 166, 154, 0.15);
    display: flex;
    align-items: center;
    gap: 12px;
    border: 2px solid var(--mint-dark);
    transition: all 0.3s ease;
    animation: slideInRight 0.6s ease-out;
}

.floating-spotify-player:hover {
    transform: scale(1.05);
    box-shadow: 0 12px 40px rgba(38, 166, 154, 0.25);
    background: rgba(224, 242, 241, 1);
}

.spotify-disc {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: linear-gradient(135deg, #1db954, #191414);
    overflow: hidden;
    animation: spin 4s linear infinite;
    border: 2px solid var(--mint-dark);
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
    color: var(--text);
    font-family: 'Inter', sans-serif;
    font-weight: 600;
}

.scrolling-text {
    display: inline-block;
    white-space: nowrap;
    animation: scrollText 12s linear infinite;
}

.mini-play-btn {
    background: var(--mint-dark);
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
    background: var(--lilac-dark);
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

/* Floating Spotify */
.spotify-float {
    position: fixed;
    top: 24px;
    right: 24px;
    z-index: 1000;
    background: rgba(255,255,255,0.1);
    backdrop-filter: blur(8px);
    border-radius: 50px;
    width: 44px;
    height: 44px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid rgba(255,255,255,0.2);
    cursor: pointer;
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    overflow: hidden;
    box-shadow: 0 4px 12px rgba(0,0,0,0.2);
}
.spotify-float:hover {
    width: 280px;
    height: 84px;
    border-radius: 12px;
    background: rgba(0,0,0,0.8);
}
.spotify-icon { color: var(--gold); transition: opacity 0.3s; }
.spotify-float:hover .spotify-icon { opacity: 0; display: none; }
.spotify-float iframe { opacity: 0; transition: opacity 0.5s ease 0.2s; width: 100%; height: 100%; }
.spotify-float:hover iframe { opacity: 1; }
`;

// --- ENHANCED COMPONENTS ---

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

// --- 3. SUB-COMPONENTS (SECTIONS) ---

const Section = ({ className, children, id }) => (
    <section id={id} className={className}>
        {children}
    </section>
);

// SECTION 1: THE GRASS
const GrassSection = ({ onStart }) => {
    const [cleared, setCleared] = useState(false);
    const blades = Array.from({ length: 40 });

    const handleInteract = () => {
        if (!cleared) {
            audio.playSparkle();
            setCleared(true);
        }
    };

    return (
        <Section className="mint" id="section-1">
            <div
                className="grass-curtain"
                onMouseEnter={handleInteract}
                onTouchStart={handleInteract}
                style={{ pointerEvents: cleared ? 'none' : 'auto' }}
            >
                {blades.map((_, i) => (
                    <div
                        key={i}
                        className="blade"
                        style={{
                            height: `${Math.random() * 40 + 40}%`,
                            transform: cleared ? 'rotateX(90deg) scaleY(0)' : `rotate(${Math.random() * 20 - 10}deg)`,
                            transitionDelay: `${i * 0.02}s`
                        }}
                    />
                ))}
            </div>

            <div className="content" style={{ opacity: cleared ? 1 : 0, transition: 'opacity 1s 0.5s' }}>
                <h1>Pastel Morning</h1>
                <p>A quiet interactive story for you.</p>
                <button className="interact-btn" onClick={() => {
                    audio.init();
                    onStart();
                }}>
                    <Play size={18} fill="currentColor" /> Open Card
                </button>
            </div>
            {cleared && <ChevronDown className="scroll-indicator" />}
        </Section>
    );
};

// SECTION 2: EGG HUNT
const EggHuntSection = () => {
    const [found, setFound] = useState([]);
    // Random positions for "hiding"
    const positions = [
        { top: '20%', left: '10%', color: '#FFCDD2' },
        { top: '15%', right: '15%', color: '#E1BEE7' },
        { bottom: '30%', left: '20%', color: '#C8E6C9' },
        { bottom: '10%', right: '25%', color: '#BBDEFB' },
        { top: '50%', left: '50%', color: '#FFF9C4' },
    ];

    const handleFound = (index) => {
        if (!found.includes(index)) {
            audio.playPop();
            setFound([...found, index]);
            if (found.length === 4) audio.playSuccess();
        }
    };

    return (
        <Section className="lilac" id="section-2">
            <h2>The Hunt</h2>
            <p>Find the 5 hidden eggs ({found.length}/5)</p>
            <div style={{ position: 'relative', width: '100%', height: '60%', maxWidth: '600px' }}>
                {/* Decorative Elements to obscure eggs */}
                <div style={{ position: 'absolute', bottom: 0, width: '100%', height: '100px', background: '#F3E5F5', borderRadius: '50% 50% 0 0', zIndex: 1 }}></div>
                <Tree style={{ position: 'absolute', top: '10%', left: 0 }} />
                <Tree style={{ position: 'absolute', top: '20%', right: '10%' }} />

                {positions.map((pos, i) => (
                    <div
                        key={i}
                        className={`hidden-egg ${found.includes(i) ? 'found' : ''}`}
                        style={{ ...pos, zIndex: 2 }}
                        onClick={() => handleFound(i)}
                    >
                        <Egg size={40} fill={pos.color} stroke="#555" strokeWidth={1.5} />
                    </div>
                ))}
            </div>
        </Section>
    );
};

// SECTION 3: THE HATCH
const HatchSection = () => {
    const [taps, setTaps] = useState(0);
    const requiredTaps = 5;

    const handleTap = () => {
        if (taps < requiredTaps) {
            audio.playCrack();
            setTaps(p => p + 1);
            if (taps + 1 === requiredTaps) audio.playSuccess();
        }
    };

    return (
        <Section className="pink" id="section-3">
            <h2>New Life</h2>
            <p>{taps < requiredTaps ? "Tap to help it hatch!" : "Hello there!"}</p>

            <div className="hatch-egg-container" onClick={handleTap}>
                {/* Chick */}
                <div className={`chick ${taps >= requiredTaps ? 'visible' : ''}`}>
                    <Rabbit size={100} color="#FFD54F" />
                </div>

                {/* Egg Shell Parts */}
                <div style={{
                    position: 'absolute',
                    top: 0, left: 0, width: '100%', height: '100%',
                    transition: 'all 0.5s ease',
                    opacity: taps >= requiredTaps ? 0 : 1,
                    transform: taps >= requiredTaps ? 'scale(1.5)' : `rotate(${taps % 2 === 0 ? -5 : 5}deg)`
                }}>
                    <svg viewBox="0 0 100 130" width="200">
                        {/* Dynamic crack paths based on taps */}
                        <path d="M50 5 Q80 5 90 40 Q95 80 50 125 Q5 80 10 40 Q20 5 50 5" fill="#FFF" stroke="#333" strokeWidth="3" />
                        {taps > 1 && <path d="M30 40 L50 60 L70 40" fill="none" stroke="#333" strokeWidth="2" />}
                        {taps > 3 && <path d="M20 70 L50 90 L80 70" fill="none" stroke="#333" strokeWidth="2" />}
                    </svg>
                </div>
            </div>
        </Section>
    );
};

// SECTION 5: DYE STATION
const DyeSection = () => {
    const [color, setColor] = useState('#FFFFFF');

    const dyes = [
        { name: 'Red', hex: '#FFCDD2' },
        { name: 'Blue', hex: '#BBDEFB' },
        { name: 'Yellow', hex: '#FFF9C4' }
    ];

    const dip = (hex) => {
        // Simple color mixing approximation or just override
        audio.playTone(300, 'triangle', 0.2);
        setColor(hex);
    };

    return (
        <Section className="mint" id="section-5">
            <h2>Dye Station</h2>
            <p>Dip the egg to color it.</p>

            <svg width="150" height="200" viewBox="0 0 100 130" style={{ marginBottom: '2rem' }}>
                <path
                    d="M50 5 Q80 5 90 40 Q95 80 50 125 Q5 80 10 40 Q20 5 50 5"
                    fill={color}
                    stroke="#333"
                    strokeWidth="3"
                    className="white-egg"
                />
            </svg>

            <div style={{ display: 'flex', gap: '20px' }}>
                {dyes.map(d => (
                    <div
                        key={d.name}
                        className="dye-pot"
                        style={{ backgroundColor: d.hex }}
                        onClick={() => dip(d.hex)}
                    />
                ))}
            </div>
        </Section>
    );
};

// SECTION 7: FLOWER BLOOM
const FlowerSection = () => {
    const [bloomed, setBloomed] = useState(false);

    const handleBloom = () => {
        if (!bloomed) {
            audio.playSparkle();
            setBloomed(true);
        }
    };

    return (
        <Section className="pink" id="section-7">
            <h2>Spring Bloom</h2>
            <p>Touch the sun to bring warmth.</p>

            <div
                onClick={handleBloom}
                style={{
                    cursor: 'pointer', marginBottom: '3rem',
                    transition: 'transform 0.5s',
                    transform: bloomed ? 'scale(1.2)' : 'scale(1)'
                }}
            >
                <Sun size={80} color="#FDB813" fill="#FDB813" />
            </div>

            <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end', height: '150px' }}>
                {[1, 2, 3, 4, 5].map((n, i) => (
                    <div key={n} style={{
                        transformOrigin: 'bottom center',
                        transform: bloomed ? 'scale(1)' : 'scale(0)',
                        transition: `transform 1s cubic-bezier(0.175, 0.885, 0.32, 1.275) ${i * 0.1}s`
                    }}>
                        <Flower size={40 + (Math.random() * 30)} color={['#EC407A', '#AB47BC', '#26A69A'][i % 3]} />
                        <div style={{ width: 4, height: 60, background: '#66BB6A', margin: '0 auto' }}></div>
                    </div>
                ))}
            </div>
        </Section>
    );
};

// SECTION 8: GOLDEN EGG
const GoldenEggSection = () => {
    const [shines, setShines] = useState(0);

    const rub = () => {
        audio.playTone(800 + (shines * 100), 'sine', 0.1);
        setShines(s => s + 1);
    };

    return (
        <Section className="lilac" id="section-8">
            <h2>The Golden Egg</h2>
            <p>Rub for good luck!</p>

            <div
                onMouseMove={rub}
                onTouchMove={rub}
                style={{
                    width: 150, height: 200,
                    background: `linear-gradient(${shines * 10}deg, #FFD700, #FFF, #FFD700)`,
                    borderRadius: '50% 50% 50% 50% / 60% 60% 40% 40%',
                    boxShadow: `0 0 ${shines * 2}px gold`,
                    cursor: 'grab',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}
            >
                <Sparkles size={40} color="white" style={{ opacity: shines > 10 ? 1 : 0, transition: 'opacity 0.5s' }} />
            </div>
            {shines > 20 && <p style={{ marginTop: '1rem', color: '#B7950B', fontWeight: 'bold' }}>You are blessed!</p>}
        </Section>
    );
};

// SECTION 9: CHOCO EAR
const ChocoSection = () => {
    const [bitten, setBitten] = useState(false);
    const [biteCount, setBiteCount] = useState(0);
    const [chocolatePieces, setChocolatePieces] = useState([]);

    const bite = () => {
        if (!bitten) {
            audio.playTone(150, 'sawtooth', 0.1); // Crunch sound
            setBitten(true);
            setBiteCount(1);
            
            // Add chocolate pieces
            const newPieces = [
                { id: Date.now(), x: 20, y: 60, size: 8 },
                { id: Date.now() + 1, x: 35, y: 70, size: 6 },
                { id: Date.now() + 2, x: 50, y: 65, size: 7 }
            ];
            setChocolatePieces(newPieces);
        } else if (biteCount < 3) {
            audio.playTone(180, 'sawtooth', 0.1);
            setBiteCount(biteCount + 1);
            
            // Add more chocolate pieces
            const newPiece = {
                id: Date.now(),
                x: Math.random() * 60 + 20,
                y: Math.random() * 40 + 50,
                size: Math.random() * 5 + 4
            };
            setChocolatePieces(prev => [...prev, newPiece]);
        }
    };

    const reset = () => {
        setBitten(false);
        setBiteCount(0);
        setChocolatePieces([]);
    };

    return (
        <Section className="mint" id="section-9">
            <h2>The Temptation</h2>
            <p>{biteCount === 0 ? "Go ahead. Take a bite." : biteCount < 3 ? "Another bite?" : "Delicious! Want more?"}</p>

            <div style={{ position: 'relative', cursor: 'pointer', width: '200px', height: '250px' }} onClick={bite}>
                <svg width="200" height="250" viewBox="0 0 100 200">
                    {/* Chocolate Body */}
                    <path d="M30 150 L30 180 L70 180 L70 150 Z" fill="#795548" />
                    
                    {/* Chocolate Head */}
                    <circle cx="50" cy="120" r="30" fill="#795548" />
                    
                    {/* Chocolate Details */}
                    <circle cx="45" cy="115" r="3" fill="#5D4037" opacity="0.7" />
                    <circle cx="55" cy="125" r="2" fill="#5D4037" opacity="0.7" />
                    <circle cx="50" cy="120" r="4" fill="#5D4037" opacity="0.5" />

                    {/* Right Ear (Safe) */}
                    <ellipse cx="65" cy="80" rx="10" ry="30" fill="#795548" transform="rotate(10 65 80)" />
                    
                    {/* Left Ear (Progressively bitten) */}
                    {!bitten ? (
                        <ellipse cx="35" cy="80" rx="10" ry="30" fill="#795548" transform="rotate(-10 35 80)" />
                    ) : (
                        <g>
                            {/* Ear stump that gets smaller with each bite */}
                            <ellipse 
                                cx="35" 
                                cy="80" 
                                rx={10 - (biteCount * 2)} 
                                ry={30 - (biteCount * 5)} 
                                fill="#795548" 
                                transform={`rotate(-10 35 80)`}
                            />
                            {/* Bite marks */}
                            {biteCount >= 1 && <path d="M25 85 L35 90 L30 95 Z" fill="#5D4037" />}
                            {biteCount >= 2 && <path d="M35 75 L45 80 L40 85 Z" fill="#5D4037" />}
                            {biteCount >= 3 && <path d="M20 80 L30 85 L25 90 Z" fill="#5D4037" />}
                        </g>
                    )}
                </svg>
                
                {/* Chocolate Pieces */}
                {chocolatePieces.map(piece => (
                    <div
                        key={piece.id}
                        style={{
                            position: 'absolute',
                            left: `${piece.x}px`,
                            top: `${piece.y}px`,
                            width: `${piece.size}px`,
                            height: `${piece.size}px`,
                            background: 'linear-gradient(45deg, #795548, #5D4037)',
                            borderRadius: '2px',
                            animation: 'fall 0.5s ease-out',
                            transform: 'rotate(45deg)'
                        }}
                    />
                ))}
                
                {/* Bite Messages */}
                {bitten && (
                    <div style={{ 
                        position: 'absolute', 
                        top: '50px', 
                        left: '10px', 
                        fontWeight: 'bold', 
                        color: '#5D4037',
                        fontSize: `${0.8 + biteCount * 0.2}rem`
                    }}>
                        {biteCount === 1 ? "CRUNCH!" : biteCount === 2 ? "CRUNCH! CRUNCH!" : "SO GOOD!"}
                    </div>
                )}
            </div>
            
            {/* Reset Button */}
            {biteCount >= 3 && (
                <button 
                    className="interact-btn" 
                    onClick={reset}
                    style={{ marginTop: '1rem', fontSize: '0.9rem' }}
                >
                    Get New Chocolate
                </button>
            )}
            
            <div className="interaction-hint" style={{ bottom: '20px' }}>
                {biteCount === 0 ? "Click to take a bite!" : biteCount < 3 ? "Click for another bite!" : "Click to get a new one!"}
            </div>
            
            <style>{`
                @keyframes fall {
                    0% { transform: translateY(-20px) rotate(45deg) scale(0); opacity: 0; }
                    50% { transform: translateY(0) rotate(45deg) scale(1.2); opacity: 1; }
                    100% { transform: translateY(0) rotate(45deg) scale(1); opacity: 1; }
                }
            `}</style>
        </Section>
    );
};

// SECTION 10: FINALE
const FinaleSection = ({ wishData }) => {
    return (
        <Section className="pink" id="section-10">
            <h1 style={{ fontSize: '4rem' }}>Happy Easter</h1>
            <h2 style={{ marginTop: '1rem' }}>{wishData.recipientName}</h2>
            <div style={{ maxWidth: '500px', margin: '2rem auto', textAlign: 'center', background: 'rgba(255,255,255,0.8)', padding: '2rem', borderRadius: '20px' }}>
                <p style={{ fontStyle: 'italic', fontSize: '1.2rem' }}>"{wishData.message}"</p>
                <p style={{ marginTop: '2rem', fontWeight: 'bold' }}>From {wishData.sender}</p>
            </div>

            <button className="interact-btn" style={{ marginTop: '3rem' }} onClick={() => window.location.reload()}>
                Replay Card
            </button>
        </Section>
    );
};

// Helper Graphic
const Tree = ({ style }) => (
    <svg width="60" height="80" viewBox="0 0 60 80" style={style}>
        <path d="M30 10 L50 60 L10 60 Z" fill="#A5D6A7" />
        <rect x="25" y="60" width="10" height="20" fill="#795548" />
    </svg>
);


// --- 4. MAIN COMPONENT ---

const EasterView = () => {
    const { wishId } = useParams();
    const [wishData, setWishData] = useState(null);
    const [loading, setLoading] = useState(true);
    const containerRef = useRef(null);

    // Fetch Logic (Retained from original)
    useEffect(() => {
        const fetchWishData = async () => {
            try {
                // If using actual firebase, enable this. For demo, we mock if fetch fails.
                console.log('EasterView fetching wishId:', wishId);
                const result = await resolveCardId(wishId, 'wishes', 'easter');
                console.log('EasterView resolve result:', result);
                
                if (result) {
                    setWishData(normalizeCardData(result.data));
                } else {
                    console.log('EasterView: No result found, using fallback');
                    // Fallback for demo visualization if no data found
                    setWishData({
                        recipientName: "Friend",
                        sender: "Secret Bunny",
                        message: "May your basket be full of joy and chocolate!",
                        song: {
                            name: "Spring",
                            artist: "Vivaldi",
                            albumArt: "https://via.placeholder.com/50",
                            previewUrl: ""
                        }
                    });
                }
            } catch (error) {
                console.error("Error fetching wish:", error);
                // Fallback
                setWishData({
                    recipientName: "Friend",
                    sender: "Secret Bunny",
                    message: "Wishing you peace and joy.",
                    song: null
                });
            } finally {
                setLoading(false);
            }
        };

        fetchWishData();
    }, [wishId]);

    const scrollToNext = () => {
        const container = containerRef.current;
        if (container) {
            container.scrollTo({
                top: window.innerHeight,
                behavior: 'smooth'
            });
        }
    };

    if (loading) return <div className="loader">Hatching...</div>;
    if (!wishData) return <div className="loader">Card not found.</div>;

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
            <style>{styles}</style>
            
            {/* Nav / Close */}
            <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 100 }}>
               <CardViewHeader cardType="easter" cardId={wishId} title="" />
            </div>

            {/* Enhanced Floating Spotify Player */}
            {wishData?.song && <EnhancedSongPlayer song={wishData.song} />}

            <div className="scrolly-container" ref={containerRef}>
                <GrassSection onStart={scrollToNext} />
                <EggHuntSection />
                <HatchSection />
                {/* Enhanced Bunny Hop Section */}
                <Section className="mint" id="section-4">
                    <h2>Bunny Hop</h2>
                    <p>Click to make the bunny hop around!</p>
                    <div style={{ position: 'relative', width: '300px', height: '200px' }}>
                        <div 
                            style={{
                                position: 'absolute',
                                width: '80px',
                                height: '80px',
                                cursor: 'pointer',
                                transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                                transform: 'translateY(0px)',
                                animation: 'gentleBounce 2s ease-in-out infinite'
                            }}
                            onClick={() => {
                                audio.playTone(400, 'sine', 0.1);
                                const bunny = document.getElementById('bunny');
                                const randomX = Math.random() * 140 + 30;
                                const randomY = Math.random() * 60 + 20;
                                bunny.style.transform = `translate(${randomX}px, ${-randomY}px) scale(1.1)`;
                                setTimeout(() => {
                                    bunny.style.transform = 'translate(0px, 0px) scale(1)';
                                }, 300);
                            }}
                        >
                            <svg id="bunny" width="80" height="80" viewBox="0 0 80 80">
                                {/* Bunny Body */}
                                <ellipse cx="40" cy="50" rx="25" ry="30" fill="#8D6E63" />
                                
                                {/* Bunny Head */}
                                <circle cx="40" cy="20" r="15" fill="#8D6E63" />
                                
                                {/* Bunny Ears */}
                                <ellipse cx="25" cy="5" rx="8" ry="15" fill="#8D6E63" transform="rotate(-20 25 5)" />
                                <ellipse cx="55" cy="5" rx="8" ry="15" fill="#8D6E63" transform="rotate(20 55 5)" />
                                
                                {/* Bunny Eyes */}
                                <circle cx="35" cy="18" r="2" fill="#333" />
                                <circle cx="45" cy="18" r="2" fill="#333" />
                                
                                {/* Bunny Nose */}
                                <ellipse cx="40" cy="22" rx="3" ry="2" fill="#D4A376" />
                                
                                {/* Bunny Tail */}
                                <ellipse cx="15" cy="40" rx="8" ry="4" fill="#A1887F" transform="rotate(-30 15 40)" />
                                
                                {/* Bunny Feet */}
                                <ellipse cx="30" cy="75" rx="6" ry="3" fill="#8D6E63" />
                                <ellipse cx="50" cy="75" rx="6" ry="3" fill="#8D6E63" />
                                
                                {/* Carrot */}
                                <rect x="65" y="35" width="15" height="3" fill="#FF6B35" rx="1" />
                                <rect x="65" y="38" width="15" height="3" fill="#FFA726" rx="1" />
                                <rect x="65" y="41" width="15" height="3" fill="#FF8C42" rx="1" />
                                <rect x="65" y="44" width="15" height="3" fill="#FF9E80" rx="1" />
                                
                                {/* Carrot Top */}
                                <path d="M72.5 35 L72.5 30" stroke="#FF6B35" strokeWidth="2" />
                                <path d="M77.5 35 L77.5 30" stroke="#FF6B35" strokeWidth="2" />
                            </svg>
                        </div>
                        
                        {/* Decorative Easter Eggs */}
                        <div style={{
                            position: 'absolute',
                            top: '10px',
                            left: '10px',
                            width: '30px',
                            height: '40px',
                            transform: 'rotate(-15deg)'
                        }}>
                            <svg viewBox="0 0 30 40">
                                <path d="M15 5 Q25 0 25 10 Q15 15 5 20 Q-5 15 5 10 Q-5 5 15 5" fill="#FFCDD2" stroke="#555" strokeWidth="1" />
                            </svg>
                        </div>
                        
                        <div style={{
                            position: 'absolute',
                            top: '20px',
                            right: '20px',
                            width: '25px',
                            height: '35px',
                            transform: 'rotate(20deg)'
                        }}>
                            <svg viewBox="0 0 25 35">
                                <path d="M12.5 5 Q20 0 20 10 Q12.5 15 5 20 Q0 15 5 10 Q0 5 12.5 5" fill="#FFF9C4" stroke="#555" strokeWidth="1" />
                            </svg>
                        </div>
                        
                        <div style={{
                            position: 'absolute',
                            bottom: '30px',
                            left: '50px',
                            width: '35px',
                            height: '45px',
                            transform: 'rotate(-10deg)'
                        }}>
                            <svg viewBox="0 0 35 45">
                                <path d="M17.5 5 Q25 0 25 10 Q17.5 15 10 20 Q2.5 15 10 10 Q2.5 5 17.5 5" fill="#C8E6C9" stroke="#555" strokeWidth="1" />
                            </svg>
                        </div>
                    </div>
                    
                    <div className="interaction-hint" style={{ bottom: '20px' }}>
                        Click the bunny to make it hop!
                    </div>
                    
                    <style>{`
                        @keyframes gentleBounce {
                            0%, 100% { transform: translateY(0px) scale(1); }
                            50% { transform: translateY(-10px) scale(1.05); }
                        }
                    `}</style>
                </Section>
                <DyeSection />
                <Section className="pink" id="section-6">
                    <h2>Basket Filler</h2>
                    <p>Click to add treats to the basket!</p>
                    <div style={{ position: 'relative', width: '250px', height: '200px' }}>
                        {/* Basket */}
                        <svg width="250" height="200" viewBox="0 0 250 200" style={{ position: 'absolute', top: 0, left: 0 }}>
                            <path d="M50 60 Q125 160 200 60 L180 180 L70 180 Z" fill="#8D6E63" stroke="#6D4C41" strokeWidth="2" />
                            <path d="M50 60 Q125 -40 200 60" fill="none" stroke="#6D4C41" strokeWidth="8" />
                            
                            {/* Basket Weave Pattern */}
                            <path d="M60 80 L190 80" stroke="#6D4C41" strokeWidth="1" opacity="0.5" />
                            <path d="M65 100 L185 100" stroke="#6D4C41" strokeWidth="1" opacity="0.5" />
                            <path d="M70 120 L180 120" stroke="#6D4C41" strokeWidth="1" opacity="0.5" />
                            <path d="M75 140 L175 140" stroke="#6D4C41" strokeWidth="1" opacity="0.5" />
                            <path d="M80 160 L170 160" stroke="#6D4C41" strokeWidth="1" opacity="0.5" />
                        </svg>
                        
                        {/* Interactive Treats */}
                        <div 
                            id="treat-container"
                            style={{
                                position: 'absolute',
                                top: '80px',
                                left: '50%',
                                transform: 'translateX(-50%)',
                                width: '120px',
                                height: '80px',
                                display: 'flex',
                                flexWrap: 'wrap',
                                justifyContent: 'center',
                                alignItems: 'center',
                                gap: '5px',
                                padding: '10px'
                            }}
                        />
                        
                        {/* Treat Buttons */}
                        <div style={{ position: 'absolute', bottom: '-40px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '10px' }}>
                            <button
                                className="interact-btn"
                                style={{ padding: '0.5rem 1rem', fontSize: '0.8rem' }}
                                onClick={() => {
                                    audio.playTone(600, 'triangle', 0.1);
                                    const container = document.getElementById('treat-container');
                                    const treat = document.createElement('div');
                                    treat.style.cssText = `
                                        width: 20px;
                                        height: 20px;
                                        background: linear-gradient(45deg, #FF6B35, #FFA726);
                                        border-radius: 50%;
                                        animation: dropIn 0.5s ease-out;
                                    `;
                                    container.appendChild(treat);
                                }}
                            >
                                🥕
                            </button>
                            
                            <button
                                className="interact-btn"
                                style={{ padding: '0.5rem 1rem', fontSize: '0.8rem' }}
                                onClick={() => {
                                    audio.playTone(800, 'sine', 0.1);
                                    const container = document.getElementById('treat-container');
                                    const treat = document.createElement('div');
                                    treat.style.cssText = `
                                        width: 25px;
                                        height: 15px;
                                        background: linear-gradient(45deg, #8B4513, #D2691E);
                                        border-radius: 50%;
                                        animation: dropIn 0.5s ease-out;
                                    `;
                                    container.appendChild(treat);
                                }}
                            >
                                🍫
                            </button>
                            
                            <button
                                className="interact-btn"
                                style={{ padding: '0.5rem 1rem', fontSize: '0.8rem' }}
                                onClick={() => {
                                    audio.playTone(1000, 'sine', 0.1);
                                    const container = document.getElementById('treat-container');
                                    const treat = document.createElement('div');
                                    treat.style.cssText = `
                                        width: 18px;
                                        height: 18px;
                                        background: linear-gradient(45deg, #FF69B4, #FFB6C1);
                                        border-radius: 3px;
                                        animation: dropIn 0.5s ease-out;
                                    `;
                                    container.appendChild(treat);
                                }}
                            >
                                🍬
                            </button>
                            
                            <button
                                className="interact-btn"
                                style={{ padding: '0.5rem 1rem', fontSize: '0.8rem' }}
                                onClick={() => {
                                    audio.playTone(400, 'square', 0.1);
                                    const container = document.getElementById('treat-container');
                                    container.innerHTML = '';
                                }}
                            >
                                🧹
                            </button>
                        </div>
                        
                        {/* Decorative Eggs */}
                        <div style={{
                            position: 'absolute',
                            top: '20px',
                            left: '20px',
                            width: '25px',
                            height: '35px',
                            transform: 'rotate(-15deg)'
                        }}>
                            <svg viewBox="0 0 25 35">
                                <path d="M12.5 5 Q20 0 20 10 Q12.5 15 5 20 Q0 15 5 10 Q0 5 12.5 5" fill="#FFCDD2" stroke="#555" strokeWidth="1" />
                            </svg>
                        </div>
                        
                        <div style={{
                            position: 'absolute',
                            top: '30px',
                            right: '30px',
                            width: '20px',
                            height: '30px',
                            transform: 'rotate(20deg)'
                        }}>
                            <svg viewBox="0 0 20 30">
                                <path d="M10 5 Q15 0 15 10 Q10 15 5 20 Q0 15 5 10 Q0 5 10 5" fill="#C8E6C9" stroke="#555" strokeWidth="1" />
                            </svg>
                        </div>
                    </div>
                    
                    <div className="interaction-hint" style={{ bottom: '20px' }}>
                        Click treats to fill the basket!
                    </div>
                    
                    <style>{`
                        @keyframes dropIn {
                            0% { transform: translateY(-50px) scale(0); opacity: 0; }
                            50% { transform: translateY(0) scale(1.2); opacity: 1; }
                            100% { transform: translateY(0) scale(1); opacity: 1; }
                        }
                    `}</style>
                </Section>
                <FlowerSection />
                <GoldenEggSection />
                <ChocoSection />
                <FinaleSection wishData={wishData} />
            </div>
        </>
    );
};

export default EasterView;