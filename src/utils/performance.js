// Performance optimization utilities

// Debounce function for scroll and resize events
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// Throttle function for high-frequency events
export const throttle = (func, limit) => {
  let inThrottle;
  return function() {
    const args = arguments;
    const context = this;
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

// Lazy load images with intersection observer
export const lazyLoadImage = (img) => {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const image = entry.target;
        if (image.dataset.src) {
          image.src = image.dataset.src;
          image.classList.remove('lazy');
          observer.unobserve(image);
        }
      }
    });
  }, {
    rootMargin: '50px 0px',
    threshold: 0.01
  });

  if (img.dataset.src) {
    observer.observe(img);
  }
};

// Preload critical resources
export const preloadResource = (url, as = 'script') => {
  const link = document.createElement('link');
  link.rel = 'preload';
  link.href = url;
  link.as = as;
  if (as === 'script') link.crossOrigin = 'anonymous';
  document.head.appendChild(link);
};

// Detect connection quality and adjust loading strategy
export const getConnectionType = () => {
  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  if (!connection) return 'unknown';
  
  const { effectiveType, downlink } = connection;
  if (effectiveType === '4g' && downlink > 1.5) return 'fast';
  if (effectiveType === '4g') return 'good';
  if (effectiveType === '3g') return 'slow';
  return 'very-slow';
};

// Optimize loading based on connection
export const shouldLoadHeavyAssets = () => {
  const connection = getConnectionType();
  return connection !== 'very-slow';
};

// Memory cleanup utility
export const cleanup = () => {
  // Clear unused event listeners
  if (window.performance && window.performance.memory) {
    const memory = window.performance.memory;
    if (memory.usedJSHeapSize > memory.jsHeapSizeLimit * 0.9) {
      console.warn('High memory usage detected');
      // Trigger garbage collection hint
      if (window.gc) window.gc();
    }
  }
};

// Web Vitals monitoring
export const reportWebVitals = (metric) => {
  // Send to analytics or console for debugging
  console.log('Web Vital:', metric);
  
  // You can send this to your analytics service
  if (window.gtag) {
    window.gtag('event', metric.name, {
      value: Math.round(metric.value),
      event_category: 'Web Vitals'
    });
  }
};
