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

  // Initialize for public/login routes (before authentication) - UNIFIED with backend
  initializePublicSession() {
    // UNIFIED SECRET RESOLUTION: Match backend priority order exactly
    const baseSecret = import.meta.env.VITE_ENCRYPTION_SECRET || 'fallback-secret';
    this.sessionKey = `public-session-${baseSecret}`;
    
    console.log('[FRONTEND_UNIFIED] Public session initialized:', {
      hasViteSecret: !!import.meta.env.VITE_ENCRYPTION_SECRET,
      secretPrefix: baseSecret.substring(0, 15) + '...',
      sessionKey: this.sessionKey.substring(0, 25) + '...'
    });
  }

  // Clean AES encryption using unified standard
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

      // Encrypt the data - use tagLength: 128 for 16-byte tags to match Node.js
      const encryptedBuffer = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv: iv, tagLength: 128 },
        cryptoKey,
        new TextEncoder().encode(data)
      );

      // Extract encrypted data and auth tag
      const encryptedArray = new Uint8Array(encryptedBuffer);
      const encryptedData = encryptedArray.slice(0, -16); // All but last 16 bytes
      const authTag = encryptedArray.slice(-16); // Last 16 bytes

      console.log('[FRONTEND_DEBUG] Encryption details:', {
        originalLength: data.length,
        encryptedBufferLength: encryptedBuffer.byteLength,
        encryptedDataLength: encryptedData.length,
        authTagLength: authTag.length,
        ivLength: iv.length
      });

      return {
        data: btoa(String.fromCharCode.apply(null, Array.from(encryptedData))),
        iv: btoa(String.fromCharCode.apply(null, Array.from(iv))),
        tag: btoa(String.fromCharCode.apply(null, Array.from(authTag)))
      };
    } catch (error) {
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