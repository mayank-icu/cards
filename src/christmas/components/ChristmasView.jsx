import React, { useEffect, useRef, useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import CardViewHeader from '../../components/CardViewHeader';
import {
    TreePine as Tree, Star, Mic, Flame, Gift, Snowflake,
    Music, ArrowDown, Wind, RotateCcw, Check, Lock
} from 'lucide-react';
import { normalizeCardData, resolveCardId } from '../../utils/slugs';

/* --- 1. AUDIO ENGINE & UTILS --- */

class AudioEngine {
    constructor() {
        this.ctx = null;
        this.analyser = null;
        this.dataArray = null;
    }

    init() {
        if (!this.ctx) {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        }
    }

    playTone(freq, type = 'sine', duration = 0.5) {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + duration);
    }

    async requestMic() {
        if (!this.ctx) this.init();
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const source = this.ctx.createMediaStreamSource(stream);
            this.analyser = this.ctx.createAnalyser();
            this.analyser.fftSize = 256;
            source.connect(this.analyser);
            this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
            return true;
        } catch (e) {
            console.warn("Mic denied", e);
            return false;
        }
    }

    getVolume() {
        if (!this.analyser) return 0;
        this.analyser.getByteFrequencyData(this.dataArray);
        let sum = 0;
        for (let i = 0; i < this.dataArray.length; i++) sum += this.dataArray[i];
        return sum / this.dataArray.length;
    }
}

const audioEngine = new AudioEngine();

/* --- 2. SUB-COMPONENTS (THE TOYS) --- */

// Section 1: The Door
const SectionCover = ({ onEnter, recipient }) => {
    const handleEnter = () => {
        audioEngine.init();
        audioEngine.playTone(200, 'triangle', 1); // Knock sound
        onEnter();
        // Scroll to next section after a short delay
        setTimeout(() => {
            document.querySelector('.snow-section')?.scrollIntoView({ behavior: 'smooth' });
        }, 500);
    };

    return (
        <section className="snap-section cover-section">
            <div className="cabin-frame">
                <div className="wreath-container" onClick={handleEnter}>
                    <div className="wreath">
                        <div className="bow"></div>
                    </div>
                    <div className="door-plate">
                        <span className="knock-text">Tap to Enter</span>
                    </div>
                </div>
                <h1 className="cover-title">Cozy Cabin</h1>
                <p className="cover-subtitle">A Holiday Card for {recipient || 'You'}</p>
            </div>
            <div className="scroll-hint">
                <ArrowDown size={24} />
            </div>
        </section>
    );
};

// Section 2: Snowfall
const SectionSnow = () => {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        let width = canvas.width = window.innerWidth;
        let height = canvas.height = window.innerHeight;

        const flakes = Array.from({ length: 150 }).map(() => ({
            x: Math.random() * width,
            y: Math.random() * height,
            r: Math.random() * 3 + 1,
            d: Math.random() * 10,
            drift: 0
        }));

        let mouseX = 0;
        const handleMove = (e) => {
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            mouseX = (clientX / width - 0.5) * 2; // -1 to 1
        };

        window.addEventListener('resize', () => {
            width = canvas.width = window.innerWidth;
            height = canvas.height = window.innerHeight;
        });

        // Supports both mouse and touch
        window.addEventListener('mousemove', handleMove);
        window.addEventListener('touchmove', handleMove);

        const animate = () => {
            ctx.clearRect(0, 0, width, height);
            ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
            ctx.beginPath();

            flakes.forEach(f => {
                f.drift += (mouseX - f.drift) * 0.05;
                f.y += Math.cos(f.d) + 1 + f.r / 2;
                f.x += Math.sin(f.d) * 2 + f.drift * 5;

                if (f.y > height) {
                    f.y = -10;
                    f.x = Math.random() * width;
                }
                if (f.x > width) f.x = 0;
                if (f.x < 0) f.x = width;

                ctx.moveTo(f.x, f.y);
                ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2, true);
            });

            ctx.fill();
            requestAnimationFrame(animate);
        };
        animate();

        return () => {
            window.removeEventListener('mousemove', handleMove);
            window.removeEventListener('touchmove', handleMove);
        };
    }, []);

    return (
        <section className="snap-section snow-section">
            <canvas ref={canvasRef} className="snow-canvas" />
            <div className="content-overlay">
                <h2>Let it Snow</h2>
                <p>Tilt your device or move your mouse to guide the wind.</p>
            </div>
        </section>
    );
};

