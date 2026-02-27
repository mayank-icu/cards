import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { doc, updateDoc, onSnapshot, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';
import {
    Heart, Star, Clock, Cloud, Flame, Ticket,
    Music, MessageCircle, ArrowDown, Sparkles,
    Play, Pause, Loader2
} from 'lucide-react';
import { resolveCardId } from '../../utils/slugs';

/* --- STYLES & ANIMATIONS --- */
const GlobalStyles = () => (
    <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;600;800&family=Instrument+Serif:ital@0;1&display=swap');

        :root {
            --bg-cream: #fff9f5;
            --bg-gradient: linear-gradient(135deg, #fff9f5 0%, #fff0f5 100%);
            --primary: #e11d48; /* Rose */
            --primary-soft: #fda4af;
            --gold: #fbbf24;
            --text-main: #2c2c2c;
            --text-light: #666;
            --font-sans: 'Plus Jakarta Sans', sans-serif;
            --font-serif: 'Instrument Serif', serif;
        }

        * { box-sizing: border-box; margin: 0; padding: 0; }

        body {
            background: var(--bg-cream);
            color: var(--text-main);
            font-family: var(--font-sans);
            overflow: hidden; /* App handles scrolling */
        }

        /* --- WRAPPERS --- */
        .ask-wrapper {
            width: 100vw;
            height: 100vh;
            position: relative;
            overflow: hidden;
            background: var(--bg-gradient);
        }

        .ask-scroller {
            width: 100%;
            height: 100%;
            overflow-y: scroll;
            scroll-snap-type: y mandatory;
            scroll-behavior: smooth;
            z-index: 10;
            position: relative;
        }

        /* Ambient Background Particles */
        .ambient-bg {
            position: absolute;
            inset: 0;
            pointer-events: none;
            z-index: 0;
        }
        .particle {
            position: absolute;
            background: var(--primary);
            border-radius: 50%;
            opacity: 0.05;
            animation: float-up linear infinite;
        }

        /* --- SECTION BASE --- */
        .ask-section {
            width: 100%;
            height: 100vh;
            scroll-snap-align: start;
            position: relative;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 2rem;
            opacity: 0;
            transition: opacity 1s ease;
        }

        .ask-section.visible {
            opacity: 1;
        }

        .content-card {
            background: rgba(255, 255, 255, 0.7);
            backdrop-filter: blur(20px);
            padding: 3rem;
            border-radius: 2rem;
            border: 1px solid rgba(255, 255, 255, 0.6);
            box-shadow: 0 20px 40px rgba(225, 29, 72, 0.05);
            text-align: center;
            max-width: 500px;
            width: 100%;
            transform: translateY(30px);
            transition: transform 0.8s cubic-bezier(0.2, 0.8, 0.2, 1);
        }

        .ask-section.visible .content-card {
            transform: translateY(0);
        }

        /* --- TYPOGRAPHY --- */
        .heading-serif {
            font-family: var(--font-serif);
            font-size: 3.5rem;
            line-height: 1;
            font-style: italic;
            color: var(--primary);
            margin-bottom: 1rem;
        }
        
        .heading-sans {
            font-family: var(--font-sans);
            font-size: 1.5rem;
            font-weight: 800;
            letter-spacing: -0.5px;
            margin-bottom: 0.5rem;
            color: var(--text-main);
            text-transform: uppercase;
        }

        .subtitle {
            font-size: 1.1rem;
            color: var(--text-light);
            line-height: 1.6;
            margin-bottom: 2rem;
        }

        /* --- INTERACTIVE ELEMENTS --- */
        .action-btn {
            background: var(--text-main);
            color: white;
            border: none;
            padding: 1rem 2rem;
            border-radius: 100px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
            font-family: var(--font-sans);
        }

        .action-btn:hover {
            transform: scale(1.05);
            box-shadow: 0 10px 20px rgba(0,0,0,0.1);
        }

        .action-btn.pulse {
            animation: pulse-shadow 2s infinite;
        }

        /* --- FLOATING SHAPES --- */
        .floating-bg {
            position: absolute;
            inset: 0;
            pointer-events: none;
            z-index: -1;
        }
        .shape {
            position: absolute;
            opacity: 0.1;
            animation: float 10s infinite ease-in-out;
        }

        /* --- QUESTION SECTION --- */
        .section-question { background: var(--text-main); color: white; }
        .section-question .content-card { background: rgba(255,255,255,0.1); border-color: rgba(255,255,255,0.1); color: white; }
        .section-question .heading-serif { color: #fff; }
        .section-question .subtitle { color: rgba(255,255,255,0.7); }

        .choice-container {
            display: flex;
            gap: 1rem;
            justify-content: center;
            margin-top: 2rem;
            position: relative;
            min-height: 80px;
        }

        .btn-yes {
            background: var(--primary);
            color: white;
            padding: 1.2rem 3rem;
            border-radius: 100px;
            font-size: 1.2rem;
            font-weight: 800;
            border: none;
            cursor: pointer;
            transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            box-shadow: 0 10px 25px rgba(225, 29, 72, 0.3);
            z-index: 20;
            font-family: var(--font-sans);
        }

        .btn-yes:hover {
            transform: scale(1.1) translateY(-2px);
            box-shadow: 0 15px 35px rgba(225, 29, 72, 0.4);
        }

        .btn-no {
            background: transparent;
            color: rgba(255,255,255,0.5);
            padding: 1.2rem 2rem;
            border-radius: 100px;
            font-size: 1rem;
            font-weight: 600;
            border: 2px solid rgba(255,255,255,0.1);
            cursor: pointer;
            transition: all 0.2s ease;
            position: relative;
            font-family: var(--font-sans);
        }

        .btn-no:hover {
            background: rgba(255,255,255,0.1);
            color: white;
        }

        /* --- RESULT DASHBOARD --- */
        .result-view {
            height: 100vh;
            overflow-y: auto;
            background: var(--bg-cream);
            padding-bottom: 4rem;
        }

        .dashboard-header {
            padding: 4rem 2rem;
            text-align: center;
            background: linear-gradient(180deg, #fff0f5 0%, var(--bg-cream) 100%);
        }

        .dashboard-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 1.5rem;
            max-width: 1000px;
            margin: 0 auto;
            padding: 0 1.5rem;
        }

        .dash-card {
            background: white;
            padding: 2rem;
            border-radius: 1.5rem;
            border: 1px solid #f3f4f6;
            box-shadow: 0 4px 6px rgba(0,0,0,0.02);
            transition: transform 0.3s ease;
        }
        
        .dash-card:hover { transform: translateY(-5px); }
        .dash-card.full-width { grid-column: 1 / -1; }

        .dash-title {
            font-size: 0.9rem;
            text-transform: uppercase;
            letter-spacing: 1px;
            color: var(--text-light);
            margin-bottom: 1rem;
            display: flex;
            align-items: center;
            gap: 0.5rem;
            font-weight: 600;
        }

        /* Chat UI */
        .chat-container {
            background: #f8fafc;
            border-radius: 1rem;
            padding: 1rem;
            height: 300px;
            display: flex;
            flex-direction: column;
        }

        .chat-messages {
            flex: 1;
            overflow-y: auto;
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
            padding-bottom: 1rem;
        }

        .msg-bubble {
            padding: 0.8rem 1.2rem;
            border-radius: 1rem;
            max-width: 80%;
            font-size: 0.9rem;
            animation: popIn 0.3s ease;
        }

        .msg-bubble.them {
            background: white;
            align-self: flex-start;
            border-bottom-left-radius: 4px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        }

        .msg-bubble.me {
            background: var(--primary);
            color: white;
            align-self: flex-end;
            border-bottom-right-radius: 4px;
        }

        .chat-input-area {
            display: flex;
            gap: 0.5rem;
            margin-top: auto;
        }

        .chat-input {
            flex: 1;
            padding: 0.8rem;
            border-radius: 100px;
            border: 1px solid #e5e7eb;
            outline: none;
            transition: border-color 0.2s;
            font-family: var(--font-sans);
        }
        .chat-input:focus { border-color: var(--primary); }

        .chat-send {
            background: var(--text-main);
            color: white;
            width: 40px;
            height: 40px;
            border-radius: 50%;
            border: none;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        /* --- ANIMATIONS --- */
        @keyframes float-up { 0% { transform: translateY(100vh) scale(0); } 100% { transform: translateY(-20vh) scale(1); } }
        @keyframes float { 0%, 100% { transform: translateY(0) rotate(0); } 50% { transform: translateY(-20px) rotate(5deg); } }
        @keyframes pulse-shadow { 0%, 100% { box-shadow: 0 0 0 0 rgba(225, 29, 72, 0.4); } 70% { box-shadow: 0 0 0 15px rgba(225, 29, 72, 0); } }
        @keyframes bounce { 0%, 100% { transform: translate(-50%, 0); } 50% { transform: translate(-50%, 10px); } }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes popIn { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } }

        /* Loading */
        .loader-wrap { height: 100vh; display: flex; align-items: center; justify-content: center; color: var(--primary); }
        
        .spin-disc {
            animation: spin 1s linear infinite;
        }
    `}</style>
);

/* --- MAIN COMPONENT --- */

const AskPage = () => {
    const { slug } = useParams();
    const [data, setData] = useState(null);
    const [currentSection, setCurrentSection] = useState(0);
    const [response, setResponse] = useState(null);
    const [realId, setRealId] = useState(null);
    const [collectionName] = useState('crush-ask-cards');
    const [replies, setReplies] = useState([]);

    const scrollerRef = useRef(null);

    // Sounds (Simple wrappers)
    const playYes = () => {
        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3');
        audio.volume = 0.5;
        audio.play().catch(e => console.log(e));
    };

    const playHover = () => {
        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
        audio.volume = 0.2;
        audio.play().catch(e => console.log(e));
    };

    // Fetch Data
    useEffect(() => {
        const fetchData = async () => {
            const { id } = await resolveCardId(slug, 'crush-ask-cards', 'crush');

            if (id) {
                setRealId(id);
            }
        };
        fetchData();
    }, [slug]);

    // Firestore Sync
    useEffect(() => {
        if (!realId) return;

        const cardRef = doc(db, collectionName, realId);

        const unsub = onSnapshot(cardRef, (docSnap) => {
            if (docSnap.exists()) {
                const d = docSnap.data();
                setData(d);
                setReplies(d.replies || []);
                if (d.crushResponse && d.crushResponse !== response) {
                    setResponse(d.crushResponse);
                }
            }
        });
        return () => unsub();
    }, [realId, collectionName, response]);

    const handleScroll = () => {
        if (!scrollerRef.current) return;
        const scrollPosition = scrollerRef.current.scrollTop;
        const windowHeight = window.innerHeight;
        const index = Math.round(scrollPosition / windowHeight);
        setCurrentSection(index);
    };

    const scrollToNext = () => {
        const nextIndex = currentSection + 1;
        const section = document.getElementById(`section-${nextIndex}`);
        if (section) section.scrollIntoView({ behavior: 'smooth' });
    };

    const handleResponse = async (answer) => {
        if (answer === 'yes') {
            playYes();
        } else {
            playHover();
        }

        setResponse(answer);

        if (realId) {
            try {
                await updateDoc(doc(db, collectionName, realId), {
                    crushResponse: answer,
                    responseTimestamp: new Date().toISOString()
                });
            } catch (error) {
                console.error('Error saving response:', error);
            }
        }
    };

    const handleReset = async () => {
        if (realId) {
            await updateDoc(doc(db, collectionName, realId), {
                crushResponse: null,
                responseTimestamp: null
            });
            setResponse(null);
            setCurrentSection(0);
        }
    };

    if (!data) return (
        <>
            <GlobalStyles />
            <div className="loader-wrap"><Loader2 className="spin-disc" size={40} /></div>
        </>
    );

    // If already responded, show Dashboard
    if (response) {
        return (
            <div className="result-view">
                <GlobalStyles />
                <ResultDashboard
                    response={response}
                    data={data}
                    replies={replies}
                    realId={realId}
                    collectionName={collectionName}
                    onReset={handleReset}
                />
            </div>
        );
    }

    // Interactive Journey
    return (
        <div className="ask-wrapper">
            <GlobalStyles />
            <AmbientBackground />

            <div className="ask-scroller" ref={scrollerRef} onScroll={handleScroll}>
                <SectionRenderer
                    index={0} active={currentSection === 0} type="intro"
                    title="A Special Question"
                    content={`Hey ${data?.crushName || data?.name || 'there'}`}
                    subtitle="I've been thinking about this for a while..."
                    onNext={scrollToNext}
                />

                <SectionRenderer
                    index={1} active={currentSection === 1} type="feeling"
                    title="Every Time I See You" content="My heart skips a beat"
                    subtitle="You bring light to my day" onNext={scrollToNext}
                    icon={<Heart fill="#e11d48" color="#e11d48" size={60} />}
                />

                <SectionRenderer
                    index={2} active={currentSection === 2} type="compliment"
                    title="Your Smile" content="It's the most beautiful thing I've ever seen"
                    subtitle="It makes everything better" onNext={scrollToNext}
                    icon={<Star fill="#fbbf24" color="#fbbf24" size={60} />}
                />

                <SectionRenderer
                    index={3} active={currentSection === 3} type="connection"
                    title="When We Talk" content="Time just flies by"
                    subtitle="I could listen to you for hours" onNext={scrollToNext}
                    icon={<Clock color="#3b82f6" size={60} />}
                />

                <SectionRenderer
                    index={4} active={currentSection === 4} type="appreciation"
                    title="I Love How" content="You make me feel comfortable being myself"
                    subtitle="You're genuine and kind" onNext={scrollToNext}
                    icon={<Cloud fill="white" color="#a5b4fc" size={60} />}
                />

                <SectionRenderer
                    index={5} active={currentSection === 5} type="future"
                    title="Thinking of You" content="Makes me excited about tomorrow"
                    subtitle="And all the possibilities ahead" onNext={scrollToNext}
                    icon={<Sparkles color="#f59e0b" size={60} />}
                />

                <SectionRenderer
                    index={6} active={currentSection === 6} type="admiration"
                    title="I Admire" content="Your passion and the way you see the world"
                    subtitle="You inspire me" onNext={scrollToNext}
                    icon={<Flame fill="#ef4444" color="#ef4444" size={60} />}
                />

                <SectionRenderer
                    index={7} active={currentSection === 7} type="buildup"
                    title="So Here's My Question" content="I'd love to take you out"
                    subtitle="Get to know you even better" onNext={scrollToNext}
                    icon={<Ticket color="#10b981" size={60} />}
                />

                {/* THE QUESTION */}
                <div id="section-8" className={`ask-section section-question ${currentSection === 8 ? 'visible' : ''}`}>
                    <div className="floating-bg">
                        {[...Array(15)].map((_, i) => (
                            <Heart
                                key={i} className="shape"
                                style={{
                                    left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%`,
                                    animationDelay: `${Math.random() * 5}s`, fontSize: `${Math.random() * 2 + 1}rem`
                                }}
                                color="rgba(255,255,255,0.2)" fill="rgba(255,255,255,0.2)"
                            />
                        ))}
                    </div>

                    <div className="content-card">
                        <h1 className="heading-serif">Will You Go Out With Me?</h1>
                        <p className="subtitle">It would mean the world to me.</p>

                        <div className="choice-container">
                            <button className="btn-yes" onClick={() => handleResponse('yes')}>
                                YES! I'd Love To
                            </button>
                            <RunawayButton onNo={() => handleResponse('no')} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

