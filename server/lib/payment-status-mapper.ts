/**
 * Centralized payment status mapping utility
 * Eliminates code duplication across gateway implementations
 */

export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'cancelled' | 'expired' | 'unknown';

/**
 * Telr status codes and their meanings
 */
export enum TelrStatusCode {
  CANCELLED = 0,
  PENDING = 1,
  FAILED = 2,
  COMPLETED = 3
}

export enum TelrStatusText {
  CANCELLED = 'Cancelled',
  PENDING = 'Pending',
  DECLINED = 'Declined',
  PAID = 'Paid'
}

/**
 * Telr webhook status codes
 */
export enum TelrWebhookStatus {
  PENDING = 'H',
  CANCELLED = 'C',
  FAILED = 'E',
  AUTHORISED = 'A'
}

export class PaymentStatusMapper {
  /**
   * Map Telr API status to our generic payment status
   */
  static mapTelrApiStatus(statusCode: number, statusText: string): PaymentStatus {
    // Priority: status code first, then status text as fallback
    if (statusCode === TelrStatusCode.COMPLETED || statusText === TelrStatusText.PAID) {
      return 'completed';
    }
    
    if (statusCode === TelrStatusCode.PENDING || statusText === TelrStatusText.PENDING) {
      return 'pending';
    }
    
    if (statusCode === TelrStatusCode.FAILED || statusText === TelrStatusText.DECLINED) {
      return 'failed';
    }
    
    if (statusCode === TelrStatusCode.CANCELLED || statusText === TelrStatusText.CANCELLED) {
      return 'cancelled';
    }
    
    // Default to pending for unknown statuses
    console.warn(`Unknown Telr status - Code: ${statusCode}, Text: ${statusText}, defaulting to pending`);
    return 'pending';
  }
  
  /**
   * Map Telr webhook status to our generic payment status
   */
  static mapTelrWebhookStatus(webhookStatus: string): PaymentStatus {
    const status = webhookStatus?.toUpperCase();
    
    switch (status) {
      case TelrWebhookStatus.AUTHORISED:
      case 'PAID':
      case 'COMPLETED':
      case '3':
        return 'completed';
        
      case TelrWebhookStatus.CANCELLED:
      case 'CANCELLED':
      case '1':
        return 'cancelled';
        
      case TelrWebhookStatus.FAILED:
      case 'DECLINED':
      case 'FAILED':
      case '2':
        return 'failed';
        
      case TelrWebhookStatus.PENDING:
      case 'PENDING':
      case '0':
        return 'pending';
        
      default:
        console.warn(`Unknown Telr webhook status: ${webhookStatus}, defaulting to pending`);
        return 'pending';
    }
  }

  /**
   * Map PayTabs API status to our generic payment status
   */
  static mapPayTabsApiStatus(respStatus: string): PaymentStatus {
    const status = respStatus?.toUpperCase();
    
    switch (status) {
      case 'A': // Approved/Authorised
      case 'PAID': // PayTabs success status
      case 'APPROVED':
      case 'AUTHORISED':
        return 'completed';
        
      case 'D': // Declined
      case 'DECLINED': // PayTabs decline status
      case 'FAILED':
        return 'failed';
        
      case 'P': // Pending
      case 'PENDING':
        return 'pending';
        
      case 'C': // Cancelled
      case 'CANCELLED': // PayTabs cancel status
        return 'cancelled';
        
      case 'E': // Error/Expired
      case 'ERROR':
      case 'EXPIRED':
        return 'expired';
        
      default:
        console.warn(`Unknown PayTabs API status: ${respStatus}, defaulting to pending`);
        return 'pending';
    }
  }

  /**
   * Map PayTabs webhook status to our generic payment status
   */
  static mapPayTabsWebhookStatus(respStatus: string): PaymentStatus {
    const status = respStatus?.toUpperCase();
    
    switch (status) {
      case 'A': // Approved/Authorised
      case 'PAID': // PayTabs success status
      case 'APPROVED':
      case 'AUTHORISED':
        return 'completed';
        
      case 'D': // Declined
      case 'DECLINED': // PayTabs decline status
      case 'FAILED':
        return 'failed';
        
      case 'P': // Pending
      case 'PENDING':
        return 'pending';
        
      case 'C': // Cancelled
      case 'CANCELLED': // PayTabs cancel status
        return 'cancelled';
        
      case 'E': // Error/Expired
      case 'ERROR':
      case 'EXPIRED':
        return 'expired';
        
      default:
        console.warn(`Unknown PayTabs webhook status: ${respStatus}, defaulting to pending`);
        return 'pending';
    }
  }
  
  /**
   * Get user-friendly status message
   */
  static getUserFriendlyMessage(status: PaymentStatus): string {
    switch (status) {
      case 'completed':
        return 'Payment completed successfully! Your package has been activated.';
      case 'pending':
        return 'Payment is being processed. Please wait a moment.';
      case 'failed':
        return 'Payment was declined. Please check your payment details and try again.';
      case 'cancelled':
        return 'Payment was cancelled. No charges have been made to your account.';
      case 'expired':
        return 'Payment session has expired. Please start a new payment.';
      default:
        return 'Payment status unknown. Please contact support if this persists.';
    }
  }
  
  /**
   * Check if status represents a final state (no further changes expected)
   */
  static isFinalStatus(status: PaymentStatus): boolean {
    return ['completed', 'failed', 'cancelled', 'expired'].includes(status);
  }
  
  /**
   * Check if status represents a successful payment
   */
  static isSuccessfulStatus(status: PaymentStatus): boolean {
    return status === 'completed';
  }
  
  /**
   * Get appropriate HTTP status code for payment status
   */
  static getHttpStatusCode(paymentStatus: PaymentStatus): number {
    switch (paymentStatus) {
      case 'completed':
        return 200;
      case 'pending':
        return 202; // Accepted but not yet processed
      case 'failed':
        return 402; // Payment Required
      case 'cancelled':
        return 400; // Bad Request (user cancelled)
      case 'expired':
        return 408; // Request Timeout
      default:
        return 500;
    }
  }
}