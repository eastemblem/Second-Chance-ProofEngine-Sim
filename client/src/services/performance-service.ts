/**
 * Frontend Performance Optimization Service
 * Phase 1.2: Client-side performance monitoring and optimization
 */

interface PerformanceMetrics {
  navigationStart: number;
  domContentLoaded: number;
  loadComplete: number;
  firstPaint?: number;
  firstContentfulPaint?: number;
  largestContentfulPaint?: number;
}

class PerformanceService {
  private metrics: PerformanceMetrics | null = null;
  private resourceTimings: PerformanceResourceTiming[] = [];

  constructor() {
    this.initializePerformanceMonitoring();
  }

  /**
   * Initialize performance monitoring on page load
   */
  private initializePerformanceMonitoring(): void {
    // Wait for page to fully load before collecting metrics
    if (document.readyState === 'complete') {
      this.collectMetrics();
    } else {
      window.addEventListener('load', () => {
        setTimeout(() => this.collectMetrics(), 100);
      });
    }
  }

  /**
   * Collect comprehensive performance metrics
   */
  private collectMetrics(): void {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    const paint = performance.getEntriesByType('paint');
    
    this.metrics = {
      navigationStart: navigation.fetchStart,
      domContentLoaded: navigation.domContentLoadedEventEnd - navigation.fetchStart,
      loadComplete: navigation.loadEventEnd - navigation.fetchStart,
      firstPaint: paint.find(p => p.name === 'first-paint')?.startTime,
      firstContentfulPaint: paint.find(p => p.name === 'first-contentful-paint')?.startTime,
    };

    // Get LCP if available
    if ('PerformanceObserver' in window) {
      try {
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          if (this.metrics) {
            this.metrics.largestContentfulPaint = lastEntry.startTime;
          }
        });
        observer.observe({ entryTypes: ['largest-contentful-paint'] });
      } catch (e) {
        // LCP monitoring failed, continue without it
      }
    }

    // Collect resource timings
    this.resourceTimings = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    
    console.log('📊 Performance metrics collected:', this.metrics);
  }

  /**
   * Get current performance metrics
   */
  getMetrics(): PerformanceMetrics | null {
    return this.metrics;
  }

  /**
   * Get performance score (0-100)
   */
  getPerformanceScore(): number {
    if (!this.metrics) return 0;

    let score = 100;
    
    // Deduct points for slow metrics
    if (this.metrics.domContentLoaded > 2000) score -= 20;
    if (this.metrics.loadComplete > 4000) score -= 20;
    if (this.metrics.firstContentfulPaint && this.metrics.firstContentfulPaint > 1500) score -= 15;
    if (this.metrics.largestContentfulPaint && this.metrics.largestContentfulPaint > 2500) score -= 25;

    return Math.max(0, score);
  }

  /**
   * Get slow resources for optimization insights
   */
  getSlowResources(): Array<{name: string, duration: number, size: number}> {
    return this.resourceTimings
      .filter(resource => resource.duration > 100)
      .map(resource => ({
        name: resource.name,
        duration: Math.round(resource.duration),
        size: resource.transferSize || 0
      }))
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 10);
  }

  /**
   * Track component render times
   */
  trackComponentRender(componentName: string, renderTime: number): void {
    if (renderTime > 50) {
      console.warn(`🐌 Slow component render: ${componentName} took ${renderTime}ms`);
    }
  }

  /**
   * Preload critical resources
   */
  preloadResource(url: string, type: 'script' | 'style' | 'image' | 'fetch' = 'fetch'): void {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = url;
    link.as = type;
    
    if (type === 'script') {
      link.crossOrigin = 'anonymous';
    }
    
    document.head.appendChild(link);
  }

  /**
   * Lazy load images with intersection observer
   */
  lazyLoadImages(): void {
    if ('IntersectionObserver' in window) {
      const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement;
            if (img.dataset.src) {
              img.src = img.dataset.src;
              img.classList.remove('lazy');
              imageObserver.unobserve(img);
            }
          }
        });
      });

      document.querySelectorAll('img[data-src]').forEach(img => {
        imageObserver.observe(img);
      });
    }
  }

  /**
   * Optimize critical rendering path
   */
  optimizeCriticalRenderPath(): void {
    // Remove unused CSS classes (basic implementation)
    const usedClasses = new Set<string>();
    document.querySelectorAll('*').forEach(el => {
      el.classList.forEach(cls => usedClasses.add(cls));
    });

    // This would be expanded to actually remove unused CSS
    console.log(`📝 Found ${usedClasses.size} CSS classes in use`);
  }

  /**
   * Memory usage monitoring
   */
  getMemoryUsage(): { used: number; total: number; } | null {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      return {
        used: Math.round(memory.usedJSHeapSize / 1048576), // MB
        total: Math.round(memory.totalJSHeapSize / 1048576), // MB
      };
    }
    return null;
  }

  /**
   * Network information (if available)
   */
  getNetworkInfo(): { effectiveType?: string; downlink?: number; rtt?: number } {
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      return {
        effectiveType: connection.effectiveType,
        downlink: connection.downlink,
        rtt: connection.rtt
      };
    }
    return {};
  }

  /**
   * Generate performance report
   */
  generateReport(): object {
    const memory = this.getMemoryUsage();
    const network = this.getNetworkInfo();
    const slowResources = this.getSlowResources();
    
    return {
      score: this.getPerformanceScore(),
      metrics: this.metrics,
      memory,
      network,
      slowResources,
      recommendations: this.getRecommendations()
    };
  }

  /**
   * Get performance recommendations
   */
  private getRecommendations(): string[] {
    const recommendations: string[] = [];
    
    if (!this.metrics) return ['Performance metrics not available'];

    if (this.metrics.loadComplete > 4000) {
      recommendations.push('Page load time is slow - consider code splitting');
    }
    
    if (this.metrics.firstContentfulPaint && this.metrics.firstContentfulPaint > 1500) {
      recommendations.push('First Contentful Paint is slow - optimize critical CSS');
    }
    
    if (this.getSlowResources().length > 0) {
      recommendations.push('Multiple slow resources detected - enable compression');
    }

    const memory = this.getMemoryUsage();
    if (memory && memory.used > 50) {
      recommendations.push('High memory usage detected - check for memory leaks');
    }

    return recommendations.length > 0 ? recommendations : ['Performance looks good!'];
  }
}

export const performanceService = new PerformanceService();