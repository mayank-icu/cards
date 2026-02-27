import React, { useEffect, useRef, useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import CardViewHeader from '../../components/CardViewHeader';
import SongPlayer from '../../components/SongPlayer';
import { 
  Sparkles, 
  Clock, 
  Wine, 
  Trash2, 
  Sun, 
  Mic, 
  Music, 
  ArrowDown, 
  Send,
  PartyPopper
} from 'lucide-react';
import { normalizeCardData, resolveCardId } from '../../utils/slugs';

// --- AUDIO ENGINE ---
class AudioEngine {
  constructor() {
    this.ctx = null;
    this.analyser = null;
    this.dataArray = null;
  }

  init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
  }

  playTone(freq, type = 'sine', duration = 0.5) {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
    gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + duration);
  }

  async requestMic() {
    if (!this.ctx) this.init();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const source = this.ctx.createMediaStreamSource(stream);
      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 256;
      source.connect(this.analyser);
      this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
      return true;
    } catch (e) {
      console.warn("Mic denied", e);
      return false;
    }
  }

  getVolume() {
    if (!this.analyser) return 0;
    this.analyser.getByteFrequencyData(this.dataArray);
    let sum = 0;
    for (let i = 0; i < this.dataArray.length; i++) sum += this.dataArray[i];
    return sum / this.dataArray.length;
  }

  playHorn() {
    this.playTone(800, 'square', 0.1);
    setTimeout(() => this.playTone(600, 'square', 0.1), 100);
    setTimeout(() => this.playTone(400, 'square', 0.2), 200);
  }
}

const audioManager = new AudioEngine();

