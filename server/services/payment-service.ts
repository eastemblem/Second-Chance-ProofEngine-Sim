import { PaymentGatewayFactory, type PaymentOrderData, type CreatePaymentRequest } from '../lib/payment-gateway.js';
import { storage } from '../storage.js';
import type { PaymentTransaction, InsertPaymentTransaction, InsertUserSubscription, InsertPaymentLog } from '@shared/schema';
import { v4 as uuidv4 } from 'uuid';
import { ActivityService } from './activity-service.js';
import { appLogger } from '../utils/logger';
import { onboardingNotificationService } from './onboardingNotificationService';
import { eastEmblemAPI } from '../eastemblem-api.js';
import { EmailService } from './emailService.js';
import { CurrencyService } from './currency-service.js';
import { COACH_EVENTS } from '../../shared/config/coach-events.js';

// Legacy currency conversion methods - now using CurrencyService for live rates
class CurrencyConverter {
  static async convertUsdToAed(usdAmount: number): Promise<number> {
    const result = await CurrencyService.convertCurrency(usdAmount, 'AED');
    return result.amount;
  }

  static getDisplayCurrency(): string {
    return 'USD';
  }

  static getPaymentCurrency(): string {
    return 'AED';
  }

  static formatPrice(amount: number, currency: string): string {
    return CurrencyService.formatCurrency(amount, currency);
  }
}

interface CreatePaymentOptions {
  founderId: string;
  request: CreatePaymentRequest;
  customerEmail?: string;
  customerName?: string;
  gatewayProvider?: string;
}

interface PaymentStatusUpdate {
  status: 'pending' | 'completed' | 'failed' | 'cancelled' | 'expired' | 'unknown';
  gatewayStatus?: string;
  gatewayTransactionId?: string;
  gatewayResponse?: any;
}

export class PaymentService {
  private emailService: EmailService;

