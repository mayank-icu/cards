import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase'; // Assumes your firebase config is here
import { normalizeCardData, resolveCardId } from '../../utils/slugs'; // Assumes your utils are here
import CardViewHeader from '../../components/CardViewHeader';
import CardFooter from '../../components/CardFooter'; // Assumes your header is here
import SongPlayer from '../../components/SongPlayer'; // Assumes your player is here
import {
    Droplets,
    Wind,
    Sparkles,
    Sun,
    MoveVertical,
    Apple,
    Timer,
    Smile,
    Heart
} from 'lucide-react';

/* --- AUDIO ENGINE --- */
const useAudioEngine = () => {
    const contextRef = useRef(null);
    const [isReady, setIsReady] = useState(false);

    const initAudio = () => {
        if (!contextRef.current) {
            contextRef.current = new (window.AudioContext || window.webkitAudioContext)();
            setIsReady(true);
        }
        if (contextRef.current.state === 'suspended') {
            contextRef.current.resume();
        }
    };

    const playWaterSound = () => {
        if (!contextRef.current) return;
        const ctx = contextRef.current;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();

        osc.type = 'sawtooth';
        osc.frequency.value = 400;
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(400, ctx.currentTime);
        filter.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 1);

        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 1);
    };

    const playGong = () => {
        if (!contextRef.current) return;
        const ctx = contextRef.current;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(200, ctx.currentTime);
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 3);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 3);
    };

    const playBite = () => {
        if (!contextRef.current) return;
        const ctx = contextRef.current;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.frequency.setValueAtTime(800, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.1);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.1);
    }

    return { initAudio, playWaterSound, playGong, playBite, isReady };
};

/* --- SECTIONS --- */

// 1. Cover
const SectionCover = ({ data, onStart }) => (
    <div className="section spa-cover">
        <div className="content-wrap">
            <h1 className="title-serif">Spa Mode</h1>
            <p className="subtitle">For {data?.recipient || 'You'}</p>
            <button className="start-btn" onClick={onStart}>
                <span className="btn-text">Begin Session</span>
                <div className="btn-glow"></div>
            </button>
        </div>
    </div>
);

// 2. Drink Water
const SectionWater = ({ playWater }) => {
    const [fill, setFill] = useState(10);
    const intervalRef = useRef(null);

    const startFill = () => {
        intervalRef.current = setInterval(() => {
            setFill(prev => {
                if (prev < 90) playWater();
                return Math.min(prev + 2, 95);
            });
        }, 100);
    };

    const stopFill = () => clearInterval(intervalRef.current);

    return (
        <div className="section spa-blue">
            <div className="instruction-overlay">Hold to fill</div>
            <div
                className="glass-container"
                onMouseDown={startFill}
                onMouseUp={stopFill}
                onMouseLeave={stopFill}
                onTouchStart={startFill}
                onTouchEnd={stopFill}
            >
                <div className="glass">
                    <div className="water" style={{ height: `${fill}%` }}>
                        <div className="bubbles"></div>
                    </div>
                </div>
            </div>
            <h3>Hydrate</h3>
        </div>
    );
};

// 3. Unclench
const SectionUnclench = () => (
    <div className="section spa-dark">
        <div className="breathe-text">
            <span className="breathe-in">Unclench your jaw</span>
            <span className="breathe-hold">Drop your shoulders</span>
            <span className="breathe-out">Breathe</span>
        </div>
    </div>
);

