import React, { useEffect, useRef, useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import CardViewHeader from '../../components/CardViewHeader';
import SongPlayer from '../../components/SongPlayer';
import { Cat, Heart, MousePointer2, Volume2, Sparkles, Moon, Music, Play, Pause, Gift } from 'lucide-react';
import { resolveCardId } from '../../utils/slugs';

/* --- 1. AUDIO ENGINE (Web Audio API) --- */
class CatSynth {
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

  playMeow() {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(800, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1200, this.ctx.currentTime + 0.1);
    osc.frequency.exponentialRampToValueAtTime(300, this.ctx.currentTime + 0.4);

    gain.gain.setValueAtTime(0, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.5, this.ctx.currentTime + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.4);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.5);
  }

  startPurr() {
    if (!this.ctx) return null;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'sawtooth';
    osc.frequency.value = 25; // Low rumble

    filter.type = 'lowpass';
    filter.frequency.value = 200;

    // LFO for the rattle
    const lfo = this.ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 25; // Rattle speed
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.value = 100;
    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);

    gain.gain.setValueAtTime(0, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.6, this.ctx.currentTime + 1);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    
    lfo.start();
    osc.start();

    return { osc, lfo, gain };
  }
}

const catAudio = new CatSynth();

/* --- 2. CSS STYLES (In-File Custom System) --- */
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;600;800&family=Pacifico&display=swap');

  :root {
    --midnight: #050510;
    --midnight-light: #1a1a2e;
    --neon-blue: #00f3ff;
    --yarn-pink: #ff00ff;
    --cat-eye: #ffb703;
    --text-white: #f0f0f0;
  }

  * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
  
  body, html {
    margin: 0;
    padding: 0;
    background-color: var(--midnight);
    color: var(--text-white);
    font-family: 'Inter', sans-serif;
    overflow: hidden; /* Controlled by React container */
  }

  .scrolly-container {
    height: 100dvh;
    width: 100vw;
    overflow-y: scroll;
    scroll-snap-type: y mandatory;
    scroll-behavior: smooth;
    position: relative;
  }

  section {
    height: 100dvh;
    width: 100vw;
    scroll-snap-align: start;
    scroll-snap-stop: always;
    position: relative;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    overflow: hidden;
    touch-action: none; /* Prevents browser pull-to-refresh */
  }

  h1, h2, h3 { margin: 0; text-align: center; }
  
  h1 {
    font-size: 3rem;
    font-weight: 800;
    background: linear-gradient(to right, var(--neon-blue), var(--yarn-pink));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    text-shadow: 0 0 20px rgba(0, 243, 255, 0.3);
  }

  h2 { font-size: 1.5rem; color: var(--cat-eye); text-transform: uppercase; letter-spacing: 2px; margin-bottom: 2rem;}

  .instruction {
    position: absolute;
    bottom: 30px;
    font-size: 0.8rem;
    opacity: 0.6;
    animation: pulse 2s infinite;
    pointer-events: none;
  }

  /* Animations */
  @keyframes pulse { 0% { opacity: 0.3; } 50% { opacity: 0.8; } 100% { opacity: 0.3; } }
  @keyframes float { 0% { transform: translateY(0px); } 50% { transform: translateY(-20px); } 100% { transform: translateY(0px); } }
  @keyframes shake { 0% { transform: translate(1px, 1px) rotate(0deg); } 10% { transform: translate(-1px, -2px) rotate(-1deg); } 20% { transform: translate(-3px, 0px) rotate(1deg); } 30% { transform: translate(3px, 2px) rotate(0deg); } 40% { transform: translate(1px, -1px) rotate(1deg); } 50% { transform: translate(-1px, 2px) rotate(-1deg); } 60% { transform: translate(-3px, 1px) rotate(0deg); } 70% { transform: translate(3px, 1px) rotate(-1deg); } 80% { transform: translate(-1px, -1px) rotate(1deg); } 90% { transform: translate(1px, 2px) rotate(0deg); } 100% { transform: translate(1px, -2px) rotate(-1deg); } }

  /* Section Specifics */
  .cover-cat-eyes {
    display: flex; gap: 20px; margin-bottom: 2rem;
  }
  .eye {
    width: 60px; height: 60px; background: var(--cat-eye); border-radius: 50% 50% 0 50%; transform: rotate(45deg);
    box-shadow: 0 0 30px var(--cat-eye);
    position: relative;
    animation: blink 4s infinite;
  }
  .pupil {
    width: 10px; height: 40px; background: #000; position: absolute; top: 10px; left: 25px; border-radius: 50%;
  }

  @keyframes blink { 0%, 96%, 100% { transform: rotate(45deg) scaleY(1); } 98% { transform: rotate(45deg) scaleY(0.1); } }

  /* Box */
  .box-container { width: 200px; height: 180px; position: relative; cursor: pointer; transition: transform 0.3s; }
  .box-body { width: 100%; height: 100%; background: #8b5a2b; border: 4px solid #5c3a1b; position: relative; overflow: hidden;}
  .box-lid { width: 100%; height: 50%; background: #a06b35; position: absolute; top: 0; transform-origin: top; transition: transform 0.4s ease-out; z-index: 2; border-bottom: 2px solid #5c3a1b;}
  .paw-hand { position: absolute; bottom: -100px; left: 50%; transform: translateX(-50%); width: 80px; transition: bottom 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275); z-index: 1; }
  .box-container.open .box-lid { transform: rotateX(110deg); }
  .box-container.open .paw-hand { bottom: 0; }

  /* Laser */
  .laser-canvas { position: absolute; top: 0; left: 0; width: 100%; height: 100%; cursor: none; }
  
  /* Purr */
  .purr-visualizer { display: flex; gap: 5px; height: 100px; align-items: center; }
  .bar { width: 10px; background: var(--yarn-pink); height: 10px; border-radius: 5px; transition: height 0.1s; }
  
  /* Table */
  .table-edge { position: absolute; bottom: 100px; width: 80%; height: 10px; background: #fff; border-radius: 5px; }
  .item { position: absolute; bottom: 110px; transition: transform 0.5s ease-in, opacity 0.5s; cursor: pointer; }
  .item.knocking { transform: translate(100px, 200px) rotate(90deg); opacity: 0; }

  /* Belly */
  .belly-zone { width: 300px; height: 300px; background: radial-gradient(circle, #fff 0%, transparent 70%); opacity: 0.1; border-radius: 50%; display: flex; align-items: center; justify-content: center; transition: opacity 0.3s; }
  .belly-zone:active { opacity: 0.3; }

  /* Zoomies */
  .zoomie-ghost { position: absolute; width: 50px; height: 20px; background: var(--neon-blue); filter: blur(10px); border-radius: 50%; pointer-events: auto; }
  
  /* Yarn */
  .yarn-ball-container { width: 150px; height: 150px; border-radius: 50%; border: 4px dashed var(--yarn-pink); display: flex; align-items: center; justify-content: center; animation: spin 10s linear infinite; cursor: grab; }
  .yarn-string { height: 4px; background: var(--yarn-pink); position: absolute; top: 50%; left: 50%; transform-origin: left; width: 0; transition: width 0.1s; }

  /* Final Card */
  .card-final { background: rgba(255,255,255,0.05); padding: 2rem; border-radius: 20px; border: 1px solid var(--neon-blue); max-width: 90%; width: 400px; text-align: center; backdrop-filter: blur(10px); }
  .card-message { font-family: 'Pacifico', cursive; font-size: 1.2rem; line-height: 1.6; margin: 2rem 0; color: #fff; }
  .sender-tag { color: var(--yarn-pink); font-size: 0.9rem; letter-spacing: 1px; }

  .btn-primary {
    background: var(--neon-blue); color: var(--midnight); border: none; padding: 10px 20px; border-radius: 30px; font-weight: bold; cursor: pointer; margin-top: 10px;
    box-shadow: 0 0 15px var(--neon-blue); text-transform: uppercase;
  }

  /* Enhanced Floating Spotify Player */
  .floating-spotify-player {
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 2000;
    background: rgba(5, 5, 16, 0.95);
    backdrop-filter: blur(15px);
    padding: 12px;
    border-radius: 50px;
    box-shadow: 0 8px 32px rgba(0, 243, 255, 0.15);
    display: flex;
    align-items: center;
    gap: 12px;
    border: 2px solid var(--neon-blue);
    transition: all 0.3s ease;
    animation: slideInRight 0.6s ease-out;
  }
  
  .floating-spotify-player:hover {
    transform: scale(1.05);
    box-shadow: 0 12px 40px rgba(0, 243, 255, 0.25);
    background: rgba(5, 5, 16, 1);
  }
  
  .spotify-disc {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: linear-gradient(135deg, #1db954, #191414);
    overflow: hidden;
    animation: spin 4s linear infinite;
    border: 2px solid var(--neon-blue);
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
    color: var(--text-white);
    font-family: 'Inter', sans-serif;
    font-weight: 600;
  }
  
  .scrolling-text {
    display: inline-block;
    white-space: nowrap;
    animation: scrollText 12s linear infinite;
  }
  
  .mini-play-btn {
    background: var(--neon-blue);
    border: none;
    color: var(--midnight);
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
    background: var(--yarn-pink);
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

  /* Mobile scrolling fix */
  @media (max-width: 768px) {
    .scrolly-container {
      -webkit-overflow-scrolling: touch;
      scroll-behavior: smooth;
      /* Disable scroll-snap on mobile to prevent sticking */
      scroll-snap-type: none;
      -ms-scroll-snap-type: none;
      overflow-y: auto;
      overflow-x: hidden;
    }
    
    section {
      touch-action: auto;
      -webkit-touch-callout: auto;
      -webkit-user-select: auto;
      user-select: auto;
      /* Remove scroll snap on mobile */
      scroll-snap-align: unset;
      scroll-snap-stop: unset;
      height: auto;
      min-height: 100vh;
      /* Allow normal scrolling */
      overflow: visible;
    }
    
    .box-container {
      touch-action: manipulation;
    }
    
    .laser-canvas {
      touch-action: none;
    }
    
    .belly-zone {
      touch-action: manipulation;
    }
    
    .item {
      touch-action: manipulation;
    }
    
    .zoomie-ghost {
      touch-action: manipulation;
    }
    
    h1 { font-size: 2rem; }
    h2 { font-size: 1.2rem; }
  }
`;

/* --- 3. ENHANCED COMPONENTS --- */

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

/* --- 4. SUB-COMPONENTS (The Toys) --- */

const Cover = ({ onStart }) => (
  <section>
    <div className="cover-cat-eyes">
      <div className="eye"><div className="pupil"></div></div>
      <div className="eye"><div className="pupil"></div></div>
    </div>
    <h1>Midnight Zoomies</h1>
    <p style={{marginTop: '20px', maxWidth: '300px', textAlign: 'center', lineHeight: '1.5'}}>
      A scrollytelling experience for cat lovers.<br/>Turn your sound on.
    </p>
    <button className="btn-primary" onClick={onStart} style={{marginTop: '40px'}}>
      Start Zooming
    </button>
    <div className="instruction">Scroll Down</div>
  </section>
);

const TheBox = () => {
  const [isOpen, setIsOpen] = useState(false);
  
  const interact = () => {
    setIsOpen(true);
    catAudio.playMeow();
    setTimeout(() => setIsOpen(false), 1500);
  };

  return (
    <section>
      <h2>1. The Box</h2>
      <div className={`box-container ${isOpen ? 'open' : ''}`} onClick={interact}>
        <div className="box-lid"></div>
        <div className="box-body"></div>
        <div className="paw-hand">
            <svg viewBox="0 0 100 100" fill="white">
                <path d="M20,100 Q10,50 30,30 Q40,10 60,30 Q80,50 70,100 Z" fill="#fff"/>
                <circle cx="35" cy="40" r="5" fill="#pink" style={{fill: 'var(--yarn-pink)'}}/>
                <circle cx="50" cy="35" r="5" fill="#pink" style={{fill: 'var(--yarn-pink)'}}/>
                <circle cx="65" cy="40" r="5" fill="#pink" style={{fill: 'var(--yarn-pink)'}}/>
            </svg>
        </div>
      </div>
      <p style={{marginTop: '20px', opacity: 0.7}}>If I fits, I sits. (Tap it)</p>
    </section>
  );
};

const LaserPointer = () => {
  const canvasRef = useRef(null);
  const [pawPos, setPawPos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    // Resize handler
    const resize = () => {
      canvas.width = canvas.parentElement.clientWidth;
      canvas.height = canvas.parentElement.clientHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    let mouse = { x: canvas.width/2, y: canvas.height/2 };
    let paw = { x: canvas.width/2, y: canvas.height/2 };

    const updateMouse = (e) => {
      const rect = canvas.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      mouse.x = clientX - rect.left;
      mouse.y = clientY - rect.top;
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw Laser
      ctx.beginPath();
      ctx.arc(mouse.x, mouse.y, 8, 0, Math.PI * 2);
      ctx.fillStyle = '#ff0000';
      ctx.shadowBlur = 15;
      ctx.shadowColor = '#ff0000';
      ctx.fill();
      ctx.shadowBlur = 0;

      // Move Paw towards laser (Lerp)
      paw.x += (mouse.x - paw.x) * 0.08;
      paw.y += (mouse.y - paw.y) * 0.08;

      // Draw Paw
      ctx.beginPath();
      ctx.arc(paw.x, paw.y, 20, 0, Math.PI * 2);
      ctx.fillStyle = 'white';
      ctx.fill();
      
      // Toes
      [ -15, 0, 15 ].forEach(offset => {
          ctx.beginPath();
          ctx.arc(paw.x + offset, paw.y - 20, 8, 0, Math.PI * 2);
          ctx.fill();
      });

      requestAnimationFrame(animate);
    };
    
    const animId = requestAnimationFrame(animate);

    canvas.addEventListener('mousemove', updateMouse);
    canvas.addEventListener('touchmove', updateMouse);

    return () => {
        window.removeEventListener('resize', resize);
        cancelAnimationFrame(animId);
        // Event listeners are cleaned up by React re-render usually, but manual cleanup is safer here
        if(canvas) {
            canvas.removeEventListener('mousemove', updateMouse);
            canvas.removeEventListener('touchmove', updateMouse);
        }
    };
  }, []);

  return (
    <section>
        <div style={{position: 'absolute', top: '20px', zIndex: 10, pointerEvents: 'none'}}>
            <h2>2. The Red Dot</h2>
        </div>
        <canvas ref={canvasRef} className="laser-canvas" />
        <div className="instruction">Touch & Drag</div>
    </section>
  );
};

const PurrGenerator = () => {
  const [isPurring, setIsPurring] = useState(false);
  const audioRef = useRef(null);

  const togglePurr = (active) => {
    setIsPurring(active);
    if (active) {
       audioRef.current = catAudio.startPurr();
    } else {
       if (audioRef.current) {
           const { osc, lfo, gain } = audioRef.current;
           const time = catAudio.ctx.currentTime;
           gain.gain.exponentialRampToValueAtTime(0.001, time + 0.5);
           osc.stop(time + 0.5);
           lfo.stop(time + 0.5);
           audioRef.current = null;
       }
    }
  };

  return (
    <section>
      <h2>3. The Engine</h2>
      <div 
        className="belly-zone" 
        style={{
            opacity: isPurring ? 1 : 0.2, 
            transform: isPurring ? 'scale(1.1)' : 'scale(1)',
            background: isPurring ? 'radial-gradient(circle, var(--yarn-pink) 0%, transparent 70%)' : 'radial-gradient(circle, #fff 0%, transparent 70%)'
        }}
        onMouseDown={() => togglePurr(true)}
        onMouseUp={() => togglePurr(false)}
        onTouchStart={() => togglePurr(true)}
        onTouchEnd={() => togglePurr(false)}
      >
        <Volume2 size={64} color={isPurring ? '#fff' : '#888'} />
      </div>
      <div className="purr-visualizer" style={{marginTop: '30px', opacity: isPurring ? 1 : 0}}>
          {[1,2,3,4,5,6,7].map(i => (
              <div key={i} className="bar" style={{
                  height: isPurring ? `${Math.random() * 50 + 20}px` : '10px',
                  animationDelay: `${i * 0.1}s`
              }} />
          ))}
      </div>
      <p style={{marginTop: '20px'}}>Hold to Purr</p>
    </section>
  );
};

const KnockItOff = () => {
  const [items, setItems] = useState([
    { id: 1, type: 'vase', icon: <div style={{width: 30, height: 50, background: 'white', borderRadius: '10px 10px 0 0'}}></div>, knocked: false },
    { id: 2, type: 'cup', icon: <div style={{width: 30, height: 30, background: '#aaa', borderRadius: '0 0 5px 5px'}}></div>, knocked: false },
  ]);

  const knock = (id) => {
    catAudio.playMeow(); // Short meow for mischief
    setItems(prev => prev.map(item => item.id === id ? { ...item, knocked: true } : item));
  };

  return (
    <section>
      <h2>4. Chaos Mode</h2>
      <div style={{position: 'relative', width: '300px', height: '300px', display: 'flex', justifyContent: 'center'}}>
        <div className="table-edge"></div>
        {items.map((item, index) => (
            <div 
                key={item.id} 
                className={`item ${item.knocked ? 'knocking' : ''}`}
                style={{ left: index * 80 + 80 }}
                onClick={() => knock(item.id)}
            >
                {item.icon}
            </div>
        ))}
      </div>
      <p>Tap items to knock them off.</p>
    </section>
  );
};

const Zoomies = () => {
    const [pos, setPos] = useState({ top: '50%', left: '50%' });
    const [caught, setCaught] = useState(false);

    useEffect(() => {
        const interval = setInterval(() => {
            if(!caught) {
                setPos({
                    top: `${Math.random() * 80 + 10}%`,
                    left: `${Math.random() * 80 + 10}%`
                });
            }
        }, 600);
        return () => clearInterval(interval);
    }, [caught]);

    const catchGhost = () => {
        setCaught(true);
        catAudio.playMeow();
        setTimeout(() => setCaught(false), 2000);
    };

    return (
        <section>
            <h2>5. 3AM Zoomies</h2>
            <div 
                className="zoomie-ghost" 
                style={{ 
                    top: pos.top, 
                    left: pos.left, 
                    transition: caught ? 'none' : 'top 0.3s ease-in-out, left 0.3s ease-in-out',
                    background: caught ? 'var(--yarn-pink)' : 'var(--neon-blue)',
                    transform: caught ? 'scale(2)' : 'scale(1)'
                }} 
                onClick={catchGhost}
            />
            {caught && <div style={{position: 'absolute', color: 'var(--yarn-pink)', fontWeight: 'bold'}}>GOTCHA!</div>}
            <div className="instruction">Catch the blur</div>
        </section>
    );
};

const FinalCard = ({ wishData, loading }) => {
    const [playing, setPlaying] = useState(false);
    const audioRef = useRef(null);

    const togglePlay = () => {
        if(!wishData?.song?.previewUrl) return;
        
        if(playing) {
            audioRef.current.pause();
            setPlaying(false);
        } else {
            if(!audioRef.current) {
                audioRef.current = new Audio(wishData.song.previewUrl);
                audioRef.current.loop = true;
                audioRef.current.onended = () => setPlaying(false);
            }
            audioRef.current.play();
            setPlaying(true);
        }
    }

    if(loading) return <section>Loading Wish...</section>;
    if(!wishData) return <section><h2>Card Not Found</h2></section>;

    return (
        <section>
            <div className="card-final">
                <Heart size={40} color="var(--yarn-pink)" fill="var(--yarn-pink)" style={{margin: '0 auto'}} />
                <h2>For {wishData.recipientName || 'You'}</h2>
                
                <div className="card-message">
                    "{wishData.message}"
                </div>

                {wishData.catMemory && (
                    <div style={{fontSize: '0.9rem', color: '#aaa', fontStyle: 'italic', marginBottom: '20px'}}>
                        Memory: {wishData.catMemory}
                    </div>
                )}

                <div className="sender-tag">
                    From: {wishData.sender || 'Anonymous'}
                </div>

                {wishData.song && (
                     <div style={{marginTop: '30px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '15px'}}>
                        <div style={{display: 'flex', alignItems: 'center', gap: '10px', justifyContent: 'center'}}>
                            {wishData.song.albumArt && <img src={wishData.song.albumArt} style={{width: 40, height: 40, borderRadius: 4}} alt="art"/>}
                            <div style={{textAlign: 'left'}}>
                                <div style={{fontSize: '0.8rem', fontWeight: 'bold'}}>{wishData.song.name}</div>
                                <div style={{fontSize: '0.7rem', opacity: 0.7}}>{wishData.song.artist}</div>
                            </div>
                            <button 
                                onClick={togglePlay}
                                style={{background: 'none', border: '1px solid #fff', borderRadius: '50%', width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', cursor: 'pointer', marginLeft: 'auto'}}
                            >
                                {playing ? <Pause size={14}/> : <Play size={14}/>}
                            </button>
                        </div>
                     </div>
                )}
            </div>
            <div style={{marginTop: '20px', fontSize: '3rem'}}>🐾</div>
        </section>
    );
}

/* --- 4. MAIN COMPONENT --- */

const CatLoversView = () => {
    const { wishId } = useParams();
    const [wishData, setWishData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [started, setStarted] = useState(false);
    
    // Firestore Logic
    useEffect(() => {
        const fetchWishData = async () => {
            try {
                // If using the provided util, otherwise standard fetch
                const result = await resolveCardId(wishId, 'wishes', 'cat-lovers');
                if (result) {
                    setWishData(result.data);
                } else {
                    // Fallback purely for demo if utility fails/doesn't exist in environment
                    const docRef = doc(db, 'wishes', wishId);
                    const docSnap = await getDoc(docRef);
                    if(docSnap.exists()) setWishData(docSnap.data());
                }
            } catch (error) {
                console.error("Error fetching wish:", error);
            } finally {
                setLoading(false);
            }
        };
        if(wishId) fetchWishData();
    }, [wishId]);

    const handleStart = () => {
        catAudio.init();
        catAudio.playMeow();
        setStarted(true);
        // Scroll to next section
        const container = document.querySelector('.scrolly-container');
        if(container) container.scrollBy({ top: window.innerHeight, behavior: 'smooth' });
    };

    return (
        <>
            <style>{styles}</style>
            
            {/* Enhanced Floating Spotify Player */}
            {wishData?.song && <EnhancedSongPlayer song={wishData.song} />}

            <div className="scrolly-container">
                <Cover onStart={handleStart} />
                
                {/* Interactive Toys */}
                <TheBox />
                <LaserPointer />
                <PurrGenerator />
                <KnockItOff />
                <Zoomies />
                
                {/* Narrative Sections */}
                <section>
                    <div style={{textAlign: 'center'}}>
                        <Moon size={80} color="var(--neon-blue)" style={{marginBottom: '20px'}} />
                        <h2>Slow Blink</h2>
                        <p style={{maxWidth: '300px'}}>In cat language, a slow blink means "I love you".</p>
                        <div className="cover-cat-eyes" style={{justifyContent: 'center', marginTop: '30px', transform: 'scale(0.6)'}}>
                            <div className="eye"><div className="pupil"></div></div>
                            <div className="eye"><div className="pupil"></div></div>
                        </div>
                    </div>
                </section>

                <section>
                    <Gift size={60} color="var(--yarn-pink)" />
                    <h2 style={{marginTop: '20px'}}>Biscuit Factory</h2>
                    <p>Kneading dough... making love.</p>
                    <div style={{display: 'flex', gap: '20px', marginTop: '30px'}}>
                        <div style={{width: 50, height: 50, background: '#fff', borderRadius: '50%', animation: 'float 1s ease-in-out infinite alternate'}}></div>
                        <div style={{width: 50, height: 50, background: '#fff', borderRadius: '50%', animation: 'float 1s ease-in-out infinite alternate-reverse'}}></div>
                    </div>
                </section>

                {/* Final Card Display */}
                <FinalCard wishData={wishData} loading={loading} />
            </div>
        </>
    );
};

export default CatLoversView;