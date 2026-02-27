import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import CardViewHeader from '../../components/CardViewHeader';
import CardFooter from '../../components/CardFooter';
import SongPlayer from '../../components/SongPlayer';
import { resolveCardId } from '../../utils/slugs';
import {
    Plane, Map, Compass, Cloud, Anchor, Camera,
    Coffee, Wind, Stamp, Ticket, Music, Volume2,
    VolumeX, ArrowDown, Play, Pause
} from 'lucide-react';

// --- AUDIO ENGINE ---
// A simple synthesizer to avoid external mp3 dependencies
class AudioEngine {
    constructor() {
        this.ctx = null;
        this.osc = null;
        this.gain = null;
        this.isPlaying = false;
    }

    init() {
        if (!this.ctx) {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
            this.gain = this.ctx.createGain();
            this.gain.connect(this.ctx.destination);
        }
    }

    startDrone() {
        if (this.isPlaying || !this.ctx) return;
        this.osc = this.ctx.createOscillator();
        this.osc.type = 'sine';
        this.osc.frequency.setValueAtTime(110, this.ctx.currentTime); // Low A
        this.osc.connect(this.gain);
        this.gain.gain.setValueAtTime(0.05, this.ctx.currentTime); // Quiet drone
        this.osc.start();
        this.isPlaying = true;
    }

    playPing() {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.frequency.setValueAtTime(880, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(440, this.ctx.currentTime + 0.5);

        gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.5);

        osc.start();
        osc.stop(this.ctx.currentTime + 0.5);
    }

    playStampSound() {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.type = 'square';
        osc.frequency.setValueAtTime(100, this.ctx.currentTime);
        gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.1);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.1);
    }

    stop() {
        if (this.osc) {
            this.osc.stop();
            this.osc.disconnect();
            this.isPlaying = false;
        }
    }
}

const audio = new AudioEngine();

