import { useState, useEffect, lazy, Suspense, useMemo, useCallback, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { Flower, Mail, Music } from 'lucide-react';
// Defer icon imports to reduce initial bundle
import SimpleSEO from './components/SimpleSEO';
import { getSEOConfig } from './utils/seoConfig';
import './App.css';

// Lazy load ALL non-critical components
const Navbar = lazy(() => import('./components/Navbar'));
const Hero = lazy(() => import('./components/Hero'));
const Features = lazy(() => import('./components/Features'));
const BlogSection = lazy(() => import('./components/BlogSection'));
const Footer = lazy(() => import('./components/Footer'));
const OccasionSelector = lazy(() => import('./components/OccasionSelector'));
const Dashboard = lazy(() => import('./components/Dashboard'));
const PerformanceMonitor = lazy(() => import('./components/PerformanceMonitor'));

// Lazy load piano components separately for better code splitting
const PianoLoveTool = lazy(() => import('./piano-love/components/PianoLoveTool'));
const PianoLoveView = lazy(() => import('./piano-love/components/PianoLoveView'));

const iconModules = import.meta.glob('./assets/occasions/*.webp');
const OCCASION_ICON_FILES = {
  'Birthday': 'birthday',
  'Valentine': 'valentine',
  'Crush Ask Out': 'crush-ask',
  'Apology': 'sorry',
  'Long Distance': 'far',
  'Formal Invite': 'formal-invite',
  'Time Capsule': 'time-capsule',
  'Wish Jar': 'wish-jar',
  'Anniversary': 'anniversary_1',
  'Thank You': 'thank-you_1',
  'Congratulations': 'congratulations_1',
  'Get Well Soon': 'get-well-soon_1',
  'Graduation': 'graduation_1',
  'Wedding': 'wedding',
  'New Baby': 'new-born',
  'Sympathy': 'sympathy_1',
  'Cat Lovers': 'cat',
  'Balloon Celebration': 'balloon',
  'Bon Voyage': 'bon-voyage',
  'Christmas': 'christmas',
  'Easter': 'easter',
  'Friendship (Bestie)': 'friendship',
  'Good Luck': 'good-luck',
  'Halloween': 'halloween',
  'Housewarming': 'housewarming',
  'Just Because': 'jus-because',
  'Missing You': 'missing-you',
  'New Year': 'new-year',
  'Retirement': 'retirement',
  'Self-Care (Reminder)': 'self-care',
  'Thinking of You': 'thinking-of-you'
};

function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, isAuthenticated } = useAuth();
  const [icons, setIcons] = useState({});
  const [iconsLoading, setIconsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [showCards, setShowCards] = useState(false);
  const [showBelowFoldSections, setShowBelowFoldSections] = useState(false);
  const iconLoadRunIdRef = useRef(0);

  const importanceRank = useMemo(() => ({
    'Thank You': 1,
    'Birthday': 2,
    'Anniversary': 3,
    'Valentine': 4,
    'Congratulations': 5,
    'Get Well Soon': 6,
    'Wedding': 7,
    'New Baby': 8,
    'Graduation': 9,
    'Good Luck': 10,
    'Missing You': 11,
    'Thinking of You': 12,
    'Sympathy': 13,
    'Just Because': 14
  }), []);

  // Debounce search term for better mobile performance
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, window.innerWidth <= 768 ? 300 : 200);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    const selector = location.state?.scrollTo;
    if (!selector) return;
    if (location.pathname !== '/') return;

    // Let the page render first
    const t = window.setTimeout(() => {
      const element = document.querySelector(selector);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }

      // Clear state to avoid re-scrolling on refresh/back
      navigate('.', { replace: true, state: {} });
    }, 0);

    return () => window.clearTimeout(t);
  }, [location.pathname, location.state, navigate]);

  useEffect(() => {
    if (location.pathname !== '/') return;
    if (isAuthenticated) {
      setShowBelowFoldSections(true);
      return;
    }

    let timeoutId;
    let idleId;

    const revealSections = () => setShowBelowFoldSections(true);
    if (typeof window.requestIdleCallback === 'function') {
      idleId = window.requestIdleCallback(revealSections, { timeout: 1200 });
    } else {
      timeoutId = window.setTimeout(revealSections, 450);
    }

    return () => {
      if (typeof window.cancelIdleCallback === 'function' && idleId !== undefined) {
        window.cancelIdleCallback(idleId);
      }
      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [location.pathname, isAuthenticated]);

  // Static occasions array to prevent infinite re-renders
  const staticOccasions = useMemo(() => [
    {
      id: 1,
      title: 'Birthday',
      description: 'Celebrate the beautiful gift of life with heartfelt wishes that touch the soul',
      icon: null, // Will be set dynamically
      gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      priority: 1
    },
    {
      id: 2,
      title: 'Valentine',
      description: 'Express the deepest emotions of your heart with timeless declarations of love',
      icon: null,
      gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      priority: 2
    },
    {
      id: 3,
      title: 'Crush Ask Out',
      description: 'Gather your courage and let your heart speak the words it longs to say',
      icon: null,
      gradient: 'linear-gradient(135deg, #ff6b9d 0%, #c06c84 100%)',
      priority: 5
    },
    {
      id: 4,
      title: 'Apology',
      description: 'Heal hearts and rebuild bridges with sincere words that mend what was broken',
      icon: null,
      gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      priority: 6
    },
    {
      id: 5,
      title: 'Long Distance',
      description: 'Bridge the miles between hearts with messages that transcend distance',
      icon: null,
      gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
      priority: 7
    },
    {
      id: 6,
      title: 'Formal Invite',
      description: 'Extend elegant invitations that make every guest feel truly cherished',
      icon: null,
      gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
      priority: 13
    },
    {
      id: 7,
      title: 'Time Capsule',
      description: 'Preserve precious memories in timeless messages that future hearts will treasure',
      icon: null,
      gradient: 'linear-gradient(135deg, #ff9a56 0%, #ff6a88 100%)',
      priority: 14
    },
    {
      id: 8,
      title: 'Wish Jar',
      description: 'Collect dreams and aspirations in beautiful vessels of hope and possibility',
      icon: null,
      gradient: 'linear-gradient(135deg, #89f7fe 0%, #66a6ff 100%)',
      priority: 15
    },
    {
      id: 9,
      title: 'Anniversary',
      description: 'Celebrate the journey of love that grows stronger with each passing day',
      icon: null,
      gradient: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 50%, #fecfef 100%)',
      priority: 3
    },
    {
      id: 10,
      title: 'Thank You',
      description: 'Express gratitude that flows from the depths of a truly appreciative heart',
      icon: null,
      gradient: 'linear-gradient(135deg, #fbc2eb 0%, #a6c1ee 100%)',
      priority: 4
    },
    {
      id: 11,
      title: 'Congratulations',
      description: 'Celebrate achievements and milestones with joy that shines as bright as their success',
      icon: null,
      gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      priority: 21
    },
    {
      id: 12,
      title: 'Get Well Soon',
      description: 'Send healing wishes and warm thoughts to comfort and speed recovery',
      icon: null,
      gradient: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
      priority: 22
    },
    {
      id: 13,
      title: 'Graduation',
      description: 'Honor academic achievements with pride in their bright future ahead',
      icon: null,
      gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      priority: 17
    },
    {
      id: 14,
      title: 'Wedding',
      description: 'Invite loved ones to witness the beautiful beginning of forever',
      icon: null,
      gradient: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
      priority: 18
    },
    {
      id: 15,
      title: 'New Baby',
      description: 'Welcome new life with overwhelming joy and dreams of a beautiful future',
      icon: null,
      gradient: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 50%, #ffe0e6 100%)',
      priority: 19
    },
    {
      id: 16,
      title: 'Sympathy',
      description: 'Offer gentle comfort and support during life\'s most difficult moments',
      icon: null,
      gradient: 'linear-gradient(135deg, #e0e7ff 0%, #d1d5db 100%)',
      priority: 23
    },
    {
      id: 17,
      title: 'Cat Lovers',
      description: 'Share purr-fect moments with fellow feline enthusiasts who understand',
      icon: null,
      gradient: 'linear-gradient(135deg, #ffa500 0%, #ff6b35 100%)',
      priority: 25
    },
    {
      id: 18,
      title: 'Balloon Celebration',
      description: 'Lift spirits high with celebratory wishes that float on joy',
      icon: null,
      gradient: 'linear-gradient(135deg, #ff69b4 0%, #87ceeb 100%)',
      priority: 26
    },
    {
      id: 19,
      title: 'Just Because',
      description: 'Send spontaneous smiles and unexpected moments of pure happiness',
      icon: null,
      gradient: 'linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%)',
      priority: 27
    },
    {
      id: 20,
      title: 'Bon Voyage',
      description: 'Wish safe travels and exciting adventures on their journey ahead',
      icon: null,
      gradient: 'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
      priority: 28
    },
    {
      id: 21,
      title: 'Housewarming',
      description: 'Celebrate new beginnings and the warmth of a place called home',
      icon: null,
      gradient: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 99%, #fecfef 100%)',
      priority: 29
    },
    {
      id: 22,
      title: 'Friendship (Bestie)',
      description: 'Celebrate the beautiful bond that makes life infinitely better',
      icon: null,
      gradient: 'linear-gradient(135deg, #fccb90 0%, #d57eeb 100%)',
      priority: 30
    },
    {
      id: 23,
      title: 'Self-Care (Reminder)',
      description: 'Gently remind someone to nurture their own beautiful soul',
      icon: null,
      gradient: 'linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%)',
      priority: 31
    },
    {
      id: 24,
      title: 'Missing You',
      description: 'Express the ache of absence and the warmth of memories shared',
      icon: null,
      gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      priority: 8
    },
    {
      id: 25,
      title: 'Christmas',
      description: 'Share the magic and wonder of the most wonderful time of the year',
      icon: null,
      gradient: 'linear-gradient(135deg, #0f7938 0%, #1a5490 50%, #c41e3a 100%)',
      priority: 9
    },
    {
      id: 26,
      title: 'New Year',
      description: 'Welcome fresh beginnings with hopes that sparkle like new year stars',
      icon: null,
      gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
      priority: 10
    },
    {
      id: 27,
      title: 'Easter',
      description: 'Share blessings of renewal and the joy of spring\'s beautiful rebirth',
      icon: null,
      gradient: 'linear-gradient(135deg, #87CEEB 0%, #98FB98 50%, #FFE4B5 100%)',
      priority: 11
    },
    {
      id: 28,
      title: 'Halloween',
      description: 'Share spooky fun and magical moments that delight and enchant',
      icon: null,
      gradient: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
      priority: 12
    },
    {
      id: 29,
      title: 'Good Luck',
      description: 'Send wishes of success and fortune that light up their path ahead',
      icon: null,
      gradient: 'linear-gradient(135deg, #2ecc71 0%, #27ae60 50%, #16a085 100%)',
      priority: 16
    },
    {
      id: 30,
      title: 'Retirement',
      description: 'Celebrate years of dedication and the beautiful freedom that awaits',
      icon: null,
      gradient: 'linear-gradient(135deg, #3498db 0%, #2980b9 50%, #1f4e79 100%)',
      priority: 20
    },
    {
      id: 31,
      title: 'Thinking of You',
      description: 'Let someone know they\'re cherished in your thoughts today and always',
      icon: null,
      gradient: 'linear-gradient(135deg, #e8b4f3 0%, #d4a5f5 50%, #c089f7 100%)',
      priority: 24
    }
  ], []);

  // Combine static occasions with dynamically loaded image icons
  const occasions = useMemo(() => staticOccasions.map((occasion) => ({
    ...occasion,
    icon: icons[occasion.title] || null
  })), [icons, staticOccasions]);

  // Add categories to occasions
  const occasionsWithCategories = useMemo(() => occasions.map((occasion, index) => {
    const categories = {
      0: 'life-events', // Birthday
      1: 'love', // Valentine
      2: 'love', // Crush Ask Out
      3: 'everyday', // Apology
      4: 'everyday', // Long Distance
      5: 'life-events', // Formal Invite
      6: 'life-events', // Time Capsule
      7: 'life-events', // Wish Jar
      8: 'love', // Anniversary
      9: 'everyday', // Thank You
      10: 'life-events', // Congratulations
      11: 'everyday', // Get Well Soon
      12: 'life-events', // Graduation
      13: 'life-events', // Wedding
      14: 'life-events', // New Baby
      15: 'everyday', // Sympathy
      16: 'special-interest', // Cat Lovers
      17: 'life-events', // Balloon Celebration
      18: 'everyday', // Just Because
      19: 'life-events', // Bon Voyage
      20: 'life-events', // Housewarming
      21: 'everyday', // Friendship
      22: 'everyday', // Self-Care
      23: 'everyday', // Missing You
      24: 'holidays', // Christmas
      25: 'holidays', // New Year
      26: 'holidays', // Easter
      27: 'holidays', // Halloween
      28: 'everyday', // Good Luck
      29: 'life-events', // Retirement
      30: 'everyday' // Thinking of You
    };
    return { ...occasion, category: categories[index] || 'everyday' };
  }), [occasions]);

  const tabs = useMemo(() => [
    { id: 'all', label: 'All Cards', count: occasionsWithCategories.length },
    { id: 'life-events', label: 'Life Events', count: occasionsWithCategories.filter(o => o.category === 'life-events').length },
    { id: 'love', label: 'Love & Romance', count: occasionsWithCategories.filter(o => o.category === 'love').length },
    { id: 'holidays', label: 'Holidays', count: occasionsWithCategories.filter(o => o.category === 'holidays').length },
    { id: 'everyday', label: 'Everyday', count: occasionsWithCategories.filter(o => o.category === 'everyday').length },
    { id: 'special-interest', label: 'Special Interest', count: occasionsWithCategories.filter(o => o.category === 'special-interest').length }
  ], [occasionsWithCategories]);

  // Helper to determine card priority based on date and importance
  const homeOccasions = useMemo(() => {
    // Always work from full set, then filter and sort by importance.
    let occasionsToShow = occasionsWithCategories;

    // Filter by tab
    if (activeTab !== 'all') {
      occasionsToShow = occasionsToShow.filter(occasion => occasion.category === activeTab);
    }

    // Filter by search term
    if (debouncedSearchTerm) {
      occasionsToShow = occasionsToShow.filter(occasion =>
        occasion.title.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        occasion.description.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
      );
    }

    const sortedByImportance = [...occasionsToShow].sort((a, b) => {
      const aRank = importanceRank[a.title] ?? (100 + (a.priority ?? 999));
      const bRank = importanceRank[b.title] ?? (100 + (b.priority ?? 999));
      if (aRank !== bRank) return aRank - bRank;
      return a.title.localeCompare(b.title);
    });

    // On homepage default view, show top 12 most important cards.
    if (!showCards && !debouncedSearchTerm && activeTab === 'all') {
      return sortedByImportance.slice(0, 12);
    }

    return sortedByImportance;
  }, [showCards, occasionsWithCategories, activeTab, debouncedSearchTerm, importanceRank]);

  // Always load icons for currently visible homepage cards.
  useEffect(() => {
    if (location.pathname !== '/') return;

    const visibleTitles = homeOccasions.map((occasion) => occasion.title);
    const missingTitles = visibleTitles.filter((title) => !icons[title]);
    if (missingTitles.length === 0) return;

    const runId = ++iconLoadRunIdRef.current;

    const loadVisibleIcons = async () => {
      setIconsLoading(true);
      try {
        const loadedEntries = await Promise.all(
          missingTitles.map(async (title) => {
            const file = OCCASION_ICON_FILES[title];
            if (!file) return null;
            const importer = iconModules[`./assets/occasions/${file}.webp`];
            if (!importer) return null;
            const mod = await importer();
            return [title, mod.default];
          })
        );

        if (runId !== iconLoadRunIdRef.current) return;
        setIcons((prev) => {
          const next = { ...prev };
          for (const entry of loadedEntries) {
            if (!entry) continue;
            const [title, src] = entry;
            next[title] = src;
          }
          return next;
        });
      } finally {
        if (runId === iconLoadRunIdRef.current) {
          setIconsLoading(false);
        }
      }
    };

    loadVisibleIcons();
  }, [location.pathname, homeOccasions, icons]);

  const handleTabClick = (tabId) => {
    setActiveTab(tabId);
    setShowCards(true); // Always show cards when tab is clicked
  };

  const handleCardClick = useCallback((occasion) => {
    // Check if this is a coming soon card
    if (occasion.comingSoon) {
      const slug = occasion.title.toLowerCase().replace(/\s+/g, '-');
      navigate(`/coming-soon/${slug}`);
      return;
    }

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

    const route = routeMap[occasion.title];
    if (route) {
      navigate(route);
    }
  }, [navigate]);

  return (
    <div className="app">
      {/* SEO Meta Tags */}
      <SimpleSEO {...getSEOConfig(location.pathname)} />

      {/* Navigation */}
      <Suspense fallback={<div style={{ minHeight: '72px' }} />}><Navbar /></Suspense>

      {/* Show Dashboard for logged-in users, Hero/Features for non-logged-in */}
      {isAuthenticated ? (
        <Suspense fallback={
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '50vh',
            fontSize: '1.2rem',
            color: '#667eea'
          }}>
            Loading Dashboard...
          </div>
        }>
          <Dashboard />
        </Suspense>
      ) : (
        <>
          {/* Hero Section */}
          <Suspense fallback={<div style={{ minHeight: '40vh' }} />}><Hero /></Suspense>

          {/* Piano Love Songs Section - Featured */}
          <div className="piano-feature-section" style={{
            padding: '80px 2rem',
            background: '#F0F9FF', // Light blue background
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{
              maxWidth: '1200px',
              margin: '0 auto',
              position: 'relative',
              zIndex: 2
            }}>
              <div style={{
                textAlign: 'center',
                marginBottom: '3rem'
              }}>
                <h2 style={{
                  fontSize: '3rem',
                  fontWeight: '300',
                  color: '#1e40af', // Dark blue text
                  marginBottom: '1rem',
                  fontFamily: "'Playfair Display', serif",
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '1rem'
                }}>
                  <Music size={40} color="#2563eb" /> Piano Love Songs
                </h2>
                <p style={{
                  fontSize: '1.3rem',
                  color: '#666', // Muted text
                  maxWidth: '700px',
                  margin: '0 auto'
                }}>
                  Search from thousands of MIDI songs and create a beautiful piano message
                </p>
              </div>

              <div className="feature-cards-container piano-theme">
                {/* Feature 1 */}
                <div className="feature-card"
                  style={{
                    border: '1px solid #e0f2fe'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                >
                  <div style={{ marginBottom: '1.5rem', color: '#2563eb' }}>
                    <Music size={48} strokeWidth={1.5} />
                  </div>
                  <h3 style={{ fontSize: '1.3rem', color: '#1e40af', marginBottom: '0.5rem', fontFamily: "'Playfair Display', serif" }}>Search Songs</h3>
                  <p style={{ color: '#666', fontSize: '1rem', lineHeight: '1.6' }}>Choose from thousands of MIDI songs across all genres</p>
                </div>

                {/* Feature 2 */}
                <div className="feature-card"
                  style={{
                    border: '1px solid #e0f2fe'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                >
                  <div style={{ marginBottom: '1.5rem', color: '#2563eb' }}>
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                    </svg>
                  </div>
                  <h3 style={{ fontSize: '1.3rem', color: '#1e40af', marginBottom: '0.5rem', fontFamily: "'Playfair Display', serif" }}>Play Piano</h3>
                  <p style={{ color: '#666', fontSize: '1rem', lineHeight: '1.6' }}>Use the simplified 7-key piano to record your version</p>
                </div>

                {/* Feature 3 */}
                <div className="feature-card"
                  style={{
                    border: '1px solid #e0f2fe'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                >
                  <div style={{ marginBottom: '1.5rem', color: '#2563eb' }}>
                    <Mail size={48} strokeWidth={1.5} />
                  </div>
                  <h3 style={{ fontSize: '1.3rem', color: '#1e40af', marginBottom: '0.5rem', fontFamily: "'Playfair Display', serif" }}>Share Message</h3>
                  <p style={{ color: '#666', fontSize: '1rem', lineHeight: '1.6' }}>Add a heartfelt message and share with loved ones</p>
                </div>
              </div>

              <div style={{ textAlign: 'center' }}>
                <button
                  onClick={() => navigate('/piano')}
                  style={{
                    padding: '1.25rem 3rem',
                    fontSize: '1.2rem',
                    fontWeight: '600',
                    background: '#2563eb', // Blue button
                    color: 'white',       // White text
                    border: 'none',
                    borderRadius: '50px',
                    cursor: 'pointer',
                    boxShadow: '0 8px 25px rgba(37, 99, 235, 0.25)',
                    transition: 'all 0.3s ease',
                    fontFamily: "'Inter', sans-serif"
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.transform = 'translateY(-3px)';
                    e.target.style.boxShadow = '0 12px 35px rgba(37, 99, 235, 0.35)';
                    e.target.style.background = '#1d4ed8';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = '0 8px 25px rgba(37, 99, 235, 0.25)';
                    e.target.style.background = '#2563eb';
                  }}
                >
                  Create Piano Message →
                </button>
              </div>
            </div>
          </div>

          {/* Digital Flowers Bouquet Section - Featured */}
          <div className="bouquet-feature-section" style={{
            padding: '80px 2rem',
            background: '#FDFBF7', // Theme cream background
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{
              maxWidth: '1200px',
              margin: '0 auto',
              position: 'relative',
              zIndex: 2
            }}>
              <div style={{
                textAlign: 'center',
                marginBottom: '3rem'
              }}>
                <h2 style={{
                  fontSize: '3rem',
                  fontWeight: '300',
                  color: '#2d2d2d', // Dark text
                  marginBottom: '1rem',
                  fontFamily: "'Playfair Display', serif",
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '1rem'
                }}>
                  <Flower size={40} color="#ff6b9d" /> Digital Flowers Bouquet
                </h2>
                <p style={{
                  fontSize: '1.3rem',
                  color: '#666', // Muted text
                  maxWidth: '700px',
                  margin: '0 auto'
                }}>
                  Create a beautiful, personalized bouquet with your favorite flowers and a heartfelt message
                </p>
              </div>

              <div className="feature-cards-container bouquet-theme">
                {/* Feature 1 */}
                <div className="feature-card"
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                >
                  <div style={{ marginBottom: '1.5rem', color: '#ff6b9d' }}>
                    <Flower size={48} strokeWidth={1.5} />
                  </div>
                  <h3 style={{ fontSize: '1.3rem', color: '#2d2d2d', marginBottom: '0.5rem', fontFamily: "'Playfair Display', serif" }}>Choose Your Flowers</h3>
                  <p style={{ color: '#666', fontSize: '1rem', lineHeight: '1.6' }}>Select 5-6 flowers from 10 beautiful varieties</p>
                </div>

                {/* Feature 2 */}
                <div className="feature-card"
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                >
                  <div style={{ marginBottom: '1.5rem', color: '#ff6b9d' }}>
                    <Mail size={48} strokeWidth={1.5} />
                  </div>
                  <h3 style={{ fontSize: '1.3rem', color: '#2d2d2d', marginBottom: '0.5rem', fontFamily: "'Playfair Display', serif" }}>Add Your Message</h3>
                  <p style={{ color: '#666', fontSize: '1rem', lineHeight: '1.6' }}>Write a heartfelt note to accompany your bouquet</p>
                </div>

                {/* Feature 3 */}
                <div className="feature-card"
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                >
                  <div style={{ marginBottom: '1.5rem', color: '#ff6b9d' }}>
                    <Music size={48} strokeWidth={1.5} />
                  </div>
                  <h3 style={{ fontSize: '1.3rem', color: '#2d2d2d', marginBottom: '0.5rem', fontFamily: "'Playfair Display', serif" }}>Add a Song</h3>
                  <p style={{ color: '#666', fontSize: '1rem', lineHeight: '1.6' }}>Make it special with music from Spotify</p>
                </div>
              </div>

              <div style={{ textAlign: 'center' }}>
                <button
                  onClick={() => navigate('/bouquet/create')}
                  style={{
                    padding: '1.25rem 3rem',
                    fontSize: '1.2rem',
                    fontWeight: '600',
                    background: '#ff6b9d', // Pink button
                    color: 'white',       // White text
                    border: 'none',
                    borderRadius: '50px',
                    cursor: 'pointer',
                    boxShadow: '0 8px 25px rgba(255, 107, 157, 0.25)',
                    transition: 'all 0.3s ease',
                    fontFamily: "'Inter', sans-serif"
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.transform = 'translateY(-3px)';
                    e.target.style.boxShadow = '0 12px 35px rgba(255, 107, 157, 0.35)';
                    e.target.style.background = '#ff5da0';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = '0 8px 25px rgba(255, 107, 157, 0.25)';
                    e.target.style.background = '#ff6b9d';
                  }}
                >
                  Create Your Bouquet →
                </button>
              </div>
            </div>
          </div>

          {/* Occasions Section */}
          <div className="main-content" style={{ paddingTop: '60px' }}>
            {/* Section Heading */}
            <div style={{ textAlign: 'center', marginBottom: '40px' }}>
              <h2 style={{
                fontSize: '2.5rem',
                fontWeight: '300',
                color: 'var(--text-primary)',
                marginBottom: '10px',
                zIndex: 10,
                position: 'relative',
                fontFamily: "'Playfair Display', serif",
                lineHeight: '1.2'
              }}>
                Choose Your Perfect Card
              </h2>
              <p style={{
                fontSize: '1.2rem',
                color: 'var(--text-secondary)',
                maxWidth: '600px',
                margin: '0 auto',
                zIndex: 10,
                position: 'relative'
              }}>
                Browse our collection of beautiful greeting cards for every occasion
              </p>
              <p style={{
                fontSize: '0.98rem',
                color: '#555',
                maxWidth: '700px',
                margin: '12px auto 0'
              }}>
                Popular pages: <a href="/greeting-card-maker">online greeting card maker</a>, <a href="/free-ecard-maker">free online ecard maker</a>, <a href="/online-thank-you-card-maker">online thank you card maker</a>, and <a href="/beautiful-cards">beautiful cards</a>. E Greet helps you build memories.
              </p>
            </div>

            {/* Search Bar */}
            <div style={{ marginBottom: '40px', maxWidth: '500px', margin: '0 auto 40px' }}>
              <div style={{ position: 'relative' }}>
                <svg
                  aria-hidden="true"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{
                    position: 'absolute',
                    left: '15px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#667eea'
                  }}
                >
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <input
                  type="text"
                  placeholder="Search cards by name or description..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    // Automatically show cards when user starts searching
                    if (e.target.value.trim() && !showCards) {
                      setShowCards(true);
                    }
                  }}
                  style={{
                    width: '100%',
                    padding: '15px 15px 15px 50px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '12px',
                    fontSize: '16px',
                    outline: 'none',
                    transition: 'all 0.3s ease',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#667eea';
                    e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#e5e7eb';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>
            </div>

            {/* Tabs */}
            <div style={{ marginBottom: '40px' }}>
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                gap: '10px',
                flexWrap: 'wrap',
                borderBottom: '2px solid #e5e7eb',
                paddingBottom: '10px'
              }}>
                {tabs.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => handleTabClick(tab.id)}
                    style={{
                      padding: '10px 20px',
                      border: 'none',
                      background: activeTab === tab.id
                        ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                        : 'transparent',
                      color: activeTab === tab.id ? '#ffffff' : '#667eea',
                      borderRadius: '8px 8px 0 0',
                      fontSize: '14px',
                      fontWeight: activeTab === tab.id ? '600' : '500',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      position: 'relative',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px'
                    }}
                    onMouseEnter={(e) => {
                      if (activeTab !== tab.id) {
                        e.target.style.background = 'rgba(102, 126, 234, 0.1)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (activeTab !== tab.id) {
                        e.target.style.background = 'transparent';
                      }
                    }}
                  >
                    {tab.label}
                    <span style={{
                      background: activeTab === tab.id ? '#ffffff' : '#667eea',
                      color: activeTab === tab.id ? '#667eea' : '#ffffff',
                      padding: '2px 6px',
                      borderRadius: '10px',
                      fontSize: '12px',
                      fontWeight: '600'
                    }}>
                      {tab.count}
                    </span>
                  </button>
                ))}
              </div>
            </div>


            {/* Always show cards (preview or filtered) */}
            {iconsLoading && homeOccasions.length === 0 ? (
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '300px',
                fontSize: '1.2rem',
                color: '#667eea'
              }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    border: '3px solid #f3f3f3',
                    borderTop: '3px solid #667eea',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite',
                    margin: '0 auto 20px'
                  }}></div>
                  Loading beautiful cards...
                </div>
              </div>
            ) : (
              <>
                {/* Results count */}
                {showCards && (debouncedSearchTerm || activeTab !== 'all') && (
                  <div style={{ textAlign: 'center', marginBottom: '20px', color: '#667eea' }}>
                    {debouncedSearchTerm
                      ? `Found ${homeOccasions.length} ${homeOccasions.length === 1 ? 'card' : 'cards'} matching "${debouncedSearchTerm}"`
                      : `Showing ${homeOccasions.length} ${homeOccasions.length === 1 ? 'card' : 'cards'} in ${tabs.find(t => t.id === activeTab)?.label || 'All Cards'}`
                    }
                  </div>
                )}

                <Suspense fallback={<div style={{ minHeight: '300px' }} />}>
                  <OccasionSelector
                    onCardClick={handleCardClick}
                    occasions={homeOccasions}
                  />
                </Suspense>
                <div style={{
                  textAlign: 'center',
                  marginTop: '50px',
                  marginBottom: '60px',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center'
                }}>
                  <button
                    className="btn-secondary"
                    onClick={() => navigate('/cards')}
                    style={{
                      padding: '14px 36px',
                      fontSize: '1.1rem',
                      fontWeight: '500',
                      borderRadius: '12px',
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      color: 'white',
                      border: 'none',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      boxShadow: '0 4px 16px rgba(102, 126, 234, 0.2)',
                      fontFamily: "'Inter', sans-serif"
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.transform = 'translateY(-2px)';
                      e.target.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.3)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.transform = 'translateY(0)';
                      e.target.style.boxShadow = '0 4px 16px rgba(102, 126, 234, 0.2)';
                    }}
                  >
                    View All Cards
                  </button>
                </div>
              </>
            )}

            {/* No results message */}
            {showCards && homeOccasions.length === 0 && !iconsLoading && (
              <div style={{
                textAlign: 'center',
                padding: '60px 20px',
                color: '#667eea'
              }}>
                <div style={{ fontSize: '48px', marginBottom: '20px' }}>🔍</div>
                <h3 style={{ fontSize: '1.5rem', marginBottom: '10px' }}>No cards found</h3>
                <p>Try adjusting your search or browse different categories</p>
              </div>
            )}

          </div>

          {/* Features and blog are deferred until idle to reduce first-load work */}
          {showBelowFoldSections && (
            <Suspense fallback={<div style={{ minHeight: '200px' }} />}>
              <Features />
            </Suspense>
          )}

          {showBelowFoldSections && (
            <Suspense fallback={<div style={{ minHeight: '200px' }} />}>
              <BlogSection />
            </Suspense>
          )}
        </>
      )}

      {/* Footer */}
      <Suspense fallback={<div style={{ minHeight: '120px' }} />}><Footer /></Suspense>

      {/* Performance Monitoring - only in production */}
      {import.meta.env.PROD && (
        <Suspense fallback={null}>
          <PerformanceMonitor />
        </Suspense>
      )}
    </div>
  );
}

export default App;
