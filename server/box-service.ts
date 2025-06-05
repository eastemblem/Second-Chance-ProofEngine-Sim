import { Request } from 'express';
import multer from 'multer';

export class BoxService {
  private clientId: string;
  private clientSecret: string;

  constructor() {
    this.clientId = process.env.BOX_CLIENT_ID || '';
    this.clientSecret = process.env.BOX_CLIENT_SECRET || '';
    
    if (!this.clientId || !this.clientSecret) {
      console.warn('Box credentials not configured. Some functionality may be limited.');
    }
  }

  getDefaultAccessToken(): string {
    return process.env.BOX_ACCESS_TOKEN || '';
  }

  async testConnection(accessToken?: string): Promise<boolean> {
    try {
      const token = accessToken || this.getDefaultAccessToken();
      if (!token) {
        console.log('No Box access token provided');
        return false;
      }

      const response = await fetch('https://api.box.com/2.0/users/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        console.log('Box connection successful');
        return true;
      } else {
        console.log(`Box connection failed: ${response.status}`);
        return false;
      }
    } catch (error) {
      console.error('Box connection test failed:', error);
      return false;
    }
  }

  getAuthURL(): string {
    const state = Math.random().toString(36).substring(2, 15);
    const redirectUri = this.getRedirectUri();
    return `https://account.box.com/api/oauth2/authorize?client_id=${this.clientId}&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}`;
  }

  getRedirectUri(): string {
    const baseUrl = process.env.REPLIT_DEV_DOMAIN 
      ? `https://${process.env.REPLIT_DEV_DOMAIN}` 
      : 'http://localhost:5000';
    return `${baseUrl}/api/box/callback`;
  }

  async exchangeCodeForTokens(code: string): Promise<any> {
    try {
      console.log('Exchanging authorization code for tokens...');
      
      const response = await fetch('https://api.box.com/oauth2/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code,
          client_id: this.clientId,
          client_secret: this.clientSecret,
          redirect_uri: this.getRedirectUri(),
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.log(`Token exchange failed: ${response.status} - ${errorText}`);
        throw new Error(`Token exchange failed: ${response.status} - ${errorText}`);
      }

      const tokens = await response.json();
      console.log('Token exchange successful');
      return tokens;
    } catch (error) {
      console.error('Token exchange error:', error);
      throw error;
    }
  }

  async refreshAccessToken(refreshToken: string): Promise<any> {
    try {
      console.log('Refreshing access token...');
      
      const response = await fetch('https://api.box.com/oauth2/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: refreshToken,
          client_id: this.clientId,
          client_secret: this.clientSecret,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.log(`Token refresh failed: ${response.status} - ${errorText}`);
        throw new Error(`Token refresh failed: ${response.status} - ${errorText}`);
      }

      const tokens = await response.json();
      console.log('Token refresh successful');
      return tokens;
    } catch (error) {
      console.error('Token refresh error:', error);
      throw error;
    }
  }

