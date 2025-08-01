import { Router } from "express";
import foundersRouter from "./founders";
import venturesRouter from "./ventures";
import onboardingRouter from "./onboarding";
import vaultRouter from "./vault";
import paymentsRouter from "./v1/payments";
import webhooksRouter from "./v1/webhooks";
import paymentNextStepsRouter from "./payment-next-steps";
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const router = Router();

// Development-only NewRelic status test endpoint
if (process.env.NODE_ENV === 'development') {
  router.get("/newrelic-test", (req, res) => {
    try {
      const newrelic = require('newrelic');
      const isInitialized = newrelic && typeof newrelic.recordMetric === 'function';
      
      if (isInitialized) {
        newrelic.recordMetric('Custom/TestEndpoint', 1);
        res.json({
          status: 'success',
          message: 'NewRelic is working properly',
          appName: 'Second Chance Platform',
          hasLicenseKey: !!process.env.NEW_RELIC_LICENSE_KEY,
          licenseKeyLength: process.env.NEW_RELIC_LICENSE_KEY?.length,
          timestamp: new Date().toISOString()
        });
      } else {
        res.json({
          status: 'error',
          message: 'NewRelic agent not properly initialized',
          hasLicenseKey: !!process.env.NEW_RELIC_LICENSE_KEY,
          licenseKeyLength: process.env.NEW_RELIC_LICENSE_KEY?.length
        });
      }
    } catch (error: any) {
      res.json({
        status: 'error',
        message: 'NewRelic require failed',
        error: error.message,
        hasLicenseKey: !!process.env.NEW_RELIC_LICENSE_KEY,
        licenseKeyLength: process.env.NEW_RELIC_LICENSE_KEY?.length
      });
    }
  });
}

// Mount route modules
router.use("/founders", foundersRouter);
router.use("/ventures", venturesRouter);
router.use("/onboarding", onboardingRouter);
router.use("/vault", vaultRouter);

// V1 routes (mixed: session-based onboarding/payments + JWT for other features)
try {
  const v1Routes = await import("./v1/index.js");
  router.use("/v1", v1Routes.default);
} catch (error) {
  console.error("Failed to load V1 routes:", error);
}

// V1-JWT routes (all JWT authenticated)
try {
  const v1JwtRoutes = await import("./v1-jwt/index.js");
  router.use("/v1-jwt", v1JwtRoutes.default);
} catch (error) {
  console.error("Failed to load V1-JWT routes:", error);
}

// V1 API routes
router.use("/v1/payments", paymentsRouter);
router.use("/v1/webhooks", webhooksRouter);
router.use("/v1/payment", paymentNextStepsRouter);

export default router;