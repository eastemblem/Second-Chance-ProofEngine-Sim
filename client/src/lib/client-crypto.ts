import { ENCRYPTION_CONFIG } from '@shared/crypto-config';
import { EncryptionUtils } from '@shared/encryption-utils';
import type { EncryptedPayload, EncryptionContext } from '@shared/encryption-types';

/**
 * Client-side encryption utilities
 */
export class ClientCrypto {
  private static encryptionContext: EncryptionContext | null = null;

  /**
   * Initialize encryption context from environment
   */
  static initializeEncryptionContext(): EncryptionContext {
    if (this.encryptionContext) {
      return this.encryptionContext;
    }

    const isEnabled = import.meta.env[ENCRYPTION_CONFIG.env.client] === 'true';
    const secret = import.meta.env[ENCRYPTION_CONFIG.env.clientSecret];

    // Debug: Print client-side encryption secret
    console.log('🔐 CLIENT VITE_ENCRYPTION_SECRET:', secret);

    if (isEnabled && !secret) {
      console.warn(`Client encryption is enabled but ${ENCRYPTION_CONFIG.env.clientSecret} environment variable is not set`);
    }

    this.encryptionContext = {
      isEnabled,
      version: 'V1',
      secret
    };

    return this.encryptionContext;
  }

  /**
   * Get current encryption context
   */
  static getEncryptionContext(): EncryptionContext {
    if (!this.encryptionContext) {
      return this.initializeEncryptionContext();
    }
    return this.encryptionContext;
  }

  /**
   * Check if encryption is enabled and properly configured
   */
  static isEncryptionEnabled(): boolean {
    const context = this.getEncryptionContext();
    return context.isEnabled && !!context.secret;
  }

  /**
   * Encrypt request payload for API calls
   */
  static async encryptRequestPayload(payload: any): Promise<{
    data: EncryptedPayload | any;
    headers: Record<string, string>;
    wasEncrypted: boolean;
  }> {
    const context = this.getEncryptionContext();

    // Return original payload if encryption is disabled or not configured
    if (!context.isEnabled || !context.secret) {
      return {
        data: payload,
        headers: {},
        wasEncrypted: false
      };
    }

    try {
      const encryptionResult = await EncryptionUtils.encryptData(payload, context.secret);
      const encryptedPayload = EncryptionUtils.createEncryptedPayload(encryptionResult);

      // Create headers to indicate encrypted request
      const headers = {
        [ENCRYPTION_CONFIG.headers.encrypted]: 'true',
        [ENCRYPTION_CONFIG.headers.keyVersion]: context.version.toLowerCase()
      };

      return {
        data: encryptedPayload,
        headers,
        wasEncrypted: true
      };
    } catch (error) {
      console.error('Client encryption failed:', error);
      
      // Fall back to unencrypted payload
      return {
        data: payload,
        headers: {},
        wasEncrypted: false
      };
    }
  }

  /**
   * Decrypt response payload from API calls
   */
  static async decryptResponsePayload(payload: any): Promise<{
    data: any;
    wasDecrypted: boolean;
  }> {
    const context = this.getEncryptionContext();

    // Return original payload if encryption is disabled
    if (!context.isEnabled || !context.secret) {
      return { data: payload, wasDecrypted: false };
    }

    // Check if payload is encrypted
    if (!EncryptionUtils.isEncryptedPayload(payload)) {
      return { data: payload, wasDecrypted: false };
    }

    try {
      const decryptionResult = await EncryptionUtils.decryptData(payload, context.secret);
      return { data: decryptionResult.data, wasDecrypted: true };
    } catch (error) {
      console.error('Client decryption failed:', error);
      
      // Return original payload as fallback
      return { data: payload, wasDecrypted: false };
    }
  }

  /**
   * Check if response indicates it was encrypted
   */
  static isEncryptedResponse(headers: Headers): boolean {
    return headers.get(ENCRYPTION_CONFIG.headers.encryptedResponse) === 'true';
  }

  /**
   * Log encryption status for debugging
   */
  static logEncryptionStatus(): void {
    const context = this.getEncryptionContext();
    
    if (import.meta.env.MODE === 'development') {
      console.log(`🔒 Client Encryption Status: ${context.isEnabled ? 'ENABLED' : 'DISABLED'}`);
      
      if (context.isEnabled) {
        console.log(`🔒 Encryption Version: ${context.version}`);
        console.log(`🔒 Secret Configured: ${!!context.secret}`);
        console.log(`🔒 Secret Length: ${context.secret?.length || 0} characters`);
      }
    }
  }

  /**
   * Validate client encryption configuration
   */
  static validateConfiguration(): { isValid: boolean; errors: string[] } {
    const context = this.getEncryptionContext();
    const errors: string[] = [];

    if (context.isEnabled) {
      if (!context.secret) {
        errors.push(`Missing ${ENCRYPTION_CONFIG.env.clientSecret} environment variable`);
      }

      if (context.secret && context.secret.length < 32) {
        errors.push('Encryption secret should be at least 32 characters long');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Reset encryption context (useful for testing)
   */
  static resetEncryptionContext(): void {
    this.encryptionContext = null;
  }
}