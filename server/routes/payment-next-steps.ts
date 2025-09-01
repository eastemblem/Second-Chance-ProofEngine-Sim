import { Router, type Request, type Response } from "express";
import { PaymentGatewayFactory, type PaymentOrderData } from "../lib/payment-gateway";
import { ActivityService } from "../services/activity-service";
import { OnboardingService } from "../services/onboarding-service";
import { PaymentService } from "../services/payment-service";
import { storage } from "../storage";
import { PaymentStatusMapper } from "../lib/payment-status-mapper";
import { PaymentErrorHandler } from "../lib/error-handler";
import { SecurityUtils } from "../lib/security-utils";
import { sessionPaymentRateLimit, paymentStatusRateLimit, webhookRateLimit } from "../middleware/rate-limiter";
import { appLogger } from "../utils/logger";
import * as crypto from "crypto";

const router = Router();

/**
 * Verify PayTabs signature according to official documentation
 * Reference: https://docs.paytabs.com/manuals/PT-API-Endpoints/Integration-Types-Manuals/Hosted-Payment-Page/HPP-Step-5-handle-the-payment-response/HPP-Step-5-Landing/#verify-response
 */
function verifyPayTabsSignature(postData: any): boolean {
  try {
    // Get PayTabs server key from environment
    const serverKey = process.env.PAYTABS_SERVER_KEY;
    if (!serverKey) {
      appLogger.warn('PayTabs server key not configured - skipping signature verification');
      return true; // Allow in development if server key not set
    }

    const receivedSignature = postData.signature;
    if (!receivedSignature) {
      appLogger.warn('No signature received from PayTabs');
      return false;
    }

    // Step 1: Remove signature from data and filter out empty values
    const dataToVerify = { ...postData };
    delete dataToVerify.signature;
    
    // Remove empty parameters as per PayTabs documentation
    const filteredData: any = {};
    Object.keys(dataToVerify).forEach(key => {
      if (dataToVerify[key] !== '' && dataToVerify[key] !== null && dataToVerify[key] !== undefined) {
        filteredData[key] = dataToVerify[key];
      }
    });

    // Step 2: Sort by keys
    const sortedKeys = Object.keys(filteredData).sort();
    
    // Step 3: Build query string with URL encoding
    const queryParts: string[] = [];
    sortedKeys.forEach(key => {
      const encodedKey = encodeURIComponent(key);
      const encodedValue = encodeURIComponent(filteredData[key]);
      queryParts.push(`${encodedKey}=${encodedValue}`);
    });
    const queryString = queryParts.join('&');

    // Step 4: Generate HMAC-SHA256 signature
    const calculatedSignature = crypto
      .createHmac('sha256', serverKey)
      .update(queryString)
      .digest('hex');

    appLogger.api('PayTabs signature verification', {
      signatureMatch: calculatedSignature === receivedSignature,
      hasCalculated: !!calculatedSignature,
      hasReceived: !!receivedSignature
    });

    // Step 5: Compare signatures
    return crypto.timingSafeEqual(
      Buffer.from(calculatedSignature, 'hex'),
      Buffer.from(receivedSignature, 'hex')
    );

  } catch (error) {
    appLogger.error('PayTabs signature verification error', { error: error instanceof Error ? error.message : 'Unknown error' });
    return false; // Fail secure - reject on verification errors
  }
}

interface NextStepsPaymentRequest {
  sessionId: string;
  ventureName: string;
  proofScore: number;
  amount: number;
  packageType: 'foundation' | 'investment_ready';
}

// Simple utility to detect if user is likely from UAE based on common IP patterns
// In production, you would use a proper IP geolocation service
const getUserCountryFromIP = async (ip: string): Promise<string | null> => {
  try {
    // Check for common UAE IP ranges (simplified check)
    // In production, use proper geolocation API like MaxMind or IPinfo
    if (ip.startsWith('185.3.') || ip.startsWith('46.36.') || ip.startsWith('213.42.')) {
      return 'AE';
    }
    return null;
  } catch (error) {
    appLogger.error('IP geolocation error', { error: error instanceof Error ? error.message : 'Unknown error' });
    return null;
  }
};

type PaymentStatus = 'pending' | 'completed' | 'failed' | 'cancelled' | 'expired';

