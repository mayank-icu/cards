import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';
import {
    Radar, MapPin, Clock, Heart, Wind,
    Send, Lock, Unlock, X, CloudRain, Sun, Moon
} from 'lucide-react';
import CardViewHeader from '../../components/CardViewHeader';
import CardFooter from '../../components/CardFooter';
import SongPlayer from '../../components/SongPlayer';
import { normalizeCardData, resolveCardId } from '../../utils/slugs'; 

/* --- HELPERS & UTILS --- */

// Text Scramble Effect Hook
const useScrambleText = (text, active) => {
    const [display, setDisplay] = useState(active ? text : '');
    const chars = '!<>-_\\/[]{}—=+*^?#________';
    
    useEffect(() => {
        if (!active) return;
        let iteration = 0;
        const interval = setInterval(() => {
            setDisplay(
                text
                    .split("")
                    .map((letter, index) => {
                        if (index < iteration) return text[index];
                        return chars[Math.floor(Math.random() * chars.length)];
                    })
                    .join("")
            );
            if (iteration >= text.length) clearInterval(interval);
            iteration += 1 / 3;
        }, 30);
        return () => clearInterval(interval);
    }, [text, active]);

    return display;
};

/* --- MAIN COMPONENT --- */

const LongDistancePage = () => {
    const { id } = useParams();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [started, setStarted] = useState(false);
    const [error, setError] = useState(false);

    // Fetch Data
    useEffect(() => {
        if (!id) return;
        let unsubscribe = () => { };

        const setupSubscription = async () => {
            try {
                // Try to resolve slug first, fallback to raw ID
                const result = await resolveCardId(id, 'long-distance', 'long-distance').catch(() => null);
                const realId = result ? result.id : id;
                
                if (!realId) throw new Error("ID not found");

                const cardDoc = doc(db, 'long-distance', realId);

                unsubscribe = onSnapshot(cardDoc, (snapshot) => {
                    if (snapshot.exists()) {
                        setData(normalizeCardData(snapshot.data()));
                    } else {
                        setError(true);
                    }
                    setLoading(false);
                }, (err) => {
                    console.error("Firestore error:", err);
                    setError(true);
                    setLoading(false);
                });
            } catch (err) {
                console.error("Setup error:", err);
                setError(true);
                setLoading(false);
            }
        };

        setupSubscription();
        return () => unsubscribe();
    }, [id]);

    const handleEnter = () => {
        setStarted(true);
        // Small vibration for mobile
        if (navigator.vibrate) navigator.vibrate(50);
    };

    if (loading) return <LoadingScreen />;
    if (!data) return <ErrorScreen />;

    return (
        <>
            <CardViewHeader
                cardType="long-distance"
                cardId={id}
                title="Long Distance"
                subtitle={data?.partnerName ? `${data.partnerName}${data?.yourName ? ` · From ${data.yourName}` : ''}` : undefined}
            />
            <SongPlayer song={data?.song} />
            <div className="ld-wrapper">
                <GlobalStyles />

                <main className="ld-scroller">
                    
                    {/* 1. Intro / Airlock */}
                    <IntroSection 
                        data={data} 
                        started={started} 
                        onEnter={handleEnter} 
                    />

                    {/* 2. Radar */}
                    <RadarSection data={data} />

                    {/* 3. Map */}
                    <MapSection data={data} />

                    {/* 4. Time */}
                    <TimeSection data={data} />

                    {/* 5. String */}
                    <StringSection />

                    {/* 6. Touch */}
                    <TouchSection />

                    {/* 7. Weather */}
                    <WeatherSection />

                    {/* 8. Letter */}
                    <LetterSection data={data} />

                    {/* 9. Meeting */}
                    <MeetingStatusSection data={data} />

                    {/* 10. Conclusion */}
                    <ConclusionSection data={data} />

                </main>
            </div>
        </>
    );
};

/* --- SUB-COMPONENTS --- */

const IntroSection = ({ data, started, onEnter }) => {
    return (
        <section className="ld-section section-intro">
            <div className="noise-overlay"></div>
            <div className="content-center">
                <div className="status-pill">
                    <div className={`status-dot ${started ? 'online' : 'blink'}`}></div>
                    <span>{started ? 'CONNECTION ESTABLISHED' : 'INCOMING SIGNAL'}</span>
                </div>
                
                <h1 className="hero-title">
                    {data.partnerName || 'Partner'} <span className="amp">&</span> {data.yourName || 'You'}
                </h1>
                
                {!started ? (
                    <div className="entry-gate">
                        <p className="gate-text">Encrypted Channel Ready</p>
                        <button className="btn-enter" onClick={onEnter}>
                            <Unlock size={18} />
                            <span>ESTABLISH LINK</span>
                        </button>
                    </div>
                ) : (
                    <div className="scroll-hint-anim">
                        <span className="scroll-text">BEGIN TRANSMISSION</span>
                        <div className="chevron"></div>
                        <div className="chevron"></div>
                        <div className="chevron"></div>
                    </div>
                )}
            </div>
        </section>
    );
};

