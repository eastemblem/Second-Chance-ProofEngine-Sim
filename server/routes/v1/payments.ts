import { Router } from "express";
import { paymentService } from "../../services/payment-service.js";
import { createPaymentRequestSchema, checkPaymentStatusSchema } from "../../lib/payment-gateway.js";
import { authenticateToken, type AuthenticatedRequest } from "../../middleware/token-auth.js";
import { storage } from "../../storage.js";
import { eastEmblemAPI } from "../../eastemblem-api.js";
import { appLogger } from "../../utils/logger";

const router = Router();

// All payment routes require authentication
router.use(authenticateToken);

// Create a new payment order
router.post("/create", async (req: AuthenticatedRequest, res) => {
  try {
    const founderId = req.user?.founderId;
    if (!founderId) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    // Validate request body
    const validationResult = createPaymentRequestSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({ 
        error: "Invalid request data",
        details: validationResult.error.errors
      });
    }

    const paymentRequest = validationResult.data;
    
    // Get user info for payment (optional)
    const founder = await storage.getFounder(founderId);
    
    // Send payment initiation notification
    if (eastEmblemAPI.isConfigured() && founder) {
      try {
        const amount = paymentRequest.amount;
        const currency = paymentRequest.currency || 'USD';
        const description = paymentRequest.description || 'Deal Room Access';
        
        const initiationMessage = `\`Founder ID: ${founderId}\`
💳 **Payment Process Started**

**Founder:** ${founder.fullName} (${founder.email})
**Amount:** ${currency} ${amount}
**Description:** ${description}
**Gateway:** ${req.body.gatewayProvider || 'paytabs'}

⏳ **Status:** Payment initiation in progress...`;

        await eastEmblemAPI.sendSlackNotification(
          initiationMessage,
          "#notifications",
          founderId
        );
      } catch (notificationError) {
        appLogger.api('Payment initiation notification failed', { 
          founderId, 
          error: notificationError instanceof Error ? notificationError.message : 'Unknown error' 
        });
        // Don't fail the payment if notification fails
      }
    }
    
    // Create payment with service
    const result = await paymentService.createPayment({
      founderId,
      request: paymentRequest,
      customerEmail: founder?.email,
      customerName: founder?.fullName,
      gatewayProvider: req.body.gatewayProvider || 'paytabs'
    });

    if (!result.success) {
      appLogger.error("Payment creation failed", null, { 
        founderId, 
        error: result.error,
        service: "second-chance-api",
        category: "payment"
      });

      // Send payment creation failure notification
      if (eastEmblemAPI.isConfigured() && founder) {
        try {
          const amount = paymentRequest.amount;
          const currency = paymentRequest.currency || 'USD';
          
          const failureMessage = `\`Founder ID: ${founderId}\`
❌ **Payment Creation Failed**

**Founder:** ${founder.fullName} (${founder.email})
**Amount:** ${currency} ${amount}
**Error:** ${result.error || 'Unknown error'}

⚠️ **Status:** Payment gateway setup failed`;

          await eastEmblemAPI.sendSlackNotification(
            failureMessage,
            "#notifications",
            founderId
          );
        } catch (notificationError) {
          appLogger.api('Payment failure notification error', { 
            founderId, 
            error: notificationError instanceof Error ? notificationError.message : 'Unknown error' 
          });
        }
      }
      
      return res.status(400).json({ 
        error: result.error || "Failed to create payment"
      });
    }

    appLogger.business("Payment order created successfully", {
      founderId,
      orderReference: result.orderReference,
      service: "second-chance-api",
      category: "payment"
    });

    // Send payment creation success notification
    if (eastEmblemAPI.isConfigured() && founder) {
      try {
        const amount = paymentRequest.amount;
        const currency = paymentRequest.currency || 'USD';
        
        const successMessage = `\`Founder ID: ${founderId}\`
✅ **Payment Order Created**

**Founder:** ${founder.fullName} (${founder.email})
**Amount:** ${currency} ${amount}
**Order Reference:** ${result.orderReference}
**Gateway:** ${req.body.gatewayProvider || 'paytabs'}

🔄 **Status:** Redirecting to payment gateway...`;

        await eastEmblemAPI.sendSlackNotification(
          successMessage,
          "#notifications",
          founderId
        );
      } catch (notificationError) {
        appLogger.api('Payment creation success notification error', { 
          founderId, 
          error: notificationError instanceof Error ? notificationError.message : 'Unknown error' 
        });
      }
    }

    res.json({
      success: true,
      orderReference: result.orderReference,
      paymentUrl: result.paymentUrl
    });

  } catch (error) {
    appLogger.error("Payment creation error", null, { 
      error: error instanceof Error ? error.message : 'Unknown error',
      service: "second-chance-api",
      category: "payment"
    });
    
    res.status(500).json({ error: "Internal server error" });
  }
});

