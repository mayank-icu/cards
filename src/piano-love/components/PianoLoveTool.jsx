import * as React from 'react';
import { useCallback, useEffect, useRef, useState, useMemo, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../../firebase';
import { doc, writeBatch } from 'firebase/firestore';
import ShareModal from '../../components/ShareModal';
import './PianoLoveTool.css';

import toast from 'react-hot-toast';
import PianoHeader from './PianoHeader';
import SongSelection from './SongSelection';
import PianoPlayer from './PianoPlayer';
import MessageForm from './MessageForm';

const loadMidi = () => import('@tonejs/midi');
const loadLottie = () => import('lottie-react');
const loadAnimationData = () => import('../../assets/animations/complete.json');

// Toggle this between '' (relative), '.netlify/functions', or your Cloudflare Worker URL
const API_BASE = 'https://midi-backend.themayankgamerz.workers.dev'; 

function PianoLoveTool() {
  const navigate = useNavigate();
  const [flowStep, setFlowStep] = useState(1);
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [suggestedSongs, setSuggestedSongs] = useState([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedSong, setSelectedSong] = useState(null);
  const [isFetchingMidi, setIsFetchingMidi] = useState(false);
  const [fetchingSongId, setFetchingSongId] = useState(null);

  const [easyMode, setEasyMode] = useState(false);

  const [recordingStatus, setRecordingStatus] = useState('idle'); // idle, ready, recording, done
  const [recordDurationMs, setRecordDurationMs] = useState(30000);
  const [remainingMs, setRemainingMs] = useState(recordDurationMs);
  const [recordedEvents, setRecordedEvents] = useState([]);
  const [wasAutoplayed, setWasAutoplayed] = useState(false);
  const [shareAutoplayMode, setShareAutoplayMode] = useState(false);

  const [senderName, setSenderName] = useState('');
  const [receiverName, setReceiverName] = useState('');
  const [message, setMessage] = useState('');
  const [customSlug, setCustomSlug] = useState('');
  const [showShareModal, setShowShareModal] = useState(false);
  const [cardUrl, setCardUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);

  // We keep songNotes state here as data to pass to PianoPlayer
  const [songNotes, setSongNotes] = useState([]);
  const searchRequestSeqRef = useRef(0);

  const lastMidiBufferRef = useRef(null);
  const lastSongMetaRef = useRef(null);

  const hasProgress = !!(selectedSong || recordedEvents.length > 0 || senderName || receiverName || flowStep > 1);
  const selectedSongLabel = selectedSong ? `${selectedSong.title} - ${selectedSong.artist || 'Unknown Artist'}` : 'No song selected';

  const isFullscreenStep = flowStep === 1 || flowStep >= 3;

  const successAnimationData = useMemo(() => {
    let animationData = null;
    try {
      // We'll load this dynamically when needed
      animationData = null;
    } catch {
      animationData = null;
    }
    return animationData;
  }, []);

  const [LottieComponent, setLottieComponent] = useState(null);
  const [animationData, setAnimationData] = useState(null);

  // Load Lottie component and animation data when needed
  useEffect(() => {
    if (showSuccessAnimation && !LottieComponent && !animationData) {
      Promise.all([loadLottie(), loadAnimationData()]).then(([lottieModule, animationModule]) => {
        setLottieComponent(() => lottieModule.default);
        const src = animationModule.default || animationModule;
        try {
          setAnimationData(structuredClone(src));
        } catch {
          setAnimationData(JSON.parse(JSON.stringify(src)));
        }
      });
    }
  }, [showSuccessAnimation, LottieComponent, animationData]);

  const handleExitRequest = useCallback(() => {
    if (hasProgress) {
      setShowExitDialog(true);
    } else {
      if (window.history.length > 1) navigate(-1);
      else navigate('/');
    }
  }, [hasProgress, navigate]);

  const confirmExit = useCallback(() => {
    setShowExitDialog(false);
    if (window.history.length > 1) navigate(-1);
    else navigate('/');
  }, [navigate]);

  const extractFullSongLayout = useCallback((midi, isEasyMode, limitMs = 30000) => {
    let rawNotes = [];
    const tracks = (midi.tracks || []).slice().sort((a, b) => (b.notes?.length || 0) - (a.notes?.length || 0));

    let addedTracks = 0;
    for (const track of tracks) {
      if (track.channel === 9 || !track.notes || track.notes.length < 10) continue;

      track.notes.forEach(note => {
        rawNotes.push({
          time: note.time,
          duration: Math.max(note.duration, 0.08),
          midi: note.midi,
          altColor: false
        });
      });

      addedTracks++;
      if (addedTracks >= 2) break; // Keep it light for performance
    }

    if (!rawNotes.length) throw new Error('No usable notes found in this MIDI file.');
    rawNotes.sort((a, b) => a.time - b.time);

    const AVAILABLE_KEYS_NORMAL = [0, 1, 2, 4, 5, 6, 7, 8, 9, 11];
    const availableKeys = AVAILABLE_KEYS_NORMAL;

    const mapMidiToLayout = (pitch) => {
      let mod = ((pitch % 12) + 12) % 12;
      if (availableKeys.includes(mod)) return mod + 60;

      for (let step = 1; step <= 6; step += 1) {
        const up = (mod + step) % 12;
        const down = (mod - step + 12) % 12;
        if (availableKeys.includes(up)) return up + 60;
        if (availableKeys.includes(down)) return down + 60;
      }
      return 60;
    };

    let notes = rawNotes.map((n) => ({
      ...n,
      originalMidi: n.midi,
      midi: mapMidiToLayout(n.midi)
    }));

    // Make limited polyphonic for easy 2-finger playing
    const thinnedNotes = [];
    let currentSliceVoices = 0;
    let sliceTime = -1;

    const maxVoices = isEasyMode ? 1 : 2;
    const sliceWindow = isEasyMode ? 0.18 : 0.08;
    const minGapSeconds = isEasyMode ? 0.22 : 0;

    let lastAcceptedTime = -Infinity;

    for (const note of notes) {
      const maxSeconds = limitMs / 1000;
      if (note.time > maxSeconds) break; // Limit song length based on duration selector

      if (minGapSeconds && note.time - lastAcceptedTime < minGapSeconds) continue;

      if (Math.abs(note.time - sliceTime) > sliceWindow) {
        sliceTime = note.time;
        currentSliceVoices = 1;
        thinnedNotes.push(note);
        lastAcceptedTime = note.time;
      } else if (currentSliceVoices < maxVoices) {
        const lastNote = thinnedNotes[thinnedNotes.length - 1];
        if (lastNote && lastNote.midi !== note.midi) {
          thinnedNotes.push(note);
          currentSliceVoices++;
          lastAcceptedTime = note.time;
        }
      }
    }

    notes = thinnedNotes;

    for (let i = 1; i < notes.length; i++) {
      // give adjacent same-time notes diff colors simply based on previous
      if (notes[i].midi === notes[i - 1].midi) {
        notes[i].altColor = !notes[i - 1].altColor;
      } else {
        notes[i].altColor = false;
      }
    }

    return { notes };
  }, []);

  const loadMidiFromArrayBuffer = useCallback(async (arrayBuffer, songMeta, forceEasyMode = null, forceRecordDuration = null) => {
    try {
      const { Midi } = await loadMidi();
      const midi = new Midi(arrayBuffer);
      const nextEasyMode = typeof forceEasyMode === 'boolean' ? forceEasyMode : easyMode;
      const nextDuration = forceRecordDuration !== null ? forceRecordDuration : recordDurationMs;
      const { notes } = extractFullSongLayout(midi, nextEasyMode, nextDuration);

      lastMidiBufferRef.current = arrayBuffer;
      lastSongMetaRef.current = songMeta;

      setSongNotes(notes);
      setSelectedSong(songMeta);
      setFlowStep(2);
      setRecordingStatus('idle');
      setRemainingMs(nextDuration);
      setRecordedEvents([]);
      setWasAutoplayed(false);
      setShareAutoplayMode(false);
      toast.dismiss();
    } catch (error) {
      console.error('Failed to load MIDI:', error);
      toast.error('Failed to load MIDI file');
    }
  }, [extractFullSongLayout, easyMode, recordDurationMs]);

  const toggleEasyMode = useCallback((next) => {
    setEasyMode(next);
    if (lastMidiBufferRef.current && lastSongMetaRef.current) {
      loadMidiFromArrayBuffer(lastMidiBufferRef.current, lastSongMetaRef.current, next);
    }
  }, [loadMidiFromArrayBuffer]);

  const handleDurationChange = useCallback((nextDurationMs) => {
    setRecordDurationMs(nextDurationMs);
    if (lastMidiBufferRef.current && lastSongMetaRef.current) {
      loadMidiFromArrayBuffer(lastMidiBufferRef.current, lastSongMetaRef.current, null, nextDurationMs);
    }
  }, [loadMidiFromArrayBuffer]);

  useEffect(() => {
    let mounted = true;
    const controller = new AbortController();

    const loadFeatured = async () => {
      setIsLoadingSuggestions(true);
      try {
        const response = await fetch(`${API_BASE}/api/midi-search`, { signal: controller.signal });
        const payload = await response.json().catch(() => ({ results: [] }));
        const rows = Array.isArray(payload?.results) ? payload.results : [];
        if (!mounted) return;
        setSuggestedSongs(rows.filter((item) => item?.midiUrl));
      } catch {
        if (!mounted) return;
        setSuggestedSongs([]);
      } finally {
        if (!mounted) return;
        setIsLoadingSuggestions(false);
      }
    };

    loadFeatured();
    return () => {
      mounted = false;
      controller.abort();
    };
  }, []);

  const handleSelectSong = useCallback(async (item) => {
    try {
      toast.dismiss();
      setIsFetchingMidi(true);
      setFetchingSongId(item.id);
      const response = await fetch(item.midiUrl);
      if (!response.ok) throw new Error(`Could not load MIDI (${response.status}).`);
      const data = await response.arrayBuffer();
      await loadMidiFromArrayBuffer(data, {
        id: item.id || `song-${Date.now()}`,
        title: item.title || 'Selected Song',
        artist: item.artist || 'Unknown Artist'
      }, null, recordDurationMs);
    } catch (error) {
      toast.error(error.message || 'Failed to load this song.');
    } finally {
      setIsFetchingMidi(false);
      setFetchingSongId(null);
    }
  }, [loadMidiFromArrayBuffer, recordDurationMs]);

  const runSearch = useCallback(async (term) => {
    const clean = String(term || '').trim();
    // Allow category keys ('pop', 'love', etc.) — only block truly empty strings
    if (!clean) {
      setSearchResults([]);
      toast.dismiss();
      return;
    }

    const currentSeq = searchRequestSeqRef.current + 1;
    searchRequestSeqRef.current = currentSeq;
    setIsSearching(true);
    toast.dismiss();

    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 12000);

    try {
      const response = await fetch(`${API_BASE}/api/midi-search?q=${encodeURIComponent(clean)}`, {
        signal: controller.signal
      });
      if (!response.ok) throw new Error('Search service unavailable.');

      const payload = await response.json().catch(() => ({ results: [] }));
      const rows = Array.isArray(payload?.results) ? payload.results : [];
      const totalIndexed = payload?.meta?.totalIndexed;
      console.log('[piano-love] midi-search', { q: clean, totalIndexed, results: rows.length });

      if (currentSeq !== searchRequestSeqRef.current) return;
      const filtered = rows.filter((item) => item?.midiUrl);
      setSearchResults(filtered);
      // Only show "no songs" if backend returned truly zero results (not a fallback)
      if (!rows.length) {
        toast('No exact match — showing popular picks instead.', { icon: '🎵' });
      }
    } catch {
      if (currentSeq !== searchRequestSeqRef.current) return;
      setSearchResults([]);
      toast.error('Search failed. Check your connection and try again.');
    } finally {
      window.clearTimeout(timeout);
      if (currentSeq === searchRequestSeqRef.current) {
        setIsSearching(false);
      }
    }
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!senderName.trim() || !receiverName.trim()) {
      toast.error('Sender and receiver names are required.');
      return;
    }

    setIsSubmitting(true);
    toast.dismiss();

    try {
      const cardId = `piano-${Date.now()}`;
      // When autoplay was used, always include the song notes for playback
      // The checkbox is just for transparency, not functionality
      let finalEvents = recordedEvents;
      if (wasAutoplayed && songNotes && songNotes.length > 0) {
        finalEvents = songNotes.map(n => ({
          midi: n.midi,
          originalMidi: n.originalMidi,
          key: 'AutoPlay',
          atMs: Math.round(n.time * 1000)
        }));
      }

      const payload = {
        type: 'piano',
        createdAt: new Date().toISOString(),
        senderName: senderName.trim(),
        receiverName: receiverName.trim(),
        message: message.trim(),
        durationMs: recordDurationMs,
        autoplayUsed: !!wasAutoplayed,
        autoplayShared: !!(wasAutoplayed && shareAutoplayMode),
        recordedEvents: finalEvents,
        songId: selectedSong?.id || null,
        songLabel: selectedSongLabel,
        customSlug: customSlug.trim() || null
      };

      const batch = writeBatch(db);
      const cardRef = doc(db, 'piano_love_cards', cardId);
      batch.set(cardRef, payload);

      if (customSlug) {
        const slugRef = doc(db, 'slugs', customSlug);
        batch.set(slugRef, {
          slug: customSlug,
          cardType: 'piano',
          cardId: cardId,
          createdAt: Date.now()
        });
      }

      await batch.commit();

      const url = customSlug
        ? `${window.location.origin}/piano/${customSlug}`
        : `${window.location.origin}/piano/${cardId}`;

      setCardUrl(url);
      toast.success('Saved successfully. Your piano message is ready.');
      setShowSuccessAnimation(true);
      setShowShareModal(true);

      // Save locally as backup
      try {
        const existing = JSON.parse(localStorage.getItem('piano-love-submissions') || '[]');
        localStorage.setItem('piano-love-submissions', JSON.stringify([payload, ...existing].slice(0, 30)));
      } catch {
        // Ignore local storage error
      }
    } catch (error) {
      toast.error('Failed to save your card. Please try again later.');
    } finally {
      setIsSubmitting(false);
    }
  }, [customSlug, message, receiverName, recordDurationMs, recordedEvents, selectedSong, senderName, shareAutoplayMode, wasAutoplayed, songNotes, selectedSongLabel]);

  return (
    <div className={`piano-love-tool theme-light ${isFullscreenStep ? 'pl-fullscreen' : ''}`.trim()}>
      <PianoHeader
        variant={isFullscreenStep ? 'fullscreen' : 'standalone'}
        leftContent={
          flowStep === 1 ? (
            <button type="button" className="exit-btn" onClick={handleExitRequest} aria-label="Exit">
              &larr; Exit
            </button>
          ) : (
            <button type="button" className="exit-btn" onClick={() => setFlowStep((prev) => prev - 1)} aria-label="Back">
              &larr; Back
            </button>
          )
        }
        centerContent={null}
        rightContent={
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
            {selectedSong && <span style={{ fontSize: '0.85rem', color: '#666', fontWeight: 600 }}>{selectedSongLabel}</span>}
            <div className="step-track">
              <span
                className={`step-pill ${flowStep >= 1 ? 'done' : ''}`}
                style={{ cursor: 'pointer' }}
                onClick={() => setFlowStep(1)}
              >
                1. Song
              </span>
              <span
                className={`step-pill ${flowStep >= 2 ? (flowStep > 2 ? 'done' : 'active') : ''}`}
                style={{ cursor: selectedSong ? 'pointer' : 'default', opacity: selectedSong ? 1 : 0.6 }}
                onClick={() => { if (selectedSong) setFlowStep(2); }}
              >
                2. Record
              </span>
              <span
                className={`step-pill ${flowStep >= 3 ? 'active' : ''}`}
                style={{ cursor: recordingStatus === 'done' ? 'pointer' : 'default', opacity: recordingStatus === 'done' ? 1 : 0.6 }}
                onClick={() => { if (recordingStatus === 'done') setFlowStep(3); }}
              >
                3. Send
              </span>
            </div>
          </div>
        }
      />

      <div className="flow-container">

        {flowStep === 1 && (
          <SongSelection
            query={query}
            setQuery={setQuery}
            searchResults={searchResults}
            suggestedSongs={suggestedSongs}
            isLoadingSuggestions={isLoadingSuggestions}
            isSearching={isSearching}
            selectedSong={selectedSong}
            handleSelectSong={handleSelectSong}
            runSearch={runSearch}
            isFetchingMidi={isFetchingMidi}
            fetchingSongId={fetchingSongId}
            fullscreen={isFullscreenStep}
          />
        )}

        {flowStep === 2 && (
          <PianoPlayer
            selectedSong={selectedSong}
            songNotes={songNotes}
            easyMode={easyMode}
            setEasyMode={toggleEasyMode}
            recordingStatus={recordingStatus}
            setRecordingStatus={setRecordingStatus}
            recordedEvents={recordedEvents}
            setRecordedEvents={setRecordedEvents}
            setWasAutoplayed={setWasAutoplayed}
            remainingMs={remainingMs}
            setRemainingMs={setRemainingMs}
            setFlowStep={setFlowStep}
            recordDurationMs={recordDurationMs}
            setRecordDurationMs={handleDurationChange}
          />
        )}

        {flowStep >= 3 && (
          <MessageForm
            flowStep={flowStep}
            setFlowStep={setFlowStep}
            senderName={senderName}
            setSenderName={setSenderName}
            receiverName={receiverName}
            setReceiverName={setReceiverName}
            message={message}
            setMessage={setMessage}
            customSlug={customSlug}
            setCustomSlug={setCustomSlug}
            selectedSongLabel={selectedSongLabel}
            recordedEventsCount={recordedEvents.length}
            isSubmitting={isSubmitting}
            handleSubmit={handleSubmit}
            wasAutoplayed={wasAutoplayed}
            shareAutoplayMode={shareAutoplayMode}
            setShareAutoplayMode={setShareAutoplayMode}
          />
        )}
      </div>

      {showExitDialog && (
        <div className="exit-overlay" style={{ zIndex: 9999 }}>
          <div className="exit-dialog">
            <h3>Leave without saving?</h3>
            <p className="tiny-text" style={{ margin: '1rem 0 2rem' }}>You will lose your selected song and recorded messages.</p>
            <div className="modal-actions" style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button type="button" className="ghost" onClick={() => setShowExitDialog(false)}>Cancel</button>
              <button type="button" className="danger" onClick={confirmExit}>Exit</button>
            </div>
          </div>
        </div>
      )}

      {showShareModal && (
        <ShareModal
          isOpen={showShareModal}
          onClose={() => navigate('/', { replace: true })}
          cardUrl={cardUrl}
          cardType="piano"
        />
      )}

      {showSuccessAnimation && LottieComponent && animationData && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 99999, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: 'max(72px, env(safe-area-inset-top))', pointerEvents: 'none' }}>
          <LottieComponent
            animationData={animationData}
            loop={false}
            onComplete={() => setShowSuccessAnimation(false)}
            style={{ width: 400, height: 400 }}
          />
        </div>
      )}
    </div>
  );
}

export default PianoLoveTool;
