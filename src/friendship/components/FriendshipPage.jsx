import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';
import { normalizeCardData, resolveCardId } from '../../utils/slugs';
import CardViewHeader from '../../components/CardViewHeader';
import CardFooter from '../../components/CardFooter';
import SongPlayer from '../../components/SongPlayer';
import {
    Gamepad2,
    Ghost,
    Heart,
    Trophy,
    Zap,
    Star,
    Pizza,
    Film,
    Music,
    RefreshCw,
    Hand,
    ThumbsUp
} from 'lucide-react';

/* --- 8-BIT AUDIO ENGINE --- */
const useArcadeAudio = () => {
    const ctxRef = useRef(null);

    const initAudio = () => {
        if (!ctxRef.current) {
            ctxRef.current = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (ctxRef.current.state === 'suspended') {
            ctxRef.current.resume();
        }
    };

    const playTone = (freq, type, duration, vol = 0.1) => {
        if (!ctxRef.current) return;
        const osc = ctxRef.current.createOscillator();
        const gain = ctxRef.current.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(freq, ctxRef.current.currentTime);

        gain.gain.setValueAtTime(vol, ctxRef.current.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctxRef.current.currentTime + duration);

        osc.connect(gain);
        gain.connect(ctxRef.current.destination);
        osc.start();
        osc.stop(ctxRef.current.currentTime + duration);
    };

    const playCoin = () => {
        initAudio();
        playTone(987.77, 'square', 0.1); // B5
        setTimeout(() => playTone(1318.51, 'square', 0.4), 100); // E6
    };

    const playBlip = () => {
        initAudio();
        playTone(400, 'square', 0.05, 0.05);
    };

    const playJump = () => {
        initAudio();
        if (!ctxRef.current) return;
        const osc = ctxRef.current.createOscillator();
        const gain = ctxRef.current.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(150, ctxRef.current.currentTime);
        osc.frequency.linearRampToValueAtTime(600, ctxRef.current.currentTime + 0.2);
        gain.gain.setValueAtTime(0.1, ctxRef.current.currentTime);
        gain.gain.linearRampToValueAtTime(0, ctxRef.current.currentTime + 0.2);
        osc.connect(gain);
        gain.connect(ctxRef.current.destination);
        osc.start();
        osc.stop(ctxRef.current.currentTime + 0.2);
    };

    const playPowerUp = () => {
        initAudio();
        const notes = [440, 554, 659, 880];
        notes.forEach((freq, i) => {
            setTimeout(() => playTone(freq, 'sawtooth', 0.2, 0.1), i * 100);
        });
    };

    return { initAudio, playCoin, playBlip, playJump, playPowerUp };
};

/* --- SECTIONS --- */

// 1. Insert Coin
const SectionInsertCoin = ({ onStart, data }) => (
    <div className="section scanlines theme-dark">
        <h1 className="pixel-font neon-text title-large">ARCADE MODE</h1>
        <p className="pixel-font subtitle blink">For {data?.friendName || 'Player 2'}</p>

        <div className="coin-slot-container" onClick={onStart}>
            <div className="coin-slot">
                <div className="coin-hole"></div>
            </div>
            <div className="insert-coin-text pixel-font blink-fast">INSERT COIN</div>
        </div>
    </div>
);


// 2. Player 2 Ready
const SectionPlayer2 = ({ playBlip }) => {
    const [text, setText] = useState("");
    const fullText = "PLAYER 1 READY...\nPLAYER 2 JOINED THE GAME";

    useEffect(() => {
        let i = 0;
        const timer = setInterval(() => {
            if (i < fullText.length) {
                setText(fullText.substring(0, i + 1));
                if (Math.random() > 0.7) playBlip();
                i++;
            } else {
                clearInterval(timer);
            }
        }, 100);
        return () => clearInterval(timer);
    }, []);

    return (
        <div className="section theme-blue">
            <div className="terminal-window">
                <pre className="pixel-font terminal-text">{text}<span className="cursor">_</span></pre>
            </div>
            <Gamepad2 size={64} className="floating-icon" color="#0ff" />
        </div>
    );
};

// 3. High Five (Canvas)
const SectionHighFive = ({ playJump }) => {
    const canvasRef = useRef(null);
    const [slapped, setSlapped] = useState(false);

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        canvas.width = 300;
        canvas.height = 300;

        let handY = 300;
        let isDragging = false;

        const draw = () => {
            ctx.clearRect(0, 0, 300, 300);

            // Static Hand (Top)
            ctx.fillStyle = '#ff00ff'; // Neon Pink
            ctx.fillRect(100, 20, 100, 100);
            ctx.fillStyle = '#000';
            ctx.font = '20px "Press Start 2P"';
            ctx.fillText("P1", 130, 80);

            // Dynamic Hand (Bottom)
            ctx.fillStyle = '#00ffff'; // Neon Cyan
            ctx.fillRect(100, handY - 100, 100, 100);
            ctx.fillStyle = '#000';
            ctx.fillText("P2", 130, handY - 40);

            if (handY < 140 && !slapped) {
                playJump();
                setSlapped(true);
                // Impact visual
                ctx.strokeStyle = '#fff';
                ctx.lineWidth = 5;
                ctx.beginPath();
                ctx.moveTo(80, 120);
                ctx.lineTo(60, 100);
                ctx.moveTo(220, 120);
                ctx.lineTo(240, 100);
                ctx.stroke();
            }
        };

        const updateHand = (y) => {
            if (slapped) return;
            const rect = canvas.getBoundingClientRect();
            handY = Math.max(200, Math.min(400, y - rect.top));
            draw();
        };

        const handleStart = () => { isDragging = true; };
        const handleEnd = () => { isDragging = false; if (!slapped) { handY = 300; draw(); } };
        const handleMove = (e) => {
            if (!isDragging) return;
            const y = e.touches ? e.touches[0].clientY : e.clientY;
            updateHand(y);
        };

        canvas.addEventListener('mousedown', handleStart);
        canvas.addEventListener('mousemove', handleMove);
        canvas.addEventListener('mouseup', handleEnd);
        canvas.addEventListener('touchstart', handleStart, { passive: false });
        canvas.addEventListener('touchmove', (e) => { e.preventDefault(); handleMove(e); }, { passive: false });
        canvas.addEventListener('touchend', handleEnd);

        draw();

        return () => {
            // cleanup
        };
    }, [slapped]);

    return (
        <div className="section theme-dark">
            <h3 className="pixel-font neon-text-blue">HIGH FIVE!</h3>
            <p className="pixel-font small-text">Drag Blue Hand Up</p>
            <canvas ref={canvasRef} className="game-canvas" />
            {slapped && <div className="score-popup pixel-font">NICE! +500 PTS</div>}
        </div>
    );
};

