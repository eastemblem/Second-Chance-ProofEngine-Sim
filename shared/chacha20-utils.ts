import { ENCRYPTION_CONFIG, ENCRYPTION_VERSIONS } from './crypto-config';
import type { 
  EncryptedPayloadV2, 
  EncryptionResultV2, 
  DecryptionResult,
  DerivedKeyV2 
} from './encryption-types';

/**
 * ChaCha20-Poly1305 encryption utilities using libsodium
 */
export class ChaCha20Utils {
  private static sodium: any = null;
  private static isReady = false;

  /**
   * Initialize libsodium (async)
   */
  static async init(): Promise<void> {
    if (this.isReady && this.sodium) return;

    try {
      // Environment-specific libsodium loading
      if (typeof window !== 'undefined') {
        // Browser environment - use WebAssembly version
        console.log('🔧 ChaCha20: Initializing libsodium-wrappers...');
        const sodium = await import('libsodium-wrappers');
        await sodium.ready;
        this.sodium = sodium.default || sodium; // Ensure we get the actual sodium object
        console.log('✅ ChaCha20: libsodium-wrappers ready, methods available:', !!this.sodium.crypto_aead_chacha20poly1305_ietf_encrypt);
      } else {
        // Node.js environment - use native bindings with dynamic import
        console.log('🔧 ChaCha20: Initializing sodium-native...');
        const { default: sodium } = await import('sodium-native');
        this.sodium = sodium;
        console.log('✅ ChaCha20: sodium-native ready');
      }
      
      this.isReady = true;
    } catch (error) {
      console.error('❌ ChaCha20: Initialization failed:', error);
      throw new Error(`Failed to initialize libsodium: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Derive encryption key using PBKDF2 (compatible with v1)
   */
  static async deriveKey(secret: string, salt: Uint8Array): Promise<DerivedKeyV2> {
    await this.init();

    try {
      if (typeof window !== 'undefined') {
        // Browser: Use Web Crypto API for PBKDF2, then extract raw bytes
        const keyMaterial = await crypto.subtle.importKey(
          'raw',
          new TextEncoder().encode(secret),
          'PBKDF2',
          false,
          ['deriveKey']
        );

        const cryptoKey = await crypto.subtle.deriveKey(
          {
            name: ENCRYPTION_CONFIG.keyDerivation.algorithm,
            salt: salt,
            iterations: ENCRYPTION_CONFIG.keyDerivation.iterations,
            hash: ENCRYPTION_CONFIG.keyDerivation.hash,
          },
          keyMaterial,
          { name: 'AES-GCM', length: 256 },
          true,
          ['encrypt']
        );
        
        console.log('🔧 Browser PBKDF2 params:', {
          algorithm: ENCRYPTION_CONFIG.keyDerivation.algorithm,
          iterations: ENCRYPTION_CONFIG.keyDerivation.iterations,
          hash: ENCRYPTION_CONFIG.keyDerivation.hash,
          keyLength: 256,
          saltLength: salt.length,
          saltFirst8: Array.from(salt.slice(0, 8)).map(b => b.toString(16).padStart(2, '0')).join('')
        });

        // Export to raw bytes for libsodium
        const keyBuffer = await crypto.subtle.exportKey('raw', cryptoKey);
        const derivedKey = new Uint8Array(keyBuffer);
        console.log('🔑 Browser key derivation result:', Array.from(derivedKey.slice(0, 8)).map(b => b.toString(16).padStart(2, '0')).join(''));
        return {
          key: derivedKey,
          salt
        };
      } else {
        // Node.js: Use crypto module for PBKDF2
        const crypto = await import('crypto');
        console.log('🔧 Server PBKDF2 params:', {
          algorithm: 'PBKDF2',
          iterations: ENCRYPTION_CONFIG.keyDerivation.iterations,
          hash: 'sha256',
          keyLength: 32,
          saltLength: salt.length,
          saltFirst8: Array.from(salt.slice(0, 8)).map(b => b.toString(16).padStart(2, '0')).join('')
        });
        
        const key = crypto.pbkdf2Sync(
          secret,
          salt,
          ENCRYPTION_CONFIG.keyDerivation.iterations,
          32, // Use explicit 32 bytes instead of config for consistency
          'sha256'
        );
        const derivedKey = new Uint8Array(key);
        console.log('🔑 Server key derivation result:', Array.from(derivedKey.slice(0, 8)).map(b => b.toString(16).padStart(2, '0')).join(''));
        return {
          key: derivedKey,
          salt
        };
      }
    } catch (error) {
      throw new Error(`Key derivation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate cryptographically secure random bytes
   */
  static generateRandomBytes(length: number): Uint8Array {
    if (typeof window !== 'undefined') {
      // Browser environment
      return crypto.getRandomValues(new Uint8Array(length));
    } else {
      // Node.js environment - use crypto from global or import
      if (typeof globalThis.crypto !== 'undefined' && globalThis.crypto.getRandomValues) {
        return globalThis.crypto.getRandomValues(new Uint8Array(length));
      } else {
        // Fallback: use Node.js crypto with dynamic import fallback
        try {
          const crypto = require('crypto');
          return new Uint8Array(crypto.randomBytes(length));
        } catch (error) {
          // If require fails, throw meaningful error
          throw new Error('Unable to generate secure random bytes: crypto module not available');
        }
      }
    }
  }

  /**
   * Encrypt data using ChaCha20-Poly1305
   */
  static async encryptData(data: any, secret: string): Promise<EncryptionResultV2> {
    await this.init();

    try {
      // Generate random salt and nonce
      const salt = this.generateRandomBytes(ENCRYPTION_CONFIG.keyDerivation.saltLength);
      const nonce = this.generateRandomBytes(ENCRYPTION_CONFIG.chacha20.nonceLength);

      // Derive encryption key
      console.log('🔐 ChaCha20: ENCRYPT deriving key with secret length:', secret.length, 'salt length:', salt.length);
      const derivedKey = await this.deriveKey(secret, salt);
      console.log('🔐 ChaCha20: ENCRYPT derived key length:', derivedKey.key.length, 'bytes');

      // Prepare payload with timestamp for replay protection
      const payload = {
        data,
        timestamp: Date.now(),
        version: ENCRYPTION_VERSIONS.V2
      };

      const plaintext = new TextEncoder().encode(JSON.stringify(payload));

      // Encrypt the data
      let ciphertext: Uint8Array;

      if (typeof window !== 'undefined') {
        // Browser: Use libsodium-wrappers
        console.log('🔐 ChaCha20: Encrypting with libsodium-wrappers...');
        console.log('🔐 ChaCha20: Sodium object type:', typeof this.sodium);
        console.log('🔐 ChaCha20: Encrypt function available:', !!this.sodium.crypto_aead_chacha20poly1305_ietf_encrypt);
        
        if (!this.sodium || !this.sodium.crypto_aead_chacha20poly1305_ietf_encrypt) {
          throw new Error('libsodium-wrappers not properly initialized');
        }
        
        ciphertext = this.sodium.crypto_aead_chacha20poly1305_ietf_encrypt(
          plaintext,
          null, // additional data
          null, // nsec (not used)
          nonce,
          derivedKey.key
        );
        console.log('✅ ChaCha20: Encryption successful');
      } else {
        // Node.js: Use sodium-native
        ciphertext = Buffer.alloc(plaintext.length + this.sodium.crypto_aead_chacha20poly1305_ietf_ABYTES);
        this.sodium.crypto_aead_chacha20poly1305_ietf_encrypt(
          ciphertext,
          plaintext,
          null, // additional data
          nonce,
          derivedKey.key
        );
        ciphertext = new Uint8Array(ciphertext);
      }

      return {
        encryptedData: this.arrayBufferToBase64(ciphertext),
        nonce, // Keep as Uint8Array, will be converted by createEncryptedPayload
        salt   // Keep as Uint8Array, will be converted by createEncryptedPayload
      };
    } catch (error) {
      throw new Error(`ChaCha20 encryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Decrypt data using ChaCha20-Poly1305
   */
  static async decryptData(encryptedPayload: EncryptedPayloadV2, secret: string): Promise<DecryptionResult> {
    await this.init();

    try {
      // Decode base64 data
      console.log('🔓 ChaCha20: Decoding base64 strings...');
      console.log('🔓 ChaCha20: Nonce base64:', encryptedPayload.nonce);
      const ciphertext = this.base64ToArrayBuffer(encryptedPayload.data);
      const nonce = this.base64ToArrayBuffer(encryptedPayload.nonce);
      const salt = this.base64ToArrayBuffer(encryptedPayload.salt);
      console.log('🔓 ChaCha20: Decoded nonce length:', nonce.byteLength, 'bytes');

      // Derive decryption key using the salt from the payload
      console.log('🔓 ChaCha20: Deriving key with secret length:', secret.length, 'salt length:', salt.byteLength);
      const derivedKey = await this.deriveKey(secret, new Uint8Array(salt));
      console.log('🔓 ChaCha20: Derived key length:', derivedKey.key.length, 'bytes');

      // Decrypt the data
      let plaintext: Uint8Array;

      if (typeof window !== 'undefined') {
        // Browser: Use libsodium-wrappers
        console.log('🔓 ChaCha20: Starting browser decryption...');
        console.log('🔓 ChaCha20: Ciphertext length:', ciphertext.byteLength);
        console.log('🔓 ChaCha20: Nonce length:', nonce.byteLength);
        console.log('🔓 ChaCha20: Key length:', derivedKey.key.length);
        
        plaintext = this.sodium.crypto_aead_chacha20poly1305_ietf_decrypt(
          null, // nsec (not used)
          new Uint8Array(ciphertext),
          null, // additional data
          new Uint8Array(nonce),
          derivedKey.key
        );
        console.log('✅ ChaCha20: Browser decryption successful');
      } else {
        // Node.js: Use sodium-native
        console.log('🔓 ChaCha20: Starting Node.js decryption...');
        const ciphertextBytes = new Uint8Array(ciphertext);
        const nonceBytes = new Uint8Array(nonce);
        
        console.log('🔓 ChaCha20: Server ciphertext length:', ciphertextBytes.length);
        console.log('🔓 ChaCha20: Server nonce length:', nonceBytes.length);
        console.log('🔓 ChaCha20: Server key length:', derivedKey.key.length);
        
        // Validate input sizes
        if (ciphertextBytes.length < this.sodium.crypto_aead_chacha20poly1305_ietf_ABYTES) {
          console.error('❌ ChaCha20: Ciphertext too short:', ciphertextBytes.length, 'min required:', this.sodium.crypto_aead_chacha20poly1305_ietf_ABYTES);
          throw new Error(`Ciphertext too short: ${ciphertextBytes.length} bytes, minimum required: ${this.sodium.crypto_aead_chacha20poly1305_ietf_ABYTES}`);
        }
        
        if (nonceBytes.length !== this.sodium.crypto_aead_chacha20poly1305_ietf_NPUBBYTES) {
          console.error('❌ ChaCha20: Invalid nonce length:', nonceBytes.length, 'required:', this.sodium.crypto_aead_chacha20poly1305_ietf_NPUBBYTES);
          throw new Error(`Invalid nonce length: ${nonceBytes.length} bytes, required: ${this.sodium.crypto_aead_chacha20poly1305_ietf_NPUBBYTES}`);
        }
        
        if (derivedKey.key.length !== this.sodium.crypto_aead_chacha20poly1305_ietf_KEYBYTES) {
          console.error('❌ ChaCha20: Invalid key length:', derivedKey.key.length, 'required:', this.sodium.crypto_aead_chacha20poly1305_ietf_KEYBYTES);
          throw new Error(`Invalid key length: ${derivedKey.key.length} bytes, required: ${this.sodium.crypto_aead_chacha20poly1305_ietf_KEYBYTES}`);
        }
        
        // Calculate plaintext size
        const plaintextLength = ciphertextBytes.length - this.sodium.crypto_aead_chacha20poly1305_ietf_ABYTES;
        console.log('🔓 ChaCha20: Expected plaintext length:', plaintextLength);
        plaintext = Buffer.alloc(plaintextLength);
        
        try {
          console.log('🔓 ChaCha20: About to call sodium decrypt with:');
          console.log('🔓 ChaCha20: - plaintext buffer length:', plaintext.length);
          console.log('🔓 ChaCha20: - ciphertext length:', ciphertextBytes.length);
          console.log('🔓 ChaCha20: - nonce length:', nonceBytes.length);
          console.log('🔓 ChaCha20: - key length:', derivedKey.key.length);
          
          const success = this.sodium.crypto_aead_chacha20poly1305_ietf_decrypt(
            plaintext,
            null, // nsec (not used) 
            ciphertextBytes,
            null, // additional data
            nonceBytes,
            derivedKey.key
          );
          
          console.log('🔓 ChaCha20: Sodium decrypt returned:', success);

          if (!success) {
            console.error('❌ ChaCha20: Authentication verification failed');
            throw new Error('Decryption failed - authentication verification failed');
          }
          console.log('✅ ChaCha20: Node.js decryption successful');
        } catch (error) {
          console.error('❌ ChaCha20: Sodium decryption error:', error);
          throw new Error(`Sodium decryption error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
        
        plaintext = new Uint8Array(plaintext);
      }

      // Parse the decrypted payload
      const decryptedText = new TextDecoder().decode(plaintext);
      const payload = JSON.parse(decryptedText);

      // Validate timestamp (prevent replay attacks - 10 minute window)
      const now = Date.now();
      const timeDiff = now - payload.timestamp;
      const maxAge = 10 * 60 * 1000; // 10 minutes
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
      throw new Error(`ChaCha20 decryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Create encrypted payload structure for v2
   */
  static createEncryptedPayload(encryptionResult: EncryptionResultV2): EncryptedPayloadV2 {
    return {
      data: encryptionResult.encryptedData,
      nonce: this.arrayBufferToBase64(encryptionResult.nonce),
      salt: this.arrayBufferToBase64(encryptionResult.salt),
      version: ENCRYPTION_VERSIONS.V2,
      timestamp: Date.now()
    };
  }

  /**
   * Check if payload is ChaCha20 encrypted (v2)
   */
  static isChaCha20Payload(payload: any): payload is EncryptedPayloadV2 {
    return (
      payload &&
      typeof payload === 'object' &&
      typeof payload.data === 'string' &&
      typeof payload.nonce === 'string' &&
      typeof payload.salt === 'string' &&
      payload.version === ENCRYPTION_VERSIONS.V2 &&
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
    try {
      let binary: string;
      
      // Clean base64 string - remove whitespace and ensure proper padding
      let cleanBase64 = base64.replace(/\s/g, '').trim();
      
      // Ensure proper base64 padding
      while (cleanBase64.length % 4 !== 0) {
        cleanBase64 += '=';
      }
      
      if (typeof Buffer !== 'undefined' && typeof window === 'undefined') {
        // Node.js environment - use Buffer for consistent decoding
        console.log('🔍 Server base64 decode - input length:', cleanBase64.length, 'input:', cleanBase64.slice(0, 20) + '...');
        const buffer = Buffer.from(cleanBase64, 'base64');
        console.log('🔍 Server base64 decode - output length:', buffer.length);
        return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
      } else if (typeof atob === 'function') {
        // Browser environment
        console.log('🔍 Browser base64 decode - input length:', cleanBase64.length, 'input:', cleanBase64.slice(0, 20) + '...');
        binary = atob(cleanBase64);
        console.log('🔍 Browser base64 decode - output length:', binary.length);
      } else {
        throw new Error('No base64 decoding method available');
      }
      
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      return bytes.buffer;
    } catch (error) {
      throw new Error(`Invalid base64 string: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}