// --- CUSTOM CSS STYLES ---
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=Inter:wght@300;400;600&display=swap');

  :root {
    --gold: #D4AF37;
    --gold-dim: #8a7122;
    --silver: #E5E5E5;
    --black: #050505;
    --deep-bg: #0a0a0a;
    --glass: rgba(255, 255, 255, 0.05);
  }

  * { box-sizing: border-box; }

  body, html {
    margin: 0;
    padding: 0;
    background-color: var(--black);
    color: var(--silver);
    font-family: 'Inter', sans-serif;
    overflow: hidden;
  }

  h1, h2, h3, .serif {
    font-family: 'Playfair Display', serif;
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
    position: relative;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    overflow: hidden;
    padding: 2rem;
    text-align: center;
    background: radial-gradient(circle at center, #1a1a1a 0%, #000000 100%);
    transition: background 1s ease;
  }

  .gold-text {
    color: var(--gold);
    text-shadow: 0 0 20px rgba(212, 175, 55, 0.3);
  }

  .glow-btn {
    background: transparent;
    border: 1px solid var(--gold);
    color: var(--gold);
    padding: 1rem 2rem;
    font-family: 'Inter', sans-serif;
    text-transform: uppercase;
    letter-spacing: 2px;
    cursor: pointer;
    transition: all 0.3s ease;
    border-radius: 50px;
    margin-top: 2rem;
    backdrop-filter: blur(10px);
  }

  .glow-btn:hover, .glow-btn:active {
    background: var(--gold);
    color: var(--black);
    box-shadow: 0 0 30px var(--gold-dim);
  }

  .scroll-hint {
    position: absolute;
    bottom: 2rem;
    opacity: 0.5;
    animation: bounce 2s infinite;
  }

  .cover-title { font-size: 3rem; margin-bottom: 1rem; }
  .cover-sub { font-size: 1.2rem; opacity: 0.7; letter-spacing: 4px; }

  .clock-face {
    width: 300px;
    height: 300px;
    border: 2px solid var(--gold);
    border-radius: 50%;
    position: relative;
    display: flex;
    justify-content: center;
    align-items: center;
    box-shadow: 0 0 50px rgba(212, 175, 55, 0.1);
  }
  .time-display { font-size: 4rem; font-variant-numeric: tabular-nums; }

  .charge-btn {
    width: 150px;
    height: 150px;
    border-radius: 50%;
    background: radial-gradient(circle, var(--gold) 0%, transparent 70%);
    border: none;
    cursor: pointer;
    transition: transform 0.1s;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--black);
    font-weight: bold;
    font-size: 1.2rem;
  }
  .charge-btn:active { transform: scale(0.9); }
  .charge-bar {
    width: 80%;
    height: 4px;
    background: #333;
    margin-top: 2rem;
    border-radius: 2px;
    overflow: hidden;
  }
  .charge-fill {
    height: 100%;
    background: var(--gold);
    transition: width 0.3s ease-out;
    box-shadow: 0 0 20px var(--gold);
  }

  .mic-visualizer {
    display: flex;
    gap: 4px;
    height: 100px;
    align-items: center;
  }
  .mic-bar {
    width: 10px;
    background: var(--gold);
    border-radius: 10px;
    transition: height 0.1s ease;
  }

  .champagne-glass {
    width: 60px;
    height: 100px;
    border-left: 2px solid rgba(255,255,255,0.3);
    border-right: 2px solid rgba(255,255,255,0.3);
    border-bottom: 2px solid rgba(255,255,255,0.3);
    border-radius: 0 0 20px 20px;
    position: relative;
    overflow: hidden;
    margin-top: 20px;
  }
  .liquid {
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    background: var(--gold);
    transition: height 0.1s linear, transform 0.1s linear;
    transform-origin: bottom center;
  }

  canvas.sparkler-canvas {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    touch-action: none;
    cursor: crosshair;
  }

  .paper-input {
    background: transparent;
    border: none;
    border-bottom: 1px solid var(--silver);
    color: var(--gold);
    font-size: 1.5rem;
    text-align: center;
    width: 80%;
    font-family: 'Playfair Display', serif;
    outline: none;
    margin-bottom: 2rem;
  }
  .paper-bird {
    position: absolute;
    transition: all 2s ease-in;
  }
  .fly-away {
    transform: translate(100vw, -100vh) rotate(45deg) scale(0.5);
    opacity: 0;
  }

  .draggable-year {
    font-size: 4rem;
    cursor: grab;
    user-select: none;
    transition: transform 0.1s;
  }
  .draggable-year:active { cursor: grabbing; }
  .trash-zone {
    position: absolute;
    bottom: 10%;
    left: 50%;
    transform: translateX(-50%);
    width: 100px;
    height: 100px;
    border: 2px dashed #444;
    border-radius: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.3s;
  }
  .trash-zone.active {
    border-color: var(--gold);
    background: rgba(212, 175, 55, 0.1);
  }

  .cookie {
    font-size: 6rem;
    cursor: pointer;
    transition: transform 0.2s;
    user-select: none;
  }
  .cookie:active { transform: scale(0.9); }
  .fortune-text {
    margin-top: 2rem;
    font-size: 1.2rem;
    font-style: italic;
    opacity: 0;
    transition: opacity 1s;
    max-width: 400px;
  }
  .fortune-text.visible { opacity: 1; }

  .sunrise-section {
    background: linear-gradient(to bottom, #000, #1a1a1a, #2a2a1a);
  }

  .loading-screen {
    height: 100dvh;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--gold);
  }

  @keyframes bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
  @keyframes spin { 100% { transform: rotate(360deg); } }

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
  /* Enhanced Floating Spotify Player */
  .floating-spotify-player {
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 2000;
    background: rgba(212, 175, 55, 0.1);
    backdrop-filter: blur(15px);
    padding: 12px;
    border-radius: 50px;
    box-shadow: 0 8px 32px rgba(212, 175, 55, 0.15);
    display: flex;
    align-items: center;
    gap: 12px;
    border: 2px solid var(--gold);
    transition: all 0.3s ease;
    animation: slideInRight 0.6s ease-out;
  }

  .floating-spotify-player:hover {
    transform: scale(1.05);
    box-shadow: 0 12px 40px rgba(212, 175, 55, 0.25);
    background: rgba(212, 175, 55, 0.2);
  }

  .spotify-disc {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: linear-gradient(135deg, #1db954, #191414);
    overflow: hidden;
    animation: spin 4s linear infinite;
    border: 2px solid var(--gold);
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
    color: var(--gold);
    font-family: 'Inter', sans-serif;
    font-weight: 600;
  }

  .scrolling-text {
    display: inline-block;
    white-space: nowrap;
    animation: scrollText 12s linear infinite;
  }

  .mini-play-btn {
    background: var(--gold);
    border: none;
    color: var(--black);
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
    background: var(--gold-dim);
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
                {isPlaying ? <ArrowDown size={14} /> : <ArrowDown size={14} />}
            </button>
            <SongPlayer song={song} isPlaying={isPlaying} setIsPlaying={setIsPlaying} />
        </div>
    );
};

