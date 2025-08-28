import { z } from 'zod';
import { appLogger } from '../utils/logger';
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
  callback?: string;  // Optional callback URL for server-to-server IPN
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
      case 'paytabs':
        return new PayTabsGateway();
      case 'telr':
        return new TelrGateway();
      default:
        throw new Error(`Unsupported payment gateway: ${provider}`);
    }
  }
  
  static getSupportedGateways(): string[] {
    return ['paytabs', 'telr'];
  }
}

// Telr Gateway Implementation
class TelrGateway extends PaymentGateway {
  readonly provider = 'telr';
  private readonly baseUrl = 'https://secure.telr.com/gateway/order.json';
  private readonly storeId = process.env.TELR_STORE_ID;
  private readonly authKey = process.env.TELR_AUTH_KEY;
  private readonly testMode = process.env.TELR_TEST_MODE === 'true';
  
  constructor() {
    super();
    if (!this.storeId || !this.authKey) {
      throw new Error('Telr credentials not configured');
    }
    appLogger.business(`🔥 Telr Gateway initialized - Test Mode: ${this.testMode ? 'ENABLED' : 'DISABLED'}`);
  }

  async createOrder(orderData: PaymentOrderData): Promise<PaymentOrderResponse> {
    const telrRequest = {
      method: 'create',
      store: parseInt(this.storeId!),
      authkey: this.authKey,
      framed: 1, // Framed payment page that stays within iframe
      order: {
        cartid: orderData.orderId,
        test: this.testMode ? '1' : '0',
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
          founderId: orderData.metadata.founderId,
          planType: orderData.metadata.planType,
          purpose: orderData.metadata.purpose,
          displayAmount: orderData.metadata.displayAmount?.toString(),
          displayCurrency: orderData.metadata.displayCurrency
          // Total: 6 variables (within 7 limit)
        }
      })
    };

    try {
      // Count extra variables to ensure we're within Telr's 7-variable limit
      const extraCount = telrRequest.extra ? Object.keys(telrRequest.extra).length : 0;
      appLogger.business(`🔥 Telr extra variables count: ${extraCount}/7`);
      appLogger.business('🔥 Telr extra variables:', telrRequest.extra);
      appLogger.business('Telr request payload:', JSON.stringify(telrRequest, null, 2));
      
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'accept': 'application/json'
        },
        body: JSON.stringify(telrRequest)
      });

      const result = await response.json();
      appLogger.external('Telr raw response:', JSON.stringify(result, null, 2));

      if (result.error) {
        appLogger.error('Telr API error', result.error);
        return {
          success: false,
          orderReference: '',
          paymentUrl: '',
          gatewayResponse: result
        };
      }

      // Check if we have the expected response structure
      if (!result.order || !result.order.ref || !result.order.url) {
        appLogger.error('Telr API returned unexpected response structure', null, result);
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
      appLogger.external(`Making Telr status check request for order: ${orderRef}`);
      appLogger.external(`Request payload:`, JSON.stringify(telrRequest, null, 2));
      
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
      appLogger.external(`Telr status check response:`, JSON.stringify(result, null, 2));

      if (result.error) {
        appLogger.error(`Telr status check error`, result.error);
        return {
          success: false,
          status: 'failed',
          gatewayResponse: result
        };
      }

      // Map Telr status codes to our generic status using centralized mapper
      const statusCode = result.order?.status?.code;
      const statusText = result.order?.status?.text;
      
      appLogger.external(`Telr order status - Code: ${statusCode}, Text: ${statusText}`);
      
      const status = PaymentStatusMapper.mapTelrApiStatus(statusCode, statusText);

      appLogger.external(`Mapped status: ${status}`);

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
      appLogger.error(`Telr status check error for order ${orderRef}`, error);
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

// PayTabs Gateway Implementation
class PayTabsGateway extends PaymentGateway {
  readonly provider = 'paytabs';
  private readonly baseUrl: string;
  private readonly profileId = process.env.PAYTABS_PROFILE_ID;
  private readonly serverKey = process.env.PAYTABS_SERVER_KEY;
  private readonly testMode = process.env.PAYTABS_TEST_MODE === 'true';
  private readonly region = process.env.PAYTABS_REGION || 'global';
  
  constructor() {
    super();
    if (!this.profileId || !this.serverKey) {
      throw new Error('PayTabs credentials not configured');
    }
    
    // Set appropriate endpoint based on region
    this.baseUrl = this.getEndpointUrl();
    appLogger.external('PayTabs Gateway initialized', { 
      region: this.region, 
      testMode: this.testMode,
      endpoint: this.baseUrl
    });
  }

  private getEndpointUrl(): string {
    // UAE PayTabs accounts always use .com endpoint regardless of region setting
    return 'https://secure.paytabs.com/payment/request';
  }

  async createOrder(orderData: PaymentOrderData): Promise<PaymentOrderResponse> {
    // Create a minimal PayTabs request to avoid validation issues
    const payTabsRequest: any = {
      profile_id: parseInt(this.profileId!),
      tran_type: 'sale',
      tran_class: 'ecom',
      cart_id: orderData.orderId,
      cart_currency: orderData.currency,
      cart_amount: parseFloat(orderData.amount.toFixed(2)),
      cart_description: orderData.description,
      return: orderData.returnUrls.authorised,
      callback: orderData.returnUrls.callback,
      framed: true
    };

    // Add customer details from founder data if available
    if (orderData.customerData?.email) {
      const customerName = orderData.customerData.name?.forenames && orderData.customerData.name?.surname 
        ? `${orderData.customerData.name.forenames} ${orderData.customerData.name.surname}`.trim()
        : orderData.customerData.name?.forenames || 'Customer';

      payTabsRequest.customer_details = {
        name: customerName,
        email: orderData.customerData.email,
        phone: orderData.customerData.phone || undefined
        // Address fields intentionally excluded as per requirements
        // (country, city, street are collected in onboarding but not used for payment)
      };

      // Remove undefined fields to keep PayTabs request clean
      Object.keys(payTabsRequest.customer_details).forEach(key => {
        if (payTabsRequest.customer_details[key] === undefined) {
          delete payTabsRequest.customer_details[key];
        }
      });

      appLogger.business('PayTabs customer details prepared', {
        customerRef: orderData.customerData.ref,
        hasName: !!customerName,
        hasEmail: !!orderData.customerData.email,
        hasPhone: !!orderData.customerData.phone,
        excludedAddressFields: 'country, city, street (as per requirements)'
      });
    }

    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'authorization': this.serverKey!
        },
        body: JSON.stringify(payTabsRequest)
      });

      const responseText = await response.text();
      
      let result;
      try {
        result = JSON.parse(responseText);
      } catch (parseError) {
        appLogger.error('PayTabs API returned invalid JSON', null, { error: parseError, responseText: responseText.substring(0, 200) });
        throw new Error(`PayTabs API returned invalid JSON: ${responseText.substring(0, 200)}`);
      }

      if (!response.ok) {
        throw new Error(`PayTabs API HTTP error: ${response.status} - ${result.result || 'Unknown error'}`);
      }

      // PayTabs success detection: Look for redirect_url (indicates successful payment page creation)
      if (!result.redirect_url || !result.tran_ref) {
        throw new Error(`PayTabs payment creation failed: ${result.result || result.message || 'Missing redirect_url or tran_ref'}`);
      }

      return {
        success: true,
        orderReference: payTabsRequest.cart_id, // Keep our internal cart_id as order reference
        paymentUrl: result.redirect_url,
        expiresAt: new Date(Date.now() + 20 * 60 * 1000), // PayTabs expires in 20 minutes
        gatewayResponse: {
          ...result,
          internal_cart_id: payTabsRequest.cart_id, // Store our cart_id
          paytabs_tran_ref: result.tran_ref // Store PayTabs' tran_ref separately
        }
      };
    } catch (error) {
      throw new Error(`PayTabs API error: ${error}`);
    }
  }

  async checkStatus(orderRef: string): Promise<PaymentStatusResponse> {
    const queryRequest = {
      profile_id: parseInt(this.profileId!),
      tran_ref: orderRef  // This should be the PayTabs tran_ref, not our cart_id
    };

    try {
      const queryUrl = this.baseUrl.replace('/payment/request', '/payment/query');
      
      const response = await fetch(queryUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'authorization': this.serverKey!
        },
        body: JSON.stringify(queryRequest)
      });

      let result;
      if (!response.ok) {
        const errorText = await response.text();
        
        // Try to parse error response as JSON for PayTabs specific handling
        try {
          result = JSON.parse(errorText);
        } catch {
          throw new Error(`PayTabs API responded with status ${response.status}: ${errorText}`);
        }
      } else {
        result = await response.json();
      }

      // Handle PayTabs response codes
      if (result.response_code !== '2000') {
        // PayTabs returns "Transaction not found" for expired or inactive transactions
        if ((result.code === 2 && result.message === 'No entries found') || 
            (result.code === 113 && result.message?.includes('Transaction not found'))) {
          return {
            success: true,
            status: 'unknown', // Signal to payment service to use database status
            gatewayResponse: result
          };
        }
        
        appLogger.error('PayTabs status check error', null, { result });
        return {
          success: false,
          status: 'failed',
          gatewayResponse: result
        };
      }

      // Map PayTabs status to our generic status using centralized mapper
      const respStatus = result.payment_result?.response_status;
      const status = PaymentStatusMapper.mapPayTabsApiStatus(respStatus);

      return {
        success: true,
        status,
        gatewayStatus: respStatus,
        transactionId: result.payment_result?.transaction_id,
        amount: result.cart_amount,
        currency: result.cart_currency,
        gatewayResponse: result
      };
    } catch (error) {
      throw new Error(`PayTabs status check error: ${error}`);
    }
  }

  async processWebhook(payload: any, signature?: string): Promise<WebhookResponse> {
    try {
      // PayTabs webhook processing for hosted payment page callbacks
      const orderRef = payload.cartId || payload.cart_id || payload.tran_ref;
      
      // PayTabs status mapping for webhook callbacks using centralized mapper
      const payTabsStatus = payload.respStatus || payload.response_status;
      const status = PaymentStatusMapper.mapPayTabsWebhookStatus(payTabsStatus);

      return {
        success: true,
        orderReference: orderRef,
        status,
        transactionId: payload.tranRef || payload.tran_ref,
        gatewayResponse: payload
      };
    } catch (error) {
      throw new Error(`PayTabs webhook processing error: ${error}`);
    }
  }

  validateWebhook(payload: any, signature?: string): boolean {
    // PayTabs webhook validation with signature verification
    if (signature && this.serverKey) {
      return SecurityUtils.verifyPayTabsWebhookSignature(payload, signature, this.serverKey);
    }
    
    // Fall back to basic validation for backward compatibility
    const hasOrderRef = payload && (
      payload.cartId || 
      payload.cart_id || 
      payload.tran_ref
    );
    
    const hasStatus = payload && (
      payload.respStatus ||
      payload.response_status
    );
    
    return !!(hasOrderRef && hasStatus);
  }
}

// Request/Response validation schemas
export const createPaymentRequestSchema = z.object({
  amount: z.number().positive('Amount must be positive'),
  currency: z.string().length(3, 'Currency must be 3 characters').default('USD'),
  description: z.string().min(1, 'Description is required'),
  purpose: z.string().optional(),
  planType: z.enum(['basic', 'premium', 'enterprise', 'one-time']).optional(),
  metadata: z.record(z.any()).optional()
});

export const checkPaymentStatusSchema = z.object({
  orderReference: z.string().min(1, 'Order reference is required')
});

export type CreatePaymentRequest = z.infer<typeof createPaymentRequestSchema>;
export type CheckPaymentStatusRequest = z.infer<typeof checkPaymentStatusSchema>;