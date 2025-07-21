import { useEffect } from 'react';

// Simplified memory optimization to prevent interference
export function MemoryOptimizer() {
  useEffect(() => {
    // Basic cleanup without aggressive overrides
    const cleanup = () => {
      try {
        // Basic garbage collection if available
        if ('gc' in window && typeof (window as any).gc === 'function') {
          (window as any).gc();
        }
      } catch (error) {
        // Silently handle cleanup errors
      }
    };

    // Minimal cleanup interval to prevent performance issues
    const interval = setInterval(cleanup, 120000); // Every 2 minutes

    return () => {
      clearInterval(interval);
    };
  }, []);

  return null;
}