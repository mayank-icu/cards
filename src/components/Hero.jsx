import { useEffect, useRef, useState } from 'react';
import { Heart, Sparkles, Gift, Star } from 'lucide-react';
import './Hero.css';
import { lazyLoadImage, shouldLoadHeavyAssets } from '../utils/performance';

const Hero = () => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const heroImageRef = useRef(null);

  // Image loading logic simplified for reliability
  useEffect(() => {
    setImageLoaded(true);
  }, []);

  return (
    <section className="hero">
      <div className="hero-container">
        <div className="hero-content">
          <div className="hero-text">
            <div className="hero-badge">
              <Sparkles size={16} className="badge-icon" />
              <span>#1 Free Card Creator</span>
            </div>
            <h1 className="hero-title">
              Craft Moments That
              <span className="gradient-text"> Last Forever</span>
            </h1>
            <p className="hero-description">
              Design stunning, personalized greeting cards in seconds.
              Choose from 16+ occasions, customize with your photos and music,
              and share the love instantly.
            </p>
            <div className="hero-actions">
              <button
                className="btn-primary"
                onClick={() => document.querySelector('.occasion-selector')?.scrollIntoView({ behavior: 'smooth' })}
              >
                Start Creating Free
              </button>
              <button
                className="btn-secondary"
                onClick={() => document.querySelector('.features-section')?.scrollIntoView({ behavior: 'smooth' })}
              >
                Explore Features
              </button>
            </div>
            <div className="hero-stats">
              <div className="stat">
                <span className="stat-number">50K+</span>
                <span className="stat-label">Happy Users</span>
              </div>
              <div className="stat-divider"></div>
              <div className="stat">
                <span className="stat-number">100K+</span>
                <span className="stat-label">Cards Sent</span>
              </div>
              <div className="stat-divider"></div>
              <div className="stat">
                <span className="stat-number">4.9/5</span>
                <span className="stat-label">Rating</span>
              </div>
            </div>
          </div>
          <div className="hero-visual">
            <img
              ref={heroImageRef}
              src="/hero.webp"
              alt="Greeting Cards"
              className="hero-image"
              loading="eager"
            />
          </div>
        </div>
      </div>
      <div className="hero-background">
        <div className="floating-shape shape-1"></div>
        <div className="floating-shape shape-2"></div>
        <div className="floating-shape shape-3"></div>
      </div>
    </section>
  );
};

export default Hero;
