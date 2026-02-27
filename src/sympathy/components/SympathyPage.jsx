import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';
import {
    Flame, CloudRain, Wind, Heart,
    Flower2, Sun, Music, ArrowDown, Sparkles, Phone,
    Sunrise, Moon
} from 'lucide-react';
import CardViewHeader from '../../components/CardViewHeader';
import CardFooter from '../../components/CardFooter';
import { normalizeCardData, resolveCardId } from '../../utils/slugs';

const SympathyPage = () => {
    const { id } = useParams();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    // Interactive States
    const [isLit, setIsLit] = useState(false);
    const [rainCleared, setRainCleared] = useState(false);
    const [flowers, setFlowers] = useState([]);
    const [breathingState, setBreathingState] = useState('Inhale');

    // Refs for animations
    const containerRef = useRef(null);

    useEffect(() => {
        if (!id) return;

        let unsubscribe = () => { };

        const setupSubscription = async () => {
            try {
                const result = await resolveCardId(id, 'sympathies', 'sympathy');

                if (result) {
                    const realId = result.id;
                    const sympathyDoc = doc(db, 'sympathies', realId);

                    unsubscribe = onSnapshot(sympathyDoc, (snapshot) => {
                        if (snapshot.exists()) {
                            setData(normalizeCardData(snapshot.data()));
                        }
                        setLoading(false);
                    });
                } else {
                    setLoading(false);
                }
            } catch (error) {
                console.error("Error resolving sympathy card:", error);
                setLoading(false);
            }
        };

        setupSubscription();

        return () => unsubscribe();
    }, [id]);

    // Breathing Cycle Logic (Slower, more calming - 6s cycle)
    useEffect(() => {
        const interval = setInterval(() => {
            setBreathingState(prev => prev === 'Inhale' ? 'Exhale' : 'Inhale');
        }, 5000); // Slower for relaxation
        return () => clearInterval(interval);
    }, []);

    const handleFlowerClick = (e) => {
        const rect = e.target.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        // Random slight rotation for natural look
        const newFlower = {
            id: Date.now(),
            x,
            y,
            rotation: Math.random() * 40 - 20,
            scale: 0.8 + Math.random() * 0.4
        };
        setFlowers([...flowers, newFlower]);
    };

    if (loading) return (
        <div className="loader-container">
            <style>{`
                .loader-container {
                    height: 100dvh;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    background: #020205;
                    color: #e2e8f0;
                    font-family: 'Times New Roman', serif;
                    letter-spacing: 2px;
                    animation: fadePulse 2s infinite;
                }
                @keyframes fadePulse { 0% { opacity: 0.5; } 50% { opacity: 1; } 100% { opacity: 0.5; } }
            `}</style>
            <div>Gathering memories...</div>
            <CardFooter />
        </div>
    );

    if (!data) return (
        <div className="loader-container">
            <div>Card not found.</div>
            <CardFooter />
        </div>
    );

    // Helper to get Spotify ID
    const getSpotifyId = (url) => {
        if (!url) return null;
        try {
            const parts = url.split('/');
            return parts[parts.length - 1].split('?')[0];
        } catch (e) { return null; }
    };
    const spotifyId = getSpotifyId(data.spotify);

    return (
        <>
            <CardViewHeader
                cardType="sympathy"
                cardId={id}
                title="Sympathy"
                subtitle={data?.recipient ? `For ${data.recipient}` : undefined}
            />
            <div className="scrolly-container" ref={containerRef}>
                {/* --- CUSTOM CSS STYLES --- */}
                <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,400&family=Lato:wght@300;400&display=swap');

                :root {
                    /* Thematic Transition Palette: Darkness -> Light */
                    --bg-1: #020205; /* Pitch Black */
                    --bg-2: #0B1026; /* Deep Night */
                    --bg-3: #1B263B; /* Midnight Blue */
                    --bg-4: #334155; /* Storm Grey */
                    --bg-5: #475569; /* Slate */
                    --bg-6: #64748B; /* Muted Dawn */
                    --bg-7: #94A3B8; /* Morning Mist */
                    --bg-8: #FFF7ED; /* Warm Light */
                    --bg-9: #FFFFFF; /* Pure Clarity */

                    --text-light: #F8FAFC;
                    --text-dark: #334155;
                    --accent-gold: #FCD34D;
                    --accent-warm: #FDA4AF;
                    
                    --font-serif: 'Cormorant Garamond', serif;
                    --font-sans: 'Lato', sans-serif;
                }

                * { box-sizing: border-box; }
                
                body, html {
                    margin: 0;
                    padding: 0;
                    background-color: var(--bg-1);
                    color: var(--text-light);
                    overflow: hidden; 
                }

                .scrolly-container {
                    height: 100dvh;
                    overflow-y: scroll;
                    scroll-snap-type: y mandatory;
                    scroll-behavior: smooth;
                    position: relative;
                }

                /* Section Architecture */
                section {
                    height: 100dvh;
                    width: 100%;
                    scroll-snap-align: start;
                    position: relative;
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    align-items: center;
                    overflow: hidden;
                    text-align: center;
                    padding: 2rem;
                    transition: background 1.5s ease-in-out;
                }

                h1, h2, h3 {
                    font-family: var(--font-serif);
                    font-weight: 400;
                    margin: 0 0 1.5rem 0;
                    z-index: 10;
                    letter-spacing: 0.05em;
                }

                h2 { font-size: 2.5rem; }
                
                p {
                    font-family: var(--font-sans);
                    font-weight: 300;
                    line-height: 1.8;
                    font-size: 1.1rem;
                    max-width: 550px;
                    z-index: 10;
                    color: inherit;
                    opacity: 0.9;
                }

                /* --- SECTION 1: CANDLE (The Beginning) --- */
                .section-candle { background: var(--bg-1); color: var(--text-light); }
                
                .candle-container {
                    position: relative;
                    cursor: pointer;
                    padding: 40px;
                    transition: transform 0.3s ease;
                }
                .candle-container:hover { transform: scale(1.02); }
                
                .candle-stick {
                    width: 32px;
                    height: 160px;
                    background: linear-gradient(to right, #e2e8f0, #cbd5e1);
                    border-radius: 4px;
                    position: relative;
                    margin: 0 auto;
                    box-shadow: inset -5px -5px 10px rgba(0,0,0,0.5);
                }
                .wick {
                    width: 3px;
                    height: 12px;
                    background: #555;
                    position: absolute;
                    top: -12px;
                    left: 50%;
                    transform: translateX(-50%);
                }
                .flame {
                    position: absolute;
                    top: -40px;
                    left: 50%;
                    transform: translateX(-50%);
                    width: 24px;
                    height: 36px;
                    background: radial-gradient(circle at bottom, #fef3c7, #f59e0b);
                    border-radius: 50% 50% 20% 20%;
                    filter: blur(4px);
                    opacity: 0;
                    transition: opacity 2s ease, filter 2s ease;
                    box-shadow: 0 0 0px rgba(251, 146, 60, 0);
                }
                .flame.lit {
                    opacity: 1;
                    filter: blur(1px);
                    box-shadow: 0 -10px 40px rgba(251, 146, 60, 0.4), 0 -20px 80px rgba(251, 146, 60, 0.2);
                    animation: flicker 2s infinite alternate ease-in-out;
                }
                @keyframes flicker {
                    0% { transform: translateX(-50%) scale(1) skewX(0deg); opacity: 0.9; }
                    25% { transform: translateX(-50%) scale(1.05) skewX(2deg); opacity: 1; }
                    50% { transform: translateX(-50%) scale(0.95) skewX(-1deg); opacity: 0.8; }
                    75% { transform: translateX(-50%) scale(1.02) skewX(1deg); opacity: 1; }
                    100% { transform: translateX(-50%) scale(1) skewX(0deg); opacity: 0.9; }
                }
                .scroll-hint {
                    position: absolute;
                    bottom: 40px;
                    opacity: 0.4;
                    animation: softBounce 3s infinite;
                }
                @keyframes softBounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(10px); } }

                /* --- SECTION 2: STARS (Reflection) --- */
                .section-stars { background: var(--bg-2); }
                .star-dot {
                    position: absolute;
                    background: white;
                    border-radius: 50%;
                    animation: twinkle 5s infinite ease-in-out;
                    box-shadow: 0 0 4px rgba(255,255,255,0.8);
                }
                @keyframes twinkle {
                    0%, 100% { opacity: 0.3; transform: scale(0.8); }
                    50% { opacity: 1; transform: scale(1.1); }
                }

                /* --- SECTION 3: MEMORY (Stillness) --- */
                .section-memory { background: var(--bg-3); }
                .frame {
                    width: 320px;
                    max-width: 90%;
                    aspect-ratio: 3/4;
                    border: 1px solid rgba(255,255,255,0.15);
                    padding: 20px;
                    background: rgba(255,255,255,0.03);
                    box-shadow: 0 25px 50px -12px rgba(0,0,0,0.6);
                    transform: rotate(-1deg);
                    transition: transform 0.5s ease;
                }
                .frame:hover { transform: rotate(0deg) scale(1.01); }
                .frame-inner {
                    width: 100%;
                    height: 100%;
                    background-color: #000;
                    background-size: cover;
                    background-position: center;
                    filter: sepia(20%) contrast(1.1);
                }

                /* --- SECTION 4: RAIN (Release) --- */
                .section-rain { background: var(--bg-4); transition: background 3s ease; }
                .section-rain.cleared { background: linear-gradient(to bottom, #475569, #334155); }
                .rain-container { position: absolute; inset: 0; pointer-events: none; }
                .rain-drop {
                    position: absolute;
                    width: 1px;
                    height: 60px;
                    background: linear-gradient(transparent, rgba(200,210,230,0.3));
                    animation: fall linear infinite;
                }
                @keyframes fall { to { transform: translateY(110vh); } }
                
                .sky-clearing {
                    position: absolute;
                    inset: 0;
                    background: radial-gradient(circle at center, rgba(255,255,255,0.1) 0%, transparent 60%);
                    opacity: 0;
                    transition: opacity 3s ease;
                }
                .sky-clearing.active { opacity: 1; }

                /* --- SECTION 5: SUPPORT (Connection) --- */
                .section-support { background: var(--bg-5); }
                .light-grid {
                    display: grid;
                    grid-template-columns: repeat(5, 1fr);
                    gap: 30px;
                    width: auto;
                }
                .light-dot {
                    width: 8px;
                    height: 8px;
                    background: #FCD34D;
                    border-radius: 50%;
                    opacity: 0.4;
                    box-shadow: 0 0 10px #FCD34D;
                    transition: all 0.6s ease;
                }
                .light-dot.center { transform: scale(2.5); opacity: 1; background: #fff; box-shadow: 0 0 30px #FCD34D; }
                .section-support:hover .light-dot:not(.center) {
                    transform: scale(1.5); opacity: 0.8;
                }

                /* --- SECTION 6: WAVE (Flow) --- */
                .section-wave { background: var(--bg-6); overflow: hidden; }
                .wave-svg {
                    position: absolute;
                    bottom: -1px;
                    left: 0;
                    width: 100%;
                    height: auto;
                    fill: var(--bg-7);
                    opacity: 0.7;
                    animation: swell 8s ease-in-out infinite alternate;
                }
                .wave-svg.back {
                    bottom: 20px;
                    opacity: 0.4;
                    animation-duration: 12s;
                    fill: var(--bg-5);
                }
                @keyframes swell { from { transform: scaleY(1); } to { transform: scaleY(1.1); } }

                /* --- SECTION 7: BREATHE (Grounding) --- */
                .section-breathe { background: var(--bg-7); }
                .breathe-ring {
                    width: 200px;
                    height: 200px;
                    border: 1px solid rgba(255,255,255,0.4);
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 1.5rem;
                    font-family: var(--font-serif);
                    letter-spacing: 0.1em;
                    color: white;
                    position: relative;
                }
                .breathe-ring::before {
                    content: '';
                    position: absolute;
                    inset: 0;
                    border-radius: 50%;
                    background: rgba(255,255,255,0.1);
                    transition: transform 5s ease-in-out;
                    z-index: -1;
                }
                .breathe-ring.Inhale::before { transform: scale(1.5); }
                .breathe-ring.Exhale::before { transform: scale(1); }
                
                /* --- SECTION 8: LIGHT (Hope) --- */
                .section-light { 
                    background: linear-gradient(to top, var(--bg-8), #fefce8); 
                    color: var(--text-dark);
                }
                .sun-icon {
                    animation: rise 2s ease-out;
                    filter: drop-shadow(0 0 20px rgba(251, 146, 60, 0.4));
                }
                @keyframes rise { from { transform: translateY(50px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }

                /* --- SECTION 9: OFFERINGS (Action) --- */
                .section-offerings { 
                    background: var(--bg-8); 
                    color: var(--text-dark);
                    cursor: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="%23d97706" stroke-width="2"><path d="M12 2L12 22"/><path d="M12 8L7 3"/><path d="M12 8L17 3"/></svg>') 12 12, auto;
                }
                .flower-zone {
                    width: 100%;
                    height: 400px;
                    position: relative;
                    border-bottom: 1px solid rgba(0,0,0,0.05);
                    margin-bottom: 2rem;
                    background: rgba(255,255,255,0.3);
                }
                .virtual-flower {
                    position: absolute;
                    color: #d97706; /* Amber-600 */
                    pointer-events: none;
                    filter: drop-shadow(0 4px 6px rgba(0,0,0,0.1));
                    transition: all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
                    animation: floatDown 0.8s ease-out forwards;
                }
                @keyframes floatDown { 
                    from { transform: translateY(-20px) scale(0); opacity: 0; } 
                    to { transform: translateY(0) scale(1); opacity: 1; } 
                }

                /* --- SECTION 10: CARD (Resolution) --- */
                .section-card { 
                    background: var(--bg-9); 
                    color: var(--text-dark);
                    padding-bottom: 5rem; /* Extra space at bottom */
                }
                .paper-card {
                    background: #fff;
                    color: #1a1a1a;
                    padding: 4rem 3rem;
                    max-width: 600px;
                    width: 90%;
                    box-shadow: 0 20px 60px -10px rgba(0,0,0,0.1);
                    text-align: left;
                    position: relative;
                    border: 1px solid #f1f5f9;
                }
                .paper-card::before {
                    content: '';
                    position: absolute;
                    top: 0; left: 0; width: 100%; height: 4px;
                    background: linear-gradient(to right, #e2e8f0, #94a3b8, #e2e8f0);
                }
                .deceased-label {
                    font-size: 0.75rem;
                    text-transform: uppercase;
                    letter-spacing: 0.2em;
                    color: #64748b;
                    margin-bottom: 2rem;
                    display: block;
                    border-bottom: 1px solid #f1f5f9;
                    padding-bottom: 1.5rem;
                }
                .message-body {
                    font-family: var(--font-serif);
                    font-size: 1.35rem;
                    line-height: 1.9;
                    margin-bottom: 3rem;
                    white-space: pre-wrap;
                    color: #334155;
                }
                .signature {
                    font-family: var(--font-sans);
                    font-size: 0.95rem;
                    color: #0f172a;
                    text-align: right;
                    font-weight: 500;
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
                .spotify-icon { color: var(--accent-gold); transition: opacity 0.3s; }
                .spotify-float:hover .spotify-icon { opacity: 0; display: none; }
                .spotify-float iframe { opacity: 0; transition: opacity 0.5s ease 0.2s; width: 100%; height: 100%; }
                .spotify-float:hover iframe { opacity: 1; }

                /* Responsive */
                @media (max-width: 768px) {
                    h2 { font-size: 2rem; }
                    .frame { width: 85%; }
                    .paper-card { padding: 2.5rem 1.5rem; width: 95%; }
                    .light-grid { gap: 15px; }
                }
            `}</style>

                {/* Floating Spotify Player */}
                {spotifyId && (
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
                )}

                {/* 1. THE CANDLE (Darkness) */}
                <section className="section-candle">
                    <div style={{ opacity: isLit ? 1 : 0.6, transition: 'opacity 1.5s' }}>
                        <h2>For {data.deceased || data.recipient}</h2>
                        <p>In the silence, we light a flame to honor your memory.</p>
                    </div>

                    <div style={{ height: '60px' }}></div>

                    <div className="candle-container" onClick={() => setIsLit(true)}>
                        <div className="candle-stick">
                            <div className="wick"></div>
                            <div className={`flame ${isLit ? 'lit' : ''}`}></div>
                        </div>
                    </div>

                    <div style={{ marginTop: '3rem', fontSize: '0.8rem', opacity: isLit ? 0 : 0.6, transition: 'opacity 1s', textTransform: 'uppercase', letterSpacing: '2px' }}>
                        ( Tap to light )
                    </div>

                    <div className="scroll-hint">
                        <ArrowDown size={24} strokeWidth={1} />
                    </div>
                </section>

                {/* 2. THE STARS (Deep Night) */}
                <section className="section-stars">
                    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
                        {[...Array(30)].map((_, i) => (
                            <div
                                key={i}
                                className="star-dot"
                                style={{
                                    top: `${Math.random() * 100}%`,
                                    left: `${Math.random() * 100}%`,
                                    width: `${Math.random() * 3 + 1}px`,
                                    height: `${Math.random() * 3 + 1}px`,
                                    animationDelay: `${Math.random() * 5}s`,
                                    opacity: Math.random() * 0.7 + 0.3
                                }}
                            />
                        ))}
                    </div>
                    <Moon size={40} style={{ marginBottom: '1.5rem', opacity: 0.8 }} strokeWidth={1} />
                    <h2>A Light in the Dark</h2>
                    <p>Even when the night is darkest, the stars still shine. Your light remains.</p>
                </section>

                {/* 3. THE MEMORY (Midnight) - CONDITIONAL RENDERING */}
                <section className="section-memory">
                    {data.imageUrl ? (
                        <>
                            <div className="frame">
                                <div className="frame-inner" style={{ backgroundImage: `url(${data.imageUrl})` }}></div>
                            </div>
                            <div style={{ marginTop: '2.5rem' }}>
                                <h3>Remembering {data.deceased || 'You'}</h3>
                            </div>
                        </>
                    ) : (
                        <div style={{ maxWidth: '600px', padding: '0 20px' }}>
                            <Sparkles size={40} style={{ margin: '0 auto 20px', opacity: 0.6 }} />
                            <h3 style={{ fontSize: '2rem', fontStyle: 'italic' }}>A Moment of Silence</h3>
                            <p style={{ fontSize: '1.2rem' }}>
                                "Those we love don't go away, they walk beside us every day.<br />
                                Unseen, unheard, but always near."
                            </p>
                        </div>
                    )}
                </section>

                {/* 4. THE RAIN (Storm Clearing) */}
                <section className={`section-rain ${rainCleared ? 'cleared' : ''}`} onClick={() => setRainCleared(true)}>
                    {!rainCleared && (
                        <div className="rain-container">
                            {[...Array(20)].map((_, i) => (
                                <div
                                    key={i}
                                    className="rain-drop"
                                    style={{
                                        left: `${Math.random() * 100}%`,
                                        animationDuration: `${0.8 + Math.random() * 0.5}s`,
                                        animationDelay: `${Math.random()}s`
                                    }}
                                />
                            ))}
                        </div>
                    )}

                    <div className={`sky-clearing ${rainCleared ? 'active' : ''}`}></div>

                    <div style={{ zIndex: 20 }}>
                        <CloudRain size={48} strokeWidth={1} style={{ marginBottom: '1.5rem', opacity: rainCleared ? 0.3 : 1, transition: 'opacity 1s' }} />
                        <h2>{rainCleared ? "The Sky Clears" : "Let it Rain"}</h2>
                        <p>{rainCleared ? "Grief is a storm that eventually passes, leaving love behind." : "It is okay to cry. Let the heavy clouds pass."}</p>
                        {!rainCleared && <div style={{ fontSize: '0.75rem', marginTop: '1rem', opacity: 0.5, letterSpacing: '1px' }}>( Tap to clear the sky )</div>}
                    </div>
                </section>

                {/* 5. SUPPORT (Connection/Dawn Grey) */}
                <section className="section-support">
                    <div className="light-grid">
                        {[...Array(15)].map((_, i) => (
                            <div key={i} className={`light-dot ${i === 7 ? 'center' : ''}`}></div>
                        ))}
                    </div>
                    <h2 style={{ marginTop: '3rem' }}>You Are Held</h2>
                    <p>Surrounded by circles of quiet support. You do not walk this path alone.</p>
                </section>

                {/* 6. WAVE (Drifting/Lighter Grey) */}
                <section className="section-wave">
                    {/* Back Wave */}
                    <svg className="wave-svg back" viewBox="0 0 1440 320" preserveAspectRatio="none">
                        <path d="M0,192L48,197.3C96,203,192,213,288,229.3C384,245,480,267,576,250.7C672,235,768,181,864,181.3C960,181,1056,235,1152,234.7C1248,235,1344,181,1392,154.7L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
                    </svg>
                    {/* Front Wave */}
                    <svg className="wave-svg" viewBox="0 0 1440 320" preserveAspectRatio="none">
                        <path d="M0,96L48,112C96,128,192,160,288,160C384,160,480,128,576,112C672,96,768,96,864,112C960,128,1056,160,1152,160C1248,160,1344,128,1392,112L1440,96L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
                    </svg>

                    <h2 style={{ position: 'relative', zIndex: 10 }}>Ebb and Flow</h2>
                    <p style={{ position: 'relative', zIndex: 10 }}>
                        Healing is not a straight line.<br />It comes in waves. Drift with them.
                    </p>
                </section>

                {/* 7. BREATHE (Grounding) */}
                <section className="section-breathe">
                    <div className={`breathe-ring ${breathingState}`}>
                        {breathingState}
                    </div>
                    <div style={{ marginTop: '3rem' }}>
                        <Wind size={32} style={{ opacity: 0.6 }} strokeWidth={1} />
                        <p style={{ marginTop: '1.5rem', color: '#fff' }}>Just breathe. One moment at a time.</p>
                    </div>
                </section>

                {/* 8. THE LIGHT (Sunrise/Warmth) */}
                <section className="section-light">
                    <Sunrise size={64} className="sun-icon" color="#fb923c" strokeWidth={1} />
                    <h2 style={{ marginTop: '2rem' }}>A Gentle Dawn</h2>
                    <p style={{ color: '#57534e' }}>
                        "Happiness can be found, even in the darkest of times, if one only remembers to turn on the light."
                    </p>
                </section>

                {/* 9. OFFERINGS (Action) */}
                <section className="section-offerings">
                    <h2>Leave a Flower</h2>
                    <p style={{ color: '#78350f' }}>Tap anywhere in the garden below to leave a token of love.</p>

                    <div className="flower-zone" onClick={handleFlowerClick}>
                        {flowers.map(f => (
                            <div
                                key={f.id}
                                className="virtual-flower"
                                style={{
                                    left: f.x,
                                    top: f.y,
                                    transform: `translate(-50%, -50%) rotate(${f.rotation}deg) scale(${f.scale})`
                                }}
                            >
                                <Flower2 size={40} strokeWidth={1.5} />
                            </div>
                        ))}
                        {flowers.length === 0 && (
                            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', opacity: 0.4, fontStyle: 'italic', pointerEvents: 'none' }}>
                                ( The garden waits for you )
                            </div>
                        )}
                    </div>
                    <p style={{ fontSize: '0.9rem', opacity: 0.7, color: '#92400e' }}>{flowers.length} flowers placed in memory.</p>
                </section>

                {/* 10. FINAL CARD (Clarity/White) */}
                <section className="section-card">
                    <div className="paper-card">
                        <h1>Dear {data.recipient},</h1>
                        {data.deceased && (
                            <span className="deceased-label">In Loving Memory of {data.deceased}</span>
                        )}

                        <div className="message-body">
                            "{data.message}"
                        </div>

                        <div className="signature">
                            With deepest sympathy,<br />
                            <span style={{ fontSize: '1.2rem', marginTop: '5px', display: 'inline-block' }}>{data.sender}</span>
                        </div>

                        <div style={{ marginTop: '3rem', display: 'flex', justifyContent: 'flex-end', opacity: 0.8 }}>
                            <Heart size={18} fill="#ef4444" color="#ef4444" />
                        </div>
                    </div>

                    <div style={{ marginTop: '4rem', opacity: 0.7, fontSize: '0.9rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Phone size={14} />
                        <span>I am here if you need to talk.</span>
                    </div>
                </section>
            </div>
        </>
    );
};

export default SympathyPage;

