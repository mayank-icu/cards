import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import {
  doc,
  onSnapshot,
  updateDoc
} from 'firebase/firestore';
import confetti from 'canvas-confetti';
import {
  Play,
  Pause,
  Heart,
  Anchor,
  Clock,
  CheckCircle,
  ArrowDown,
  Music,
  Droplets,
  PenTool,
  Unlock,
  RefreshCcw,
  Mail
} from 'lucide-react';
import CardViewHeader from '../../components/CardViewHeader';
import CardFooter from '../../components/CardFooter';
import { db } from '../../firebase';
import SongPlayer from '../../components/SongPlayer';
import { resolveCardId } from '../../utils/slugs';

/* NOTE: This is a single-file implementation using custom CSS (no Tailwind/Bootstrap).
  It includes enhanced interactivity for every section and a light theme.
*/

const ImmersiveApology = () => {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [started, setStarted] = useState(false);
  const [realId, setRealId] = useState(null);

  // Data Fetching
  useEffect(() => {
    if (!id) return;

    let unsubscribe = () => { };

    const setupSubscription = async () => {
      try {
        const result = await resolveCardId(id, 'apologies', 'apology');

        if (result) {
          const resolvedId = result.id;
          setRealId(resolvedId);
          const docRef = doc(db, 'apologies', resolvedId);

          unsubscribe = onSnapshot(docRef, (snap) => {
            if (snap.exists()) {
              setData({ id: snap.id, ...snap.data() });
            } else {
              setData(getFallbackData());
            }
            setLoading(false);
          }, (err) => {
            console.error("Data fetch error:", err);
            setData(getFallbackData());
            setLoading(false);
          });
        } else {
          setData(getFallbackData());
          setLoading(false);
        }
      } catch (err) {
        console.error("Error resolving apology:", err);
        setData(getFallbackData());
        setLoading(false);
      }
    };

    setupSubscription();

    return () => unsubscribe();
  }, [id]);

  const getFallbackData = () => ({
    recipient: "Friend",
    sender: "Someone Who Cares",
    message: "I'm truly sorry for what happened. I value our relationship and want to make things right. Please forgive me.",
    song: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    forgiven: false
  });

  if (loading) return <div className="loader"><div>Loading Experience...</div></div>;

  return (
    <>
      <style>{cssStyles}</style>
      <CardViewHeader
        cardType="apology"
        cardId={id}
        title="Apology"
        subtitle={data?.recipient ? `For ${data.recipient}${data?.sender ? ` · From ${data.sender}` : ''}` : undefined}
      />
      
      <div className="scrolly-container">
        <SongPlayer song={started ? data.song : null} />

        {/* 1. The Silence / Intro */}
        <SectionAirlock
          recipient={data.recipient}
          sender={data.sender}
          onEnter={() => setStarted(true)}
          started={started}
        />

        {/* 2. The Fracture - Click to Break */}
        <SectionFracture />

        {/* 3. The Explanation - Unfold Letter */}
        <SectionExplanation message={data.message} />

        {/* 4. The Repair (Kintsugi) - Draw Gold */}
        <SectionKintsugi />

        {/* 5. The Weight - Lift the Burden */}
        <SectionWeight />

        {/* 6. The Olive Branch - Water to Grow */}
        <SectionGrowth />

        {/* 7. Eraser - Clean Slate */}
        <SectionEraser />

        {/* 8. Time Machine - Rewind */}
        <SectionTime />

        {/* 9. The Promise - Seal the deal */}
        <SectionPromises />

        {/* 10. The Door (Conclusion) */}
        <SectionConclusion
          data={data}
          docId={realId}
        />
      </div>
    </>
  );
};

/* --- SECTION COMPONENTS --- */

const SectionAirlock = ({ recipient, sender, onEnter, started }) => {
  return (
    <section className="snap-section section-paper" id="intro">
      <div className="paper-texture"></div>
      <div className="content-center airlock-content">
        <div className="fade-in-slow text-center">
          <h2 className="recipient-label">For {recipient}</h2>
          <h1 className="main-title">I Am Sorry.</h1>
          <p className="subtitle-text">A message from {sender}</p>
        </div>
        
        {!started ? (
          <button className="gold-btn glow pulse-btn" onClick={onEnter}>
            <Play size={18} /> Open Message
          </button>
        ) : (
          <div className="scroll-hint fade-in">
            <p>Scroll slowly to begin</p>
            <ArrowDown className="bounce" size={24} />
          </div>
        )}
      </div>
    </section>
  );
};

