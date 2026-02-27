import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuth, signInWithCredential, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '../firebase';

const FirebaseAuthHandler = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuthRedirect = async () => {
      try {
        // Get the hash parameters from the URL
        const hash = window.location.hash.substring(1);
        const params = new URLSearchParams(hash);
        
        // Extract relevant parameters
        const apiKey = params.get('apiKey');
        const accessToken = params.get('accessToken');
        const idToken = params.get('idToken');
        const error = params.get('error');
        
        if (error) {
          console.error('Authentication error:', error);
          navigate('/login?error=' + encodeURIComponent(error));
          return;
        }
        
        if (apiKey && (accessToken || idToken)) {
          // For popup authentication, Firebase handles this automatically
          // We just need to redirect to success page
          navigate('/login?auth=success');
        } else {
          // No auth data found - redirect to login
          navigate('/login');
        }
      } catch (error) {
        console.error('Auth handler error:', error);
        navigate('/login?error=auth_failed');
      }
    };

    handleAuthRedirect();
  }, [navigate]);

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      flexDirection: 'column',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white'
    }}>
      <div style={{
        width: '40px',
        height: '40px',
        border: '4px solid rgba(255, 255, 255, 0.3)',
        borderTop: '4px solid white',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
        marginBottom: '1rem'
      }}></div>
      <h2>Completing authentication...</h2>
      <p>Please wait while we sign you in.</p>
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default FirebaseAuthHandler;
