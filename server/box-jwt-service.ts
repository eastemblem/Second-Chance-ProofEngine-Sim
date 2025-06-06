import jwt from 'jsonwebtoken';
import { Request } from 'express';
import multer from 'multer';
import BoxSDK from 'box-node-sdk';

export class BoxJWTService {
  private sdk: any;
  private client: any;
  private isInitialized: boolean = false;

  constructor() {
    const clientId = process.env.BOX_CLIENT_ID || '';
    const clientSecret = process.env.BOX_CLIENT_SECRET || '';
    const privateKeyBase64 = process.env.BOX_PRIVATE_KEY_BASE64 || '';
    const publicKeyId = process.env.BOX_PUBLIC_KEY_ID || '';
    const passphrase = process.env.BOX_PASSPHRASE || '';
    
    console.log('Box Node SDK Service configuration:');
    console.log('- Client ID:', clientId ? `${clientId.substring(0, 8)}...` : 'NOT SET');
    console.log('- Client Secret:', clientSecret ? 'SET' : 'NOT SET');
    console.log('- Private Key Base64:', privateKeyBase64 ? 'SET' : 'NOT SET');
    console.log('- Public Key ID:', publicKeyId ? 'SET' : 'NOT SET');
    console.log('- Passphrase:', passphrase ? 'SET' : 'NOT SET');
    
    if (clientId && clientSecret && privateKeyBase64 && publicKeyId) {
      try {
        // Convert Base64 private key
        const privateKey = Buffer.from(privateKeyBase64, 'base64').toString('utf8');
        
        // Box SDK Configuration
        this.sdk = new BoxSDK({
          clientID: clientId,
          clientSecret: clientSecret,
          appAuth: {
            keyID: publicKeyId,
            privateKey: privateKey,
            passphrase: passphrase || undefined
          }
        });
        
        this.isInitialized = true;
        console.log('Box Node SDK Service initialized successfully');
      } catch (error) {
        console.error('Box Node SDK initialization failed:', error);
      }
    }
  }

  async getClient(): Promise<any> {
    if (!this.isInitialized) {
      throw new Error('Box Node SDK Service not properly configured');
    }

    if (this.client) {
      return this.client;
    }

    try {
      console.log('Creating Box service account client...');
      this.client = this.sdk.getAppAuthClient('enterprise');
      console.log('Box service account client created successfully');
      return this.client;
    } catch (error) {
      console.error('Failed to create Box client:', error);
      throw error;
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      const client = await this.getClient();
      const userInfo = await client.users.get(client.CURRENT_USER_ID);
      console.log('Box Node SDK connection successful');
      return true;
    } catch (error) {
      console.error('Box Node SDK connection test failed:', error);
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
      
      const result = await client.files.uploadFile(parentFolderId, fileName, fileBuffer);
      console.log(`File uploaded successfully via Box Node SDK: ${fileName}`);
      return result;
    } catch (error) {
      console.error('Box Node SDK upload failed:', error);
      throw error;
    }
  }

  async createFolder(folderName: string, parentId: string = '0'): Promise<string> {
    try {
      const client = await this.getClient();
      
      try {
        const folder = await client.folders.create(parentId, folderName);
        console.log(`Folder created successfully via Box Node SDK: ${folderName}`);
        return folder.id;
      } catch (error: any) {
        if (error.statusCode === 409) {
          // Folder already exists, find it
          const existingFolder = await this.findExistingFolder(folderName, parentId);
          if (existingFolder) {
            return existingFolder.id;
          }
        }
        throw error;
      }
    } catch (error) {
      console.error('Box Node SDK folder creation failed:', error);
      throw error;
    }
  }

  async findExistingFolder(folderName: string, parentId: string): Promise<any> {
    try {
      const client = await this.getClient();
      
      const items = await client.folders.getItems(parentId, {
        fields: 'id,name,type'
      });

      const existingFolder = items.entries.find((item: any) => 
        item.type === 'folder' && item.name === folderName
      );

      return existingFolder || null;
    } catch (error) {
      console.error('Error finding existing folder via Box Node SDK:', error);
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
      
      let result;
      if (itemType === 'folder') {
        result = await client.folders.update(itemId, {
          shared_link: {
            access: 'open'
          }
        });
      } else {
        result = await client.files.update(itemId, {
          shared_link: {
            access: 'open'
          }
        });
      }

      console.log(`Shareable link created via Box Node SDK for ${itemType}: ${itemId}`);
      return result.shared_link.url;
    } catch (error) {
      console.error('Failed to create shareable link via Box Node SDK:', error);
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

export const boxJWTService = new BoxJWTService();