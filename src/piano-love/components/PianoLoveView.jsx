import * as React from 'react';
import { useState, useEffect, useRef, useCallback, useMemo, Suspense } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { signInWithCustomToken, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { Play, Square, Download, Instagram, Box } from 'lucide-react';
import { auth } from '../../firebase';
import CardViewHeader from '../../components/CardViewHeader';
import LoadingSpinner from '../../components/LoadingSpinner';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { normalizeCardData, resolveCardId } from '../../utils/slugs';
import './PianoLoveTool.css';

// Lazy load heavy dependencies
const loadHtml2Canvas = () => import('html2canvas');
const loadLottie = () => import('lottie-react');
const loadAnimationData = () => import('../../assets/animations/complete.json');

const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const PRE_HIT_SECONDS = 0.25;
const FALL_SPEED = 220;

const computeLowNoteAttenuation = (midiNote) => {
    if (midiNote <= 48) return 0.20;
    if (midiNote <= 55) return 0.32;
    if (midiNote <= 59) return 0.45;
    return 1;
};

function generateKeyLayout() {
    const startMidi = 60; // C4
    const endMidi = 71;   // B4

    let whiteKeyCount = 7;
    const whiteKeyWidth = 100 / whiteKeyCount;
    let currentWhiteIndex = 0;
    const layout = [];

    for (let m = startMidi; m <= endMidi; m++) {
        const noteName = NOTES[m % 12];
        const isBlack = noteName.includes('#');

        if (!isBlack) {
            const left = `${currentWhiteIndex * whiteKeyWidth}%`;
            const width = `${whiteKeyWidth}%`;
            const xPct = currentWhiteIndex * whiteKeyWidth;
            const wPct = whiteKeyWidth;

            layout.push({ midi: m, isBlack: false, left, width, noteName, xPct, wPct });
            currentWhiteIndex++;
        } else if (['C#', 'F#', 'G#'].includes(noteName)) {
            const wPct = whiteKeyWidth * 0.6;
            const xPct = (currentWhiteIndex * whiteKeyWidth) - (wPct / 2);

            layout.push({ midi: m, isBlack: true, left: `${xPct}%`, width: `${wPct}%`, noteName, xPct, wPct });
        }
    }
    return layout;
}

const midiToFrequency = (midi) => 440 * (2 ** ((midi - 69) / 12));

const ensureAudioContext = (audioContextRef, masterRef) => {
    if (!audioContextRef.current) {
        // @ts-ignore
        const context = new (window.AudioContext || window.webkitAudioContext)();
        const master = context.createGain();
        master.gain.value = 0.68;
        master.connect(context.destination);
        audioContextRef.current = context;
        masterRef.current = master;
    }

    if (audioContextRef.current.state === 'suspended') {
        audioContextRef.current.resume().catch(() => { });
    }
};

const ensureMediaDestination = (audioContextRef, masterRef, mediaDestRef) => {
    ensureAudioContext(audioContextRef, masterRef);
    if (!mediaDestRef.current) {
        try {
            mediaDestRef.current = audioContextRef.current.createMediaStreamDestination();
            masterRef.current.connect(mediaDestRef.current);
        } catch {
            mediaDestRef.current = null;
        }
    }
};

const PianoLoveView = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showEntryAnimation, setShowEntryAnimation] = useState(false);
    const [envelopeOpen, setEnvelopeOpen] = useState(false);

    const entryAnimationData = useMemo(() => {
        let animationData = null;
        try {
            // Will be loaded dynamically
            animationData = null;
        } catch {
            animationData = null;
        }
        return animationData;
    }, []);

    const [LottieComponent, setLottieComponent] = useState(null);
    const [entryAnimation, setEntryAnimation] = useState(null);

    // Load Lottie and animation data when needed
    useEffect(() => {
        if (showEntryAnimation && !LottieComponent && !entryAnimation) {
            Promise.all([loadLottie(), loadAnimationData()]).then(([lottieModule, animationModule]) => {
                setLottieComponent(() => lottieModule.default);
                const src = animationModule.default || animationModule;
                try {
                    setEntryAnimation(structuredClone(src));
                } catch {
                    setEntryAnimation(JSON.parse(JSON.stringify(src)));
                }
            });
        }
    }, [showEntryAnimation, LottieComponent, entryAnimation]);

    const captureRef = useRef(null);
    const [isCapturing, setIsCapturing] = useState(false);

    const [isDownloadingImage, setIsDownloadingImage] = useState(false);
    const [videoStatus, setVideoStatus] = useState('idle'); // idle, recording, saving
    const mediaRecorderRef = useRef(null);
    const recordChunksRef = useRef([]);
    const recordingStreamRef = useRef(null);
    const recordingTimerRef = useRef(null);
    const recordCanvasRef = useRef(null);

    const canvasRef = useRef(null);
    const playingStatusRef = useRef('idle'); // idle, playing, done
    const [, forceRender] = useState({});

    // Audio & playback
    const audioContextRef = useRef(null);
    const masterRef = useRef(null);
    const mediaDestRef = useRef(null);
    const animationRef = useRef(null);

    // Notes playback
    const playStartRef = useRef(0);
    const nextEventIndexRef = useRef(0);

    // Key visual state mapping
    const keyLayoutRef = useRef(generateKeyLayout());
    const desiredDOMStatesRef = useRef(new Map());
    const activeDOMStatesRef = useRef(new Map());
    const keyRefs = useRef({});

    useEffect(() => {
        const initAuth = async () => {
            const initialAuthToken = globalThis?.__initial_auth_token;
            if (initialAuthToken) {
                await signInWithCustomToken(auth, initialAuthToken);
            } else {
                await signInAnonymously(auth);
            }
        };
        initAuth();

        const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
            if (user) {
                if (!id) {
                    setLoading(false);
                    return;
                }

                try {
                    const result = await resolveCardId(id, 'piano_love_cards', 'piano');
                    if (result && result.data) {
                        // resolveCardId already normalizes the data
                        setData(result.data);
                    } else {
                        setData(null);
                    }
                    setLoading(false);
                } catch (err) {
                    console.error("Error:", err);
                    setLoading(false);
                    setError('Failed to load card');
                }
            }
        });
        return () => unsubscribeAuth();
    }, [id]);

    useEffect(() => {
        return () => {
            try {
                if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
                    mediaRecorderRef.current.stop();
                }
            } catch {
                // ignore
            }
            setVideoStatus('idle');

            const stream = recordingStreamRef.current;
            if (stream) {
                stream.getTracks().forEach((t) => t.stop());
                recordingStreamRef.current = null;
            }
        };
    }, []);

    const syncDOMStates = useCallback(() => {
        desiredDOMStatesRef.current.forEach((nextState, midi) => {
            if (activeDOMStatesRef.current.get(midi) !== nextState) {
                const keyEl = keyRefs.current[midi];
                if (keyEl) {
                    keyEl.classList.remove('active', 'guide-ready', 'guide-hit');
                    if (nextState !== 'idle') {
                        keyEl.classList.add(nextState === 'active' ? 'active' : `guide-${nextState}`);
                    }
                }
                activeDOMStatesRef.current.set(midi, nextState);
            }
        });

        // Cleanup
        activeDOMStatesRef.current.forEach((activeState, midi) => {
            if (!desiredDOMStatesRef.current.has(midi) && activeState !== 'idle') {
                const keyEl = keyRefs.current[midi];
                if (keyEl) {
                    keyEl.classList.remove('active', 'guide-ready', 'guide-hit');
                }
                activeDOMStatesRef.current.set(midi, 'idle');
            }
        });
    }, []);

    const triggerVoice = useCallback((midiNote, holdFor = 0.28) => {
        ensureAudioContext(audioContextRef, masterRef);
        const context = audioContextRef.current;

        if (context.state === 'suspended') {
            context.resume().catch(() => { });
        }

        const frequency = midiToFrequency(midiNote);
        const lowNoteAttenuation = computeLowNoteAttenuation(midiNote);
        const oscFundamental = context.createOscillator();
        const oscWarmth = context.createOscillator();

        // @ts-ignore
        oscFundamental.type = 'sine';
        // @ts-ignore
        oscWarmth.type = 'sine';

        oscFundamental.frequency.setValueAtTime(frequency, context.currentTime);
        oscWarmth.frequency.setValueAtTime(frequency / 2, context.currentTime);

        const hpf = context.createBiquadFilter();
        hpf.type = 'highpass';
        hpf.frequency.value = 120;

        const filter = context.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 1000;

        const gainNode = context.createGain();

        gainNode.gain.setValueAtTime(0, context.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.46 * lowNoteAttenuation, context.currentTime + 0.05);
        gainNode.gain.exponentialRampToValueAtTime(0.001, context.currentTime + Math.max(1.5, holdFor + 0.5));

        const fundamentalGain = context.createGain();
        fundamentalGain.gain.value = 1;

        const warmthGain = context.createGain();
        warmthGain.gain.value = 0.18;

        oscFundamental.connect(fundamentalGain);
        oscWarmth.connect(warmthGain);
        fundamentalGain.connect(gainNode);
        warmthGain.connect(gainNode);
        gainNode.connect(hpf);
        hpf.connect(filter);
        filter.connect(masterRef.current);

        oscFundamental.start(); oscWarmth.start();
        oscFundamental.stop(context.currentTime + Math.max(1.5, holdFor + 0.5));
        oscWarmth.stop(context.currentTime + Math.max(1.5, holdFor + 0.5));
    }, []);

    const stopPlayback = useCallback(() => {
        if (animationRef.current) cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
        playingStatusRef.current = 'idle';
        forceRender({});
        desiredDOMStatesRef.current.clear();
        syncDOMStates();

        const canvas = canvasRef.current;
        if (canvas) {
            const context = canvas.getContext('2d');
            if (context) context.clearRect(0, 0, canvas.width, canvas.height);
        }
    }, [syncDOMStates]);

    const renderRecordingComposite = useCallback((elapsedMs) => {
        const recordCanvas = recordCanvasRef.current;
        if (!recordCanvas) return;
        const ctx = recordCanvas.getContext('2d');
        if (!ctx) return;

        const w = recordCanvas.width;
        const h = recordCanvas.height;

        ctx.clearRect(0, 0, w, h);
        ctx.fillStyle = '#FDFBF7';
        ctx.fillRect(0, 0, w, h);

        const pad = Math.max(18, Math.floor(w * 0.03));
        const pianoH = Math.floor(h * 0.48);
        const keyboardH = Math.floor(pianoH * 0.35);
        const notesH = pianoH - keyboardH;
        const pianoTop = h - pad - pianoH;

        ctx.fillStyle = 'rgba(45,45,45,0.04)';
        const radius = Math.max(14, Math.floor(w * 0.018));
        ctx.beginPath();
        ctx.roundRect(pad, pianoTop, w - pad * 2, pianoH, radius);
        ctx.fill();

        const title = `A Song From ${data?.senderName || ''}`;
        const message = (data?.message || '').trim();

        ctx.fillStyle = '#2d2d2d';
        ctx.font = `700 ${Math.max(18, Math.floor(w * 0.045))}px ui-serif, Georgia, serif`;
        ctx.textAlign = 'center';
        ctx.fillText(title, w / 2, pad + Math.max(34, Math.floor(h * 0.055)));

        ctx.fillStyle = '#666';
        ctx.font = `italic ${Math.max(14, Math.floor(w * 0.034))}px ui-serif, Georgia, serif`;
        const msgText = message || 'No message added';
        ctx.fillText(msgText, w / 2, pad + Math.max(64, Math.floor(h * 0.095)));

        const noteCanvas = canvasRef.current;
        if (noteCanvas) {
            const srcW = noteCanvas.width;
            const srcH = noteCanvas.height;
            const destX = pad;
            const destY = pianoTop;
            const destW = w - pad * 2;
            const destH = notesH;
            try {
                ctx.drawImage(noteCanvas, 0, 0, srcW, srcH, destX, destY, destW, destH);
            } catch {
                // ignore
            }
        }

        const kbX = pad;
        const kbY = pianoTop + notesH;
        const kbW = w - pad * 2;
        const kbH = keyboardH;

        ctx.fillStyle = '#f0f0f0';
        ctx.beginPath();
        ctx.roundRect(kbX, kbY, kbW, kbH, Math.max(10, Math.floor(radius * 0.9)));
        ctx.fill();

        const layout = keyLayoutRef.current;
        const getKeyState = (midi) => activeDOMStatesRef.current.get(midi) || 'idle';

        layout.filter(k => !k.isBlack).forEach((k) => {
            const x = kbX + (k.xPct / 100) * kbW;
            const ww = (k.wPct / 100) * kbW;
            const state = getKeyState(k.midi);
            ctx.fillStyle = state === 'active' ? '#bae6fd' : '#ffffff';
            ctx.strokeStyle = '#94a3b8';
            ctx.lineWidth = Math.max(1, Math.floor(w * 0.002));
            ctx.beginPath();
            ctx.roundRect(x, kbY, ww, kbH, Math.max(8, Math.floor(radius * 0.7)));
            ctx.fill();
            ctx.stroke();
        });

        layout.filter(k => k.isBlack).forEach((k) => {
            const x = kbX + (k.xPct / 100) * kbW;
            const ww = (k.wPct / 100) * kbW;
            const bh = kbH * 0.62;
            const state = getKeyState(k.midi);
            const grad = ctx.createLinearGradient(0, kbY, 0, kbY + bh);
            if (state === 'active') {
                grad.addColorStop(0, '#0284c7');
                grad.addColorStop(1, '#0369a1');
            } else {
                grad.addColorStop(0, '#333333');
                grad.addColorStop(1, '#000000');
            }
            ctx.fillStyle = grad;
            ctx.strokeStyle = '#000';
            ctx.lineWidth = Math.max(1, Math.floor(w * 0.002));
            ctx.beginPath();
            ctx.roundRect(x, kbY, ww, bh, Math.max(6, Math.floor(radius * 0.55)));
            ctx.fill();
            ctx.stroke();
        });

        const durationMs = data?.durationMs || 30000;
        const secLeft = Math.max(0, Math.ceil((durationMs - elapsedMs) / 1000));
        ctx.fillStyle = 'rgba(45,45,45,0.72)';
        ctx.font = `800 ${Math.max(12, Math.floor(w * 0.03))}px ui-sans-serif, system-ui, -apple-system`;
        ctx.textAlign = 'right';
        ctx.fillText(`${secLeft}s`, w - pad, pianoTop - Math.max(10, Math.floor(h * 0.01)));
    }, [data]);

    const renderFrame = useCallback(() => {
        if (playingStatusRef.current !== 'playing') return;

        const canvas = canvasRef.current;
        if (!canvas) return;
        const context = canvas.getContext('2d');
        if (!context) return;

        const now = performance.now();
        const elapsedMs = now - playStartRef.current;
        const recordedEvents = data?.recordedEvents || [];

        renderRecordingComposite(elapsedMs);

        // Note dropping visual
        const hitLineY = canvas.height - 118;
        context.clearRect(0, 0, canvas.width, canvas.height);
        context.fillStyle = 'rgba(45,45,45,0.02)';
        context.fillRect(0, 0, canvas.width, canvas.height);

        context.strokeStyle = '#D4AF37';
        context.lineWidth = 3;
        context.beginPath();
        context.moveTo(0, hitLineY);
        context.lineTo(canvas.width, hitLineY);
        context.stroke();

        desiredDOMStatesRef.current.clear();

        // Check if we need to play the next note
        while (
            nextEventIndexRef.current < recordedEvents.length &&
            recordedEvents[nextEventIndexRef.current].atMs <= elapsedMs
        ) {
            const ev = recordedEvents[nextEventIndexRef.current];
            triggerVoice(ev.originalMidi || ev.midi, 0.22);
            nextEventIndexRef.current++;
        }

        // Draw falling notes (uniform size)
        for (let i = 0; i < recordedEvents.length; i++) {
            const noteEvent = recordedEvents[i];
            const timeDiffSec = (noteEvent.atMs - elapsedMs) / 1000;
            const simulatedDuration = 0.22;

            const h = 28; // Uniform length size
            const y = hitLineY - timeDiffSec * FALL_SPEED;

            if (y - h > canvas.height + 40) continue;
            if (y + h < -50) break;

            const pad = Math.floor(canvas.width * 0.05);
            const kbW = canvas.width - pad * 2;

            const layout = keyLayoutRef.current.find(k => k.midi === noteEvent.midi);
            if (layout) {
                const x = pad + (layout.xPct / 100) * kbW;
                const width = (layout.wPct / 100) * kbW;

                context.fillStyle = layout.isBlack ? '#f472b6' : '#38bdf8';
                context.beginPath();
                context.roundRect(x + 1, y - h, width - 2, h, 4);
                context.fill();
            }

            // Guide states
            if (timeDiffSec <= PRE_HIT_SECONDS && timeDiffSec > 0 && desiredDOMStatesRef.current.get(noteEvent.midi) !== 'active') {
                desiredDOMStatesRef.current.set(noteEvent.midi, 'ready');
            }
            if (timeDiffSec <= 0 && timeDiffSec >= -simulatedDuration) {
                desiredDOMStatesRef.current.set(noteEvent.midi, 'active');
            }
        }

        syncDOMStates();

        if (elapsedMs > (data?.durationMs || 30000) + 1000) {
            stopPlayback();
            playingStatusRef.current = 'done';
            forceRender({});
            if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
                try {
                    mediaRecorderRef.current.stop();
                } catch {
                    // ignore
                }
            }
        } else {
            animationRef.current = requestAnimationFrame(renderFrame);
        }
    }, [data, renderRecordingComposite, syncDOMStates, triggerVoice, stopPlayback]);

    const playRecording = useCallback(() => {
        if (!data || !data.recordedEvents || data.recordedEvents.length === 0) return;

        ensureAudioContext(audioContextRef, masterRef);
        playingStatusRef.current = 'playing';
        forceRender({});

        playStartRef.current = performance.now();
        nextEventIndexRef.current = 0;

        if (animationRef.current) cancelAnimationFrame(animationRef.current);
        animationRef.current = requestAnimationFrame(renderFrame);
    }, [data, renderFrame]);

    const downloadAsImage = useCallback(async () => {
        if (!captureRef.current || isDownloadingImage) return;
        setIsDownloadingImage(true);
        setIsCapturing(true);
        try {
            await new Promise((r) => requestAnimationFrame(() => r()));
            const html2canvas = (await loadHtml2Canvas()).default;
            const canvas = await html2canvas(captureRef.current, {
                backgroundColor: '#FDFBF7',
                scale: Math.min(2, window.devicePixelRatio || 1),
                useCORS: true,
            });

            const dataUrl = canvas.toDataURL('image/png');
            const a = document.createElement('a');
            a.href = dataUrl;
            a.download = `piano-${id || 'card'}.png`;
            document.body.appendChild(a);
            a.click();
            a.remove();
        } finally {
            setIsCapturing(false);
            setIsDownloadingImage(false);
        }
    }, [id, isDownloadingImage]);

    const stopVideoRecording = useCallback(() => {
        if (recordingTimerRef.current) {
            clearTimeout(recordingTimerRef.current);
            recordingTimerRef.current = null;
        }
        try {
            if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
                mediaRecorderRef.current.stop();
            }
        } catch {
            // ignore
        }
    }, []);

    const startVideoRecording = useCallback(async () => {
        if (videoStatus === 'recording') return;
        const captureEl = captureRef.current;
        const noteCanvas = canvasRef.current;
        if (!captureEl || !noteCanvas) return;

        if (!recordCanvasRef.current) {
            recordCanvasRef.current = document.createElement('canvas');
        }

        const bounds = captureEl.getBoundingClientRect();
        const scale = Math.min(2, window.devicePixelRatio || 1);
        const rw = Math.max(640, Math.floor(bounds.width * scale));
        const rh = Math.max(880, Math.floor(bounds.height * scale));
        recordCanvasRef.current.width = rw;
        recordCanvasRef.current.height = rh;

        setVideoStatus('recording');
        recordChunksRef.current = [];

        try {
            // @ts-ignore
            const canvasStream = recordCanvasRef.current.captureStream ? recordCanvasRef.current.captureStream(30) : null;
            if (!canvasStream) throw new Error('Canvas captureStream not supported');

            // Audio: try to attach an audio track from WebAudio (if supported)
            ensureMediaDestination(audioContextRef, masterRef, mediaDestRef);
            const audioTracks = mediaDestRef.current?.stream?.getAudioTracks?.() || [];

            const combinedStream = new MediaStream([
                ...canvasStream.getVideoTracks(),
                ...audioTracks,
            ]);

            recordingStreamRef.current = combinedStream;

            const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')
                ? 'video/webm;codecs=vp9,opus'
                : MediaRecorder.isTypeSupported('video/webm;codecs=vp8,opus')
                    ? 'video/webm;codecs=vp8,opus'
                    : 'video/webm';

            const recorder = new MediaRecorder(combinedStream, { mimeType });
            mediaRecorderRef.current = recorder;

            recorder.ondataavailable = (e) => {
                if (e.data && e.data.size > 0) recordChunksRef.current.push(e.data);
            };

            recorder.onstop = () => {
                try {
                    setVideoStatus('saving');
                    const blob = new Blob(recordChunksRef.current, { type: recorder.mimeType || 'video/webm' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `piano-${id || 'card'}.webm`;
                    document.body.appendChild(a);
                    a.click();
                    a.remove();
                    URL.revokeObjectURL(url);
                } catch {
                    // ignore
                } finally {
                    try {
                        if (recordingStreamRef.current) {
                            recordingStreamRef.current.getTracks().forEach((t) => t.stop());
                            recordingStreamRef.current = null;
                        }
                    } catch {
                        // ignore
                    }
                    recordChunksRef.current = [];
                    setVideoStatus('idle');
                }
            };

            recorder.start(250);

            try {
                stopPlayback();
                playRecording();
            } catch {
                // ignore
            }

            const durationMs = (data?.durationMs || 30000) + 1200;
            recordingTimerRef.current = setTimeout(() => {
                stopVideoRecording();
            }, durationMs);
        } catch {
            setVideoStatus('idle');
        }
    }, [data, id, playRecording, stopPlayback, stopVideoRecording, videoStatus]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return undefined;

        const resize = () => {
            const bounds = canvas.getBoundingClientRect();
            canvas.width = Math.max(320, Math.floor(bounds.width * window.devicePixelRatio));
            canvas.height = Math.max(220, Math.floor(bounds.height * window.devicePixelRatio));
            const context = canvas.getContext('2d');
            if (context) {
                context.setTransform(window.devicePixelRatio, 0, 0, window.devicePixelRatio, 0, 0);
            }
        };
        resize();
        window.addEventListener('resize', resize);
        return () => window.removeEventListener('resize', resize);
    }, [loading]);

    useEffect(() => {
        return () => stopPlayback();
    }, [stopPlayback]);

    if (loading) return <LoadingSpinner />;
    if (error || !data) return <div className="loader" style={{ textAlign: 'center', marginTop: '100px' }}>Card Not Found</div>;

    const isPlaying = playingStatusRef.current === 'playing';

    const hasRecordedNotes = Array.isArray(data?.recordedEvents) && data.recordedEvents.length > 0;
    const notesCount = hasRecordedNotes ? data.recordedEvents.length : 0;
    const safeMessage = data?.message?.trim();

    return (
        <div>
            <Navbar />
            <div className="piano-love-page">
                <CardViewHeader
                    cardType="piano"
                    cardId={id}
                    title="Piano Love Message"
                    subtitle={`For ${data.receiverName || 'Someone special'}`}
                    previewUrl={typeof window !== 'undefined' ? window.location.href : ''}
                />

                {!envelopeOpen && (
                    <div className="plv-envelope-container">
                        <div
                            className="plv-envelope-wrapper"
                            onClick={() => {
                                // Add open class for CSS animation, wait for it, then set state
                                const envelope = document.querySelector('.plv-css-envelope');
                                if (envelope) {
                                    envelope.classList.add('open');
                                    // 1.5s delay perfectly matches our CSS animation sequence
                                    setTimeout(() => {
                                        setEnvelopeOpen(true);
                                        setShowEntryAnimation(true);
                                    }, 1500);
                                }
                            }}
                        >
                            <div className="plv-css-envelope">
                                <div className="plv-env-back"></div>
                                <div className="plv-env-front"></div>
                                <div className="plv-env-flap"></div>
                                <div className="plv-env-seal">
                                    <span>Tap to Open</span>
                                </div>
                                <div className="plv-env-letter">
                                    <div className="plv-env-letter-content">
                                        <div className="plv-env-letter-title">A Song From</div>
                                        <div className="plv-env-letter-name">{data.senderName}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {envelopeOpen && (
                    <>
                        <section className={`panel piano-view-panel plv-romantic-card ${isCapturing ? 'plv-capturing' : ''}`} ref={captureRef}>
                            <div className="plv-capture-decor" aria-hidden="true" />

                            <div className="plv-romantic-header">
                                <h2 className="plv-romantic-title">A Song From {data.senderName}</h2>
                           
                            </div>

                            <div className="preview-card" style={{ marginBottom: '14px' }}>
                                <div className="preview-row">
                                    <span className="preview-label">To</span>
                                    <span className="preview-value">{data.receiverName || 'Receiver'}</span>
                                </div>
                                <div className="preview-row">
                                    <span className="preview-label">Song</span>
                                    <span className="preview-value">{data.songLabel || 'No song label saved'}</span>
                                </div>
                                <div className="preview-row">
                                    <span className="preview-label">Mode</span>
                                    <span className="preview-value">
                                        {data?.autoplayUsed
                                            ? (data?.autoplayShared 
                                                ? '🎵 Autoplay (visible to receiver)' 
                                                : '🎵 Autoplay (hidden from receiver)')
                                            : '🎹 Manually played'}
                                    </span>
                                </div>
                                <div className="preview-row">
                                    <span className="preview-label">Notes</span>
                                    <span className="preview-value">{notesCount} recorded notes</span>
                                </div>
                                <div className="preview-row">
                                    <span className="preview-label">Message</span>
                                    <span className="preview-value preview-message">{safeMessage || 'No message added'}</span>
                                </div>
                            </div>

                            <div className="piano-wrapper" style={{ pointerEvents: 'none' }}>
                                <canvas ref={canvasRef} className="notes-canvas" style={{ height: '280px' }} />
                                <div className="keyboard">
                                    {keyLayoutRef.current.map((k) => (
                                        <div
                                            key={k.midi}
                                            ref={(el) => { if (el) keyRefs.current[k.midi] = el; }}
                                            data-key-index={k.midi}
                                            className={`key ${k.isBlack ? 'black-key' : 'white-key'}`}
                                            style={{ left: k.left, width: k.width }}
                                        />
                                    ))}
                                </div>
                            </div>

                            {!isCapturing && (
                                <>
                                    {/* Row 1: Play / Stop */}
                                    <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px', gap: '10px' }}>
                                        {!isPlaying ? (
                                            <button
                                                type="button"
                                                className="primary plv-romantic-play"
                                                onClick={playRecording}
                                                disabled={!hasRecordedNotes}
                                                style={{ padding: '12px 28px', fontSize: '1.05rem', borderRadius: '50px' }}
                                            >
                                                <Play size={18} /> Play
                                            </button>
                                        ) : (
                                            <button
                                                type="button"
                                                className="danger"
                                                onClick={stopPlayback}
                                                style={{ padding: '12px 28px', fontSize: '1.05rem', borderRadius: '50px' }}
                                            >
                                                <Square size={18} /> Stop
                                            </button>
                                        )}
                                    </div>

                                    {/* Row 2: Download Image | Download Video | View in 3D */}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px', gap: '8px', flexWrap: 'nowrap', overflowX: 'hidden', maxWidth: '100%' }}>
                                        <button
                                            type="button"
                                            className="ghost"
                                            onClick={downloadAsImage}
                                            disabled={isDownloadingImage}
                                            style={{ padding: '10px 12px', fontSize: '0.86rem', borderRadius: '50px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px', whiteSpace: 'nowrap', flex: '1 1 0', minWidth: 0 }}
                                        >
                                            <Download size={16} /> {isDownloadingImage ? 'Preparing…' : 'Image'}
                                        </button>

                                        {videoStatus === 'idle' ? (
                                            <button
                                                type="button"
                                                className="ghost"
                                                onClick={startVideoRecording}
                                                disabled={videoStatus !== 'idle'}
                                                style={{ padding: '10px 12px', fontSize: '0.86rem', borderRadius: '50px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px', whiteSpace: 'nowrap', flex: '1 1 0', minWidth: 0 }}
                                            >
                                                <Download size={16} /> Video
                                            </button>
                                        ) : videoStatus === 'recording' ? (
                                            <button
                                                type="button"
                                                className="danger"
                                                onClick={stopVideoRecording}
                                                style={{ padding: '10px 12px', fontSize: '0.86rem', borderRadius: '50px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px', whiteSpace: 'nowrap', flex: '1 1 0', minWidth: 0 }}
                                            >
                                                <Square size={16} /> Stop rec
                                            </button>
                                        ) : (
                                            <button
                                                type="button"
                                                className="ghost"
                                                disabled
                                                style={{ padding: '10px 12px', fontSize: '0.86rem', borderRadius: '50px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px', whiteSpace: 'nowrap', flex: '1 1 0', minWidth: 0, opacity: 0.7 }}
                                            >
                                                <Download size={16} /> Saving…
                                            </button>
                                        )}

                                        <button
                                            type="button"
                                            style={{
                                                display: 'inline-flex', alignItems: 'center', gap: '6px',
                                                background: 'linear-gradient(135deg,#0f172a,#1e3a5f)',
                                                color: '#38bdf8', border: '1.5px solid #1e40af',
                                                borderRadius: '50px', padding: '10px 12px',
                                                fontSize: '0.86rem', fontWeight: 700, cursor: 'pointer',
                                                boxShadow: '0 0 14px rgba(56,189,248,0.28)',
                                                whiteSpace: 'nowrap',
                                                flex: '1 1 0',
                                                minWidth: 0,
                                                justifyContent: 'center'
                                            }}
                                            onClick={() => {
                                                try {
                                                    sessionStorage.setItem('piano3d-notes', JSON.stringify(data?.recordedEvents || []));
                                                    sessionStorage.setItem('piano3d-label', data?.songLabel || 'Piano Love');
                                                } catch (_) { }
                                                navigate('/piano-3d');
                                            }}
                                        >
                                            <Box size={16} /> View in 3D
                                        </button>
                                    </div>

                                    <div style={{ marginTop: '18px', display: 'flex', justifyContent: 'center', paddingBottom: '16px' }}>
                                        <a
                                            className="primary"
                                            href="/piano"
                                            style={{ textDecoration: 'none', padding: '14px 18px', borderRadius: '50px', fontSize: '1.05rem', width: '100%', justifyContent: 'center' }}
                                        >
                                            Create Your Own
                                        </a>
                                    </div>

                                    <div style={{ textAlign: 'center', marginTop: '10px', color: '#666', fontSize: '0.9rem', lineHeight: 1.5 }}>
                                        <a
                                            href="https://instagram.com/mayank.icu"
                                            target="_blank"
                                            rel="noreferrer"
                                            style={{ color: 'inherit', textDecoration: 'none', fontWeight: 800 }}
                                        >
                                            <Instagram size={16} style={{ verticalAlign: 'text-bottom' }} /> @mayank.icu
                                        </a>
                                        <div style={{ fontSize: '0.82rem', opacity: 0.85, marginTop: '4px' }}>
                                            Feel free to tag us and share this beautiful tool.
                                        </div>
                                    </div>
                                </>
                            )}
                        </section>
                    </>
                )} {/* Floating romantic ambient particles */}
                <div className="plv-ambient-particles">
                    <div className="particle p1"></div>
                    <div className="particle p2"></div>
                    <div className="particle p3"></div>
                    <div className="particle p4"></div>
                    <div className="particle p5"></div>
                </div>
            </div>
            <Footer />

            {showEntryAnimation && !isCapturing && LottieComponent && entryAnimation && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 99999, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: 'max(72px, env(safe-area-inset-top))', pointerEvents: 'none' }}>
                    <LottieComponent
                        animationData={entryAnimation}
                        loop={false}
                        onComplete={() => setShowEntryAnimation(false)}
                        style={{ width: 400, height: 400 }}
                    />
                </div>
            )}
        </div>
    );
};

export default PianoLoveView;
