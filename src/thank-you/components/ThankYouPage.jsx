import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import {
    doc,
    onSnapshot
} from 'firebase/firestore';
import {
    signInAnonymously,
    signInWithCustomToken,
    onAuthStateChanged
} from 'firebase/auth';
import {
    Heart,
    Wind,
    Waves,
    ThermometerSun,
    Scale,
    Sparkles,
    PenTool,
    Volume2,
    VolumeX,
    Flower2,
    MoveDown,
    Mail,
    Fingerprint,
    Check,
    Music
} from 'lucide-react';

import { auth, db } from '../../firebase';
import CardViewHeader from '../../components/CardViewHeader';
import CardFooter from '../../components/CardFooter';
import SongPlayer from '../../components/SongPlayer';
import { normalizeCardData, resolveCardId } from '../../utils/slugs';

// --- HELPER: Background Languages ---
const BG_LANGUAGES = [
    "Merci", "Gracias", "Danke", "Grazie", "Arigato",
    "Obrigado", "Spasibo", "Xièxiè", "Gamsahamnida",
    "Dank u", "Takk", "Efharisto", "Shukran"
];

// --- COMPONENT: App ---
export default function App() {
    const { id } = useParams();
    // --- STATE ---
    const [user, setUser] = useState(null);
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [authReady, setAuthReady] = useState(false);

    // Interactive State
    const [audioPlaying, setAudioPlaying] = useState(false);
    const [envelopeOpen, setEnvelopeOpen] = useState(false);
    const [flowers, setFlowers] = useState([]);
    const [hugProgress, setHugProgress] = useState(0);
    const [isHugging, setIsHugging] = useState(false);
    const [balanced, setBalanced] = useState(false);
    const [activeSection, setActiveSection] = useState(0);

    // New Interactive States
    const [ripples, setRipples] = useState([]);
    const [warmthLevel, setWarmthLevel] = useState(0); // 0 to 100
    const [isFlipped, setIsFlipped] = useState(false); // Memory card flip
    const [fingerprintState, setFingerprintState] = useState('idle'); // idle, scanning, verified

    // Refs
    const hugInterval = useRef(null);
    const audioRef = useRef(null);
    const containerRef = useRef(null);

    // --- AUTH & DATA ---
    useEffect(() => {
        const initAuth = async () => {
            try {
                if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
                    await signInWithCustomToken(auth, __initial_auth_token);
                }
            } catch (err) {
                console.error("Auth error:", err);
                const code = err?.code;
                if (code !== 'auth/admin-restricted-operation' && code !== 'auth/operation-not-allowed') {
                    setError('Authentication failed');
                }
            } finally {
                setAuthReady(true);
            }
        };
        initAuth();

        return onAuthStateChanged(auth, (u) => {
            setUser(u);
            setAuthReady(true);
        });
    }, []);

    useEffect(() => {
        if (!authReady) return;

        if (!id) {
            setError('No Thank You ID provided in URL');
            setLoading(false);
            return;
        }

        let unsubscribe = () => { };

        const setupSubscription = async () => {
            try {
                const result = await resolveCardId(id, 'thank-yous', 'thank-you');

                if (result) {
                    const realId = result.id;
                    const thankYouDoc = doc(db, 'thank-yous', realId);

                    unsubscribe = onSnapshot(thankYouDoc, (snapshot) => {
                        if (snapshot.exists()) {
                            setData(normalizeCardData(snapshot.data()));
                        } else {
                            setError("Card not found.");
                        }
                        setLoading(false);
                    }, (err) => {
                        console.error("Data fetch error:", err);
                        setError("Could not load card.");
                        setLoading(false);
                    });
                } else {
                    setLoading(false);
                }
            } catch (error) {
                console.error("Error resolving thank you card:", error);
                setLoading(false);
            }
        };

        setupSubscription();

        return () => unsubscribe();
    }, [authReady, id]);

    // --- INTERSECTION OBSERVER (SCROLL TRACKING) ---
    useEffect(() => {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const index = Number(entry.target.dataset.index);
                    setActiveSection(index);
                }
            });
        }, { threshold: 0.5 });

        const sections = document.querySelectorAll('section');
        sections.forEach(section => observer.observe(section));

        return () => observer.disconnect();
    }, [loading, envelopeOpen, data]); // Re-run when data loads to catch the optional memory section

    // --- INTERACTIONS ---

    // 1. Audio
    const toggleAudio = () => {
        if (!data?.song?.previewUrl) return;
        setAudioPlaying(!audioPlaying);
    };

    // 2. Flowers (Enhanced Custom CSS)
    const plantFlower = (e) => {
        if (e.target.closest('.no-plant')) return; // Prevent planting on text
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const newFlower = {
            id: Date.now(),
            x,
            y,
            scale: 0.5 + Math.random() * 0.7,
            rotation: Math.random() * 360,
            type: Math.floor(Math.random() * 3), // 3 flower variants
            color: ['#ffb7b2', '#ffdac1', '#e2f0cb', '#b5ead7', '#c7ceea'][Math.floor(Math.random() * 5)]
        };
        setFlowers([...flowers, newFlower]);
    };

    // 3. Hug
    const startHug = () => {
        setIsHugging(true);
        hugInterval.current = setInterval(() => {
            setHugProgress(prev => {
                if (prev >= 100) {
                    clearInterval(hugInterval.current);
                    return 100;
                }
                return prev + 1.5;
            });
        }, 16);
    };

    const stopHug = () => {
        setIsHugging(false);
        clearInterval(hugInterval.current);
        const releaseInterval = setInterval(() => {
            setHugProgress(prev => {
                if (prev <= 0) {
                    clearInterval(releaseInterval);
                    return 0;
                }
                return prev - 3;
            });
        }, 16);
    };

    // 4. Ripples (New)
    const triggerRipple = (e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const newRipple = {
            id: Date.now(),
            x, y
        };

        setRipples(prev => [...prev, newRipple]);
        // Remove ripple from DOM after animation
        setTimeout(() => {
            setRipples(prev => prev.filter(r => r.id !== newRipple.id));
        }, 2000);
    };

    // 5. Warmth Interaction (New)
    const handleWarmthMove = () => {
        setWarmthLevel(prev => Math.min(prev + 2, 100));
    };

    // 6. Fingerprint Verification (New)
    const handleFingerprintStart = () => {
        if (fingerprintState === 'verified') return;
        setFingerprintState('scanning');
        setTimeout(() => {
            setFingerprintState('verified');
        }, 2000); // 2 seconds scan time
    };

    // --- RENDER ---

    if (loading) {
        return (
            <div className="loader-container">
                <style>{`
          .loader-container { display: flex; height: 100vh; align-items: center; justify-content: center; background: #F0F7F0; color: #4a6741; font-family: 'Georgia', serif; }
          .spinner { animation: spin 3s linear infinite; }
          @keyframes spin { 100% { transform: rotate(360deg); } }
        `}</style>
                <div className="spinner"><Flower2 size={40} /></div>
                <CardFooter />
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="error-container">
                <style>{`
          .error-container { display: flex; height: 100vh; align-items: center; justify-content: center; background: #F0F7F0; color: #c25e74; font-family: sans-serif; }
        `}</style>
                <div>{error || 'Card not found.'}</div>
                <CardFooter />
            </div>
        );
    }

    const isLongText = data.message && data.message.length > 150;

    // Helper to get Spotify ID
    const getSpotifyId = (url) => {
        if (!url || typeof url !== 'string') return null;
        try {
            const parts = url.split('/');
            return parts[parts.length - 1].split('?')[0];
        } catch (e) { return null; }
    };
    const spotifyId = getSpotifyId(data?.song);

    return (
        <>
            <div style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100 }}>
                <CardViewHeader
                    cardType="thank-you"
                    cardId={id}
                    title="Thank You"
                    subtitle={data?.recipient ? `For ${data.recipient}${data?.sender ? ` · From ${data.sender}` : ''}` : undefined}
                />
            </div>
            <div className="app-container" ref={containerRef}>
                {/* --- CUSTOM CSS --- */}
                <style>{`
        :root {
          --sage-light: #F0F7F0;
          --sage-medium: #8FBC8F;
          --sage-dark: #4a6741;
          --blush-light: #FFF0F5;
          --blush-medium: #ffcfd6;
          --blush-deep: #e68a98;
          --text-main: #2F3E2F;
          --text-light: #6b7c6b;
          --font-serif: 'Times New Roman', Times, serif;
          --font-sans: 'Helvetica Neue', Helvetica, Arial, sans-serif;
        }

        * { box-sizing: border-box; margin: 0; padding: 0; -webkit-tap-highlight-color: transparent; }
        html, body, #root { height: 100%; width: 100%; overflow: hidden; background-color: var(--sage-light); color: var(--text-main); }
        
        /* Snap Scrolling Container */
        .app-container {
          height: 100dvh;
          width: 100%;
          overflow-y: scroll;
          scroll-snap-type: y mandatory;
          scroll-behavior: smooth;
        }

        section {
          height: 100dvh;
          width: 100%;
          scroll-snap-align: start;
          scroll-snap-stop: always;
          position: relative;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          overflow: hidden;
          padding: 1.5rem;
          text-align: center;
          background-size: cover;
          background-position: center;
        }

        h1, h2, h3 { font-family: var(--font-serif); font-weight: normal; }
        p, span, button { font-family: var(--font-sans); }
        .label { font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.2em; color: var(--text-light); margin-bottom: 1rem; display: block; z-index: 10; position: relative; }

        /* --- Section 1: Intro/Envelope --- */
        .sec-intro { background-color: #E8F3E8; perspective: 1200px; }
        
        .envelope-container {
          position: relative;
          width: 320px;
          height: 220px;
          cursor: pointer;
          transition: transform 0.6s ease;
          z-index: 20;
        }
        
        .envelope-body {
          position: absolute;
          width: 100%;
          height: 100%;
          background-color: #fdf8e8;
          border-radius: 6px;
          box-shadow: 0 15px 35px rgba(0,0,0,0.1);
          z-index: 2;
          transform-origin: bottom;
          transition: transform 1s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.5s ease 0.5s;
        }
        
        .envelope-flap {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 55%; /* Slightly longer flap */
          background-color: #f5eccd;
          clip-path: polygon(0 0, 50% 100%, 100% 0);
          transform-origin: top;
          z-index: 3;
          transition: transform 0.6s ease, opacity 0.3s ease 0.3s;
          backface-visibility: hidden; /* Important for hiding */
        }

        .seal {
          width: 44px;
          height: 44px;
          background-color: var(--blush-deep);
          border: 2px solid rgba(255,255,255,0.2);
          border-radius: 50%;
          position: absolute;
          top: 55%; /* Match flap tip */
          left: 50%;
          transform: translate(-50%, -50%);
          z-index: 4;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          box-shadow: 0 2px 5px rgba(0,0,0,0.2);
          transition: opacity 0.3s ease, transform 0.3s ease;
          cursor: pointer;
        }

        /* Envelope Open States */
        .envelope-container.envelope-open .envelope-flap { 
            transform: rotateX(180deg); 
            opacity: 0; 
            pointer-events: none;
        }
        .envelope-container.envelope-open .seal {
            opacity: 0;
            transform: translate(-50%, -50%) scale(0.5);
            pointer-events: none;
        }
        .envelope-container.envelope-open .envelope-body { 
            transform: translateY(150px) scale(0.9); 
            opacity: 0; 
            pointer-events: none; 
        }
        
        .letter-content {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%) scale(0.9);
          opacity: 0;
          width: 90%;
          max-width: 600px;
          transition: all 1s cubic-bezier(0.34, 1.56, 0.64, 1) 0.6s;
          pointer-events: none;
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        
        .envelope-open ~ .letter-content {
          transform: translate(-50%, -50%) scale(1);
          opacity: 1;
          pointer-events: auto;
        }

        .scroll-hint {
          margin-top: 3rem;
          color: var(--sage-dark);
          animation: bounce 2s infinite;
          opacity: 0.6;
        }

        /* --- Section 2: Bouquet (Enhanced) --- */
        .sec-bouquet { background-color: #ffffff; cursor: crosshair; overflow: hidden; }
        
        .custom-flower {
          position: absolute;
          transform: translate(-50%, -50%);
          pointer-events: none;
          animation: bloom 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
          z-index: 1;
        }
        
        .petal {
            position: absolute;
            background: currentColor;
            border-radius: 50%;
            opacity: 0.9;
        }
        
        /* Flower Type 1: Daisy-ish */
        .flower-type-0 .petal {
            width: 20px; height: 20px;
            top: -10px; left: -10px;
        }
        .flower-type-0 .petal:nth-child(1) { transform: translateY(-12px); }
        .flower-type-0 .petal:nth-child(2) { transform: rotate(72deg) translateY(-12px); }
        .flower-type-0 .petal:nth-child(3) { transform: rotate(144deg) translateY(-12px); }
        .flower-type-0 .petal:nth-child(4) { transform: rotate(216deg) translateY(-12px); }
        .flower-type-0 .petal:nth-child(5) { transform: rotate(288deg) translateY(-12px); }
        .flower-type-0 .center {
            width: 14px; height: 14px; background: #fffacd; border-radius: 50%;
            position: absolute; top: -7px; left: -7px; z-index: 2;
        }

        /* Flower Type 2: Rose-ish */
        .flower-type-1 .petal {
            width: 30px; height: 30px;
            top: -15px; left: -15px;
            border-radius: 40% 60% 70% 30% / 40% 50% 60% 50%;
        }
        .flower-type-1 .petal:nth-child(odd) { transform: rotate(45deg); opacity: 0.8; }
        .flower-type-1 .petal:nth-child(even) { transform: rotate(0deg); opacity: 0.6; }
        .flower-type-1 .center { width: 10px; height: 10px; background: rgba(255,255,0,0.3); border-radius: 50%; position: absolute; top: -5px; left: -5px; }

        /* Flower Type 3: Tulip-ish */
        .flower-type-2 .petal { width: 15px; height: 30px; border-radius: 50% 50% 50% 50% / 60% 60% 40% 40%; top: -25px; left: -7.5px; }
        .flower-type-2 .petal:nth-child(1) { transform: rotate(-15deg); }
        .flower-type-2 .petal:nth-child(2) { transform: rotate(15deg); }
        .flower-type-2 .center { width: 8px; height: 8px; background: #333; border-radius: 50%; position: absolute; top: -4px; left: -4px; opacity: 0.5; }

        /* --- Section 3: Kinetic Words --- */
        .sec-words { background-color: var(--sage-light); overflow: hidden; }
        
        .word-grid {
            position: absolute;
            top: 0; left: 0; right: 0; bottom: 0;
            display: flex; flex-wrap: wrap; align-content: center; justify-content: center;
            opacity: 0.1;
            z-index: 0;
            pointer-events: none;
            overflow: hidden;
        }
        .bg-lang-word {
            font-size: 3rem;
            font-weight: bold;
            margin: 1rem 2rem;
            font-family: var(--font-serif);
            color: var(--sage-dark);
        }

        .kinetic-word {
          line-height: 1.2;
          opacity: 0;
          transform: translateY(30px);
          transition: opacity 1s ease, transform 1s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          max-width: 90%;
        }
        .sec-words[data-active="true"] .kinetic-word {
          opacity: 1;
          transform: translateY(0);
        }
        
        /* Dynamic Font Sizing classes */
        .msg-large { font-size: 3rem; }
        .msg-med { font-size: 1.8rem; }
        .msg-small { font-size: 1.1rem; line-height: 1.6; text-align: left; background: rgba(255,255,255,0.5); padding: 1.5rem; border-radius: 12px; }

        /* --- Section 4: Impact (Interactive Ripples) --- */
        .sec-impact { 
            background: radial-gradient(circle at center, #fff 0%, var(--sage-light) 100%); 
            cursor: pointer;
        }
        
        /* Auto Ripples */
        .auto-ripple {
          position: absolute;
          border: 1px solid var(--sage-medium);
          border-radius: 50%;
          opacity: 0;
          animation: rippleEffect 4s infinite;
          top: 50%; left: 50%; transform: translate(-50%, -50%);
        }
        .auto-ripple:nth-child(1) { width: 200px; height: 200px; animation-delay: 0s; }
        .auto-ripple:nth-child(2) { width: 200px; height: 200px; animation-delay: 1s; }
        .auto-ripple:nth-child(3) { width: 200px; height: 200px; animation-delay: 2s; }
        
        /* Interactive Ripples */
        .click-ripple {
            position: absolute;
            border: 2px solid var(--blush-deep);
            border-radius: 50%;
            width: 10px; height: 10px;
            animation: clickRippleAnim 1.5s ease-out forwards;
            pointer-events: none;
        }
        
        .impact-card {
          position: relative;
          z-index: 10;
          background: rgba(255,255,255,0.7);
          backdrop-filter: blur(8px);
          padding: 2.5rem;
          border-radius: 16px;
          border: 1px solid rgba(255,255,255,0.8);
          max-width: 500px;
          width: 90%;
          box-shadow: 0 10px 30px rgba(0,0,0,0.05);
          pointer-events: none; /* Let clicks pass through to background */
        }

        /* --- Section 5: Warmth (Interactive) --- */
        .sec-warmth { 
            background-color: #fff5eb; 
            transition: background-color 0.3s ease;
        }
        .warmth-overlay {
          position: absolute;
          inset: 0;
          background: radial-gradient(circle at center, rgba(255, 182, 193, 0.0) 0%, rgba(255, 182, 193, 0.4) 100%);
          opacity: 0;
          transition: opacity 0.5s ease;
          pointer-events: none;
        }
        .sun-graphic {
            transition: transform 0.2s ease, filter 0.2s ease;
        }
        
        /* --- Section 6: Hug --- */
        .sec-hug { background-color: var(--blush-light); user-select: none; }
        .hug-container {
          position: relative;
          width: 100%;
          max-width: 400px;
          height: 120px;
          display: flex;
          justify-content: center;
          align-items: center;
        }
        .arm {
          position: absolute;
          top: 0;
          height: 100%;
          width: 50%;
          background-color: var(--blush-medium);
          border-radius: 60px;
          transition: transform 0.1s linear;
        }
        .arm-left { 
          left: 0; 
          transform-origin: left center; 
          border-top-right-radius: 0; 
          border-bottom-right-radius: 0;
          transform: scaleX(0); 
        }
        .arm-right { 
          right: 0; 
          transform-origin: right center; 
          border-top-left-radius: 0; 
          border-bottom-left-radius: 0;
          transform: scaleX(0);
        }
        .heart-btn {
          position: relative;
          z-index: 10;
          background: white;
          width: 80px;
          height: 80px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 15px rgba(230, 138, 152, 0.3);
          cursor: pointer;
          transition: transform 0.2s;
        }
        .heart-btn:active { transform: scale(0.9); }
        .hugging-text {
          margin-top: 2rem;
          color: var(--blush-deep);
          font-weight: bold;
          opacity: 0;
          transition: opacity 0.3s;
        }
        .hugging-text.visible { opacity: 1; }

        /* --- Section 7: Balance --- */
        .sec-balance { background-color: #fafafa; perspective: 800px; }
        .scale-graphic {
          width: 220px;
          height: 160px;
          position: relative;
          margin: 0 auto 2rem;
          transform-origin: bottom center;
          transition: transform 1.5s cubic-bezier(0.25, 0.8, 0.25, 1); /* Physics-like ease */
        }
        .scale-graphic.unbalanced { transform: rotate(-15deg); }
        .scale-graphic.balanced { transform: rotate(0deg); }

        /* --- Section 8: Memory (Flip Card) --- */
        .sec-memory { background-color: #2F3E2F; color: white; perspective: 1000px; }
        
        .flip-card-inner {
            position: relative;
            width: 280px;
            height: 360px;
            text-align: center;
            transition: transform 0.8s;
            transform-style: preserve-3d;
            cursor: pointer;
        }
        .flip-card-flipped .flip-card-inner {
            transform: rotateY(180deg);
        }
        
        .flip-front, .flip-back {
            position: absolute;
            width: 100%;
            height: 100%;
            -webkit-backface-visibility: hidden;
            backface-visibility: hidden;
            border-radius: 12px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            box-shadow: 0 10px 30px rgba(0,0,0,0.3);
            border: 1px solid rgba(255,255,255,0.1);
        }
        
        .flip-front {
            background: rgba(255,255,255,0.05);
            backdrop-filter: blur(5px);
        }
        
        .flip-back {
            background-color: white;
            color: #2F3E2F;
            transform: rotateY(180deg);
            padding: 10px;
            overflow: hidden;
        }
        
        .memory-img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            border-radius: 8px;
        }

        .firefly {
          position: absolute;
          width: 4px;
          height: 4px;
          background: #ffeeb0;
          border-radius: 50%;
          box-shadow: 0 0 8px #ffeeb0;
          animation: fly 8s infinite ease-in-out;
          opacity: 0;
          pointer-events: none;
        }

        /* --- Section 9: Signature --- */
        .sec-signature { background-color: var(--sage-light); }
        .path-draw {
          stroke-dasharray: 400;
          stroke-dashoffset: 400;
          transition: stroke-dashoffset 2.5s ease-in-out;
        }
        .sec-signature[data-active="true"] .path-draw {
          stroke-dashoffset: 0;
        }

        /* --- Section 10: Footer (Fingerprint) --- */
        .sec-footer { background-color: white; }
        .fp-scanner {
            position: relative;
            width: 80px;
            height: 80px;
            margin: 2rem auto;
            color: #ccc;
            transition: color 0.3s;
            cursor: pointer;
        }
        .fp-scanner.scanning { color: var(--sage-medium); animation: pulse 0.5s infinite alternate; }
        .fp-scanner.verified { color: var(--sage-dark); }
        
        .scan-line {
            position: absolute;
            top: 0; left: 0; width: 100%; height: 2px;
            background: var(--sage-dark);
            box-shadow: 0 0 10px var(--sage-medium);
            opacity: 0;
        }
        .scanning .scan-line {
            opacity: 1;
            animation: scanDown 2s ease-in-out infinite;
        }
        
        .verified-badge {
            margin-top: 1rem;
            color: var(--sage-dark);
            font-weight: bold;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0.5rem;
            opacity: 0;
            transform: translateY(10px);
            transition: all 0.5s ease;
        }
        .verified-badge.show { opacity: 1; transform: translateY(0); }
        
        .confetti-piece {
            position: absolute;
            width: 8px; height: 16px;
            background: #ffd700;
            top: 50%; left: 50%;
            opacity: 0;
            z-index: 100;
        }
        .verified .confetti-piece {
            animation: confettiPop 1s ease-out forwards;
        }

        .replay-btn {
          margin-top: 3rem;
          padding: 0.8rem 2rem;
          background: transparent;
          border: 1px solid var(--sage-medium);
          color: var(--sage-dark);
          border-radius: 50px;
          cursor: pointer;
          font-size: 0.9rem;
          transition: all 0.3s ease;
        }
        .replay-btn:hover { background: var(--sage-light); transform: translateY(-2px); }

        /* Keyframes */
        @keyframes bounce { 0%, 20%, 50%, 80%, 100% {transform: translateY(0);} 40% {transform: translateY(-10px);} 60% {transform: translateY(-5px);} }
        @keyframes bloom { from { transform: translate(-50%, -50%) scale(0) rotate(180deg); opacity: 0; } to { transform: translate(-50%, -50%) scale(var(--s)) rotate(var(--r)); opacity: 1; } }
        @keyframes rippleEffect { 0% { transform: translate(-50%, -50%) scale(0.8); opacity: 0.5; } 100% { transform: translate(-50%, -50%) scale(2); opacity: 0; } }
        @keyframes clickRippleAnim { 0% { transform: translate(-50%, -50%) scale(1); opacity: 0.8; border-width: 5px; } 100% { transform: translate(-50%, -50%) scale(8); opacity: 0; border-width: 0px; } }
        @keyframes fly { 0%, 100% { transform: translate(0,0); opacity: 0; } 50% { opacity: 1; } 25% { transform: translate(20px, -20px); } 75% { transform: translate(-20px, 20px); } }
        @keyframes scanDown { 0% { top: 0%; opacity: 0; } 10% { opacity: 1; } 90% { opacity: 1; } 100% { top: 100%; opacity: 0; } }
        @keyframes confettiPop { 0% { transform: translate(0,0) rotate(0); opacity: 1; } 100% { transform: translate(var(--tx), var(--ty)) rotate(720deg); opacity: 0; } }
        @keyframes pulse { from { opacity: 0.6; } to { opacity: 1; } }

        /* Utilities */
        .text-serif { font-family: var(--font-serif); }
        .text-italic { font-style: italic; }
        .mt-4 { margin-top: 1rem; }
      `}</style>



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
                    <SongPlayer song={data.song} />
                )}

                {/* --- 1. INTRO / ENVELOPE --- */}
                <section className="sec-intro" data-index="0">
                    <div className={`envelope-container ${envelopeOpen ? 'envelope-open' : ''}`} onClick={() => setEnvelopeOpen(true)}>
                        <div className="envelope-body"></div>
                        <div className="envelope-flap"></div>
                        <div className="seal">
                            <Heart size={20} fill="currentColor" strokeWidth={1.5} />
                        </div>
                    </div>

                    <div className="letter-content">
                        <span className="label">A Message For</span>
                        <h1 className="text-serif" style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>{data.recipient}</h1>
                        <p className="scroll-hint">Scroll to Open</p>
                        <MoveDown size={24} className="scroll-hint" style={{ marginTop: '10px' }} />
                    </div>
                </section>

                {/* --- 2. BOUQUET (Interactive) --- */}
                <section className="sec-bouquet" data-index="1" onClick={plantFlower}>
                    <span className="label no-plant">Tap to Plant Flowers</span>
                    <h2 className="text-serif no-plant" style={{ fontSize: '2rem', marginBottom: '2rem', zIndex: 10, position: 'relative' }}>
                        Kindness Blooms
                    </h2>

                    {flowers.map(flower => (
                        <div
                            key={flower.id}
                            className={`custom-flower flower-type-${flower.type}`}
                            style={{
                                left: flower.x,
                                top: flower.y,
                                '--s': flower.scale,
                                '--r': `${flower.rotation}deg`,
                                color: flower.color
                            }}
                        >
                            <div className="petal"></div>
                            <div className="petal"></div>
                            <div className="petal"></div>
                            <div className="petal"></div>
                            <div className="petal"></div>
                            <div className="center"></div>
                        </div>
                    ))}
                </section>

                {/* --- 3. KINETIC WORDS --- */}
                <section className="sec-words" data-index="2" data-active={activeSection === 2}>
                    <div className="word-grid">
                        {BG_LANGUAGES.map((word, i) => (
                            <span key={i} className="bg-lang-word" style={{ opacity: 0.05 + Math.random() * 0.1 }}>{word}</span>
                        ))}
                    </div>

                    <div className="kinetic-word">
                        {isLongText ? (
                            <div className="msg-small">
                                {data.message}
                            </div>
                        ) : (
                            <h2 className={`text-serif ${data.message.length < 50 ? 'msg-large' : 'msg-med'}`}>
                                "{data.message}"
                            </h2>
                        )}
                    </div>
                </section>

                {/* --- 4. IMPACT (Ripples) --- */}
                <section className="sec-impact" data-index="3" onClick={triggerRipple}>
                    <div className="auto-ripple"></div>
                    <div className="auto-ripple"></div>
                    <div className="auto-ripple"></div>

                    {ripples.map(r => (
                        <div key={r.id} className="click-ripple" style={{ left: r.x, top: r.y }}></div>
                    ))}

                    <div className="impact-card">
                        <Waves size={32} color="#8FBC8F" style={{ marginBottom: '1rem' }} />
                        <h3 className="text-serif" style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>The Ripple Effect</h3>
                        <p>Your generosity started a wave that hasn't stopped.</p>
                    </div>
                </section>

                {/* --- 5. WARMTH (Interactive Slider/Touch) --- */}
                <section
                    className="sec-warmth"
                    data-index="4"
                    onMouseMove={handleWarmthMove}
                    onTouchMove={handleWarmthMove}
                    style={{ backgroundColor: `rgba(255, 245, 235, ${0.5 + warmthLevel / 200})` }}
                >
                    <div className="warmth-overlay" style={{ opacity: warmthLevel / 100 }}></div>

                    <div className="sun-graphic" style={{ transform: `scale(${1 + warmthLevel / 100})`, filter: `drop-shadow(0 0 ${warmthLevel / 2}px orange)` }}>
                        <ThermometerSun size={64} color={warmthLevel > 50 ? "#ff8c00" : "#ffd700"} />
                    </div>

                    <h2 className="text-serif" style={{ marginTop: '2rem', zIndex: 10 }}>
                        You bring warmth.
                    </h2>
                    <p className="label" style={{ marginTop: '1rem' }}>Move to feel it</p>
                </section>

                {/* --- 6. VIRTUAL HUG --- */}
                <section className="sec-hug" data-index="5">
                    <span className="label">Press & Hold</span>
                    <div className="hug-container">
                        <div className="arm arm-left" style={{ transform: `scaleX(${hugProgress / 100})` }}></div>
                        <div className="arm arm-right" style={{ transform: `scaleX(${hugProgress / 100})` }}></div>

                        <button
                            className="heart-btn"
                            onMouseDown={startHug}
                            onMouseUp={stopHug}
                            onMouseLeave={stopHug}
                            onTouchStart={startHug}
                            onTouchEnd={stopHug}
                        >
                            <Heart
                                size={32}
                                fill={hugProgress > 90 ? "#e68a98" : "none"}
                                color="#e68a98"
                                style={{ transform: `scale(${1 + hugProgress / 200})`, transition: 'transform 0.1s' }}
                            />
                        </button>
                    </div>
                    <p className={`hugging-text ${isHugging ? 'visible' : ''}`}>
                        Sending a big hug...
                    </p>
                </section>

                {/* --- 7. BALANCE --- */}
                <section className="sec-balance" data-index="6">
                    <div className={`scale-graphic ${balanced ? 'balanced' : 'unbalanced'}`} onClick={() => setBalanced(true)}>
                        <Scale size={120} strokeWidth={1} color="#2F3E2F" />
                    </div>
                    <h3 className="text-serif" style={{ fontSize: '1.5rem', marginTop: '1rem' }}>
                        {balanced ? "Perfectly Balanced." : "I owe you one."}
                    </h3>
                    {!balanced && <p className="label" style={{ marginTop: '1rem', cursor: 'pointer' }}>Tap to settle the score</p>}
                </section>

                {/* --- 8. MEMORY (Flip Card) --- */}
                {data.imageUrl && (
                    <section className="sec-memory" data-index="7">
                        {[...Array(10)].map((_, i) => (
                            <div key={i} className="firefly" style={{
                                left: `${Math.random() * 100}%`,
                                top: `${Math.random() * 100}%`,
                                animationDelay: `${Math.random() * 5}s`
                            }}></div>
                        ))}

                        <div className={`flip-card-inner ${isFlipped ? 'flip-card-flipped' : ''}`} onClick={() => setIsFlipped(!isFlipped)}>
                            <div className="flip-front">
                                <Sparkles size={32} style={{ marginBottom: '1rem' }} />
                                <h3>A Memory</h3>
                                <p className="label" style={{ marginTop: '1rem' }}>Tap to Flip</p>
                            </div>
                            <div className="flip-back">
                                <img src={data.imageUrl} alt="Memory" className="memory-img" />
                            </div>
                        </div>
                    </section>
                )}

                {/* --- 9. SIGNATURE --- */}
                <section className="sec-signature" data-index="8" data-active={activeSection === 8}>
                    <PenTool size={32} color="#4a6741" style={{ marginBottom: '2rem' }} />

                    <svg width="300" height="100" viewBox="0 0 300 100">
                        <path
                            d="M20,50 Q80,20 100,50 T180,50 T260,50"
                            fill="none"
                            stroke="#4a6741"
                            strokeWidth="2"
                            className="path-draw"
                        />
                    </svg>

                    <h2 className="text-serif text-italic" style={{ fontSize: '2.5rem', marginTop: '-3rem' }}>
                        {data.sender}
                    </h2>
                    <p className="label" style={{ marginTop: '2rem' }}>Sincerely</p>
                </section>

                {/* --- 10. FOOTER / VERIFY --- */}
                <section className="sec-footer" data-index="9">
                    <div
                        className={`fp-scanner ${fingerprintState}`}
                        onMouseDown={handleFingerprintStart}
                        onTouchStart={handleFingerprintStart}
                    >
                        <Fingerprint size={64} strokeWidth={1} />
                        <div className="scan-line"></div>
                    </div>

                    <div className={`verified-badge ${fingerprintState === 'verified' ? 'show' : ''}`}>
                        <Check size={20} /> Authenticated Gratitude
                        {/* Confetti Spawns */}
                        {[...Array(20)].map((_, i) => (
                            <div
                                key={i}
                                className="confetti-piece"
                                style={{
                                    '--tx': `${(Math.random() - 0.5) * 200}px`,
                                    '--ty': `${(Math.random() - 0.5) * 200}px`,
                                    background: ['#ffd700', '#ffb7b2', '#8FBC8F'][Math.floor(Math.random() * 3)]
                                }}
                            ></div>
                        ))}
                    </div>

                    <button className="replay-btn" onClick={() => containerRef.current.scrollTo({ top: 0, behavior: 'smooth' })}>
                        Read Again
                    </button>

                    <div style={{ marginTop: 'auto', marginBottom: '1rem', fontSize: '0.7rem', color: '#ccc' }}>
                        SECURE TRANSMISSION • {new Date().getFullYear()}
                    </div>
                </section>

            </div >
        </>
    );
}

