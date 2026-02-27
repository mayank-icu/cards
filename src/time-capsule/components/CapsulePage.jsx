import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { app, auth, db } from '../../firebase.js';
import { doc, onSnapshot } from 'firebase/firestore';
import { onAuthStateChanged, signInAnonymously, signInWithCustomToken } from 'firebase/auth';
import {
    Lock, Unlock, Map as MapIcon, Music, Image as ImageIcon,
    Hourglass, Send, ShieldCheck, RotateCcw, Loader2, Key,
    Fingerprint, Radio, Crosshair, Terminal, Database, Globe
} from 'lucide-react';
import SongPlayer from '../../components/SongPlayer';
import { normalizeCardData, resolveCardId } from '../../utils/slugs';

/* --- STYLES & ANIMATIONS --- */
const GlobalStyles = () => (
    <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Chakra+Petch:wght@400;600;700&family=Rajdhani:wght@300;500;700&family=Courier+Prime:wght@400;700&display=swap');

        :root {
            --c-bg: #050505;
            --c-panel: #0f0f0f;
            --c-amber: #ffb000;
            --c-amber-dim: #5c4000;
            --c-text: #e0e0e0;
            --c-alert: #ff3333;
            --c-scan: rgba(255, 176, 0, 0.1);
            
            --font-display: 'Chakra Petch', sans-serif;
            --font-ui: 'Rajdhani', sans-serif;
            --font-mono: 'Courier Prime', monospace;
        }

        * { box-sizing: border-box; margin: 0; padding: 0; }

        body {
            background-color: var(--c-bg);
            color: var(--c-text);
            font-family: var(--font-ui);
            overflow: hidden;
        }

        /* --- LAYOUT --- */
        .capsule-wrapper {
            height: 100vh;
            width: 100vw;
            position: relative;
            overflow: hidden;
        }

        .capsule-scroller {
            height: 100%;
            width: 100%;
            overflow-y: scroll;
            scroll-snap-type: y mandatory;
            scroll-behavior: smooth;
            position: relative;
            z-index: 10;
        }

        .capsule-section {
            height: 100vh;
            width: 100%;
            scroll-snap-align: start;
            position: relative;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            overflow: hidden;
            border-bottom: 1px solid var(--c-amber-dim);
            background: radial-gradient(circle at center, #111 0%, #000 100%);
        }

        /* --- UI ELEMENTS --- */
        .scanlines {
            position: fixed;
            top: 0; left: 0; width: 100%; height: 100%;
            background: linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%);
            background-size: 100% 4px;
            pointer-events: none;
            z-index: 900;
            opacity: 0.6;
        }

        .hud-border {
            position: absolute;
            top: 20px; left: 20px; right: 20px; bottom: 20px;
            border: 1px solid var(--c-amber-dim);
            pointer-events: none;
            z-index: 800;
        }
        .hud-corner {
            position: absolute; width: 20px; height: 20px;
            border-color: var(--c-amber); border-style: solid;
        }
        .tl { top: -1px; left: -1px; border-width: 2px 0 0 2px; }
        .tr { top: -1px; right: -1px; border-width: 2px 2px 0 0; }
        .bl { bottom: -1px; left: -1px; border-width: 0 0 2px 2px; }
        .br { bottom: -1px; right: -1px; border-width: 0 2px 2px 0; }

        h2 {
            font-family: var(--font-display);
            color: var(--c-amber);
            text-transform: uppercase;
            letter-spacing: 4px;
            margin-bottom: 1rem;
            text-shadow: 0 0 10px var(--c-amber-dim);
        }

        .terminal-text {
            font-family: var(--font-mono);
            color: var(--c-amber);
            font-size: 0.9rem;
            opacity: 0.8;
        }

        /* --- INTERACTIVE: BIOSCAN (Section 3) --- */
        .scanner-pad {
            width: 150px; height: 150px;
            border: 2px dashed var(--c-amber-dim);
            border-radius: 50%;
            display: flex; align-items: center; justify-content: center;
            cursor: pointer;
            position: relative;
            transition: all 0.3s;
            overflow: hidden;
        }
        .scanner-pad:active { border-color: var(--c-amber); transform: scale(0.95); }
        .scanner-beam {
            position: absolute; top: 0; left: 0; width: 100%; height: 2px;
            background: var(--c-amber);
            box-shadow: 0 0 10px var(--c-amber);
            animation: scan 1s linear infinite;
            display: none;
        }
        .scanner-pad:active .scanner-beam { display: block; }
        @keyframes scan { 0% { top: 0; } 100% { top: 100%; } }

        /* --- INTERACTIVE: TUNER (Section 4) --- */
        .tuner-dial {
            width: 200px; height: 200px;
            border-radius: 50%;
            border: 4px solid #333;
            background: conic-gradient(from 180deg, #111 0deg, #222 180deg, #111 360deg);
            position: relative;
            cursor: grab;
            box-shadow: 0 5px 15px rgba(0,0,0,0.5);
        }
        .tuner-dial:active { cursor: grabbing; }
        .tuner-notch {
            position: absolute; top: 10px; left: 50%;
            width: 4px; height: 20px; background: var(--c-amber);
            transform: translateX(-50%);
        }
        .frequency-display {
            font-family: var(--font-mono);
            font-size: 2rem;
            color: var(--c-amber);
            margin-top: 1rem;
        }

        /* --- INTERACTIVE: CALIBRATION (Section 5) --- */
        .calibration-container {
            width: 300px;
            position: relative;
        }
        .blurred-image {
            width: 100%; height: 200px;
            background-size: cover;
            background-position: center;
            border: 1px solid var(--c-amber-dim);
            margin-bottom: 20px;
        }
        input[type=range].cyber-range {
            width: 100%;
            -webkit-appearance: none;
            background: transparent;
        }
        input[type=range].cyber-range::-webkit-slider-thumb {
            -webkit-appearance: none;
            height: 20px; width: 10px;
            background: var(--c-amber);
            cursor: pointer;
            margin-top: -8px;
            box-shadow: 0 0 10px var(--c-amber);
        }
        input[type=range].cyber-range::-webkit-slider-runnable-track {
            width: 100%; height: 2px;
            background: var(--c-amber-dim);
        }

        /* --- ARTIFACTS (Section 6) --- */
        .artifact-grid {
            display: flex; gap: 20px;
            overflow-x: auto;
            width: 100%; padding: 20px 0;
            scrollbar-width: none;
        }
        .artifact-item {
            min-width: 200px;
            background: rgba(255, 176, 0, 0.05);
            border: 1px solid var(--c-amber-dim);
            padding: 15px;
            text-align: center;
            transition: all 0.3s;
        }
        .artifact-item:hover {
            border-color: var(--c-amber);
            background: rgba(255, 176, 0, 0.1);
        }

        /* --- STATS (Section 7) --- */
        .stat-grid {
            display: grid; grid-template-columns: 1fr 1fr;
            gap: 20px; width: 100%; max-width: 500px;
        }
        .stat-box {
            border: 1px solid var(--c-amber-dim);
            padding: 15px;
            text-align: left;
        }
        .stat-label { font-size: 0.7rem; color: #666; text-transform: uppercase; }
        .stat-val { font-size: 1.2rem; color: var(--c-amber); font-family: var(--font-mono); }

        /* --- LETTER (Section 8) --- */
        .digital-paper {
            background: rgba(0, 0, 0, 0.8);
            border: 1px solid var(--c-amber);
            padding: 2rem;
            width: 90%; max-width: 600px;
            font-family: var(--font-mono);
            color: var(--c-text);
            line-height: 1.6;
            box-shadow: 0 0 20px rgba(255, 176, 0, 0.1);
            height: 60vh;
            overflow-y: auto;
        }

        /* --- STAR MAP (Section 9) --- */
        .star-canvas {
            width: 300px; height: 300px;
            border: 1px solid var(--c-amber-dim);
            border-radius: 50%;
            background: #000;
        }

        /* --- ANIMATIONS --- */
        @keyframes pulse-amber { 0% { box-shadow: 0 0 0 0 rgba(255, 176, 0, 0.4); } 70% { box-shadow: 0 0 0 10px rgba(255, 176, 0, 0); } 100% { box-shadow: 0 0 0 0 rgba(255, 176, 0, 0); } }
        .animate-pulse-amber { animation: pulse-amber 2s infinite; }

        .glitch { animation: glitch 1s linear infinite; }
        @keyframes glitch {
            2%, 64% { transform: translate(2px,0) skew(0deg); }
            4%, 60% { transform: translate(-2px,0) skew(0deg); }
            62% { transform: translate(0,0) skew(5deg); }
        }

        /* FLOATING SPOTIFY PLAYER */
        .floating-spotify-player {
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 2000;
            background: rgba(5, 5, 5, 0.9);
            backdrop-filter: blur(10px);
            padding: 12px;
            border-radius: 50px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            gap: 10px;
            border: 1px solid var(--c-amber);
            transition: all 0.3s ease;
            animation: slideInRight 0.5s ease-out;
        }
        
        .floating-spotify-player:hover {
            transform: scale(1.05);
            background: rgba(255, 176, 0, 0.1);
        }
        
        .spotify-disc {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            background: #111;
            overflow: hidden;
            animation: spin 4s linear infinite;
            border: 2px solid var(--c-amber);
        }
        
        .spotify-disc img { 
            width: 100%; 
            height: 100%; 
            object-fit: cover; 
        }
        
        .spotify-info-mini {
            max-width: 120px;
            overflow: hidden;
            white-space: nowrap;
            font-size: 0.8rem;
            color: var(--c-text);
            font-family: var(--font-mono);
        }
        
        .scrolling-text {
            display: inline-block;
            white-space: nowrap;
            animation: scrollText 10s linear infinite;
        }
        
        @keyframes scrollText {
            0% { transform: translateX(0); }
            100% { transform: translateX(-100%); }
        }
        
        .mini-play-btn {
            background: transparent;
            border: none;
            color: var(--c-amber);
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.3s ease;
        }
        
        .mini-play-btn:hover {
            color: #fff;
        }
        
        @keyframes slideInRight { 
            from { transform: translateX(100%); opacity: 0; } 
            to { transform: translateX(0); opacity: 1; } 
        }

        /* LOADING */
        .loader-wrap { height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; color: var(--c-amber); background: #000; }
        
        /* CAPSULE FRONT PAGE STYLES */
        .capsule-icon-container {
            margin: 0 auto 2rem;
            display: flex;
            justify-content: center;
        }
        
        .capsule-icon {
            padding: 2rem;
            border: 2px solid var(--c-amber);
            border-radius: 50%;
            background: rgba(255, 176, 0, 0.05);
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .capsule-stats {
            display: flex;
            gap: 20px;
            justify-content: center;
            margin-top: 1rem;
        }
        
        .stat-item {
            text-align: center;
            padding: 1rem;
            border: 1px solid var(--c-amber-dim);
            background: rgba(255, 176, 0, 0.02);
            min-width: 120px;
        }
        
        .stat-label-small {
            font-size: 0.7rem;
            color: #666;
            text-transform: uppercase;
            margin-bottom: 0.5rem;
        }
        
        .stat-val-small {
            font-size: 1rem;
            color: var(--c-amber);
            font-family: var(--font-mono);
        }
        
        .lock-warning {
            margin-top: 2rem;
            padding: 1rem;
            border: 1px solid var(--c-amber-dim);
            background: rgba(255, 176, 0, 0.05);
            text-align: center;
        }
        
        @media (max-width: 768px) {
            h2 { font-size: 1.5rem; }
            .stat-grid { grid-template-columns: 1fr; }
            .capsule-stats { flex-direction: column; gap: 10px; }
            .stat-item { min-width: auto; }
        }
        `}</style>
);

/* --- MAIN COMPONENT --- */

const CapsulePage = () => {
    const { id } = useParams();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);

    // --- STATES FOR 10 STAGES ---
    const [timeLeft, setTimeLeft] = useState('');
    const [isTimeLocked, setIsTimeLocked] = useState(true);
    const [isVaultOpen, setIsVaultOpen] = useState(false);
    const [lockRotation, setLockRotation] = useState(0);
    const [scanProgress, setScanProgress] = useState(0); // Section 3
    const [frequency, setFrequency] = useState(88.0); // Section 4
    const [isTuned, setIsTuned] = useState(false);
    const [calibration, setCalibration] = useState(0); // Section 5
    const [isPlaying, setIsPlaying] = useState(false); // Section 6

    const canvasRef = useRef(null);
    const scrollRef = useRef(null);
    const scanInterval = useRef(null);

    // 1. Auth & Data Fetch
    useEffect(() => {
        const initAuth = async () => {
            if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
                await signInWithCustomToken(auth, __initial_auth_token);
            } else {
                await signInAnonymously(auth);
            }
        };
        initAuth();
        return onAuthStateChanged(auth, setUser);
    }, []);

    useEffect(() => {
        if (!id || !user) return;

        const setup = async () => {
            const { id: realId } = await resolveCardId(id, 'capsules', 'time-capsule');
            const docRef = doc(db, 'capsules', realId);
            
            const unsub = onSnapshot(docRef, (snap) => {
                if (snap.exists()) {
                    setData(normalizeCardData(snap.data()));
                } else {
                    // Demo Data for Preview
                    setData({
                        recipient: "The Future Observer",
                        sender: "The Past Architect",
                        unlockDate: new Date(Date.now() - 10000).toISOString(), // Already unlocked for demo
                        message: "The data contained herein is a fragment of a moment long gone. Treat it with care.",
                        items: ["Neural Chip", "Old Coin", "Holophoto"],
                        imageUrl: "https://images.unsplash.com/photo-1518546305927-5a555bb7020d?q=80&w=2069&auto=format&fit=crop",
                        song: { name: "Echoes of Time", artist: "Synthwave Unit" },
                        location: "Sector 7G"
                    });
                }
                setLoading(false);
            });
            return unsub;
        };
        setup();
    }, [id, user]);

    // 2. Timer Logic
    useEffect(() => {
        if (!data) return;
        const tick = () => {
            const target = new Date(data.openDate || data.unlockDate || Date.now()).getTime();
            const now = Date.now();
            const diff = target - now;

            if (diff <= 0) {
                setIsTimeLocked(false);
                setTimeLeft("00:00:00:00");
            } else {
                setIsTimeLocked(true);
                const d = Math.floor(diff / (1000 * 60 * 60 * 24));
                const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                const s = Math.floor((diff % (1000 * 60)) / 1000);
                setTimeLeft(`${d}d ${h}h ${m}m ${s}s`);
            }
        };
        tick();
        const interval = setInterval(tick, 1000);
        return () => clearInterval(interval);
    }, [data]);

    // 3. Dirt Canvas Logic
    useEffect(() => {
        if (loading || !canvasRef.current) return;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const width = window.innerWidth;
        const height = window.innerHeight;
        canvas.width = width; canvas.height = height;

        ctx.fillStyle = '#0a0a0a';
        ctx.fillRect(0, 0, width, height);
        
        // Cyber-debris
        for(let i=0; i<2000; i++) {
            ctx.fillStyle = Math.random() > 0.8 ? '#332200' : '#111';
            ctx.fillRect(Math.random() * width, Math.random() * height, 2, 2);
        }

        if (!isTimeLocked) {
            ctx.globalCompositeOperation = 'destination-out';
            ctx.beginPath(); ctx.arc(width/2, height/2, 120, 0, Math.PI*2); ctx.fill();
            ctx.globalCompositeOperation = 'source-over';
        }

        const scrub = (e) => {
            if (isTimeLocked) return;
            const rect = canvas.getBoundingClientRect();
            const x = (e.clientX || e.touches[0].clientX) - rect.left;
            const y = (e.clientY || e.touches[0].clientY) - rect.top;
            ctx.globalCompositeOperation = 'destination-out';
            ctx.beginPath(); ctx.arc(x, y, 50, 0, Math.PI*2); ctx.fill();
            ctx.globalCompositeOperation = 'source-over';
        };

        canvas.addEventListener('mousemove', scrub);
        canvas.addEventListener('touchmove', scrub);
        return () => {
            canvas.removeEventListener('mousemove', scrub);
            canvas.removeEventListener('touchmove', scrub);
        };
    }, [loading, isTimeLocked]);

    // Handlers
    const handleVaultRotate = (e) => {
        if (isTimeLocked || isVaultOpen) return;
        const cx = window.innerWidth / 2;
        const cy = window.innerHeight / 2;
        const x = e.clientX || e.touches[0].clientX;
        const y = e.clientY || e.touches[0].clientY;
        const rot = Math.atan2(y - cy, x - cx) * (180 / Math.PI);
        setLockRotation(rot);
    };

    const startScan = () => {
        if (scanProgress >= 100) return;
        scanInterval.current = setInterval(() => {
            setScanProgress(p => {
                if (p >= 100) {
                    clearInterval(scanInterval.current);
                    return 100;
                }
                return p + 2;
            });
        }, 30);
    };

    const stopScan = () => {
        if (scanProgress < 100) {
            clearInterval(scanInterval.current);
            setScanProgress(0);
        }
    };

    const handleTuning = (e) => {
        // Mock tuning logic: Target is 104.5
        const val = parseFloat(e.target.value);
        setFrequency(val);
        if (val > 103 && val < 106) setIsTuned(true);
        else setIsTuned(false);
    };

    if (loading) return <div className="loader-wrap"><Loader2 className="animate-spin" size={48} /><p className="terminal-text">INITIALIZING...</p><GlobalStyles /></div>;

    return (
        <div className="capsule-wrapper">
            <GlobalStyles />
            <div className="scanlines"></div>
            <div className="hud-border">
                <div className="hud-corner tl"></div>
                <div className="hud-corner tr"></div>
                <div className="hud-corner bl"></div>
                <div className="hud-corner br"></div>
            </div>

            {/* Floating Spotify Player */}
            {data?.song && (
                <div className="floating-spotify-player">
                    <div className="spotify-disc" style={{ animationPlayState: isPlaying ? 'running' : 'paused' }}>
                        {data.song.albumArt && (
                            <img
                                src={data.song.albumArt}
                                alt="Album Art"
                            />
                        )}
                    </div>
                    <div className="spotify-info-mini">
                        <span className="scrolling-text">{data.song.name} - {data.song.artist}</span>
                    </div>
                    <button className="mini-play-btn" onClick={() => setIsPlaying(!isPlaying)}>
                        {isPlaying ? <Pause size={16} /> : <Play size={16} />}
                    </button>
                </div>
            )}

            <div className="capsule-scroller" ref={scrollRef}>
                
                {/* 1. BURIAL SITE */}
                <section className="capsule-section">
                    <canvas ref={canvasRef} className="dirt-canvas" />
                    <div className="burial-info">
                        <div className="capsule-icon-container">
                            <div className="capsule-icon animate-pulse-amber">
                                <Hourglass size={64} color="var(--c-amber)" />
                            </div>
                        </div>
                        <h2>TIME CAPSULE DETECTED</h2>
                        <p className="terminal-text" style={{fontSize: '1.1rem', marginBottom: '1rem'}}>
                            {isTimeLocked 
                                ? `STATUS: TEMPORAL SEAL ACTIVE // UNLOCKS IN: ${timeLeft}` 
                                : "STATUS: SEAL BROKEN // ACCESS GRANTED"}
                        </p>
                        <div className="capsule-stats" style={{display: 'flex', gap: '20px', justifyContent: 'center', marginTop: '1rem'}}>
                            <div className="stat-item">
                                <div className="stat-label-small">ORIGIN</div>
                                <div className="stat-val-small">{data?.sender || "UNKNOWN"}</div>
                            </div>
                            <div className="stat-item">
                                <div className="stat-label-small">RECIPIENT</div>
                                <div className="stat-val-small">{data?.recipient || "FUTURE SELF"}</div>
                            </div>
                            <div className="stat-item">
                                <div className="stat-label-small">STATUS</div>
                                <div className="stat-val-small" style={{color: isTimeLocked ? 'var(--c-alert)' : 'var(--c-amber)'}}>
                                    {isTimeLocked ? 'LOCKED' : 'UNLOCKED'}
                                </div>
                            </div>
                        </div>
                        {isTimeLocked && (
                            <div className="lock-warning" style={{marginTop: '2rem', padding: '1rem', border: '1px solid var(--c-amber-dim)', background: 'rgba(255, 176, 0, 0.05)'}}>
                                <Lock size={24} color="var(--c-alert)" style={{marginBottom: '0.5rem'}} />
                                <p className="terminal-text" style={{fontSize: '0.9rem'}}>
                                    TEMPORAL LOCK ENGAGED<br/>
                                    RETURN WHEN TIMELINE CONVERGES
                                </p>
                            </div>
                        )}
                    </div>
                    {!isTimeLocked && (
                        <div className="scroll-hint animate-pulse-amber">
                            <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                                <Unlock size={20} />
                                <span>SCROLL TO ACCESS CAPSULE</span>
                            </div>
                        </div>
                    )}
                </section>

                {/* 2. CHRONO-LOCK */}
                <section className="capsule-section">
                    <h2>TEMPORAL LOCK</h2>
                    <div className="vault-container" onMouseMove={handleVaultRotate} onTouchMove={handleVaultRotate}>
                        <div className="vault-ring" style={{ transform: `rotate(${lockRotation}deg)` }} />
                        <div className="vault-center">
                            {isTimeLocked ? (
                                <>
                                    <Lock size={40} color="var(--c-alert)" />
                                    <div className="terminal-text" style={{fontSize: '1.5rem', marginTop: '1rem'}}>{timeLeft}</div>
                                </>
                            ) : (
                                <>
                                    <Unlock size={40} color="var(--c-amber)" />
                                    <button 
                                        onClick={() => setIsVaultOpen(true)}
                                        style={{marginTop:'1rem', background:'transparent', border:'1px solid var(--c-amber)', color:'var(--c-amber)', padding:'10px 20px', fontFamily:'var(--font-mono)', cursor:'pointer'}}
                                    >
                                        DISENGAGE LOCK
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </section>

                {/* CONTENT BELOW REQUIRES UNLOCK */}
                {isVaultOpen && !isTimeLocked && (
                    <>
                        {/* 3. BIO-METRIC SCAN */}
                        <section className="capsule-section">
                            <h2>IDENTITY VERIFICATION</h2>
                            <div 
                                className="scanner-pad"
                                onMouseDown={startScan}
                                onMouseUp={stopScan}
                                onMouseLeave={stopScan}
                                onTouchStart={startScan}
                                onTouchEnd={stopScan}
                                style={{ borderColor: scanProgress === 100 ? 'var(--c-amber)' : 'var(--c-amber-dim)' }}
                            >
                                <Fingerprint size={64} color={scanProgress === 100 ? 'var(--c-amber)' : '#333'} />
                                <div className="scanner-beam"></div>
                            </div>
                            <div style={{width: '200px', height: '4px', background:'#333', marginTop:'20px'}}>
                                <div style={{width: `${scanProgress}%`, height:'100%', background:'var(--c-amber)', transition:'width 0.1s'}}></div>
                            </div>
                            <p className="terminal-text" style={{marginTop:'10px'}}>
                                {scanProgress === 100 ? "ACCESS GRANTED" : "HOLD TO SCAN"}
                            </p>
                        </section>

                        {/* 4. SIGNAL TUNING (AUDIO) */}
                        {data.song && (
                            <section className="capsule-section">
                                <h2>AUDIO FREQUENCY</h2>
                                <Radio size={48} color="var(--c-amber)" style={{marginBottom:'20px'}} />
                                <div style={{position:'relative', width:'300px', textAlign:'center'}}>
                                    <input 
                                        type="range" min="80" max="120" step="0.1" 
                                        value={frequency} onChange={handleTuning}
                                        className="cyber-range"
                                    />
                                    <div className="frequency-display">{frequency.toFixed(1)} MHz</div>
                                    <div className="terminal-text" style={{color: isTuned ? 'var(--c-amber)' : '#555'}}>
                                        {isTuned ? `SIGNAL LOCKED: ${data.song.name}` : "SEARCHING..."}
                                    </div>
                                    {isTuned && (
                                        <button 
                                            onClick={() => setIsPlaying(!isPlaying)}
                                            style={{marginTop:'1rem', background:'var(--c-amber)', border:'none', padding:'10px 20px', fontWeight:'bold', cursor:'pointer'}}
                                        >
                                            {isPlaying ? "HALT PLAYBACK" : "INITIATE PLAYBACK"}
                                        </button>
                                    )}
                                </div>
                            </section>
                        )}

                        {/* 5. VISUAL CALIBRATION (IMAGE) */}
                        {data.imageUrl && (
                            <section className="capsule-section">
                                <h2>VISUAL RECOVERY</h2>
                                <div className="calibration-container">
                                    <div 
                                        className="blurred-image"
                                        style={{ 
                                            backgroundImage: `url(${data.imageUrl})`,
                                            filter: `blur(${20 - (calibration / 5)}px) grayscale(${100 - calibration}%)`
                                        }}
                                    ></div>
                                    <Crosshair size={24} color="var(--c-amber)" style={{position:'absolute', top:'50%', left:'50%', transform:'translate(-50%, -50%)', opacity: 0.5}} />
                                </div>
                                <input 
                                    type="range" min="0" max="100" 
                                    value={calibration} onChange={(e) => setCalibration(e.target.value)}
                                    className="cyber-range" 
                                    style={{width: '300px', marginTop: '20px'}}
                                />
                                <p className="terminal-text">CALIBRATE SENSOR ARRAY</p>
                            </section>
                        )}

                        {/* 6. ARTIFACTS */}
                        {data.items && data.items.length > 0 && (
                            <section className="capsule-section">
                                <h2>PHYSICAL ASSETS</h2>
                                <div className="artifact-grid">
                                    {data.items.map((item, i) => (
                                        <div key={i} className="artifact-item">
                                            <Database size={24} color="var(--c-amber)" style={{marginBottom:'10px'}} />
                                            <div className="terminal-text">{item}</div>
                                            <div style={{fontSize:'0.6rem', color:'#555', marginTop:'5px'}}>ITEM_ID_{1000+i}</div>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* 7. METADATA STATS */}
                        <section className="capsule-section">
                            <h2>SYSTEM LOGS</h2>
                            <div className="stat-grid">
                                <div className="stat-box">
                                    <div className="stat-label">Origin Sender</div>
                                    <div className="stat-val">{data.sender}</div>
                                </div>
                                <div className="stat-box">
                                    <div className="stat-label">Intended Recipient</div>
                                    <div className="stat-val">{data.recipient}</div>
                                </div>
                                <div className="stat-box">
                                    <div className="stat-label">Time Drift</div>
                                    <div className="stat-val">0.0004 ms</div>
                                </div>
                                <div className="stat-box">
                                    <div className="stat-label">Integrity</div>
                                    <div className="stat-val">98.4%</div>
                                </div>
                            </div>
                        </section>

                        {/* 8. THE MESSAGE */}
                        <section className="capsule-section">
                            <h2>DATA FRAGMENT</h2>
                            <div className="digital-paper">
                                <Terminal size={20} color="var(--c-amber)" style={{marginBottom:'1rem'}} />
                                <p className="terminal-text" style={{whiteSpace: 'pre-wrap', color: '#ccc'}}>
                                    {data.message}
                                </p>
                                <div style={{borderTop:'1px solid #333', marginTop:'2rem', paddingTop:'1rem', textAlign:'right', color:'var(--c-amber)'}}>
                                    // END OF TRANSMISSION
                                </div>
                            </div>
                        </section>

                        {/* 9. ORIGIN COORDINATES */}
                        <section className="capsule-section">
                            <h2>ORIGIN VECTOR</h2>
                            <div style={{position:'relative'}}>
                                <div className="star-canvas animate-pulse-amber">
                                    <Globe size={300} strokeWidth={0.5} color="#333" />
                                </div>
                                <MapIcon size={32} color="var(--c-amber)" style={{position:'absolute', top:'50%', left:'50%', transform:'translate(-50%, -50%)'}} />
                            </div>
                            <p className="terminal-text" style={{marginTop:'1rem'}}>SECTOR 7G // EARTH // TERRA</p>
                        </section>

                        {/* 10. RESEAL / FOOTER */}
                        <section className="capsule-section" style={{background: '#000', borderBottom: 'none'}}>
                            <ShieldCheck size={64} color="var(--c-amber-dim)" style={{marginBottom:'20px'}} />
                            <h2>PROTOCOL COMPLETE</h2>
                            <p className="terminal-text">DATA HAS BEEN ACCESSED AND LOGGED.</p>
                            <button 
                                onClick={() => scrollRef.current.scrollTo({ top: 0, behavior: 'smooth' })}
                                style={{marginTop:'3rem', background:'transparent', border:'1px solid #555', color:'#555', padding:'10px 20px', cursor:'pointer', display:'flex', alignItems:'center', gap:'10px'}}
                            >
                                <RotateCcw size={16} /> RETURN TO SURFACE
                            </button>
                        </section>
                    </>
                )}
            </div>
        </div>
    );
};

export default CapsulePage;


