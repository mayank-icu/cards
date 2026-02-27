import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { getAuth, signInWithCustomToken, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, onSnapshot, collection } from 'firebase/firestore';
import confetti from 'canvas-confetti';
import {
  Trophy,
  Hand,
  PartyPopper,
  Music,
  Award,
  Volume2,
  VolumeX,
  Wine,
  Play,
  Pause,
  ArrowLeft
} from 'lucide-react';
import { db, auth } from '../../firebase';
import { resolveCardId } from '../../utils/slugs';
import CardFooter from '../../components/CardFooter';

// --- FIREBASE SETUP ---
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

// --- CUSTOM CSS STYLES (Light Theme & Interactive) ---
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=Inter:wght@300;400;600&display=swap');

  :root {
    --bg-primary: #FAFAF9; /* Warm White/Cream */
    --bg-secondary: #FFFFFF;
    --text-primary: #1C1917;
    --text-secondary: #57534E;
    --gold: #D4AF37;
    --gold-light: #F3E5AB;
    --gold-dark: #8A6D0B;
    --accent: #E11D48; /* Festive Red accent for confetti */
    --ease-out: cubic-bezier(0.215, 0.61, 0.355, 1);
    --shadow-soft: 0 10px 40px -10px rgba(0,0,0,0.08);
    --shadow-hard: 0 4px 0px rgba(0,0,0,0.1);
  }

  * { box-sizing: border-box; }

  body, html {
    margin: 0;
    padding: 0;
    background-color: var(--bg-primary);
    color: var(--text-primary);
    font-family: 'Inter', sans-serif;
    overflow: hidden;
    height: 100%;
    width: 100%;
  }

  /* --- SCROLL SNAP LAYOUT --- */
  .scrolly-container {
    height: 100dvh;
    width: 100vw;
    overflow-y: scroll;
    scroll-snap-type: y mandatory;
    scroll-behavior: smooth;
    position: relative;
    scrollbar-width: none; 
    -ms-overflow-style: none;
  }
  .scrolly-container::-webkit-scrollbar { display: none; }

  section {
    height: 100dvh;
    width: 100%;
    scroll-snap-align: start;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    position: relative;
    padding: 2rem;
    text-align: center;
    background: var(--bg-primary);
    border-bottom: 1px solid rgba(0,0,0,0.05);
  }

  /* --- TYPOGRAPHY --- */
  h1, h2, h3 {
    font-family: 'Playfair Display', serif;
    margin: 0;
    line-height: 1.1;
  }

  .title-lg { 
    font-size: clamp(3rem, 8vw, 5.5rem); 
    color: var(--text-primary);
    background: linear-gradient(135deg, var(--text-primary) 30%, var(--gold-dark) 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }
  
  .title-md { 
    font-size: clamp(2rem, 5vw, 3.5rem); 
    color: var(--text-primary);
  }
  
  .subtitle { 
    font-family: 'Inter', sans-serif;
    font-weight: 300;
    font-size: 1.25rem;
    color: var(--text-secondary);
    margin-top: 1.5rem;
    max-width: 600px;
    line-height: 1.6;
  }

  /* --- UTILS --- */
  .gold-text { color: var(--gold-dark); }
  
  .btn-gold {
    background: var(--gold);
    color: white;
    border: none;
    padding: 1rem 3rem;
    font-weight: 600;
    text-transform: uppercase;
    font-family: 'Inter', sans-serif;
    letter-spacing: 1px;
    cursor: pointer;
    transition: all 0.3s var(--ease-out);
    font-size: 1.1rem;
    margin-top: 2.5rem;
    border-radius: 50px;
    box-shadow: 0 4px 15px rgba(212, 175, 55, 0.4);
  }
  .btn-gold:hover { 
    transform: translateY(-2px) scale(1.05);
    box-shadow: 0 8px 25px rgba(212, 175, 55, 0.6);
  }
  .btn-gold:active { transform: scale(0.95); }

  /* --- COMPONENTS --- */

  /* Header */
  .header-ui {
    position: fixed;
    top: 0; left: 0; width: 100%;
    padding: 1rem 1.5rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    z-index: 100;
    background: rgba(250, 250, 249, 0.85);
    backdrop-filter: blur(10px);
    border-bottom: 1px solid rgba(0,0,0,0.05);
  }

  /* Music Player */
  .mini-player {
    background: white;
    padding: 0.5rem 1rem;
    border-radius: 30px;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    box-shadow: var(--shadow-soft);
    border: 1px solid rgba(0,0,0,0.05);
    cursor: pointer;
    transition: transform 0.2s;
  }
  .mini-player:hover { transform: scale(1.02); }

  /* Airlock */
  .airlock-overlay {
    position: fixed;
    top: 0; left: 0; width: 100%; height: 100%;
    background: #fff;
    z-index: 9999;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    transition: transform 1s var(--ease-out);
  }
  .airlock-overlay.open { transform: translateY(-100%); }

  /* Wall of Fame */
  .frame-gold {
    position: relative;
    border: 1px solid var(--gold);
    padding: 4rem 2rem;
    background: white;
    box-shadow: 
      0 0 0 10px white,
      0 0 0 12px var(--gold),
      var(--shadow-soft);
    transform: rotate(-2deg);
    transition: all 0.5s var(--ease-out);
    max-width: 90%;
  }
  .frame-gold:hover { transform: rotate(0deg) scale(1.02); }
  .frame-gold::before {
    content: '★';
    position: absolute;
    top: -25px; left: 50%;
    transform: translateX(-50%);
    font-size: 2rem;
    color: var(--gold);
    background: white;
    padding: 0 10px;
  }

  /* High Five */
  .hand-icon {
    transition: transform 0.2s;
    cursor: pointer;
    filter: drop-shadow(0 4px 0 #E5E7EB);
  }
  .hand-icon:hover { transform: scale(1.1); }
  .hand-icon.slapped {
    animation: slap-shake 0.3s ease-in-out;
    color: var(--gold);
    filter: drop-shadow(0 0 15px var(--gold));
  }
  @keyframes slap-shake {
    0% { transform: scale(1) rotate(0); }
    50% { transform: scale(0.9) rotate(-15deg); }
    100% { transform: scale(1) rotate(0); }
  }

  /* Stat Bar */
  .progress-container {
    width: 80%;
    max-width: 500px;
    height: 24px;
    background: #E7E5E4; /* Stone-200 */
    margin-top: 3rem;
    border-radius: 12px;
    overflow: hidden;
    box-shadow: inset 0 2px 4px rgba(0,0,0,0.05);
  }
  .progress-fill {
    height: 100%;
    background: linear-gradient(90deg, var(--gold), var(--gold-light));
    width: 0%;
    transition: width 1.5s var(--ease-out);
    display: flex;
    align-items: center;
    justify-content: flex-end;
    padding-right: 10px;
    font-size: 0.8rem;
    font-weight: bold;
    color: var(--gold-dark);
  }

  /* Trophy Shine Interaction */
  .trophy-container {
    perspective: 1000px;
    cursor: pointer;
    position: relative;
    padding: 2rem;
  }
  
  .trophy-wrap {
    position: relative;
    display: inline-block;
    transition: transform 0.2s;
  }

  /* The Shine Effect */
  .trophy-wrap::after {
    content: '';
    position: absolute;
    top: 0;
    left: -150%;
    width: 100%;
    height: 100%;
    background: linear-gradient(
      to right,
      rgba(255, 255, 255, 0) 0%,
      rgba(255, 255, 255, 0.8) 50%,
      rgba(255, 255, 255, 0) 100%
    );
    transform: skewX(-25deg);
    pointer-events: none;
  }
  
  .trophy-container:hover .trophy-wrap::after,
  .trophy-container:active .trophy-wrap::after {
    animation: shine-swipe 1s ease-in-out forwards;
  }
  
  @keyframes shine-swipe {
    0% { left: -150%; opacity: 0; }
    50% { opacity: 1; }
    100% { left: 150%; opacity: 0; }
  }

  /* Speech */
  .speech-text { 
    font-size: clamp(3rem, 10vw, 7rem);
    opacity: 0.1;
    transition: opacity 0.3s, transform 0.3s;
    cursor: default;
    color: var(--text-primary);
  }
  .speech-text:hover { 
    opacity: 1; 
    transform: scale(1.1); 
    color: var(--gold-dark);
  }

  /* Champagne */
  .bubbles {
    position: absolute;
    bottom: 0; left: 0; width: 100%; height: 100%;
    pointer-events: none;
    z-index: 0;
  }
  .bubble {
    position: absolute;
    background: radial-gradient(circle at 30% 30%, white, var(--gold-light));
    border-radius: 50%;
    bottom: -20px;
    border: 1px solid rgba(212, 175, 55, 0.3);
    animation: rise 4s infinite ease-in;
  }
  @keyframes rise {
    0% { bottom: -20px; opacity: 0; transform: translateX(0); }
    20% { opacity: 0.8; }
    100% { bottom: 100%; opacity: 0; transform: translateX(30px); }
  }

  /* Fireworks Canvas */
  #fireworks-canvas {
    position: absolute;
    top: 0; left: 0;
    width: 100%; height: 100%;
    cursor: crosshair;
    z-index: 10;
  }

  /* Loading */
  .loader {
    width: 48px; height: 48px;
    border: 3px solid #E5E7EB;
    border-bottom-color: var(--gold);
    border-radius: 50%;
    animation: rotation 1s linear infinite;
  }
  @keyframes rotation { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }

  /* Audio/Memory Card */
  .memory-card {
    background: white;
    padding: 1rem;
    border-radius: 12px;
    box-shadow: var(--shadow-soft);
    transform: rotate(3deg);
    border: 1px solid rgba(0,0,0,0.05);
    max-width: 90%;
  }

  /* Badge Section */
  .badge-container {
    background: white;
    border-radius: 50%;
    width: 200px;
    height: 200px;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 20px 50px rgba(0,0,0,0.1);
    margin-bottom: 2rem;
    border: 8px solid var(--gold-light);
    animation: pulse-gold 3s infinite ease-in-out;
  }
  @keyframes pulse-gold {
    0% { box-shadow: 0 0 0 0 rgba(212, 175, 55, 0.4); }
    70% { box-shadow: 0 0 0 20px rgba(212, 175, 55, 0); }
    100% { box-shadow: 0 0 0 0 rgba(212, 175, 55, 0); }
  }
`;

/**
 * UTILITY: Random Number
 */
const random = (min, max) => Math.random() * (max - min) + min;

/**
 * INTERNAL COMPONENT: CardViewHeader
 * Replaces external dependency
 */
const CardViewHeader = ({ title, subtitle }) => (
  <div className="header-ui">
    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
      <button
        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
        onClick={() => window.history.back()}
      >
        <ArrowLeft size={24} color="#57534E" />
      </button>
      <div>
        <div style={{ fontWeight: 'bold', fontSize: '0.9rem', color: '#1C1917' }}>{title}</div>
        {subtitle && <div style={{ fontSize: '0.75rem', color: '#78716C' }}>{subtitle}</div>}
      </div>
    </div>
  </div>
);

/**
 * INTERNAL COMPONENT: SongPlayer
 * Replaces external dependency
 */
const SongPlayer = ({ song }) => {
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef(null);

  useEffect(() => {
    if (song && playing) {
      audioRef.current?.play().catch(() => setPlaying(false));
    } else {
      audioRef.current?.pause();
    }
  }, [playing, song]);

  // Auto-play attempt on mount if song exists
  useEffect(() => {
    if (song) {
      setPlaying(true);
    }
  }, [song]);

  if (!song) return null;

  return (
    <div style={{ position: 'fixed', top: '1rem', right: '1.5rem', zIndex: 101 }}>
      <audio ref={audioRef} src={song} loop />
      <button className="mini-player" onClick={() => setPlaying(!playing)}>
        {playing ? <Pause size={16} fill="black" /> : <Play size={16} fill="black" />}
        <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>
          {playing ? 'Playing' : 'Play Music'}
        </span>
      </button>
    </div>
  );
};

/**
 * COMPONENT: Fireworks Logic (Canvas)
 */
const FireworksCanvas = () => {
  const canvasRef = useRef(null);
  const particles = useRef([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', resize);
    resize();

    const createParticle = (x, y) => {
      const particleCount = 40;
      for (let i = 0; i < particleCount; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 6 + 2;
        particles.current.push({
          x, y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 120,
          // Darker/More vivid colors for light theme visibility
          color: `hsl(${Math.random() * 50 + 10}, 80%, 40%)`
        });
      }
    };

    canvas.addEventListener('click', (e) => {
      const rect = canvas.getBoundingClientRect();
      createParticle(e.clientX - rect.left, e.clientY - rect.top);
    });

    const loop = () => {
      // Clear with fade effect (light trail)
      ctx.fillStyle = 'rgba(250, 250, 249, 0.2)'; // Match bg color with opacity
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      particles.current.forEach((p, index) => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.15; // heavier gravity
        p.life--;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
        ctx.fill();
        if (p.life <= 0) particles.current.splice(index, 1);
      });

      animationFrameId = requestAnimationFrame(loop);
    };
    loop();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return <canvas id="fireworks-canvas" ref={canvasRef} />;
};

/**
 * MAIN PAGE COMPONENT
 */
const CongratulationsPage = () => {
  // Use 'test-id' if no param is present for preview purposes, or handle appropriately
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [started, setStarted] = useState(false);

  // Section States
  const [progress, setProgress] = useState(0);
  const [slapped, setSlapped] = useState(false);
  const [trophyRot, setTrophyRot] = useState({ x: 0, y: 0 });
  const [applauseLevel, setApplauseLevel] = useState('light');

  // Refs
  const statRef = useRef(null);

  // 1. Data Fetch (no auth needed for public read access)
  useEffect(() => {
    // No authentication required
  }, []);

  useEffect(() => {
    if (!id) return;

    let unsubscribe = () => { };

    const setupSubscription = async () => {
      try {
        const result = await resolveCardId(id, 'congratulations', 'congratulations');

        if (result) {
          const realId = result.id;
          const cardRef = doc(db, 'congratulations', realId);

          unsubscribe = onSnapshot(cardRef, (snapshot) => {
            if (snapshot.exists()) {
              setData(snapshot.data());
            } else {
              // Mock data for PREVIEW ONLY
              setData({
                recipient: "Alex",
                sender: "The Team",
                song: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
                achievement: "Quarterly Excellence",
                message: "You absolutely crushed the goals this quarter. We are so proud of your dedication and hard work!",
                imageUrl: null,
                audioUrl: null
              });
            }
            setLoading(false);
          }, (error) => {
            console.error("Error fetching card:", error);
            setLoading(false);
          });
        } else {
          setLoading(false);
        }
      } catch (error) {
        console.error("Error resolving congratulations card:", error);
        setLoading(false);
      }
    };

    setupSubscription();

    return () => unsubscribe();
  }, [id]);

  // Observer for "Level Up" bar
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          setTimeout(() => setProgress(100), 500);
        } else {
          setProgress(0);
        }
      });
    }, { threshold: 0.5 });

    if (statRef.current) observer.observe(statRef.current);
    return () => observer.disconnect();
  }, [loading]);

  // Trophy Interaction
  const handleTrophyMove = (e) => {
    const { clientX, clientY, currentTarget } = e;
    const { left, top, width, height } = currentTarget.getBoundingClientRect();
    // Subtle movement
    const x = (clientX - left - width / 2) / 25;
    const y = (clientY - top - height / 2) / 25;
    setTrophyRot({ x: -y, y: x });
  };

  // High Five Interaction
  const handleHighFive = () => {
    if (slapped) return;
    setSlapped(true);
    if (navigator.vibrate) navigator.vibrate([50, 30, 50]);
    setTimeout(() => setSlapped(false), 500);
  };

  // Popper Action
  const popConfetti = () => {
    const colors = ['#D4AF37', '#E11D48', '#FAFAF9'];
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: colors
    });
    // Secondary burst
    setTimeout(() => {
      confetti({
        particleCount: 50,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: colors
      });
      confetti({
        particleCount: 50,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: colors
      });
    }, 200);
  };

  if (loading) return (
    <div style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#FAFAF9' }}>
      <style>{styles}</style>
      <div className="loader"></div>
    </div>
  );
  // Fallback if strictly no data found (and no mock used)
  if (!data) return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', background: '#FAFAF9' }}>
      <style>{styles}</style>
      <h2 className="title-md">Card Not Found</h2>
      <p className="subtitle">The celebration you are looking for might have expired.</p>
    </div>
  );
  return (
    <>
      <style>{styles}</style>

      {/* --- AIRLOCK (START SCREEN) --- */}
      <div className={`airlock-overlay ${started ? 'open' : ''}`}>
        <Award size={64} color="var(--gold)" style={{ marginBottom: '2rem' }} />
        <h1 className="title-lg" style={{ fontSize: '3rem' }}>Victory Gold</h1>
        <p className="subtitle">A celebration for {data.recipient}</p>
        <button className="btn-gold" onClick={() => setStarted(true)}>
          Enter Experience
        </button>
      </div>

      <SongPlayer song={started ? data.song : null} />

      {/* --- MAIN SCROLL CONTAINER --- */}
      <div className="scrolly-container">

        {/* 1. THE POPPER */}
        <section>
          <PartyPopper size={100} color="var(--text-primary)" strokeWidth={1} />
          <h2 className="title-md" style={{ marginTop: '2rem' }}>Let's Start!</h2>
          <p className="subtitle">Something amazing just happened.</p>
          <button className="btn-gold" onClick={popConfetti}>Pop Confetti</button>
        </section>

        {/* 2. WALL OF FAME */}
        <section>
          <div className="frame-gold">
            <h1 className="title-lg" style={{ lineHeight: 0.9 }}>{data.recipient}</h1>
            <div style={{ marginTop: '1rem', borderTop: '2px solid var(--gold)', width: '50px', margin: '1rem auto' }}></div>
            <div style={{ fontFamily: 'Playfair Display', fontStyle: 'italic', color: 'var(--text-secondary)' }}>
              Hall of Fame Inductee
            </div>
          </div>
        </section>

        {/* 3. THE STAT (Level Up) */}
        <section ref={statRef}>
          <h2 className="title-md">Status Update</h2>
          <div className="progress-container">
            <div className="progress-fill" style={{ width: `${progress}%` }}>
              {progress === 100 && <span style={{ marginRight: '1rem' }}>MAX LEVEL REACHED</span>}
            </div>
          </div>
          <p className="subtitle">Awesomeness Capacity</p>
        </section>

        {/* 4. THE TROPHY */}
        <section onMouseMove={handleTrophyMove} className="trophy-container">
          <div
            className="trophy-wrap"
            style={{
              transform: `rotateX(${trophyRot.x}deg) rotateY(${trophyRot.y}deg)`,
              display: 'inline-block'
            }}
          >
            <Trophy size={220} color="var(--gold)" strokeWidth={1} fill="rgba(212, 175, 55, 0.1)" />
          </div>
          <h2 className="title-md" style={{ fontSize: '2rem', marginTop: '2rem' }}>Solid Gold</h2>
          <p className="subtitle" style={{ marginTop: '0.5rem' }}>Touch or hover to see it shine</p>
        </section>

        {/* 5. CHAMPAGNE */}
        <section style={{ overflow: 'hidden' }}>
          <div className="bubbles">
            {Array.from({ length: 25 }).map((_, i) => (
              <div
                key={i}
                className="bubble"
                style={{
                  left: `${random(0, 100)}%`,
                  width: `${random(15, 40)}px`,
                  height: `${random(15, 40)}px`,
                  animationDelay: `${random(0, 4)}s`,
                  animationDuration: `${random(3, 7)}s`
                }}
              />
            ))}
          </div>
          <Wine size={120} color="var(--text-primary)" strokeWidth={1} />
          <h2 className="title-md" style={{ marginTop: '1rem' }}>Cheers!</h2>
          <p className="subtitle">Here's to your success.</p>
        </section>

        {/* 6. HIGH FIVE */}
        <section>
          <div style={{
            background: slapped ? 'var(--gold-light)' : 'white',
            borderRadius: '50%',
            padding: '3rem',
            transition: 'background 0.3s',
            boxShadow: 'var(--shadow-soft)'
          }}>
            <Hand
              size={120}
              className={`hand-icon ${slapped ? 'slapped' : ''}`}
              onClick={handleHighFive}
              color={slapped ? "var(--gold-dark)" : "var(--text-primary)"}
              strokeWidth={1.5}
            />
          </div>
          <h2 className="title-md" style={{ marginTop: '2rem' }}>High Five!</h2>
          <p className="subtitle">{slapped ? "Nice slap!" : "Don't leave me hanging"}</p>
        </section>

        {/* 7. FIREWORKS */}
        <section>
          <FireworksCanvas />
          <div style={{ position: 'relative', zIndex: 20, pointerEvents: 'none' }}>
            <h2 className="title-md">Celebration Mode</h2>
            <p className="subtitle">Tap anywhere on screen</p>
          </div>
        </section>

        {/* 8. THE SPEECH */}
        <section>
          <h1 className="title-lg speech-text">SPEECH!</h1>
          <h1 className="title-lg speech-text" style={{ color: 'var(--gold)' }}>SPEECH!</h1>
          <h1 className="title-lg speech-text">SPEECH!</h1>
        </section>

        {/* 9. APPLAUSE */}
        <section>
          <div style={{ display: 'flex', gap: '3rem', marginBottom: '3rem' }}>
            <div style={{ textAlign: 'center' }}>
              <Volume2
                size={60}
                color={applauseLevel === 'light' ? 'var(--gold)' : '#A8A29E'}
                onClick={() => setApplauseLevel('light')}
                style={{ cursor: 'pointer', transition: 'transform 0.2s' }}
              />
              <p style={{ fontSize: '0.8rem', fontWeight: 'bold', marginTop: '0.5rem' }}>CLAP</p>
            </div>

            <div style={{ textAlign: 'center' }}>
              <VolumeX
                size={80}
                color={applauseLevel === 'ovation' ? 'var(--gold)' : '#A8A29E'}
                onClick={() => setApplauseLevel('ovation')}
                style={{ cursor: 'pointer', transition: 'transform 0.2s' }}
              />
              <p style={{ fontSize: '0.8rem', fontWeight: 'bold', marginTop: '0.5rem' }}>OVATION</p>
            </div>
          </div>

          <h2 className="title-md">
            {applauseLevel === 'light' ? "Polite Applause" : "STANDING OVATION"}
          </h2>
          <p className="subtitle">
            {applauseLevel === 'light' ? "A respectful nod." : "The crowd goes wild!"}
          </p>
        </section>

        {/* 10. MESSAGE */}
        <section>
          <div className="memory-card">
            <h3 style={{ marginBottom: '1rem', color: 'var(--gold-dark)' }}>A Note from the Team</h3>
            <p style={{ fontSize: '1.2rem', fontStyle: 'italic', color: 'var(--text-primary)' }}>
              "{data.message}"
            </p>
            <div style={{ marginTop: '2rem', fontWeight: 'bold', color: 'var(--text-secondary)' }}>
              - {data.sender}
            </div>
          </div>
        </section>

        <div style={{ display: 'flex', justifyContent: 'center', padding: '1rem 1rem 2rem' }}>
          <a
            href="/"
            target="_blank"
            rel="noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              textDecoration: 'none',
              padding: '0.45rem 0.7rem',
              borderRadius: '999px',
              background: 'rgba(0, 0, 0, 0.72)',
              border: '1px solid rgba(255, 255, 255, 0.14)',
              color: '#fff',
              fontSize: '0.78rem',
              fontWeight: 700,
              backdropFilter: 'blur(10px)'
            }}
          >
            <img src="/logo.webp" alt="EGreet" style={{ width: 16, height: 16, borderRadius: '50%' }} />
            <span>Made with EGreet. Create your own free card.</span>
          </a>
        </div>

      </div>
    </>
  );
};

export default CongratulationsPage;


