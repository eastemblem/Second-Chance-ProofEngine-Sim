import { db } from "../db.js";
import { preOnboardingPayments, founder, paymentTransactions } from "@shared/schema";
import { eq, and } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { PaymentGatewayFactory, type PaymentOrderData } from "../lib/payment-gateway.js";
import { appLogger } from "../utils/logger";
import { CurrencyService } from "./currency-service.js";
import { EmailService } from "./emailService.js";

interface InitiatePaymentOptions {
  email: string;
  name: string;
  phone?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  utmTerm?: string;
}

interface InitiatePaymentResult {
  success: boolean;
  paymentUrl?: string;
  reservationToken?: string;
  orderReference?: string;
  error?: string;
}

interface ValidateTokenResult {
  valid: boolean;
  email?: string;
  name?: string;
  status?: string;
  paymentType?: string;
  userType?: string;
  error?: string;
}

interface ClaimPaymentResult {
  success: boolean;
  userType?: string;
  error?: string;
}

interface PaymentStatusResult {
  found: boolean;
  status?: string;
  reservationToken?: string;
  email?: string;
}

function generateReservationToken(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let token = "";
  for (let i = 0; i < 10; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `SC-PAY-${token}`;
}

function getReturnUrls(orderReference: string) {
  const frontendUrl = process.env.FRONTEND_URL;
  const replitDomain = process.env.REPLIT_DOMAINS?.split(",")[0];

  let baseUrl: string;
  if (frontendUrl) {
    const cleanUrl = frontendUrl.replace(/^https?:\/\//, "").replace(/\/$/, "");
    baseUrl = `https://${cleanUrl}`;
  } else if (replitDomain) {
    baseUrl = `https://${replitDomain}`;
  } else {
    baseUrl = `https://localhost:5000`;
  }

  return {
    authorised: `${baseUrl}/api/payment/pre-onboarding/return`,
    declined: `${baseUrl}/api/payment/pre-onboarding/return`,
    cancelled: `${baseUrl}/api/payment/pre-onboarding/return`,
    callback: `${baseUrl}/api/payment/pre-onboarding/callback`,
  };
}

class PreOnboardingPaymentService {
  private emailService: EmailService;
  private static readonly PAYMENT_AMOUNT_USD = 99;
  private static readonly PAYMENT_EXPIRY_DAYS = 30;

  constructor() {
    this.emailService = new EmailService();
  }

  async initiatePayment(options: InitiatePaymentOptions): Promise<InitiatePaymentResult> {
    const { email, name, phone, utmSource, utmMedium, utmCampaign, utmContent, utmTerm } = options;

    try {
      const reservationToken = generateReservationToken();
      const orderReference = `SC-PRE-${Date.now()}_${uuidv4().substring(0, 8)}`;

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + PreOnboardingPaymentService.PAYMENT_EXPIRY_DAYS);

      const amountAed = await CurrencyService.convertCurrency(
        PreOnboardingPaymentService.PAYMENT_AMOUNT_USD,
        "AED"
      );

      const gateway = PaymentGatewayFactory.create("paytabs");
      const returnUrls = getReturnUrls(orderReference);

      const paymentData: PaymentOrderData = {
        orderId: orderReference,
        amount: amountAed.amount,
        currency: "AED",
        description: "Second Chance Platform Access - Individual",
        returnUrls,
        customerData: {
          ref: email,
          email,
          name: {
            forenames: name.split(" ").slice(0, -1).join(" ") || name,
            surname: name.split(" ").slice(-1)[0] || "",
          },
          phone,
        },
        metadata: {
          paymentType: "platform_access",
          userType: "individual",
        },
      };

      appLogger.business("Creating PayTabs order for pre-onboarding payment", {
        email,
        orderReference,
        amountUsd: PreOnboardingPaymentService.PAYMENT_AMOUNT_USD,
        amountAed: amountAed.amount,
      });

      const gatewayResult = await gateway.createOrder(paymentData);

      if (!gatewayResult.success || !gatewayResult.paymentUrl) {
        appLogger.error("PayTabs order creation failed", null, {
          email,
          gatewayResponse: gatewayResult.gatewayResponse,
        });
        return {
          success: false,
          error: "Failed to create payment order",
        };
      }

      const [payment] = await db
        .insert(preOnboardingPayments)
        .values({
          email: email.toLowerCase(),
          name,
          phone,
          reservationToken,
          amount: PreOnboardingPaymentService.PAYMENT_AMOUNT_USD.toString(),
          currency: "USD",
          paymentType: "platform_access",
          gateway: "paytabs",
          gatewayTransactionId: gatewayResult.orderReference,
          orderReference,
          paymentUrl: gatewayResult.paymentUrl,
          status: "pending",
          userType: "individual",
          expiresAt,
          utmSource,
          utmMedium,
          utmCampaign,
          utmContent,
          utmTerm,
        })
        .returning();

      appLogger.business("Pre-onboarding payment record created", {
        paymentId: payment.id,
        reservationToken,
        orderReference,
      });

      return {
        success: true,
        paymentUrl: gatewayResult.paymentUrl,
        reservationToken,
        orderReference,
      };
    } catch (error) {
      appLogger.error("Pre-onboarding payment initiation error", null, {
        email,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      return {
        success: false,
        error: "Failed to initiate payment",
      };
    }
  }

  async getPaymentByToken(token: string): Promise<any | null> {
    try {
      const [payment] = await db
        .select()
        .from(preOnboardingPayments)
        .where(eq(preOnboardingPayments.reservationToken, token));
      return payment || null;
    } catch (error) {
      appLogger.error("Get payment by token error", null, {
        token,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      return null;
    }
  }

  async validateToken(token: string): Promise<ValidateTokenResult> {
    try {
      const [payment] = await db
        .select()
        .from(preOnboardingPayments)
        .where(eq(preOnboardingPayments.reservationToken, token));

      if (!payment) {
        return { valid: false, error: "Token not found" };
      }

      if (payment.claimedByFounderId) {
        return { valid: false, error: "Payment already claimed" };
      }

      if (payment.expiresAt && new Date(payment.expiresAt) < new Date()) {
        return { valid: false, error: "Token expired" };
      }

      if (payment.status !== "completed") {
        return {
          valid: false,
          error: `Payment not completed. Current status: ${payment.status}`,
        };
      }

      return {
        valid: true,
        email: payment.email,
        name: payment.name || undefined,
        status: payment.status,
        paymentType: payment.paymentType,
        userType: payment.userType,
      };
    } catch (error) {
      appLogger.error("Token validation error", null, {
        token,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      return { valid: false, error: "Validation failed" };
    }
  }

  async claimPayment(reservationToken: string, founderId: string): Promise<ClaimPaymentResult> {
    try {
      const [payment] = await db
        .select()
        .from(preOnboardingPayments)
        .where(eq(preOnboardingPayments.reservationToken, reservationToken));

      if (!payment) {
        return { success: false, error: "Payment not found" };
      }

      if (payment.claimedByFounderId) {
        return { success: false, error: "Payment already claimed" };
      }

      if (payment.status !== "completed") {
        return { success: false, error: "Payment not completed" };
      }

      // Update the pre-onboarding payment as claimed
      await db
        .update(preOnboardingPayments)
        .set({
          claimedByFounderId: founderId,
          claimedAt: new Date(),
          status: "claimed",
        })
        .where(eq(preOnboardingPayments.id, payment.id));

      // Update founder's userType
      await db
        .update(founder)
        .set({ userType: payment.userType })
        .where(eq(founder.founderId, founderId));

      // Create a payment_transactions entry for proper transaction history
      const gatewayProvider: "paytabs" | "telr" = payment.gateway === "telr" ? "telr" : "paytabs";
      const orderRef = payment.orderReference || `SC-PRE-${Date.now()}`;
      const txnId = payment.gatewayTransactionId || orderRef;
      
      // Parse amount properly - ensure it's a valid decimal string
      let amountValue = "99.00";
      if (payment.amount) {
        const parsedAmount = parseFloat(String(payment.amount));
        if (!isNaN(parsedAmount)) {
          amountValue = parsedAmount.toFixed(2);
        }
      }
      
      const [paymentTransaction] = await db
        .insert(paymentTransactions)
        .values({
          founderId,
          gatewayProvider,
          gatewayTransactionId: txnId,
          orderReference: orderRef,
          amount: amountValue,
          currency: payment.currency || "USD",
          status: "completed",
          gatewayStatus: "A",
          description: `Second Chance Platform Access - ${payment.userType === "individual" ? "Individual" : "Standard"}`,
          gatewayResponse: payment.gatewayResponse || {},
          metadata: {
            paymentType: payment.paymentType || "platform_access",
            userType: payment.userType || "individual",
            preOnboardingPaymentId: payment.id,
            reservationToken: payment.reservationToken,
            claimedAt: new Date().toISOString(),
            originalEmail: payment.email,
          },
        })
        .returning();

      console.log(`✅ CLAIM_PAYMENT: Successfully claimed payment. Transaction ID: ${paymentTransaction?.id}`);
      
      appLogger.business("Pre-onboarding payment claimed", {
        paymentId: payment.id,
        paymentTransactionId: paymentTransaction?.id,
        founderId,
        userType: payment.userType,
      });

      return {
        success: true,
        userType: payment.userType,
      };
    } catch (error) {
      console.error(`❌ CLAIM_PAYMENT: Error claiming payment:`, error);
      appLogger.error("Payment claim error", null, {
        reservationToken,
        founderId,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      return { success: false, error: "Failed to claim payment" };
    }
  }

  async updatePaymentStatus(
    orderReference: string,
    status: "pending" | "processing" | "completed" | "failed" | "expired",
    gatewayResponse?: any
  ): Promise<boolean> {
    try {
      const [payment] = await db
        .select()
        .from(preOnboardingPayments)
        .where(eq(preOnboardingPayments.orderReference, orderReference));

      if (!payment) {
        appLogger.error("Payment not found for status update", null, { orderReference });
        return false;
      }

      await db
        .update(preOnboardingPayments)
        .set({
          status,
          gatewayResponse: gatewayResponse || payment.gatewayResponse,
        })
        .where(eq(preOnboardingPayments.id, payment.id));

      appLogger.business("Pre-onboarding payment status updated", {
        paymentId: payment.id,
        orderReference,
        status,
      });

      if (status === "completed") {
        await this.sendConfirmationEmail(payment);
      }

      return true;
    } catch (error) {
      appLogger.error("Payment status update error", null, {
        orderReference,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      return false;
    }
  }

  private async sendConfirmationEmail(payment: any): Promise<void> {
    try {
      const frontendUrl = process.env.FRONTEND_URL || process.env.REPLIT_DOMAINS?.split(",")[0];
      const onboardingUrl = `https://${frontendUrl?.replace(/^https?:\/\//, "")}/onboarding?token=${payment.reservationToken}`;

      const hostUrl = `https://${frontendUrl?.replace(/^https?:\/\//, "")}`;
      
      await this.emailService.sendEmail(
        payment.email,
        "Payment Confirmed - Welcome to Second Chance",
        "payment-success",
        {
          HOST_URL: hostUrl,
          USER_NAME: payment.name || "Founder",
          PAYMENT_AMOUNT: `$${payment.amount} USD`,
          ORDER_REFERENCE: payment.orderReference || payment.reservationToken,
          PAYMENT_DATE: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
          DASHBOARD_URL: onboardingUrl,
        }
      );

      appLogger.business("Payment confirmation email sent", {
        email: payment.email,
        reservationToken: payment.reservationToken,
      });
    } catch (error) {
      appLogger.error("Failed to send confirmation email", null, {
        email: payment.email,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  async getPaymentStatus(orderReference: string): Promise<PaymentStatusResult> {
    try {
      const [payment] = await db
        .select()
        .from(preOnboardingPayments)
        .where(eq(preOnboardingPayments.orderReference, orderReference));

      if (!payment) {
        return { found: false };
      }

      return {
        found: true,
        status: payment.status,
        reservationToken: payment.reservationToken,
        email: payment.email,
      };
    } catch (error) {
      appLogger.error("Get payment status error", null, {
        orderReference,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      return { found: false };
    }
  }

  async getPaymentByEmail(email: string): Promise<any | null> {
    try {
      const [payment] = await db
        .select()
        .from(preOnboardingPayments)
        .where(
          and(
            eq(preOnboardingPayments.email, email.toLowerCase()),
            eq(preOnboardingPayments.status, "completed")
          )
        );

      return payment || null;
    } catch (error) {
      appLogger.error("Error fetching payment by email", null, {
        email,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      return null;
    }
  }
}

export const preOnboardingPaymentService = new PreOnboardingPaymentService();
