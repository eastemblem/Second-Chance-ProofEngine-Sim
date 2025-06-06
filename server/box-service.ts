import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import BoxSDK from 'box-node-sdk';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface BoxConfig {
  clientId: string;
  clientSecret: string;
  privateKey: string;
  publicKeyId: string;
  enterpriseId: string;
  passphrase: string;
  accessToken?: string;
}

interface BoxUploadResult {
  id: string;
  name: string;
  size: number;
  download_url: string;
}

interface BoxFolderResult {
  id: string;
  name: string;
}

class BoxService {
  private config: BoxConfig;
  private authType: 'token' | 'sdk' | 'jwt' | 'none' = 'none';
  private sdk: any = null;
  private client: any = null;

  constructor() {
    this.config = {
      clientId: process.env.BOX_CLIENT_ID || '',
      clientSecret: process.env.BOX_CLIENT_SECRET || '',
      privateKey: process.env.BOX_PRIVATE_KEY || '',
      publicKeyId: process.env.BOX_PUBLIC_KEY_ID || '',
      enterpriseId: process.env.BOX_ENTERPRISE_ID || '',
      passphrase: process.env.BOX_PASSPHRASE || '',
      accessToken: process.env.BOX_ACCESS_TOKEN
    };

    this.initializeBoxSDK();
    this.determineAuthType();
    console.log(`Box Service initialized with ${this.authType} authentication`);
  }

  private initializeBoxSDK(): void {
    if (this.config.clientId && this.config.clientSecret && 
        this.config.privateKey && this.config.publicKeyId && 
        this.config.enterpriseId) {
      
      try {
        // Create private key file for Box SDK (following reference implementation)
        const privateKeyPath = path.join(__dirname, 'box-private-key.pem');
        
        let privateKey = this.config.privateKey;
        if (privateKey.includes('\\n')) {
          privateKey = privateKey.replace(/\\n/g, '\n');
        }
        
        fs.writeFileSync(privateKeyPath, privateKey, { mode: 0o600 });
        
        // Initialize Box SDK following reference pattern
        this.sdk = new BoxSDK({
          clientID: this.config.clientId,
          clientSecret: this.config.clientSecret,
          appAuth: {
            keyID: this.config.publicKeyId,
            privateKey: fs.readFileSync(privateKeyPath),
            passphrase: this.config.passphrase || undefined
          }
        });
        
        // Create enterprise client
        this.client = this.sdk.getAppAuthClient('enterprise', this.config.enterpriseId);
        
        // Clean up private key file
        fs.unlinkSync(privateKeyPath);
        
        console.log('Box Node SDK initialized successfully');
      } catch (error) {
        console.error('Box Node SDK initialization failed:', error);
        this.sdk = null;
        this.client = null;
      }
    }
  }

  private determineAuthType(): void {
    if (this.config.accessToken) {
      this.authType = 'token';
    } else if (this.client && this.sdk) {
      this.authType = 'sdk';
    } else if (this.config.clientId && this.config.clientSecret && 
               this.config.privateKey && this.config.publicKeyId && 
               this.config.enterpriseId) {
      this.authType = 'jwt';
    } else {
      this.authType = 'none';
    }
  }

  private async getAccessToken(): Promise<string> {
    if (this.authType === 'token' && this.config.accessToken) {
      return this.config.accessToken;
    }

    if (this.authType === 'sdk') {
      // Box Node SDK handles authentication internally
      throw new Error('SDK authentication does not use access tokens directly');
    }

    if (this.authType === 'jwt') {
      return await this.generateJWTAccessToken();
    }

    throw new Error('No valid Box authentication method available');
  }

