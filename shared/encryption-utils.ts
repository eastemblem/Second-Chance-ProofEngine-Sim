import { ENCRYPTION_CONFIG, ENCRYPTION_VERSIONS } from './crypto-config';
import type { 
  EncryptedPayload, 
  EncryptionResult, 
  DecryptionResult, 
  DerivedKey,
  EncryptionError,
  DecryptionError 
} from './encryption-types';

/**
 * Browser-compatible encryption utilities using Web Crypto API
 */
export class EncryptionUtils {
  /**
   * Derive encryption key from shared secret and salt
   */
  static async deriveKey(secret: string, salt: Uint8Array): Promise<CryptoKey> {
    // Import the secret as key material
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(secret),
      'PBKDF2',
      false,
      ['deriveKey']
    );

    // Derive the actual encryption key
    return await crypto.subtle.deriveKey(
      {
        name: ENCRYPTION_CONFIG.keyDerivation.algorithm,
        salt: salt,
        iterations: ENCRYPTION_CONFIG.keyDerivation.iterations,
        hash: ENCRYPTION_CONFIG.keyDerivation.hash,
      },
      keyMaterial,
      {
        name: ENCRYPTION_CONFIG.algorithm,
        length: ENCRYPTION_CONFIG.keyLength,
      },
      false,
      ['encrypt', 'decrypt']
    );
  }

  /**
   * Generate cryptographically secure random bytes
   */
  static generateRandomBytes(length: number): Uint8Array {
    return crypto.getRandomValues(new Uint8Array(length));
  }

  /**
   * Encrypt data using AES-GCM
   */
  static async encryptData(data: any, secret: string): Promise<EncryptionResult> {
    try {
      // Generate random salt and IV
      const salt = this.generateRandomBytes(ENCRYPTION_CONFIG.keyDerivation.saltLength);
      const iv = this.generateRandomBytes(ENCRYPTION_CONFIG.ivLength);

      // Derive encryption key
      const key = await this.deriveKey(secret, salt);

      // Prepare payload with timestamp for replay protection
      const payload = {
        data,
        timestamp: Date.now(),
        version: ENCRYPTION_VERSIONS.V1
      };

      const plaintext = new TextEncoder().encode(JSON.stringify(payload));

      // Encrypt the data
      const encrypted = await crypto.subtle.encrypt(
        {
          name: ENCRYPTION_CONFIG.algorithm,
          iv: iv,
          tagLength: ENCRYPTION_CONFIG.tagLength * 8, // Convert to bits
        },
        key,
        plaintext
      );

      // Split encrypted data and authentication tag
      const encryptedArray = new Uint8Array(encrypted);
      const ciphertext = encryptedArray.slice(0, -ENCRYPTION_CONFIG.tagLength);
      const tag = encryptedArray.slice(-ENCRYPTION_CONFIG.tagLength);

      return {
        encryptedData: this.arrayBufferToBase64(ciphertext),
        iv,
        tag,
        salt
      };
    } catch (error) {
      throw new Error(`Encryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Decrypt data using AES-GCM
   */
  static async decryptData(encryptedPayload: EncryptedPayload, secret: string): Promise<DecryptionResult> {
    try {
      // Decode base64 data
      const ciphertext = this.base64ToArrayBuffer(encryptedPayload.data);
      const iv = this.base64ToArrayBuffer(encryptedPayload.iv);
      const tag = this.base64ToArrayBuffer(encryptedPayload.tag);
      const salt = this.base64ToArrayBuffer(encryptedPayload.salt);

      // Use the salt from the encrypted payload for key derivation
      const key = await this.deriveKey(secret, new Uint8Array(salt));

      // Combine ciphertext and tag for decryption
      const encryptedData = new Uint8Array(ciphertext.byteLength + tag.byteLength);
      encryptedData.set(new Uint8Array(ciphertext));
      encryptedData.set(new Uint8Array(tag), ciphertext.byteLength);

      // Decrypt the data
      const decrypted = await crypto.subtle.decrypt(
        {
          name: ENCRYPTION_CONFIG.algorithm,
          iv: new Uint8Array(iv),
          tagLength: ENCRYPTION_CONFIG.tagLength * 8,
        },
        key,
        encryptedData
      );

      // Parse the decrypted payload
      const decryptedText = new TextDecoder().decode(decrypted);
      const payload = JSON.parse(decryptedText);

      // Validate timestamp (prevent replay attacks - 10 minute window for development)
      const now = Date.now();
      const timeDiff = now - payload.timestamp;
      const maxAge = 10 * 60 * 1000; // 10 minutes for development
      const maxFuture = 2 * 60 * 1000; // 2 minutes in future
      
      if (timeDiff > maxAge || timeDiff < -maxFuture) {
        throw new Error(`Request timestamp out of acceptable range. Age: ${Math.round(timeDiff/1000)}s, Max: ${Math.round(maxAge/1000)}s`);
      }

      return {
        data: payload.data,
        timestamp: payload.timestamp,
        version: payload.version
      };
    } catch (error) {
      throw new Error(`Decryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Create encrypted payload structure
   */
  static createEncryptedPayload(encryptionResult: EncryptionResult): EncryptedPayload {
    return {
      data: encryptionResult.encryptedData,
      iv: this.arrayBufferToBase64(encryptionResult.iv),
      tag: this.arrayBufferToBase64(encryptionResult.tag),
      salt: this.arrayBufferToBase64(encryptionResult.salt),
      version: ENCRYPTION_VERSIONS.V1,
      timestamp: Date.now()
    };
  }

  /**
   * Check if payload is encrypted based on structure
   */
  static isEncryptedPayload(payload: any): payload is EncryptedPayload {
    return (
      payload &&
      typeof payload === 'object' &&
      typeof payload.data === 'string' &&
      typeof payload.iv === 'string' &&
      typeof payload.tag === 'string' &&
      typeof payload.salt === 'string' &&
      typeof payload.version === 'string' &&
      typeof payload.timestamp === 'number'
    );
  }

  /**
   * Convert ArrayBuffer to Base64 string
   */
  private static arrayBufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  /**
   * Convert Base64 string to ArrayBuffer
   */
  private static base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }

  /**
   * Generate deterministic salt from secret and additional data
   */
  static async generateDeterministicSalt(secret: string, additionalData: string = ''): Promise<Uint8Array> {
    const data = new TextEncoder().encode(secret + additionalData);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    return new Uint8Array(hashBuffer).slice(0, ENCRYPTION_CONFIG.keyDerivation.saltLength);
  }
}