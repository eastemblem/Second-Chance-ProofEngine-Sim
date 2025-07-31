import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { databaseService } from '../services/database-service';
import { appLogger } from "../utils/logger";

// JWT secret from environment or fallback
const JWT_SECRET = process.env.JWT_SECRET || 'dev-jwt-secret-key-change-in-production';
const JWT_EXPIRES_IN = '7d'; // 7 days

// Token blacklist for logout functionality
const blacklistedTokens = new Set<string>();

// Clean up expired tokens from blacklist every hour
setInterval(() => {
  const now = Date.now() / 1000;
  const tokensToDelete: string[] = [];
  
  blacklistedTokens.forEach(token => {
    try {
      const decoded = jwt.decode(token) as any;
      if (decoded && decoded.exp && decoded.exp < now) {
        tokensToDelete.push(token);
      }
    } catch (error) {
      // If token can't be decoded, remove it
      tokensToDelete.push(token);
    }
  });
  
  tokensToDelete.forEach(token => blacklistedTokens.delete(token));
}, 60 * 60 * 1000); // 1 hour

export interface AuthToken {
  founderId: string;
  email: string;
  startupName?: string;
  sessionId?: string;
  iat?: number;
  exp?: number;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthToken;
  token?: string;
}

/**
 * Generate JWT token for user authentication
 */
export function generateAuthToken(payload: Omit<AuthToken, 'iat' | 'exp'>): string {
  return jwt.sign(payload, JWT_SECRET, { 
    expiresIn: JWT_EXPIRES_IN,
    issuer: 'second-chance-platform'
  });
}

/**
 * Verify JWT token and check if it's blacklisted
 */
export function verifyAuthToken(token: string): AuthToken | null {
  try {
    // Check if token is blacklisted (logged out)
    if (blacklistedTokens.has(token)) {
      appLogger.auth('Token is blacklisted (logged out)');
      return null;
    }

    const decoded = jwt.verify(token, JWT_SECRET) as AuthToken;
    return decoded;
  } catch (error) {
    appLogger.auth('Token verification failed:', error instanceof Error ? error.message : 'Unknown error');
    return null;
  }
}

/**
 * Invalidate a JWT token by adding it to blacklist
 */
export function invalidateToken(token: string): void {
  blacklistedTokens.add(token);
  appLogger.auth('Token invalidated and added to blacklist');
}

/**
 * Extract token from request headers or cookies
 */
function extractToken(req: Request): string | null {
  // Check Authorization header: "Bearer <token>"
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  // Check cookies
  const tokenFromCookie = req.cookies?.authToken;
  if (tokenFromCookie) {
    return tokenFromCookie;
  }

  // Check query parameter (for downloads, etc.)
  const tokenFromQuery = req.query.token as string;
  if (tokenFromQuery) {
    return tokenFromQuery;
  }

  return null;
}

/**
 * Middleware to authenticate requests using JWT tokens
 */
export function authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  appLogger.api('JWT Middleware executing for path:', req.path);
  const token = extractToken(req);
  appLogger.api('Token extracted:', token ? 'Present' : 'Missing');

  if (!token) {
    appLogger.api('JWT Middleware: No token found');
    return res.status(401).json({ 
      error: 'Authentication token required',
      code: 'TOKEN_MISSING'
    });
  }

  const decoded = verifyAuthToken(token);
  if (!decoded) {
    appLogger.api('JWT Middleware: Token invalid');
    return res.status(401).json({ 
      error: 'Invalid or expired token',
      code: 'TOKEN_INVALID'
    });
  }

  // Attach user info and token to request
  req.user = decoded;
  req.token = token;
  appLogger.api('JWT Middleware: User authenticated:', decoded.founderId);

  next();
}

/**
 * Optional authentication - doesn't fail if no token
 */
export function optionalAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const token = extractToken(req);

  if (token) {
    const decoded = verifyAuthToken(token);
    if (decoded) {
      req.user = decoded;
      req.token = token;
    }
  }

  next();
}

/**
 * Middleware to refresh token if it's close to expiry
 */
export async function refreshTokenIfNeeded(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user || !req.token) {
    return next();
  }

  const { exp } = req.user;
  if (!exp) {
    return next();
  }

  // Check if token expires within next 24 hours
  const now = Math.floor(Date.now() / 1000);
  const timeUntilExpiry = exp - now;
  const twentyFourHours = 24 * 60 * 60;

  if (timeUntilExpiry < twentyFourHours) {
    try {
      // Verify user still exists in database
      const userExists = await databaseService.getFounderById(req.user.founderId);
      if (userExists) {
        // Generate new token
        const newToken = generateAuthToken({
          founderId: req.user.founderId,
          email: req.user.email,
          startupName: req.user.startupName,
          sessionId: req.user.sessionId
        });

        // Set new token in response header for client to update
        res.setHeader('X-New-Auth-Token', newToken);
        
        appLogger.auth(`Token refreshed for user: ${req.user.email}`);
      }
    } catch (error) {
      appLogger.auth('Token refresh failed:', error);
      // Continue with existing token
    }
  }

  next();
}

/**
 * Create authentication response with token
 */
export function createAuthResponse(user: AuthToken, additionalData?: any) {
  const token = generateAuthToken(user);
  
  return {
    success: true,
    user: {
      founderId: user.founderId,
      email: user.email,
      startupName: user.startupName,
      sessionId: user.sessionId
    },
    token,
    expiresIn: JWT_EXPIRES_IN,
    ...additionalData
  };
}

/**
 * Logout - invalidate token (client-side removal)
 */
export function logout(req: AuthenticatedRequest, res: Response) {
  // Clear cookie if it exists
  res.clearCookie('authToken');
  
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
}