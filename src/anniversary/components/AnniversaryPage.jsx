import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { app, auth, db } from '../../firebase.js';
import {
    doc, onSnapshot, collection, query, where, getDocs, addDoc, orderBy, limit
} from 'firebase/firestore';
import { signInAnonymously } from 'firebase/auth';
import {
    Heart, Star, Music, Gift, Moon, Sun,
    Play, Pause, ArrowDown, Sparkles,
    Send, CheckCircle, PenTool, Loader2, X
} from 'lucide-react';
import CardViewHeader from '../../components/CardViewHeader';
import CardFooter from '../../components/CardFooter';
import SongPlayer from '../../components/SongPlayer';
import { normalizeCardData, resolveCardId } from '../../utils/slugs';

// Simple Confetti Implementation
const fireConfetti = () => {
    const colors = ['#d4af37', '#e6e6fa', '#ffb7b2'];
    for (let i = 0; i < 100; i++) {
        const el = document.createElement('div');
        Object.assign(el.style, {
            position: 'fixed', left: '50%', top: '50%', width: '8px', height: '8px',
            backgroundColor: colors[Math.floor(Math.random() * colors.length)],
            transform: `translate(-50%, -50%) rotate(${Math.random() * 360}deg)`,
            zIndex: '9999', pointerEvents: 'none', borderRadius: '50%'
        });
        document.body.appendChild(el);
        const angle = Math.random() * Math.PI * 2;
        const velocity = 5 + Math.random() * 10;
        const vx = Math.cos(angle) * velocity;
        const vy = Math.sin(angle) * velocity;
        let x = 0, y = 0, opacity = 1;
        const animate = () => {
            x += vx; y += vy + 0.5; opacity -= 0.015;
            el.style.transform = `translate(calc(-50% + ${x}px), calc(-50% + ${y}px)) rotate(${x * 10}deg)`;
            el.style.opacity = opacity;
            if (opacity > 0) requestAnimationFrame(animate); else el.remove();
        };
        requestAnimationFrame(animate);
    }
};

/* --- AUDIO CONTEXT --- */
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
const playNote = (frequency) => {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(frequency, audioCtx.currentTime);
    gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 1);
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + 1);
};

