import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase'; // Adjust path if necessary based on your project structure
import { resolveCardId } from '../../utils/slugs'; // Adjust path if necessary
import { Music, Volume2, VolumeX, Mic, MicOff, Wind, Fingerprint, Lock, Unlock, Key, Heart } from 'lucide-react';

// --- CUSTOM CSS STYLES ---
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=Lato:wght@300;400&display=swap');

  :root {
    --bg-deep: #050203;
    --bg-cosmic: #1a0b12;
    --accent-rose: #e11d48;
    --accent-glow: #fb7185;
    --text-main: #ffe4e6;
    --text-dim: #fda4af;
    --gold: #fbbf24;
  }

  * { box-sizing: border-box; }

  body, html {
    margin: 0;
    padding: 0;
    background-color: var(--bg-deep);
    color: var(--text-main);
    font-family: 'Lato', sans-serif;
    overflow: hidden; /* Prevent body scroll, handle in container */
  }

  h1, h2, h3 {
    font-family: 'Playfair Display', serif;
    font-weight: 700;
    margin: 0;
  }

  /* --- UTILITIES --- */
  .fade-in { animation: fadeIn 1.5s ease forwards; }
  .pulse { animation: pulse 2s infinite; }
  .spin-slow { animation: spin 8s linear infinite; }
  .hidden { display: none; }
  
  .flex-center {
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: column;
  }

  .abs-center {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
  }

  .text-glow {
    text-shadow: 0 0 10px rgba(251, 113, 133, 0.6), 0 0 20px rgba(225, 29, 72, 0.4);
  }

  /* --- SCROLL SNAP CONTAINER --- */
  .valentine-container {
    height: 100dvh;
    width: 100%;
    overflow-y: scroll;
    scroll-snap-type: y mandatory;
    scroll-behavior: smooth;
    position: relative;
    background: radial-gradient(circle at center, var(--bg-cosmic), var(--bg-deep));
  }

  /* Hide Scrollbar */
  .valentine-container::-webkit-scrollbar { display: none; }
  .valentine-container { -ms-overflow-style: none; scrollbar-width: none; }

  /* --- SECTIONS --- */
  .v-section {
    height: 100dvh;
    width: 100%;
    scroll-snap-align: start;
    position: relative;
    overflow: hidden;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  /* --- UI ELEMENTS --- */
  .overlay-ui {
    position: absolute;
    top: 20px;
    right: 20px;
    z-index: 100;
    display: flex;
    gap: 10px;
  }

  .icon-btn {
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 50%;
    width: 40px;
    height: 40px;
    display: flex;
    justify-content: center;
    align-items: center;
    color: white;
    cursor: pointer;
    backdrop-filter: blur(5px);
    transition: all 0.3s ease;
  }
  .icon-btn:hover { background: rgba(255, 255, 255, 0.2); }

  .music-badge {
    display: flex;
    align-items: center;
    gap: 10px;
    background: rgba(0, 0, 0, 0.6);
    padding: 5px 15px 5px 5px;
    border-radius: 30px;
    border: 1px solid rgba(255, 255, 255, 0.1);
  }
  .album-art-mini {
    width: 30px;
    height: 30px;
    border-radius: 50%;
    overflow: hidden;
  }
  .album-art-mini img { width: 100%; height: 100%; object-fit: cover; }
  .song-info { font-size: 0.8rem; display: flex; flex-direction: column; line-height: 1.1; }
  .song-title { font-weight: bold; color: white; }
  .song-artist { color: var(--text-dim); font-size: 0.7rem; }

  /* --- COMPONENT SPECIFIC --- */
  
  /* Section 1: Globe */
  .globe-container { width: 100%; height: 60vh; position: relative; z-index: 10; }
  .title-overlay { position: absolute; top: 15%; text-align: center; z-index: 20; width: 100%; pointer-events: none; }
  .title-main { font-size: 3rem; color: var(--text-main); margin-bottom: 10px; }
  .subtitle { font-size: 1.2rem; color: var(--text-dim); letter-spacing: 2px; text-transform: uppercase; }

  /* Section 4: Record Player */
  .record-player-container { position: relative; width: 300px; height: 300px; }
  .record {
    width: 100%; height: 100%;
    border-radius: 50%;
    background: #111;
    border: 2px solid #333;
    display: flex;
    justify-content: center;
    align-items: center;
    box-shadow: 0 10px 30px rgba(0,0,0,0.8);
    position: relative;
  }
  .record-label {
    width: 35%; height: 35%;
    border-radius: 50%;
    background: var(--accent-rose);
    overflow: hidden;
    position: relative;
    border: 4px solid #111;
  }
  .tonearm {
    position: absolute;
    top: -40px; right: -40px;
    width: 120px; height: 200px;
    pointer-events: auto;
    cursor: grab;
    transform-origin: top right;
    transition: transform 0.3s cubic-bezier(0.4, 2, 0.5, 1);
    z-index: 20;
  }
  .tonearm:active { cursor: grabbing; }
  .arm-body {
    width: 10px; height: 160px;
    background: #d1d5db;
    position: absolute; right: 20px; top: 20px;
    transform: rotate(15deg);
    border-radius: 5px;
    box-shadow: 2px 5px 10px rgba(0,0,0,0.5);
  }
  .arm-head {
    width: 30px; height: 50px;
    background: #374151;
    position: absolute; bottom: 20px; left: 10px;
    transform: rotate(-15deg);
    border-radius: 4px;
  }

  /* Section 9: Lock */
  .lock-container { cursor: pointer; transition: transform 0.5s; position: relative; }
  .key-drag {
    width: 60px; height: 60px;
    background: var(--accent-rose);
    border-radius: 50%;
    display: flex; justify-content: center; align-items: center;
    box-shadow: 0 0 20px rgba(225, 29, 72, 0.6);
    cursor: grab;
    z-index: 50;
  }
  .key-drag:active { cursor: grabbing; transform: scale(0.95); }

  /* Section 10: Promise & Form */
  .promise-card {
    background: rgba(0,0,0,0.6);
    backdrop-filter: blur(10px);
    padding: 40px;
    border-radius: 20px;
    border: 1px solid rgba(255,255,255,0.1);
    text-align: center;
    max-width: 500px;
    width: 90%;
  }
  .btn-group { display: flex; gap: 20px; margin-top: 30px; justify-content: center; }
  .btn-primary {
    background: var(--accent-rose);
    color: white;
    border: none;
    padding: 12px 40px;
    border-radius: 30px;
    font-size: 1.1rem;
    cursor: pointer;
    transition: transform 0.2s;
  }
  .btn-secondary {
    background: transparent;
    border: 2px solid rgba(255,255,255,0.3);
    color: white;
    padding: 12px 40px;
    border-radius: 30px;
    font-size: 1.1rem;
    cursor: pointer;
  }
  .btn-primary:hover, .btn-secondary:hover { transform: scale(1.05); }

  /* Canvas Fullscreen */
  .canvas-layer { position: absolute; top: 0; left: 0; width: 100%; height: 100%; touch-action: pan-y; }

  .heartbeat-pad {
    width: 120px;
    height: 120px;
    border-radius: 50%;
    border: 4px solid #333;
    display: flex;
    justify-content: center;
    align-items: center;
    margin-top: 40px;
    cursor: pointer;
    transition: all 0.3s;
    background: transparent;
    transform: scale(1);
  }
  .heartbeat-pad.active {
    border-color: #e11d48;
    background: rgba(225, 29, 72, 0.2);
    transform: scale(1.1);
    box-shadow: 0 0 30px rgba(225, 29, 72, 0.45);
    animation: heartbeatPulse 1.2s ease-in-out infinite;
  }

  /* Animations */
  @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes pulse { 0% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.1); opacity: 0.8; } 100% { transform: scale(1); opacity: 1; } }
  @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
  @keyframes heartbeatPulse {
    0%, 100% { transform: scale(1.06); }
    20% { transform: scale(1.16); }
    40% { transform: scale(1.08); }
    60% { transform: scale(1.14); }
  }
