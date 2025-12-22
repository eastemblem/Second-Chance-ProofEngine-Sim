import { Router } from 'express';
import dashboardRoutes from './dashboard';
import vaultRoutes from './vault';
import onboardingRoutes from './onboarding';
import certificateRoutes from './certificates';
import reportRoutes from './reports';
import notificationRoutes from './notifications';
import paymentsRoutes from './payments';
import preOnboardingPaymentsRoutes from './pre-onboarding-payments';
import validationMapRoutes from './validation-map';
import coachRoutes from './coach';
import activityRoutes from './activity';
import eventsRoutes from './events';
import dealRoomRoutes from './deal-room';

import { getLeaderboard } from '../../routes/leaderboard';
import { asyncHandler } from '../middleware/error';
import { appLogger } from '../../utils/logger';
import { authenticateToken } from '../../middleware/token-auth';

const router = Router();

// Register onboarding routes FIRST (no authentication required for session init)
router.use('/onboarding', onboardingRoutes);

// Register events routes (no authentication required - public events)
router.use('/events', eventsRoutes);

// Register pre-onboarding payments (no authentication required - payment before signup)
router.use('/pre-onboarding-payments', preOnboardingPaymentsRoutes);

// Apply JWT authentication with blacklist checking to remaining v1 routes
router.use(authenticateToken);

// Encryption middleware removed

// Register authenticated v1 routes (all protected by JWT and encryption)
router.use('/dashboard', dashboardRoutes);
router.use('/vault', vaultRoutes);
router.use('/certificate', certificateRoutes);
router.use('/report', reportRoutes);
router.use('/notification', notificationRoutes);
router.use('/payments', paymentsRoutes);
router.use('/validation-map', validationMapRoutes);
router.use('/coach', coachRoutes);
router.use('/activity', activityRoutes);
router.use('/deal-room', dealRoomRoutes);

// Note: Test routes moved to tests/ directory

// Leaderboard route - EXACT SAME LOGIC as routes.ts
router.get('/leaderboard', asyncHandler(getLeaderboard));

export default router;