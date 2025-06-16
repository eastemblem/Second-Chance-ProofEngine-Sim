import fetch from 'node-fetch';
import FormData from 'form-data';

interface FolderStructureResponse {
  id: string;
  url: string;
  folders: {
    '0_Overview': string;
    '1_Problem_Proof': string;
    '2_Solution_Proof': string;
    '3_Demand_Proof': string;
    '4_Credibility_Proof': string;
    '5_Commercial_Proof': string;
    '6_Investor_Pack': string;
  };
}

interface FileUploadResponse {
  id: string;
  name: string;
  url?: string;
  download_url?: string;
}

interface PitchDeckScoreResponse {
  score?: number;
  analysis?: any;
  feedback?: string;
  recommendations?: string[];
}

class EastEmblemAPI {
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.EASTEMBLEM_API_BASE_URL || '';
    if (!this.baseUrl) {
      console.warn('EASTEMBLEM_API_BASE_URL not configured');
    }
  }

  private getEndpoint(path: string): string {
    return `${this.baseUrl}/webhook${path}`;
  }

  async createFolderStructure(folderName: string): Promise<FolderStructureResponse> {
    try {
      const formData = new FormData();
      formData.append('folderName', folderName);

      console.log(`Creating folder structure for: ${folderName}`);
      console.log(`API endpoint: ${this.getEndpoint('/vault/folder/create-structure')}`);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      const response = await fetch(this.getEndpoint('/vault/folder/create-structure'), {
        method: 'POST',
        body: formData,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API request failed: ${response.status} - ${errorText}`);
      }

      const result = await response.json() as FolderStructureResponse;
      console.log('Folder structure created successfully:', result);
      
      return result;
    } catch (error) {
      console.error('Error creating folder structure:', error);
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error('EastEmblem API timeout - please check service availability');
        }
        throw new Error(`EastEmblem API error: ${error.message}`);
      }
      
      throw error;
    }
  }

  async uploadFile(fileBuffer: Buffer, fileName: string, folderId: string): Promise<FileUploadResponse> {
    try {
      const formData = new FormData();
      formData.append('data', fileBuffer, fileName);
      formData.append('folder_id', folderId);

      console.log(`Uploading file: ${fileName} to folder: ${folderId}`);
      console.log(`API endpoint: ${this.getEndpoint('/vault/file/upload')}`);

      const response = await fetch(this.getEndpoint('/vault/file/upload'), {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`File upload failed: ${response.status} - ${errorText}`);
      }

      const result = await response.json() as FileUploadResponse;
      console.log('File uploaded successfully:', result);
      
      return result;
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  }

  async scorePitchDeck(fileBuffer: Buffer, fileName: string): Promise<PitchDeckScoreResponse> {
    try {
      const formData = new FormData();
      formData.append('data', fileBuffer, fileName);

      console.log(`Scoring pitch deck: ${fileName}`);
      console.log(`API endpoint: ${this.getEndpoint('/score/pitch-deck')}`);

      const response = await fetch(this.getEndpoint('/score/pitch-deck'), {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Pitch deck scoring failed: ${response.status} - ${errorText}`);
      }

      const result = await response.json() as PitchDeckScoreResponse;
      console.log('Pitch deck scored successfully:', result);
      
      return result;
    } catch (error) {
      console.error('Error scoring pitch deck:', error);
      throw error;
    }
  }

  isConfigured(): boolean {
    return !!this.baseUrl;
  }

  getStatus(): { configured: boolean; baseUrl: string } {
    return {
      configured: this.isConfigured(),
      baseUrl: this.baseUrl ? '[CONFIGURED]' : '[NOT_CONFIGURED]'
    };
  }
}

export const eastEmblemAPI = new EastEmblemAPI();
export type { FolderStructureResponse, FileUploadResponse, PitchDeckScoreResponse };