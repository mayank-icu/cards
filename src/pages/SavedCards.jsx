import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { collection, deleteDoc, doc, onSnapshot } from 'firebase/firestore';
import toast from 'react-hot-toast';
import Navbar from '../components/Navbar';
import './SavedCards.css';

const SavedCards = () => {
  const [savedCards, setSavedCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
      return;
    }

    const cardsCol = collection(db, 'users', currentUser.uid, 'savedCards');

    const unsubscribe = onSnapshot(
      cardsCol,
      (snapshot) => {
        const cards = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data()
        })).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        setSavedCards(cards);
        setLoading(false);
      },
      (error) => {
        console.error('Failed to load saved cards:', error);
        toast.error('Failed to load saved cards');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [currentUser, navigate]);

  const handleDeleteCard = async (cardId) => {
    if (window.confirm('Are you sure you want to delete this card?')) {
      try {
        const cardRef = doc(db, 'users', currentUser.uid, 'savedCards', cardId);
        await deleteDoc(cardRef);
        toast.success('Card deleted successfully');
      } catch (error) {
        toast.error('Failed to delete card');
      }
    }
  };

  const handleViewCard = (card) => {
    const routeMap = {
      'valentine': `/valentine/${card.cardId}`,
      'birthday': `/birthday/${card.cardId}`,
      'wish-jar': `/wish-jar/${card.cardId}`,
      'crush': `/ask/${card.cardId}`,
      'apology': `/apology/${card.cardId}`,
      'long-distance': `/long-distance/${card.cardId}`,
      'invite': `/invite/${card.cardId}`,
      'capsule': `/capsule/${card.cardId}`,
      'anniversary': `/anniversary/${card.cardId}`,
      'thank-you': `/thank-you/${card.cardId}`,
      'congratulations': `/congratulations/${card.cardId}`,
      'get-well': `/get-well/${card.cardId}`,
      'graduation': `/graduation/${card.cardId}`,
      'wedding': `/wedding/${card.cardId}`,
      'new-baby': `/new-baby/${card.cardId}`,
      'sympathy': `/sympathy/${card.cardId}`
    };

    const route = routeMap[card.type];
    if (route) {
      window.open(route, '_blank');
    } else {
      toast.error('Card not found');
    }
  };

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getCardIcon = (type) => {
    const iconMap = {
      'valentine': 'heart',
      'birthday': 'cake',
      'wish-jar': 'jar',
      'crush': 'heart-crush',
      'apology': 'hands-praying',
      'long-distance': 'globe',
      'invite': 'envelope',
      'capsule': 'clock',
      'anniversary': 'heart-ring',
      'thank-you': 'hands-heart',
      'congratulations': 'trophy',
      'get-well': 'flower',
      'graduation': 'graduation-cap',
      'wedding': 'ring',
      'new-baby': 'baby',
      'sympathy': 'dove'
    };
    return iconMap[type] || 'card';
  };

  if (loading) {
    return (
      <div className="saved-cards-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading your saved cards...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <Navbar />
      
      <div className="saved-cards-container">
        <div className="saved-cards-header">
          <button 
            className="back-button"
            onClick={() => navigate('/')}
          >
            ← Back to Home
          </button>
          <h1>My Cards</h1>
        </div>

        {savedCards.length === 0 ? (
          <div className="empty-state">
            <h2>No cards yet</h2>
            <p>Create your first card to get started</p>
            <button 
              className="create-button"
              onClick={() => navigate('/')}
            >
              Create Card
            </button>
          </div>
        ) : (
          <div className="cards-grid">
            {savedCards.map((card) => (
              <div key={card.id} className="card-item">
                <div className="card-preview">
                  <div className="card-icon">
                    <span className="icon-text">{getCardIcon(card.type).replace('-', ' ')}</span>
                  </div>
                  <div className="card-type">{card.type}</div>
                </div>
                <div className="card-info">
                  <h3>{card.title || 'Untitled Card'}</h3>
                  <p className="card-date">{formatDate(card.createdAt)}</p>
                  <div className="card-actions">
                    <button 
                      className="view-button"
                      onClick={() => handleViewCard(card)}
                    >
                      View
                    </button>
                    <button 
                      className="delete-button"
                      onClick={() => handleDeleteCard(card.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SavedCards;
