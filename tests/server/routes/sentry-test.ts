// Sentry testing endpoints for comprehensive error tracking validation
import { Router } from 'express';
import { enrichErrorContext, reportError, startTransaction } from '../sentry';

const router = Router();

// Test basic error capture
router.get('/api/sentry-test/error', (req, res) => {
  try {
    throw new Error('Test error for Sentry integration - this is intentional');
  } catch (error: any) {
    enrichErrorContext(error, {
      component: 'sentry-test',
      operation: 'basic-error-test',
      userId: 'test-user',
      requestPath: req.path,
      userAgent: req.get('User-Agent'),
    });
    
    res.status(500).json({
      success: false,
      message: 'Test error sent to Sentry successfully',
      error: 'This error was intentionally thrown to test Sentry integration'
    });
  }
});

// Test warning message
router.get('/api/sentry-test/warning', (req, res) => {
  reportError('Test warning message for Sentry integration', 'warning', {
    component: 'sentry-test',
    operation: 'warning-test',
    timestamp: new Date().toISOString(),
    requestPath: req.path,
  });
  
  res.json({
    success: true,
    message: 'Test warning sent to Sentry successfully'
  });
});

// Test custom context and user tracking
router.post('/api/sentry-test/custom-context', (req, res) => {
  const { userId, ventureName, testType } = req.body;
  
  try {
    // Simulate a business logic error
    if (testType === 'business-error') {
      throw new Error('Business logic validation failed');
    }
    
    // Simulate database connection error
    if (testType === 'database-error') {
      throw new Error('Database connection timeout');
    }
    
    // Simulate file upload error
    if (testType === 'upload-error') {
      throw new Error('File upload validation failed - invalid file type');
    }
    
    res.json({ success: true, message: 'No error to test' });
  } catch (error: any) {
    enrichErrorContext(error, {
      component: 'sentry-test',
      operation: 'custom-context-test',
      userId: userId || 'anonymous',
      venture: ventureName || 'test-venture',
      testType: testType,
      businessContext: {
        feature: 'error-testing',
        action: 'custom-context-validation',
        timestamp: new Date().toISOString(),
      },
      requestData: req.body,
    });
    
    res.status(400).json({
      success: false,
      message: 'Custom context error sent to Sentry successfully',
      testType: testType,
      error: error.message
    });
  }
});

// Test performance monitoring
router.get('/api/sentry-test/performance', async (req, res) => {
  const transaction = startTransaction('test-performance-monitoring', 'http');
  
  try {
    // Simulate slow operation
    await new Promise(resolve => setTimeout(resolve, Math.random() * 2000 + 500));
    
    // Simulate database query
    await new Promise(resolve => setTimeout(resolve, Math.random() * 500 + 100));
    
    // Simulate external API call
    await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 200));
    
    res.json({
      success: true,
      message: 'Performance monitoring test completed',
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    reportError(error, 'error', {
      component: 'performance-test',
      transactionId: (transaction as any)?.traceId,
    });
    
    res.status(500).json({
      success: false,
      message: 'Performance test error sent to Sentry'
    });
  } finally {
    // Transaction cleanup handled automatically
  }
});

// Test comprehensive error scenarios
router.get('/api/sentry-test/scenarios/:scenario', (req, res) => {
  const { scenario } = req.params;
  
  try {
    switch (scenario) {
      case 'null-reference':
        const obj: any = null;
        console.log(obj.property); // This will throw
        break;
        
      case 'type-error':
        const num: any = "not a number";
        Math.sqrt(num.toFixed()); // This will throw
        break;
        
      case 'async-error':
        Promise.reject(new Error('Async operation failed')).catch(error => {
          enrichErrorContext(error, {
            component: 'async-test',
            operation: 'promise-rejection',
            scenario: scenario,
          });
        });
        break;
        
      case 'validation-error':
        throw new Error('Input validation failed: missing required fields');
        
      case 'authorization-error':
        const authError = new Error('Unauthorized access attempt');
        authError.name = 'AuthorizationError';
        throw authError;
        
      default:
        throw new Error(`Unknown test scenario: ${scenario}`);
    }
    
    res.json({ success: true, message: `Scenario ${scenario} executed` });
  } catch (error: any) {
    enrichErrorContext(error, {
      component: 'scenario-test',
      operation: 'error-scenario-testing',
      scenario: scenario,
      errorType: error.name || 'Error',
      requestPath: req.path,
      timestamp: new Date().toISOString(),
    });
    
    res.status(500).json({
      success: false,
      message: `Scenario ${scenario} error sent to Sentry successfully`,
      scenario: scenario,
      errorType: error.name,
      error: error.message
    });
  }
});

// Health check endpoint
router.get('/api/sentry-test/health', (req, res) => {
  res.json({
    success: true,
    message: 'Sentry test endpoints are healthy',
    endpoints: [
      'GET /api/sentry-test/error - Test basic error capture',
      'GET /api/sentry-test/warning - Test warning messages',
      'POST /api/sentry-test/custom-context - Test custom context and user tracking',
      'GET /api/sentry-test/performance - Test performance monitoring',
      'GET /api/sentry-test/scenarios/:scenario - Test specific error scenarios',
      'GET /api/sentry-test/health - This health check endpoint'
    ],
    availableScenarios: [
      'null-reference',
      'type-error', 
      'async-error',
      'validation-error',
      'authorization-error'
    ]
  });
});

export default router;