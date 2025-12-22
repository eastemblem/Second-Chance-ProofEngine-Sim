import { Router, Request, Response } from "express";
import { preOnboardingPaymentService } from "../services/pre-onboarding-payment-service.js";
import { appLogger } from "../utils/logger";
import { db } from "../db.js";
import { preOnboardingPayments } from "@shared/schema";
import { eq } from "drizzle-orm";

const router = Router();

router.post("/callback", async (req: Request, res: Response) => {
  try {
    appLogger.external("Pre-onboarding PayTabs callback received (POST)", {
      body: req.body,
      service: "second-chance-api",
      category: "pre-onboarding-webhook",
    });

    const { tran_ref, cart_id, respStatus, respCode, respMessage, tranRef } = req.body;
    const orderReference = cart_id || req.body.order_reference;
    const transactionRef = tran_ref || tranRef;

    if (!orderReference) {
      appLogger.error("Pre-onboarding callback missing order reference", null, {
        body: req.body,
      });
      return res.status(400).json({ error: "Missing order reference" });
    }

    let status: "completed" | "failed" | "pending" = "pending";
    if (respStatus === "A" || respCode === "000") {
      status = "completed";
    } else if (respStatus === "D" || respStatus === "E") {
      status = "failed";
    }

    const updated = await preOnboardingPaymentService.updatePaymentStatus(
      orderReference,
      status,
      req.body
    );

    if (updated && status === "completed") {
      await db
        .update(preOnboardingPayments)
        .set({ gatewayTransactionId: transactionRef })
        .where(eq(preOnboardingPayments.orderReference, orderReference));
    }

    appLogger.business("Pre-onboarding payment callback processed", {
      orderReference,
      status,
      updated,
    });

    res.status(200).send("OK");
  } catch (error) {
    appLogger.error("Pre-onboarding callback error", null, {
      error: error instanceof Error ? error.message : "Unknown error",
      body: req.body,
    });
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/return", async (req: Request, res: Response) => {
  try {
    appLogger.external("Pre-onboarding PayTabs return received (GET)", {
      query: req.query,
      service: "second-chance-api",
      category: "pre-onboarding-return",
    });

    const { respStatus, respCode, cartId, tranRef } = req.query;
    const orderReference = cartId as string;

    const frontendUrl =
      process.env.FRONTEND_URL ||
      `https://${process.env.REPLIT_DOMAINS?.split(",")[0]}` ||
      "http://localhost:5000";

    if (!orderReference) {
      return res.redirect(`${frontendUrl}/payment/error?error=Missing+order+reference`);
    }

    const [payment] = await db
      .select()
      .from(preOnboardingPayments)
      .where(eq(preOnboardingPayments.orderReference, orderReference));

    if (!payment) {
      return res.redirect(`${frontendUrl}/payment/error?error=Payment+not+found`);
    }

    let status: "completed" | "failed" | "pending" = "pending";
    if (respStatus === "A" || respCode === "000") {
      status = "completed";
    } else if (respStatus === "D" || respStatus === "E") {
      status = "failed";
    }

    if (payment.status !== "completed" && payment.status !== "claimed") {
      await preOnboardingPaymentService.updatePaymentStatus(
        orderReference,
        status,
        req.query
      );
    }

    const iframeScript = `
      <html>
        <head>
          <style>
            body { font-family: system-ui, -apple-system, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #f5f5f5; }
            .container { text-align: center; padding: 2rem; }
            .success { color: #22c55e; }
            .failed { color: #ef4444; }
            .processing { color: #3b82f6; }
            h2 { margin-bottom: 0.5rem; }
            p { color: #666; margin-top: 0.5rem; }
          </style>
        </head>
        <body>
          <div class="container">
            ${status === "completed" ? '<h2 class="success">Payment Successful!</h2><p>Redirecting you to create your account...</p>' : 
              status === "failed" ? '<h2 class="failed">Payment Failed</h2><p>Please try again.</p>' :
              '<h2 class="processing">Processing...</h2><p>Please wait.</p>'}
          </div>
          <script>
            (function() {
              var status = "${status}";
              var orderReference = "${orderReference}";
              if (window.parent !== window) {
                window.parent.postMessage({ type: status === "completed" ? "PAYMENT_SUCCESS" : status === "failed" ? "PAYMENT_ERROR" : "PAYMENT_PENDING", orderReference: orderReference, status: status }, "*");
              } else {
                ${status === "completed" ? `window.location.href = "${frontendUrl}/onboarding?token=${payment.reservationToken}";` :
                  status === "failed" ? `window.location.href = "${frontendUrl}/payment/failed?ref=${orderReference}";` :
                  `window.location.href = "${frontendUrl}/payment/individual";`}
              }
            })();
          </script>
        </body>
      </html>
    `;

    res.setHeader("Content-Type", "text/html");
    res.send(iframeScript);
  } catch (error) {
    appLogger.error("Pre-onboarding return error", null, {
      error: error instanceof Error ? error.message : "Unknown error",
      query: req.query,
    });

    const frontendUrl =
      process.env.FRONTEND_URL ||
      `https://${process.env.REPLIT_DOMAINS?.split(",")[0]}` ||
      "http://localhost:5000";
    res.redirect(`${frontendUrl}/payment/error?error=Processing+error`);
  }
});

router.post("/return", async (req: Request, res: Response) => {
  try {
    appLogger.external("Pre-onboarding PayTabs return received (POST)", {
      body: req.body,
      service: "second-chance-api",
      category: "pre-onboarding-return",
    });

    const { respStatus, respCode, cart_id, tran_ref } = req.body;
    const orderReference = cart_id;

    const frontendUrl =
      process.env.FRONTEND_URL ||
      `https://${process.env.REPLIT_DOMAINS?.split(",")[0]}` ||
      "http://localhost:5000";

    if (!orderReference) {
      return res.redirect(`${frontendUrl}/payment/error?error=Missing+order+reference`);
    }

    const [payment] = await db
      .select()
      .from(preOnboardingPayments)
      .where(eq(preOnboardingPayments.orderReference, orderReference));

    if (!payment) {
      return res.redirect(`${frontendUrl}/payment/error?error=Payment+not+found`);
    }

    let status: "completed" | "failed" | "pending" = "pending";
    if (respStatus === "A" || respCode === "000") {
      status = "completed";
    } else if (respStatus === "D" || respStatus === "E") {
      status = "failed";
    }

    if (payment.status !== "completed" && payment.status !== "claimed") {
      await preOnboardingPaymentService.updatePaymentStatus(
        orderReference,
        status,
        req.body
      );
    }

    const iframeScript = `
      <html>
        <head>
          <style>
            body { font-family: system-ui, -apple-system, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #f5f5f5; }
            .container { text-align: center; padding: 2rem; }
            .success { color: #22c55e; }
            .failed { color: #ef4444; }
            .processing { color: #3b82f6; }
            h2 { margin-bottom: 0.5rem; }
            p { color: #666; margin-top: 0.5rem; }
          </style>
        </head>
        <body>
          <div class="container">
            ${status === "completed" ? '<h2 class="success">Payment Successful!</h2><p>Redirecting you to create your account...</p>' : 
              status === "failed" ? '<h2 class="failed">Payment Failed</h2><p>Please try again.</p>' :
              '<h2 class="processing">Processing...</h2><p>Please wait.</p>'}
          </div>
          <script>
            (function() {
              var status = "${status}";
              var orderReference = "${orderReference}";
              if (window.parent !== window) {
                window.parent.postMessage({ type: status === "completed" ? "PAYMENT_SUCCESS" : status === "failed" ? "PAYMENT_ERROR" : "PAYMENT_PENDING", orderReference: orderReference, status: status }, "*");
              } else {
                ${status === "completed" ? `window.location.href = "${frontendUrl}/onboarding?token=${payment.reservationToken}";` :
                  status === "failed" ? `window.location.href = "${frontendUrl}/payment/failed?ref=${orderReference}";` :
                  `window.location.href = "${frontendUrl}/payment/individual";`}
              }
            })();
          </script>
        </body>
      </html>
    `;

    res.setHeader("Content-Type", "text/html");
    res.send(iframeScript);
  } catch (error) {
    appLogger.error("Pre-onboarding return POST error", null, {
      error: error instanceof Error ? error.message : "Unknown error",
      body: req.body,
    });

    const frontendUrl =
      process.env.FRONTEND_URL ||
      `https://${process.env.REPLIT_DOMAINS?.split(",")[0]}` ||
      "http://localhost:5000";
    res.redirect(`${frontendUrl}/payment/error?error=Processing+error`);
  }
});

export default router;
