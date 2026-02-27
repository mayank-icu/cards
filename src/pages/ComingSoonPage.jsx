import React from 'react';
import { useParams } from 'react-router-dom';
import ComingSoon from '../components/ComingSoon';
import Navbar from '../components/Navbar';
import './ComingSoonPage.css';
import reactIcon from '../assets/react.svg';
import catIcon from '../assets/occasions/cat.webp';
import balloonIcon from '../assets/occasions/balloon.webp';

const ComingSoonPage = () => {
  const { occasion } = useParams();

  const occasionData = {
    'missing-you': {
      title: 'Missing You',
      description: 'Let someone know they are on your mind',
      icon: reactIcon,
      gradient: 'linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%)'
    },
    christmas: {
      title: 'Christmas',
      description: 'Spread holiday cheer with festive cards',
      icon: reactIcon,
      gradient: 'linear-gradient(135deg, #0f7938 0%, #d4145a 100%)'
    },
    'new-year': {
      title: 'New Year',
      description: 'Welcome the new year with celebratory wishes',
      icon: reactIcon,
      gradient: 'linear-gradient(135deg, #ff6b35 0%, #f7931e 100%)'
    },
    easter: {
      title: 'Easter',
      description: 'Celebrate renewal and joy this Easter',
      icon: reactIcon,
      gradient: 'linear-gradient(135deg, #a8e6cf 0%, #dcedc1 100%)'
    },
    halloween: {
      title: 'Halloween',
      description: 'Spooky and fun cards for Halloween',
      icon: reactIcon,
      gradient: 'linear-gradient(135deg, #ff6b35 0%, #4a0e0e 100%)'
    },
    'good-luck': {
      title: 'Good Luck',
      description: 'Send wishes of success and fortune',
      icon: reactIcon,
      gradient: 'linear-gradient(135deg, #ffd700 0%, #ffb347 100%)'
    },
    retirement: {
      title: 'Retirement',
      description: 'Celebrate years of hard work and dedication',
      icon: reactIcon,
      gradient: 'linear-gradient(135deg, #6c63ff 0%, #8b5cf6 100%)'
    },
    'thinking-of-you': {
      title: 'Thinking of You',
      description: 'Let someone know they are in your thoughts',
      icon: reactIcon,
      gradient: 'linear-gradient(135deg, #ffeaa7 0%, #ff6b9d 100%)'
    },
    'cat-lovers': {
      title: 'Cat Lovers',
      description: 'Purr-fect cards for feline enthusiasts',
      icon: catIcon,
      gradient: 'linear-gradient(135deg, #ffa500 0%, #ff6b35 100%)'
    },
    'balloon-celebration': {
      title: 'Balloon Celebration',
      description: 'Uplifting cards for joyful moments',
      icon: balloonIcon,
      gradient: 'linear-gradient(135deg, #ff69b4 0%, #87ceeb 100%)'
    }
  };

  const data = occasionData[occasion] || occasionData.christmas;

  return (
    <div className="app">
      {/* Navigation */}
      <Navbar />

      <div className="coming-soon-page">
        <ComingSoon
          occasion={data.title}
          description={data.description}
          icon={data.icon}
          gradient={data.gradient}
        />
      </div>

      {/* Simple Footer */}
      <div className="simple-footer">
        <p>&copy; 2026 CardCraft - Create beautiful memories</p>
      </div>
    </div>
  );
};

export default ComingSoonPage;
