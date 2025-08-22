// Encryption configuration constants
export const ENCRYPTION_CONFIG = {
  // AES-GCM parameters
  algorithm: 'AES-GCM' as const,
  keyLength: 256, // bits
  ivLength: 12,   // bytes (96 bits recommended for GCM)
  tagLength: 16,  // bytes (128 bits)
  
  // Key derivation parameters
  keyDerivation: {
    algorithm: 'PBKDF2' as const,
    iterations: 100000,
    hash: 'SHA-256' as const,
    saltLength: 32, // bytes
  },
  
  // Request headers
  headers: {
    encrypted: 'x-encrypted',
    keyVersion: 'x-key-version',
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
  V1: 'v1'
} as const;

export type EncryptionVersion = typeof ENCRYPTION_VERSIONS[keyof typeof ENCRYPTION_VERSIONS];