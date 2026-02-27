import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import {
  Cloud,
  Music,
  Wind,
  Ruler,
  Footprints,
  Moon,
  Sun,
  Heart,
  Send,
  Baby,
  Gift,
  Play,
  Pause,
  Star,
  Smile,
  Users,
  Clock,
  Calendar,
  Sparkles
} from 'lucide-react';
import {
  getFirestore,
  doc,
  onSnapshot,
  collection,
  addDoc,
  serverTimestamp,
  query,
  orderBy,
  limit
} from 'firebase/firestore';
import {
  getAuth,
  signInWithCustomToken,
  signInAnonymously,
  onAuthStateChanged
} from 'firebase/auth';
import confetti from 'canvas-confetti';
import { db, auth } from '../../firebase';
import SongPlayer from '../../components/SongPlayer';
import { resolveCardId } from '../../utils/slugs';
import '../../components/SongPlayer.css';

// --- Firebase Setup ---
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

// --- Internal Components (Recreated for Single File) ---

// 1. Card Header
const CardViewHeader = ({ title, subtitle }) => (
  <div className="card-header">
    <div className="header-content">
      <Sparkles size={18} className="header-icon" />
      <div className="header-text">
        <div className="header-title">{title}</div>
        {subtitle && <div className="header-subtitle">{subtitle}</div>}
      </div>
    </div>
  </div>
);


// --- Main Application ---

