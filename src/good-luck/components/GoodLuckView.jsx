import React, { useEffect, useRef, useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase'; // Assumed path based on provided code
import CardViewHeader from '../../components/CardViewHeader'; // Assumed path
import { normalizeCardData, resolveCardId } from '../../utils/slugs'; // Assumed path
import { 
    Clover, Target, Music, Play, Pause, Star, 
    Hand, Move, MousePointer2, Sparkles, Send, 
    Magnet, RefreshCcw, Heart
} from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

// --- AUDIO ENGINE (Web Audio API) ---
const SoundEngine = {
    ctx: null,
    init: () => {
        if (!SoundEngine.ctx) {
            SoundEngine.ctx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (SoundEngine.ctx.state === 'suspended') {
            SoundEngine.ctx.resume();
        }
    },
    playTone: (freq, type = 'sine', duration = 0.5, vol = 0.1) => {
        if (!SoundEngine.ctx) return;
        const osc = SoundEngine.ctx.createOscillator();
        const gain = SoundEngine.ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, SoundEngine.ctx.currentTime);
        gain.gain.setValueAtTime(vol, SoundEngine.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, SoundEngine.ctx.currentTime + duration);
        osc.connect(gain);
        gain.connect(SoundEngine.ctx.destination);
        osc.start();
        osc.stop(SoundEngine.ctx.currentTime + duration);
    },
    playChord: (type) => {
        if (!SoundEngine.ctx) return;
        const chords = {
            success: [523.25, 659.25, 783.99], // C Major
            magic: [659.25, 830.61, 987.77, 1318.51], // E Major 7
            bad: [110, 116],
            coin: [1200, 1800]
        };
        const notes = chords[type] || chords.success;
        notes.forEach((freq, i) => {
            setTimeout(() => SoundEngine.playTone(freq, 'triangle', 1.5, 0.05), i * 50);
        });
    }
};

// --- STYLES (Pure CSS - No Frameworks) ---
const styles = `
    @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700&family=Inter:wght@300;400;600&display=swap');

    :root {
        --c-deep: #022c22;
        --c-emerald: #064e3b;
        --c-leaf: #10b981;
        --c-gold: #fbbf24;
        --c-gold-dim: #b45309;
        --c-cream: #fcfbf7;
    }

    /* Base Reset & Layout */
    .gl-wrapper {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100vh;
        background: radial-gradient(circle at center, var(--c-emerald), var(--c-deep));
        color: var(--c-cream);
        font-family: 'Inter', sans-serif;
        overflow-y: auto;
        overflow-x: hidden;
        scroll-snap-type: y mandatory;
        z-index: 50; /* Above regular content */
        -webkit-overflow-scrolling: touch; /* iOS smooth scrolling */
    }

    .gl-section {
        width: 100%;
        height: 100dvh;
        min-height: 100dvh;
        scroll-snap-align: start;
        position: relative;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        overflow: hidden;
        perspective: 1000px;
        touch-action: pan-y; /* Allow vertical scrolling on mobile */
    }

    /* Typography */
    h1, h2, h3 { font-family: 'Cinzel', serif; letter-spacing: -0.02em; }
    h2 { font-size: 2rem; color: var(--c-gold); text-shadow: 0 0 20px rgba(251, 191, 36, 0.3); margin-bottom: 2rem; text-align: center; }
    p { color: white; opacity: 0.8; max-width: 300px; text-align: center; line-height: 1.6; }
    .instruction { position: absolute; bottom: 40px; font-size: 0.8rem; letter-spacing: 0.1em; text-transform: uppercase; opacity: 0.5; animation: pulse 2s infinite; }

    /* Interactive Objects */
    .coin {
        width: 150px;
        height: 150px;
        transform-style: preserve-3d;
        cursor: pointer;
        transition: transform 3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    }
    .coin-face {
        position: absolute;
        width: 100%;
        height: 100%;
        backface-visibility: hidden;
        border-radius: 50%;
        background: radial-gradient(circle at 30% 30%, var(--c-gold), var(--c-gold-dim));
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 10px 30px rgba(0,0,0,0.5);
        border: 4px solid #fff;
    }
    .coin-back { transform: rotateY(180deg); }
    .coin.flipping { transform: rotateY(1800deg); }

    .dice-container { perspective: 1000px; width: 100px; height: 100px; }
    .dice {
        width: 100%; height: 100%;
        position: relative; transform-style: preserve-3d;
        transition: transform 1s ease-out;
        cursor: pointer;
    }
    .face {
        position: absolute; width: 100px; height: 100px;
        background: rgba(255, 255, 255, 0.95);
        border: 1px solid #ccc; border-radius: 12px;
        display: flex; align-items: center; justify-content: center;
        font-size: 2rem; color: #000;
        box-shadow: inset 0 0 10px rgba(0,0,0,0.1);
    }
    .face-1 { transform: rotateY(0deg) translateZ(50px); }
    .face-6 { transform: rotateY(180deg) translateZ(50px); }
    .face-2 { transform: rotateY(90deg) translateZ(50px); }
    .face-5 { transform: rotateY(-90deg) translateZ(50px); }
    .face-3 { transform: rotateX(90deg) translateZ(50px); }
    .face-4 { transform: rotateX(-90deg) translateZ(50px); }

    /* Controls */
    input[type="range"] {
        -webkit-appearance: none; width: 80%; max-width: 300px; height: 4px; background: rgba(255,255,255,0.2); border-radius: 2px;
    }
    input[type="range"]::-webkit-slider-thumb {
        -webkit-appearance: none; width: 20px; height: 20px; border-radius: 50%; background: var(--c-gold); cursor: pointer; box-shadow: 0 0 15px var(--c-gold);
    }
    
    .manifest-input {
        background: transparent; border: none; border-bottom: 2px solid rgba(255,255,255,0.2);
        color: var(--c-gold); font-size: 1.5rem; text-align: center; font-family: 'Cinzel';
        outline: none; padding: 10px; width: 80%; transition: all 0.3s;
    }
    .manifest-input:focus { border-bottom-color: var(--c-gold); }

    /* Animations */
    @keyframes pulse { 0% { opacity: 0.3; } 50% { opacity: 0.7; } 100% { opacity: 0.3; } }
    @keyframes float { 0% { transform: translateY(0); } 50% { transform: translateY(-10px); } 100% { transform: translateY(0); } }
    @keyframes rainbow-draw { from { stroke-dashoffset: 1000; } to { stroke-dashoffset: 0; } }

    /* Custom Scrollbar Hide */
    .gl-wrapper::-webkit-scrollbar { display: none; }
    .gl-wrapper { -ms-overflow-style: none; scrollbar-width: none; }

    /* Original Content Overrides */
    .original-card-wrapper {
        width: 100%; max-width: 600px; padding: 2rem;
        background: rgba(255, 255, 255, 0.05);
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 24px; text-align: center;
    }
    .music-player-mini {
        position: fixed; top: 20px; right: 20px; z-index: 100;
        background: rgba(0,0,0,0.5); backdrop-filter: blur(5px);
        padding: 10px; border-radius: 50px;
        display: flex; align-items: center; gap: 10px;
        border: 1px solid rgba(255,255,255,0.1);
    }
    .loading-screen {
        position: fixed; inset: 0; background: var(--c-deep);
        display: flex; align-items: center; justify-content: center; z-index: 1000;
        color: var(--c-gold); font-family: 'Cinzel';
    }

    /* Floating Spotify */
    .spotify-float {
        position: fixed;
        top: 24px;
        right: 24px;
        z-index: 2000;
        background: rgba(255,255,255,0.15);
        backdrop-filter: blur(12px);
        border-radius: 50px;
        width: 44px;
        height: 44px;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 2px solid rgba(255,255,255,0.3);
        cursor: pointer;
        transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        overflow: hidden;
        box-shadow: 0 8px 24px rgba(0,0,0,0.3), 0 0 20px rgba(251,191,36,0.2);
    }
    .spotify-float:hover {
        width: 300px;
        height: 84px;
        border-radius: 16px;
        background: rgba(0,0,0,0.9);
        border-color: var(--c-gold);
    }
    .spotify-icon { color: var(--c-gold); transition: all 0.3s; }
    .spotify-float:hover .spotify-icon { opacity: 0; display: none; }
    .spotify-float iframe { 
        opacity: 0; 
        transition: opacity 0.5s ease 0.2s; 
        width: 100%; 
        height: 100%; 
        border-radius: 12px;
    }
    /* Custom Hand Gesture */
    .hand-gesture {
        width: 120px;
        height: 120px;
        position: relative;
        cursor: pointer;
        user-select: none;
        transition: all 0.3s ease;
    }
    
    .hand-palm {
        width: 80px;
        height: 100px;
        background: linear-gradient(135deg, var(--c-gold), var(--c-gold-dim));
        border-radius: 40px 20px 20px 40px;
        position: absolute;
        top: 10px;
        left: 20px;
        box-shadow: 0 0 30px rgba(251,191,36,0.5);
    }
    
    .hand-thumb {
        width: 25px;
        height: 40px;
        background: linear-gradient(135deg, var(--c-gold), var(--c-gold-dim));
        border-radius: 12px;
        position: absolute;
        top: 15px;
        left: 5px;
        transform: rotate(-20deg);
        box-shadow: 0 0 15px rgba(251,191,36,0.3);
    }
    
    .hand-fingers {
        position: absolute;
        top: 0;
        left: 35px;
        display: flex;
        gap: 8px;
    }
    
    .finger {
        width: 18px;
        height: 60px;
        background: linear-gradient(135deg, var(--c-gold), var(--c-gold-dim));
        border-radius: 9px;
        box-shadow: 0 0 15px rgba(251,191,36,0.3);
        transform-origin: bottom center;
        animation: finger-wave 3s ease-in-out infinite;
    }
    
    .finger:nth-child(2) { animation-delay: 0.2s; }
    .finger:nth-child(3) { animation-delay: 0.4s; }
    .finger:nth-child(4) { animation-delay: 0.6s; }
    
    @keyframes finger-wave {
        0%, 100% { transform: rotate(0deg); }
        50% { transform: rotate(-5deg); }
    }
    
    .hand-gesture.clicked {
        animation: fist-bump 0.5s ease;
    }
    
    @keyframes fist-bump {
        0% { transform: scale(1) rotate(0deg); }
        50% { transform: scale(1.3) rotate(10deg); }
        100% { transform: scale(1) rotate(0deg); }
    }
    
    .hand-gesture:hover .finger {
        animation-duration: 1s;
    }
`;

// --- SECTIONS ---

// 1. Cover
const SectionCover = ({ onStart, recipientName }) => {
    return (
        <section className="gl-section">
            <Clover size={64} color="var(--c-gold)" style={{animation: 'float 3s ease-in-out infinite'}} />
            <h1 style={{fontSize: '3rem', margin: '2rem 0', color: 'var(--c-cream)'}}>Good Luck</h1>
            {recipientName && (
                <h2 style={{
                    fontSize: '1.8rem', 
                    margin: '1rem 0', 
                    color: 'var(--c-gold)', 
                    textShadow: '0 0 20px rgba(251,191,36,0.3)',
                    fontFamily: 'Inter',
                    fontWeight: '300'
                }}>
                    {recipientName}
                </h2>
            )}
            <p>A journey of fortune awaits.</p>
            <button 
                onClick={onStart}
                style={{marginTop: '3rem', padding: '1rem 3rem', background: 'var(--c-gold)', color: 'var(--c-deep)', border: 'none', borderRadius: '50px', fontSize: '1.2rem', fontWeight: 'bold', cursor: 'pointer', fontFamily: 'Cinzel'}}
            >
                Begin Journey
            </button>
        </section>
    );
};

// 2. Coin Toss
const SectionCoin = () => {
    const [flipped, setFlipped] = useState(false);
    
    const flip = () => {
        if(flipped) return;
        SoundEngine.playTone(1200, 'sine', 0.1);
        setTimeout(() => SoundEngine.playTone(1600, 'sine', 0.5), 100);
        setFlipped(true);
        setTimeout(() => SoundEngine.playChord('success'), 2500);
    };

    return (
        <section className="gl-section">
            <h2>The Toss</h2>
            <div className={`coin ${flipped ? 'flipping' : ''}`} onClick={flip}>
                <div className="coin-face">
                    <Star size={60} color="#fff" fill="#fff" opacity={0.5} />
                </div>
                <div className="coin-face coin-back">
                    <span style={{fontSize: '2rem', fontWeight: 'bold', color: '#fff'}}>HEADS</span>
                </div>
            </div>
            <p className="instruction" style={{marginTop: '4rem'}}>Tap to flip for good fortune</p>
        </section>
    );
};

// 3. Clover Patch (Canvas)
const SectionCloverPatch = () => {
    const canvasRef = useRef(null);
    const [found, setFound] = useState(false);

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        let animationFrame;
        let clovers = [];

        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            initClovers();
        };

        const drawClover = (x, y, leaves, color) => {
            ctx.fillStyle = color;
            ctx.save();
            ctx.translate(x, y);
            for(let i=0; i<leaves; i++) {
                ctx.rotate((Math.PI * 2) / leaves);
                ctx.beginPath();
                ctx.arc(0, -10, 10, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.restore();
        };

        const initClovers = () => {
            clovers = [];
            // Generate 3-leafers
            for(let i=0; i<50; i++) {
                clovers.push({
                    x: Math.random() * canvas.width,
                    y: Math.random() * canvas.height,
                    leaves: 3,
                    color: '#047857',
                    scale: 0.5 + Math.random() * 0.5,
                    rotation: Math.random() * Math.PI * 2
                });
            }
            // The One 4-leaf
            clovers.push({
                x: canvas.width / 2 + (Math.random() * 200 - 100),
                y: canvas.height / 2 + (Math.random() * 200 - 100),
                leaves: 4,
                color: '#10b981', // Brighter
                isTarget: true,
                scale: 1,
                rotation: 0
            });
        };

        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            clovers.forEach(c => {
                ctx.save();
                ctx.translate(c.x, c.y);
                ctx.rotate(c.rotation);
                ctx.scale(c.scale, c.scale);
                // Wiggle effect
                ctx.rotate(Math.sin(Date.now() / 1000 + c.x) * 0.1);
                
                // Draw stem
                ctx.beginPath();
                ctx.moveTo(0,0);
                ctx.quadraticCurveTo(5, 20, 0, 30);
                ctx.strokeStyle = c.color;
                ctx.lineWidth = 3;
                ctx.stroke();

                drawClover(0, 0, c.leaves, c.color);
                
                if (c.isTarget && found) {
                    ctx.shadowBlur = 20;
                    ctx.shadowColor = '#fbbf24';
                    ctx.fillStyle = '#fbbf24';
                    ctx.beginPath();
                    ctx.arc(0,0, 5, 0, Math.PI*2);
                    ctx.fill();
                    ctx.shadowBlur = 0;
                }
                ctx.restore();
            });
            animationFrame = requestAnimationFrame(animate);
        };

        resize();
        window.addEventListener('resize', resize);
        animate();

        const handleClick = (e) => {
            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            // Simple hit detection for the 4-leaf
            const target = clovers.find(c => c.isTarget);
            const dist = Math.hypot(target.x - x, target.y - y);
            
            if (dist < 50 && !found) {
                setFound(true);
                SoundEngine.playChord('magic');
            }
        };

        canvas.addEventListener('click', handleClick);
        canvas.addEventListener('touchstart', (e) => handleClick(e.touches[0]), {passive: false});

        return () => {
            window.removeEventListener('resize', resize);
            cancelAnimationFrame(animationFrame);
        };
    }, [found]);

    return (
        <section className="gl-section">
            <h2 style={{position: 'absolute', top: '10%', zIndex: 10, pointerEvents: 'none'}}>
                {found ? "You Found It!" : "Find the 4-Leaf Clover"}
            </h2>
            <canvas ref={canvasRef} style={{touchAction: 'pan-y', width: '100%', height: '100%', position: 'absolute', top: 0, left: 0}} />
        </section>
    );
};