const SectionFracture = () => {
  const [cracks, setCracks] = useState([]);
  const [shattered, setShattered] = useState(false);

  const handleCrack = (e) => {
    if (shattered) return;
    
    // Calculate click position
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const newCrack = { x, y, rotation: Math.random() * 360, scale: 0.5 + Math.random() };
    const newCracks = [...cracks, newCrack];
    setCracks(newCracks);

    if (newCracks.length > 4) {
      setShattered(true);
    }
  };

  return (
    <section className="snap-section section-light-gray" onClick={handleCrack}>
      <div className="content-center overlay-text unselectable">
        <h2 className={shattered ? "text-shattered" : ""}>The Fracture</h2>
        <p className={shattered ? "text-shattered-sub" : ""}>
          Trust is fragile.<br/>
          {shattered ? "I know I broke it." : "(Tap the screen)"}
        </p>
      </div>
      
      {/* Visual Cracks */}
      {cracks.map((crack, i) => (
        <div 
          key={i} 
          className="crack-visual"
          style={{ 
            left: crack.x, 
            top: crack.y, 
            transform: `translate(-50%, -50%) rotate(${crack.rotation}deg) scale(${crack.scale})` 
          }}
        >
          <svg width="200" height="200" viewBox="0 0 100 100" fill="none" stroke="#2d3748" strokeWidth="2">
             <path d="M50 50 L20 20 M50 50 L80 10 M50 50 L50 90 M50 50 L90 60" />
          </svg>
        </div>
      ))}
    </section>
  );
};

const SectionExplanation = ({ message }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <section className="snap-section section-cream">
      <div className="content-center">
        <h3>The Explanation</h3>
        <p style={{marginBottom: '20px'}}>I owe you the truth.</p>
        
        <div 
          className={`letter-envelope ${isOpen ? 'open' : ''}`} 
          onClick={() => setIsOpen(!isOpen)}
        >
          <div className="letter-flap"></div>
          <div className="letter-paper">
            <div className="paper-content">
              <p>"{message}"</p>
            </div>
          </div>
          <div className="letter-front">
            <Mail size={40} color="#d69e2e" />
            <span>{isOpen ? "Tap to close" : "Tap to read"}</span>
          </div>
        </div>
      </div>
    </section>
  );
};

const SectionKintsugi = () => {
  const canvasRef = useRef(null);
  const [repaired, setRepaired] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    // Resize
    const parent = canvas.parentElement;
    canvas.width = parent.offsetWidth;
    canvas.height = parent.offsetHeight;

    ctx.strokeStyle = '#d69e2e'; // Gold
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#d69e2e';

    let isDrawing = false;
    let points = 0;

    const start = (e) => {
      e.preventDefault();
      isDrawing = true;
      const { x, y } = getPos(e, canvas);
      ctx.beginPath();
      ctx.moveTo(x, y);
    };

    const move = (e) => {
      // Prevent scrolling ONLY when drawing inside the canvas
      if (isDrawing) e.preventDefault();
      if (!isDrawing) return;
      
      const { x, y } = getPos(e, canvas);
      ctx.lineTo(x, y);
      ctx.stroke();
      points++;
      if (points > 40 && !repaired) setRepaired(true);
    };

    const end = () => {
      isDrawing = false;
      ctx.beginPath();
    };

    // Events
    canvas.addEventListener('mousedown', start);
    canvas.addEventListener('mousemove', move);
    canvas.addEventListener('mouseup', end);
    canvas.addEventListener('touchstart', start, { passive: false });
    canvas.addEventListener('touchmove', move, { passive: false });
    canvas.addEventListener('touchend', end);

    return () => {
      if (canvas) {
        canvas.removeEventListener('mousedown', start);
        canvas.removeEventListener('mousemove', move);
        canvas.removeEventListener('mouseup', end);
        canvas.removeEventListener('touchstart', start);
        canvas.removeEventListener('touchmove', move);
        canvas.removeEventListener('touchend', end);
      }
    };
  }, [repaired]);

  const getPos = (e, canvas) => {
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  return (
    <section className="snap-section section-paper relative">
      <div className="content-center" style={{pointerEvents: 'none'}}>
        <h3>Golden Repair</h3>
        <p>Some things are stronger where they were broken.</p>
      </div>
      
      <div className="kintsugi-wrapper">
        <div className="kintsugi-bg">
          <svg viewBox="0 0 100 100" className="broken-bowl">
            <path d="M 20 50 Q 50 10 80 50 L 50 90 Z" fill="#fff" stroke="#cbd5e0" strokeWidth="2" />
            <path d="M 20 50 L 40 60 L 30 80" stroke="#a0aec0" strokeWidth="1" fill="none" strokeDasharray="2,2" />
            <path d="M 80 50 L 60 40 L 70 20" stroke="#a0aec0" strokeWidth="1" fill="none" strokeDasharray="2,2" />
          </svg>
        </div>
        <canvas ref={canvasRef} className="repair-canvas" />
      </div>
      
      <div className="instruction-toast">
        {repaired ? (
          <span className="success-text"><CheckCircle size={16} /> Mended</span>
        ) : (
          <span className="anim-text"><PenTool size={16}/> Trace the cracks</span>
        )}
      </div>
      
      {/* Mobile Scroll Safe Zones */}
      <div className="scroll-safe-zone left"></div>
      <div className="scroll-safe-zone right"></div>
    </section>
  );
};

