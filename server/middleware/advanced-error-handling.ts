import { Request, Response, NextFunction } from "express";
import { appLogger } from "../utils/logger";
import { createErrorResponse } from "../utils/error-handler";

// Enhanced error types
export class ApiError extends Error {
  statusCode: number;
  details?: any;
  isOperational: boolean;
  timestamp: string;
  path?: string;
  method?: string;

  constructor(
    message: string, 
    statusCode = 500, 
    details?: any,
    isOperational = true
  ) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = isOperational;
    this.timestamp = new Date().toISOString();
    
    Error.captureStackTrace(this, this.constructor);
  }
}

// Circuit breaker for external API calls
class CircuitBreaker {
  private failures = 0;
  private nextAttempt = 0;
  private timeout = 60000; // 1 minute
  private threshold = 5; // 5 failures before opening

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.isOpen()) {
      throw new ApiError('Service temporarily unavailable - circuit breaker open', 503);
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private isOpen(): boolean {
    return this.failures >= this.threshold && Date.now() < this.nextAttempt;
  }

  private onSuccess(): void {
    this.failures = 0;
    this.nextAttempt = 0;
  }

  private onFailure(): void {
    this.failures++;
    if (this.failures >= this.threshold) {
      this.nextAttempt = Date.now() + this.timeout;
      appLogger.system(`Circuit breaker opened - ${this.failures} failures`);
    }
  }

  getStatus() {
    return {
      failures: this.failures,
      isOpen: this.isOpen(),
      nextAttempt: this.nextAttempt
    };
  }
}

// Global circuit breakers for external services
export const circuitBreakers = {
  eastEmblem: new CircuitBreaker(),
  database: new CircuitBreaker(),
  email: new CircuitBreaker()
};

// Retry logic with exponential backoff
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  initialDelay = 1000
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt === maxRetries) {
        appLogger.system(`Max retries (${maxRetries}) reached for operation`);
        break;
      }

      const delay = initialDelay * Math.pow(2, attempt) + Math.random() * 1000;
      appLogger.system(`Retry attempt ${attempt + 1}/${maxRetries} after ${Math.round(delay)}ms`);
      
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError!;
}

// Enhanced global error handler
export function advancedErrorHandler(
  error: any,
  req: Request,
  res: Response,
  next: NextFunction
) {
  // Generate correlation ID for tracking
  const correlationId = req.headers['x-correlation-id'] || generateCorrelationId();
  
  // Enhanced error logging
  const errorDetails = {
    correlationId,
    message: error.message,
    stack: error.stack,
    statusCode: error.statusCode || 500,
    path: req.path,
    method: req.method,
    ip: req.ip,
    userAgent: req.headers['user-agent'],
    timestamp: new Date().toISOString(),
    founderId: req.session?.founderId,
    details: error.details
  };

  appLogger.api(`API Error [${correlationId}]:`, errorDetails);

  // Determine if error is operational or programming error
  const isOperational = error.isOperational !== undefined ? error.isOperational : error.statusCode < 500;

  // Create standard error response format
  const statusCode = error.statusCode || 500;
  const message = isOperational ? error.message : 'Internal server error';
  const code = error.code || (statusCode >= 500 ? 'INTERNAL_ERROR' : 'CLIENT_ERROR');
  
  const errorResponse = createErrorResponse(statusCode, message, code, error.details);

  // Add debug metadata in development mode
  if (process.env.NODE_ENV === 'development') {
    errorResponse.debug = {
      correlationId,
      timestamp: new Date().toISOString(),
      path: req.path,
      method: req.method,
      circuitBreaker: error.statusCode >= 500 ? {
        eastEmblem: circuitBreakers.eastEmblem.getStatus(),
        database: circuitBreakers.database.getStatus()
      } : undefined,
      retryAfter: [502, 503, 504].includes(error.statusCode) ? 60 : undefined
    };
  }

  res.status(statusCode).json(errorResponse);
}

// Graceful degradation middleware
export function gracefulDegradation(fallbackResponse: any) {
  return (error: any, req: Request, res: Response, next: NextFunction) => {
    appLogger.system(`Graceful degradation activated for ${req.path}: ${error.message}`);
    
    res.status(200).json({
      ...fallbackResponse,
      degraded: true,
      reason: 'Service temporarily degraded',
      timestamp: new Date().toISOString()
    });
  };
}

// Error aggregation for monitoring
class ErrorAggregator {
  private errors: Map<string, number> = new Map();
  private lastReset = Date.now();
  private resetInterval = 5 * 60 * 1000; // 5 minutes

  track(error: ApiError, req: Request) {
    const key = `${error.statusCode}:${req.path}:${error.message}`;
    
    // Reset counters periodically
    if (Date.now() - this.lastReset > this.resetInterval) {
      this.errors.clear();
      this.lastReset = Date.now();
    }

    const count = this.errors.get(key) || 0;
    this.errors.set(key, count + 1);

    // Alert on high error rates
    if (count > 10) {
      appLogger.system(`High error rate detected: ${key} (${count} occurrences)`);
    }
  }

  getStats() {
    return {
      errors: Array.from(this.errors.entries()).map(([key, count]) => ({
        error: key,
        count,
        rate: count / (this.resetInterval / 1000 / 60) // per minute
      })),
      resetInterval: this.resetInterval,
      lastReset: this.lastReset
    };
  }
}

export const errorAggregator = new ErrorAggregator();

// Correlation ID generator
function generateCorrelationId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Request correlation middleware
export function correlationMiddleware(req: Request, res: Response, next: NextFunction) {
  const correlationId = req.headers['x-correlation-id'] as string || generateCorrelationId();
  
  req.headers['x-correlation-id'] = correlationId;
  res.set('X-Correlation-ID', correlationId);
  
  next();
}

// Async error wrapper with circuit breaker
export function asyncHandlerWithCircuitBreaker(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>,
  circuitBreaker?: CircuitBreaker
) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (circuitBreaker) {
        await circuitBreaker.execute(() => fn(req, res, next));
      } else {
        await fn(req, res, next);
      }
    } catch (error) {
      // Track error for aggregation
      if (error instanceof ApiError) {
        errorAggregator.track(error, req);
      }
      
      next(error);
    }
  };
}