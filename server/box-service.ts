import BoxSDK from 'box-node-sdk';
import { Request } from 'express';
import multer from 'multer';

// Initialize Box SDK with credentials
const sdk = new BoxSDK({
  clientID: process.env.BOX_CLIENT_ID!,
  clientSecret: process.env.BOX_CLIENT_SECRET!
});

// Box service class for handling document operations
export class BoxService {
  private sdk: any;

  constructor() {
    this.sdk = sdk;
  }

  // Get OAuth URL for user authentication
  getAuthURL(state?: string): string {
    return this.sdk.getAuthorizeURL({
      response_type: 'code',
      state: state || 'default'
    });
  }

  // Exchange authorization code for access token
  async getTokensFromCode(code: string): Promise<any> {
    try {
      const tokenInfo = await this.sdk.getTokensAuthorizationCodeGrant(code);
      return tokenInfo;
    } catch (error) {
      console.error('Error getting tokens:', error);
      throw new Error('Failed to get access tokens');
    }
  }

  // Create authenticated client with tokens
  getAuthenticatedClient(accessToken: string): any {
    return this.sdk.getBasicClient(accessToken);
  }

  // Test Box connection
  async testConnection(): Promise<boolean> {
    try {
      const user = await this.client.users.get('me');
      console.log('Box connection successful, user:', user.name);
      return true;
    } catch (error) {
      console.error('Box connection failed:', error);
      return false;
    }
  }

  // Create a folder for a user's documents
  async createUserFolder(userId: string, userName: string): Promise<string> {
    try {
      const folderName = `${userName}_${userId}`;
      const folder = await this.client.folders.create('0', folderName);
      return folder.id;
    } catch (error) {
      console.error('Error creating user folder:', error);
      throw new Error('Failed to create user folder');
    }
  }

  // Upload a file to Box
  async uploadFile(
    folderId: string, 
    fileName: string, 
    fileStream: any
  ): Promise<{ id: string; downloadUrl: string }> {
    try {
      const file = await this.client.files.uploadFile(
        folderId,
        fileName,
        fileStream
      );
      
      // Get download URL
      const downloadUrl = await this.client.files.getDownloadURL(file.entries[0].id);
      
      return {
        id: file.entries[0].id,
        downloadUrl
      };
    } catch (error) {
      console.error('Error uploading file to Box:', error);
      throw new Error('Failed to upload file to Box');
    }
  }

  // Get file information
  async getFileInfo(fileId: string): Promise<any> {
    try {
      return await this.client.files.get(fileId);
    } catch (error) {
      console.error('Error getting file info:', error);
      throw new Error('Failed to get file information');
    }
  }

  // Delete a file
  async deleteFile(fileId: string): Promise<boolean> {
    try {
      await this.client.files.delete(fileId);
      return true;
    } catch (error) {
      console.error('Error deleting file:', error);
      return false;
    }
  }

  // List files in a folder
  async listFolderContents(folderId: string): Promise<any[]> {
    try {
      const items = await this.client.folders.getItems(folderId);
      return items.entries;
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
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'text/plain',
      'image/jpeg',
      'image/png',
      'image/gif'
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  }
});

// Create singleton instance
export const boxService = new BoxService();