import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const Analytics = ({ measurementId }) => {
  const location = useLocation();

  useEffect(() => {
    // Only load analytics in production
    if (import.meta.env.PROD && measurementId) {
      // Load Google Analytics script
      const script1 = document.createElement('script');
      script1.async = true;
      script1.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
      document.head.appendChild(script1);

      const script2 = document.createElement('script');
      script2.innerHTML = `
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', '${measurementId}', {
          page_path: '${location.pathname}',
          anonymize_ip: true
        });
      `;
      document.head.appendChild(script2);

      return () => {
        // Cleanup scripts when component unmounts
        document.head.removeChild(script1);
        document.head.removeChild(script2);
      };
    }
    // Track page views
    if (typeof window.gtag !== 'undefined') {
      window.gtag('config', 'G-Y90HK3VW9X', {
        page_path: location.pathname + location.search,
        page_title: document.title,
        page_location: window.location.href
      });
    }
  }, [location]);

  return null;
};

// Helper function to track custom events
export const trackEvent = (eventName, eventParams = {}) => {
  if (typeof window.gtag !== 'undefined') {
    window.gtag('event', eventName, eventParams);
  }
};

// Helper function to track card creation
export const trackCardCreation = (cardType) => {
  trackEvent('card_created', {
    card_type: cardType,
    event_category: 'engagement',
    event_label: `${cardType} card created`
  });
};

// Helper function to track card sharing
export const trackCardShare = (cardType, shareMethod) => {
  trackEvent('card_shared', {
    card_type: cardType,
    share_method: shareMethod,
    event_category: 'engagement',
    event_label: `${cardType} card shared via ${shareMethod}`
  });
};

// Helper function to track search
export const trackSearch = (searchTerm) => {
  trackEvent('search', {
    search_term: searchTerm,
    event_category: 'engagement'
  });
};

export default Analytics;