const NewYearView = () => {
  const { wishId } = useParams();
  const [wishData, setWishData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Interaction States
  const [started, setStarted] = useState(false);
  const [charge, setCharge] = useState(0);
  const [micVolume, setMicVolume] = useState(0);
  const [screamed, setScreamed] = useState(false);
  const [liquidLevel, setLiquidLevel] = useState(0);
  const [resolution, setResolution] = useState("");
  const [birdFlying, setBirdFlying] = useState(false);
  const [yearPos, setYearPos] = useState({ x: 0, y: 0 });
  const [yearTrashed, setYearTrashed] = useState(false);
  const [fortune, setFortune] = useState(null);
  const [deviceTilt, setDeviceTilt] = useState(0);
  const [countdown, setCountdown] = useState({ hours: 0, minutes: 0, seconds: 0 });
  const [countdownActive, setCountdownActive] = useState(false);

  // Refs
  const containerRef = useRef(null);
  const sparklerCanvasRef = useRef(null);
  const animationFrameRef = useRef(null);
  const dragRef = useRef({ isDragging: false, startX: 0, startY: 0, initialX: 0, initialY: 0 });

  // 1. Data Fetching
  useEffect(() => {
    const fetchWishData = async () => {
      try {
        const result = await resolveCardId(wishId, 'wishes', 'new-year');
        if (result) {
          setWishData(normalizeCardData(result.data));
        } else {
            setWishData({
                recipientName: "Friend",
                sender: "Secret Admirer",
                message: "May your year be filled with gold and glory."
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

  // Countdown Logic
  useEffect(() => {
    if (!countdownActive) return;
    
    const interval = setInterval(() => {
      const now = new Date();
      const currentYear = now.getFullYear();
      const nextYear = currentYear + 1;
      const newYear = new Date(nextYear, 0, 1, 0, 0, 0); // January 1st, midnight
      
      const diff = newYear - now;
      
      if (diff <= 0) {
        setCountdown({ hours: 0, minutes: 0, seconds: 0 });
        setCountdownActive(false);
        return;
      }
      
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      
      setCountdown({ hours, minutes, seconds });
    }, 1000);
    
    return () => clearInterval(interval);
  }, [countdownActive]);

  // Start countdown when section 2 is reached
  useEffect(() => {
    if (started) {
      setCountdownActive(true);
    }
  }, [started]);

  // 2. Global Loop for Continuous Checks (Mic, Sensors)
  useEffect(() => {
    const loop = () => {
      if (started && !screamed) {
        const vol = audioManager.getVolume();
        setMicVolume(vol);
        if (vol > 100) {
          setScreamed(true);
        }
      }
      animationFrameRef.current = requestAnimationFrame(loop);
    };
    loop();
    return () => cancelAnimationFrame(animationFrameRef.current);
  }, [started, screamed]);

  // 3. Device Orientation for Champagne
  useEffect(() => {
    const handleOrientation = (e) => {
      const tilt = e.gamma || 0; 
      setDeviceTilt(tilt);
      
      if (Math.abs(tilt) > 30 && liquidLevel < 100) {
        setLiquidLevel(prev => Math.min(prev + 1, 100));
      }
    };
    
    const handleMouseMove = (e) => {
       const width = window.innerWidth;
       const normalized = (e.clientX / width) * 180 - 90;
       setDeviceTilt(normalized);
       if (Math.abs(normalized) > 30 && liquidLevel < 100) {
        setLiquidLevel(prev => Math.min(prev + 0.5, 100));
       }
    };

    window.addEventListener('deviceorientation', handleOrientation);
    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('deviceorientation', handleOrientation);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [liquidLevel]);

  // 4. Sparkler Canvas Logic
  useEffect(() => {
      const canvas = sparklerCanvasRef.current;
      if (!canvas) return;
      
      const ctx = canvas.getContext('2d');
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      
      let particles = [];
      let isDrawing = false;
      let lastPos = { x: 0, y: 0 };

      const addParticle = (x, y) => {
        particles.push({
            x, y,
            vx: (Math.random() - 0.5) * 2,
            vy: (Math.random() - 0.5) * 2,
            life: 1.0,
            color: `hsl(${40 + Math.random() * 20}, 100%, 70%)`
        });
      };

      const handleStart = (e) => {
          isDrawing = true;
          const { clientX, clientY } = e.touches ? e.touches[0] : e;
          lastPos = { x: clientX, y: clientY };
      };

      const handleMove = (e) => {
          if (!isDrawing) return;
          const { clientX, clientY } = e.touches ? e.touches[0] : e;
          
          for(let i=0; i<5; i++) addParticle(clientX, clientY);
          lastPos = { x: clientX, y: clientY };
      };

      const handleEnd = () => isDrawing = false;

      canvas.addEventListener('mousedown', handleStart);
      canvas.addEventListener('mousemove', handleMove);
      canvas.addEventListener('mouseup', handleEnd);
      canvas.addEventListener('touchstart', handleStart);
      canvas.addEventListener('touchmove', handleMove);
      canvas.addEventListener('touchend', handleEnd);

      const render = () => {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          
          particles.forEach((p, i) => {
              p.x += p.vx;
              p.y += p.vy + 0.5;
              p.life -= 0.02;
              
              ctx.globalAlpha = p.life;
              ctx.fillStyle = p.color;
              ctx.beginPath();
              ctx.arc(p.x, p.y, Math.random() * 3, 0, Math.PI * 2);
              ctx.fill();
              
              if(p.life <= 0) particles.splice(i, 1);
          });
          
          requestAnimationFrame(render);
      };
      render();

  }, [started]);

  // --- INTERACTION HANDLERS ---

  const handleStart = () => {
    audioManager.init();
    setStarted(true);
    document.getElementById('section-2').scrollIntoView({ behavior: 'smooth' });
  };

  const handleDragStart = (e) => {
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    dragRef.current = { 
        isDragging: true, 
        startX: clientX, 
        startY: clientY,
        initialX: yearPos.x,
        initialY: yearPos.y
    };
  };

  const handleDragMove = (e) => {
    if (!dragRef.current.isDragging) return;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    
    const dx = clientX - dragRef.current.startX;
    const dy = clientY - dragRef.current.startY;
    
    setYearPos({ x: dragRef.current.initialX + dx, y: dragRef.current.initialY + dy });
  };

  const handleDragEnd = (e) => {
      dragRef.current.isDragging = false;
      if (yearPos.y > 100) {
          setYearTrashed(true);
      } else {
          setYearPos({ x: 0, y: 0 });
      }
  };

  const openFortune = () => {
    const fortunes = [
        "A golden opportunity awaits you in March.",
        "Your kindness will return tenfold.",
        "Boldness begets fortune this year.",
        "An old friend brings new news.",
        "Focus on the light, and the shadows will fall behind."
    ];
    setFortune(fortunes[Math.floor(Math.random() * fortunes.length)]);
  };

  if (loading) return <div className="loading-screen"><Sparkles className="spin" /></div>;

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
         <CardViewHeader cardType="new-year" cardId={wishId} title="" />
      </div>

      {/* Enhanced Floating Spotify Player */}
      {wishData?.song && <EnhancedSongPlayer song={wishData.song} />}

      <div className="scrolly-container" ref={containerRef}>
        
        {/* SECTION 1: COVER */}
        <section id="section-1">
            <h1 className="cover-title gold-text">Midnight Gold</h1>
            <p className="cover-sub serif">A New Year Experience for</p>
            <h2 className="serif" style={{fontSize: '2rem'}}>{wishData?.recipientName || "You"}</h2>
            
            <button className="glow-btn" onClick={handleStart}>
                Begin The Night <Sparkles size={16} style={{marginLeft: 8}}/>
            </button>
            <div className="scroll-hint"><ArrowDown color="white" /></div>
        </section>

        {/* SECTION 2: THE CLOCK */}
        <section id="section-2">
            <h2 className="serif gold-text">The Final Countdown</h2>
            <div className="clock-face">
                <Clock size={40} className="gold-text" style={{position: 'absolute', top: 20}} />
                <div className="time-display gold-text">
                    {countdownActive ? (
                        `${String(countdown.hours).padStart(2, '0')}:${String(countdown.minutes).padStart(2, '0')}:${String(countdown.seconds).padStart(2, '0')}`
                    ) : (
                        "00:00:00"
                    )}
                </div>
            </div>
            <p className="serif" style={{marginTop: '2rem', opacity: 0.7}}>
                {countdownActive ? "Time is ticking away..." : "Ready for the new year!"}
            </p>
        </section>

        {/* SECTION 3: CHARGE THE NIGHT */}
        <section id="section-3">
            <h2 className="serif">Power the Fireworks</h2>
            <p style={{marginBottom: '2rem'}}>{charge < 100 ? "Tap rapidly to charge energy!" : "FULL BLAST! 🎆"}</p>
            
            <button 
                className="charge-btn" 
                onClick={() => {
                    setCharge(c => Math.min(c + 5, 100));
                    audioManager.playTone(200 + charge * 5, 'sine', 0.1);
                }}
                style={{ 
                    transform: `scale(${1 + charge/200})`,
                    boxShadow: charge >= 100 ? '0 0 50px var(--gold)' : 'none'
                }}
            >
                {charge < 100 ? 'TAP!' : '🎆'}
            </button>

            <div className="charge-bar">
                <div className="charge-fill" style={{width: `${charge}%`}}></div>
            </div>
            
            {charge >= 100 && (
                <div style={{marginTop: '2rem'}}>
                    <button 
                        className="glow-btn" 
                        onClick={() => {
                            setCharge(0);
                            audioManager.playHorn();
                            // Trigger fireworks animation
                            const canvas = sparklerCanvasRef.current;
                            if (canvas) {
                                for(let i = 0; i < 50; i++) {
                                    setTimeout(() => {
                                        const x = Math.random() * canvas.width;
                                        const y = Math.random() * canvas.height;
                                        const event = new MouseEvent('mousemove', {
                                            clientX: x,
                                            clientY: y
                                        });
                                        canvas.dispatchEvent(event);
                                    }, i * 50);
                                }
                            }
                        }}
                    >
                        <PartyPopper size={20} style={{marginRight: 8}}/> Launch Fireworks!
                    </button>
                </div>
            )}
        </section>

        {/* SECTION 4: MIDNIGHT SCREAM */}
        <section id="section-4">
            <h2 className="serif gold-text">{screamed ? "HAPPY NEW YEAR!" : "Scream for Midnight!"}</h2>
            
            {!screamed ? (
                <>
                    <button className="glow-btn" onClick={() => {
                        audioManager.requestMic().then(success => {
                            if (success) {
                                audioManager.playTone(440, 'sine', 0.2);
                            }
                        });
                    }}>
                        <Mic size={20} style={{marginRight: 8}}/> Enable Mic
                    </button>
                    <div className="mic-visualizer" style={{marginTop: '2rem'}}>
                        {Array.from({length: 10}).map((_, i) => (
                            <div 
                                key={i} 
                                className="mic-bar" 
                                style={{
                                    height: `${Math.min(micVolume * (Math.random() + 0.5), 100)}px`,
                                    opacity: micVolume > 10 ? 1 : 0.3,
                                    background: micVolume > 50 ? 'linear-gradient(to top, var(--gold), var(--gold-dim))' : 'var(--gold)',
                                    transform: micVolume > 10 ? `scale(${1 + micVolume/100})` : 'scale(1)'
                                }}
                            ></div>
                        ))}
                    </div>
                    <p style={{marginTop: '1rem', opacity: 0.7, fontSize: '0.9rem'}}>
                        {micVolume < 10 ? "Make some noise!" : micVolume < 50 ? "Louder!" : "Almost there!"}
                    </p>
                </>
            ) : (
                <div style={{animation: 'bounce 1s infinite'}}>
                    <PartyPopper size={100} color="var(--gold)" />
                    <p>The sky is on fire! 🎆</p>
                    <div style={{marginTop: '1rem'}}>
                        {Array.from({length: 5}).map((_, i) => (
                            <span key={i} style={{margin: '0 5px', animation: `spin ${1 + i * 0.2}s linear infinite`}}>
                                ✨
                            </span>
                        ))}
                    </div>
                </div>
            )}
        </section>

        {/* SECTION 5: CHAMPAGNE */}
        <section id="section-5">
            <h2 className="serif">Pour the Bubbly</h2>
            <p>{liquidLevel < 100 ? "Tilt your device (or mouse) to fill the glass." : "Perfect pour! 🥂"}</p>
            
            <div style={{position: 'relative', display: 'inline-block'}}>
                <div className="champagne-glass" style={{transform: `rotate(${-deviceTilt}deg)`}}>
                    <div className="liquid" style={{
                        height: `${liquidLevel}%`, 
                        transform: `rotate(${deviceTilt}deg)`,
                        background: liquidLevel > 80 ? 'linear-gradient(to top, #FFD700, #FFA500)' : 'var(--gold)',
                        boxShadow: liquidLevel > 80 ? '0 0 20px rgba(255, 215, 0, 0.5)' : 'none'
                    }}></div>
                    {/* Bubbles */}
                    {liquidLevel > 20 && Array.from({length: Math.floor(liquidLevel / 10)}).map((_, i) => (
                        <div
                            key={i}
                            style={{
                                position: 'absolute',
                                bottom: `${liquidLevel - 10}%`,
                                left: `${20 + Math.random() * 60}%`,
                                width: '4px',
                                height: '4px',
                                background: 'rgba(255, 255, 255, 0.7)',
                                borderRadius: '50%',
                                animation: `bubble ${1 + Math.random()}s infinite`,
                                animationDelay: `${Math.random()}s`
                            }}
                        />
                    ))}
                </div>
                
                {/* Glass rim highlight when full */}
                {liquidLevel >= 100 && (
                    <div style={{
                        position: 'absolute',
                        top: '0',
                        left: '0',
                        right: '0',
                        height: '2px',
                        background: 'var(--gold)',
                        borderRadius: '20px 20px 0 0',
                        boxShadow: '0 0 10px var(--gold)'
                    }}/>
                )}
            </div>
            
            {liquidLevel >= 100 && (
                <p className="gold-text" style={{marginTop: 20, fontSize: '1.2rem'}}>
                    Cheers! 🥂 
                    <span style={{marginLeft: '10px', animation: 'bounce 1s infinite'}}>
                        🍾
                    </span>
                </p>
            )}
            
            <style>{`
                @keyframes bubble {
                    0% { transform: translateY(0) scale(1); opacity: 0.7; }
                    50% { transform: translateY(-20px) scale(1.2); opacity: 0.5; }
                    100% { transform: translateY(-40px) scale(0.8); opacity: 0; }
                }
            `}</style>
        </section>

        {/* SECTION 6: SPARKLER */}
        <section id="section-6">
            <div style={{position: 'absolute', top: 20, zIndex: 10, pointerEvents: 'none'}}>
                <h2 className="serif">Light the Dark</h2>
                <p>Drag your finger to write with light.</p>
                <p style={{fontSize: '0.9rem', opacity: 0.7, marginTop: '0.5rem'}}>
                    {started ? "Draw something beautiful!" : "Start the experience first"}
                </p>
            </div>
            <canvas ref={sparklerCanvasRef} className="sparkler-canvas"></canvas>
            
            {started && (
                <div style={{position: 'absolute', bottom: 20, zIndex: 10}}>
                    <button 
                        className="glow-btn" 
                        onClick={() => {
                            const canvas = sparklerCanvasRef.current;
                            if (canvas) {
                                const ctx = canvas.getContext('2d');
                                ctx.clearRect(0, 0, canvas.width, canvas.height);
                                audioManager.playTone(600, 'sine', 0.2);
                            }
                        }}
                        style={{fontSize: '0.9rem', padding: '0.8rem 1.5rem'}}
                    >
                        Clear Canvas
                    </button>
                </div>
            )}
        </section>

        {/* SECTION 7: RESOLUTION */}
        <section id="section-7">
            <h2 className="serif">Make a Wish</h2>
            {!birdFlying ? (
                <>
                    <p style={{opacity: 0.8, marginBottom: '1rem'}}>Write your wish and release it to the universe</p>
                    <input 
                        type="text" 
                        className="paper-input" 
                        placeholder="My wish for the new year is..." 
                        value={resolution}
                        onChange={(e) => setResolution(e.target.value)}
                        maxLength={100}
                    />
                    <p style={{fontSize: '0.8rem', opacity: 0.6, marginTop: '0.5rem'}}>
                        {resolution.length}/100 characters
                    </p>
                    <button 
                        className="glow-btn" 
                        onClick={() => {
                            if (resolution.trim()) {
                                setBirdFlying(true);
                                audioManager.playTone(800, 'sine', 0.3);
                                setTimeout(() => audioManager.playTone(1000, 'sine', 0.5), 200);
                            }
                        }}
                        disabled={!resolution.trim()}
                        style={{opacity: resolution.trim() ? 1 : 0.5, cursor: resolution.trim() ? 'pointer' : 'not-allowed'}}
                    >
                        <Send size={18} style={{marginRight: 8}}/> Release to the Universe
                    </button>
                </>
            ) : (
                <div className="paper-bird fly-away">
                    <Send size={64} color="var(--gold)" />
                    <p style={{color: 'var(--gold)', fontSize: '1.2rem', marginTop: '1rem'}}>
                        "{resolution}"
                    </p>
                    <p style={{opacity: 0.8, fontSize: '0.9rem', marginTop: '1rem'}}>
                        Your wish has been sent to the stars ✨
                    </p>
                    <div style={{marginTop: '2rem'}}>
                        {Array.from({length: 8}).map((_, i) => (
                            <span key={i} style={{margin: '0 5px', animation: `spin ${2 + i * 0.3}s linear infinite`}}>
                                ⭐
                            </span>
                        ))}
                    </div>
                </div>
            )}
        </section>

        {/* SECTION 8: GOODBYE OLD YEAR */}
        <section id="section-8" 
            onMouseMove={handleDragMove}
            onTouchMove={handleDragMove}
            onMouseUp={handleDragEnd}
            onTouchEnd={handleDragEnd}
        >
            <h2 className="serif">Leave the Past Behind</h2>
            <p>Drag the old year into the void.</p>
            
            {!yearTrashed ? (
                <div 
                    className="draggable-year gold-text"
                    style={{transform: `translate(${yearPos.x}px, ${yearPos.y}px)`}}
                    onMouseDown={handleDragStart}
                    onTouchStart={handleDragStart}
                >
                    {new Date().getFullYear() - 1}
                </div>
            ) : (
                 <div className="gold-text">Gone forever.</div>
            )}

            <div className={`trash-zone ${yearTrashed ? 'active' : ''}`}>
                <Trash2 size={40} color={yearTrashed ? 'var(--gold)' : '#444'} />
            </div>
        </section>

        {/* SECTION 9: FORTUNE COOKIE */}
        <section id="section-9">
            <h2 className="serif">Your 2026 Fortune</h2>
            
            <div className="cookie" onClick={openFortune}>
                🥠
            </div>
            
            <div className={`fortune-text gold-text ${fortune ? 'visible' : ''}`}>
                "{fortune}"
            </div>
        </section>

        {/* SECTION 10: SUNRISE & CLOSING */}
        <section id="section-10" className="sunrise-section">
            <Sun size={80} className="gold-text" style={{marginBottom: '2rem'}} />
            <h1 className="serif">Let's Make It Count.</h1>
            <p style={{maxWidth: '600px', lineHeight: 1.6, margin: '2rem 0'}}>
                "{wishData?.message}"
            </p>
            
            <button 
                className="glow-btn" 
                onMouseDown={() => audioManager.playHorn()}
                onMouseUp={() => {}}
                onTouchStart={() => audioManager.playHorn()}
            >
                <PartyPopper size={20} style={{marginRight: 8}}/> Blow Party Horn
            </button>

            <div style={{marginTop: '3rem', fontSize: '0.9rem', opacity: 0.6}}>
                From {wishData?.sender || "Someone Special"}
            </div>
        </section>

      </div>
    </>
  );
};

export default NewYearView;
