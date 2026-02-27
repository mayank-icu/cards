import React from 'react';
import Lottie from 'lottie-react';
import loaderAnimation from '../assets/animations/loader.json';
import './LoadingSpinner.css';

const LoadingSpinner = () => {
  return (
    <div className="loading-spinner-container">
      <Lottie
        animationData={loaderAnimation}
        loop={true}
        autoplay={true}
        style={{ width: 250, height: 250 }}
      />
    </div>
  );
};

export default LoadingSpinner;
