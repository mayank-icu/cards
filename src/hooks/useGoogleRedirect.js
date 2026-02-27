import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

export const useGoogleRedirect = () => {
  const navigate = useNavigate();
  const { redirectResult, currentUser, authInitialized, clearRedirectResult } = useAuth();

  useEffect(() => {
    // Handle Google redirect result when auth is initialized and we have both user and redirect result
    if (authInitialized && redirectResult && currentUser) {
      toast.success('Successfully logged in with Google!');
      clearRedirectResult();
      navigate('/saved-cards', { replace: true });
    }
  }, [redirectResult, currentUser, authInitialized, clearRedirectResult, navigate]);

  return { redirectResult };
};
