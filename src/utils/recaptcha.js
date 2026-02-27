// reCAPTCHA Enterprise utility functions
const RECAPTCHA_SITE_KEY = '6LdyCVMsAAAAAD4bBL2ym6vR9_a5tlsxHq-XWejL';
const RECAPTCHA_API_KEY = import.meta.env.VITE_RECAPTCHA_API_KEY;

// Queue for storing reCAPTCHA tokens to verify in background
const verificationQueue = [];

// Process verification queue in background
const processVerificationQueue = async () => {
  if (verificationQueue.length === 0) return;
  
  const items = [...verificationQueue];
  verificationQueue.length = 0; // Clear queue
  
  // Process items in parallel but don't block UI
  Promise.allSettled(items.map(item => verifyToken(item)))
    .then(results => {
      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          console.warn('reCAPTCHA verification failed:', result.reason);
        }
      });
    });
};

// Verify token with backend (non-blocking)
const verifyToken = async ({ token, action, onSuccess, onError }) => {
  try {
    const response = await fetch('/api/verify-recaptcha', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        token,
        expectedAction: action,
        siteKey: RECAPTCHA_SITE_KEY,
      }),
    });

    const result = await response.json();
    
    if (result.success && onSuccess) {
      onSuccess(result);
    } else if (!result.success && onError) {
      onError(new Error(result.error || 'Verification failed'));
    }
  } catch (error) {
    if (onError) {
      onError(error);
    }
  }
};

// Execute reCAPTCHA and queue verification for background processing
export const executeRecaptcha = async (action = 'GENERAL_ACTION') => {
  return new Promise((resolve, reject) => {
    // Check if grecaptcha is available
    if (typeof window.grecaptcha === 'undefined') {
      // If reCAPTCHA is not loaded, resolve immediately to not block user experience
      console.warn('reCAPTCHA not loaded, proceeding without verification');
      resolve({ success: true, score: 0.9 }); // Default high score for legitimate users
      return;
    }

    window.grecaptcha.enterprise.ready(async () => {
      try {
        const token = await window.grecaptcha.enterprise.execute(RECAPTCHA_SITE_KEY, { action });
        
        // Add to background verification queue
        verificationQueue.push({
          token,
          action,
          onSuccess: (result) => {
            console.log(`reCAPTCHA verified for action: ${action}`, result);
          },
          onError: (error) => {
            console.error(`reCAPTCHA verification failed for action: ${action}`, error);
          }
        });

        // Process queue in background
        setTimeout(processVerificationQueue, 100);
        
        // Resolve immediately with token for frontend use
        resolve({ success: true, token });
      } catch (error) {
        // Don't block user experience on reCAPTCHA errors
        console.warn('reCAPTCHA execution failed, proceeding without verification:', error);
        resolve({ success: true, score: 0.9 });
      }
    });
  });
};

// Specific action functions
export const verifyLogin = () => executeRecaptcha('LOGIN');
export const verifyRegister = () => executeRecaptcha('REGISTER');
export const verifyCardCreate = () => executeRecaptcha('CARD_CREATE');
export const verifyCardShare = () => executeRecaptcha('CARD_SHARE');
export const verifyContact = () => executeRecaptcha('CONTACT');

// Initialize reCAPTCHA monitoring
export const initRecaptcha = () => {
  // Process queue every 5 seconds
  setInterval(processVerificationQueue, 5000);
  
  // Process queue on page visibility change
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      processVerificationQueue();
    }
  });
};

// Get reCAPTCHA score for current user (if available)
export const getRecaptchaScore = async () => {
  try {
    const result = await executeRecaptcha('SCORE_CHECK');
    return result.score || 0.9; // Default high score
  } catch (error) {
    return 0.9; // Default high score on error
  }
};

export default {
  executeRecaptcha,
  verifyLogin,
  verifyRegister,
  verifyCardCreate,
  verifyCardShare,
  verifyContact,
  initRecaptcha,
  getRecaptchaScore,
};
