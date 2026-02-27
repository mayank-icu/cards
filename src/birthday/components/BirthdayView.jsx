import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { arrayUnion, doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { resolveCardId, normalizeCardData } from '../../utils/slugs';
import { Music2, Volume2, VolumeX, Camera, Mic, MicOff, Wind, Utensils, Sparkles, Star, Gift, ChevronDown, Play, Pause } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

// --- MINIMAL LIGHT THEME CSS ---
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;500;700&family=Playfair+Display:ital,wght@0,600;1,600&display=swap');

  :root {
    --bg-main: #fafafa;
    --text-main: #333333;
    --accent-pink: #ec4899;
    --accent-blue: #06b6d4;
    --accent-yellow: #eab308;
    --accent-purple: #8b5cf6;
    --glass-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.07);
  }

  * { box-sizing: border-box; user-select: none; -webkit-user-select: none; }

  body, html {
    margin: 0; padding: 0;
    background-color: var(--bg-main);
    color: var(--text-main);
    font-family: 'Outfit', sans-serif;
    overflow: hidden;
  }

  h1, h2, h3 {
    font-family: 'Playfair Display', serif;
    font-weight: 600;
    letter-spacing: -0.5px;
  }

  /* --- SCROLL CONTAINER --- */
  .birthday-scroll-container {
    height: 100dvh;
    width: 100%;
    overflow-y: scroll;
    scroll-snap-type: y mandatory;
    scroll-behavior: smooth;
    position: relative;
    background: var(--bg-main);
  }
  .birthday-scroll-container::-webkit-scrollbar { display: none; }

  /* --- SECTIONS --- */
  .b-section {
    height: 100dvh;
    width: 100%;
    scroll-snap-align: start;
    position: relative;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    background: white;
  }
  
  .b-section:nth-child(even) {
    background: #f4f4f5;
  }

  /* --- UTILS --- */
  .minimal-btn {
    padding: 12px 28px;
    border-radius: 50px;
    border: 1px solid #ddd;
    background: white;
    color: #333;
    font-family: 'Outfit', sans-serif;
    font-weight: 500;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 8px;
    transition: all 0.2s ease;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
  }
  .minimal-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05);
    border-color: var(--accent-pink);
    color: var(--accent-pink);
  }
  .minimal-btn:disabled { opacity: 0.5; cursor: not-allowed; }

  .absolute-center {
    position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
  }
  .full-canvas {
    position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: auto; touch-action: pan-y;
  }
  
  .instruction-text {
    position: absolute;
    bottom: 40px;
    font-size: 0.9rem;
    color: #888;
    animation: bounce 2s infinite;
  }

  .top-right-ui {
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 90;
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .top-right-icon-btn {
    width: 42px;
    height: 42px;
    border-radius: 999px;
    border: 1px solid #e5e7eb;
    background: #fff;
    color: #4b5563;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
    cursor: pointer;
    transition: transform 0.2s ease, color 0.2s ease;
  }
  .top-right-icon-btn:hover { transform: translateY(-1px); color: #ec4899; }

  .birthday-music-badge {
    min-width: 220px;
    max-width: 320px;
    display: flex;
    align-items: center;
    gap: 10px;
    border-radius: 999px;
    border: 1px solid #e5e7eb;
    background: rgba(255, 255, 255, 0.95);
    box-shadow: 0 10px 28px rgba(0, 0, 0, 0.14);
    padding: 6px 10px 6px 6px;
  }
  .birthday-music-badge.playing {
    border-color: #f9a8d4;
    box-shadow: 0 10px 28px rgba(236, 72, 153, 0.2);
  }

  .birthday-music-album {
    width: 34px;
    height: 34px;
    border-radius: 50%;
    object-fit: cover;
    flex-shrink: 0;
    background: #e5e7eb;
  }

  .birthday-music-info {
    min-width: 0;
    display: flex;
    flex-direction: column;
    line-height: 1.1;
  }
  .birthday-music-title {
    font-size: 0.78rem;
    color: #1f2937;
    font-weight: 700;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .birthday-music-artist {
    font-size: 0.7rem;
    color: #6b7280;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .birthday-music-controls {
    margin-left: auto;
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .birthday-now-playing {
    font-size: 0.62rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: #ec4899;
    font-weight: 700;
    display: flex;
    align-items: center;
    gap: 5px;
    margin-bottom: 2px;
  }
  .birthday-now-playing .dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #ec4899;
    animation: pulse 1s ease-in-out infinite;
  }

  .birthday-music-btn {
    width: 28px;
    height: 28px;
    border-radius: 999px;
    border: 1px solid #e5e7eb;
    background: #fff;
    color: #374151;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
  }

  .birthday-loader-dot {
    width: 16px;
    height: 16px;
    border: 2px solid #f9a8d4;
    border-top-color: #ec4899;
    border-radius: 999px;
    animation: spin 0.8s linear infinite;
  }
  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  @media (max-width: 640px) {
    .top-right-ui { top: 12px; right: 12px; }
    .birthday-music-badge {
      min-width: 170px;
      max-width: min(68vw, 260px);
    }
    .birthday-music-title { font-size: 0.72rem; }
    .birthday-music-artist { font-size: 0.64rem; }
  }

  /* --- CAKE STYLES --- */
  .cake-container { position: relative; width: 280px; height: 280px; display: flex; justify-content: center; align-items: flex-end; margin-bottom: 2rem; }
  .plate { width: 300px; height: 12px; background: #e5e7eb; border-radius: 10px; position: absolute; bottom: 0; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); }
  
  .layer { position: absolute; width: 100%; border-radius: 8px; transition: all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275); cursor: pointer; }
  .layer:hover { filter: brightness(0.95); }
  
  .layer-bottom { height: 80px; bottom: 12px; width: 260px; left: 10px; background: #fce7f3; border: 2px solid white; }
  .layer-middle { height: 70px; bottom: 92px; width: 220px; left: 30px; background: #fbcfe8; border: 2px solid white; }
  .layer-top { height: 60px; bottom: 162px; width: 180px; left: 50px; background: #f9a8d4; border: 2px solid white; }
  
  /* Missing Slices State */
  .layer.eaten { transform: scale(0); opacity: 0; }

  .candle { 
    width: 12px; height: 40px; background: linear-gradient(to bottom, #fff, #f0f0f0); 
    position: absolute; bottom: 222px; border-radius: 4px; z-index: 10;
  }
  .flame {
    width: 14px; height: 20px; background: #fbbf24; border-radius: 50% 50% 20% 20%;
    position: absolute; top: -20px; left: -1px;
    animation: flicker 0.5s infinite alternate;
    box-shadow: 0 0 10px rgba(251, 191, 36, 0.5);
  }
  .flame.out { opacity: 0; transform: scale(0.5); transition: all 0.5s; }

  /* --- SCRATCH CARD --- */
  .ticket-container {
    width: 300px; height: 180px; position: relative; 
    border-radius: 12px; overflow: hidden;
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  }
  .ticket-content { 
    background: white; color: #333; 
    width: 100%; height: 100%;
    display: flex; flex-direction: column; justify-content: center; align-items: center;
    border: 1px solid #eee;
  }

  /* --- POLAROID --- */
  .polaroid-frame {
    background: #fff; padding: 16px 16px 60px 16px;
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
    transform: rotate(-3deg); transition: transform 0.3s;
  }
  .polaroid-frame:hover { transform: rotate(0deg) scale(1.02); }
  .polaroid-img { width: 260px; height: 260px; background: #f3f4f6; overflow: hidden; position: relative; }
  .polaroid-img img { width: 100%; height: 100%; object-fit: cover; opacity: 0; transition: opacity 2s ease; }
  .polaroid-img.developed img { opacity: 1; }

  /* --- BALLOONS --- */
  .balloon-text { font-family: 'Playfair Display', serif; color: white; font-size: 0.8rem; }

  /* --- MAKE SOME NOISE --- */
  .noise-keys {
    display: flex;
    gap: 14px;
    justify-content: center;
    align-items: flex-end;
    margin-top: 8px;
  }
  .noise-key {
    width: 96px;
    height: 170px;
    border: 1px solid #e5e7eb;
    border-radius: 0 0 22px 22px;
    box-shadow: 0 14px 25px -18px rgba(17, 24, 39, 0.55);
    color: #111827;
    font-size: 1.8rem;
    font-weight: 700;
    font-family: 'Outfit', sans-serif;
    cursor: pointer;
    transition: transform 0.14s ease, box-shadow 0.14s ease, filter 0.14s ease;
  }
  .noise-key:active {
    transform: translateY(6px);
    box-shadow: 0 6px 12px -10px rgba(17, 24, 39, 0.5);
    filter: brightness(0.96);
  }

  /* --- LEVEL UP --- */
  .level-machine {
    display: flex;
    gap: 12px;
    background: #f5f5f5;
    padding: 18px;
    border-radius: 18px;
    border: 1px solid #e5e7eb;
    box-shadow: 0 16px 30px -20px rgba(0, 0, 0, 0.35);
  }
  .level-reel {
    width: 86px;
    height: 122px;
    border-radius: 14px;
    border: 2px solid #d1d5db;
    background: #ffffff;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: inset 0 -6px 12px rgba(0, 0, 0, 0.06);
  }
  .level-symbol {
    font-size: 3rem;
    line-height: 1;
    color: #f59e0b;
  }
  .level-symbol.spinning {
    animation: reelBounce 0.18s ease-in-out infinite alternate;
    color: #9ca3af;
  }

  /* --- TOAST --- */
  .toast-stage {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 24px;
    padding: 20px 24px;
    border-radius: 20px;
    background: linear-gradient(180deg, #ffffff, #f8fafc);
    box-shadow: 0 14px 30px -24px rgba(15, 23, 42, 0.6);
  }
  .toast-glass {
    width: 84px;
    height: 120px;
    position: relative;
    transition: transform 0.25s ease;
    filter: drop-shadow(0 8px 12px rgba(0, 0, 0, 0.12));
  }
  .toast-cup {
    width: 70px;
    height: 64px;
    border: 3px solid #93c5fd;
    border-bottom-left-radius: 26px;
    border-bottom-right-radius: 26px;
    border-top-left-radius: 8px;
    border-top-right-radius: 8px;
    background: linear-gradient(to top, rgba(236, 72, 153, 0.35) 0%, rgba(236, 72, 153, 0.15) 46%, rgba(255, 255, 255, 0.4) 47%, rgba(255, 255, 255, 0.25) 100%);
    margin: 0 auto;
    overflow: hidden;
    position: relative;
  }
  .toast-cup::after {
    content: '';
    position: absolute;
    width: 100%;
    height: 4px;
    left: 0;
    top: 22px;
    background: rgba(236, 72, 153, 0.45);
  }
  .toast-stem {
    width: 6px;
    height: 36px;
    background: #93c5fd;
    margin: 0 auto;
    border-radius: 3px;
  }
  .toast-base {
    width: 40px;
    height: 8px;
    border-radius: 999px;
    background: #93c5fd;
    margin: 0 auto;
  }
  .toast-glass.left.clinked { transform: rotate(-14deg) translateX(8px); }
  .toast-glass.right.clinked { transform: rotate(14deg) translateX(-8px); }
  .toast-ring {
    position: absolute;
    top: 38px;
    left: 50%;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    border: 2px solid #f472b6;
    transform: translateX(-50%);
    opacity: 0;
  }
  .toast-ring.active {
    animation: toastRing 0.55s ease-out;
  }
  .toast-spark {
    position: absolute;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #f59e0b;
    opacity: 0;
    top: 42px;
    left: 50%;
  }
  .toast-spark.active.s1 { animation: spark1 0.6s ease-out; }
  .toast-spark.active.s2 { animation: spark2 0.6s ease-out; }
  .toast-spark.active.s3 { animation: spark3 0.6s ease-out; }
  .toast-spark.active.s4 { animation: spark4 0.6s ease-out; }

  /* --- SEND NOTE --- */
  .note-panel {
    background: white;
    padding: 24px;
    border-radius: 18px;
    box-shadow: 0 16px 30px -24px rgba(17, 24, 39, 0.45);
    border: 1px solid #f1f5f9;
    width: 100%;
    max-width: 540px;
  }
  .note-input {
    width: 100%;
    min-height: 120px;
    resize: vertical;
    padding: 14px;
    border: 1px solid #d1d5db;
    border-radius: 12px;
    margin-bottom: 12px;
    font-family: 'Outfit', sans-serif;
    font-size: 1rem;
    color: #111827;
    background: #f8fafc;
  }
  .note-input:focus {
    outline: none;
    border-color: #f472b6;
    box-shadow: 0 0 0 3px rgba(244, 114, 182, 0.2);
  }
  .saved-note {
    margin-top: 14px;
    border-radius: 12px;
    padding: 12px;
    background: #fdf2f8;
    border: 1px solid #fbcfe8;
    color: #9d174d;
    text-align: left;
    font-size: 0.95rem;
  }

  @media (max-width: 768px) {
    .noise-key {
      width: 82px;
      height: 148px;
      font-size: 1.5rem;
    }
    .level-reel {
      width: 72px;
      height: 110px;
    }
    .level-symbol {
      font-size: 2.5rem;
    }
    .toast-glass {
      width: 70px;
      height: 104px;
    }
    .toast-cup {
      width: 58px;
      height: 54px;
    }
    .note-panel {
      padding: 18px;
      max-width: 94%;
    }
  }

  /* --- ANIMATIONS --- */
  @keyframes flicker { 0% { opacity: 1; transform: scale(1); } 100% { opacity: 0.8; transform: scale(0.9); } }
  @keyframes bounce { 0%, 20%, 50%, 80%, 100% { transform: translateY(0); } 40% { transform: translateY(-10px); } 60% { transform: translateY(-5px); } }
  @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
  @keyframes reelBounce { from { transform: translateY(-6px); } to { transform: translateY(6px); } }
  @keyframes toastRing {
    0% { transform: translateX(-50%) scale(0.4); opacity: 0.95; }
    100% { transform: translateX(-50%) scale(3.4); opacity: 0; }
  }
  @keyframes spark1 {
    0% { transform: translate(0, 0); opacity: 1; }
    100% { transform: translate(-26px, -22px); opacity: 0; }
  }
  @keyframes spark2 {
    0% { transform: translate(0, 0); opacity: 1; }
    100% { transform: translate(24px, -24px); opacity: 0; }
  }
  @keyframes spark3 {
    0% { transform: translate(0, 0); opacity: 1; }
    100% { transform: translate(-22px, 10px); opacity: 0; }
  }
  @keyframes spark4 {
    0% { transform: translate(0, 0); opacity: 1; }
    100% { transform: translate(20px, 12px); opacity: 0; }
  }
  .animate-float { animation: float 4s ease-in-out infinite; }
`;

// --- HELPER COMPONENT: LOADER ---
const Loader = () => (
  <div style={{height: '100vh', width: '100%', background: '#fff', display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column'}}>
    <div style={{color: '#ec4899'}} className="animate-spin"><Sparkles size={48} /></div>
    <p style={{marginTop: 20, color: '#666', fontFamily: 'Outfit'}}>Loading Celebration...</p>
  </div>
);

// --- SECTIONS ---

// 1. CAKE SECTION (Restored & Improved)
const CakeSection = () => {
  const [candlesBlown, setCandlesBlown] = useState(false);
  const [slicesEaten, setSlicesEaten] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const streamRef = useRef(null);

  const startListening = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      audioContextRef.current = audioCtx;
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);
      analyserRef.current = analyser;
      setIsListening(true);
      toast.success("Blow into the mic!", { icon: '🌬️' });
      detectBlow();
    } catch (err) {
      console.error(err);
      toast.error("Mic denied. Tap candles instead!");
    }
  };

  const detectBlow = () => {
    if (!analyserRef.current) return;
    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    const check = () => {
      if (!analyserRef.current) return;
      analyserRef.current.getByteFrequencyData(dataArray);
      // Wind noise is typically low frequency high energy
      const avg = dataArray.slice(0, 20).reduce((a, b) => a + b, 0) / 20;
      if (avg > 90) { // Threshold
        setCandlesBlown(true);
        stopListening();
        toast.success("Make a wish!", { icon: '✨' });
      } else {
        requestAnimationFrame(check);
      }
    };
    check();
  };

  const stopListening = () => {
    if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') audioContextRef.current.close();
    setIsListening(false);
  };

  const eatSlice = (layerIndex) => {
    if (!candlesBlown) {
        toast("Blow out the candles first!", { icon: '🕯️' });
        return;
    }
    if (slicesEaten === layerIndex) { // Eat in order top down
        setSlicesEaten(prev => prev + 1);
        if(navigator.vibrate) navigator.vibrate(50);
    }
  };

  // Cleanup
  useEffect(() => () => stopListening(), []);

  return (
    <div className="b-section">
      <h2 className="text-3xl mb-2" style={{color: '#333'}}>
        {candlesBlown ? (slicesEaten >= 3 ? "Delicious!" : "Cut the Cake") : "Happy Birthday"}
      </h2>
      <p style={{color: '#888', marginBottom: 40}}>
        {candlesBlown ? (slicesEaten >= 3 ? "Scroll down for more" : "Tap the cake layers to eat them") : "Blow out the candles to start"}
      </p>

      <div className="cake-container">
        <div className="plate" />
        
        {/* Cake Layers (Clickable) */}
        <div 
            className={`layer layer-bottom ${slicesEaten > 2 ? 'eaten' : ''}`} 
            onClick={() => eatSlice(2)}
        />
        <div 
            className={`layer layer-middle ${slicesEaten > 1 ? 'eaten' : ''}`} 
            onClick={() => eatSlice(1)}
        />
        <div 
            className={`layer layer-top ${slicesEaten > 0 ? 'eaten' : ''}`} 
            onClick={() => eatSlice(0)}
        />

        {/* Candles - Only visible if top layer exists */}
        {slicesEaten < 1 && (
            <div className="candles-container">
                {[-20, 0, 20].map((offset, i) => (
                    <div key={i} className="candle" style={{ left: `calc(50% + ${offset}px)` }} onClick={() => !candlesBlown && setCandlesBlown(true)}>
                        <div className={`flame ${candlesBlown ? 'out' : ''}`} />
                    </div>
                ))}
            </div>
        )}
      </div>

      <div style={{minHeight: 60}}>
        {!candlesBlown && (
            <button className="minimal-btn" onClick={startListening}>
                {isListening ? <Wind className="animate-pulse" size={18}/> : <Mic size={18}/>}
                {isListening ? "Blowing..." : "Use Mic"}
            </button>
        )}
        {slicesEaten >= 3 && (
            <div className="animate-bounce" style={{color: '#ec4899'}}>
                <ChevronDown size={32} />
            </div>
        )}
      </div>
    </div>
  );
};

// 2. SUGAR RUSH (Transition)
const SugarRushSection = () => {
    const canvasRef = useRef(null);
    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        let particles = [];
        const colors = ['#fce7f3', '#dbeafe', '#fef3c7']; // Pastel confetti
        
        const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
        window.addEventListener('resize', resize);
        resize();

        for(let i=0; i<60; i++) {
            particles.push({
                x: Math.random() * canvas.width,
                y: -Math.random() * canvas.height,
                vy: Math.random() * 2 + 1,
                size: Math.random() * 6 + 2,
                color: colors[Math.floor(Math.random()*3)],
                rotation: Math.random() * 360,
                rs: (Math.random()-0.5) * 2
            });
        }

        const animate = () => {
            ctx.clearRect(0,0,canvas.width,canvas.height);
            particles.forEach(p => {
                p.y += p.vy;
                p.rotation += p.rs;
                if(p.y > canvas.height) p.y = -10;
                
                ctx.save();
                ctx.translate(p.x, p.y);
                ctx.rotate(p.rotation * Math.PI / 180);
                ctx.fillStyle = p.color;
                ctx.fillRect(-p.size/2, -p.size/2, p.size, p.size);
                ctx.restore();
            });
            requestAnimationFrame(animate);
        };
        animate();
    }, []);

    return (
        <div className="b-section">
            <canvas ref={canvasRef} className="full-canvas" style={{pointerEvents:'none'}} />
            <div className="text-center z-10 p-8">
                <h2 style={{fontSize: '2.5rem', color: '#ec4899', marginBottom: 10}}>Sweet!</h2>
                <p style={{fontSize: '1.2rem', color: '#666'}}>The party is just getting started.</p>
            </div>
            <p className="instruction-text">Keep Scrolling</p>
        </div>
    );
};

// 3. THE PRESENT (Scratch Card - Fixed Logic)
const PresentSection = () => {
    const canvasRef = useRef(null);
    const containerRef = useRef(null);
    const [revealed, setRevealed] = useState(false);

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const container = containerRef.current;
        
        const initCanvas = () => {
            if(!container) return;
            canvas.width = container.offsetWidth;
            canvas.height = container.offsetHeight;
            
            // Cover layer
            ctx.fillStyle = '#ddd'; // Silver scratch off
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            // Pattern
            ctx.fillStyle = '#ccc';
            for(let i=0; i<canvas.width; i+=10) {
                for(let j=0; j<canvas.height; j+=10) {
                    if((i+j)%20 === 0) ctx.fillRect(i, j, 5, 5);
                }
            }
            
            ctx.font = 'bold 16px Outfit';
            ctx.fillStyle = '#666';
            ctx.textAlign = 'center';
            ctx.fillText("SCRATCH HERE", canvas.width/2, canvas.height/2);
        };
        
        initCanvas();
        window.addEventListener('resize', initCanvas);

        let isDrawing = false;
        
        const getPos = (e) => {
            const rect = canvas.getBoundingClientRect();
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;
            return { x: clientX - rect.left, y: clientY - rect.top };
        };

        const scratch = (e) => {
            if(!isDrawing) return;
            const pos = getPos(e);
            
            ctx.globalCompositeOperation = 'destination-out';
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, 20, 0, Math.PI * 2);
            ctx.fill();

            // Check completion occasionally
            if(!revealed && Math.random() > 0.9) {
                const data = ctx.getImageData(0,0,canvas.width,canvas.height).data;
                let transparent = 0;
                for(let i=3; i<data.length; i+=100) if(data[i] === 0) transparent++; // Sample
                // Approx check
                if(transparent > (data.length/100) * 0.4) {
                    setRevealed(true);
                }
            }
        };

        const start = (e) => { isDrawing = true; scratch(e); };
        const end = () => { isDrawing = false; };

        canvas.addEventListener('mousedown', start);
        canvas.addEventListener('mousemove', scratch);
        window.addEventListener('mouseup', end);
        
        canvas.addEventListener('touchstart', start, {passive:false});
        canvas.addEventListener('touchmove', scratch, {passive:false});
        canvas.addEventListener('touchend', end);

        return () => window.removeEventListener('resize', initCanvas);
    }, [revealed]);

    return (
        <div className="b-section">
            <h2 className="mb-8">A Gift For You</h2>
            <div ref={containerRef} className="ticket-container">
                {/* Content Underneath */}
                <div className="ticket-content">
                    <Gift className="text-pink-500 mb-2" size={32} />
                    <h3 className="text-xl font-bold">VIP ACCESS</h3>
                    <p className="text-sm text-gray-500">To: The Birthday Star</p>
                </div>
                
                {/* Scratch Layer */}
                <canvas 
                    ref={canvasRef} 
                    style={{
                        position: 'absolute', top: 0, left: 0,
                        transition: 'opacity 1s', opacity: revealed ? 0 : 1,
                        pointerEvents: revealed ? 'none' : 'auto',
                        touchAction: 'none'
                    }}
                />
            </div>
            {!revealed && <p className="mt-6 text-sm text-gray-400">Rub the card to reveal</p>}
        </div>
    );
};

// 4. POLAROID (Minimal)
const PolaroidSection = ({ imageUrl }) => {
    const [snapped, setSnapped] = useState(false);

    return (
        <div className="b-section" onClick={() => setSnapped(true)}>
            <div style={{
                position: 'fixed', inset: 0, background: 'white', pointerEvents: 'none',
                opacity: snapped ? 0 : 0, animation: snapped ? 'flash 0.8s' : 'none', zIndex: 50
            }} />
            <style>{`@keyframes flash { 0% { opacity: 1; } 100% { opacity: 0; } }`}</style>

            <div className="polaroid-frame">
                <div className={`polaroid-img ${snapped ? 'developed' : ''}`}>
                    <img src={imageUrl || 'https://images.unsplash.com/photo-1513151241187-80ccbc7e6aa2?q=80&w=1000&auto=format&fit=crop'} alt="Memory" />
                </div>
                <p className="text-center mt-4 font-serif text-gray-700 italic">Making Memories</p>
            </div>
            
            {!snapped && (
                <div className="absolute-center mt-64 animate-bounce text-gray-400 flex flex-col items-center">
                    <Camera size={24} />
                    <span className="text-xs mt-1">Tap to Snap</span>
                </div>
            )}
        </div>
    );
};

// 5. JUKEBOX (Minimal)
const JukeboxSection = ({ song, isPlaying, onPlay, isMuted }) => {
    const [isLoading, setIsLoading] = useState(false);
    const audioRef = useRef(null);

    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.muted = isMuted;
        }
    }, [isMuted]);

    const togglePlayback = async () => {
        if (!song?.previewUrl && !song?.url) {
            toast('No song preview available');
            return;
        }

        if (isPlaying) {
            audioRef.current?.pause();
            onPlay(false);
            return;
        }

        try {
            setIsLoading(true);
            if (!audioRef.current || audioRef.current.src !== (song.previewUrl || song.url)) {
                const audio = new Audio(song.previewUrl || song.url);
                audio.loop = true;
                audio.muted = isMuted;
                audioRef.current = audio;
            }
            await audioRef.current.play();
            onPlay(true);
        } catch (error) {
            console.error('Song playback failed:', error);
            toast.error('Unable to play song');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="b-section">
            <h2 className="mb-8">Our Song</h2>
            <div className="flex flex-col items-center gap-6">
                <div className="relative">
                    <div className="w-48 h-48 rounded-full bg-gradient-to-br from-pink-100 to-purple-100 shadow-xl flex items-center justify-center">
                        {song?.albumArt ? (
                            <img src={song.albumArt} alt="Album Art" className="w-44 h-44 rounded-full object-cover" />
                        ) : (
                            <Music2 size={80} className="text-pink-400" />
                        )}
                    </div>
                    <button
                        onClick={togglePlayback}
                        className="absolute bottom-2 right-2 w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center hover:scale-110 transition-transform"
                    >
                        {isLoading ? (
                            <div className="animate-spin w-5 h-5 border-2 border-pink-500 border-t-transparent rounded-full" />
                        ) : isPlaying ? (
                            <Volume2 size={20} className="text-pink-500" />
                        ) : (
                            <VolumeX size={20} className="text-gray-400" />
                        )}
                    </button>
                </div>
                <div className="text-center">
                    <p className="font-bold text-gray-800">{song?.name || 'Selected Song'}</p>
                    <p className="text-gray-500 text-sm">{song?.artist || 'Unknown Artist'}</p>
                </div>
            </div>
        </div>
    );
};

// 6. BALLOON POP (Minimal)
const BalloonPopSection = () => {
    const canvasRef = useRef(null);
    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        let animationFrame = null;
        let balloons = [];
        const colors = ['#fca5a5', '#fdba74', '#86efac', '#93c5fd', '#c4b5fd'];
        
        const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
        window.addEventListener('resize', resize);
        resize();

        for(let i=0; i<8; i++) {
            balloons.push({
                x: Math.random() * canvas.width,
                y: canvas.height + Math.random() * 200,
                r: 40 + Math.random() * 20,
                speed: 1 + Math.random() * 1.5,
                color: colors[Math.floor(Math.random()*colors.length)],
                popped: false
            });
        }

        const animate = () => {
            ctx.clearRect(0,0,canvas.width,canvas.height);
            balloons.forEach(b => {
                if(b.popped) return;
                b.y -= b.speed;
                if(b.y < -60) b.y = canvas.height + 60;
                
                // String
                ctx.beginPath();
                ctx.moveTo(b.x, b.y + b.r);
                ctx.quadraticCurveTo(b.x, b.y + b.r + 30, b.x + Math.sin(b.y*0.1)*5, b.y + b.r + 60);
                ctx.strokeStyle = '#ccc'; ctx.stroke();

                // Balloon
                ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, Math.PI*2);
                ctx.fillStyle = b.color; ctx.fill();
                
                // Reflection
                ctx.beginPath(); ctx.arc(b.x - b.r*0.3, b.y - b.r*0.3, b.r*0.2, 0, Math.PI*2);
                ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.fill();
            });
            animationFrame = requestAnimationFrame(animate);
        };
        animate();

        const popAt = (clientX, clientY) => {
            const rect = canvas.getBoundingClientRect();
            const x = clientX - rect.left;
            const y = clientY - rect.top;
            
            balloons.forEach(b => {
                if(!b.popped && Math.hypot(x-b.x, y-b.y) < b.r) {
                    b.popped = true;
                    // Simple pop effect
                    const el = document.createElement('div');
                    el.style.position = 'fixed';
                    el.style.left = x + 'px'; el.style.top = y + 'px';
                    el.innerText = "POP!";
                    el.style.color = b.color;
                    el.style.fontWeight = 'bold';
                    el.style.pointerEvents = 'none';
                    el.animate([{opacity:1, transform:'scale(1)'}, {opacity:0, transform:'scale(2)'}], 500);
                    document.body.appendChild(el);
                    setTimeout(()=>el.remove(), 500);
                }
            });
        };

        const onMouseDown = (e) => popAt(e.clientX, e.clientY);
        const onTouchStart = (e) => {
            if (!e.touches || e.touches.length === 0) return;
            popAt(e.touches[0].clientX, e.touches[0].clientY);
        };

        canvas.addEventListener('mousedown', onMouseDown);
        canvas.addEventListener('touchstart', onTouchStart, { passive: true });
        return () => {
            if (animationFrame) cancelAnimationFrame(animationFrame);
            canvas.removeEventListener('mousedown', onMouseDown);
            canvas.removeEventListener('touchstart', onTouchStart);
            window.removeEventListener('resize', resize);
        };
    }, []);

    return (
        <div className="b-section">
            <h2 className="absolute-center pointer-events-none opacity-20 text-4xl font-bold tracking-widest">POP!</h2>
            <canvas ref={canvasRef} className="full-canvas" />
        </div>
    );
};

// 7. SLOT MACHINE (Minimal)
const SlotMachineSection = () => {
    const [result, setResult] = useState(['-', '-', '-']);
    const [spinning, setSpinning] = useState(false);

    const spin = () => {
        if(spinning) return;
        setSpinning(true);
        setResult(['', '', '']);
        setTimeout(() => {
            setResult(['★', '★', '★']);
            setSpinning(false);
        }, 1200);
    };

    return (
        <div className="b-section">
            <h2 className="mb-8">Level Up</h2>
            <div className="level-machine">
                {result.map((r, i) => (
                    <div key={i} className="level-reel">
                        <div className={`level-symbol ${spinning ? 'spinning' : ''}`}>
                            {spinning ? '?' : r}
                        </div>
                    </div>
                ))}
            </div>
            <button className="minimal-btn mt-8" onClick={spin}>
                SPIN TO WIN
            </button>
            {!spinning && result[0] === '★' && <p className="mt-6 text-yellow-500 font-bold animate-bounce">JACKPOT!</p>}
        </div>
    );
};

// 8. TOAST (Minimal)
const ToastSection = () => {
    const [clinked, setClinked] = useState(false);

    const handleClink = () => {
        setClinked(true);
        if(navigator.vibrate) navigator.vibrate(50);
        setTimeout(() => setClinked(false), 2000);
    };

    return (
        <div className="b-section" onClick={handleClink}>
            <div className="toast-stage">
                <div className={`toast-glass left ${clinked ? 'clinked' : ''}`}>
                    <div className="toast-cup" />
                    <div className="toast-stem" />
                    <div className="toast-base" />
                </div>
                <div className={`toast-glass right ${clinked ? 'clinked' : ''}`}>
                    <div className="toast-cup" />
                    <div className="toast-stem" />
                    <div className="toast-base" />
                </div>
                <span className={`toast-ring ${clinked ? 'active' : ''}`} />
                <span className={`toast-spark s1 ${clinked ? 'active' : ''}`} />
                <span className={`toast-spark s2 ${clinked ? 'active' : ''}`} />
                <span className={`toast-spark s3 ${clinked ? 'active' : ''}`} />
                <span className={`toast-spark s4 ${clinked ? 'active' : ''}`} />
            </div>
            <h2 className="mt-10 text-2xl font-bold text-gray-700">Tap to Toast</h2>
        </div>
    );
};

// 9. STAR WALK (Minimal)
const StarWalkSection = () => {
    const canvasRef = useRef(null);
    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        let animationFrame = null;
        const particles = [];
        
        const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
        window.addEventListener('resize', resize);
        resize();

        const draw = () => {
            ctx.clearRect(0,0,canvas.width,canvas.height);
            // Dashed line
            ctx.beginPath(); ctx.moveTo(canvas.width/2, 50); ctx.lineTo(canvas.width/2, canvas.height-50);
            ctx.strokeStyle = '#eee'; ctx.setLineDash([10, 20]); ctx.stroke();
            
            particles.forEach((p,i) => {
                ctx.fillStyle = `rgba(236, 72, 153, ${p.a})`; // Pink
                ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI*2); ctx.fill();
                p.a -= 0.01;
                if(p.a <= 0) particles.splice(i, 1);
            });
            animationFrame = requestAnimationFrame(draw);
        };
        draw();

        const add = (e) => {
            const rect = canvas.getBoundingClientRect();
            const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
            const y = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top;
            particles.push({x, y, r: 10+Math.random()*10, a: 1});
        };
        const onMouseMove = (e) => add(e);
        const onTouchStart = (e) => add(e);

        canvas.addEventListener('mousemove', onMouseMove);
        canvas.addEventListener('touchstart', onTouchStart, { passive: true });
        return () => {
            if (animationFrame) cancelAnimationFrame(animationFrame);
            canvas.removeEventListener('mousemove', onMouseMove);
            canvas.removeEventListener('touchstart', onTouchStart);
            window.removeEventListener('resize', resize);
        };
    }, []);

    return (
        <div className="b-section">
            <h2 className="absolute-center pointer-events-none opacity-20">WALK OF FAME</h2>
            <canvas ref={canvasRef} className="full-canvas" />
        </div>
    );
};

// 10. ENCORE (Minimal)
const EncoreSection = ({ recipient, onSend, isSending, noteMessage, setNoteMessage, savedNote }) => {
    return (
        <div className="b-section p-8 text-center">
            <h1 className="text-4xl text-gray-800 mb-2 font-serif italic">Happy Birthday</h1>
            <h2 className="text-2xl text-pink-500 mb-8 font-bold">{recipient || "YOU"}</h2>
            
            <div className="note-panel">
                <p className="mb-4 text-gray-500 text-sm">Send a thank you note</p>
                <textarea
                    className="note-input"
                    placeholder="Type your note..."
                    value={noteMessage}
                    onChange={e => setNoteMessage(e.target.value)}
                    maxLength={280}
                />
                <button 
                    className="w-full py-4 bg-pink-500 text-white rounded-lg font-bold hover:bg-pink-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={onSend}
                    disabled={isSending || !noteMessage.trim()}
                >
                    {isSending ? "Saving..." : "Save Note"}
                </button>
                {savedNote?.message && (
                    <div className="saved-note">
                        <strong>Saved note:</strong> {savedNote.message}
                    </div>
                )}
            </div>
            <p className="mt-8 text-sm text-gray-400">Keep Shining</p>
        </div>
    );
};

// --- MAIN COMPONENT ---
const BirthdayPage = () => {
    const { wishId } = useParams();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isMuted, setIsMuted] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [noteMessage, setNoteMessage] = useState('');
    const [savedNote, setSavedNote] = useState(null);
    const [isSongPlaying, setIsSongPlaying] = useState(false);
    const [isSongLoading, setIsSongLoading] = useState(false);
    const songAudioRef = useRef(null);
    const isInitialNoteLoaded = useRef(false);

    useEffect(() => {
        const fetchData = async () => {
            if(!wishId) return;
            const result = await resolveCardId(wishId, 'wishes', 'birthday');
            if (result) {
                onSnapshot(doc(db, 'wishes', result.id), (doc) => {
                    if (doc.exists()) {
                        const normalized = normalizeCardData(doc.data());
                        const existingNote = normalized?.thankYouNote || normalized?.response || null;
                        setData({ ...normalized, id: result.id });
                        setSavedNote(existingNote);
                        if (!isInitialNoteLoaded.current) {
                            setNoteMessage(existingNote?.message || '');
                            isInitialNoteLoaded.current = true;
                        }
                    }
                    setLoading(false);
                });
            } else {
                setLoading(false);
            }
        };
        fetchData();
    }, [wishId]);

    useEffect(() => {
        if (songAudioRef.current) {
            songAudioRef.current.muted = isMuted;
        }
    }, [isMuted]);

    useEffect(() => {
        return () => {
            if (songAudioRef.current) {
                songAudioRef.current.pause();
                songAudioRef.current = null;
            }
        };
    }, []);

    const activeSongUrl = data?.song?.previewUrl || data?.song?.url || '';

    useEffect(() => {
        if (!activeSongUrl && songAudioRef.current) {
            songAudioRef.current.pause();
            songAudioRef.current = null;
            setIsSongPlaying(false);
            setIsSongLoading(false);
        }
    }, [activeSongUrl]);

    const toggleSongPlayback = async () => {
        const previewUrl = activeSongUrl;
        if (!previewUrl) {
            toast('No preview available for this song');
            return;
        }

        if (isSongPlaying) {
            songAudioRef.current?.pause();
            setIsSongPlaying(false);
            setIsSongLoading(false);
            return;
        }

        try {
            if (!songAudioRef.current || songAudioRef.current.src !== previewUrl) {
                const audio = new Audio(previewUrl);
                audio.loop = true;
                audio.muted = isMuted;
                audio.onended = () => setIsSongPlaying(false);
                audio.onpause = () => setIsSongPlaying(false);
                audio.onplay = () => setIsSongPlaying(true);
                audio.oncanplaythrough = () => setIsSongLoading(false);
                audio.onerror = () => {
                    setIsSongLoading(false);
                    setIsSongPlaying(false);
                };
                songAudioRef.current = audio;
            }
            setIsSongLoading(true);
            await songAudioRef.current.play();
            setIsSongPlaying(true);
            setIsSongLoading(false);
        } catch (error) {
            setIsSongLoading(false);
            setIsSongPlaying(false);
            console.error('Song playback failed:', error);
            toast.error('Unable to play song preview');
        }
    };

    const handleSend = async () => {
        if (!data?.id) return;
        const trimmedMessage = noteMessage.trim();
        if (!trimmedMessage) return;

        setIsSending(true);
        try {
            const payload = { message: trimmedMessage, timestamp: Date.now() };
            await updateDoc(doc(db, 'wishes', data.id), {
                response: payload,
                thankYouNote: payload,
                noteHistory: arrayUnion(payload)
            });
            setSavedNote(payload);
            setNoteMessage('');
            toast.success("Message sent successfully!");
        } catch(e) { console.error(e); }
        setIsSending(false);
    };

    if (loading) return <Loader />;

    return (
        <>
            <style>{styles}</style>
            <Toaster position="top-center" />
            <div className="birthday-scroll-container">
                <div className="top-right-ui">
                    {data?.song && (
                        <div className={`birthday-music-badge ${isSongPlaying ? 'playing' : ''}`}>
                            {data.song.albumArt ? (
                                <img src={data.song.albumArt} alt={data.song.name || 'Song'} className="birthday-music-album" />
                            ) : (
                                <div className="birthday-music-album" style={{display:'flex',alignItems:'center',justifyContent:'center',color:'#9ca3af'}}>
                                    <Music2 size={16} />
                                </div>
                            )}
                            <div className="birthday-music-info">
                                {isSongPlaying && (
                                    <span className="birthday-now-playing"><span className="dot" />Now Playing</span>
                                )}
                                <span className="birthday-music-title">{data.song.name || 'Selected Song'}</span>
                                <span className="birthday-music-artist">{data.song.artist || 'Unknown Artist'}</span>
                            </div>
                            <div className="birthday-music-controls">
                                {isSongLoading ? (
                                    <div className="birthday-loader-dot" aria-label="Loading song" />
                                ) : (
                                    <button
                                        type="button"
                                        className="birthday-music-btn"
                                        onClick={toggleSongPlayback}
                                        title={isSongPlaying ? 'Pause preview' : 'Play preview'}
                                    >
                                        {isSongPlaying ? <Pause size={14} /> : <Play size={14} />}
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                    <button 
                        onClick={() => setIsMuted(!isMuted)} 
                        className="top-right-icon-btn"
                    >
                        {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                    </button>
                </div>

                {/* 1. Cake & Cutting */}
                <CakeSection />
                
                {/* 2. Transition */}
                <SugarRushSection />
                
                {/* 3. Gift Scratch */}
                <PresentSection />
                
                {/* 6. Balloons */}
                <BalloonPopSection />
                
                {/* 7. Slots */}
                <SlotMachineSection />
                
                {/* 8. Toast */}
                <ToastSection />
                
                {/* 9. Walk */}
                <StarWalkSection />
                
                {/* 10. Message */}
                <EncoreSection
                    recipient={data?.recipientName}
                    onSend={handleSend}
                    isSending={isSending}
                    noteMessage={noteMessage}
                    setNoteMessage={setNoteMessage}
                    savedNote={savedNote}
                />
            </div>
        </>
    );
};

export const WishDisplay = BirthdayPage;
export default BirthdayPage;
