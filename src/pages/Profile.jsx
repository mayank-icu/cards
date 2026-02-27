import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { updateProfile } from 'firebase/auth';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import toast from 'react-hot-toast';
import Navbar from '../components/Navbar';
import './Profile.css';

const Profile = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    cardsCreated: 0,
    dayStreak: 0,
    achievements: 0
  });
  const [profileData, setProfileData] = useState({
    displayName: '',
    bio: '',
    favoriteTheme: '',
    notifications: true,
    website: '',
    location: ''
  });

  useEffect(() => {
    if (currentUser) {
      setProfileData(prev => ({
        ...prev,
        displayName: currentUser.displayName || '',
        bio: '',
        favoriteTheme: '',
        notifications: true,
        website: '',
        location: ''
      }));

      const profileDoc = doc(db, 'users', currentUser.uid, 'meta', 'profile');
      const statsDoc = doc(db, 'users', currentUser.uid, 'meta', 'stats');

      const unsubProfile = onSnapshot(profileDoc, (snap) => {
        const data = snap.data();
        if (data) {
          setProfileData(prev => ({
            ...prev,
            ...data
          }));
        }
      });

      const unsubStats = onSnapshot(statsDoc, (snap) => {
        const data = snap.data();
        if (data) {
          setStats(data);
        }
      });

      return () => {
        unsubProfile();
        unsubStats();
      };
    }
  }, [currentUser]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Update Firebase Auth profile
      if (profileData.displayName !== currentUser.displayName) {
        await updateProfile(auth.currentUser, {
          displayName: profileData.displayName
        });
      }

      // Save additional profile data to database
      const profileDoc = doc(db, 'users', currentUser.uid, 'meta', 'profile');
      await setDoc(profileDoc, {
        displayName: profileData.displayName,
        bio: profileData.bio,
        favoriteTheme: profileData.favoriteTheme,
        notifications: profileData.notifications,
        website: profileData.website,
        location: profileData.location,
        updatedAt: Date.now()
      }, { merge: true });

      setIsEditing(false);
      toast.success('Profile updated successfully!');
    } catch (error) {
      toast.error('Failed to update profile');
      console.error('Profile update error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      toast.error('Failed to logout');
    }
  };

  const handleDeleteAccount = async () => {
    if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      toast.warning('Account deletion feature coming soon');
    }
  };

  const handleProfileImageClick = () => {
    navigate('/profile');
  };

  if (!currentUser) {
    navigate('/login');
    return null;
  }

  return (
    <div className="app">
      <Navbar />
      
      <div className="profile-container">
        <div className="profile-header">
          <button 
            className="back-button"
            onClick={() => navigate('/')}
          >
            ← Back to Home
          </button>
        </div>

        <div className="profile-content">
          <div className="profile-card">
            <div className="profile-avatar-section">
              <div 
                className="avatar-large clickable"
                onClick={handleProfileImageClick}
                title="Click to edit profile"
              >
                {currentUser.photoURL ? (
                  <img src={currentUser.photoURL} alt="Profile" />
                ) : (
                  <span>{currentUser.email.charAt(0).toUpperCase()}</span>
                )}
              </div>
              <div className="avatar-info">
                <h2>{profileData.displayName || currentUser.email.split('@')[0]}</h2>
                <p>{currentUser.email}</p>
              </div>
            </div>

            {isEditing ? (
              <form onSubmit={handleSubmit} className="profile-form">
                <div className="form-group">
                  <label htmlFor="displayName">Display Name</label>
                  <input
                    type="text"
                    id="displayName"
                    value={profileData.displayName}
                    onChange={(e) => setProfileData(prev => ({
                      ...prev,
                      displayName: e.target.value
                    }))}
                    placeholder="Enter your display name"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="bio">Bio</label>
                  <textarea
                    id="bio"
                    value={profileData.bio}
                    onChange={(e) => setProfileData(prev => ({
                      ...prev,
                      bio: e.target.value
                    }))}
                    placeholder="Tell us about yourself..."
                    rows="3"
                  />
                </div>

                <div className="form-actions">
                  <button 
                    type="button" 
                    className="cancel-button"
                    onClick={() => setIsEditing(false)}
                    disabled={loading}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="save-button"
                    disabled={loading}
                  >
                    {loading ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            ) : (
              <div className="profile-details">
                <div className="detail-row">
                  <span className="label">Display Name:</span>
                  <span className="value">{profileData.displayName || 'Not set'}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Email:</span>
                  <span className="value">{currentUser.email}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Bio:</span>
                  <span className="value">{profileData.bio || 'No bio added'}</span>
                </div>

                <div className="button-group">
                  <button 
                    className="edit-button"
                    onClick={() => setIsEditing(true)}
                  >
                    Edit Profile
                  </button>
                  <button className="action-button secondary" onClick={handleLogout}>
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
