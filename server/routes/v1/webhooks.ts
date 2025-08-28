import { Router } from "express";
import { paymentService } from "../../services/payment-service.js";
import { appLogger } from "../../utils/logger";

const router = Router();

// Webhook handler for Telr payment notifications (POST)
router.post("/telr", async (req, res) => {
  try {
    appLogger.external("Telr webhook received (POST)", {
      body: req.body,
      headers: req.headers,
      service: "second-chance-api",
      category: "webhook"
    });

    // Process the webhook
    const result = await paymentService.handleWebhook('telr', req.body);
    
    if (!result.success) {
      appLogger.error("Telr webhook processing failed", null, {
        error: result.error,
        body: req.body,
        service: "second-chance-api",
        category: "webhook"
      });
      
      return res.status(400).json({ 
        error: result.error || "Webhook processing failed"
      });
    }

    appLogger.external("Telr webhook processed successfully", {
      processed: result.processed,
      service: "second-chance-api",
      category: "webhook"
    });

    // Telr expects a simple success response
    res.status(200).send('OK');

  } catch (error) {
    appLogger.error("Telr webhook error", null, {
      error: error instanceof Error ? error.message : 'Unknown error',
      body: req.body,
      service: "second-chance-api",
      category: "webhook"
    });
    
    res.status(500).json({ error: "Internal server error" });
  }
});

// Callback handler for Telr hosted page callbacks (GET)
router.get("/telr", async (req, res) => {
  try {
    appLogger.external("Telr callback received (GET)", {
      query: req.query,
      headers: req.headers,
      service: "second-chance-api",
      category: "webhook"
    });

    // Process the callback data
    const result = await paymentService.handleWebhook('telr', req.query);
    
    if (!result.success) {
      appLogger.error("Telr callback processing failed", null, {
        error: result.error,
        query: req.query,
        service: "second-chance-api",
        category: "webhook"
      });
      
      // For callback failures, redirect to error page
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5000'}/payment/error?error=${encodeURIComponent(result.error || 'Processing failed')}`);
    }

    appLogger.external("Telr callback processed successfully", {
      processed: result.processed,
      service: "second-chance-api",
      category: "webhook"
    });

    // For successful callback, redirect to appropriate status page
    const processedData = result.processed;
    const status = processedData?.status || 'pending'; 
    const orderRef = processedData?.orderReference || 'unknown';
    
    if (status === 'completed') {
      res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5000'}/payment/success?ref=${orderRef}`);
    } else if (status === 'failed') {
      res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5000'}/payment/failed?ref=${orderRef}`);
    } else if (status === 'cancelled') {
      res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5000'}/payment/cancelled?ref=${orderRef}`);
    } else {
      res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5000'}/payment/pending?ref=${orderRef}`);
    }

  } catch (error) {
    appLogger.error("Telr callback error", null, {
      error: error instanceof Error ? error.message : 'Unknown error',
      query: req.query,
      service: "second-chance-api",
      category: "webhook"
    });
    
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5000'}/payment/error?error=${encodeURIComponent('Processing error')}`);
  }
});

// Generic webhook handler for future payment gateways
router.post("/:provider", async (req: Request, res: Response) => {
  try {
    const { provider } = req.params;
    
    // Skip telr as it has its own dedicated route
    if (provider === 'telr') {
      return res.status(404).json({ error: "Use dedicated Telr webhook endpoint" });
    }

    appLogger.external(`${provider} webhook received`, {
      provider,
      body: req.body,
      headers: req.headers,
      service: "second-chance-api",
      category: "webhook"
    });

    // Extract signature if present (common webhook security)
    const signature = req.headers['x-signature'] || 
                     req.headers['x-webhook-signature'] || 
                     req.headers['stripe-signature'] ||
                     req.headers['paypal-transmission-sig'];

    const result = await paymentService.handleWebhook(
      provider, 
      req.body, 
      signature as string
    );
    
    if (!result.success) {
      appLogger.error(`${provider} webhook processing failed`, null, {
        provider,
        error: result.error,
        body: req.body,
        service: "second-chance-api",
        category: "webhook"
      });
      
      return res.status(400).json({ 
        error: result.error || "Webhook processing failed"
      });
    }

    appLogger.external(`${provider} webhook processed successfully`, {
      provider,
      processed: result.processed,
      service: "second-chance-api",
      category: "webhook"
    });

    res.status(200).json({ success: true });

  } catch (error) {
    appLogger.error(`Webhook error for ${req.params.provider}`, null, {
      provider: req.params.provider,
      error: error instanceof Error ? error.message : 'Unknown error',
      body: req.body,
      service: "second-chance-api",
      category: "webhook"
    });
    
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;