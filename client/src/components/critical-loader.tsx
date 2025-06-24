import { useEffect } from 'react';

// Critical resource loader for fastest possible startup
export function CriticalLoader() {
  useEffect(() => {
    // Preload only the most critical resources immediately
    const preloadCritical = () => {
      // Preload essential UI components
      import('@/components/ui/button').catch(() => {});
      import('@/components/ui/card').catch(() => {});
      
      // Preload core hooks
      import('@/hooks/use-toast').catch(() => {});
    };

    // Use requestIdleCallback for non-blocking preload
    if ('requestIdleCallback' in window) {
      requestIdleCallback(preloadCritical, { timeout: 1000 });
    } else {
      setTimeout(preloadCritical, 100);
    }
  }, []);

  return null;
}