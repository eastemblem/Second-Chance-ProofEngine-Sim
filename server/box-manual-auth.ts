import jwt from 'jsonwebtoken';
import crypto from 'crypto';

export class BoxManualAuth {
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
    this.passphrase = process.env.BOX_PASSPHRASE || '';
    
    console.log('Box Manual Auth Service configuration:');
    console.log('- Client ID:', this.clientId ? `${this.clientId.substring(0, 8)}...` : 'NOT SET');
    console.log('- Client Secret:', this.clientSecret ? 'SET' : 'NOT SET');
    console.log('- Private Key:', this.privateKey ? 'SET' : 'NOT SET');
    console.log('- Public Key ID:', this.publicKeyId ? 'SET' : 'NOT SET');
    console.log('- Enterprise ID:', this.enterpriseId ? `${this.enterpriseId.substring(0, 8)}...` : 'NOT SET');
    console.log('- Passphrase:', this.passphrase ? 'SET' : 'NOT SET');
    
    if (this.clientId && this.clientSecret && this.privateKey && this.publicKeyId && this.enterpriseId) {
      this.isInitialized = true;
      console.log('Box Manual Auth Service initialized successfully');
    }
  }

  private formatPrivateKey(key: string): string {
    let formattedKey = key.trim();
    
    // Handle escaped newlines
    if (formattedKey.includes('\\n')) {
      formattedKey = formattedKey.replace(/\\n/g, '\n');
    }
    
    return formattedKey;
  }

  private generateJWT(): string {
    if (!this.isInitialized) {
      throw new Error('Box Manual Auth Service not properly configured');
    }

    const now = Math.floor(Date.now() / 1000);
    const jti = crypto.randomBytes(16).toString('hex');
    
    const claims = {
      iss: this.clientId,
      sub: this.enterpriseId,
      box_sub_type: 'enterprise',
      aud: 'https://api.box.com/oauth2/token',
      jti: jti,
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
      
      const token = jwt.sign(claims, formattedPrivateKey, {
        algorithm: 'RS256',
        header: header,
        ...(this.passphrase && { passphrase: this.passphrase })
      });
      
      return token;
    } catch (error) {
      console.error('JWT generation failed:', error);
      throw new Error(`Failed to generate JWT token: ${error}`);
    }
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
      console.log(`Box Manual Auth response: ${response.status}`);

      if (!response.ok) {
        console.error('Manual JWT authentication failed:', responseText);
        throw new Error(`Manual JWT authentication failed: ${response.status} - ${responseText}`);
      }

      const tokens = JSON.parse(responseText);
      console.log('Box Manual Auth authentication successful');
      
      return tokens.access_token;
    } catch (error) {
      console.error('Manual JWT authentication error:', error);
      throw error;
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      const accessToken = await this.getAccessToken();
      
      const response = await fetch('https://api.box.com/2.0/users/me', {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      if (response.ok) {
        const userInfo = await response.json();
        console.log('Box Manual Auth connection successful, user:', userInfo.name);
        return true;
      } else {
        console.log(`Box Manual Auth connection failed: ${response.status}`);
        return false;
      }
    } catch (error) {
      console.error('Box Manual Auth connection test failed:', error);
      return false;
    }
  }

  async uploadFile(
    fileName: string,
    fileBuffer: Buffer,
    parentFolderId: string = '0'
  ): Promise<any> {
    try {
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
      console.log(`File uploaded successfully via Manual Auth: ${fileName}`);
      return result.entries[0];
    } catch (error) {
      console.error('Box Manual Auth upload failed:', error);
      throw error;
    }
  }

  async createFolder(folderName: string, parentId: string = '0'): Promise<string> {
    try {
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
      console.log(`Folder created successfully via Manual Auth: ${folderName}`);
      return folder.id;
    } catch (error) {
      console.error('Box Manual Auth folder creation failed:', error);
      throw error;
    }
  }

  async findExistingFolder(folderName: string, parentId: string): Promise<any> {
    try {
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
      const folder = data.entries.find((item: any) => 
        item.type === 'folder' && item.name === folderName
      );

      return folder || null;
    } catch (error) {
      console.error('Error finding existing folder via Manual Auth:', error);
      return null;
    }
  }

  async createSessionFolder(startupName: string): Promise<string> {
    const folderName = `ProofVault_${startupName.replace(/[^a-zA-Z0-9_-]/g, '_')}`;
    return await this.createFolder(folderName);
  }

  async createShareableLink(itemId: string, itemType: 'file' | 'folder' = 'file'): Promise<string> {
    try {
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
      console.log(`Shareable link created via Manual Auth for ${itemType}: ${itemId}`);
      return result.shared_link.url;
    } catch (error) {
      console.error('Failed to create shareable link via Manual Auth:', error);
      throw error;
    }
  }
}

export const boxManualAuth = new BoxManualAuth();