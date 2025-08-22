import crypto from 'crypto';
import { EncryptedPayload, ENCRYPTION_CONFIG, safeStringify, safeParse } from '@shared/crypto-utils';

// Server-side key derivation
export function deriveEncryptionKey(sessionSecret: string, salt: string): Buffer {
  return crypto.pbkdf2Sync(
    sessionSecret,
    salt,
    100000, // iterations
    ENCRYPTION_CONFIG.keyLength / 8, // key length in bytes
    'sha256'
  );
}

// Server-side encryption (simplified version)
export function encryptData(data: string, key: Buffer): EncryptedPayload {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipher('aes-256-gcm', key);
  
  let encrypted = cipher.update(data, 'utf8', 'base64');
  encrypted += cipher.final('base64');
  
  return {
    data: encrypted,
    iv: iv.toString('base64'),
    tag: 'simple-tag' // Simplified for compatibility
  };
}

// Server-side decryption (simplified version)
export function decryptData(payload: EncryptedPayload, key: Buffer): string {
  const decipher = crypto.createDecipher('aes-256-gcm', key);
  
  let decrypted = decipher.update(payload.data, 'base64', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}

// Simplified server encryption that actually works with Node.js crypto
export function simpleEncryptData(data: string, sessionSecret: string): EncryptedPayload {
  const salt = 'second-chance-salt-2024'; // Static salt for consistency
  const key = crypto.pbkdf2Sync(sessionSecret, salt, 1000, 32, 'sha256');
  const iv = crypto.randomBytes(16);
  
  // Use simple cipher for compatibility
  const cipher = crypto.createCipher('aes-256-cbc', key);
  
  let encrypted = cipher.update(data, 'utf8', 'base64');
  encrypted += cipher.final('base64');
  
  return {
    data: encrypted,
    iv: iv.toString('base64'),
    tag: crypto.createHash('sha256').update(encrypted + iv.toString('base64')).digest('base64')
  };
}

// Simplified server decryption
export function simpleDecryptData(payload: EncryptedPayload, sessionSecret: string): string {
  if (process.env.NODE_ENV === 'development') {
    console.log('[AES Decrypt] Attempting AES decryption...');
  }
  const salt = 'second-chance-salt-2024'; // Static salt for consistency
  const key = crypto.pbkdf2Sync(sessionSecret, salt, 1000, 32, 'sha256');
  const iv = Buffer.from(payload.iv, 'base64');
  
  // Verify tag
  const expectedTag = crypto.createHash('sha256').update(payload.data + payload.iv).digest('base64');
  if (process.env.NODE_ENV === 'development') {
    console.log('[AES Decrypt] Expected tag:', expectedTag);
    console.log('[AES Decrypt] Actual tag:', payload.tag);
  }
  
  if (payload.tag !== expectedTag) {
    throw new Error(`AES Authentication tag verification failed - Expected: ${expectedTag}, Got: ${payload.tag}`);
  }
  
  const decipher = crypto.createDecipher('aes-256-cbc', key);
  
  let decrypted = decipher.update(payload.data, 'base64', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}

// Generate session secret for encryption
export function generateSessionSecret(): string {
  return crypto.randomBytes(32).toString('hex');
}

// Encrypt API response
export function encryptApiResponse(data: any, sessionSecret: string): EncryptedPayload {
  const jsonString = safeStringify(data);
  return simpleEncryptData(jsonString, sessionSecret);
}

// Simple XOR decryption (compatible with frontend)
function simpleXorDecrypt(payload: EncryptedPayload, sessionSecret: string): string {
  const key = sessionSecret;
  const encrypted = Buffer.from(payload.data, 'base64').toString('binary');
  const iv = Buffer.from(payload.iv, 'base64').toString('binary');
  
  // Debug logging (only in development)
  if (process.env.NODE_ENV === 'development') {
    console.log('[XOR Decrypt] Key:', key);
    console.log('[XOR Decrypt] Encrypted length:', encrypted.length);
    console.log('[XOR Decrypt] IV:', iv);
  }
  
  // Generate expected tag for verification
  let hash = 0;
  const input = encrypted + iv;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  const expectedTag = Buffer.from(Math.abs(hash).toString(36)).toString('base64');
  
  if (process.env.NODE_ENV === 'development') {
    console.log('[XOR Decrypt] Expected tag:', expectedTag);
    console.log('[XOR Decrypt] Actual tag:', payload.tag);
  }
  
  // Verify tag
  if (payload.tag !== expectedTag) {
    throw new Error(`XOR Authentication tag verification failed - Expected: ${expectedTag}, Got: ${payload.tag}`);
  }
  
  // XOR decrypt
  let decrypted = '';
  for (let i = 0; i < encrypted.length; i++) {
    const keyChar = key.charCodeAt(i % key.length);
    const encryptedChar = encrypted.charCodeAt(i);
    decrypted += String.fromCharCode(encryptedChar ^ keyChar);
  }
  
  if (process.env.NODE_ENV === 'development') {
    console.log('[XOR Decrypt] Decrypted:', decrypted);
    console.log('[XOR Decrypt] Decrypted length:', decrypted.length);
    console.log('[XOR Decrypt] First 50 chars:', decrypted.substring(0, 50));
  }
  
  // Clean up any null bytes or control characters that might interfere with JSON parsing
  const cleaned = decrypted.replace(/\0/g, '').replace(/[\x00-\x1F\x7F]/g, '').trim();
  
  if (process.env.NODE_ENV === 'development') {
    console.log('[XOR Decrypt] Cleaned:', cleaned);
  }
  
  return cleaned;
}

// Decrypt API request with fallback support
export function decryptApiRequest<T>(payload: EncryptedPayload, sessionSecret: string): T {
  try {
    // Try AES decryption first
    const decryptedString = simpleDecryptData(payload, sessionSecret);
    return safeParse<T>(decryptedString);
  } catch (aesError) {
    try {
      // Fallback to XOR decryption (for frontend compatibility)
      const decryptedString = simpleXorDecrypt(payload, sessionSecret);
      return safeParse<T>(decryptedString);
    } catch (xorError) {
      throw new Error(`Decryption failed: AES(${aesError instanceof Error ? aesError.message : 'Unknown'}), XOR(${xorError instanceof Error ? xorError.message : 'Unknown'})`);
    }
  }
}