// 4. Secret Handshake (Rhythm)
const SectionHandshake = ({ playBlip, playPowerUp }) => {
    const [taps, setTaps] = useState([]);
    const [unlocked, setUnlocked] = useState(false);

    // Simple code: 3 taps fast
    const handleTap = () => {
        playBlip();
        const now = Date.now();
        const newTaps = [...taps, now].filter(t => now - t < 1000); // Keep only taps within last 1s
        setTaps(newTaps);

        if (newTaps.length >= 3) {
            setUnlocked(true);
            playPowerUp();
        }
    };

    return (
        <div className="section theme-pink">
            <h3 className="pixel-font">SECRET CODE</h3>
            <div
                className={`handshake-btn ${unlocked ? 'unlocked' : ''}`}
                onClick={handleTap}
            >
                {unlocked ? <ThumbsUp size={64} /> : <Hand size={64} />}
            </div>
            <p className="pixel-font small-text">
                {unlocked ? "ACCESS GRANTED" : "TAP RAPIDLY (x3)"}
            </p>
        </div>
    );
};

// 5. Memory Lane (Horizontal Scroll)
const SectionMemory = () => (
    <div className="section theme-blue">
        <h3 className="pixel-font" style={{ marginBottom: '2rem' }}>INVENTORY</h3>
        <div className="scroll-x-container">
            {[<Pizza size={48} />, <Gamepad2 size={48} />, <Film size={48} />, <Music size={48} />, <Ghost size={48} />].map((icon, i) => (
                <div key={i} className="inventory-slot">
                    {icon}
                    <span className="pixel-font slot-num">0{i + 1}</span>
                </div>
            ))}
        </div>
        <p className="pixel-font small-text">SWIPE &gt;&gt;&gt;</p>
    </div>
)

