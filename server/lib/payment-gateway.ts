import { z } from 'zod';
import { SecurityUtils } from './security-utils';
import { PaymentStatusMapper, type PaymentStatus } from './payment-status-mapper';

// Payment gateway interfaces
export interface CustomerData {
  ref?: string;
  email?: string;
  name?: {
    title?: string;
    forenames?: string;
    surname?: string;
  };
  address?: {
    line1?: string;
    line2?: string;
    line3?: string;
    city?: string;
    state?: string;
    country?: string;
    areacode?: string;
  };
  phone?: string;
}

export interface ReturnUrls {
  authorised: string;
  declined: string;
  cancelled: string;
}

export interface PaymentOrderData {
  orderId: string;
  amount: number;
  currency: string;
  description: string;
  customerData?: CustomerData;
  returnUrls: ReturnUrls;
  metadata?: Record<string, any>;
}

export interface PaymentOrderResponse {
  success: boolean;
  orderReference: string;
  paymentUrl: string;
  expiresAt?: Date;
  gatewayResponse: any;
}

export interface PaymentStatusResponse {
  success: boolean;
  status: PaymentStatus;
  gatewayStatus?: string;
  transactionId?: string;
  amount?: number;
  currency?: string;
  gatewayResponse: any;
}

export interface WebhookResponse {
  success: boolean;
  orderReference: string;
  status: PaymentStatus;
  transactionId?: string;
  gatewayResponse: any;
}

// Abstract payment gateway interface
export abstract class PaymentGateway {
  abstract readonly provider: string;
  
  abstract createOrder(orderData: PaymentOrderData): Promise<PaymentOrderResponse>;
  abstract checkStatus(orderRef: string): Promise<PaymentStatusResponse>;
  abstract processWebhook(payload: any, signature?: string): Promise<WebhookResponse>;
  abstract validateWebhook(payload: any, signature?: string): boolean;
}

// Payment gateway factory
export class PaymentGatewayFactory {
  static create(provider: string): PaymentGateway {
    switch (provider) {
      case 'telr':
        return new TelrGateway();
      default:
        throw new Error(`Unsupported payment gateway: ${provider}`);
    }
  }
  
  static getSupportedGateways(): string[] {
    return ['telr'];
  }
}

// Telr Gateway Implementation
class TelrGateway extends PaymentGateway {
  readonly provider = 'telr';
  private readonly baseUrl = 'https://secure.telr.com/gateway/order.json';
  private readonly storeId = process.env.TELR_STORE_ID;
  private readonly authKey = process.env.TELR_AUTH_KEY;
  
  constructor() {
    super();
    if (!this.storeId || !this.authKey) {
      throw new Error('Telr credentials not configured');
    }
  }

