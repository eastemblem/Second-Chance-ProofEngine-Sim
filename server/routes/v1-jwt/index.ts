import { Router } from 'express';
import dashboardRoutes from '../v1/dashboard';
import vaultRoutes from '../v1/vault';
import onboardingJwtRoutes from './onboarding.js';
import paymentsJwtRoutes from './payments.js';
import certificateRoutes from '../v1/certificates';
import reportRoutes from '../v1/reports';
import notificationRoutes from '../v1/notifications';
import { getLeaderboard } from '../../routes/leaderboard';
import { asyncHandler } from '../middleware/error';
import { appLogger } from '../../utils/logger';
import { authenticateToken } from '../../middleware/token-auth';

const router = Router();

// Apply JWT authentication to ALL v1-jwt routes
router.use(authenticateToken);

// JWT AUTHENTICATED ROUTES (All protected by JWT)
router.use('/onboarding', onboardingJwtRoutes);
router.use('/payments', paymentsJwtRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/vault', vaultRoutes);
router.use('/certificate', certificateRoutes);
router.use('/report', reportRoutes);
router.use('/notification', notificationRoutes);

// Leaderboard route - JWT protected
router.get('/leaderboard', asyncHandler(getLeaderboard));

export default router;