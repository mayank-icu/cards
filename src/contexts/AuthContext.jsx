import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

// Create context with default values to prevent hook errors
const AuthContext = createContext({
  currentUser: null,
  isAuthenticated: false,
  signup: async () => { throw new Error('Auth not initialized'); },
  login: async () => { throw new Error('Auth not initialized'); },
  resetPassword: async () => { throw new Error('Auth not initialized'); },
  signInWithGoogle: async () => { throw new Error('Auth not initialized'); },
  clearRedirectResult: () => { },
  logout: async () => { throw new Error('Auth not initialized'); },
  loading: true,
  firebaseError: null
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    console.error('useAuth must be used within an AuthProvider');
    // Return fallback functions to prevent crashes
    return {
      currentUser: null,
      isAuthenticated: false,
      signup: async () => { throw new Error('Auth context not available'); },
      login: async () => { throw new Error('Auth context not available'); },
      resetPassword: async () => { throw new Error('Auth context not available'); },
      signInWithGoogle: async () => { throw new Error('Auth context not available'); },
      clearRedirectResult: () => { },
      logout: async () => { throw new Error('Auth context not available'); },
      loading: false,
      firebaseError: new Error('Auth context not available')
    };
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [firebaseError, setFirebaseError] = useState(null);
  const [authInitialized, setAuthInitialized] = useState(false);
  const [redirectResult, setRedirectResult] = useState(null);
  const initPromiseRef = useRef(null);
  const unsubscribeRef = useRef(null);

  const shouldEagerInitializeAuth = useCallback(() => {
    if (typeof window === 'undefined') return true;

    const path = window.location.pathname;

    if (path === '/') return true;

    const eagerPrefixes = [
      '/saved-cards',
      '/profile',
      '/login',
      '/register',
      '/forgot-password',
      '/admin',
      '/__/auth/handler',
      '/piano',
      '/song',
      '/music',
    ];

    return eagerPrefixes.some((prefix) => path.startsWith(prefix));
  }, []);

  const initializeAuth = useCallback(async () => {
    if (authInitialized && !firebaseError) return;
    if (initPromiseRef.current) {
      return initPromiseRef.current;
    }

    setLoading(true);
    setFirebaseError(null);

    initPromiseRef.current = (async () => {
      try {
        const { onAuthStateChanged, getRedirectResult } = await import('firebase/auth');
        const { auth } = await import('../firebase');

        const result = await getRedirectResult(auth);
        if (result?.user) {
          setRedirectResult(result);
        }

        unsubscribeRef.current?.();
        unsubscribeRef.current = onAuthStateChanged(auth, (user) => {
          setCurrentUser(user);
          setLoading(false);
          setAuthInitialized(true);
        });
      } catch (error) {
        console.error('Firebase auth initialization failed:', error);
        setFirebaseError(error);
        setCurrentUser(null);
        setLoading(false);
        setAuthInitialized(false);
        throw error;
      } finally {
        initPromiseRef.current = null;
      }
    })();

    return initPromiseRef.current;
  }, [authInitialized, firebaseError]);

  // Initialize auth functions with error handling
  const signup = async (email, password) => {
  await initializeAuth();
  if (firebaseError) throw new Error('Firebase is not available');
  try {
    const { createUserWithEmailAndPassword } = await import('firebase/auth');
    const { doc, setDoc } = await import('firebase/firestore');
    const { auth, db } = await import('../firebase');
    const result = await createUserWithEmailAndPassword(auth, email, password);

    // Save user to database
    try {
      const userRef = doc(db, 'users', result.user.uid);
      await setDoc(userRef, {
        name: '',
        email: email,
        createdAt: new Date().toISOString()
      }, { merge: true });
    } catch (dbErr) {
      console.error('Failed to save user to database:', dbErr);
    }

    setCurrentUser(result.user);
    setAuthInitialized(true);
    return result;
  } catch (error) {
    throw error;
  }
};

  const login = async (email, password) => {
    await initializeAuth();
    if (firebaseError) throw new Error('Firebase is not available');
    try {
      const { signInWithEmailAndPassword } = await import('firebase/auth');
      const { auth } = await import('../firebase');
      const result = await signInWithEmailAndPassword(auth, email, password);
      setCurrentUser(result.user);
      setAuthInitialized(true);
      return result;
    } catch (error) {
      throw error;
    }
  };

  const resetPassword = async (email) => {
    await initializeAuth();
    if (firebaseError) throw new Error('Firebase is not available');
    const { sendPasswordResetEmail } = await import('firebase/auth');
    const { auth } = await import('../firebase');
    await sendPasswordResetEmail(auth, email);
  };

  const signInWithGoogle = async () => {
    await initializeAuth();
    if (firebaseError) throw new Error('Firebase is not available');
    try {
      const { signInWithRedirect, signInWithPopup } = await import('firebase/auth');
      const { doc, setDoc } = await import('firebase/firestore');
      const { auth, googleProvider, db } = await import('../firebase');

      // Configure Google Provider for production
      googleProvider.setCustomParameters({
        prompt: 'select_account',
        access_type: 'offline'
      });

      // Popup is faster on desktop; fallback to redirect when blocked/not supported.
      try {
        const result = await signInWithPopup(auth, googleProvider);
        setRedirectResult(result);
        // Determine if we actually got a user
        if (result?.user) {
          // Save user to database
          try {
            const userRef = doc(db, 'users', result.user.uid);
            await setDoc(userRef, {
              name: result.user.displayName || '',
              email: result.user.email || '',
              lastLoginAt: new Date().toISOString()
            }, { merge: true });
          } catch (dbErr) {
            console.error('Failed to save Google user to database:', dbErr);
          }
        }

        return { success: true, mode: 'popup', result };
      } catch (popupError) {
        const blockedPopupCodes = new Set([
          'auth/popup-blocked',
          'auth/cancelled-popup-request',
          'auth/popup-closed-by-user',
          'auth/operation-not-supported-in-this-environment'
        ]);

        if (!blockedPopupCodes.has(popupError.code)) {
          throw popupError;
        }

        await signInWithRedirect(auth, googleProvider);
        return { success: true, mode: 'redirect' };
      }
    } catch (error) {
      console.error('Google sign in error:', error);
      throw error;
    }
  };

  const logout = async () => {
    await initializeAuth();
    if (firebaseError) throw new Error('Firebase is not available');
    try {
      const { signOut } = await import('firebase/auth');
      const { auth } = await import('../firebase');
      await signOut(auth);
    } catch (error) {
      throw error;
    }
  };

  const clearRedirectResult = () => {
    setRedirectResult(null);
  };

  useEffect(() => {
    if (!shouldEagerInitializeAuth()) {
      setLoading(false);
      return () => unsubscribeRef.current?.();
    }

    initializeAuth().catch(() => {
      // Errors are handled in initializeAuth state updates.
    });

    return () => unsubscribeRef.current?.();
  }, [initializeAuth, shouldEagerInitializeAuth]);

  const value = {
    currentUser,
    isAuthenticated: Boolean(currentUser && !currentUser.isAnonymous),
    signup,
    login,
    resetPassword,
    signInWithGoogle,
    clearRedirectResult,
    logout,
    loading,
    firebaseError,
    authInitialized,
    redirectResult
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
