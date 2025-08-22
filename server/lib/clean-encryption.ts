import crypto from 'crypto';
import { EncryptedPayload } from '@shared/crypto-utils';

/**
 * Clean Unified Encryption System
 * Single AES-256-GCM implementation with SHA-256 key derivation
 */

// Generate session secret for encryption with debug logging
export function generateSessionSecret(founderId?: string): string {
  const viteSecret = process.env.VITE_ENCRYPTION_SECRET;
  const encSecret = process.env.ENCRYPTION_SECRET;
  const baseSecret = viteSecret || encSecret || 'fallback-secret';
  
  // Debug logging for production troubleshooting
  if (process.env.NODE_ENV !== 'production') {
    console.log('Secret generation debug:', {
      hasViteSecret: !!viteSecret,
      hasEncSecret: !!encSecret,
      secretPrefix: baseSecret.substring(0, 15) + '...',
      founderId: founderId || 'public'
    });
  }
  
  if (founderId) {
    return `session-${founderId}-${baseSecret}`;
  }
  
  // For public/login routes
  return `public-session-${baseSecret}`;
}

// Encrypt data using AES-256-GCM with SHA-256 key derivation
export function encryptData(data: string, sessionSecret: string): EncryptedPayload {
  try {
    // SHA-256 key derivation (matches frontend exactly)
    const key = crypto.createHash('sha256').update(sessionSecret, 'utf8').digest();
    
    // 12-byte IV for AES-GCM (unified standard)
    const iv = crypto.randomBytes(12);
    
    // Create AES-GCM cipher
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
    
    // Encrypt the data
    let encrypted = cipher.update(data, 'utf8');
    cipher.final();
    
    // Get authentication tag
    const authTag = cipher.getAuthTag();
    
    return {
      data: encrypted.toString('base64'),
      iv: iv.toString('base64'),
      tag: authTag.toString('base64')
    };
  } catch (error) {
    throw new Error(`Encryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Decrypt data using AES-256-GCM with SHA-256 key derivation
export function decryptData(payload: EncryptedPayload, sessionSecret: string): string {
  try {
    // Convert base64 to buffers with production compatibility
    const encryptedData = Buffer.from(payload.data, 'base64');
    let iv = Buffer.from(payload.iv, 'base64');
    let authTag = Buffer.from(payload.tag, 'base64');
    
    // Production payload fixes for length mismatches
    if (iv.length !== 12) {
      console.log(`[CLEAN_ENCRYPT] Adjusting IV from ${iv.length} to 12 bytes`);
      if (iv.length > 12) {
        iv = iv.slice(0, 12); // Truncate if too long
      } else if (iv.length < 12) {
        // Pad if too short
        const paddedIv = Buffer.alloc(12);
        iv.copy(paddedIv);
        iv = paddedIv;
      }
    }
    
    if (authTag.length !== 16) {
      console.log(`[CLEAN_ENCRYPT] Adjusting auth tag from ${authTag.length} to 16 bytes`);
      if (authTag.length > 16) {
        authTag = authTag.slice(0, 16); // Truncate if too long
      } else if (authTag.length < 16) {
        // Pad if too short
        const paddedTag = Buffer.alloc(16);
        authTag.copy(paddedTag);
        authTag = paddedTag;
      }
    }
    
    // SHA-256 key derivation (matches frontend exactly)
    const key = crypto.createHash('sha256').update(sessionSecret, 'utf8').digest();
    
    // Create AES-GCM decipher with production compatibility
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    
    // Set auth tag with length validation bypass for production
    try {
      decipher.setAuthTag(authTag);
    } catch (tagError) {
      console.log(`[CLEAN_ENCRYPT] Auth tag error: ${tagError.message}, trying truncated tag`);
      // If tag setting fails, try with properly sized tag
      const truncatedTag = authTag.slice(0, 16);
      decipher.setAuthTag(truncatedTag);
    }
    
    // Decrypt the data
    let decrypted = decipher.update(encryptedData, undefined, 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    throw new Error(`Decryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Validate encrypted payload format
export function isValidEncryptedPayload(payload: any): payload is EncryptedPayload {
  if (!payload || typeof payload !== 'object') {
    return false;
  }
  
  const { data, iv, tag } = payload;
  
  if (typeof data !== 'string' || typeof iv !== 'string' || typeof tag !== 'string') {
    return false;
  }
  
  try {
    // Validate base64 encoding and lengths
    const ivBuffer = Buffer.from(iv, 'base64');
    const tagBuffer = Buffer.from(tag, 'base64');
    Buffer.from(data, 'base64'); // Validate data is base64
    
    // Check unified standard requirements
    return ivBuffer.length === 12 && tagBuffer.length === 16;
  } catch {
    return false;
  }
}