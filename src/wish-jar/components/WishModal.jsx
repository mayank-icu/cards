import React, { useEffect } from 'react';
import { X, Sparkles } from 'lucide-react';

const WishModal = ({ isOpen, onClose, wish }) => {
    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape') onClose();
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onClose]);

    if (!isOpen || !wish) return null;

    const formatDate = (timestamp) => {
        if (!timestamp) return '';
        const date = new Date(timestamp);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <>
            <style>{`
                .wish-modal-backdrop {
                    position: fixed;
                    inset: 0;
                    background: rgba(0, 0, 0, 0.7);
                    backdrop-filter: blur(8px);
                    z-index: 1000;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 1rem;
                    animation: fadeIn 0.3s ease;
                }

                .wish-modal-content {
                    background: linear-gradient(135deg, rgba(251, 191, 36, 0.1) 0%, rgba(251, 191, 36, 0.05) 100%);
                    backdrop-filter: blur(20px);
                    border: 2px solid rgba(251, 191, 36, 0.3);
                    border-radius: 20px;
                    max-width: 500px;
                    width: 100%;
                    padding: 2rem;
                    position: relative;
                    box-shadow: 
                        0 0 40px rgba(251, 191, 36, 0.2),
                        inset 0 0 20px rgba(255, 255, 255, 0.1);
                    animation: scaleIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
                }

                .wish-modal-close {
                    position: absolute;
                    top: 1rem;
                    right: 1rem;
                    background: rgba(255, 255, 255, 0.1);
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    border-radius: 50%;
                    width: 36px;
                    height: 36px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    color: white;
                    transition: all 0.2s;
                }

                .wish-modal-close:hover {
                    background: rgba(255, 255, 255, 0.2);
                    transform: rotate(90deg);
                }

                .wish-modal-header {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    margin-bottom: 1.5rem;
                    color: #fbbf24;
                }

                .wish-modal-header h3 {
                    font-family: 'Instrument Serif', serif;
                    font-size: 1.5rem;
                    font-style: italic;
                    margin: 0;
                }

                .wish-sparkle {
                    animation: sparkle 2s ease-in-out infinite;
                }

                .wish-modal-text {
                    color: white;
                    font-size: 1.1rem;
                    line-height: 1.6;
                    margin-bottom: 1.5rem;
                    font-family: 'Plus Jakarta Sans', sans-serif;
                    text-align: center;
                    padding: 1rem;
                    background: rgba(255, 255, 255, 0.05);
                    border-radius: 12px;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                }

                .wish-modal-timestamp {
                    text-align: center;
                    color: rgba(255, 255, 255, 0.5);
                    font-size: 0.85rem;
                    font-family: 'Plus Jakarta Sans', sans-serif;
                    letter-spacing: 0.5px;
                }

                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }

                @keyframes scaleIn {
                    from { 
                        opacity: 0;
                        transform: scale(0.8);
                    }
                    to { 
                        opacity: 1;
                        transform: scale(1);
                    }
                }

                @keyframes sparkle {
                    0%, 100% { 
                        opacity: 1;
                        transform: rotate(0deg) scale(1);
                    }
                    50% { 
                        opacity: 0.7;
                        transform: rotate(180deg) scale(1.2);
                    }
                }

                @media (max-width: 640px) {
                    .wish-modal-content {
                        padding: 1.5rem;
                    }

                    .wish-modal-text {
                        font-size: 1rem;
                    }

                    .wish-modal-header h3 {
                        font-size: 1.25rem;
                    }
                }
            `}</style>

            <div
                className="wish-modal-backdrop"
                onClick={onClose}
            >
                <div
                    className="wish-modal-content"
                    onClick={(e) => e.stopPropagation()}
                >
                    <button
                        className="wish-modal-close"
                        onClick={onClose}
                        aria-label="Close"
                    >
                        <X size={20} />
                    </button>

                    <div className="wish-modal-header">
                        <Sparkles size={24} className="wish-sparkle" />
                        <h3>A Wish</h3>
                        <Sparkles size={24} className="wish-sparkle" />
                    </div>

                    <div className="wish-modal-text">
                        {wish.text}
                    </div>

                    {wish.createdAt && (
                        <div className="wish-modal-timestamp">
                            {formatDate(wish.createdAt)}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default WishModal;