  private async generateJWTAccessToken(): Promise<string> {
    const now = Math.floor(Date.now() / 1000);
    const jti = crypto.randomBytes(16).toString('hex');
    
    const claims = {
      iss: this.config.clientId,
      sub: this.config.enterpriseId,
      box_sub_type: 'enterprise',
      aud: 'https://api.box.com/oauth2/token',
      jti: jti,
      exp: now + 60,
      iat: now
    };

    const header = {
      alg: 'RS256',
      typ: 'JWT',
      kid: this.config.publicKeyId
    };

    try {
      let privateKey = this.config.privateKey;
      if (privateKey.includes('\\n')) {
        privateKey = privateKey.replace(/\\n/g, '\n');
      }

      const token = jwt.sign(claims, privateKey, {
        algorithm: 'RS256',
        header: header,
        ...(this.config.passphrase && { passphrase: this.config.passphrase })
      });

      const response = await fetch('https://api.box.com/oauth2/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
          assertion: token,
          client_id: this.config.clientId,
          client_secret: this.config.clientSecret
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`JWT authentication failed: ${response.status} - ${errorText}`);
      }

      const tokens = await response.json();
      return tokens.access_token;
    } catch (error) {
      console.error('JWT token generation failed:', error);
      throw error;
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      if (this.authType === 'sdk' && this.client) {
        // Use Box Node SDK client
        const userInfo = await this.client.users.get('me');
        console.log(`Box connection successful (${this.authType}), user:`, userInfo.name);
        return true;
      } else if (this.authType === 'token') {
        // Use access token
        const accessToken = await this.getAccessToken();
        
        const response = await fetch('https://api.box.com/2.0/users/me', {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        });

        if (response.ok) {
          const userInfo = await response.json();
          console.log(`Box connection successful (${this.authType}), user:`, userInfo.name);
          return true;
        } else {
          console.log(`Box connection failed: ${response.status}`);
          return false;
        }
      } else {
        console.log('No valid Box authentication available');
        return false;
      }
    } catch (error) {
      console.error('Box connection test failed:', error);
      return false;
    }
  }

  async uploadFile(fileName: string, fileBuffer: Buffer, parentFolderId: string = '0'): Promise<BoxUploadResult> {
    try {
      if (this.authType === 'sdk' && this.client) {
        // Use Box Node SDK client
        const uploadResult = await this.client.files.uploadFile(parentFolderId, fileName, fileBuffer);
        const shareableLink = await this.createShareableLink(uploadResult.id, 'file');
        
        console.log(`File uploaded successfully via SDK: ${fileName}`);
        return {
          id: uploadResult.id,
          name: uploadResult.name,
          size: uploadResult.size,
          download_url: shareableLink
        };
      } else if (this.authType === 'token') {
        // Use access token with fetch API
        const accessToken = await this.getAccessToken();
        
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
        const file = result.entries[0];
        
        const shareableLink = await this.createShareableLink(file.id, 'file');
        
        console.log(`File uploaded successfully via token: ${fileName}`);
        return {
          id: file.id,
          name: file.name,
          size: file.size,
          download_url: shareableLink
        };
      } else {
        throw new Error('No valid Box authentication available for upload');
      }
    } catch (error) {
      console.error('File upload failed:', error);
      throw error;
    }
  }

  async createFolder(folderName: string, parentId: string = '0'): Promise<BoxFolderResult> {
    try {
      if (this.authType === 'sdk' && this.client) {
        // Use Box Node SDK client
        try {
          const folder = await this.client.folders.create(parentId, folderName);
          console.log(`Folder created successfully via SDK: ${folderName}`);
          return { id: folder.id, name: folder.name };
        } catch (error: any) {
          if (error.statusCode === 409) {
            const existingFolder = await this.findExistingFolder(folderName, parentId);
            if (existingFolder) {
              return { id: existingFolder.id, name: existingFolder.name };
            }
          }
          throw error;
        }
      } else if (this.authType === 'token') {
        // Use access token with fetch API
        const accessToken = await this.getAccessToken();
        
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
            const existingFolder = await this.findExistingFolder(folderName, parentId);
            if (existingFolder) {
              return { id: existingFolder.id, name: existingFolder.name };
            }
          }
          const errorText = await response.text();
          throw new Error(`Folder creation failed: ${response.status} - ${errorText}`);
        }

        const folder = await response.json();
        console.log(`Folder created successfully via token: ${folderName}`);
        return { id: folder.id, name: folder.name };
      } else {
        throw new Error('No valid Box authentication available for folder creation');
      }
    } catch (error) {
      console.error('Folder creation failed:', error);
      throw error;
    }
  }

  private async findExistingFolder(folderName: string, parentId: string): Promise<any> {
    try {
      if (this.authType === 'sdk' && this.client) {
        const items = await this.client.folders.getItems(parentId, {
          fields: 'id,name,type'
        });
        return items.entries.find((item: any) => 
          item.type === 'folder' && item.name === folderName
        );
      } else if (this.authType === 'token') {
        const accessToken = await this.getAccessToken();
        
        const response = await fetch(`https://api.box.com/2.0/folders/${parentId}/items`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        });

        if (!response.ok) {
          return null;
        }

        const data = await response.json();
        return data.entries.find((item: any) => 
          item.type === 'folder' && item.name === folderName
        );
      }
      return null;
    } catch (error) {
      console.error('Error finding existing folder:', error);
      return null;
    }
  }

  async createProofVaultFolder(startupName: string): Promise<BoxFolderResult> {
    const folderName = `ProofVault_${startupName.replace(/[^a-zA-Z0-9_-]/g, '_')}`;
    return await this.createFolder(folderName);
  }

  private async createShareableLink(itemId: string, itemType: 'file' | 'folder' = 'file'): Promise<string> {
    try {
      if (this.authType === 'sdk' && this.client) {
        const updateData = {
          shared_link: {
            access: 'open'
          }
        };

        if (itemType === 'file') {
          const result = await this.client.files.update(itemId, updateData);
          return result.shared_link?.url || `https://app.box.com/file/${itemId}`;
        } else {
          const result = await this.client.folders.update(itemId, updateData);
          return result.shared_link?.url || `https://app.box.com/folder/${itemId}`;
        }
      } else if (this.authType === 'token') {
        const accessToken = await this.getAccessToken();
        
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
        return result.shared_link.url;
      } else {
        throw new Error('No valid Box authentication available for link creation');
      }
    } catch (error) {
      console.error('Failed to create shareable link:', error);
      throw error;
    }
  }

  getAuthStatus(): { type: string; available: boolean } {
    return {
      type: this.authType,
      available: this.authType !== 'none'
    };
  }
}

export const boxService = new BoxService();
export { BoxService };