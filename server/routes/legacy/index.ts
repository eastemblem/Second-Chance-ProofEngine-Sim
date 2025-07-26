import { Router } from 'express';
import onboardingRoutes from './onboarding';
import vaultRoutes from './vault';
import dashboardRoutes from './dashboard';
import certificateRoutes from './certificate';
import reportRoutes from './report';
import { appLogger } from '../../utils/logger';

const router = Router();

appLogger.system("Initializing legacy routes (session-based authentication)");

// All legacy routes use session-based authentication
// No JWT required - these are for pre-login functionality
router.use('/onboarding', onboardingRoutes);
router.use('/vault', vaultRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/certificate', certificateRoutes);
router.use('/report', reportRoutes);

export default router;