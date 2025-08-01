import { Request, Response, NextFunction } from 'express';

/**
 * Middleware to protect development-only endpoints in production
 * This ensures test endpoints that expose sensitive system information
 * are only available in development environments
 */
export function developmentOnly(req: Request, res: Response, next: NextFunction) {
  if (process.env.NODE_ENV === 'production') {
    return res.status(404).json({ 
      error: 'Endpoint not available in production environment',
      message: 'This development-only endpoint is disabled for security reasons'
    });
  }
  next();
}

/**
 * Check if current environment is development
 */
export function isDevelopment(): boolean {
  return process.env.NODE_ENV !== 'production';
}

/**
 * Environment guard for route registration
 */
export function registerIfDevelopment(app: any, method: string, path: string, ...handlers: any[]) {
  if (isDevelopment()) {
    console.log(`🔧 Registering development endpoint: ${method.toUpperCase()} ${path}`);
    app[method.toLowerCase()](path, ...handlers);
  } else {
    console.log(`🔒 Skipping development endpoint in production: ${method.toUpperCase()} ${path}`);
  }
}