// --- STYLES (CUSTOM CSS) ---
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;700&family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=Courier+Prime&display=swap');

  :root {
    --air-red: #D9381E;
    --air-blue: #003366;
    --paper: #F4F1EA;
    --ink: #2C2C2C;
    --gold: #D4AF37;
    --ease-out: cubic-bezier(0.215, 0.61, 0.355, 1);
  }

  * { box-sizing: border-box; }

  body, html {
    margin: 0;
    padding: 0;
    width: 100%;
    height: 100%;
    background-color: var(--paper);
    color: var(--ink);
    font-family: 'DM Sans', sans-serif;
    overflow: hidden; /* Prevent default scroll, handle in container */
  }

  .scroll-container {
    height: 100vh;
    height: 100dvh;
    overflow-y: scroll;
    scroll-snap-type: y mandatory;
    scroll-behavior: smooth;
  }

  section {
    height: 100vh;
    height: 100dvh;
    width: 100%;
    scroll-snap-align: start;
    position: relative;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    transition: background 0.5s ease;
  }

  /* --- UTILITIES --- */
  .airmail-border {
    position: absolute;
    top: 0; left: 0; right: 0; bottom: 0;
    pointer-events: none;
    border: 12px solid transparent;
    border-image: repeating-linear-gradient(
      -45deg,
      var(--air-red) 0,
      var(--air-red) 15px,
      transparent 15px,
      transparent 30px,
      var(--air-blue) 30px,
      var(--air-blue) 45px,
      transparent 45px,
      transparent 60px
    ) 20;
    opacity: 0.6;
    z-index: 10;
  }

  h1, h2, h3 { font-family: 'Playfair Display', serif; margin: 0; }
  .mono { font-family: 'Courier Prime', monospace; }

  .btn-primary {
    background: var(--air-blue);
    color: white;
    border: none;
    padding: 1rem 2rem;
    font-size: 1.1rem;
    font-family: 'Courier Prime', monospace;
    cursor: pointer;
    border-radius: 4px;
    transition: transform 0.2s, background 0.2s;
    text-transform: uppercase;
    letter-spacing: 2px;
  }
  .btn-primary:active { transform: scale(0.95); }
  .btn-primary:hover { background: #004080; }

  /* --- SECTIONS SPECIFIC --- */
  
  /* COVER */
  .envelope {
    width: 300px;
    height: 200px;
    background: #fff;
    border: 2px solid #ddd;
    position: relative;
    display: flex;
    justify-content: center;
    align-items: center;
    box-shadow: 0 20px 40px rgba(0,0,0,0.1);
    transition: transform 0.6s var(--ease-out);
    cursor: pointer;
  }
  .envelope.open { transform: translateY(100vh) rotate(-10deg); opacity: 0; }
  .stamp-visual {
    position: absolute;
    top: 20px; right: 20px;
    width: 60px; height: 70px;
    border: 2px dashed var(--air-red);
    display: flex; align-items: center; justify-content: center;
    color: var(--air-red);
    transform: rotate(15deg);
    font-size: 0.8rem;
    font-weight: bold;
  }

  /* BOARDING PASS */
  .ticket-stub {
    width: 320px;
    background: white;
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 10px 30px rgba(0,0,0,0.15);
    position: relative;
    display: flex;
    flex-direction: column;
  }
  .stub-header { background: var(--air-red); color: white; padding: 1rem; }
  .stub-body { padding: 1.5rem; border-bottom: 2px dashed #ccc; }
  .stub-footer { padding: 1rem; background: #f9f9f9; display: flex; justify-content: space-between; align-items: center; }
  .rip-zone { 
    height: 60px; background: #eee; 
    display: flex; align-items: center; justify-content: center;
    font-size: 0.8rem; color: #888;
    cursor: grab;
    user-select: none;
  }
  .rip-zone:active { cursor: grabbing; }

  /* SUITCASE */
  .suitcase-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 10px;
    background: #333;
    padding: 10px;
    border-radius: 8px;
    width: 300px;
  }
  .grid-item {
    aspect-ratio: 1;
    background: #444;
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #666;
    cursor: pointer;
    transition: all 0.3s;
  }
  .grid-item.packed { background: var(--gold); color: white; transform: scale(0.9); }

  /* ROUTE */
  .map-container {
    width: 100%; height: 100%;
    position: relative;
    background: #a8d0e6;
  }
  .route-svg { width: 100%; height: 100%; position: absolute; top: 0; left: 0; }
  
  /* WINDOW */
  .window-frame {
    width: 280px; height: 400px;
    background: white;
    border-radius: 140px 140px 40px 40px;
    box-shadow: inset 0 0 20px rgba(0,0,0,0.2), 0 0 0 50px #eee;
    overflow: hidden;
    position: relative;
    cursor: pointer;
  }
  .window-view {
    width: 100%; height: 100%;
    background: linear-gradient(to bottom, #1e5799 0%,#2989d8 50%,#207cca 51%,#7db9e8 100%);
    position: relative;
  }
  .shade {
    position: absolute;
    top: 0; left: 0; width: 100%; height: 100%;
    background: #f4f4f4;
    border-bottom: 4px solid #ccc;
    transition: transform 0.6s var(--ease-out);
    transform: translateY(-90%); /* Open by default */
  }
  .shade.closed { transform: translateY(0%); }

  /* CLOUDS */
  .cloud-canvas {
    position: absolute; top: 0; left: 0; width: 100%; height: 100%;
    cursor: crosshair;
  }

  /* LANGUAGE CARD */
  .card-scene {
    width: 300px; height: 200px;
    perspective: 1000px;
    cursor: pointer;
  }
  .card-inner {
    width: 100%; height: 100%;
    position: relative;
    transition: transform 0.8s;
    transform-style: preserve-3d;
  }
  .card-scene.flipped .card-inner { transform: rotateY(180deg); }
  .card-face {
    position: absolute;
    width: 100%; height: 100%;
    backface-visibility: hidden;
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    border-radius: 10px;
    box-shadow: 0 10px 30px rgba(0,0,0,0.2);
    font-size: 2rem;
    font-family: 'Playfair Display', serif;
  }
  .card-front { background: white; color: var(--air-blue); }
  .card-back { background: var(--air-blue); color: white; transform: rotateY(180deg); }

  /* STAMP */
  .passport-page {
    width: 320px; height: 440px;
    background: #fffdf5;
    background-image: radial-gradient(#ddd 1px, transparent 1px);
    background-size: 20px 20px;
    border: 1px solid #ddd;
    position: relative;
    cursor: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/></svg>') 12 12, auto;
    overflow: hidden;
    box-shadow: 0 5px 15px rgba(0,0,0,0.1);
  }
  .ink-stamp {
    position: absolute;
    border: 3px double var(--air-blue);
    color: var(--air-blue);
    padding: 5px 10px;
    border-radius: 4px;
    font-family: 'Courier Prime', monospace;
    font-weight: bold;
    text-transform: uppercase;
    pointer-events: none;
    opacity: 0.8;
    transform: translate(-50%, -50%);
    animation: stampIn 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  }
  @keyframes stampIn { from { transform: translate(-50%, -50%) scale(1.5); opacity: 0; } to { transform: translate(-50%, -50%) scale(1) rotate(var(--r)); opacity: 0.8; } }

  /* TURBULENCE */
  .coffee-cup {
    transition: transform 0.1s;
    filter: drop-shadow(0 10px 5px rgba(0,0,0,0.2));
  }
  
  /* ARRIVAL */
  .arrival-msg {
    text-align: center;
    opacity: 0;
    transform: translateY(20px);
    animation: fadeUp 1s forwards 0.5s;
  }
  @keyframes fadeUp { to { opacity: 1; transform: translateY(0); } }

  /* Generic Animations */
  .float { animation: float 6s ease-in-out infinite; }
  @keyframes float { 0% { transform: translateY(0px); } 50% { transform: translateY(-20px); } 100% { transform: translateY(0px); } }

  .rotate-badge { animation: spin 10s linear infinite; }
  @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

  @media (max-width: 600px) {
    h1 { font-size: 2rem; }
    .envelope, .ticket-stub, .window-frame { transform: scale(0.9); }
  }

  /* Enhanced Floating Spotify Player */
  .floating-spotify-player {
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 2000;
    background: rgba(0, 51, 102, 0.95);
    backdrop-filter: blur(15px);
    padding: 12px;
    border-radius: 50px;
    box-shadow: 0 8px 32px rgba(217, 56, 30, 0.15);
    display: flex;
    align-items: center;
    gap: 12px;
    border: 2px solid var(--air-red);
    transition: all 0.3s ease;
    animation: slideInRight 0.6s ease-out;
  }
  
  .floating-spotify-player:hover {
    transform: scale(1.05);
    box-shadow: 0 12px 40px rgba(217, 56, 30, 0.25);
    background: rgba(0, 51, 102, 1);
  }
  
  .spotify-disc {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: linear-gradient(135deg, #1db954, #191414);
    overflow: hidden;
    animation: spin 4s linear infinite;
    border: 2px solid var(--air-red);
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
    color: var(--paper);
    font-family: 'DM Sans', sans-serif;
    font-weight: 600;
  }
  
  .scrolling-text {
    display: inline-block;
    white-space: nowrap;
    animation: scrollText 12s linear infinite;
  }
  
  .mini-play-btn {
    background: var(--air-red);
    border: none;
    color: white;
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
    background: var(--air-blue);
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


// --- MAIN COMPONENT ---
const BonVoyagePage = () => {
    const { id } = useParams();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [audioEnabled, setAudioEnabled] = useState(false);
    const containerRef = useRef(null);

    useEffect(() => {
        const fetchWishData = async () => {
            try {
                const result = await resolveCardId(id, 'bon_voyage_cards', 'bon-voyage');
                if (result) {
                    setData(result.data);
                } else {
                    // Fallback
                    setData({
                        recipientName: "Friend",
                        sender: "Me",
                        message: "May your journey be filled with wonder and your coffee be strong. Don't forget to look out the window!",
                        destination: "Paris",
                        langHello: "Bonjour"
                    });
                }
            } catch (error) {
                console.error("Error fetching wish:", error);
                setData({
                    recipientName: "Friend",
                    sender: "Me",
                    message: "May your journey be filled with wonder and your coffee be strong. Don't forget to look out the window!",
                    destination: "Paris",
                    langHello: "Bonjour"
                });
            } finally {
                setLoading(false);
            }
        };
        fetchWishData();
    }, [id]);

    const toggleAudio = () => {
        if (!audioEnabled) {
            audio.init();
            audio.startDrone();
            setAudioEnabled(true);
        } else {
            audio.stop();
            setAudioEnabled(false);
        }
    };

    if (loading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#F4F1EA' }}>Loading Ticket...</div>;

    return (
        <>
            <style>{styles}</style>

            <CardViewHeader
                cardType="bon-voyage"
                cardId={id}
                title="Bon Voyage"
                subtitle={data.recipientName ? 'For ' + data.recipientName : undefined}
            />

            {/* Enhanced Floating Spotify Player */}
            {data?.song && <EnhancedSongPlayer song={data.song} />}

            <div className="scroll-container" ref={containerRef}>

                {/* Global Controls */}
                <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 100 }}>
                    <button onClick={toggleAudio} style={{ background: 'none', border: 'none', cursor: 'pointer', color: audioEnabled ? '#D9381E' : '#ccc' }}>
                        {audioEnabled ? <Volume2 size={24} /> : <VolumeX size={24} />}
                    </button>
                </div>

                {/* SECTION 1: COVER */}
                <SectionCover traveler={data.recipientName || "Friend"} onOpen={toggleAudio} />

                {/* SECTION 2: BOARDING PASS */}
                <SectionBoardingPass data={data} />

                {/* SECTION 3: SUITCASE */}
                <SectionSuitcase />

                {/* SECTION 4: ROUTE */}
                <SectionRoute />

                {/* SECTION 5: WINDOW */}
                <SectionWindow />

                {/* SECTION 6: CLOUDS */}
                <SectionClouds />

                {/* SECTION 7: LANGUAGE */}
                <SectionLanguage word={data.langHello || "Hello"} />

                {/* SECTION 8: POSTCARD */}
                <SectionPostcard message={data.message} sender={data.sender} />

                {/* SECTION 9: STAMP */}
                <SectionStamp date={new Date().toLocaleDateString()} />

                {/* SECTION 10: ARRIVAL */}
                <SectionArrival destination={data.destination} />

            </div>
        </>
    );
};

// --- SUB-COMPONENTS ---

const SectionCover = ({ traveler, onOpen }) => {
    const [isOpen, setIsOpen] = useState(false);

    const handleClick = () => {
        setIsOpen(true);
        onOpen();
        setTimeout(() => {
            // Auto scroll suggestion after animation
            const next = document.querySelector('.section-2');
            if (next) next.scrollIntoView({ behavior: 'smooth' });
        }, 1000);
    };

    return (
        <section className="section-1">
            <div className="airmail-border" />
            <div className={'envelope ' + (isOpen ? 'open' : '')} onClick={handleClick}>
                <div className="stamp-visual">AIR MAIL</div>
                <div style={{ textAlign: 'center' }}>
                    <h2 className="mono" style={{ fontSize: '1rem', color: '#888', marginBottom: '0.5rem' }}>FOR:</h2>
                    <h1 style={{ fontSize: '2rem', color: 'var(--ink)' }}>{traveler}</h1>
                    <p style={{ marginTop: '1rem', fontSize: '0.8rem', color: '#aaa' }}>(Tap to Open)</p>
                </div>
            </div>
            {!isOpen && <div style={{ position: 'absolute', bottom: 40, animation: 'float 2s infinite' }}>
                <ArrowDown size={24} color="#ccc" />
            </div>}
        </section>
    );
};

const SectionBoardingPass = ({ data }) => {
    const [isTorn, setIsTorn] = useState(false);
    const [dragStart, setDragStart] = useState(0);
    const [dragEnd, setDragEnd] = useState(0);
    const [isDragging, setIsDragging] = useState(false);

    const handleMouseDown = (e) => {
        setIsDragging(true);
        setDragStart(e.clientX);
    };

    const handleMouseMove = (e) => {
        if (isDragging) {
            setDragEnd(e.clientX);
        }
    };

    const handleMouseUp = () => {
        if (isDragging) {
            const dragDistance = Math.abs(dragEnd - dragStart);
            if (dragDistance > 100) {
                setIsTorn(true);
                audio.playPing();
            }
            setIsDragging(false);
            setDragEnd(0);
        }
    };

    const handleTouchStart = (e) => {
        setIsDragging(true);
        setDragStart(e.touches[0].clientX);
    };

    const handleTouchMove = (e) => {
        if (isDragging) {
            setDragEnd(e.touches[0].clientX);
        }
    };

    const handleTouchEnd = () => {
        if (isDragging) {
            const dragDistance = Math.abs(dragEnd - dragStart);
            if (dragDistance > 100) {
                setIsTorn(true);
                audio.playPing();
            }
            setIsDragging(false);
            setDragEnd(0);
        }
    };

    return (
        <section className="section-2" style={{ background: '#e0e0e0' }}>
            <div className="ticket-stub" style={{ position: 'relative' }}>
                <div className="stub-header">
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span className="mono">BOARDING PASS</span>
                        <Plane size={20} />
                    </div>
                </div>
                <div className="stub-body">
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                        <div>
                            <p className="mono" style={{ fontSize: '0.7rem', color: '#888' }}>PASSENGER</p>
                            <h3>{data.recipientName || "Friend"}</h3>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <p className="mono" style={{ fontSize: '0.7rem', color: '#888' }}>DESTINATION</p>
                            <h3>{data.destination.toUpperCase().substring(0, 3)}</h3>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <div>
                            <p className="mono" style={{ fontSize: '0.7rem', color: '#888' }}>DATE</p>
                            <p>TODAY</p>
                        </div>
                        <div>
                            <p className="mono" style={{ fontSize: '0.7rem', color: '#888' }}>TIME</p>
                            <p>NOW</p>
                        </div>
                        <div>
                            <p className="mono" style={{ fontSize: '0.7rem', color: '#888' }}>GATE</p>
                            <p>01</p>
                        </div>
                    </div>
                </div>
                <div
                    className="rip-zone"
                    style={{
                        cursor: isDragging ? 'grabbing' : 'grab',
                        background: isDragging ? '#ddd' : '#eee',
                        transform: isDragging ? 'translateX(' + (dragEnd - dragStart) + 'px)' : 'translateX(0)',
                        transition: isDragging ? 'none' : 'transform 0.3s ease'
                    }}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                >
                    {isTorn ? (
                        <span style={{ color: 'var(--air-red)', fontWeight: 'bold' }}>✓ TICKET TORN!</span>
                    ) : (
                        <span>SWIPE TO TEAR →</span>
                    )}
                </div>
                {isTorn && (
                    <div style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        background: 'rgba(217, 56, 30, 0.1)',
                        padding: '1rem 2rem',
                        borderRadius: '10px',
                        border: '2px solid var(--air-red)',
                        animation: 'fadeIn 0.5s ease'
                    }}>
                        <p style={{ color: 'var(--air-red)', fontWeight: 'bold', textAlign: 'center' }}>
                            Boarding Pass Valid!
                        </p>
                    </div>
                )}
            </div>
        </section>
    );
};

const SectionSuitcase = () => {
    // Simple packing game
    const [items, setItems] = useState([
        { id: 1, icon: <Camera size={24} />, packed: false, name: 'Camera' },
        { id: 2, icon: <Ticket size={24} />, packed: false, name: 'Tickets' },
        { id: 3, icon: <Compass size={24} />, packed: false, name: 'Compass' },
        { id: 4, icon: <Music size={24} />, packed: false, name: 'Tunes' },
        { id: 5, icon: <Map size={24} />, packed: false, name: 'Map' },
        { id: 6, icon: <Anchor size={24} />, packed: false, name: 'Lucky Charm' },
    ]);
    const toggleItem = (id) => {
        audio.playPing();
        setItems(prev => prev.map(item => item.id === id ? { ...item, packed: !item.packed } : item));
    };

    const allPacked = items.every(i => i.packed);

    return (
        <section className="section-3" style={{ background: '#2C3E50' }}>
            <h2 style={{ color: 'white', marginBottom: '2rem' }}>Pack Your Bags</h2>
            <div className="suitcase-grid">
                {items.map(item => (
                    <div
                        key={item.id}
                        className={'grid-item ' + (item.packed ? 'packed' : '')}
                        onClick={() => toggleItem(item.id)}
                    >
                        {item.packed ? "✓" : item.icon}
                    </div>
                ))}
            </div>
            <p style={{ color: '#aaa', marginTop: '1rem', fontFamily: 'Courier Prime' }}>
                {allPacked ? "Ready for takeoff!" : (items.filter(i => !i.packed).length) + ' items left to pack.'}
            </p>
        </section>
    );
};
const SectionRoute = () => {
    const [progress, setProgress] = useState(0);
    const [isAnimating, setIsAnimating] = useState(false);
    useEffect(() => {
        const interval = setInterval(() => {
            setProgress(prev => (prev + 1) % 101);
        }, 50);
        return () => clearInterval(interval);
    }, []);

    const handleStartAnimation = () => {
        setIsAnimating(true);
        audio.playPing();
        setTimeout(() => setIsAnimating(false), 2000);
    };

    return (
        <section className="section-4" style={{ background: '#a8d0e6', cursor: 'pointer' }} onClick={handleStartAnimation}>
            <div className="map-container">
                {/* Animated route path */}
                <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ width: '100%', height: '100%' }}>
                    {/* Background route */}
                    <path
                        d="M -10 80 Q 50 20 110 80"
                        stroke="rgba(255,255,255,0.3)"
                        strokeWidth="4"
                        fill="none"
                        strokeDasharray="5,5"
                    />
                    {/* Progress route */}
                    <path
                        d="M -10 80 Q 50 20 110 80"
                        stroke="white"
                        strokeWidth="2"
                        fill="none"
                        strokeDasharray="200"
                        strokeDashoffset={200 - (progress * 2)}
                        style={{ transition: 'stroke-dashoffset 0.5s ease' }}
                    />
                    {/* Waypoints */}
                    <circle cx="10" cy="70" r="3" fill="white" opacity={progress > 10 ? 1 : 0.3} />
                    <circle cx="30" cy="50" r="3" fill="white" opacity={progress > 30 ? 1 : 0.3} />
                    <circle cx="50" cy="30" r="3" fill="white" opacity={progress > 50 ? 1 : 0.3} />
                    <circle cx="70" cy="50" r="3" fill="white" opacity={progress > 70 ? 1 : 0.3} />
                    <circle cx="90" cy="70" r="3" fill="white" opacity={progress > 90 ? 1 : 0.3} />
                </svg>

                <div style={{
                    position: 'absolute',
                    top: '50%', left: '50%',
                    transform: 'translate(-50%, -50%)',
                    textAlign: 'center',
                    transition: 'all 0.5s ease'
                }}>
                    <Plane
                        className="float"
                        size={48}
                        color="white"
                        style={{
                            transform: 'rotate(15deg) ' + (isAnimating ? 'scale(1.2)' : 'scale(1)'),
                            transition: 'transform 0.3s ease'
                        }}
                    />
                    <p className="mono" style={{ color: 'white', marginTop: '10px' }}>
                        EN ROUTE
                    </p>
                    <div style={{
                        marginTop: '1rem',
                        fontSize: '0.8rem',
                        color: 'rgba(255,255,255,0.8)'
                    }}>
                        {progress}% Complete
                    </div>
                </div>

                {/* Animated clouds */}
                <div style={{
                    position: 'absolute',
                    top: '20%',
                    left: '10%',
                    animation: 'floatCloud 8s ease-in-out infinite',
                    opacity: 0.6
                }}>
                    <Cloud size={30} color="rgba(255,255,255,0.8)" />
                </div>
                <div style={{
                    position: 'absolute',
                    top: '60%',
                    right: '15%',
                    animation: 'floatCloud 10s ease-in-out infinite 2s',
                    opacity: 0.5
                }}>
                    <Cloud size={25} color="rgba(255,255,255,0.7)" />
                </div>
                <div style={{
                    position: 'absolute',
                    bottom: '30%',
                    left: '20%',
                    animation: 'floatCloud 12s ease-in-out infinite 4s',
                    opacity: 0.4
                }}>
                    <Cloud size={35} color="rgba(255,255,255,0.6)" />
                </div>
            </div>

            <style>{`
            @keyframes floatCloud {
                0%, 100% { transform: translateY(0px); }
                50% { transform: translateY(-15px); }
            }
        `}</style>
        </section>
    );
};
const SectionWindow = () => {
    const [closed, setClosed] = useState(true);
    return (
        <section className="section-5">
            <div className="window-frame" onClick={() => { audio.playPing(); setClosed(!closed); }}>
                <div className="window-view">
                    {/* Simple CSS Cloud animation inside window */}
                    <Cloud size={40} color="white" style={{ position: 'absolute', top: '30%', left: '20%', opacity: 0.8 }} />
                    <Cloud size={60} color="white" style={{ position: 'absolute', top: '50%', left: '60%', opacity: 0.6 }} />
                </div>
                <div className={'shade ' + (closed ? 'closed' : '')}>
                    <div style={{ position: 'absolute', bottom: 20, width: '100%', textAlign: 'center', color: '#ccc' }}>
                        <span style={{ fontSize: '0.8rem' }}>TAP TO OPEN</span>
                    </div>
                </div>
            </div>
        </section>
    );
};
const SectionClouds = () => {
    const canvasRef = useRef(null);
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        let width = canvas.width = window.innerWidth;
        let height = canvas.height = window.innerHeight;
        let particles = [];

        // Resize handler
        const handleResize = () => {
            width = canvas.width = window.innerWidth;
            height = canvas.height = window.innerHeight;
        };
        window.addEventListener('resize', handleResize);

        // Particle Class
        class Particle {
            constructor() {
                this.x = Math.random() * width;
                this.y = Math.random() * height;
                this.size = Math.random() * 20 + 10;
                this.speedX = Math.random() * 1 - 0.5;
                this.speedY = Math.random() * 1 - 0.5;
            }
            update(mouseX, mouseY) {
                this.x += this.speedX;
                this.y += this.speedY;

                // Mouse repulsion
                const dx = mouseX - this.x;
                const dy = mouseY - this.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < 100) {
                    this.x -= dx * 0.05;
                    this.y -= dy * 0.05;
                }

                // Wrap around
                if (this.x > width) this.x = 0;
                if (this.x < 0) this.x = width;
                if (this.y > height) this.y = 0;
                if (this.y < 0) this.y = height;
            }
            draw() {
                ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        // Init particles
        for (let i = 0; i < 50; i++) particles.push(new Particle());

        let mouseX = -1000;
        let mouseY = -1000;

        const onMove = (e) => {
            const bounds = canvas.getBoundingClientRect();
            mouseX = (e.clientX || e.touches[0].clientX) - bounds.left;
            mouseY = (e.clientY || e.touches[0].clientY) - bounds.top;
        };

        window.addEventListener('mousemove', onMove);
        window.addEventListener('touchmove', onMove, { passive: false });

        // Loop
        const animate = () => {
            ctx.clearRect(0, 0, width, height);
            particles.forEach(p => {
                p.update(mouseX, mouseY);
                p.draw();
            });
            requestAnimationFrame(animate);
        };
        animate();

        return () => {
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('mousemove', onMove);
            window.removeEventListener('touchmove', onMove);
        };
    }, []);

    return (
        <section className="section-6" style={{ background: '#89CFF0' }}>
            <h2 style={{ position: 'absolute', top: '10%', color: 'white', zIndex: 10 }}>Cloud Surfing</h2>
            <canvas ref={canvasRef} className="cloud-canvas" />
        </section>
    );
};
const SectionLanguage = ({ word }) => {
    const [flipped, setFlipped] = useState(false);
    return (
        <section className="section-7">
            <h2 style={{ marginBottom: '2rem' }}>Learn the Lingo</h2>
            <div className={'card-scene ' + (flipped ? 'flipped' : '')} onClick={() => { audio.playPing(); setFlipped(!flipped); }}>
                <div className="card-inner">
                    <div className="card-face card-front">
                        <p className="mono" style={{ fontSize: '1rem', color: '#888' }}>Tap to translate</p>
                        <h3>"Hello"</h3>
                    </div>
                    <div className="card-face card-back">
                        <h3>"{word}"</h3>
                    </div>
                </div>
            </div>
        </section>
    );
};
const SectionPostcard = ({ message, sender }) => {
    return (
        <section className="section-8" style={{ background: '#f0f0f0' }}>
            <div style={{ width: '320px', padding: '2rem', background: 'white', boxShadow: '0 20px 40px rgba(0,0,0,0.1)', transform: 'rotate(-2deg)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                    <h2 style={{ fontSize: '1.2rem' }}>Postcard</h2>
                    <div style={{ width: 40, height: 50, border: '1px dashed #ccc' }}></div>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <div style={{ flex: 1, fontSize: '0.9rem', lineHeight: '1.6', fontFamily: 'cursive', color: '#444' }}>
                        {message}
                    </div>
                    <div style={{ flex: 1, borderLeft: '1px solid #eee', paddingLeft: '1rem', display: 'flex', alignItems: 'flex-end' }}>
                        <div style={{ fontSize: '0.8rem' }}>
                            <p>From:</p>
                            <strong>{sender}</strong>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};
const SectionStamp = () => {
    const [stamps, setStamps] = useState([]);
    const addStamp = (e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const r = Math.random() * 40 - 20;

        audio.playStampSound();

        setStamps([...stamps, { x, y, r, id: Date.now() }]);
    };

    return (
        <section className="section-9">
            <h2 style={{ marginBottom: '1rem' }}>Passport Control</h2>
            <div className="passport-page" onClick={addStamp}>
                {stamps.map(s => (
                    <div
                        key={s.id}
                        className="ink-stamp"
                        style={{ left: s.x, top: s.y, '--r': s.r + 'deg' }}
                    >
                        APPROVED
                    </div>
                ))}
                <div style={{ position: 'absolute', bottom: 10, left: 0, width: '100%', textAlign: 'center', color: '#ccc', pointerEvents: 'none' }}>
                    CLICK TO STAMP
                </div>
            </div>
        </section>
    );
};
const SectionArrival = ({ destination }) => {
    return (
        <section className="section-10" style={{ background: 'var(--air-blue)', color: 'white' }}>
            <div className="arrival-msg">
                <Plane size={64} style={{ marginBottom: '2rem' }} />
                <h1 style={{ fontSize: '3rem', color: 'var(--gold)' }}>Arrived</h1>
                <h2 style={{ marginTop: '1rem', fontWeight: 'normal' }}>Welcome to {destination}</h2>
                <p style={{ marginTop: '2rem', opacity: 0.7 }}>Safe Travels & Blue Skies.</p>
            </div>
        </section>
    );
};
export default BonVoyagePage;

