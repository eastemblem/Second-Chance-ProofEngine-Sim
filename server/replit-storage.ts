import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

interface StorageUploadResult {
  id: string;
  name: string;
  size: number;
  download_url: string;
  path: string;
}

interface StorageFolderResult {
  id: string;
  name: string;
  path: string;
}

class ReplitStorageService {
  private baseStoragePath: string;

  constructor() {
    this.baseStoragePath = path.join(process.cwd(), 'proof_vault');
    this.ensureBaseDirectory();
  }

  private ensureBaseDirectory(): void {
    if (!fs.existsSync(this.baseStoragePath)) {
      fs.mkdirSync(this.baseStoragePath, { recursive: true });
      console.log('Created ProofVault storage directory');
    }
  }

  private sanitizeName(name: string): string {
    return name.replace(/[^a-zA-Z0-9_-]/g, '_');
  }

  private generateFileId(): string {
    return crypto.randomBytes(16).toString('hex');
  }

  async testConnection(): Promise<boolean> {
    try {
      const testPath = path.join(this.baseStoragePath, '.test');
      fs.writeFileSync(testPath, 'test');
      fs.unlinkSync(testPath);
      return true;
    } catch (error) {
      console.error('Replit storage test failed:', error);
      return false;
    }
  }

  async createProofVaultFolder(startupName: string): Promise<StorageFolderResult> {
    const sanitizedName = this.sanitizeName(startupName);
    const folderName = `ProofVault_${sanitizedName}`;
    const folderPath = path.join(this.baseStoragePath, folderName);

    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
      console.log(`Created ProofVault folder: ${folderName}`);
    }

    return {
      id: folderName,
      name: folderName,
      path: folderPath
    };
  }

  async uploadFile(fileName: string, fileBuffer: Buffer, parentFolderId: string): Promise<StorageUploadResult> {
    try {
      const fileId = this.generateFileId();
      const sanitizedFileName = this.sanitizeName(path.parse(fileName).name) + path.extname(fileName);
      const uniqueFileName = `${fileId}_${sanitizedFileName}`;
      
      const parentPath = path.join(this.baseStoragePath, parentFolderId);
      if (!fs.existsSync(parentPath)) {
        throw new Error(`Parent folder does not exist: ${parentFolderId}`);
      }

      const filePath = path.join(parentPath, uniqueFileName);
      fs.writeFileSync(filePath, fileBuffer);

      const publicUrl = `/api/storage/download/${parentFolderId}/${uniqueFileName}`;

      console.log(`File uploaded successfully: ${fileName} -> ${uniqueFileName}`);
      
      return {
        id: fileId,
        name: fileName,
        size: fileBuffer.length,
        download_url: publicUrl,
        path: filePath
      };
    } catch (error) {
      console.error('File upload failed:', error);
      throw error;
    }
  }

  async getFile(folderId: string, fileName: string): Promise<Buffer | null> {
    try {
      const filePath = path.join(this.baseStoragePath, folderId, fileName);
      if (fs.existsSync(filePath)) {
        return fs.readFileSync(filePath);
      }
      return null;
    } catch (error) {
      console.error('File retrieval failed:', error);
      return null;
    }
  }

  async listFiles(folderId: string): Promise<string[]> {
    try {
      const folderPath = path.join(this.baseStoragePath, folderId);
      if (fs.existsSync(folderPath)) {
        return fs.readdirSync(folderPath);
      }
      return [];
    } catch (error) {
      console.error('File listing failed:', error);
      return [];
    }
  }

  async deleteFile(folderId: string, fileName: string): Promise<boolean> {
    try {
      const filePath = path.join(this.baseStoragePath, folderId, fileName);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`File deleted: ${fileName}`);
        return true;
      }
      return false;
    } catch (error) {
      console.error('File deletion failed:', error);
      return false;
    }
  }

  getStorageStatus(): { type: string; available: boolean; path: string } {
    return {
      type: 'replit-storage',
      available: fs.existsSync(this.baseStoragePath),
      path: this.baseStoragePath
    };
  }
}

export const replitStorageService = new ReplitStorageService();
export { ReplitStorageService };