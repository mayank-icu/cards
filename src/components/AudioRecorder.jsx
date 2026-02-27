import React, { useState, useRef, useEffect, useCallback, memo } from 'react';
import { Mic, Square, Play, Pause, Trash2 } from 'lucide-react';
import './AudioRecorder.css';

const AudioRecorder = ({ onAudioRecorded, currentAudio }) => {
    const [isRecording, setIsRecording] = useState(false);
    const [audioBlob, setAudioBlob] = useState(currentAudio);
    const [isPlaying, setIsPlaying] = useState(false);
    const [audioUrl, setAudioUrl] = useState(null);
    const [recordingTime, setRecordingTime] = useState(0);
    const [audioLevel, setAudioLevel] = useState(0);

    const mediaRecorderRef = useRef(null);
    const audioContextRef = useRef(null);
    const analyserRef = useRef(null);
    const audioPlayerRef = useRef(null);
    const animationRef = useRef(null);
    const timerRef = useRef(null);

    const stopRecording = useCallback(() => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            setAudioLevel(0);

            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        }
    }, [isRecording]);

    useEffect(() => {
        return () => {
            stopRecording();
            if (audioPlayerRef.current) {
                audioPlayerRef.current.pause();
            }
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        };
    }, [stopRecording]);

    const visualizeAudio = useCallback((stream) => {
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
        analyserRef.current = audioContextRef.current.createAnalyser();
        const source = audioContextRef.current.createMediaStreamSource(stream);
        source.connect(analyserRef.current);
        analyserRef.current.fftSize = 256;

        const bufferLength = analyserRef.current.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        const updateLevel = () => {
            if (!isRecording) return;

            analyserRef.current.getByteFrequencyData(dataArray);
            const average = dataArray.reduce((a, b) => a + b) / bufferLength;
            setAudioLevel(average / 255);

            animationRef.current = requestAnimationFrame(updateLevel);
        };

        updateLevel();
    }, [isRecording]);

    const startRecording = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorderRef.current = new MediaRecorder(stream);
            const chunks = [];

            mediaRecorderRef.current.ondataavailable = (e) => chunks.push(e.data);
            mediaRecorderRef.current.onstop = () => {
                const blob = new Blob(chunks, { type: 'audio/webm' });
                setAudioBlob(blob);
                setAudioUrl(URL.createObjectURL(blob));
                onAudioRecorded(blob);

                stream.getTracks().forEach(track => track.stop());
                if (audioContextRef.current) {
                    audioContextRef.current.close();
                }
            };

            mediaRecorderRef.current.start();
            setIsRecording(true);
            setRecordingTime(0);

            timerRef.current = setInterval(() => {
                setRecordingTime(prev => prev + 1);
            }, 1000);

            visualizeAudio(stream);
        } catch (err) {
            console.error('Microphone access error:', err);
            alert('Could not access microphone. Please check permissions.');
        }
    }, [onAudioRecorded, visualizeAudio]);

    const togglePlayback = useCallback(() => {
        if (!audioUrl) return;

        if (isPlaying) {
            audioPlayerRef.current?.pause();
            setIsPlaying(false);
        } else {
            if (!audioPlayerRef.current) {
                audioPlayerRef.current = new Audio(audioUrl);
                audioPlayerRef.current.onended = () => setIsPlaying(false);
            }
            audioPlayerRef.current.play();
            setIsPlaying(true);
        }
    }, [audioUrl, isPlaying]);

    const deleteRecording = useCallback(() => {
        if (audioPlayerRef.current) {
            audioPlayerRef.current.pause();
            audioPlayerRef.current = null;
        }
        setAudioBlob(null);
        setAudioUrl(null);
        setIsPlaying(false);
        setRecordingTime(0);
        onAudioRecorded(null);
    }, [onAudioRecorded]);

    const formatTime = useCallback((seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }, []);

    return (
        <div className="audio-recorder-container">
            {!audioBlob ? (
                <div className="recording-controls">
                    {!isRecording ? (
                        <button
                            type="button"
                            onClick={startRecording}
                            className="record-start-btn"
                        >
                            <Mic size={24} />
                            <span>Start Recording</span>
                        </button>
                    ) : (
                        <div className="recording-active">
                            <div className="waveform-container">
                                <div className="waveform-bars">
                                    {[...Array(20)].map((_, i) => (
                                        <div
                                            key={i}
                                            className="waveform-bar"
                                            style={{
                                                height: `${Math.max(20, audioLevel * 100 * (0.5 + Math.random() * 0.5))}%`,
                                                animationDelay: `${i * 0.05}s`,
                                                background: `rgba(219, 39, 119, ${0.3 + audioLevel})`
                                            }}
                                        />
                                    ))}
                                </div>
                            </div>
                            <div className="recording-info">
                                <div className="recording-indicator">
                                    <span className="recording-dot"></span>
                                    <span className="recording-text">Recording</span>
                                </div>
                                <span className="recording-time">{formatTime(recordingTime)}</span>
                            </div>
                            <button
                                type="button"
                                onClick={stopRecording}
                                className="record-stop-btn"
                            >
                                <Square size={20} />
                                <span>Stop</span>
                            </button>
                        </div>
                    )}
                </div>
            ) : (
                <div className="audio-playback">
                    <div className="audio-info">
                        <Mic size={20} className="audio-icon" />
                        <span className="audio-duration">Audio Note ({formatTime(recordingTime)})</span>
                    </div>
                    <div className="audio-actions">
                        <button
                            type="button"
                            onClick={togglePlayback}
                            className="audio-play-btn"
                        >
                            {isPlaying ? <Pause size={18} /> : <Play size={18} />}
                        </button>
                        <button
                            type="button"
                            onClick={deleteRecording}
                            className="audio-delete-btn"
                        >
                            <Trash2 size={18} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default memo(AudioRecorder);