// Section 3: Decorate Tree
const SectionDecorate = () => {
    const [ornaments, setOrnaments] = useState([]);

    const addOrnament = (e) => {
        const rect = e.target.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;

        const x = ((clientX - rect.left) / rect.width) * 100;
        const y = ((clientY - rect.top) / rect.height) * 100;

        audioEngine.playTone(800 + Math.random() * 400, 'sine', 0.2);
        setOrnaments([...ornaments, { x, y, id: Date.now(), color: ['#d4af37', '#c41e3a', '#ffffff'][Math.floor(Math.random() * 3)] }]);
    };

    return (
        <section className="snap-section decorate-section">
            <div className="tree-container" onClick={addOrnament}>
                <Tree size={300} strokeWidth={1} className="bare-tree" />
                {ornaments.map(o => (
                    <div
                        key={o.id}
                        className="ornament"
                        style={{
                            left: `${o.x}%`,
                            top: `${o.y}%`,
                            backgroundColor: o.color
                        }}
                    />
                ))}
            </div>
            <div className="ui-panel">
                <h2>Trim the Tree</h2>
                <p>Tap anywhere on the tree to place an ornament.</p>
                <button className="reset-btn" onClick={(e) => { e.stopPropagation(); setOrnaments([]); }}>
                    <RotateCcw size={16} /> Reset
                </button>
            </div>
        </section>
    );
};

// Section 4: Untangle Lights
const SectionLights = () => {
    const [nodes, setNodes] = useState([false, false, false, false, false]);

    const toggleNode = (idx) => {
        const newNodes = [...nodes];
        newNodes[idx] = !newNodes[idx];
        // Simple mechanic: toggling one might toggle neighbor
        if (idx < newNodes.length - 1) newNodes[idx + 1] = !newNodes[idx + 1];

        setNodes(newNodes);
        audioEngine.playTone(newNodes[idx] ? 600 : 300, 'square', 0.1);
    };

    const isLit = nodes.every(Boolean);

    return (
        <section className={`snap-section lights-section ${isLit ? 'lights-on' : 'lights-off'}`}>
            <div className="wire-container">
                <svg viewBox="0 0 500 200" className="wire-svg">
                    <path d="M0,100 Q125,0 250,100 T500,100" fill="none" stroke="#555" strokeWidth="4" />
                </svg>
                <div className="bulbs-row">
                    {nodes.map((isOn, i) => (
                        <div
                            key={i}
                            onClick={() => toggleNode(i)}
                            className={`light-bulb ${isOn ? 'lit' : ''}`}
                            style={{ animationDelay: `${i * 0.1}s` }}
                        />
                    ))}
                </div>
            </div>
            <div className="content-overlay">
                <h2>{isLit ? "Bright & Merry!" : "Fix the Lights"}</h2>
                <p>{isLit ? "Beautiful job." : "Tap the bulbs to untangle the circuit."}</p>
            </div>
        </section>
    );
};

// Section 5: Caroling (Mic)
const SectionCaroling = () => {
    const [hasMic, setHasMic] = useState(false);
    const [volume, setVolume] = useState(0);
    const [filled, setFilled] = useState(0);

    const startMic = async () => {
        const allowed = await audioEngine.requestMic();
        setHasMic(allowed);
        if (allowed) {
            const loop = () => {
                const vol = audioEngine.getVolume();
                setVolume(vol);
                if (vol > 30) {
                    setFilled(prev => Math.min(prev + 0.5, 100));
                }
                requestAnimationFrame(loop);
            };
            loop();
        }
    };

    return (
        <section className="snap-section carol-section">
            <div className="meter-container">
                <div className="star-top" style={{ opacity: filled >= 100 ? 1 : 0.2 }}>
                    <Star size={64} fill="#FFD700" stroke="none" />
                </div>
                <div className="joy-meter">
                    <div className="joy-fill" style={{ height: `${filled}%` }}></div>
                </div>
            </div>
            <div className="content-overlay">
                <h2>Spread Joy</h2>
                {!hasMic ? (
                    <button className="action-btn" onClick={startMic}>
                        <Mic size={20} /> Enable Mic & Sing!
                    </button>
                ) : (
                    <p>{filled >= 100 ? "The Town is Lit!" : "Sing loud to light the star!"}</p>
                )}
            </div>
        </section>
    );
};

