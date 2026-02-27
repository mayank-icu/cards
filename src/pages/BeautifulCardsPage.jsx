import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import SimpleSEO from '../components/SimpleSEO';

const BeautifulCardsPage = () => {
  const seoConfig = {
    title: 'Beautiful Cards Online | Create Beautiful Greeting Cards | EGreet',
    description: 'Create beautiful cards online with EGreet. Design elegant greeting cards for birthdays, weddings, congratulations, and heartfelt messages.',
    keywords: 'beautiful cards, beautiful greeting cards, make a beautiful card, elegant digital cards',
    canonical: 'https://egreet.in/beautiful-cards'
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
        <h1 style={{ fontSize: '2.1rem', marginBottom: '10px' }}>Beautiful Cards Online</h1>
        <p style={{ color: '#555', marginBottom: '24px' }}>
          Design beautiful greeting cards with meaningful messages and polished layouts for every special moment.
        </p>

        <section style={box}>
          <h2 style={{ marginTop: 0 }}>How to make a beautiful card</h2>
          <ol>
            <li>Pick a card category that matches the occasion.</li>
            <li>Write a clear, personal, and warm message.</li>
            <li>Share your finished card link instantly.</li>
          </ol>
          <p style={{ marginBottom: 0 }}>
            Start creating: <Link to="/greeting-card-maker">Open greeting card maker</Link>.
          </p>
        </section>

        <section style={box}>
          <h2 style={{ marginTop: 0 }}>Popular beautiful card creators</h2>
          <ul>
            <li><Link to="/birthday/create">Birthday cards</Link></li>
            <li><Link to="/wedding/create">Wedding cards</Link></li>
            <li><Link to="/anniversary/create">Anniversary cards</Link></li>
            <li><Link to="/thank-you/create">Thank you cards</Link></li>
            <li><Link to="/bouquet-card-maker">Bouquet cards</Link></li>
          </ul>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default BeautifulCardsPage;
