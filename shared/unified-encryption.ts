import { ENCRYPTION_VERSIONS } from './crypto-config';
import { EncryptionUtils } from './encryption-utils';
import { ChaCha20Utils } from './chacha20-utils';
import type { 
  EncryptedPayload, 
  EncryptionResult, 
  DecryptionResult,
  EncryptionResultV1,
  EncryptionResultV2
} from './encryption-types';

/**
 * Unified encryption utility that handles both AES-GCM (v1) and ChaCha20-Poly1305 (v2)
 */
export class UnifiedEncryption {
  
  /**
   * Encrypt data using the preferred algorithm (v2 by default, v1 fallback)
   */
  static async encryptData(data: any, secret: string, preferredVersion: 'v1' | 'v2' = 'v2'): Promise<EncryptedPayload> {
    try {
      if (preferredVersion === 'v2') {
        // Use ChaCha20-Poly1305
        const result = await ChaCha20Utils.encryptData(data, secret);
        return ChaCha20Utils.createEncryptedPayload(result);
      } else {
        // Use AES-GCM
        const result = await EncryptionUtils.encryptData(data, secret);
        return EncryptionUtils.createEncryptedPayload(result as EncryptionResultV1);
      }
    } catch (error) {
      // Fallback to v1 if v2 fails (e.g., libsodium not available)
      if (preferredVersion === 'v2') {
        console.warn('ChaCha20 encryption failed, falling back to AES-GCM:', error);
        const result = await EncryptionUtils.encryptData(data, secret);
        return EncryptionUtils.createEncryptedPayload(result as EncryptionResultV1);
      }
      throw error;
    }
  }

  /**
   * Decrypt data with automatic version detection
   */
  static async decryptData(encryptedPayload: EncryptedPayload, secret: string): Promise<DecryptionResult> {
    // Auto-detect version and route to appropriate decryption
    if (encryptedPayload.version === ENCRYPTION_VERSIONS.V2) {
      return await ChaCha20Utils.decryptData(encryptedPayload as any, secret);
    } else if (encryptedPayload.version === ENCRYPTION_VERSIONS.V1) {
      return await EncryptionUtils.decryptData(encryptedPayload, secret);
    } else {
      throw new Error(`Unsupported encryption version: ${encryptedPayload.version}`);
    }
  }

  /**
   * Check if payload is encrypted (any version)
   */
  static isEncryptedPayload(payload: any): payload is EncryptedPayload {
    return EncryptionUtils.isEncryptedPayload(payload) || ChaCha20Utils.isChaCha20Payload(payload);
  }

  /**
   * Get encryption version from payload
   */
  static getEncryptionVersion(payload: any): string | null {
    if (!this.isEncryptedPayload(payload)) return null;
    return payload.version;
  }

  /**
   * Initialize encryption libraries (especially for ChaCha20)
   */
  static async initialize(): Promise<void> {
    try {
      await ChaCha20Utils.init();
    } catch (error) {
      console.warn('ChaCha20 initialization failed, will use AES-GCM only:', error);
    }
  }

  /**
   * Check if ChaCha20 is available
   */
  static async isChaCha20Available(): Promise<boolean> {
    try {
      await ChaCha20Utils.init();
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Migrate payload from v1 to v2 (re-encrypt with ChaCha20)
   */
  static async migrateToV2(v1Payload: any, secret: string): Promise<EncryptedPayload> {
    if (v1Payload.version !== 'v1') {
      throw new Error('Can only migrate v1 payloads');
    }

    // Decrypt v1 payload
    const decrypted = await EncryptionUtils.decryptData(v1Payload, secret);
    
    // Re-encrypt with v2
    return await this.encryptData(decrypted.data, secret, 'v2');
  }
}