import { webcrypto } from 'crypto';
import { ENCRYPTION_CONFIG } from '@shared/crypto-config';
import type { EncryptedPayload, DecryptionResult, EncryptionContext } from '@shared/encryption-types';

// Polyfill crypto for Node.js environment FIRST
if (!globalThis.crypto) {
  globalThis.crypto = webcrypto as any;
}

// Import after polyfill is set up
import { EncryptionUtils } from '@shared/encryption-utils';

/**
 * Server-side encryption utilities
 */
export class ServerCrypto {
  /**
   * Get encryption context from environment
   */
  static getEncryptionContext(): EncryptionContext {
    const isEnabled = process.env[ENCRYPTION_CONFIG.env.server] === 'true';
    const secret = process.env[ENCRYPTION_CONFIG.env.secret];

    // Debug: Print server-side encryption secret
    console.log('🔐 SERVER ENCRYPTION_SECRET:', secret);

    if (isEnabled && !secret) {
      throw new Error(`Encryption is enabled but ${ENCRYPTION_CONFIG.env.secret} environment variable is not set`);
    }

    return {
      isEnabled,
      version: 'V1',
      secret
    };
  }

  /**
   * Decrypt request payload if encrypted
   */
  static async decryptRequestPayload(
    payload: any, 
    context: EncryptionContext
  ): Promise<{ data: any; wasEncrypted: boolean }> {
    console.log('🔍 DECRYPT-REQUEST: Starting payload decryption');
    console.log('🔍 DECRYPT-REQUEST: Payload structure:', {
      hasData: !!payload?.data,
      hasIv: !!payload?.iv,
      hasTag: !!payload?.tag,
      hasSalt: !!payload?.salt,
      hasTimestamp: !!payload?.timestamp,
      version: payload?.version,
      dataLength: payload?.data?.length,
      ivLength: payload?.iv?.length,
      tagLength: payload?.tag?.length,
      saltLength: payload?.salt?.length
    });
    console.log('🔍 DECRYPT-REQUEST: Context:', {
      hasSecret: !!context.secret,
      secretLength: context.secret?.length,
      secretFirst10: context.secret?.substring(0, 10)
    });

    // Return original payload if encryption is disabled
    if (!context.isEnabled || !context.secret) {
      console.log('🔍 DECRYPT-REQUEST: Encryption disabled or no secret');
      return { data: payload, wasEncrypted: false };
    }

    // Check if payload is encrypted
    if (!EncryptionUtils.isEncryptedPayload(payload)) {
      console.log('🔍 DECRYPT-REQUEST: Not an encrypted payload');
      return { data: payload, wasEncrypted: false };
    }

    console.log('🔍 DECRYPT-REQUEST: Valid encrypted payload, attempting decryption');
    try {
      const decryptionResult = await EncryptionUtils.decryptData(payload, context.secret);
      console.log('🔍 DECRYPT-REQUEST: Decryption successful');
      return { data: decryptionResult.data, wasEncrypted: true };
    } catch (error) {
      console.log('🔍 DECRYPT-REQUEST: Decryption failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown decryption error';
      throw new Error(`Failed to decrypt request payload: ${errorMessage}`);
    }
  }

  /**
   * Encrypt response payload if request was encrypted
   */
  static async encryptResponsePayload(
    payload: any,
    context: EncryptionContext,
    shouldEncrypt: boolean = false
  ): Promise<{ data: any; wasEncrypted: boolean }> {
    // Return original payload if encryption is disabled or not requested
    if (!context.isEnabled || !context.secret || !shouldEncrypt) {
      return { data: payload, wasEncrypted: false };
    }

    try {
      const encryptionResult = await EncryptionUtils.encryptData(payload, context.secret);
      const encryptedPayload = EncryptionUtils.createEncryptedPayload(encryptionResult);
      return { data: encryptedPayload, wasEncrypted: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown encryption error';
      throw new Error(`Failed to encrypt response payload: ${errorMessage}`);
    }
  }

  /**
   * Check if request headers indicate encryption
   */
  static isEncryptedRequest(headers: Record<string, any>): boolean {
    return headers[ENCRYPTION_CONFIG.headers.encrypted.toLowerCase()] === 'true';
  }

  /**
   * Create encryption headers for response
   */
  static createEncryptionHeaders(isEncrypted: boolean): Record<string, string> {
    if (!isEncrypted) {
      return {};
    }

    return {
      [ENCRYPTION_CONFIG.headers.encryptedResponse]: 'true',
      [ENCRYPTION_CONFIG.headers.keyVersion]: 'v1'
    };
  }

  /**
   * Validate encryption configuration
   */
  static validateConfiguration(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    const context = this.getEncryptionContext();

    if (context.isEnabled) {
      if (!context.secret) {
        errors.push(`Missing ${ENCRYPTION_CONFIG.env.secret} environment variable`);
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
   * Log encryption status for debugging
   */
  static logEncryptionStatus(): void {
    const context = this.getEncryptionContext();
    console.log(`🔒 Server Encryption Status: ${context.isEnabled ? 'ENABLED' : 'DISABLED'}`);
    
    if (context.isEnabled) {
      console.log(`🔒 Encryption Version: ${context.version}`);
      console.log(`🔒 Secret Length: ${context.secret?.length || 0} characters`);
    }
  }
}