/* --- SUB COMPONENTS --- */

const AmbientBackground = () => (
    <div className="ambient-bg">
        {[...Array(15)].map((_, i) => (
            <div
                key={i}
                className="particle"
                style={{
                    width: Math.random() * 6 + 4 + 'px',
                    height: Math.random() * 6 + 4 + 'px',
                    left: Math.random() * 100 + '%',
                    animationDuration: Math.random() * 15 + 10 + 's',
                    animationDelay: Math.random() * 5 + 's'
                }}
            />
        ))}
    </div>
);

const SectionRenderer = ({ index, active, type, title, content, subtitle, onNext, icon }) => (
    <div id={`section-${index}`} className={`ask-section section-${type} ${active ? 'visible' : ''}`}>
        <div className="content-card">
            {icon && <div style={{ marginBottom: '1.5rem', animation: 'bounce 3s infinite' }}>{icon}</div>}
            <h2 className="heading-sans">{title}</h2>
            <h1 className="heading-serif">{content}</h1>
            <p className="subtitle">{subtitle}</p>
            <button className="action-btn pulse" onClick={onNext}>
                Continue <ArrowDown size={16} />
            </button>
        </div>
    </div>
);

const RunawayButton = ({ onNo }) => {
    const [pos, setPos] = useState({ x: 0, y: 0 });
    const [hovered, setHovered] = useState(false);

    const move = () => {
        const x = Math.random() * 100;
        const y = Math.random() * 100;
        setPos({ x, y });
        setHovered(true);
    };

    return (
        <button
            className="btn-no"
            onClick={onNo}
            onMouseEnter={move}
            style={{ transform: hovered ? `translate(${pos.x}px, ${pos.y}px)` : 'none' }}
        >
            Not Right Now
        </button>
    );
};

