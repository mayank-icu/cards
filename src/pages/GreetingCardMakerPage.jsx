import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import SimpleSEO from '../components/SimpleSEO';

const GreetingCardMakerPage = () => {
  const seoConfig = {
    title: 'Online Greeting Card Maker | Create Free Cards in Minutes | EGreet',
    description: 'Use EGreet as your online greeting card maker. Create beautiful birthday, anniversary, wedding, thank you, and congratulations cards for free in minutes.',
    keywords: 'greeting card maker, online greeting card maker, free greeting card maker, digital card maker, custom greeting cards',
    canonical: 'https://egreet.in/greeting-card-maker',
    structuredData: {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'Is EGreet a free online greeting card maker?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Yes. You can create and share greeting cards on EGreet for free.'
          }
        },
        {
          '@type': 'Question',
          name: 'Which card types can I create?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'You can create cards for birthdays, anniversaries, weddings, congratulations, thank-you notes, and many more occasions.'
          }
        },
        {
          '@type': 'Question',
          name: 'Do I need design skills to use EGreet?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'No. EGreet is built for beginners and lets you create cards quickly with ready templates and simple editing.'
          }
        }
      ]
    }
  };

  const sectionStyle = {
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
        <h1 style={{ fontSize: '2.2rem', marginBottom: '10px' }}>Online Greeting Card Maker</h1>
        <p style={{ fontSize: '1.05rem', color: '#555', marginBottom: '24px' }}>
          EGreet helps you create personalized greeting cards online for free. Pick a design, add your message,
          and share in minutes.
        </p>

        <section style={sectionStyle}>
          <h2 style={{ marginTop: 0 }}>How to make a greeting card online</h2>
          <ol>
            <li>Choose a card type from the library.</li>
            <li>Customize your text, visuals, and details.</li>
            <li>Generate your card link and share instantly.</li>
          </ol>
          <p style={{ marginBottom: 0 }}>
            Start here: <Link to="/cards">Browse all card templates</Link>.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2 style={{ marginTop: 0 }}>Popular card makers</h2>
          <ul>
            <li><Link to="/birthday/create">Birthday card maker</Link></li>
            <li><Link to="/anniversary/create">Anniversary card maker</Link></li>
            <li><Link to="/wedding/create">Wedding card maker</Link></li>
            <li><Link to="/thank-you/create">Thank you card maker</Link></li>
            <li><Link to="/congratulations-card-maker">Congratulations card maker</Link></li>
            <li><Link to="/greetings-card-maker">Greetings card maker</Link></li>
            <li><Link to="/beautiful-cards">Beautiful cards</Link></li>
            <li><Link to="/bouquet-card-maker">Bouquet card maker</Link></li>
            <li><Link to="/bouquet/create">Digital flower bouquet card</Link></li>
          </ul>
        </section>

        <section style={sectionStyle}>
          <h2 style={{ marginTop: 0 }}>Why choose EGreet</h2>
          <ul>
            <li>Fast and beginner-friendly card creation flow</li>
            <li>High-quality templates for multiple occasions</li>
            <li>Easy link sharing across devices</li>
            <li>Free to start with no complex setup</li>
          </ul>
        </section>

        <section style={sectionStyle}>
          <h2 style={{ marginTop: 0 }}>FAQs</h2>
          <h3>Is EGreet free?</h3>
          <p>Yes, you can create and share cards for free.</p>
          <h3>Can I create cards on mobile?</h3>
          <p>Yes, the builder and card views are mobile-friendly.</p>
          <h3>Can I make different card styles?</h3>
          <p>Yes, EGreet supports many occasions and design types.</p>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default GreetingCardMakerPage;
