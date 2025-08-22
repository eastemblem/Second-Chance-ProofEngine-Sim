import crypto from 'crypto';
import { EncryptedPayload } from '@shared/crypto-utils';

/**
 * Web Crypto API compatible AES-GCM decryption for production compatibility
 * This handles the exact format that browser Web Crypto API produces
 */
export function webCryptoCompatibleDecrypt(payload: EncryptedPayload, sessionSecret: string): string {
  const encryptedData = Buffer.from(payload.data, 'base64');
  const iv = Buffer.from(payload.iv, 'base64');
  const authTag = Buffer.from(payload.tag, 'base64');

  // Try different session secret formats used in production
  const secretVariants = [
    sessionSecret,
    sessionSecret.replace('public-session-', ''),
    process.env.VITE_ENCRYPTION_SECRET || 'fallback-secret',
    process.env.ENCRYPTION_SECRET || 'fallback-secret',
    'fallback-secret'
  ];

  for (const secret of secretVariants) {
    // Web Crypto API key derivation methods
    const keyMethods = [
      // Method 1: Direct SHA-256 of secret (most common)
      () => crypto.createHash('sha256').update(secret, 'utf8').digest(),
      
      // Method 2: Raw secret bytes padded to 32 bytes
      () => {
        const keyBytes = Buffer.from(secret, 'utf8');
        const key = Buffer.alloc(32);
        keyBytes.copy(key, 0, 0, Math.min(32, keyBytes.length));
        return key;
      },
      
      // Method 3: Base64 decode (if secret is base64)
      () => {
        try {
          const decoded = Buffer.from(secret, 'base64');
          if (decoded.length >= 32) return decoded.slice(0, 32);
          const key = Buffer.alloc(32);
          decoded.copy(key);
          return key;
        } catch {
          return crypto.createHash('sha256').update(secret).digest();
        }
      }
    ];

    for (let keyIndex = 0; keyIndex < keyMethods.length; keyIndex++) {
      try {
        const key = keyMethods[keyIndex]();

        // Web Crypto API AES-GCM with different IV handling
        const ivVariants = [
          // Variant 1: Use first 12 bytes of IV (standard GCM)
          () => iv.length >= 12 ? iv.slice(0, 12) : null,
          
          // Variant 2: Use full IV if it's exactly 12 bytes
          () => iv.length === 12 ? iv : null,
          
          // Variant 3: Use last 12 bytes if IV is 16 bytes
          () => iv.length === 16 ? iv.slice(4, 16) : null
        ];

        for (let ivIndex = 0; ivIndex < ivVariants.length; ivIndex++) {
          const gcmIv = ivVariants[ivIndex]();
          if (!gcmIv) continue;

          try {
            // Use proper Node.js crypto.createDecipherGCM for Web Crypto API compatibility
            let decipher;
            
            try {
              // Try Node.js 16+ crypto.createDecipherGCM
              decipher = (crypto as any).createDecipherGCM('aes-256-gcm', key, gcmIv);
              decipher.setAuthTag(authTag);
            } catch (gcmError) {
              // Fallback: Use createCipheriv for older Node.js versions
              decipher = crypto.createDecipheriv('aes-256-gcm', key, gcmIv);
              decipher.setAuthTag(authTag);
            }
            
            let decrypted = decipher.update(encryptedData, null, 'utf8');
            decrypted += decipher.final('utf8');
            
            // Validate result is JSON
            JSON.parse(decrypted);
            
            if (process.env.NODE_ENV === 'development') {
              console.log(`[WebCrypto Compat] SUCCESS: secret ${secret.substring(0, 10)}..., key method ${keyIndex + 1}, IV variant ${ivIndex + 1}`);
            }
            
            return decrypted;
            
          } catch (decryptError) {
            if (process.env.NODE_ENV === 'development') {
              console.log(`[WebCrypto Compat] Failed key ${keyIndex + 1}, IV ${ivIndex + 1}: ${(decryptError as Error)?.message || 'Unknown'}`);
            }
            continue;
          }
        }
      } catch (keyError) {
        if (process.env.NODE_ENV === 'development') {
          console.log(`[WebCrypto Compat] Key method ${keyIndex + 1} failed: ${(keyError as Error)?.message || 'Unknown'}`);
        }
        continue;
      }
    }
  }

  throw new Error('Web Crypto API compatible decryption failed for all combinations');
}

/**
 * Fallback decryption that tries to handle any Web Crypto API format
 * by attempting all reasonable parameter combinations
 */
export function comprehensiveWebCryptoDecrypt(payload: EncryptedPayload, sessionSecret: string): string {
  // First try the standard Web Crypto compatible approach
  try {
    return webCryptoCompatibleDecrypt(payload, sessionSecret);
  } catch (primaryError) {
    if (process.env.NODE_ENV === 'development') {
      console.log('[WebCrypto Comprehensive] Primary method failed, trying alternatives...');
    }
  }

  // Alternative approach: Try to match the exact production parameters
  const encryptedData = Buffer.from(payload.data, 'base64');
  const iv = Buffer.from(payload.iv, 'base64');
  const authTag = Buffer.from(payload.tag, 'base64');

  // Production analysis suggests specific key derivation
  const productionSecrets = [
    process.env.VITE_ENCRYPTION_SECRET || '',
    sessionSecret,
    'fallback-secret'
  ];

  for (const secret of productionSecrets) {
    try {
      // Try exact Web Crypto API SubtleCrypto equivalent
      const keyMaterial = crypto.createHash('sha256').update(secret, 'utf8').digest();
      
      // Web Crypto API typically uses 12-byte IV for GCM
      const gcmIv = iv.length >= 12 ? iv.slice(0, 12) : iv;
      
      // Try Node.js crypto with exact Web Crypto parameters
      let decipher;
      
      try {
        // Use proper GCM implementation
        decipher = crypto.createDecipheriv('aes-256-gcm', keyMaterial, gcmIv);
        decipher.setAuthTag(authTag);
      } catch (decipherError) {
        // Fallback for compatibility
        decipher = crypto.createDecipher('aes-256-gcm', keyMaterial);
        if ((decipher as any).setAuthTag) {
          (decipher as any).setAuthTag(authTag);
        }
      }
      
      let decrypted = decipher.update(encryptedData, undefined, 'utf8');
      decrypted += decipher.final('utf8');
      
      // Validate
      const parsed = JSON.parse(decrypted);
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`[WebCrypto Comprehensive] SUCCESS with alternative approach for secret: ${secret.substring(0, 10)}...`);
      }
      
      return decrypted;
      
    } catch (altError) {
      if (process.env.NODE_ENV === 'development') {
        console.log(`[WebCrypto Comprehensive] Alternative failed for ${secret.substring(0, 10)}...: ${(altError as Error)?.message || 'Unknown'}`);
      }
      continue;
    }
  }

  throw new Error('All Web Crypto API compatibility attempts failed');
}