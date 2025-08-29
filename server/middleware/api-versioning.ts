import { Request, Response, NextFunction } from "express";
import { appLogger } from "../utils/logger";

// API versioning middleware
export function apiVersioning(req: Request, res: Response, next: NextFunction) {
  // Extract version from URL path or headers
  const urlVersion = extractVersionFromPath(req.path);
  const headerVersion = req.headers['api-version'] as string;
  
  // Set the API version on the request
  (req as any).apiVersion = urlVersion || headerVersion || 'v1';
  
  // Set response headers for API versioning
  res.set('API-Version', (req as any).apiVersion);
  res.set('Supported-Versions', 'v1');
  
  next();
}

// Extract version from URL path (e.g., /api/v1/dashboard -> v1)
function extractVersionFromPath(path: string): string | null {
  const versionMatch = path.match(/^\/api\/(v\d+)\//);
  return versionMatch ? versionMatch[1] : null;
}

// Version deprecation warnings
export function deprecationWarning(deprecatedVersion: string, supportEndDate: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    const requestVersion = (req as any).apiVersion;
    
    if (requestVersion === deprecatedVersion) {
      res.set('Deprecation', 'true');
      res.set('Sunset', supportEndDate);
      res.set('Warning', `299 - "API version ${deprecatedVersion} is deprecated. Support ends ${supportEndDate}"`);
      
      appLogger.api(`Deprecated API version used: ${deprecatedVersion} for ${req.method} ${req.path}`);
    }
    
    next();
  };
}

// Content negotiation middleware
export function contentNegotiation(req: Request, res: Response, next: NextFunction) {
  // Default content type for API responses
  if (req.path.startsWith('/api/')) {
    res.type('application/json');
    
    // Payment gateway endpoints need to accept form-encoded data
    const isPaymentGatewayEndpoint = req.path.includes('/payment/') && 
      (req.path.includes('/return') || req.path.includes('/callback') || req.path.includes('/webhook'));
    
    // Handle JSON-only endpoints (except payment gateway callbacks)
    if (req.headers['content-type'] && !isPaymentGatewayEndpoint && 
        !req.headers['content-type'].includes('application/json') && 
        !req.headers['content-type'].includes('multipart/form-data')) {
      return res.status(415).json({
        error: 'Unsupported Media Type',
        message: 'API endpoints only accept application/json or multipart/form-data',
        supportedTypes: ['application/json', 'multipart/form-data']
      });
    }
  }
  
  next();
}