import { Router } from 'express';
import dashboardRoutes from './dashboard';
import vaultRoutes from './vault';
import onboardingRoutes from './onboarding';
import certificateRoutes from './certificates';
import reportRoutes from './reports';
import notificationRoutes from './notifications';
import { getLeaderboard } from '../../routes/leaderboard';
import { asyncHandler } from '../middleware/error';
import { appLogger } from '../../utils/logger';
import { authenticateToken } from '../../middleware/token-auth';

const router = Router();

// Register onboarding routes FIRST (no authentication required for session init)
router.use('/onboarding', onboardingRoutes);

// Apply JWT authentication with blacklist checking to remaining v1 routes
router.use(authenticateToken);

// Register authenticated v1 routes (all protected by JWT)
router.use('/dashboard', dashboardRoutes);
router.use('/vault', vaultRoutes);
router.use('/certificate', certificateRoutes);
router.use('/report', reportRoutes);
router.use('/notification', notificationRoutes);
// Note: Test routes moved to tests/ directory

// Leaderboard route - EXACT SAME LOGIC as routes.ts
router.get('/leaderboard', asyncHandler(getLeaderboard));

export default router;