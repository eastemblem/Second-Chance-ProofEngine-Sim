import { Router } from 'express';
import dashboardRoutes from './dashboard';
import vaultRoutes from './vault';
// Onboarding uses the main session-based routes, not JWT-based ones
import certificateRoutes from './certificates';
import reportRoutes from './reports';
import notificationRoutes from './notifications';
import testRoutes from './test';
import { getLeaderboard } from '../../routes/leaderboard';
import { asyncHandler } from '../../utils/error-handler';
import { appLogger } from '../../utils/logger';
import { authenticateToken } from '../../middleware/token-auth';

const router = Router();

// ONBOARDING: Use main session-based routes (not JWT-based - users don't have accounts yet)

// Apply JWT authentication to protected routes only
router.use(authenticateToken);

// Register JWT-protected v1 routes
router.use('/dashboard', dashboardRoutes);
router.use('/vault', vaultRoutes);
router.use('/certificate', certificateRoutes);
router.use('/report', reportRoutes);
router.use('/notification', notificationRoutes);
router.use('/test', testRoutes);

// Leaderboard route - EXACT SAME LOGIC as routes.ts
router.get('/leaderboard', asyncHandler(getLeaderboard));

export default router;