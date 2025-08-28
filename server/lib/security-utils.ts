import crypto from 'crypto';
import { Request } from 'express';

/**
 * Security utilities for payment processing
 */
export class SecurityUtils {
  /**
   * Validate and sanitize customer input data
   */
  static sanitizeCustomerData(data: any): any {
    if (!data || typeof data !== 'object') return {};
    
    const sanitized: any = {};
    
    // Sanitize name fields
    if (data.name) {
      sanitized.name = {
        title: this.sanitizeStringInternal(data.name.title, 10),
        forenames: this.sanitizeStringInternal(data.name.forenames, 50),
        surname: this.sanitizeStringInternal(data.name.surname, 50)
      };
    }
    
    // Sanitize address fields
    if (data.address) {
      sanitized.address = {
        line1: this.sanitizeStringInternal(data.address.line1, 100),
        line2: this.sanitizeStringInternal(data.address.line2, 100),
        line3: this.sanitizeStringInternal(data.address.line3, 100),
        city: this.sanitizeStringInternal(data.address.city, 50),
        state: this.sanitizeStringInternal(data.address.state, 50),
        country: this.sanitizeStringInternal(data.address.country, 2),
        areacode: this.sanitizeStringInternal(data.address.areacode, 10)
      };
    }
    
    // Sanitize contact fields
    if (data.email) {
      sanitized.email = this.sanitizeEmail(data.email);
    }
    
    if (data.phone) {
      sanitized.phone = this.sanitizePhone(data.phone);
    }
    
    if (data.ref) {
      sanitized.ref = this.sanitizeStringInternal(data.ref, 100);
    }
    
    return sanitized;
  }
  
  /**
   * Sanitize string input by removing dangerous characters (public method)
   */
  static sanitizeString(input: string | undefined, maxLength: number): string | undefined {
    return this.sanitizeStringInternal(input, maxLength);
  }

  /**
   * Sanitize string input by removing dangerous characters (private implementation)
   */
  private static sanitizeStringInternal(input: string | undefined, maxLength: number): string | undefined {
    if (!input || typeof input !== 'string') return undefined;
    
    return input
      .replace(/[<>'"&;]/g, '') // Remove potentially dangerous characters
      .trim()
      .substring(0, maxLength);
  }
  
  /**
   * Validate and sanitize email address
   */
  private static sanitizeEmail(email: string | undefined): string | undefined {
    if (!email || typeof email !== 'string') return undefined;
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const trimmedEmail = email.trim().toLowerCase();
    
    if (emailRegex.test(trimmedEmail) && trimmedEmail.length <= 254) {
      return trimmedEmail;
    }
    
    return undefined;
  }
  
  /**
   * Sanitize phone number
   */
  private static sanitizePhone(phone: string | undefined): string | undefined {
    if (!phone || typeof phone !== 'string') return undefined;
    
    // Remove all non-digit characters except + at the beginning
    const cleaned = phone.replace(/[^\d+]/g, '');
    
    if (cleaned.length >= 7 && cleaned.length <= 20) {
      return cleaned;
    }
    
    return undefined;
  }
  
  /**
   * Verify Telr webhook signature
   */
  static verifyTelrWebhookSignature(payload: any, signature: string, secret: string): boolean {
    try {
      const payloadString = typeof payload === 'string' ? payload : JSON.stringify(payload);
      const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(payloadString)
        .digest('hex');
      
      return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature)
      );
    } catch (error) {
      console.error('Webhook signature verification error:', error);
      return false;
    }
  }

  static verifyPayTabsWebhookSignature(payload: any, signature: string, serverKey: string): boolean {
    try {
      // PayTabs webhook signature verification follows their documentation
      // Remove signature from payload for verification
      const verificationPayload = { ...payload };
      delete verificationPayload.signature;
      
      // Convert payload to URL-encoded string, sorted by keys
      const sortedKeys = Object.keys(verificationPayload).sort();
      const queryString = sortedKeys
        .filter(key => verificationPayload[key] !== undefined && verificationPayload[key] !== '')
        .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(verificationPayload[key])}`)
        .join('&');
      
      // Generate HMAC SHA256 signature using server key
      const expectedSignature = crypto
        .createHmac('sha256', serverKey)
        .update(queryString)
        .digest('hex');
      
      return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature)
      );
    } catch (error) {
      console.error('PayTabs webhook signature verification error:', error);
      return false;
    }
  }
  
  /**
   * Extract client IP address from request
   */
  static getClientIP(req: Request): string {
    const xForwardedFor = req.headers['x-forwarded-for'];
    const xRealIP = req.headers['x-real-ip'];
    const cfConnectingIP = req.headers['cf-connecting-ip'];
    
    if (typeof xForwardedFor === 'string') {
      return xForwardedFor.split(',')[0].trim();
    }
    
    if (typeof xRealIP === 'string') {
      return xRealIP;
    }
    
    if (typeof cfConnectingIP === 'string') {
      return cfConnectingIP;
    }
    
    return req.socket.remoteAddress || req.ip || 'unknown';
  }
  
  /**
   * Generate secure random token
   */
  static generateSecureToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }
  
  /**
   * Hash sensitive data for logging
   */
  static hashForLogging(data: string): string {
    return crypto.createHash('sha256').update(data).digest('hex').substring(0, 8);
  }
}