`;

// --- HELPER COMPONENT: LOADER ---
const Loader = () => (
  <div style={{
    height: '100vh', width: '100%', background: '#000', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#e11d48'
  }}>
    <Heart className="pulse" size={48} fill="#e11d48" />
  </div>
);

// --- SECTION 1: TRANSITION / GLOBE ---
const TransitionSection = ({ country, partnerCountry }) => {
  const globeRef = useRef(null);
  const rootRef = useRef(null);

  const startCountry = (country || 'US').toUpperCase();
  const endCountry = (partnerCountry || 'GB').toUpperCase();

  useEffect(() => {
    let scriptLoadAttempts = 0;
    const maxAttempts = 40;

    const loadScriptsSequentially = async () => {
      const scripts = [
        'https://cdn.amcharts.com/lib/5/index.js',
        'https://cdn.amcharts.com/lib/5/map.js',
        'https://cdn.amcharts.com/lib/5/themes/Animated.js',
        'https://cdn.amcharts.com/lib/5/geodata/worldLow.js'
      ];

      for (const scriptSrc of scripts) {
        await new Promise((resolve, reject) => {
          if (document.querySelector(`script[src="${scriptSrc}"]`)) {
            resolve(); return;
          }
          const script = document.createElement('script');
          script.src = scriptSrc;
          script.async = true;
          script.onload = resolve;
          script.onerror = reject;
          document.head.appendChild(script);
        });
      }
    };

    const initGlobe = () => {
      if (!window.am5 || !window.am5map || !window.am5themes_Animated || !window.am5geodata_worldLow) {
        if (scriptLoadAttempts < maxAttempts) {
          scriptLoadAttempts++;
          setTimeout(initGlobe, 500);
          return;
        }
        return;
      }

      try {
        if (rootRef.current) rootRef.current.dispose();

        const root = window.am5.Root.new(globeRef.current);
        rootRef.current = root;
        root.setThemes([window.am5themes_Animated.new(root)]);

        const chart = root.container.children.push(
          window.am5map.MapChart.new(root, {
            projection: window.am5map.geoOrthographic(),
            panX: "rotateX", panY: "rotateY",
            paddingBottom: 20, paddingTop: 20, paddingLeft: 20, paddingRight: 20
          })
        );

        // Ocean
        const backgroundSeries = chart.series.push(window.am5map.MapPolygonSeries.new(root, {}));
        backgroundSeries.mapPolygons.template.setAll({
          fill: window.am5.color(0x000000), fillOpacity: 0.1, strokeOpacity: 0
        });
        backgroundSeries.data.push({ geometry: window.am5map.getGeoRectangle(90, 180, -90, -180) });

        // Land
        const polygonSeries = chart.series.push(
          window.am5map.MapPolygonSeries.new(root, {
            geoJSON: window.am5geodata_worldLow, exclude: ["AQ"]
          })
        );
        polygonSeries.mapPolygons.template.setAll({
          tooltipText: "{name}",
          fill: window.am5.color(0x2d1b2e), 
          stroke: window.am5.color(0xff6b9d),
          strokeWidth: 0.5, fillOpacity: 0.8, interactive: true
        });

        const lineSeries = chart.series.push(window.am5map.MapLineSeries.new(root, {}));
        lineSeries.mapLines.template.setAll({
          stroke: window.am5.color(0xff6b9d), strokeWidth: 2, strokeOpacity: 1, strokeDasharray: [4, 4]
        });

        const pointSeries = chart.series.push(window.am5map.MapPointSeries.new(root, {}));
        pointSeries.bullets.push(function () {
          const circle = window.am5.Circle.new(root, {
            radius: 5, fill: window.am5.color(0xff6b9d), tooltipText: "{title}"
          });
          circle.animate({ key: "radius", from: 5, to: 10, duration: 1000, easing: window.am5.ease.out(window.am5.ease.cubic), loops: Infinity });
          circle.animate({ key: "opacity", from: 1, to: 0, duration: 1000, easing: window.am5.ease.out(window.am5.ease.cubic), loops: Infinity });
          return window.am5.Bullet.new(root, { sprite: circle });
        });

        const highlightCountries = () => {
          const startItem = polygonSeries.getDataItemById(startCountry);
          const endItem = polygonSeries.getDataItemById(endCountry);
          const points = [];
          pointSeries.data.setAll([]);
          lineSeries.data.setAll([]);

          if (startItem) {
            const geo = startItem.get("mapPolygon").geoCentroid();
            points.push(geo);
            pointSeries.data.push({ geometry: { type: "Point", coordinates: [geo.longitude, geo.latitude] }, title: "You" });
          }
          if (endItem) {
            const geo = endItem.get("mapPolygon").geoCentroid();
            points.push(geo);
            pointSeries.data.push({ geometry: { type: "Point", coordinates: [geo.longitude, geo.latitude] }, title: "Partner" });
          }

          if (points.length === 2) {
            lineSeries.data.push({
              geometry: { type: "LineString", coordinates: [[points[0].longitude, points[0].latitude], [points[1].longitude, points[1].latitude]] }
            });
            const midLon = (points[0].longitude + points[1].longitude) / 2;
            const midLat = (points[0].latitude + points[1].latitude) / 2;
            chart.animate({ key: "rotationX", to: -midLon, duration: 2000, easing: window.am5.ease.inOut(window.am5.ease.cubic) });
            chart.animate({ key: "rotationY", to: -midLat, duration: 2000, easing: window.am5.ease.inOut(window.am5.ease.cubic) });
          }
        };

        polygonSeries.events.on("datavalidated", highlightCountries);
        setTimeout(highlightCountries, 500);

        chart.animate({ key: "rotationX", from: 0, to: 360, duration: 60000, loops: Infinity });

      } catch (e) {
        console.error("Globe Error", e);
      }
    };

    loadScriptsSequentially().then(() => initGlobe());

    return () => {
      if (rootRef.current) rootRef.current.dispose();
    };
  }, [startCountry, endCountry]);

  return (
    <div className="v-section flex-center">
      <div ref={globeRef} className="globe-container" />
      <div className="title-overlay fade-in">
        <h2 className="title-main text-glow">You mean the world to me</h2>
        <p className="subtitle pulse">Scroll to begin our journey &darr;</p>
      </div>
    </div>
  );
};

// --- SECTION 2: CONSTELLATION ---
const ConstellationSection = ({ onComplete }) => {
  const canvasRef = useRef(null);
  const [completed, setCompleted] = useState(false);
  const stars = useRef([{id:1,x:0.3,y:0.35},{id:2,x:0.7,y:0.35},{id:3,x:0.5,y:0.8},{id:4,x:0.5,y:0.25}]);
  const activeLine = useRef(null);
  const connections = useRef([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    window.addEventListener('resize', resize);
    resize();

    const getStarPos = (s) => ({ x: s.x * canvas.width, y: s.y * canvas.height });

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height); // Use clearRect for transparent bg
      
      // Lines
      ctx.beginPath(); ctx.strokeStyle = '#f43f5e'; ctx.lineWidth = 2; ctx.lineCap = 'round';
      connections.current.forEach(c => {
        const s1 = stars.current.find(s => s.id === c.from);
        const s2 = stars.current.find(s => s.id === c.to);
        const p1 = getStarPos(s1); const p2 = getStarPos(s2);
        ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y);
      });
      ctx.stroke();

      if (activeLine.current) {
        const s = stars.current.find(s => s.id === activeLine.current.startStar);
        const p = getStarPos(s);
        ctx.beginPath(); ctx.strokeStyle = '#fda4af'; ctx.lineWidth = 1;
        ctx.moveTo(p.x, p.y); ctx.lineTo(activeLine.current.currentPos.x, activeLine.current.currentPos.y);
        ctx.stroke();
      }

      // Stars
      stars.current.forEach(star => {
        const pos = getStarPos(star);
        const glow = Math.sin(Date.now() / 500 + star.id) * 5 + 10;
        const gradient = ctx.createRadialGradient(pos.x, pos.y, 2, pos.x, pos.y, glow);
        gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
        gradient.addColorStop(0.5, 'rgba(251, 113, 133, 0.5)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = gradient;
        ctx.beginPath(); ctx.arc(pos.x, pos.y, glow, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(pos.x, pos.y, 3, 0, Math.PI * 2); ctx.fill();
      });
      animationFrameId = requestAnimationFrame(draw);
    };
    draw();
    return () => { window.removeEventListener('resize', resize); cancelAnimationFrame(animationFrameId); };
  }, [completed]);

  const getEventPos = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return { x: clientX - rect.left, y: clientY - rect.top };
  };

  const handleStart = (e) => {
    if (completed) return;
    const pos = getEventPos(e);
    const star = stars.current.find(s => {
      const sp = { x: s.x * canvasRef.current.width, y: s.y * canvasRef.current.height };
      return Math.hypot(pos.x - sp.x, pos.y - sp.y) < 40;
    });
    if (star) {
      activeLine.current = { startStar: star.id, currentPos: pos };
    }
  };

  const handleMove = (e) => {
    if (activeLine.current) {
      activeLine.current.currentPos = getEventPos(e);
    }
  };

  const handleEnd = () => {
    if (!activeLine.current) return;
    const pos = activeLine.current.currentPos;
    const star = stars.current.find(s => {
      const sp = { x: s.x * canvasRef.current.width, y: s.y * canvasRef.current.height };
      return Math.hypot(pos.x - sp.x, pos.y - sp.y) < 40;
    });
    if (star && star.id !== activeLine.current.startStar) {
        const exists = connections.current.some(c => (c.from === activeLine.current.startStar && c.to === star.id) || (c.from === star.id && c.to === activeLine.current.startStar));
        if (!exists) {
            connections.current.push({ from: activeLine.current.startStar, to: star.id });
            if (connections.current.length >= 4) setCompleted(true);
        }
    }
    activeLine.current = null;
  };

  return (
    <div className="v-section bg-cosmic">
      <canvas ref={canvasRef} className="canvas-layer"
        onMouseDown={handleStart} onMouseMove={handleMove} onMouseUp={handleEnd}
        onTouchStart={(e) => { e.preventDefault(); handleStart(e); }}
        onTouchMove={(e) => { e.preventDefault(); handleMove(e); }}
        onTouchEnd={(e) => { e.preventDefault(); handleEnd(); }}
        onTouchCancel={(e) => { e.preventDefault(); handleEnd(); }}
      />
      <div className="abs-center" style={{ pointerEvents: 'none', textAlign: 'center' }}>
        {completed ? (
            <h2 className="title-main text-glow fade-in">Our Love Design</h2>
        ) : (
            <p className="subtitle" style={{ opacity: 0.5 }}>Connect the stars</p>
        )}
      </div>
    </div>
  );
};

// --- SECTION 3: SPARK ---
const SparkSection = () => {
    const canvasRef = useRef(null);
    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        let particles = [];
        let animationFrameId;

        const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
        window.addEventListener('resize', resize);
        resize();

        class Particle {
            constructor(x, y) {
                this.x = x; this.y = y;
                const angle = Math.random() * Math.PI * 2;
                const speed = Math.random() * 5 + 2;
                this.vx = Math.cos(angle) * speed; this.vy = Math.sin(angle) * speed;
                this.life = 1.0; this.decay = Math.random() * 0.03 + 0.01;
                this.color = `hsl(${Math.random() * 40 + 340}, 100%, 70%)`;
                this.size = Math.random() * 3 + 1;
            }
            update() {
                this.x += this.vx; this.y += this.vy; this.vy += 0.1; this.life -= this.decay;
                return this.life > 0;
            }
            draw(ctx) {
                ctx.globalAlpha = this.life; ctx.fillStyle = this.color;
                ctx.beginPath(); ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1;
            }
        }

        const animate = () => {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.1)'; ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.globalCompositeOperation = 'lighter';
            particles = particles.filter(p => { if (p.update()) { p.draw(ctx); return true; } return false; });
            ctx.globalCompositeOperation = 'source-over';
            animationFrameId = requestAnimationFrame(animate);
        };
        animate();

        const addParticles = (e) => {
            const rect = canvas.getBoundingClientRect();
            const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
            const y = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top;
            for(let i=0; i<5; i++) particles.push(new Particle(x, y));
        };

        canvas.addEventListener('mousemove', addParticles);
        canvas.addEventListener('touchstart', addParticles, { passive: true });

        return () => { 
            window.removeEventListener('resize', resize); 
            cancelAnimationFrame(animationFrameId);
            canvas.removeEventListener('mousemove', addParticles);
            canvas.removeEventListener('touchstart', addParticles);
        };
    }, []);

    return (
        <div className="v-section">
            <canvas ref={canvasRef} className="canvas-layer" style={{ cursor: 'crosshair' }} />
            <div className="abs-center" style={{ pointerEvents: 'none' }}>
                <h2 className="title-main" style={{ opacity: 0.3 }}>Touch the spark</h2>
            </div>
        </div>
    );
};

// --- SECTION 4: PLAYLIST ---
const PlaylistSection = ({ onPlay, isPlaying, currentSong }) => {
    const armRef = useRef(null);
    const armRotation = isPlaying ? 25 : 0;

    const togglePlay = () => {
        const newState = !isPlaying;
        if(onPlay) onPlay(newState);
    };

    return (
        <div className="v-section flex-center" style={{ background: '#290f18' }}>
            <h2 className="title-main" style={{ marginBottom: '40px', zIndex: 10 }}>Our Soundtrack</h2>
            <div
                className="record-player-container"
                onClick={togglePlay}
                onTouchStart={(e) => { if (e.cancelable) e.preventDefault(); togglePlay(); }}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') togglePlay(); }}
                aria-label={isPlaying ? 'Pause soundtrack' : 'Play soundtrack'}
            >
                <div className={`record ${isPlaying ? 'spin-slow' : ''}`}>
                    {/* Grooves */}
                    <div style={{ position: 'absolute', inset: '10px', borderRadius: '50%', border: '1px solid #222' }}></div>
                    <div style={{ position: 'absolute', inset: '25px', borderRadius: '50%', border: '1px solid #222' }}></div>
                    <div style={{ position: 'absolute', inset: '40px', borderRadius: '50%', border: '1px solid #222' }}></div>
                    <div className="record-label flex-center">
                        {currentSong?.albumArt ? <img src={currentSong.albumArt} style={{width:'100%', height:'100%', objectFit:'cover', opacity:0.8}} /> : <Music size={32} color="#fff" />}
                    </div>
                    <div style={{ position: 'absolute', width: '15px', height: '15px', background: '#ccc', borderRadius: '50%' }}></div>
                </div>

                <div 
                    ref={armRef}
                    className="tonearm"
                    style={{ transform: `rotate(${armRotation}deg)` }}
                    onClick={(e) => { e.stopPropagation(); togglePlay(); }}
                    onTouchStart={(e) => { if (e.cancelable) e.preventDefault(); e.stopPropagation(); togglePlay(); }}
                >
                    <div style={{width: 60, height: 60, background: '#666', borderRadius: '50%', position: 'absolute', right: 0, top: 0, border: '4px solid #444'}}></div>
                    <div className="arm-body"></div>
                    <div className="arm-head"></div>
                </div>
            </div>
            <p className="subtitle pulse" style={{ marginTop: '30px' }}>
                {isPlaying ? 'Now Playing...' : 'Place the needle'}
            </p>
        </div>
    );
};

// --- SECTION 5: RED STRING ---
const RedStringSection = () => {
    const canvasRef = useRef(null);
    const audioContextRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        let points = [];
        let animationFrameId;
        const pointsCount = 20;

        const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; initPoints(); };
        const initPoints = () => {
            points = [];
            const spacing = canvas.width / (pointsCount - 1);
            const y = canvas.height / 2;
            for(let i=0; i<pointsCount; i++) {
                points.push({ x: i * spacing, y: y, oldX: i * spacing, oldY: y, pinned: i===0 || i===pointsCount-1 });
            }
        };
        window.addEventListener('resize', resize);
        resize();

        const update = () => {
            // Verlet Integration
            for(let i=0; i<pointsCount; i++) {
                let p = points[i];
                if(p.pinned) continue;
                const vx = (p.x - p.oldX) * 0.9;
                const vy = (p.y - p.oldY) * 0.9;
                p.oldX = p.x; p.oldY = p.y;
                p.x += vx; p.y += vy;
            }
            // Constraints
            for(let iter=0; iter<5; iter++) {
                for(let i=0; i<pointsCount-1; i++) {
                    const p1 = points[i]; const p2 = points[i+1];
                    const dx = p2.x - p1.x; const dy = p2.y - p1.y;
                    const dist = Math.sqrt(dx*dx + dy*dy);
                    const diff = (dist - (canvas.width / (pointsCount-1))) / dist * 0.5; // Tension
                    const offsetX = dx * diff * 0.5; const offsetY = dy * diff * 0.5;
                    if(!p1.pinned) { p1.x += offsetX; p1.y += offsetY; }
                    if(!p2.pinned) { p2.x -= offsetX; p2.y -= offsetY; }
                }
            }
        };

        const draw = () => {
            ctx.clearRect(0,0,canvas.width,canvas.height);
            // Orbs
            ctx.fillStyle = '#fda4af'; ctx.shadowBlur = 20; ctx.shadowColor = '#f43f5e';
            ctx.beginPath(); ctx.arc(points[0].x, points[0].y, 10, 0, Math.PI*2); ctx.fill();
            ctx.beginPath(); ctx.arc(points[pointsCount-1].x, points[pointsCount-1].y, 10, 0, Math.PI*2); ctx.fill();
            ctx.shadowBlur = 0;

            // String
            ctx.beginPath(); ctx.moveTo(points[0].x, points[0].y);
            for(let i=0; i<pointsCount-1; i++) {
                const xc = (points[i].x + points[i+1].x)/2; const yc = (points[i].y + points[i+1].y)/2;
                ctx.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
            }
            ctx.lineTo(points[pointsCount-1].x, points[pointsCount-1].y);
            ctx.strokeStyle = '#f43f5e'; ctx.lineWidth = 3; ctx.stroke();
            
            update();
            animationFrameId = requestAnimationFrame(draw);
        };
        draw();

        // Interaction
        const applyDrag = (clientX, clientY) => {
            const rect = canvas.getBoundingClientRect();
            const x = clientX - rect.left;
            const y = clientY - rect.top;

            // Simple: Pull the middle points towards mouse
            const mid = Math.floor(pointsCount / 2);
            // Only affect if close
            if (Math.abs(points[mid].x - x) < 100 && Math.abs(points[mid].y - y) < 100) {
                 points[mid].x = x;
                 points[mid].y = y;
                 // Play chime only occasionally or on first grab? Simplicity: Pluck sound
                 if (!audioContextRef.current) {
                    audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
                 }
                 if(Math.random() > 0.95) playChime();
            }
        };

        const handleMouseDrag = (e) => {
            applyDrag(e.clientX, e.clientY);
        };

        const handleTouchStart = (e) => {
            if (!e.touches?.length) return;
            // Mobile-safe interaction: tap/pluck without blocking vertical scroll.
            applyDrag(e.touches[0].clientX, e.touches[0].clientY);
        };

        const playChime = () => {
             const ctx = audioContextRef.current;
             if(ctx.state === 'suspended') ctx.resume();
             const osc = ctx.createOscillator();
             const gain = ctx.createGain();
             osc.frequency.setValueAtTime(440 + Math.random()*200, ctx.currentTime);
             gain.gain.setValueAtTime(0.05, ctx.currentTime);
             gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1);
             osc.connect(gain); gain.connect(ctx.destination);
             osc.start(); osc.stop(ctx.currentTime + 1);
        };

        canvas.addEventListener('mousemove', handleMouseDrag);
        canvas.addEventListener('touchstart', handleTouchStart, { passive: true });

        return () => { 
            window.removeEventListener('resize', resize); 
            cancelAnimationFrame(animationFrameId);
            canvas.removeEventListener('mousemove', handleMouseDrag);
            canvas.removeEventListener('touchstart', handleTouchStart);
        };
    }, []);

    return (
        <div className="v-section">
            <canvas ref={canvasRef} className="canvas-layer" />
            <div className="abs-center" style={{ pointerEvents:'none' }}><h2 className="title-main" style={{opacity:0.2}}>The Invisible String</h2></div>
        </div>
    );
};

// --- SECTION 6: SECRET MESSAGE ---
const SecretMessageSection = () => {
    const [pos, setPos] = useState({ x: -100, y: -100 });
    const containerRef = useRef(null);
    const handleMove = (e) => {
        const rect = containerRef.current.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        setPos({ x: clientX - rect.left, y: clientY - rect.top });
    };

    return (
        <div className="v-section" ref={containerRef} onMouseMove={handleMove} onTouchStart={handleMove} onTouchMove={handleMove} style={{ cursor: 'none', background: '#000' }}>
            <div className="abs-center" style={{ width: '80%', textAlign: 'center' }}>
                <h2 className="title-main" style={{ color: '#e11d48' }}>My Secret Love</h2>
                <p style={{ fontSize: '1.5rem', lineHeight: '1.6', color: '#fbcfe8' }}>
                    "In the darkness, you are my only light. Every moment without you is a shadow, but with you, everything shines."
                </p>
            </div>
            {/* Mask */}
            <div style={{
                position: 'absolute', inset: 0, pointerEvents: 'none',
                background: `radial-gradient(circle 230px at ${pos.x}px ${pos.y}px, transparent 0%, rgba(0,0,0,0.95) 35%, black 100%)`
            }} />
            {pos.x < 0 && <div className="abs-center pulse" style={{ pointerEvents:'none', color:'#555' }}>Shine a light...</div>}
        </div>
    );
};

// --- SECTION 7: WHISPER / PETALS ---
const WhisperSection = ({ imageUrl }) => {
    const canvasRef = useRef(null);
    const particles = useRef([]);
    
    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        let animationId;
        
        const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
        window.addEventListener('resize', resize);
        resize();

        // Init Petals
        for(let i=0; i<300; i++) {
            particles.current.push({
                x: Math.random() * canvas.width, y: Math.random() * canvas.height,
                vx: (Math.random()-0.5)*0.5, vy: (Math.random()-0.5)*0.5,
                size: Math.random()*15+10, rotation: Math.random()*360, color: '#e11d48'
            });
        }

        const animate = () => {
            ctx.clearRect(0,0,canvas.width,canvas.height);
            particles.current.forEach(p => {
                p.x += p.vx; p.y += p.vy;
                ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rotation*Math.PI/180);
                ctx.fillStyle = p.color; ctx.beginPath();
                ctx.ellipse(0, 0, p.size, p.size*0.6, 0, 0, Math.PI*2); ctx.fill();
                ctx.restore();
            });
            animationId = requestAnimationFrame(animate);
        };
        animate();
        return () => { window.removeEventListener('resize', resize); cancelAnimationFrame(animationId); };
    }, []);

    const blow = () => {
        const w = window.innerWidth; const h = window.innerHeight;
        particles.current.forEach(p => {
            const dx = p.x - w/2; const dy = p.y - h/2;
            const dist = Math.sqrt(dx*dx + dy*dy);
            if(dist > 0) { p.vx += (dx/dist)*15; p.vy += (dy/dist)*15; }
        });
    };

    return (
        <div className="v-section" style={{ background: '#4c0519' }}>
            <div className="abs-center" style={{ transform: 'translate(-50%, -50%) rotate(5deg)', padding: '10px', background: '#fff', boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }}>
                {imageUrl ? <img src={imageUrl} style={{ maxWidth: '80vw', maxHeight: '60vh', display: 'block' }} /> : <div style={{width: 300, height: 400, background: '#ddd', display:'flex', alignItems:'center', justifyContent:'center', color:'#888'}}>No Photo</div>}
            </div>
            <canvas ref={canvasRef} className="canvas-layer" style={{ pointerEvents: 'none' }} />
            <div className="abs-center" style={{ top: '85%' }}>
                <button onClick={blow} className="icon-btn" style={{ width: 80, height: 80, background: 'rgba(225, 29, 72, 0.8)' }}>
                    <Wind size={40} />
                </button>
                <p style={{ marginTop: 10, fontSize: '0.8rem', opacity: 0.7 }}>Tap to blow the petals</p>
            </div>
        </div>
    );
};

// --- SECTION 8: HEART SYNC ---
const HeartSyncSection = () => {
    const [active, setActive] = useState(false);
    const start = () => {
        if(navigator.vibrate) navigator.vibrate([100,100,100]);
        setActive(true);
    };
    const end = () => setActive(false);

    return (
        <div className="v-section bg-deep flex-center">
            <h2 className={`title-main ${active ? 'text-glow' : ''}`} style={{ transition: 'all 0.5s' }}>
                {active ? "Our Hearts Beat as One" : "Place your thumb here"}
            </h2>
            <div 
                onMouseDown={start} onMouseUp={end} onMouseLeave={end}
                onTouchStart={(e)=>{ e.preventDefault(); start(); }}
                onTouchEnd={(e)=>{ e.preventDefault(); end(); }}
                onTouchCancel={(e)=>{ e.preventDefault(); end(); }}
                className={`heartbeat-pad ${active ? 'active' : ''}`}
            >
                <Fingerprint size={60} color={active ? '#e11d48' : '#666'} />
                {active && <div className="abs-center" style={{ width: 120, height: 120, borderRadius: '50%', border: '1px solid #e11d48', animation: 'ping 1s infinite' }} />}
            </div>
            <style>{`@keyframes ping { 75%, 100% { transform: scale(2); opacity: 0; } }`}</style>
        </div>
    );
};

// --- SECTION 9: LOCK ---
const LockSection = ({ onUnlock }) => {
    const [unlocked, setUnlocked] = useState(false);
    const [pos, setPos] = useState({x:0, y:0});
    const [dragging, setDragging] = useState(false);
    const lockRef = useRef(null);

    const handleMove = (e) => {
        if(!dragging || unlocked) return;
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        // Simple drag logic, just following cursor visualy relative to start
        // To simplify, we calculate distance to Lock Center
        const lockRect = lockRef.current.getBoundingClientRect();
        const lockCx = lockRect.left + lockRect.width/2;
        const lockCy = lockRect.top + lockRect.height/2;
        
        const dist = Math.hypot(clientX - lockCx, clientY - lockCy);
        
        // Update key visual position
        // We use fixed positioning for the key when dragging to make it follow cursor exactly
        setPos({x: clientX, y: clientY});

        if(dist < 80) {
            setUnlocked(true);
            setDragging(false);
            if(onUnlock) onUnlock();
        }
    };

    const startDrag = (e) => {
        if(unlocked) return;
        setDragging(true);
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        setPos({x: clientX, y: clientY});
    };

    return (
        <div className="v-section flex-center" onMouseMove={handleMove} onTouchMove={handleMove} onMouseUp={()=>setDragging(false)} onTouchEnd={()=>setDragging(false)}>
            <div ref={lockRef} className="lock-container">
                {unlocked ? <Unlock size={120} color="#e11d48" className="text-glow" /> : <Lock size={120} color="#555" />}
            </div>
            
            <h2 className="title-main" style={{ marginTop: 40, opacity: unlocked ? 1 : 0.5 }}>
                {unlocked ? "Forever Yours" : "Unlock My Heart"}
            </h2>

            {!unlocked && (
                <div 
                    className="key-drag pulse"
                    style={{ 
                        position: dragging ? 'fixed' : 'relative', 
                        left: dragging ? pos.x : 'auto', 
                        top: dragging ? pos.y : 'auto', 
                        transform: dragging ? 'translate(-50%, -50%)' : 'none',
                        marginTop: dragging ? 0 : 60
                    }}
                    onMouseDown={startDrag} onTouchStart={startDrag}
                >
                    <Key size={30} color="white" />
                </div>
            )}
            {!dragging && !unlocked && <p className="subtitle" style={{marginTop: 20, fontSize: '0.8rem'}}>Drag the key</p>}
        </div>
    );
};

// --- SECTION 10: PROMISE & RESPONSE ---
const PromiseSection = ({ name, onResponse, onResetResponse, isSaving, hasResponse, savedAnswer }) => {
    return (
        <div className="v-section flex-center" style={{ background: '#000' }}>
            {/* Ember background canvas could go here, simplifying to CSS particles for performance in one file */}
            <div style={{ position:'absolute', inset:0, opacity: 0.3, background: 'radial-gradient(circle, #222 1px, transparent 1px)', backgroundSize: '30px 30px' }}></div>
            
            <div className="promise-card fade-in">
                <h1 className="title-main text-glow" style={{ fontSize: '2.5rem', marginBottom: 20 }}>Happy Valentine's Day</h1>
                <h2 className="title-main" style={{ color: '#fff' }}>{name || "My Love"}</h2>
                <div style={{ width: 100, height: 1, background: 'var(--accent-rose)', margin: '20px auto' }}></div>
                <p style={{ fontSize: '1.2rem', fontStyle: 'italic', color: '#fbcfe8', lineHeight: 1.6 }}>
                    "I promise to love you in every universe, in every timeline, and in every moment still to come."
                </p>

                <div style={{ marginTop: 40 }}>
                    {!hasResponse ? (
                        <>
                            <p style={{marginBottom: 20, fontWeight: 'bold'}}>Will you be my Valentine?</p>
                            <div className="btn-group">
                                <button className="btn-primary" onClick={() => onResponse(true)} disabled={isSaving}>Yes</button>
                                <button className="btn-secondary" onClick={() => onResponse(false)} disabled={isSaving}>No</button>
                            </div>
                        </>
                    ) : (
                        <div style={{ marginTop: 20, padding: 10, border: '1px solid rgba(255,255,255,0.2)', borderRadius: 10 }}>
                            <p>You said: <span style={{ color: savedAnswer ? '#34d399' : '#f87171', fontWeight: 'bold', fontSize: '1.2rem' }}>{savedAnswer ? 'Yes' : 'No'}</span></p>
                            <div className="btn-group" style={{ marginTop: 16 }}>
                                <button
                                    className="btn-secondary"
                                    onClick={onResetResponse}
                                    disabled={isSaving}
                                >
                                    Reset Response
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// --- MAIN VIEW COMPONENT ---
const ValentineView = () => {
  const { id } = useParams();
  const [valentine, setValentine] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isSavingResponse, setIsSavingResponse] = useState(false);
  const audioRef = useRef(null);
  const songSource = useMemo(() => {
    return valentine?.song?.previewUrl || valentine?.song?.url || valentine?.song?.audioUrl || '';
  }, [valentine]);

  // Data Fetching
  useEffect(() => {
    const fetchValentine = async () => {
      try {
        const result = await resolveCardId(id, 'valentines', 'valentine');
        if (!result) { setError('Valentine not found'); setLoading(false); return; }
        const unsubscribe = onSnapshot(doc(db, 'valentines', result.id), (doc) => {
          if (doc.exists()) {
            setValentine({ ...doc.data(), id: result.id });
          } else { setError('Valentine not found'); }
          setLoading(false);
        });
        return () => unsubscribe();
      } catch (err) { console.error(err); setError('Error loading valentine'); setLoading(false); }
    };
    fetchValentine();
  }, [id]);

  useEffect(() => {
    if (!songSource) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      setIsPlaying(false);
      return;
    }

    if (!audioRef.current || audioRef.current.src !== songSource) {
      if (audioRef.current) audioRef.current.pause();
      const audio = new Audio(songSource);
      audio.loop = true;
      audio.preload = 'auto';
      audioRef.current = audio;
    }
  }, [songSource]);

  useEffect(() => {
    if (!audioRef.current) return;
    audioRef.current.muted = isMuted;
  }, [isMuted]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.play().catch((err) => {
        console.error('Audio playback failed:', err);
        setIsPlaying(false);
      });
    } else {
      audio.pause();
    }
  }, [isPlaying, songSource]);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const handleResponse = async (answer) => {
    if (!valentine?.id || isSavingResponse) return;
    try {
      setIsSavingResponse(true);
      await updateDoc(doc(db, 'valentines', valentine.id), {
        response: { answer, respondedAt: Date.now() }
      });
    } catch (err) { console.error(err); } 
    finally { setIsSavingResponse(false); }
  };

  const handleResetResponse = async () => {
    if (!valentine?.id || isSavingResponse) return;
    try {
      setIsSavingResponse(true);
      await updateDoc(doc(db, 'valentines', valentine.id), {
        response: null
      });
    } catch (err) {
      console.error(err);
    } finally {
      setIsSavingResponse(false);
    }
  };

  const handlePlaybackToggle = async (nextState) => {
    const shouldPlay = typeof nextState === 'boolean' ? nextState : !isPlaying;
    const audio = audioRef.current;
    if (!audio) {
      setIsPlaying(false);
      return;
    }

    if (shouldPlay) {
      try {
        audio.muted = isMuted;
        await audio.play();
        setIsPlaying(true);
      } catch (err) {
        console.error('Audio playback failed:', err);
        setIsPlaying(false);
      }
      return;
    }

    audio.pause();
    setIsPlaying(false);
  };

  if (loading) return <Loader />;
  if (error) return <div className="flex-center" style={{height:'100vh', color:'white'}}>{error}</div>;

  const hasResponse = valentine?.response?.answer !== undefined;

  return (
    <>
      <style>{styles}</style>
      <div className="valentine-container">
        
        {/* Persistent Music UI */}
        {valentine.song && (
            <div className="overlay-ui">
                <div className="music-badge">
                    <div className={`album-art-mini ${isPlaying ? 'spin-slow' : ''}`}>
                        {valentine.song.albumArt ? <img src={valentine.song.albumArt} /> : <div style={{background:'#333', width:'100%', height:'100%'}}/>}
                    </div>
                    <div className="song-info">
                        <span className="song-title">{valentine.song.name}</span>
                        <span className="song-artist">{valentine.song.artist}</span>
                    </div>
                </div>
                <button className="icon-btn" onClick={() => setIsMuted(!isMuted)}>
                    {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                </button>
            </div>
        )}

        {/* 1. Transition */}
        <TransitionSection country={valentine.country} partnerCountry={valentine.partnerCountry} />

        {/* 2. Constellation */}
        <ConstellationSection />

        {/* 3. Spark */}
        <SparkSection />

        {/* 4. Playlist */}
        <PlaylistSection 
            isPlaying={isPlaying} 
            onPlay={handlePlaybackToggle} 
            currentSong={valentine.song} 
        />

        {/* 5. Red String */}
        <RedStringSection />

        {/* 6. Secret Message */}
        <SecretMessageSection />

        {/* 7. Whisper */}
        <WhisperSection imageUrl={valentine.imageUrl} />

        {/* 8. Heart Sync */}
        <HeartSyncSection />

        {/* 9. Lock */}
        <LockSection />

        {/* 10. Promise & Response */}
        <PromiseSection 
            name={valentine.name}
            onResponse={handleResponse}
            onResetResponse={handleResetResponse}
            isSaving={isSavingResponse}
            hasResponse={hasResponse}
            savedAnswer={valentine.response?.answer}
        />

      </div>
    </>
  );
};

export default ValentineView;
