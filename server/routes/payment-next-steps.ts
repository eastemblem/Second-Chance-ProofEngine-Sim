import { Router, type Request, type Response } from "express";
import { PaymentGatewayFactory, type PaymentOrderData } from "../lib/payment-gateway";
import { ActivityService } from "../services/activity-service";
import { OnboardingService } from "../services/onboarding-service";
import { PaymentService } from "../services/payment-service";
import { storage } from "../storage";

const router = Router();

interface NextStepsPaymentRequest {
  sessionId: string;
  ventureName: string;
  proofScore: number;
  amount: number;
  packageType: 'foundation' | 'investment_ready';
}

type PaymentStatus = 'pending' | 'completed' | 'failed' | 'cancelled' | 'expired';

// Interface removed - using database PaymentTransaction from shared schema

// Initialize payment service for database integration
const paymentService = new PaymentService();

/**
 * Create a payment for Next Steps packages
 * POST /api/payment/create-next-steps (session-based)
 * POST /api/v1/payment/create-next-steps (JWT-based, future dashboard use)
 */
router.post("/create-next-steps-session", async (req: Request, res: Response) => {
  try {
    const { sessionId, ventureName, proofScore, amount, packageType }: NextStepsPaymentRequest = req.body;

    // Validate request
    if (!sessionId || !ventureName || typeof proofScore !== 'number' || !amount || !packageType) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: sessionId, ventureName, proofScore, amount, packageType"
      });
    }

    // Convert USD to AED for Telr (approximate conversion: $100 USD = 367 AED)
    const aedAmount = Math.round(amount * 3.67); // USD to AED conversion
    
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

    // TEMP: Skip session verification for manual testing
    if (sessionId.startsWith('test-session')) {
      console.log("🧪 TEST MODE: Skipping session verification for test session");
    } else {
      // Verify session exists
      try {
        const onboardingService = new OnboardingService();
        const sessionData = await onboardingService.getSession(sessionId);
        if (!sessionData) {
          return res.status(404).json({
            success: false,
            message: "Session not found. Please complete the onboarding process first."
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

    // Get or create session founder for database integration
    let founderId: string;
    try {
      // Try to get existing session first, but handle non-UUID session IDs gracefully
      let sessionFounderId: string | null = null;
      
      // Only try to get session if it's a valid UUID format
      if (sessionId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
        try {
          const onboardingService = new OnboardingService();
          const session = await onboardingService.getSession(sessionId);
          sessionFounderId = session?.stepData?.founder?.id || null;
        } catch (sessionError) {
          console.log('Session not found, proceeding with temporary founder creation');
        }
      } else {
        console.log('Non-UUID sessionId detected, proceeding with temporary founder creation');
      }

      if (sessionFounderId) {
        founderId = sessionFounderId;
        console.log('✅ Using existing founder from session:', founderId);
      } else {
        // Create a temporary founder for session-based payments
        const tempFounder = await storage.createFounder({
          firstName: 'Session',
          lastName: 'User',
          fullName: `Session User - ${ventureName}`,
          email: `session-${Date.now()}@placeholder.com`,
          positionRole: 'Session Payment User'
        });
        founderId = tempFounder.founderId;
        console.log('✅ Created temporary founder for session payment:', founderId);
        
        if (!founderId) {
          throw new Error('Failed to create temporary founder - no ID returned');
        }
      }
    } catch (error) {
      console.error('❌ Failed to get/create founder for session:', error);
      throw new Error('Unable to process payment - session setup failed');
    }

    // Use PaymentService to create payment transaction in database
    const paymentRequest = {
      amount: aedAmount,
      currency: 'AED' as const,
      description: `${packageType === 'foundation' ? 'ProofScaling Foundation Course' : 'Investment Ready Package'} - ${ventureName}`,
      metadata: {
        sessionId,
        packageType,
        proofScore,
        originalUSD: amount
      }
    };

    console.log("Creating database payment transaction:", {
      founderId,
      sessionId,
      ventureName,
      packageType,
      amount: aedAmount,
      currency: 'AED'
    });

    const paymentResult = await paymentService.createPayment({
      founderId,
      request: paymentRequest,
      customerEmail: `session-${sessionId}@placeholder.com`,
      customerName: ventureName,
      gatewayProvider: 'telr'
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
      telrUrl: paymentResult.paymentUrl
    });

    return res.json({
      success: true,
      paymentId: paymentResult.orderReference,
      telrUrl: paymentResult.paymentUrl,
      telrRef: paymentResult.orderReference,
      message: "Payment created successfully"
    });

  } catch (error) {
    console.error("Error creating Next Steps payment:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create payment. Please try again."
    });
  }
});

/**
 * Get payment status
 * GET /api/payment/status/:paymentId (session-based)
 * GET /api/v1/payment/status/:paymentId (JWT-based, future dashboard use)
 */
router.get("/status/:paymentId", async (req: Request, res: Response) => {
  try {
    const { paymentId } = req.params;

    if (!paymentId) {
      return res.status(400).json({
        success: false,
        message: "Payment ID is required"
      });
    }

    // Get transaction from database using PaymentService
    const paymentStatus = await paymentService.getPaymentStatus(paymentId);

    if (!paymentStatus.success || !paymentStatus.transaction) {
      return res.status(404).json({
        success: false,
        message: paymentStatus.error || "Payment not found"
      });
    }

    const transaction = paymentStatus.transaction;
    const metadata = transaction.metadata as any;

    // Check status with Telr if still pending
    if (transaction.status === 'pending' && transaction.gatewayTransactionId) {
      try {
        const gateway = PaymentGatewayFactory.create('telr');
        const statusResult = await gateway.checkStatus(transaction.gatewayTransactionId);
        
        if (statusResult.success && statusResult.status !== 'pending') {
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
                description: `Payment status changed to ${statusResult.status}`,
                metadata: {
                  paymentId,
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
 * Handle Telr webhook notifications
 * POST /api/payment/webhook/next-steps (session-based)
 * POST /api/v1/payment/webhook/next-steps (JWT-based, future dashboard use)
 */
router.post("/webhook/next-steps", async (req: Request, res: Response) => {
  try {
    console.log("Received Telr webhook for Next Steps:", req.body);

    const webhookData = req.body;
    
    // Verify webhook signature (if configured)
    if (process.env.TELR_WEBHOOK_SECRET) {
      const signature = req.headers['x-telr-signature'] as string;
      const gateway = PaymentGatewayFactory.create('telr');
      if (!gateway.validateWebhook(webhookData, signature)) {
        console.error("Invalid webhook signature");
        return res.status(401).json({ success: false, message: "Invalid signature" });
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
    const paymentStatusResult = await paymentService.getPaymentStatus(paymentId);

    if (!paymentStatusResult.success || !paymentStatusResult.transaction) {
      console.error(`Payment transaction not found for webhook: ${paymentId}`);
      return res.status(404).json({
        success: false,
        message: paymentStatusResult.error || "Payment not found"
      });
    }

    const transaction = paymentStatusResult.transaction;
    const metadata = transaction.metadata as any;

    // Map Telr status to our status
    let newStatus: PaymentStatus = 'pending';
    switch (status?.toLowerCase()) {
      case 'authorised':
      case 'paid':
        newStatus = 'completed';
        break;
      case 'declined':
      case 'failed':
        newStatus = 'failed';
        break;
      case 'cancelled':
        newStatus = 'cancelled';
        break;
      default:
        newStatus = 'pending';
    }

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
    const sessionPayments = await paymentService.getPaymentsBySessionId(sessionId);
    
    if (!sessionPayments.success) {
      return res.status(500).json({
        success: false,
        message: sessionPayments.error || "Failed to retrieve payment history"
      });
    }

    const formattedPayments = sessionPayments.payments?.map(transaction => {
      const metadata = transaction.metadata as any;
      return {
        paymentId: transaction.orderReference,
        packageType: metadata?.packageType,
        amount: metadata?.originalAmountUSD || transaction.amount,
        status: transaction.status,
        createdAt: transaction.createdAt,
        updatedAt: transaction.updatedAt
      };
    }) || [];

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

    // Find the payment transaction
    const transaction = paymentTransactions.get(paymentId);
    if (!transaction) {
      console.error("Payment transaction not found:", paymentId);
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5000'}/payment/error?error=payment_not_found`);
    }

    // Update transaction status
    let newStatus: PaymentStatus = status === 'completed' ? 'completed' : 
                                   status === 'failed' ? 'failed' : 
                                   status === 'cancelled' ? 'cancelled' : 'pending';

    transaction.status = newStatus;
    transaction.updatedAt = new Date();
    paymentTransactions.set(paymentId, transaction);

    // Also update database if transaction exists there
    try {
      const dbTransaction = await storage.getPaymentTransactionByOrderRef(paymentId);
      if (dbTransaction) {
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
      }
    } catch (dbError) {
      console.error('❌ Failed to update database transaction via callback:', dbError);
      // Continue anyway - in-memory update succeeded
    }

    console.log("Payment status updated via callback:", {
      paymentId,
      newStatus,
      callbackStatus: status
    });

    // Log activity
    try {
      await ActivityService.logActivity(
        { sessionId: transaction.sessionId },
        {
          activityType: 'system',
          action: 'payment_status_changed',
          title: 'Payment Status Updated',
          description: `Payment completed via Telr callback`,
          metadata: {
            paymentId,
            status: newStatus,
            packageType: transaction.packageType,
            amount: transaction.amount
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