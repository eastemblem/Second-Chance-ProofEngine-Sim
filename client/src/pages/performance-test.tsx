import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Trash2, Database, Activity } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface PerformanceData {
  queryResponseTime: number;
  hasOptimizedData: boolean;
  connectionHealth: any;
  cacheStats: any;
  kvCacheStats: any;
  message: string;
}

export default function PerformanceTest() {
  const [performanceData, setPerformanceData] = useState<PerformanceData | null>(null);
  const [loading, setLoading] = useState(false);
  const [cleanupLoading, setCleanupLoading] = useState(false);
  const { toast } = useToast();

  const testPerformance = async () => {
    setLoading(true);
    try {
      const response = await apiRequest('GET', '/api/dashboard/test-performance');
      const data = await response.json();
      setPerformanceData(data);
      
      toast({
        title: "Performance Test Complete",
        description: `Query took ${data.queryResponseTime}ms - ${data.message}`,
      });
    } catch (error) {
      toast({
        title: "Performance Test Failed",
        description: "Unable to run performance test",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const cleanupCache = async () => {
    setCleanupLoading(true);
    try {
      const response = await apiRequest('POST', '/api/dashboard/test-cache-cleanup');
      const data = await response.json();
      
      toast({
        title: "Cache Cleanup Complete",
        description: `Cleaned ${data.cleanedEntries || 0} expired entries`,
      });
      
      // Refresh performance data after cleanup
      testPerformance();
    } catch (error) {
      toast({
        title: "Cache Cleanup Failed",
        description: "Unable to cleanup cache",
        variant: "destructive"
      });
    } finally {
      setCleanupLoading(false);
    }
  };

  const invalidateCache = async (type: string) => {
    try {
      const response = await apiRequest('POST', `/api/dashboard/test-cache-invalidate/${type}`);
      const data = await response.json();
      
      toast({
        title: "Cache Invalidated",
        description: `Successfully invalidated ${data.invalidated} cache`,
      });
      
      // Refresh performance data after invalidation
      testPerformance();
    } catch (error) {
      toast({
        title: "Cache Invalidation Failed",
        description: `Unable to invalidate ${type} cache`,
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    testPerformance();
  }, []);

  const getPerformanceColor = (time: number) => {
    if (time < 50) return 'bg-green-500';
    if (time < 100) return 'bg-blue-500';
    if (time < 500) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-yellow-400 bg-clip-text text-transparent">
            Performance Test Dashboard
          </h1>
          <p className="text-gray-400 mt-2">Test and monitor caching performance optimizations</p>
          {performanceData?.testMode && (
            <div className="mt-2 inline-block px-3 py-1 bg-green-900 text-green-300 text-xs rounded-full">
              TEST MODE - Authentication Bypassed
            </div>
          )}
        </div>

        {/* Performance Test Controls */}
        <Card className="bg-gray-900 border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Performance Testing
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2 flex-wrap">
              <Button 
                onClick={testPerformance} 
                disabled={loading}
                className="bg-purple-600 hover:bg-purple-700"
              >
                {loading ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <Database className="h-4 w-4 mr-2" />}
                Test Performance
              </Button>
              
              <Button 
                onClick={cleanupCache} 
                disabled={cleanupLoading}
                variant="outline"
                className="border-gray-600 hover:bg-gray-800"
              >
                {cleanupLoading ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}
                Cleanup Cache
              </Button>
              
              <Button 
                onClick={() => invalidateCache('founder')} 
                variant="outline"
                className="border-gray-600 hover:bg-gray-800"
              >
                Clear Founder Cache
              </Button>
              
              <Button 
                onClick={() => invalidateCache('dashboard')} 
                variant="outline"
                className="border-gray-600 hover:bg-gray-800"
              >
                Clear Dashboard Cache
              </Button>
              
              <Button 
                onClick={() => invalidateCache('all')} 
                variant="destructive"
              >
                Clear All Caches
              </Button>
            </div>
          </CardContent>
        </Card>

        {performanceData && (
          <>
            {/* Performance Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="bg-gray-900 border-gray-700">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <Badge className={`${getPerformanceColor(performanceData.queryResponseTime)} text-white mb-2`}>
                      {performanceData.queryResponseTime}ms
                    </Badge>
                    <div className="text-sm text-gray-400">Query Response Time</div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-900 border-gray-700">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <Badge className={performanceData.hasOptimizedData ? "bg-green-500" : "bg-red-500"}>
                      {performanceData.hasOptimizedData ? "Optimized" : "Not Optimized"}
                    </Badge>
                    <div className="text-sm text-gray-400 mt-2">Data Status</div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-900 border-gray-700">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <Badge className={
                      performanceData.connectionHealth?.database?.status === 'healthy' ? "bg-green-500" :
                      performanceData.connectionHealth?.database?.status === 'slow' ? "bg-yellow-500" : "bg-red-500"
                    }>
                      {performanceData.connectionHealth?.database?.status || 'Unknown'}
                    </Badge>
                    <div className="text-sm text-gray-400 mt-2">Database Health</div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-900 border-gray-700">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="text-lg font-bold text-white">
                      {performanceData.cacheStats?.founderCache?.size || 0}
                    </div>
                    <div className="text-sm text-gray-400">Cached Entries</div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Memory Cache Statistics */}
            <Card className="bg-gray-900 border-gray-700">
              <CardHeader>
                <CardTitle>Memory Cache Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <h4 className="font-semibold text-purple-400 mb-2">Founder Cache</h4>
                    <div className="text-sm space-y-1">
                      <div>Size: {performanceData.cacheStats?.founderCache?.size || 0}</div>
                      <div>Max: {performanceData.cacheStats?.founderCache?.max || 0}</div>
                      <div>TTL: {performanceData.cacheStats?.founderCache?.ttl ? `${performanceData.cacheStats.founderCache.ttl / 1000}s` : 'N/A'}</div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-purple-400 mb-2">Dashboard Cache</h4>
                    <div className="text-sm space-y-1">
                      <div>Size: {performanceData.cacheStats?.dashboardCache?.size || 0}</div>
                      <div>Max: {performanceData.cacheStats?.dashboardCache?.max || 0}</div>
                      <div>TTL: {performanceData.cacheStats?.dashboardCache?.ttl ? `${performanceData.cacheStats.dashboardCache.ttl / 1000}s` : 'N/A'}</div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-purple-400 mb-2">Leaderboard Cache</h4>
                    <div className="text-sm space-y-1">
                      <div>Size: {performanceData.cacheStats?.leaderboardCache?.size || 0}</div>
                      <div>Max: {performanceData.cacheStats?.leaderboardCache?.max || 0}</div>
                      <div>TTL: {performanceData.cacheStats?.leaderboardCache?.ttl ? `${performanceData.cacheStats.leaderboardCache.ttl / 1000}s` : 'N/A'}</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* KV Cache Statistics */}
            {performanceData.kvCacheStats && (
              <Card className="bg-gray-900 border-gray-700">
                <CardHeader>
                  <CardTitle>Replit KV Store Statistics</CardTitle>
                </CardHeader>
                <CardContent>
                  {performanceData.kvCacheStats.available ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div>
                        <div className="text-sm text-gray-400">Total Keys</div>
                        <div className="text-lg font-bold">{performanceData.kvCacheStats.totalKeys}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-400">Valid Keys</div>
                        <div className="text-lg font-bold text-green-400">{performanceData.kvCacheStats.validKeys}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-400">Expired Keys</div>
                        <div className="text-lg font-bold text-red-400">{performanceData.kvCacheStats.expiredKeys}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-400">Total Size</div>
                        <div className="text-lg font-bold">{formatBytes(performanceData.kvCacheStats.totalSize)}</div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center text-gray-400">
                      {performanceData.kvCacheStats.message || 'KV store not available'}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Performance Message */}
            <Card className="bg-gray-900 border-gray-700">
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-lg font-semibold mb-2">{performanceData.message}</div>
                  <div className="text-sm text-gray-400">
                    Last tested: {new Date().toLocaleTimeString()}
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}