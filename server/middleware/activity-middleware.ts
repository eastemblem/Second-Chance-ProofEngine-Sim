import { Request, Response, NextFunction } from 'express';
import { ActivityService } from '../services/activity-service';

/**
 * Middleware to automatically track certain activities
 */
export function activityTrackingMiddleware(req: Request, res: Response, next: NextFunction) {
  // Store original res.json to intercept successful responses
  const originalJson = res.json;
  
  res.json = function(body: any) {
    // Only track successful responses (2xx status codes)
    if (res.statusCode >= 200 && res.statusCode < 300) {
      const context = ActivityService.getContextFromRequest(req);
      
      // Track based on route patterns
      const route = req.route?.path || req.path;
      const method = req.method;
      
      // Define activity tracking rules
      if (method === 'POST' && route.includes('/login')) {
        ActivityService.logAuthActivity(
          context,
          'login',
          'User logged in',
          `Successful login from ${context.ipAddress}`
        );
      } else if (method === 'POST' && route.includes('/logout')) {
        ActivityService.logAuthActivity(
          context,
          'logout',
          'User logged out',
          'Session ended successfully'
        );
      } else if (method === 'POST' && route.includes('/vault/upload-file')) {
        // File upload tracking is handled in the upload route itself
      } else if (method === 'GET' && route.includes('/dashboard')) {
        ActivityService.logNavigationActivity(
          context,
          'page_visit',
          'Dashboard visited',
          'dashboard'
        );
      }
    }
    
    // Call original json method
    return originalJson.call(this, body);
  };
  
  next();
}

/**
 * Explicit activity logging helper for routes
 */
export function logActivity(
  req: Request,
  activityType: 'account' | 'venture' | 'document' | 'evaluation' | 'authentication' | 'navigation' | 'system',
  action: string,
  title: string,
  description?: string,
  metadata?: any
) {
  const context = ActivityService.getContextFromRequest(req);
  return ActivityService.logActivity(context, {
    activityType,
    action,
    title,
    description,
    metadata
  });
}