// Section 6: Fireplace
const SectionFire = () => {
    const [intensity, setIntensity] = useState(1);
    const canvasRef = useRef(null);
    const particles = useRef([]);

    const addLog = () => {
        setIntensity(prev => Math.min(prev + 1, 5));
        audioEngine.playTone(100, 'sawtooth', 0.5); // Roar sound
    };

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        let animationId;

        const loop = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Spawn particles based on intensity
            if (particles.current.length < intensity * 50) {
                particles.current.push({
                    x: canvas.width / 2 + (Math.random() - 0.5) * 100,
                    y: canvas.height,
                    size: Math.random() * 20 + 10,
                    speed: Math.random() * 3 + 2,
                    life: 1
                });
            }

            particles.current.forEach((p, i) => {
                p.y -= p.speed;
                p.life -= 0.02;
                p.size *= 0.98;

                if (p.life <= 0) particles.current.splice(i, 1);

                ctx.fillStyle = `rgba(255, ${Math.floor(p.life * 200)}, 0, ${p.life})`;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fill();
            });

            animationId = requestAnimationFrame(loop);
        };
        loop();

        return () => cancelAnimationFrame(animationId);
    }, [intensity]);

    return (
        <section className="snap-section fire-section">
            <canvas ref={canvasRef} width={400} height={500} className="fire-canvas" />
            <div className="log-pile" onClick={addLog}>
                <div className="log">🪵 Throw Log</div>
            </div>
            <div className="content-overlay">
                <h2>Warm the Hearth</h2>
                <p>Tap logs to feed the fire.</p>
            </div>
        </section>
    );
};

// Section 7: Frosty
const SectionSnowman = () => {
    const [parts, setParts] = useState([]);

    const build = () => {
        if (parts.length < 3) {
            setParts([...parts, 'body']);
            audioEngine.playTone(300 + parts.length * 100, 'sine', 0.1);
        } else if (parts.length === 3) {
            setParts([...parts, 'nose']);
            audioEngine.playTone(800, 'triangle', 0.3);
        }
    };

    return (
        <section className="snap-section snowman-section" onClick={build}>
            <div className="snowman-container">
                {parts.length > 3 && <div className="carrot">🥕</div>}
                {parts.length > 2 && <div className="snow-ball head"></div>}
                {parts.length > 1 && <div className="snow-ball mid"></div>}
                {parts.length > 0 && <div className="snow-ball base"></div>}
                {parts.length === 0 && <div className="snow-pile">Tap to build</div>}
            </div>
            <div className="content-overlay">
                <h2>Build a Friend</h2>
                <p>Tap to stack the snow.</p>
            </div>
        </section>
    );
};

// Section 8: Gift Wrap
const SectionGift = ({ wish }) => {
    const canvasRef = useRef(null);
    const [revealed, setRevealed] = useState(false);

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const width = canvas.width = canvas.offsetWidth;
        const height = canvas.height = canvas.offsetHeight;

        // Draw wrapping paper
        ctx.fillStyle = '#c41e3a';
        ctx.fillRect(0, 0, width, height);

        // Pattern
        ctx.fillStyle = '#b01630';
        for (let i = 0; i < width; i += 40) {
            for (let j = 0; j < height; j += 40) {
                if ((i + j) % 80 === 0) ctx.fillRect(i, j, 20, 20);
            }
        }

        const handleScratch = (e) => {
            const rect = canvas.getBoundingClientRect();
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;
            const x = clientX - rect.left;
            const y = clientY - rect.top;

            ctx.globalCompositeOperation = 'destination-out';
            ctx.beginPath();
            ctx.arc(x, y, 40, 0, Math.PI * 2);
            ctx.fill();

            // Check reveal percentage roughly
            if (!revealed && Math.random() > 0.9) setRevealed(true);
        };

        canvas.addEventListener('mousemove', handleScratch);
        canvas.addEventListener('touchmove', handleScratch);

        return () => {
            canvas.removeEventListener('mousemove', handleScratch);
            canvas.removeEventListener('touchmove', handleScratch);
        };
    }, [revealed]);

    return (
        <section className="snap-section gift-section">
            <div className="gift-underlay">
                <h3>A Special Wish</h3>
                <p>"{wish || "May your days be merry and bright!"}"</p>
                <Gift size={48} className="gift-icon-revealed" />
            </div>
            <canvas ref={canvasRef} className="scratch-canvas"></canvas>
            <div className={`content-overlay ${revealed ? 'fade-out' : ''}`}>
                <h2>Unwrap Me</h2>
                <p>Swipe to tear the paper!</p>
            </div>
        </section>
    );
};

