import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import SimpleSEO from '../components/SimpleSEO';

const CongratulationsCardMakerPage = () => {
  const seoConfig = {
    title: 'Congratulations Card Maker | Create Free Congrats Cards | EGreet',
    description: 'Create congratulations cards online for graduations, promotions, new jobs, weddings, and milestones. Use EGreet\'s free congratulations card maker.',
    keywords: 'congratulations card maker, congrats card maker, graduation congratulations card, promotion card maker',
    canonical: 'https://egreet.in/congratulations-card-maker',
    structuredData: {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'Can I create a congratulations card for free?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Yes, EGreet lets you create and share congratulations cards for free.'
          }
        },
        {
          '@type': 'Question',
          name: 'What occasions are best for congratulations cards?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Popular occasions include graduations, promotions, new jobs, exam success, and weddings.'
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
        <h1 style={{ fontSize: '2.2rem', marginBottom: '10px' }}>Congratulations Card Maker</h1>
        <p style={{ fontSize: '1.05rem', color: '#555', marginBottom: '24px' }}>
          Create congratulations cards online for life milestones and achievements. Customize your message and
          share instantly.
        </p>

        <section style={sectionStyle}>
          <h2 style={{ marginTop: 0 }}>Create a congratulations card in 3 steps</h2>
          <ol>
            <li>Open the congratulations card creator.</li>
            <li>Write your custom message for the recipient.</li>
            <li>Share the generated card link.</li>
          </ol>
          <p style={{ marginBottom: 0 }}>
            Start now: <Link to="/congratulations/create">Open congratulations creator</Link>.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2 style={{ marginTop: 0 }}>Use cases</h2>
          <ul>
            <li>Graduation and academic success</li>
            <li>Job offer, promotion, or business launch</li>
            <li>Wedding and engagement milestones</li>
            <li>Competition or award achievements</li>
          </ul>
        </section>

        <section style={sectionStyle}>
          <h2 style={{ marginTop: 0 }}>Related card makers</h2>
          <ul>
            <li><Link to="/graduation/create">Graduation card maker</Link></li>
            <li><Link to="/wedding/create">Wedding card maker</Link></li>
            <li><Link to="/thank-you/create">Thank you card maker</Link></li>
            <li><Link to="/greeting-card-maker">General greeting card maker</Link></li>
          </ul>
        </section>

        <section style={sectionStyle}>
          <h2 style={{ marginTop: 0 }}>FAQs</h2>
          <h3>Can I write a custom congratulations message?</h3>
          <p>Yes, you can personalize the card content for any person or event.</p>
          <h3>Is this page different from the normal card list?</h3>
          <p>Yes, this page is focused on congratulations intent and links directly to the correct creator.</p>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default CongratulationsCardMakerPage;
