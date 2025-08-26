import { EncryptedPayload, encryptedPayloadSchema, safeStringify, safeParse, isEncryptionEnabled } from '@shared/crypto-utils';

// Simple browser-based encryption using Web Crypto API
class EncryptionService {
  private sessionKey: string | null = null;

  // Getter for sessionKey to check if initialized
  get hasSessionKey(): boolean {
    return this.sessionKey !== null;
  }

  // Initialize with session key (derived from authentication)
  async initializeSession(founderId: string): Promise<void> {
    // Use founderId as basis for session key (same logic as server)
    this.sessionKey = `session-${founderId}-${import.meta.env.VITE_ENCRYPTION_SECRET || 'fallback-secret'}`;
  }

  // Initialize with public session (for unauthenticated requests like login)
  initializePublicSession(): void {
    // Use the same format as server-side getSessionSecret for public endpoints
    this.sessionKey = `public-session-${import.meta.env.VITE_ENCRYPTION_SECRET || 'fallback-secret'}`;
  }

  // AES encryption using Web Crypto API
  async encryptData(data: string): Promise<EncryptedPayload> {
    if (!this.sessionKey) {
      throw new Error('Encryption session not initialized');
    }

    // Generate 12-byte IV for AES-GCM (unified standard)
    const iv = crypto.getRandomValues(new Uint8Array(12));
    
    // Derive key using SHA-256 (unified standard - matches server exactly)
    const keyMaterial = await crypto.subtle.digest(
      'SHA-256',
      new TextEncoder().encode(this.sessionKey)
    );
    
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt']
    );

    // Encrypt the data
    const encryptedBuffer = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv: iv },
      cryptoKey,
      new TextEncoder().encode(data)
    );

    // Extract encrypted data and auth tag
    const encryptedArray = new Uint8Array(encryptedBuffer);
    const encryptedData = encryptedArray.slice(0, -16); // All but last 16 bytes
    const authTag = encryptedArray.slice(-16); // Last 16 bytes

    return {
      data: btoa(String.fromCharCode.apply(null, Array.from(encryptedData))),
      iv: btoa(String.fromCharCode.apply(null, Array.from(iv))),
      tag: btoa(String.fromCharCode.apply(null, Array.from(authTag)))
    };
  }

  // AES decryption using unified standard (matches backend exactly)
  async decryptData(payload: EncryptedPayload): Promise<string> {
    if (!this.sessionKey) {
      throw new Error('Encryption session not initialized');
    }

    // Convert base64 to byte arrays
    const encryptedData = Uint8Array.from(atob(payload.data), c => c.charCodeAt(0));
    const iv = Uint8Array.from(atob(payload.iv), c => c.charCodeAt(0));
    const authTag = Uint8Array.from(atob(payload.tag), c => c.charCodeAt(0));

    // Combine encrypted data and auth tag for AES-GCM
    const combinedBuffer = new Uint8Array(encryptedData.length + authTag.length);
    combinedBuffer.set(encryptedData);
    combinedBuffer.set(authTag, encryptedData.length);

    // Derive key using SHA-256 (unified standard - matches server exactly)
    const keyMaterial = await crypto.subtle.digest(
      'SHA-256',
      new TextEncoder().encode(this.sessionKey)
    );
    
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['decrypt']
    );

    // Decrypt the data
    const decryptedBuffer = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: iv },
      cryptoKey,
      combinedBuffer
    );

    return new TextDecoder().decode(decryptedBuffer);
  }

  // Generate random string for IV
  private generateRandomString(length: number): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  // Simple hash function for tag generation
  private generateHash(input: string): string {
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  // Encrypt API request payload
  async encryptApiRequest(data: any): Promise<EncryptedPayload> {
    const jsonString = safeStringify(data);
    return await this.encryptData(jsonString);
  }

  // Decrypt API response payload
  async decryptApiResponse<T>(payload: EncryptedPayload): Promise<T> {
    const decryptedString = await this.decryptData(payload);
    return safeParse<T>(decryptedString);
  }

  // Check if response is encrypted
  isEncryptedResponse(data: any): data is EncryptedPayload {
    return encryptedPayloadSchema.safeParse(data).success;
  }
}

// Export singleton instance
export const encryptionService = new EncryptionService();

// HTTP client wrapper with encryption support
export class EncryptedApiClient {
  private baseUrl: string;
  private enableEncryption: boolean;

  constructor(baseUrl: string = '', enableEncryption: boolean = true) {
    this.baseUrl = baseUrl;
    // Check global encryption feature flag
    this.enableEncryption = enableEncryption && isEncryptionEnabled();
  }

  // Initialize encryption for user session
  async initializeEncryption(founderId: string): Promise<void> {
    if (this.enableEncryption) {
      await encryptionService.initializeSession(founderId);
    }
  }

  // Make encrypted API request
  async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<T> {
    const url = this.baseUrl ? `${this.baseUrl}${endpoint}` : endpoint;
    
    let headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    let body = options.body;

    // Initialize public session for unauthenticated requests if no session exists
    if (this.enableEncryption && !encryptionService.hasSessionKey) {
      encryptionService.initializePublicSession();
    }

    // Encrypt request body if enabled and body exists
    if (this.enableEncryption && body && typeof body === 'string') {
      try {
        const jsonData = JSON.parse(body);
        const encryptedPayload = await encryptionService.encryptApiRequest(jsonData);
        
        body = JSON.stringify(encryptedPayload);
        headers = {
          ...headers,
          'x-encrypted': 'true',
          'x-expect-encrypted': 'true'
        };
      } catch (error) {
        console.warn('Failed to encrypt request, sending unencrypted:', error);
      }
    }

    // Add encryption expectation header for GET requests
    if (this.enableEncryption && options.method !== 'POST' && options.method !== 'PUT' && options.method !== 'PATCH') {
      headers = {
        ...headers,
        'x-expect-encrypted': 'true'
      };
    }

    const response = await fetch(url, {
      ...options,
      headers,
      body
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const responseData = await response.json();

    // Decrypt response if it's encrypted
    if (this.enableEncryption && response.headers.get('x-encrypted') === 'true') {
      try {
        if (encryptionService.isEncryptedResponse(responseData)) {
          return await encryptionService.decryptApiResponse<T>(responseData);
        }
      } catch (error) {
        console.warn('Failed to decrypt response, using raw data:', error);
      }
    }

    return responseData as T;
  }

  // Convenience methods
  async get<T>(endpoint: string, headers?: HeadersInit): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET', headers });
  }

  async post<T>(endpoint: string, data?: any, headers?: HeadersInit): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      headers,
      body: data ? JSON.stringify(data) : undefined
    });
  }

  async put<T>(endpoint: string, data?: any, headers?: HeadersInit): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      headers,
      body: data ? JSON.stringify(data) : undefined
    });
  }

  async delete<T>(endpoint: string, headers?: HeadersInit): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE', headers });
  }
}

// Export default encrypted client instance
export const encryptedApiClient = new EncryptedApiClient();