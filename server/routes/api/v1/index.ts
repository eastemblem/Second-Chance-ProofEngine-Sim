import express from "express";
import { performanceTracker } from "../../../middleware/performance";
import { errorHandler, timeoutHandler } from "../../../middleware/error-handling";
import dashboardRoutes from "./dashboard";
import onboardingRoutes from "./onboarding";

const router = express.Router();

// Apply v1 API middleware
router.use(performanceTracker);
router.use(timeoutHandler(30000)); // 30 second timeout for v1 APIs

// API versioning header
router.use((req, res, next) => {
  res.set('API-Version', 'v1');
  res.set('X-Powered-By', 'Second Chance Platform API v1');
  next();
});

// V1 Route modules
router.use('/dashboard', dashboardRoutes);
router.use('/onboarding', onboardingRoutes);

// V1 API error handling
router.use(errorHandler);

export default router;