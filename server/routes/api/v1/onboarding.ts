import express from "express";
import onboardingRoutes from "../../onboarding";

const router = express.Router();

// Use existing onboarding routes with v1 prefix
router.use('/', onboardingRoutes);

export default router;