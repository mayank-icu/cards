import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import OccasionSelector from '../components/OccasionSelector';
import SimpleSEO from '../components/SimpleSEO';

// Import icons
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

const AllCardsPage = () => {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = React.useState('');
    const [activeTab, setActiveTab] = React.useState('all');
    const importanceRank = React.useMemo(() => ({
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

    const seoConfig = {
        title: 'All Greeting Cards - EGreet',
        description: 'Browse our complete collection of greeting cards for every occasion. From birthdays to weddings, find the perfect card.',
        keywords: 'greeting cards, all cards, birthday cards, wedding cards, valentine cards',
        canonical: 'https://egreet.in/cards'
    };

    const occasions = React.useMemo(() => [
        {
            id: 1,
            title: 'Birthday',
            description: 'Celebrate special birthdays with personalized cards',
            icon: birthdayIcon,
            gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            priority: 1
        },
        {
            id: 2,
            title: 'Valentine',
            description: 'Express your love with heartfelt Valentine cards',
            icon: valentineIcon,
            gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            priority: 2
        },
        {
            id: 3,
            title: 'Crush Ask Out',
            description: 'Make the first move with creative cards',
            icon: crushAskIcon,
            gradient: 'linear-gradient(135deg, #ff6b9d 0%, #c06c84 100%)',
            priority: 5
        },
        {
            id: 4,
            title: 'Apology',
            description: 'Say sorry with thoughtful messages',
            icon: apologyIcon,
            gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
            priority: 6
        },
        {
            id: 5,
            title: 'Long Distance',
            description: 'Stay connected across the miles',
            icon: longDistanceIcon,
            gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
            priority: 7
        },
        {
            id: 6,
            title: 'Formal Invite',
            description: 'Professional invitations for special events',
            icon: formalInviteIcon,
            gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
            priority: 13
        },
        {
            id: 7,
            title: 'Time Capsule',
            description: 'Preserve memories for the future',
            icon: timeCapsuleIcon,
            gradient: 'linear-gradient(135deg, #ff9a56 0%, #ff6a88 100%)',
            priority: 14
        },
        {
            id: 8,
            title: 'Wish Jar',
            description: 'Share wishes and dreams in creative ways',
            icon: wishJarIcon,
            gradient: 'linear-gradient(135deg, #89f7fe 0%, #66a6ff 100%)',
            priority: 15
        },
        {
            id: 9,
            title: 'Anniversary',
            description: 'Celebrate love and milestones together',
            icon: anniversaryIcon,
            gradient: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 50%, #fecfef 100%)',
            priority: 3
        },
        {
            id: 10,
            title: 'Thank You',
            description: 'Express gratitude with heartfelt messages',
            icon: thankYouIcon,
            gradient: 'linear-gradient(135deg, #fbc2eb 0%, #a6c1ee 100%)',
            priority: 4
        },
        {
            id: 11,
            title: 'Congratulations',
            description: 'Celebrate achievements and milestones',
            icon: congratulationsIcon,
            gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            priority: 21
        },
        {
            id: 12,
            title: 'Get Well Soon',
            description: 'Send healing wishes and support',
            icon: getWellIcon,
            gradient: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
            priority: 22
        },
        {
            id: 13,
            title: 'Graduation',
            description: 'Honor academic achievements',
            icon: graduationIcon,
            gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            priority: 17
        },
        {
            id: 14,
            title: 'Wedding',
            description: 'Invite guests to celebrate your special day',
            icon: weddingIcon,
            gradient: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
            priority: 18
        },
        {
            id: 15,
            title: 'New Baby',
            description: 'Welcome new life with joy and love',
            icon: newBabyIcon,
            gradient: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 50%, #ffe0e6 100%)',
            priority: 19
        },
        {
            id: 16,
            title: 'Sympathy',
            description: 'Offer comfort and support during difficult times',
            icon: sympathyIcon,
            gradient: 'linear-gradient(135deg, #e0e7ff 0%, #d1d5db 100%)',
            priority: 23
        },
        {
            id: 17,
            title: 'Cat Lovers',
            description: 'Cat memories',
            icon: catIcon,
            gradient: 'linear-gradient(135deg, #ffa500 0%, #ff6b35 100%)',
            priority: 25
        },
        {
            id: 18,
            title: 'Balloon Celebration',
            description: 'Celebration reason',
            icon: balloonIcon,
            gradient: 'linear-gradient(135deg, #ff69b4 0%, #87ceeb 100%)',
            priority: 26
        },
        {
            id: 19,
            title: 'Just Because',
            description: 'Send a smile just because',
            icon: justBecauseIcon,
            gradient: 'linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%)',
            priority: 27,
            category: 'everyday'
        },
        {
            id: 20,
            title: 'Bon Voyage',
            description: 'Wish them a safe journey',
            icon: bonVoyageIcon,
            gradient: 'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
            priority: 28,
            category: 'life-events'
        },
        {
            id: 21,
            title: 'Housewarming',
            description: 'Celebrate their new home',
            icon: housewarmingIcon,
            gradient: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 99%, #fecfef 100%)',
            priority: 29,
            category: 'life-events'
        },
        {
            id: 22,
            title: 'Friendship (Bestie)',
            description: 'Celebrate your special bond',
            icon: friendshipIcon,
            gradient: 'linear-gradient(135deg, #fccb90 0%, #d57eeb 100%)',
            priority: 30,
            category: 'everyday'
        },
        {
            id: 23,
            title: 'Self-Care (Reminder)',
            description: 'Remind them to take care',
            icon: selfCareIcon,
            gradient: 'linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%)',
            priority: 31,
            category: 'everyday'
        },
        {
            id: 24,
            title: 'Missing You',
            description: 'Memories section',
            icon: missingYouIcon,
            gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            priority: 8,
            category: 'everyday'
        },
        {
            id: 25,
            title: 'Christmas',
            description: 'Holiday wishes',
            icon: christmasIcon,
            gradient: 'linear-gradient(135deg, #0f7938 0%, #1a5490 50%, #c41e3a 100%)',
            priority: 9,
            category: 'holidays'
        },
        {
            id: 26,
            title: 'New Year',
            description: 'Hopes & resolutions',
            icon: newYearIcon,
            gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
            priority: 10,
            category: 'holidays'
        },
        {
            id: 27,
            title: 'Easter',
            description: 'Easter blessings',
            icon: easterIcon,
            gradient: 'linear-gradient(135deg, #87CEEB 0%, #98FB98 50%, #FFE4B5 100%)',
            priority: 11,
            category: 'holidays'
        },
        {
            id: 28,
            title: 'Halloween',
            description: 'Spooky wishes',
            icon: halloweenIcon,
            gradient: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
            priority: 12,
            category: 'holidays'
        },
        {
            id: 29,
            title: 'Good Luck',
            description: 'Encouragement section',
            icon: goodLuckIcon,
            gradient: 'linear-gradient(135deg, #2ecc71 0%, #27ae60 50%, #16a085 100%)',
            priority: 16,
            category: 'everyday'
        },
        {
            id: 30,
            title: 'Retirement',
            description: 'Career achievements',
            icon: retirementIcon,
            gradient: 'linear-gradient(135deg, #3498db 0%, #2980b9 50%, #1f4e79 100%)',
            priority: 20,
            category: 'life-events'
        },
        {
            id: 31,
            title: 'Thinking of You',
            description: 'Thoughts section',
            icon: thinkingOfYouIcon,
            gradient: 'linear-gradient(135deg, #e8b4f3 0%, #d4a5f5 50%, #c089f7 100%)',
            priority: 24,
            category: 'everyday'
        }
    ], []);

    // Add categories to existing occasions
    const occasionsWithCategories = React.useMemo(() => {
        return occasions.map((occasion, index) => {
            if (index < 17) {
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
                    16: 'special-interest' // Cat Lovers
                };
                return { ...occasion, category: categories[index] || 'everyday' };
            }
            return occasion;
        });
    }, [occasions]);

    const tabs = [
        { id: 'all', label: 'All Cards', count: occasionsWithCategories.length },
        { id: 'life-events', label: 'Life Events', count: occasionsWithCategories.filter(o => o.category === 'life-events').length },
        { id: 'love', label: 'Love & Romance', count: occasionsWithCategories.filter(o => o.category === 'love').length },
        { id: 'holidays', label: 'Holidays', count: occasionsWithCategories.filter(o => o.category === 'holidays').length },
        { id: 'everyday', label: 'Everyday', count: occasionsWithCategories.filter(o => o.category === 'everyday').length },
        { id: 'special-interest', label: 'Special Interest', count: occasionsWithCategories.filter(o => o.category === 'special-interest').length }
    ];

    const filteredOccasions = React.useMemo(() => {
        let filtered = occasionsWithCategories;

        // Filter by tab
        if (activeTab !== 'all') {
            filtered = filtered.filter(occasion => occasion.category === activeTab);
        }

        // Filter by search term
        if (searchTerm) {
            filtered = filtered.filter(occasion =>
                occasion.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                occasion.description.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        filtered = [...filtered].sort((a, b) => {
            const aRank = importanceRank[a.title] ?? (100 + (a.priority ?? 999));
            const bRank = importanceRank[b.title] ?? (100 + (b.priority ?? 999));
            if (aRank !== bRank) return aRank - bRank;
            return a.title.localeCompare(b.title);
        });

        return filtered;
    }, [searchTerm, activeTab, occasionsWithCategories, importanceRank]);

    const handleCardClick = (occasion) => {
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
            'Balloon Celebration': '/balloon-celebration/create'
        };

        const route = routeMap[occasion.title];
        if (route) {
            navigate(route);
        }
    };

    return (
        <div className="app">
            <SimpleSEO {...seoConfig} />
            <Navbar />

            <div className="main-content all-cards-page" style={{ paddingTop: '84px', minHeight: '80vh' }}>
                <div className="container">
                    <h1 style={{ 
                        textAlign: 'center', 
                        marginBottom: '40px', 
                        fontSize: '2.5rem', 
                        fontWeight: '300',
                        fontFamily: "'Playfair Display', serif",
                        lineHeight: '1.2',
                        color: 'var(--text-primary)'
                    }}>
                        All Greeting Cards
                    </h1>
                    <p style={{ textAlign: 'center', margin: '-20px auto 32px', maxWidth: '760px', color: '#555' }}>
                        Looking for a full card builder? Visit our <a href="/greeting-card-maker">online greeting card maker</a>, <a href="/greetings-card-maker">greetings card maker</a>, <a href="/congratulations-card-maker">congratulations card maker</a>, <a href="/beautiful-cards">beautiful cards</a>, or <a href="/bouquet-card-maker">bouquet card maker</a>.
                    </p>

                    {/* Search Bar */}
                    <div style={{ marginBottom: '30px', maxWidth: '500px', margin: '0 auto 30px' }}>
                        <div style={{ position: 'relative' }}>
                            <Search 
                                size={20} 
                                style={{ 
                                    position: 'absolute', 
                                    left: '15px', 
                                    top: '50%', 
                                    transform: 'translateY(-50%)',
                                    color: '#667eea'
                                }} 
                            />
                            <input
                                type="text"
                                placeholder="Search cards by name or description..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
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
                                    onClick={() => setActiveTab(tab.id)}
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
                                            e.currentTarget.style.background = 'rgba(102, 126, 234, 0.1)';
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        if (activeTab !== tab.id) {
                                            e.currentTarget.style.background = 'transparent';
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

                    {/* Results count */}
                    {searchTerm && (
                        <div style={{ textAlign: 'center', marginBottom: '20px', color: '#667eea' }}>
                            Found {filteredOccasions.length} {filteredOccasions.length === 1 ? 'card' : 'cards'} matching "{searchTerm}"
                        </div>
                    )}

                    <OccasionSelector
                        occasions={filteredOccasions}
                        onCardClick={handleCardClick}
                    />

                    {/* No results message */}
                    {filteredOccasions.length === 0 && (
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
            </div>

            <Footer />
        </div>
    );
};

export default AllCardsPage;