  async getStoredTokens(): Promise<any> {
    try {
      // Check if we have stored tokens in environment or database
      const storedAccessToken = process.env.BOX_STORED_ACCESS_TOKEN;
      const storedRefreshToken = process.env.BOX_STORED_REFRESH_TOKEN;
      
      if (storedAccessToken && storedRefreshToken) {
        return {
          access_token: storedAccessToken,
          refresh_token: storedRefreshToken
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error getting stored tokens:', error);
      return null;
    }
  }

  async getValidAccessToken(): Promise<string> {
    // Always use the provided static token for server-side operations
    const staticToken = this.getDefaultAccessToken();
    if (staticToken) {
      console.log('Using provided Box access token');
      return staticToken;
    }

    throw new Error('Box access token required. Please provide BOX_ACCESS_TOKEN in environment variables.');
  }

  async uploadFile(
    accessToken: string,
    fileName: string,
    fileBuffer: Buffer,
    folderId: string = '0'
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      console.log(`Uploading file ${fileName} to folder ${folderId} using Box API`);
      
      const boundary = '----formdata-replit-' + Math.random().toString(36);
      const formData = [];
      
      // Add attributes
      formData.push(`--${boundary}\r\n`);
      formData.push(`Content-Disposition: form-data; name="attributes"\r\n\r\n`);
      formData.push(JSON.stringify({
        name: fileName,
        parent: { id: folderId }
      }));
      formData.push(`\r\n`);
      
      // Add file
      formData.push(`--${boundary}\r\n`);
      formData.push(`Content-Disposition: form-data; name="file"; filename="${fileName}"\r\n`);
      formData.push(`Content-Type: application/octet-stream\r\n\r\n`);
      
      const formDataString = formData.join('');
      const endBoundary = `\r\n--${boundary}--\r\n`;
      
      const postData = Buffer.concat([
        Buffer.from(formDataString, 'utf8'),
        fileBuffer,
        Buffer.from(endBoundary, 'utf8')
      ]);

      const options = {
        method: 'POST',
        hostname: 'upload.box.com',
        path: '/api/2.0/files/content',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': `multipart/form-data; boundary=${boundary}`,
          'Content-Length': postData.length
        }
      };

      console.log('Submitting multipart form to Box API');
      
      const https = require('https');
      const request = https.request(options, (response: any) => {
        let responseData = '';
        
        response.on('data', (chunk: any) => {
          responseData += chunk;
        });

        response.on('end', () => {
          console.log(`Box API response status: ${response.statusCode}`);
          
          if (response.statusCode !== 201) {
            console.error(`Box upload error ${response.statusCode}:`, responseData);
            reject(new Error(`Upload failed: ${response.statusCode} - ${responseData}`));
            return;
          }

          try {
            const result = JSON.parse(responseData);
            console.log('Box upload successful:', result);
            
            resolve({
              id: result.entries[0].id,
              name: result.entries[0].name,
              size: result.entries[0].size,
              download_url: result.entries[0].download_url || null
            });
          } catch (parseError) {
            console.error('Error parsing Box response:', parseError);
            reject(parseError);
          }
        });

        response.on('error', (error: any) => {
          console.error('Box response error:', error);
          reject(error);
        });
      });

      request.on('error', (error: any) => {
        console.error('Box request error:', error);
        reject(error);
      });

      request.write(postData);
      request.end();
    });
  }

  async createSessionFolder(accessToken: string, startupName: string): Promise<string> {
    const folderName = `ProofVault_${startupName.replace(/[^a-zA-Z0-9_-]/g, '_')}`;
    return this.createFolder(accessToken, folderName, '0');
  }

  async createFolder(accessToken: string, folderName: string, parentId: string = '0'): Promise<string> {
    try {
      console.log(`Creating folder ${folderName} in parent ${parentId}`);
      
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
        const errorText = await response.text();
        console.error(`Box folder creation error ${response.status}:`, errorText);
        
        if (response.status === 409) {
          console.log(`Folder ${folderName} already exists, fetching existing folder`);
          const existingFolder = await this.findExistingFolder(accessToken, folderName, parentId);
          if (existingFolder) {
            return existingFolder.id;
          }
        }
        throw new Error(`Folder creation failed: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log('Folder created successfully:', result);
      return result.id;
    } catch (error) {
      console.error('Error creating folder in Box:', error);
      throw error;
    }
  }

  async findExistingFolder(accessToken: string, folderName: string, parentId: string): Promise<any> {
    try {
      const items = await this.listFolderContents(accessToken, parentId);
      return items.find((item: any) => item.type === 'folder' && item.name === folderName);
    } catch (error) {
      console.error('Error finding existing folder:', error);
      return null;
    }
  }

  async listFolderContents(accessToken: string, folderId: string = '0'): Promise<any[]> {
    try {
      const response = await fetch(`https://api.box.com/2.0/folders/${folderId}/items`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to list folder contents: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      return result.entries || [];
    } catch (error) {
      console.error('Error listing folder contents:', error);
      throw error;
    }
  }

  async createFolderShareableLink(accessToken: string, folderId: string): Promise<string> {
    try {
      console.log(`Creating shareable link for folder ${folderId}`);
      
      const response = await fetch(`https://api.box.com/2.0/folders/${folderId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          shared_link: {
            access: 'open',
            permissions: {
              can_download: false,
              can_preview: true
            }
          }
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Box folder share error ${response.status}:`, errorText);
        throw new Error(`Failed to create folder shareable link: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log('Folder shareable link created:', result.shared_link?.url);
      return result.shared_link?.url || '';
    } catch (error) {
      console.error('Error creating folder shareable link:', error);
      throw error;
    }
  }

  async createFileShareableLink(accessToken: string, fileId: string): Promise<string> {
    try {
      console.log(`Creating shareable link for file ${fileId}`);
      
      const response = await fetch(`https://api.box.com/2.0/files/${fileId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          shared_link: {
            access: 'company',
            permissions: {
              can_download: false,
              can_preview: true
            }
          }
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Box file share error ${response.status}:`, errorText);
        throw new Error(`Failed to create file shareable link: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log('File shareable link created:', result.shared_link?.url);
      return result.shared_link?.url || '';
    } catch (error) {
      console.error('Error creating file shareable link:', error);
      throw error;
    }
  }
}

export const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    console.log('File filter check:', file.originalname, file.mimetype);
    cb(null, true);
  }
});

export const boxService = new BoxService();