// 4. Social Detox
const SectionDetox = ({ playGong }) => {
    const [swiped, setSwiped] = useState(false);
    const [startX, setStartX] = useState(0);
    const [offset, setOffset] = useState(0);

    const handleStart = (e) => setStartX(e.touches ? e.touches[0].clientX : e.clientX);

    const handleMove = (e) => {
        if (swiped) return;
        const current = e.touches ? e.touches[0].clientX : e.clientX;
        const diff = current - startX;
        setOffset(diff);
    };

    const handleEnd = () => {
        if (Math.abs(offset) > 150) {
            setSwiped(true);
            playGong();
        } else {
            setOffset(0);
        }
    };

    return (
        <div className="section spa-white">
            <h3>Disconnect</h3>
            <div
                className={`phone-card ${swiped ? 'thrown' : ''}`}
                style={{ transform: `translateX(${swiped ? (offset > 0 ? '200vw' : '-200vw') : offset + 'px'}) rotate(${offset * 0.1}deg)` }}
                onMouseDown={handleStart}
                onMouseMove={handleMove}
                onMouseUp={handleEnd}
                onTouchStart={handleStart}
                onTouchMove={handleMove}
                onTouchEnd={handleEnd}
            >
                <div className="phone-screen">
                    <div className="notification">New Emai...</div>
                    <div className="notification">Breaking Ne...</div>
                    <div className="notification">Meeting in 5...</div>
                </div>
            </div>
            {!swiped && <p className="hint">Swipe the noise away</p>}
        </div>
    );
};

// 5. Skin Care (Canvas)
const SectionSkinCare = () => {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const resize = () => {
            canvas.width = 300;
            canvas.height = 400;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.strokeStyle = '#a8e6cf'; // Cucumber Green
            ctx.lineWidth = 40;
        }
        resize();
    }, []);

    const draw = (x, y) => {
        const ctx = canvasRef.current.getContext('2d');
        ctx.lineTo(x, y);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x, y);
    };

    const handleMove = (e) => {
        const rect = canvasRef.current.getBoundingClientRect();
        const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
        const y = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top;
        draw(x, y);
    };

    return (
        <div className="section spa-green">
            <h3>Self Care</h3>
            <p className="hint">Apply the mask</p>
            <div className="face-container">
                <div className="face-base"></div>
                <canvas
                    ref={canvasRef}
                    className="face-canvas"
                    onMouseDown={(e) => {
                        const rect = canvasRef.current.getBoundingClientRect();
                        const ctx = canvasRef.current.getContext('2d');
                        ctx.beginPath();
                        ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
                        window.addEventListener('mousemove', handleMove);
                        window.addEventListener('mouseup', () => window.removeEventListener('mousemove', handleMove), { once: true });
                    }}
                    onTouchStart={(e) => {
                        e.preventDefault(); // Prevent scroll
                        const rect = canvasRef.current.getBoundingClientRect();
                        const ctx = canvasRef.current.getContext('2d');
                        ctx.beginPath();
                        ctx.moveTo(e.touches[0].clientX - rect.left, e.touches[0].clientY - rect.top);
                    }}
                    onTouchMove={handleMove}
                />
            </div>
        </div>
    );
};

// 6. Sunlight
const SectionSunlight = ({ playGong }) => {
    const [gap, setGap] = useState(0);

    return (
        <div className="section spa-dark-room">
            <div className="sun-bg">
                <Sun size={80} color="#FDB813" className="sun-icon" />
            </div>
            <div className="blinds-container">
                <div className="blind left" style={{ transform: `translateX(-${gap}%)` }}></div>
                <div className="blind right" style={{ transform: `translateX(${gap}%)` }}></div>
            </div>
            <input
                type="range"
                min="0"
                max="100"
                value={gap}
                onChange={(e) => {
                    setGap(e.target.value);
                    if (e.target.value > 90) playGong();
                }}
                className="blind-slider"
            />
            <p className="hint">Let the light in</p>
        </div>
    );
};

