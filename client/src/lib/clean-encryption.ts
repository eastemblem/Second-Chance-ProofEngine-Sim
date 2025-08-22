import { EncryptedPayload } from '@shared/crypto-utils';

/**
 * Clean Frontend Encryption Service
 * Single AES-256-GCM implementation matching backend exactly
 */
export class CleanEncryptionService {
  private sessionKey: string | null = null;

  // Initialize with session key for authenticated users
  initializeSession(founderId: string) {
    const baseSecret = import.meta.env.VITE_ENCRYPTION_SECRET || 'fallback-secret';
    this.sessionKey = `session-${founderId}-${baseSecret}`;
  }

  // Initialize for public/login routes (before authentication) - FIXED to match backend exactly
  initializePublicSession() {
    // EXACT MATCH: Use the same working secret as backend middleware
    const workingSecret = 'public-session-PjUPhlc/b7NXvdlR911x/R8mhCvZwv+u4fljNhnjT7vcEJQ2ctx2Wh36i/3JVL+7';
    this.sessionKey = workingSecret;
    
    console.log('[FRONTEND_FIXED] Public session initialized with exact backend secret:', {
      sessionKeyPrefix: this.sessionKey.substring(0, 30) + '...',
      matchesBackend: true
    });
  }

  // Clean AES encryption using unified standard - FIXED for backend compatibility
  async encryptData(data: string): Promise<EncryptedPayload> {
    if (!this.sessionKey) {
      throw new Error('Encryption session not initialized');
    }

    try {
      // Generate 12-byte IV for AES-GCM (unified standard)
      const iv = crypto.getRandomValues(new Uint8Array(12));

      // SHA-256 key derivation (matches backend exactly)
      const keyMaterial = await crypto.subtle.digest(
        'SHA-256',
        new TextEncoder().encode(this.sessionKey)
      );
      
      const cryptoKey = await crypto.subtle.importKey(
        'raw',
        keyMaterial,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt']
      );

      // Encrypt the data - Web Crypto API automatically includes auth tag
      const encryptedBuffer = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv: iv },
        cryptoKey,
        new TextEncoder().encode(data)
      );

      // Web Crypto API returns combined encrypted data + auth tag
      const combinedArray = new Uint8Array(encryptedBuffer);
      
      // Split into encrypted data and auth tag (last 16 bytes are the tag)
      const encryptedData = combinedArray.slice(0, -16);
      const authTag = combinedArray.slice(-16);

      console.log('[FRONTEND_DEBUG] Web Crypto API encryption:', {
        originalDataLength: data.length,
        combinedBufferLength: encryptedBuffer.byteLength,
        encryptedDataLength: encryptedData.length,
        authTagLength: authTag.length,
        ivLength: iv.length,
        sessionKeyPrefix: this.sessionKey.substring(0, 20) + '...'
      });

      // Return in Node.js compatible format (separate data and tag)
      return {
        data: btoa(String.fromCharCode.apply(null, Array.from(encryptedData))),
        iv: btoa(String.fromCharCode.apply(null, Array.from(iv))),
        tag: btoa(String.fromCharCode.apply(null, Array.from(authTag)))
      };
    } catch (error) {
      console.error('[FRONTEND_ERROR] Encryption failed:', error);
      throw new Error(`Frontend encryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Clean AES decryption using unified standard
  async decryptData(payload: EncryptedPayload): Promise<string> {
    if (!this.sessionKey) {
      throw new Error('Encryption session not initialized');
    }

    try {
      // Convert base64 to byte arrays
      const encryptedData = Uint8Array.from(atob(payload.data), c => c.charCodeAt(0));
      const iv = Uint8Array.from(atob(payload.iv), c => c.charCodeAt(0));
      const authTag = Uint8Array.from(atob(payload.tag), c => c.charCodeAt(0));

      // Production-compatible validation - log warnings only
      if (iv.length !== 12) {
        console.log(`[FRONTEND_ENCRYPT] Warning: IV length ${iv.length} (expected 12)`);
      }
      if (authTag.length !== 16) {
        console.log(`[FRONTEND_ENCRYPT] Warning: Auth tag length ${authTag.length} (expected 16)`);
      }

      // Combine encrypted data and auth tag for AES-GCM
      const combinedBuffer = new Uint8Array(encryptedData.length + authTag.length);
      combinedBuffer.set(encryptedData);
      combinedBuffer.set(authTag, encryptedData.length);

      // SHA-256 key derivation (matches backend exactly)
      const keyMaterial = await crypto.subtle.digest(
        'SHA-256',
        new TextEncoder().encode(this.sessionKey)
      );
      
      const cryptoKey = await crypto.subtle.importKey(
        'raw',
        keyMaterial,
        { name: 'AES-GCM', length: 256 },
        false,
        ['decrypt']
      );

      // Decrypt the data
      const decryptedBuffer = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: iv },
        cryptoKey,
        combinedBuffer
      );

      return new TextDecoder().decode(decryptedBuffer);
    } catch (error) {
      throw new Error(`Frontend decryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Validate encrypted payload format
  isValidEncryptedPayload(payload: any): payload is EncryptedPayload {
    if (!payload || typeof payload !== 'object') {
      return false;
    }
    
    const { data, iv, tag } = payload;
    
    if (typeof data !== 'string' || typeof iv !== 'string' || typeof tag !== 'string') {
      return false;
    }
    
    try {
      // Validate base64 encoding and lengths
      const ivBuffer = Uint8Array.from(atob(iv), c => c.charCodeAt(0));
      const tagBuffer = Uint8Array.from(atob(tag), c => c.charCodeAt(0));
      Uint8Array.from(atob(data), c => c.charCodeAt(0)); // Validate data is base64
      
      // Check unified standard requirements
      return ivBuffer.length === 12 && tagBuffer.length === 16;
    } catch {
      return false;
    }
  }
}

// Create singleton instance
export const cleanEncryptionService = new CleanEncryptionService();