import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import {
    doc,
    onSnapshot,
    query,
    collection,
    addDoc,
    orderBy,
    deleteDoc
} from 'firebase/firestore';
import { db } from '../../firebase';
import { normalizeCardData, resolveCardId } from '../../utils/slugs';
import {
    MapPin,
    Clock,
    Check,
    X,
    PartyPopper,
    Frown,
    ChevronDown,
    Music,
    Star,
    Key,
    Play,
    Pause,
    Users
} from 'lucide-react';

const GatsbyInvite = () => {
    // Determine ID: try to use router params, otherwise fallback to a demo ID for preview
    const params = useParams();
    // If running in a standalone preview without router, we might need a fallback ID to show design
    const id = params.id || "demo-gatsby-id";

    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [rsvpName, setRsvpName] = useState('');
    const [rsvpStatus, setRsvpStatus] = useState(null);
    const [dressCode, setDressCode] = useState('formal');
    const [gateOpen, setGateOpen] = useState(false); // Changed from rope to gate
    const [realId, setRealId] = useState(null);

    const [rsvps, setRsvps] = useState([]);
    const [isPlaying, setIsPlaying] = useState(false);

    const canvasRef = useRef(null);
    const venueRef = useRef(null);
    const songRef = useRef(null);

    // --- Data Fetching ---
    useEffect(() => {
        // Only fetch if we have an ID
        if (!id) return;

        let unsubscribeSnapshot = () => { };

        const fetchData = async () => {
            try {
                // 1. Resolve ID (Slug -> DocID)
                const result = await resolveCardId(id, 'invites', 'invite');

                if (result && result.id) {
                    setRealId(result.id);
                    const inviteDocRef = doc(db, 'invites', result.id);

                    // 2. Listen to Real Data
                    unsubscribeSnapshot = onSnapshot(inviteDocRef, (snapshot) => {
                        if (snapshot.exists()) {
                            setData(normalizeCardData(snapshot.data()));
                        } else {
                            // FALLBACK DATA FOR PREVIEW DESIGN (Only if doc doesn't exist)
                            // This ensures the user sees the design in the editor even without a DB entry
                            console.log("Document not found, using fallback for design preview.");
                            setData({
                                eventName: "The Great Gala",
                                hostName: "Jay Gatsby",
                                date: new Date(Date.now() + 86400000 * 30).toISOString(), // 30 days from now
                                time: "19:00",
                                venue: "West Egg Mansion",
                                location: "Long Island Sound, NY",
                                song: "Rhapsody in Blue",
                                password: "GATSBY"
                            });
                        }
                        setLoading(false);
                    }, (err) => {
                        console.error("Firestore Error:", err);
                        setLoading(false);
                    });

                    // 3. Listen to RSVPs
                    const rsvpQuery = query(collection(db, 'invites', result.id, 'rsvps'), orderBy('timestamp', 'desc'));
                    onSnapshot(rsvpQuery, (snapshot) => {
                        const rsvpList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                        setRsvps(rsvpList);
                    });
                } else {
                    setLoading(false);
                }
            } catch (error) {
                console.error("Resolution Error:", error);
                setLoading(false);
            }
        };

        fetchData();

        return () => unsubscribeSnapshot();
    }, [id]);

    // --- Canvas Particle Effect (Updated for Light Theme) ---
    useEffect(() => {
        if (!data?.eventName || loading || !canvasRef.current) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        let animationFrameId;
        let particles = [];

        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        window.addEventListener('resize', resize);
        resize();

        class Particle {
            constructor(x, y) {
                this.x = Math.random() * canvas.width;
                this.y = Math.random() * canvas.height;
                this.destX = x;
                this.destY = y;
                this.vx = (Math.random() - 0.5) * 2;
                this.vy = (Math.random() - 0.5) * 2;
                this.accX = 0;
                this.accY = 0;
                this.friction = Math.random() * 0.05 + 0.92;
                // Colors: Gold and Deep Charcoal for Light Mode
                this.color = Math.random() > 0.6 ? '#C5A059' : '#1a1a1a';
            }

            update() {
                this.accX = (this.destX - this.x) / 400; // Slower, more elegant
                this.accY = (this.destY - this.y) / 400;
                this.vx += this.accX;
                this.vy += this.accY;
                this.vx *= this.friction;
                this.vy *= this.friction;
                this.x += this.vx;
                this.y += this.vy;

                ctx.fillStyle = this.color;
                ctx.beginPath();
                ctx.arc(this.x, this.y, Math.random() * 2, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        const init = () => {
            particles = [];
            const txtCanvas = document.createElement('canvas');
            const txtCtx = txtCanvas.getContext('2d');
            txtCanvas.width = canvas.width;
            txtCanvas.height = canvas.height;

            let fontSize = Math.min(canvas.width / 6, 120);
            txtCtx.font = `700 ${fontSize}px "Playfair Display", serif`;
            txtCtx.fillStyle = 'white'; // Color doesn't matter for scanning
            txtCtx.textAlign = 'center';
            txtCtx.textBaseline = 'middle';
            txtCtx.fillText(data.eventName, canvas.width / 2, canvas.height / 2);

            const pixelData = txtCtx.getImageData(0, 0, canvas.width, canvas.height).data;

            // Reduce density for performance but keep elegance
            for (let y = 0; y < canvas.height; y += 5) {
                for (let x = 0; x < canvas.width; x += 5) {
                    if (pixelData[(y * canvas.width + x) * 4 + 3] > 128) {
                        particles.push(new Particle(x, y));
                    }
                }
            }
        };

        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            particles.forEach(p => p.update());
            animationFrameId = requestAnimationFrame(animate);
        };

        setTimeout(() => { init(); animate(); }, 500);

        return () => {
            window.removeEventListener('resize', resize);
            cancelAnimationFrame(animationFrameId);
        };
    }, [data, loading]);

    // --- 3D Tilt Effect for Venue Card ---
    const handleMouseMove = (e) => {
        if (!venueRef.current) return;
        const card = venueRef.current;
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        const rotateX = ((y - centerY) / centerY) * -10; // Max 10deg rotation
        const rotateY = ((x - centerX) / centerX) * 10;

        card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
    };

    const handleMouseLeave = () => {
        if (venueRef.current) {
            venueRef.current.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg)`;
        }
    };


    // --- RSVP Logic ---
    const handleRSVP = async (status) => {
        if (!rsvpName.trim()) {
            return;
        }
        if (!realId) return;

        try {
            // Check if already RSVPed in this session or by name (simple check)
            const existing = rsvps.find(r => r.name.toLowerCase() === rsvpName.trim().toLowerCase());

            if (existing) {
                // Update or just set local state
                setRsvpStatus(status);
                // In a real app we would update the doc
                return;
            }

            await addDoc(collection(db, 'invites', realId, 'rsvps'), {
                name: rsvpName,
                status,
                timestamp: Date.now()
            });
            setRsvpStatus(status);
        } catch (error) {
            console.error("Error sending RSVP:", error);
        }
    };

    const handleCancelRSVP = async () => {
        if (!realId || !rsvpName) return;
        // Find the rsvp doc to delete
        const existing = rsvps.find(r => r.name.toLowerCase() === rsvpName.trim().toLowerCase());
        if (existing) {
            try {
                await deleteDoc(doc(db, 'invites', realId, 'rsvps', existing.id));
                setRsvpStatus(null);
            } catch (e) {
                console.error("Error cancelling RSVP", e);
            }
        } else {
            setRsvpStatus(null);
        }
    };

    const toggleAudio = () => {
        if (songRef.current) {
            if (isPlaying) {
                songRef.current.pause();
            } else {
                songRef.current.play();
            }
            setIsPlaying(!isPlaying);
        }
    };

    // --- Scroll Observer for Animations ---
    useEffect(() => {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('in-view');
                }
            });
        }, { threshold: 0.3 });

        document.querySelectorAll('.animate-on-scroll').forEach((el) => observer.observe(el));
        return () => observer.disconnect();
    }, [loading, gateOpen]);


    if (loading) return (
        <div className="loader-container">
            <div className="art-deco-loader"></div>
            <p style={{ fontFamily: 'Playfair Display', letterSpacing: '2px', color: '#C5A059' }}>Polishing the Silverware...</p>
        </div>
    );

    if (!data) return <div className="error-msg">Invitation misplaced.</div>;

    const eventDate = new Date(data.date);

    return (
        <div className="main-wrapper">
                {/* --- CUSTOM CSS INJECTION --- */}
                <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600&family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&display=swap');

                :root {
                    --bg-paper: #F5F5F0;
                    --text-dark: #1A1A1A;
                    --gold: #C5A059;
                    --gold-dark: #9A7B3E;
                    --gold-light: #E5C57F;
                    --white: #FFFFFF;
                }

                * { box-sizing: border-box; margin: 0; padding: 0; }

                body, html {
                    background-color: var(--bg-paper);
                    color: var(--text-dark);
                    font-family: 'Montserrat', sans-serif;
                    overflow: hidden; 
                    height: 100%;
                    width: 100%;
                }

                /* Noise Texture for Expensive Paper Feel */
                .main-wrapper::before {
                    content: "";
                    position: fixed;
                    top: 0; left: 0; width: 100%; height: 100%;
                    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.05'/%3E%3C/svg%3E");
                    pointer-events: none;
                    z-index: 9999;
                    opacity: 0.4;
                }

                /* --- SCROLL SNAP LAYOUT --- */
                .scrolly-container {
                    height: 100dvh;
                    width: 100%;
                    overflow-y: scroll;
                    scroll-snap-type: y mandatory;
                    scroll-behavior: smooth;
                    position: relative;
                }

                section {
                    height: 100dvh;
                    width: 100%;
                    scroll-snap-align: start;
                    position: relative;
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    align-items: center;
                    padding: 2rem;
                    border-bottom: 1px solid rgba(197, 160, 89, 0.2);
                    overflow: hidden;
                    background: var(--bg-paper);
                }

                /* --- TYPOGRAPHY --- */
                h1, h2, h3 {
                    font-family: 'Playfair Display', serif;
                    color: var(--text-dark);
                    text-transform: uppercase;
                    text-align: center;
                }

                h1 { font-size: 3.5rem; letter-spacing: 0.15em; margin-bottom: 1rem; color: var(--gold-dark); }
                h2 { font-size: 2rem; letter-spacing: 0.25em; margin-bottom: 1.5rem; color: var(--gold); }
                p { line-height: 1.8; max-width: 600px; text-align: center; color: #444; font-weight: 400; }

                /* --- ANIMATIONS --- */
                .animate-on-scroll {
                    opacity: 0;
                    transform: translateY(30px);
                    transition: all 1s cubic-bezier(0.16, 1, 0.3, 1);
                }
                .animate-on-scroll.in-view {
                    opacity: 1;
                    transform: translateY(0);
                }

                /* --- SECTION 1: THE GATE (Updated Entrance) --- */
                .gate-wrapper {
                    position: absolute;
                    inset: 0;
                    z-index: 50;
                    display: flex;
                    pointer-events: none; /* Let clicks pass to container */
                }
                .gate-panel {
                    width: 50%;
                    height: 100%;
                    background: linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%);
                    position: relative;
                    transition: transform 1.5s cubic-bezier(0.7, 0, 0.3, 1);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-right: 2px solid var(--gold);
                }
                .gate-panel.left { transform-origin: left; border-right: 1px solid var(--gold); }
                .gate-panel.right { transform-origin: right; border-left: 1px solid var(--gold); }
                
                /* Art Deco Pattern on Gate */
                .gate-pattern {
                    width: 80%;
                    height: 80%;
                    border: 2px solid var(--gold);
                    display: flex;
                    flex-direction: column;
                    justify-content: space-between;
                    padding: 20px;
                }
                .gate-bar {
                    height: 1px;
                    background: var(--gold);
                    width: 100%;
                    margin: 10px 0;
                }

                .gate-open .gate-panel.left { transform: translateX(-100%); }
                .gate-open .gate-panel.right { transform: translateX(100%); }
                
                .enter-button {
                    position: absolute;
                    z-index: 60;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    padding: 1.5rem 3rem;
                    background: transparent;
                    border: 2px solid var(--gold);
                    color: var(--gold);
                    font-family: 'Playfair Display', serif;
                    font-size: 1.2rem;
                    letter-spacing: 4px;
                    text-transform: uppercase;
                    cursor: pointer;
                    transition: all 0.4s ease;
                    pointer-events: auto;
                    background: rgba(0,0,0,0.8);
                }
                .enter-button:hover {
                    background: var(--gold);
                    color: #000;
                    box-shadow: 0 0 30px rgba(197, 160, 89, 0.4);
                }
                .gate-open .enter-button {
                    opacity: 0;
                    pointer-events: none;
                }

                /* --- SECTION 2: REVEAL --- */
                canvas.particle-canvas {
                    position: absolute;
                    top: 0; left: 0;
                    width: 100%; height: 100%;
                    pointer-events: none;
                    mix-blend-mode: multiply; /* Better for light theme */
                }

                /* --- SECTION 3: DATE (Parallax) --- */
                .date-container {
                    border: 4px double var(--gold);
                    padding: 4rem;
                    position: relative;
                    background: #fff;
                    box-shadow: 0 20px 50px rgba(0,0,0,0.05);
                }
                .big-date {
                    font-size: 8rem;
                    font-weight: 700;
                    color: var(--text-dark);
                    line-height: 0.9;
                    position: relative;
                }
                .big-date span {
                    display: block;
                    font-size: 2rem;
                    color: var(--gold);
                    font-style: italic;
                    margin-bottom: -10px;
                }

                /* --- SECTION 4: VENUE (3D Card) --- */
                .venue-card-scene {
                    perspective: 1000px;
                    width: 100%;
                    max-width: 500px;
                    height: 400px;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                }
                .venue-card {
                    width: 100%;
                    height: 100%;
                    background: #fff;
                    border: 1px solid var(--gold);
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    align-items: center;
                    box-shadow: 0 15px 35px rgba(0,0,0,0.1);
                    transition: transform 0.1s ease-out; /* Fast for mouse movement */
                    padding: 2rem;
                    position: relative;
                }
                .venue-card::after {
                    content: '';
                    position: absolute;
                    inset: 10px;
                    border: 1px solid rgba(197, 160, 89, 0.3);
                }

                /* --- SECTION 5: DRESS CODE --- */
                .dress-toggle-container {
                    display: flex;
                    background: #fff;
                    border: 1px solid var(--gold);
                    border-radius: 50px;
                    padding: 5px;
                    margin-top: 2rem;
                    box-shadow: inset 0 2px 5px rgba(0,0,0,0.05);
                }
                .toggle-btn {
                    padding: 1rem 2.5rem;
                    border-radius: 40px;
                    border: none;
                    background: transparent;
                    font-family: 'Montserrat', sans-serif;
                    cursor: pointer;
                    transition: all 0.4s ease;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    opacity: 0.5;
                }
                .toggle-btn.active {
                    background: var(--text-dark);
                    color: var(--gold);
                    opacity: 1;
                    box-shadow: 0 5px 15px rgba(0,0,0,0.2);
                }

                /* --- SECTION 7: SCHEDULE (Timeline) --- */
                .timeline {
                    position: relative;
                    padding-left: 3rem;
                    border-left: 2px solid rgba(197, 160, 89, 0.3);
                }
                .timeline-item {
                    margin-bottom: 3rem;
                    position: relative;
                }
                .timeline-dot {
                    position: absolute;
                    left: -3.65rem;
                    top: 5px;
                    width: 20px;
                    height: 20px;
                    background: var(--bg-paper);
                    border: 2px solid var(--gold);
                    border-radius: 50%;
                    transition: background 0.3s ease;
                }
                .timeline-item:hover .timeline-dot {
                    background: var(--gold);
                }
                .time-label {
                    font-family: 'Playfair Display', serif;
                    font-weight: 700;
                    font-size: 1.5rem;
                    color: var(--gold-dark);
                }

                /* --- SECTION 8: TICKET --- */
                .ticket-visual {
                    background: #fff;
                    color: var(--text-dark);
                    width: 320px;
                    padding: 2rem;
                    position: relative;
                    /* Sawtooth edges logic with CSS gradients */
                    background-image: radial-gradient(circle at 0px 10px, transparent 6px, #fff 7px);
                    background-size: 100% 20px;
                    background-position: -10px 0;
                    filter: drop-shadow(0 10px 20px rgba(0,0,0,0.1));
                    border: 1px solid rgba(0,0,0,0.05);
                }
                .ticket-strip {
                    border-left: 2px dashed #ccc;
                    height: 100%;
                    position: absolute;
                    right: 3rem;
                    top: 0;
                }

                /* --- SECTION 9: RSVP --- */
                .rsvp-card {
                    background: #fff;
                    padding: 3rem;
                    border: 1px solid var(--gold);
                    box-shadow: 20px 20px 0px rgba(197, 160, 89, 0.1);
                    width: 100%;
                    max-width: 500px;
                }
                .fancy-input {
                    width: 100%;
                    border: none;
                    border-bottom: 2px solid #ddd;
                    padding: 1rem 0;
                    font-family: 'Playfair Display', serif;
                    font-size: 1.5rem;
                    background: transparent;
                    text-align: center;
                    margin-bottom: 2rem;
                    transition: border-color 0.3s;
                }
                .fancy-input:focus {
                    outline: none;
                    border-bottom-color: var(--gold);
                }
                .rsvp-actions {
                    display: flex;
                    gap: 1rem;
                }
                .btn-action {
                    flex: 1;
                    padding: 1rem;
                    border: 1px solid var(--gold);
                    background: transparent;
                    color: var(--gold-dark);
                    font-family: 'Montserrat', sans-serif;
                    text-transform: uppercase;
                    letter-spacing: 2px;
                    cursor: pointer;
                    transition: 0.3s;
                }
                .btn-action:hover {
                    background: var(--gold);
                    color: #fff;
                }

                /* --- SECTION 10: PASSWORD --- */
                .secret-code {
                    font-size: 4rem;
                    letter-spacing: 1rem;
                    color: var(--text-dark);
                    filter: blur(8px);
                    transition: filter 0.5s ease;
                    cursor: crosshair;
                }
                .secret-code:hover {
                    filter: blur(0px);
                }

                /* --- UTILITIES --- */
                .scroll-hint {
                    position: absolute;
                    bottom: 30px;
                    animation: float 2s infinite ease-in-out;
                    color: var(--gold);
                    opacity: 0.8;
                }
                @keyframes float { 0%, 100% {transform: translateY(0);} 50% {transform: translateY(10px);} }

                .loader-container {
                    height: 100vh;
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    align-items: center;
                    background: var(--bg-paper);
                }
                .art-deco-loader {
                    width: 60px;
                    height: 60px;
                    border: 4px solid var(--gold);
                    border-top-color: transparent;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                    margin-bottom: 20px;
                }
                @keyframes spin { 100% { transform: rotate(360deg); } }

                @media (max-width: 768px) {
                    h1 { font-size: 2.5rem; }
                    .big-date { font-size: 5rem; }
                    .gate-panel { width: 50%; } /* Keep them split */
                    .rsvp-card { padding: 1.5rem; }
                    .rsvp-actions { flex-direction: column; }
                }
                
                .rsvp-list {
                    margin-top: 2rem;
                    text-align: left;
                    max-height: 150px;
                    overflow-y: auto;
                    border-top: 1px solid #eee;
                    padding-top: 1rem;
                }
                .rsvp-item {
                    display: flex;
                    justify-content: space-between;
                    padding: 0.5rem 0;
                    border-bottom: 1px solid #f9f9f9;
                    font-size: 0.9rem;
                }
                
                /* Floating Music Player */
                .floating-music-player {
                    position: fixed;
                    bottom: 20px;
                    right: 20px;
                    z-index: 1000;
                    background: rgba(255, 255, 255, 0.9);
                    backdrop-filter: blur(10px);
                    padding: 10px;
                    border-radius: 50px;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.1);
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    border: 1px solid var(--gold);
                    animation: slideInRight 0.5s ease-out;
                }
                .music-disc {
                    width: 40px;
                    height: 40px;
                    border-radius: 50%;
                    background: #111;
                    overflow: hidden;
                    animation: spin 4s linear infinite;
                    border: 2px solid var(--gold);
                }
                .music-disc img { width: 100%; height: 100%; object-fit: cover; }
                .music-info-mini {
                    max-width: 120px;
                    overflow: hidden;
                    white-space: nowrap;
                    font-size: 0.8rem;
                    color: var(--text-dark);
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
                    color: var(--gold-dark);
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                @keyframes slideInRight { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
            `}</style>

                <div className="scrolly-container">

                    {/* --- SECTION 1: THE GATE (Entrance) --- */}
                    <section id="entrance">
                        <div className={`gate-wrapper ${gateOpen ? 'gate-open' : ''}`}>
                            <div className="gate-panel left">
                                <div className="gate-pattern">
                                    {[...Array(10)].map((_, i) => <div key={i} className="gate-bar"></div>)}
                                </div>
                            </div>
                            <div className="gate-panel right">
                                <div className="gate-pattern">
                                    {[...Array(10)].map((_, i) => <div key={i} className="gate-bar"></div>)}
                                </div>
                            </div>
                            <button
                                className="enter-button"
                                onClick={() => {
                                    setGateOpen(true);
                                    setTimeout(() => {
                                        document.getElementById('reveal').scrollIntoView({ behavior: 'smooth' });
                                    }, 1200);
                                }}
                            >
                                Enter
                            </button>
                        </div>
                    </section>

                    {/* --- SECTION 2: THE REVEAL --- */}
                    <section id="reveal">
                        <canvas ref={canvasRef} className="particle-canvas" />
                        <div className="animate-on-scroll" style={{ position: 'relative', zIndex: 10 }}>
                            <p style={{ letterSpacing: '3px', textTransform: 'uppercase', marginBottom: '1rem', color: '#888' }}>You are cordially invited</p>
                        </div>
                        <ChevronDown className="scroll-hint" />
                    </section>

                    {/* --- SECTION 3: THE DATE --- */}
                    <section>
                        <div className="date-container animate-on-scroll">
                            <div className="big-date">
                                <span>{eventDate.toLocaleString('default', { month: 'long' })}</span>
                                {eventDate.getDate()}
                            </div>
                            <div style={{ marginTop: '1rem', borderTop: '1px solid var(--gold)', paddingTop: '1rem', display: 'flex', justifyContent: 'space-between', color: '#666' }}>
                                <span>{eventDate.getFullYear()}</span>
                                <span>{data.time}</span>
                            </div>
                        </div>
                        <p className="animate-on-scroll" style={{ marginTop: '2rem' }}>Save The Date</p>
                    </section>

                    {/* --- SECTION 4: THE VENUE --- */}
                    <section>
                        <div className="animate-on-scroll" style={{ textAlign: 'center', marginBottom: '2rem' }}>
                            <MapPin size={32} color="#C5A059" style={{ marginBottom: '10px' }} />
                            <h2>The Location</h2>
                        </div>

                        <div className="venue-card-scene animate-on-scroll">
                            <div
                                className="venue-card"
                                ref={venueRef}
                                onMouseMove={handleMouseMove}
                                onMouseLeave={handleMouseLeave}
                            >
                                <h3 style={{ fontSize: '2rem', margin: '20px 0', fontFamily: 'Playfair Display' }}>{data.venue || data.location}</h3>
                                <div style={{ width: '50px', height: '2px', background: 'var(--gold)', margin: '20px 0' }}></div>
                                <p>A night of elegance awaits in the heart of the city.</p>
                                <div style={{ marginTop: 'auto', fontSize: '0.8rem', color: '#999', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                    Valet Parking Available
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* --- SECTION 5: DRESS CODE --- */}
                    <section>
                        <div className="animate-on-scroll">
                            <h2>Attire</h2>
                            <p>Dress to impress. The night demands your finest.</p>

                            <div className="dress-toggle-container">
                                <button
                                    className={`toggle-btn ${dressCode === 'casual' ? 'active' : ''}`}
                                    onClick={() => setDressCode('casual')}
                                >
                                    <X size={18} /> Casual
                                </button>
                                <button
                                    className={`toggle-btn ${dressCode === 'formal' ? 'active' : ''}`}
                                    onClick={() => setDressCode('formal')}
                                >
                                    <Check size={18} /> Black Tie
                                </button>
                            </div>

                            <div style={{
                                marginTop: '3rem',
                                fontSize: '1.2rem',
                                fontFamily: 'Playfair Display',
                                color: dressCode === 'formal' ? '#4ade80' : '#ef4444',
                                minHeight: '2rem',
                                transition: 'color 0.3s'
                            }}>
                                {dressCode === 'formal' ? 'Exquisite Choice.' : 'Strictly Prohibited.'}
                            </div>
                        </div>
                    </section>

                    {/* --- SECTION 7: SCHEDULE (Replaced Menu) --- */}
                    <section>
                        <div className="animate-on-scroll" style={{ width: '100%', maxWidth: '500px' }}>
                            <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
                                <Clock size={32} color="#C5A059" />
                                <h2 style={{ marginTop: '1rem' }}>The Evening</h2>
                            </div>

                            <div className="timeline">
                                <div className="timeline-item">
                                    <div className="timeline-dot"></div>
                                    <div className="time-label">{data.time}</div>
                                    <p style={{ textAlign: 'left', margin: 0 }}>Doors Open & Cocktails</p>
                                </div>
                                <div className="timeline-item">
                                    <div className="timeline-dot"></div>
                                    <div className="time-label">1 Hour Later</div>
                                    <p style={{ textAlign: 'left', margin: 0 }}>Dinner Service</p>
                                </div>
                                <div className="timeline-item">
                                    <div className="timeline-dot"></div>
                                    <div className="time-label">Midnight</div>
                                    <p style={{ textAlign: 'left', margin: 0 }}>Champagne Toast & Dancing</p>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* --- SECTION 8: TICKET --- */}
                    <section>
                        <div className="animate-on-scroll ticket-visual">
                            <div style={{ borderBottom: '1px solid #eee', paddingBottom: '1rem', marginBottom: '1rem' }}>
                                <p style={{ fontSize: '0.7rem', letterSpacing: '2px', color: '#999' }}>ADMIT ONE</p>
                                <h3 style={{ fontSize: '1.8rem', marginTop: '0.5rem' }}>{data.eventName}</h3>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div>
                                    <p style={{ fontSize: '0.6rem', color: '#999' }}>DATE</p>
                                    <p style={{ fontWeight: '600' }}>{eventDate.toLocaleDateString()}</p>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <p style={{ fontSize: '0.6rem', color: '#999' }}>TIME</p>
                                    <p style={{ fontWeight: '600' }}>{data.time}</p>
                                </div>
                            </div>
                            <div style={{ marginTop: '2rem', textAlign: 'center' }}>
                                <div style={{ height: '30px', background: `repeating-linear-gradient(90deg, #333, #333 1px, #fff 1px, #fff 3px)` }}></div>
                                <p style={{ fontSize: '0.6rem', marginTop: '5px' }}>{realId || '000-000-000'}</p>
                            </div>
                        </div>
                    </section>

                    {/* --- SECTION 9: RSVP --- */}
                    <section>
                        <div className="animate-on-scroll rsvp-card">
                            <h2 style={{ marginBottom: '2rem' }}>R.S.V.P.</h2>

                            {rsvpStatus === 'Attending' ? (
                                <div style={{ textAlign: 'center', animation: 'fadeIn 0.5s' }}>
                                    <PartyPopper size={48} color="#C5A059" style={{ margin: '0 auto' }} />
                                    <h3 style={{ marginTop: '1rem', fontSize: '1.5rem' }}>Delightful!</h3>
                                    <p>Your attendance is confirmed.</p>
                                    <button
                                        onClick={handleCancelRSVP}
                                        style={{
                                            marginTop: '1rem',
                                            background: 'transparent',
                                            border: 'none',
                                            color: '#999',
                                            textDecoration: 'underline',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        Cancel RSVP
                                    </button>
                                </div>
                            ) : (
                                <div>
                                    <input
                                        type="text"
                                        className="fancy-input"
                                        placeholder="Your Name, Esq."
                                        value={rsvpName}
                                        onChange={(e) => setRsvpName(e.target.value)}
                                    />
                                    <div className="rsvp-actions">
                                        <button className="btn-action" onClick={() => handleRSVP('Attending')}>Accept Invitation</button>
                                    </div>
                                </div>
                            )}

                            {rsvps.length > 0 && (
                                <div className="rsvp-list">
                                    <h4 style={{ fontSize: '0.9rem', textTransform: 'uppercase', color: '#999', marginBottom: '10px' }}>
                                        <Users size={14} style={{ display: 'inline', marginRight: '5px' }} /> Guest List
                                    </h4>
                                    {rsvps.map(rsvp => (
                                        <div key={rsvp.id} className="rsvp-item">
                                            <span>{rsvp.name}</span>
                                            <span style={{ color: rsvp.status === 'Attending' ? 'var(--gold)' : '#999' }}>
                                                {rsvp.status}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <p style={{ fontSize: '0.8rem', marginTop: '2rem', color: '#999' }}>Kindly respond by {new Date(eventDate.getTime() - 7 * 24 * 60 * 60 * 1000).toLocaleDateString()}</p>
                        </div>
                    </section>

                    {/* --- SECTION 10: SECRET CODE --- */}
                    <section style={{ background: '#111', color: '#fff' }}>
                        <div className="animate-on-scroll">
                            <Key size={32} color="#C5A059" style={{ marginBottom: '1rem' }} />
                            <p style={{ letterSpacing: '4px', textTransform: 'uppercase', marginBottom: '2rem', color: '#666' }}>Entry Password</p>
                            <div className="secret-code">{data.password || 'GATSBY'}</div>
                            <p style={{ fontSize: '0.8rem', opacity: 0.5, marginTop: '2rem' }}>Hover to reveal. Whisper at the door.</p>
                            <div style={{ marginTop: '3rem', fontSize: '0.7rem', opacity: 0.3, position: 'relative', bottom: '10px', left: '10px', textAlign: 'left' }}>
                                Host: {data.hostName || data.host}
                            </div>
                        </div>
                    </section>
                </div>
        </div>
    );
};

export default GatsbyInvite;


