import { Request } from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';

export class BoxDevelopmentService {
  private baseDir: string;
  private isInitialized: boolean = true;

  constructor() {
    // Create development storage directory
    this.baseDir = path.join(process.cwd(), 'proof_vault');
    this.ensureDirectoryExists(this.baseDir);
    
    console.log('Box Development Service initialized');
    console.log('- Storage Directory:', this.baseDir);
    console.log('- Mode: Development (File System Storage)');
  }

  private ensureDirectoryExists(dirPath: string): void {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      // Test by creating a temporary file
      const testFile = path.join(this.baseDir, 'connection_test.txt');
      fs.writeFileSync(testFile, 'test');
      fs.unlinkSync(testFile);
      
      console.log('Box Development Service connection successful');
      return true;
    } catch (error) {
      console.error('Box Development Service connection failed:', error);
      return false;
    }
  }

  async uploadFile(
    fileName: string,
    fileBuffer: Buffer,
    parentFolderId: string = 'root'
  ): Promise<any> {
    try {
      // Ensure parent folder exists
      const folderPath = path.join(this.baseDir, parentFolderId);
      this.ensureDirectoryExists(folderPath);

      // Generate unique file ID and save file
      const fileId = `dev_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const filePath = path.join(folderPath, fileName);
      
      fs.writeFileSync(filePath, fileBuffer);
      
      console.log(`File uploaded successfully (Development): ${fileName}`);
      
      // Return Box-like response structure
      return {
        id: fileId,
        name: fileName,
        size: fileBuffer.length,
        type: 'file',
        path: filePath,
        parent: { id: parentFolderId }
      };
    } catch (error) {
      console.error('Box Development upload failed:', error);
      throw error;
    }
  }

  async createFolder(folderName: string, parentId: string = 'root'): Promise<string> {
    try {
      const parentPath = parentId === 'root' ? this.baseDir : path.join(this.baseDir, parentId);
      const folderPath = path.join(parentPath, folderName);
      
      // Check if folder already exists
      if (fs.existsSync(folderPath)) {
        const stats = fs.statSync(folderPath);
        if (stats.isDirectory()) {
          console.log(`Folder already exists (Development): ${folderName}`);
          return path.relative(this.baseDir, folderPath) || folderName;
        }
      }
      
      // Create new folder
      this.ensureDirectoryExists(folderPath);
      
      const folderId = path.relative(this.baseDir, folderPath) || folderName;
      console.log(`Folder created successfully (Development): ${folderName}`);
      
      return folderId;
    } catch (error) {
      console.error('Box Development folder creation failed:', error);
      throw error;
    }
  }

  async findExistingFolder(folderName: string, parentId: string): Promise<any> {
    try {
      const parentPath = parentId === 'root' ? this.baseDir : path.join(this.baseDir, parentId);
      const folderPath = path.join(parentPath, folderName);
      
      if (fs.existsSync(folderPath)) {
        const stats = fs.statSync(folderPath);
        if (stats.isDirectory()) {
          return {
            id: path.relative(this.baseDir, folderPath) || folderName,
            name: folderName,
            type: 'folder'
          };
        }
      }
      
      return null;
    } catch (error) {
      console.error('Error finding existing folder (Development):', error);
      return null;
    }
  }

  async createSessionFolder(startupName: string): Promise<string> {
    const folderName = `ProofVault_${startupName.replace(/[^a-zA-Z0-9_-]/g, '_')}`;
    return await this.createFolder(folderName);
  }

  async createShareableLink(itemId: string, itemType: 'file' | 'folder' = 'file'): Promise<string> {
    try {
      // Generate development shareable link
      const baseUrl = process.env.REPLIT_DOMAIN 
        ? `https://${process.env.REPLIT_DOMAIN}`
        : 'http://localhost:5000';
      
      const shareableLink = `${baseUrl}/api/box/development/share/${itemType}/${encodeURIComponent(itemId)}`;
      
      console.log(`Shareable link created (Development) for ${itemType}: ${itemId}`);
      return shareableLink;
    } catch (error) {
      console.error('Failed to create shareable link (Development):', error);
      throw error;
    }
  }

  async listFolderContents(folderId: string = 'root'): Promise<any[]> {
    try {
      const folderPath = folderId === 'root' ? this.baseDir : path.join(this.baseDir, folderId);
      
      if (!fs.existsSync(folderPath)) {
        return [];
      }
      
      const items = fs.readdirSync(folderPath);
      const contents = items.map(item => {
        const itemPath = path.join(folderPath, item);
        const stats = fs.statSync(itemPath);
        
        return {
          id: path.relative(this.baseDir, itemPath) || item,
          name: item,
          type: stats.isDirectory() ? 'folder' : 'file',
          size: stats.isFile() ? stats.size : undefined,
          modified_at: stats.mtime.toISOString()
        };
      });
      
      return contents;
    } catch (error) {
      console.error('Error listing folder contents (Development):', error);
      return [];
    }
  }

  // Serve shared files
  async serveSharedFile(itemType: string, itemId: string): Promise<{ filePath: string; fileName: string } | null> {
    try {
      const itemPath = path.join(this.baseDir, decodeURIComponent(itemId));
      
      if (!fs.existsSync(itemPath)) {
        return null;
      }
      
      const stats = fs.statSync(itemPath);
      
      if (itemType === 'file' && stats.isFile()) {
        return {
          filePath: itemPath,
          fileName: path.basename(itemPath)
        };
      } else if (itemType === 'folder' && stats.isDirectory()) {
        // For folders, return an index or zip file (simplified for demo)
        return {
          filePath: itemPath,
          fileName: path.basename(itemPath)
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error serving shared file (Development):', error);
      return null;
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

export const boxDevelopmentService = new BoxDevelopmentService();