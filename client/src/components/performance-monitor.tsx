import { useEffect } from 'react';

// Development-only performance monitoring
export function PerformanceMonitor() {
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      // Monitor Core Web Vitals
      if ('web-vital' in window) {
        import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
          getCLS(console.log);
          getFID(console.log);
          getFCP(console.log);
          getLCP(console.log);
          getTTFB(console.log);
        });
      }

      // Simple performance timing
      window.addEventListener('load', () => {
        setTimeout(() => {
          const perfData = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
          if (perfData) {
            console.log('Performance Metrics:', {
              'DOM Content Loaded': Math.round(perfData.domContentLoadedEventEnd - perfData.navigationStart),
              'Load Complete': Math.round(perfData.loadEventEnd - perfData.navigationStart),
              'First Paint': Math.round(performance.getEntriesByType('paint').find(p => p.name === 'first-paint')?.startTime || 0),
              'First Contentful Paint': Math.round(performance.getEntriesByType('paint').find(p => p.name === 'first-contentful-paint')?.startTime || 0)
            });
          }
        }, 1000);
      });
    }
  }, []);

  return null;
}