import { Router } from 'express';
import dashboardRoutes from './dashboard';
import vaultRoutes from './vault';
import onboardingRoutes from './onboarding';
import certificateRoutes from './certificates';
import reportRoutes from './reports';
import notificationRoutes from './notifications';
import testRoutes from './test';
import { getLeaderboard } from '../../routes/leaderboard';
import { asyncHandler } from '../middleware/error';
import { authenticateToken } from '../../middleware/token-auth';

const router = Router();

// Debug log to verify middleware import
console.log('V1 Router: JWT Middleware function loaded:', typeof authenticateToken);

// Apply basic auth check middleware globally to v1 routes
router.use((req, res, next) => {
  console.log('V1 Route middleware executing for:', req.path);
  console.log('V1 Route headers:', req.headers.authorization ? 'Bearer token present' : 'No auth header');
  next();
});

// Apply JWT authentication to all v1 routes globally
router.use(authenticateToken);

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