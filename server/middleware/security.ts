import { Request, Response, NextFunction } from "express";
import rateLimit from "express-rate-limit";

// Rate limiting configuration
export const createRateLimit = (windowMs: number, max: number, message?: string) => {
  return rateLimit({
    windowMs,
    max,
    message: {
      error: message || 'Too many requests from this IP, please try again later.',
      statusCode: 429,
      retryAfter: Math.ceil(windowMs / 1000)
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      console.warn(`🚨 Rate limit exceeded: ${req.ip} - ${req.path}`);
      res.status(429).json({
        error: message || 'Too many requests from this IP, please try again later.',
        statusCode: 429,
        retryAfter: Math.ceil(windowMs / 1000),
        timestamp: new Date().toISOString()
      });
    }
  });
};

// File upload rate limiting - optimized for large folder uploads
export const fileUploadRateLimit = createRateLimit(
  15 * 60 * 1000, // 15 minutes
  200, // max 200 file uploads per 15 minutes (supports 100+ file folders)
  'Too many file uploads. Please wait before uploading more files.'
);

// General API rate limiting - increased for high-volume operations
export const apiRateLimit = createRateLimit(
  15 * 60 * 1000, // 15 minutes
  500, // max 500 requests per 15 minutes (supports folder operations)
  'Too many API requests. Please wait before making more requests.'
);

// Authentication rate limiting (very strict)
export const authRateLimit = createRateLimit(
  15 * 60 * 1000, // 15 minutes
  5, // 5 attempts per window
  'Too many authentication attempts, please try again later.'
);

// Request sanitization middleware
export function sanitizeRequest(req: Request, res: Response, next: NextFunction) {
  // Basic XSS protection - escape HTML in request body
  if (req.body && typeof req.body === 'object') {
    sanitizeObject(req.body);
  }

  // Remove potentially dangerous headers
  delete req.headers['x-forwarded-host'];
  delete req.headers['x-original-url'];
  
  next();
}

// CORS configuration for API versioning
export function corsConfig(req: Request, res: Response, next: NextFunction) {
  // Set CORS headers
  res.header('Access-Control-Allow-Origin', process.env.FRONTEND_URL || '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, API-Version');
  res.header('Access-Control-Max-Age', '86400'); // 24 hours

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }

  next();
}

// Helper function to sanitize objects recursively
function sanitizeObject(obj: any) {
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      if (typeof obj[key] === 'string') {
        // Basic XSS protection - escape HTML entities
        obj[key] = obj[key]
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#x27;')
          .replace(/\//g, '&#x2F;');
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        sanitizeObject(obj[key]);
      }
    }
  }
}