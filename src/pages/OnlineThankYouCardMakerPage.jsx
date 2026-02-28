import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import SimpleSEO from '../components/SimpleSEO';

const OnlineThankYouCardMakerPage = () => {
    const seoConfig = {
        title: 'Online Thank You Card Maker | EGreet',
        description: 'Create a beautiful, personalized thank you card online with EGreet. Express your gratitude quickly and for free with our online thank you card maker.',
        keywords: 'online thank you card maker, thank you card creator, make thank you card, digital thank you card',
        canonical: 'https://egreet.in/online-thank-you-card-maker',
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
                <h1 style={{ fontSize: '2.2rem', marginBottom: '10px' }}>Online Thank You Card Maker</h1>
                <p style={{ fontSize: '1.05rem', color: '#555', marginBottom: '24px' }}>
                    Say "Thank You" with style! Use EGreet's free online thank you card creator to craft expressing gratitude effortlessly.
                </p>

                <div style={{ textAlign: 'center', margin: '40px 0' }}>
                    <Link to="/thank-you/create" style={{ display: 'inline-block', padding: '15px 30px', background: '#667eea', color: '#fff', borderRadius: '8px', textDecoration: 'none', fontWeight: 'bold' }}>
                        Create a Thank You Card Now
                    </Link>
                </div>

                <section style={sectionStyle}>
                    <h2 style={{ marginTop: 0 }}>Express Your Gratitude Perfectly</h2>
                    <p>
                        Whether someone gave you a beautiful gift, attended your wedding, or just helped you out, a personalized digital thank you card is the best way to show your appreciation.
                    </p>
                </section>
            </main>

            <Footer />
        </div>
    );
};

export default OnlineThankYouCardMakerPage;
