import { PaymentGatewayFactory, type PaymentOrderData, type CreatePaymentRequest } from '../lib/payment-gateway.js';
import { storage } from '../storage.js';
import type { PaymentTransaction, InsertPaymentTransaction, InsertUserSubscription, InsertPaymentLog } from '@shared/schema';
import { v4 as uuidv4 } from 'uuid';

interface CreatePaymentOptions {
  founderId: string;
  request: CreatePaymentRequest;
  customerEmail?: string;
  customerName?: string;
  gatewayProvider?: string;
}

interface PaymentStatusUpdate {
  status: 'pending' | 'completed' | 'failed' | 'cancelled' | 'expired';
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
      // Build URL from Replit domain
      baseUrl = `https://${replitDomain}`;
    } else {
      // Fallback to localhost
      baseUrl = 'http://localhost:5000';
    }
    
    return {
      authorised: `${baseUrl}/payment/success?ref=${orderReference}`,
      declined: `${baseUrl}/payment/failed?ref=${orderReference}`,
      cancelled: `${baseUrl}/payment/cancelled?ref=${orderReference}`
    };
  }

  async createPayment(options: CreatePaymentOptions): Promise<{
    success: boolean;
    paymentUrl?: string;
    orderReference?: string;
    error?: string;
  }> {
    const { founderId, request, customerEmail, customerName, gatewayProvider = 'telr' } = options;
    
    try {
      // Generate unique order reference
      const orderReference = `SC_${Date.now()}_${uuidv4().substring(0, 8)}`;
      
      // Create transaction record first
      const transactionData: InsertPaymentTransaction = {
        founderId,
        gatewayProvider: gatewayProvider as any,
        orderReference,
        amount: request.amount.toString(),
        currency: request.currency,
        status: 'pending',
        description: request.description,
        metadata: request.metadata
      };

      const transaction = await storage.createPaymentTransaction(transactionData);
      
      // Log the creation
      await this.logPaymentAction(transaction.id, gatewayProvider as any, 'created', {
        orderReference,
        amount: request.amount,
        currency: request.currency
      });

      // Get payment gateway implementation
      const gateway = PaymentGatewayFactory.create(gatewayProvider);
      
      // Prepare order data for gateway
      const orderData: PaymentOrderData = {
        orderId: orderReference,
        amount: request.amount,
        currency: request.currency,
        description: request.description,
        returnUrls: this.getReturnUrls(orderReference),
        metadata: {
          founderId,
          planType: request.planType,
          ...request.metadata
        }
      };

      // Add customer data if available
      if (customerEmail || customerName) {
        orderData.customerData = {
          ref: founderId,
          email: customerEmail,
          ...(customerName && {
            name: {
              forenames: customerName.split(' ').slice(0, -1).join(' ') || customerName,
              surname: customerName.split(' ').slice(-1)[0] || ''
            }
          })
        };
      }

      // Create order with gateway
      const result = await gateway.createOrder(orderData);
      
      if (!result.success) {
        // Update transaction status to failed
        await storage.updatePaymentTransaction(transaction.id, {
          status: 'failed',
          gatewayResponse: result.gatewayResponse
        });
        
        await this.logPaymentAction(transaction.id, gatewayProvider as any, 'creation_failed', result.gatewayResponse);
        
        return {
          success: false,
          error: 'Failed to create payment order'
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
      console.error('Payment creation error:', error);
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
      const statusResult = await gateway.checkStatus(transaction.gatewayTransactionId || orderReference);

      if (statusResult.success && statusResult.status !== transaction.status) {
        // Update transaction status
        const updatedTransaction = await storage.updatePaymentTransaction(transaction.id, {
          status: statusResult.status,
          gatewayStatus: statusResult.gatewayStatus,
          gatewayResponse: statusResult.gatewayResponse
        });

        await this.logPaymentAction(transaction.id, transaction.gatewayProvider, 'status_updated', statusResult.gatewayResponse);

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
      console.error('Payment status check error:', error);
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

      // Update transaction status if changed
      if (webhookResult.status !== transaction.status) {
        await storage.updatePaymentTransaction(transaction.id, {
          status: webhookResult.status,
          gatewayTransactionId: webhookResult.transactionId,
          gatewayResponse: webhookResult.gatewayResponse
        });

        await this.logPaymentAction(transaction.id, provider as any, 'webhook_received', webhookResult.gatewayResponse);

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
      console.error('Webhook processing error:', error);
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

    } catch (error) {
      console.error('Subscription creation error:', error);
      // Don't throw here to avoid failing the main payment flow
    }
  }

  private async logPaymentAction(
    transactionId: string,
    gatewayProvider: 'telr' | 'stripe' | 'paypal',
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
      console.error('Payment logging error:', error);
      // Don't throw here to avoid failing the main flow
    }
  }

  async getUserSubscriptions(founderId: string) {
    return await storage.getUserSubscriptions(founderId);
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
      console.error('Payment status update error:', error);
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