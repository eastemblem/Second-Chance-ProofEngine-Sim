import BoxSDK from 'box-node-sdk';
import { Request } from 'express';
import multer from 'multer';

export class BoxSDKService {
  private sdk: any;
  private client: any;
  private isInitialized: boolean = false;

  constructor() {
    this.initializeSDK();
  }

  private initializeSDK() {
    try {
      const clientId = process.env.BOX_CLIENT_ID;
      const clientSecret = process.env.BOX_CLIENT_SECRET;

      if (!clientId || !clientSecret) {
        console.warn('Box SDK credentials not configured');
        return;
      }

      // Initialize Box SDK
      this.sdk = new BoxSDK({
        clientID: clientId,
        clientSecret: clientSecret
      });

      console.log('Box SDK initialized with credentials');
      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize Box SDK:', error);
    }
  }

  async getClient(): Promise<any> {
    if (!this.isInitialized) {
      throw new Error('Box SDK not initialized. Please check credentials.');
    }

    if (this.client) {
      return this.client;
    }

    try {
      // Try to get stored tokens from database
      const storedTokens = await this.getStoredTokens();
      
      if (storedTokens) {
        this.client = this.sdk.getPersistentClient(storedTokens);
        console.log('Box SDK client created with stored tokens');
        return this.client;
      }

      // If no stored tokens, try client credentials flow for service account
      console.log('No stored tokens found, attempting client credentials authentication...');
      const serviceTokens = await this.getClientCredentialsToken();
      
      if (serviceTokens) {
        this.client = this.sdk.getPersistentClient(serviceTokens);
        await this.storeTokens(serviceTokens);
        console.log('Box SDK client created with client credentials');
        return this.client;
      }

      // Create development client for demo purposes
      console.log('Creating development mode client for Box integration demo');
      return this.createDevelopmentClient();
    } catch (error) {
      console.error('Failed to create Box SDK client:', error);
      throw error;
    }
  }

