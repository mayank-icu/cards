import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { addDoc, collection, doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';
import {
    Star, Send, Sparkles, X, Wand2, Loader2
} from 'lucide-react';
import { resolveCardId } from '../../utils/slugs';
import SongPlayer from '../../components/SongPlayer';
import WishModal from './WishModal';

/* --- STYLES & ANIMATIONS --- */
const GlobalStyles = () => (
    <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;600;800&family=Instrument+Serif:ital@0;1&display=swap');

        :root {
            --bg-deep: #1a1a2e;
            --bg-gradient: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
            --glass: rgba(255, 255, 255, 0.1);
            --glass-border: rgba(255, 255, 255, 0.2);
            --gold: #fbbf24;
            --gold-glow: rgba(251, 191, 36, 0.4);
            --text-main: #ffffff;
            --text-muted: #94a3b8;
            --font-sans: 'Plus Jakarta Sans', sans-serif;
            --font-serif: 'Instrument Serif', serif;
        }

        * { box-sizing: border-box; margin: 0; padding: 0; }

        body {
            background: var(--bg-deep);
            color: var(--text-main);
            font-family: var(--font-sans);
            overflow: hidden;
        }

        .jar-wrapper {
            width: 100vw;
            height: 100vh;
            position: relative;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            background: var(--bg-gradient);
            overflow: hidden;
        }

        /* Ambient Background Particles */
        .ambient-bg {
            position: absolute;
            inset: 0;
            pointer-events: none;
            z-index: 0;
        }
        .particle {
            position: absolute;
            background: white;
            border-radius: 50%;
            opacity: 0.2;
            animation: float-up linear infinite;
        }

        /* --- MAIN CONTENT --- */
        .content-layer {
            z-index: 10;
            position: relative;
            width: 100%;
            max-width: 500px;
            display: flex;
            flex-direction: column;
            align-items: center;
            padding: 2rem;
            height: 100%;
        }

        .header-section {
            text-align: center;
            margin-bottom: 2rem;
            animation: fadeInDown 1s ease;
        }

        .title-serif {
            font-family: var(--font-serif);
            font-size: 3rem;
            font-style: italic;
            color: var(--gold);
            text-shadow: 0 0 20px var(--gold-glow);
            margin-bottom: 0.5rem;
        }

        .subtitle {
            font-family: var(--font-sans);
            font-size: 0.9rem;
            color: var(--text-muted);
            letter-spacing: 1px;
            text-transform: uppercase;
        }

        /* --- THE JAR --- */
        .jar-container {
            width: 260px;
            height: 380px;
            position: relative;
            margin: 0 auto;
            perspective: 1000px;
        }

        .glass-jar {
            width: 100%;
            height: 100%;
            background: rgba(255, 255, 255, 0.05);
            border: 2px solid rgba(255, 255, 255, 0.3);
            border-radius: 20px 20px 40px 40px; /* Jar shape */
            position: relative;
            backdrop-filter: blur(4px);
            box-shadow: 
                0 0 40px rgba(255, 255, 255, 0.05),
                inset 0 0 20px rgba(255, 255, 255, 0.1);
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;
            transition: all 0.3s ease;
        }

        /* Jar Lid */
        .jar-lid {
            position: absolute;
            top: -20px;
            left: 50%;
            transform: translateX(-50%);
            width: 220px;
            height: 30px;
            background: rgba(255, 255, 255, 0.15);
            border: 2px solid rgba(255, 255, 255, 0.3);
            border-radius: 4px;
            z-index: 2;
        }

        /* Highlight reflection */
        .jar-reflection {
            position: absolute;
            top: 20px;
            left: 20px;
            width: 20px;
            height: 80%;
            background: linear-gradient(to bottom, rgba(255,255,255,0.2), transparent);
            border-radius: 10px;
            pointer-events: none;
        }

        /* Wishes inside Jar */
        .captured-star {
            position: absolute;
            color: var(--gold);
            filter: drop-shadow(0 0 10px var(--gold));
            animation: bob 4s ease-in-out infinite;
        }

        /* --- INPUT AREA --- */
        .input-area {
            width: 100%;
            margin-top: auto; /* Push to bottom */
            margin-bottom: 2rem;
            position: relative;
            z-index: 20;
        }

        .wish-form {
            position: relative;
            width: 100%;
            display: flex;
            align-items: center;
            background: rgba(255, 255, 255, 0.1);
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 100px;
            padding: 0.5rem;
            transition: all 0.3s ease;
            backdrop-filter: blur(10px);
        }

        .wish-form:focus-within {
            background: rgba(255, 255, 255, 0.15);
            border-color: var(--gold);
            box-shadow: 0 0 20px var(--gold-glow);
        }

        .wish-input {
            flex: 1;
            background: transparent;
            border: none;
            color: white;
            padding: 1rem;
            font-size: 1rem;
            font-family: var(--font-sans);
            outline: none;
        }

        .wish-input::placeholder { color: rgba(255, 255, 255, 0.4); }

        .btn-send {
            width: 48px;
            height: 48px;
            border-radius: 50%;
            border: none;
            background: var(--gold);
            color: #1a1a2e;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: transform 0.2s, background 0.2s;
        }
        
        .btn-send:hover:not(:disabled) { transform: scale(1.1); background: #fcd34d; }
        .btn-send:disabled { background: rgba(255,255,255,0.1); color: rgba(255,255,255,0.2); cursor: not-allowed; }

        .limit-badge {
            text-align: center;
            margin-top: 1rem;
            font-size: 0.8rem;
            color: var(--text-muted);
            font-family: var(--font-serif);
            letter-spacing: 1px;
        }

        /* --- ANIMATIONS --- */
        @keyframes float-up { 0% { transform: translateY(100vh) scale(0); } 100% { transform: translateY(-20vh) scale(1); } }
        @keyframes bob { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
        @keyframes fadeInDown { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }
        
        .flying-star {
            position: fixed;
            z-index: 100;
            color: var(--gold);
            pointer-events: none;
            filter: drop-shadow(0 0 15px var(--gold));
            animation: fly-to-jar 1s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
        }

        @keyframes fly-to-jar {
            0% { transform: scale(0.5) translate(0, 0); opacity: 1; }
            50% { transform: scale(1.5) translate(var(--tx), var(--ty)); opacity: 1; }
            100% { transform: scale(1) translate(var(--tx), var(--destY)); opacity: 0; }
        }

        /* Loading */
        .loader-wrap { height: 100vh; display: flex; align-items: center; justify-content: center; color: var(--gold); }
    `}</style>
);

/* --- MAIN COMPONENT --- */

const WishJar = () => {
    const { jarId } = useParams();
    const [wish, setWish] = useState('');
    const [jarData, setJarData] = useState(null);
    const [wishes, setWishes] = useState([]);
    const [isLimitReached, setIsLimitReached] = useState(false);
    const [realJarId, setRealJarId] = useState(null);
    const [selectedWish, setSelectedWish] = useState(null);

    // Animation State
    const [flyingStars, setFlyingStars] = useState([]);
    const jarRef = useRef(null);
    const inputRef = useRef(null);

    // Initial Data Fetch
    useEffect(() => {
        let unsubscribeJar = () => { };
        let unsubscribeWishes = () => { };

        const setupSubscription = async () => {
            try {
                const result = await resolveCardId(jarId, 'wishjar', 'wish-jar').catch(() => null);

                if (result) {
                    const realId = result.id;
                    setRealJarId(realId);

                    // Jar Data
                    const jarDoc = doc(db, 'wishjar', realId);
                    unsubscribeJar = onSnapshot(jarDoc, (snapshot) => {
                        if (snapshot.exists()) setJarData(snapshot.data());
                    });

                    // Wishes Collection
                    const wishesCol = collection(db, 'wishjar', realId, 'wishes');
                    unsubscribeWishes = onSnapshot(wishesCol, (snapshot) => {
                        const wishesList = snapshot.docs.map(doc => ({
                            id: doc.id,
                            ...doc.data()
                        }));
                        // Sort by createdAt if available
                        wishesList.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

                        setWishes(wishesList);
                        setIsLimitReached(wishesList.length >= 5);
                    });
                }
            } catch (error) {
                console.error("Error resolving jar:", error);
            }
        };

        setupSubscription();
        return () => {
            unsubscribeJar();
            unsubscribeWishes();
        };
    }, [jarId]);

    const handleAddWish = async (e) => {
        e.preventDefault();
        if (!wish.trim() || isLimitReached || !realJarId) return;

        const wishText = wish;

        // 1. Trigger Animation
        triggerFlyAnimation();

        // 2. Clear Input
        setWish('');

        // 3. Save to Firestore (Optimistic UI handled by animation)
        try {
            const newWish = { text: wishText, createdAt: Date.now() };
            await addDoc(collection(db, 'wishjar', realJarId, 'wishes'), newWish);
        } catch (err) {
            console.error("Failed to add wish", err);
        }
    };

    const triggerFlyAnimation = () => {
        if (!inputRef.current || !jarRef.current) return;

        const inputRect = inputRef.current.getBoundingClientRect();
        const jarRect = jarRef.current.getBoundingClientRect();

        // Calculate distances relative to the start point
        // Start is input center
        const startX = inputRect.left + inputRect.width / 2;
        const startY = inputRect.top;

        // End is jar center (roughly)
        const endX = jarRect.left + jarRect.width / 2;
        const endY = jarRect.top + jarRect.height / 2;

        const id = Date.now();

        // Add a flying star
        setFlyingStars(prev => [...prev, {
            id,
            style: {
                left: startX,
                top: startY,
                '--tx': `${endX - startX}px`,
                '--ty': `${(endY - startY) * 0.5}px`, // control point for curve
                '--destY': `${endY - startY}px`
            }
        }]);

        // Cleanup star after animation
        setTimeout(() => {
            setFlyingStars(prev => prev.filter(s => s.id !== id));
        }, 1000);
    };

    if (!jarData) return (
        <>
            <GlobalStyles />
            <div className="loader-wrap"><Loader2 className="spin-disc" size={40} /></div>
        </>
    );

    return (
        <div className="jar-wrapper">
            <GlobalStyles />
            <AmbientBackground />
            <ShootingStars />

            {jarData.song && <SongPlayer song={jarData.song} />}
            <WishModal isOpen={!!selectedWish} onClose={() => setSelectedWish(null)} wish={selectedWish} />

            <div className="content-layer">
                {/* Header */}
                <div className="header-section">
                    <h1 className="title-serif">{jarData.recipient || 'Someone'}'s Jar</h1>
                    <p className="subtitle">Make a wish</p>
                </div>

                {/* The Jar Visual */}
                <div className="jar-container" ref={jarRef}>
                    <div className="jar-lid"></div>
                    <div className="glass-jar">
                        <div className="jar-reflection"></div>

                        {/* Render Stars inside jar based on wishes */}
                        {wishes.slice(0, 5).map((wishItem, i) => (
                            <div
                                key={wishItem.id || i}
                                className="captured-star-wrapper"
                                style={{
                                    position: 'absolute',
                                    left: `${20 + (i * 15)}%`,
                                    top: `${30 + (i * 10)}%`,
                                    zIndex: 10 + i
                                }}
                                onClick={() => setSelectedWish(wishItem)}
                            >
                                <Star
                                    className="captured-star"
                                    fill="#fbbf24"
                                    size={32 + (i * 4)} // vary size
                                    style={{
                                        animationDelay: `${i * 0.5}s`,
                                        transform: `rotate(${i * 15}deg)`,
                                        cursor: 'pointer'
                                    }}
                                />
                            </div>
                        ))}

                        {/* Text inside jar if empty */}
                        {wishes.length === 0 && (
                            <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: '0.8rem', fontFamily: 'var(--font-serif)' }}>
                                Empty...
                            </span>
                        )}
                    </div>
                </div>

                {/* Input Section */}
                <div className="input-area">
                    <form onSubmit={handleAddWish} className="wish-form" ref={inputRef}>
                        <Wand2 className="ml-3" size={20} color="#fbbf24" />
                        <input
                            type="text"
                            value={wish}
                            onChange={(e) => setWish(e.target.value)}
                            className="wish-input"
                            placeholder={isLimitReached ? "This jar is full of magic" : "I wish for..."}
                            disabled={isLimitReached}
                            maxLength={100}
                        />
                        <button
                            type="submit"
                            className="btn-send"
                            disabled={!wish.trim() || isLimitReached}
                        >
                            <Send size={20} />
                        </button>
                    </form>

                    <div className="limit-badge">
                        {isLimitReached ? (
                            <span style={{ color: '#fbbf24' }}>✨ Jar is full! Magic is sealed.</span>
                        ) : (
                            <span>{5 - wishes.length} wishes remaining</span>
                        )}
                    </div>
                </div>
            </div>

            {/* Flying Animation Layer */}
            {flyingStars.map(star => (
                <div key={star.id} className="flying-star" style={star.style}>
                    <Star fill="#fbbf24" size={24} />
                </div>
            ))}
        </div>
    );
};

/* --- SUB COMPONENTS --- */

const AmbientBackground = () => (
    <div className="ambient-bg">
        {[...Array(15)].map((_, i) => (
            <div
                key={i}
                className="particle"
                style={{
                    width: Math.random() * 4 + 2 + 'px',
                    height: Math.random() * 4 + 2 + 'px',
                    left: Math.random() * 100 + '%',
                    animationDuration: Math.random() * 10 + 10 + 's',
                    animationDelay: Math.random() * 5 + 's'
                }}
            />
        ))}
    </div>
);

const ShootingStars = () => {
    const [stars, setStars] = useState([]);

    useEffect(() => {
        const interval = setInterval(() => {
            const id = Date.now();
            const startX = Math.random() * window.innerWidth;
            const startY = Math.random() * (window.innerHeight / 2);

            setStars(prev => [...prev, { id, startX, startY }]);

            setTimeout(() => {
                setStars(prev => prev.filter(s => s.id !== id));
            }, 2000);
        }, 3000);

        return () => clearInterval(interval);
    }, []);

    return (
        <>
            <style>{`
                .shooting-star {
                    position: fixed;
                    width: 4px;
                    height: 4px;
                    background: white;
                    border-radius: 50%;
                    box-shadow: 0 0 0 4px rgba(255,255,255,0.1), 0 0 0 8px rgba(255,255,255,0.1), 0 0 20px white;
                    animation: shoot 2s linear forwards;
                    pointer-events: none;
                    z-index: 1;
                }
                .shooting-star::before {
                    content: '';
                    position: absolute;
                    top: 50%;
                    transform: translateY(-50%);
                    width: 300px;
                    height: 1px;
                    background: linear-gradient(90deg, white, transparent);
                    right: 0;
                }
                @keyframes shoot {
                    0% { transform: rotate(315deg) translateX(0); opacity: 1; }
                    70% { opacity: 1; }
                    100% { transform: rotate(315deg) translateX(-1000px); opacity: 0; }
                }
            `}</style>
            {stars.map(star => (
                <div
                    key={star.id}
                    className="shooting-star"
                    style={{
                        top: star.startY,
                        left: star.startX
                    }}
                />
            ))}
        </>
    );
};

export default WishJar;