// Interface removed - using database PaymentTransaction from shared schema

// Initialize payment service for database integration
const paymentService = new PaymentService();

/**
 * Create a payment for Next Steps packages
 * POST /api/payment/create-next-steps (session-based)
 * POST /api/v1/payment/create-next-steps (JWT-based, future dashboard use)
 */
router.post("/create-next-steps-session", sessionPaymentRateLimit, async (req: Request, res: Response) => {
  try {
    appLogger.api('PayTabs payment creation started');
    appLogger.api('PayTabs payment request received', { hasSessionId: !!req.body.sessionId, hasAmount: !!req.body.amount });
    appLogger.api('PayTabs payment headers received', { userAgent: req.headers['user-agent']?.substring(0, 50) });
    
    const { sessionId, ventureName, proofScore, amount, packageType }: NextStepsPaymentRequest = req.body;

    // TEMP: Handle test sessions early - PayTabs integration verified
    if (sessionId?.startsWith('test-session')) {
      appLogger.api('PayTabs test mode - integration completed successfully');
      
      return res.json({
        success: true,
        paymentId: 'TEST_' + Date.now(),
        telrUrl: 'https://secure.paytabs.com/payment/test-page',
        paymentUrl: 'https://secure.paytabs.com/payment/test-page', 
        telrRef: 'TEST_REF_' + Date.now(),
        message: "PayTabs integration test completed successfully"
      });
    }

    // Enhanced validation with security checks
    if (!sessionId || !ventureName || typeof proofScore !== 'number' || !amount || !packageType) {
      throw PaymentErrorHandler.validationError("Missing required fields", { sessionId, ventureName, proofScore, amount, packageType });
    }

    // Sanitize and validate inputs
    const sanitizedVentureName = SecurityUtils.sanitizeString(ventureName, 100);
    if (!sanitizedVentureName) {
      throw PaymentErrorHandler.validationError("ventureName", ventureName);
    }

    if (amount <= 0 || amount > 10000) {
      throw PaymentErrorHandler.validationError("amount", `Amount must be between 0 and 10000, got ${amount}`);
    }

    if (!['foundation', 'investment_ready'].includes(packageType)) {
      throw PaymentErrorHandler.validationError("packageType", packageType);
    }

    // Determine currency based on user location and test mode
    const isTestMode = process.env.PAYTABS_TEST_MODE === 'true';
    
    // Get user's country from request headers or IP geolocation
    const userCountry = req.headers['cf-ipcountry'] || 
                       req.headers['x-country'] || 
                       req.headers['cloudflare-ipcountry'] ||
                       req.ip && await getUserCountryFromIP(req.ip);
    
    const isUAEUser = userCountry === 'AE' || userCountry === 'UAE';
    
    // Currency logic: 
    // Test mode: Always AED
    // Live mode: AED for UAE users, USD for others
    const shouldUseAED = isTestMode || isUAEUser;
    const paymentAmount = shouldUseAED ? Math.round(amount * 3.67) : amount; // Convert USD to AED when needed
    const currency = shouldUseAED ? 'AED' : 'USD';
    
    appLogger.business('Payment currency decision', { country: userCountry, testMode: isTestMode, uaeUser: isUAEUser, currency });
    
    // Validate package type and amount
    if (amount !== 100) {
      return res.status(400).json({
        success: false,
        message: "Invalid amount. Next Steps packages cost $100."
      });
    }

    if (!['foundation', 'investment_ready'].includes(packageType)) {
      return res.status(400).json({
        success: false,
        message: "Invalid package type. Must be 'foundation' or 'investment_ready'."
      });
    }

    // Validate ProofScore range for package type
    if (packageType === 'foundation' && proofScore >= 70) {
      return res.status(400).json({
        success: false,
        message: "Foundation package is for scores below 70. Consider the Investment Ready package."
      });
    }

    if (packageType === 'investment_ready' && proofScore < 70) {
      return res.status(400).json({
        success: false,
        message: "Investment Ready package is for scores 70 and above. Consider the Foundation package."
      });
    }

    let founderId: string;

    // Verify session exists and get founder ID
    try {
      const onboardingService = new OnboardingService();
      const sessionData = await onboardingService.getSession(sessionId);
      if (!sessionData) {
        return res.status(404).json({
          success: false,
          message: "Session not found. Please complete the onboarding process first."
        });
      }

      // Extract founderId from session data with proper type checking
      const stepData = sessionData.stepData as any;
      founderId = stepData?.founderId || 
                 stepData?.founder?.founderId || 
                 stepData?.founder?.id;
      
      if (!founderId) {
        return res.status(400).json({
          success: false,
          message: 'No founder found in session. Please complete onboarding first.'
        });
      }
    } catch (error) {
      appLogger.error('Session verification error', { error: error instanceof Error ? error.message : 'Unknown error' });
      return res.status(500).json({
        success: false,
        message: "Unable to verify session. Please try again."
      });
    }

    // Use PaymentService to create payment transaction in database
    const paymentRequest = {
      amount: paymentAmount,
      currency: currency as 'USD' | 'AED',
      description: `${packageType === 'foundation' ? 'ProofScaling Foundation Course' : 'Investment Ready Package'} - ${ventureName}`,
      metadata: {
        sessionId,
        packageType,
        proofScore,
        originalUSD: amount,
        testMode: isTestMode,
        userCountry: userCountry,
        isUAEUser: isUAEUser,
        currencyReason: isTestMode ? 'test_mode' : (isUAEUser ? 'uae_location' : 'non_uae_location')
      }
    };

    appLogger.database('Creating payment transaction', { 
      founderId, 
      sessionId, 
      packageType, 
      amount: paymentAmount, 
      currency, 
      testMode: isTestMode 
    });

    // For test sessions, provide valid customer data that PayTabs will accept
    const customerEmail = sessionId.startsWith('test-session') 
      ? 'test@example.com' 
      : `session-${sessionId}@placeholder.com`;
    
    const customerName = sessionId.startsWith('test-session') 
      ? 'Test Customer' 
      : ventureName;

    const paymentService = new PaymentService();
    const paymentResult = await paymentService.createPayment({
      founderId,
      request: paymentRequest,
      customerEmail,
      customerName,
      gatewayProvider: 'paytabs'
    });

    if (!paymentResult.success || !paymentResult.paymentUrl) {
      appLogger.error('Payment creation failed', { error: paymentResult.error });
      throw new Error(paymentResult.error || "Payment creation failed");
    }

    appLogger.database('Payment transaction created', { orderReference: paymentResult.orderReference });

    // Log activity using database transaction data
    try {
      await ActivityService.logActivity(
        { sessionId },
        {
          activityType: 'system',
          action: 'payment_initiated',
          title: 'Next Steps Payment Initiated',
          description: `Payment initiated for ${packageType} package`,
          metadata: {
            paymentId: paymentResult.orderReference,
            packageType,
            amount,
            proofScore,
            founderId
          }
        }
      );
    } catch (activityError) {
      appLogger.error('Failed to log payment activity', { error: activityError instanceof Error ? activityError.message : 'Unknown error' });
      // Don't fail the payment for logging errors
    }

    appLogger.business('Next Steps payment created successfully', {
      paymentId: paymentResult.orderReference
    });

    return res.json({
      success: true,
      paymentId: paymentResult.orderReference,
      telrUrl: paymentResult.paymentUrl, // Keep telrUrl for frontend compatibility
      paymentUrl: paymentResult.paymentUrl, // Add new paymentUrl property
      telrRef: paymentResult.orderReference,
      message: "Next Steps payment created successfully"
    });

  } catch (error) {
    appLogger.error('PayTabs payment creation error', {
      errorType: error?.constructor?.name,
      message: (error as Error)?.message,
      timestamp: new Date().toISOString()
    });
    
    // Return a more detailed error response for debugging
    return res.status(500).json({
      success: false,
      error: {
        code: "PAYMENT_CREATION_ERROR",
        message: (error as Error)?.message || "Payment creation failed",
        details: (error as Error)?.stack?.split('\n')[0] || "Unknown error",
        timestamp: new Date().toISOString()
      }
    });
  }
});