  async getClientCredentialsToken(): Promise<any> {
    try {
      console.log('Attempting Box client credentials authentication...');
      
      const response = await fetch('https://api.box.com/oauth2/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'client_credentials',
          client_id: process.env.BOX_CLIENT_ID!,
          client_secret: process.env.BOX_CLIENT_SECRET!,
          box_subject_type: 'enterprise',
        }),
      });

      const responseText = await response.text();
      console.log(`Box auth response: ${response.status} - ${responseText}`);

      if (!response.ok) {
        // Try alternative approaches
        if (response.status === 400) {
          console.log('Client credentials failed, trying user subject type...');
          return await this.tryUserSubjectType();
        }
        return null;
      }

      const tokens = JSON.parse(responseText);
      console.log('Box client credentials authentication successful');
      
      return {
        accessToken: tokens.access_token,
        refreshToken: null,
        acquiredAtMS: Date.now(),
        accessTokenTTLMS: (tokens.expires_in || 3600) * 1000
      };
    } catch (error) {
      console.error('Client credentials authentication error:', error);
      return null;
    }
  }

  async tryUserSubjectType(): Promise<any> {
    try {
      const response = await fetch('https://api.box.com/oauth2/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'client_credentials',
          client_id: process.env.BOX_CLIENT_ID!,
          client_secret: process.env.BOX_CLIENT_SECRET!,
          box_subject_type: 'user',
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.log(`User subject type also failed: ${response.status} - ${errorText}`);
        return null;
      }

      const tokens = await response.json();
      console.log('Box user subject type authentication successful');
      
      return {
        accessToken: tokens.access_token,
        refreshToken: null,
        acquiredAtMS: Date.now(),
        accessTokenTTLMS: (tokens.expires_in || 3600) * 1000
      };
    } catch (error) {
      console.error('User subject type authentication error:', error);
      return null;
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      const client = await this.getClient();
      const user = await client.users.get(client.CURRENT_USER_ID);
      console.log('Box SDK connection successful for user:', user.name);
      return true;
    } catch (error) {
      console.error('Box SDK connection test failed:', error);
      return false;
    }
  }

  async uploadFile(
    fileName: string,
    fileBuffer: Buffer,
    parentFolderId: string = '0'
  ): Promise<any> {
    try {
      const client = await this.getClient();
      
      const fileStream = require('stream').Readable.from(fileBuffer);
      
      const uploadResult = await client.files.uploadFile(parentFolderId, fileName, fileStream);
      
      console.log(`File uploaded successfully to Box: ${fileName}`);
      return uploadResult.entries[0];
    } catch (error) {
      console.error('Box SDK file upload failed:', error);
      throw error;
    }
  }

  async createFolder(folderName: string, parentId: string = '0'): Promise<string> {
    try {
      const client = await this.getClient();
      
      // Check if folder already exists
      const existingFolder = await this.findExistingFolder(folderName, parentId);
      if (existingFolder) {
        console.log(`Folder already exists: ${folderName}`);
        return existingFolder.id;
      }

      const folder = await client.folders.create(parentId, folderName);
      console.log(`Folder created successfully: ${folderName}`);
      return folder.id;
    } catch (error) {
      console.error('Box SDK folder creation failed:', error);
      throw error;
    }
  }

  async findExistingFolder(folderName: string, parentId: string): Promise<any> {
    try {
      const client = await this.getClient();
      const items = await client.folders.getItems(parentId, {
        fields: 'name,id,type'
      });

      const folder = items.entries.find((item: any) => 
        item.type === 'folder' && item.name === folderName
      );

      return folder || null;
    } catch (error) {
      console.error('Error finding existing folder:', error);
      return null;
    }
  }

  async createSessionFolder(startupName: string): Promise<string> {
    const folderName = `ProofVault_${startupName.replace(/[^a-zA-Z0-9_-]/g, '_')}`;
    return await this.createFolder(folderName);
  }

  async createShareableLink(itemId: string, itemType: 'file' | 'folder' = 'file'): Promise<string> {
    try {
      const client = await this.getClient();
      
      let sharedLink;
      if (itemType === 'folder') {
        sharedLink = await client.folders.update(itemId, {
          shared_link: {
            access: 'open'
          }
        });
      } else {
        sharedLink = await client.files.update(itemId, {
          shared_link: {
            access: 'open'
          }
        });
      }

      console.log(`Shareable link created for ${itemType}: ${itemId}`);
      return sharedLink.shared_link.url;
    } catch (error) {
      console.error('Failed to create shareable link:', error);
      throw error;
    }
  }

  async listFolderContents(folderId: string = '0'): Promise<any[]> {
    try {
      const client = await this.getClient();
      const items = await client.folders.getItems(folderId);
      return items.entries;
    } catch (error) {
      console.error('Failed to list folder contents:', error);
      throw error;
    }
  }

  private async getStoredTokens(): Promise<any> {
    try {
      // Check database for stored tokens
      const { db } = await import('./db');
      const { users } = await import('../shared/schema');
      const { isNotNull, and } = await import('drizzle-orm');
      
      const userWithTokens = await db.select().from(users).where(
        and(
          isNotNull(users.boxAccessToken),
          isNotNull(users.boxRefreshToken)
        )
      ).limit(1);
      
      if (userWithTokens.length > 0) {
        const user = userWithTokens[0];
        return {
          accessToken: user.boxAccessToken,
          refreshToken: user.boxRefreshToken,
          acquiredAtMS: user.boxTokenExpiresAt ? user.boxTokenExpiresAt.getTime() - (3600 * 1000) : Date.now(),
          accessTokenTTLMS: 3600 * 1000
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error getting stored tokens:', error);
      return null;
    }
  }

  async storeTokens(tokenInfo: any): Promise<void> {
    try {
      const { db } = await import('./db');
      const { users } = await import('../shared/schema');
      const { eq } = await import('drizzle-orm');
      
      const expiresAt = new Date(tokenInfo.acquiredAtMS + tokenInfo.accessTokenTTLMS);
      
      // Create or update system token record
      const existingUser = await db.select().from(users).where(
        eq(users.email, 'system@box.sdk')
      ).limit(1);
      
      if (existingUser.length > 0) {
        await db.update(users).set({
          boxAccessToken: tokenInfo.accessToken,
          boxRefreshToken: tokenInfo.refreshToken,
          boxTokenExpiresAt: expiresAt
        }).where(eq(users.email, 'system@box.sdk'));
      } else {
        await db.insert(users).values({
          firstName: 'System',
          lastName: 'BoxSDK',
          email: 'system@box.sdk',
          boxAccessToken: tokenInfo.accessToken,
          boxRefreshToken: tokenInfo.refreshToken,
          boxTokenExpiresAt: expiresAt
        });
      }
      
      console.log('Box SDK tokens stored in database successfully');
    } catch (error) {
      console.error('Failed to store Box SDK tokens:', error);
    }
  }

  // OAuth2 URL generation for initial authentication
  getAuthURL(): string {
    if (!this.isInitialized) {
      throw new Error('Box SDK not initialized');
    }

    const state = Math.random().toString(36).substring(2, 15);
    const redirectUri = this.getRedirectUri();
    
    return `https://account.box.com/api/oauth2/authorize?client_id=${process.env.BOX_CLIENT_ID}&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}`;
  }

  private getRedirectUri(): string {
    const baseUrl = process.env.REPLIT_DEV_DOMAIN 
      ? `https://${process.env.REPLIT_DEV_DOMAIN}` 
      : 'http://localhost:5000';
    return `${baseUrl}/api/box/sdk/callback`;
  }

  async exchangeCodeForTokens(code: string): Promise<any> {
    try {
      if (!this.isInitialized) {
        throw new Error('Box SDK not initialized');
      }

      console.log('Exchanging authorization code for tokens with Box SDK...');
      
      const response = await fetch('https://api.box.com/oauth2/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code,
          client_id: process.env.BOX_CLIENT_ID!,
          client_secret: process.env.BOX_CLIENT_SECRET!,
          redirect_uri: this.getRedirectUri(),
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Token exchange failed: ${response.status} - ${errorText}`);
        throw new Error(`Token exchange failed: ${response.status}`);
      }

      const tokens = await response.json();
      
      // Store tokens for SDK use
      const tokenInfo = {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        acquiredAtMS: Date.now(),
        accessTokenTTLMS: (tokens.expires_in || 3600) * 1000
      };
      
      await this.storeTokens(tokenInfo);
      
      // Create SDK client with new tokens
      this.client = this.sdk.getPersistentClient(tokenInfo);
      
      return tokens;
    } catch (error) {
      console.error('Box SDK token exchange failed:', error);
      throw error;
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

export const boxSDKService = new BoxSDKService();