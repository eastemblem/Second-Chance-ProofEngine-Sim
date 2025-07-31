import { z } from 'zod';

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
  status: 'pending' | 'completed' | 'failed' | 'cancelled' | 'expired';
  gatewayStatus?: string;
  transactionId?: string;
  amount?: number;
  currency?: string;
  gatewayResponse: any;
}

export interface WebhookResponse {
  success: boolean;
  orderReference: string;
  status: 'pending' | 'completed' | 'failed' | 'cancelled' | 'expired';
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
      framed: 0, // Full screen payment page
      order: {
        cartid: orderData.orderId,
        test: process.env.NODE_ENV === 'development' ? '1' : '0',
        amount: orderData.amount.toFixed(2),
        currency: orderData.currency,
        description: orderData.description
      },
      return: orderData.returnUrls,
      ...(orderData.customerData && { customer: orderData.customerData }),
      ...(orderData.metadata && {
        extra: {
          gateway: 'telr',
          ...orderData.metadata
        }
      })
    };

    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'accept': 'application/json'
        },
        body: JSON.stringify(telrRequest)
      });

      const result = await response.json();

      if (result.error) {
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
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'accept': 'application/json'
        },
        body: JSON.stringify(telrRequest)
      });

      const result = await response.json();

      if (result.error) {
        return {
          success: false,
          status: 'failed',
          gatewayResponse: result
        };
      }

      // Map Telr status codes to our generic status
      let status: PaymentStatusResponse['status'] = 'pending';
      if (result.order?.status?.code === 3) {
        status = 'completed';
      } else if (result.order?.status?.code === 1) {
        status = 'cancelled';
      } else if (result.order?.status?.code === 2) {
        status = 'failed';
      }

      return {
        success: true,
        status,
        gatewayStatus: result.order?.status?.text,
        transactionId: result.order?.transaction?.ref,
        amount: parseFloat(result.order?.amount || '0'),
        currency: result.order?.currency,
        gatewayResponse: result
      };
    } catch (error) {
      throw new Error(`Telr status check error: ${error}`);
    }
  }

  async processWebhook(payload: any, signature?: string): Promise<WebhookResponse> {
    // Telr doesn't use signature validation in the same way as other providers
    // The webhook payload contains the order reference and status information
    
    try {
      // Extract status from webhook payload
      // Telr webhook format may vary, this is a basic implementation
      const orderRef = payload.OrderRef || payload.order?.ref;
      let status: WebhookResponse['status'] = 'pending';
      
      if (payload.STATUS === '9') {
        status = 'completed';
      } else if (payload.STATUS === '1') {
        status = 'cancelled';
      } else if (payload.STATUS === '2') {
        status = 'failed';
      }

      return {
        success: true,
        orderReference: orderRef,
        status,
        transactionId: payload.PAYID,
        gatewayResponse: payload
      };
    } catch (error) {
      throw new Error(`Telr webhook processing error: ${error}`);
    }
  }

  validateWebhook(payload: any, signature?: string): boolean {
    // Telr webhook validation
    // For now, we'll do basic validation - in production, you might want to add IP whitelisting
    return payload && (payload.OrderRef || payload.order?.ref);
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