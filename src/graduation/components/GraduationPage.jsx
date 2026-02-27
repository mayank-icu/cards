import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import {
  doc,
  onSnapshot
} from 'firebase/firestore';
import {
  GraduationCap,
  Award,
  Footprints,
  Sparkles,
  ChevronDown,
  Repeat,
  Quote,
  Star,
  Music
} from 'lucide-react';
import CardViewHeader from '../../components/CardViewHeader';
import CardFooter from '../../components/CardFooter';
import SongPlayer from '../../components/SongPlayer';
import { normalizeCardData, resolveCardId } from '../../utils/slugs';
import { db } from '../../firebase';

// --- STYLES ---
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700;900&family=Lora:ital,wght@0,400;0,600;1,400&family=Inter:wght@300;400;600&display=swap');

  :root {
    --c-blue: #1E3A8A; /* University Blue */
    --c-blue-dark: #0f172a;
    --c-gold: #D4AF37; /* Tassel Gold */
    --c-gold-light: #FCD34D;
    --c-paper: #FDFBF7; /* Parchment White */
    --c-ink: #1F2937;
    --c-burn: #9A3412;
    --font-heading: 'Cinzel', serif;
    --font-body: 'Lora', serif;
    --font-ui: 'Inter', sans-serif;
  }

  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
    -webkit-tap-highlight-color: transparent;
  }

  body {
    background-color: var(--c-paper);
    color: var(--c-ink);
    font-family: var(--font-body);
    overflow: hidden; 
  }

  /* --- SCROLL SNAP CONTAINER --- */
  .scrolly-container {
    height: 100dvh;
    overflow-y: scroll;
    scroll-snap-type: y mandatory;
    scroll-behavior: smooth;
    position: relative;
    background: var(--c-paper);
  }

  section {
    height: 100dvh;
    width: 100%;
    scroll-snap-align: start;
    position: relative;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    text-align: center;
    padding: 1.5rem;
    overflow: hidden;
    perspective: 1000px;
  }

  /* --- TYPOGRAPHY --- */
  h1, h2, h3 {
    font-family: var(--font-heading);
    color: var(--c-blue);
    line-height: 1.2;
    margin-bottom: 1rem;
  }

  h1 { font-size: clamp(2rem, 5vw, 4rem); font-weight: 700; }
  h2 { font-size: clamp(1.5rem, 4vw, 3rem); }
  h3 { font-size: clamp(1.2rem, 3vw, 2rem); }
  
  p { 
    font-size: clamp(1rem, 1.5vw, 1.25rem); 
    max-width: 60ch; 
    line-height: 1.7; 
    color: #374151; 
  }
  
  .hint {
    font-family: var(--font-ui);
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 2px;
    color: #9CA3AF;
    margin-top: 1.5rem;
    opacity: 0.7;
    animation: pulse 2s infinite;
    pointer-events: none;
  }

  /* --- UTILITIES --- */
  .fade-in-up {
    animation: fadeInUp 1s ease forwards;
    opacity: 0;
    transform: translateY(20px);
  }

  @keyframes fadeInUp {
    to { opacity: 1; transform: translateY(0); }
  }

  @keyframes pulse {
    0%, 100% { opacity: 0.5; transform: scale(1); }
    50% { opacity: 1; transform: scale(1.05); }
  }

  /* --- SECTION 1: AIRLOCK --- */
  .airlock-overlay {
    position: absolute;
    inset: 0;
    background: var(--c-blue);
    color: white;
    z-index: 100;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    transition: transform 1s cubic-bezier(0.7, 0, 0.3, 1);
  }
  .airlock-overlay.open { transform: translateY(-100%); }
  .airlock-overlay h1 { color: var(--c-gold); }
  .airlock-overlay svg { color: var(--c-gold); animation: float 3s ease-in-out infinite; }

  /* --- SECTION 2: THE WALK --- */
  .footsteps-container {
    height: 150px;
    width: 100%;
    position: relative;
    display: flex;
    justify-content: center;
    align-items: center;
    margin-bottom: 2rem;
  }
  .footprint {
    opacity: 0;
    position: absolute;
    color: var(--c-blue);
    animation: walk 4s infinite;
  }
  .fp-left { transform: rotate(-10deg) translateX(-20px); animation-delay: 0s; }
  .fp-right { transform: rotate(10deg) translateX(20px); animation-delay: 2s; }

  @keyframes walk {
    0% { opacity: 0; transform: translateY(30px) scale(0.8); }
    20% { opacity: 1; transform: translateY(0) scale(1); }
    80% { opacity: 1; transform: translateY(-30px) scale(1); }
    100% { opacity: 0; transform: translateY(-60px) scale(0.9); }
  }

  /* --- SECTION 3: THE REWARD (DIPLOMA) --- */
  .diploma-stage {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    position: relative;
  }

  .diploma-wrapper {
    cursor: pointer;
    transition: all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1);
    position: relative;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  /* Rolled State */
  .rolled-diploma {
    width: 60px;
    height: 300px;
    background: linear-gradient(90deg, #f0e6d2 0%, #fff 50%, #f0e6d2 100%);
    border-radius: 4px;
    box-shadow: 
      10px 10px 20px rgba(0,0,0,0.15),
      inset 0 0 10px rgba(0,0,0,0.1);
    display: flex;
    justify-content: center;
    align-items: center;
    border: 1px solid #d4c5a5;
    position: absolute;
    z-index: 10;
    transition: all 0.5s ease;
  }

  .ribbon {
    position: absolute;
    width: 100%;
    height: 40px;
    background: var(--c-burn);
    top: 50%;
    transform: translateY(-50%);
    box-shadow: 0 2px 5px rgba(0,0,0,0.3);
    border-top: 1px solid rgba(255,255,255,0.2);
    border-bottom: 1px solid rgba(0,0,0,0.2);
  }

  /* Open State */
  .open-diploma {
    width: min(90vw, 600px);
    background: #fff;
    border: 1px solid #e5e7eb;
    padding: 3rem;
    box-shadow: 
      0 1px 1px rgba(0,0,0,0.1), 
      0 2px 2px rgba(0,0,0,0.1), 
      0 4px 4px rgba(0,0,0,0.1), 
      0 8px 8px rgba(0,0,0,0.1),
      0 16px 16px rgba(0,0,0,0.1);
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    position: relative;
    opacity: 0;
    transform: scale(0.5) rotateX(90deg);
    transition: all 0.8s cubic-bezier(0.16, 1, 0.3, 1);
    pointer-events: none;
    border-image: linear-gradient(to right, transparent 0%, #d4c5a5 10%, #d4c5a5 90%, transparent 100%) 1;
  }

  .diploma-header {
    border-bottom: 2px solid var(--c-gold);
    padding-bottom: 1rem;
    width: 100%;
    margin-bottom: 2rem;
  }

  .diploma-seal {
    position: absolute;
    bottom: 2rem;
    right: 2rem;
    opacity: 0.8;
  }

  /* Interaction Logic */
  .diploma-wrapper.is-open .rolled-diploma {
    opacity: 0;
    transform: scale(0) rotate(180deg);
  }

  .diploma-wrapper.is-open .open-diploma {
    opacity: 1;
    transform: scale(1) rotateX(0deg);
    pointer-events: all;
  }

  /* Mobile Adjustments */
  @media (max-width: 768px) {
    .open-diploma {
      padding: 1.5rem;
      width: 95vw;
    }
    .diploma-header {
      margin-bottom: 1.5rem;
    }
    .diploma-seal {
      width: 60px;
      height: 60px;
      bottom: 1rem;
      right: 1rem;
    }
  }

  /* --- SECTION 4: THE TASSEL --- */
  .cap-container {
    position: relative;
    width: 300px;
    height: 300px;
    display: flex;
    justify-content: center;
    align-items: center;
    margin-bottom: 2rem;
    perspective: 800px;
  }
  
  .mortarboard {
    width: 200px;
    height: 200px;
    background: var(--c-blue);
    transform: rotateX(20deg) rotate(45deg);
    position: relative;
    box-shadow: 15px 15px 30px rgba(0,0,0,0.3);
    transition: transform 0.5s ease;
  }

  .tassel-anchor {
    position: absolute;
    width: 16px;
    height: 16px;
    background: var(--c-gold);
    border-radius: 50%;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    z-index: 10;
    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
  }

  .tassel-string {
    position: absolute;
    top: 50%;
    left: 50%;
    width: 4px;
    height: 140px;
    background: linear-gradient(to bottom, var(--c-gold), #b8860b);
    transform-origin: top center;
    transition: transform 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    z-index: 5;
    border-radius: 2px;
  }

  .tassel-fringe {
    position: absolute;
    bottom: -30px;
    left: -12px;
    width: 28px;
    height: 50px;
    background: var(--c-gold);
    border-radius: 4px;
    box-shadow: 0 4px 8px rgba(0,0,0,0.2);
    /* Simulated threads */
    background-image: repeating-linear-gradient(90deg, transparent, transparent 2px, rgba(0,0,0,0.1) 2px, rgba(0,0,0,0.1) 3px);
  }

  /* --- SECTION 5: CAP TOSS (INTERACTION FIX) --- */
  .cap-toss-section {
    position: relative;
    touch-action: none; 
    cursor: crosshair;
    overflow: hidden;
    background: radial-gradient(circle at center, #fff 0%, #f3f4f6 100%);
    user-select: none;
  }

  /* The actual interaction layer, sits on top of everything */
  .interaction-layer {
    position: absolute;
    inset: 0;
    z-index: 50;
    cursor: crosshair;
    background: transparent;
  }

  canvas#capCanvas {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 10; /* Above background, below interaction */
  }

  .toss-instructions {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    z-index: 5; /* Below canvas so caps fly over text */
    pointer-events: none;
    text-shadow: 0 2px 10px rgba(255,255,255,0.8);
    transition: opacity 0.5s;
    width: 80%;
  }

  .toss-instructions.hidden {
    opacity: 0;
  }

  /* --- SECTION 6: SPOTLIGHT --- */
  .spotlight-section {
    background: black;
    color: white;
    cursor: none;
  }
  
  .spotlight-mask {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: radial-gradient(circle 180px at var(--x) var(--y), transparent 0%, rgba(0,0,0,0.95) 100%);
    pointer-events: none;
    z-index: 10;
    will-change: background;
  }
  
  .spotlight-content {
    opacity: 0.4;
    transition: opacity 0.3s;
    max-width: 800px;
  }
  
  .spotlight-content h2 { color: white; }
  .spotlight-content p { color: #aaa; }

  /* --- SECTION 7: QUOTE (INTERACTIVE) --- */
  .quote-section {
    background: var(--c-paper);
    perspective: 1000px;
  }

  .quote-container {
    border-left: 6px solid var(--c-gold);
    padding: 2rem 3rem;
    text-align: left;
    max-width: 900px;
    background: rgba(255,255,255,0.5);
    backdrop-filter: blur(5px);
    transition: transform 0.1s ease-out;
    transform-style: preserve-3d;
  }

  .quote-text {
    font-size: clamp(2.5rem, 6vw, 4rem);
    font-style: italic;
    color: var(--c-blue);
    font-family: var(--font-heading);
    transition: text-shadow 0.2s ease;
  }

  .quote-icon {
    margin-bottom: 1rem;
    color: var(--c-gold);
    opacity: 0.5;
  }

  /* --- SECTION 8: CELEBRATION (MINIMAL REDESIGN) --- */
  .celebration-section {
    background-color: #020617; /* Very Dark Slate/Black */
    color: white;
    z-index: 20;
    overflow: hidden;
    position: relative;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
  }

  #confettiCanvas {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
  }

  .minimal-content {
    z-index: 30;
    position: relative;
    padding: 2rem;
    max-width: 900px;
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 3rem;
  }

  .minimal-heading {
    font-family: var(--font-heading);
    font-weight: 700;
    font-size: clamp(3rem, 8vw, 6rem);
    letter-spacing: -0.02em;
    line-height: 1;
    background: linear-gradient(to bottom right, #FCD34D, #fff, #D4AF37);
    -webkit-background-clip: text;
    color: transparent;
    margin: 0;
    padding-bottom: 10px; /* For gradient descenders */
  }

  .minimal-divider {
    width: 60px;
    height: 1px;
    background: rgba(255,255,255,0.3);
  }

  .minimal-message {
    font-family: var(--font-body);
    font-size: clamp(1.1rem, 2.5vw, 1.5rem);
    line-height: 1.8;
    color: #94a3b8;
    font-weight: 300;
    max-width: 650px;
    margin: 0 auto;
  }

  .minimal-sender {
    font-family: var(--font-ui);
    font-size: 0.9rem;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 0.15em;
    margin-top: 1rem;
  }

  .minimal-btn {
    background: transparent;
    border: 1px solid rgba(255,255,255,0.15);
    color: white;
    padding: 1rem 2.5rem;
    border-radius: 2px;
    cursor: pointer;
    font-family: var(--font-ui);
    text-transform: uppercase;
    letter-spacing: 2px;
    font-size: 0.75rem;
    transition: all 0.4s ease;
    margin-top: 2rem;
  }
  
  .minimal-btn:hover { 
    background: rgba(255,255,255,0.05);
    border-color: rgba(255,255,255,0.5);
    box-shadow: 0 0 20px rgba(255,255,255,0.1);
  }

  @keyframes float {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-15px); }
  }
`;

// --- FIREBASE CONFIG ---
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

// --- MAIN COMPONENT ---
const GraduationPage = () => {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [started, setStarted] = useState(false);

  // Interaction States
  const [isDiplomaOpen, setDiplomaOpen] = useState(false);
  const [tasselSide, setTasselSide] = useState('right');
  const [spotlightPos, setSpotlightPos] = useState({ x: '50%', y: '50%' });
  const [quoteTilt, setQuoteTilt] = useState({ x: 0, y: 0 });
  const [hasTossed, setHasTossed] = useState(false);

  // Refs for Canvas
  const capCanvasRef = useRef(null);
  const capsRef = useRef([]);
  const confettiCanvasRef = useRef(null);
  const particlesRef = useRef([]);

  // Helper to get Spotify ID
  const getSpotifyId = (url) => {
    if (!url || typeof url !== 'string') return null;
    try {
      const parts = url.split('/');
      return parts[parts.length - 1].split('?')[0];
    } catch (e) { return null; }
  };
  const spotifyId = getSpotifyId(data?.song);

  // --- DATA FETCHING ---
  useEffect(() => {
    if (!id) return;
    let unsubscribe = () => { };

    const setupSubscription = async () => {
      try {
        const result = await resolveCardId(id, 'graduations', 'graduation');
        if (result) {
          const docRef = doc(db, 'graduations', result.id);
          unsubscribe = onSnapshot(docRef, (docSnap) => {
            if (docSnap.exists()) setData(normalizeCardData(docSnap.data()));
            setLoading(false);
          });
        } else {
          setLoading(false);
        }
      } catch (error) {
        console.error("Error:", error);
        setLoading(false);
      }
    };
    setupSubscription();
    return () => unsubscribe();
  }, [id]);

  // --- CAP TOSS LOGIC (Refined) ---
  const addCap = (x, y) => {
    setHasTossed(true);
    const count = 3;
    for (let i = 0; i < count; i++) {
      const jitterX = (Math.random() - 0.5) * 40;
      const jitterY = (Math.random() - 0.5) * 40;
      capsRef.current.push({
        x: x + jitterX,
        y: y + jitterY,
        vx: (Math.random() - 0.5) * 15,
        vy: -15 - Math.random() * 10, // Initial upward velocity
        rot: Math.random() * 360,
        vRot: (Math.random() - 0.5) * 20,
        scale: 0.8 + Math.random() * 0.4
      });
    }
  };

  useEffect(() => {
    const canvas = capCanvasRef.current;
    if (!canvas) return;

    // Explicitly set dimensions on mount/resize
    const setDimensions = () => {
      // Find the parent section to size correctly
      const parent = canvas.parentElement;
      if (parent) {
        canvas.width = parent.clientWidth;
        canvas.height = parent.clientHeight;
      } else {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      }
    };

    // Initial size set
    setDimensions();

    const ctx = canvas.getContext('2d');
    let animationFrameId;

    const handleResize = () => setDimensions();
    window.addEventListener('resize', handleResize);

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      capsRef.current.forEach((cap, i) => {
        cap.x += cap.vx;
        cap.y += cap.vy;
        cap.vy += 0.5; // Gravity
        cap.rot += cap.vRot;

        ctx.save();
        ctx.translate(cap.x, cap.y);
        ctx.rotate((cap.rot * Math.PI) / 180);
        ctx.scale(cap.scale, cap.scale);

        // Draw Cap
        ctx.fillStyle = '#1E3A8A'; // Navy
        ctx.beginPath();
        ctx.moveTo(0, -20);
        ctx.lineTo(40, 0);
        ctx.lineTo(0, 20);
        ctx.lineTo(-40, 0);
        ctx.fill();

        ctx.fillRect(-15, 0, 30, 20); // Cap body

        ctx.fillStyle = '#D4AF37'; // Gold Tassel
        ctx.beginPath();
        ctx.arc(0, 0, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillRect(0, 0, 2, 25);

        ctx.restore();

        // Cleanup if off screen
        if (cap.y > canvas.height + 100) {
          capsRef.current.splice(i, 1);
        }
      });

      animationFrameId = requestAnimationFrame(render);
    };
    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  // --- CONFETTI LOGIC ---
  const createConfetti = (x, y) => {
    const colors = ['#D4AF37', '#FCD34D', '#FFF', '#94A3B8'];
    for (let i = 0; i < 30; i++) {
      particlesRef.current.push({
        x, y,
        vx: (Math.random() - 0.5) * 15,
        vy: (Math.random() - 0.5) * 15 - 8,
        size: Math.random() * 6 + 2,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 10,
        drag: 0.96,
        gravity: 0.2
      });
    }
  };

  useEffect(() => {
    const canvas = confettiCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', resize);
    resize();

    // Auto fire confetti occasionally at bottom
    const autoFire = setInterval(() => {
      if (Math.random() > 0.6) {
        createConfetti(Math.random() * canvas.width, canvas.height);
      }
    }, 800);

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particlesRef.current.forEach((p, i) => {
        p.x += p.vx;
        p.y += p.vy;
        p.vx *= p.drag;
        p.vy *= p.drag;
        p.vy += p.gravity;
        p.rotation += p.rotationSpeed;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        ctx.restore();

        if (p.y > canvas.height + 50 || p.y < -500) particlesRef.current.splice(i, 1);
      });
      requestAnimationFrame(animate);
    };
    animate();

    return () => {
      clearInterval(autoFire);
      window.removeEventListener('resize', resize);
    }
  }, []);

  // --- HANDLERS ---
  const handleSpotlight = (e) => {
    const clientX = e.clientX || (e.touches && e.touches[0].clientX);
    const clientY = e.clientY || (e.touches && e.touches[0].clientY);
    if (clientX && clientY) setSpotlightPos({ x: `${clientX}px`, y: `${clientY}px` });
  };

  const handleQuoteHover = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const tiltX = (y - centerY) / 20;
    const tiltY = (centerX - x) / 20;

    setQuoteTilt({ x: tiltX, y: tiltY });
  };

  // Fixed click handler using the overlay event
  const handleTossClick = (e) => {
    e.preventDefault(); // Stop native behavior/scrolling on quick taps

    const rect = e.currentTarget.getBoundingClientRect();
    let clientX, clientY;

    if (e.touches && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const x = clientX - rect.left;
    const y = clientY - rect.top;
    addCap(x, y);
  };

  // --- RENDER ---
  if (loading) return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#FDFBF7', color: '#1E3A8A', fontFamily: 'serif' }}>Preparing...</div>;

  return (
    <>
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100 }}>
        <CardViewHeader
          cardType="graduation"
          cardId={id}
          title="Graduation"
          subtitle={data?.graduate ? `${data.graduate}${data?.school ? ` · ${data.school}` : ''}` : undefined}
        />
      </div>

      {/* Floating Spotify Player */}
      {spotifyId ? (
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
      ) : (
        <SongPlayer song={data?.song} />
      )}
      <style>{styles}</style>

      {/* --- 1. AIRLOCK --- */}
      <div className={`airlock-overlay ${started ? 'open' : ''}`} onClick={() => setStarted(true)}>
        <GraduationCap size={80} strokeWidth={1} />
        <h1 style={{ marginTop: '2rem' }}>The Journey Begins</h1>
        <p className="hint" style={{ color: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.3)', padding: '10px 20px', borderRadius: '30px' }}>Tap to Enter</p>
      </div>

      <main className="scrolly-container">

        {/* --- 2. THE WALK --- */}
        <section>
          <div className="footsteps-container">
            <Footprints size={48} className="footprint fp-left" />
            <Footprints size={48} className="footprint fp-right" />
          </div>
          <h2 className="fade-in-up" style={{ animationDelay: '0.2s' }}>It started with a single step.</h2>
          <p className="fade-in-up" style={{ animationDelay: '0.4s' }}>From the first day on campus to the final exam, every moment led to this.</p>
          <ChevronDown className="hint" style={{ position: 'absolute', bottom: '2rem' }} />
        </section>

        {/* --- 3. THE REWARD (DIPLOMA) --- */}
        <section>
          <div className="diploma-stage">
            <h2 style={{ marginBottom: '2rem' }}>The Reward</h2>

            <div
              className={`diploma-wrapper ${isDiplomaOpen ? 'is-open' : ''}`}
              onClick={() => setDiplomaOpen(!isDiplomaOpen)}
            >
              {/* Rolled Version */}
              <div className="rolled-diploma">
                <div className="ribbon"></div>
              </div>

              {/* Open Version */}
              <div className="open-diploma">
                <div className="diploma-header">
                  {data?.school && <h3 style={{ color: '#1E3A8A' }}>{data.school}</h3>}
                </div>

                <h1 style={{ color: '#111', fontSize: 'clamp(1.5rem, 4vw, 2.5rem)', margin: '1rem 0' }}>
                  {data?.graduate || "Graduate Name"}
                </h1>

                {data?.degree && (
                  <p style={{
                    fontStyle: 'italic',
                    fontSize: '1.2rem',
                    color: '#4B5563',
                    borderTop: '1px solid #ddd',
                    borderBottom: '1px solid #ddd',
                    padding: '10px 0',
                    width: '100%'
                  }}>
                    {data.degree}
                  </p>
                )}

                <div style={{ marginTop: '2rem', width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Award size={32} color="#D4AF37" />
                    <span style={{ fontWeight: 'bold', fontFamily: 'var(--font-heading)' }}>Class of {data?.year || new Date().getFullYear()}</span>
                  </div>
                  <Award size={48} color="#9A3412" className="diploma-seal" />
                </div>
              </div>
            </div>

            <p className="hint">{isDiplomaOpen ? "Tap to close" : "Tap to unroll the diploma"}</p>
          </div>
        </section>

        {/* --- 4. THE TASSEL --- */}
        <section>
          <h2>Turn the Tassel</h2>
          <div className="cap-container" onClick={() => setTasselSide(prev => prev === 'left' ? 'right' : 'left')}>
            <div className="mortarboard">
              <div className="tassel-anchor"></div>
              <div
                className="tassel-string"
                style={{ transform: `rotate(${tasselSide === 'left' ? '40deg' : '-40deg'})` }}
              >
                <div className="tassel-fringe"></div>
              </div>
            </div>
          </div>
          <p className="hint">Tap to switch sides</p>
        </section>

        {/* --- 5. CAP TOSS (FIXED) --- */}
        <section className="cap-toss-section">
          {/* Dedicated Interaction Layer - Ensures clicks are always captured */}
          <div
            className="interaction-layer"
            onMouseDown={handleTossClick}
            onTouchStart={handleTossClick}
          />

          <div className={`toss-instructions ${hasTossed ? 'hidden' : ''}`}>
            <h2>Sky's the Limit</h2>
            <p className="hint" style={{ color: '#1E3A8A', border: 'none', animation: 'pulse 1s infinite' }}>TAP ANYWHERE TO THROW!</p>
          </div>

          <canvas ref={capCanvasRef} id="capCanvas"></canvas>
        </section>

        {/* --- 6. SPOTLIGHT --- */}
        <section
          className="spotlight-section"
          onMouseMove={handleSpotlight}
          onTouchMove={handleSpotlight}
        >
          <div className="spotlight-mask" style={{ '--x': spotlightPos.x, '--y': spotlightPos.y }}></div>
          <div className="spotlight-content">
            <Star size={60} color="#FCD34D" style={{ margin: '0 auto 2rem auto', opacity: 0.8 }} />
            <h2>The Future is Bright</h2>
            <p>Illuminate your path. Move the light to see what lies ahead.</p>
          </div>
        </section>

        {/* --- 7. QUOTE --- */}
        <section className="quote-section" onMouseMove={handleQuoteHover}>
          <div
            className="quote-container"
            style={{ transform: `rotateX(${quoteTilt.x}deg) rotateY(${quoteTilt.y}deg)` }}
          >
            <Quote size={40} className="quote-icon" />
            <h1
              className="quote-text"
              style={{
                textShadow: `${quoteTilt.y * 2}px ${quoteTilt.x * 2}px 10px rgba(0,0,0,0.2)`
              }}
            >
              "The tassel is worth the hassle."
            </h1>
          </div>
        </section>

        {/* --- 8. CELEBRATION (MINIMAL REDESIGN) --- */}
        <section
          className="celebration-section"
          onClick={(e) => createConfetti(e.clientX, e.clientY)}
        >
          <canvas ref={confettiCanvasRef} id="confettiCanvas"></canvas>

          <div className="minimal-content">
            <h1 className="minimal-heading">Congratulations</h1>
            <div className="minimal-divider"></div>

            {data?.message && (
              <p className="minimal-message">
                {data.message}
              </p>
            )}

            {data?.sender && (
              <div className="minimal-sender">
                — {data.sender}
              </div>
            )}

            <button className="minimal-btn" onClick={(e) => { e.stopPropagation(); window.location.reload(); }}>
              Replay Journey
            </button>
          </div>
        </section>

      </main>
    </>
  );
};

export default GraduationPage;

