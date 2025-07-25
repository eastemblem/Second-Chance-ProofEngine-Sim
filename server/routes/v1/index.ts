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

const router = Router();

// Register all v1 routes
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