// 6. Sync Test
const SectionSync = ({ playPowerUp, playBlip }) => {
    const [synced, setSynced] = useState(false);
    const [pos, setPos] = useState(0);
    const requestRef = useRef();

    useEffect(() => {
        if (synced) return;
        const animate = (time) => {
            const speed = 0.003;
            const p = (Math.sin(time * speed) + 1) / 2 * 100; // 0 to 100 sine wave
            setPos(p);
            requestRef.current = requestAnimationFrame(animate);
        };
        requestRef.current = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(requestRef.current);
    }, [synced]);

    const checkSync = () => {
        if (pos > 40 && pos < 60) {
            setSynced(true);
            playPowerUp();
            cancelAnimationFrame(requestRef.current);
        } else {
            playBlip();
        }
    };

    return (
        <div className="section theme-dark">
            <h3 className="pixel-font neon-text-pink">SYNC TEST</h3>
            <div className="sync-bar-container">
                <div className="sync-target"></div>
                <div className="sync-cursor" style={{ left: `${pos}%` }}></div>
            </div>
            <button className="arcade-btn" onClick={checkSync} disabled={synced}>
                {synced ? "SYNCED!" : "TAP!"}
            </button>
        </div>
    );
};

// 7. Roast Mode
const SectionRoast = ({ data }) => {
    const [roast, setRoast] = useState(false);
    return (
        <div className="section theme-pink">
            <div className="toggle-container" onClick={() => setRoast(!roast)}>
                <div className={`toggle-switch ${roast ? 'right' : 'left'}`}></div>
                <div className="toggle-labels pixel-font">
                    <span>NICE</span>
                    <span>ROAST</span>
                </div>
            </div>

            <div className="speech-bubble pixel-font">
                {roast
                    ? "You're the Luigi to my Mario (and you know Mario is better)."
                    : (data?.message ? data.message.substring(0, 50) + "..." : "You are the best player 2 ever.")}
            </div>
        </div>
    );
};

// 8. Pizza Share
const SectionPizza = ({ playBlip }) => {
    const [slices, setSlices] = useState([0, 1, 2, 3]); // IDs of slices

    // Visual only - drag logic simplified for reliable interaction
    const removeSlice = (index) => {
        playBlip();
        setSlices(prev => prev.filter((_, i) => i !== index));
    };

    return (
        <div className="section theme-blue">
            <h3 className="pixel-font">SHARE HP</h3>
            <div className="pizza-box">
                {slices.map((_, i) => (
                    <div
                        key={i}
                        className="pizza-slice"
                        style={{ transform: `rotate(${i * 90}deg)` }}
                        onClick={() => removeSlice(i)}
                    >
                        <Pizza size={40} fill="#f1c40f" color="#d35400" />
                    </div>
                ))}
                {slices.length < 4 && <div className="plate-text pixel-font">YUM</div>}
            </div>
            <p className="pixel-font small-text">Tap slices to eat</p>
        </div>
    );
};

// 9. Level Up
const SectionLevelUp = ({ playPowerUp }) => {
    const [level, setLevel] = useState(0);
    const [triggered, setTriggered] = useState(false);

    // Simple intersection observer effect simulation
    // In real usage we'd use a hook to detect view, here we trigger on hover/click or just auto loop

    useEffect(() => {
        if (!triggered) return;
        let l = 0;
        const interval = setInterval(() => {
            l += 2;
            setLevel(l);
            if (l >= 99) {
                clearInterval(interval);
                playPowerUp();
            }
        }, 30);
        return () => clearInterval(interval);
    }, [triggered]);

    return (
        <div className="section theme-dark" onClick={() => setTriggered(true)}>
            <Trophy size={80} color="#f1c40f" className={level === 99 ? "bounce" : ""} />
            <div className="xp-bar-container">
                <div className="xp-bar-fill" style={{ width: `${level}%` }}></div>
            </div>
            <h2 className="pixel-font neon-text">LEVEL {level}</h2>
            <p className="pixel-font small-text blink">{triggered ? "MAX LEVEL" : "TAP TO LEVEL UP"}</p>
        </div>
    );
};

