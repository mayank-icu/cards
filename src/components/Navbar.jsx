import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Navbar.css';

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleGoHomeAndScroll = (selector) => {
    if (location.pathname === '/') {
      const element = document.querySelector(selector);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
      setIsMobileMenuOpen(false);
      return;
    }

    setIsMobileMenuOpen(false);
    setIsUserMenuOpen(false);
    navigate('/', { state: { scrollTo: selector } });
  };

  const handleNavigate = (path) => {
    setIsMobileMenuOpen(false);
    setIsUserMenuOpen(false);
    navigate(path);
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
      setIsUserMenuOpen(false);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <nav className={`navbar ${isScrolled ? 'scrolled' : ''}`}>
      <div className="navbar-container">
        <div className="navbar-brand" role="button" tabIndex={0} onClick={() => handleNavigate('/')} onKeyDown={(e) => { if (e.key === 'Enter') handleNavigate('/'); }}>
          <img src="/logo.webp" alt="EGreet" className="brand-logo" />
        </div>

        <div className={`navbar-menu ${isMobileMenuOpen ? 'open' : ''}`}>
          <button
            className="nav-link"
            onClick={() => handleGoHomeAndScroll('.hero')}
          >
            Home
          </button>
          <button
            className="nav-link"
            onClick={() => handleGoHomeAndScroll('.features-section')}
          >
            Features
          </button>
          <button
            className="nav-link"
            onClick={() => handleNavigate('/cards')}
          >
            Cards
          </button>
          <button
            className="nav-link"
            onClick={() => handleNavigate('/about')}
          >
            About
          </button>
          <button
            className="nav-link"
            onClick={() => handleNavigate('/blog/')}
          >
            Blog
          </button>
          <button
            className="nav-link"
            onClick={() => handleNavigate('/contact')}
          >
            Contact
          </button>

          {currentUser && currentUser.uid ? (
            <div className="user-section">
              <button
                className="nav-link"
                onClick={() => handleNavigate('/saved-cards')}
              >
                My Cards
              </button>
              <div className="user-menu">
                <button
                  className="user-avatar"
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                >
                  {currentUser.photoURL ? (
                    <img src={currentUser.photoURL} alt="User" />
                  ) : currentUser.email ? (
                    <span>{currentUser.email.charAt(0).toUpperCase()}</span>
                  ) : (
                    <span>U</span>
                  )}
                </button>
                {isUserMenuOpen && (
                  <div className="user-dropdown">
                    <div className="user-info">
                      <p className="user-email">{currentUser.email || 'No email'}</p>
                    </div>
                    <button
                      className="dropdown-item"
                      onClick={() => {
                        handleNavigate('/saved-cards');
                      }}
                    >
                      My Cards
                    </button>
                    <button
                      className="dropdown-item"
                      onClick={() => {
                        handleNavigate('/profile');
                      }}
                    >
                      Profile Settings
                    </button>
                    <button
                      className="dropdown-item logout"
                      onClick={handleLogout}
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <>
              <button
                className="nav-link secondary"
                onClick={() => handleNavigate('/login')}
              >
                Login
              </button>
              <button
                className="nav-link primary"
                onClick={() => handleNavigate('/register')}
              >
                Sign Up
              </button>
            </>
          )}
        </div>

        <button
          className={`mobile-menu-toggle ${isMobileMenuOpen ? 'open' : ''}`}
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Toggle mobile menu"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
