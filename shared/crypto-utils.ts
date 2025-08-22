import { z } from "zod";

// Encryption configuration
export const ENCRYPTION_CONFIG = {
  algorithm: 'AES-GCM',
  keyLength: 256,
  ivLength: 12,
  tagLength: 16
} as const;

// Schema for encrypted payload
export const encryptedPayloadSchema = z.object({
  data: z.string(), // Base64 encrypted data
  iv: z.string(),   // Base64 initialization vector
  tag: z.string()   // Base64 authentication tag
});

export type EncryptedPayload = z.infer<typeof encryptedPayloadSchema>;

// Key derivation from session
export async function deriveEncryptionKey(sessionSecret: string, salt: string): Promise<CryptoKey> {
  if (typeof window !== 'undefined') {
    // Browser environment
    const encoder = new TextEncoder();
    const keyMaterial = await window.crypto.subtle.importKey(
      'raw',
      encoder.encode(sessionSecret),
      'PBKDF2',
      false,
      ['deriveKey']
    );

    return await window.crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: encoder.encode(salt),
        iterations: 100000,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: 'AES-GCM', length: ENCRYPTION_CONFIG.keyLength },
      false,
      ['encrypt', 'decrypt']
    );
  } else {
    // Node.js environment - will be implemented in server-crypto-utils.ts
    throw new Error('Use server-crypto-utils.ts for Node.js environment');
  }
}

// Encrypt data (browser only)
export async function encryptData(data: string, key: CryptoKey): Promise<EncryptedPayload> {
  if (typeof window === 'undefined') {
    throw new Error('Browser encryption only - use server-crypto-utils.ts for Node.js');
  }

  const encoder = new TextEncoder();
  const iv = window.crypto.getRandomValues(new Uint8Array(ENCRYPTION_CONFIG.ivLength));
  
  const encrypted = await window.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoder.encode(data)
  );

  const encryptedArray = new Uint8Array(encrypted);
  const dataBytes = encryptedArray.slice(0, -ENCRYPTION_CONFIG.tagLength);
  const tag = encryptedArray.slice(-ENCRYPTION_CONFIG.tagLength);

  return {
    data: btoa(String.fromCharCode.apply(null, Array.from(dataBytes))),
    iv: btoa(String.fromCharCode.apply(null, Array.from(iv))),
    tag: btoa(String.fromCharCode.apply(null, Array.from(tag)))
  };
}

// Decrypt data (browser only)
export async function decryptData(payload: EncryptedPayload, key: CryptoKey): Promise<string> {
  if (typeof window === 'undefined') {
    throw new Error('Browser decryption only - use server-crypto-utils.ts for Node.js');
  }

  const dataString = atob(payload.data);
  const ivString = atob(payload.iv);
  const tagString = atob(payload.tag);
  
  const dataBytes = new Uint8Array(dataString.length);
  const iv = new Uint8Array(ivString.length);
  const tag = new Uint8Array(tagString.length);
  
  for (let i = 0; i < dataString.length; i++) {
    dataBytes[i] = dataString.charCodeAt(i);
  }
  for (let i = 0; i < ivString.length; i++) {
    iv[i] = ivString.charCodeAt(i);
  }
  for (let i = 0; i < tagString.length; i++) {
    tag[i] = tagString.charCodeAt(i);
  }

  const encryptedWithTag = new Uint8Array(dataBytes.length + tag.length);
  encryptedWithTag.set(dataBytes);
  encryptedWithTag.set(tag, dataBytes.length);

  const decrypted = await window.crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    encryptedWithTag
  );

  return new TextDecoder().decode(decrypted);
}

// Utility to safely stringify data for encryption
export function safeStringify(data: any): string {
  try {
    return JSON.stringify(data);
  } catch (error) {
    throw new Error('Failed to stringify data for encryption');
  }
}

// Utility to safely parse decrypted data
export function safeParse<T>(data: string): T {
  try {
    return JSON.parse(data);
  } catch (error) {
    throw new Error('Failed to parse decrypted data');
  }
}