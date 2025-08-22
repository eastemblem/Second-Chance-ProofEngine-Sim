import { EncryptedPayload } from '@shared/crypto-utils';
// Import buffer polyfill first
import '../lib/buffer-polyfill';

// Dynamic import approach for better browser compatibility
let crypto: any = null;
let Buffer: any = null;
let cryptoLoaded = false;

const loadCryptoDependencies = async () => {
  if (cryptoLoaded) return true;
  
  try {
    console.log('🔄 [CRYPTO_INIT] Loading crypto dependencies...');
    
    // Load Buffer first and make it globally available
    const bufferModule = await import('buffer');
    Buffer = bufferModule.Buffer;
    
    // Set Buffer globally before crypto-browserify needs it
    if (typeof globalThis.Buffer === 'undefined') {
      globalThis.Buffer = Buffer;
    }
    if (typeof window !== 'undefined' && typeof window.Buffer === 'undefined') {
      (window as any).Buffer = Buffer;
    }
    
    // Now load crypto-browserify after Buffer is globally available
    const cryptoModule = await import('crypto-browserify');
    crypto = cryptoModule.default || cryptoModule;
    
    cryptoLoaded = true;
    console.log('✅ [CRYPTO_INIT] crypto-browserify and Buffer loaded successfully');
    console.log('✅ [CRYPTO_INIT] Buffer available:', typeof Buffer, typeof globalThis.Buffer);
    return true;
  } catch (error) {
    console.error('❌ [CRYPTO_INIT] Failed to load crypto dependencies:', error);
    cryptoLoaded = false;
    return false;
  }
};

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

  // Initialize for public/login routes (before authentication) - WITH SECRET LOGGING
  async initializePublicSession() {
    // Ensure crypto dependencies are loaded first
    await loadCryptoDependencies();
    
    // LOG ALL SECRET SOURCES FOR DEBUGGING
    const viteSecret = import.meta.env.VITE_ENCRYPTION_SECRET;
    const fallbackSecret = 'PjUPhlc/b7NXvdlR911x/R8mhCvZwv+u4fljNhnjT7vcEJQ2ctx2Wh36i/3JVL+7';
    const baseSecret = viteSecret || fallbackSecret;
    const frontendSessionKey = `public-session-${baseSecret}`;
    
    console.log('🔍 [FRONTEND_SECRET_DEBUG] Secret resolution:', {
      'VITE_ENCRYPTION_SECRET exists': !!viteSecret,
      'VITE_ENCRYPTION_SECRET value': viteSecret ? viteSecret.substring(0, 20) + '...' : 'NOT SET',
      'fallback secret': fallbackSecret.substring(0, 20) + '...',
      'base secret used': baseSecret.substring(0, 20) + '...',
      'final session key': frontendSessionKey.substring(0, 30) + '...',
      'full session key length': frontendSessionKey.length,
      'crypto loaded': cryptoLoaded
    });
    
    this.sessionKey = frontendSessionKey;
  }

  // Node.js crypto encryption - IDENTICAL to backend implementation
  async encryptData(data: string): Promise<EncryptedPayload> {
    if (!this.sessionKey) {
      throw new Error('Encryption session not initialized');
    }

    // Ensure crypto is loaded before proceeding
    const loaded = await loadCryptoDependencies();
    if (!loaded || !crypto || !Buffer) {
      throw new Error('Crypto dependencies not available - crypto-browserify or Buffer failed to load');
    }

    try {
      console.log('🔍 [FRONTEND_NODE_CRYPTO] Starting Node.js crypto encryption:', {
        sessionKeyPrefix: this.sessionKey.substring(0, 30) + '...',
        dataLength: data.length
      });

      // Use exact same approach as backend Node.js crypto
      const key = crypto.createHash('sha256').update(this.sessionKey, 'utf8').digest();
      const iv = crypto.randomBytes(12);
      const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
      
      let encrypted = cipher.update(data, 'utf8');
      cipher.final();
      const authTag = cipher.getAuthTag();

      const payload = {
        data: encrypted.toString('base64'),
        iv: iv.toString('base64'),
        tag: authTag.toString('base64')
      };

      console.log('🔍 [FRONTEND_NODE_CRYPTO] Encryption successful:', {
        encryptedDataLength: encrypted.length,
        ivLength: iv.length,
        authTagLength: authTag.length,
        payloadDataB64Length: payload.data.length,
        payloadIvB64Length: payload.iv.length,
        payloadTagB64Length: payload.tag.length
      });

      return payload;
    } catch (error) {
      console.error('[FRONTEND_ERROR] Node.js crypto encryption failed:', error);
      throw new Error(`Frontend encryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Node.js crypto decryption - IDENTICAL to backend implementation
  async decryptData(payload: EncryptedPayload): Promise<string> {
    if (!this.sessionKey) {
      throw new Error('Encryption session not initialized');
    }

    try {
      console.log('🔍 [FRONTEND_NODE_CRYPTO] Starting Node.js crypto decryption');

      // Use exact same approach as backend Node.js crypto
      const key = crypto.createHash('sha256').update(this.sessionKey, 'utf8').digest();
      const encryptedData = Buffer.from(payload.data, 'base64');
      const iv = Buffer.from(payload.iv, 'base64');
      const authTag = Buffer.from(payload.tag, 'base64');

      const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
      decipher.setAuthTag(authTag);
      
      let decrypted = decipher.update(encryptedData, undefined, 'utf8');
      decrypted += decipher.final('utf8');

      console.log('🔍 [FRONTEND_NODE_CRYPTO] Decryption successful');
      return decrypted;
    } catch (error) {
      console.error('[FRONTEND_ERROR] Node.js crypto decryption failed:', error);
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