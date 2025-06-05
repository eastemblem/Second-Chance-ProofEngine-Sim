import BoxSDK from 'box-node-sdk';
import { Readable } from 'stream';
import FormData from 'form-data';
import multer from 'multer';
import { Request } from 'express';
import https from 'https';

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
    // Use service account or app-level access token
    return process.env.BOX_ACCESS_TOKEN || '';
  }

  async getClientCredentialsToken(): Promise<string> {
    try {
      // For enterprise applications, use client credentials grant
      const response = await fetch('https://api.box.com/oauth2/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'client_credentials',
          client_id: this.clientId,
          client_secret: this.clientSecret,
        }),
      });

      if (!response.ok) {
        throw new Error(`Client credentials auth failed: ${response.status}`);
      }

      const data = await response.json();
      return data.access_token;
    } catch (error) {
      console.error('Error getting client credentials token:', error);
      return '';
    }
  }

  async testConnection(accessToken?: string): Promise<boolean> {
    try {
      const token = accessToken || this.getDefaultAccessToken();
      if (!token) return false;

      const response = await fetch('https://api.box.com/2.0/users/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      return response.ok;
    } catch (error) {
      console.error('Box connection test failed:', error);
      return false;
    }
  }

  async refreshToken(refreshToken: string): Promise<any> {
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
      throw new Error(`Token refresh failed: ${response.status} - ${errorText}`);
    }

    return await response.json();
  }

  getAuthURL(): string {
    return `https://account.box.com/api/oauth2/authorize?client_id=${this.clientId}&response_type=code&redirect_uri=${this.getRedirectUri()}`;
  }

  getRedirectUri(): string {
    const baseUrl = process.env.REPLIT_DEV_DOMAIN 
      ? `https://${process.env.REPLIT_DEV_DOMAIN}` 
      : 'http://localhost:5000';
    return `${baseUrl}/api/box/callback`;
  }

  async getTokensFromCode(code: string): Promise<any> {
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
      throw new Error(`Token exchange failed: ${response.status} - ${errorText}`);
    }

    return response.json();
  }

  async uploadFile(
    accessToken: string,
    fileName: string, 
    fileBuffer: Buffer,
    folderId: string = '0'
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      console.log(`Uploading file ${fileName} to folder ${folderId} using Box API`);
      
      const formData = new FormData();
      
      // Add attributes as required by Box API
      formData.append('attributes', JSON.stringify({
        name: fileName,
        parent: { id: folderId }
      }));
      
      // Add file buffer directly
      formData.append('file', fileBuffer, {
        filename: fileName,
        contentType: 'application/octet-stream'
      });

      console.log('Submitting multipart form to Box API');

      // Submit the form using the form-data's submit method
      formData.submit({
        protocol: 'https:',
        host: 'upload.box.com',
        path: '/api/2.0/files/content',
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      }, (err, response) => {
        if (err) {
          console.error('Box upload submission error:', err);
          reject(err);
          return;
        }

        let responseData = '';
        response.on('data', (chunk) => {
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

        response.on('error', (error) => {
          console.error('Box response error:', error);
          reject(error);
        });
      });
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
        
        if (response.status === 409) {
          console.log(`Folder ${folderName} already exists, fetching existing folder`);
          const folders = await this.listFolderContents(accessToken, parentId);
          const existingFolder = folders.find(item => 
            item.type === 'folder' && item.name === folderName
          );
          
          if (existingFolder) {
            return existingFolder.id;
          }
        }
        
        console.error(`Box folder creation error ${response.status}:`, errorText);
        throw new Error(`Folder creation failed: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log('Box folder created successfully:', result);
      return result.id;
    } catch (error) {
      console.error('Error creating folder in Box:', error);
      throw error;
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