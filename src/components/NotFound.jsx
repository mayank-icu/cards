import React from 'react';
import { Link } from 'react-router-dom';
import './NotFound.css';

const NotFound = () => {
  return (
    <div className="not-found-container">
      <div className="not-found-content">
        <div className="error-code">404</div>
        <h1 className="error-title">Page Not Found</h1>
        <p className="error-description">
          Oops! The page you're looking for seems to have wandered off. 
          Let's get you back to creating beautiful cards.
        </p>
        <Link to="/" className="home-button">
          Back to Home
        </Link>
      </div>
      <div className="card-decoration">
        <div className="floating-card card-1">Card</div>
        <div className="floating-card card-2">Love</div>
        <div className="floating-card card-3">Celebrate</div>
        <div className="floating-card card-4">Shine</div>
      </div>
    </div>
  );
};

export default NotFound;
