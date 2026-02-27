import * as React from 'react';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Piano3DView.css';

// ─── Audio ─────────────────────────────────────────────────────────────────────
const midiToFreq = (m) => 440 * 2 ** ((m - 69) / 12);

const computeLowNoteAttenuation = (midiNote) => {
    if (midiNote <= 48) return 0.20;
    if (midiNote <= 55) return 0.32;
    if (midiNote <= 59) return 0.45;
    return 1;
};

function makeAudio() {
    try {
        const Ctx = window.AudioContext || window['webkitAudioContext'];
        if (!Ctx) return null;
        const ctx = new Ctx();
        const master = ctx.createGain();
        master.gain.value = 0.68; // Matching PianoLoveTool exactly
        master.connect(ctx.destination);
        return { ctx, master };
    } catch { return null; }
}

function synthNote(audio, midi, dur = 0.28) {
    if (!audio) return;
    try {
        const { ctx, master } = audio;
        if (ctx.state === 'suspended') ctx.resume();

        const freq = midiToFreq(midi);
        const lowNoteAttenuation = computeLowNoteAttenuation(midi);
        const oscFundamental = ctx.createOscillator();
        const oscWarmth = ctx.createOscillator();

        // @ts-ignore
        oscFundamental.type = 'sine';
        // @ts-ignore
        oscWarmth.type = 'sine';

        oscFundamental.frequency.setValueAtTime(freq, ctx.currentTime);
        oscWarmth.frequency.setValueAtTime(freq / 2, ctx.currentTime);

        const hpf = ctx.createBiquadFilter();
        hpf.type = 'highpass';
        hpf.frequency.value = 120;

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 1000;

        const gainNode = ctx.createGain();
        const end = ctx.currentTime + Math.max(1.5, dur + 0.5);

        gainNode.gain.setValueAtTime(0, ctx.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.46 * lowNoteAttenuation, ctx.currentTime + 0.05);
        gainNode.gain.exponentialRampToValueAtTime(0.001, end);

        const fundamentalGain = ctx.createGain();
        fundamentalGain.gain.value = 1;

        const warmthGain = ctx.createGain();
        warmthGain.gain.value = 0.18;

        oscFundamental.connect(fundamentalGain);
        oscWarmth.connect(warmthGain);
        fundamentalGain.connect(gainNode);
        warmthGain.connect(gainNode);
        gainNode.connect(hpf);
        hpf.connect(filter);
        filter.connect(master);

        oscFundamental.start(); oscWarmth.start();
        oscFundamental.stop(end);
        oscWarmth.stop(end);
    } catch { /* ignore */ }
}

// ─── Piano geometry constants ──────────────────────────────────────────────────
const WHITE_KEYS = [60, 62, 64, 65, 67, 69, 71];
const BLACK_KEYS = [{ midi: 61, slot: 0.5 }, { midi: 63, slot: 1.5 }, { midi: 66, slot: 3.5 }, { midi: 68, slot: 4.5 }, { midi: 70, slot: 5.5 }];
const WW = 0.135, WH = 0.065, WD = 0.68;
const BW = 0.082, BH = 0.096, BD = 0.41;
const NOTE_COLORS = [0x38bdf8, 0xf472b6, 0xfcd34d, 0x6ee7b7, 0xa78bfa, 0xff7f50, 0xc084fc];
const FALL_H = 3.5;               // distance notes fall before hitting piano
const FALL_SECS = 2.5;            // seconds to fall that distance
const LEAD_MS = 1200;

