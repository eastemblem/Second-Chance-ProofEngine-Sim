import { Router } from "express";
import { paymentService } from "../../services/payment-service.js";
import { createPaymentRequestSchema, checkPaymentStatusSchema } from "../../lib/payment-gateway.js";
import { authenticateToken, type AuthenticatedRequest } from "../../middleware/token-auth.js";
import { storage } from "../../storage.js";
import winston from "winston";

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
    
    // Create payment with service
    const result = await paymentService.createPayment({
      founderId,
      request: paymentRequest,
      customerEmail: founder?.email,
      customerName: founder?.fullName,
      gatewayProvider: req.body.gatewayProvider || 'telr'
    });

    if (!result.success) {
      winston.error("Payment creation failed", { 
        founderId, 
        error: result.error,
        service: "second-chance-api",
        category: "payment"
      });
      
      return res.status(400).json({ 
        error: result.error || "Failed to create payment"
      });
    }

    winston.info("Payment order created successfully", {
      founderId,
      orderReference: result.orderReference,
      service: "second-chance-api",
      category: "payment"
    });

    res.json({
      success: true,
      orderReference: result.orderReference,
      paymentUrl: result.paymentUrl
    });

  } catch (error) {
    winston.error("Payment creation error", { 
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
    winston.error("Payment status check error", { 
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
    winston.error("Payment history error", { 
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
    winston.error("Subscriptions fetch error", { 
      error: error instanceof Error ? error.message : 'Unknown error',
      founderId: req.user?.founderId,
      service: "second-chance-api",
      category: "payment"
    });
    
    res.status(500).json({ error: "Internal server error" });
  }
});

// Check if user has deal room access
router.get("/deal-room-access", async (req: AuthenticatedRequest, res) => {
  try {
    const founderId = req.user?.founderId;
    if (!founderId) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    const hasAccess = await paymentService.hasDealRoomAccess(founderId);
    
    res.json({
      success: true,
      hasAccess
    });

  } catch (error) {
    winston.error("Deal room access check error", { 
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
    winston.error("Failed to get payment activities", { 
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
    
    winston.info("Payment cancellation requested", {
      founderId,
      orderRef,
      service: "second-chance-api",
      category: "payment"
    });

    // Update transaction status to cancelled
    const result = await storage.cancelPaymentTransaction(orderRef, founderId);
    
    if (result.success) {
      winston.info("Payment marked as cancelled successfully", {
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
      winston.warn("Failed to cancel payment - transaction not found or unauthorized", {
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
    winston.error("Failed to cancel payment", {
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