const RadarSection = ({ data }) => {
    return (
        <section className="ld-section section-radar">
            <div className="radar-container">
                <div className="radar-grid"></div>
                <div className="radar-sweep"></div>
                <div className="radar-blip">
                    <div className="blip-ring"></div>
                    <div className="blip-core"></div>
                </div>
                <div className="radar-crosshair top-left"></div>
                <div className="radar-crosshair top-right"></div>
                <div className="radar-crosshair bottom-left"></div>
                <div className="radar-crosshair bottom-right"></div>
            </div>
            <div className="content-center radar-content">
                <h2 className="tech-heading">SIGNAL ACQUIRED</h2>
                <div className="data-readout">
                    <div className="readout-row">
                        <span className="label">TARGET</span>
                        <span className="value">{data.partnerName}</span>
                    </div>
                    <div className="readout-row">
                        <span className="label">STATUS</span>
                        <span className="value active">ONLINE</span>
                    </div>
                    <div className="readout-row">
                        <span className="label">DISTANCE</span>
                        <span className="value">{data.distance ? `${data.distance} km` : 'CALCULATING...'}</span>
                    </div>
                </div>
            </div>
        </section>
    );
};

const MapSection = ({ data }) => {
    return (
        <section className="ld-section section-map">
            <div className="map-background"></div>
            <div className="content-center">
                <div className="connection-line-container">
                    <div className="location-node left">
                        <div className="pin-pulse"></div>
                        <MapPin size={24} className="pin-icon" />
                        <span className="location-name">{data.yourCountry || "Here"}</span>
                    </div>
                    
                    <div className="connection-line">
                        <div className="line-track"></div>
                        <div className="line-packet"></div>
                        <div className="distance-pill">
                            {data.distance || '∞'} km
                        </div>
                    </div>

                    <div className="location-node right">
                        <div className="pin-pulse delay"></div>
                        <MapPin size={24} className="pin-icon red" />
                        <span className="location-name">{data.theirCountry || "There"}</span>
                    </div>
                </div>
                <h2 className="section-title">ACROSS THE VOID</h2>
                <p className="section-subtitle">No distance is too great for two minds connected.</p>
            </div>
        </section>
    );
};

