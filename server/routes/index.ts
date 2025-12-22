import { Router } from "express";
import foundersRouter from "./founders";
import venturesRouter from "./ventures";
import onboardingRouter from "./onboarding";
import vaultRouter from "./vault";
import paymentsRouter from "./v1/payments";
import webhooksRouter from "./v1/webhooks";
import preOnboardingCallbackRouter from "./pre-onboarding-callback";
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

// Mount route modules (session-based authentication)
router.use("/founders", foundersRouter);
router.use("/ventures", venturesRouter);
router.use("/onboarding", onboardingRouter);
router.use("/vault", vaultRouter);
router.use("/payment", paymentNextStepsRouter);

// Pre-onboarding payment callbacks (no authentication required)
router.use("/payment/pre-onboarding", preOnboardingCallbackRouter);

// Development/test routes (no authentication required)
// Encryption test routes removed

// Clean test routes removed

// V1 API routes (JWT authentication)
router.use("/v1/payments", paymentsRouter);
router.use("/v1/webhooks", webhooksRouter);
// Note: V1 payment next-steps will be implemented separately for dashboard use

export default router;