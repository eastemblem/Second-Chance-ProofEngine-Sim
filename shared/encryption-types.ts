import { ENCRYPTION_VERSIONS } from './crypto-config';

// Encrypted payload structure
export interface EncryptedPayload {
  data: string;      // Base64 encoded encrypted data
  iv: string;        // Base64 encoded initialization vector
  tag: string;       // Base64 encoded authentication tag
  salt: string;      // Base64 encoded salt for key derivation
  version: string;   // Encryption version
  timestamp: number; // Request timestamp for replay protection
}

// Encryption result
export interface EncryptionResult {
  encryptedData: string;
  iv: Uint8Array;
  tag: Uint8Array;
  salt: Uint8Array;
}

// Decryption result
export interface DecryptionResult {
  data: any;
  timestamp: number;
  version: string;
}

// Key derivation result
export interface DerivedKey {
  key: CryptoKey;
  salt: Uint8Array;
}

// Encryption context for requests
export interface EncryptionContext {
  isEnabled: boolean;
  version: keyof typeof ENCRYPTION_VERSIONS;
  secret?: string;
}

// Error types
export class EncryptionError extends Error {
  constructor(message: string, public readonly code: string) {
    super(message);
    this.name = 'EncryptionError';
  }
}

export class DecryptionError extends Error {
  constructor(message: string, public readonly code: string) {
    super(message);
    this.name = 'DecryptionError';
  }
}