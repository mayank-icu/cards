import * as React from 'react';
import { Play, Square, Bot, RotateCcw } from 'lucide-react';
import toast from 'react-hot-toast';
import PianoAuthOverlay from './PianoAuthOverlay';
import { useAuth } from '../../contexts/AuthContext';

const FALL_SPEED = 160;
const PRE_HIT_SECONDS = 0.35;
const LEAD_MS = 1400;      // pre-roll so notes appear instantly on start

// Hardcoded specifically for our 7-key layout between C4 (60) and B4 (71)
const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

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

        // We only create layout entries for white keys and 3 black keys
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

const computeLowNoteAttenuation = (midiNote) => {
    if (midiNote <= 48) return 0.20;
    if (midiNote <= 55) return 0.32;
    if (midiNote <= 59) return 0.45;
    return 1;
};

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

const PianoPlayer = ({
    selectedSong,
    songNotes,
    easyMode,
    setEasyMode,
    recordingStatus,
    setRecordingStatus,
    recordedEvents,
    setRecordedEvents,
    setWasAutoplayed,
    remainingMs,
    setRemainingMs,
    setFlowStep,
    recordDurationMs = 30000,
    setRecordDurationMs,
}) => {
    const [showAuthOverlay, setShowAuthOverlay] = React.useState(false);

    let authCtx;
    try { authCtx = useAuth(); } catch { authCtx = { isAuthenticated: false }; }
    const isAuthenticated = authCtx?.isAuthenticated ?? false;
    const [keyLayout] = React.useState(generateKeyLayout());
    const keyLayoutRef = React.useRef(keyLayout);

    const [autoplayStatus, setAutoplayStatus] = React.useState('off');
    const autoplayStatusRef = React.useRef('off');

    const [combo, setCombo] = React.useState(0);
    const [comboShow, setComboShow] = React.useState(false);

    const canvasRef = React.useRef(null);
    const keyRefs = React.useRef({});
    const animationRef = React.useRef(null);
    const playStartRef = React.useRef(0);
    const firstVisibleNoteIndexRef = React.useRef(0);

    const desiredDOMStatesRef = React.useRef(new Map());
    const activeDOMStatesRef = React.useRef(new Map());
    const activeTouchesRef = React.useRef(new Map());
    const keyPressCountRef = React.useRef(new Map());

    const recordingStartRef = React.useRef(0);
    const recordingTimerRef = React.useRef(null);
    const stopTimeoutRef = React.useRef(null);
    const recordedEventsRef = React.useRef(recordedEvents);

    const audioContextRef = React.useRef(null);
    const masterRef = React.useRef(null);

    const autoplayPlayedRef = React.useRef(new Set());

    React.useEffect(() => {
        keyLayoutRef.current = keyLayout;
    }, [keyLayout]);

    const selectedSongLabel = selectedSong ? `${selectedSong.title} - ${selectedSong.artist || 'Unknown Artist'}` : 'No song selected';
    const remainingSecText = Math.ceil(remainingMs / 1000);

    const syncDOMStates = React.useCallback(() => {
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

    const clearGuideAndPressedStates = React.useCallback(() => {
        keyPressCountRef.current.clear();
        desiredDOMStatesRef.current.clear();
        syncDOMStates();
    }, [syncDOMStates]);

    const stopRenderLoop = React.useCallback(() => {
        if (animationRef.current) {
            cancelAnimationFrame(animationRef.current);
            animationRef.current = null;
        }
    }, []);

    const stopRecording = React.useCallback((autoStopped = false, durationSec = 30) => {
        stopRenderLoop();

        if (recordingTimerRef.current) {
            clearInterval(recordingTimerRef.current);
            recordingTimerRef.current = null;
        }

        if (stopTimeoutRef.current) {
            clearTimeout(stopTimeoutRef.current);
            stopTimeoutRef.current = null;
        }

        setRemainingMs(0);
        setRecordingStatus('done');
        clearGuideAndPressedStates();

        if (autoStopped) {
            toast.success(`${durationSec} seconds captured. Continue to add sender/receiver details.`);
        }
    }, [clearGuideAndPressedStates, stopRenderLoop, setRemainingMs, setRecordingStatus]);

    const triggerVoice = React.useCallback((midiNote, holdFor = 0.28) => {
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

    const renderFrame = React.useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const dpr = window.devicePixelRatio || 1;
        const rectW = canvas.clientWidth;
        const rectH = canvas.clientHeight;

        if (canvas.width !== rectW * dpr || canvas.height !== rectH * dpr) {
            canvas.width = rectW * dpr;
            canvas.height = rectH * dpr;
            ctx.scale(dpr, dpr);
        }

        const W = rectW;
        const H = rectH;

        const currentTime = (performance.now() - playStartRef.current) / 1000;
        const hitLineY = H - 8;

        ctx.clearRect(0, 0, W, H);

        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(0, hitLineY);
        ctx.lineTo(W, hitLineY);
        ctx.stroke();

        while (
            firstVisibleNoteIndexRef.current < songNotes.length
            && songNotes[firstVisibleNoteIndexRef.current].time
            + songNotes[firstVisibleNoteIndexRef.current].duration < currentTime - 0.3
        ) {
            firstVisibleNoteIndexRef.current += 1;
        }

        keyPressCountRef.current.forEach((count, midi) => {
            desiredDOMStatesRef.current.set(midi, count > 0 ? 'active' : 'idle');
        });

        const FALL_TIME = 2.0;
        const NOTE_SPEED = H / FALL_TIME; // px per second

        for (let i = firstVisibleNoteIndexRef.current; i < songNotes.length; i += 1) {
            const note = songNotes[i];
            const timeDiff = note.time - currentTime;

            const layout = keyLayoutRef.current.find(k => k.midi === note.midi);
            if (!layout) continue;

            if (timeDiff > FALL_TIME) break;
            if (timeDiff + note.duration < 0) continue;

            // Set uniform small block size for playability instead of durations
            const noteLengthPx = 28;
            const yBottom = hitLineY - (timeDiff * NOTE_SPEED);
            const yTop = yBottom - noteLengthPx;

            const x = (layout.xPct / 100) * W;
            const w = (layout.wPct / 100) * W;

            if (yBottom > 0 && yTop < H) {
                if (note.altColor) {
                    ctx.fillStyle = layout.isBlack ? '#f472b6' : '#ec4899'; // Pink
                } else {
                    ctx.fillStyle = layout.isBlack ? '#fcd34d' : '#38bdf8'; // Blue/Gold
                }

                ctx.beginPath();
                ctx.roundRect(x + 1, yTop, w - 2, noteLengthPx, 4);
                ctx.fill();
            }

            if (timeDiff <= PRE_HIT_SECONDS && timeDiff > 0 && desiredDOMStatesRef.current.get(note.midi) !== 'active') {
                desiredDOMStatesRef.current.set(note.midi, 'ready');
            } else if (timeDiff <= 0 && timeDiff >= -note.duration) {
                desiredDOMStatesRef.current.set(note.midi, 'hit');

                if (autoplayStatusRef.current === 'playing' && !autoplayPlayedRef.current.has(i)) {
                    triggerVoice(note.originalMidi || note.midi, note.duration);
                    autoplayPlayedRef.current.add(i);
                }
            }
        }

        syncDOMStates();
        animationRef.current = requestAnimationFrame(renderFrame);
    }, [autoplayStatus, syncDOMStates, triggerVoice, songNotes]);

    const resetTake = React.useCallback(() => {
        stopRenderLoop();
        if (recordingTimerRef.current) {
            clearInterval(recordingTimerRef.current);
            recordingTimerRef.current = null;
        }
        if (stopTimeoutRef.current) {
            clearTimeout(stopTimeoutRef.current);
            stopTimeoutRef.current = null;
        }

        setRecordedEvents([]);
        setRecordingStatus('idle');
        setRemainingMs(recordDurationMs);
        toast.dismiss();
        clearGuideAndPressedStates();
        setAutoplayStatus('off');
        autoplayStatusRef.current = 'off';
        setCombo(0);
        setComboShow(false);

        const canvas = canvasRef.current;
        if (canvas) {
            const context = canvas.getContext('2d');
            if (context) context.clearRect(0, 0, canvas.width, canvas.height);
        }
    }, [clearGuideAndPressedStates, stopRenderLoop, setRecordedEvents, setRecordingStatus, setRemainingMs, recordDurationMs]);

    const stopAutoplay = React.useCallback(() => {
        setAutoplayStatus('off');
        autoplayStatusRef.current = 'off';
        if (stopTimeoutRef.current) clearTimeout(stopTimeoutRef.current);
        stopRenderLoop();
        clearGuideAndPressedStates();
    }, [clearGuideAndPressedStates, stopRenderLoop]);

    const startAutoplay = React.useCallback(() => {
        if (!songNotes.length) return;
        ensureAudioContext(audioContextRef, masterRef);

        const ctx = audioContextRef.current;
        if (ctx.state === 'suspended') ctx.resume();

        // Safe invisible oscillator to unlock audio playback in mobile browsers securely
        const unlocker = ctx.createOscillator();
        const unlockerGain = ctx.createGain();
        unlockerGain.gain.value = 0;
        unlocker.connect(unlockerGain);
        unlockerGain.connect(ctx.destination);
        unlocker.start();
        unlocker.stop(ctx.currentTime + 0.01);

        stopRenderLoop();
        resetTake();

        setAutoplayStatus('playing');
        autoplayStatusRef.current = 'playing';
        setWasAutoplayed(true);
        setRecordingStatus('done');

        const lastNote = songNotes[songNotes.length - 1];
        const totalDurationMs = (lastNote ? lastNote.time + lastNote.duration : 0) * 1000 + LEAD_MS + 2000;

        setRemainingMs(totalDurationMs);
        autoplayPlayedRef.current.clear();

        const now = performance.now();
        playStartRef.current = now + LEAD_MS;
        recordingStartRef.current = now; // Re-using this ref for auto mode timer tracking
        firstVisibleNoteIndexRef.current = 0;

        recordingTimerRef.current = setInterval(() => {
            const elapsed = performance.now() - recordingStartRef.current;
            const remain = Math.max(0, totalDurationMs - elapsed);
            setRemainingMs(remain);
        }, 100);

        stopTimeoutRef.current = setTimeout(() => {
            stopAutoplay();
        }, totalDurationMs);

        animationRef.current = requestAnimationFrame(renderFrame);
    }, [renderFrame, resetTake, stopAutoplay, stopRenderLoop, songNotes]);

    const startThirtySecondTake = React.useCallback(() => {
        if (!songNotes.length) {
            toast.error('Pick a song first.');
            return;
        }

        ensureAudioContext(audioContextRef, masterRef);
        toast.dismiss();
        setAutoplayStatus('off');
        autoplayStatusRef.current = 'off';
        setWasAutoplayed(false);
        autoplayPlayedRef.current.clear();

        recordedEventsRef.current = [];
        setRecordedEvents([]);
        setRecordingStatus('recording');
        setRemainingMs(recordDurationMs);

        const now = performance.now();
        recordingStartRef.current = now;
        playStartRef.current = now + LEAD_MS;
        firstVisibleNoteIndexRef.current = 0;
        setCombo(0);
        setComboShow(false);

        stopRenderLoop();
        animationRef.current = requestAnimationFrame(renderFrame);

        recordingTimerRef.current = setInterval(() => {
            const elapsed = performance.now() - recordingStartRef.current;
            const remain = Math.max(0, recordDurationMs - elapsed);
            setRemainingMs(remain);
        }, 100);

        const durationSec = Math.round(recordDurationMs / 1000);
        stopTimeoutRef.current = setTimeout(() => {
            stopRecording(true, durationSec);
        }, recordDurationMs);
    }, [renderFrame, stopRecording, stopRenderLoop, songNotes, setRecordedEvents, setRecordingStatus, setRemainingMs, recordDurationMs]);

    const pressKey = React.useCallback((midi) => {
        const currentCount = keyPressCountRef.current.get(midi) || 0;
        keyPressCountRef.current.set(midi, currentCount + 1);
        desiredDOMStatesRef.current.set(midi, 'active');
        syncDOMStates();

        const currentTime = (performance.now() - playStartRef.current) / 1000;
        let pitchToPlay = midi;

        if (recordingStatus === 'recording' || recordingStatus === 'ready') {
            const upcomingNote = songNotes.find(n => n.midi === midi && n.time >= currentTime - 0.4 && n.time <= currentTime + 0.6);
            if (upcomingNote && upcomingNote.originalMidi) {
                pitchToPlay = upcomingNote.originalMidi;
                setCombo(c => {
                    const next = c + 1;
                    if (next >= 3) {
                        setComboShow(true);
                        setTimeout(() => setComboShow(false), 1200);
                    }
                    return next;
                });
            } else if (recordingStatus === 'recording') {
                setCombo(0);
            }
        }

        triggerVoice(pitchToPlay, 0.22);

        if (recordingStatus === 'recording') {
            const elapsedMs = Math.max(0, performance.now() - recordingStartRef.current);
            if (elapsedMs <= recordDurationMs) {
                const event = {
                    key: NOTES[midi % 12],
                    midi,
                    originalMidi: pitchToPlay,
                    atMs: Math.round(elapsedMs)
                };
                recordedEventsRef.current = [...recordedEventsRef.current, event];
                setRecordedEvents(recordedEventsRef.current);
            }
        }
    }, [recordingStatus, syncDOMStates, triggerVoice, setRecordedEvents, songNotes]);

    const releaseKey = React.useCallback((midi) => {
        const currentCount = keyPressCountRef.current.get(midi) || 0;
        const newCount = Math.max(0, currentCount - 1);
        keyPressCountRef.current.set(midi, newCount);
        desiredDOMStatesRef.current.set(midi, newCount > 0 ? 'active' : 'idle');
        syncDOMStates();
    }, [syncDOMStates]);

    const handleTouchPoint = React.useCallback((touch) => {
        const element = document.elementFromPoint(touch.clientX, touch.clientY);
        const keyEl = element?.closest?.('[data-key-index]');
        // @ts-ignore
        const nextKey = keyEl ? Number(keyEl.dataset.keyIndex) : null;
        const prevKey = activeTouchesRef.current.get(touch.identifier);

        if (prevKey !== undefined && prevKey !== nextKey) {
            releaseKey(prevKey);
        }

        if (nextKey !== null && nextKey !== prevKey) {
            pressKey(nextKey);
        }

        if (nextKey === null) {
            activeTouchesRef.current.delete(touch.identifier);
        } else {
            activeTouchesRef.current.set(touch.identifier, nextKey);
        }
    }, [pressKey, releaseKey]);

    const onTouchStart = React.useCallback((event) => {
        event.preventDefault();
        ensureAudioContext(audioContextRef, masterRef);
        Array.from(event.changedTouches).forEach((touch) => handleTouchPoint(touch));
    }, [handleTouchPoint]);

    const onTouchMove = React.useCallback((event) => {
        event.preventDefault();
        Array.from(event.changedTouches).forEach((touch) => handleTouchPoint(touch));
    }, [handleTouchPoint]);

    const onTouchEnd = React.useCallback((event) => {
        event.preventDefault();
        Array.from(event.changedTouches).forEach((touch) => {
            const prevKey = activeTouchesRef.current.get(touch.identifier);
            if (prevKey !== undefined) releaseKey(prevKey);
            activeTouchesRef.current.delete(touch.identifier);
        });
    }, [releaseKey]);

    return (
        <section className="fs-piano-overlay">
            {/* ── Top bar: back + song info ── */}
            <div className="fs-topbar">
                <button type="button" className="ghost fs-back-btn" onClick={() => { stopAutoplay(); setFlowStep(1) }}>
                    &larr; Back
                </button>
                <div className="fs-song-info">
                    <h2 className="fs-song-title">{selectedSongLabel}</h2>
                    <span className="fs-song-status">
                        {autoplayStatus === 'playing' ? `Auto: ${remainingSecText}s left` : recordingStatus === 'recording' ? `${remainingSecText}s left` : recordingStatus === 'done' ? 'Recorded ✓' : 'Ready'}
                    </span>
                </div>
                {recordingStatus === 'done' && autoplayStatus !== 'playing' && (
                    <button
                        type="button"
                        className="primary"
                        onClick={() => { toast.dismiss(); setFlowStep(3); }}
                        style={{ marginLeft: 'auto', flexShrink: 0, borderRadius: '50px', padding: '10px 24px', fontSize: '15px', fontWeight: '800' }}
                    >
                        Next
                    </button>
                )}
            </div>

            {/* ── Controls sub-bar ── */}
            <div className="fs-controls-bar">
                {/* Duration selector: 30s / 60s */}
                <div className="dur-toggle">
                    <button
                        type="button"
                        className={`dur-btn${recordDurationMs === 30000 ? ' dur-active' : ''}`}
                        onClick={() => setRecordDurationMs && setRecordDurationMs(30000)}
                        disabled={recordingStatus === 'recording' || autoplayStatus === 'playing'}
                        title="30 seconds (free)"
                    >
                        30s
                    </button>
                    <button
                        type="button"
                        className={`dur-btn${recordDurationMs === 60000 ? ' dur-active' : ''}${!isAuthenticated ? ' dur-locked' : ''}`}
                        onClick={() => {
                            if (!isAuthenticated) {
                                setShowAuthOverlay(true);
                                return;
                            }
                            setRecordDurationMs && setRecordDurationMs(60000);
                        }}
                        disabled={recordingStatus === 'recording' || autoplayStatus === 'playing'}
                        title={isAuthenticated ? '60 seconds' : 'Sign in to unlock 60s'}
                    >
                        {!isAuthenticated && <span className="dur-lock">🔒</span>}60s
                    </button>
                </div>

                <button
                    type="button"
                    className={`ghost fs-ctrl-btn${easyMode ? ' active' : ''}`}
                    onClick={() => setEasyMode(!easyMode)}
                    disabled={recordingStatus === 'recording' || autoplayStatus === 'playing'}
                >
                    {easyMode ? '⚡ Easy' : '🎯 Normal'}
                </button>

                {recordingStatus !== 'recording' ? (
                    <button type="button" className="primary fs-ctrl-btn fs-dominant-btn fs-rec-dominant" onClick={recordingStatus === 'done' ? resetTake : startThirtySecondTake} disabled={autoplayStatus === 'playing'}>
                        {recordingStatus === 'done' ? <RotateCcw size={16} /> : <Play size={16} />}
                        {recordingStatus === 'done' ? ' Retry' : ' Rec'}
                    </button>
                ) : (
                    <button type="button" className="danger fs-ctrl-btn fs-dominant-btn fs-rec-dominant" onClick={() => stopRecording(false)}>
                        <Square size={16} /> Stop
                    </button>
                )}

                {autoplayStatus !== 'playing' ? (
                    <button type="button" className="primary fs-ctrl-btn fs-dominant-btn" style={{ background: '#3b82f6' }} onClick={startAutoplay} disabled={recordingStatus === 'recording'}>
                        <Bot size={16} /> Auto
                    </button>
                ) : (
                    <button type="button" className="danger fs-ctrl-btn fs-dominant-btn" onClick={stopAutoplay}>
                        <Square size={16} /> Stop Auto
                    </button>
                )}
            </div>

            {/* Auth overlay for 60s unlock */}
            {showAuthOverlay && (
                <PianoAuthOverlay
                    onSuccess={() => {
                        setShowAuthOverlay(false);
                        setRecordDurationMs && setRecordDurationMs(60000);
                    }}
                    onClose={() => setShowAuthOverlay(false)}
                />
            )}

            <div className="piano-wrapper fs-piano-wrapper" style={{ position: 'relative' }}>
                {comboShow && combo >= 3 && (
                    <div className="combo-flyout" style={{
                        position: 'absolute', top: '25%', left: '50%', transform: 'translate(-50%, -50%)',
                        zIndex: 50, color: '#fcd34d', fontSize: '2rem', fontWeight: 'bold',
                        textShadow: '0 4px 10px rgba(0,0,0,0.5)', pointerEvents: 'none'
                    }}>
                        {combo >= 5 ? 'Perfect!' : 'Great!'} {combo}x
                    </div>
                )}
                <canvas className="notes-canvas" ref={canvasRef} />
                <div
                    className="keyboard"
                    style={{ touchAction: 'none' }}
                    onTouchStart={onTouchStart}
                    onTouchMove={onTouchMove}
                    onTouchEnd={onTouchEnd}
                    onTouchCancel={onTouchEnd}
                >
                    {keyLayout.map((key) => (
                        <div
                            key={key.midi}
                            ref={(el) => { keyRefs.current[key.midi] = el; }}
                            className={`key ${key.isBlack ? 'black-key' : 'white-key'}`}
                            style={{ left: key.left, width: key.width }}
                            data-key-index={key.midi}
                            data-state="idle"
                            onMouseDown={() => pressKey(key.midi)}
                            onMouseUp={() => releaseKey(key.midi)}
                            onMouseLeave={() => releaseKey(key.midi)}
                        >
                            <div className="key-label">{key.noteName}</div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default PianoPlayer;
