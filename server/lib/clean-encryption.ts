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
    // Convert base64 to buffers
    const encryptedData = Buffer.from(payload.data, 'base64');
    const iv = Buffer.from(payload.iv, 'base64');
    const authTag = Buffer.from(payload.tag, 'base64');
    
    // Validate IV length (must be 12 bytes for unified standard)
    if (iv.length !== 12) {
      throw new Error(`Invalid IV length: expected 12 bytes, got ${iv.length} bytes`);
    }
    
    // Validate auth tag length (must be 16 bytes for AES-GCM)
    if (authTag.length !== 16) {
      throw new Error(`Invalid auth tag length: expected 16 bytes, got ${authTag.length} bytes`);
    }
    
    // SHA-256 key derivation (matches frontend exactly)
    const key = crypto.createHash('sha256').update(sessionSecret, 'utf8').digest();
    
    // Create AES-GCM decipher
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(authTag);
    
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