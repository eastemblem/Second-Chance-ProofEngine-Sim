import { Request, Response, NextFunction } from "express";
// Note: Install express-rate-limit if rate limiting is needed
// import rateLimit from "express-rate-limit";

// Rate limiting configuration (placeholder - install express-rate-limit to use)
export const createRateLimit = (windowMs: number, max: number, message?: string) => {
  return (req: any, res: any, next: any) => {
    // Placeholder for rate limiting - install express-rate-limit package
    console.log(`Rate limit check: ${req.ip} - ${req.path}`);
    next();
  };
};

// File upload rate limiting (stricter)
export const fileUploadRateLimit = createRateLimit(
  15 * 60 * 1000, // 15 minutes
  10, // 10 requests per window
  'Too many file uploads, please wait before uploading again.'
);

// API rate limiting (general)
export const apiRateLimit = createRateLimit(
  15 * 60 * 1000, // 15 minutes
  100, // 100 requests per window
  'Too many API requests, please try again later.'
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