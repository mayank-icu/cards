import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import OccasionCard from './OccasionCard';
import './OccasionSelector.css';

const OccasionSelector = ({ onCardClick, occasions }) => {
  const [visibleCards, setVisibleCards] = useState(new Set());
  const observerRef = useRef(null);

  // Memoize the occasions array to prevent unnecessary re-renders
  const memoizedOccasions = useMemo(() => occasions, [occasions]);

  // Optimize the callback to prevent unnecessary re-renders
  const handleCardClick = useCallback((occasion) => {
    onCardClick(occasion);
  }, [onCardClick]);

  useEffect(() => {
    // Use a more efficient intersection observer configuration for mobile
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisibleCards((prev) => {
              const newSet = new Set(prev);
              newSet.add(entry.target.dataset.index);
              return newSet;
            });
          }
        });
      },
      {
        threshold: 0.01, // Lower threshold for better mobile performance
        rootMargin: '100px' // Larger margin for preloading
      }
    );

    // Only observe if we have cards to observe
    const cardElements = document.querySelectorAll('.occasion-wrapper');
    if (cardElements.length > 0) {
      cardElements.forEach((element) => {
        if (observerRef.current) {
          observerRef.current.observe(element);
        }
      });
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [memoizedOccasions]);

  return (
    <div className="occasion-selector">
      <div className="selector-grid">
        {memoizedOccasions.length > 0 ? (
          memoizedOccasions.map((occasion, index) => (
            <div
              key={occasion.id}
              className={`occasion-wrapper ${visibleCards.has(index.toString()) ? 'visible' : ''}`}
              data-index={index}
            >
              <OccasionCard
                title={occasion.title}
                description={occasion.description}
                icon={occasion.icon}
                gradient={occasion.gradient}
                onClick={() => handleCardClick(occasion)}
              />
            </div>
          ))
        ) : (
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '300px',
            color: '#667eea'
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ 
                width: '40px', 
                height: '40px', 
                border: '3px solid #f3f3f3', 
                borderTop: '3px solid #667eea', 
                borderRadius: '50%', 
                animation: 'spin 1s linear infinite',
                margin: '0 auto 20px'
              }}></div>
              Preparing cards...
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OccasionSelector;