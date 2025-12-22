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

    const { tran_ref, cart_id, respStatus, respCode, respMessage, tranRef, payment_result } = req.body;
    const orderReference = cart_id || req.body.order_reference;
    const transactionRef = tran_ref || tranRef;

    // PayTabs sends status in payment_result.response_status (nested) or at top level
    const responseStatus = respStatus || payment_result?.response_status;
    const responseCode = respCode || payment_result?.response_code;

    appLogger.business("Pre-onboarding callback status extraction", {
      orderReference,
      respStatus,
      respCode,
      nestedStatus: payment_result?.response_status,
      nestedCode: payment_result?.response_code,
      extractedStatus: responseStatus,
      extractedCode: responseCode,
    });

    if (!orderReference) {
      appLogger.error("Pre-onboarding callback missing order reference", null, {
        body: req.body,
      });
      return res.status(400).json({ error: "Missing order reference" });
    }

    let status: "completed" | "failed" | "pending" = "pending";
    if (responseStatus === "A" || responseCode === "000") {
      status = "completed";
    } else if (responseStatus === "D" || responseStatus === "E") {
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

    // PayTabs may send cartId (camelCase) or cart_id (snake_case)
    const { respStatus, respCode, cartId, cart_id, tranRef, tran_ref } = req.query as Record<string, string>;
    const orderReference = cartId || cart_id;

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

    // Log what PayTabs actually sent us
    appLogger.business("Pre-onboarding return params analysis", {
      respStatus,
      respCode,
      hasRespStatus: !!respStatus,
      hasRespCode: !!respCode,
      allQueryParams: JSON.stringify(req.query),
    });

    // Determine status from PayTabs response
    let status: "completed" | "failed" | "pending" = "pending";
    if (respStatus === "A" || respCode === "000") {
      status = "completed";
    } else if (respStatus === "D" || respStatus === "E") {
      status = "failed";
    }

    // Update database with new status
    if (payment.status !== "completed" && payment.status !== "claimed") {
      await preOnboardingPaymentService.updatePaymentStatus(
        orderReference,
        status,
        req.query
      );
    }

    // Re-fetch payment to get the latest status (may have been updated by callback)
    const [updatedPayment] = await db
      .select()
      .from(preOnboardingPayments)
      .where(eq(preOnboardingPayments.orderReference, orderReference));
    
    const finalStatus = updatedPayment?.status || status;

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
            ${finalStatus === "completed" ? '<h2 class="success">Payment Successful!</h2><p>Redirecting you to create your account...</p>' : 
              finalStatus === "failed" ? '<h2 class="failed">Payment Failed</h2><p>Please try again.</p>' :
              '<h2 class="processing">Verifying payment...</h2><p>Please wait a moment.</p>'}
          </div>
          <script>
            (function() {
              var status = "${finalStatus}";
              var orderReference = "${orderReference}";
              var reservationToken = "${updatedPayment?.reservationToken || payment.reservationToken}";
              
              if (window.parent !== window) {
                // Only send PAYMENT_SUCCESS if we confirmed completion
                if (status === "completed") {
                  window.parent.postMessage({ type: "PAYMENT_SUCCESS", orderReference: orderReference, status: status, reservationToken: reservationToken }, "*");
                } else if (status === "failed") {
                  window.parent.postMessage({ type: "PAYMENT_ERROR", orderReference: orderReference, status: status }, "*");
                } else {
                  // Status is pending - tell parent to keep polling
                  window.parent.postMessage({ type: "PAYMENT_PENDING", orderReference: orderReference, status: status }, "*");
                }
              } else {
                // Not in iframe - redirect directly
                if (status === "completed") {
                  window.location.href = "${frontendUrl}/onboarding?token=" + reservationToken;
                } else if (status === "failed") {
                  window.location.href = "${frontendUrl}/payment/failed?ref=${orderReference}";
                } else {
                  window.location.href = "${frontendUrl}/payment/individual";
                }
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

    // PayTabs may send cart_id (snake_case) or cartId (camelCase)
    const { respStatus, respCode, cart_id, cartId, tran_ref, tranRef } = req.body;
    const orderReference = cart_id || cartId;

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

    // Log what PayTabs actually sent us
    appLogger.business("Pre-onboarding POST return params analysis", {
      respStatus,
      respCode,
      hasRespStatus: !!respStatus,
      hasRespCode: !!respCode,
      allBodyParams: JSON.stringify(req.body),
    });

    // Determine status from PayTabs response
    let status: "completed" | "failed" | "pending" = "pending";
    if (respStatus === "A" || respCode === "000") {
      status = "completed";
    } else if (respStatus === "D" || respStatus === "E") {
      status = "failed";
    }

    // Update database with new status
    if (payment.status !== "completed" && payment.status !== "claimed") {
      await preOnboardingPaymentService.updatePaymentStatus(
        orderReference,
        status,
        req.body
      );
    }

    // Re-fetch payment to get the latest status (may have been updated by callback)
    const [updatedPayment] = await db
      .select()
      .from(preOnboardingPayments)
      .where(eq(preOnboardingPayments.orderReference, orderReference));
    
    const finalStatus = updatedPayment?.status || status;

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
            ${finalStatus === "completed" ? '<h2 class="success">Payment Successful!</h2><p>Redirecting you to create your account...</p>' : 
              finalStatus === "failed" ? '<h2 class="failed">Payment Failed</h2><p>Please try again.</p>' :
              '<h2 class="processing">Verifying payment...</h2><p>Please wait a moment.</p>'}
          </div>
          <script>
            (function() {
              var status = "${finalStatus}";
              var orderReference = "${orderReference}";
              var reservationToken = "${updatedPayment?.reservationToken || payment.reservationToken}";
              
              if (window.parent !== window) {
                // Only send PAYMENT_SUCCESS if we confirmed completion
                if (status === "completed") {
                  window.parent.postMessage({ type: "PAYMENT_SUCCESS", orderReference: orderReference, status: status, reservationToken: reservationToken }, "*");
                } else if (status === "failed") {
                  window.parent.postMessage({ type: "PAYMENT_ERROR", orderReference: orderReference, status: status }, "*");
                } else {
                  // Status is pending - tell parent to keep polling
                  window.parent.postMessage({ type: "PAYMENT_PENDING", orderReference: orderReference, status: status }, "*");
                }
              } else {
                // Not in iframe - redirect directly
                if (status === "completed") {
                  window.location.href = "${frontendUrl}/onboarding?token=" + reservationToken;
                } else if (status === "failed") {
                  window.location.href = "${frontendUrl}/payment/failed?ref=${orderReference}";
                } else {
                  window.location.href = "${frontendUrl}/payment/individual";
                }
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
