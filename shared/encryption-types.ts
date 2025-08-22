import { ENCRYPTION_VERSIONS } from './crypto-config';

// Encrypted payload structure (v1 - AES-GCM)
export interface EncryptedPayloadV1 {
  data: string;      // Base64 encoded encrypted data
  iv: string;        // Base64 encoded initialization vector
  tag: string;       // Base64 encoded authentication tag
  salt: string;      // Base64 encoded salt for key derivation
  version: 'v1';     // Encryption version
  timestamp: number; // Request timestamp for replay protection
}

// Encrypted payload structure (v2 - ChaCha20-Poly1305)
export interface EncryptedPayloadV2 {
  data: string;      // Base64 encoded encrypted data (includes integrated tag)
  nonce: string;     // Base64 encoded nonce
  salt: string;      // Base64 encoded salt for key derivation
  version: 'v2';     // Encryption version
  timestamp: number; // Request timestamp for replay protection
}

// Union type for all payload versions
export type EncryptedPayload = EncryptedPayloadV1 | EncryptedPayloadV2;

// Encryption result (v1 - AES-GCM)
export interface EncryptionResultV1 {
  encryptedData: string;
  iv: Uint8Array;
  tag: Uint8Array;
  salt: Uint8Array;
}

// Encryption result (v2 - ChaCha20-Poly1305)
export interface EncryptionResultV2 {
  encryptedData: string;
  nonce: Uint8Array;
  salt: Uint8Array;
}

// Union type for all encryption results
export type EncryptionResult = EncryptionResultV1 | EncryptionResultV2;

// Decryption result
export interface DecryptionResult {
  data: any;
  timestamp: number;
  version: string;
}

// Key derivation result (v1 - Web Crypto API)
export interface DerivedKeyV1 {
  key: CryptoKey;
  salt: Uint8Array;
}

// Key derivation result (v2 - libsodium)
export interface DerivedKeyV2 {
  key: Uint8Array; // Raw 32-byte key for libsodium
  salt: Uint8Array;
}

// Union type for all key derivation results
export type DerivedKey = DerivedKeyV1 | DerivedKeyV2;

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