// 7. Stretch
const SectionStretch = () => {
    const [stretch, setStretch] = useState(0);

    return (
        <div className="section spa-blue">
            <h3>Stretch</h3>
            <div
                className="stretcher"
                style={{ height: `${200 + stretch}px` }}
                onMouseDown={(e) => {
                    const startY = e.clientY;
                    const onMove = (moveE) => {
                        const delta = startY - moveE.clientY;
                        if (delta > 0) setStretch(Math.min(delta, 150));
                    };
                    window.addEventListener('mousemove', onMove);
                    window.addEventListener('mouseup', () => window.removeEventListener('mousemove', onMove), { once: true });
                }}
                onTouchStart={(e) => {
                    const startY = e.touches[0].clientY;
                    const onMove = (moveE) => {
                        const delta = startY - moveE.touches[0].clientY;
                        if (delta > 0) setStretch(Math.min(delta, 150));
                    };
                    window.addEventListener('touchmove', onMove);
                    window.addEventListener('touchend', () => window.removeEventListener('touchmove', onMove), { once: true });
                }}
            >
                <div className="head"></div>
                <div className="body"></div>
                <div className="arms" style={{ transform: `rotate(${stretch > 50 ? -150 : 0}deg)` }}></div>
            </div>
            <p className="hint">Drag up to reach</p>
        </div>
    );
};

// 8. Healthy Snack
const SectionSnack = ({ playBite }) => {
    const [bites, setBites] = useState([]);

    const addBite = (e) => {
        playBite();
        const rect = e.target.getBoundingClientRect();
        const x = (e.clientX || e.touches[0].clientX) - rect.left;
        const y = (e.clientY || e.touches[0].clientY) - rect.top;
        setBites([...bites, { x, y }]);
    };

    return (
        <div className="section spa-green">
            <h3>Nourish</h3>
            <div className="apple-container" onClick={addBite}>
                <Apple size={150} color="#ff6b6b" fill="#ff6b6b" />
                {bites.map((b, i) => (
                    <div key={i} className="bite-mark" style={{ left: b.x, top: b.y }}></div>
                ))}
            </div>
        </div>
    );
};

// 9. Do Nothing
const SectionNothing = ({ playGong }) => {
    const [progress, setProgress] = useState(0);
    const [failed, setFailed] = useState(false);

    useEffect(() => {
        const timer = setInterval(() => {
            setProgress(prev => {
                if (prev >= 100) {
                    clearInterval(timer);
                    playGong();
                    return 100;
                }
                return prev + 1;
            });
        }, 100);

        const reset = () => {
            if (progress < 100) {
                setFailed(true);
                setProgress(0);
                setTimeout(() => setFailed(false), 500);
            }
        };

        window.addEventListener('mousemove', reset);
        window.addEventListener('touchmove', reset);

        return () => {
            clearInterval(timer);
            window.removeEventListener('mousemove', reset);
            window.removeEventListener('touchmove', reset);
        };
    }, [progress, playGong]);

    return (
        <div className="section spa-dark">
            <Timer size={40} className={failed ? 'shake' : ''} />
            <h3>Do Nothing</h3>
            <div className="progress-bar-bg">
                <div className="progress-bar-fill" style={{ width: `${progress}%` }}></div>
            </div>
            <p>{progress === 100 ? "Well done." : "Don't move."}</p>
        </div>
    );
};

// 10. Affirmation
const SectionMirror = () => {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        canvas.width = 300;
        canvas.height = 300;

        // Fill with "steam"
        ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
        ctx.fillRect(0, 0, 300, 300);
    }, []);

    const wipe = (e) => {
        const rect = canvasRef.current.getBoundingClientRect();
        const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
        const y = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top;

        const ctx = canvasRef.current.getContext('2d');
        ctx.globalCompositeOperation = 'destination-out';
        ctx.beginPath();
        ctx.arc(x, y, 30, 0, Math.PI * 2);
        ctx.fill();
    };

    return (
        <div className="section spa-blue">
            <div className="mirror-frame">
                <div className="mirror-text">You are doing great.</div>
                <canvas
                    ref={canvasRef}
                    className="mirror-steam"
                    onMouseMove={wipe}
                    onTouchMove={wipe}
                />
            </div>
            <p className="hint">Wipe the mirror</p>
        </div>
    );
};

