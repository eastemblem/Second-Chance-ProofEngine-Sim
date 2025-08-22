import { Router } from 'express';
import dashboardRoutes from './dashboard';
import vaultRoutes from './vault';
import onboardingRoutes from './onboarding';
import certificateRoutes from './certificates';
import reportRoutes from './reports';
import notificationRoutes from './notifications';
import paymentsRoutes from './payments';
import encryptionTestRoutes from './encryption-test';
import { getLeaderboard } from '../../routes/leaderboard';
import { asyncHandler } from '../middleware/error';
import { appLogger } from '../../utils/logger';
import { authenticateToken } from '../../middleware/token-auth';
import { encryptionSuite } from '../../middleware/encryption';

const router = Router();

// Register onboarding routes FIRST (no authentication required for session init)
router.use('/onboarding', onboardingRoutes);

// Apply JWT authentication with blacklist checking to remaining v1 routes
router.use(authenticateToken);

// Apply encryption middleware to all authenticated routes
router.use(encryptionSuite);

// Register authenticated v1 routes (all protected by JWT and encryption)
router.use('/dashboard', dashboardRoutes);
router.use('/vault', vaultRoutes);
router.use('/certificate', certificateRoutes);
router.use('/report', reportRoutes);
router.use('/notification', notificationRoutes);
router.use('/payments', paymentsRoutes);
router.use('/encryption-test', encryptionTestRoutes);
// Note: Test routes moved to tests/ directory

// Leaderboard route - EXACT SAME LOGIC as routes.ts
router.get('/leaderboard', asyncHandler(getLeaderboard));

export default router;