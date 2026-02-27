import React from 'react';
import './CardFooter.css';

const CardFooter = () => {
  return (
    <div className="card-footer">
      <div className="footer-content">
        <p className="footer-text">
          Made with ❤️ using Cards App
        </p>
        <div className="footer-links">
          <a href="/" className="footer-link">
            Create Your Card
          </a>
        </div>
      </div>
    </div>
  );
};

export default CardFooter;