// ─── Component ─────────────────────────────────────────────────────────────────
export default function Piano3DView() {
    const navigate = useNavigate();
    const mountRef = useRef(null);   // div for sizing
    const disposerRef = useRef(null);// cleanup function
    const stateRef = useRef({
        playing: false, playStart: null,
        played: new Set(), falling: [],
        keyFlash: {},
    });

    const audioRef = useRef(null);
    const [placed, setPlaced] = useState(false);
    const [playing, setPlaying] = useState(false);
    const [status, setStatus] = useState('Tap to place piano');

    // ── Song data from sessionStorage (no Firestore) ──────────────────────────
    const songNotes = React.useMemo(() => {
        try { return JSON.parse(sessionStorage.getItem('piano3d-notes') || '[]'); }
        catch { return []; }
    }, []);
    const songLabel = React.useMemo(() => {
        try { return sessionStorage.getItem('piano3d-label') || ''; }
        catch { return ''; }
    }, []);

    // ── Three.js setup ─────────────────────────────────────────────────────────
    useEffect(() => {
        let canceled = false;

        // Lazy-import Three.js to avoid top-level crash if not installed
        import('three').then((THREE) => {
            if (canceled) return;
            const mount = mountRef.current;
            if (!mount) return;

            const W = mount.clientWidth || window.innerWidth;
            const H = mount.clientHeight || window.innerHeight;

            // ── Renderer ───────────────────────────────────────────────────────
            const renderer = new THREE.WebGLRenderer({ antialias: true });
            renderer.setSize(W, H);
            renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
            renderer.shadowMap.enabled = true;
            renderer.shadowMap.type = THREE.PCFSoftShadowMap;
            mount.appendChild(renderer.domElement);

            // ── Scene ──────────────────────────────────────────────────────────
            const scene = new THREE.Scene();
            scene.background = new THREE.Color(0x0a0a0f);
            // Subtle fog
            scene.fog = new THREE.Fog(0x0a0a0f, 6, 22);

            // ── Camera ─────────────────────────────────────────────────────────
            const cam = new THREE.PerspectiveCamera(52, W / H, 0.01, 40);
            cam.position.set(0, 0.85, 2.1);
            cam.lookAt(0, 0, 0);

            // ── Lights ────────────────────────────────────────────────────────
            scene.add(new THREE.AmbientLight(0x223044, 0.9));

            const key = new THREE.DirectionalLight(0xffffff, 1.5);
            key.position.set(2, 5, 3);
            key.castShadow = true;
            key.shadow.mapSize.set(1024, 1024);
            key.shadow.camera.near = 0.5;
            key.shadow.camera.far = 20;
            scene.add(key);

            const fill = new THREE.DirectionalLight(0x7090ff, 0.5);
            fill.position.set(-3, 2, 1);
            scene.add(fill);

            const rim = new THREE.DirectionalLight(0xff88cc, 0.3);
            rim.position.set(0, -1, -3);
            scene.add(rim);

            // Studio glow from below (stage effect)
            const ptLight = new THREE.PointLight(0x4080ff, 0.8, 6);
            ptLight.position.set(0, -0.5, 0.5);
            scene.add(ptLight);

            // ── Stage floor ────────────────────────────────────────────────────
            const floorGeo = new THREE.PlaneGeometry(10, 10);
            const floorMat = new THREE.MeshStandardMaterial({ color: 0x0d0d18, metalness: 0.6, roughness: 0.4 });
            const floor = new THREE.Mesh(floorGeo, floorMat);
            floor.rotation.x = -Math.PI / 2;
            floor.position.y = -0.16;
            floor.receiveShadow = true;
            scene.add(floor);

            // ── Piano group ────────────────────────────────────────────────────
            const pianoGroup = new THREE.Group();
            scene.add(pianoGroup);

            const totalW = WHITE_KEYS.length * WW;
            const keyMap = {}; // midi => { mesh, origMat }

            // White keys
            WHITE_KEYS.forEach((midi, i) => {
                const mat = new THREE.MeshStandardMaterial({ color: 0xf5f0e8, roughness: 0.25, metalness: 0.05 });
                const mesh = new THREE.Mesh(new THREE.BoxGeometry(WW - 0.003, WH, WD), mat);
                mesh.position.set(-totalW / 2 + i * WW + WW / 2, 0, 0);
                mesh.castShadow = true;
                mesh.receiveShadow = true;
                mesh.userData.midi = midi;
                pianoGroup.add(mesh);
                keyMap[midi] = { mesh, origMat: mat };
            });

            // Black keys
            BLACK_KEYS.forEach(({ midi, slot }) => {
                const mat = new THREE.MeshStandardMaterial({ color: 0x0d0d0d, roughness: 0.3, metalness: 0.15 });
                const mesh = new THREE.Mesh(new THREE.BoxGeometry(BW, BH, BD), mat);
                mesh.position.set(-totalW / 2 + slot * WW + WW / 2, BH / 2, -(WD - BD) / 2 + 0.015);
                mesh.castShadow = true;
                mesh.userData.midi = midi;
                pianoGroup.add(mesh);
                keyMap[midi] = { mesh, origMat: mat };
            });

            // Piano body
            const bodyMat = new THREE.MeshStandardMaterial({ color: 0x0c0b0a, roughness: 0.15, metalness: 0.6 });
            const body = new THREE.Mesh(new THREE.BoxGeometry(totalW + 0.05, 0.06, WD + 0.04), bodyMat);
            body.position.set(0, -0.062, 0);
            body.receiveShadow = true;
            pianoGroup.add(body);

            pianoGroup.position.set(0, -0.38, -0.1);

            // ── Materials for active/flash keys ───────────────────────────────
            const flashMats = {
                active: new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x0284c7, emissiveIntensity: 0.8, roughness: 0.3 }),
                white: new THREE.MeshStandardMaterial({ color: 0xf5f0e8, roughness: 0.25 }),
                black: new THREE.MeshStandardMaterial({ color: 0x0d0d0d, roughness: 0.3 }),
            };

            // ── Falling note meshes pool ───────────────────────────────────────
            const fallingNotes = []; // { mesh, midi, startMs }

            function spawnFallingNote(midi) {
                const kd = keyMap[midi];
                if (!kd) return;
                const isBlack = BLACK_KEYS.some(b => b.midi === midi);
                const w = isBlack ? BW * 0.88 : WW * 0.88;
                const d = isBlack ? BD * 0.88 : WD * 0.88;
                const color = NOTE_COLORS[midi % NOTE_COLORS.length];
                const mat = new THREE.MeshStandardMaterial({
                    color, emissive: color, emissiveIntensity: 0.35,
                    transparent: true, opacity: 0.92, roughness: 0.4
                });
                const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, 0.048, d), mat);
                // Start above piano, aligned with key X position
                const keyPos = kd.mesh.position;
                mesh.position.set(
                    keyPos.x + pianoGroup.position.x,
                    pianoGroup.position.y + FALL_H,
                    keyPos.z + pianoGroup.position.z
                );
                mesh.castShadow = true;
                scene.add(mesh);
                fallingNotes.push({ mesh, midi, startMs: performance.now() });
            }

            function flashKey(midi) {
                const kd = keyMap[midi];
                if (!kd) return;
                kd.mesh.material = flashMats.active;
                clearTimeout(stateRef.current.keyFlash[midi]);
                stateRef.current.keyFlash[midi] = setTimeout(() => {
                    if (kd.mesh) kd.mesh.material = kd.origMat;
                }, 300);
            }

            // ── Resize handler ─────────────────────────────────────────────────
            const onResize = () => {
                const w = mount.clientWidth || window.innerWidth;
                const h = mount.clientHeight || window.innerHeight;
                cam.aspect = w / h;
                cam.updateProjectionMatrix();
                renderer.setSize(w, h);
            };
            window.addEventListener('resize', onResize);

            // ── Render loop ────────────────────────────────────────────────────
            let rafId;
            let lastTime = performance.now();

            const loop = (now) => {
                rafId = requestAnimationFrame(loop);
                const dt = Math.min((now - lastTime) / 1000, 0.1); // cap delta to 100ms
                lastTime = now;

                const s = stateRef.current;

                // Move falling notes down
                const speed = FALL_H / FALL_SECS;
                for (let i = fallingNotes.length - 1; i >= 0; i--) {
                    const fn = fallingNotes[i];
                    fn.mesh.position.y -= dt * speed;
                    // Fade out near the piano surface
                    const distToPiano = fn.mesh.position.y - (pianoGroup.position.y + 0.05);
                    fn.mesh.material.opacity = Math.min(0.92, Math.max(0, distToPiano * 2));
                    if (fn.mesh.position.y < pianoGroup.position.y - 0.25) {
                        scene.remove(fn.mesh);
                        fn.mesh.geometry.dispose();
                        fn.mesh.material.dispose();
                        fallingNotes.splice(i, 1);
                    }
                }

                // Auto-play tick
                if (s.playing && s.playStart !== null) {
                    const elapsed = now - s.playStart - LEAD_MS;
                    for (let i = 0; i < songNotes.length; i++) {
                        if (s.played.has(i)) continue;
                        const n = songNotes[i];
                        const tMs = n.atMs != null ? n.atMs : (n.time ?? 0) * 1000;
                        if (tMs <= elapsed && tMs > elapsed - 160) {
                            s.played.add(i);
                            synthNote(audioRef.current, n.originalMidi ?? n.midi, n.duration ?? 0.25);
                            spawnFallingNote(n.midi);
                            flashKey(n.midi);
                        }
                    }
                    // End detection
                    if (songNotes.length > 0) {
                        const last = songNotes[songNotes.length - 1];
                        const lastMs = last.atMs ?? (last.time ?? 0) * 1000;
                        if (elapsed > lastMs + 2500) {
                            s.playing = false;
                            s.playStart = null;
                            setPlaying(false);
                            setStatus('Tap ▶ to replay');
                        }
                    }
                }

                // Gentle piano bob animation while playing
                if (s.playing) {
                    pianoGroup.rotation.y = Math.sin(now * 0.0004) * 0.015;
                }

                renderer.render(scene, cam);
            };
            rafId = requestAnimationFrame(loop);

            // ── Click-to-place / play handler (set on stateRef so it can be called from React) ──
            stateRef.current._place = () => {
                stateRef.current.placed = true;
                // Nothing extra for Three.js — piano is already in scene
            };
            stateRef.current._startPlay = () => {
                if (!audioRef.current) audioRef.current = makeAudio();
                audioRef.current?.ctx?.resume?.();
                const s = stateRef.current;
                s.played.clear();
                // Remove existing falling notes
                fallingNotes.forEach(fn => {
                    scene.remove(fn.mesh);
                    fn.mesh.geometry.dispose();
                    fn.mesh.material.dispose();
                });
                fallingNotes.length = 0;
                // Reset key colours
                Object.values(keyMap).forEach(kd => { kd.mesh.material = kd.origMat; });
                s.playStart = performance.now();
                s.playing = true;
                setPlaying(true);
                setStatus('♪ Playing…');
            };
            stateRef.current._stopPlay = () => {
                const s = stateRef.current;
                s.playing = false;
                s.playStart = null;
                setPlaying(false);
                setStatus('Tap ▶ to play again');
            };

            // ── Cleanup ────────────────────────────────────────────────────────
            disposerRef.current = () => {
                cancelAnimationFrame(rafId);
                window.removeEventListener('resize', onResize);
                fallingNotes.forEach(fn => { fn.mesh.geometry.dispose(); fn.mesh.material.dispose(); });
                renderer.dispose();
                if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
            };
        });

        return () => {
            canceled = true;
            disposerRef.current?.();
            disposerRef.current = null;
            // Don't reset initedRef — we don't want to re-init on StrictMode second run
        };
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // ── React tap handler ──────────────────────────────────────────────────────
    const handleTap = (e) => {
        e.preventDefault();
        if (!placed) {
            setPlaced(true);
            stateRef.current._place?.();
            if (songNotes.length > 0) {
                setStatus('Starting…');

                // Helper to wait for Three.js to finish loading and binding _startPlay
                const tryStart = (retries = 20) => {
                    if (stateRef.current._startPlay) {
                        stateRef.current._startPlay();
                    } else if (retries > 0) {
                        setTimeout(() => tryStart(retries - 1), 100);
                    } else {
                        setStatus('Failed to load 3D engine');
                    }
                };

                setTimeout(() => tryStart(), 650);
            } else {
                setStatus('No song data');
            }
        } else if (!playing && songNotes.length > 0) {
            stateRef.current._startPlay?.();
        }
    };

    const handleStop = (e) => {
        e.stopPropagation();
        stateRef.current._stopPlay?.();
    };

    return (
        <div className="piano3d-root">
            {/* Three.js renders into this div */}
            <div ref={mountRef} className="piano3d-mount-fill" />

            {/* UI overlay */}
            <div className="piano3d-ui">
                <div className="piano3d-topbar">
                    <button className="piano3d-back-btn" onClick={() => { disposerRef.current?.(); navigate(-1); }}>← Back</button>
                    <div className="piano3d-song-label" title={songLabel}>{songLabel || '3D Piano'}</div>
                    {placed && (
                        <button
                            className={`piano3d-auto-btn${playing ? ' active' : ''}`}
                            onClick={playing ? handleStop : (e) => { e.stopPropagation(); stateRef.current._startPlay?.(); }}
                        >
                            {playing ? '■ Stop' : '▶ Play'}
                        </button>
                    )}
                </div>

                {!placed ? (
                    <div className="piano3d-place-hint" onClick={handleTap} style={{ cursor: 'pointer', pointerEvents: 'all' }}>
                        <div className="piano3d-place-dot" />
                        <span>Tap to start 3D view</span>
                    </div>
                ) : (
                    <div className="piano3d-hint">{status}</div>
                )}
            </div>

            {/* Full-screen tap target (behind UI) */}
            {!placed && (
                <div
                    style={{ position: 'absolute', inset: 0, zIndex: 5, cursor: 'pointer' }}
                    onClick={handleTap}
                    onTouchEnd={handleTap}
                />
            )}
        </div>
    );
}
