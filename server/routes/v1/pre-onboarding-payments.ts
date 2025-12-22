import { Router, Request, Response } from "express";
import { z } from "zod";
import { preOnboardingPaymentService } from "../../services/pre-onboarding-payment-service.js";
import { appLogger } from "../../utils/logger";
import rateLimit from "express-rate-limit";

const router = Router();

const preOnboardingPaymentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: "Too many payment attempts. Please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

const initiatePaymentSchema = z.object({
  email: z.string().email("Invalid email address"),
  name: z.string().min(1, "Name is required").max(255),
  phone: z.string().max(50).optional(),
});

router.post("/initiate", preOnboardingPaymentLimiter, async (req: Request, res: Response) => {
  try {
    const validationResult = initiatePaymentSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        error: "Invalid request data",
        details: validationResult.error.errors,
      });
    }

    const { email, name, phone } = validationResult.data;

    appLogger.business("Pre-onboarding payment initiation started", {
      email,
      name,
      service: "second-chance-api",
      category: "pre-onboarding-payment",
    });

    const result = await preOnboardingPaymentService.initiatePayment({
      email,
      name,
      phone,
    });

    if (!result.success) {
      appLogger.error("Pre-onboarding payment initiation failed", null, {
        email,
        error: result.error,
        service: "second-chance-api",
        category: "pre-onboarding-payment",
      });

      return res.status(400).json({
        error: result.error || "Failed to initiate payment",
      });
    }

    appLogger.business("Pre-onboarding payment initiated successfully", {
      email,
      reservationToken: result.reservationToken,
      orderReference: result.orderReference,
      service: "second-chance-api",
      category: "pre-onboarding-payment",
    });

    res.json({
      success: true,
      paymentUrl: result.paymentUrl,
      reservationToken: result.reservationToken,
      orderReference: result.orderReference,
    });
  } catch (error) {
    appLogger.error("Pre-onboarding payment initiation error", null, {
      error: error instanceof Error ? error.message : "Unknown error",
      service: "second-chance-api",
      category: "pre-onboarding-payment",
    });

    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/validate/:token", async (req: Request, res: Response) => {
  try {
    const { token } = req.params;

    if (!token) {
      return res.status(400).json({ error: "Token is required" });
    }

    const result = await preOnboardingPaymentService.validateToken(token);

    if (!result.valid) {
      return res.status(404).json({
        valid: false,
        error: result.error || "Invalid or expired token",
      });
    }

    res.json({
      valid: true,
      email: result.email,
      name: result.name,
      status: result.status,
      paymentType: result.paymentType,
      userType: result.userType,
    });
  } catch (error) {
    appLogger.error("Token validation error", null, {
      error: error instanceof Error ? error.message : "Unknown error",
      service: "second-chance-api",
      category: "pre-onboarding-payment",
    });

    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/claim", async (req: Request, res: Response) => {
  try {
    const { reservationToken, founderId } = req.body;

    if (!reservationToken || !founderId) {
      return res.status(400).json({
        error: "Reservation token and founder ID are required",
      });
    }

    const result = await preOnboardingPaymentService.claimPayment(
      reservationToken,
      founderId
    );

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.error || "Failed to claim payment",
      });
    }

    res.json({
      success: true,
      userType: result.userType,
    });
  } catch (error) {
    appLogger.error("Payment claim error", null, {
      error: error instanceof Error ? error.message : "Unknown error",
      service: "second-chance-api",
      category: "pre-onboarding-payment",
    });

    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
