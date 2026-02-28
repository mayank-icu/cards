import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import SimpleSEO from '../components/SimpleSEO';

const FreeEcardMakerPage = () => {
    const seoConfig = {
        title: 'Free eCard Maker | Create Free eCards Online | EGreet',
        description: 'Use EGreet as your free online ecard maker. Create beautiful, personalized ecards for birthdays, anniversaries, weddings, and more in minutes. No login required.',
        keywords: 'free ecard maker, free online ecard maker, create ecard free, free ecards online, digital ecard maker, custom ecards',
        canonical: 'https://egreet.in/free-ecard-maker',
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
                <h1 style={{ fontSize: '2.2rem', marginBottom: '10px' }}>Free Online eCard Maker</h1>
                <p style={{ fontSize: '1.05rem', color: '#555', marginBottom: '24px' }}>
                    EGreet is the best free ecard maker online. Choose from dozens of professional templates, personalize your message, and share with your loved ones instantly without spending a dime.
                </p>

                <section style={sectionStyle}>
                    <h2 style={{ marginTop: 0 }}>Create eCards for Every Occasion</h2>
                    <p>Whether you need a personalized birthday wish or a heartfelt thank you, our platform has you covered.</p>
                    <ul>
                        <li><Link to="/birthday/create">Birthday eCards</Link></li>
                        <li><Link to="/valentine/create">Valentine's Day eCards</Link></li>
                        <li><Link to="/wedding/create">Wedding Invitations</Link></li>
                        <li><Link to="/thank-you/create">Thank You eCards</Link></li>
                    </ul>
                </section>

                <section style={sectionStyle}>
                    <h2 style={{ marginTop: 0 }}>How to Create Your Free eCard</h2>
                    <ol>
                        <li>Select an occasion from our homepage.</li>
                        <li>Customize your card with photos, text, and music.</li>
                        <li>Get your unique, private link to share it for free.</li>
                    </ol>
                    <p style={{ marginBottom: 0 }}>
                        Ready to begin? <Link to="/">Start creating now</Link>.
                    </p>
                </section>
            </main>

            <Footer />
        </div>
    );
};

export default FreeEcardMakerPage;
