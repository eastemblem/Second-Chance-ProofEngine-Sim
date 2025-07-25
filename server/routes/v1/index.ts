import { Router } from 'express';
import jwt from 'jsonwebtoken';
import dashboardRoutes from './dashboard';
import vaultRoutes from './vault';
import onboardingRoutes from './onboarding';
import certificateRoutes from './certificates';
import reportRoutes from './reports';
import notificationRoutes from './notifications';
import testRoutes from './test';
import { getLeaderboard } from '../../routes/leaderboard';
import { asyncHandler } from '../middleware/error';
import { appLogger } from '../../utils/logger';

const router = Router();

// Simple JWT authentication middleware for V1 routes
function authenticateV1Token(req: any, res: any, next: any) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: "Bearer token required" });
  }
  
  const token = authHeader.substring(7);
  const JWT_SECRET = process.env.JWT_SECRET || 'dev-jwt-secret-key-change-in-production';
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

// Apply JWT authentication to all v1 routes globally
router.use(authenticateV1Token);

// Register all v1 routes (all protected by JWT)
router.use('/dashboard', dashboardRoutes);
router.use('/vault', vaultRoutes);
router.use('/onboarding', onboardingRoutes);
router.use('/certificate', certificateRoutes);
router.use('/report', reportRoutes);
router.use('/notification', notificationRoutes);
router.use('/test', testRoutes);

// Leaderboard route - EXACT SAME LOGIC as routes.ts
router.get('/leaderboard', asyncHandler(getLeaderboard));

export default router;