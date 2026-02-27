import React from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Twitter, Instagram, Mail, Heart } from 'lucide-react';
import './Footer.css';

const Footer = () => {
    return (
        <footer className="site-footer">
            <div className="footer-content">
                <div className="footer-section brand">
                    <img src="/logo.webp" alt="EGreet" className="footer-logo" />
                    <p>Creating moments, sharing love through beautiful greeting cards.</p>
                    <div className="social-links">
                        <a href="#" aria-label="Facebook"><Facebook size={20} /></a>
                        <a href="#" aria-label="Twitter"><Twitter size={20} /></a>
                        <a href="#" aria-label="Instagram"><Instagram size={20} /></a>
                    </div>
                </div>

                <div className="footer-section links">
                    <h4>Quick Links</h4>
                    <ul>
                        <li><Link to="/">Home</Link></li>
                        <li><Link to="/cards">All Cards</Link></li>
                        <li><Link to="/greeting-card-maker">Greeting Card Maker</Link></li>
                        <li><Link to="/greetings-card-maker">Greetings Card Maker</Link></li>
                        <li><Link to="/congratulations-card-maker">Congratulations Card Maker</Link></li>
                        <li><Link to="/beautiful-cards">Beautiful Cards</Link></li>
                        <li><Link to="/bouquet-card-maker">Bouquet Card Maker</Link></li>
                        <li><Link to="/about">About Us</Link></li>
                        <li><Link to="/contact">Contact Us</Link></li>
                        <li><Link to="/blog/">Blog</Link></li>
                        <li><Link to="/saved-cards">My Cards</Link></li>
                    </ul>
                </div>

                <div className="footer-section contact">
                    <h4>Contact</h4>
                    <ul>
                        <li><a href="mailto:hello@egreet.in"><Mail size={16} /> hello@egreet.in</a></li>
                    </ul>
                </div>
            </div>

            <div className="footer-bottom">
                <p>&copy; {new Date().getFullYear()} EGreet. Made with <Heart size={14} fill="red" color="red" /> for you.</p>
            </div>
        </footer>
    );
};

export default Footer;
