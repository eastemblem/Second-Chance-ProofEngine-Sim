import { EncryptedPayload, encryptedPayloadSchema, safeStringify, safeParse, isEncryptionEnabled } from '@shared/crypto-utils';

// Simple browser-based encryption using Web Crypto API
class EncryptionService {
  private sessionKey: string | null = null;

  // Initialize with session key (derived from authentication)
  async initializeSession(founderId: string): Promise<void> {
    // Use founderId as basis for session key (same logic as server)
    this.sessionKey = `session-${founderId}-${import.meta.env.VITE_ENCRYPTION_SECRET || 'fallback-secret'}`;
  }

  // Simple symmetric encryption for browser
  async encryptData(data: string): Promise<EncryptedPayload> {
    if (!this.sessionKey) {
      throw new Error('Encryption session not initialized');
    }

    // Simple XOR-based encryption for demo (in production, use Web Crypto API)
    const key = this.sessionKey;
    const iv = this.generateRandomString(16);
    
    let encrypted = '';
    for (let i = 0; i < data.length; i++) {
      const keyChar = key.charCodeAt(i % key.length);
      const dataChar = data.charCodeAt(i);
      encrypted += String.fromCharCode(dataChar ^ keyChar);
    }

    const tag = this.generateHash(encrypted + iv);

    return {
      data: btoa(encrypted),
      iv: btoa(iv),
      tag: btoa(tag)
    };
  }

  // Simple symmetric decryption for browser
  async decryptData(payload: EncryptedPayload): Promise<string> {
    if (!this.sessionKey) {
      throw new Error('Encryption session not initialized');
    }

    const key = this.sessionKey;
    const encrypted = atob(payload.data);
    const iv = atob(payload.iv);
    const expectedTag = btoa(this.generateHash(encrypted + iv));

    // Verify tag
    if (payload.tag !== expectedTag) {
      throw new Error('Authentication tag verification failed');
    }

    let decrypted = '';
    for (let i = 0; i < encrypted.length; i++) {
      const keyChar = key.charCodeAt(i % key.length);
      const encryptedChar = encrypted.charCodeAt(i);
      decrypted += String.fromCharCode(encryptedChar ^ keyChar);
    }

    return decrypted;
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