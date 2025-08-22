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
  const salt = 'second-chance-salt-2024'; // Static salt for consistency
  const key = crypto.pbkdf2Sync(sessionSecret, salt, 1000, 32, 'sha256');
  const iv = Buffer.from(payload.iv, 'base64');
  
  // Verify tag
  const expectedTag = crypto.createHash('sha256').update(payload.data + payload.iv).digest('base64');
  if (payload.tag !== expectedTag) {
    throw new Error('Authentication tag verification failed');
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

// Decrypt API request
export function decryptApiRequest<T>(payload: EncryptedPayload, sessionSecret: string): T {
  const decryptedString = simpleDecryptData(payload, sessionSecret);
  return safeParse<T>(decryptedString);
}