// 10. Game Over / Continue
const SectionGameOver = ({ data }) => {
    const [count, setCount] = useState(9);

    useEffect(() => {
        const timer = setInterval(() => {
            setCount(prev => (prev > 0 ? prev - 1 : 9));
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    return (
        <div className="section theme-black scanlines">
            <h1 className="pixel-font neon-text-red title-large">GAME OVER</h1>
            <div className="continue-screen">
                <p className="pixel-font">CONTINUE?</p>
                <h2 className="pixel-font huge-text">{count}</h2>
            </div>

            <div className="credits-box">
                <p className="pixel-font small-text">CREDITS</p>
                <h3 className="pixel-font">{data?.sender || "PLAYER 1"}</h3>
                <Star size={24} fill="gold" color="gold" style={{ marginTop: '10px' }} />
            </div>
        </div>
    );
};

/* --- MAIN COMPONENT --- */
const FriendshipPage = () => {
    const { id } = useParams();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const { initAudio, playCoin, playBlip, playJump, playPowerUp } = useArcadeAudio();

    // Custom CSS Injection (Retro Arcade Theme)
    const styles = `
        @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');

        :root {
            --neon-pink: #ff00ff;
            --neon-blue: #00ffff;
            --neon-green: #39ff14;
            --bg-dark: #111;
            --bg-term: #0a0a2a;
        }

        * { box-sizing: border-box; user-select: none; }
        
        body, html {
            margin: 0; padding: 0; background: #000;
            font-family: 'Press Start 2P', cursive;
            overflow: hidden;
        }

        .scroll-container {
            height: 100dvh;
            overflow-y: scroll;
            scroll-snap-type: y mandatory;
            scroll-behavior: smooth;
        }

        .section {
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
            padding: 1rem;
        }

        /* Scanlines & CRT Effect */
        .scanlines::before {
            content: " ";
            display: block;
            position: absolute;
            top: 0; left: 0; bottom: 0; right: 0;
            background: linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06));
            z-index: 2;
            background-size: 100% 2px, 3px 100%;
            pointer-events: none;
        }

        /* Themes */
        .theme-dark { background: #050505; color: var(--neon-green); }
        .theme-blue { background: var(--bg-term); color: var(--neon-blue); }
        .theme-pink { background: #2a0a2a; color: var(--neon-pink); }
        .theme-black { background: #000; color: white; }

        /* Typography */
        .pixel-font { font-family: 'Press Start 2P', cursive; line-height: 1.5; }
        .title-large { font-size: 2.5rem; text-shadow: 4px 4px #000; z-index: 10; margin-bottom: 2rem;}
        .subtitle { font-size: 1rem; color: var(--neon-blue); margin-bottom: 3rem; }
        .small-text { font-size: 0.7rem; opacity: 0.8; margin-top: 1rem; letter-spacing: 2px; }
        .huge-text { font-size: 5rem; color: yellow; margin: 1rem 0; }
        
        .neon-text { text-shadow: 0 0 10px var(--neon-green), 0 0 20px var(--neon-green); color: #fff; }
        .neon-text-pink { text-shadow: 0 0 10px var(--neon-pink), 0 0 20px var(--neon-pink); color: #fff; }
        .neon-text-blue { text-shadow: 0 0 10px var(--neon-blue), 0 0 20px var(--neon-blue); color: #fff; }
        .neon-text-red { text-shadow: 0 0 10px red, 0 0 20px red; color: #fff; }

        /* Animations */
        .blink { animation: blink 1s step-end infinite; }
        .blink-fast { animation: blink 0.5s step-end infinite; }
        @keyframes blink { 50% { opacity: 0; } }
        
        .cursor { animation: blink 1s step-end infinite; }

        /* Components */
        
        /* 1. Coin Slot */
        .coin-slot-container { cursor: pointer; display: flex; flex-direction: column; align-items: center; gap: 1rem; transition: transform 0.1s; }
        .coin-slot-container:active { transform: scale(0.95); }
        .coin-slot {
            width: 80px; height: 100px;
            background: #444;
            border: 4px solid #888;
            border-radius: 5px;
            position: relative;
            box-shadow: 0 0 15px rgba(255, 0, 0, 0.5);
        }
        .coin-hole {
            width: 10px; height: 50px; background: #000;
            position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
            border-radius: 5px;
        }

        /* 2. Terminal */
        .terminal-window {
            width: 90%; max-width: 600px;
            background: rgba(0,0,0,0.8);
            border: 2px solid var(--neon-blue);
            padding: 2rem;
            border-radius: 10px;
            box-shadow: 0 0 20px var(--neon-blue);
            min-height: 200px;
            display: flex; align-items: center; justify-content: center;
        }
        .terminal-text { white-space: pre-wrap; color: var(--neon-blue); text-align: left; width: 100%; font-size: 0.9rem; }
        .floating-icon { animation: float 3s ease-in-out infinite; margin-top: 2rem; }
        @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-20px); } }

        /* 3. High Five */
        .game-canvas { border: 4px solid #333; background: #000; image-rendering: pixelated; touch-action: none; }
        .score-popup { position: absolute; top: 20%; color: yellow; font-size: 1.5rem; animation: float 1s ease-out forwards; }

        /* 4. Handshake */
        .handshake-btn {
            width: 120px; height: 120px;
            border: 4px dashed var(--neon-pink);
            border-radius: 50%;
            display: flex; align-items: center; justify-content: center;
            cursor: pointer;
            transition: all 0.2s;
        }
        .handshake-btn:active { transform: scale(0.9); background: var(--neon-pink); color: #000; }
        .handshake-btn.unlocked { border-style: solid; background: var(--neon-green); border-color: var(--neon-green); color: #000; animation: spin 0.5s; }

        /* 5. Inventory */
        .scroll-x-container {
            display: flex; gap: 2rem; overflow-x: auto; 
            width: 100%; padding: 2rem; 
            scroll-snap-type: x mandatory;
        }
        .inventory-slot {
            min-width: 150px; height: 150px;
            border: 4px solid white;
            display: flex; flex-direction: column; align-items: center; justify-content: center;
            scroll-snap-align: center;
            background: rgba(255,255,255,0.1);
        }
        .slot-num { margin-top: 10px; font-size: 0.6rem; color: #888; }

        /* 6. Sync */
        .sync-bar-container {
            width: 80%; height: 30px; border: 4px solid white; margin: 2rem 0;
            position: relative; background: #333;
        }
        .sync-target {
            position: absolute; left: 40%; width: 20%; height: 100%; background: rgba(0, 255, 0, 0.3); border: 1px solid lime;
        }
        .sync-cursor {
            position: absolute; top: 0; width: 10px; height: 100%; background: #fff;
        }
        .arcade-btn {
            background: red; border: none; border-bottom: 8px solid darkred;
            color: white; font-family: 'Press Start 2P'; padding: 1rem 2rem;
            border-radius: 50%; width: 100px; height: 100px; cursor: pointer;
        }
        .arcade-btn:active { transform: translateY(4px); border-bottom-width: 4px; }
        .arcade-btn:disabled { background: green; border-color: darkgreen; }

        /* 7. Toggle */
        .toggle-container {
            width: 200px; height: 60px; background: #333; border-radius: 30px;
            position: relative; cursor: pointer; border: 2px solid white;
            margin-bottom: 2rem;
        }
        .toggle-switch {
            width: 50px; height: 50px; background: var(--neon-pink); border-radius: 50%;
            position: absolute; top: 3px; transition: left 0.3s;
            box-shadow: 0 0 10px var(--neon-pink);
        }
        .toggle-switch.left { left: 5px; background: var(--neon-blue); }
        .toggle-switch.right { left: 140px; background: red; }
        .toggle-labels {
            display: flex; justify-content: space-between; padding: 0 20px; 
            line-height: 60px; font-size: 0.7rem; pointer-events: none;
        }
        .speech-bubble {
            background: white; color: black; padding: 1.5rem; border-radius: 10px;
            position: relative; max-width: 80%;
        }
        .speech-bubble::after {
            content: ''; position: absolute; top: -10px; left: 50%;
            border-width: 0 10px 10px; border-style: solid; border-color: transparent transparent white;
        }

        /* 8. Pizza */
        .pizza-box { position: relative; width: 200px; height: 200px; }
        .pizza-slice {
            position: absolute; top: 0; left: 0; width: 100%; height: 100%;
            display: flex; align-items: center; justify-content: center;
            transform-origin: center; cursor: pointer;
            transition: transform 0.2s, opacity 0.2s;
        }
        .pizza-slice:hover { transform: scale(1.1); }
        .plate-text { position: absolute; top: 40%; left: 35%; color: white; opacity: 0.5; }

        /* 9. Level Up */
        .xp-bar-container {
            width: 80%; height: 20px; border: 2px solid white; margin: 2rem 0; padding: 2px;
        }
        .xp-bar-fill { height: 100%; background: var(--neon-green); transition: width 0.1s linear; }
        .bounce { animation: bounce 0.5s infinite alternate; }

            /* Loading */
            .loading-screen { height: 100vh; background: #000; color: lime; display: flex; align-items: center; justify-content: center; font-family: 'Courier New'; }

            /* Mobile Adjustments */
            @media (max-width: 768px) {
                .title-large { font-size: 1.5rem; }
                .terminal-text { font-size: 0.7rem; }
                .scroll-x-container { gap: 1rem; }
                .inventory-slot { min-width: 120px; height: 120px; }
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
            .spotify-icon { color: var(--neon-blue); transition: opacity 0.3s; }
            .spotify-float:hover .spotify-icon { opacity: 0; display: none; }
            .spotify-float iframe { opacity: 0; transition: opacity 0.5s ease 0.2s; width: 100%; height: 100%; }
            .spotify-float:hover iframe { opacity: 1; }
        }
    `;

    // Firebase Logic
    useEffect(() => {
        if (!id) return;
        let unsubscribe = () => { };

        const setupSubscription = async () => {
            try {
                let docId = id;
                if (typeof resolveCardId === 'function') {
                    const result = await resolveCardId(id, 'friendship_cards', 'friendship');
                    if (result) docId = result.id;
                    else { setLoading(false); return; }
                }

                const docRef = doc(db, 'friendship_cards', docId);
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
        return () => unsubscribe();
    }, [id]);

    const handleStart = () => {
        playCoin();
        document.querySelector('.scroll-container').scrollBy({ top: window.innerHeight, behavior: 'smooth' });
    };

    if (loading) return (
        <div className="loading-screen">
            <style>{styles}</style>
            <div>LOADING CARTRIDGE...</div>
        </div>
    );


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
                const spotifyId = getSpotifyId(data.spotify);
                return spotifyId && (
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
                );

            })()}

            {/* Header / Music */}
            <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', zIndex: 100, pointerEvents: 'none' }}>
                <CardViewHeader />
            </div>
            {data?.song && <SongPlayer song={data.song} />}

            {/* 1. Insert Coin */}
            <SectionInsertCoin onStart={handleStart} data={data} />

            {/* 2. Player 2 */}
            <SectionPlayer2 playBlip={playBlip} />

            {/* 3. High Five */}
            <SectionHighFive playJump={playJump} />

            {/* 4. Handshake */}
            <SectionHandshake playBlip={playBlip} playPowerUp={playPowerUp} />

            {/* 5. Inventory */}
            <SectionMemory />

            {/* 6. Sync Test */}
            <SectionSync playPowerUp={playPowerUp} playBlip={playBlip} />

            {/* 7. Roast Mode */}
            <SectionRoast data={data} />

            {/* 8. Pizza Share */}
            <SectionPizza playBlip={playBlip} />

            {/* 9. Level Up */}
            <SectionLevelUp playPowerUp={playPowerUp} />

            {/* 10. Game Over */}
            <SectionGameOver data={data} />
        </div>
    );
};

export default FriendshipPage;

