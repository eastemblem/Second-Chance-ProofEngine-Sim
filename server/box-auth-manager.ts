import { boxJWTService } from './box-jwt-service';
import { boxManualAuth } from './box-manual-auth';
import { boxFileAuth } from './box-file-auth';

export class BoxAuthManager {
  private primaryService: any = null;
  private isInitialized: boolean = false;

  constructor() {
    this.initializePrimaryService();
  }

  private async initializePrimaryService(): Promise<void> {
    console.log('Initializing Box authentication manager...');
    
    // Check if we have a developer token first
    const accessToken = process.env.BOX_ACCESS_TOKEN;
    if (accessToken) {
      console.log('Using Box developer token for authentication');
      this.primaryService = new BoxDeveloperAuth(accessToken);
      this.isInitialized = true;
      return;
    }

    // Try file-based auth first (most reliable for JWT)
    try {
      const connected = await boxFileAuth.testConnection();
      if (connected) {
        console.log('Using Box file-based authentication');
        this.primaryService = boxFileAuth;
        this.isInitialized = true;
        return;
      }
    } catch (error) {
      console.log('File-based auth failed:', error);
    }

    // Try manual auth as fallback
    try {
      const connected = await boxManualAuth.testConnection();
      if (connected) {
        console.log('Using Box manual authentication');
        this.primaryService = boxManualAuth;
        this.isInitialized = true;
        return;
      }
    } catch (error) {
      console.log('Manual auth failed:', error);
    }

    // Try Box Node SDK as last fallback
    try {
      const connected = await boxJWTService.testConnection();
      if (connected) {
        console.log('Using Box Node SDK authentication');
        this.primaryService = boxJWTService;
        this.isInitialized = true;
        return;
      }
    } catch (error) {
      console.log('Box Node SDK auth failed:', error);
    }

    console.error('All Box authentication methods failed');
  }

  async getWorkingService(): Promise<any> {
    if (!this.isInitialized) {
      await this.initializePrimaryService();
    }
    
    if (!this.primaryService) {
      throw new Error('No working Box authentication service available');
    }
    
    return this.primaryService;
  }

  async testConnection(): Promise<boolean> {
    try {
      const service = await this.getWorkingService();
      return await service.testConnection();
    } catch (error) {
      console.error('Box connection test failed:', error);
      return false;
    }
  }

  async uploadFile(fileName: string, fileBuffer: Buffer, parentFolderId: string = '0'): Promise<any> {
    const service = await this.getWorkingService();
    return await service.uploadFile(fileName, fileBuffer, parentFolderId);
  }

  async createFolder(folderName: string, parentId: string = '0'): Promise<string> {
    const service = await this.getWorkingService();
    return await service.createFolder(folderName, parentId);
  }

  async createSessionFolder(startupName: string): Promise<string> {
    const service = await this.getWorkingService();
    return await service.createSessionFolder(startupName);
  }

  async createShareableLink(itemId: string, itemType: 'file' | 'folder' = 'file'): Promise<string> {
    const service = await this.getWorkingService();
    return await service.createShareableLink(itemId, itemType);
  }
}

// Simple developer token authentication for immediate testing
class BoxDeveloperAuth {
  private accessToken: string;

  constructor(accessToken: string) {
    this.accessToken = accessToken;
    console.log('Box Developer Auth initialized with token');
  }

  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch('https://api.box.com/2.0/users/me', {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`
        }
      });

      if (response.ok) {
        const userInfo = await response.json();
        console.log('Box Developer Auth connection successful, user:', userInfo.name);
        return true;
      } else {
        console.log(`Box Developer Auth connection failed: ${response.status}`);
        return false;
      }
    } catch (error) {
      console.error('Box Developer Auth connection test failed:', error);
      return false;
    }
  }

  async uploadFile(fileName: string, fileBuffer: Buffer, parentFolderId: string = '0'): Promise<any> {
    try {
      const formData = new FormData();
      formData.append('attributes', JSON.stringify({
        name: fileName,
        parent: { id: parentFolderId }
      }));
      formData.append('file', new Blob([fileBuffer]), fileName);

      const response = await fetch('https://upload.box.com/api/2.0/files/content', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`
        },
        body: formData
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Upload failed: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log(`File uploaded successfully via Developer Auth: ${fileName}`);
      return result.entries[0];
    } catch (error) {
      console.error('Box Developer Auth upload failed:', error);
      throw error;
    }
  }

  async createFolder(folderName: string, parentId: string = '0'): Promise<string> {
    try {
      const response = await fetch('https://api.box.com/2.0/folders', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
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
      console.log(`Folder created successfully via Developer Auth: ${folderName}`);
      return folder.id;
    } catch (error) {
      console.error('Box Developer Auth folder creation failed:', error);
      throw error;
    }
  }

  async findExistingFolder(folderName: string, parentId: string): Promise<any> {
    try {
      const response = await fetch(`https://api.box.com/2.0/folders/${parentId}/items`, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`
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
      console.error('Error finding existing folder via Developer Auth:', error);
      return null;
    }
  }

  async createSessionFolder(startupName: string): Promise<string> {
    const folderName = `ProofVault_${startupName.replace(/[^a-zA-Z0-9_-]/g, '_')}`;
    return await this.createFolder(folderName);
  }

  async createShareableLink(itemId: string, itemType: 'file' | 'folder' = 'file'): Promise<string> {
    try {
      const endpoint = itemType === 'folder' 
        ? `https://api.box.com/2.0/folders/${itemId}`
        : `https://api.box.com/2.0/files/${itemId}`;

      const response = await fetch(endpoint, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
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
      console.log(`Shareable link created via Developer Auth for ${itemType}: ${itemId}`);
      return result.shared_link.url;
    } catch (error) {
      console.error('Failed to create shareable link via Developer Auth:', error);
      throw error;
    }
  }
}

export const boxAuthManager = new BoxAuthManager();