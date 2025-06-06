import { Request } from 'express';
import multer from 'multer';

export class BoxEnterpriseService {
  private clientId: string;
  private clientSecret: string;
  private enterpriseId: string;
  private isInitialized: boolean = false;

  constructor() {
    this.clientId = process.env.BOX_CLIENT_ID || '';
    this.clientSecret = process.env.BOX_CLIENT_SECRET || '';
    this.enterpriseId = process.env.BOX_ENTERPRISE_ID || '';
    
    console.log('Box Enterprise Service configuration:');
    console.log('- Client ID:', this.clientId ? `${this.clientId.substring(0, 8)}...` : 'NOT SET');
    console.log('- Client Secret:', this.clientSecret ? 'SET' : 'NOT SET');
    console.log('- Enterprise ID:', this.enterpriseId ? 'SET' : 'NOT SET');
    
    if (this.clientId && this.clientSecret) {
      this.isInitialized = true;
      console.log('Box Enterprise Service initialized');
    }
  }

  async getServiceAccountToken(): Promise<string | null> {
    try {
      if (!this.isInitialized) {
        throw new Error('Box Enterprise Service not initialized');
      }

      console.log('Attempting Box enterprise service account authentication...');
      
      const response = await fetch('https://api.box.com/oauth2/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'client_credentials',
          client_id: this.clientId,
          client_secret: this.clientSecret,
          box_subject_type: 'enterprise',
          box_subject_id: this.enterpriseId || this.clientId
        }),
      });

      const responseText = await response.text();
      console.log(`Box enterprise auth response: ${response.status}`);

      if (!response.ok) {
        console.log('Enterprise authentication failed, trying user scope...');
        return await this.getUserScopeToken();
      }

      const tokens = JSON.parse(responseText);
      console.log('Box enterprise authentication successful');
      
      // Store token for future use
      await this.storeServiceToken(tokens.access_token, tokens.expires_in);
      
      return tokens.access_token;
    } catch (error) {
      console.error('Enterprise authentication error:', error);
      return await this.getUserScopeToken();
    }
  }

  async getUserScopeToken(): Promise<string | null> {
    try {
      const response = await fetch('https://api.box.com/oauth2/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'client_credentials',
          client_id: this.clientId,
          client_secret: this.clientSecret,
          box_subject_type: 'user'
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.log(`User scope authentication failed: ${response.status} - ${errorText}`);
        return null;
      }

      const tokens = await response.json();
      console.log('Box user scope authentication successful');
      
      await this.storeServiceToken(tokens.access_token, tokens.expires_in);
      return tokens.access_token;
    } catch (error) {
      console.error('User scope authentication error:', error);
      return null;
    }
  }

  async getValidAccessToken(): Promise<string> {
    // Check for stored token first
    const storedToken = await this.getStoredServiceToken();
    if (storedToken) {
      const isValid = await this.testConnection(storedToken);
      if (isValid) {
        console.log('Using stored service token');
        return storedToken;
      }
    }

    // Get new service account token
    const serviceToken = await this.getServiceAccountToken();
    if (serviceToken) {
      return serviceToken;
    }

    throw new Error('Unable to obtain valid Box access token');
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
        console.log('Box enterprise connection successful');
        return true;
      } else {
        console.log(`Box enterprise connection failed: ${response.status}`);
        return false;
      }
    } catch (error) {
      console.error('Box enterprise connection test failed:', error);
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
        throw new Error(`Upload failed: ${response.status}`);
      }

      const result = await response.json();
      console.log(`File uploaded successfully: ${fileName}`);
      return result.entries[0];
    } catch (error) {
      console.error('Box enterprise upload failed:', error);
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
        throw new Error(`Folder creation failed: ${response.status}`);
      }

      const folder = await response.json();
      console.log(`Folder created successfully: ${folderName}`);
      return folder.id;
    } catch (error) {
      console.error('Box enterprise folder creation failed:', error);
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
        throw new Error(`Shareable link creation failed: ${response.status}`);
      }

      const result = await response.json();
      console.log(`Shareable link created for ${itemType}: ${itemId}`);
      return result.shared_link.url;
    } catch (error) {
      console.error('Failed to create shareable link:', error);
      throw error;
    }
  }

  private async storeServiceToken(token: string, expiresIn: number): Promise<void> {
    try {
      const { db } = await import('./db');
      const { users } = await import('../shared/schema');
      const { eq } = await import('drizzle-orm');
      
      const expiresAt = new Date(Date.now() + expiresIn * 1000);
      
      const existingUser = await db.select().from(users).where(
        eq(users.email, 'service@box.enterprise')
      ).limit(1);
      
      if (existingUser.length > 0) {
        await db.update(users).set({
          boxAccessToken: token,
          boxTokenExpiresAt: expiresAt
        }).where(eq(users.email, 'service@box.enterprise'));
      } else {
        await db.insert(users).values({
          firstName: 'Service',
          lastName: 'BoxEnterprise',
          email: 'service@box.enterprise',
          boxAccessToken: token,
          boxTokenExpiresAt: expiresAt
        });
      }
      
      console.log('Box enterprise service token stored');
    } catch (error) {
      console.error('Failed to store service token:', error);
    }
  }

  private async getStoredServiceToken(): Promise<string | null> {
    try {
      const { db } = await import('./db');
      const { users } = await import('../shared/schema');
      const { eq } = await import('drizzle-orm');
      
      const serviceUser = await db.select().from(users).where(
        eq(users.email, 'service@box.enterprise')
      ).limit(1);
      
      if (serviceUser.length > 0 && serviceUser[0].boxAccessToken) {
        const user = serviceUser[0];
        if (user.boxTokenExpiresAt && user.boxTokenExpiresAt > new Date()) {
          return user.boxAccessToken;
        }
      }
      
      return null;
    } catch (error) {
      console.error('Error getting stored service token:', error);
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

export const boxEnterpriseService = new BoxEnterpriseService();