// 11. Namaste (Footer)
const SectionNamaste = ({ data }) => (
    <div className="section spa-white end-card">
        <Sparkles size={48} color="#a8e6cf" />
        <h1 className="title-serif">Namaste</h1>
        {data?.imageUrl && <img src={data.imageUrl} className="memory-img" alt="Memory" />}
        <p className="message">{data?.message}</p>
        <div className="sender-tag">
            <span>Sent with love by</span>
            <strong>{data?.sender}</strong>
        </div>
    </div>
);

/* --- MAIN COMPONENT --- */
const SelfCarePage = () => {
    const { id } = useParams();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const { initAudio, playWaterSound, playGong, playBite } = useAudioEngine();

    // Custom CSS Injection
    const styles = `
        :root {
            --spa-blue: #E0F7FA;
            --spa-green: #E8F5E9;
            --spa-dark: #263238;
            --spa-text: #37474F;
            --glass: rgba(255, 255, 255, 0.7);
        }

        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;1,400&family=Inter:wght@300;400;600&display=swap');

        * { box-sizing: border-box; user-select: none; }
        
        body, html {
            margin: 0;
            padding: 0;
            overflow: hidden;
            font-family: 'Inter', sans-serif;
            color: var(--spa-text);
            background: #fff;
        }

        .scroll-container {
            height: 100vh;
            height: 100dvh;
            overflow-y: scroll;
            scroll-snap-type: y mandatory;
            scroll-behavior: smooth;
        }

        .section {
            height: 100vh;
            height: 100dvh;
            width: 100%;
            scroll-snap-align: start;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            position: relative;
            overflow: hidden;
            text-align: center;
            padding: 2rem;
        }

        /* Typography */
        .title-serif {
            font-family: 'Playfair Display', serif;
            font-size: 3.5rem;
            margin: 0 0 1rem 0;
            font-weight: 400;
        }
        .subtitle { font-size: 1.2rem; opacity: 0.6; letter-spacing: 2px; text-transform: uppercase; }
        .hint { margin-top: 2rem; opacity: 0.5; font-size: 0.9rem; animation: pulse 2s infinite; }

        /* Themes */
        .spa-cover { background: linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%); }
        .spa-blue { background: var(--spa-blue); }
        .spa-green { background: var(--spa-green); }
        .spa-dark { background: var(--spa-dark); color: white; }
        .spa-white { background: #fff; }
        .spa-dark-room { background: #1a1a1a; color: white; }

        /* Elements */
        .start-btn {
            background: white;
            border: none;
            padding: 1rem 3rem;
            border-radius: 50px;
            font-family: 'Playfair Display';
            font-size: 1.2rem;
            cursor: pointer;
            margin-top: 2rem;
            box-shadow: 0 10px 20px rgba(0,0,0,0.1);
            transition: transform 0.3s;
        }
        .start-btn:active { transform: scale(0.95); }

        /* Water Section */
        .glass-container {
            width: 120px;
            height: 200px;
            border: 4px solid #B2EBF2;
            border-top: none;
            border-radius: 0 0 20px 20px;
            position: relative;
            cursor: pointer;
            overflow: hidden;
            background: rgba(255,255,255,0.5);
        }
        .water {
            position: absolute;
            bottom: 0;
            left: 0;
            width: 100%;
            background: #4DD0E1;
            transition: height 0.1s;
        }

        /* Breathing */
        .breathe-text span {
            display: block;
            font-size: 2rem;
            font-family: 'Playfair Display';
            opacity: 0;
            animation: fadeInOut 6s infinite;
        }
        .breathe-in { animation-delay: 0s; }
        .breathe-hold { animation-delay: 2s; }
        .breathe-out { animation-delay: 4s; }

        /* Phone */
        .phone-card {
            width: 200px;
            height: 350px;
            background: #2d3436;
            border-radius: 20px;
            padding: 10px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.2);
            cursor: grab;
            transition: transform 0.1s;
            position: relative;
        }
        .phone-card.thrown { transition: transform 0.8s cubic-bezier(0.2, 0.8, 0.2, 1); }
        .phone-screen {
            background: #dfe6e9;
            width: 100%;
            height: 100%;
            border-radius: 15px;
            padding: 20px;
            display: flex;
            flex-direction: column;
            gap: 10px;
            overflow: hidden;
        }
        .notification { background: white; padding: 10px; border-radius: 8px; font-size: 0.8rem; box-shadow: 0 2px 5px rgba(0,0,0,0.05); }

        /* Face */
        .face-container {
            position: relative;
            width: 300px;
            height: 400px;
        }
        .face-base {
            width: 100%;
            height: 100%;
            background: #ffeaa7;
            border-radius: 150px;
            border: 4px solid #fff;
        }
        .face-canvas {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            touch-action: none;
        }

        /* Blinds */
        .blinds-container {
            position: absolute;
            top: 0; left: 0; width: 100%; height: 100%;
            display: flex;
            pointer-events: none;
        }
        .blind { background: #333; height: 100%; width: 50%; transition: transform 0.1s; z-index: 2; }
        .sun-icon { position: absolute; z-index: 1; top: 40%; left: 50%; transform: translate(-50%, -50%); animation: spin 20s linear infinite; }
        .blind-slider {
            position: absolute; bottom: 10%; width: 80%; z-index: 10;
        }

        /* Stretch */
        .stretcher {
            width: 60px;
            background: #ff7675;
            border-radius: 30px;
            position: relative;
            display: flex;
            flex-direction: column;
            align-items: center;
        }
        .head { width: 50px; height: 50px; background: #ffeaa7; border-radius: 50%; margin-top: -25px; z-index: 2;}
        .arms { 
            width: 140px; height: 20px; background: #ffeaa7; border-radius: 10px; 
            position: absolute; top: 40px; transition: transform 0.2s;
        }

        /* Apple */
        .apple-container { position: relative; cursor: pointer; transition: transform 0.1s; }
        .apple-container:active { transform: scale(0.95); }
        .bite-mark {
            position: absolute; width: 40px; height: 40px;
            background: var(--spa-green); border-radius: 50%;
            transform: translate(-50%, -50%);
        }

        /* Progress */
        .progress-bar-bg { width: 200px; height: 4px; background: rgba(255,255,255,0.2); margin: 2rem auto; border-radius: 2px; }
        .progress-bar-fill { height: 100%; background: #fff; transition: width 0.1s linear; }
        .shake { animation: shake 0.5s; }

        /* Mirror */
        .mirror-frame {
            width: 300px; height: 300px; border-radius: 50%;
            border: 10px solid #fff;
            position: relative;
            overflow: hidden;
            background: #81ecec;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
        }
        .mirror-text { font-family: 'Playfair Display'; font-size: 1.5rem; color: #00cec9; font-weight: bold; }
        .mirror-steam { position: absolute; top: 0; left: 0; width: 100%; height: 100%; touch-action: none; }

        /* End Card */
        .end-card { padding: 3rem; max-width: 600px; margin: 0 auto; }
        .memory-img { width: 100%; max-height: 300px; object-fit: cover; border-radius: 15px; margin: 2rem 0; box-shadow: 0 5px 15px rgba(0,0,0,0.1); }
        .message { font-size: 1.25rem; line-height: 1.6; font-family: 'Playfair Display'; color: #636e72; }
        .sender-tag { margin-top: 3rem; border-top: 1px solid #eee; padding-top: 1rem; display: flex; flex-direction: column; gap: 0.5rem; text-transform: uppercase; font-size: 0.8rem; letter-spacing: 2px; color: #b2bec3; }
        .sender-tag strong { color: #2d3436; font-size: 1.2rem; }

        /* Loading */
        .loading-screen { height: 100vh; display: flex; align-items: center; justify-content: center; background: var(--spa-blue); }
        .spinner { width: 40px; height: 40px; border: 4px solid #fff; border-top-color: transparent; border-radius: 50%; animation: spin 1s linear infinite; }

        /* Animations */
        @keyframes pulse { 0%, 100% { opacity: 0.5; } 50% { opacity: 1; } }
        @keyframes spin { 100% { transform: translate(-50%, -50%) rotate(360deg); } }
        @keyframes fadeInOut { 0%, 100% { opacity: 0; } 20%, 80% { opacity: 1; } }
        @keyframes shake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-5px); } 75% { transform: translateX(5px); } }

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
        }
    `;

    useEffect(() => {
        let unsubscribe = null;
        
        const setupSubscription = async () => {
            try {
                // If the utils function doesn't exist in environment, this block handles safety
                let docId = id;
                if (typeof resolveCardId === 'function') {
                    const result = await resolveCardId(id, 'self_care_cards', 'self-care');
                    if (result) docId = result.id;
                    else { setLoading(false); return; }
                }
                else { setLoading(false); return; }

                const docRef = doc(db, 'self_care_cards', docId);
                unsubscribe = onSnapshot(docRef, (docSnap) => {
                    if (docSnap.exists()) setData(normalizeCardData(docSnap.data()));
                    setLoading(false);
                }, (err) => {
                    console.error(err);
                    setLoading(false);
                });
            } catch (error) {
                console.error("Error:", error);
                setLoading(false);
            }
        };
        
        setupSubscription();
        return () => unsubscribe && unsubscribe();
    }, [id]);

    const handleStart = () => {
        initAudio();
        document.querySelector('.scroll-container').scrollBy({ top: window.innerHeight, behavior: 'smooth' });
    }

    if (loading) return (
        <div className="loading-screen">
            <style>{styles}</style>
            <div className="spinner"></div>
            <CardFooter />
        </div>
    );

    // Default data for demo if not found or no ID
    const displayData = data || {
        recipient: "Friend",
        sender: "A Well Wisher",
        message: "Taking time for yourself isn't selfish, it's essential. Just a few moments to breathe.",
        imageUrl: null
    };

    return (
        <div className="scroll-container">
            <style>{styles}</style>

            {/* Floating Spotify Player */}
            {(() => {
                const getSpotifyId = (url) => {
                    if (!url) return null;
                    try {
                        const parts = url.split('/');
                        return parts[parts.length - 1].split('?')[0];
                    } catch (e) { return null; }
                };
                const spotifyId = getSpotifyId(data?.song);
                return spotifyId && (
                    <div className="spotify-float">
                        <div className="spotify-icon"><Heart size={18} /></div>
                        <iframe
                            src={`https://open.spotify.com/embed/track/${spotifyId}?utm_source=generator&theme=0`}
                            frameBorder="0"
                            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                            loading="lazy"
                            title="Spotify Player"
                        ></iframe>
                    </div>
                );
            })()}

            {/* 0. Header (Fixed) */}
            <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', zIndex: 100, pointerEvents: 'none' }}>
                <CardViewHeader />
            </div>

            {/* Audio Player Component (Hidden/Fixed) */}
            {data?.song && <SongPlayer song={data.song} />}

            {/* 1. Cover */}
            <SectionCover data={displayData} onStart={handleStart} />

            {/* 2. Drink */}
            <SectionWater playWater={playWaterSound} />

            {/* 3. Unclench */}
            <SectionUnclench />

            {/* 4. Detox */}
            <SectionDetox playGong={playGong} />

            {/* 5. Skin Care */}
            <SectionSkinCare />

            {/* 6. Sunlight */}
            <SectionSunlight playGong={playGong} />

            {/* 7. Stretch */}
            <SectionStretch />

            {/* 8. Snack */}
            <SectionSnack playBite={playBite} />

            {/* 9. Nothing */}
            <SectionNothing playGong={playGong} />

            {/* 10. Affirmation */}
            <SectionMirror />

            {/* 11. Namaste */}
            <SectionNamaste data={displayData} />
            <CardFooter />
        </div>
    );
};

export default SelfCarePage;


