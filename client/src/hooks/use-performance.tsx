import { useEffect, useState } from 'react';
import { performanceService } from '../services/performance-service';

/**
 * Performance monitoring hook for React components
 */
export function usePerformance(componentName?: string) {
  const [metrics, setMetrics] = useState<any>(null);
  const [score, setScore] = useState<number>(0);

  useEffect(() => {
    // Track component mount time
    const startTime = performance.now();
    
    return () => {
      const renderTime = performance.now() - startTime;
      if (componentName) {
        performanceService.trackComponentRender(componentName, renderTime);
      }
    };
  }, [componentName]);

  useEffect(() => {
    // Get performance metrics after component loads
    const timer = setTimeout(() => {
      const currentMetrics = performanceService.getMetrics();
      const currentScore = performanceService.getPerformanceScore();
      
      setMetrics(currentMetrics);
      setScore(currentScore);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const generateReport = () => {
    return performanceService.generateReport();
  };

  const getMemoryUsage = () => {
    return performanceService.getMemoryUsage();
  };

  return {
    metrics,
    score,
    generateReport,
    getMemoryUsage,
    isLoading: !metrics
  };
}

/**
 * Component performance wrapper
 */
export function withPerformanceTracking<T extends Record<string, any>>(
  Component: React.ComponentType<T>,
  componentName: string
) {
  return function PerformanceTrackedComponent(props: T) {
    usePerformance(componentName);
    return <Component {...props} />;
  };
}