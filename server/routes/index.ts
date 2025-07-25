import { Router } from "express";
import foundersRouter from "./founders";
import venturesRouter from "./ventures";
import onboardingRouter from "./onboarding";
import vaultRouter from "./vault";
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const router = Router();

// NewRelic status test endpoint
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

// Mount route modules
router.use("/founders", foundersRouter);
router.use("/ventures", venturesRouter);
router.use("/onboarding", onboardingRouter);
router.use("/vault", vaultRouter);

export default router;