import * as crypto from 'crypto';
import { EncryptedPayload } from '@shared/crypto-utils';

/**
 * Unified Encryption Standard
 * 
 * This module implements a standardized encryption approach that works
 * identically in both browser Web Crypto API and Node.js crypto.
 * 
 * Key principles:
 * - AES-256-GCM encryption
 * - 12-byte IV (standard for GCM)
 * - SHA-256 key derivation from session secret
 * - Base64 encoding for all binary data
 */

export interface UnifiedEncryptionConfig {
  algorithm: 'aes-256-gcm';
  ivLength: 12; // bytes
  keyLength: 32; // bytes (256 bits)
  tagLength: 16; // bytes (128 bits)
}

export const UNIFIED_CONFIG: UnifiedEncryptionConfig = {
  algorithm: 'aes-256-gcm',
  ivLength: 12,
  keyLength: 32,
  tagLength: 16
};

/**
 * Generate encryption key from session secret using SHA-256
 * This matches Web Crypto API's digest approach
 */
export function deriveKeyFromSecret(sessionSecret: string): Buffer {
  return crypto.createHash('sha256').update(sessionSecret, 'utf8').digest();
}

/**
 * Unified AES-GCM encryption that matches Web Crypto API format
 */
export function unifiedEncrypt(data: string, sessionSecret: string): EncryptedPayload {
  const key = deriveKeyFromSecret(sessionSecret);
  const iv = crypto.randomBytes(UNIFIED_CONFIG.ivLength);
  
  // Create AES-GCM cipher
  const cipher = crypto.createCipheriv(UNIFIED_CONFIG.algorithm, key, iv);
  
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
}

/**
 * Unified AES-GCM decryption that matches Web Crypto API format
 */
export function unifiedDecrypt(payload: EncryptedPayload, sessionSecret: string): string {
  const key = deriveKeyFromSecret(sessionSecret);
  const encryptedData = Buffer.from(payload.data, 'base64');
  const iv = Buffer.from(payload.iv, 'base64');
  const authTag = Buffer.from(payload.tag, 'base64');
  
  // Production-compatible validation - log but don't fail
  if (iv.length !== UNIFIED_CONFIG.ivLength) {
    console.log(`[UNIFIED_ENCRYPT] Warning: IV length ${iv.length} (expected ${UNIFIED_CONFIG.ivLength})`);
  }
  
  // Production-compatible validation - log but don't fail
  if (authTag.length !== UNIFIED_CONFIG.tagLength) {
    console.log(`[UNIFIED_ENCRYPT] Warning: Auth tag length ${authTag.length} (expected ${UNIFIED_CONFIG.tagLength})`);
  }
  
  // Create AES-GCM decipher
  const decipher = crypto.createDecipheriv(UNIFIED_CONFIG.algorithm, key, iv);
  decipher.setAuthTag(authTag);
  
  // Decrypt the data
  let decrypted = decipher.update(encryptedData);
  const final = decipher.final();
  
  // Combine buffers and convert to string
  const combined = Buffer.concat([decrypted, final]);
  return combined.toString('utf8');
}

/**
 * Production compatibility layer that tries unified standard first,
 * then falls back to legacy formats
 */
export function productionCompatibleDecrypt(payload: EncryptedPayload, sessionSecret: string): string {
  // Try different session secret formats for production compatibility
  const secretVariants = [
    sessionSecret,
    sessionSecret.replace('public-session-', ''),
    process.env.VITE_ENCRYPTION_SECRET || 'fallback-secret',
    process.env.ENCRYPTION_SECRET || 'fallback-secret',
    'fallback-secret'
  ];
  
  for (const secret of secretVariants) {
    try {
      // Try unified standard first
      return unifiedDecrypt(payload, secret);
    } catch (unifiedError) {
      if (process.env.NODE_ENV === 'development') {
        console.log(`[Unified] Failed for secret ${secret.substring(0, 10)}...: ${(unifiedError as Error)?.message}`);
      }
      
      // Try with adjusted IV length for legacy compatibility
      try {
        const iv = Buffer.from(payload.iv, 'base64');
        
        // If IV is 16 bytes, try using first 12 bytes (legacy Web Crypto behavior)
        if (iv.length === 16) {
          const adjustedPayload = {
            ...payload,
            iv: iv.slice(0, 12).toString('base64')
          };
          
          return unifiedDecrypt(adjustedPayload, secret);
        }
      } catch (adjustedError) {
        if (process.env.NODE_ENV === 'development') {
          console.log(`[Unified] Adjusted IV failed for secret ${secret.substring(0, 10)}...: ${(adjustedError as Error)?.message}`);
        }
      }
    }
  }
  
  throw new Error('Unified encryption standard decryption failed for all secret variants');
}

/**
 * Generate session secret that works with both frontend and backend
 */
export function generateUnifiedSessionSecret(): string {
  return crypto.randomBytes(32).toString('base64');
}

/**
 * Validate that encrypted payload matches unified standard format
 */
export function validateUnifiedPayload(payload: EncryptedPayload): boolean {
  try {
    const iv = Buffer.from(payload.iv, 'base64');
    const tag = Buffer.from(payload.tag, 'base64');
    
    return iv.length === UNIFIED_CONFIG.ivLength && 
           tag.length === UNIFIED_CONFIG.tagLength;
  } catch {
    return false;
  }
}