import React from 'react';
import Lottie from 'lottie-react';
import loaderAnimation from '../assets/animations/loader.json';
import './Loader.css';

const Loader = ({ size = 250 }) => {
    return (
        <div className="loader-container">
            <Lottie
                animationData={loaderAnimation}
                loop={true}
                autoplay={true}
                style={{ width: size, height: size }}
            />
        </div>
    );
};

export default Loader;
