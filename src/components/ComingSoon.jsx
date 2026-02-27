import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, Bell, ArrowLeft } from 'lucide-react';
import './ComingSoon.css';

const ComingSoon = ({ occasion, description, icon, gradient }) => {
  const navigate = useNavigate();

  const handleBack = () => {
    navigate('/');
  };

  return (
    <div className="coming-soon-container">
      <div className="coming-soon-content">
        <div className="coming-soon-card" style={{ background: gradient }}>
          <div className="coming-soon-icon">
            {typeof icon === 'string' ? (
              <img src={icon} alt={occasion} />
            ) : (
              icon
            )}
          </div>
          <h1 className="coming-soon-title">{occasion}</h1>
          <p className="coming-soon-description">{description}</p>
          
          <div className="coming-soon-badge">
            <Clock size={16} />
            <span>Coming Soon</span>
          </div>
        </div>

        <div className="coming-soon-info">
          <h2>Something Special is Coming!</h2>
          <p>
            We're working hard to bring you amazing {occasion.toLowerCase()} cards with beautiful designs, 
            heartfelt messages, and wonderful features. This occasion will be available soon!
          </p>
          
          <div className="coming-soon-features">
            <div className="feature-item">
              <Calendar size={24} />
              <div>
                <h3>Seasonal Designs</h3>
                <p>Themed templates perfect for {occasion.toLowerCase()}</p>
              </div>
            </div>
            <div className="feature-item">
              <Bell size={24} />
              <div>
                <h3>Get Notified</h3>
                <p>Be the first to know when this feature launches</p>
              </div>
            </div>
          </div>

          <div className="coming-soon-actions">
            <button className="notify-button">
              <Bell size={16} />
              Notify Me When Available
            </button>
            <button className="explore-button" onClick={handleBack}>
              Explore Other Occasions
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComingSoon;
