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
    // Preconnect to external domains
    const preconnectDomains = [
      'https://fonts.googleapis.com',
      'https://fonts.gstatic.com'
    ];
    
    preconnectDomains.forEach(domain => {
      const link = document.createElement('link');
      link.rel = 'preconnect';
      link.href = domain;
      document.head.appendChild(link);
    });
    
    // DNS prefetch for likely resources
    const prefetchDomains = [
      '//api.eastemblem.com',
      '//cdn.jsdelivr.net'
    ];
    
    prefetchDomains.forEach(domain => {
      const link = document.createElement('link');
      link.rel = 'dns-prefetch';
      link.href = domain;
      document.head.appendChild(link);
    });
  }
}

// Enable performance observer for monitoring
function enablePerformanceObserver() {
  if ('PerformanceObserver' in window && process.env.NODE_ENV === 'development') {
    try {
      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          if (entry.entryType === 'largest-contentful-paint') {
            console.log('LCP:', Math.round(entry.startTime) + 'ms');
          }
          if (entry.entryType === 'first-input') {
            console.log('FID:', Math.round(entry.processingStart - entry.startTime) + 'ms');
          }
        });
      });
      
      observer.observe({ entryTypes: ['largest-contentful-paint', 'first-input'] });
    } catch (error) {
      // Silently handle observer errors
    }
  }
}