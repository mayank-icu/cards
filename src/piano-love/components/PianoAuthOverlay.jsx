import * as React from 'react';
import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

/* ─────────────────────────────────────────────────────────────
   PianoAuthOverlay
   Props:
     onSuccess  — called after successful login/register
     onClose    — called when the user dismisses without auth
───────────────────────────────────────────────────────────── */

const OVERLAY_STYLES = `
  .pao-backdrop {
    position: fixed;
    inset: 0;
    z-index: 2000;
    background: rgba(10, 10, 20, 0.72);
    backdrop-filter: blur(6px);
    -webkit-backdrop-filter: blur(6px);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
    animation: pao-fade-in 0.18s ease;
  }

  @keyframes pao-fade-in {
    from { opacity: 0; }
    to   { opacity: 1; }
  }

  .pao-card {
    background: #fff;
    border-radius: 20px;
    padding: 28px 24px 24px;
    width: 100%;
    max-width: 360px;
    box-shadow: 0 24px 64px rgba(0, 0, 0, 0.28);
    position: relative;
    animation: pao-slide-in 0.2s ease;
  }

  @keyframes pao-slide-in {
    from { transform: translateY(14px); opacity: 0; }
    to   { transform: translateY(0);    opacity: 1; }
  }

  .pao-close {
    position: absolute;
    top: 14px;
    right: 16px;
    background: none;
    border: none;
    font-size: 1.3rem;
    color: #888;
    cursor: pointer;
    line-height: 1;
    padding: 4px;
    border-radius: 6px;
    transition: color 0.15s;
  }
  .pao-close:hover { color: #333; }

  .pao-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: linear-gradient(135deg, #fef3c7, #fde68a);
    color: #92400e;
    font-size: 0.72rem;
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    padding: 4px 10px;
    border-radius: 20px;
    margin-bottom: 10px;
  }

  .pao-title {
    font-size: 1.18rem;
    font-weight: 700;
    color: #1a1a2e;
    margin: 0 0 4px;
  }

  .pao-sub {
    font-size: 0.83rem;
    color: #666;
    margin: 0 0 18px;
  }

  .pao-tabs {
    display: flex;
    gap: 0;
    background: #f4f4f6;
    border-radius: 10px;
    padding: 3px;
    margin-bottom: 18px;
  }

  .pao-tab {
    flex: 1;
    padding: 7px 0;
    font-size: 0.84rem;
    font-weight: 600;
    border: none;
    border-radius: 8px;
    background: transparent;
    color: #888;
    cursor: pointer;
    transition: background 0.15s, color 0.15s;
  }
  .pao-tab.active {
    background: #fff;
    color: #1a1a2e;
    box-shadow: 0 1px 6px rgba(0,0,0,0.10);
  }

  .pao-field {
    margin-bottom: 12px;
  }
  .pao-field input {
    width: 100%;
    padding: 10px 12px;
    border: 1.5px solid #e5e7eb;
    border-radius: 10px;
    font-size: 0.9rem;
    outline: none;
    box-sizing: border-box;
    transition: border-color 0.15s;
    background: #fafafa;
    color: #1a1a2e;
  }
  .pao-field input:focus {
    border-color: #a78bfa;
    background: #fff;
  }
  .pao-field input::placeholder { color: #bbb; }

  .pao-submit {
    width: 100%;
    padding: 11px;
    border-radius: 10px;
    border: none;
    background: linear-gradient(135deg, #7c3aed, #6d28d9);
    color: #fff;
    font-size: 0.92rem;
    font-weight: 700;
    cursor: pointer;
    transition: opacity 0.15s, transform 0.1s;
    margin-bottom: 14px;
  }
  .pao-submit:hover:not(:disabled) { opacity: 0.9; transform: translateY(-1px); }
  .pao-submit:disabled { opacity: 0.55; cursor: not-allowed; }

  .pao-divider {
    display: flex;
    align-items: center;
    gap: 10px;
    color: #ccc;
    font-size: 0.76rem;
    margin-bottom: 12px;
  }
  .pao-divider::before,
  .pao-divider::after {
    content: '';
    flex: 1;
    height: 1px;
    background: #e5e7eb;
  }

  .pao-google {
    width: 100%;
    padding: 10px;
    border-radius: 10px;
    border: 1.5px solid #e5e7eb;
    background: #fff;
    font-size: 0.88rem;
    font-weight: 600;
    color: #444;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    transition: border-color 0.15s, box-shadow 0.15s;
  }
  .pao-google:hover { border-color: #a78bfa; box-shadow: 0 2px 8px rgba(124,58,237,0.10); }
  .pao-google:disabled { opacity: 0.55; cursor: not-allowed; }

  .pao-switch {
    text-align: center;
    font-size: 0.79rem;
    color: #888;
    margin-top: 14px;
  }
  .pao-switch button {
    background: none;
    border: none;
    color: #7c3aed;
    font-weight: 700;
    cursor: pointer;
    padding: 0 2px;
    font-size: inherit;
  }
`;

const GoogleIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
);

const PianoAuthOverlay = ({ onSuccess, onClose }) => {
    const [mode, setMode] = useState('register'); // 'register' | 'login'
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    let authContext;
    try {
        authContext = useAuth();
    } catch {
        authContext = {
            signup: async (n, e, p) => { throw new Error('Auth not available'); },
            login: async (e, p) => { throw new Error('Auth not available'); },
            signInWithGoogle: async () => { throw new Error('Auth not available'); },
        };
    }

    const { signup, login, signInWithGoogle } = authContext;

    const switchMode = (next) => {
        setMode(next);
        setName('');
        setEmail('');
        setPassword('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (loading) return;

        if (mode === 'register') {
            if (!name.trim()) {
                return toast.error('Name is required');
            }
            if (password.length < 6) {
                return toast.error('Password must be at least 6 characters');
            }
        }

        setLoading(true);
        try {
            if (mode === 'register') {
                const result = await signup(name, email, password);
                if (result) {
                    toast.success('Account created! 60s unlocked 🎹');
                }
            } else {
                const result = await login(email, password);
                if (result) {
                    toast.success('Signed in! 60s unlocked 🎹');
                }
            }
            onSuccess();
        } catch (err) {
            toast.error(err?.message || 'Authentication failed');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogle = async () => {
        if (loading) return;
        setLoading(true);
        try {
            const result = await signInWithGoogle();
            // @ts-ignore
            if (result?.mode === 'popup') {
                toast.success('Signed in! 60s unlocked 🎹');
                onSuccess();
            }
            // redirect mode: page will reload, nothing more to do
        } catch (err) {
            toast.error(err?.message || 'Google sign-in failed');
            setLoading(false);
        }
    };

    return (
        <>
            <style>{OVERLAY_STYLES}</style>
            <div className="pao-backdrop" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
                <div className="pao-card">
                    <button type="button" className="pao-close" onClick={onClose} aria-label="Close">×</button>

                    <div className="pao-badge">⏱ 60-second recording</div>
                    <h2 className="pao-title">Unlock a full minute</h2>
                    <p className="pao-sub">Create a free account to record up to 60 seconds.</p>

                    <div className="pao-tabs">
                        <button type="button" className={`pao-tab${mode === 'register' ? ' active' : ''}`} onClick={() => switchMode('register')}>
                            Register
                        </button>
                        <button type="button" className={`pao-tab${mode === 'login' ? ' active' : ''}`} onClick={() => switchMode('login')}>
                            Log In
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} autoComplete="off">
                        {mode === 'register' && (
                            <div className="pao-field">
                                <input
                                    type="text"
                                    placeholder="Your Name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                    autoComplete="name"
                                />
                            </div>
                        )}
                        <div className="pao-field">
                            <input
                                type="email"
                                placeholder="Email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                autoComplete="email"
                            />
                        </div>
                        <div className="pao-field">
                            <input
                                type="password"
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                minLength={6}
                                autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                            />
                        </div>
                        <button type="submit" className="pao-submit" disabled={loading}>
                            {loading ? '…' : mode === 'register' ? 'Create Account' : 'Sign In'}
                        </button>
                    </form>

                    <div className="pao-divider">or</div>

                    <button type="button" className="pao-google" onClick={handleGoogle} disabled={loading}>
                        <GoogleIcon /> Continue with Google
                    </button>

                    <div className="pao-switch">
                        {mode === 'register' ? (
                            <>Already have an account?{' '}<button type="button" onClick={() => switchMode('login')}>Sign in</button></>
                        ) : (
                            <>No account?{' '}<button type="button" onClick={() => switchMode('register')}>Register free</button></>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
};

export default PianoAuthOverlay;