// 4. Horseshoe (Magnet)
const SectionHorseshoe = () => {
    const [starsCaught, setStarsCaught] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const [magnetPosition, setMagnetPosition] = useState({ x: 0, y: 0 });
    const [fallingStars, setFallingStars] = useState([]);
    const containerRef = useRef(null);

    // Generate falling stars
    useEffect(() => {
        const interval = setInterval(() => {
            if (fallingStars.length < 5) {
                setFallingStars(prev => [...prev, {
                    id: Date.now(),
                    x: Math.random() * 300,
                    y: -20,
                    speed: 2 + Math.random() * 3,
                    size: 15 + Math.random() * 10
                }]);
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [fallingStars.length]);

    // Update falling stars position
    useEffect(() => {
        const interval = setInterval(() => {
            setFallingStars(prev => {
                return prev.map(star => ({
                    ...star,
                    y: star.y + star.speed
                })).filter(star => {
                    // Check if star is caught by magnet
                    const magnetX = 150 + magnetPosition.x;
                    const magnetY = 150 + magnetPosition.y;
                    const distance = Math.hypot(star.x - magnetX, star.y - magnetY);
                    
                    if (distance < 60 && star.y > 100) {
                        setStarsCaught(prev => {
                            if (prev < 10) {
                                SoundEngine.playTone(800 + (prev * 100), 'sine', 0.1);
                                return prev + 1;
                            }
                            return prev;
                        });
                        return false;
                    }
                    
                    return star.y < 320;
                });
            });
        }, 50);

        return () => clearInterval(interval);
    }, [magnetPosition]);

    const handleDrag = (e) => {
        if (!isDragging) return;
        
        const rect = containerRef.current?.getBoundingClientRect();
        if (!rect) return;
        
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        
        const x = ((clientX - rect.left) / rect.width - 0.5) * 200;
        const y = ((clientY - rect.top) / rect.height - 0.5) * 200;
        
        setMagnetPosition({
            x: Math.max(-100, Math.min(100, x)),
            y: Math.max(-100, Math.min(100, y))
        });
    };

    const handleMouseDown = () => setIsDragging(true);
    const handleMouseUp = () => setIsDragging(false);

    return (
        <section 
            className="gl-section" 
            ref={containerRef}
            onMouseMove={handleDrag}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchMove={handleDrag}
            onTouchEnd={handleMouseUp}
        >
            <h2>Catch Falling Luck</h2>
            <div style={{position: 'relative', width: '300px', height: '300px'}}>
                <Magnet 
                    size={100} 
                    color={isDragging ? "var(--c-gold)" : "var(--c-gold-dim)"} 
                    style={{
                        transform: `rotate(180deg) translate(${magnetPosition.x}px, ${magnetPosition.y}px)`,
                        margin: '0 auto', 
                        display: 'block',
                        cursor: isDragging ? 'grabbing' : 'grab',
                        transition: 'color 0.3s ease',
                        filter: isDragging ? 'drop-shadow(0 0 20px rgba(251,191,36,0.8))' : 'none'
                    }}
                    onMouseDown={handleMouseDown}
                    onTouchStart={handleMouseDown}
                />
                
                {/* Falling stars */}
                {fallingStars.map(star => (
                    <Star
                        key={star.id}
                        size={star.size}
                        fill="var(--c-gold)"
                        color="var(--c-gold)"
                        style={{
                            position: 'absolute',
                            left: `${star.x}px`,
                            top: `${star.y}px`,
                            animation: 'float 1s infinite',
                            filter: 'drop-shadow(0 0 10px rgba(251,191,36,0.6))'
                        }}
                    />
                ))}
                
                {/* Caught stars display */}
                {Array.from({length: starsCaught}).map((_, i) => (
                    <Star 
                        key={`caught-${i}`} 
                        size={20} 
                        fill="var(--c-leaf)" 
                        color="var(--c-leaf)" 
                        style={{
                            position: 'absolute',
                            top: 80 + (i % 3) * 25,
                            left: 100 + (i % 3) * 30 + Math.floor(i / 3) * 15,
                            animation: 'float 2s infinite',
                            filter: 'drop-shadow(0 0 8px rgba(16,185,129,0.8))'
                        }}
                    />
                ))}
            </div>
            <p className="instruction">
                Drag magnet to catch stars ({starsCaught}/10)
                {isDragging && <span style={{color: 'var(--c-gold)', marginLeft: '10px'}}>●</span>}
            </p>
            {starsCaught >= 10 && (
                <div style={{marginTop: '20px', animation: 'float 2s infinite'}}>
                    <p style={{color: 'var(--c-gold)', fontWeight: 'bold', fontSize: '1.2rem'}}>
                        Magnetic Master! 🧲✨
                    </p>
                </div>
            )}
        </section>
    );
};

// 5. Rainbow Road
const SectionRainbow = () => {
    const [val, setVal] = useState(0);
    
    const colors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#a855f7'];

    const handleInput = (e) => {
        setVal(e.target.value);
        if (parseInt(e.target.value) === 100) SoundEngine.playChord('success');
    };

    return (
        <section className="gl-section">
            <h2>Paint the Sky</h2>
            <div style={{width: '300px', height: '150px', position: 'relative', overflow: 'hidden'}}>
                <svg viewBox="0 0 300 150" style={{position: 'absolute', bottom: 0}}>
                    {colors.map((c, i) => (
                        <path 
                            key={i}
                            d="M 10,150 A 140,140 0 0,1 290,150"
                            fill="none"
                            stroke={c}
                            strokeWidth="10"
                            strokeDasharray="500"
                            strokeDashoffset={500 - (val * 5)}
                            transform={`scale(${1 - i*0.1}) translate(${i*15}, ${i*8})`}
                            style={{transition: 'stroke-dashoffset 0.1s linear'}}
                        />
                    ))}
                </svg>
            </div>
            {parseInt(val) === 100 && (
                <div style={{marginTop: '20px', animation: 'float 2s infinite'}}>
                    <p style={{color: 'var(--c-gold)', fontWeight: 'bold'}}>Pot of Gold Found!</p>
                </div>
            )}
            <input type="range" min="0" max="100" value={val} onChange={handleInput} style={{marginTop: '40px'}} />
        </section>
    );
};

// 6. Fingers Crossed
const SectionFingers = () => {
    const [clicks, setClicks] = useState(0);
    const [isAnimating, setIsAnimating] = useState(false);
    
    const handleClick = () => {
        setClicks(prev => prev + 1);
        setIsAnimating(true);
        SoundEngine.playTone(600 + (clicks * 100), 'sine', 0.3);
        setTimeout(() => setIsAnimating(false), 500);
        
        if (clicks === 4) {
            SoundEngine.playChord('magic');
        }
    };
    
    return (
        <section className="gl-section">
            <h2>I'm Rooting For You</h2>
            <div 
                className={`hand-gesture ${isAnimating ? 'clicked' : ''}`}
                onClick={handleClick}
                style={{
                    margin: '2rem auto',
                    animation: isAnimating ? 'none' : 'float 3s ease-in-out infinite'
                }}
            >
                <div className="hand-palm"></div>
                <div className="hand-thumb"></div>
                <div className="hand-fingers">
                    <div className="finger"></div>
                    <div className="finger"></div>
                    <div className="finger"></div>
                    <div className="finger"></div>
                </div>
            </div>
            <p style={{marginTop: '2rem', fontSize: '1.1rem', color: 'white', opacity: '0.9'}}>
                "Luck is what happens when preparation meets opportunity."
            </p>
            <p className="instruction" style={{marginTop: '1rem', fontSize: '0.9rem'}}>
                Click for encouragement ({clicks}/5)
            </p>
            {clicks >= 5 && (
                <div style={{marginTop: '2rem', animation: 'float 2s infinite'}}>
                    <p style={{color: 'var(--c-gold)', fontWeight: 'bold', fontSize: '1.3rem'}}>
                        Maximum support achieved! ⭐
                    </p>
                </div>
            )}
        </section>
    );
};

// 7. Dice
const SectionDice = () => {
    const [rolling, setRolling] = useState(false);
    
    const roll = () => {
        if(rolling) return;
        setRolling(true);
        SoundEngine.playTone(200, 'sawtooth', 0.5);
        setTimeout(() => {
            setRolling(false);
            SoundEngine.playChord('success');
        }, 1000);
    };

    return (
        <section className="gl-section">
            <h2>Roll for Fortune</h2>
            <div className="dice-container" onClick={roll}>
                <div className={`dice ${rolling ? 'flipping' : ''}`} style={{
                    transform: rolling ? `rotateX(${Math.random()*720}deg) rotateY(${Math.random()*720}deg)` : 'rotateX(-20deg) rotateY(20deg)'
                }}>
                    <div className="face face-1">1</div>
                    <div className="face face-2">2</div>
                    <div className="face face-3">3</div>
                    <div className="face face-4">4</div>
                    <div className="face face-5">5</div>
                    <div className="face face-6" style={{color: 'var(--c-leaf)', fontWeight: 'bold'}}>6</div>
                </div>
            </div>
            <p className="instruction" style={{marginTop: '4rem'}}>It's always a six today</p>
        </section>
    );
};

// 8. Shooting Star
const SectionStar = () => {
    const [caught, setCaught] = useState(false);
    
    return (
        <section className="gl-section">
            <h2>Make a Wish</h2>
            <div 
                onClick={() => { setCaught(true); SoundEngine.playChord('magic'); }}
                style={{
                    position: 'absolute',
                    top: '30%',
                    left: '-10%',
                    cursor: 'pointer',
                    animation: caught ? 'none' : 'shoot 3s linear infinite',
                    animationPlayState: caught ? 'paused' : 'running',
                    opacity: caught ? 0 : 1,
                    transition: 'opacity 0.5s'
                }}
            >
                <style>{`
                    @keyframes shoot {
                        0% { transform: translateX(0) translateY(0) rotate(45deg); left: -10%; top: 20%; }
                        100% { transform: translateX(120vw) translateY(50vh) rotate(45deg); left: 100%; top: 60%; }
                    }
                `}</style>
                <Star fill="var(--c-gold)" color="var(--c-gold)" size={40} className={caught ? 'scale-150' : ''} />
                <div style={{width: '100px', height: '2px', background: 'linear-gradient(90deg, transparent, var(--c-gold))', position: 'absolute', top: '20px', left: '-100px'}}></div>
            </div>
            {caught && <h3 style={{color: 'var(--c-gold)', animation: 'float 2s infinite'}}>Wish Granted ✨</h3>}
            {!caught && <p className="instruction">Catch the star!</p>}
        </section>
    );
};

// 9. Manifestation
const SectionManifest = () => {
    const [text, setText] = useState('');
    const [sent, setSent] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        setSent(true);
        SoundEngine.playChord('magic');
    };

    return (
        <section className="gl-section">
            <h2>Manifest It</h2>
            {!sent ? (
                <form onSubmit={handleSubmit} style={{display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%'}}>
                    <input 
                        className="manifest-input" 
                        placeholder="My goal is..." 
                        value={text} 
                        onChange={(e) => setText(e.target.value)}
                    />
                    <button type="submit" style={{marginTop: '2rem', background: 'none', border: 'none', color: 'var(--c-gold)', cursor: 'pointer'}}>
                        <Send size={32} />
                    </button>
                </form>
            ) : (
                <div style={{animation: 'float 4s infinite'}}>
                    <h3 style={{color: 'var(--c-gold)'}}>{text}</h3>
                    <p>Is on its way to the universe.</p>
                </div>
            )}
        </section>
    );
};


// --- MAIN COMPONENT ---

const GoodLuckView = () => {
    const { wishId } = useParams();
    const containerRef = useRef(null);
    const timelineRef = useRef(null);
    const [wishData, setWishData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isPlayingSong, setIsPlayingSong] = useState(false);
    const [started, setStarted] = useState(false);
    const songPlayerRef = useRef(null);

    // 1. Data Fetching (Preserved)
    useEffect(() => {
        const fetchWishData = async () => {
            try {
                // Using the util function from original code
                const result = await resolveCardId(wishId, 'wishes', 'good-luck');
                if (result && result.data) {
                    setWishData(normalizeCardData(result.data));
                } else {
                    setWishData({
                        recipientName: "Friend",
                        sender: "Well Wisher",
                        message: "Good luck on your new adventure!",
                        song: null
                    });
                }
            } catch (error) {
                console.error("Error fetching wish:", error);
                setWishData({
                    recipientName: "Friend",
                    sender: "Well Wisher",
                    message: "Good luck on your new adventure!",
                    song: null
                });
            } finally {
                setLoading(false);
            }
        };

        fetchWishData();
    }, [wishId]);

    // 2. Original GSAP Animation Logic (Adapted for Final Section)
    useEffect(() => {
        // We only trigger this when the final section is reached, handled via ScrollTrigger ideally,
        // but for now, we attach it to the final card rendering
        if (!loading && wishData && started) {
             // Logic moved to internal component or handled by CSS for simplicity in this new layout,
             // but keeping the timeline logic available if we want to complex animate the final card.
             // See SectionFinal below.
        }
    }, [loading, wishData, started]);

    // 3. Audio Handlers
    const handleStart = () => {
        SoundEngine.init();
        SoundEngine.playChord('magic');
        setStarted(true);
        // Auto scroll to next section
        setTimeout(() => {
            const next = document.querySelector('.gl-wrapper').children[1];
            if(next) next.scrollIntoView({behavior: 'smooth'});
        }, 1000);
    };

    const toggleSongPlayback = () => {
        if (!wishData?.song?.previewUrl) return;

        if (isPlayingSong) {
            songPlayerRef.current?.pause();
            setIsPlayingSong(false);
        } else {
            if (!songPlayerRef.current) {
                songPlayerRef.current = new Audio(wishData.song.previewUrl);
                songPlayerRef.current.loop = true;
                songPlayerRef.current.onended = () => setIsPlayingSong(false);
            }
            songPlayerRef.current.play();
            setIsPlayingSong(true);
        }
    };

    if (loading) return <div className="loading-screen">Preparing Luck...</div>;
    if (!wishData) return <div className="loading-screen">Card not found.</div>;

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
            
            {/* Persistent Music Control */}
            {wishData.song && started && (
                <div className="music-player-mini">
                    <div onClick={toggleSongPlayback} style={{cursor: 'pointer', display: 'flex', alignItems: 'center'}}>
                        {isPlayingSong ? <Pause size={16} color="#fff" /> : <Play size={16} color="#fff" />}
                    </div>
                    <span style={{fontSize: '10px', color: '#fff', maxWidth: '100px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}>
                        {wishData.song.name}
                    </span>
                </div>
            )}

            <div className="gl-wrapper" ref={containerRef}>
                <SectionCover onStart={handleStart} recipientName={wishData.recipientName} />
                
                {/* Interactive Toys */}
                <SectionCoin />
                <SectionCloverPatch />
                <SectionHorseshoe />
                <SectionRainbow />
                <SectionFingers />
                <SectionStar />
                <SectionDice />
                <SectionManifest />

                {/* Section 10: The Charm / Closing Message (Original Content) */}
                <section className="gl-section">
                    <div className="original-card-wrapper">
                        <CardViewHeader
                            cardType="good-luck"
                            cardId={wishId}
                            title="" // Hidden in header, shown in body
                            subtitle=""
                        />
                        
                        <div className="good-luck-content">
                            <div className="clover-section" style={{marginBottom: '2rem'}}>
                                <Clover className="clover-icon" size={60} color="var(--c-leaf)" />
                                <Target className="target-icon" size={30} color="var(--c-gold)" style={{marginLeft: '-15px'}} />
                            </div>

                            <div className="message-section">
                                <h1 className="recipient-name" style={{
                                    fontSize: '2.5rem', 
                                    marginBottom: '1rem',
                                    color: 'var(--c-cream)',
                                    textShadow: '0 0 20px rgba(0,0,0,0.8), 0 0 40px rgba(251,191,36,0.5)',
                                    fontWeight: 'bold'
                                }}>
                                    {wishData.recipientName}
                                </h1>
                                <div className="message-text">
                                    <p style={{fontSize: '1.2rem', margin: '0 auto'}}>{wishData.message}</p>
                                </div>
                            </div>

                            {wishData.encouragement && (
                                <div className="encouragement-section" style={{marginTop: '2rem', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1rem'}}>
                                    <h3 style={{fontSize: '1rem', color: 'var(--c-gold)'}}>Encouragement</h3>
                                    <p>{wishData.encouragement}</p>
                                </div>
                            )}

                            {wishData.imageUrl && (
                                <div className="image-section" style={{marginTop: '2rem'}}>
                                    <img 
                                        src={wishData.imageUrl} 
                                        alt="Moment" 
                                        style={{width: '100%', maxHeight: '200px', objectFit: 'cover', borderRadius: '12px'}} 
                                    />
                                </div>
                            )}

                            <div className="sender-info" style={{marginTop: '3rem'}}>
                                <p style={{fontSize: '0.9rem', fontStyle: 'italic'}}>Believing in you always,</p>
                                <p className="sender-name" style={{fontWeight: 'bold', color: 'var(--c-gold)'}}>{wishData.sender}</p>
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </>
    );
};

export default GoodLuckView;