const ResultDashboard = ({ response, data, replies, realId, collectionName, onReset }) => {
    const [msg, setMsg] = useState('');

    const sendReply = async (e) => {
        e.preventDefault();
        if (!msg.trim()) return;
        const newReplies = [...replies, msg];
        await updateDoc(doc(db, collectionName, realId), { replies: newReplies });
        setMsg('');
    };

    return (
        <>
            <div className="dashboard-header">
                {response === 'yes' ? (
                    <>
                        <h1 className="heading-serif" style={{ fontSize: '4rem' }}>She Said Yes!</h1>
                        <p className="subtitle">Best. Day. Ever. 🎉</p>
                    </>
                ) : (
                    <>
                        <h1 className="heading-sans">Maybe Next Time</h1>
                        <p className="subtitle">Thank you for being honest. I appreciate you.</p>
                    </>
                )}
            </div>

            <div className="dashboard-grid">
                {response === 'yes' && data.message && (
                    <div className="dash-card full-width">
                        <div className="dash-title"><MessageCircle size={16} /> PERSONAL NOTE</div>
                        <p style={{ fontSize: '1.2rem', lineHeight: '1.8', fontStyle: 'italic' }}>"{data.message}"</p>
                    </div>
                )}

                {response === 'yes' && data.imageUrl && (
                    <div className="dash-card">
                        <div className="dash-title"><Sparkles size={16} /> OUR MOMENT</div>
                        <div style={{ borderRadius: '1rem', overflow: 'hidden', height: '300px' }}>
                            <img src={data.imageUrl} alt="Memory" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                    </div>
                )}

                {data.song && (
                    <div className="dash-card">
                        <div className="dash-title"><Music size={16} /> OUR SONG</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '1rem' }}>
                            {data.song.albumArt ? (
                                <img src={data.song.albumArt} alt="Art" style={{ width: 80, height: 80, borderRadius: '10px' }} />
                            ) : (
                                <div style={{ width: 80, height: 80, background: '#111', borderRadius: '10px' }} />
                            )}
                            <div>
                                <h3 style={{ fontWeight: 800 }}>{data.song.name}</h3>
                                <p style={{ color: '#666' }}>{data.song.artist}</p>
                            </div>
                        </div>
                        {data.song.previewUrl && (
                            <audio controls src={data.song.previewUrl} style={{ width: '100%', marginTop: '1rem' }} />
                        )}
                    </div>
                )}

                <div className="dash-card full-width">
                    <div className="dash-title"><MessageCircle size={16} /> CHAT ({replies.length})</div>
                    <div className="chat-container">
                        <div className="chat-messages">
                            {replies.length === 0 && <p style={{ textAlign: 'center', color: '#999', marginTop: '2rem' }}>No messages yet. Say hi!</p>}
                            {replies.map((r, i) => (
                                <div key={i} className={`msg-bubble ${i % 2 === 0 ? 'them' : 'me'}`}>{r}</div>
                            ))}
                        </div>
                        <form className="chat-input-area" onSubmit={sendReply}>
                            <input className="chat-input" placeholder="Send a message..." value={msg} onChange={(e) => setMsg(e.target.value)} />
                            <button type="submit" className="chat-send"><ArrowDown size={18} style={{ transform: 'rotate(-90deg)' }} /></button>
                        </form>
                    </div>
                </div>

                <div className="dash-card full-width" style={{ textAlign: 'center', background: 'transparent', boxShadow: 'none', border: 'none' }}>
                    <button onClick={onReset} style={{ background: 'transparent', border: '1px solid #ccc', padding: '10px 20px', borderRadius: '100px', cursor: 'pointer', color: '#666', fontFamily: 'var(--font-sans)' }}>
                        Reset Response (Debug)
                    </button>
                </div>
            </div>
        </>
    );
};

export default AskPage;
