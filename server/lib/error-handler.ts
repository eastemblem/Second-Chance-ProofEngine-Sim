import { Request, Response } from 'express';
import winston from 'winston';

/**
 * Standardized error handling for payment operations
 */

export interface PaymentError {
  code: string;
  message: string;
  userMessage: string;
  statusCode: number;
  details?: any;
}

export class PaymentErrorHandler {
  /**
   * Standard error codes for payment operations
   */
  static readonly ErrorCodes = {
    // Validation errors
    INVALID_REQUEST: 'INVALID_REQUEST',
    MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',
    INVALID_AMOUNT: 'INVALID_AMOUNT',
    INVALID_CURRENCY: 'INVALID_CURRENCY',
    
    // Authentication & Authorization
    UNAUTHORIZED: 'UNAUTHORIZED',
    SESSION_EXPIRED: 'SESSION_EXPIRED',
    SESSION_NOT_FOUND: 'SESSION_NOT_FOUND',
    
    // Payment processing
    PAYMENT_CREATION_FAILED: 'PAYMENT_CREATION_FAILED',
    PAYMENT_NOT_FOUND: 'PAYMENT_NOT_FOUND',
    GATEWAY_ERROR: 'GATEWAY_ERROR',
    GATEWAY_UNAVAILABLE: 'GATEWAY_UNAVAILABLE',
    
    // Rate limiting
    RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
    
    // Webhook processing
    WEBHOOK_VERIFICATION_FAILED: 'WEBHOOK_VERIFICATION_FAILED',
    WEBHOOK_PROCESSING_FAILED: 'WEBHOOK_PROCESSING_FAILED',
    
    // Database errors
    DATABASE_ERROR: 'DATABASE_ERROR',
    TRANSACTION_NOT_FOUND: 'TRANSACTION_NOT_FOUND',
    
    // Network errors
    NETWORK_ERROR: 'NETWORK_ERROR',
    TIMEOUT_ERROR: 'TIMEOUT_ERROR',
    
    // Generic
    INTERNAL_ERROR: 'INTERNAL_ERROR',
    UNKNOWN_ERROR: 'UNKNOWN_ERROR'
  } as const;
  
  /**
   * Create a standardized payment error
   */
  static createError(
    code: string,
    message: string,
    userMessage: string,
    statusCode: number = 500,
    details?: any
  ): PaymentError {
    return {
      code,
      message,
      userMessage,
      statusCode,
      details
    };
  }
  
  /**
   * Handle and respond to payment errors
   */
  static handleError(error: any, req: Request, res: Response, context: string = 'payment') {
    let paymentError: PaymentError;
    
    if (this.isPaymentError(error)) {
      paymentError = error;
    } else {
      paymentError = this.mapToPaymentError(error);
    }
    
    // Log the error
    winston.error(`Payment error in ${context}`, {
      code: paymentError.code,
      message: paymentError.message,
      url: req.url,
      method: req.method,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      details: paymentError.details,
      service: 'second-chance-api',
      category: 'payment-error'
    });
    
    // Send standardized error response
    res.status(paymentError.statusCode).json({
      success: false,
      error: {
        code: paymentError.code,
        message: paymentError.userMessage,
        timestamp: new Date().toISOString()
      }
    });
  }
  
  /**
   * Check if an object is a PaymentError
   */
  private static isPaymentError(error: any): error is PaymentError {
    return error && 
           typeof error.code === 'string' && 
           typeof error.message === 'string' && 
           typeof error.userMessage === 'string' && 
           typeof error.statusCode === 'number';
  }
  
  /**
   * Map generic errors to PaymentError objects
   */
  private static mapToPaymentError(error: any): PaymentError {
    if (error instanceof Error) {
      // Network/timeout errors
      if (error.message.includes('timeout') || error.message.includes('ETIMEDOUT')) {
        return this.createError(
          this.ErrorCodes.TIMEOUT_ERROR,
          error.message,
          'Request timed out. Please try again.',
          408
        );
      }
      
      if (error.message.includes('ECONNREFUSED') || error.message.includes('ENOTFOUND')) {
        return this.createError(
          this.ErrorCodes.NETWORK_ERROR,
          error.message,
          'Network error occurred. Please check your connection and try again.',
          503
        );
      }
      
      // Database errors
      if (error.message.includes('database') || error.message.includes('SQL')) {
        return this.createError(
          this.ErrorCodes.DATABASE_ERROR,
          error.message,
          'A database error occurred. Please try again later.',
          500
        );
      }
      
      // Default error mapping
      return this.createError(
        this.ErrorCodes.INTERNAL_ERROR,
        error.message,
        'An unexpected error occurred. Please try again.',
        500,
        { originalError: error.name }
      );
    }
    
    // Non-Error objects
    return this.createError(
      this.ErrorCodes.UNKNOWN_ERROR,
      'Unknown error occurred',
      'An unexpected error occurred. Please try again.',
      500,
      { originalError: error }
    );
  }
  
  /**
   * Create specific error types for common payment scenarios
   */
  static validationError(field: string, value: any): PaymentError {
    return this.createError(
      this.ErrorCodes.INVALID_REQUEST,
      `Invalid ${field}: ${value}`,
      `Please provide a valid ${field}.`,
      400,
      { field, value }
    );
  }
  
  static sessionError(sessionId: string): PaymentError {
    return this.createError(
      this.ErrorCodes.SESSION_NOT_FOUND,
      `Session not found: ${sessionId}`,
      'Your session has expired. Please complete the onboarding process again.',
      404,
      { sessionId }
    );
  }
  
  static gatewayError(gatewayName: string, gatewayMessage: string): PaymentError {
    return this.createError(
      this.ErrorCodes.GATEWAY_ERROR,
      `${gatewayName} gateway error: ${gatewayMessage}`,
      'Payment processing temporarily unavailable. Please try again later.',
      502,
      { gateway: gatewayName, gatewayMessage }
    );
  }
  
  static transactionNotFoundError(transactionId: string): PaymentError {
    return this.createError(
      this.ErrorCodes.TRANSACTION_NOT_FOUND,
      `Transaction not found: ${transactionId}`,
      'Payment not found. Please check your payment reference.',
      404,
      { transactionId }
    );
  }
  
  static webhookError(reason: string): PaymentError {
    return this.createError(
      this.ErrorCodes.WEBHOOK_VERIFICATION_FAILED,
      `Webhook verification failed: ${reason}`,
      'Webhook verification failed.',
      401,
      { reason }
    );
  }
}