  constructor() {
    this.emailService = new EmailService();
  }
  private getReturnUrls(orderReference: string) {
    const frontendUrl = process.env.FRONTEND_URL;
    const replitDomain = process.env.REPLIT_DOMAINS?.split(',')[0];
    
    let baseUrl: string;
    if (frontendUrl) {
      // Clean up FRONTEND_URL - remove protocol if present and trailing slashes
      const cleanUrl = frontendUrl.replace(/^https?:\/\//, '').replace(/\/$/, '');
      baseUrl = `https://${cleanUrl}`;
    } else if (replitDomain) {
      // Build URL from Replit domain - ensure HTTPS for Telr framed mode
      baseUrl = `https://${replitDomain}`;
    } else {
      // For development, use HTTPS to meet Telr requirements
      baseUrl = `https://localhost:5000`;
    }
    
    return {
      authorised: `${baseUrl}/api/payment/paytabs/return`,
      declined: `${baseUrl}/api/payment/paytabs/return`,
      cancelled: `${baseUrl}/api/payment/paytabs/return`,
      callback: `${baseUrl}/api/payment/paytabs/callback`  // Server-to-server IPN/Callback URL
    };
  }

  async createPayment(options: CreatePaymentOptions): Promise<{
    success: boolean;
    paymentUrl?: string;
    orderReference?: string;
    error?: string;
  }> {
    const { founderId, request, customerEmail, customerName, gatewayProvider = 'telr' } = options;
    
    appLogger.business('PaymentService.createPayment called', {
      founderId,
      request,
      customerEmail,
      customerName,
      gatewayProvider
    });
    
    try {
      // Generate unique order reference
      const orderReference = `SC_${Date.now()}_${uuidv4().substring(0, 8)}`;
      appLogger.business('Generated order reference', { orderReference });
      
      // Create transaction record first (store in display currency for user reference)
      const transactionData: InsertPaymentTransaction = {
        founderId,
        gatewayProvider: gatewayProvider as any,
        orderReference,
        amount: request.amount.toString(), // Store original USD amount for user reference
        currency: request.currency, // Store original USD currency for user reference
        status: 'pending',
        description: request.description,
        metadata: {
          ...request.metadata,
          purpose: request.purpose,
          planType: request.planType,
          displayAmount: request.amount,
          displayCurrency: request.currency,
          paymentAmount: request.currency === 'USD' ? await CurrencyConverter.convertUsdToAed(request.amount) : request.amount,
          paymentCurrency: request.currency === 'USD' ? 'AED' : request.currency,
          conversionRate: request.currency === 'USD' ? await CurrencyService.fetchLiveExchangeRate() : 1
        }
      };
      
      appLogger.database('Creating transaction', { transactionData });

      const transaction = await storage.createPaymentTransaction(transactionData);
      
      appLogger.database('Transaction created successfully', {
        id: transaction.id,
        orderReference: transaction.orderReference,
        amount: transaction.amount,
        status: transaction.status
      });
      
      // Log the creation
      await this.logPaymentAction(transaction.id, gatewayProvider as any, 'created', {
        orderReference,
        amount: request.amount,
        currency: request.currency,
        purpose: request.purpose,
        founderId
      });
      
      // Create user activity for payment initiation
      try {
        await ActivityService.logActivity(
          { founderId },
          {
            activityType: 'venture',
            action: 'payment_initiated',
            title: 'Payment Created',
            description: `Payment initiated for ${request.description}`,
            metadata: {
              orderReference,
              amount: request.amount,
              currency: request.currency,
              purpose: request.purpose,
              gatewayProvider
            }
          }
        );
      } catch (error) {
        appLogger.error('Activity logging error', error);
        // Don't fail the payment flow for activity logging issues
      }

      // Get payment gateway implementation

      const gateway = PaymentGatewayFactory.create(gatewayProvider);
      
      // Currency conversion: Convert USD to AED using live rates
      const displayAmount = request.amount; // Amount shown to user (USD)
      const displayCurrency = request.currency; // Currency shown to user (USD)
      const paymentAmount = displayCurrency === 'USD' ? 
        await CurrencyConverter.convertUsdToAed(displayAmount) : displayAmount;
      const paymentCurrency = displayCurrency === 'USD' ? 
        CurrencyConverter.getPaymentCurrency() : displayCurrency;
      
      appLogger.business('Currency conversion', {
        displayAmount: `${displayAmount} ${displayCurrency}`,
        paymentAmount: `${paymentAmount} ${paymentCurrency}`,
        conversionRate: displayCurrency === 'USD' ? '3.673' : 'No conversion'
      });
      
      // Prepare order data for gateway
      const returnUrls = this.getReturnUrls(orderReference);

      
      const orderData: PaymentOrderData = {
        orderId: orderReference,
        amount: paymentAmount, // Use converted amount for gateway
        currency: paymentCurrency, // Use AED for gateway
        description: `${request.description} (${CurrencyConverter.formatPrice(displayAmount, displayCurrency)})`,
        returnUrls,
        metadata: {
          founderId,
          planType: request.planType,
          purpose: request.purpose || request.metadata?.purpose,
          displayAmount, // Store original USD amount
          displayCurrency // Store original USD currency
        }
      };

      // Always fetch founder data to include in PayTabs customer details (except address fields)
      const founder = await storage.getFounder(founderId);
      
      if (founder || customerEmail || customerName) {
        orderData.customerData = {
          ref: founderId,
          email: customerEmail || founder?.email || `founder-${founderId}@example.com`, // Fallback email for PayTabs
          name: {
            forenames: founder?.fullName?.split(' ').slice(0, -1).join(' ') || customerName?.split(' ').slice(0, -1).join(' ') || founder?.fullName || customerName || 'Customer',
            surname: founder?.fullName?.split(' ').slice(-1)[0] || customerName?.split(' ').slice(-1)[0] || ''
          },
          // Include phone if available from founder data
          phone: founder?.phone || undefined
          // Deliberately excluding address fields (country, city, street) as requested
          // since these are collected in onboarding but not used for payment processing
        };

        appLogger.business('Founder details prepared for PayTabs', {
          founderId,
          hasFounderName: !!founder?.fullName,
          hasFounderEmail: !!founder?.email,
          hasFounderPhone: !!founder?.phone,
          customerEmail: customerEmail || 'from founder data',
          excludedFields: ['country', 'city', 'address', 'street']
        });
      }
      
      // Create order with gateway
      const result = await gateway.createOrder(orderData);
      
      if (!result.success) {
        // Log detailed error information
        appLogger.error('Payment gateway order creation failed', null, {
          orderReference,
          gatewayProvider,
          founderId,
          amount: request.amount,
          currency: request.currency,
          gatewayResponse: result.gatewayResponse,
          gatewayError: result.gatewayResponse?.error || 'Unknown error'
        });
        
        // Update transaction status to failed
        await storage.updatePaymentTransaction(transaction.id, {
          status: 'failed',
          gatewayResponse: result.gatewayResponse
        });
        
        await this.logPaymentAction(transaction.id, gatewayProvider as any, 'creation_failed', result.gatewayResponse);
        
        const errorMessage = result.gatewayResponse?.error?.note || 
                           result.gatewayResponse?.error?.message || 
                           'Failed to create payment order';
        
        return {
          success: false,
          error: errorMessage
        };
      }

      // Update transaction with gateway response
      await storage.updatePaymentTransaction(transaction.id, {
        gatewayTransactionId: result.orderReference,
        paymentUrl: result.paymentUrl,
        expiresAt: result.expiresAt,
        gatewayResponse: result.gatewayResponse
      });

      await this.logPaymentAction(transaction.id, gatewayProvider as any, 'order_created', result.gatewayResponse);

      return {
        success: true,
        paymentUrl: result.paymentUrl,
        orderReference
      };

    } catch (error) {
      appLogger.error('Payment creation error', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async checkPaymentStatus(orderReference: string): Promise<{
    success: boolean;
    status?: string;
    transaction?: PaymentTransaction;
    error?: string;
  }> {
    try {
      // Get transaction from database
      const transaction = await storage.getPaymentTransactionByOrderRef(orderReference);
      if (!transaction) {
        return {
          success: false,
          error: 'Transaction not found'
        };
      }

      // Always check with gateway for latest status (no caching to prevent status discrepancies)
      const gateway = PaymentGatewayFactory.create(transaction.gatewayProvider);
      
      // For PayTabs, we need to use the PayTabs tran_ref, not our cart_id
      let queryReference = orderReference;
      if (transaction.gatewayProvider === 'paytabs' && transaction.gatewayResponse) {
        try {
          const gatewayResponse = typeof transaction.gatewayResponse === 'string' 
            ? JSON.parse(transaction.gatewayResponse) 
            : transaction.gatewayResponse;
          
          if (gatewayResponse.paytabs_tran_ref || gatewayResponse.tran_ref) {
            queryReference = gatewayResponse.paytabs_tran_ref || gatewayResponse.tran_ref;
          } else {
            appLogger.warn('No PayTabs tran_ref found, using database status', { orderReference });
            return {
              success: true,
              status: transaction.status,
              transaction
            };
          }
        } catch (error) {
          appLogger.warn('Could not parse gateway response, using database status', { error: String(error), orderReference });
          return {
            success: true,
            status: transaction.status,
            transaction
          };
        }
      }
      
      const statusResult = await gateway.checkStatus(queryReference);

      // Handle cases where PayTabs can't find the transaction (expired/inactive transactions)
      if (statusResult.success && statusResult.status === 'unknown') {
        appLogger.warn('PayTabs returned unknown status, using database status', { orderReference });
        return {
          success: true,
          status: transaction.status,
          transaction
        };
      }

      if (statusResult.success && statusResult.status !== transaction.status && statusResult.status !== 'unknown') {
        // Update transaction status (skip 'unknown' status as it's not a real status change)
        const updatedTransaction = await storage.updatePaymentTransaction(transaction.id, {
          status: statusResult.status,
          gatewayStatus: statusResult.gatewayStatus,
          gatewayResponse: statusResult.gatewayResponse
        });

        await this.logPaymentAction(transaction.id, transaction.gatewayProvider, 'status_updated', statusResult.gatewayResponse);

        // Send payment status change notification
        await this.sendPaymentStatusNotification(transaction, statusResult.status);
        
        // Log user activity for all payment status changes
        try {
          await this.logPaymentStatusActivity(transaction, statusResult.status);
        } catch (error) {
          appLogger.error('Payment status activity logging error', error);
        }

        // Create subscription if payment completed
        if (statusResult.status === 'completed' && transaction.metadata && 
            typeof transaction.metadata === 'object' && transaction.metadata !== null && 
            'planType' in transaction.metadata) {
          await this.createSubscription(transaction.founderId, transaction.id, transaction.metadata.planType as string, transaction.gatewayProvider);
        }

        return {
          success: true,
          status: statusResult.status,
          transaction: updatedTransaction
        };
      }

      return {
        success: true,
        status: transaction.status,
        transaction
      };

    } catch (error) {
      appLogger.error('Payment status check error', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async handleWebhook(provider: string, payload: any, signature?: string): Promise<{
    success: boolean;
    processed?: boolean;
    error?: string;
  }> {
    try {
      const gateway = PaymentGatewayFactory.create(provider);
      
      // Validate webhook
      if (!gateway.validateWebhook(payload, signature)) {
        return {
          success: false,
          error: 'Invalid webhook signature'
        };
      }

      // Process webhook
      const webhookResult = await gateway.processWebhook(payload, signature);
      
      if (!webhookResult.success) {
        return {
          success: false,
          error: 'Failed to process webhook'
        };
      }

      // Find transaction by order reference
      const transaction = await storage.getPaymentTransactionByOrderRef(webhookResult.orderReference);
      if (!transaction) {
        return {
          success: false,
          error: 'Transaction not found for webhook'
        };
      }

      // Update transaction status if changed (skip 'unknown' status)
      if (webhookResult.status !== transaction.status && webhookResult.status !== 'unknown') {
        const updatedTransaction = await storage.updatePaymentTransaction(transaction.id, {
          status: webhookResult.status,
          gatewayTransactionId: webhookResult.transactionId,
          gatewayResponse: webhookResult.gatewayResponse
        });

        await this.logPaymentAction(transaction.id, provider as any, 'webhook_received', webhookResult.gatewayResponse);

        // Log user activity for webhook status changes
        try {
          await this.logPaymentStatusActivity({...transaction, ...updatedTransaction}, webhookResult.status);
        } catch (error) {
          appLogger.error('Webhook payment activity logging error', error);
        }

        // Send webhook status notification
        await this.sendWebhookNotification(transaction, webhookResult.status, provider);

        // Create subscription if payment completed
        if (webhookResult.status === 'completed' && transaction.metadata && 
            typeof transaction.metadata === 'object' && transaction.metadata !== null && 
            'planType' in transaction.metadata) {
          await this.createSubscription(transaction.founderId, transaction.id, transaction.metadata.planType as string, provider as any);
        }
      }

      return {
        success: true,
        processed: true
      };

    } catch (error) {
      appLogger.error('Webhook processing error', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private async createSubscription(
    founderId: string, 
    transactionId: string, 
    planType: string, 
    gatewayProvider: string
  ): Promise<void> {
    try {
      // Double-check: Use payment logs to prevent duplicate subscription creation
      const paymentLogs = await storage.getPaymentLogs(transactionId);
      const subscriptionCreatedLog = paymentLogs.find(log => 
        log.action === 'subscription_created' || 
        log.notes?.includes('subscription_created')
      );
      
      if (subscriptionCreatedLog) {
        appLogger.business('Subscription creation already logged, preventing duplicate notifications and emails', {
          transactionId,
          founderId,
          existingLogId: subscriptionCreatedLog.id,
          loggedAt: subscriptionCreatedLog.createdAt,
          preventedDuplicateEmails: true,
          preventedDuplicateTeamNotifications: true,
          actionsPrevented: ['subscription_creation', 'team_notification', 'user_emails']
        });
        return;
      }

      // Check if subscription already exists for this transaction to prevent duplicates
      const existingSubscriptions = await storage.getUserSubscriptions(founderId);
      const existingSubscription = existingSubscriptions.find(sub => sub.paymentTransactionId === transactionId);
      if (existingSubscription) {
        appLogger.business('Subscription already exists for transaction, preventing duplicate notifications and emails', {
          transactionId,
          founderId,
          existingSubscriptionId: existingSubscription.id,
          preventedDuplicateEmails: true,
          preventedDuplicateTeamNotifications: true,
          emailsPrevented: ['payment_confirmation', 'investor_matching_next_steps', 'team_deal_room_notification']
        });
        return;
      }

      const subscriptionData: InsertUserSubscription = {
        founderId,
        paymentTransactionId: transactionId,
        planType: planType as any,
        status: 'active',
        gatewayProvider: gatewayProvider as any,
        startsAt: new Date(),
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year from now
      };

      await storage.createUserSubscription(subscriptionData);
      
      await this.logPaymentAction(transactionId, gatewayProvider as any, 'subscription_created', {
        planType,
        startsAt: subscriptionData.startsAt,
        expiresAt: subscriptionData.expiresAt
      });

      // Send team notification for deal room access
      await this.sendDealRoomNotification(founderId, transactionId, planType);
      
      // Send payment confirmation emails (only once when subscription is created)
      const founder = await storage.getFounder(founderId);
      const transaction = await storage.getPaymentTransaction(transactionId);
      if (founder && transaction) {
        appLogger.email('Sending user payment confirmation emails for new subscription', {
          transactionId,
          founderId,
          email: founder.email,
          newSubscription: true
        });
        await this.sendPaymentConfirmationEmails(founder, transaction);
      }

    } catch (error) {
      appLogger.error('Subscription creation error', error);
      // Don't throw here to avoid failing the main payment flow
    }
  }

  private async sendPaymentConfirmationEmails(
    founder: any,
    transaction: PaymentTransaction
  ): Promise<void> {
    try {
      if (!founder.email || !founder.fullName) {
        appLogger.warn('Cannot send payment confirmation email: missing founder data', {
          founderId: transaction.founderId,
          hasEmail: !!founder.email,
          hasName: !!founder.fullName
        });
        return;
      }

      // Simple duplicate prevention: check if this is a repeat call within a short time window
      // This prevents duplicate emails during rapid webhook/status check calls
      const emailKey = `payment_emails_${transaction.id}`;
      const currentTime = Date.now();
      
      // Store a simple timestamp to prevent rapid duplicate calls (use a basic in-memory check)
      if (!global.emailSentTracker) {
        global.emailSentTracker = {};
      }
      
      const lastEmailTime = global.emailSentTracker[emailKey];
      if (lastEmailTime && (currentTime - lastEmailTime) < 60000) { // 1 minute cooldown
        appLogger.warn('Preventing duplicate payment confirmation emails (too soon)', {
          transactionId: transaction.id,
          founderId: transaction.founderId,
          email: founder.email,
          reason: 'Emails sent less than 1 minute ago',
          lastSentAt: new Date(lastEmailTime).toISOString(),
          cooldownRemaining: `${Math.round((60000 - (currentTime - lastEmailTime)) / 1000)}s`,
          preventedEmails: ['payment_confirmation', 'investor_matching_next_steps']
        });
        return;
      }
      
      // Mark that we're sending emails now
      global.emailSentTracker[emailKey] = currentTime;

      // Format payment details
      const paymentAmount = `${transaction.currency || 'USD'} ${transaction.amount}`;
      const paymentDate = new Date(transaction.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      // Send payment confirmation email immediately
      const paymentEmailSent = await this.emailService.sendPaymentSuccessEmail(
        founder.email,
        founder.fullName,
        paymentAmount,
        transaction.orderReference,
        paymentDate
      );

      // Send investor matching next steps email after a short delay (3 seconds)
      setTimeout(async () => {
        try {
          const nextStepsEmailSent = await this.emailService.sendInvestorMatchingNextStepsEmail(
            founder.email,
            founder.fullName
          );
          
          appLogger.email('Investor matching next steps email sent', {
            founderId: transaction.founderId,
            email: founder.email,
            success: nextStepsEmailSent
          });
        } catch (error) {
          appLogger.error('Failed to send investor matching next steps email', error);
        }
      }, 3000);

      // Log that emails were sent (using existing logPaymentAction method)
      await this.logPaymentAction(transaction.id, transaction.gatewayProvider as any, 'emails_sent', {
        paymentEmailSent,
        investorMatchingEmailScheduled: true,
        email: founder.email,
        timestamp: new Date().toISOString()
      });

      appLogger.email('Payment confirmation emails initiated and logged', {
        founderId: transaction.founderId,
        email: founder.email,
        paymentEmailSent,
        paymentAmount,
        orderReference: transaction.orderReference,
        duplicatePrevention: 'emails_sent action logged'
      });

    } catch (error) {
      appLogger.error('Error sending payment confirmation emails', error);
      // Don't throw - this is just email notification, don't fail the main payment flow
    }
  }

  private async sendDealRoomNotification(
    founderId: string, 
    transactionId: string, 
    planType: string
  ): Promise<void> {
    try {
      // Get founder, venture, and evaluation information
      const founder = await storage.getFounder(founderId);
      const ventures = await storage.getVenturesByFounderId(founderId);
      const transaction = await storage.getPaymentTransaction(transactionId);
      
      if (!founder || !ventures.length || !transaction) {
        console.warn('Missing data for deal room notification:', {
          founderId, 
          transactionId, 
          hasFounder: !!founder, 
          venturesCount: ventures.length,
          hasTransaction: !!transaction
        });
        return;
      }

      const venture = ventures[0]; // Use the first/primary venture
      
      // Get evaluation data for box URL and ProofScore
      const evaluations = await storage.getEvaluationsByVentureId(venture.ventureId);
      const currentEvaluation = evaluations.find(evaluation => evaluation.isCurrent) || evaluations[0];
      
      // Calculate status based on ProofScore
      const getStatusFromScore = (score: number): string => {
        if (score >= 85) return 'Investor Ready';
        if (score >= 75) return 'Near Ready';
        if (score >= 60) return 'Emerging Proof';
        if (score >= 40) return 'Early Signals';
        return 'Building Validation';
      };
      
      const proofScore = currentEvaluation?.proofscore || 0;
      const status = getStatusFromScore(proofScore);
      
      // Prepare notification data
      const notificationData = {
        founderName: founder.fullName || 'Unknown',
        founderEmail: founder.email,
        founderPhone: 'N/A',
        founderRole: founder.positionRole || 'Founder',
        ventureName: venture.name,
        ventureIndustry: venture.industry || 'Not specified',
        ventureStage: venture.revenueStage || 'Not specified',
        ventureDescription: venture.description || 'Not provided',
        ventureWebsite: venture.website || undefined,
        boxUrl: currentEvaluation?.folderUrl || 'N/A',
        proofScore: proofScore,
        ventureStatus: status,
        paymentAmount: transaction.amount ? `${transaction.currency || 'USD'} ${transaction.amount}` : 'N/A',
        paymentDate: new Date(transaction.createdAt).toLocaleString(),
        paymentReference: transaction.orderReference,
        maskedPaymentDetails: `${transaction.gatewayProvider?.toUpperCase() || 'GATEWAY'} - Plan: ${planType}`
      };

      // Add unique transaction ID to prevent duplicate notifications
      const notificationWithId = {
        ...notificationData,
        transactionId: transactionId,
        uniqueId: `deal_room_${transactionId}_${Date.now()}`
      };

      const success = await onboardingNotificationService.sendOnboardingSuccessNotification(notificationWithId);
      
      if (success) {
        appLogger.business('Deal room access notification sent to team (unique)', {
          venture: venture.name,
          founder: founder.fullName,
          planType,
          transactionId,
          uniqueNotificationId: notificationWithId.uniqueId,
          preventsDuplicates: true
        });
      } else {
        appLogger.error('Failed to send deal room access notification to team', {
          transactionId,
          venture: venture.name
        });
      }

    } catch (error) {
      appLogger.error('Error sending deal room notification', error);
      // Don't throw - this is just a notification, don't fail the main flow
    }
  }

  private async sendPaymentStatusNotification(
    transaction: PaymentTransaction,
    newStatus: string
  ): Promise<void> {
    try {
      if (!eastEmblemAPI.isConfigured()) {
        return;
      }

      // Get founder information
      const founder = await storage.getFounder(transaction.founderId);
      if (!founder) {
        return;
      }

      // Create status-specific message
      let statusEmoji = '';
      let statusText = '';
      let statusDescription = '';

      switch (newStatus) {
        case 'completed':
          statusEmoji = '✅';
          statusText = 'Payment Successful';
          statusDescription = 'Payment has been processed successfully';
          
          // Send payment confirmation emails when payment is completed
          await this.sendPaymentConfirmationEmails(founder, transaction);
          break;
        case 'failed':
          statusEmoji = '❌';
          statusText = 'Payment Failed';
          statusDescription = 'Payment processing failed';
          break;
        case 'cancelled':
          statusEmoji = '🚫';
          statusText = 'Payment Cancelled';
          statusDescription = 'Payment was cancelled by user';
          break;
        case 'expired':
          statusEmoji = '⏰';
          statusText = 'Payment Expired';
          statusDescription = 'Payment link has expired';
          break;
        case 'pending':
          statusEmoji = '⏳';
          statusText = 'Payment Pending';
          statusDescription = 'Payment is being processed';
          break;
        default:
          statusEmoji = '🔄';
          statusText = 'Payment Status Updated';
          statusDescription = `Payment status changed to: ${newStatus}`;
      }

      const statusMessage = `\`Founder ID: ${transaction.founderId}\`
${statusEmoji} **${statusText}**

**Founder:** ${founder.fullName} (${founder.email})
**Amount:** ${transaction.currency || 'USD'} ${transaction.amount}
**Order Reference:** ${transaction.orderReference}
**Gateway:** ${transaction.gatewayProvider?.toUpperCase() || 'UNKNOWN'}

📋 **Status:** ${statusDescription}`;

      await eastEmblemAPI.sendSlackNotification(
        statusMessage,
        "#notifications",
        transaction.founderId
      );

      appLogger.external('Payment status notification sent', {
        founderId: transaction.founderId,
        orderReference: transaction.orderReference,
        status: newStatus
      });

    } catch (error) {
      appLogger.error('Error sending payment status notification', error);
      // Don't throw - this is just a notification, don't fail the main flow
    }
  }

  private async sendWebhookNotification(
    transaction: PaymentTransaction,
    newStatus: string,
    provider: string
  ): Promise<void> {
    try {
      if (!eastEmblemAPI.isConfigured()) {
        return;
      }

      // Get founder information
      const founder = await storage.getFounder(transaction.founderId);
      if (!founder) {
        return;
      }

      // Create webhook-specific message
      let statusEmoji = '';
      let statusText = '';

      switch (newStatus) {
        case 'completed':
          statusEmoji = '🎉';
          statusText = 'Payment Confirmed (Webhook)';
          break;
        case 'failed':
          statusEmoji = '💥';
          statusText = 'Payment Failed (Webhook)';
          break;
        case 'cancelled':
          statusEmoji = '🛑';
          statusText = 'Payment Cancelled (Webhook)';
          break;
        case 'expired':
          statusEmoji = '💤';
          statusText = 'Payment Expired (Webhook)';
          break;
        default:
          statusEmoji = '📡';
          statusText = `Payment Webhook: ${newStatus}`;
      }

      const webhookMessage = `\`Founder ID: ${transaction.founderId}\`
${statusEmoji} **${statusText}**

**Founder:** ${founder.fullName} (${founder.email})
**Amount:** ${transaction.currency || 'USD'} ${transaction.amount}
**Order Reference:** ${transaction.orderReference}
**Gateway:** ${provider.toUpperCase()}

📡 **Source:** Gateway webhook notification`;

      await eastEmblemAPI.sendSlackNotification(
        webhookMessage,
        "#notifications",
        transaction.founderId
      );

      appLogger.external('Webhook notification sent', {
        founderId: transaction.founderId,
        orderReference: transaction.orderReference,
        status: newStatus,
        provider
      });

    } catch (error) {
      appLogger.error('Error sending webhook notification', error);
      // Don't throw - this is just a notification, don't fail the main flow
    }
  }

  private async logPaymentAction(
    transactionId: string,
    gatewayProvider: 'telr' | 'stripe' | 'paypal' | 'paytabs',
    action: string,
    data: any
  ): Promise<void> {
    try {
      const logData: InsertPaymentLog = {
        transactionId,
        gatewayProvider,
        action,
        requestData: action.includes('request') ? data : null,
        responseData: action.includes('response') || action.includes('webhook') ? data : data
      };

      await storage.createPaymentLog(logData);
    } catch (error) {
      appLogger.error('Payment logging error', error);
      // Don't throw here to avoid failing the main flow
    }
  }

  async getUserSubscriptions(founderId: string) {
    return await storage.getUserSubscriptions(founderId);
  }

  async hasDealRoomAccess(founderId: string): Promise<boolean> {
    try {
      // Get user's payment history
      const transactions = await this.getPaymentHistory(founderId);
      
      // Check for any completed payment (deal room or pre-onboarding)
      const completedPayments = transactions.filter((transaction: PaymentTransaction) => 
        transaction.status === 'completed'
      );
      
      return completedPayments.length > 0;
    } catch (error) {
      appLogger.error('Deal room access check error', error);
      return false;
    }
  }

  async updatePaymentStatus(orderReference: string, status: string): Promise<{
    success: boolean;
    transaction?: PaymentTransaction;
    error?: string;
  }> {
    try {
      // Get transaction by order reference
      const transaction = await storage.getPaymentTransactionByOrderRef(orderReference);
      if (!transaction) {
        return {
          success: false,
          error: 'Transaction not found'
        };
      }

      // Only proceed if status has actually changed
      if (transaction.status === status) {
        return {
          success: true,
          transaction
        };
      }

      // Update status
      const updatedTransaction = await storage.updatePaymentTransaction(transaction.id, {
        status: status as any
      });

      // Log the update
      await this.logPaymentAction(transaction.id, transaction.gatewayProvider, 'status_updated', {
        oldStatus: transaction.status,
        newStatus: status
      });

      // Log user activity for manual status changes
      try {
        await this.logPaymentStatusActivity({...transaction, ...updatedTransaction}, status);
      } catch (error) {
        appLogger.error('Manual payment status activity logging error', error);
      }

      // Send payment status notifications (Slack + emails if completed)
      await this.sendPaymentStatusNotification(updatedTransaction, status);

      // Create subscription if payment completed
      if (status === 'completed' && transaction.metadata && 
          typeof transaction.metadata === 'object' && transaction.metadata !== null && 
          'planType' in transaction.metadata) {
        await this.createSubscription(transaction.founderId, transaction.id, transaction.metadata.planType as string, transaction.gatewayProvider);
      }

      return {
        success: true,
        transaction: updatedTransaction
      };

    } catch (error) {
      appLogger.error('Payment status update error', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async getPaymentHistory(founderId: string) {
    return await storage.getPaymentTransactions(founderId);
  }

  /**
   * Log user activity for payment status changes
   */
  private async logPaymentStatusActivity(transaction: any, newStatus: string) {
    const purpose = transaction.metadata && typeof transaction.metadata === 'object' && 'purpose' in transaction.metadata 
      ? (transaction.metadata as any).purpose 
      : 'Payment';

    // Get founder's current venture for proper event scoping
    let ventureId: string | null = null;
    try {
      const ventures = await storage.getVenturesByFounderId(transaction.founderId);
      const currentVenture = ventures.find((v: any) => v.isCurrent === true) || ventures[0];
      ventureId = currentVenture?.ventureId || null;
    } catch (error) {
      appLogger.warn('Failed to get venture for payment activity logging', { 
        founderId: transaction.founderId,
        error 
      });
    }

    const baseMetadata = {
      orderReference: transaction.orderReference,
      amount: transaction.amount,
      currency: transaction.currency,
      purpose,
      gatewayProvider: transaction.gatewayProvider,
      previousStatus: transaction.status,
      newStatus,
      ventureId // Include ventureId for proper event scoping
    };

    let activityData;

    switch (newStatus) {
      case 'completed':
        activityData = {
          activityType: 'venture' as const,
          action: 'payment_completed',
          title: 'Payment Successful',
          description: `Payment completed for ${transaction.description || purpose}`,
          metadata: baseMetadata
        };
        break;

      case 'failed':
        activityData = {
          activityType: 'venture' as const,
          action: 'payment_failed',
          title: 'Payment Failed',
          description: `Payment failed for ${transaction.description || purpose}`,
          metadata: baseMetadata
        };
        break;

      case 'cancelled':
        activityData = {
          activityType: 'venture' as const,
          action: 'payment_cancelled',
          title: 'Payment Cancelled',
          description: `Payment cancelled for ${transaction.description || purpose}`,
          metadata: baseMetadata
        };
        break;

      case 'expired':
        activityData = {
          activityType: 'venture' as const,
          action: 'payment_expired',
          title: 'Payment Expired',
          description: `Payment expired for ${transaction.description || purpose}`,
          metadata: baseMetadata
        };
        break;

      case 'pending':
        activityData = {
          activityType: 'venture' as const,
          action: 'payment_pending',
          title: 'Payment Pending',
          description: `Payment is pending for ${transaction.description || purpose}`,
          metadata: baseMetadata
        };
        break;

      default:
        // For any other status changes, log as general payment status update
        activityData = {
          activityType: 'venture' as const,
          action: 'payment_status_updated',
          title: 'Payment Status Updated',
          description: `Payment status changed to ${newStatus} for ${transaction.description || purpose}`,
          metadata: baseMetadata
        };
        break;
    }

    await ActivityService.logActivity(
      { founderId: transaction.founderId },
      activityData
    );

    // Emit DEAL_ROOM_PURCHASED event for successful Deal Room purchases
    if (newStatus === 'completed' && purpose && 
        (purpose.toLowerCase().includes('deal room') || purpose.toLowerCase().includes('deal_room'))) {
      await ActivityService.logActivity(
        { 
          founderId: transaction.founderId,
          ventureId: ventureId || undefined // Include ventureId in context for proper event scoping
        },
        {
          activityType: 'venture' as const,
          action: COACH_EVENTS.DEAL_ROOM_PURCHASED,
          title: 'Deal Room Access Purchased',
          description: 'Successfully purchased Deal Room access - ready for investor matching',
          metadata: {
            ...baseMetadata,
            milestone: 'deal_room_unlocked'
          }
        }
      );
      appLogger.business('DEAL_ROOM_PURCHASED event logged', {
        founderId: transaction.founderId,
        ventureId,
        orderReference: transaction.orderReference
      });

      // Emit COMMUNITY_ACCESSED event - user now has access to community features
      await ActivityService.logActivity(
        { 
          founderId: transaction.founderId,
          ventureId: ventureId || undefined // Include ventureId in context for proper event scoping
        },
        {
          activityType: 'venture' as const,
          action: COACH_EVENTS.COMMUNITY_ACCESSED,
          title: 'Community Access Granted',
          description: 'Unlocked community features after Deal Room purchase',
          metadata: {
            ...baseMetadata,
            accessType: 'deal_room_purchase'
          }
        }
      );
      appLogger.business('COMMUNITY_ACCESSED event logged', {
        founderId: transaction.founderId,
        ventureId,
        orderReference: transaction.orderReference
      });
    }

    appLogger.business(`Payment activity logged: ${activityData.action}`, {
      founderId: transaction.founderId,
      orderReference: transaction.orderReference,
      status: newStatus,
      action: activityData.action
    });
  }
}

export const paymentService = new PaymentService();