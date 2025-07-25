import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { performanceService } from '../../services/performance-service';

/**
 * Performance monitoring component for development/testing
 */
export function PerformanceMonitor() {
  const [metrics, setMetrics] = useState<any>(null);
  const [score, setScore] = useState<number>(0);
  const [memoryUsage, setMemoryUsage] = useState<any>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      const currentMetrics = performanceService.getMetrics();
      const currentScore = performanceService.getPerformanceScore();
      const memory = performanceService.getMemoryUsage();
      
      setMetrics(currentMetrics);
      setScore(currentScore);
      setMemoryUsage(memory);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'bg-green-500';
    if (score >= 70) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const formatTime = (ms: number | undefined) => {
    if (!ms) return 'N/A';
    return `${Math.round(ms)}ms`;
  };

  if (!metrics) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-sm">Performance Monitor</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground">
            Collecting metrics...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center justify-between">
          Performance Monitor
          <Badge className={`${getScoreColor(score)} text-white`}>
            {score}/100
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <span className="text-muted-foreground">DOM Ready:</span>
            <div className="font-mono">{formatTime(metrics.domContentLoaded)}</div>
          </div>
          <div>
            <span className="text-muted-foreground">Page Load:</span>
            <div className="font-mono">{formatTime(metrics.loadComplete)}</div>
          </div>
          <div>
            <span className="text-muted-foreground">First Paint:</span>
            <div className="font-mono">{formatTime(metrics.firstPaint)}</div>
          </div>
          <div>
            <span className="text-muted-foreground">LCP:</span>
            <div className="font-mono">{formatTime(metrics.largestContentfulPaint)}</div>
          </div>
        </div>
        
        {memoryUsage && (
          <div className="pt-2 border-t">
            <div className="text-xs text-muted-foreground">
              Memory: {memoryUsage.used}MB / {memoryUsage.total}MB
            </div>
            <div className="w-full bg-muted rounded-full h-1 mt-1">
              <div 
                className="bg-primary rounded-full h-1" 
                style={{ width: `${(memoryUsage.used / memoryUsage.total) * 100}%` }}
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default PerformanceMonitor;