const NewBabyPage = () => {
  const { id } = useParams();

  // State
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [started, setStarted] = useState(false);
  const [activeSection, setActiveSection] = useState(0);
  const [notification, setNotification] = useState(null);

  // Toy States
  const [isSleeping, setIsSleeping] = useState(true);
  const [wishText, setWishText] = useState('');
  const [wishes, setWishes] = useState([]);

  // Refs
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const mobileRef = useRef({ rotation: 0, speed: 0.005 });
  const songRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // --- Data Fetching (no auth needed for public read access) ---
  useEffect(() => {
    // No authentication required
  }, []);

  useEffect(() => {
    if (!id) return;

    let unsubscribe = () => { };

    const setupSubscription = async () => {
      try {
        const result = await resolveCardId(id, 'new-babies', 'new-baby');

        if (result) {
          const realId = result.id;
          const docRef = doc(db, 'new-babies', realId);

          unsubscribe = onSnapshot(docRef, (snapshot) => {
            if (snapshot.exists()) {
              setData(snapshot.data());
            } else {
              // Fallback Data
              setData({
                babyName: "Leo Alexander",
                parents: "Sarah & Mike",
                birthDate: new Date().toISOString(),
                weight: "7lbs 4oz",
                height: "20 inches",
                message: "We are over the moon to welcome our little one.",
                sender: "The Thompson Family",
                song: "dummy-url"
              });
            }
            setLoading(false);
          }, (error) => {
            console.error("Data fetch error", error);
            // Ensure UI still loads on error
            setLoading(false);
            setData({
              babyName: "Baby",
              parents: "Proud Parents",
              birthDate: new Date().toISOString(),
              weight: "TBD",
              height: "TBD",
              message: "Welcome to the world!",
              sender: "Family"
            });
          });
        } else {
          setLoading(false);
        }
      } catch (error) {
        console.error("Error resolving new-baby card:", error);
        setLoading(false);
      }
    };

    setupSubscription();

    return () => unsubscribe();
  }, [id]);

  // --- Scroll Logic ---
  const handleScroll = () => {
    if (!containerRef.current) return;
    const scrollPos = containerRef.current.scrollTop;
    const height = window.innerHeight;
    const sectionIndex = Math.round(scrollPos / height);
    if (sectionIndex !== activeSection) {
      setActiveSection(sectionIndex);
      triggerSectionAnimation(sectionIndex);
    }
  };

  const triggerSectionAnimation = (index) => {
    if (index === 4) { // Mobile Section
      mobileRef.current.speed = 0.05;
    }
    if (index === 1) { // Name reveal
      confetti({
        particleCount: 80,
        spread: 100,
        origin: { y: 0.6 },
        colors: ['#A7C7E7', '#FADADD', '#FFFFFF'],
        disableForReducedMotion: true
      });
    }
  };

  // --- Canvas Animation (The Mobile) ---
  useEffect(() => {
    if (!started || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    const resize = () => {
      const parent = canvas.parentElement;
      if (parent) {
        canvas.width = parent.offsetWidth;
        canvas.height = parent.offsetHeight;
      }
    };
    window.addEventListener('resize', resize);
    resize();

    const drawMobile = () => {
      if (!ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const cx = canvas.width / 2;
      const cy = canvas.height / 3;

      mobileRef.current.rotation += mobileRef.current.speed;
      mobileRef.current.speed = Math.max(0.005, mobileRef.current.speed * 0.98);

      ctx.save();
      ctx.translate(cx, cy);

      // Main String
      ctx.beginPath();
      ctx.moveTo(0, -100);
      ctx.lineTo(0, 0);
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#8FAAC1'; // Soft Blue Grey
      ctx.stroke();

      ctx.rotate(mobileRef.current.rotation);

      // Arms
      for (let i = 0; i < 3; i++) {
        ctx.save();
        ctx.rotate((i * Math.PI * 2) / 3);

        // Arm
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(100, 0);
        ctx.strokeStyle = '#8FAAC1';
        ctx.lineWidth = 2;
        ctx.stroke();

        // String down
        ctx.beginPath();
        ctx.moveTo(100, 0);
        ctx.lineTo(100, 50 + Math.sin(Date.now() / 1000 + i) * 10);
        ctx.strokeStyle = 'rgba(143, 170, 193, 0.5)';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Shapes
        ctx.translate(100, 50 + Math.sin(Date.now() / 1000 + i) * 10);

        // Draw Shapes based on index
        ctx.fillStyle = i === 0 ? '#FADADD' : i === 1 ? '#A7C7E7' : '#FDFD96'; // Pastel Pink, Blue, Yellow
        ctx.shadowColor = 'rgba(0,0,0,0.1)';
        ctx.shadowBlur = 10;

        ctx.beginPath();
        if (i === 0) { // Circle
          ctx.arc(0, 0, 20, 0, Math.PI * 2);
        } else if (i === 1) { // Star-ish (Diamond)
          ctx.moveTo(0, -20);
          ctx.lineTo(15, 0);
          ctx.lineTo(0, 20);
          ctx.lineTo(-15, 0);
          ctx.closePath();
        } else { // Cloud-ish (3 circles)
          ctx.arc(-10, 0, 15, 0, Math.PI * 2);
          ctx.arc(10, 0, 15, 0, Math.PI * 2);
          ctx.arc(0, -10, 15, 0, Math.PI * 2);
        }
        ctx.fill();

        ctx.restore();
      }
      ctx.restore();

      animationFrameId = requestAnimationFrame(drawMobile);
    };

    drawMobile();
    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [started]);

  const spinMobile = () => {
    mobileRef.current.speed = 0.1;
  };

  // --- Actions ---
  const handleStart = () => {
    setStarted(true);
    confetti({
      particleCount: 150,
      spread: 120,
      origin: { y: 0.8 },
      colors: ['#A7C7E7', '#FADADD', '#FFFDD0']
    });
  };

  const notify = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleSqueak = () => {
    notify("Squeak! Squeak! 🧸");
    // Add visual bounce class logic if needed, but CSS active state handles it
  };

  const handleSendWish = async () => {
    if (!wishText.trim()) return;

    // Optimistic Update
    setWishes(prev => [...prev, wishText]);
    const textToSend = wishText;
    setWishText("");
    notify("Wish sent to the stars! ✨");

    if (id) {
      try {
        // Strict Path: /artifacts/{appId}/public/data/new-babies/{id}/wishes
        // Note: Using subcollection for public guestbook
        const wishesRef = collection(db, 'artifacts', appId, 'public', 'data', 'new-babies', id, 'wishes');
        await addDoc(wishesRef, {
          text: textToSend,
          createdAt: serverTimestamp(),
          author: "Guest"
        });
      } catch (e) {
        console.error("Error saving wish", e);
      }
    }
  };

  const toggleAudio = () => {
    if (songRef.current) {
      if (isPlaying) {
        songRef.current.pause();
      } else {
        songRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  // --- Render Helpers ---
  const birthDate = data?.birthDate ? new Date(data.birthDate) : new Date();
  const dateStr = birthDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  const timeStr = birthDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  // CSS as a constant string to be injected
  const styles = `
    @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@300;400;700&family=Quicksand:wght@400;600&display=swap');

    :root {
      --bg-sky: #E3F2FD;
      --bg-warm: #FFF3E0;
      --bg-night: #1a237e;
      --text-main: #455A64;
      --text-light: #78909C;
      --accent-blue: #81D4FA;
      --accent-pink: #F48FB1;
      --accent-gold: #FFD54F;
      --glass: rgba(255, 255, 255, 0.8);
      --glass-border: rgba(255, 255, 255, 0.9);
      --shadow-soft: 0 15px 35px rgba(100, 100, 111, 0.1);
      --shadow-float: 0 20px 40px rgba(0,0,0,0.1);
    }

    * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
    
    body {
      margin: 0;
      font-family: 'Quicksand', sans-serif;
      background: linear-gradient(135deg, var(--bg-sky) 0%, #FCE4EC 100%);
      color: var(--text-main);
      overflow: hidden;
    }

    /* --- Typography --- */
    h1 { font-family: 'Nunito', sans-serif; font-size: 2.8rem; margin: 0; font-weight: 700; color: #37474F; }
    h2 { font-family: 'Nunito', sans-serif; font-size: 1.8rem; color: #546E7A; margin-bottom: 0.5rem; }
    h3 { font-size: 1.4rem; margin: 0; color: #37474F; }
    p { font-size: 1.1rem; line-height: 1.7; color: var(--text-main); margin-top: 0.5rem; }
    .label { 
      text-transform: uppercase; 
      letter-spacing: 3px; 
      font-size: 0.75rem; 
      color: var(--text-light); 
      font-weight: 700; 
      margin-bottom: 1rem;
      display: block;
    }

    /* --- Layout --- */
    .scrolly-container {
      height: 100vh;
      width: 100vw;
      overflow-y: scroll;
      scroll-snap-type: y mandatory;
      scroll-behavior: smooth;
    }

    .section {
      height: 100vh;
      width: 100vw;
      scroll-snap-align: start;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      position: relative;
      padding: 20px;
      text-align: center;
      transition: background 1s ease;
    }

    .section-content {
      background: var(--glass);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      padding: 3rem;
      border-radius: 40px;
      box-shadow: var(--shadow-soft);
      border: 1px solid var(--glass-border);
      max-width: 90%;
      width: 550px;
      position: relative;
      z-index: 10;
      transition: transform 0.4s ease, opacity 0.4s ease;
    }
    
    /* Hover lift effect for desktop */
    @media (hover: hover) {
        .section-content:hover {
            transform: translateY(-5px);
            box-shadow: var(--shadow-float);
        }
    }

    /* --- Animations --- */
    @keyframes float {
      0% { transform: translateY(0px); }
      50% { transform: translateY(-15px); }
      100% { transform: translateY(0px); }
    }
    .float-anim { animation: float 6s ease-in-out infinite; }

    @keyframes pulse-ring {
      0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(129, 212, 250, 0.7); }
      70% { transform: scale(1); box-shadow: 0 0 0 20px rgba(129, 212, 250, 0); }
      100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(129, 212, 250, 0); }
    }

    /* --- Interactive Components --- */
    
    /* Buttons */
    .btn-primary {
      background: linear-gradient(135deg, var(--accent-blue), #4FC3F7);
      border: none;
      padding: 1.2rem 3.5rem;
      border-radius: 50px;
      font-size: 1.1rem;
      font-weight: 700;
      color: white;
      cursor: pointer;
      box-shadow: 0 8px 20px rgba(129, 212, 250, 0.4);
      transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      font-family: 'Quicksand', sans-serif;
      display: inline-flex;
      align-items: center;
      gap: 10px;
    }
    .btn-primary:hover {
      transform: scale(1.05) translateY(-2px);
      box-shadow: 0 12px 25px rgba(129, 212, 250, 0.5);
    }
    .btn-primary:active { transform: scale(0.95); }

    /* Card Header */
    .card-header {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      padding: 20px;
      display: flex;
      justify-content: center;
      pointer-events: none;
      z-index: 999;
    }
    .header-content {
      background: rgba(255, 255, 255, 0.9);
      backdrop-filter: blur(8px);
      padding: 8px 20px;
      border-radius: 30px;
      display: flex;
      align-items: center;
      gap: 10px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.05);
    }
    .header-text { text-align: left; }
    .header-title { font-size: 0.9rem; font-weight: 700; color: #37474F; }
    .header-subtitle { font-size: 0.75rem; color: #90A4AE; }
    .header-icon { color: var(--accent-gold); }

    /* Name Reveal */
    .char-reveal {
      display: inline-block;
      opacity: 0;
      transform: translateY(20px) scale(0.8);
      animation: reveal 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
    }
    @keyframes reveal { 
      to { opacity: 1; transform: translateY(0) scale(1); } 
    }

    /* Ruler */
    .ruler-container {
      display: flex;
      align-items: flex-end;
      height: 160px;
      gap: 15px;
      justify-content: center;
      margin: 30px 0;
    }
    .ruler-bar {
      width: 30px;
      border-radius: 15px 15px 0 0;
      transition: height 1.5s cubic-bezier(0.22, 1, 0.36, 1);
      height: 0;
      position: relative;
    }
    .ruler-bar::after {
        content: '';
        position: absolute;
        top: 10px; left: 5px; right: 5px; height: 4px;
        background: rgba(255,255,255,0.3);
        border-radius: 2px;
    }

    /* Feet */
    .feet-container {
        display: flex; 
        gap: 30px; 
        justify-content: center; 
        margin: 20px 0;
    }
    .foot-icon {
        color: var(--accent-pink);
        opacity: 0;
        transition: all 0.8s ease;
    }

    /* Sleep Toggle */
    .sleep-toggle {
        width: 90px;
        height: 50px;
        background: #E0E0E0;
        border-radius: 50px;
        position: relative;
        cursor: pointer;
        transition: background 0.4s ease;
        margin: 0 auto;
        box-shadow: inset 0 2px 4px rgba(0,0,0,0.1);
    }
    .sleep-toggle.night { background: #304FFE; }
    .sleep-knob {
        width: 42px;
        height: 42px;
        background: white;
        border-radius: 50%;
        position: absolute;
        top: 4px;
        left: 4px;
        transition: transform 0.4s cubic-bezier(0.68, -0.6, 0.32, 1.6);
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 2px 5px rgba(0,0,0,0.2);
    }
    .sleep-toggle.night .sleep-knob { transform: translateX(40px); }

    /* Teddy Button */
    .teddy-btn {
        background: #D7CCC8;
        width: 120px;
        height: 120px;
        border-radius: 50%;
        border: 4px solid #fff;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 10px 20px rgba(93, 64, 55, 0.2);
        transition: transform 0.1s;
        margin: 0 auto;
    }
    .teddy-btn:active { transform: scale(0.9); }
    .teddy-btn svg { color: #5D4037; }

    /* Wishes */
    .wish-list {
        max-height: 120px;
        overflow-y: auto;
        text-align: left;
        margin-bottom: 20px;
        padding-right: 5px;
    }
    .wish-item {
        background: rgba(255,255,255,0.5);
        padding: 8px 12px;
        border-radius: 12px;
        margin-bottom: 8px;
        font-size: 0.9rem;
        display: flex;
        align-items: center;
        gap: 8px;
    }
    .wish-input-group {
        position: relative;
        display: flex;
        gap: 10px;
    }
    .wish-input {
        flex: 1;
        padding: 12px 20px;
        border-radius: 25px;
        border: 2px solid #EEE;
        font-family: inherit;
        outline: none;
        transition: border-color 0.3s;
    }
    .wish-input:focus { border-color: var(--accent-blue); }
    .btn-send {
        width: 46px;
        height: 46px;
        border-radius: 50%;
        border: none;
        background: var(--accent-blue);
        color: white;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: transform 0.2s;
    }
    .btn-send:hover { transform: scale(1.1); }

    /* Notification */
    .toast {
        position: fixed;
        bottom: 30px;
        left: 50%;
        transform: translateX(-50%);
        background: #37474F;
        color: white;
        padding: 12px 24px;
        border-radius: 30px;
        z-index: 2000;
        animation: fadeUp 0.3s forwards;
        box-shadow: 0 10px 20px rgba(0,0,0,0.2);
        font-weight: 600;
    }
    @keyframes fadeUp { from { opacity: 0; transform: translate(-50%, 20px); } to { opacity: 1; transform: translate(-50%, 0); } }

    /* Responsive */
    @media (max-width: 768px) {
        h1 { font-size: 2.2rem; }
        .section-content { width: 90%; padding: 2rem; }
        .ruler-container { height: 120px; }
    }
  `;

  // --- Loading Screen ---
  if (loading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#E3F2FD', flexDirection: 'column', gap: '20px' }}>
        <style>{styles}</style>
        <div className="spinning" style={{ width: 40, height: 40, border: '4px solid #81D4FA', borderTopColor: 'transparent', borderRadius: '50%' }}></div>
        <p style={{ color: '#78909C' }}>Preparing the nursery...</p>
      </div>
    );
  }

  // --- Welcome "Airlock" Screen ---
  if (!started) {
    return (
      <>
        <style>{styles}</style>
        <CardViewHeader title="Special Delivery" subtitle="Tap to open" />
        <div className="section" style={{ background: 'linear-gradient(135deg, #E3F2FD 0%, #F3E5F5 100%)' }}>
          <div className="section-content float-anim">
            <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'center' }}>
              <Cloud size={80} color="#81D4FA" fill="#E1F5FE" />
            </div>
            <h1>Hello, World.</h1>
            <p style={{ marginBottom: '2.5rem', opacity: 0.8 }}>
              A new adventure has begun.<br />
              <span style={{ fontSize: '0.9rem' }}>Sound on recommended.</span>
            </p>
            <button className="btn-primary" onClick={handleStart}>
              <Smile size={20} /> Meet the Baby
            </button>
          </div>
        </div>
      </>
    );
  }

  // --- Main Scrollytelling View ---
  return (
    <>
      <style>{styles}</style>
      <SongPlayer song={data?.song ? (typeof data.song === 'string' ? { previewUrl: data.song } : data.song) : null} />

      <div className="scrolly-container" ref={containerRef} onScroll={handleScroll}>

        {/* --- SECTION 1: INTRO / NAME --- */}
        <div className="section" style={{ background: 'linear-gradient(135deg, #E3F2FD 0%, #F3E5F5 100%)' }}>
          <div className="section-content">
            <span className="label">Introducing</span>
            <div style={{ marginBottom: '1rem' }}>
              {data.babyName.split('').map((char, i) => (
                <span key={i} className="char-reveal" style={{ animationDelay: `${i * 0.1}s`, fontSize: '3.5rem', fontFamily: 'Nunito', fontWeight: 800, color: '#37474F' }}>
                  {char === ' ' ? '\u00A0' : char}
                </span>
              ))}
            </div>
            <p>Born to {data.parents}</p>
            <p style={{ fontSize: '0.9rem', color: '#90A4AE' }}>{dateStr} • {timeStr}</p>
          </div>
        </div>

        {/* --- SECTION 3: FEET / PRINTS --- */}
        <div className="section" style={{ background: '#FCE4EC' }}>
          <div className="section-content">
            <span className="label">Tiny Steps</span>
            <div className="feet-container">
              <Footprints size={80} className="foot-icon" style={{ opacity: activeSection >= 2 ? 1 : 0, transform: activeSection >= 2 ? 'rotate(-10deg)' : 'translateY(20px)' }} />
              <Footprints size={80} className="foot-icon" style={{ opacity: activeSection >= 2 ? 1 : 0, transform: activeSection >= 2 ? 'rotate(10deg)' : 'translateY(20px)', transitionDelay: '0.3s' }} />
            </div>
            <p>Ten little fingers, ten little toes.</p>
            <p>The sweetest smile, and a button nose.</p>
          </div>
        </div>

        {/* --- SECTION 4: SLEEP / NIGHT MODE --- */}
        <div className="section" style={{ background: isSleeping ? '#1a237e' : '#FFF3E0', transition: 'background 1s ease' }}>
          <div className="section-content" style={{ background: isSleeping ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.8)', color: isSleeping ? 'white' : 'inherit' }}>
            <span className="label" style={{ color: isSleeping ? 'rgba(255,255,255,0.7)' : 'inherit' }}>Dream Big</span>

            <div style={{ margin: '30px 0' }}>
              {isSleeping ? <Moon size={60} color="#FFD54F" /> : <Sun size={60} color="#FF9800" />}
            </div>

            <div className={`sleep-toggle ${isSleeping ? 'night' : ''}`} onClick={() => setIsSleeping(!isSleeping)}>
              <div className="sleep-knob">
                {isSleeping ? <Moon size={16} color="#304FFE" /> : <Sun size={16} color="#FF9800" />}
              </div>
            </div>

            <p style={{ marginTop: '20px', color: isSleeping ? 'white' : 'inherit' }}>
              {isSleeping ? "Shhh... baby is sleeping." : "Rise and shine!"}
            </p>
          </div>
        </div>

        {/* --- SECTION 5: MOBILE TOY --- */}
        <div className="section" style={{ background: '#E1F5FE' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1 }}>
            <canvas ref={canvasRef} style={{ width: '100%', height: '100%' }} />
          </div>
          <div className="section-content" style={{ zIndex: 2 }}>
            <span className="label">Playtime</span>
            <p>Spin the mobile to entertain.</p>
            <button className="btn-primary" onClick={spinMobile} style={{ marginTop: '1rem' }}>
              <Wind size={20} /> Spin
            </button>
          </div>
        </div>

        {/* --- SECTION 6: INTERACTIVE TEDDY --- */}
        <div className="section" style={{ background: '#EFEBE9' }}>
          <div className="section-content">
            <span className="label">Cuddles</span>
            <div className="teddy-btn" onClick={handleSqueak}>
              <Baby size={60} />
            </div>
            <p style={{ marginTop: '20px' }}>Tap the teddy for a squeak!</p>
          </div>
        </div>

        {/* --- SECTION 7: WISHES / GUESTBOOK --- */}
        <div className="section" style={{ background: 'linear-gradient(135deg, #F3E5F5 0%, #E1F5FE 100%)' }}>
          <div className="section-content">
            <span className="label">Wishes for Baby</span>

            <div className="wish-list">
              {wishes.length === 0 && <p style={{ fontSize: '0.9rem', color: '#999', fontStyle: 'italic' }}>Be the first to send a wish...</p>}
              {wishes.map((w, i) => (
                <div key={i} className="wish-item">
                  <Star size={14} color="#FFD54F" fill="#FFD54F" /> {w}
                </div>
              ))}
            </div>

            <div className="wish-input-group">
              <input
                className="wish-input"
                placeholder="Type a wish..."
                value={wishText}
                onChange={(e) => setWishText(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendWish()}
              />
              <button className="btn-send" onClick={handleSendWish}>
                <Send size={20} />
              </button>
            </div>
          </div>
        </div>

        {/* --- SECTION 8: MESSAGE & FOOTER --- */}
        <div className="section" style={{ background: '#FFF' }}>
          <div className="section-content">
            <span className="label">From the Family</span>
            <div style={{ fontSize: '3rem', color: '#F48FB1', marginBottom: '1rem' }}>❝</div>
            <p style={{ fontSize: '1.3rem', fontStyle: 'italic', marginBottom: '2rem' }}>
              {data.message}
            </p>
            <p style={{ fontWeight: 700 }}>With Love,<br />{data.sender}</p>

            <div style={{ marginTop: '3rem', opacity: 0.5, fontSize: '0.8rem' }}>
              <Gift size={16} style={{ marginBottom: '5px' }} /><br />
              Welcome to the world, little one.
            </div>
          </div>
        </div>

        {/* Notification Toast */}
        {notification && (
          <div className="toast">
            {notification}
          </div>
        )}

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

export default NewBabyPage;