const SectionWeight = () => {
  const [lift, setLift] = useState(0);
  const intervalRef = useRef(null);

  const startLift = () => {
    intervalRef.current = setInterval(() => {
      setLift(prev => Math.min(prev + 1.5, 100));
    }, 15);
  };

  const endLift = () => {
    clearInterval(intervalRef.current);
    const drop = setInterval(() => {
      setLift(prev => {
        if (prev <= 0) {
          clearInterval(drop);
          return 0;
        }
        return prev - 3;
      });
    }, 15);
  };

  return (
    <section className="snap-section section-light-gray" >
      <div className="content-center">
        <h3>The Weight</h3>
        <p>Regret is heavy. I'm trying to lift it.</p>

        <div className="weight-vis-container">
          <div className="rope" style={{height: `${150 - lift}px`}}></div>
          <div
            className="stone-light"
            style={{ transform: `translateY(${0}px) scale(${1 + lift / 400})` }}
          >
            <Anchor size={48} color="#718096" />
            <span className="stone-label">Regret</span>
          </div>
        </div>

        <button
          className={`hold-btn-light ${lift > 90 ? 'lifted' : ''}`}
          onMouseDown={startLift}
          onMouseUp={endLift}
          onMouseLeave={endLift}
          onTouchStart={startLift}
          onTouchEnd={endLift}
        >
          {lift > 90 ? "Burden Lifted" : "Hold to Lift"}
        </button>
      </div>
    </section >
  );
};

const SectionGrowth = () => {
  const [growth, setGrowth] = useState(0); // 0 to 100
  
  const handleWater = () => {
    setGrowth(prev => Math.min(prev + 20, 100));
  };

  return (
    <section className="snap-section section-cream">
      <div className="content-center">
        <h3>The Olive Branch</h3>
        <p>I want to grow from this, with you.</p>
        
        <div className="plant-stage">
          {/* Pot */}
          <div className="pot"></div>
          
          {/* Plant Stem */}
          <div 
            className="stem" 
            style={{ 
              height: `${50 + (growth * 1.5)}px`,
              transition: 'height 1s cubic-bezier(0.34, 1.56, 0.64, 1)'
            }}
          >
            <div className={`leaf leaf-l ${growth > 20 ? 'grown' : ''}`}></div>
            <div className={`leaf leaf-r ${growth > 40 ? 'grown' : ''}`}></div>
            <div className={`leaf leaf-l-2 ${growth > 60 ? 'grown' : ''}`}></div>
            <div className={`flower ${growth > 90 ? 'bloomed' : ''}`}></div>
          </div>
        </div>

        <button className="water-btn" onClick={handleWater}>
          <Droplets size={20} /> Water the Plant
        </button>
      </div>
    </section>
  );
};

