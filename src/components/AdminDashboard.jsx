import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useAdminAuth } from '../contexts/AdminAuthContext';
import { 
  Shield, Users, Trash2, Eye, BarChart3, Calendar, 
  Mail, Clock, TrendingUp, AlertCircle, LogOut,
  Search, Filter, Download, RefreshCw
} from 'lucide-react';
import SimpleSEO from './SimpleSEO';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const { currentUser, logout } = useAuth();
  const { checkAdminAccess } = useAdminAuth();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cards, setCards] = useState([]);
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [selectedCard, setSelectedCard] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Check admin access
  useEffect(() => {
    if (!currentUser || !checkAdminAccess(currentUser)) {
      navigate('/');
      return;
    }
    fetchData();
  }, [currentUser, navigate]);

  const fetchData = async () => {
    try {
      setLoading(true);
      console.log('Starting to fetch admin data...');
      
      const { collection, getDocs, query, orderBy, limit } = await import('firebase/firestore');
      const { db } = await import('../firebase');
      
      console.log('Firebase imports successful, db:', db);
      
      // Fetch cards from all collections
      let cardsData = [];
      const cardCollections = [
        'valentines',
        'birthday-cards', 
        'anniversary-cards',
        'thank-you-cards',
        'apology-cards',
        'crush-ask-cards',
        'long-distance-cards',
        'invite-cards',
        'capsule-cards',
        'wish-jars',
        'congratulations-cards',
        'get-well-cards',
        'graduation-cards',
        'wedding-cards',
        'new-baby-cards',
        'sympathy-cards',
        'just-because-cards',
        'bon-voyage-cards',
        'housewarming-cards',
        'friendship-cards',
        'self-care-cards',
        'missing-you-cards',
        'christmas-cards',
        'new-year-cards',
        'easter-cards',
        'halloween-cards',
        'good-luck-cards',
        'retirement-cards',
        'thinking-of-you-cards',
        'cat-lovers-cards',
        'balloon-celebration-cards'
      ];
      
      try {
        for (const collectionName of cardCollections) {
          try {
            const cardsQuery = query(collection(db, collectionName), orderBy('createdAt', 'desc'), limit(50));
            const cardsSnapshot = await getDocs(cardsQuery);
            
            const collectionCards = cardsSnapshot.docs.map(doc => ({
              id: doc.id,
              type: collectionName.replace('-cards', '').replace('s', ''), // Normalize type name
              collectionName: collectionName,
              ...doc.data()
            }));
            
            cardsData.push(...collectionCards);
            console.log(`Found ${collectionCards.length} cards in ${collectionName}`);
          } catch (collectionError) {
            console.log(`Collection ${collectionName} does not exist or error:`, collectionError.message);
          }
        }
        
        console.log('Total cards processed:', cardsData.length);
      } catch (cardsError) {
        console.error('Error fetching cards:', cardsError);
        // Use sample data if Firebase fails
        cardsData = [
          {
            id: 'sample-1',
            type: 'birthday',
            recipientName: 'John Doe',
            createdAt: new Date(),
            userId: 'user-1'
          },
          {
            id: 'sample-2',
            type: 'valentine',
            recipientName: 'Jane Smith',
            createdAt: new Date(Date.now() - 86400000),
            userId: 'user-2'
          },
          {
            id: 'sample-3',
            type: 'anniversary',
            recipientName: 'Mike Johnson',
            createdAt: new Date(Date.now() - 172800000),
            userId: 'user-1'
          }
        ];
        console.log('Using sample cards data:', cardsData.length);
      }
      setCards(cardsData);

      // Fetch users
      let usersData = [];
      try {
        const usersQuery = query(collection(db, 'users'), orderBy('createdAt', 'desc'), limit(50));
        console.log('Users query created:', usersQuery);
        
        const usersSnapshot = await getDocs(usersQuery);
        console.log('Users snapshot received, size:', usersSnapshot.size);
        
        usersData = usersSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        console.log('Users data processed:', usersData.length, 'users');
      } catch (usersError) {
        console.error('Error fetching users:', usersError);
        // Use sample data if Firebase fails
        usersData = [
          {
            id: 'user-1',
            email: 'user1@example.com',
            displayName: 'User One',
            createdAt: new Date()
          },
          {
            id: 'user-2',
            email: 'user2@example.com',
            displayName: 'User Two',
            createdAt: new Date(Date.now() - 86400000)
          }
        ];
        console.log('Using sample users data:', usersData.length);
      }
      setUsers(usersData);

      // Calculate stats
      const statsData = {
        totalCards: cardsData.length,
        totalUsers: usersData.length,
        cardsThisWeek: cardsData.filter(card => {
          const cardDate = card.createdAt?.toDate ? card.createdAt.toDate() : new Date(card.createdAt);
          if (!cardDate) return false;
          const weekAgo = new Date();
          weekAgo.setDate(weekAgo.getDate() - 7);
          return cardDate > weekAgo;
        }).length,
        usersThisWeek: usersData.filter(user => {
          const userDate = user.createdAt?.toDate ? user.createdAt.toDate() : new Date(user.createdAt);
          if (!userDate) return false;
          const weekAgo = new Date();
          weekAgo.setDate(weekAgo.getDate() - 7);
          return userDate > weekAgo;
        }).length,
        popularCardTypes: calculatePopularTypes(cardsData)
      };
      console.log('Stats calculated:', statsData);
      setStats(statsData);

    } catch (err) {
      console.error('Error fetching admin data:', err);
      setError('Failed to load admin data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const calculatePopularTypes = (cardsData) => {
    const typeCounts = {};
    cardsData.forEach(card => {
      const type = card.type || 'unknown';
      typeCounts[type] = (typeCounts[type] || 0) + 1;
    });
    
    return Object.entries(typeCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([type, count]) => ({ type, count }));
  };

  const handleDeleteCard = async (cardId) => {
    try {
      const { doc, deleteDoc } = await import('firebase/firestore');
      const { db } = await import('../firebase');
      
      // Find the card to get its collection name
      const cardToDelete = cards.find(card => card.id === cardId);
      if (!cardToDelete) {
        setError('Card not found');
        return;
      }
      
      const collectionName = cardToDelete.collectionName || `${cardToDelete.type}-cards`;
      await deleteDoc(doc(db, collectionName, cardId));
      setCards(cards.filter(card => card.id !== cardId));
      setShowDeleteModal(false);
      setSelectedCard(null);
      
      // Update stats
      setStats(prev => ({
        ...prev,
        totalCards: prev.totalCards - 1
      }));
      
    } catch (err) {
      console.error('Error deleting card:', err);
      setError('Failed to delete card. Please try again.');
    }
  };

  const filteredCards = cards.filter(card => {
    const matchesSearch = !searchTerm || 
      card.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (card.type && card.type.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (card.recipientName && card.recipientName.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesFilter = filterType === 'all' || card.type === filterType;
    
    return matchesSearch && matchesFilter;
  });

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="spinner"></div>
        <p>Loading admin dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-error">
        <AlertCircle size={48} />
        <h2>Error</h2>
        <p>{error}</p>
        <button onClick={fetchData} className="btn-primary">
          <RefreshCw size={16} />
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <SimpleSEO 
        title="Admin Dashboard - EGreet"
        description="Admin dashboard for managing EGreet cards and users"
        noIndex={true}
      />
      
      {/* Header */}
      <header className="admin-header">
        <div className="admin-header-content">
          <div className="admin-title">
            <Shield size={32} />
            <div>
              <h1>Admin Dashboard</h1>
              <p>Welcome, {currentUser?.displayName || currentUser?.email}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="btn-logout">
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </header>

      {/* Stats Overview */}
      <section className="admin-stats">
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">
              <Users size={24} />
            </div>
            <div className="stat-content">
              <h3>{stats.totalUsers}</h3>
              <p>Total Users</p>
              <span className="stat-change">+{stats.usersThisWeek} this week</span>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">
              <BarChart3 size={24} />
            </div>
            <div className="stat-content">
              <h3>{stats.totalCards}</h3>
              <p>Total Cards</p>
              <span className="stat-change">+{stats.cardsThisWeek} this week</span>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">
              <TrendingUp size={24} />
            </div>
            <div className="stat-content">
              <h3>{stats.popularCardTypes[0]?.type || 'N/A'}</h3>
              <p>Most Popular</p>
              <span className="stat-change">{stats.popularCardTypes[0]?.count || 0} cards</span>
            </div>
          </div>
        </div>
      </section>

      {/* Controls */}
      <section className="admin-controls">
        <div className="controls-left">
          <div className="search-box">
            <Search size={20} />
            <input
              type="text"
              placeholder="Search cards by ID, type, or recipient..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="filter-box">
            <Filter size={20} />
            <select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
              <option value="all">All Types</option>
              <option value="valentine">Valentine</option>
              <option value="birthday">Birthday</option>
              <option value="anniversary">Anniversary</option>
              <option value="thank-you">Thank You</option>
              <option value="apology">Apology</option>
              <option value="crush-ask">Crush Ask</option>
              <option value="long-distance">Long Distance</option>
              <option value="invite">Formal Invite</option>
              <option value="capsule">Time Capsule</option>
              <option value="wish-jar">Wish Jar</option>
              <option value="congratulations">Congratulations</option>
              <option value="get-well">Get Well</option>
              <option value="graduation">Graduation</option>
              <option value="wedding">Wedding</option>
              <option value="new-baby">New Baby</option>
              <option value="sympathy">Sympathy</option>
              <option value="just-because">Just Because</option>
              <option value="bon-voyage">Bon Voyage</option>
              <option value="housewarming">Housewarming</option>
              <option value="friendship">Friendship</option>
              <option value="self-care">Self Care</option>
              <option value="missing-you">Missing You</option>
              <option value="christmas">Christmas</option>
              <option value="new-year">New Year</option>
              <option value="easter">Easter</option>
              <option value="halloween">Halloween</option>
              <option value="good-luck">Good Luck</option>
              <option value="retirement">Retirement</option>
              <option value="thinking-of-you">Thinking of You</option>
              <option value="cat-lovers">Cat Lovers</option>
              <option value="balloon-celebration">Balloon Celebration</option>
            </select>
          </div>
        </div>
        
        <div className="controls-right">
          <button onClick={fetchData} className="btn-secondary">
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>
      </section>

      {/* Cards Table */}
      <section className="admin-content">
        <div className="content-header">
          <h2>Cards ({filteredCards.length})</h2>
        </div>
        
        <div className="cards-table">
          <div className="table-header">
            <div>Card ID</div>
            <div>Type</div>
            <div>Recipient</div>
            <div>Created</div>
            <div>User</div>
            <div>Actions</div>
          </div>
          
          <div className="table-body">
            {filteredCards.map((card) => (
              <div key={card.id} className="table-row">
                <div className="card-id">{card.id}</div>
                <div className="card-type">
                  <span className={`type-badge ${card.type}`}>
                    {card.type || 'unknown'}
                  </span>
                </div>
                <div className="card-recipient">
                  {card.recipientName || 'N/A'}
                </div>
                <div className="card-date">
                  {formatDate(card.createdAt)}
                </div>
                <div className="card-user">
                  {card.userId ? card.userId.substring(0, 8) + '...' : 'N/A'}
                </div>
                <div className="card-actions">
                  <button
                    onClick={() => {
                      setSelectedCard(card);
                      setShowDeleteModal(true);
                    }}
                    className="btn-delete"
                    title="Delete card"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {filteredCards.length === 0 && (
          <div className="no-results">
            <AlertCircle size={48} />
            <h3>No cards found</h3>
            <p>Try adjusting your search or filter criteria</p>
          </div>
        )}
      </section>

      {/* Popular Card Types */}
      <section className="admin-popular">
        <h2>Popular Card Types</h2>
        <div className="popular-grid">
          {stats.popularCardTypes.map((item, index) => (
            <div key={item.type} className="popular-item">
              <div className="popular-rank">#{index + 1}</div>
              <div className="popular-info">
                <h4>{item.type}</h4>
                <p>{item.count} cards</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedCard && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Delete Card</h3>
              <button 
                onClick={() => setShowDeleteModal(false)}
                className="modal-close"
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <p>Are you sure you want to delete this card?</p>
              <div className="card-details">
                <p><strong>ID:</strong> {selectedCard.id}</p>
                <p><strong>Type:</strong> {selectedCard.type}</p>
                <p><strong>Recipient:</strong> {selectedCard.recipientName || 'N/A'}</p>
                <p><strong>Created:</strong> {formatDate(selectedCard.createdAt)}</p>
              </div>
              <p className="warning">This action cannot be undone.</p>
            </div>
            <div className="modal-footer">
              <button 
                onClick={() => setShowDeleteModal(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button 
                onClick={() => handleDeleteCard(selectedCard.id)}
                className="btn-danger"
              >
                <Trash2 size={16} />
                Delete Card
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
