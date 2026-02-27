import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase'; // Adjust path based on your structure
import {
    Heart, MapPin, Music, PenTool,
    ChevronDown, Car, Wine, Cake,
    Sparkles, Camera
} from 'lucide-react';
import CardViewHeader from '../../components/CardViewHeader';
import CardFooter from '../../components/CardFooter';
import SongPlayer from '../../components/SongPlayer';
import { normalizeCardData, resolveCardId } from '../../utils/slugs';

const WeddingPage = () => {
    const { id } = useParams();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // --- Interaction States ---
    const [ringsLocked, setRingsLocked] = useState(false);
    const [cakeCut, setCakeCut] = useState(false);

    // Toast States
    const [glassFilled, setGlassFilled] = useState(false);
    const [toastClinked, setToastClinked] = useState(false);

    // Party States
    const [partyMode, setPartyMode] = useState(false);
    const [spotlightPos, setSpotlightPos] = useState({ x: 50, y: 50 });

    // Exit State
    const [entered, setEntered] = useState(false);

    // Refs
    const canvasRef = useRef(null);
    const paintingRef = useRef(false);
    const danceFloorRef = useRef(null);

    // --- Firebase Data Fetching ---
    useEffect(() => {
        if (!id) {
            setError("No wedding ID provided");
            setLoading(false);
            return;
        }

        let unsubscribe = () => { };

        const setupSubscription = async () => {
            try {
                const result = await resolveCardId(id, 'weddings', 'wedding');

                if (result) {
                    const realId = result.id;
                    const docRef = doc(db, 'weddings', realId);

                    unsubscribe = onSnapshot(docRef, (snapshot) => {
                        if (snapshot.exists()) {
                            setData(normalizeCardData(snapshot.data()));
                        } else {
                            setError("Wedding not found");
                        }
                        setLoading(false);
                    }, (err) => {
                        console.error(err);
                        setError("Could not load wedding details.");
                        setLoading(false);
                    });
                } else {
                    setLoading(false);
                }
            } catch (error) {
                console.error("Error resolving wedding card:", error);
                setLoading(false);
            }
        };

        setupSubscription();

        return () => unsubscribe();
    }, [id]);

    // --- Canvas Logic (Guestbook) ---
    useEffect(() => {
        const canvas = canvasRef.current;
        if (canvas && !loading) {
            const ctx = canvas.getContext('2d');
            ctx.strokeStyle = "#5F8170";
            ctx.lineWidth = 3;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';

            const resize = () => {
                const parent = canvas.parentElement;
                if (parent) {
                    // Save content before resize
                    const tempCanvas = document.createElement('canvas');
                    const tempCtx = tempCanvas.getContext('2d');
                    tempCanvas.width = canvas.width;
                    tempCanvas.height = canvas.height;
                    tempCtx.drawImage(canvas, 0, 0);

                    canvas.width = parent.clientWidth;
                    canvas.height = parent.clientHeight;

                    // Restore context settings after resize reset
                    ctx.strokeStyle = "#5F8170";
                    ctx.lineWidth = 3;
                    ctx.lineCap = 'round';
                    ctx.lineJoin = 'round';

                    // Restore content
                    ctx.drawImage(tempCanvas, 0, 0);
                }
            };

            // Initial size
            resize();
            window.addEventListener('resize', resize);
            return () => window.removeEventListener('resize', resize);
        }
    }, [loading]);

    const startDraw = (e) => {
        paintingRef.current = true;
        draw(e);
    };

    const endDraw = () => {
        paintingRef.current = false;
        const ctx = canvasRef.current.getContext('2d');
        ctx.beginPath();
    };

    const draw = (e) => {
        if (!paintingRef.current) return;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const rect = canvas.getBoundingClientRect();

        const clientX = e.type.includes('mouse') ? e.clientX : e.touches[0].clientX;
        const clientY = e.type.includes('mouse') ? e.clientY : e.touches[0].clientY;

        ctx.lineTo(clientX - rect.left, clientY - rect.top);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(clientX - rect.left, clientY - rect.top);
    };

    // --- Party Logic ---
    const handleDanceMove = (e) => {
        if (danceFloorRef.current) {
            const rect = danceFloorRef.current.getBoundingClientRect();
            const x = ((e.clientX - rect.left) / rect.width) * 100;
            const y = ((e.clientY - rect.top) / rect.height) * 100;
            setSpotlightPos({ x, y });
        }
    };

    // --- Render Logic ---
    if (loading) return <div className="loading-screen">Loading the romance...</div>;
    if (error) return <div className="error-screen">{error}</div>;

    const bride = data?.bride || data?.partner1;
    const groom = data?.groom || data?.partner2;
    const dateStr = data?.date ? new Date(data.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }) : null;
    const venue = data?.venue;

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
                    cardType="wedding"
                    cardId={id}
                    title="Wedding"
                    subtitle={bride && groom ? `${bride} & ${groom}` : undefined}
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

            <div className="immersive-wrapper">
                <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,400&family=Lato:wght@300;400;700&display=swap');

                :root {
                    --cream: #F9F7F2;
                    --white: #FFFFFF;
                    --eucalyptus: #5F8170;
                    --eucalyptus-dark: #3D5248;
                    --gold: #C5A059;
                    --gold-light: #E5C585;
                    --text-dark: #2C3E36;
                    --font-serif: 'Cormorant Garamond', serif;
                    --font-sans: 'Lato', sans-serif;
                }

                * { box-sizing: border-box; margin: 0; padding: 0; }
                
                body {
                    background-color: var(--cream);
                    color: var(--text-dark);
                    font-family: var(--font-sans);
                    overflow: hidden; 
                }

                .loading-screen, .error-screen {
                    height: 100vh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-family: var(--font-serif);
                    font-size: 1.5rem;
                    color: var(--eucalyptus);
                    background: var(--cream);
                }

                /* --- SCROLL CONTAINER --- */
                .immersive-wrapper {
                    height: 100dvh;
                    width: 100vw;
                    overflow-y: scroll;
                    scroll-snap-type: y mandatory;
                    scroll-behavior: smooth;
                    position: relative;
                }

                section {
                    height: 100dvh;
                    width: 100vw;
                    scroll-snap-align: start;
                    position: relative;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    overflow: hidden;
                    padding: 2rem;
                    text-align: center;
                    transition: background 0.5s ease;
                }

                h1, h2, h3 { font-family: var(--font-serif); font-weight: 400; }
                h2 { font-size: 3rem; margin-bottom: 1.5rem; color: var(--eucalyptus); z-index: 2;}
                p { 
                    font-size: 1.2rem; 
                    line-height: 1.6; 
                    color: var(--text-dark); 
                    max-width: 600px; 
                    z-index: 2;
                    margin-bottom: 1rem;
                }
                
                .btn-interaction {
                    margin-top: 20px;
                    padding: 10px 24px;
                    background: transparent;
                    border: 1px solid var(--eucalyptus);
                    color: var(--eucalyptus);
                    font-family: var(--font-sans);
                    text-transform: uppercase;
                    letter-spacing: 2px;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    z-index: 10;
                }
                .btn-interaction:hover {
                    background: var(--eucalyptus);
                    color: white;
                }

                /* --- SECTION 1: INTRO --- */
                .section-intro {
                    background: radial-gradient(circle at center, #ffffff 0%, var(--cream) 100%);
                }
                .monogram {
                    font-size: 12rem;
                    font-family: var(--font-serif);
                    color: var(--eucalyptus);
                    opacity: 0.1;
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    pointer-events: none;
                }
                .names {
                    font-size: 4.5rem;
                    line-height: 1;
                    margin-bottom: 1rem;
                    color: var(--eucalyptus-dark);
                    animation: fadeInUp 1.5s ease-out;
                }
                .date-pill {
                    border: 1px solid var(--gold);
                    padding: 8px 20px;
                    border-radius: 50px;
                    color: var(--gold);
                    margin-bottom: 2rem;
                    text-transform: uppercase;
                    font-size: 0.9rem;
                    letter-spacing: 2px;
                    background: white;
                    animation: fadeInDown 1.5s ease-out;
                }
                .scroll-hint {
                    position: absolute;
                    bottom: 30px;
                    animation: bounce 2s infinite;
                    opacity: 0.6;
                    color: var(--eucalyptus);
                }

                /* --- SECTION 2: AISLE --- */
                .section-aisle {
                    background: linear-gradient(to bottom, var(--cream), white);
                    perspective: 1000px;
                }
                .aisle-path {
                    position: absolute;
                    width: 200px;
                    height: 120%;
                    background: white;
                    box-shadow: 0 0 60px rgba(0,0,0,0.05);
                    transform: rotateX(45deg) scaleY(1.5);
                    transform-origin: bottom center;
                    bottom: -20%;
                }
                .flower-petal {
                    position: absolute;
                    animation: floatPetal 8s infinite linear;
                    opacity: 0.6;
                }

                /* --- SECTION 3: RINGS --- */
                .section-rings { background: white; }
                .rings-wrapper {
                    position: relative;
                    height: 200px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .rings-container {
                    display: flex;
                    gap: 80px;
                    transition: gap 0.8s cubic-bezier(0.68, -0.55, 0.265, 1.55);
                    cursor: pointer;
                }
                .rings-container.locked { gap: -30px; }
                .ring {
                    width: 120px;
                    height: 120px;
                    border: 12px solid var(--gold);
                    border-radius: 50%;
                    box-shadow: 0 10px 25px rgba(197, 160, 89, 0.3);
                    position: relative;
                    background: linear-gradient(135deg, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0) 100%);
                }
                .ring::after {
                    content: '';
                    position: absolute;
                    top: 10px; left: 10px;
                    width: 90%; height: 90%;
                    border-radius: 50%;
                    border: 1px solid rgba(255,255,255,0.5);
                }
                .sparkle-effect {
                    position: absolute;
                    top: 50%; left: 50%;
                    transform: translate(-50%, -50%);
                    width: 200px; height: 200px;
                    pointer-events: none;
                }

                /* --- SECTION 4: GUESTBOOK --- */
                .section-guestbook { background: var(--cream); }
                .canvas-frame {
                    background: white;
                    padding: 15px;
                    box-shadow: 0 20px 50px rgba(0,0,0,0.08);
                    border: 1px solid rgba(0,0,0,0.05);
                    position: relative;
                    transform: rotate(-1deg);
                    transition: transform 0.3s;
                }
                .canvas-frame:hover { transform: rotate(0deg) scale(1.01); }
                canvas {
                    border: 1px dashed var(--eucalyptus-light);
                    background: #FAFAFA;
                    touch-action: none;
                    cursor: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="%235F8170" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19l7-7 3 3-7 7-3-3z"></path><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"></path><path d="M2 2l7.5 8.6"></path><path d="M22 22l-5.5-5.5"></path></svg>') 0 24, auto;
                }

                /* --- SECTION 5: CAKE --- */
                .section-cake { background: white; }
                .cake-stand {
                    width: 200px; height: 10px;
                    background: #eee;
                    border-radius: 5px;
                    margin-top: -5px;
                }
                .cake-visual {
                    width: 220px;
                    height: 280px;
                    position: relative;
                    cursor: pointer;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: flex-end;
                }
                .cake-tier {
                    width: 100%;
                    background: var(--cream);
                    border: 1px solid rgba(0,0,0,0.05);
                    position: relative;
                    transition: transform 0.3s;
                }
                .tier-1 { height: 120px; width: 220px; border-radius: 5px 5px 0 0; z-index: 1;}
                .tier-2 { height: 100px; width: 160px; border-radius: 5px 5px 0 0; z-index: 2; margin-bottom: -1px;}
                .cake-visual:hover .cake-tier { transform: scale(1.02); }
                
                .slice-line {
                    position: absolute;
                    top: 0; left: 50%;
                    height: 100%; width: 2px;
                    background: transparent;
                    transition: background 0.2s;
                    z-index: 10;
                }
                .cake-visual.cut .slice-line { background: rgba(0,0,0,0.1); }
                .cake-visual.cut .tier-1 { transform: translateX(-5px); }
                
                .confetti {
                    position: absolute;
                    width: 10px; height: 10px;
                    background: var(--gold);
                    animation: confettiRain 1s forwards;
                }

                /* --- SECTION 6: PARTY --- */
                .section-party {
                    background: #1a1a1a;
                    color: white;
                    cursor: none;
                    transition: background 0.2s;
                }
                .section-party.strobing {
                    animation: strobe 0.5s infinite;
                }
                .section-party h2, .section-party p { color: white; text-shadow: 0 0 10px rgba(255,255,255,0.5); }
                
                .spotlight {
                    position: absolute;
                    width: 300px; height: 300px;
                    background: radial-gradient(circle, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0) 70%);
                    border-radius: 50%;
                    pointer-events: none;
                    transform: translate(-50%, -50%);
                    mix-blend-mode: screen;
                    z-index: 1;
                }
                .disco-ball-container {
                    position: relative;
                    margin-bottom: 2rem;
                    z-index: 5;
                }
                .disco-beams {
                    position: absolute;
                    top: 50%; left: 50%;
                    width: 100vw; height: 100vh;
                    transform: translate(-50%, -50%);
                    background: repeating-conic-gradient(from 0deg, rgba(255,255,255,0.03) 0deg 10deg, transparent 10deg 20deg);
                    animation: spin 10s linear infinite;
                    pointer-events: none;
                    opacity: 0;
                    transition: opacity 1s;
                }
                .party-active .disco-beams { opacity: 1; }

                /* --- SECTION 7: TOAST --- */
                .section-toast { background: var(--cream); }
                .glass-container {
                    position: relative;
                    width: 100px; height: 160px;
                    cursor: pointer;
                    margin-top: 20px;
                }
                .wine-glass {
                    width: 100%; height: 100%;
                    border: 2px solid #ddd;
                    border-radius: 5px 5px 40px 40px;
                    border-top: none;
                    position: relative;
                    overflow: hidden;
                    background: rgba(255,255,255,0.5);
                }
                .wine-glass::before {
                    content: '';
                    position: absolute;
                    bottom: -50px; left: 50%;
                    width: 10px; height: 100px;
                    background: #ddd;
                    transform: translateX(-50%);
                    z-index: -1;
                }
                .wine-liquid {
                    position: absolute;
                    bottom: 0; left: 0;
                    width: 100%;
                    height: 0%;
                    background: #E8CFD6; /* Rose wine */
                    transition: height 1.5s ease-in-out;
                }
                .glass-container.filled .wine-liquid { height: 70%; }
                .glass-container.clinked { animation: cheers 0.6s ease forwards; }

                .bubble {
                    position: absolute;
                    width: 8px; height: 8px;
                    background: rgba(255,255,255,0.6);
                    border-radius: 50%;
                    bottom: 0;
                    animation: bubbleRise 2s infinite;
                }

                /* --- SECTION 8: PHOTO BOOTH --- */
                .section-photo {
                    background: url("https://www.transparenttextures.com/patterns/grid-me.png"), white;
                }
                .polaroid {
                    background: white;
                    padding: 15px 15px 50px 15px;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.15);
                    transform: rotate(-3deg);
                    transition: transform 0.3s;
                    max-width: 320px;
                }
                .polaroid:hover { transform: rotate(0deg) scale(1.05); z-index: 10; }
                .polaroid img { width: 100%; display: block; filter: sepia(20%); }
                .tape {
                    width: 100px; height: 30px;
                    background: rgba(255,255,255,0.4);
                    position: absolute;
                    top: -15px; left: 50%;
                    transform: translateX(-50%) rotate(2deg);
                    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                    backdrop-filter: blur(2px);
                }

                /* --- SECTION 9: EXIT --- */
                .section-exit { background: var(--cream); overflow: hidden; }
                .car-wrapper {
                    position: relative;
                    transition: transform 2.5s cubic-bezier(0.55, 0.055, 0.675, 0.19);
                }
                .car-wrapper.drive { transform: translateX(200vw); }
                .exhaust {
                    position: absolute;
                    left: -20px; bottom: 10px;
                    width: 10px; height: 10px;
                    background: #aaa;
                    border-radius: 50%;
                    opacity: 0;
                }
                .car-wrapper.drive .exhaust { animation: puff 0.5s infinite; }

                /* --- ANIMATIONS --- */
                @keyframes bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(10px); } }
                @keyframes fadeInUp { from { opacity: 0; transform: translateY(40px); } to { opacity: 1; transform: translateY(0); } }
                @keyframes fadeInDown { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }
                @keyframes floatPetal { 0% { transform: translateY(0) rotate(0deg); opacity: 0; } 50% { opacity: 0.8; } 100% { transform: translateY(100vh) rotate(360deg); opacity: 0; } }
                @keyframes confettiRain { 0% { transform: translateY(0) rotate(0); opacity: 1; } 100% { transform: translateY(100px) rotate(720deg); opacity: 0; } }
                @keyframes strobe { 0%, 100% { background: #1a1a1a; } 50% { background: #333; } }
                @keyframes spin { 100% { transform: translate(-50%, -50%) rotate(360deg); } }
                @keyframes cheers { 0% { transform: rotate(0); } 40% { transform: rotate(-15deg); } 60% { transform: rotate(10deg) scale(1.1); } 100% { transform: rotate(0); } }
                @keyframes bubbleRise { 0% { bottom: 0; opacity: 0; } 50% { opacity: 1; } 100% { bottom: 100%; opacity: 0; } }
                @keyframes puff { 0% { transform: scale(1); opacity: 0.8; } 100% { transform: translate(-50px, 20px) scale(3); opacity: 0; } }

                /* --- RESPONSIVE --- */
                @media (max-width: 768px) {
                    h2 { font-size: 2.2rem; }
                    .names { font-size: 3rem; }
                    .monogram { font-size: 8rem; }
                    .rings-container { gap: 40px; }
                    .polaroid { max-width: 250px; }
                    .glass-container { width: 80px; height: 140px; }
                }
                `}</style>

                {/* 1. INTRO */}
                <section className="section-intro">
                    <div className="monogram">&</div>
                    {dateStr && <div className="date-pill">{dateStr}</div>}
                    <h1 className="names">{bride} <br />
                        <span style={{ fontSize: '0.4em', fontStyle: 'italic', fontFamily: 'var(--font-sans)', color: 'var(--gold)' }}>and</span>
                        <br /> {groom}
                    </h1>
                    <p>{data?.message ? `"${data.message}"` : "Invite you to celebrate their wedding."}</p>
                    <div className="scroll-hint">
                        <ChevronDown size={30} />
                    </div>
                </section>

                {/* 2. THE AISLE */}
                <section className="section-aisle">
                    <div className="aisle-path"></div>
                    <div className="flower-petal" style={{ left: '10%', top: '-10%', animationDelay: '0s' }}><Heart size={20} fill="#E8CFD6" stroke="none" /></div>
                    <div className="flower-petal" style={{ right: '20%', top: '-20%', animationDelay: '2s' }}><Heart size={15} fill="#E8CFD6" stroke="none" /></div>
                    <div className="flower-petal" style={{ left: '30%', top: '-15%', animationDelay: '4s' }}><Heart size={24} fill="#E8CFD6" stroke="none" /></div>

                    <h2>The Ceremony</h2>
                    {venue && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', zIndex: 5, background: 'rgba(255,255,255,0.9)', padding: '10px 20px', borderRadius: '30px' }}>
                            <MapPin size={18} color="#C5A059" />
                            <span style={{ color: 'var(--eucalyptus-dark)' }}>{venue}</span>
                        </div>
                    )}
                </section>

                {/* 3. THE RINGS */}
                <section className="section-rings">
                    <h2>The Vows</h2>
                    <p>{ringsLocked ? "Forever Linked." : "Tap to seal the vows."}</p>

                    <div className="rings-wrapper">
                        <div
                            className={`rings-container ${ringsLocked ? 'locked' : ''}`}
                            onClick={() => setRingsLocked(true)}
                        >
                            <div className="ring"></div>
                            <div className="ring" style={{ animationDelay: '0.5s' }}></div>
                        </div>
                        {ringsLocked && (
                            <div className="sparkle-effect">
                                <Sparkles size={60} color="#E5C585" style={{ position: 'absolute', top: -20, left: 40, animation: 'bounce 1s' }} />
                                <Sparkles size={40} color="#E5C585" style={{ position: 'absolute', bottom: -20, right: 40, animation: 'bounce 1.2s' }} />
                            </div>
                        )}
                    </div>
                </section>

                {/* 4. GUESTBOOK */}
                <section className="section-guestbook">
                    <h2>Guest Book</h2>
                    <p>Sign your name or leave a doodle.</p>
                    <div className="canvas-frame">
                        <canvas
                            ref={canvasRef}
                            onMouseDown={startDraw}
                            onMouseUp={endDraw}
                            onMouseMove={draw}
                            onTouchStart={startDraw}
                            onTouchEnd={endDraw}
                            onTouchMove={draw}
                            style={{ width: '100%', height: '300px', maxWidth: '500px' }}
                        />
                        <div style={{ position: 'absolute', bottom: '20px', right: '20px', color: '#5F8170', opacity: 0.5 }}>
                            <PenTool size={20} />
                        </div>
                    </div>
                </section>

                {/* 5. THE CAKE */}
                <section className="section-cake">
                    <h2>The Cake</h2>
                    <p>{cakeCut ? "Sweetness shared!" : "Click to cut the cake."}</p>

                    <div
                        className={`cake-visual ${cakeCut ? 'cut' : ''}`}
                        onClick={() => setCakeCut(true)}
                    >
                        <div className="cake-tier tier-2"></div>
                        <div className="cake-tier tier-1"></div>
                        <div className="slice-line"></div>

                        {/* Confetti Explosion */}
                        {cakeCut && (
                            <>
                                <div className="confetti" style={{ left: '20%', top: '20%', backgroundColor: '#FFD700' }}></div>
                                <div className="confetti" style={{ left: '50%', top: '10%', backgroundColor: '#FF69B4', animationDelay: '0.1s' }}></div>
                                <div className="confetti" style={{ left: '80%', top: '30%', backgroundColor: '#87CEEB', animationDelay: '0.2s' }}></div>
                            </>
                        )}
                    </div>
                    <div className="cake-stand"></div>

                </section>

                {/* 6. THE PARTY (Disco) */}
                <section
                    className={`section-party ${partyMode ? 'party-active strobing' : ''}`}
                    ref={danceFloorRef}
                    onMouseMove={handleDanceMove}
                >
                    <div className="spotlight" style={{ left: `${spotlightPos.x}%`, top: `${spotlightPos.y}%` }}></div>
                    <div className="disco-beams"></div>

                    <div className="disco-ball-container" onClick={() => setPartyMode(!partyMode)}>
                        <div style={{ width: '2px', height: '100px', background: '#555', margin: '0 auto' }}></div>
                        <div style={{
                            width: '100px', height: '100px', borderRadius: '50%',
                            background: 'radial-gradient(circle at 30% 30%, #fff, #999)',
                            boxShadow: partyMode ? '0 0 40px white' : 'none',
                            transition: 'box-shadow 0.3s'
                        }}></div>
                    </div>

                    <h2>The Party</h2>
                    <p>{partyMode ? "Let's dance all night!" : "Tap the disco ball to start the party."}</p>
                    <Music size={40} style={{ marginTop: '20px', opacity: partyMode ? 1 : 0.5, animation: partyMode ? 'bounce 0.5s infinite' : 'none' }} />
                </section>

                {/* 7. THE TOAST */}
                <section className="section-toast">
                    <h2>The Toast</h2>
                    <p>{!glassFilled ? "Tap to pour." : !toastClinked ? "Tap to clink!" : "Cheers!"}</p>

                    <div
                        className={`glass-container ${glassFilled ? 'filled' : ''} ${toastClinked ? 'clinked' : ''}`}
                        onClick={() => {
                            if (!glassFilled) setGlassFilled(true);
                            else setToastClinked(true);
                        }}
                    >
                        <div className="wine-glass">
                            <div className="wine-liquid">
                                {toastClinked && (
                                    <>
                                        <div className="bubble" style={{ left: '20%', animationDelay: '0s' }}></div>
                                        <div className="bubble" style={{ left: '50%', animationDelay: '0.5s' }}></div>
                                        <div className="bubble" style={{ left: '70%', animationDelay: '1s' }}></div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </section>

                {/* 8. PHOTO BOOTH (Conditional) */}
                {data?.imageUrl && (
                    <section className="section-photo">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '2rem' }}>
                            <Camera size={32} color="#333" />
                            <h2>Photo Booth</h2>
                        </div>
                        <div className="polaroid">
                            <div className="tape"></div>
                            <img src={data.imageUrl} alt="The Happy Couple" />
                        </div>
                    </section>
                )}

                {/* 9. EXIT */}
                <section className="section-exit">
                    <h2>Just Married</h2>
                    <div
                        className={`car-wrapper ${entered ? 'drive' : ''}`}
                        onClick={() => setEntered(true)}
                        style={{ cursor: 'pointer', marginTop: '40px' }}
                    >
                        <Car size={100} color="#5F8170" />
                        <div className="exhaust"></div>
                        <div className="exhaust" style={{ animationDelay: '0.2s', left: '-30px' }}></div>
                    </div>
                    <p style={{ marginTop: '20px' }}>
                        {entered ? "Off to the honeymoon!" : "Tap the car to send them off!"}
                    </p>
                </section>
            </div>
        </>
    );
};

export default WeddingPage;

