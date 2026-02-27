import React, { useState } from 'react';
import { X, Copy, Mail, Check, Share2 } from 'lucide-react';
import './ShareModal.css';

const ShareModal = ({ isOpen, onClose, cardUrl, cardType }) => {
    const [copied, setCopied] = useState(false);

    if (!isOpen) return null;

    const handleCopyLink = () => {
        navigator.clipboard.writeText(cardUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleEmailShare = () => {
        const subject = `Check out this ${cardType} card!`;
        const body = `I created a special ${cardType} card for you! View it here: ${cardUrl}`;
        window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    };

    return (
        <div className="share-modal-overlay" onClick={onClose}>
            <div className="share-modal-content" onClick={(e) => e.stopPropagation()}>
                <button className="share-modal-close" onClick={onClose}>
                    <X size={24} />
                </button>

                <div className="share-modal-header">
                    <Share2 className="share-icon" size={48} />
                    <h2>Card Created Successfully!</h2>
                    <p>Share your {cardType} card with others</p>
                </div>

                <div className="share-modal-body">
                    <div className="share-url-container">
                        <input
                            type="text"
                            value={cardUrl}
                            readOnly
                            className="share-url-input"
                        />
                    </div>

                    <div className="share-actions">
                        <button className="share-btn copy-btn" onClick={handleCopyLink}>
                            {copied ? <Check size={20} /> : <Copy size={20} />}
                            <span>{copied ? 'Copied!' : 'Copy Link'}</span>
                        </button>

                        <button className="share-btn email-btn" onClick={handleEmailShare}>
                            <Mail size={20} />
                            <span>Email</span>
                        </button>
                    </div>

                    <button className="view-card-btn" onClick={() => window.location.href = cardUrl}>
                        View Card
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ShareModal;
