import React, { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import CardViewHeader from '../../components/CardViewHeader';
import SongPlayer from '../../components/SongPlayer';
import { Heart, Mic, Wind, CloudRain, Sun, Play, Pause, X, GripHorizontal, Fingerprint, Music } from 'lucide-react';
import { normalizeCardData, resolveCardId } from '../../utils/slugs';

// --- CUSTOM CSS STYLES ---
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,600;1,400&family=Inter:wght@300;400;500&display=swap');

  :root {
    --bg-color: #1a1a1d;
    --fog-color: #2d3748;
    --rain-blue: #64b5f6;
    --warm-amber: #ffb74d;
    --text-primary: #e2e8f0;
    --text-secondary: #94a3b8;
    --glass-panel: rgba(255, 255, 255, 0.05);
  }

  /* Reset & Base */
  * { box-sizing: border-box; margin: 0; padding: 0; }
  
  body {
    background-color: var(--bg-color);
    color: var(--text-primary);
    font-family: 'Inter', sans-serif;
    overflow: hidden;
  }

  h1, h2, h3 { font-family: 'Cormorant Garamond', serif; font-weight: 300; }

  /* Scrollytelling Container */
  .scrolly-container {
    height: 100dvh;
    width: 100vw;
    overflow-y: scroll;
    scroll-snap-type: y mandatory;
    scroll-behavior: smooth;
    position: relative;
    background: var(--bg-color);
  }

  /* Section Standard */
  .story-section {
    height: 100dvh;
    width: 100vw;
    scroll-snap-align: start;
    position: relative;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    overflow: hidden;
    padding: 2rem;
    perspective: 1000px;
    opacity: 0.2;
    transition: opacity 1s ease;
  }

  .story-section.active {
    opacity: 1;
  }

  /* Typography */
  .narrative-text {
    font-size: 1.5rem;
    text-align: center;
    max-width: 600px;
    margin-bottom: 2rem;
    line-height: 1.6;
    text-shadow: 0 4px 20px rgba(0,0,0,0.5);
    z-index: 10;
  }

  .micro-label {
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.15em;
    color: var(--text-secondary);
    margin-bottom: 1rem;
    opacity: 0.7;
  }

  /* --- SECTION 1: FOGGY WINDOW --- */
  .fog-canvas {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    cursor: crosshair;
    z-index: 5;
    touch-action: none;
  }
  .reveal-text {
    position: absolute;
    font-family: 'Cormorant Garamond', serif;
    font-size: 4rem;
    font-style: italic;
    color: var(--text-primary);
    z-index: 1;
    pointer-events: none;
    text-align: center;
  }

  /* --- SECTION 2: THE ECHO --- */
  .echo-input {
    background: transparent;
    border: none;
    border-bottom: 1px solid var(--text-secondary);
    color: var(--text-primary);
    font-size: 2rem;
    text-align: center;
    font-family: 'Cormorant Garamond', serif;
    width: 80%;
    max-width: 400px;
    outline: none;
    padding-bottom: 10px;
  }
  .echo-container {
    position: absolute;
    width: 100%;
    height: 100%;
    pointer-events: none;
  }
  .echo-word {
    position: absolute;
    color: var(--text-secondary);
    font-family: 'Cormorant Garamond', serif;
    transform: translate(-50%, -50%);
    animation: driftFade 4s forwards;
  }
  @keyframes driftFade {
    0% { opacity: 0.8; transform: translate(-50%, -50%) scale(1); }
    100% { opacity: 0; transform: translate(-50%, -150%) scale(0.5); }
  }

  /* --- SECTION 3: DISTANCE --- */
  .distance-track {
    width: 80%;
    max-width: 300px;
    height: 2px;
    background: var(--text-secondary);
    position: relative;
    margin: 40px 0;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .dot {
    width: 12px;
    height: 12px;
    background: var(--text-primary);
    border-radius: 50%;
    position: absolute;
    transition: transform 0.1s linear, box-shadow 0.3s ease;
  }
  .dot.left { left: 0; }
  .dot.right { right: 0; }
  .distance-slider {
    width: 80%;
    max-width: 300px;
    opacity: 0;
    position: absolute;
    z-index: 10;
    cursor: grab;
  }
  .glow-line {
    position: absolute;
    height: 100%;
    background: var(--rain-blue);
    left: 0;
    top: 0;
    box-shadow: 0 0 15px var(--rain-blue);
  }

  /* --- SECTION 4: AUDIO --- */
  .waveform-canvas {
    width: 100%;
    max-width: 500px;
    height: 200px;
    border-radius: 12px;
    background: rgba(0,0,0,0.2);
    margin: 20px 0;
  }
  .play-btn-circle {
    width: 60px;
    height: 60px;
    border-radius: 50%;
    border: 1px solid var(--text-primary);
    background: transparent;
    color: var(--text-primary);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.3s ease;
  }
  .play-btn-circle:hover {
    background: var(--text-primary);
    color: var(--bg-color);
    transform: scale(1.1);
  }

  /* --- SECTION 5: SCENT (CANDLE) --- */
  .candle-container {
    position: relative;
    width: 40px;
    height: 120px;
    background: #e0e0e0;
    border-radius: 4px;
    margin-top: 50px;
    box-shadow: inset -5px 0 10px rgba(0,0,0,0.1);
  }
  .flame {
    position: absolute;
    top: -30px;
    left: 50%;
    transform: translateX(-50%);
    width: 16px;
    height: 30px;
    background: var(--warm-amber);
    border-radius: 50% 50% 20% 20%;
    box-shadow: 0 0 20px var(--warm-amber), 0 0 60px var(--warm-amber);
    animation: flicker 0.1s infinite alternate;
  }
  @keyframes flicker {
    0% { transform: translateX(-50%) skewX(-2deg) scaleY(1); opacity: 0.9; }
    100% { transform: translateX(-50%) skewX(2deg) scaleY(1.1); opacity: 1; }
  }

  /* --- SECTION 6: MEMORY MATCH --- */
  .memory-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 15px;
    margin-top: 20px;
  }
  .memory-card {
    width: 100px;
    height: 100px;
    background: var(--glass-panel);
    border: 1px solid var(--text-secondary);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 2rem;
    cursor: pointer;
    transition: transform 0.6s;
    transform-style: preserve-3d;
    position: relative;
  }
  .memory-card.flipped {
    background: var(--rain-blue);
    border-color: var(--rain-blue);
    transform: rotateY(180deg);
  }
  .memory-card.matched {
    opacity: 0.5;
    pointer-events: none;
  }

  /* --- SECTION 7: HEART SYNC --- */
  .heart-container {
    position: relative;
    width: 120px;
    height: 120px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .pulse-ring {
    position: absolute;
    border: 2px solid var(--text-primary);
    border-radius: 50%;
    width: 100%;
    height: 100%;
    opacity: 0;
  }
  .pulse-active {
    animation: ripple 2s infinite linear;
  }
  @keyframes ripple {
    0% { transform: scale(0.8); opacity: 0.8; }
    100% { transform: scale(2); opacity: 0; }
  }
  .tap-area {
    width: 100%;
    height: 100%;
    position: absolute;
    z-index: 10;
    cursor: pointer;
  }

  /* --- SECTION 8: THE VOID --- */
  .void-container {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: black;
    z-index: 1;
  }
  .hidden-content {
    z-index: 0;
    color: var(--text-primary);
    text-align: center;
    padding: 20px;
  }

  /* --- SECTION 9: HUG --- */
  .hug-button {
    width: 100px;
    height: 100px;
    border-radius: 50%;
    background: var(--glass-panel);
    border: 2px solid var(--text-primary);
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    overflow: hidden;
    user-select: none;
    touch-action: none;
  }
  .hug-fill {
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    background: var(--warm-amber);
    transition: height 0.1s linear;
    z-index: 0;
  }
  .hug-icon { z-index: 1; position: relative; }

  /* --- SECTION 10: HOPE --- */
  .sunrise {
    width: 200px;
    height: 200px;
    background: var(--warm-amber);
    border-radius: 50%;
    filter: blur(40px);
    position: absolute;
    bottom: -100px;
    opacity: 0;
    transition: opacity 3s ease, bottom 3s ease;
  }
  .sunrise.risen {
    bottom: 50px;
    opacity: 0.8;
  }
  
  .loading-screen {
    height: 100dvh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    color: var(--text-secondary);
  }
  
  .hidden { visibility: hidden; }

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
  .spotify-icon { color: var(--warm-amber); transition: opacity 0.3s; }
  .spotify-float:hover .spotify-icon { opacity: 0; display: none; }
  .spotify-float iframe { opacity: 0; transition: opacity 0.5s ease 0.2s; width: 100%; height: 100%; }
  .spotify-float:hover iframe { opacity: 1; }

  /* Enhanced Floating Spotify Player */
  .floating-spotify-player {
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 2000;
    background: rgba(255, 183, 77, 0.1);
    backdrop-filter: blur(15px);
    padding: 12px;
    border-radius: 50px;
    box-shadow: 0 8px 32px rgba(255, 183, 77, 0.15);
    display: flex;
    align-items: center;
    gap: 12px;
    border: 2px solid var(--warm-amber);
    transition: all 0.3s ease;
    animation: slideInRight 0.6s ease-out;
  }

  .floating-spotify-player:hover {
    transform: scale(1.05);
    box-shadow: 0 12px 40px rgba(255, 183, 77, 0.25);
    background: rgba(255, 183, 77, 0.2);
  }

  .spotify-disc {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: linear-gradient(135deg, #1db954, #191414);
    overflow: hidden;
    animation: spin 4s linear infinite;
    border: 2px solid var(--warm-amber);
    box-shadow: 0 4px 12px rgba(0,0,0,0.2);
  }

  .spotify-disc img { 
    width: 100%; 
    height: 100%; 
    object-fit: cover; 
  }

  .spotify-info-mini {
    max-width: 140px;
    overflow: hidden;
    white-space: nowrap;
    font-size: 0.85rem;
    color: var(--text-primary);
    font-family: 'Inter', sans-serif;
    font-weight: 600;
  }

  .scrolling-text {
    display: inline-block;
    white-space: nowrap;
    animation: scrollText 12s linear infinite;
  }

  .mini-play-btn {
    background: var(--warm-amber);
    border: none;
    color: var(--bg-color);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    transition: all 0.3s ease;
  }

  .mini-play-btn:hover {
    background: var(--bg-color);
    color: var(--warm-amber);
    transform: scale(1.1);
  }

  @keyframes slideInRight { 
    from { transform: translateX(120%); opacity: 0; } 
    to { transform: translateX(0); opacity: 1; } 
  }

  @keyframes scrollText {
    0% { transform: translateX(0); }
    100% { transform: translateX(-100%); }
  }

  @keyframes spin { 
    to { transform: rotate(360deg); } 
  }
`;

// --- ENHANCED COMPONENTS ---

const EnhancedSongPlayer = ({ song }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    
    return (
        <div className="floating-spotify-player">
            <div className="spotify-disc" style={{ animationPlayState: isPlaying ? 'running' : 'paused' }}>
                {song.albumArt ? (
                    <img src={song.albumArt} alt="Album Art" />
                ) : (
                    <Music size={20} color="white" style={{ margin: '10px' }} />
                )}
            </div>
            <div className="spotify-info-mini">
                <span className="scrolling-text">{song.name || "Our Song"} - {song.artist || "Artist"}</span>
            </div>
            <button 
                className="mini-play-btn" 
                onClick={() => setIsPlaying(!isPlaying)}
            >
                {isPlaying ? <Pause size={14} /> : <Play size={14} />}
            </button>
            <SongPlayer song={song} isPlaying={isPlaying} setIsPlaying={setIsPlaying} />
        </div>
    );
};

const MissingYouView = () => {
    const { wishId } = useParams();
    const [wishData, setWishData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeSection, setActiveSection] = useState(0);

    // --- REFS & STATE FOR INTERACTIONS ---
    const containerRef = useRef(null);
    
    // Sec 1: Fog
    const canvasRef = useRef(null);
    const [fogCleared, setFogCleared] = useState(false);

    // Sec 2: Echo
    const [echoText, setEchoText] = useState("");
    const [echoes, setEchoes] = useState([]);

    // Sec 3: Distance
    const [distanceVal, setDistanceVal] = useState(100);

    // Sec 4: Audio
    const [isPlaying, setIsPlaying] = useState(false);
    const audioRef = useRef(null);
    const visualizerRef = useRef(null);

    // Sec 6: Memory
    const [cards, setCards] = useState([]);
    const [matchedCount, setMatchedCount] = useState(0);

    // Sec 8: Void
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

    // Sec 9: Hug
    const [hugProgress, setHugProgress] = useState(0);
    const [hugSent, setHugSent] = useState(false);
    const hugInterval = useRef(null);

    // --- 1. DATA FETCHING ---
    useEffect(() => {
        const fetchWishData = async () => {
            try {
                const result = await resolveCardId(wishId, 'wishes', 'missing-you');
                if (result) {
                    setWishData(normalizeCardData(result.data));
                }
            } catch (error) {
                console.error("Error fetching wish:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchWishData();
    }, [wishId]);

    // --- 2. OBSERVER (SCROLL SPY) ---
    useEffect(() => {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const index = Number(entry.target.dataset.index);
                    setActiveSection(index);
                }
            });
        }, { threshold: 0.5 });

        const sections = document.querySelectorAll('.story-section');
        sections.forEach(s => observer.observe(s));

        return () => observer.disconnect();
    }, [loading]);

    // --- INTERACTION HANDLERS ---

    // 1. Foggy Window Logic
    useEffect(() => {
        if (!canvasRef.current || activeSection !== 0) return;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const width = canvas.width = canvas.offsetWidth;
        const height = canvas.height = canvas.offsetHeight;

        // Draw Fog
        ctx.fillStyle = "#2d3748";
        ctx.fillRect(0, 0, width, height);
        
        // Add some noise/texture to fog
        for(let i=0; i<5000; i++){
            ctx.fillStyle = "rgba(255,255,255,0.05)";
            ctx.beginPath();
            ctx.arc(Math.random()*width, Math.random()*height, Math.random()*2, 0, Math.PI*2);
            ctx.fill();
        }

        ctx.globalCompositeOperation = 'destination-out';

        const handleMove = (e) => {
            const rect = canvas.getBoundingClientRect();
            let clientX, clientY;
            
            if(e.touches) {
                clientX = e.touches[0].clientX;
                clientY = e.touches[0].clientY;
            } else {
                clientX = e.clientX;
                clientY = e.clientY;
            }
            
            const x = clientX - rect.left;
            const y = clientY - rect.top;

            ctx.beginPath();
            ctx.arc(x, y, 40, 0, Math.PI * 2);
            ctx.fill();

            setFogCleared(true);
            
            // Auto-scroll to next section when fog is significantly cleared
            if (fogCleared) {
                const imageData = ctx.getImageData(0, 0, width, height);
                const pixels = imageData.data;
                let transparentPixels = 0;
                for (let i = 3; i < pixels.length; i += 4) {
                    if (pixels[i] < 128) transparentPixels++;
                }
                const clearedPercentage = (transparentPixels / (pixels.length / 4)) * 100;
                
                if (clearedPercentage > 30) {
                    setTimeout(() => {
                        const nextSection = document.querySelector('[data-index="1"]');
                        if (nextSection) {
                            nextSection.scrollIntoView({ behavior: 'smooth' });
                        }
                    }, 500);
                }
            }
        };

        canvas.addEventListener('mousemove', handleMove);
        canvas.addEventListener('touchmove', handleMove);

        return () => {
            canvas.removeEventListener('mousemove', handleMove);
            canvas.removeEventListener('touchmove', handleMove);
        };
    }, [loading, activeSection]);

    // 2. Echo Logic
    const handleEchoInput = (e) => {
        const val = e.target.value;
        setEchoText(val);
        if (val.length > echoText.length) {
            const id = Date.now();
            const newEcho = {
                id,
                text: val,
                left: 50 + (Math.random() * 20 - 10),
                top: 50 + (Math.random() * 20 - 10)
            };
            setEchoes(prev => [...prev, newEcho]);
            setTimeout(() => {
                setEchoes(prev => prev.filter(echo => echo.id !== id));
            }, 4000);
        }
    };

    // 6. Memory Game Logic
    useEffect(() => {
        if(cards.length === 0 && wishData) {
            const symbols = ['☁️', '🌧️', '🕯️', '🫂'];
            const deck = [...symbols, ...symbols]
                .sort(() => Math.random() - 0.5)
                .map((symbol, i) => ({ id: i, symbol, flipped: false, matched: false }));
            setCards(deck);
        }
    }, [wishData]);

    const handleCardClick = (id) => {
        const newCards = [...cards];
        const cardIndex = newCards.findIndex(c => c.id === id);
        if(newCards[cardIndex].flipped || newCards[cardIndex].matched) return;

        newCards[cardIndex].flipped = true;
        setCards(newCards);

        const flipped = newCards.filter(c => c.flipped && !c.matched);
        if(flipped.length === 2) {
            if(flipped[0].symbol === flipped[1].symbol) {
                setTimeout(() => {
                    const matchedCards = newCards.map(c => 
                        c.symbol === flipped[0].symbol ? { ...c, matched: true } : c
                    );
                    setCards(matchedCards);
                    setMatchedCount(prev => prev + 1);
                }, 500);
            } else {
                setTimeout(() => {
                    const resetCards = newCards.map(c => 
                        c.flipped && !c.matched ? { ...c, flipped: false } : c
                    );
                    setCards(resetCards);
                }, 1000);
            }
        }
    };

    // 8. The Void (Flashlight)
    const handleVoidMove = (e) => {
        let clientX, clientY;
        if(e.touches) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else {
            clientX = e.clientX;
            clientY = e.clientY;
        }
        setMousePos({ x: clientX, y: clientY });
    };

    // 9. The Hug
    const startHug = () => {
        if(hugSent) return;
        hugInterval.current = setInterval(() => {
            setHugProgress(prev => {
                if(prev >= 100) {
                    clearInterval(hugInterval.current);
                    setHugSent(true);
                    return 100;
                }
                return prev + 2;
            });
        }, 50);
    };

    const stopHug = () => {
        if(hugSent) return;
        clearInterval(hugInterval.current);
        setHugProgress(0);
    };

    if (loading) {
        return (
            <>
                <style>{styles}</style>
                <div className="loading-screen">
                    <CloudRain size={48} className="animate-bounce" />
                    <p style={{ marginTop: 20 }}>Gathering memories...</p>
                </div>
            </>
        );
    }

    if (!wishData) return <div className="loading-screen">Message not found.</div>;

    // Helper to get Spotify ID
    const getSpotifyId = (url) => {
        if (!url) return null;
        try {
            const parts = url.split('/');
            return parts[parts.length - 1].split('?')[0];
        } catch (e) { return null; }
    };
    const spotifyId = getSpotifyId(wishData.spotify);

    // --- RENDER ---
    return (
        <>
            <style>{styles}</style>
            
            {/* Nav / Close */}
            <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 100 }}>
               <CardViewHeader cardType="missing-you" cardId={wishId} title="" />
            </div>

            {/* Enhanced Floating Spotify Player */}
            {wishData?.song && <EnhancedSongPlayer song={wishData.song} />}

            <div className="scrolly-container" ref={containerRef}>
                
                {/* 1. THE FOGGY WINDOW */}
                <section className={`story-section ${activeSection === 0 ? 'active' : ''}`} data-index="0">
                    <canvas ref={canvasRef} className="fog-canvas" />
                    <div className="reveal-text">
                        <p className="micro-label">Wipe the glass</p>
                        <h1>I Miss You</h1>
                        <p style={{fontSize: '1.2rem', marginTop: '1rem'}}>{wishData.recipientName}</p>
                    </div>
                </section>

                {/* 2. THE ECHO */}
                <section className={`story-section ${activeSection === 1 ? 'active' : ''}`} data-index="1">
                    <div className="echo-container">
                        {echoes.map(e => (
                            <span key={e.id} className="echo-word" style={{ left: `${e.left}%`, top: `${e.top}%` }}>
                                {e.text}
                            </span>
                        ))}
                    </div>
                    <p className="micro-label">Say something into the void</p>
                    <input 
                        type="text" 
                        className="echo-input" 
                        placeholder="Type here..." 
                        value={echoText}
                        onChange={handleEchoInput}
                    />
                </section>

                {/* 3. THE DISTANCE */}
                <section className={`story-section ${activeSection === 2 ? 'active' : ''}`} data-index="2">
                    <p className="micro-label">Close the gap</p>
                    <div className="narrative-text">
                        "The miles between us mean nothing when you mean everything."
                    </div>
                    <div className="distance-track">
                        <div className="glow-line" style={{ width: `${100 - distanceVal}%` }}></div>
                        <div className="dot left" style={{ transform: `translateX(${ (100-distanceVal) * 2 }px)` }}></div>
                        <div className="dot right" style={{ transform: `translateX(-${ (100-distanceVal) * 2 }px)` }}></div>
                    </div>
                    <input 
                        type="range" 
                        min="0" 
                        max="100" 
                        className="distance-slider" 
                        value={distanceVal} 
                        onChange={(e) => setDistanceVal(e.target.value)} 
                    />
                </section>

                {/* 4. AUDIO VISUALIZER (Simulated) */}
                <section className={`story-section ${activeSection === 3 ? 'active' : ''}`} data-index="3">
                     <p className="micro-label">Listen closely</p>
                     <div className="waveform-canvas" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                        {[...Array(20)].map((_, i) => (
                            <div key={i} style={{
                                width: 4,
                                height: isPlaying ? Math.random() * 100 + 20 : 10,
                                background: 'var(--rain-blue)',
                                borderRadius: 2,
                                transition: 'height 0.1s ease'
                            }}></div>
                        ))}
                     </div>
                     <button className="play-btn-circle" onClick={() => setIsPlaying(!isPlaying)}>
                        {isPlaying ? <Pause size={24}/> : <Play size={24} />}
                     </button>
                     <p style={{ marginTop: 20, opacity: 0.6 }}>{wishData.song ? wishData.song.name : "Voice Note"}</p>
                </section>

                {/* 5. THE SCENT */}
                <section className={`story-section ${activeSection === 4 ? 'active' : ''}`} data-index="4">
                    <p className="micro-label">A familiar warmth</p>
                    <div className="candle-container">
                        <div className="flame"></div>
                    </div>
                    <div className="narrative-text" style={{ marginTop: 60 }}>
                        "I wish you were here to smell this."
                    </div>
                </section>

                {/* 6. MEMORY MATCH */}
                <section className={`story-section ${activeSection === 5 ? 'active' : ''}`} data-index="5">
                    <p className="micro-label">Remember when?</p>
                    <div className="memory-grid">
                        {cards.map(card => (
                            <div 
                                key={card.id} 
                                className={`memory-card ${card.flipped ? 'flipped' : ''} ${card.matched ? 'matched' : ''}`}
                                onClick={() => handleCardClick(card.id)}
                            >
                                {card.flipped || card.matched ? card.symbol : ''}
                            </div>
                        ))}
                    </div>
                    <p style={{ marginTop: 20, maxWidth: 400, textAlign: 'center', opacity: matchedCount === 4 ? 1 : 0, transition: 'opacity 1s' }}>
                        {wishData.memories || "Every moment is saved in my heart."}
                    </p>
                </section>

                {/* 7. HEART SYNC */}
                <section className={`story-section ${activeSection === 6 ? 'active' : ''}`} data-index="6">
                    <p className="micro-label">Tap to my heartbeat</p>
                    <div className="heart-container">
                        <div className="pulse-ring pulse-active"></div>
                        <div className="pulse-ring pulse-active" style={{ animationDelay: '0.5s' }}></div>
                        <Heart size={64} fill="var(--bg-color)" color="var(--text-primary)" />
                        <div className="tap-area"></div>
                    </div>
                    <p style={{ marginTop: 30, color: 'var(--text-secondary)' }}>Syncing pulses...</p>
                </section>

                {/* 8. THE VOID */}
                <section 
                    className={`story-section ${activeSection === 7 ? 'active' : ''}`} 
                    data-index="7"
                    onMouseMove={handleVoidMove}
                    onTouchMove={handleVoidMove}
                >
                    <div className="void-container" style={{
                         background: `radial-gradient(circle 200px at ${mousePos.x}px ${mousePos.y}px, transparent 0%, black 100%)`
                    }}></div>
                    <div className="hidden-content">
                        <h2>Even in the dark,</h2>
                        <h3>I can find you.</h3>
                    </div>
                </section>

                {/* 9. THE HUG */}
                <section className={`story-section ${activeSection === 8 ? 'active' : ''}`} data-index="8">
                    <p className="micro-label">Hold to send</p>
                    <button 
                        className="hug-button"
                        onMouseDown={startHug}
                        onMouseUp={stopHug}
                        onMouseLeave={stopHug}
                        onTouchStart={startHug}
                        onTouchEnd={stopHug}
                    >
                        <div className="hug-fill" style={{ height: `${hugProgress}%` }}></div>
                        {hugSent ? <Heart fill="white" className="hug-icon" /> : <Fingerprint className="hug-icon" />}
                    </button>
                    <h3 style={{ marginTop: 20 }}>{hugSent ? "Hug Sent" : "Sending Virtual Hug..."}</h3>
                </section>

                {/* 10. THE HOPE */}
                <section className={`story-section ${activeSection === 9 ? 'active' : ''}`} data-index="9">
                    <div className={`sunrise ${activeSection === 9 ? 'risen' : ''}`}></div>
                    <div style={{ zIndex: 10, textAlign: 'center' }}>
                        <h1>See you soon.</h1>
                        <p style={{ marginTop: 20, fontFamily: 'Inter', fontSize: '1rem', color: 'var(--text-secondary)' }}>
                            From {wishData.sender}
                        </p>
                        <p className="micro-label" style={{ marginTop: 40 }}>End of message</p>
                    </div>
                </section>

            </div>
        </>
    );
};

export default MissingYouView;
