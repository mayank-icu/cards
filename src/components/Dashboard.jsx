import { Flower, Mail, Music } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import SimpleSEO from './SimpleSEO';
import OccasionSelector from './OccasionSelector';
import Navbar from './Navbar';
import BlogSection from './BlogSection';
import Footer from './Footer';
import './Dashboard.css';

import birthdayIcon from '../assets/occasions/birthday.webp';
import valentineIcon from '../assets/occasions/valentine.webp';
import crushAskIcon from '../assets/occasions/crush-ask.webp';
import apologyIcon from '../assets/occasions/sorry.webp';
import longDistanceIcon from '../assets/occasions/far.webp';
import formalInviteIcon from '../assets/occasions/formal-invite.webp';
import timeCapsuleIcon from '../assets/occasions/time-capsule.webp';
import wishJarIcon from '../assets/occasions/wish-jar.webp';
import anniversaryIcon from '../assets/occasions/anniversary_1.webp';
import thankYouIcon from '../assets/occasions/thank-you_1.webp';
import congratulationsIcon from '../assets/occasions/congratulations_1.webp';
import getWellIcon from '../assets/occasions/get-well-soon_1.webp';
import graduationIcon from '../assets/occasions/graduation_1.webp';
import weddingIcon from '../assets/occasions/wedding.webp';
import newBabyIcon from '../assets/occasions/new-born.webp';
import sympathyIcon from '../assets/occasions/sympathy_1.webp';
import catIcon from '../assets/occasions/cat.webp';
import balloonIcon from '../assets/occasions/balloon.webp';
import bonVoyageIcon from '../assets/occasions/bon-voyage.webp';
import christmasIcon from '../assets/occasions/christmas.webp';
import easterIcon from '../assets/occasions/easter.webp';
import friendshipIcon from '../assets/occasions/friendship.webp';
import goodLuckIcon from '../assets/occasions/good-luck.webp';
import halloweenIcon from '../assets/occasions/halloween.webp';
import housewarmingIcon from '../assets/occasions/housewarming.webp';
import justBecauseIcon from '../assets/occasions/jus-because.webp';
import missingYouIcon from '../assets/occasions/missing-you.webp';
import newYearIcon from '../assets/occasions/new-year.webp';
import retirementIcon from '../assets/occasions/retirement.webp';
import selfCareIcon from '../assets/occasions/self-care.webp';
import thinkingOfYouIcon from '../assets/occasions/thinking-of-you.webp';
import flowersIcon from '../assets/occasions/flowers.webp';

