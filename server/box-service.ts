import BoxSDK from 'box-node-sdk';
import { Request } from 'express';
import multer from 'multer';
import FormData from 'form-data';

// Box service class for handling document operations
export class BoxService {
  private clientId: string;
  private clientSecret: string;

  constructor() {
    this.clientId = process.env.BOX_CLIENT_ID!;
    this.clientSecret = process.env.BOX_CLIENT_SECRET!;
  }

  // Get default access token for testing
  getDefaultAccessToken(): string {
    return process.env.BOX_ACCESS_TOKEN || '';
  }

  // Test Box connection by validating credentials
  async testConnection(): Promise<boolean> {
    try {
      // Validate that we have the required credentials
      if (!this.clientId || !this.clientSecret) {
        console.error('Missing Box credentials');
        return false;
      }
      
      console.log('Box credentials validated successfully');
      return true;
    } catch (error) {
      console.error('Box connection failed:', error);
      return false;
    }
  }

  // Get OAuth URL for user authentication
  getAuthURL(): string {
    const redirectUri = this.getRedirectUri();
    return `https://account.box.com/api/oauth2/authorize?response_type=code&client_id=${this.clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=root_readwrite`;
  }

  // Get the redirect URI for Box OAuth
  getRedirectUri(): string {
    // Use the Replit domain if available, otherwise fallback to localhost
    const domain = process.env.REPLIT_DEV_DOMAIN;
    if (domain) {
      return `https://${domain}/api/box/callback`;
    }
    return 'http://localhost:5000/api/box/callback';
  }

  // Exchange authorization code for access token
  async getTokensFromCode(code: string): Promise<any> {
    try {
      const redirectUri = this.getRedirectUri();
      
      const response = await fetch('https://api.box.com/oauth2/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code: code,
          client_id: this.clientId,
          client_secret: this.clientSecret,
          redirect_uri: redirectUri,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const tokens = await response.json();
      return tokens;
    } catch (error) {
      console.error('Error getting tokens:', error);
      throw new Error('Failed to get access tokens');
    }
  }

  // Upload file using authenticated Box API
  async uploadFile(
    accessToken: string,
    fileName: string, 
    fileBuffer: Buffer,
    folderId: string = '0'
  ): Promise<any> {
    try {
      const formData = new FormData();
      
      formData.append('attributes', JSON.stringify({
        name: fileName,
        parent: { id: folderId }
      }));
      formData.append('file', fileBuffer, fileName);

      const response = await fetch('https://upload.box.com/api/2.0/files/content', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          ...(formData.getHeaders ? formData.getHeaders() : {})
        },
        body: formData as any,
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

  // Create folder using authenticated Box API
  async createFolder(accessToken: string, folderName: string, parentId: string = '0'): Promise<string> {
    try {
      const response = await fetch('https://api.box.com/2.0/folders', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: folderName,
          parent: { id: parentId }
        }),
      });

      if (!response.ok) {
        throw new Error(`Folder creation failed: ${response.status}`);
      }

      const folder = await response.json();
      return folder.id;
    } catch (error) {
      console.error('Error creating folder:', error);
      throw new Error('Failed to create folder');
    }
  }

  // List folder contents
  async listFolderContents(accessToken: string, folderId: string = '0'): Promise<any[]> {
    try {
      const response = await fetch(`https://api.box.com/2.0/folders/${folderId}/items`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to list folder contents: ${response.status}`);
      }

      const result = await response.json();
      return result.entries;
    } catch (error) {
      console.error('Error listing folder contents:', error);
      throw new Error('Failed to list folder contents');
    }
  }
}

// Multer configuration for file uploads
export const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    // Allow common document types
    // Allow most common business document types
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'text/plain',
      'text/csv',
      'application/json',
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/svg+xml',
      'application/zip',
      'application/x-zip-compressed'
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      console.log(`Rejected file type: ${file.mimetype}`);
      cb(new Error(`Invalid file type: ${file.mimetype}`));
    }
  }
});

// Create singleton instance
export const boxService = new BoxService();