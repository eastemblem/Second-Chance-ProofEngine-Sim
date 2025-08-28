import { PaymentGatewayFactory, type PaymentOrderData, type CreatePaymentRequest } from '../lib/payment-gateway.js';
import { storage } from '../storage.js';
import type { PaymentTransaction, InsertPaymentTransaction, InsertUserSubscription, InsertPaymentLog } from '@shared/schema';
import { v4 as uuidv4 } from 'uuid';
import { ActivityService } from './activity-service.js';
import { appLogger } from '../utils/logger';
import { onboardingNotificationService } from './onboardingNotificationService';
import { eastEmblemAPI } from '../eastemblem-api.js';

// Currency conversion service
class CurrencyConverter {
  // Current rate: 1 USD = 3.673 AED (as of August 18, 2025)
  // In production, this should come from a real-time API
  private static readonly USD_TO_AED_RATE = 3.673;

  static convertUsdToAed(usdAmount: number): number {
    return Math.round(usdAmount * this.USD_TO_AED_RATE * 100) / 100; // Round to 2 decimal places
  }

  static getDisplayCurrency(): string {
    return 'USD';
  }

  static getPaymentCurrency(): string {
    return 'AED';
  }

  static formatPrice(amount: number, currency: string): string {
    return currency === 'USD' ? `$${amount}` : `${amount} ${currency}`;
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
          paymentAmount: request.currency === 'USD' ? CurrencyConverter.convertUsdToAed(request.amount) : request.amount,
          paymentCurrency: request.currency === 'USD' ? 'AED' : request.currency,
          conversionRate: request.currency === 'USD' ? 3.673 : 1
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
      
      // Currency conversion: Convert USD to AED for Telr
      const displayAmount = request.amount; // Amount shown to user (USD)
      const displayCurrency = request.currency; // Currency shown to user (USD)
      const paymentAmount = displayCurrency === 'USD' ? 
        CurrencyConverter.convertUsdToAed(displayAmount) : displayAmount;
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

      // Add customer data if available - PayTabs requires complete customer details
      if (customerEmail || customerName) {
        // Fetch founder data from database to get real address information
        const founder = await storage.getFounder(founderId);
        
        orderData.customerData = {
          ref: founderId,
          email: customerEmail,
          ...(customerName && {
            name: {
              forenames: customerName.split(' ').slice(0, -1).join(' ') || customerName,
              surname: customerName.split(' ').slice(-1)[0] || ''
            }
          }),
          // Use real founder address data if available, otherwise skip address fields
          ...(founder && (founder.street || founder.city || founder.country) && {
            address: {
              line1: founder.street || undefined,
              city: founder.city || undefined,
              state: founder.state || undefined,
              country: founder.country || undefined,
              areacode: undefined // We don't collect postal code yet
            }
          }),
          // Use real founder phone if available
          phone: founder?.phone || undefined
        };
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
        if (statusResult.status === 'completed') {
          try {
            await ActivityService.logActivity(
              { founderId: transaction.founderId },
              {
                activityType: 'venture',
                action: 'payment_completed',
                title: 'Payment Successful',
                description: `Payment completed for ${transaction.description}`,
                metadata: {
                  orderReference: transaction.orderReference,
                  amount: transaction.amount,
                  currency: transaction.currency,
                  purpose: transaction.metadata && typeof transaction.metadata === 'object' && 'purpose' in transaction.metadata 
                    ? (transaction.metadata as any).purpose 
                    : 'Payment',
                  gatewayProvider: transaction.gatewayProvider
                }
              }
            );
          } catch (error) {
            appLogger.error('Payment completion activity logging error', error);
          }
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
        await storage.updatePaymentTransaction(transaction.id, {
          status: webhookResult.status,
          gatewayTransactionId: webhookResult.transactionId,
          gatewayResponse: webhookResult.gatewayResponse
        });

        await this.logPaymentAction(transaction.id, provider as any, 'webhook_received', webhookResult.gatewayResponse);

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

    } catch (error) {
      appLogger.error('Subscription creation error', error);
      // Don't throw here to avoid failing the main payment flow
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

      const success = await onboardingNotificationService.sendOnboardingSuccessNotification(notificationData);
      
      if (success) {
        appLogger.business('Deal room access notification sent to team', {
          venture: venture.name,
          founder: founder.fullName,
          planType
        });
      } else {
        appLogger.error('Failed to send deal room access notification to team');
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
      
      // Check for completed deal room access payments
      const dealRoomPayments = transactions.filter((transaction: PaymentTransaction) => 
        transaction.status === 'completed' && 
        transaction.metadata && 
        typeof transaction.metadata === 'object' &&
        (transaction.metadata as any).purpose === 'Access Deal Room'
      );
      
      return dealRoomPayments.length > 0;
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

      // Update status
      const updatedTransaction = await storage.updatePaymentTransaction(transaction.id, {
        status: status as any
      });

      // Log the update
      await this.logPaymentAction(transaction.id, transaction.gatewayProvider, 'status_updated', {
        oldStatus: transaction.status,
        newStatus: status
      });

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
}

export const paymentService = new PaymentService();