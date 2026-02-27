import { useEffect, useState } from 'react';

const PerformanceMonitor = () => {
  const [metrics, setMetrics] = useState({
    fcp: 0,
    lcp: 0,
    fid: 0,
    cls: 0,
    ttfb: 0,
    loadTime: 0
  });

  useEffect(() => {
    // Only run in production and for monitoring
    if (process.env.NODE_ENV !== 'production') return;

    const measurePerformance = () => {
      // Core Web Vitals
      if ('PerformanceObserver' in window) {
        // First Contentful Paint
        try {
          const fcpObserver = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const fcp = entries[entries.length - 1];
            if (fcp) {
              setMetrics(prev => ({ ...prev, fcp: fcp.startTime }));
            }
          });
          fcpObserver.observe({ entryTypes: ['paint'] });
        } catch (e) {
          console.log('FCP not supported');
        }

        // Largest Contentful Paint
        try {
          const lcpObserver = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const lcp = entries[entries.length - 1];
            if (lcp) {
              setMetrics(prev => ({ ...prev, lcp: lcp.startTime }));
            }
          });
          lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
        } catch (e) {
          console.log('LCP not supported');
        }

        // First Input Delay
        try {
          const fidObserver = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            entries.forEach(entry => {
              if (entry.name === 'first-input') {
                setMetrics(prev => ({ ...prev, fid: entry.processingStart - entry.startTime }));
              }
            });
          });
          fidObserver.observe({ entryTypes: ['first-input'] });
        } catch (e) {
          console.log('FID not supported');
        }

        // Cumulative Layout Shift
        try {
          let clsValue = 0;
          const clsObserver = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
              if (!entry.hadRecentInput) {
                clsValue += entry.value;
              }
            }
            setMetrics(prev => ({ ...prev, cls: clsValue }));
          });
          clsObserver.observe({ entryTypes: ['layout-shift'] });
        } catch (e) {
          console.log('CLS not supported');
        }
      }

      // Time to First Byte
      if (performance.timing) {
        const ttfb = performance.timing.responseStart - performance.timing.navigationStart;
        setMetrics(prev => ({ ...prev, ttfb }));
      }

      // Page Load Time
      window.addEventListener('load', () => {
        if (performance.timing) {
          const loadTime = performance.timing.loadEventEnd - performance.timing.navigationStart;
          setMetrics(prev => ({ ...prev, loadTime }));
        }
      });
    };

    // Delay measurement to avoid affecting initial load
    const timer = setTimeout(measurePerformance, 1000);

    return () => clearTimeout(timer);
  }, []);

  // Log metrics for debugging
  useEffect(() => {
    if (process.env.NODE_ENV === 'production' && metrics.lcp > 0) {
      console.log('Performance Metrics:', metrics);
      
      // Send to analytics if needed
      if (window.gtag && import.meta.env.VITE_GA_MEASUREMENT_ID) {
        window.gtag('event', 'performance_metrics', {
          custom_map: {
            dimension1: 'fcp',
            dimension2: 'lcp', 
            dimension3: 'fid',
            dimension4: 'cls',
            dimension5: 'ttfb',
            dimension6: 'load_time'
          },
          fcp: Math.round(metrics.fcp),
          lcp: Math.round(metrics.lcp),
          fid: Math.round(metrics.fid),
          cls: Math.round(metrics.cls * 1000) / 1000,
          ttfb: Math.round(metrics.ttfb),
          load_time: Math.round(metrics.loadTime)
        });
      }
    }
  }, [metrics]);

  return null; // This component doesn't render anything
};

export default PerformanceMonitor;
