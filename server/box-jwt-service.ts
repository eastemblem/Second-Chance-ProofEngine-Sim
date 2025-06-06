import jwt from 'jsonwebtoken';
import { Request } from 'express';
import multer from 'multer';

export class BoxJWTService {
  private clientId: string;
  private clientSecret: string;
  private privateKey: string;
  private publicKeyId: string;
  private enterpriseId: string;
  private passphrase: string;
  private isInitialized: boolean = false;

  constructor() {
    this.clientId = process.env.BOX_CLIENT_ID || '';
    this.clientSecret = process.env.BOX_CLIENT_SECRET || '';
    this.privateKey = process.env.BOX_PRIVATE_KEY || '';
    this.publicKeyId = process.env.BOX_PUBLIC_KEY_ID || '';
    this.enterpriseId = process.env.BOX_ENTERPRISE_ID || '';
    this.passphrase = process.env.BOX_PRIVATE_KEY_PASSPHRASE || '';
    
    console.log('Box JWT Service configuration:');
    console.log('- Client ID:', this.clientId ? `${this.clientId.substring(0, 8)}...` : 'NOT SET');
    console.log('- Client Secret:', this.clientSecret ? 'SET' : 'NOT SET');
    console.log('- Private Key:', this.privateKey ? 'SET' : 'NOT SET');
    console.log('- Public Key ID:', this.publicKeyId ? 'SET' : 'NOT SET');
    console.log('- Enterprise ID:', this.enterpriseId ? 'SET' : 'NOT SET');
    
    if (this.clientId && this.clientSecret && this.privateKey && this.publicKeyId) {
      this.isInitialized = true;
      console.log('Box JWT Service initialized');
    }
  }

  private formatPrivateKey(key: string): string {
    // Remove any extra whitespace and normalize line endings
    let formattedKey = key.trim().replace(/\\n/g, '\n').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    
    // Handle escaped newlines from environment variables
    if (formattedKey.includes('\\n')) {
      formattedKey = formattedKey.replace(/\\n/g, '\n');
    }
    
    // If key doesn't have proper headers, detect key type and add them
    if (!formattedKey.includes('-----BEGIN')) {
      // Check if it's RSA or PKCS#8 format based on content
      if (formattedKey.startsWith('MII') || formattedKey.includes('MII')) {
        formattedKey = `-----BEGIN PRIVATE KEY-----\n${formattedKey}\n-----END PRIVATE KEY-----`;
      } else {
        formattedKey = `-----BEGIN RSA PRIVATE KEY-----\n${formattedKey}\n-----END RSA PRIVATE KEY-----`;
      }
    }
    
    // Handle single-line PEM format (common in environment variables)
    if ((formattedKey.includes('-----BEGIN') && formattedKey.includes('-----END')) && 
        formattedKey.split('\n').length <= 3) {
      
      const beginMatch = formattedKey.match(/-----BEGIN [^-]+-----/);
      const endMatch = formattedKey.match(/-----END [^-]+-----/);
      
      if (beginMatch && endMatch) {
        const header = beginMatch[0];
        const footer = endMatch[0];
        const keyContent = formattedKey
          .replace(header, '')
          .replace(footer, '')
          .replace(/\s+/g, '');
        
        // Add line breaks every 64 characters
        const formattedContent = keyContent.match(/.{1,64}/g)?.join('\n') || keyContent;
        formattedKey = `${header}\n${formattedContent}\n${footer}`;
      }
    }
    
    return formattedKey;
  }

  private generateJWT(): string {
    if (!this.isInitialized) {
      throw new Error('Box JWT Service not properly configured');
    }

    const now = Math.floor(Date.now() / 1000);
    
    const claims = {
      iss: this.clientId,
      sub: this.enterpriseId || this.clientId,
      box_sub_type: this.enterpriseId ? 'enterprise' : 'user',
      aud: 'https://api.box.com/oauth2/token',
      jti: this.generateRandomString(32),
      exp: now + 60, // 1 minute expiration
      iat: now
    };

    const header = {
      alg: 'RS256',
      typ: 'JWT',
      kid: this.publicKeyId
    };

    try {
      const formattedPrivateKey = this.formatPrivateKey(this.privateKey);
      console.log('Using formatted private key for JWT signing');
      
      const token = jwt.sign(claims, formattedPrivateKey, {
        algorithm: 'RS256',
        header: header,
        ...(this.passphrase && { passphrase: this.passphrase })
      });
      
      return token;
    } catch (error) {
      console.error('JWT generation failed:', error);
      throw new Error('Failed to generate JWT token');
    }
  }

  private generateRandomString(length: number): string {
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return result;
  }

