import { Router } from "express";
import foundersRouter from "./founders";
import venturesRouter from "./ventures";
import onboardingRouter from "./onboarding";
import vaultRouter from "./vault";

const router = Router();

// Mount route modules
router.use("/founders", foundersRouter);
router.use("/ventures", venturesRouter);
router.use("/onboarding", onboardingRouter);
router.use("/vault", vaultRouter);

export default router;