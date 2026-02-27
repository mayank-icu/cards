import React, { useEffect, useRef, useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { gsap } from 'gsap';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import CardViewHeader from '../../components/CardViewHeader';
import { 
  Award, Music, Play, Pause, Trophy, Sun, Moon, 
  Briefcase, Plane, Coffee, CheckSquare, 
  Wine, Watch, ArrowDown 
} from 'lucide-react';
import { normalizeCardData, resolveCardId } from '../../utils/slugs';

/** * AUDIO ENGINE 
 * Synthesizes sounds to avoid external asset dependencies
 */
class AudioManager {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.oscylators = [];
  }

  init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.3;
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playTone(freq, type, duration, delay = 0) {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = type;
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime + delay);
    
    gain.gain.setValueAtTime(0.5, this.ctx.currentTime + delay);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + delay + duration);
    
    osc.connect(gain);
    gain.connect(this.masterGain);
    
    osc.start(this.ctx.currentTime + delay);
    osc.stop(this.ctx.currentTime + delay + duration);
  }

  playAlarm() {
    this.playTone(800, 'square', 0.1, 0);
    this.playTone(800, 'square', 0.1, 0.2);
    this.playTone(800, 'square', 0.1, 0.4);
  }

  playSmash() {
    this.playTone(100, 'sawtooth', 0.5);
    this.playTone(50, 'square', 0.6);
  }

  playStamp() {
    this.playTone(200, 'triangle', 0.1);
  }

  playSwoosh() {
    // White noise buffer approximation
    if (!this.ctx) return;
    const bufferSize = this.ctx.sampleRate * 0.5;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.5);
    noise.connect(gain);
    gain.connect(this.masterGain);
    noise.start();
  }

  playWin() {
    this.playTone(400, 'sine', 0.2, 0);
    this.playTone(600, 'sine', 0.2, 0.1);
    this.playTone(800, 'sine', 0.4, 0.2);
  }
}

const audioManager = new AudioManager();

