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

const router = Router();

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
    console.error('IP geolocation error:', error);
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
    const { sessionId, ventureName, proofScore, amount, packageType }: NextStepsPaymentRequest = req.body;

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
    
    console.log(`Payment currency decision: Country=${userCountry}, TestMode=${isTestMode}, UAEUser=${isUAEUser}, Currency=${currency}`);
    
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

    // TEMP: Handle test sessions with mock founder ID
    if (sessionId.startsWith('test-session')) {
      console.log("🧪 TEST MODE: Using mock founder ID for test session");
      founderId = '123e4567-e89b-12d3-a456-426614174000'; // Mock UUID for testing
    } else {
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
        console.error("Error verifying session:", error);
        return res.status(500).json({
          success: false,
          message: "Unable to verify session. Please try again."
        });
      }
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

    console.log("Creating database payment transaction:", {
      founderId,
      sessionId,
      ventureName,
      packageType,
      amount: paymentAmount,
      currency: currency,
      testMode: isTestMode,
      userCountry: userCountry,
      isUAEUser: isUAEUser,
      originalUSD: amount
    });

    const paymentResult = await paymentService.createPayment({
      founderId,
      request: paymentRequest,
      customerEmail: `session-${sessionId}@placeholder.com`,
      customerName: ventureName,
      gatewayProvider: 'paytabs'
    });

    if (!paymentResult.success || !paymentResult.paymentUrl) {
      console.error('Payment creation failed:', paymentResult.error);
      throw new Error(paymentResult.error || "Payment creation failed");
    }

    console.log('✅ Payment transaction created in database:', paymentResult.orderReference);

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
      console.error("Failed to log payment activity:", activityError);
      // Don't fail the payment for logging errors
    }

    console.log("Next Steps payment created successfully:", {
      paymentId: paymentResult.orderReference,
      paymentUrl: paymentResult.paymentUrl
    });

    return res.json({
      success: true,
      paymentId: paymentResult.orderReference,
      telrUrl: paymentResult.paymentUrl, // Keep telrUrl for frontend compatibility
      paymentUrl: paymentResult.paymentUrl, // Add new paymentUrl property
      telrRef: paymentResult.orderReference,
      message: "Payment created successfully"
    });

  } catch (error) {
    console.error("Error creating Next Steps payment:", error);
    PaymentErrorHandler.handleError(error, req, res, 'create-payment');
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
        console.log(`Checking live payment status with ${gatewayProvider} for transaction: ${transaction.gatewayTransactionId}`);
        const gateway = PaymentGatewayFactory.create(gatewayProvider);
        const statusResult = await gateway.checkStatus(transaction.gatewayTransactionId);
        
        if (statusResult.success && statusResult.status !== transaction.status) {
          console.log(`Payment status changed from ${transaction.status} to ${statusResult.status}`);
          // Update transaction status in database
          await paymentService.updatePaymentStatus(paymentId, statusResult.status);

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
            console.error("Failed to log payment status activity:", activityError);
          }

          // Update local transaction object for response
          transaction.status = statusResult.status;
        } else {
          console.log(`Payment status unchanged: ${transaction.status}`);
        }
      } catch (telrError) {
        console.error("Error checking Telr payment status:", telrError);
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
    console.error("Error getting payment status:", error);
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
    console.error("Direct Telr test error:", error);
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
    console.log("Received Telr webhook for Next Steps:", req.body);

    const webhookData = req.body;
    
    // Enhanced webhook security verification
    const clientIP = SecurityUtils.getClientIP(req);
    const signature = req.headers['x-telr-signature'] as string;
    
    console.log(`Webhook from IP: ${clientIP}, Signature: ${signature ? 'Present' : 'Missing'}`);
    
    if (process.env.TELR_WEBHOOK_SECRET) {
      const gateway = PaymentGatewayFactory.create('telr');
      if (!gateway.validateWebhook(webhookData, signature)) {
        console.error(`Invalid webhook signature from IP: ${clientIP}`);
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
    const paymentStatusResult = await paymentService.checkPaymentStatus(paymentId);

    if (!paymentStatusResult.success || !paymentStatusResult.transaction) {
      console.error(`Payment transaction not found for webhook: ${paymentId}`);
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
      console.error("Failed to log webhook activity:", activityError);
    }

    console.log(`Next Steps payment ${paymentId} status updated to: ${newStatus}`);

    return res.json({
      success: true,
      message: "Webhook processed successfully"
    });

  } catch (error) {
    console.error("Error processing Next Steps webhook:", error);
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
    console.error("Error getting payment history:", error);
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
    console.log("Session-based Telr callback received:", {
      query: req.query,
      headers: req.headers
    });

    const { payment_id, status, cartid, order_ref, tranref } = req.query as any;
    const paymentId = payment_id || cartid || order_ref;

    if (!paymentId) {
      console.error("No payment ID found in callback");
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5000'}/payment/error?error=missing_payment_id`);
    }

    // Find the payment transaction from database
    const dbTransaction = await storage.getPaymentTransactionByOrderRef(paymentId);
    if (!dbTransaction) {
      console.error("Payment transaction not found:", paymentId);
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5000'}/payment/error?error=payment_not_found`);
    }

    // Update transaction status using centralized status mapper
    const newStatus = PaymentStatusMapper.mapTelrWebhookStatus(status);

    // Update database transaction
    try {
      await storage.updatePaymentTransaction(dbTransaction.id, {
        status: newStatus,
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

      console.log('✅ Database transaction updated via callback:', paymentId);
    } catch (dbError) {
      console.error('❌ Failed to update database transaction via callback:', dbError);
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5000'}/payment/error?error=database_error`);
    }

    console.log("Payment status updated via callback:", {
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
      console.error("Failed to log payment callback activity:", activityError);
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
    console.error("Error processing Telr callback:", error);
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5000';
    return res.redirect(`${baseUrl}/payment/error?error=callback_processing_failed`);
  }
});

export default router;