  async getAccessToken(): Promise<string> {
    try {
      console.log('Generating JWT token for Box authentication...');
      const jwtToken = this.generateJWT();
      
      const response = await fetch('https://api.box.com/oauth2/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
          assertion: jwtToken,
          client_id: this.clientId,
          client_secret: this.clientSecret
        }),
      });

      const responseText = await response.text();
      console.log(`Box JWT auth response: ${response.status}`);

      if (!response.ok) {
        console.error('JWT authentication failed:', responseText);
        throw new Error(`JWT authentication failed: ${response.status} - ${responseText}`);
      }

      const tokens = JSON.parse(responseText);
      console.log('Box JWT authentication successful');
      
      // Store token for future use
      await this.storeAccessToken(tokens.access_token, tokens.expires_in);
      
      return tokens.access_token;
    } catch (error) {
      console.error('JWT authentication error:', error);
      throw error;
    }
  }

  async getValidAccessToken(): Promise<string> {
    // Check for stored token first
    const storedToken = await this.getStoredAccessToken();
    if (storedToken) {
      const isValid = await this.testConnection(storedToken);
      if (isValid) {
        console.log('Using stored JWT access token');
        return storedToken;
      }
    }

    // Get new JWT access token
    return await this.getAccessToken();
  }

  async testConnection(accessToken?: string): Promise<boolean> {
    try {
      const token = accessToken || await this.getValidAccessToken();
      
      const response = await fetch('https://api.box.com/2.0/users/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        console.log('Box JWT connection successful');
        return true;
      } else {
        console.log(`Box JWT connection failed: ${response.status}`);
        return false;
      }
    } catch (error) {
      console.error('Box JWT connection test failed:', error);
      return false;
    }
  }

  async uploadFile(
    fileName: string,
    fileBuffer: Buffer,
    parentFolderId: string = '0'
  ): Promise<any> {
    try {
      const accessToken = await this.getValidAccessToken();
      
      const formData = new FormData();
      formData.append('attributes', JSON.stringify({
        name: fileName,
        parent: { id: parentFolderId }
      }));
      formData.append('file', new Blob([fileBuffer]), fileName);

      const response = await fetch('https://upload.box.com/api/2.0/files/content', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`
        },
        body: formData
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Upload failed: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log(`File uploaded successfully via JWT: ${fileName}`);
      return result.entries[0];
    } catch (error) {
      console.error('Box JWT upload failed:', error);
      throw error;
    }
  }

  async createFolder(folderName: string, parentId: string = '0'): Promise<string> {
    try {
      const accessToken = await this.getValidAccessToken();
      
      const response = await fetch('https://api.box.com/2.0/folders', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: folderName,
          parent: { id: parentId }
        })
      });

      if (!response.ok) {
        if (response.status === 409) {
          // Folder already exists, find it
          const existingFolder = await this.findExistingFolder(folderName, parentId);
          if (existingFolder) {
            return existingFolder.id;
          }
        }
        const errorText = await response.text();
        throw new Error(`Folder creation failed: ${response.status} - ${errorText}`);
      }

      const folder = await response.json();
      console.log(`Folder created successfully via JWT: ${folderName}`);
      return folder.id;
    } catch (error) {
      console.error('Box JWT folder creation failed:', error);
      throw error;
    }
  }

  async findExistingFolder(folderName: string, parentId: string): Promise<any> {
    try {
      const accessToken = await this.getValidAccessToken();
      
      const response = await fetch(`https://api.box.com/2.0/folders/${parentId}/items`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      const folder = data.entries.find((item: any) => 
        item.type === 'folder' && item.name === folderName
      );

      return folder || null;
    } catch (error) {
      console.error('Error finding existing folder via JWT:', error);
      return null;
    }
  }

  async createSessionFolder(startupName: string): Promise<string> {
    const folderName = `ProofVault_${startupName.replace(/[^a-zA-Z0-9_-]/g, '_')}`;
    return await this.createFolder(folderName);
  }

  async createShareableLink(itemId: string, itemType: 'file' | 'folder' = 'file'): Promise<string> {
    try {
      const accessToken = await this.getValidAccessToken();
      
      const endpoint = itemType === 'folder' 
        ? `https://api.box.com/2.0/folders/${itemId}`
        : `https://api.box.com/2.0/files/${itemId}`;

      const response = await fetch(endpoint, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          shared_link: {
            access: 'open'
          }
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Shareable link creation failed: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log(`Shareable link created via JWT for ${itemType}: ${itemId}`);
      return result.shared_link.url;
    } catch (error) {
      console.error('Failed to create shareable link via JWT:', error);
      throw error;
    }
  }

  private async storeAccessToken(token: string, expiresIn: number): Promise<void> {
    try {
      const { db } = await import('./db');
      const { users } = await import('../shared/schema');
      const { eq } = await import('drizzle-orm');
      
      const expiresAt = new Date(Date.now() + expiresIn * 1000);
      
      const existingUser = await db.select().from(users).where(
        eq(users.email, 'service@box.jwt')
      ).limit(1);
      
      if (existingUser.length > 0) {
        await db.update(users).set({
          boxAccessToken: token,
          boxTokenExpiresAt: expiresAt
        }).where(eq(users.email, 'service@box.jwt'));
      } else {
        await db.insert(users).values({
          firstName: 'Service',
          lastName: 'BoxJWT',
          email: 'service@box.jwt',
          boxAccessToken: token,
          boxTokenExpiresAt: expiresAt
        });
      }
      
      console.log('Box JWT access token stored');
    } catch (error) {
      console.error('Failed to store JWT access token:', error);
    }
  }

  private async getStoredAccessToken(): Promise<string | null> {
    try {
      const { db } = await import('./db');
      const { users } = await import('../shared/schema');
      const { eq } = await import('drizzle-orm');
      
      const serviceUser = await db.select().from(users).where(
        eq(users.email, 'service@box.jwt')
      ).limit(1);
      
      if (serviceUser.length > 0 && serviceUser[0].boxAccessToken) {
        const user = serviceUser[0];
        if (user.boxTokenExpiresAt && user.boxTokenExpiresAt > new Date()) {
          return user.boxAccessToken;
        }
      }
      
      return null;
    } catch (error) {
      console.error('Error getting stored JWT access token:', error);
      return null;
    }
  }
}

// Configure multer for file uploads
export const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    console.log(`File filter check: ${file.originalname} ${file.mimetype}`);
    cb(null, true);
  }
});

export const boxJWTService = new BoxJWTService();