// Section 9: Cookies
const SectionCookies = () => {
    const [cookies, setCookies] = useState([1, 2, 3]);
    const [crumbs, setCrumbs] = useState([]);

    const eatCookie = (id, e) => {
        // Remove cookie
        setCookies(prev => prev.filter(c => c !== id));
        audioEngine.playTone(150, 'sawtooth', 0.1); // Crunch

        // Add crumbs with physics
        const rect = e.target.getBoundingClientRect();
        const newCrumbs = Array.from({ length: 10 }).map((_, i) => ({
            id: Date.now() + i,
            x: e.clientX,
            y: e.clientY,
            vx: (Math.random() - 0.5) * 10,
            vy: -5 - Math.random() * 5
        }));
        setCrumbs(prev => [...prev, ...newCrumbs]);
    };

    // Simple physics loop for crumbs
    useEffect(() => {
        if (crumbs.length === 0) return;
        const interval = setInterval(() => {
            setCrumbs(prev => prev.map(c => ({
                ...c,
                x: c.x + c.vx,
                y: c.y + c.vy,
                vy: c.vy + 1 // Gravity
            })).filter(c => c.y < window.innerHeight));
        }, 30);
        return () => clearInterval(interval);
    }, [crumbs]);

    return (
        <section className="snap-section cookie-section">
            <div className="plate">
                {cookies.map(id => (
                    <div
                        key={id}
                        className="cookie"
                        onClick={(e) => eatCookie(id, e)}
                    >
                        🍪
                    </div>
                ))}
                {cookies.length === 0 && <div className="plate-msg">Santa thanks you!</div>}
            </div>
            {crumbs.map(c => (
                <div
                    key={c.id}
                    className="crumb"
                    style={{ left: c.x, top: c.y }}
                />
            ))}
            <div className="content-overlay">
                <h2>Treats for Santa</h2>
                <p>Don't leave any leftovers.</p>
            </div>
        </section>
    );
};

// Section 10: Closing
const SectionClosing = ({ sender }) => {
    return (
        <section className="snap-section closing-section">
            <div className="moon">
                <div className="santa-silhouette">🎅🦌🦌🦌</div>
            </div>
            <div className="closing-message">
                <h1>Merry Christmas</h1>
                <p>From {sender || "A Secret Admirer"}</p>
                <div className="replay-hint">Scroll up to relive the magic</div>
            </div>
        </section>
    );
};

/* --- 3. MAIN COMPONENT --- */

const ChristmasView = () => {
    const { wishId } = useParams();
    const [wishData, setWishData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [started, setStarted] = useState(false);

    useEffect(() => {
        const fetchWishData = async () => {
            try {
                const result = await resolveCardId(wishId, 'wishes', 'christmas');
                if (result) {
                    setWishData(normalizeCardData(result.data));
                } else {
                    throw new Error("Not found");
                }
            } catch (error) {
                console.error("Error fetching wish:", error);
                // Fallback Data for Demo
                setWishData({
                    recipientName: "Family",
                    message: "Wishing you peace, love, and joy this holiday season.",
                    sender: "The Johnsons",
                    holidayWishes: "May your new year be bright!"
                });
            } finally {
                setLoading(false);
            }
        };

        fetchWishData();
    }, [wishId]);

    if (loading) return <div className="loader">Lighting the fireplace...</div>;

    // Helper to get Spotify ID
    const getSpotifyId = (url) => {
        if (!url) return null;
        try {
            const parts = url.split('/');
            return parts[parts.length - 1].split('?')[0];
        } catch (e) { return null; }
    };
    const spotifyId = getSpotifyId(wishData.spotify);

    return (
        <div className="christmas-scrolly-container">
            <style>{cssStyles}</style>

            {/* Nav / Close */}
            <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 100 }}>
               <CardViewHeader cardType="christmas" cardId={wishId} title="" />
            </div>

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

            <SectionCover
                onEnter={() => setStarted(true)}
                recipient={wishData?.recipientName}
            />

            {/* Sections 2-10 render always, user scrolls to them */}
            <SectionSnow />
            <SectionDecorate />
            <SectionLights />
            <SectionCaroling />
            <SectionFire />
            <SectionSnowman />
            <SectionGift wish={wishData?.holidayWishes} />
            <SectionCookies />
            <SectionClosing sender={wishData?.sender} />

            {/* Background Audio Control */}
            {started && (
                <div className="floating-audio-controls">
                    <Music size={16} />
                </div>
            )}
        </div>
    );
};

