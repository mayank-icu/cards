import React from 'react';
import { useLocation } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import SimpleSEO from '../components/SimpleSEO';
import { getSEOConfig } from '../utils/seoConfig';
import './About.css';

const About = () => {
    const location = useLocation();
    
    return (
        <div className="about-page">
            {/* SEO Meta Tags */}
            <SimpleSEO {...getSEOConfig(location.pathname)} />
            
            <Navbar />

            <main className="about-content">
                <div className="about-hero">
                    <h1>About EGreet</h1>
                    <p className="subtitle">Crafting memories, one card at a time.</p>
                </div>

                <div className="about-section">
                    <div className="text-content">
                        <h2>Our Mission</h2>
                        <p>
                            At EGreet, we believe that every moment is worth celebrating. Our mission is to provide
                            a platform where anyone can create beautiful, personalized greeting cards for their loved ones,
                            regardless of their design skills. We strive to make the process of expressing love, gratitude,
                            and joy as simple and delightful as possible.
                        </p>
                    </div>
                    <div className="image-content mission-image">
                        <img 
                            src="https://images.unsplash.com/photo-1557804506-669a67965ba0?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80" 
                            alt="Creative workspace with people collaborating" 
                            className="about-image"
                        />
                    </div>
                </div>

                <div className="about-section reverse">
                    <div className="text-content">
                        <h2>Our Story</h2>
                        <p>
                            EGreet started with a simple idea: digital greeting cards shouldn't feel generic.
                            We wanted to bring the warmth and personal touch of handmade cards to the digital world.
                            What began as a small project has grown into a community of thousands of creators sharing
                            millions of smiles across the globe.
                        </p>
                    </div>
                    <div className="image-content story-image">
                        <img 
                            src="https://images.unsplash.com/photo-1521791136064-7986c2920216?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80" 
                            alt="People celebrating with greeting cards" 
                            className="about-image"
                        />
                    </div>
                </div>

                <div className="values-section">
                    <h2>Our Values</h2>
                    <div className="values-grid">
                        <div className="value-card">
                            <h3>Creativity</h3>
                            <p>We empower users to unleash their inner artist.</p>
                        </div>
                        <div className="value-card">
                            <h3>Simplicity</h3>
                            <p>Great design should be accessible to everyone.</p>
                        </div>
                        <div className="value-card">
                            <h3>Connection</h3>
                            <p>We build bridges between hearts through digital art.</p>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default About;
