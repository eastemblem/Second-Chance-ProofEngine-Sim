// Utility to optimize chunk loading and preload critical resources
export function preloadCriticalChunks() {
  // Preload essential chunks after initial load
  const criticalModules = [
    () => import("@tanstack/react-query"),
    () => import("zod"),
    () => import("react-hook-form")
  ];

  // Use requestIdleCallback to preload during idle time
  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => {
      criticalModules.forEach(moduleLoader => {
        moduleLoader().catch(() => {
          // Silently fail if preload doesn't work
        });
      });
    });
  }
}

// Optimize image loading with lazy loading
export function optimizeImageLoading() {
  if ('loading' in HTMLImageElement.prototype) {
    const images = document.querySelectorAll('img[data-src]');
    images.forEach(img => {
      (img as HTMLImageElement).src = img.getAttribute('data-src') || '';
      img.removeAttribute('data-src');
    });
  }
}

// Initialize optimizations after DOM is ready
export function initializeOptimizations() {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      preloadCriticalChunks();
      optimizeImageLoading();
      enablePerformanceObserver();
      optimizeResourceHints();
    });
  } else {
    preloadCriticalChunks();
    optimizeImageLoading();
    enablePerformanceObserver();
    optimizeResourceHints();
  }
}

// Add resource hints for faster loading
function optimizeResourceHints() {
  if (typeof document !== 'undefined') {
    // Performance analysis disabled to prevent paint interference
    // Previous logging was causing high LCP times
    return;
  }
}

// Disable performance observer to prevent paint interference
function enablePerformanceObserver() {
  // Performance observer disabled to prevent paint issues
  // High LCP times were caused by continuous monitoring interference
  return;
}