/**
 * CSS STYLES
 * Injected as a style tag to ensure self-contained file
 */
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600&family=Playfair+Display:ital,wght@0,400;0,700;1,400&display=swap');

  :root {
    --c-dark: #0f172a;
    --c-ocean: #1e3a8a;
    --c-teal: #115e59;
    --c-sand: #fffbeb;
    --c-gold: #fbbf24;
    --c-orange: #f97316;
    --c-sunset: #c2410c;
    
    --font-head: 'Playfair Display', serif;
    --font-body: 'Inter', sans-serif;
  }

  * { box-sizing: border-box; }

  body, html {
    margin: 0;
    padding: 0;
    width: 100%;
    height: 100%;
    background-color: var(--c-dark);
    color: var(--c-sand);
    font-family: var(--font-body);
    overflow: hidden; /* Prevent default scroll, handle in app */
  }

  .scrolly-container {
    height: 100dvh;
    width: 100%;
    overflow-y: auto;
    overflow-x: hidden;
    scroll-snap-type: y mandatory;
    scroll-behavior: smooth;
    -webkit-overflow-scrolling: touch;
  }

  section {
    height: 100dvh;
    min-height: 100dvh;
    width: 100%;
    scroll-snap-align: start;
    position: relative;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    transition: background-color 0.5s ease;
    touch-action: pan-y;
  }

  /* Typography */
  h1, h2, h3 { font-family: var(--font-head); margin: 0; }
  h1 { font-size: 3rem; font-weight: 700; letter-spacing: -0.05em; color: var(--c-gold); text-shadow: 0 0 20px rgba(251, 191, 36, 0.3); }
  h2 { font-size: 2rem; color: var(--c-sand); margin-bottom: 1rem; }
  p { font-size: 1.1rem; line-height: 1.6; max-width: 600px; text-align: center; color: rgba(255, 255, 255, 0.8); }

  /* Utilities */
  .btn-primary {
    margin-top: 2rem;
    padding: 1rem 2rem;
    background: var(--c-gold);
    color: var(--c-dark);
    border: none;
    border-radius: 50px;
    font-family: var(--font-body);
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 1px;
    cursor: pointer;
    transition: transform 0.2s, box-shadow 0.2s;
  }
  .btn-primary:hover { transform: scale(1.05); box-shadow: 0 0 20px var(--c-gold); }
  
  .instruction {
    position: absolute;
    bottom: 2rem;
    font-size: 0.8rem;
    text-transform: uppercase;
    letter-spacing: 2px;
    opacity: 0.5;
    animation: pulse 2s infinite;
  }

  @keyframes pulse { 0% { opacity: 0.3; } 50% { opacity: 0.8; } 100% { opacity: 0.3; } }
  @keyframes float { 0% { transform: translateY(0px); } 50% { transform: translateY(-10px); } 100% { transform: translateY(0px); } }
  @keyframes shake { 0% { transform: translate(1px, 1px) rotate(0deg); } 10% { transform: translate(-1px, -2px) rotate(-1deg); } 20% { transform: translate(-3px, 0px) rotate(1deg); } 30% { transform: translate(3px, 2px) rotate(0deg); } 40% { transform: translate(1px, -1px) rotate(1deg); } 50% { transform: translate(-1px, 2px) rotate(-1deg); } 60% { transform: translate(-3px, 1px) rotate(0deg); } 70% { transform: translate(3px, 1px) rotate(-1deg); } 80% { transform: translate(-1px, -1px) rotate(1deg); } 90% { transform: translate(1px, 2px) rotate(0deg); } 100% { transform: translate(1px, -2px) rotate(-1deg); } }

  /* Section Specifics */
  .s-cover { background: radial-gradient(circle at center, #1e293b, #0f172a); }
  .s-alarm { background: #334155; }
  .alarm-clock { font-size: 5rem; font-family: monospace; color: #ef4444; border: 4px solid #ef4444; padding: 1rem 2rem; border-radius: 10px; cursor: pointer; user-select: none; }
  .alarm-clock.ringing { animation: shake 0.5s infinite; text-shadow: 0 0 10px red; box-shadow: 0 0 20px red; }
  .alarm-clock.broken { color: #94a3b8; border-color: #94a3b8; transform: rotate(10deg); text-decoration: line-through; box-shadow: none; text-shadow: none; }

  .s-commute { background: linear-gradient(180deg, #475569 0%, #1e293b 100%); }
  .road { width: 100%; height: 200px; background: #0f172a; position: relative; display: flex; align-items: center; overflow: hidden; }
  .car { width: 60px; height: 30px; background: #cbd5e1; border-radius: 5px; position: absolute; }
  
  .s-passport { background: #78350f; cursor: crosshair; }
  .passport-book { width: 300px; height: 400px; background: #fef3c7; border-radius: 10px; padding: 20px; display: grid; grid-template-columns: 1fr 1fr; gap: 10px; box-shadow: 0 20px 50px rgba(0,0,0,0.5); position: relative; overflow: hidden; }
  .stamp { position: absolute; width: 60px; height: 60px; border: 3px solid; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; transform: rotate(-15deg); opacity: 0; animation: stampIn 0.2s forwards; pointer-events: none; }
  @keyframes stampIn { from { transform: scale(2) rotate(0deg); opacity: 0; } to { transform: scale(1) rotate(-15deg); opacity: 0.7; } }

  .s-hammock { background: linear-gradient(to bottom, #38bdf8, #0ea5e9); overflow: hidden; }
  .palm-tree { position: absolute; bottom: 0; left: -50px; opacity: 0.8; }
  .hammock-pivot { position: absolute; top: 20%; left: 50%; }
  .hammock-rope { width: 2px; background: #fde047; position: absolute; transform-origin: top center; }
  .hammock-body { width: 150px; height: 40px; background: #fca5a5; border-radius: 0 0 150px 150px; position: absolute; top: 200px; left: -75px; display: flex; align-items: center; justify-content: center; cursor: grab; }
  .hammock-body:active { cursor: grabbing; }

  .s-todo { background: #1c1917; }
  .todo-list { background: #fff; color: #000; padding: 2rem; border-radius: 5px; width: 300px; font-family: 'Courier New', monospace; position: relative; }
  .todo-item { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px dashed #999; cursor: pointer; transition: opacity 0.5s; }
  .todo-item.burnt { opacity: 0; pointer-events: none; }

  .s-golf { background: #14532d; user-select: none; }
  .golf-hole { width: 40px; height: 40px; background: #000; border-radius: 50%; position: absolute; top: 15%; border: 2px solid rgba(255,255,255,0.2); }
  .golf-ball { width: 20px; height: 20px; background: #fff; border-radius: 50%; position: absolute; bottom: 15%; cursor: grab; box-shadow: 0 5px 10px rgba(0,0,0,0.3); }

  .s-cocktail { background: #7c2d12; }
  .shaker-container { width: 100px; height: 160px; position: relative; cursor: pointer; }
  .shaker { width: 100%; height: 100%; background: silver; border-radius: 10px 10px 40px 40px; position: relative; display: flex; align-items: center; justify-content: center; transition: transform 0.1s; }
  .liquid { position: absolute; bottom: 0; left: 0; width: 100%; height: 0%; background: linear-gradient(to top, #fbbf24, #f97316); border-radius: 10px 10px 40px 40px; transition: height 0.3s; opacity: 0.8; }
  
  .s-watch { background: #000; }
  .watch-face { width: 200px; height: 200px; border: 4px solid #fbbf24; border-radius: 50%; position: relative; display: flex; align-items: center; justify-content: center; }
  .hand { position: absolute; background: #fbbf24; transform-origin: bottom center; bottom: 50%; left: 50%; border-radius: 5px; }
  .hand.hour { height: 50px; width: 6px; transform: translateX(-3px); }
  .hand.min { height: 80px; width: 4px; transform: translateX(-2px); }

  .s-sunset { position: relative; }
  canvas#sunsetCanvas { width: 100%; height: 100%; display: block; }
  .sunset-overlay { position: absolute; top: 0; left: 0; width: 100%; height: 100%; display: flex; flex-direction: column; justify-content: center; align-items: center; z-index: 10; pointer-events: none; }

  .s-cheers { background: radial-gradient(circle at center, #fbbf24 0%, #c2410c 100%); text-align: center; }
  .cheers-card { background: rgba(255, 255, 255, 0.1); backdrop-filter: blur(10px); padding: 3rem; border-radius: 20px; border: 1px solid rgba(255,255,255,0.3); max-width: 90%; width: 500px; }

  /* Utilities for animation */
  .fade-in { animation: fadeIn 1s ease forwards; opacity: 0; }
  @keyframes fadeIn { to { opacity: 1; } }

  @media (max-width: 768px) {
    h1 { font-size: 2rem; }
    h2 { font-size: 1.5rem; }
    .passport-book { width: 90%; }
  }

  /* Floating Spotify */
  .spotify-float {
    position: fixed;
    top: 24px;
    right: 24px;
    z-index: 2000;
    background: rgba(255,255,255,0.15);
    backdrop-filter: blur(12px);
    border-radius: 50px;
    width: 44px;
    height: 44px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 2px solid rgba(255,255,255,0.3);
    cursor: pointer;
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    overflow: hidden;
    box-shadow: 0 8px 24px rgba(0,0,0,0.3), 0 0 20px rgba(251,191,36,0.2);
  }
  .spotify-float:hover {
    width: 300px;
    height: 84px;
    border-radius: 16px;
    background: rgba(0,0,0,0.9);
    border-color: var(--c-gold);
  }
  .spotify-icon { color: var(--c-gold); transition: all 0.3s; }
  .spotify-float:hover .spotify-icon { opacity: 0; display: none; }
  .spotify-float iframe { 
    opacity: 0; 
    transition: opacity 0.5s ease 0.2s; 
    width: 100%; 
    height: 100%; 
    border-radius: 12px;
  }
  .spotify-float:hover iframe { opacity: 1; }

  .palm-tree-custom {
    position: absolute;
    bottom: 0;
    left: -50px;
    width: 300px;
    height: 400px;
  }
  
  .palm-trunk {
    position: absolute;
    bottom: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 40px;
    height: 200px;
    background: linear-gradient(to right, #8b4513, #a0522d, #8b4513);
    border-radius: 10px;
    box-shadow: 0 0 20px rgba(139, 69, 19, 0.3);
  }
  
  .palm-leaves {
    position: absolute;
    top: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 250px;
    height: 250px;
  }
  
  .palm-leaf {
    position: absolute;
    bottom: 50px;
    left: 50%;
    width: 80px;
    height: 120px;
    background: linear-gradient(135deg, #22c55e, #16a34a);
    border-radius: 0 100% 0 100%;
    transform-origin: bottom left;
    box-shadow: 0 0 15px rgba(34, 197, 94, 0.4);
    animation: leaf-sway 4s ease-in-out infinite;
  }
  
  .palm-leaf:nth-child(1) { transform: rotate(-30deg) translateX(-40px); animation-delay: 0s; }
  .palm-leaf:nth-child(2) { transform: rotate(-10deg) translateX(-30px); animation-delay: 0.5s; }
  .palm-leaf:nth-child(3) { transform: rotate(10deg) translateX(-20px); animation-delay: 1s; }
  .palm-leaf:nth-child(4) { transform: rotate(30deg) translateX(-10px); animation-delay: 1.5s; }
  .palm-leaf:nth-child(5) { transform: rotate(50deg) translateX(0px); animation-delay: 2s; }
  .palm-leaf:nth-child(6) { transform: rotate(-50deg) translateX(-50px); animation-delay: 2.5s; }
  
  @keyframes leaf-sway {
    0%, 100% { transform: rotate(var(--rotation)) translateX(var(--translate-x)); }
    50% { transform: rotate(calc(var(--rotation) + 5deg)) translateX(calc(var(--translate-x) + 5px)); }
  }
  
  .palm-leaf:nth-child(1) { --rotation: -30deg; --translate-x: -40px; }
  .palm-leaf:nth-child(2) { --rotation: -10deg; --translate-x: -30px; }
  .palm-leaf:nth-child(3) { --rotation: 10deg; --translate-x: -20px; }
  .palm-leaf:nth-child(4) { --rotation: 30deg; --translate-x: -10px; }
  .palm-leaf:nth-child(5) { --rotation: 50deg; --translate-x: 0px; }
  .palm-leaf:nth-child(6) { --rotation: -50deg; --translate-x: -50px; }
`;

const RetirementView = () => {
    const { wishId } = useParams();
    const [wishData, setWishData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [started, setStarted] = useState(false);
    
    // Engine Refs
    const scrollerRef = useRef(null);
    const timelineRef = useRef(null);

    // Section States
    const [alarmRinging, setAlarmRinging] = useState(true);
    const [alarmBroken, setAlarmBroken] = useState(false);
    const [trafficClear, setTrafficClear] = useState(false);
    const [stamps, setStamps] = useState([]);
    const [chores, setChores] = useState(['Submit Report', 'Morning Commute', 'Budget Meeting', 'Reply to All']);
    const [shakerLevel, setShakerLevel] = useState(0);
    const [timeVanished, setTimeVanished] = useState(false);

    // Fetch Data
    useEffect(() => {
        const fetchWishData = async () => {
            try {
                // Simulating database fetch if helper unavailable, otherwise using helper
                let data = null;
                try {
                    const result = await resolveCardId(wishId, 'wishes', 'retirement');
                    if (result) data = result.data;
                } catch (e) {
                    console.warn("Using mock data as fallback or helper missing");
                    // Mock data for preview/fallback
                    data = {
                        recipientName: "Alex",
                        message: "Enjoy the endless weekends! You've earned every second of peace.",
                        sender: " The Marketing Team",
                        achievements: "35 Years of Excellence"
                    };
                }
                setWishData(data);
            } catch (error) {
                console.error("Error fetching wish:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchWishData();
    }, [wishId]);

    // Intersection Observer for Section Activation
    useEffect(() => {
        if (loading) return;

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    // Trigger section specific logic
                    const id = entry.target.getAttribute('data-id');
                    handleSectionEnter(id);
                }
            });
        }, { threshold: 0.5 });

        const sections = document.querySelectorAll('section');
        sections.forEach(s => observer.observe(s));

        return () => observer.disconnect();
    }, [loading]);

    const handleSectionEnter = (id) => {
        // Reset or trigger specific GSAP animations per section
        if (id === 'watch' && !timeVanished) {
            gsap.to('.hand', { rotation: -720, duration: 2, ease: "power4.in", onComplete: () => {
                gsap.to('.watch-face', { scale: 0, opacity: 0, duration: 1, ease: "back.in" });
                setTimeVanished(true);
            }});
        }
        if (id === 'commute' && !trafficClear) {
             gsap.to('.car', {
                x: '+=1000',
                duration: 4,
                stagger: 0.2,
                ease: "power1.in",
                onComplete: () => {
                    setTrafficClear(true);
                    audioManager.playSwoosh();
                }
             });
        }
    };

    const startExperience = () => {
        audioManager.init();
        setStarted(true);
        // Auto scroll to section 1 after delay
        setTimeout(() => {
            scrollerRef.current.scrollTo({ top: window.innerHeight, behavior: 'smooth' });
            // Start alarm loop
            const interval = setInterval(() => {
                if (!alarmBroken && scrollerRef.current.scrollTop < window.innerHeight * 1.5) {
                    audioManager.playAlarm();
                } else {
                    clearInterval(interval);
                }
            }, 1000);
        }, 1000);
    };

    // --- INTERACTION HANDLERS ---

    const smashAlarm = () => {
        if (alarmBroken) return;
        setAlarmBroken(true);
        setAlarmRinging(false);
        audioManager.playSmash();
        gsap.to('.alarm-clock', { scale: 0.9, rotation: 10, duration: 0.1 });
    };

    const addStamp = (e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const locations = ['PARIS', 'FIJI', 'TOKYO', 'ROME', 'BALI'];
        const city = locations[Math.floor(Math.random() * locations.length)];
        const color = ['#ef4444', '#3b82f6', '#10b981', '#a855f7'][Math.floor(Math.random() * 4)];
        
        const newStamp = { id: Date.now(), x, y, city, color };
        setStamps([...stamps, newStamp]);
        audioManager.playStamp();
    };

    const burnChore = (index) => {
        audioManager.playSwoosh();
        setChores(prev => {
            const newChores = [...prev];
            newChores[index] = null; // Mark as burnt
            return newChores;
        });
        
        // Fire particle effect could go here
        gsap.to(`#chore-${index}`, { scale: 1.2, opacity: 0, color: '#ef4444', textShadow: "0 0 10px #f59e0b", duration: 0.5 });
    };

    const shakeCocktail = () => {
        if (shakerLevel >= 100) return;
        setShakerLevel(prev => Math.min(prev + 15, 100));
        audioManager.playSwoosh();
        if (shakerLevel + 15 >= 100) {
            audioManager.playWin();
        }
    };

    // --- SUB-COMPONENTS (Defined locally for single-file requirement) ---

    const Hammock = () => {
        const hRef = useRef(null);
        const [isDragging, setIsDragging] = useState(false);
        const [dragCount, setDragCount] = useState(0);
        
        useEffect(() => {
            if(!hRef.current) return;
            const el = hRef.current;
            let angle = 0;
            let velocity = 0;
            let isDragging = false;
            let startX = 0;

            const update = () => {
                if (!isDragging) {
                    const gravity = 0.005;
                    const damping = 0.99;
                    const acceleration = -1 * gravity * Math.sin(angle);
                    velocity += acceleration;
                    velocity *= damping;
                    angle += velocity;
                }
                el.style.transform = `rotate(${angle}rad)`;
                requestAnimationFrame(update);
            };
            const anim = requestAnimationFrame(update);

            const start = (x) => { 
                isDragging = true; 
                startX = x; 
                setIsDragging(true);
                setDragCount(prev => prev + 1);
                if (dragCount > 0 && dragCount % 5 === 0) {
                    audioManager.playSwoosh();
                }
            };
            const move = (x) => {
                if(isDragging) {
                    const diff = x - startX;
                    angle = diff * 0.01;
                    velocity = 0;
                }
            };
            const end = () => { 
                isDragging = false; 
                setIsDragging(false);
            };

            const handleDown = (e) => start(e.clientX || e.touches[0].clientX);
            const handleMove = (e) => move(e.clientX || e.touches[0].clientX);
            const handleUp = () => end();

            // Mobile & Mouse listeners attached to window for drag continuity
            window.addEventListener('mousemove', handleMove);
            window.addEventListener('mouseup', handleUp);
            window.addEventListener('touchmove', handleMove);
            window.addEventListener('touchend', handleUp);

            return () => {
                cancelAnimationFrame(anim);
                window.removeEventListener('mousemove', handleMove);
                window.removeEventListener('mouseup', handleUp);
                window.removeEventListener('touchmove', handleMove);
                window.removeEventListener('touchend', handleUp);
            };
        }, [dragCount]);

        return (
            <div className="hammock-rope" style={{ height: '200px' }}>
                 <div ref={hRef} style={{ transformOrigin: 'top center' }}>
                    <div style={{ width: '2px', height: '200px', background: '#fde047', margin: '0 auto' }}></div>
                    <div className="hammock-body" 
                         onMouseDown={(e) => e.target.parentElement.dispatchEvent(new Event('mousedown'))}
                         style={{
                             cursor: isDragging ? 'grabbing' : 'grab',
                             background: isDragging ? '#f87171' : '#fca5a5',
                             transition: 'background 0.3s ease'
                         }}>
                        <div style={{ 
                            position: 'relative', 
                            top: '-10px', 
                            color: '#881337',
                            fontSize: isDragging ? '1.1rem' : '1rem',
                            fontWeight: isDragging ? 'bold' : 'normal',
                            transition: 'all 0.3s ease'
                        }}>
                            {isDragging ? 'Wheee!' : 'Drag Me'}
                        </div>
                        {dragCount >= 10 && (
                            <div style={{
                                position: 'absolute',
                                top: '-30px',
                                left: '50%',
                                transform: 'translateX(-50%)',
                                color: '#fbbf24',
                                fontSize: '0.9rem',
                                fontWeight: 'bold',
                                animation: 'float 2s infinite'
                            }}>
                                Hammock Master! 🌴
                            </div>
                        )}
                    </div>
                 </div>
            </div>
        );
    };

    const GolfGame = () => {
        const ballRef = useRef(null);
        const [ballPos, setBallPos] = useState(0); // 0 = start, 100 = hole

        const handleDragEnd = (e, info) => {
            // Simple visual implementation
            if(ballPos < 100) {
                gsap.to(ballRef.current, { bottom: '80%', duration: 1, ease: "power2.out", onComplete: () => {
                    audioManager.playWin();
                    gsap.to(ballRef.current, { scale: 0, duration: 0.2 });
                }});
                audioManager.playSwoosh();
                setBallPos(100);
            }
        };

        return (
            <div style={{ width: '100%', height: '100%', position: 'relative', display: 'flex', justifyContent: 'center' }}>
                <div className="golf-hole"></div>
                <div 
                    ref={ballRef}
                    className="golf-ball" 
                    onMouseDown={handleDragEnd}
                    onTouchStart={handleDragEnd}
                ></div>
                <div className="instruction" style={{ bottom: '10%' }}>Flick the ball</div>
            </div>
        );
    };

    const SunsetCanvas = () => {
        const canvasRef = useRef(null);

        useEffect(() => {
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');
            let width, height;
            let time = 0;

            const resize = () => {
                width = canvas.width = window.innerWidth;
                height = canvas.height = window.innerHeight;
            };
            window.addEventListener('resize', resize);
            resize();

            const draw = () => {
                ctx.clearRect(0, 0, width, height);

                // Sky Gradient
                const gradient = ctx.createLinearGradient(0, 0, 0, height);
                gradient.addColorStop(0, '#0f172a'); // Deep blue
                gradient.addColorStop(0.5, '#c2410c'); // Red orange
                gradient.addColorStop(1, '#fbbf24'); // Gold
                ctx.fillStyle = gradient;
                ctx.fillRect(0, 0, width, height);

                // Sun
                ctx.beginPath();
                ctx.arc(width / 2, height * 0.6, 100, 0, Math.PI * 2);
                ctx.fillStyle = '#fef08a';
                ctx.shadowBlur = 50;
                ctx.shadowColor = '#fef08a';
                ctx.fill();
                ctx.shadowBlur = 0;

                // Water (Sine waves)
                ctx.fillStyle = '#1e3a8a';
                for (let i = 0; i < 10; i++) {
                    ctx.beginPath();
                    const yOffset = height * 0.7 + (i * 30);
                    ctx.moveTo(0, height);
                    ctx.lineTo(0, yOffset);
                    
                    for (let x = 0; x <= width; x += 20) {
                        ctx.lineTo(x, yOffset + Math.sin(x * 0.01 + time + i) * 10);
                    }
                    
                    ctx.lineTo(width, height);
                    ctx.fill();
                }

                time += 0.02;
                requestAnimationFrame(draw);
            };
            
            draw();
            return () => window.removeEventListener('resize', resize);
        }, []);

        return <canvas ref={canvasRef} id="sunsetCanvas"></canvas>;
    };

    // --- MAIN RENDER ---

    if (loading) return <div style={{ color: '#fff', display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#000' }}>Loading Wish...</div>;

    if (!wishData) return <div style={{ color: 'red' }}>Wish not found.</div>;

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
        <>
            <style>{STYLES}</style>
            
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
            
            <div className="scrolly-container" ref={scrollerRef}>
                
                {/* 1. Cover */}
                <section className="s-cover" data-id="cover">
                    <div style={{ textAlign: 'center' }}>
                        <h3 style={{color: 'var(--c-sand)', opacity: 0.7}}>A Retirement Story</h3>
                        <h1>{wishData.recipientName}</h1>
                        {!started ? (
                            <button className="btn-primary" onClick={startExperience}>
                                Open Card <Play size={16} style={{marginLeft: 8}}/>
                            </button>
                        ) : (
                            <div className="fade-in">
                                <p style={{marginTop: '2rem'}}>Scroll down to begin</p>
                                <ArrowDown className="instruction" />
                            </div>
                        )}
                    </div>
                </section>

                {/* 2. Alarm Clock */}
                <section className="s-alarm" data-id="alarm">
                    <div 
                        className={`alarm-clock ${alarmRinging ? 'ringing' : ''} ${alarmBroken ? 'broken' : ''}`}
                        onClick={smashAlarm}
                    >
                        {alarmBroken ? 'OFF' : '07:00'}
                    </div>
                    <h2 style={{marginTop: '2rem'}}>{alarmBroken ? "No more alarms." : "The daily grind."}</h2>
                    <div className="instruction">Tap to smash</div>
                </section>

                {/* 3. The Commute */}
                <section className="s-commute" data-id="commute">
                    <div style={{ position: 'absolute', top: '20%', textAlign: 'center' }}>
                        <h2>{trafficClear ? "The road is yours." : "The Rush Hour"}</h2>
                    </div>
                    <div className="road">
                        <div style={{width: '100%', borderTop: '2px dashed #64748b', position: 'absolute', top: '50%'}}></div>
                        {!trafficClear && Array.from({length: 5}).map((_, i) => (
                            <div key={i} className="car" style={{ left: `${10 + i * 15}%`, background: ['#ef4444', '#f59e0b', '#3b82f6'][i%3] }}></div>
                        ))}
                    </div>
                </section>

                {/* 4. Passport */}
                <section className="s-passport" data-id="passport">
                    <h2 style={{ color: '#fef3c7', marginBottom: '20px' }}>Where to next?</h2>
                    <div className="passport-book" onClick={addStamp}>
                        <div style={{ borderRight: '1px solid #e5e7eb', padding: 10 }}>
                            <div style={{ width: 80, height: 100, background: '#ddd', marginBottom: 10 }}></div>
                            <h4 style={{color: '#000', margin: 0}}>PASSPORT</h4>
                        </div>
                        <div style={{ position: 'relative' }}>
                            {stamps.map(s => (
                                <div key={s.id} className="stamp" style={{ left: s.x - 300, top: s.y - 20, borderColor: s.color, color: s.color }}>
                                    {s.city}
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="instruction" style={{color: '#fef3c7'}}>Tap pages to stamp</div>
                </section>

                {/* 5. Hammock */}
                <section className="s-hammock" data-id="hammock">
                    <h2>Hang in there. Literally.</h2>
                    <div className="palm-tree-custom">
                        <div className="palm-trunk"></div>
                        <div className="palm-leaves">
                            <div className="palm-leaf"></div>
                            <div className="palm-leaf"></div>
                            <div className="palm-leaf"></div>
                            <div className="palm-leaf"></div>
                            <div className="palm-leaf"></div>
                            <div className="palm-leaf"></div>
                        </div>
                    </div>
                    <Hammock />
                </section>

                {/* 6. To-Do List */}
                <section className="s-todo" data-id="todo">
                    <h2>The To-Do List</h2>
                    <div className="todo-list">
                        <h3 style={{ borderBottom: '2px solid #000', marginBottom: '1rem' }}>Mondays</h3>
                        {chores.map((chore, i) => (
                            chore && (
                                <div key={i} id={`chore-${i}`} className="todo-item" onClick={() => burnChore(i)}>
                                    <CheckSquare size={20} /> {chore}
                                </div>
                            )
                        ))}
                        {chores.every(c => c === null) && (
                            <div style={{ textAlign: 'center', color: 'red', marginTop: '1rem', fontWeight: 'bold' }}>
                                ALL GONE!
                            </div>
                        )}
                    </div>
                    <div className="instruction">Tap items to burn them</div>
                </section>

                {/* 7. Golf */}
                <section className="s-golf" data-id="golf">
                    <h2>New Hobbies</h2>
                    <GolfGame />
                </section>

                {/* 8. Cocktail */}
                <section className="s-cocktail" data-id="cocktail">
                    <h2>Happy Hour is every hour.</h2>
                    <div className="shaker-container" onClick={shakeCocktail}>
                        <div className="shaker">
                            <div className="liquid" style={{ height: `${shakerLevel}%` }}></div>
                            <Wine size={40} color="#fff" style={{ zIndex: 2 }} />
                        </div>
                    </div>
                    <p>{shakerLevel < 100 ? "Tap rapidly to mix!" : "Perfectly mixed."}</p>
                </section>

                {/* 9. Watch */}
                <section className="s-watch" data-id="watch">
                    <div className="watch-face">
                        <div className="hand hour"></div>
                        <div className="hand min"></div>
                    </div>
                    <h2 style={{ marginTop: '2rem', opacity: timeVanished ? 1 : 0, transition: 'opacity 1s' }}>
                        Time is yours now.
                    </h2>
                </section>

                {/* 10. Sunset */}
                <section className="s-sunset" data-id="sunset">
                    <SunsetCanvas />
                    <div className="sunset-overlay">
                        <h1 style={{ color: '#fff', textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>Golden Days Ahead</h1>
                    </div>
                </section>

                {/* 11. Closing */}
                <section className="s-cheers" data-id="cheers">
                    <div className="cheers-card">
                        <Trophy size={60} color="#fbbf24" style={{ marginBottom: '1rem' }} />
                        <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>Happy Retirement</h1>
                        <p style={{ color: '#fff', fontSize: '1.2rem', marginBottom: '2rem' }}>
                            "{wishData.message}"
                        </p>
                        <div style={{ borderTop: '1px solid rgba(255,255,255,0.3)', paddingTop: '1rem' }}>
                            <p style={{ fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                With love from
                            </p>
                            <h3 style={{ color: '#fff' }}>{wishData.sender}</h3>
                        </div>
                        
                        <button className="btn-primary" onClick={() => scrollerRef.current.scrollTo({ top: 0, behavior: 'smooth' })}>
                            Replay Journey
                        </button>
                    </div>
                </section>

            </div>
        </>
    );
};

export default RetirementView;