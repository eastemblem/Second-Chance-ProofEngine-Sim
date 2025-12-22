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

    if (status === "completed" || payment.status === "completed") {
      const onboardingUrl = `${frontendUrl}/onboarding?token=${payment.reservationToken}`;
      return res.redirect(onboardingUrl);
    } else if (status === "failed") {
      return res.redirect(`${frontendUrl}/payment/failed?ref=${orderReference}`);
    } else {
      return res.redirect(`${frontendUrl}/payment/individual`);
    }
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

    if (status === "completed" || payment.status === "completed") {
      const onboardingUrl = `${frontendUrl}/onboarding?token=${payment.reservationToken}`;
      return res.redirect(onboardingUrl);
    } else if (status === "failed") {
      return res.redirect(`${frontendUrl}/payment/failed?ref=${orderReference}`);
    } else {
      return res.redirect(`${frontendUrl}/payment/individual`);
    }
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
