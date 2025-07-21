import { useEffect } from 'react';

// Simplified performance monitoring to prevent rendering issues
export function PerformanceMonitor() {
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      // Basic performance timing without navigation API issues
      window.addEventListener('load', () => {
        setTimeout(() => {
          try {
            const paintEntries = performance.getEntriesByType('paint');
            const fcpEntry = paintEntries.find(p => p.name === 'first-contentful-paint');
            
            console.log('Performance Metrics:', {
              'DOM Content Loaded': null, // Removed problematic navigation timing
              'Load Complete': null,
              'First Paint': Math.round(paintEntries.find(p => p.name === 'first-paint')?.startTime || 0),
              'First Contentful Paint': Math.round(fcpEntry?.startTime || 0)
            });
          } catch (error) {
            console.warn('Performance monitoring error:', error);
          }
        }, 1000);
      });
    }
  }, []);

  return null;
}