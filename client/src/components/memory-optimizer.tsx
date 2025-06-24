import { useEffect } from 'react';

// Memory optimization utilities
export function MemoryOptimizer() {
  useEffect(() => {
    // Cleanup intervals and timeouts on unmount
    const intervals: NodeJS.Timeout[] = [];
    const timeouts: NodeJS.Timeout[] = [];

    // Override setInterval and setTimeout to track them
    const originalSetInterval = window.setInterval;
    const originalSetTimeout = window.setTimeout;

    window.setInterval = ((fn: any, delay: number) => {
      const id = originalSetInterval(fn, delay);
      intervals.push(id);
      return id;
    }) as typeof setInterval;

    window.setTimeout = ((fn: any, delay: number) => {
      const id = originalSetTimeout(fn, delay);
      timeouts.push(id);
      return id;
    }) as typeof setTimeout;

    // Cleanup on unmount
    return () => {
      intervals.forEach(clearInterval);
      timeouts.forEach(clearTimeout);
      
      // Restore original functions
      window.setInterval = originalSetInterval;
      window.setTimeout = originalSetTimeout;
    };
  }, []);

  return null;
}