  async createOrder(orderData: PaymentOrderData): Promise<PaymentOrderResponse> {
    const telrRequest = {
      method: 'create',
      store: parseInt(this.storeId!),
      authkey: this.authKey,
      framed: 0, // Full screen payment page - hosted page solution
      order: {
        cartid: orderData.orderId,
        test: process.env.NODE_ENV === 'development' ? '1' : '0',
        amount: orderData.amount.toFixed(2),
        currency: orderData.currency,
        description: orderData.description
      },
      return: {
        authorised: orderData.returnUrls.authorised,
        declined: orderData.returnUrls.declined,
        cancelled: orderData.returnUrls.cancelled
      },
      ...(orderData.customerData && { customer: SecurityUtils.sanitizeCustomerData(orderData.customerData) }),
      ...(orderData.metadata && {
        extra: {
          gateway: 'telr',
          ...orderData.metadata
        }
      })
    };

    try {
      console.log('Telr request payload:', JSON.stringify(telrRequest, null, 2));
      
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'accept': 'application/json'
        },
        body: JSON.stringify(telrRequest)
      });

      const result = await response.json();
      console.log('Telr raw response:', JSON.stringify(result, null, 2));

      if (result.error) {
        console.error('Telr API error:', result.error);
        return {
          success: false,
          orderReference: '',
          paymentUrl: '',
          gatewayResponse: result
        };
      }

      return {
        success: true,
        orderReference: result.order.ref,
        paymentUrl: result.order.url,
        expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes from now
        gatewayResponse: result
      };
    } catch (error) {
      throw new Error(`Telr API error: ${error}`);
    }
  }

  async checkStatus(orderRef: string): Promise<PaymentStatusResponse> {
    const telrRequest = {
      method: 'check',
      store: parseInt(this.storeId!),
      authkey: this.authKey,
      order: {
        ref: orderRef
      }
    };

    try {
      console.log(`Making Telr status check request for order: ${orderRef}`);
      console.log(`Request payload:`, JSON.stringify(telrRequest, null, 2));
      
      const response = await fetch('https://secure.telr.com/gateway/order.json', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'accept': 'application/json'
        },
        body: JSON.stringify(telrRequest)
      });

      if (!response.ok) {
        throw new Error(`Telr API responded with status ${response.status}`);
      }

      const result = await response.json();
      console.log(`Telr status check response:`, JSON.stringify(result, null, 2));

      if (result.error) {
        console.error(`Telr status check error:`, result.error);
        return {
          success: false,
          status: 'failed',
          gatewayResponse: result
        };
      }

      // Map Telr status codes to our generic status using centralized mapper
      const statusCode = result.order?.status?.code;
      const statusText = result.order?.status?.text;
      
      console.log(`Telr order status - Code: ${statusCode}, Text: ${statusText}`);
      
      const status = PaymentStatusMapper.mapTelrApiStatus(statusCode, statusText);

      console.log(`Mapped status: ${status}`);

      return {
        success: true,
        status,
        gatewayStatus: statusText,
        transactionId: result.order?.transaction?.ref,
        amount: parseFloat(result.order?.amount || '0'),
        currency: result.order?.currency,
        gatewayResponse: result
      };
    } catch (error) {
      console.error(`Telr status check error for order ${orderRef}:`, error);
      throw new Error(`Telr status check error: ${error}`);
    }
  }

  async processWebhook(payload: any, signature?: string): Promise<WebhookResponse> {
    // Telr webhook processing for hosted payment page callbacks
    
    try {
      // Telr sends callback data via POST or GET with order information
      const orderRef = payload.order_ref || payload.cartid || payload.OrderRef;
      
      // Telr status mapping for hosted page callbacks using centralized mapper
      const telrStatus = payload.status || payload.STATUS;
      let status = PaymentStatusMapper.mapTelrWebhookStatus(telrStatus);
      
      if (telrStatus === 'H' || telrStatus === '0' || telrStatus === 'pending') {
        status = 'pending';
      }

      return {
        success: true,
        orderReference: orderRef,
        status,
        transactionId: payload.tranref || payload.transaction_ref || payload.PAYID,
        gatewayResponse: payload
      };
    } catch (error) {
      throw new Error(`Telr webhook processing error: ${error}`);
    }
  }

  validateWebhook(payload: any, signature?: string): boolean {
    // Enhanced webhook validation with signature verification
    if (!signature || !process.env.TELR_WEBHOOK_SECRET) {
      console.warn('Webhook signature validation skipped - no signature or secret configured');
      // Fall back to basic validation for backward compatibility
      const hasOrderRef = payload && (
        payload.order_ref || 
        payload.cartid || 
        payload.OrderRef ||
        payload.order?.ref
      );
      
      const hasStatus = payload && (
        payload.status ||
        payload.STATUS ||
        payload.order?.status
      );
      
      return !!(hasOrderRef && hasStatus);
    }
    
    return SecurityUtils.verifyTelrWebhookSignature(payload, signature, process.env.TELR_WEBHOOK_SECRET);
  }
}

// Request/Response validation schemas
export const createPaymentRequestSchema = z.object({
  amount: z.number().positive('Amount must be positive'),
  currency: z.string().length(3, 'Currency must be 3 characters').default('AED'),
  description: z.string().min(1, 'Description is required'),
  planType: z.enum(['basic', 'premium', 'enterprise']).optional(),
  metadata: z.record(z.any()).optional()
});

export const checkPaymentStatusSchema = z.object({
  orderReference: z.string().min(1, 'Order reference is required')
});

export type CreatePaymentRequest = z.infer<typeof createPaymentRequestSchema>;
export type CheckPaymentStatusRequest = z.infer<typeof checkPaymentStatusSchema>;