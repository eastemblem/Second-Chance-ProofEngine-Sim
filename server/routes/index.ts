import { Router } from "express";
import foundersRouter from "./founders";
import venturesRouter from "./ventures";
import onboardingRouter from "./onboarding";

const router = Router();

// Mount route modules
router.use("/founders", foundersRouter);
router.use("/ventures", venturesRouter);
router.use("/onboarding", onboardingRouter);

export default router;