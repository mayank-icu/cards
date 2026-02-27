import React from 'react';
import { Brush, Eye, Smartphone, Grid3x3, Save, Share } from 'lucide-react';
import './Features.css';

const Features = () => {
  const features = [
    {
      icon: <Brush size={24} />,
      title: 'Easy Design',
      description: 'Intuitive drag-and-drop interface makes creating cards simple and fun. No design skills required.',
      color: '#667eea'
    },
    {
      icon: <Eye size={24} />,
      title: 'Instant Preview',
      description: 'See your card come to life in real-time as you customize it. What you see is what you get.',
      color: '#764ba2'
    },
    {
      icon: <Smartphone size={24} />,
      title: 'Mobile Friendly',
      description: 'Create and share beautiful cards from any device, anywhere. Optimized for all screen sizes.',
      color: '#f5576c'
    },
    {
      icon: <Grid3x3 size={24} />,
      title: '16 Occasions',
      description: 'Perfect templates for birthdays, holidays, and every special moment in your life.',
      color: '#fa709a'
    },
    {
      icon: <Save size={24} />,
      title: 'Auto Save',
      description: 'Your work is automatically saved so you never lose your creativity. Pick up where you left off.',
      color: '#4facfe'
    },
    {
      icon: <Share size={24} />,
      title: 'Easy Sharing',
      description: 'Share your creations with friends and family via link, email, or download as an image.',
      color: '#43e97b'
    }
  ];

  return (
    <section className="features-section">
      <div className="features-container">
        <div className="features-header">
          <h2 className="features-title">
            Why Choose <span className="gradient-text">EGreet?</span>
          </h2>
          <p className="features-subtitle">
            Everything you need to create memorable greeting cards, all in one place.
            Powerful features wrapped in a simple interface.
          </p>
        </div>

        <div className="features-grid">
          {features.map((feature, index) => (
            <div
              key={index}
              className="feature-card"
              style={{
                animationDelay: `${index * 0.1}s`,
                '--feature-color': feature.color
              }}
            >
              <div className="feature-icon-wrapper">
                <div className="feature-icon">{feature.icon}</div>
              </div>
              <h3 className="feature-title">{feature.title}</h3>
              <p className="feature-description">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
