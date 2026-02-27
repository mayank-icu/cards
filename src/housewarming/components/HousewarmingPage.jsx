import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';
import CardViewHeader from '../../components/CardViewHeader';
import CardFooter from '../../components/CardFooter';
import SongPlayer from '../../components/SongPlayer';
import { normalizeCardData, resolveCardId } from '../../utils/slugs';
import { 
  Key, Box, PaintRoller, Sofa, Wifi, Sprout, 
  Utensils, Footprints, Lightbulb, Home, Music, 
  MoveRight, Check, Play, X
} from 'lucide-react';

// --- CUSTOM CSS SYSTEM ---
const globalStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Space+Mono:ital,wght@0,400;0,700;1,400&family=Inter:wght@300;400;600&family=Nothing+You+Could+Do&display=swap');

  :root {
    --bp-blue: #0044cc;
    --bp-dark: #002a80;
    --bp-white: #ffffff;
    --bp-grid: rgba(255, 255, 255, 0.15);
    --cardboard: #d2b48c;
    --cardboard-dark: #8b7355;
    --neon: #4deeea;
  }

  * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
  
  body, html {
    margin: 0;
    padding: 0;
    width: 100%;
    height: 100%;
    overflow: hidden; /* Prevent native scroll, we handle it in container */
    background-color: var(--bp-blue);
    font-family: 'Inter', sans-serif;
    color: var(--bp-white);
  }

  /* Blueprint Grid Pattern */
  .blueprint-bg {
    background-color: var(--bp-blue);
    background-image: 
      linear-gradient(var(--bp-grid) 1px, transparent 1px),
      linear-gradient(90deg, var(--bp-grid) 1px, transparent 1px);
    background-size: 40px 40px;
    background-position: center center;
  }

  /* Scroll Snap Container */
  .scrolly-container {
    height: 100dvh;
    width: 100vw;
    overflow-y: scroll;
    scroll-snap-type: y mandatory;
    scroll-behavior: smooth;
    position: relative;
  }

  /* Section Base */
  .section {
    height: 100dvh;
    width: 100vw;
    scroll-snap-align: start;
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 2rem;
    overflow: hidden;
  }

  /* Typography */
  h1, h2, h3 { font-family: 'Space Mono', monospace; font-weight: 700; text-transform: uppercase; letter-spacing: -1px; }
  p { font-family: 'Space Mono', monospace; font-weight: 400; opacity: 0.8; line-height: 1.6; }
  .handwritten { font-family: 'Nothing You Could Do', cursive; }

  /* UI Elements */
  .instruction {
    position: absolute;
    bottom: 2rem;
    font-size: 0.8rem;
    letter-spacing: 2px;
    text-transform: uppercase;
    animation: pulse 2s infinite;
    opacity: 0.7;
    pointer-events: none;
  }

  .btn-reset {
    background: none;
    border: 1px solid var(--bp-white);
    color: var(--bp-white);
    padding: 0.5rem 1rem;
    font-family: 'Space Mono', monospace;
    cursor: pointer;
    margin-top: 1rem;
    transition: all 0.3s ease;
  }
  .btn-reset:hover { background: var(--bp-white); color: var(--bp-blue); }

  @keyframes pulse { 0% { opacity: 0.4; } 50% { opacity: 1; } 100% { opacity: 0.4; } }
  @keyframes float { 0% { transform: translateY(0px); } 50% { transform: translateY(-10px); } 100% { transform: translateY(0px); } }
  
  .loading-screen, .error-screen {
    height: 100vh; display: flex; align-items: center; justify-content: center;
    background: var(--bp-blue); color: white; flex-direction: column;
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
  .spotify-icon { color: var(--neon); transition: opacity 0.3s; }
  .spotify-float:hover .spotify-icon { opacity: 0; display: none; }
  .spotify-float iframe { opacity: 0; transition: opacity 0.5s ease 0.2s; width: 100%; height: 100%; }
  .spotify-float:hover iframe { opacity: 1; }

  /* Enhanced Floating Spotify Player */
  .floating-spotify-player {
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 2000;
    background: rgba(77, 238, 234, 0.1);
    backdrop-filter: blur(15px);
    padding: 12px;
    border-radius: 50px;
    box-shadow: 0 8px 32px rgba(77, 238, 234, 0.15);
    display: flex;
    align-items: center;
    gap: 12px;
    border: 2px solid var(--neon);
    transition: all 0.3s ease;
    animation: slideInRight 0.6s ease-out;
  }

  .floating-spotify-player:hover {
    transform: scale(1.05);
    box-shadow: 0 12px 40px rgba(77, 238, 234, 0.25);
    background: rgba(77, 238, 234, 0.2);
  }

  .spotify-disc {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: linear-gradient(135deg, #1db954, #191414);
    overflow: hidden;
    animation: spin 4s linear infinite;
    border: 2px solid var(--neon);
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
    color: var(--bp-white);
    font-family: 'Space Mono', monospace;
    font-weight: 600;
  }

  .scrolling-text {
    display: inline-block;
    white-space: nowrap;
    animation: scrollText 12s linear infinite;
  }

  .mini-play-btn {
    background: var(--neon);
    border: none;
    color: var(--bp-blue);
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
    background: var(--bp-white);
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
        {isPlaying ? <X size={14} /> : <Play size={14} />}
      </button>
      <SongPlayer song={song} isPlaying={isPlaying} setIsPlaying={setIsPlaying} />
    </div>
  );
};

// --- AUDIO ENGINE ---
const AudioEngine = {
  ctx: null,
  init: () => {
    if (!AudioEngine.ctx) {
      AudioEngine.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (AudioEngine.ctx.state === 'suspended') AudioEngine.ctx.resume();
  },
  playTone: (freq = 440, type = 'sine', duration = 0.5) => {
    if (!AudioEngine.ctx) return;
    const osc = AudioEngine.ctx.createOscillator();
    const gain = AudioEngine.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, AudioEngine.ctx.currentTime);
    gain.gain.setValueAtTime(0.1, AudioEngine.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, AudioEngine.ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(AudioEngine.ctx.destination);
    osc.start();
    osc.stop(AudioEngine.ctx.currentTime + duration);
  },
  playChord: (notes) => {
    notes.forEach((n, i) => setTimeout(() => AudioEngine.playTone(n, 'triangle', 1), i * 100));
  }
};

// --- COMPONENTS ---
const Section1_Lock = ({ onUnlock }) => {
  const [rotation, setRotation] = useState(0);
  const [unlocked, setUnlocked] = useState(false);
  const keyRef = useRef(null);

  const handleMove = (e) => {
    if (unlocked) return;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const rect = keyRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const angle = Math.atan2(clientY - centerY, clientX - centerX) * (180 / Math.PI);
    
    // Normalize angle for smoother turning feeling
    let rot = angle + 90; 
    if (rot > 90) setRotation(rot); // Limit rotation direction
    
    if (rot > 170 && !unlocked) {
      setUnlocked(true);
      AudioEngine.playTone(880, 'sine', 0.1);
      setTimeout(() => AudioEngine.playTone(1100, 'sine', 0.6), 150);
      onUnlock();
    }
  };

return (
<div className="section" onMouseMove={(e) => e.buttons === 1 && handleMove(e)} onTouchMove={handleMove}>
<h1 style={{ marginBottom: '2rem' }}>The Key</h1>
<div 
ref={keyRef}
style={{ 
width: 200, height: 200, 
border: '2px solid white', borderRadius: '50%',
display: 'flex', alignItems: 'center', justifyContent: 'center',
transform: 'rotate(' + rotation + 'deg)',
transition: unlocked ? 'transform 0.5s ease' : 'none',
cursor: unlocked ? 'default' : 'grab'
}}
>
<Key size={80} color={unlocked ? '#4deeea' : 'white'} />
</div>
<p className="instruction">{unlocked ? "UNLOCKED. SCROLL DOWN." : "TURN THE KEY"}</p>
</div>
);
};

const Section2_Unpacking = () => {
const [cut, setCut] = useState(false);

const handleCut = () => {
if(!cut) {
setCut(true);
AudioEngine.playTone(150, 'sawtooth', 0.1); // Ripping sound
}
};

return (
<div className="section">
<h2>Unpacking</h2>
<div 
onClick={handleCut}
style={{
width: 200, height: 200, background: 'var(--cardboard)',
position: 'relative', cursor: 'pointer',
transformStyle: 'preserve-3d', transition: 'all 0.5s ease',
transform: cut ? 'scale(1.1)' : 'scale(1)'
}}
>
{/* Tape */}
<div style={{
position: 'absolute', top: '50%', left: 0, right: 0, height: 20,
background: 'rgba(255,255,255,0.4)', transform: 'translateY(-50%)',
display: cut ? 'none' : 'block'
}} />
        
{/* Flaps Animation */}
<div style={{
position: 'absolute', top: 0, left: 0, width: '50%', height: '100%',
background: 'var(--cardboard)', borderRight: '1px solid var(--cardboard-dark)',
transformOrigin: 'left',
transform: cut ? 'rotateY(-110deg)' : 'rotateY(0)',
transition: 'transform 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.27)'
}} />
<div style={{
position: 'absolute', top: 0, right: 0, width: '50%', height: '100%',
background: 'var(--cardboard)', borderLeft: '1px solid var(--cardboard-dark)',
transformOrigin: 'right',
transform: cut ? 'rotateY(110deg)' : 'rotateY(0)',
transition: 'transform 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.27)'
}} />
        
{/* Contents */}
<div style={{
position: 'absolute', top: '20%', left: '20%', right: '20%', bottom: '20%',
display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: cut ? 1 : 0, transitionDelay: '0.4s', transition: 'opacity 0.5s'
}}>
<Box size={60} color="var(--bp-dark)" />
</div>
</div>
<p className="instruction">{cut ? "OPEN." : "TAP TO SLICE TAPE"}</p>
</div>
);
};

const Section3_Paint = () => {
const canvasRef = useRef(null);
  
useEffect(() => {
const canvas = canvasRef.current;
if(!canvas) return;
const ctx = canvas.getContext('2d');
    
// Set size
const resize = () => {
canvas.width = window.innerWidth * 0.8;
canvas.height = window.innerHeight * 0.6;
ctx.fillStyle = 'rgba(255, 255, 255, 0.05)'; // Base wall
ctx.fillRect(0,0, canvas.width, canvas.height);
};
resize();
    
let isDrawing = false;
    
const draw = (x, y) => {
ctx.fillStyle = '#ffffff';
ctx.beginPath();
ctx.arc(x, y, 30, 0, Math.PI * 2);
ctx.fill();
};

const handleStart = () => isDrawing = true;
const handleEnd = () => isDrawing = false;
const handleMove = (e) => {
if (!isDrawing) return;
const rect = canvas.getBoundingClientRect();
const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
const y = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top;
draw(x, y);
if(Math.random() > 0.8) AudioEngine.playTone(100 + Math.random()*50, 'noise', 0.05);
};

canvas.addEventListener('mousedown', handleStart);
canvas.addEventListener('mousemove', handleMove);
canvas.addEventListener('mouseup', handleEnd);
canvas.addEventListener('touchstart', handleStart);
canvas.addEventListener('touchmove', handleMove);
canvas.addEventListener('touchend', handleEnd);

return () => {
// Cleanup not strictly necessary for simple ref in this scope but good practice
canvas.removeEventListener('mousedown', handleStart);
canvas.removeEventListener('mousemove', handleMove);
canvas.removeEventListener('mouseup', handleEnd);
canvas.removeEventListener('touchstart', handleStart);
canvas.removeEventListener('touchmove', handleMove);
canvas.removeEventListener('touchend', handleEnd);
};
}, []);

return (
<div className="section">
<div style={{display:'flex', alignItems:'center', gap:'1rem'}}>
<PaintRoller /> <h2>Paint The Walls</h2>
</div>
<canvas 
ref={canvasRef} 
style={{ 
border: '2px dashed white', 
cursor: 'crosshair',
touchAction: 'none'
}} 
/>
<p className="instruction">PAINT WITH YOUR FINGER</p>
</div>
);
};

const Section4_Tetris = () => {
    const [rotation, setRotation] = useState(0);
    const [x, setX] = useState(0);
    
    const handlePivot = () => {
        setRotation(prev => prev + 45);
        AudioEngine.playTone(300, 'square', 0.1);
    }

    return (
        <div className="section">
            <h2 style={{fontSize: '3rem', margin: 0}}>PIVOT!</h2>
            <div style={{
                width: 300, height: 400, 
                border: '4px solid white', 
                borderTop: 'none',
                position: 'relative',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
                <div 
                    onClick={handlePivot}
                    style={{
                        transition: 'all 0.5s cubic-bezier(0.68, -0.55, 0.27, 1.55)',
                        transform: 'rotate(' + rotation + 'deg) translateX(' + x + 'px)',
                        cursor: 'pointer'
                    }}
                >
                    <Sofa size={120} />
                </div>
            </div>
            <button className="btn-reset" onClick={handlePivot}>ROTATE</button>
        </div>
    );
};

const Section5_Wifi = () => {
    const canvasRef = useRef(null);
    const [revealed, setRevealed] = useState(false);

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        canvas.width = 300;
        canvas.height = 100;
        
        // Silver coating
        ctx.fillStyle = '#C0C0C0';
        ctx.fillRect(0, 0, 300, 100);
        ctx.fillStyle = '#666';
        ctx.font = '20px Space Mono';
        ctx.fillText("SCRATCH HERE", 80, 55);

        let isDrawing = false;
        
        const scratch = (e) => {
            if (!isDrawing) return;
            const rect = canvas.getBoundingClientRect();
            const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
            const y = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top;
            
            ctx.globalCompositeOperation = 'destination-out';
            ctx.beginPath();
            ctx.arc(x, y, 15, 0, Math.PI * 2);
            ctx.fill();
            
            // Basic check if cleared enough
            const imageData = ctx.getImageData(0, 0, 300, 100);
            let zeros = 0;
            for(let i=0; i<imageData.data.length; i+=4) {
                if(imageData.data[i+3] === 0) zeros++;
            }
            if(zeros > (300*100)*0.6 && !revealed) {
                setRevealed(true);
                AudioEngine.playChord([523, 659, 783]);
            }
        };

        const start = () => isDrawing = true;
        const end = () => isDrawing = false;

        canvas.addEventListener('mousedown', start);
        canvas.addEventListener('mousemove', scratch);
        canvas.addEventListener('mouseup', end);
        canvas.addEventListener('touchstart', start);
        canvas.addEventListener('touchmove', scratch);
        canvas.addEventListener('touchend', end);
    }, [revealed]);

    return (
        <div className="section">
             <div style={{display:'flex', alignItems:'center', gap:'1rem', marginBottom: '2rem'}}>
                <Wifi /> <h2>WiFi Password</h2>
            </div>
            <div style={{position: 'relative', width: 300, height: 100}}>
                <div style={{
                    position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: '2px solid white', fontFamily: 'Space Mono', fontSize: '1.5rem',
                    background: 'white', color: 'var(--bp-blue)'
                }}>
                    H0M3_SW33T_H0M3
                </div>
                <canvas 
                    ref={canvasRef}
                    style={{position: 'absolute', top: 0, left: 0, touchAction: 'none', cursor: 'pointer'}}
                />
            </div>
        </div>
    );
};

const Section6_Plant = () => {
    const [growth, setGrowth] = useState(0);

    const water = () => {
        if(growth < 100) {
            setGrowth(prev => prev + 20);
            AudioEngine.playTone(600 + (growth * 10), 'sine', 0.2); // Rising pitch
        }
    };

    return (
        <div className="section" onClick={water}>
             <h2>Grow</h2>
             <div style={{height: 300, display: 'flex', alignItems: 'flex-end', justifyContent: 'center'}}>
                <Sprout 
                    size={50 + (growth * 2)} 
                    color={growth >= 100 ? '#4deeea' : 'white'}
                    style={{transition: 'all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.27)'}}
                />
             </div>
             <p className="instruction">TAP TO WATER</p>
             <div style={{width: 200, height: 4, background: 'rgba(255,255,255,0.2)', marginTop: '2rem'}}>
                 <div style={{width: growth + '%', height: '100%', background: 'white', transition: 'width 0.3s'}} />
             </div>
        </div>
    );
};

const Section7_Pizza = () => {
    const [slices, setSlices] = useState([1,1,1,1,1,1,1,1]);

    const eatSlice = (index) => {
        const newSlices = [...slices];
        newSlices[index] = 0;
        setSlices(newSlices);
        AudioEngine.playTone(200, 'triangle', 0.1);
    };

    return (
        <div className="section">
             <div style={{display:'flex', alignItems:'center', gap:'1rem', marginBottom: '2rem'}}>
                <Utensils /> <h2>Pizza Night</h2>
            </div>
            <div style={{
                width: 300, height: 300, position: 'relative', borderRadius: '50%',
                border: '2px solid rgba(255,255,255,0.1)'
            }}>
                {slices.map((exists, i) => (
                    exists ? (
                        <div 
                            key={i}
                            onClick={() => eatSlice(i)}
                            style={{
                                position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                                clipPath: 'polygon(50% 50%, 100% 0, 100% 50%, 70.7% 70.7%)', // Approx slice
                                transform: 'rotate(' + (i * 45) + 'deg)',
                                background: 'white',
                                border: '1px solid var(--bp-blue)',
                                cursor: 'pointer',
                                transition: 'opacity 0.3s'
                            }}
                        />
                    ) : null
                ))}
            </div>
            <p className="instruction">FEED THE MOVERS</p>
        </div>
    );
};

const Section8_Mat = () => {
    const [clean, setClean] = useState(0);
    
    const handleWipe = () => {
        if(clean < 100) setClean(prev => prev + 2);
    };

    return (
        <div className="section" onMouseMove={handleWipe} onTouchMove={handleWipe}>
            <h2>Welcome Mat</h2>
            <div style={{
                width: 300, height: 180, background: 'var(--cardboard-dark)',
                border: '4px dashed white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexDirection: 'column'
            }}>
                <Footprints 
                    size={60} 
                    style={{
                        opacity: 1 - (clean / 100), 
                        transform: 'scale(' + (1 - (clean/200)) + ')',
                        filter: 'blur(1px)'
                    }} 
                    color="rgba(255,255,255,0.5)"
                />
                <span style={{fontFamily: 'Space Mono', marginTop: '1rem', color: 'rgba(255,255,255,0.5)'}}>
                    {clean < 100 ? "WIPE FEET" : "CLEAN"}
                </span>
            </div>
             <p className="instruction">WIPE BACK AND FORTH</p>
        </div>
    );
};

const Section9_Light = ({ setGlobalDim }) => {
    const [value, setValue] = useState(0);

    const handleChange = (e) => {
        const val = e.target.value;
        setValue(val);
        setGlobalDim(val / 100);
    };

    return (
        <div className="section">
             <Lightbulb size={40} color={value > 50 ? '#ffaa00' : 'white'} />
             <h2>Mood Lighting</h2>
             <input 
                type="range" min="0" max="80" value={value} 
                onChange={handleChange}
                style={{width: '300px', margin: '2rem'}} 
            />
             <p className="instruction">DIM THE LIGHTS</p>
        </div>
    );
};

const Section10_Closing = ({ data }) => {
    return (
        <div className="section" style={{textAlign: 'center', padding: '1rem'}}>
            <Home size={64} style={{marginBottom: '2rem'}} />
            <h1 className="handwritten" style={{fontSize: '3rem', marginBottom: '1rem'}}>
                Home Sweet Home
            </h1>
            
            <div style={{
                border: '2px solid white', padding: '2rem', maxWidth: '600px',
                background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(5px)'
            }}>
                <p style={{fontSize: '1.2rem', marginBottom: '2rem', whiteSpace: 'pre-wrap'}}>
                    {data?.message || "May your walls know joy, may every room hold laughter, and every window open to great possibility."}
                </p>
                <div style={{width: '50%', height: '1px', background: 'white', margin: '0 auto 2rem auto'}} />
                <p style={{textTransform: 'uppercase', letterSpacing: '2px', fontSize: '0.9rem'}}>
                    FROM BLUEPRINT TO REALITY
                </p>
                <h3 style={{marginTop: '1rem'}}>{data?.sender || "Your Friend"}</h3>
            </div>
        </div>
    );
};

// --- MAIN PAGE COMPONENT ---

const HousewarmingPage = () => {
    const { id } = useParams();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [started, setStarted] = useState(false);
    const [dim, setDim] = useState(0);
    
    // Audio Player State (Simple implementation)
    const [playing, setPlaying] = useState(false);
    const audioRef = useRef(null);

    useEffect(() => {
        if (!id) return;
        let unsubscribe = () => { };

        const setupSubscription = async () => {
            try {
                // Try to resolve, default to mock if utils missing in environment
                let cardId = id;
                try {
                     const result = await resolveCardId(id, 'housewarming_cards', 'housewarming');
                     if(result) cardId = result.id;
                } catch(e) { console.log("Slug resolve skipped"); }

                const docRef = doc(db, 'housewarming_cards', cardId);
                unsubscribe = onSnapshot(docRef, (docSnap) => {
                    if (docSnap.exists()) setData(normalizeCardData(docSnap.data()));
                    // Fallback data for preview if DB empty/fails
                    else setData({
                        homeowner: "New Neighbor",
                        message: "Wishing you a happy move-in day! Enjoy the interactive tour.",
                        sender: "The Team",
                        song: "" 
                    });
                    setLoading(false);
                }, (err) => {
                     // Error fallback for preview mode
                     setData({
                        homeowner: "Preview User",
                        message: "This is a preview of the blueprint theme.",
                        sender: "Developer"
                     });
                     setLoading(false);
                });
            } catch (error) {
                console.error("Error:", error);
                setLoading(false);
            }
        };
        setupSubscription();
        return () => unsubscribe();
    }, [id]);

    const handleStart = () => {
        AudioEngine.init();
        setStarted(true);
        // Auto scroll to section 1 after a moment
        setTimeout(() => {
            document.getElementById('section-1').scrollIntoView({ behavior: 'smooth' });
        }, 500);
    };

    if (loading) return <div className="loading-screen"><h1>LOADING BLUEPRINT...</h1></div>;

    // Helper to get Spotify ID
    const getSpotifyId = (url) => {
        if (!url) return null;
        try {
            const parts = url.split('/');
            return parts[parts.length - 1].split('?')[0];
        } catch (e) { return null; }
    };
    const spotifyId = getSpotifyId(data?.spotify);

    return (
        <>
            <style>{globalStyles}</style>
            
            {/* Enhanced Floating Spotify Player */}
            {data?.song && <EnhancedSongPlayer song={data.song} />}
            
            {/* Nav / Close */}
            <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 100 }}>
               <CardViewHeader cardType="housewarming" cardId={id} title="" />
            </div>
            
            {/* Overlay for Dimmer Switch */}
            <div style={{
                position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
                background: 'black', opacity: dim, pointerEvents: 'none', zIndex: 90
            }} />

            {/* Music Control */}
            {data?.song && (
                <div style={{
                    position: 'fixed', top: '1rem', right: '1rem', zIndex: 100,
                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                    background: 'rgba(0,0,0,0.5)', padding: '0.5rem 1rem', borderRadius: '2rem'
                }}>
                    <Music size={16} className={playing ? 'spin' : ''} />
                    <button 
                        onClick={() => {
                             if(!audioRef.current) {
                                 audioRef.current = new Audio(data.song);
                                 audioRef.current.loop = true;
                             }
                             if(playing) audioRef.current.pause();
                             else audioRef.current.play();
                             setPlaying(!playing);
                        }}
                        style={{background:'none', border:'none', color:'white', fontFamily:'Space Mono', cursor:'pointer'}}
                    >
                        {playing ? "PAUSE" : "PLAY AUDIO"}
                    </button>
                </div>
            )}

            <div className="scrolly-container blueprint-bg">
                
                {/* Intro / Cover */}
                <div className="section" id="section-0">
                    <div style={{border: '4px solid white', padding: '3rem', textAlign: 'center'}}>
                        <h1 style={{fontSize: '4rem', margin: 0}}>BLUEPRINT</h1>
                        <p style={{marginTop: '1rem', letterSpacing: '3px'}}>HOUSEWARMING PROJECT NO. 1</p>
                        <p className="handwritten" style={{fontSize: '2rem', color: 'var(--neon)', margin: '2rem 0'}}>
                            For {data?.homeowner}
                        </p>
                        {!started ? (
                            <button className="btn-reset" onClick={handleStart} style={{fontSize: '1.2rem'}}>
                                [ INITIALIZE TOUR ]
                            </button>
                        ) : (
                            <div style={{marginTop: '2rem', animation: 'float 2s infinite'}}>
                                <p>SCROLL DOWN</p>
                            </div>
                        )}
                    </div>
                </div>

                <div id="section-1"><Section1_Lock onUnlock={() => {}} /></div>
                <Section2_Unpacking />
                <Section3_Paint />
                <Section4_Tetris />
                <Section5_Wifi />
                <Section6_Plant />
                <Section7_Pizza />
                <Section8_Mat />
                <Section9_Light setGlobalDim={setDim} />
                <Section10_Closing data={data} />
                
                {/* Footer Credits */}
                <div className="section" style={{height: '50vh', background: 'var(--bp-dark)', textAlign: 'center'}}>
                    <div style={{marginBottom: '2rem'}}>
                        <Home size={48} color="var(--neon)" style={{marginBottom: '1rem'}} />
                        <h2 style={{color: 'var(--bp-white)', marginBottom: '1rem'}}>Create Your Own Card</h2>
                        <p style={{color: 'var(--bp-white)', opacity: 0.8, marginBottom: '2rem', maxWidth: '400px', margin: '0 auto 2rem auto'}}>
                            Use Egreet to create personalized cards for any occasion
                        </p>
                        <button 
                            className="btn-reset" 
                            onClick={() => window.location.href = '/'}
                            style={{fontSize: '1.1rem', padding: '1rem 2rem'}}
                        >
                            CREATE CARD
                        </button>
                    </div>
                    <div style={{opacity: 0.5, fontSize: '0.8rem'}}>
                        POWERED BY EGREET
                    </div>
                </div>

            </div>
        </>
    );
};

export default HousewarmingPage;