const occasions = [
  { id: 1, title: 'Birthday', description: 'Celebrate special birthdays with personalized cards', icon: birthdayIcon, gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', priority: 1 },
  { id: 2, title: 'Valentine', description: 'Express your love with heartfelt Valentine cards', icon: valentineIcon, gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', priority: 2 },
  { id: 3, title: 'Crush Ask Out', description: 'Make the first move with creative cards', icon: crushAskIcon, gradient: 'linear-gradient(135deg, #ff6b9d 0%, #c06c84 100%)', priority: 5 },
  { id: 4, title: 'Apology', description: 'Say sorry with thoughtful messages', icon: apologyIcon, gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', priority: 6 },
  { id: 5, title: 'Long Distance', description: 'Stay connected across the miles', icon: longDistanceIcon, gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)', priority: 7 },
  { id: 6, title: 'Formal Invite', description: 'Professional invitations for special events', icon: formalInviteIcon, gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)', priority: 13 },
  { id: 7, title: 'Time Capsule', description: 'Preserve memories for the future', icon: timeCapsuleIcon, gradient: 'linear-gradient(135deg, #ff9a56 0%, #ff6a88 100%)', priority: 14 },
  { id: 8, title: 'Wish Jar', description: 'Share wishes and dreams in creative ways', icon: wishJarIcon, gradient: 'linear-gradient(135deg, #89f7fe 0%, #66a6ff 100%)', priority: 15 },
  { id: 9, title: 'Anniversary', description: 'Celebrate love and milestones together', icon: anniversaryIcon, gradient: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 50%, #fecfef 100%)', priority: 3 },
  { id: 10, title: 'Thank You', description: 'Express gratitude with heartfelt messages', icon: thankYouIcon, gradient: 'linear-gradient(135deg, #fbc2eb 0%, #a6c1ee 100%)', priority: 4 },
  { id: 11, title: 'Congratulations', description: 'Celebrate achievements and milestones', icon: congratulationsIcon, gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', priority: 21 },
  { id: 12, title: 'Get Well Soon', description: 'Send healing wishes and support', icon: getWellIcon, gradient: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)', priority: 22 },
  { id: 13, title: 'Graduation', description: 'Honor academic achievements', icon: graduationIcon, gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', priority: 17 },
  { id: 14, title: 'Wedding', description: 'Invite guests to celebrate your special day', icon: weddingIcon, gradient: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)', priority: 18 },
  { id: 15, title: 'New Baby', description: 'Welcome new life with joy and love', icon: newBabyIcon, gradient: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 50%, #ffe0e6 100%)', priority: 19 },
  { id: 16, title: 'Sympathy', description: 'Offer comfort and support during difficult times', icon: sympathyIcon, gradient: 'linear-gradient(135deg, #e0e7ff 0%, #d1d5db 100%)', priority: 23 },
  { id: 17, title: 'Cat Lovers', description: 'Cat memories', icon: catIcon, gradient: 'linear-gradient(135deg, #ffa500 0%, #ff6b35 100%)', priority: 25 },
  { id: 18, title: 'Balloon Celebration', description: 'Celebration reason', icon: balloonIcon, gradient: 'linear-gradient(135deg, #ff69b4 0%, #87ceeb 100%)', priority: 26 },
  { id: 19, title: 'Just Because', description: 'Send a smile just because', icon: justBecauseIcon, gradient: 'linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%)', priority: 27 },
  { id: 20, title: 'Bon Voyage', description: 'Wish them a safe journey', icon: bonVoyageIcon, gradient: 'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)', priority: 28 },
  { id: 21, title: 'Housewarming', description: 'Celebrate their new home', icon: housewarmingIcon, gradient: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 99%, #fecfef 100%)', priority: 29 },
  { id: 22, title: 'Friendship (Bestie)', description: 'Celebrate your special bond', icon: friendshipIcon, gradient: 'linear-gradient(135deg, #fccb90 0%, #d57eeb 100%)', priority: 30 },
  { id: 23, title: 'Self-Care (Reminder)', description: 'Remind them to take care', icon: selfCareIcon, gradient: 'linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%)', priority: 31 },
  { id: 24, title: 'Missing You', description: 'Memories section', icon: missingYouIcon, gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', priority: 8 },
  { id: 25, title: 'Christmas', description: 'Holiday wishes', icon: christmasIcon, gradient: 'linear-gradient(135deg, #0f7938 0%, #1a5490 50%, #c41e3a 100%)', priority: 9 },
  { id: 26, title: 'New Year', description: 'Hopes & resolutions', icon: newYearIcon, gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)', priority: 10 },
  { id: 27, title: 'Easter', description: 'Easter blessings', icon: easterIcon, gradient: 'linear-gradient(135deg, #87CEEB 0%, #98FB98 50%, #FFE4B5 100%)', priority: 11 },
  { id: 28, title: 'Halloween', description: 'Spooky wishes', icon: halloweenIcon, gradient: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)', priority: 12 },
  { id: 29, title: 'Good Luck', description: 'Encouragement section', icon: goodLuckIcon, gradient: 'linear-gradient(135deg, #2ecc71 0%, #27ae60 50%, #16a085 100%)', priority: 16 },
  { id: 30, title: 'Retirement', description: 'Career achievements', icon: retirementIcon, gradient: 'linear-gradient(135deg, #3498db 0%, #2980b9 50%, #1f4e79 100%)', priority: 20 },
  { id: 31, title: 'Thinking of You', description: 'Thoughts section', icon: thinkingOfYouIcon, gradient: 'linear-gradient(135deg, #e8b4f3 0%, #d4a5f5 50%, #c089f7 100%)', priority: 24 },
  { id: 32, title: 'Digital Flowers', description: 'Send a beautiful bouquet', icon: flowersIcon, gradient: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 50%, #ffecd2 100%)', priority: 32 },
  { id: 33, title: 'Piano Love Songs', description: 'Play any song in 7-key easy mode', icon: '🎹', gradient: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 50%, #e0e7ff 100%)', priority: 33 }
];

const routeMap = {
  'Valentine': '/valentine/create',
  'Birthday': '/birthday/create',
  'Wish Jar': '/wish-jar/create',
  'Crush Ask Out': '/crush/create',
  'Apology': '/apology/create',
  'Long Distance': '/long-distance/create',
  'Formal Invite': '/invite/create',
  'Time Capsule': '/capsule/create',
  'Anniversary': '/anniversary/create',
  'Thank You': '/thank-you/create',
  'Congratulations': '/congratulations/create',
  'Get Well Soon': '/get-well/create',
  'Graduation': '/graduation/create',
  'Wedding': '/wedding/create',
  'New Baby': '/new-baby/create',
  'Sympathy': '/sympathy/create',
  'Just Because': '/just-because/create',
  'Bon Voyage': '/bon-voyage/create',
  'Housewarming': '/housewarming/create',
  'Friendship (Bestie)': '/friendship/create',
  'Self-Care (Reminder)': '/self-care/create',
  'Missing You': '/missing-you/create',
  'Christmas': '/christmas/create',
  'New Year': '/new-year/create',
  'Easter': '/easter/create',
  'Halloween': '/halloween/create',
  'Good Luck': '/good-luck/create',
  'Retirement': '/retirement/create',
  'Thinking of You': '/thinking-of-you/create',
  'Cat Lovers': '/cat-lovers/create',
  'Balloon Celebration': '/balloon-celebration/create',
  'Digital Flowers': '/bouquet/create',
  'Piano Love Songs': '/piano'
};

const Dashboard = () => {
  const navigate = useNavigate();

  const dashboardSEO = {
    title: 'Dashboard - My EGreet Account | EGreet',
    description: 'Access your EGreet dashboard to create new cards, view your creations, and manage your account.',
    keywords: 'egreet dashboard, my cards, create cards, account dashboard',
    noIndex: true
  };

  const handleCardClick = (occasion) => {
    if (occasion.comingSoon) {
      const slug = occasion.title.toLowerCase().replace(/\s+/g, '-');
      navigate(`/coming-soon/${slug}`);
      return;
    }

    const route = routeMap[occasion.title];
    if (route) {
      navigate(route);
    }
  };

  return (
    <div className="app">
      <SimpleSEO {...dashboardSEO} />
      <Navbar />

      <div className="main-content" style={{ paddingTop: '110px' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h2 style={{
            fontSize: '2.5rem',
            fontWeight: '300',
            color: 'var(--text-primary)',
            marginBottom: '10px',
            fontFamily: "'Playfair Display', serif",
            lineHeight: '1.2'
          }}>
            Choose Your Perfect Card
          </h2>
          <p style={{
            fontSize: '1.2rem',
            color: 'var(--text-secondary)',
            maxWidth: '700px',
            margin: '0 auto'
          }}>
            Browse our full collection, including Bouquet Maker and Piano Love Songs.
          </p>
        </div>

        <OccasionSelector onCardClick={handleCardClick} occasions={occasions} />
      </div>

      <section style={{ padding: '24px 2rem 60px', background: '#FDFBF7' }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '1rem'
        }}>
          <div style={{
            borderRadius: '18px',
            border: '1px solid #efe7da',
            background: '#fff',
            padding: '18px 22px'
          }}>
            <h3 style={{
              margin: 0,
              fontSize: '1.2rem',
              color: '#2d2d2d',
              fontFamily: "'Playfair Display', serif",
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <Flower size={18} color="#ff6b9d" /> Bouquet Maker
            </h3>
            <p style={{ margin: '6px 0 14px', color: '#666' }}>
              Build a flower bouquet and attach your personal message.
            </p>
            <button
              onClick={() => navigate('/bouquet/create')}
              style={{
                border: 'none',
                borderRadius: '999px',
                padding: '0.7rem 1.2rem',
                background: '#ff6b9d',
                color: '#fff',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Open Bouquet Maker
            </button>
          </div>

          <div style={{
            borderRadius: '18px',
            border: '1px solid #efe7da',
            background: '#fff',
            padding: '18px 22px'
          }}>
            <h3 style={{
              margin: 0,
              fontSize: '1.2rem',
              color: '#2d2d2d',
              fontFamily: "'Playfair Display', serif",
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <Music size={18} color="#2563eb" /> Piano Love Songs
            </h3>
            <p style={{ margin: '6px 0 14px', color: '#666' }}>
              Search MIDI songs and play simplified 7-key piano versions.
            </p>
            <button
              onClick={() => navigate('/piano')}
              style={{
                border: 'none',
                borderRadius: '999px',
                padding: '0.7rem 1.2rem',
                background: '#2563eb',
                color: '#fff',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Open Piano Tool
            </button>
          </div>

          <div style={{
            borderRadius: '18px',
            border: '1px solid #efe7da',
            background: '#fff',
            padding: '18px 22px'
          }}>
            <h3 style={{
              margin: 0,
              fontSize: '1.2rem',
              color: '#2d2d2d',
              fontFamily: "'Playfair Display', serif",
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <Mail size={18} color="#22c55e" /> Saved Cards
            </h3>
            <p style={{ margin: '6px 0 14px', color: '#666' }}>
              View, manage, and share the cards you have already created.
            </p>
            <button
              onClick={() => navigate('/saved-cards')}
              style={{
                border: 'none',
                borderRadius: '999px',
                padding: '0.7rem 1.2rem',
                background: '#22c55e',
                color: '#fff',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              View Saved Cards
            </button>
          </div>
        </div>
      </section>

      <BlogSection limit={3} showHeader={true} showViewAll={true} />
      <Footer />
    </div>
  );
};

export default Dashboard;
