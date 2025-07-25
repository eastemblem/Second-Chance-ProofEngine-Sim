// NewRelic connectivity test endpoint
import { Router, Request, Response } from 'express';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const router = Router();

router.get('/newrelic-status', (req: Request, res: Response) => {
  try {
    const newrelic = require('newrelic');
    const isActive = newrelic && typeof newrelic.recordMetric === 'function';
    
    if (isActive) {
      // Test recording a metric
      newrelic.recordMetric('Custom/StatusCheck', 1);
      
      res.json({
        status: 'active',
        message: 'NewRelic is properly initialized and sending data',
        appName: 'Second Chance Platform',
        licenseKey: '***' + (process.env.NEW_RELIC_LICENSE_KEY?.slice(-4) || 'NONE'),
        timestamp: new Date().toISOString()
      });
    } else {
      res.json({
        status: 'inactive',
        message: 'NewRelic agent is not properly initialized',
        error: 'Agent not loaded or missing required functions'
      });
    }
  } catch (error) {
    res.json({
      status: 'error',
      message: 'NewRelic initialization failed',
      error: error.message,
      licenseKey: process.env.NEW_RELIC_LICENSE_KEY ? 'configured' : 'missing'
    });
  }
});

export { router as newrelicTestRouter };