/* --- 4. CSS STYLES --- */

const cssStyles = `
@import url('https://fonts.googleapis.com/css2?family=Lato:wght@300;400&family=Playfair+Display:ital,wght@0,700;1,400&display=swap');

:root {
    --pine: #0f2e2e;
    --berry: #7a1c1c;
    --gold: #d4af37;
    --cream: #fdf5e6;
    --night: #050a14;
}

* { box-sizing: border-box; }

body, html {
    margin: 0;
    padding: 0;
    overflow: hidden; /* Main scroll handled by container */
    background: var(--pine);
    color: var(--cream);
    font-family: 'Lato', sans-serif;
}

h1, h2, h3 {
    font-family: 'Playfair Display', serif;
    font-weight: 700;
    margin: 0;
}

/* SCROLL CONTAINER */
.christmas-scrolly-container {
    height: 100dvh;
    width: 100vw;
    overflow-y: scroll;
    scroll-snap-type: y mandatory;
    scroll-behavior: smooth;
    position: relative;
}

.snap-section {
    height: 100dvh;
    width: 100%;
    scroll-snap-align: start;
    position: relative;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    text-align: center;
    touch-action: none; /* Prevent scroll hijacking on interactions */
}

.content-overlay {
    position: absolute;
    bottom: 10%;
    width: 100%;
    pointer-events: none;
    z-index: 10;
    text-shadow: 0 2px 4px rgba(0,0,0,0.5);
    opacity: 0.9;
}

.content-overlay p {
    font-size: 0.9rem;
    opacity: 0.8;
}

.action-btn, .reset-btn {
    pointer-events: auto;
    background: var(--berry);
    color: white;
    border: none;
    padding: 10px 20px;
    border-radius: 20px;
    font-family: inherit;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    margin-top: 10px;
}

/* 1. COVER */
.cover-section {
    background: radial-gradient(circle, #1a4a4a 0%, var(--pine) 100%);
}
.cabin-frame {
    border: 2px solid var(--gold);
    padding: 40px;
    border-radius: 8px;
    position: relative;
}
.wreath-container {
    width: 200px;
    height: 200px;
    margin: 0 auto 30px;
    position: relative;
    cursor: pointer;
    transition: transform 0.2s;
}
.wreath-container:active { transform: scale(0.95); }
.wreath {
    width: 100%;
    height: 100%;
    border-radius: 50%;
    border: 25px solid #2d5a27;
    box-shadow: 0 5px 15px rgba(0,0,0,0.5);
    position: relative;
}
.bow {
    position: absolute;
    bottom: -10px;
    left: 50%;
    transform: translateX(-50%);
    width: 40px;
    height: 40px;
    background: var(--berry);
    border-radius: 50%;
}
.knock-text {
    display: block;
    margin-top: 220px;
    text-transform: uppercase;
    letter-spacing: 2px;
    font-size: 0.8rem;
}
.scroll-hint {
    position: absolute;
    bottom: 20px;
    animation: bounce 2s infinite;
}

/* 2. SNOW */
.snow-section { background: linear-gradient(to bottom, #1b3b4a, #8daab8); }
.snow-canvas { position: absolute; top:0; left:0; width:100%; height:100%; }

/* 3. DECORATE */
.decorate-section { background: radial-gradient(circle at center, #2d1b1b, #000); }
.tree-container {
    position: relative;
    height: 60%;
    width: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
}
.bare-tree { color: #3e2723; filter: drop-shadow(0 0 10px rgba(255,255,255,0.1)); }
.ornament {
    position: absolute;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    box-shadow: 0 0 5px currentColor;
    transform: translate(-50%, -50%);
    animation: popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

/* 4. LIGHTS */
.lights-section { transition: background 1s; }
.lights-off { background: #111; }
.lights-on { background: #221a11; }
.wire-container { width: 90%; max-width: 500px; position: relative; height: 150px; }
.wire-svg { width: 100%; height: 100%; position: absolute; top:0; left:0; }
.bulbs-row {
    position: absolute;
    top: 50%;
    left: 0;
    width: 100%;
    display: flex;
    justify-content: space-around;
    transform: translateY(-50%);
}
.light-bulb {
    width: 30px;
    height: 40px;
    background: #333;
    border-radius: 50% 50% 10% 10%;
    cursor: pointer;
    transition: all 0.3s;
}
.light-bulb.lit {
    background: var(--gold);
    box-shadow: 0 0 20px var(--gold), 0 0 40px orange;
}

/* 5. CAROL */
.carol-section { background: #000; }
.meter-container { height: 300px; width: 60px; border: 2px solid #333; position: relative; border-radius: 30px; overflow: hidden; background: #111; }
.star-top { position: absolute; top: 10px; left: 50%; transform: translateX(-50%); transition: opacity 0.5s; z-index: 2; }
.joy-meter { position: absolute; bottom: 0; left: 0; width: 100%; height: 100%; }
.joy-fill { width: 100%; background: linear-gradient(to top, #ff0000, #ffff00); position: absolute; bottom: 0; transition: height 0.1s; }

/* 6. FIRE */
.fire-section { background: #1a0500; }
.fire-canvas { position: absolute; bottom: 0; left: 50%; transform: translateX(-50%); }
.log-pile { position: absolute; bottom: 20%; cursor: pointer; animation: pulse 2s infinite; }
.log { background: #5d4037; padding: 10px 20px; border-radius: 5px; color: #d7ccc8; font-weight: bold; }

/* 7. SNOWMAN */
.snowman-section { background: linear-gradient(to top, #fff, #87ceeb); color: #333; }
.snowman-container { position: relative; height: 300px; display: flex; flex-direction: column; align-items: center; justify-content: flex-end; cursor: pointer; }
.snow-ball { background: white; border-radius: 50%; border: 2px solid #eee; box-shadow: inset -10px -5px 20px rgba(0,0,0,0.1); }
.base { width: 120px; height: 120px; z-index: 1; }
.mid { width: 90px; height: 90px; margin-bottom: -20px; z-index: 2; }
.head { width: 70px; height: 70px; margin-bottom: -15px; z-index: 3; position: relative; }
.carrot { position: absolute; top: 30px; left: 50%; font-size: 2rem; transform: rotate(10deg); z-index: 4; }
.snow-pile { font-size: 1.5rem; color: #888; animation: bounce 1s infinite; }

/* 8. GIFT */
.gift-section { background: #0f2e2e; }
.gift-underlay { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); text-align: center; width: 80%; }
.gift-icon-revealed { margin-top: 20px; color: var(--gold); animation: spin 5s linear infinite; }
.scratch-canvas { position: absolute; top: 0; left: 0; width: 100%; height: 100%; cursor: crosshair; }
.fade-out { opacity: 0; transition: opacity 1s; }

/* 9. COOKIES */
.cookie-section { background: #3e2723; }
.plate { width: 300px; height: 300px; background: white; border-radius: 50%; display: flex; justify-content: center; align-items: center; position: relative; box-shadow: 0 10px 30px rgba(0,0,0,0.5); gap: 20px; }
.cookie { font-size: 4rem; cursor: pointer; transition: transform 0.1s; }
.cookie:active { transform: scale(0.9); }
.plate-msg { color: var(--berry); font-family: 'Playfair Display'; font-size: 1.5rem; }
.crumb { position: fixed; width: 6px; height: 6px; background: #c19a6b; border-radius: 50%; pointer-events: none; }

/* 10. CLOSING */
.closing-section { background: linear-gradient(to top, #050a14, #1a1a2e); }
.moon { width: 100px; height: 100px; background: #fdf5e6; border-radius: 50%; box-shadow: 0 0 50px #fdf5e6; position: absolute; top: 10%; right: 10%; }
.santa-silhouette { font-size: 2rem; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); }
.closing-message { z-index: 2; }
.replay-hint { margin-top: 2rem; font-size: 0.8rem; opacity: 0.5; text-transform: uppercase; letter-spacing: 2px; }

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
.spotify-icon { color: var(--gold); transition: opacity 0.3s; }
.spotify-float:hover .spotify-icon { opacity: 0; display: none; }
.spotify-float iframe { opacity: 0; transition: opacity 0.5s ease 0.2s; width: 100%; height: 100%; }
.spotify-float:hover iframe { opacity: 1; }

/* ANIMATIONS */
@keyframes bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
@keyframes popIn { 0% { transform: translate(-50%, -50%) scale(0); } 80% { transform: translate(-50%, -50%) scale(1.2); } 100% { transform: translate(-50%, -50%) scale(1); } }
@keyframes pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.05); } }
@keyframes spin { 100% { transform: rotate(360deg); } }

`;
export default ChristmasView;