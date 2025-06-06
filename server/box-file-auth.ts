import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class BoxFileAuth {
  private clientId: string;
  private clientSecret: string;
  private privateKeyPath: string;
  private publicKeyId: string;
  private enterpriseId: string;
  private passphrase: string;
  private isInitialized: boolean = false;

  constructor() {
    this.clientId = process.env.BOX_CLIENT_ID || '';
    this.clientSecret = process.env.BOX_CLIENT_SECRET || '';
    this.publicKeyId = process.env.BOX_PUBLIC_KEY_ID || '';
    this.enterpriseId = process.env.BOX_ENTERPRISE_ID || '';
    this.passphrase = process.env.BOX_PASSPHRASE || '';
    this.privateKeyPath = path.join(__dirname, 'box-private-key.pem');
    
    console.log('Box File Auth Service configuration:');
    console.log('- Client ID:', this.clientId ? `${this.clientId.substring(0, 8)}...` : 'NOT SET');
    console.log('- Client Secret:', this.clientSecret ? 'SET' : 'NOT SET');
    console.log('- Public Key ID:', this.publicKeyId ? 'SET' : 'NOT SET');
    console.log('- Enterprise ID:', this.enterpriseId ? `${this.enterpriseId.substring(0, 8)}...` : 'NOT SET');
    console.log('- Passphrase:', this.passphrase ? 'SET' : 'NOT SET');
    console.log('- Private Key Path:', this.privateKeyPath);
    
    this.initializePrivateKeyFile();
  }

  private initializePrivateKeyFile(): void {
    const privateKeyContent = process.env.BOX_PRIVATE_KEY || '';
    
    if (!privateKeyContent) {
      console.error('BOX_PRIVATE_KEY environment variable not set');
      return;
    }

    try {
      // Format private key properly
      let formattedKey = privateKeyContent.trim();
      if (formattedKey.includes('\\n')) {
        formattedKey = formattedKey.replace(/\\n/g, '\n');
      }

      // Write private key to file
      fs.writeFileSync(this.privateKeyPath, formattedKey, { mode: 0o600 });
      console.log('Private key written to file successfully');

      // Verify file exists and is readable
      if (fs.existsSync(this.privateKeyPath)) {
        const keyContent = fs.readFileSync(this.privateKeyPath, 'utf8');
        console.log('Private key file verification:');
        console.log('- File exists:', true);
        console.log('- File size:', keyContent.length);
        console.log('- First 50 chars:', keyContent.substring(0, 50));
        
        if (this.clientId && this.clientSecret && this.publicKeyId && this.enterpriseId) {
          this.isInitialized = true;
          console.log('Box File Auth Service initialized successfully');
        }
      }
    } catch (error) {
      console.error('Failed to initialize private key file:', error);
    }
  }

  private generateJWT(): string {
    if (!this.isInitialized) {
      throw new Error('Box File Auth Service not properly configured');
    }

    if (!fs.existsSync(this.privateKeyPath)) {
      throw new Error('Private key file not found');
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
      const privateKey = fs.readFileSync(this.privateKeyPath, 'utf8');
      
      const token = jwt.sign(claims, privateKey, {
        algorithm: 'RS256',
        header: header,
        ...(this.passphrase && { passphrase: this.passphrase })
      });
      
      console.log('JWT token generated successfully using file-based private key');
      return token;
    } catch (error) {
      console.error('JWT generation failed with file-based approach:', error);
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
      console.log(`Box File Auth response: ${response.status}`);

      if (!response.ok) {
        console.error('File-based JWT authentication failed:', responseText);
        throw new Error(`File-based JWT authentication failed: ${response.status} - ${responseText}`);
      }

      const tokens = JSON.parse(responseText);
      console.log('Box File Auth authentication successful');
      
      return tokens.access_token;
    } catch (error) {
      console.error('File-based JWT authentication error:', error);
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
        console.log('Box File Auth connection successful, user:', userInfo.name);
        return true;
      } else {
        console.log(`Box File Auth connection failed: ${response.status}`);
        return false;
      }
    } catch (error) {
      console.error('Box File Auth connection test failed:', error);
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
      console.log(`File uploaded successfully via File Auth: ${fileName}`);
      return result.entries[0];
    } catch (error) {
      console.error('Box File Auth upload failed:', error);
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
      console.log(`Folder created successfully via File Auth: ${folderName}`);
      return folder.id;
    } catch (error) {
      console.error('Box File Auth folder creation failed:', error);
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
      console.error('Error finding existing folder via File Auth:', error);
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
      console.log(`Shareable link created via File Auth for ${itemType}: ${itemId}`);
      return result.shared_link.url;
    } catch (error) {
      console.error('Failed to create shareable link via File Auth:', error);
      throw error;
    }
  }

  // Cleanup method to remove private key file
  cleanup(): void {
    try {
      if (fs.existsSync(this.privateKeyPath)) {
        fs.unlinkSync(this.privateKeyPath);
        console.log('Private key file cleaned up');
      }
    } catch (error) {
      console.error('Failed to cleanup private key file:', error);
    }
  }
}

export const boxFileAuth = new BoxFileAuth();

// Cleanup on process exit
process.on('exit', () => {
  boxFileAuth.cleanup();
});

process.on('SIGINT', () => {
  boxFileAuth.cleanup();
  process.exit();
});

process.on('SIGTERM', () => {
  boxFileAuth.cleanup();
  process.exit();
});