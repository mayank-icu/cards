import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import SimpleSEO from '../components/SimpleSEO';

const BouquetCardMakerPage = () => {
  const seoConfig = {
    title: 'Bouquet Card Maker | Create Digital Flower Bouquet Cards | EGreet',
    description: 'Create digital flower bouquet cards with messages and music. Use EGreet bouquet maker to send a beautiful personalized bouquet online.',
    keywords: 'bouquet card maker, digital flower bouquet, egreet bouquet, flower greeting card',
    canonical: 'https://egreet.in/bouquet-card-maker'
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
        <h1 style={{ fontSize: '2.1rem', marginBottom: '10px' }}>Bouquet Card Maker</h1>
        <p style={{ color: '#555', marginBottom: '24px' }}>
          Build a personalized digital flower bouquet and pair it with your own message and music in minutes.
        </p>

        <section style={box}>
          <h2 style={{ marginTop: 0 }}>What makes EGreet bouquet cards special</h2>
          <ul>
            <li>Choose flowers and arrangement style</li>
            <li>Add a personal note for the recipient</li>
            <li>Attach a song for extra emotion</li>
            <li>Share by direct link</li>
          </ul>
          <p style={{ marginBottom: 0 }}>
            Create now: <Link to="/bouquet/create">Open bouquet creator</Link>.
          </p>
        </section>

        <section style={box}>
          <h2 style={{ marginTop: 0 }}>Related pages</h2>
          <ul>
            <li><Link to="/beautiful-cards">Beautiful cards</Link></li>
            <li><Link to="/greeting-card-maker">Greeting card maker</Link></li>
            <li><Link to="/cards">All cards</Link></li>
          </ul>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default BouquetCardMakerPage;
