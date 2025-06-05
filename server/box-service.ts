import BoxSDK from 'box-node-sdk';
import { Readable } from 'stream';
import FormData from 'form-data';
import multer from 'multer';
import { Request } from 'express';

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

  async testConnection(): Promise<boolean> {
    try {
      const accessToken = this.getDefaultAccessToken();
      if (!accessToken) return false;

      const response = await fetch('https://api.box.com/2.0/users/me', {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      return response.ok;
    } catch (error) {
      console.error('Box connection test failed:', error);
      return false;
    }
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
    try {
      console.log(`Uploading file ${fileName} to folder ${folderId} using direct API`);
      
      const formData = new FormData();
      
      formData.append('attributes', JSON.stringify({
        name: fileName,
        parent: { id: folderId }
      }));
      
      formData.append('file', fileBuffer, {
        filename: fileName,
        contentType: 'application/octet-stream'
      });

      const response = await fetch('https://upload.box.com/api/2.0/files/content', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          ...formData.getHeaders()
        },
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Box upload error ${response.status}:`, errorText);
        throw new Error(`Upload failed: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log('Box upload successful:', result);
      
      return {
        id: result.entries[0].id,
        name: result.entries[0].name,
        size: result.entries[0].size,
        download_url: result.entries[0].download_url || null
      };
    } catch (error) {
      console.error('Error uploading file to Box:', error);
      throw error;
    }
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