/* --- STYLES --- */
const GlobalStyles = () => (
    <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700&family=Lato:wght@300;400;700&family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=Dancing+Script:wght@400;700&display=swap');

        :root {
            --bg-light: #fffcf5;
            --bg-paper: #fdfbf7;
            --gold: #d4af37;
            --gold-light: #f3e5ab;
            --text-main: #2c2c2c;
            --text-sub: #555555;
            --glass: rgba(255, 255, 255, 0.7);
            --glass-border: rgba(212, 175, 55, 0.2);
            --neon-blue: #4d4dff;
            --font-head: 'Playfair Display', serif;
            --font-body: 'Lato', sans-serif;
            --font-accent: 'Cinzel', serif;
        }

        * { box-sizing: border-box; margin: 0; padding: 0; }
        
        body {
            background-color: var(--bg-light);
            color: var(--text-main);
            font-family: var(--font-body);
            overflow: hidden;
        }

        h1, h2, h3 { font-family: var(--font-head); color: var(--text-main); }
        .cinzel { font-family: var(--font-accent); }

        /* SCROLL CONTAINER */
        .scrolly-container {
            height: 100vh;
            width: 100vw;
            overflow-y: scroll;
            scroll-snap-type: y mandatory;
            scroll-behavior: smooth;
        }

        .snap-section {
            height: 100vh;
            width: 100%;
            scroll-snap-align: start;
            position: relative;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            overflow: hidden;
            padding: 2rem;
            background: radial-gradient(circle at center, #ffffff 0%, var(--bg-light) 100%);
        }

        .content-wrapper {
            z-index: 10;
            max-width: 800px;
            width: 100%;
            position: relative;
            text-align: center;
        }

        /* BUTTONS */
        .primary-btn {
            background: white;
            border: 1px solid var(--gold);
            color: var(--gold);
            padding: 1rem 2rem;
            font-family: var(--font-accent);
            letter-spacing: 2px;
            cursor: pointer;
            transition: all 0.3s ease;
            display: inline-flex;
            align-items: center;
            gap: 10px;
            border-radius: 50px;
            box-shadow: 0 4px 10px rgba(212, 175, 55, 0.1);
        }
        .primary-btn:hover {
            background: var(--gold);
            color: white;
            transform: translateY(-2px);
            box-shadow: 0 10px 20px rgba(212, 175, 55, 0.2);
        }

        /* SECTION 1: GATEWAY */
        .star-bg {
            position: absolute; width: 100%; height: 100%;
            background-image: radial-gradient(#d4af37 1px, transparent 1px);
            background-size: 50px 50px;
            opacity: 0.1;
            animation: move-stars 100s linear infinite;
        }
        @keyframes move-stars { from { background-position: 0 0; } to { background-position: 100px 100px; } }

        .title-large {
            font-size: 4rem; color: var(--gold);
            margin: 1rem 0;
            line-height: 1.1;
            position: relative;
            display: inline-block;
        }
        .title-large::after {
            content: ''; position: absolute; bottom: -10px; left: 50%; transform: translateX(-50%);
            width: 50px; height: 3px; background: var(--gold);
        }

        .partners-display {
            font-size: 1.5rem; letter-spacing: 3px;
            color: var(--text-sub); margin-top: 2rem;
            display: flex; justify-content: center; align-items: center; gap: 15px;
            text-transform: uppercase;
        }

        /* ENHANCED TIMER SECTION */
        .timer-section {
            background: linear-gradient(135deg, #fffcf5 0%, #fdfbf7 50%, #fff5e6 100%);
            position: relative;
            overflow: hidden;
        }
        
        .timer-section::before {
            content: '';
            position: absolute;
            top: -50%;
            left: -50%;
            width: 200%;
            height: 200%;
            background: radial-gradient(circle, rgba(212, 175, 55, 0.05) 0%, transparent 70%);
            animation: rotate 30s linear infinite;
        }
        
        @keyframes rotate { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        
        .timer-enhanced-grid {
            display: grid; 
            grid-template-columns: repeat(4, 1fr);
            gap: 2rem; 
            margin-top: 3rem;
            position: relative;
            z-index: 10;
        }
        
        .timer-enhanced-box {
            background: white;
            border: 2px solid var(--gold);
            padding: 2rem 1.5rem;
            border-radius: 20px;
            box-shadow: 0 15px 40px rgba(212, 175, 55, 0.1);
            transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            position: relative;
            overflow: hidden;
        }
        
        .timer-enhanced-box::before {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(212, 175, 55, 0.1), transparent);
            transition: left 0.5s;
        }
        
        .timer-enhanced-box:hover {
            transform: translateY(-15px) scale(1.05);
            box-shadow: 0 25px 60px rgba(212, 175, 55, 0.2);
            border-color: #b8941f;
        }
        
        .timer-enhanced-box:hover::before {
            left: 100%;
        }
        
        .timer-enhanced-val { 
            font-family: var(--font-accent); 
            font-size: 3rem; 
            display: block; 
            color: var(--gold);
            font-weight: 700;
            text-shadow: 0 2px 4px rgba(212, 175, 55, 0.2);
            position: relative;
        }
        
        .timer-enhanced-label { 
            font-size: 0.9rem; 
            text-transform: uppercase; 
            letter-spacing: 3px; 
            color: #999; 
            margin-top: 10px;
            font-weight: 600;
        }
        
        .timer-icon {
            position: absolute;
            top: -10px;
            right: -10px;
            width: 40px;
            height: 40px;
            background: var(--gold);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 0.8rem;
        }
        
        .timer-pulse {
            animation: timerPulse 2s infinite;
        }
        
        @keyframes timerPulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.05); }
        }

        /* SECTION: PHOTO */
        .polaroid-container { perspective: 1000px; }
        .polaroid-card {
            width: 300px; height: 400px;
            position: relative;
            transform-style: preserve-3d;
            transition: transform 0.8s;
            cursor: pointer;
            margin: 0 auto;
        }
        .polaroid-card:hover { transform: rotateY(180deg); }
        .polaroid-front, .polaroid-back {
            position: absolute; width: 100%; height: 100%;
            backface-visibility: hidden;
            background: #fff; padding: 15px 15px 60px 15px;
            box-shadow: 0 20px 50px rgba(0,0,0,0.1);
            display: flex; flex-direction: column; align-items: center;
            border: 1px solid #eee;
        }
        .polaroid-back { transform: rotateY(180deg); justify-content: center; background: #fffcf0; padding: 2rem; text-align: center; }
        .photo-frame { width: 100%; height: 100%; overflow: hidden; background: #eee; }
        .photo-frame img { width: 100%; height: 100%; object-fit: cover; }
        .handwritten { font-family: 'Dancing Script', cursive; font-size: 1.8rem; color: var(--text-main); margin-top: 10px; }

        /* SECTION: HEARTBEAT */
        .heart-wrapper {
            position: relative; display: inline-block;
            cursor: pointer;
        }
        .pulsing-circle { animation: heartbeat 1.5s infinite; }
        @keyframes heartbeat { 0% { transform: scale(1); } 15% { transform: scale(1.1); } 30% { transform: scale(1); } 45% { transform: scale(1.1); } 100% { transform: scale(1); } }
        
        .ripple {
            position: absolute; border-radius: 50%;
            border: 1px solid var(--gold);
            top: 50%; left: 50%;
            transform: translate(-50%, -50%) scale(0);
            width: 100px; height: 100px;
            animation: ripple 1s linear forwards;
            pointer-events: none;
        }
        @keyframes ripple { to { transform: translate(-50%, -50%) scale(4); opacity: 0; } }

        /* SECTION: VOWS */
        .vow-card {
            background: white; padding: 3rem;
            border-radius: 20px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.05);
            max-width: 600px; margin: 0 auto;
            position: relative;
            transition: all 0.5s ease;
        }
        .vow-card.dark-mode {
            background: #2c2c2c; color: white;
        }
        .toggle-container {
            display: flex; justify-content: center; gap: 1rem; margin-bottom: 2rem;
            background: #eee; padding: 5px; border-radius: 50px; display: inline-flex;
        }
        .vow-toggle {
            padding: 8px 20px; border-radius: 50px; cursor: pointer; display: flex; align-items: center; gap: 8px; font-size: 0.9rem;
            transition: all 0.3s;
        }
        .vow-toggle.active { background: white; shadow: 0 2px 5px rgba(0,0,0,0.1); color: var(--gold); }

        /* ENHANCED HARMONY SECTION */
        .harmony-section {
            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
            position: relative;
            overflow: hidden;
        }
        
        .harmony-section::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: radial-gradient(circle at center, rgba(212, 175, 55, 0.1) 0%, transparent 70%);
            animation: harmonyGlow 4s ease-in-out infinite alternate;
        }
        
        @keyframes harmonyGlow {
            from { opacity: 0.3; }
            to { opacity: 0.7; }
        }
        
        .harmony-container {
            position: relative;
            z-index: 10;
            text-align: center;
        }
        
        .harmony-title {
            font-size: '3rem';
            color: white;
            margin-bottom: '1rem';
            text-shadow: 0 0 20px rgba(212, 175, 55, 0.5);
        }
        
        .harmony-piano-container {
            background: rgba(0, 0, 0, 0.3);
            border-radius: 20px;
            padding: 3rem 2rem 2rem;
            backdrop-filter: blur(10px);
            border: 2px solid rgba(212, 175, 55, 0.3);
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
            position: relative;
            overflow: hidden;
        }
        
        .harmony-piano-container::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 2px;
            background: linear-gradient(90deg, transparent, var(--gold), transparent);
            animation: pianoGlow 2s ease-in-out infinite;
        }
        
        @keyframes pianoGlow {
            0%, 100% { opacity: 0.3; }
            50% { opacity: 1; }
        }
        
        .harmony-piano-keys {
            display: flex; 
            gap: 4px; 
            justify-content: center; 
            margin-top: 2rem;
            position: relative;
        }
        
        .harmony-piano-key {
            width: 50px; 
            height: 160px; 
            background: linear-gradient(to bottom, #ffffff, #f0f0f0);
            border-radius: 0 0 12px 12px; 
            cursor: pointer;
            border: 1px solid #ddd;
            box-shadow: 0 8px 0 #ccc, 0 10px 20px rgba(0,0,0,0.2);
            transition: all 0.15s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            position: relative;
            overflow: hidden;
        }
        
        .harmony-piano-key::before {
            content: '';
            position: absolute;
            top: 10px;
            left: 50%;
            transform: translateX(-50%);
            width: 4px;
            height: 4px;
            background: rgba(212, 175, 55, 0.3);
            border-radius: 50%;
        }
        
        .harmony-piano-key:active, .harmony-piano-key.active { 
            transform: translateY(6px) scale(0.98); 
            box-shadow: 0 2px 0 #ccc, 0 4px 10px rgba(0,0,0,0.2); 
            background: linear-gradient(to bottom, #f9f9f9, #e0e0e0);
        }
        
        .harmony-piano-key.black {
            background: linear-gradient(to bottom, #2c2c2c, #1a1a1a);
            height: 100px; 
            width: 35px;
            margin-left: -20px; 
            margin-right: -20px; 
            z-index: 2;
            border: none; 
            box-shadow: 0 8px 0 #000, 0 10px 20px rgba(0,0,0,0.4);
        }
        
        .harmony-piano-key.black:active, .harmony-piano-key.black.active {
            box-shadow: 0 2px 0 #000, 0 4px 10px rgba(0,0,0,0.4);
            background: linear-gradient(to bottom, #1a1a1a, #0a0a0a);
        }
        
        .harmony-note-display {
            margin-top: 2rem;
            padding: 1rem 2rem;
            background: rgba(212, 175, 55, 0.1);
            border: 1px solid rgba(212, 175, 55, 0.3);
            border-radius: 50px;
            color: white;
            font-family: var(--font-accent);
            font-size: 1.2rem;
            letter-spacing: 2px;
            min-height: 50px;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.3s ease;
        }
        
        .harmony-note-display.active {
            background: rgba(212, 175, 55, 0.3);
            border-color: var(--gold);
            transform: scale(1.05);
        }
        
        .harmony-music-notes {
            position: absolute;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            display: flex;
            gap: 15px;
            opacity: 0.6;
        }
        
        .music-note {
            font-size: 1.5rem;
            animation: float 3s ease-in-out infinite;
        }
        
        .music-note:nth-child(2) { animation-delay: 0.5s; }
        .music-note:nth-child(3) { animation-delay: 1s; }
        
        @keyframes float {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-10px); }
        }
        
        /* SECTION: BOTTLE */
        .bottle-input {
            width: 100%; border: none; border-bottom: 2px solid var(--gold);
            background: transparent; padding: 1rem;
            font-family: 'Dancing Script', cursive; font-size: 2rem;
            text-align: center; outline: none; color: var(--text-main);
        }
        .bottle-input::placeholder { color: #ccc; }

        /* ENHANCED ENDING SECTION */
        .ending-section {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
            position: relative;
            overflow: hidden;
        }
        
        .ending-section::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: radial-gradient(circle at center, rgba(255, 255, 255, 0.1) 0%, transparent 70%);
            animation: endingGlow 6s ease-in-out infinite alternate;
        }
        
        @keyframes endingGlow {
            from { opacity: 0.2; }
            to { opacity: 0.5; }
        }
        
        .ending-container {
            position: relative;
            z-index: 10;
            text-align: center;
            max-width: 800px;
        }
        
        .ending-title {
            font-size: '4rem';
            color: white;
            margin-bottom: '2rem';
            text-shadow: 0 0 30px rgba(255, 255, 255, 0.5);
            animation: titleFloat 3s ease-in-out infinite;
        }
        
        @keyframes titleFloat {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-10px); }
        }
        
        .ending-subtitle {
            color: rgba(255, 255, 255, 0.9);
            font-size: '1.3rem';
            margin-bottom: '3rem';
            font-family: 'Playfair Display', serif;
            font-style: italic;
        }
        
        .ending-slider-container {
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(20px);
            border: 2px solid rgba(255, 255, 255, 0.2);
            border-radius: 50px;
            padding: 3rem 2rem;
            margin: 3rem auto;
            position: relative;
            overflow: hidden;
        }
        
        .ending-slider-container::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
            animation: sliderGlow 3s linear infinite;
        }
        
        @keyframes sliderGlow {
            from { transform: translateX(-100%); }
            to { transform: translateX(100%); }
        }
        
        .enhanced-future-slider {
            -webkit-appearance: none; 
            width: 100%; 
            height: 8px;
            background: rgba(255, 255, 255, 0.2);
            border-radius: 10px; 
            outline: none;
            position: relative;
            z-index: 2;
        }
        
        .enhanced-future-slider::-webkit-slider-thumb {
            -webkit-appearance: none; 
            width: 32px; 
            height: 32px;
            background: white;
            border-radius: 50%; 
            cursor: pointer;
            box-shadow: 0 0 0 8px rgba(255, 255, 255, 0.3), 0 8px 25px rgba(0, 0, 0, 0.2);
            transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            position: relative;
        }
        
        .enhanced-future-slider::-webkit-slider-thumb:hover { 
            transform: scale(1.2); 
            box-shadow: 0 0 0 12px rgba(255, 255, 255, 0.5), 0 12px 35px rgba(0, 0, 0, 0.3);
        }
        
        .enhanced-future-slider::-webkit-slider-thumb::before {
            content: '✨';
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            font-size: 16px;
        }
        
        .ending-milestone {
            display: flex;
            justify-content: space-between;
            margin-top: 2rem;
            color: rgba(255, 255, 255, 0.8);
            font-size: '0.9rem';
            font-weight: 600;
        }
        
        .ending-message {
            margin-top: 3rem;
            padding: 2rem;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 20px;
            border: 1px solid rgba(255, 255, 255, 0.2);
            backdrop-filter: blur(10px);
            transition: all 0.5s ease;
            opacity: 0;
            transform: translateY(20px);
        }
        
        .ending-message.show {
            opacity: 1;
            transform: translateY(0);
        }
        
        .ending-hearts {
            position: absolute;
            width: 100%;
            height: 100%;
            pointer-events: none;
            overflow: hidden;
        }
        
        .floating-heart {
            position: absolute;
            color: rgba(255, 255, 255, 0.6);
            animation: floatHeart 6s linear infinite;
        }
        
        @keyframes floatHeart {
            0% {
                transform: translateY(100vh) rotate(0deg);
                opacity: 0;
            }
            10% {
                opacity: 1;
            }
            90% {
                opacity: 1;
            }
            100% {
                transform: translateY(-100vh) rotate(360deg);
                opacity: 0;
            }
        }

        /* ENHANCED FLOATING SPOTIFY PLAYER */
        .floating-spotify-player {
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 2000;
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(15px);
            padding: 12px;
            border-radius: 50px;
            box-shadow: 0 8px 32px rgba(212, 175, 55, 0.15);
            display: flex;
            align-items: center;
            gap: 12px;
            border: 2px solid var(--gold);
            transition: all 0.3s ease;
            animation: slideInRight 0.6s ease-out;
        }
        
        .floating-spotify-player:hover {
            transform: scale(1.05);
            box-shadow: 0 12px 40px rgba(212, 175, 55, 0.25);
            background: rgba(255, 255, 255, 1);
        }
        
        .spotify-disc {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            background: linear-gradient(135deg, #1db954, #191414);
            overflow: hidden;
            animation: spin 4s linear infinite;
            border: 2px solid var(--gold);
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        }
        
        .spotify-disc img { 
            width: 100%; 
            height: 100%; 
            object-fit: cover; 
        }
        
        .spotify-info-mini {
            max-width: 140px;
            overflow: hidden;
            white-space: nowrap;
            font-size: 0.85rem;
            color: var(--text-main);
            font-family: var(--font-accent);
            font-weight: 600;
        }
        
        .scrolling-text {
            display: inline-block;
            white-space: nowrap;
            animation: scrollText 12s linear infinite;
        }
        
        @keyframes scrollText {
            0% { transform: translateX(0); }
            100% { transform: translateX(-100%); }
        }
        
        .mini-play-btn {
            background: var(--gold);
            border: none;
            color: white;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            width: 32px;
            height: 32px;
            border-radius: 50%;
            transition: all 0.3s ease;
        }
        
        .mini-play-btn:hover {
            background: #b8941f;
            transform: scale(1.1);
        }
        
        @keyframes slideInRight { 
            from { transform: translateX(120%); opacity: 0; } 
            to { transform: translateX(0); opacity: 1; } 
        }

        /* LOADING */
        .loader-wrap { 
            height: 100vh; display: flex; flex-direction: column; 
            align-items: center; justify-content: center; 
            background: var(--bg-light); color: var(--gold); 
        }

        @media (max-width: 768px) {
            .title-large { font-size: 2.5rem; }
            .timer-grid { grid-template-columns: repeat(2, 1fr); }
            .piano-key { width: 35px; height: 100px; }
        }
    `}</style>
);

/* --- COMPONENTS --- */

const EnhancedSongPlayer = ({ song }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    
    return (
        <div className="floating-spotify-player">
            <div className="spotify-disc" style={{ animationPlayState: isPlaying ? 'running' : 'paused' }}>
                {song.albumArt ? (
                    <img src={song.albumArt} alt="Album Art" />
                ) : (
                    <Music size={20} color="white" style={{ margin: '10px' }} />
                )}
            </div>
            <div className="spotify-info-mini">
                <span className="scrolling-text">{song.name || "Our Song"} - {song.artist || "Artist"}</span>
            </div>
            <button 
                className="mini-play-btn" 
                onClick={() => setIsPlaying(!isPlaying)}
            >
                {isPlaying ? <Pause size={14} /> : <Play size={14} />}
            </button>
            <SongPlayer song={song} isPlaying={isPlaying} setIsPlaying={setIsPlaying} />
        </div>
    );
};

const AnniversaryPage = () => {
    const { id } = useParams();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // States
    const [timeElapsed, setTimeElapsed] = useState({});
    const [vowMode, setVowMode] = useState('light'); // light = days, dark = nights
    const [giftOpened, setGiftOpened] = useState(false);
    const [futureVal, setFutureVal] = useState(50);
    const [bottleMsg, setBottleMsg] = useState('');
    const [bottleSent, setBottleSent] = useState(false);
    const [wishes, setWishes] = useState([]);
    const [newWish, setNewWish] = useState('');
    const [wishName, setWishName] = useState('');
    const [showWishForm, setShowWishForm] = useState(false);
    const [lastNote, setLastNote] = useState(null);

    const canvasRef = useRef(null);

    // Auth & Fetch
    useEffect(() => {
        const init = async () => {
            try {
                if (!auth.currentUser) await signInAnonymously(auth);

                const { id: realId, data: cardData } = await resolveCardId(id, 'anniversaries', 'anniversary');

                if (cardData) {
                    setData(cardData);
                    setLoading(false);
                } else if (realId) {
                    const unsub = onSnapshot(doc(db, 'anniversaries', realId), (snap) => {
                        if (snap.exists()) setData(normalizeCardData(snap.data()));
                        else setError("Timeline not found.");
                        setLoading(false);
                    });
                    return () => unsub();
                } else {
                    setError("Invalid ID");
                    setLoading(false);
                }
            } catch (err) {
                console.error(err);
                setError("Connection Failed");
                setLoading(false);
            }
        };
        init();
    }, [id]);

    // Timer
    useEffect(() => {
        if (!data?.date) return;
        const tick = () => {
            const diff = new Date() - new Date(data.date);
            setTimeElapsed({
                days: Math.floor(diff / (1000 * 60 * 60 * 24)),
                hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
                minutes: Math.floor((diff / 1000 / 60) % 60),
                seconds: Math.floor((diff / 1000) % 60)
            });
        };
        const interval = setInterval(tick, 1000);
        tick();
        return () => clearInterval(interval);
    }, [data]);

    // Canvas Constellation
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        let w = canvas.width = canvas.offsetWidth;
        let h = canvas.height = canvas.offsetHeight;

        const points = Array.from({ length: 30 }, () => ({
            x: Math.random() * w, y: Math.random() * h,
            vx: (Math.random() - 0.5) * 0.5, vy: (Math.random() - 0.5) * 0.5
        }));

        const animate = () => {
            ctx.clearRect(0, 0, w, h);
            ctx.fillStyle = '#d4af37';
            ctx.strokeStyle = 'rgba(212, 175, 55, 0.1)';

            points.forEach((p, i) => {
                p.x += p.vx; p.y += p.vy;
                if (p.x < 0 || p.x > w) p.vx *= -1;
                if (p.y < 0 || p.y > h) p.vy *= -1;

                ctx.beginPath(); ctx.arc(p.x, p.y, 2, 0, Math.PI * 2); ctx.fill();

                points.forEach((p2, j) => {
                    if (i === j) return;
                    const d = Math.hypot(p.x - p2.x, p.y - p2.y);
                    if (d < 100) {
                        ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p2.x, p2.y); ctx.stroke();
                    }
                });
            });
            requestAnimationFrame(animate);
        };
        animate();

        const resize = () => { w = canvas.width = canvas.offsetWidth; h = canvas.height = canvas.offsetHeight; };
        window.addEventListener('resize', resize);
        return () => window.removeEventListener('resize', resize);
    }, [loading]);

    // Handlers
    const handlePiano = (note, freq) => {
        playNote(freq);
        setLastNote(note);
        if (note === 'C' && Math.random() > 0.7) fireConfetti();
    };

    const handleSendBottle = () => {
        if (!bottleMsg.trim()) return;
        setBottleSent(true);
        setTimeout(() => { setBottleMsg(''); setBottleSent(false); }, 3000);
    };

    // Helper to get Spotify ID
    const getSpotifyId = (url) => {
        if (!url || typeof url !== 'string') return null;
        try {
            const parts = url.split('/');
            return parts[parts.length - 1].split('?')[0];
        } catch (e) { return null; }
    };
    const spotifyId = getSpotifyId(data?.song);

    if (loading) return <div className="loader-wrap"><Loader2 className="animate-spin" size={48} /><p>Aligning Stars...</p><GlobalStyles /></div>;
    if (error) return <div className="loader-wrap"><p>{error}</p></div>;

    const years = data.years || 1;

    return (
        <div className="scrolly-container">
            <GlobalStyles />
            <div style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100 }}>
                <CardViewHeader
                    cardType="anniversary"
                    cardId={id}
                    title="Anniversary"
                    subtitle={data?.partner1 && data?.partner2 ? `${data.partner1} & ${data.partner2}` : undefined}
                />
            </div>

            {/* Enhanced Floating Spotify Player */}
            {data.song && <EnhancedSongPlayer song={data.song} />}

            {/* 1. GATEWAY */}
            <section className="snap-section">
                <div className="star-bg"></div>
                <div className="content-wrapper">
                    <h2 className="cinzel" style={{ letterSpacing: '5px', color: '#999' }}>
                        {years} {years === "1" ? 'Year' : 'Years'} Journey
                    </h2>
                    <h1 className="title-large">TIMELESS<br />ORBIT</h1>
                    <div className="partners-display">
                        <span>{data.partner1}</span>
                        <Heart size={20} fill="#d4af37" color="#d4af37" />
                        <span>{data.partner2}</span>
                    </div>
                    <button className="primary-btn" onClick={() => document.getElementById('timer').scrollIntoView({ behavior: 'smooth' })} style={{ marginTop: '3rem' }}>
                        Begin Journey <ArrowDown size={18} />
                    </button>
                </div>
            </section>

            {/* 2. CHRONOMETER */}
            <section id="timer" className="snap-section timer-section">
                <div className="content-wrapper">
                    <h2 style={{ fontSize: '3rem', color: 'var(--gold)', marginBottom: '1rem' }}>The Count</h2>
                    <p style={{ color: '#777', fontSize: '1.2rem', marginBottom: '2rem' }}>Every second together counts.</p>
                    <div className="timer-enhanced-grid">
                        <div className="timer-enhanced-box timer-pulse">
                            <div className="timer-icon">☀️</div>
                            <span className="timer-enhanced-val">{timeElapsed.days || 0}</span>
                            <span className="timer-enhanced-label">Days</span>
                        </div>
                        <div className="timer-enhanced-box">
                            <div className="timer-icon">🌙</div>
                            <span className="timer-enhanced-val">{timeElapsed.hours || 0}</span>
                            <span className="timer-enhanced-label">Hours</span>
                        </div>
                        <div className="timer-enhanced-box">
                            <div className="timer-icon">⏰</div>
                            <span className="timer-enhanced-val">{timeElapsed.minutes || 0}</span>
                            <span className="timer-enhanced-label">Minutes</span>
                        </div>
                        <div className="timer-enhanced-box">
                            <div className="timer-icon">💫</div>
                            <span className="timer-enhanced-val">{timeElapsed.seconds || 0}</span>
                            <span className="timer-enhanced-label">Seconds</span>
                        </div>
                    </div>
                    <div style={{ marginTop: '3rem', textAlign: 'center' }}>
                        <p style={{ fontFamily: 'Playfair Display', fontSize: '1.3rem', fontStyle: 'italic', color: 'var(--gold)' }}>
                            "{years} {years === 1 ? 'Year' : 'Years'} of timeless moments"
                        </p>
                    </div>
                </div>
            </section>

            {/* 3. MEMORY */}
            {data.imageUrl && (
                <section className="snap-section">
                    <div className="content-wrapper">
                        <div className="polaroid-container">
                            <div className="polaroid-card">
                                <div className="polaroid-front">
                                    <div className="photo-frame">
                                        <img src={data.imageUrl} alt="Memory" />
                                    </div>
                                    <div className="handwritten">Forever & Always</div>
                                </div>
                                <div className="polaroid-back">
                                    <Heart size={40} color="#d4af37" />
                                    <p style={{ marginTop: '1rem', fontStyle: 'italic' }}>
                                        "Captured in a moment, held for a lifetime."
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            )}

            {/* 4. RESONANCE (Heartbeat) */}
            <section className="snap-section">
                <div className="content-wrapper">
                    <h2>Resonance</h2>
                    <p style={{ color: '#777', marginBottom: '3rem' }}>Tap to feel the connection</p>
                    <div
                        className="heart-wrapper"
                        onClick={(e) => {
                            const rect = e.currentTarget.getBoundingClientRect();
                            const ripple = document.createElement('div');
                            ripple.className = 'ripple';
                            e.currentTarget.appendChild(ripple);
                            setTimeout(() => ripple.remove(), 1000);
                            playNote(300);
                        }}
                    >
                        <div className="pulsing-circle">
                            <Heart size={120} fill="#ffb7b2" color="#ffb7b2" />
                        </div>
                    </div>
                </div>
            </section>

            {/* 5. VOWS */}
            <section className="snap-section">
                <div className={`vow-card ${vowMode === 'dark' ? 'dark-mode' : ''}`}>
                    <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                        <div className="toggle-container">
                            <div className={`vow-toggle ${vowMode === 'light' ? 'active' : ''}`} onClick={() => setVowMode('light')}>
                                <Sun size={18} /> Days
                            </div>
                            <div className={`vow-toggle ${vowMode === 'dark' ? 'active' : ''}`} onClick={() => setVowMode('dark')}>
                                <Moon size={18} /> Nights
                            </div>
                        </div>
                        <h2 style={{ color: vowMode === 'dark' ? 'white' : 'var(--text-main)' }}>The Promise</h2>
                    </div>
                    <div className="text-center">
                        <p style={{ fontFamily: 'Playfair Display', fontSize: '1.4rem', fontStyle: 'italic', lineHeight: '1.6' }}>
                            {vowMode === 'light'
                                ? "I promise to walk with you in the sun, to celebrate our joys, and to build a future brighter than gold."
                                : "I promise to hold your hand in the dark, to be your shelter in the storm, and to love you even when silence falls."}
                        </p>
                    </div>
                </div>
            </section>

            {/* 6. CONSTELLATION */}
            <section className="snap-section">
                <canvas ref={canvasRef} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }} />
                <div className="content-wrapper" style={{ pointerEvents: 'none' }}>
                    <h2 style={{ fontSize: '3rem', color: 'var(--gold)', textShadow: '0 0 20px white' }}>Our Universe</h2>
                    <p>Connected across time and space.</p>
                </div>
            </section>

            {/* 7. HARMONY (Piano) */}
            <section className="snap-section harmony-section">
                <div className="harmony-container">
                    <div className="harmony-music-notes">
                        <span className="music-note">♪</span>
                        <span className="music-note">♫</span>
                        <span className="music-note">♬</span>
                    </div>
                    <h2 className="harmony-title">Harmony</h2>
                    <div className="harmony-piano-container">
                        <p style={{ color: 'rgba(255,255,255,0.8)', marginBottom: '2rem', fontSize: '1.1rem' }}>Play our melody of love</p>
                        <div className="harmony-piano-keys">
                            {[{ n: 'C', f: 261 }, { n: 'D', f: 293 }, { n: 'E', f: 329 }, { n: 'F', f: 349 }, { n: 'G', f: 392 }, { n: 'A', f: 440 }, { n: 'B', f: 493 }].map((k, index) => (
                                <div
                                    key={k.n}
                                    className={`harmony-piano-key ${lastNote === k.n ? 'active' : ''}`}
                                    onClick={() => handlePiano(k.n, k.f)}
                                    style={{
                                        animationDelay: `${index * 0.1}s`
                                    }}
                                />
                            ))}
                        </div>
                        <div className={`harmony-note-display ${lastNote ? 'active' : ''}`}>
                            {lastNote ? `Playing: ${lastNote}` : 'Touch the keys to play'}
                        </div>
                    </div>
                </div>
            </section>

            {/* 8. MESSAGE IN BOTTLE */}
            <section className="snap-section">
                <div className="content-wrapper">
                    <h2>Message to the Future</h2>
                    <p style={{ color: '#777', marginBottom: '2rem' }}>Write a note for next year</p>
                    <div style={{ maxWidth: '500px', margin: '0 auto' }}>
                        {!bottleSent ? (
                            <>
                                <input
                                    className="bottle-input"
                                    placeholder="Type a wish..."
                                    value={bottleMsg}
                                    onChange={e => setBottleMsg(e.target.value)}
                                />
                                <button className="primary-btn" onClick={handleSendBottle} style={{ marginTop: '2rem' }}>
                                    <Send size={18} /> Seal & Send
                                </button>
                            </>
                        ) : (
                            <div style={{ animation: 'fadeIn 1s' }}>
                                <CheckCircle size={48} color="#d4af37" style={{ margin: '0 auto 1rem' }} />
                                <p className="cinzel">Message Secured.</p>
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {/* 9. GIFT */}
            <section className="snap-section">
                <div className="content-wrapper">
                    <h2>A Gift For You</h2>
                    <div style={{ height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '2rem' }}>
                        {!giftOpened ? (
                            <div onClick={() => { setGiftOpened(true); fireConfetti(); }} style={{ cursor: 'pointer', animation: 'heartbeat 2s infinite' }}>
                                <Gift size={100} color="#d4af37" strokeWidth={1} />
                                <p style={{ marginTop: '1rem', letterSpacing: '2px', color: '#999' }}>TAP TO OPEN</p>
                            </div>
                        ) : (
                            <div style={{ padding: '2rem', border: '1px solid var(--gold)', borderRadius: '12px', background: 'white', animation: 'fadeIn 1s' }}>
                                <Sparkles style={{ margin: '0 auto 1rem', color: 'var(--gold)' }} />
                                <p style={{ fontFamily: 'Dancing Script', fontSize: '1.8rem' }}>"{data.message}"</p>
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {/* 10. HORIZON */}
            <section className="snap-section ending-section">
                <div className="ending-hearts">
                    <span className="floating-heart" style={{ left: '10%', animationDelay: '0s' }}>❤️</span>
                    <span className="floating-heart" style={{ left: '30%', animationDelay: '2s' }}>💕</span>
                    <span className="floating-heart" style={{ left: '50%', animationDelay: '4s' }}>💖</span>
                    <span className="floating-heart" style={{ left: '70%', animationDelay: '1s' }}>💝</span>
                    <span className="floating-heart" style={{ left: '90%', animationDelay: '3s' }}>💗</span>
                </div>
                <div className="ending-container">
                    <h2 className="ending-title">The Horizon</h2>
                    <p className="ending-subtitle">Our journey continues beyond infinity</p>
                    <div className="ending-slider-container">
                        <input
                            type="range" min="0" max="100"
                            value={futureVal}
                            onChange={(e) => setFutureVal(e.target.value)}
                            className="enhanced-future-slider"
                        />
                        <div className="ending-milestone">
                            <span>Beginning</span>
                            <span>Middle</span>
                            <span>Forever</span>
                        </div>
                        <div 
                            className={`ending-message ${futureVal > 80 ? 'show' : ''}`}
                            style={{
                                opacity: futureVal > 80 ? 1 : 0,
                                transition: 'opacity 1s ease-in-out 0.5s'
                            }}
                        >
                            <Star size={32} style={{ color: 'white', marginBottom: '1rem' }} />
                            <p style={{ 
                                fontSize: '1.8rem',
                                fontFamily: 'Playfair Display',
                                color: 'white',
                                textShadow: '0 0 20px rgba(255,255,255,0.5)'
                            }}>
                                Our brightest days are yet to come.
                            </p>
                            <p style={{ 
                                fontSize: '1.1rem',
                                marginTop: '1rem',
                                color: 'rgba(255,255,255,0.8)',
                                fontStyle: 'italic'
                            }}>
                                Together forever, always and always.
                            </p>
                        </div>
                    </div>
                    <div style={{ marginTop: '3rem' }}>
                        <button 
                            className="primary-btn" 
                            onClick={() => fireConfetti()}
                            style={{ 
                                background: 'rgba(255,255,255,0.2)', 
                                border: '2px solid white',
                                color: 'white',
                                backdropFilter: 'blur(10px)'
                            }}
                        >
                            <Sparkles size={18} /> Celebrate Our Love
                        </button>
                    </div>
                </div>
            </section>

        </div>
    );
};

// Wrapper for routing props
const AnniversaryPageWrapper = () => <AnniversaryPage />;

export default AnniversaryPageWrapper;