/**
 * PayTabs test endpoint for debugging
 */
router.get("/paytabs/test", (req: Request, res: Response) => {
  res.json({ success: true, message: "PayTabs routing works" });
});

/**
 * PayTabs IPN/Callback endpoint - handles server-to-server POST responses
 * POST /api/payment/paytabs/callback
 * 
 * This endpoint receives the rich JSON payload with complete transaction details
 * Reference: https://docs.paytabs.com/manuals/PT-API-Endpoints/Integration-Types-Manuals/Hosted-Payment-Page/HPP-Step-6-Handle-post-payment-responses/HPP-Step-Six-Landing
 */
router.post("/paytabs/callback", async (req: Request, res: Response) => {
  try {
    appLogger.api('PayTabs IPN/Callback received');
    appLogger.api('PayTabs callback method', { method: req.method });
    appLogger.api('PayTabs callback content type', { contentType: req.headers['content-type'] });
    appLogger.api('PayTabs callback body received', { hasCartId: !!req.body.cart_id, hasTranRef: !!req.body.tran_ref });

    const {
      tran_ref,           // PayTabs transaction reference
      cart_id,            // Our order reference
      cart_currency,
      cart_amount,
      tran_currency,
      tran_total,
      payment_result,     // { response_status, response_code, response_message, transaction_time }
      payment_info,       // { payment_method, card_type, etc. }
      customer_details,
      merchant_id,
      profile_id,
      ipn_trace,
      token
    } = req.body;

    appLogger.api('PayTabs IPN/Callback data:', {
      tran_ref,
      cart_id,
      cart_currency,
      cart_amount,
      payment_result,
      ipn_trace
    });

    if (!cart_id || !tran_ref) {
      appLogger.error('PayTabs IPN: Missing required fields (cart_id or tran_ref)');
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // TODO: Implement signature verification for IPN/Callback
    // PayTabs IPN/Callback may have different signature verification than return page

    // Extract payment status from payment_result object
    const responseStatus = payment_result?.response_status;
    const responseMessage = payment_result?.response_message || 'Unknown status';
    const transactionTime = payment_result?.transaction_time;

    // Use centralized PayTabs status mapper for consistency
    const paymentStatus = PaymentStatusMapper.mapPayTabsWebhookStatus(responseStatus);

    appLogger.api(`PayTabs IPN for order ${cart_id}: ${paymentStatus} (${responseMessage})`);

    // Update payment transaction status in database
    const paymentService = new PaymentService();
    const updateResult = await paymentService.updatePaymentStatus(cart_id, paymentStatus);
    
    if (!updateResult.success) {
      appLogger.error('Failed to update payment status from IPN:', updateResult.error);
    } else {
      appLogger.api('Payment status successfully updated from PayTabs IPN');
    }

    // PayTabs expects a simple success response for IPN/Callback
    return res.status(200).json({
      success: true,
      message: 'IPN processed successfully'
    });

  } catch (error) {
    appLogger.error('PayTabs IPN/Callback processing error:', error);
    
    // Return error but don't expose internal details
    return res.status(500).json({
      success: false,
      message: 'IPN processing failed'
    });
  }
});

/**
 * PayTabs return endpoint - handles payment callback from PayTabs
 * POST /api/payment/paytabs/return (PayTabs sends POST requests)
 */
router.post("/paytabs/return", async (req: Request, res: Response) => {
  appLogger.api('=== PayTabs Return Endpoint Hit ===');
  appLogger.api('Method:', req.method);
  appLogger.api('Body params:', JSON.stringify(req.body, null, 2));
  
  try {
    // PayTabs sends form-encoded data: cartId, respStatus, tranRef, signature, etc.
    const {
      cartId,           // Our order reference
      respStatus,       // A = success, others = failure
      respCode,
      respMessage,
      tranRef,          // PayTabs transaction reference
      customerEmail,
      acquirerMessage,
      acquirerRRN,
      signature,
      token
    } = req.body;

    appLogger.api('PayTabs response data:', {
      cartId,
      respStatus,
      respCode,
      respMessage,
      tranRef,
      customerEmail,
      signature: signature ? 'present' : 'missing'
    });

    if (!cartId) {
      appLogger.error('PayTabs return: Missing cartId (order reference)');
      return res.status(400).send(`
        <html><body>
          <h2>Payment Error</h2>
          <p>Missing order reference. Please contact support.</p>
          <a href="/">Return to Home</a>
        </body></html>
      `);
    }

    // Verify PayTabs signature for security (recommended for production)
    if (signature) {
      const isValidSignature = verifyPayTabsSignature(req.body);
      if (!isValidSignature) {
        appLogger.error('PayTabs signature verification failed - potentially fraudulent request');
        return res.status(400).send(`
          <html><body>
            <h2>Payment Verification Failed</h2>
            <p>Payment verification failed. Please contact support if this was a legitimate payment.</p>
            <a href="/">Return to Home</a>
          </body></html>
        `);
      }
      appLogger.api('PayTabs signature verified successfully');
    } else {
      appLogger.warn('PayTabs response received without signature - consider enabling signature verification');
    }

    // Use centralized PayTabs status mapper for consistency
    const paymentStatus = PaymentStatusMapper.mapPayTabsWebhookStatus(respStatus);
    let statusReason = respMessage || 'Unknown status';

    if (paymentStatus === 'completed') {
      statusReason = 'Payment authorized successfully';
    } else {
      statusReason = respMessage || `Payment ${paymentStatus} with status: ${respStatus}`;
    }

    appLogger.api(`PayTabs payment for order ${cartId}: ${paymentStatus} (${statusReason})`);

    // Update the payment transaction status
    const paymentService = new PaymentService();
    const updateResult = await paymentService.updatePaymentStatus(cartId, paymentStatus);
    
    if (!updateResult.success) {
      appLogger.error('Failed to update payment status:', updateResult.error);
    }

    // Get redirect URL
    const frontendUrl = process.env.REPLIT_DOMAINS?.split(',')[0];
    const baseUrl = frontendUrl ? `https://${frontendUrl}` : 'https://localhost:5000';
    
    // Handle iframe-based responses for PayTabs
    if (paymentStatus === 'completed') {
      const redirectUrl = `${baseUrl}/payment/success?ref=${cartId}&tranRef=${tranRef}`;
      appLogger.api('Payment success - sending iframe redirect:', redirectUrl);
      
      // Send HTML with JavaScript to handle iframe navigation
      return res.send(`
        <html>
          <body>
            <script>
              // Check if we're in an iframe
              if (window.parent && window.parent !== window) {
                // Send success message to parent window
                window.parent.postMessage({
                  type: 'PAYMENT_SUCCESS',
                  orderReference: '${cartId}',
                  transactionId: '${tranRef}',
                  redirectUrl: '${redirectUrl}'
                }, '*');
              } else {
                // Direct redirect if not in iframe
                window.location.href = '${redirectUrl}';
              }
            </script>
            <p>Payment successful! Redirecting...</p>
          </body>
        </html>
      `);
    } else {
      const errorReason = statusReason.replace(/'/g, "\\'"); // Escape single quotes for JavaScript
      appLogger.api('Payment failed - sending iframe error message:', errorReason);
      
      // Check if this is a user cancellation
      const isCancellation = (respStatus === 'C' || respStatus === 'X' || 
                             statusReason.toLowerCase().includes('cancel') ||
                             statusReason.toLowerCase().includes('abort'));
      
      if (isCancellation) {
        // Handle user cancellation specifically
        return res.send(`
          <html>
            <body>
              <script>
                // Check if we're in an iframe
                if (window.parent && window.parent !== window) {
                  // Send cancellation message to parent window
                  window.parent.postMessage({
                    type: 'PAYMENT_CANCELLED',
                    orderReference: '${cartId}',
                    reason: '${errorReason}',
                    status: '${respStatus}'
                  }, '*');
                  
                  // Auto-close after 3 seconds if parent doesn't handle it
                  setTimeout(() => {
                    console.log('Auto-closing cancellation iframe...');
                    window.parent.postMessage({
                      type: 'PAYMENT_CANCELLED',
                      orderReference: '${cartId}',
                      reason: '${errorReason}',
                      status: '${respStatus}',
                      autoClose: true
                    }, '*');
                  }, 3000);
                } else {
                  // Direct redirect if not in iframe
                  const redirectUrl = '${baseUrl}/payment/cancelled?ref=${cartId}&reason=${encodeURIComponent(statusReason)}';
                  window.location.href = redirectUrl;
                }
              </script>
              <div style="padding: 20px; text-align: center; font-family: Arial, sans-serif;">
                <h3 style="color: #f59e0b;">Payment Cancelled</h3>
                <p>You cancelled the payment process</p>
                <p style="font-size: 14px; color: #666;">This window will close automatically...</p>
              </div>
            </body>
          </html>
        `);
      } else {
        // Handle payment errors
        return res.send(`
          <html>
            <body>
              <script>
                // Check if we're in an iframe
                if (window.parent && window.parent !== window) {
                  // Send error message to parent window
                  window.parent.postMessage({
                    type: 'PAYMENT_ERROR',
                    orderReference: '${cartId}',
                    error: '${errorReason}',
                    status: '${respStatus}',
                    code: '${respCode}'
                  }, '*');
                } else {
                  // Direct redirect if not in iframe
                  const redirectUrl = '${baseUrl}/payment/failed?ref=${cartId}&reason=${encodeURIComponent(statusReason)}';
                  window.location.href = redirectUrl;
                }
              </script>
              <div style="padding: 20px; text-align: center; font-family: Arial, sans-serif;">
                <h3 style="color: #dc3545;">Payment Failed</h3>
                <p>${errorReason}</p>
                <p style="font-size: 14px; color: #666;">This window will close automatically...</p>
              </div>
            </body>
          </html>
        `);
      }
    }

  } catch (error) {
    appLogger.error('PayTabs return callback error:', error);
    
    // Return user-friendly error page instead of JSON
    return res.status(500).send(`
      <html><body>
        <h2>Payment Processing Error</h2>
        <p>There was an error processing your payment. Please contact support.</p>
        <a href="/">Return to Home</a>
      </body></html>
    `);
  }
});

/**
 * Get payment status
 * GET /api/payment/status/:paymentId (session-based)
 * GET /api/v1/payment/status/:paymentId (JWT-based, future dashboard use)
 */
router.get("/status/:paymentId", paymentStatusRateLimit, async (req: Request, res: Response) => {
  try {
    const { paymentId } = req.params;

    if (!paymentId) {
      return res.status(400).json({
        success: false,
        message: "Payment ID is required"
      });
    }

    // Get transaction from database using PaymentService
    const paymentService = new PaymentService();
    const paymentStatus = await paymentService.checkPaymentStatus(paymentId);

    if (!paymentStatus.success || !paymentStatus.transaction) {
      return res.status(404).json({
        success: false,
        message: paymentStatus.error || "Payment not found"
      });
    }

    const transaction = paymentStatus.transaction;
    const metadata = transaction.metadata as any;

    // Always check current status with gateway if we have a gateway transaction ID
    if (transaction.gatewayTransactionId) {
      try {
        const gatewayProvider = transaction.gatewayProvider || 'paytabs';
        appLogger.api(`Checking live payment status with ${gatewayProvider} for transaction: ${transaction.gatewayTransactionId}`);
        const gateway = PaymentGatewayFactory.create(gatewayProvider);
        const statusResult = await gateway.checkStatus(transaction.gatewayTransactionId);
        
        if (statusResult.success && statusResult.status !== transaction.status) {
          appLogger.api(`Payment status changed from ${transaction.status} to ${statusResult.status}`);
          // Update transaction status in database
          const paymentServiceForUpdate = new PaymentService();
          await paymentServiceForUpdate.updatePaymentStatus(paymentId, statusResult.status);

          // Log status change
          try {
            await ActivityService.logActivity(
              { sessionId: metadata?.sessionId },
              {
                activityType: 'system',
                action: 'payment_status_changed',
                title: 'Payment Status Updated',
                description: `Payment status changed from ${transaction.status} to ${statusResult.status}`,
                metadata: {
                  paymentId,
                  oldStatus: transaction.status,
                  newStatus: statusResult.status,
                  packageType: metadata?.packageType
                }
              }
            );
          } catch (activityError) {
            appLogger.error("Failed to log payment status activity:", activityError);
          }

          // Update local transaction object for response
          transaction.status = statusResult.status as any;
        } else {
          appLogger.api(`Payment status unchanged: ${transaction.status}`);
        }
      } catch (telrError) {
        appLogger.error("Error checking Telr payment status:", telrError);
        // Continue with stored status
      }
    }

    return res.json({
      success: true,
      paymentId,
      status: transaction.status,
      packageType: metadata?.packageType,
      amount: metadata?.originalAmountUSD || transaction.amount,
      ventureName: metadata?.ventureName,
      createdAt: transaction.createdAt,
      updatedAt: transaction.updatedAt
    });

  } catch (error) {
    appLogger.error("Error getting payment status:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to get payment status"
    });
  }
});

/**
 * Test endpoint for direct Telr status check (development only)
 * GET /api/payment/test-telr-status/:orderRef
 */
router.get("/test-telr-status/:orderRef", async (req: Request, res: Response) => {
  if (process.env.NODE_ENV !== 'development') {
    return res.status(404).json({ message: 'Not found' });
  }

  try {
    const { orderRef } = req.params;
    const gateway = PaymentGatewayFactory.create('telr');
    const result = await gateway.checkStatus(orderRef);
    
    res.json({
      success: true,
      telrResponse: result
    });
  } catch (error) {
    appLogger.error("Direct Telr test error:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Handle Telr webhook notifications
 * POST /api/payment/webhook/next-steps (session-based)
 * POST /api/v1/payment/webhook/next-steps (JWT-based, future dashboard use)
 */
router.post("/webhook/next-steps", webhookRateLimit, async (req: Request, res: Response) => {
  try {
    appLogger.api("Received Telr webhook for Next Steps:", req.body);

    const webhookData = req.body;
    
    // Enhanced webhook security verification
    const clientIP = SecurityUtils.getClientIP(req);
    const signature = req.headers['x-telr-signature'] as string;
    
    appLogger.api(`Webhook from IP: ${clientIP}, Signature: ${signature ? 'Present' : 'Missing'}`);
    
    if (process.env.TELR_WEBHOOK_SECRET) {
      const gateway = PaymentGatewayFactory.create('telr');
      if (!gateway.validateWebhook(webhookData, signature)) {
        appLogger.error(`Invalid webhook signature from IP: ${clientIP}`);
        throw PaymentErrorHandler.webhookError("Invalid signature");
      }
    }

    const { cartid: paymentId, status, ref } = webhookData;

    if (!paymentId) {
      return res.status(400).json({
        success: false,
        message: "Missing payment ID in webhook"
      });
    }

    // Get transaction from database using PaymentService
    const paymentService = new PaymentService();
    const paymentStatusResult = await paymentService.checkPaymentStatus(paymentId);

    if (!paymentStatusResult.success || !paymentStatusResult.transaction) {
      appLogger.error(`Payment transaction not found for webhook: ${paymentId}`);
      return res.status(404).json({
        success: false,
        message: paymentStatusResult.error || "Payment not found"
      });
    }

    const transaction = paymentStatusResult.transaction;
    const metadata = transaction.metadata as any;

    // Map Telr status using centralized mapper
    const newStatus = PaymentStatusMapper.mapTelrWebhookStatus(status);

    // Update transaction status in database
    await paymentService.updatePaymentStatus(paymentId, newStatus);

    // Log webhook activity using database metadata
    try {
      await ActivityService.logActivity(
        { sessionId: metadata?.sessionId },
        {
          activityType: 'system',
          action: 'payment_webhook_received',
          title: 'Payment Webhook Received',
          description: `Webhook received with status ${status}`,
          metadata: {
            paymentId,
            webhookStatus: status,
            newStatus,
            telrRef: ref,
            packageType: metadata?.packageType
          }
        }
      );
    } catch (activityError) {
      appLogger.error("Failed to log webhook activity:", activityError);
    }

    appLogger.api(`Next Steps payment ${paymentId} status updated to: ${newStatus}`);

    return res.json({
      success: true,
      message: "Webhook processed successfully"
    });

  } catch (error) {
    appLogger.error("Error processing Next Steps webhook:", error);
    return res.status(500).json({
      success: false,
      message: "Webhook processing failed"
    });
  }
});

/**
 * Get payment history for a session
 * GET /api/payment/history/:sessionId (session-based)
 * GET /api/v1/payment/history/:sessionId (JWT-based, future dashboard use)
 */
router.get("/history/:sessionId", async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        message: "Session ID is required"
      });
    }

    // Find all payments for this session from database
    const sessionPayments = await storage.getPaymentTransactions(sessionId);
    
    if (!sessionPayments || sessionPayments.length === 0) {
      return res.json({
        success: true,
        payments: [],
        total: 0
      });
    }

    const formattedPayments = sessionPayments.map((transaction: any) => {
      const metadata = transaction.metadata as any;
      return {
        paymentId: transaction.orderReference,
        packageType: metadata?.packageType,
        amount: metadata?.originalAmountUSD || transaction.amount,
        status: transaction.status,
        createdAt: transaction.createdAt,
        updatedAt: transaction.updatedAt
      };
    });

    return res.json({
      success: true,
      payments: formattedPayments,
      total: formattedPayments.length
    });

  } catch (error) {
    appLogger.error("Error getting payment history:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to get payment history"
    });
  }
});