// Check payment status
router.get("/status/:orderReference", async (req: AuthenticatedRequest, res) => {
  try {
    const { orderReference } = req.params;
    const founderId = req.user?.founderId;
    
    if (!founderId) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    // Validate order reference
    const validationResult = checkPaymentStatusSchema.safeParse({ orderReference });
    if (!validationResult.success) {
      return res.status(400).json({ 
        error: "Invalid order reference",
        details: validationResult.error.errors
      });
    }

    const result = await paymentService.checkPaymentStatus(orderReference);
    
    if (!result.success) {
      return res.status(404).json({ 
        error: result.error || "Payment not found"
      });
    }

    // Ensure the payment belongs to the authenticated user
    if (result.transaction?.founderId !== founderId) {
      return res.status(403).json({ error: "Access denied" });
    }

    if (!result.transaction) {
      return res.status(404).json({ error: "Transaction not found" });
    }

    res.json({
      success: true,
      status: result.status,
      orderReference,
      transaction: {
        id: result.transaction.id,
        amount: result.transaction.amount,
        currency: result.transaction.currency,
        status: result.transaction.status,
        description: result.transaction.description,
        createdAt: result.transaction.createdAt,
        updatedAt: result.transaction.updatedAt
      }
    });

  } catch (error) {
    appLogger.error("Payment status check error", null, { 
      error: error instanceof Error ? error.message : 'Unknown error',
      orderReference: req.params.orderReference,
      service: "second-chance-api",
      category: "payment"
    });
    
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get user's payment history
router.get("/history", async (req: AuthenticatedRequest, res) => {
  try {
    const founderId = req.user?.founderId;
    if (!founderId) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    const transactions = await paymentService.getPaymentHistory(founderId);
    
    // Filter sensitive data from response
    const filteredTransactions = transactions.map(t => ({
      id: t.id,
      orderReference: t.orderReference,
      amount: t.amount,
      currency: t.currency,
      status: t.status,
      description: t.description,
      gatewayProvider: t.gatewayProvider,
      createdAt: t.createdAt,
      updatedAt: t.updatedAt
    }));

    res.json({
      success: true,
      transactions: filteredTransactions
    });

  } catch (error) {
    appLogger.error("Payment history error", null, { 
      error: error instanceof Error ? error.message : 'Unknown error',
      founderId: req.user?.founderId,
      service: "second-chance-api",
      category: "payment"
    });
    
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get user's subscriptions
router.get("/subscriptions", async (req: AuthenticatedRequest, res) => {
  try {
    const founderId = req.user?.founderId;
    if (!founderId) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    const subscriptions = await paymentService.getUserSubscriptions(founderId);
    
    // Filter sensitive data from response
    const filteredSubscriptions = subscriptions.map(s => ({
      id: s.id,
      planType: s.planType,
      status: s.status,
      gatewayProvider: s.gatewayProvider,
      startsAt: s.startsAt,
      expiresAt: s.expiresAt,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt
    }));

    res.json({
      success: true,
      subscriptions: filteredSubscriptions
    });

  } catch (error) {
    appLogger.error("Subscriptions fetch error", null, { 
      error: error instanceof Error ? error.message : 'Unknown error',
      founderId: req.user?.founderId,
      service: "second-chance-api",
      category: "payment"
    });
    
    res.status(500).json({ error: "Internal server error" });
  }
});

// Check if user has deal room access and get venture status
router.get("/deal-room-access", async (req: AuthenticatedRequest, res) => {
  try {
    const founderId = req.user?.founderId;
    if (!founderId) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    const hasAccess = await paymentService.hasDealRoomAccess(founderId);
    
    // Get venture status from database - fetch the founder's primary venture
    let ventureStatus = 'pending';
    try {
      const { databaseService } = await import('../../services/database-service.js');
      const ventures = await databaseService.getVenturesByFounderId(founderId);
      const primaryVenture = ventures[0]; // Get the latest/primary venture
      
      if (primaryVenture?.status) {
        ventureStatus = primaryVenture.status;
      }
    } catch (error) {
      appLogger.warn("Could not fetch venture status", { 
        founderId, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
    
    res.json({
      success: true,
      hasAccess,
      ventureStatus
    });

  } catch (error) {
    appLogger.error("Deal room access check error", null, { 
      error: error instanceof Error ? error.message : 'Unknown error',
      founderId: req.user?.founderId,
      service: "second-chance-api",
      category: "payment"
    });
    
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get user payment activities and analytics
router.get("/activities", async (req: AuthenticatedRequest, res) => {
  try {
    const founderId = req.user?.founderId;
    if (!founderId) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    // Get all payment-related activities for the user (limit to 50 most recent)
    const activities = await storage.getUserActivities(founderId, 50);

    // Get payment transaction history
    const transactions = await storage.getPaymentTransactions(founderId);
    
    // Get payment analytics
    const completedTransactions = transactions.filter((t: any) => t.status === 'completed');
    const analytics = {
      totalPayments: completedTransactions.length,
      totalAmount: completedTransactions.reduce((sum: number, t: any) => sum + t.amount, 0),
      pendingPayments: transactions.filter((t: any) => t.status === 'pending').length,
      failedPayments: transactions.filter((t: any) => t.status === 'failed').length,
      lastPaymentDate: completedTransactions
        .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]?.createdAt,
      paymentMethods: Array.from(new Set(transactions.map((t: any) => t.gatewayProvider)))
    };

    // Enhanced payment activity tracking - filter only payment-related activities
    const paymentActivities = activities.filter((activity: any) => 
      ['payment_initiated', 'payment_completed', 'payment_failed'].includes(activity.action)
    );
    
    const paymentEvents = paymentActivities.map((activity: any) => ({
      id: activity.activityId,
      timestamp: activity.createdAt,
      action: activity.action,
      title: activity.title,
      description: activity.description,
      metadata: activity.metadata,
      success: activity.action === 'payment_completed'
    }));

    res.json({
      success: true,
      data: {
        activities: paymentEvents,
        transactions: transactions.map((t: any) => ({
          id: t.id,
          orderReference: t.orderReference,
          amount: t.amount,
          currency: t.currency,
          status: t.status,
          description: t.description,
          gatewayProvider: t.gatewayProvider,
          createdAt: t.createdAt,
          metadata: t.metadata
        })),
        analytics
      }
    });

  } catch (error) {
    appLogger.error("Failed to get payment activities", null, { 
      founderId: req.user?.founderId, 
      error: error instanceof Error ? error.message : 'Unknown error',
      service: "second-chance-api",
      category: "payment"
    });
    
    res.status(500).json({ 
      error: "Failed to retrieve payment activities" 
    });
  }
});

// Cancel payment endpoint
router.post('/cancel/:orderRef', async (req: AuthenticatedRequest, res) => {
  try {
    const founderId = req.user?.founderId;
    if (!founderId) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    const { orderRef } = req.params;
    
    appLogger.business("Payment cancellation requested", {
      founderId,
      orderRef,
      service: "second-chance-api",
      category: "payment"
    });

    // Update transaction status to cancelled
    const result = await storage.cancelPaymentTransaction(orderRef, founderId);
    
    if (result.success) {
      appLogger.business("Payment marked as cancelled successfully", {
        founderId,
        orderRef,
        service: "second-chance-api",
        category: "payment"
      });

      res.json({
        success: true,
        message: "Payment cancelled successfully",
        orderReference: orderRef
      });
    } else {
      appLogger.warn("Failed to cancel payment - transaction not found or unauthorized", {
        founderId,
        orderRef,
        service: "second-chance-api",
        category: "payment"
      });

      res.status(404).json({
        error: "Transaction not found or unauthorized"
      });
    }

  } catch (error) {
    appLogger.error("Failed to cancel payment", null, {
      founderId: req.user?.founderId,
      orderRef: req.params.orderRef,
      error: error instanceof Error ? error.message : 'Unknown error',
      service: "second-chance-api",
      category: "payment"
    });

    res.status(500).json({
      error: "Failed to cancel payment"
    });
  }
});

export default router;