const TimeSection = ({ data }) => {
    const [now, setNow] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    // Robust Timezone Calculation
    const getTimeInZone = (offset) => {
        if (offset === undefined || offset === null) return now;
        // Convert local time to UTC timestamp
        // getTime() is local time in ms. getTimezoneOffset() is diff in minutes (Local - UTC). 
        // Example: UTC-5 (EST) returns 300. 
        // UTC Time = Local Time + (OffsetMinutes * 60000)
        const utcTime = now.getTime() + (now.getTimezoneOffset() * 60000);
        
        // Target Time = UTC + (OffsetHours * 3600000)
        const targetTime = new Date(utcTime + (parseFloat(offset) * 3600000));
        return targetTime;
    };

    const yourTime = getTimeInZone(data?.yourTimezone);
    const theirTime = getTimeInZone(data?.theirTimezone);
    
    // Calculate difference hours
    const diffHours = Math.abs((data?.yourTimezone || 0) - (data?.theirTimezone || 0));

    return (
        <section className="ld-section section-time">
            <div className="time-split">
                <div className="time-card left">
                    <div className="clock-face">
                        <Clock size={40} strokeWidth={1} />
                        <span className="time-label">YOU</span>
                    </div>
                    <div className="digital-display">
                        {yourTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
                    </div>
                    <div className="date-display">
                        {yourTime.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
                    </div>
                </div>
                
                <div className="time-divider">
                    <div className="diff-badge">{diffHours}h DIFF</div>
                </div>

                <div className="time-card right">
                    <div className="clock-face">
                        <Clock size={40} strokeWidth={1} color="#e11d48" />
                        <span className="time-label red">{data.partnerName || 'THEM'}</span>
                    </div>
                    <div className="digital-display red">
                        {theirTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
                    </div>
                    <div className="date-display">
                        {theirTime.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
                    </div>
                </div>
            </div>
        </section>
    );
};

const StringSection = () => {
    const canvasRef = useRef(null);
    
    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        let animationFrameId;
        
        // Physics State
        let width = canvas.offsetWidth;
        let height = canvas.offsetHeight;
        let stringY = height / 2;
        let velY = 0;
        const tension = 0.08;
        const dampening = 0.95;
        let isDragging = false;
        let dragY = 0;
        let mouseX = width / 2;

        const resize = () => {
            width = canvas.parentElement.offsetWidth;
            height = canvas.parentElement.offsetHeight;
            canvas.width = width;
            canvas.height = height;
            stringY = height / 2;
        };
        
        // Initial setup
        resize();
        window.addEventListener('resize', resize);

        const animate = () => {
            ctx.clearRect(0, 0, width, height);
            
            // Physics
            if (!isDragging) {
                const diff = (height / 2) - stringY;
                velY += diff * tension;
                velY *= dampening;
                stringY += velY;
            } else {
                // Elastic pull
                stringY = stringY + (dragY - stringY) * 0.3;
                velY = 0;
            }

            // Draw
            ctx.beginPath();
            ctx.moveTo(0, height / 2);
            
            // Bezier Control Point depends on mouseX if dragging, else center
            const controlX = isDragging ? mouseX : width / 2;
            
            ctx.quadraticCurveTo(controlX, stringY, width, height / 2);
            
            ctx.strokeStyle = '#e11d48';
            ctx.lineWidth = 3;
            ctx.lineCap = 'round';
            // Add glow
            ctx.shadowBlur = 10;
            ctx.shadowColor = 'rgba(225, 29, 72, 0.5)';
            ctx.stroke();
            ctx.shadowBlur = 0;

            // Dots
            ctx.fillStyle = '#1f2937';
            ctx.beginPath(); ctx.arc(0, height/2, 4, 0, Math.PI*2); ctx.fill();
            ctx.beginPath(); ctx.arc(width, height/2, 4, 0, Math.PI*2); ctx.fill();

            animationFrameId = requestAnimationFrame(animate);
        };

        const handleStart = (e) => {
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const rect = canvas.getBoundingClientRect();
            const relY = clientY - rect.top;
            const relX = clientX - rect.left;

            if (Math.abs(relY - height/2) < 100) {
                isDragging = true;
                dragY = relY;
                mouseX = relX;
                if(e.cancelable && e.type === 'touchstart') e.preventDefault();
            }
        };

        const handleMove = (e) => {
            if (!isDragging) return;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const rect = canvas.getBoundingClientRect();
            dragY = clientY - rect.top;
            mouseX = clientX - rect.left;
            if(e.cancelable) e.preventDefault();
        };

        const handleEnd = () => {
            isDragging = false;
            if (navigator.vibrate) navigator.vibrate(20);
        };

        canvas.addEventListener('mousedown', handleStart);
        canvas.addEventListener('touchstart', handleStart, {passive: false});
        window.addEventListener('mousemove', handleMove);
        window.addEventListener('touchmove', handleMove, {passive: false});
        window.addEventListener('mouseup', handleEnd);
        window.addEventListener('touchend', handleEnd);

        animate();

        return () => {
            window.removeEventListener('resize', resize);
            window.removeEventListener('mousemove', handleMove);
            window.removeEventListener('mouseup', handleEnd);
            window.removeEventListener('touchmove', handleMove);
            window.removeEventListener('touchend', handleEnd);
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    return (
        <section className="ld-section section-string">
            <p className="instruction-overlay">PULL THE THREAD</p>
            <div className="canvas-wrapper">
                <canvas ref={canvasRef} />
            </div>
        </section>
    );
};

const TouchSection = () => {
    const [pressing, setPressing] = useState(false);
    const [fill, setFill] = useState(0);
    const requestRef = useRef();

    const animateFill = () => {
        setFill(prev => {
            if (prev >= 100) return 100;
            return prev + 1; // Speed of fill
        });
        requestRef.current = requestAnimationFrame(animateFill);
    };

    const startPress = () => {
        setPressing(true);
        requestRef.current = requestAnimationFrame(animateFill);
    };

    const endPress = () => {
        setPressing(false);
        cancelAnimationFrame(requestRef.current);
        setFill(0);
    };

    useEffect(() => {
        if (fill === 100 && navigator.vibrate) {
            navigator.vibrate([100, 50, 100]);
        }
    }, [fill]);

    return (
        <section className="ld-section section-touch">
            <div className="content-center">
                <h2 className="section-title">VIRTUAL TOUCH</h2>
                
                <div 
                    className={`fingerprint-btn ${pressing ? 'pressing' : ''} ${fill === 100 ? 'complete' : ''}`}
                    onMouseDown={startPress}
                    onMouseUp={endPress}
                    onMouseLeave={endPress}
                    onTouchStart={(e) => { e.preventDefault(); startPress(); }}
                    onTouchEnd={endPress}
                >
                    <svg viewBox="0 0 100 100" className="progress-ring">
                        <circle cx="50" cy="50" r="45" className="bg" />
                        <circle 
                            cx="50" cy="50" r="45" 
                            className="progress" 
                            style={{ strokeDashoffset: 283 - (283 * fill) / 100 }}
                        />
                    </svg>
                    <div className="heart-center">
                        <Heart 
                            size={40} 
                            fill={fill === 100 ? "#e11d48" : (pressing ? "#fecdd3" : "none")} 
                            color="#e11d48" 
                            className={fill === 100 ? 'heart-throb' : ''}
                        />
                    </div>
                </div>

                <p className="section-subtitle">
                    {fill === 100 ? "HEARTBEAT SYNCED" : "Hold to send a touch"}
                </p>
            </div>
        </section>
    );
};

const WeatherSection = () => {
    const [weatherType, setWeatherType] = useState('rain'); // rain, clear, snow

    return (
        <section className={`ld-section section-weather ${weatherType}`}>
            <div className="weather-bg">
                {weatherType === 'rain' && (
                    <div className="rain-container">
                        {[...Array(20)].map((_, i) => <div key={i} className="drop" style={{left: `${Math.random()*100}%`, animationDelay: `${Math.random()*2}s`, animationDuration: `${0.5 + Math.random()}s`}}></div>)}
                    </div>
                )}
                {weatherType === 'clear' && <div className="sun-rays"></div>}
            </div>

            <div className="content-center glass-panel">
                <div className="weather-icon-wrapper">
                    {weatherType === 'rain' && <CloudRain size={48} />}
                    {weatherType === 'clear' && <Sun size={48} />}
                </div>
                <h2>ATMOSPHERIC SYNC</h2>
                <p>No matter the weather where you are...</p>
                <p className="highlight">...we share the same sky.</p>

                <div className="weather-toggles">
                    <button onClick={() => setWeatherType('rain')} className={weatherType === 'rain' ? 'active' : ''}>Rainy</button>
                    <button onClick={() => setWeatherType('clear')} className={weatherType === 'clear' ? 'active' : ''}>Sunny</button>
                </div>
            </div>
        </section>
    );
};

const LetterSection = ({ data }) => {
    const [decrypted, setDecrypted] = useState(false);
    const scrambledText = useScrambleText(data.message || "I miss you more than words can say.", decrypted);

    return (
        <section className="ld-section section-letter">
            <div className="content-center">
                <div className="envelope-icon">
                    <Send size={40} />
                </div>
                <h2 className="section-title">INCOMING MESSAGE</h2>
                
                <div className="letter-paper">
                    <div className="paper-header">
                        <span>FROM: {data.yourName}</span>
                        <span>{new Date().toLocaleDateString()}</span>
                    </div>
                    <div className="paper-body">
                        {decrypted ? (
                            <p className="handwritten">{scrambledText}</p>
                        ) : (
                            <div className="encrypted-block">
                                {Array(3).fill("01010101001010101010110101010101").map((line, i) => (
                                    <p key={i} className="glitch-text">{line}</p>
                                ))}
                            </div>
                        )}
                    </div>
                    <div className="paper-footer">
                        {!decrypted && (
                            <button className="btn-decrypt" onClick={() => setDecrypted(true)}>
                                <Unlock size={14} /> DECRYPT MESSAGE
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
};

const MeetingStatusSection = ({ data }) => {
    const willMeet = data.willMeet;
    
    return (
        <section className={`ld-section section-meeting ${willMeet ? 'positive' : 'longing'}`}>
            <div className="content-center">
                <div className="status-card">
                    <div className="icon-badge">
                        <Heart size={32} fill={willMeet ? "#e11d48" : "#9ca3af"} color="white" />
                    </div>
                    
                    {willMeet ? (
                        <>
                            <h2>WE'LL MEET AGAIN! 💕</h2>
                            <p>Love knows no distance</p>
                            <div className="progress-track">
                                <div className="progress-bar meeting-bar"></div>
                            </div>
                            <p className="caption">Every moment apart brings us closer together</p>
                        </>
                    ) : (
                        <>
                            <h2>LONG DISTANCE 💔</h2>
                            <p>Distance keeps us apart, but not in heart</p>
                            <div className="progress-track">
                                <div className="progress-bar distance-bar"></div>
                            </div>
                            <p className="caption">Love transcends all boundaries</p>
                        </>
                    )}
                </div>
            </div>
        </section>
    );
};

const ConclusionSection = ({ data }) => {
    return (
        <section className="ld-section section-conclusion">
            {data.imageUrl && (
                <div className="bg-image" style={{backgroundImage: `url(${data.imageUrl})`}}></div>
            )}
            <div className="content-center z-top">
                <div className="final-card">
                    <div className="tape-top"></div>
                    <h1 className="cursive-header">Dear {data.partnerName},</h1>
                    <p className="final-message">
                        "Distance means so little when you mean so much. Missing you every day and counting down until we're together again!"
                    </p>
                    <div className="signature-block">
                        <div className="line"></div>
                        <p>Love, {data.yourName}</p>
                    </div>
                    <div className="stamp">
                        <span>AIR MAIL</span>
                    </div>
                </div>
                <div className="footer-tag">
                    DISTANCE IS JUST A NUMBER
                </div>
            </div>
        </section>
    );
};

/* --- UTILITY COMPONENTS --- */

const LoadingScreen = () => (
    <div className="loading-screen">
        <div className="loader"></div>
        <p>SEARCHING FREQUENCIES...</p>
        <GlobalStyles />
        <CardFooter />
    </div>
);


const ErrorScreen = () => (
    <div className="loading-screen error">
        <Radar size={48} />
        <p>SIGNAL LOST</p>
        <span>The coordinates you dialed could not be found.</span>
        <GlobalStyles />
        <CardFooter />
    </div>
);


/* --- CSS STYLES --- */

const GlobalStyles = () => (
    <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600&family=JetBrains+Mono:wght@400;700&family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=Sacramento&display=swap');

        :root {
            --bg-paper: #FDFBF7;
            --bg-off: #F3F4F6;
            --primary: #E11D48; /* Rose Red */
            --primary-soft: #FDA4AF;
            --text-main: #1F2937;
            --text-muted: #6B7280;
            --accent-blue: #3B82F6;
            
            --font-body: 'Inter', sans-serif;
            --font-display: 'Playfair Display', serif;
            --font-mono: 'JetBrains Mono', monospace;
            --font-hand: 'Sacramento', cursive;
        }

        * { box-sizing: border-box; margin: 0; padding: 0; }
        
        body {
            background: var(--bg-paper);
            color: var(--text-main);
            font-family: var(--font-body);
            overflow: hidden; /* App handles scroll */
        }

        .ld-wrapper {
            height: 100vh;
            width: 100vw;
            position: relative;
        }

        .ld-scroller {
            height: 100vh;
            width: 100%;
            overflow-y: scroll;
            scroll-snap-type: y mandatory;
            scroll-behavior: smooth;
        }

        .ld-section {
            height: 100vh;
            width: 100%;
            scroll-snap-align: start;
            position: relative;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 2rem;
            overflow: hidden;
            background: var(--bg-paper);
        }

        /* Utils */
        .content-center {
            z-index: 10;
            text-align: center;
            max-width: 600px;
            width: 100%;
        }
        .section-title {
            font-family: var(--font-mono);
            letter-spacing: 2px;
            font-size: 0.9rem;
            color: var(--text-muted);
            margin-bottom: 1rem;
            text-transform: uppercase;
        }
        .section-subtitle {
            font-family: var(--font-display);
            font-style: italic;
            font-size: 1.2rem;
            color: var(--text-main);
            margin-top: 1rem;
        }

        /* 1. INTRO */
        .section-intro {
            background: #111;
            color: white;
        }
        .noise-overlay {
            position: absolute; inset: 0;
            opacity: 0.05;
            background: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
            pointer-events: none;
        }
        .status-pill {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            border: 1px solid rgba(255,255,255,0.2);
            padding: 8px 16px;
            border-radius: 20px;
            font-family: var(--font-mono);
            font-size: 0.7rem;
            margin-bottom: 2rem;
        }
        .status-dot { width: 8px; height: 8px; border-radius: 50%; background: #ef4444; }
        .status-dot.online { background: #22c55e; box-shadow: 0 0 10px #22c55e; }
        .status-dot.blink { animation: blink 1s infinite; }
        
        .hero-title {
            font-family: var(--font-display);
            font-size: 3rem;
            line-height: 1.1;
        }
        .hero-title .amp { font-family: var(--font-hand); color: var(--primary); font-size: 4rem; font-weight: 400; }
        
        .entry-gate { margin-top: 3rem; }
        .gate-text { font-family: var(--font-mono); font-size: 0.8rem; opacity: 0.6; margin-bottom: 1rem; }
        .btn-enter {
            background: white; color: black; border: none;
            padding: 12px 24px; font-family: var(--font-mono);
            font-weight: bold; cursor: pointer;
            display: inline-flex; align-items: center; gap: 8px;
            transition: transform 0.2s, box-shadow 0.2s;
        }
        .btn-enter:hover { transform: translateY(-2px); box-shadow: 0 5px 15px rgba(255,255,255,0.2); }

        .scroll-hint-anim {
            margin-top: 4rem;
            display: flex; flex-direction: column; align-items: center; gap: 4px;
            opacity: 0.7;
        }
        .scroll-text { font-family: var(--font-mono); font-size: 0.7rem; margin-bottom: 8px; }
        .chevron { width: 10px; height: 10px; border-bottom: 2px solid white; border-right: 2px solid white; transform: rotate(45deg); animation: chevron 1.5s infinite; }
        .chevron:nth-child(2) { animation-delay: 0.1s; }
        .chevron:nth-child(3) { animation-delay: 0.2s; }

        /* 2. RADAR */
        .section-radar { background: #f8fafc; }
        .radar-container {
            width: 260px; height: 260px;
            position: relative; margin-bottom: 2rem;
        }
        .radar-grid {
            width: 100%; height: 100%; border-radius: 50%;
            border: 1px solid rgba(0,0,0,0.1);
            background: radial-gradient(circle, transparent 30%, rgba(0,0,0,0.05) 31%, transparent 32%),
                        radial-gradient(circle, transparent 60%, rgba(0,0,0,0.05) 61%, transparent 62%);
        }
        .radar-sweep {
            position: absolute; top: 0; left: 0; width: 100%; height: 100%;
            border-radius: 50%;
            background: conic-gradient(transparent 270deg, rgba(225, 29, 72, 0.15));
            animation: spin 3s linear infinite;
        }
        .radar-blip {
            position: absolute; top: 25%; right: 25%;
            width: 12px; height: 12px;
        }
        .blip-core { width: 100%; height: 100%; background: var(--primary); border-radius: 50%; }
        .blip-ring {
            position: absolute; top: -50%; left: -50%; width: 200%; height: 200%;
            border: 1px solid var(--primary); border-radius: 50%;
            opacity: 0; animation: ripple 2s infinite;
        }
        .radar-crosshair {
            position: absolute; width: 20px; height: 20px;
            border-color: rgba(0,0,0,0.2); border-style: solid;
        }
        .top-left { top: 0; left: 0; border-width: 1px 0 0 1px; }
        .top-right { top: 0; right: 0; border-width: 1px 1px 0 0; }
        .bottom-left { bottom: 0; left: 0; border-width: 0 0 1px 1px; }
        .bottom-right { bottom: 0; right: 0; border-width: 0 1px 1px 0; }

        .tech-heading { font-family: var(--font-mono); font-size: 1.2rem; letter-spacing: 4px; color: var(--text-main); margin-bottom: 20px; }
        .data-readout {
            font-family: var(--font-mono); font-size: 0.8rem;
            border-top: 1px solid #e5e7eb; padding-top: 15px;
            width: 100%; text-align: left;
        }
        .readout-row { display: flex; justify-content: space-between; margin-bottom: 8px; }
        .readout-row .label { color: var(--text-muted); }
        .readout-row .value { font-weight: bold; }
        .value.active { color: #22c55e; }

        /* 3. MAP */
        .section-map .map-background {
            position: absolute; inset: 0;
            background-image: radial-gradient(#cbd5e1 1.5px, transparent 1.5px);
            background-size: 24px 24px; opacity: 0.4;
        }
        .connection-line-container {
            display: flex; align-items: center; justify-content: space-between;
            gap: 20px; margin-bottom: 2rem; position: relative;
        }
        .location-node { display: flex; flex-direction: column; align-items: center; gap: 8px; position: relative; z-index: 2; }
        .pin-icon { color: var(--text-main); fill: white; }
        .pin-icon.red { color: var(--primary); fill: white; }
        .location-name { font-weight: 600; font-size: 0.9rem; }
        .pin-pulse {
            position: absolute; top: 0; left: 50%; transform: translateX(-50%);
            width: 40px; height: 40px; border-radius: 50%; background: rgba(0,0,0,0.05);
            z-index: -1; animation: pulse 2s infinite;
        }
        .pin-pulse.delay { animation-delay: 1s; background: rgba(225, 29, 72, 0.1); }
        
        .connection-line { flex: 1; height: 2px; position: relative; background: #e5e7eb; }
        .line-packet {
            position: absolute; top: -2px; left: 0; width: 20%; height: 6px;
            background: var(--primary); border-radius: 4px;
            animation: packetMove 2s ease-in-out infinite alternate;
        }
        .distance-pill {
            position: absolute; top: -25px; left: 50%; transform: translateX(-50%);
            background: white; border: 1px solid #e5e7eb; padding: 4px 10px;
            font-size: 0.75rem; font-family: var(--font-mono); border-radius: 12px;
            white-space: nowrap;
        }

        /* 4. TIME */
        .section-time { background: #1f2937; color: white; }
        .time-split { display: flex; flex-direction: column; width: 100%; max-width: 400px; gap: 20px; }
        .time-card {
            background: rgba(255,255,255,0.05); border-radius: 16px; padding: 20px;
            display: flex; flex-direction: column; align-items: center;
        }
        .clock-face { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
        .time-label { font-family: var(--font-mono); letter-spacing: 2px; font-size: 0.8rem; }
        .time-label.red { color: var(--primary); }
        .digital-display { font-size: 2.5rem; font-weight: 300; font-family: var(--font-mono); line-height: 1; }
        .digital-display.red { color: var(--primary); }
        .date-display { opacity: 0.5; margin-top: 5px; font-size: 0.9rem; }
        .time-divider { position: relative; text-align: center; height: 1px; background: rgba(255,255,255,0.1); margin: 10px 0; }
        .diff-badge {
            position: absolute; top: -10px; left: 50%; transform: translateX(-50%);
            background: #1f2937; padding: 0 10px; font-size: 0.8rem; font-family: var(--font-mono); color: var(--text-muted);
        }

        /* 5. STRING */
        .section-string { cursor: grab; background: #ffffff; }
        .section-string:active { cursor: grabbing; }
        .instruction-overlay {
            position: absolute; top: 20%; left: 0; width: 100%; text-align: center;
            font-family: var(--font-mono); color: var(--text-muted); opacity: 0.5; letter-spacing: 2px;
            pointer-events: none;
        }
        .canvas-wrapper { width: 100%; height: 100%; }
        canvas { display: block; width: 100%; height: 100%; }

        /* 6. TOUCH */
        .section-touch { background: #fff0f2; }
        .fingerprint-btn {
            width: 120px; height: 120px; position: relative;
            display: flex; align-items: center; justify-content: center;
            margin: 2rem auto; cursor: pointer;
            transition: transform 0.1s;
        }
        .fingerprint-btn:active { transform: scale(0.95); }
        .progress-ring { width: 100%; height: 100%; transform: rotate(-90deg); }
        .progress-ring circle { fill: transparent; stroke-width: 4; }
        .progress-ring .bg { stroke: #e5e7eb; }
        .progress-ring .progress { stroke: var(--primary); stroke-dasharray: 283; transition: stroke-dashoffset 0.1s linear; }
        .heart-center { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; }
        .heart-throb { animation: throb 0.5s infinite; }
        .pressing .heart-center { transform: scale(1.1); transition: transform 0.2s; }

        /* 7. WEATHER */
        .section-weather { transition: background 0.5s; position: relative; }
        .section-weather.rain { background: #e5e7eb; }
        .section-weather.clear { background: #fef3c7; }
        .weather-bg { position: absolute; inset: 0; pointer-events: none; overflow: hidden; }
        .rain-container .drop {
            position: absolute; top: -20px; width: 1px; height: 40px;
            background: rgba(0,0,0,0.2); animation: rain 1s linear infinite;
        }
        .sun-rays {
            position: absolute; top: -50%; right: -50%; width: 200%; height: 200%;
            background: radial-gradient(circle, transparent 20%, rgba(251, 191, 36, 0.1) 21%, transparent 60%);
            animation: spin 20s linear infinite;
        }
        .glass-panel {
            background: rgba(255,255,255,0.6); backdrop-filter: blur(10px);
            padding: 30px; border-radius: 20px; border: 1px solid rgba(255,255,255,0.4);
            box-shadow: 0 10px 30px rgba(0,0,0,0.05);
        }
        .weather-toggles { margin-top: 20px; display: flex; gap: 10px; justify-content: center; }
        .weather-toggles button {
            border: none; background: transparent; padding: 5px 10px; font-weight: bold;
            color: var(--text-muted); cursor: pointer; border-bottom: 2px solid transparent;
        }
        .weather-toggles button.active { color: var(--text-main); border-color: var(--text-main); }
        .highlight { font-family: var(--font-display); font-size: 1.5rem; color: var(--primary); margin-top: 10px; }

        /* 8. LETTER */
        .letter-paper {
            background: white; border: 1px solid #e5e7eb;
            padding: 30px; width: 100%; max-width: 500px; margin: 0 auto;
            box-shadow: 0 4px 6px rgba(0,0,0,0.02);
            position: relative;
        }
        .paper-header { 
            display: flex; justify-content: space-between; border-bottom: 2px solid #f3f4f6;
            padding-bottom: 10px; margin-bottom: 20px; font-size: 0.7rem; font-family: var(--font-mono); color: var(--text-muted);
        }
        .paper-body { min-height: 150px; text-align: left; }
        .glitch-text { font-family: var(--font-mono); word-break: break-all; opacity: 0.3; font-size: 0.8rem; line-height: 1.5; }
        .handwritten { font-family: var(--font-display); font-size: 1.2rem; line-height: 1.6; color: var(--text-main); }
        .btn-decrypt {
            margin-top: 20px; background: #111; color: white; border: none;
            padding: 10px 20px; font-family: var(--font-mono); cursor: pointer;
            display: flex; align-items: center; justify-content: center; gap: 8px; width: 100%;
        }

        /* 9. MEETING */
        .section-meeting.positive { background: linear-gradient(135deg, #fff0f2, #fff); }
        .section-meeting.longing { background: linear-gradient(135deg, #f3f4f6, #fff); }
        .status-card {
            background: white; padding: 40px; border-radius: 20px;
            box-shadow: 0 10px 25px rgba(0,0,0,0.05); position: relative;
        }
        .icon-badge {
            width: 60px; height: 60px; background: white; border-radius: 50%;
            position: absolute; top: -30px; left: 50%; transform: translateX(-50%);
            display: flex; align-items: center; justify-content: center;
            box-shadow: 0 5px 15px rgba(0,0,0,0.05);
        }
        .progress-track { height: 6px; background: #f3f4f6; border-radius: 3px; margin: 20px 0; overflow: hidden; }
        .progress-bar { height: 100%; border-radius: 3px; }
        .meeting-bar { background: var(--primary); width: 80%; animation: pulseBar 2s infinite; }
        .distance-bar { background: var(--text-muted); width: 40%; }
        .caption { font-size: 0.8rem; color: var(--text-muted); font-style: italic; }

        /* 10. CONCLUSION */
        .section-conclusion { background: var(--bg-paper); position: relative; }
        .bg-image {
            position: absolute; inset: 0; background-size: cover; background-position: center;
            opacity: 0.15; filter: grayscale(100%);
        }
        .final-card {
            background: #fff; padding: 40px; border: 1px solid #e5e7eb;
            transform: rotate(-2deg); max-width: 500px; margin: 0 auto;
            box-shadow: 10px 10px 0 rgba(0,0,0,0.05); position: relative;
        }
        .tape-top {
            position: absolute; top: -15px; left: 50%; transform: translateX(-50%);
            width: 100px; height: 30px; background: rgba(255,255,255,0.6);
            border: 1px solid rgba(0,0,0,0.1); box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        }
        .cursive-header { font-family: var(--font-hand); font-size: 2.5rem; margin-bottom: 20px; text-align: left; }
        .final-message { font-family: var(--font-display); font-size: 1.1rem; line-height: 1.8; text-align: left; }
        .signature-block { margin-top: 40px; text-align: right; }
        .line { width: 50px; height: 1px; background: var(--primary); margin-left: auto; margin-bottom: 10px; }
        .stamp {
            position: absolute; bottom: 20px; left: 20px;
            border: 2px solid var(--primary); color: var(--primary);
            padding: 5px 10px; font-weight: bold; font-family: var(--font-mono);
            transform: rotate(-10deg); opacity: 0.8; font-size: 0.8rem;
        }
        .footer-tag { margin-top: 40px; font-family: var(--font-mono); font-size: 0.7rem; letter-spacing: 2px; opacity: 0.5; }

        /* LOADING & ERROR */
        .loading-screen {
            height: 100vh; display: flex; flex-direction: column;
            align-items: center; justify-content: center; background: var(--bg-paper);
            font-family: var(--font-mono); color: var(--primary);
        }
        .loader { width: 40px; height: 40px; border: 2px solid #e5e7eb; border-top-color: var(--primary); border-radius: 50%; animation: spin 1s linear infinite; margin-bottom: 20px; }
        .loading-screen.error { color: var(--text-muted); }

        /* ANIMATIONS */
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
        @keyframes pulse { 0% { transform: translateX(-50%) scale(1); opacity: 1; } 100% { transform: translateX(-50%) scale(2); opacity: 0; } }
        @keyframes chevron { 0% { opacity: 0; transform: translateY(-5px) rotate(45deg); } 50% { opacity: 1; } 100% { opacity: 0; transform: translateY(5px) rotate(45deg); } }
        @keyframes ripple { 0% { opacity: 1; transform: scale(1); } 100% { opacity: 0; transform: scale(2); } }
        @keyframes packetMove { 0% { left: 0; } 100% { left: 80%; } }
        @keyframes throb { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.2); } }
        @keyframes rain { 0% { transform: translateY(0); } 100% { transform: translateY(100vh); } }
        @keyframes pulseBar { 0%, 100% { opacity: 1; } 50% { opacity: 0.7; } }

        /* MEDIA QUERIES */
        @media (max-width: 768px) {
            .hero-title { font-size: 2rem; }
            .hero-title .amp { font-size: 3rem; }
            .time-split { flex-direction: column; gap: 40px; }
            .readout-row { font-size: 0.7rem; }
            .radar-container { width: 200px; height: 200px; }
            .final-card { transform: rotate(0); padding: 20px; }
            .cursive-header { font-size: 2rem; }
        }
    `}</style>
);

export default LongDistancePage;

