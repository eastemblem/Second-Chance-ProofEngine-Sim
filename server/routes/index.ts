import { Router } from "express";
import foundersRouter from "./founders";
import venturesRouter from "./ventures";
import onboardingRouter from "./onboarding";
import vaultRouter from "./vault";
import dashboardRouter from "./dashboard";

const router = Router();

// Mount route modules
router.use("/founders", foundersRouter);
router.use("/ventures", venturesRouter);
router.use("/onboarding", onboardingRouter);
router.use("/vault", vaultRouter);
router.use("/dashboard", dashboardRouter);

export default router;