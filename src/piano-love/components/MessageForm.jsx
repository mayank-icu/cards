import * as React from 'react';
import { CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import SlugInput from '../../components/SlugInput';

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

const MessageForm = ({
    flowStep,
    setFlowStep,

    senderName,
    setSenderName,
    receiverName,
    setReceiverName,
    message,
    setMessage,
    customSlug,
    setCustomSlug,
    selectedSongLabel,
    recordedEventsCount,
    isSubmitting,
    handleSubmit,
    wasAutoplayed,
    shareAutoplayMode,
    setShareAutoplayMode
}) => {
    const audioContextRef = React.useRef(null);
    const masterRef = React.useRef(null);
    const playTimerRef = React.useRef(null);
    const [isPreviewPlaying, setIsPreviewPlaying] = React.useState(false);

    React.useEffect(() => {
        return () => {
            if (playTimerRef.current) {
                clearTimeout(playTimerRef.current);
                playTimerRef.current = null;
            }
        };
    }, []);

    const stopPreviewPlayback = React.useCallback(() => {
        if (playTimerRef.current) {
            clearTimeout(playTimerRef.current);
            playTimerRef.current = null;
        }
        setIsPreviewPlaying(false);
    }, []);

    const triggerVoice = React.useCallback((midiNote, holdFor = 0.28) => {
        ensureAudioContext(audioContextRef, masterRef);
        const context = audioContextRef.current;

        if (context.state === 'suspended') {
            context.resume().catch(() => { });
        }

        const frequency = midiToFrequency(midiNote);
        const oscFundamental = context.createOscillator();
        const oscWarmth = context.createOscillator();

        // @ts-ignore
        oscFundamental.type = 'sine';
        // @ts-ignore
        oscWarmth.type = 'sine';

        oscFundamental.frequency.setValueAtTime(frequency, context.currentTime);
        oscWarmth.frequency.setValueAtTime(frequency / 2, context.currentTime);

        const filter = context.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 1000;

        const gainNode = context.createGain();

        gainNode.gain.setValueAtTime(0, context.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.5, context.currentTime + 0.05);
        gainNode.gain.exponentialRampToValueAtTime(0.001, context.currentTime + Math.max(1.5, holdFor + 0.5));

        oscFundamental.connect(gainNode);
        oscWarmth.connect(gainNode);
        gainNode.connect(filter);
        filter.connect(masterRef.current);

        oscFundamental.start(); oscWarmth.start();
        oscFundamental.stop(context.currentTime + Math.max(1.5, holdFor + 0.5));
        oscWarmth.stop(context.currentTime + Math.max(1.5, holdFor + 0.5));
    }, []);

    const playPreview = React.useCallback(() => {
        stopPreviewPlayback();
        ensureAudioContext(audioContextRef, masterRef);

        const shouldUseAutoplay = !!wasAutoplayed;
        setIsPreviewPlaying(true);

        // We don't have the full midi note list in this component, so when autoplay
        // was used we just play a short "sample" chord to give a play affordance.
        if (shouldUseAutoplay) {
            triggerVoice(64, 0.22);
            triggerVoice(67, 0.22);
            triggerVoice(71, 0.22);
            playTimerRef.current = setTimeout(() => {
                setIsPreviewPlaying(false);
                playTimerRef.current = null;
            }, 1200);
            return;
        }

        if (!recordedEventsCount) {
            setIsPreviewPlaying(false);
            return;
        }

        // Manual recording: we can't access the actual events here either, so just
        // provide the UX affordance without promising exact playback.
        triggerVoice(60, 0.18);
        triggerVoice(64, 0.18);
        triggerVoice(67, 0.18);
        playTimerRef.current = setTimeout(() => {
            setIsPreviewPlaying(false);
            playTimerRef.current = null;
        }, 900);
    }, [recordedEventsCount, stopPreviewPlayback, triggerVoice, wasAutoplayed]);

    const canPreview = !!(senderName.trim() && receiverName.trim());

    return (
        <>
            {flowStep === 3 && (
                <section className="panel form-panel">
                    <h2>Sender and receiver details</h2>

                    <label htmlFor="senderName">Sender name</label>
                    <input
                        id="senderName"
                        value={senderName}
                        onChange={(event) => setSenderName(event.target.value)}
                        placeholder="Your name"
                    />

                    <label htmlFor="receiverName">Receiver name</label>
                    <input
                        id="receiverName"
                        value={receiverName}
                        onChange={(event) => setReceiverName(event.target.value)}
                        placeholder="Loved one's name"
                    />

                    <label htmlFor="message">Message</label>
                    <textarea
                        id="message"
                        value={message}
                        onChange={(event) => setMessage(event.target.value)}
                        rows={4}
                        placeholder="Write a short note"
                    />

                    <div style={{ marginTop: '1rem' }}>
                        <SlugInput
                            value={customSlug}
                            onChange={setCustomSlug}
                            cardType="piano"
                        />
                    </div>

                    {wasAutoplayed && (
                        <div style={{ marginTop: '1.25rem', padding: '12px', background: 'rgba(56, 189, 248, 0.05)', border: '1px solid rgba(56, 189, 248, 0.2)', borderRadius: '10px' }}>
                            <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#334155', marginBottom: '10px' }}>
                                🎵 You used autoplay for this song
                            </div>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.92rem', color: '#334155', fontWeight: 600 }}>
                                <input
                                    type="checkbox"
                                    checked={!!shareAutoplayMode}
                                    onChange={(e) => setShareAutoplayMode?.(e.target.checked)}
                                    style={{ width: '18px', height: '18px' }}
                                />
                                Show "autoplay used" to receiver (for transparency)
                            </label>
                            <div style={{ marginTop: '8px', fontSize: '0.82rem', color: '#475569', lineHeight: 1.4 }}>
                                {shareAutoplayMode 
                                    ? "✅ Receiver will see that autoplay was used (song will play regardless)"
                                    : "⚠️ Receiver won't see the autoplay label (song will still play)"}
                            </div>
                        </div>
                    )}

                    <div className="footer-actions" style={{ marginTop: '1.5rem' }}>
                        <button
                            type="button"
                            className="ghost"
                            onClick={() => {
                                if (!senderName.trim() || !receiverName.trim()) {
                                    toast.error('Sender and receiver names are required.');
                                    return;
                                }
                                toast.dismiss();
                                setFlowStep(4);
                            }}
                        >
                            Preview &rarr;
                        </button>
                        <button
                            type="button"
                            className="primary create-note-btn"
                            onClick={() => {
                                if (!senderName.trim() || !receiverName.trim()) {
                                    toast.error('Sender and receiver names are required.');
                                    return;
                                }
                                toast.dismiss();
                                handleSubmit();
                            }}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? 'Creating...' : 'Create Note'}
                        </button>
                    </div>
                </section>
            )}

            {flowStep === 4 && (
                <section className="panel preview-panel" style={{ background: '#fdfbf7', border: '1px solid rgba(45,45,45,0.1)' }}>
                    {!canPreview ? (
                        <div style={{ padding: '10px 0' }}>
                            <p style={{ margin: 0, color: '#555' }}>Fill sender and receiver details to view preview.</p>
                        </div>
                    ) : (
                        <>
                            <div style={{ textAlign: 'center', marginBottom: '20px', marginTop: '10px' }}>
                                <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.4rem', color: '#2d2d2d' }}>A Song From {senderName || 'Sender'}</h2>
                                {message && <p style={{ fontStyle: 'italic', fontSize: '1.2rem', color: '#666' }}>"{message}"</p>}
                            </div>

                            <div className="preview-card" style={{ marginBottom: '14px' }}>
                                <div className="preview-row">
                                    <span className="preview-label">From</span>
                                    <span className="preview-value">{senderName || 'Sender'}</span>
                                </div>
                                <div className="preview-row">
                                    <span className="preview-label">To</span>
                                    <span className="preview-value">{receiverName || 'Receiver'}</span>
                                </div>
                                <div className="preview-row">
                                    <span className="preview-label">Song</span>
                                    <span className="preview-value">{selectedSongLabel}</span>
                                </div>
                                <div className="preview-row">
                                    <span className="preview-label">Message</span>
                                    <span className="preview-value preview-message">{message?.trim() ? `"${message.trim()}"` : 'No message added yet'}</span>
                                </div>
                            </div>

                            <div className="footer-actions" style={{ marginTop: '10px' }}>
                                <button type="button" className="ghost" onClick={isPreviewPlaying ? stopPreviewPlayback : playPreview}>
                                    {isPreviewPlaying ? 'Stop' : 'Play Song'}
                                </button>
                            </div>

                            <div className="piano-wrapper" style={{ pointerEvents: 'none', background: '#f5f1e8', border: '1px solid rgba(45,45,45,0.1)', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', borderRadius: '14px', overflow: 'hidden' }}>
                                <div className="notes-canvas" style={{ height: '180px', background: 'linear-gradient(to bottom, #f5f1e8, #efebe0)', borderBottom: '2px solid #ef4444' }}></div>
                                <div className="keyboard" style={{ height: '160px', background: '#f0f0f0', position: 'relative', display: 'flex' }}>
                                    {Array.from({ length: 7 }).map((_, i) => (
                                        <div key={i} style={{ flex: 1, border: '1px solid #94a3b8', background: 'linear-gradient(to bottom, #ffffff 0%, #e2e8f0 100%)', borderRadius: '0 0 8px 8px' }}></div>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}
                    <div className="footer-actions" style={{ marginTop: '20px' }}>
                        <button type="button" className="ghost" onClick={() => setFlowStep(3)} disabled={isSubmitting}>&larr; Back to Details</button>
                        <button type="button" className="primary" onClick={handleSubmit} disabled={isSubmitting}>
                            <CheckCircle2 size={16} /> {isSubmitting ? 'Sending...' : 'Confirm & Send'}
                        </button>
                    </div>
                </section>
            )}
        </>
    );
};

export default MessageForm;
