import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import SimpleSEO from '../components/SimpleSEO';

const GreetingsCardMakerPage = () => {
  const seoConfig = {
    title: 'Greetings Card Maker | Make Greetings Cards Online Free | EGreet',
    description: 'Use EGreet as a free greetings card maker. Design greetings cards online for birthdays, anniversaries, thank-you notes, and celebrations.',
    keywords: 'greetings card maker, make greetings cards online, free greetings card maker, digital greetings cards',
    canonical: 'https://egreet.in/greetings-card-maker'
  };

  const box = {
    background: '#fff',
    border: '1px solid #ececec',
    borderRadius: '16px',
    padding: '24px',
    marginBottom: '20px'
  };

  return (
    <div className="app">
      <SimpleSEO {...seoConfig} />
      <Navbar />

      <main style={{ maxWidth: '960px', margin: '0 auto', padding: '110px 20px 40px' }}>
        <h1 style={{ fontSize: '2.1rem', marginBottom: '10px' }}>Greetings Card Maker</h1>
        <p style={{ color: '#555', marginBottom: '24px' }}>
          Make personalized greetings cards online in minutes. Choose a template, add your message, and share.
        </p>

        <section style={box}>
          <h2 style={{ marginTop: 0 }}>Create greetings cards online</h2>
          <ul>
            <li>Birthday and anniversary greeting cards</li>
            <li>Thank you and congratulations greeting cards</li>
            <li>Holiday and special occasion cards</li>
          </ul>
          <p style={{ marginBottom: 0 }}>
            Start now: <Link to="/cards">Browse all card types</Link>.
          </p>
        </section>

        <section style={box}>
          <h2 style={{ marginTop: 0 }}>Related pages</h2>
          <ul>
            <li><Link to="/greeting-card-maker">Online greeting card maker</Link></li>
            <li><Link to="/beautiful-cards">Beautiful cards ideas and creators</Link></li>
            <li><Link to="/congratulations-card-maker">Congratulations card maker</Link></li>
          </ul>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default GreetingsCardMakerPage;
