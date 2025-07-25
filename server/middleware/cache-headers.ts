import type { Request, Response, NextFunction } from 'express';

/**
 * Middleware to add cache control headers for better frontend performance
 */
export function addCacheHeaders(req: Request, res: Response, next: NextFunction) {
  // Add cache headers for dashboard APIs
  if (req.path.startsWith('/api/dashboard/')) {
    const cacheTime = getCacheTimeForEndpoint(req.path);
    res.set({
      'Cache-Control': `public, max-age=${cacheTime}`,
      'ETag': generateETag(req.path),
      'Vary': 'Accept-Encoding'
    });
  }

  // Add performance headers
  res.set({
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block'
  });

  next();
}

function getCacheTimeForEndpoint(path: string): number {
  // Cache times in seconds
  if (path.includes('/validation')) return 300; // 5 minutes
  if (path.includes('/vault')) return 600; // 10 minutes
  if (path.includes('/activity')) return 300; // 5 minutes
  if (path.includes('/leaderboard')) return 900; // 15 minutes
  return 60; // Default 1 minute
}

function generateETag(path: string): string {
  // Simple ETag generation based on path and timestamp
  const timestamp = Math.floor(Date.now() / 60000); // Round to minute
  return `"${Buffer.from(path + timestamp).toString('base64')}"`;
}