const SectionEraser = () => {
  const canvasRef = useRef(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const parent = canvas.parentElement;
    
    // Set actual canvas size
    canvas.width = 320;
    canvas.height = 180;

    // Fill with "mess" - dark gray layer
    ctx.fillStyle = '#cbd5e0';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Write "Mistakes" on the top layer to be erased
    ctx.font = "bold 40px Helvetica";
    ctx.fillStyle = "#a0aec0";
    ctx.textAlign = "center";
    ctx.fillText("MISTAKES", 160, 100);

    ctx.globalCompositeOperation = 'destination-out';
    ctx.lineWidth = 35;
    ctx.lineCap = 'round';

    let isDrawing = false;

    const start = () => isDrawing = true;
    const end = () => isDrawing = false;
    const move = (e) => {
      if (!isDrawing) return;
      const rect = canvas.getBoundingClientRect();
      // Calculate scale in case of CSS resizing
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      
      const x = ((e.touches ? e.touches[0].clientX : e.clientX) - rect.left) * scaleX;
      const y = ((e.touches ? e.touches[0].clientY : e.clientY) - rect.top) * scaleY;

      ctx.beginPath();
      ctx.arc(x, y, 20, 0, Math.PI * 2);
      ctx.fill();
    };

    canvas.addEventListener('mousedown', start);
    canvas.addEventListener('mousemove', move);
    canvas.addEventListener('mouseup', end);
    canvas.addEventListener('touchstart', start);
    canvas.addEventListener('touchmove', move);
    canvas.addEventListener('touchend', end);
  }, []);

  return (
    <section className="snap-section section-paper">
      <div className="content-center">
        <h3>Clean Slate</h3>
        <div className="eraser-container">
          <div className="hidden-text-under">I AM SORRY</div>
          <canvas ref={canvasRef} className="scratch-canvas" />
        </div>
        <p className="instruction-small">Scrub to erase the past</p>
      </div>
    </section>
  );
};

const SectionTime = () => {
  const [rotation, setRotation] = useState(0);
  
  const handleDrag = (e) => {
     // Simple interaction: rotating increases as they move mouse/finger
     // This is a simplified "scrub" effect
     setRotation(prev => prev - 15);
  };

  return (
    <section className="snap-section section-light-gray" onMouseMove={handleDrag} onTouchMove={handleDrag}>
      <div className="content-center">
        <div className="clock-spinner" style={{transform: `rotate(${rotation}deg)`}}>
          <Clock size={100} color="#d69e2e" />
        </div>
        <h3>If I could turn back time...</h3>
        <p>I would do it differently.</p>
        <p className="subtext mt-4 text-xs uppercase tracking-widest opacity-50">Spin to rewind</p>
      </div>
    </section>
  );
};

const SectionPromises = () => {
  const [checks, setChecks] = useState([false, false, false]);

  const toggleCheck = (index) => {
    const newChecks = [...checks];
    newChecks[index] = !newChecks[index];
    setChecks(newChecks);
  };

  const promises = [
    "I will listen more.",
    "I will be patient.",
    "I won't let this happen again."
  ];

  return (
    <section className="snap-section section-cream">
      <div className="card-paper">
        <h3>Moving Forward</h3>
        <div className="checklist">
          {promises.map((text, i) => (
            <div 
              key={i} 
              className={`check-item-interactive ${checks[i] ? 'checked' : ''}`}
              onClick={() => toggleCheck(i)}
            >
              <div className="check-box">
                {checks[i] && <CheckCircle size={20} color="#fff" />}
              </div>
              <span>{text}</span>
            </div>
          ))}
        </div>
       
      </div>
    </section>
  );
};

