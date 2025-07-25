import { Request, Response, NextFunction } from 'express';

export interface AuthenticatedRequest extends Request {
  user?: {
    founderId: string;
    email: string;
    isAuthenticated: boolean;
  };
}

// Extract existing auth middleware logic from routes.ts
export const requireAuth = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const sessionId = req.sessionID;
  if (!sessionId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

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
};

export const optionalAuth = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const user = req.session?.user;
  if (user?.founderId) {
    req.user = {
      founderId: user.founderId,
      email: user.email,
      isAuthenticated: true
    };
  }
  next();
};