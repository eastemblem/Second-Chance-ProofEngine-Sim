// Encryption configuration constants
export const ENCRYPTION_CONFIG = {
  // AES-GCM parameters (v1)
  algorithm: 'AES-GCM' as const,
  keyLength: 256, // bits
  ivLength: 12,   // bytes (96 bits recommended for GCM)
  tagLength: 16,  // bytes (128 bits)
  
  // ChaCha20-Poly1305 parameters (v2)
  chacha20: {
    keyLength: 32,  // bytes (256 bits)
    nonceLength: 24, // bytes (192 bits for IETF variant)
    tagLength: 16   // bytes (128 bits, integrated in libsodium)
  },
  
  // Key derivation parameters
  keyDerivation: {
    algorithm: 'PBKDF2' as const,
    iterations: 100000,
    hash: 'SHA-256' as const,
    saltLength: 32, // bytes
  },
  
  // Request headers
  headers: {
    encrypted: 'X-Encrypted-Request',
    encryptedResponse: 'X-Encrypted-Response',
    keyVersion: 'X-Key-Version',
  },
  
  // Environment variables
  env: {
    server: 'ENABLE_ENCRYPTION',
    client: 'VITE_ENABLE_ENCRYPTION',
    secret: 'ENCRYPTION_SECRET',
    clientSecret: 'VITE_ENCRYPTION_SECRET',
  }
} as const;

// Supported encryption versions for future upgrades
export const ENCRYPTION_VERSIONS = {
  V1: 'v1', // AES-256-GCM with Web Crypto API
  V2: 'v2'  // ChaCha20-Poly1305 with libsodium
} as const;

export type EncryptionVersion = typeof ENCRYPTION_VERSIONS[keyof typeof ENCRYPTION_VERSIONS];