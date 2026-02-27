import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ShareButton from './ShareButton';
import { CheckCircle, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';
import './CardSuccess.css';

const CardSuccess = ({ cardUrl, cardTitle, onViewCard }) => {
  const navigate = useNavigate();

  useEffect(() => {
    // Trigger celebration confetti
    const duration = 3000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    function randomInRange(min, max) {
      return Math.random() * (max - min) + min;
    }

    const interval = setInterval(function() {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
      });
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
      });
    }, 250);
  }, []);

  return (
    <div className="card-success-container">
      <div className="card-success-content">
        <div className="success-icon">
          <CheckCircle size={80} />
          <Sparkles className="sparkle-icon" size={40} />
        </div>
        <h1 className="success-title">Card Created Successfully!</h1>
        <p className="success-message">
          Your {cardTitle} card is ready to share. Copy the link or download as an image to share on social media.
        </p>
        
        <div className="success-actions">
          <ShareButton 
            cardUrl={cardUrl} 
            cardElementId={null}
            cardTitle={cardTitle}
          />
          
          {onViewCard && (
            <button 
              onClick={onViewCard}
              className="view-card-btn"
            >
              View Card
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CardSuccess;