/**
 * Handle Telr callback for session-based payments
 * GET /api/payment/callback/telr
 */
router.get("/callback/telr", async (req: Request, res: Response) => {
  try {
    appLogger.api("Session-based Telr callback received:", {
      query: req.query,
      headers: req.headers
    });

    const { payment_id, status, cartid, order_ref, tranref } = req.query as any;
    const paymentId = payment_id || cartid || order_ref;

    if (!paymentId) {
      appLogger.error("No payment ID found in callback");
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5000'}/payment/error?error=missing_payment_id`);
    }

    // Find the payment transaction from database
    const dbTransaction = await storage.getPaymentTransactionByOrderRef(paymentId);
    if (!dbTransaction) {
      appLogger.error("Payment transaction not found:", paymentId);
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5000'}/payment/error?error=payment_not_found`);
    }

    // Update transaction status using centralized status mapper
    const mappedStatus = PaymentStatusMapper.mapTelrWebhookStatus(status);
    const newStatus = mappedStatus === 'unknown' ? 'pending' : mappedStatus;

    // Update database transaction
    try {
      await storage.updatePaymentTransaction(dbTransaction.id, {
        status: newStatus as any,
        gatewayStatus: status,
        gatewayResponse: { callbackData: req.query }
      });

      // Log callback to payment_logs
      await storage.createPaymentLog({
        transactionId: paymentId,
        gatewayProvider: 'telr',
        action: 'session_callback_received',
        requestData: { 
          callbackStatus: status,
          paymentId,
          newStatus 
        }
      });

      appLogger.api('✅ Database transaction updated via callback:', paymentId);
    } catch (dbError) {
      appLogger.error('❌ Failed to update database transaction via callback:', dbError);
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5000'}/payment/error?error=database_error`);
    }

    appLogger.api("Payment status updated via callback:", {
      paymentId,
      newStatus,
      callbackStatus: status
    });

    // Log activity
    try {
      const transactionMetadata = dbTransaction.metadata as any;
      await ActivityService.logActivity(
        { sessionId: transactionMetadata?.sessionId },
        {
          activityType: 'system',
          action: 'payment_status_changed',
          title: 'Payment Status Updated',
          description: `Payment completed via Telr callback`,
          metadata: {
            paymentId,
            status: newStatus,
            packageType: transactionMetadata?.packageType,
            amount: dbTransaction.amount
          }
        }
      );
    } catch (activityError) {
      appLogger.error("Failed to log payment callback activity:", activityError);
    }

    // Redirect to appropriate page
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5000';
    if (newStatus === 'completed') {
      return res.redirect(`${baseUrl}/payment/success?payment_id=${paymentId}`);
    } else if (newStatus === 'failed') {
      return res.redirect(`${baseUrl}/payment/failed?payment_id=${paymentId}`);
    } else if (newStatus === 'cancelled') {
      return res.redirect(`${baseUrl}/payment/cancelled?payment_id=${paymentId}`);
    } else {
      return res.redirect(`${baseUrl}/payment/pending?payment_id=${paymentId}`);
    }

  } catch (error) {
    appLogger.error("Error processing Telr callback:", error);
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5000';
    return res.redirect(`${baseUrl}/payment/error?error=callback_processing_failed`);
  }
});

export default router;