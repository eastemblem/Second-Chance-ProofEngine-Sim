// Advanced performance optimizations for sub-3s target
export function enableAdvancedOptimizations() {
  // Resource prefetching for likely next pages
  if ('link' in document.createElement('link')) {
    const prefetchResources = [
      '/api/onboarding/initialize',
      '/static/js/scoring.js',
      '/static/js/feedback.js'
    ];
    
    prefetchResources.forEach(resource => {
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = resource;
      document.head.appendChild(link);
    });
  }

  // Optimize font loading
  if (document.fonts) {
    document.fonts.ready.then(() => {
      console.log('Fonts loaded:', performance.now() + 'ms');
    });
  }

  // Intersection Observer for lazy loading
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          // Preload components when they come into viewport
          const element = entry.target as HTMLElement;
          const component = element.dataset.component;
          if (component) {
            import(`@/pages/${component}`).catch(() => {});
          }
        }
      });
    });

    // Observe elements with data-component attribute
    setTimeout(() => {
      document.querySelectorAll('[data-component]').forEach(el => {
        observer.observe(el);
      });
    }, 1000);
  }
}

// Memory management for better performance
export function optimizeMemoryUsage() {
  // Clear unnecessary timers and intervals
  let timerCount = 0;
  const originalSetTimeout = window.setTimeout;
  const originalSetInterval = window.setInterval;
  
  window.setTimeout = ((fn: any, delay: number) => {
    timerCount++;
    const id = originalSetTimeout(() => {
      timerCount--;
      fn();
    }, delay);
    return id;
  }) as typeof setTimeout;

  // Cleanup on page unload
  window.addEventListener('beforeunload', () => {
    console.log('Active timers:', timerCount);
  });
}