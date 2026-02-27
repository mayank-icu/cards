import { useState, useMemo } from 'react';
import './OccasionCard.css';

const OccasionCard = ({ title, description, icon, gradient, onClick, disableOverlay }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Memoize the icon source to prevent unnecessary re-renders
  const iconSource = useMemo(() => {
    if (!icon || typeof icon !== 'string') return null;
    return icon;
  }, [icon]);

  const handleImageLoad = () => {
    setImageLoaded(true);
  };

  const handleImageError = () => {
    setImageError(true);
  };

  return (
    <div className={`occasion-card hover-lift ${disableOverlay ? 'no-overlay' : ''}`} onClick={onClick}>
      {!disableOverlay && (
        <div className="occasion-card-gradient" style={{ background: gradient }}></div>
      )}
      <div className="occasion-card-content">
        <div className="occasion-card-icon">
          {iconSource && !imageError ? (
            <img
              src={iconSource}
              alt={title}
              className={`occasion-icon-img ${imageLoaded ? 'loaded' : ''}`}
              onLoad={handleImageLoad}
              onError={handleImageError}
              loading="lazy"
              decoding="async"
              fetchpriority="low"
              style={{ opacity: imageLoaded ? 1 : 0, transition: 'opacity 0.3s ease' }}
            />
          ) : icon && !imageError ? (
            icon
          ) : (
            <div className="icon-placeholder">{title.charAt(0)}</div>
          )}
        </div>
        <h3 className="occasion-card-title">{title}</h3>
        <p className="occasion-card-description">{description}</p>
        <div className="occasion-card-arrow">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M7.5 15L12.5 10L7.5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>
    </div>
  );
};

export default OccasionCard;
