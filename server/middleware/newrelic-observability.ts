import { Request, Response, NextFunction } from "express";

// NewRelic observability middleware (requires NEW_RELIC_LICENSE_KEY)
export function newRelicMiddleware(req: Request, res: Response, next: NextFunction) {
  // Check if NewRelic is configured
  if (!process.env.NEW_RELIC_LICENSE_KEY) {
    return next();
  }

  try {
    // Initialize NewRelic if available
    const newrelic = require('newrelic');
    
    // Set custom attributes
    newrelic.addCustomAttributes({
      'founderId': req.session?.founderId || 'anonymous',
      'endpoint': req.path,
      'userAgent': req.headers['user-agent'],
      'ip': req.ip,
      'correlationId': req.headers['x-correlation-id']
    });

    // Track custom metrics
    newrelic.recordMetric('Custom/API/Request', 1);
    
    // Set transaction name for better grouping
    const transactionName = getTransactionName(req.path, req.method);
    newrelic.setTransactionName('API', transactionName);

    // Track response metrics
    const startTime = Date.now();
    
    res.on('finish', () => {
      const duration = Date.now() - startTime;
      
      // Record response time metric
      newrelic.recordMetric(`Custom/API/ResponseTime/${transactionName}`, duration);
      
      // Record status code metrics
      newrelic.recordMetric(`Custom/API/StatusCode/${res.statusCode}`, 1);
      
      // Track error rates
      if (res.statusCode >= 400) {
        newrelic.recordMetric('Custom/API/Errors', 1);
        
        if (res.statusCode >= 500) {
          newrelic.recordMetric('Custom/API/ServerErrors', 1);
        }
      }
      
      // Track slow requests
      if (duration > 1000) {
        newrelic.recordMetric('Custom/API/SlowRequests', 1);
      }
    });

  } catch (error) {
    console.warn('⚠️ NewRelic middleware error:', error);
  }

  next();
}

// Custom business metrics tracking
export function trackBusinessMetrics(req: Request, res: Response, next: NextFunction) {
  if (!process.env.NEW_RELIC_LICENSE_KEY) return next();

  try {
    const newrelic = require('newrelic');
    
    // Track file uploads
    if (req.path.includes('/upload') && req.method === 'POST') {
      newrelic.recordMetric('Custom/Business/FileUploads', 1);
      
      if (req.file) {
        newrelic.recordMetric('Custom/Business/FileSizeUploaded', req.file.size);
      }
    }

    // Track onboarding progress
    if (req.path.includes('/onboarding')) {
      newrelic.recordMetric('Custom/Business/OnboardingSteps', 1);
    }

    // Track ProofScore generation
    if (req.path.includes('/submit-for-scoring')) {
      newrelic.recordMetric('Custom/Business/ProofScoreGenerated', 1);
    }

    // Track vault operations
    if (req.path.includes('/vault')) {
      newrelic.recordMetric('Custom/Business/VaultOperations', 1);
    }

    // Track certificate downloads
    if (req.path.includes('/certificate/download')) {
      newrelic.recordMetric('Custom/Business/CertificateDownloads', 1);
    }

  } catch (error) {
    console.warn('⚠️ Business metrics tracking error:', error);
  }

  next();
}

// Error tracking with NewRelic
export function trackErrorsWithNewRelic(
  error: any,
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (!process.env.NEW_RELIC_LICENSE_KEY) return next(error);

  try {
    const newrelic = require('newrelic');
    
    // Notice the error in NewRelic
    newrelic.noticeError(error, {
      'endpoint': req.path,
      'method': req.method,
      'founderId': req.session?.founderId,
      'correlationId': req.headers['x-correlation-id'],
      'userAgent': req.headers['user-agent'],
      'ip': req.ip
    });

    // Record error metrics
    newrelic.recordMetric('Custom/Errors/Total', 1);
    newrelic.recordMetric(`Custom/Errors/Endpoint/${req.path}`, 1);
    
    if (error.statusCode) {
      newrelic.recordMetric(`Custom/Errors/StatusCode/${error.statusCode}`, 1);
    }

  } catch (newrelicError) {
    console.warn('⚠️ NewRelic error tracking failed:', newrelicError);
  }

  next(error);
}

// Database query performance tracking
export function trackDatabasePerformance(queryType: string, startTime: number) {
  if (!process.env.NEW_RELIC_LICENSE_KEY) return;

  try {
    const newrelic = require('newrelic');
    const duration = Date.now() - startTime;
    
    newrelic.recordMetric(`Custom/Database/Query/${queryType}`, duration);
    newrelic.recordMetric('Custom/Database/TotalQueries', 1);
    
    if (duration > 500) {
      newrelic.recordMetric('Custom/Database/SlowQueries', 1);
    }

  } catch (error) {
    console.warn('⚠️ Database performance tracking error:', error);
  }
}

// Cache performance tracking
export function trackCachePerformance(cacheType: string, hit: boolean, responseTime: number) {
  if (!process.env.NEW_RELIC_LICENSE_KEY) return;

  try {
    const newrelic = require('newrelic');
    
    newrelic.recordMetric(`Custom/Cache/${cacheType}/${hit ? 'Hits' : 'Misses'}`, 1);
    newrelic.recordMetric(`Custom/Cache/${cacheType}/ResponseTime`, responseTime);
    
    const hitRate = hit ? 100 : 0;
    newrelic.recordMetric(`Custom/Cache/${cacheType}/HitRate`, hitRate);

  } catch (error) {
    console.warn('⚠️ Cache performance tracking error:', error);
  }
}

// External API call tracking
export function trackExternalApiCall(apiName: string, startTime: number, success: boolean) {
  if (!process.env.NEW_RELIC_LICENSE_KEY) return;

  try {
    const newrelic = require('newrelic');
    const duration = Date.now() - startTime;
    
    newrelic.recordMetric(`Custom/ExternalAPI/${apiName}/ResponseTime`, duration);
    newrelic.recordMetric(`Custom/ExternalAPI/${apiName}/${success ? 'Success' : 'Failure'}`, 1);
    
    if (!success) {
      newrelic.recordMetric(`Custom/ExternalAPI/TotalFailures`, 1);
    }

  } catch (error) {
    console.warn('⚠️ External API tracking error:', error);
  }
}

// Helper function to generate meaningful transaction names
function getTransactionName(path: string, method: string): string {
  // Clean up path for better grouping
  const cleanPath = path
    .replace(/\/api\/v\d+/, '') // Remove version prefix
    .replace(/\/[a-f0-9-]{36}/g, '/:id') // Replace UUIDs with :id
    .replace(/\/\d+/g, '/:id') // Replace numeric IDs with :id
    .replace(/\/$/, '') || '/'; // Remove trailing slash

  return `${method} ${cleanPath}`;
}

// NewRelic configuration helper
export function configureNewRelic() {
  if (!process.env.NEW_RELIC_LICENSE_KEY) {
    console.log('📊 NewRelic not configured - observability metrics disabled');
    return false;
  }

  try {
    const newrelic = require('newrelic');
    console.log('📊 NewRelic observability initialized');
    
    // Set application info
    newrelic.setApplicationInfo({
      app_name: ['Second Chance Platform'],
      logging: {
        level: process.env.NODE_ENV === 'development' ? 'debug' : 'info'
      }
    });

    return true;
  } catch (error) {
    console.warn('⚠️ NewRelic initialization failed:', error);
    return false;
  }
}