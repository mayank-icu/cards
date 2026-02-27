import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import LazyImage from './LazyImage';
import './MinimalCardView.css';

const MinimalCardView = () => {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Simulate loading - in real implementation, fetch card data
    const timer = setTimeout(() => {
      setLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, [id]);

  if (loading) {
    return (
      <div className="minimal-loading">
        <div className="loading-spinner"></div>
        <p>Loading card...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="minimal-error">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="minimal-card-view">
      <div className="card-container">
        <div className="card-placeholder">
          <h2>Greeting Card</h2>
          <p>This is a minimal card view for fast loading.</p>
          <p>Card ID: {id}</p>
        </div>
      </div>
    </div>
  );
};

export default MinimalCardView;