const SectionConclusion = ({ data, docId }) => {
  const [forgivenLocal, setForgivenLocal] = useState(data.forgiven);

  const handleForgive = async () => {
    try {
      setForgivenLocal(true);
      confetti({
        particleCount: 150,
        spread: 100,
        origin: { y: 0.6 },
        colors: ['#d69e2e', '#fdfbf7', '#ecc94b'] 
      });

      if (docId) {
        const ref = doc(db, 'apologies', docId);
        await updateDoc(ref, { forgiven: true });
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <section className="snap-section section-gold-light">
      <div className="content-center">
        {forgivenLocal ? (
          <div className="success-state fade-in-up">
            <Heart size={80} fill="#d69e2e" stroke="none" className="pulse-heart" />
            <h2 className="mt-4 text-gold-dark">Thank You.</h2>
            <p className="text-dark">I won't let you down.</p>
          </div>
        ) : (
          <div className="door-ajar fade-in-up">
            <h2>The Door</h2>
            <p>I'm here whenever you are ready.</p>
            <div className="spacer"></div>
            <button className="gold-btn large filled" onClick={handleForgive}>
              <Unlock size={20} /> Accept Apology
            </button>
            <p className="tiny-text">With love, {data.sender}</p>
          </div>
        )}
      </div>
    </section>
  );
};

/* --- CSS STYLES --- */
const cssStyles = `
  :root {
    --bg-paper: #fdfbf7;
    --bg-cream: #f7f3e8;
    --bg-gray: #edf2f7;
    --bg-gold-light: #fffaf0;
    
    --text-main: #2d3748;
    --text-muted: #718096;
    --gold: #d69e2e;
    --gold-dark: #b7791f;
    --gold-light: #f6e05e;
    
    --shadow-soft: 0 10px 15px -3px rgba(0, 0, 0, 0.05);
    --shadow-sharp: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  }

  * { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    background-color: var(--bg-paper);
    color: var(--text-main);
    font-family: 'Helvetica Neue', 'Arial', sans-serif;
    overflow: hidden; 
  }

  .loader {
    height: 100vh;
    display: flex;
    justify-content: center;
    align-items: center;
    color: var(--gold);
    background: var(--bg-paper);
    font-size: 1.2rem;
    letter-spacing: 2px;
    text-transform: uppercase;
  }

  /* --- Scrolly Container --- */
  .scrolly-container {
    height: 100vh;
    height: 100dvh;
    overflow-y: scroll;
    scroll-snap-type: y mandatory;
    scroll-behavior: smooth;
    position: relative;
  }

  .snap-section {
    height: 100vh;
    height: 100dvh;
    width: 100%;
    scroll-snap-align: start;
    position: relative;
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: column;
    overflow: hidden;
    padding: 20px;
    text-align: center;
  }

  .content-center {
    z-index: 10;
    width: 100%;
    max-width: 600px;
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  
  .unselectable {
    user-select: none;
  }

  /* --- Theme Variations (Light) --- */
  .section-paper { background-color: var(--bg-paper); }
  .section-cream { background-color: var(--bg-cream); }
  .section-light-gray { background-color: var(--bg-gray); }
  .section-gold-light { background: radial-gradient(circle at center, #fffaf0 0%, #feebc8 100%); }

  /* --- Typography --- */
  h1.main-title { font-family: 'Georgia', serif; font-size: 3.5rem; color: var(--text-main); margin-bottom: 0.5rem; }
  h2 { font-size: 2.5rem; font-weight: 300; margin-bottom: 1rem; color: var(--text-main); }
  h3 { font-size: 1.5rem; color: var(--gold-dark); margin-bottom: 1rem; text-transform: uppercase; letter-spacing: 2px; font-weight: 600; }
  p { font-size: 1.1rem; line-height: 1.7; color: var(--text-muted); max-width: 500px; margin: 0 auto; }
  
  .recipient-label { font-size: 1.2rem; text-transform: uppercase; letter-spacing: 3px; color: var(--gold); margin-bottom: 0; }
  .subtitle-text { font-style: italic; font-family: 'Georgia', serif; }

  /* --- Buttons --- */
  .gold-btn {
    background: transparent;
    border: 2px solid var(--gold);
    color: var(--gold-dark);
    padding: 14px 28px;
    font-size: 1rem;
    cursor: pointer;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    gap: 10px;
    border-radius: 50px;
    margin-top: 25px;
    font-weight: 600;
  }
  .gold-btn:hover { background: var(--gold); color: #fff; transform: translateY(-2px); }
  .gold-btn.filled { background: var(--gold); color: #fff; border: none; box-shadow: 0 4px 15px rgba(214, 158, 46, 0.4); }
  .gold-btn.large { padding: 18px 45px; font-size: 1.3rem; }
  
  .pulse-btn { animation: pulseShadow 2s infinite; }
  @keyframes pulseShadow { 0% { box-shadow: 0 0 0 0 rgba(214, 158, 46, 0.4); } 70% { box-shadow: 0 0 0 10px rgba(214, 158, 46, 0); } 100% { box-shadow: 0 0 0 0 rgba(214, 158, 46, 0); } }

  /* --- Fracture --- */
  .text-shattered { transform: rotate(2deg) translateX(5px); opacity: 0.7; transition: all 0.2s; }
  .text-shattered-sub { color: #e53e3e; font-weight: bold; }
  .crack-visual {
    position: absolute;
    pointer-events: none;
    opacity: 0.6;
    animation: crackAppear 0.1s linear;
  }
  @keyframes crackAppear { from { opacity: 0; transform: scale(0.9); } to { opacity: 0.6; transform: scale(1); } }

  /* --- Envelope --- */
  .letter-envelope {
    width: 300px; height: 200px;
    background: #fff;
    border: 1px solid #e2e8f0;
    box-shadow: var(--shadow-soft);
    position: relative;
    cursor: pointer;
    transition: transform 0.5s cubic-bezier(0.4, 0, 0.2, 1);
    display: flex; justify-content: center; align-items: center;
  }
  .letter-envelope.open { height: 350px; background: #fffaf0; }
  .letter-front {
    display: flex; flex-direction: column; align-items: center; gap: 10px;
    color: var(--gold); font-weight: bold;
    transition: opacity 0.3s;
  }
  .letter-envelope.open .letter-front { opacity: 0; display: none; }
  .letter-paper {
    display: none; padding: 20px; text-align: left; 
    font-family: 'Georgia', serif; color: var(--text-main);
    width: 100%; height: 100%; overflow-y: auto;
  }
  .letter-envelope.open .letter-paper { display: block; animation: fadeIn 0.5s 0.3s forwards; opacity: 0; }

  /* --- Kintsugi (Repair) --- */
  .kintsugi-wrapper {
    position: relative;
    width: 250px; height: 250px;
    margin: 20px auto;
  }
  .broken-bowl { width: 100%; height: 100%; filter: drop-shadow(0 10px 10px rgba(0,0,0,0.1)); }
  .repair-canvas {
    position: absolute; top: 0; left: 0; width: 100%; height: 100%;
    z-index: 20; touch-action: none;
  }
  .scroll-safe-zone {
    position: absolute; top: 0; bottom: 0; width: 40px;
    z-index: 30; /* Higher than canvas to allow scrolling on edges */
  }
  .scroll-safe-zone.left { left: 0; }
  .scroll-safe-zone.right { right: 0; }
  
  .instruction-toast {
    margin-top: 10px; padding: 8px 16px; background: #fff; 
    border-radius: 20px; box-shadow: var(--shadow-sharp);
    font-size: 0.9rem; font-weight: 600; color: var(--text-muted);
  }
  .success-text { color: var(--gold-dark); display: flex; align-items: center; gap: 5px; }
  .anim-text { display: flex; align-items: center; gap: 5px; animation: bounceSmall 2s infinite; }
  @keyframes bounceSmall { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-3px); } }

  /* --- Weight --- */
  .weight-vis-container { position: relative; height: 200px; width: 100%; display: flex; justify-content: center; }
  .rope { width: 4px; background: #cbd5e0; margin: 0 auto; position: absolute; top: 0; }
  .stone-light {
    width: 120px; height: 120px; background: #e2e8f0; 
    border-radius: 20px; display: flex; flex-direction: column;
    justify-content: center; align-items: center;
    box-shadow: 0 10px 20px rgba(0,0,0,0.15);
    z-index: 2; position: absolute; bottom: 0;
  }
  .stone-label { font-size: 0.8rem; font-weight: bold; color: #a0aec0; margin-top: 5px; text-transform: uppercase; }
  .hold-btn-light {
    background: #fff; border: 2px solid #cbd5e0; color: #718096;
    padding: 15px 40px; border-radius: 12px; font-weight: bold;
    cursor: grab; transition: all 0.1s; margin-top: 20px; user-select: none;
  }
  .hold-btn-light:active { background: #edf2f7; transform: scale(0.96); }
  .hold-btn-light.lifted { background: #48bb78; color: #fff; border-color: #48bb78; }

  /* --- Plant --- */
  .plant-stage { height: 220px; width: 100px; position: relative; display: flex; justify-content: center; margin-bottom: 20px; }
  .pot {
    width: 60px; height: 50px; background: #ed8936; 
    border-radius: 0 0 10px 10px; position: absolute; bottom: 0;
    box-shadow: inset 0 -5px rgba(0,0,0,0.1);
  }
  .stem { width: 6px; background: #48bb78; position: absolute; bottom: 30px; border-radius: 10px; }
  .leaf { width: 20px; height: 10px; background: #48bb78; position: absolute; border-radius: 0 10px 0 10px; opacity: 0; transition: all 0.5s; }
  .leaf.grown { opacity: 1; }
  .leaf-l { left: -20px; top: 10px; }
  .leaf-r { right: -20px; top: 30px; transform: scaleX(-1); }
  .leaf-l-2 { left: -15px; top: 50px; transform: rotate(-10deg); }
  .flower {
    width: 30px; height: 30px; background: radial-gradient(circle, #fff 30%, #f6e05e 100%);
    border-radius: 50%; position: absolute; top: -15px; left: -12px;
    transform: scale(0); transition: transform 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  }
  .flower.bloomed { transform: scale(1); }
  .water-btn {
    background: #4299e1; color: white; border: none; padding: 12px 24px;
    border-radius: 30px; font-weight: bold; cursor: pointer;
    display: flex; align-items: center; gap: 8px;
  }
  .water-btn:active { transform: scale(0.95); }

  /* --- Eraser --- */
  .eraser-container {
    position: relative; width: 320px; height: 180px; margin: 20px auto;
    border-radius: 10px; overflow: hidden; box-shadow: var(--shadow-soft);
    background: white; border: 8px solid white;
  }
  .hidden-text-under {
    position: absolute; width: 100%; height: 100%;
    display: flex; justify-content: center; align-items: center;
    font-weight: 900; font-size: 2.5rem; color: var(--gold);
    background: #fffaf0; z-index: 1; letter-spacing: 5px;
  }
  .scratch-canvas {
    position: absolute; top: 0; left: 0; width: 100%; height: 100%;
    z-index: 2; cursor: crosshair; touch-action: none;
  }

  /* --- Clock --- */
  .clock-spinner { margin-bottom: 30px; transition: transform 0.1s linear; cursor: ew-resize; }

  /* --- Checklist --- */
  .card-paper { background: #fff; padding: 40px; border-radius: 4px; box-shadow: var(--shadow-soft); max-width: 400px; width: 90%; }
  .checklist { display: flex; flex-direction: column; gap: 15px; text-align: left; margin-top: 20px; }
  .check-item-interactive {
    display: flex; gap: 15px; align-items: center; color: var(--text-main); font-size: 1.1rem;
    padding: 10px; border-radius: 8px; cursor: pointer; transition: background 0.2s;
  }
  .check-item-interactive:hover { background: var(--bg-gray); }
  .check-box {
    width: 24px; height: 24px; border: 2px solid #cbd5e0; border-radius: 50%;
    display: flex; justify-content: center; align-items: center; transition: all 0.2s;
  }
  .check-item-interactive.checked .check-box { background: var(--gold); border-color: var(--gold); }
  .check-item-interactive.checked span { text-decoration: line-through; color: var(--text-muted); }
  
  .instruction-small { font-size: 0.85rem; color: #a0aec0; margin-top: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; }

  /* --- Conclusion --- */
  .pulse-heart { animation: pulse 1.5s infinite; }
  .text-gold-dark { color: var(--gold-dark); }
  .text-dark { color: var(--text-main); }
  @keyframes pulse { 0% { transform: scale(1); } 50% { transform: scale(1.15); } 100% { transform: scale(1); } }
  .tiny-text { font-size: 0.8rem; margin-top: 30px; opacity: 0.6; color: var(--text-muted); }
  .spacer { height: 20px; }

  /* --- Animations --- */
  .fade-in { animation: fadeIn 1s forwards; opacity: 0; }
  .fade-in-slow { animation: fadeIn 2s forwards; opacity: 0; }
  .fade-in-up { animation: fadeInUp 0.8s forwards; opacity: 0; transform: translateY(20px); }
  .bounce { animation: bounce 2s infinite; margin-top: 10px; color: var(--gold); }

  @keyframes fadeIn { to { opacity: 1; } }
  @keyframes fadeInUp { to { opacity: 1; transform: translateY(0); } }
  @keyframes bounce { 0%, 20%, 50%, 80%, 100% {transform: translateY(0);} 40% {transform: translateY(-10px);} 60% {transform: translateY(-5px);} }

  /* Mobile Tweaks */
  @media (max-width: 600px) {
    h1.main-title { font-size: 2.5rem; }
    h2 { font-size: 1.8rem; }
    .card-paper { padding: 20px; }
    .letter-envelope { width: 100%; max-width: 300px; }
  }
`;

export default ImmersiveApology;

