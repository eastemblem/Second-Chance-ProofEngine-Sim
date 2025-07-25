import { Request, Response, NextFunction } from 'express';
import { storage } from '../../storage';

export interface AuthenticatedRequest extends Request {
  user?: {
    founderId: string;
    email: string;
    isAuthenticated: boolean;
  };
}

export const requireAuth = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const sessionId = req.sessionID;
    if (!sessionId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    // Get user from session - this preserves existing auth logic
    const user = req.session?.user;
    if (!user?.founderId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    req.user = {
      founderId: user.founderId,
      email: user.email,
      isAuthenticated: true
    };

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(401).json({ error: 'Authentication failed' });
  }
};

export const optionalAuth = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const user = req.session?.user;
    if (user?.founderId) {
      req.user = {
        founderId: user.founderId,
        email: user.email,
        isAuthenticated: true
      };
    }
    next();
  } catch (error) {
    console.error('Optional auth error:', error);
    next();
  }
};