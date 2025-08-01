import { Router, type Request, type Response } from "express";
import { PaymentGatewayFactory, type PaymentOrderData } from "../lib/payment-gateway";
import { ActivityService } from "../services/activity-service";
import { onboardingService } from "../services/onboarding-service";

const router = Router();

interface NextStepsPaymentRequest {
  sessionId: string;
  ventureName: string;
  proofScore: number;
  amount: number;
  packageType: 'foundation' | 'investment_ready';
}

type PaymentStatus = 'pending' | 'completed' | 'failed' | 'cancelled' | 'expired';

interface PaymentTransaction {
  paymentId: string;
  sessionId: string;
  ventureName: string;
  proofScore: number;
  amount: number;
  packageType: 'foundation' | 'investment_ready';
  status: PaymentStatus;
  telrRef?: string;
  telrUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

// In-memory storage for payment transactions (in production, use database)
const paymentTransactions = new Map<string, PaymentTransaction>();

/**
 * Create a payment for Next Steps packages
 * POST /api/v1/payment/create-next-steps
 * Uses session-based validation (no JWT token required) for onboarding flow
 */
router.post("/create-next-steps", async (req: Request, res: Response) => {
  try {
    const { sessionId, ventureName, proofScore, amount, packageType }: NextStepsPaymentRequest = req.body;

    // Validate request
    if (!sessionId || !ventureName || typeof proofScore !== 'number' || !amount || !packageType) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: sessionId, ventureName, proofScore, amount, packageType"
      });
    }

    // Validate session exists (session-based validation instead of JWT)
    const session = await onboardingService.getSession(sessionId);
    if (!session) {
      return res.status(401).json({
        success: false,
        message: "Invalid session. Please complete onboarding first."
      });
    }

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

    // Generate payment ID
    const paymentId = `payment_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    
    // Prepare payment order data
    const orderData: PaymentOrderData = {
      orderId: paymentId,
      amount: amount,
      currency: "USD",
      description: `${packageType === 'foundation' ? 'ProofScaling Foundation Course' : 'Investment Ready Package'} - ${ventureName}`,
      returnUrls: {
        authorised: `${process.env.FRONTEND_URL || 'http://localhost:5000'}/payment/success?payment_id=${paymentId}`,
        declined: `${process.env.FRONTEND_URL || 'http://localhost:5000'}/payment/failed?payment_id=${paymentId}`,
        cancelled: `${process.env.FRONTEND_URL || 'http://localhost:5000'}/payment/cancelled?payment_id=${paymentId}`,
      },
      metadata: {
        sessionId,
        packageType,
        proofScore
      }
    };

    // Create payment with Telr
    console.log("Creating Telr payment for Next Steps:", {
      paymentId,
      sessionId,
      ventureName,
      packageType,
      amount
    });

    const gateway = PaymentGatewayFactory.create('telr');
    const telrResponse = await gateway.createOrder(orderData);

    if (!telrResponse.success) {
      throw new Error(`Telr payment creation failed: ${telrResponse.gatewayResponse?.error?.message || 'Unknown error'}`);
    }

    // Store payment transaction
    const transaction: PaymentTransaction = {
      paymentId,
      sessionId,
      ventureName,
      proofScore,
      amount,
      packageType,
      status: 'pending',
      telrRef: telrResponse.orderReference,
      telrUrl: telrResponse.paymentUrl,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    paymentTransactions.set(paymentId, transaction);

    // Log activity
    try {
      await ActivityService.logActivity(
        { sessionId },
        {
          activityType: 'system',
          action: 'payment_initiated',
          title: 'Next Steps Payment Initiated',
          description: `Payment initiated for ${packageType} package`,
          metadata: {
            paymentId,
            packageType,
            amount,
            proofScore
          }
        }
      );
    } catch (activityError) {
      console.error("Failed to log payment activity:", activityError);
      // Don't fail the payment for logging errors
    }

    console.log("Next Steps payment created successfully:", {
      paymentId,
      telrUrl: telrResponse.paymentUrl
    });

    return res.json({
      success: true,
      paymentId,
      telrUrl: telrResponse.paymentUrl,
      telrRef: telrResponse.orderReference,
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
 * GET /api/v1/payment/status/:paymentId
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

    const transaction = paymentTransactions.get(paymentId);

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: "Payment not found"
      });
    }

    // Check status with Telr if still pending
    if (transaction.status === 'pending' && transaction.telrRef) {
      try {
        const gateway = PaymentGatewayFactory.create('telr');
        const statusResult = await gateway.checkStatus(transaction.telrRef);
        
        if (statusResult.success && statusResult.status !== 'pending') {
          // Update transaction status
          transaction.status = statusResult.status;
          transaction.updatedAt = new Date();
          paymentTransactions.set(paymentId, transaction);

          // Log status change
          try {
            await ActivityService.logActivity(
              { sessionId: transaction.sessionId },
              {
                activityType: 'system',
                action: 'payment_status_changed',
                title: 'Payment Status Updated',
                description: `Payment status changed to ${statusResult.status}`,
                metadata: {
                  paymentId,
                  newStatus: statusResult.status,
                  packageType: transaction.packageType
                }
              }
            );
          } catch (activityError) {
            console.error("Failed to log payment status activity:", activityError);
          }
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
      packageType: transaction.packageType,
      amount: transaction.amount,
      ventureName: transaction.ventureName,
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
 * POST /api/v1/payment/webhook/next-steps
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

    const transaction = paymentTransactions.get(paymentId);

    if (!transaction) {
      console.error(`Payment transaction not found for webhook: ${paymentId}`);
      return res.status(404).json({
        success: false,
        message: "Payment not found"
      });
    }

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

    // Update transaction
    transaction.status = newStatus;
    transaction.telrRef = ref || transaction.telrRef;
    transaction.updatedAt = new Date();
    paymentTransactions.set(paymentId, transaction);

    // Log webhook activity
    try {
      await ActivityService.logActivity(
        { sessionId: transaction.sessionId },
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
            packageType: transaction.packageType
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
 * GET /api/v1/payment/history/:sessionId
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

    // Find all payments for this session
    const sessionPayments = Array.from(paymentTransactions.values())
      .filter(transaction => transaction.sessionId === sessionId)
      .map(transaction => ({
        paymentId: transaction.paymentId,
        packageType: transaction.packageType,
        amount: transaction.amount,
        status: transaction.status,
        createdAt: transaction.createdAt,
        updatedAt: transaction.updatedAt
      }))
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return res.json({
      success: true,
      payments: sessionPayments,
      total: sessionPayments.length
    });

  } catch (error) {
    console.error("Error getting payment history:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to get payment history"
    });
  }
});

export default router;