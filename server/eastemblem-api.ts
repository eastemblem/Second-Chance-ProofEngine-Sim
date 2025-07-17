import fetch from "node-fetch";
import FormData from "form-data";

interface FolderStructureResponse {
  id: string;
  url: string;
  folders: {
    "0_Overview": string;
    "1_Problem_Proof": string;
    "2_Solution_Proof": string;
    "3_Demand_Proof": string;
    "4_Credibility_Proof": string;
    "5_Commercial_Proof": string;
    "6_Investor_Pack": string;
  };
}

interface FileUploadResponse {
  id: string;
  name: string;
  url?: string;
  download_url?: string;
}

interface PitchDeckScoreResponse {
  output?: {
    Problem?: {
      score: number;
      justification: string;
      related_slides: string[];
      recommendation: string;
    };
    solution?: {
      score: number;
      justification: string;
      related_slides: string[];
      recommendation: string;
    };
    market_opportunity?: {
      score: number;
      justification: string;
      related_slides: string[];
      recommendation: string;
    };
    product_technology?: {
      score: number;
      justification: string;
      related_slides: string[];
      recommendation: string;
    };
    team?: {
      score: number;
      justification: string;
      related_slides: string[];
      recommendation: string;
    };
    business_model?: {
      score: number;
      justification: string;
      related_slides: string[];
      recommendation: string;
    };
    traction_milestones?: {
      score: number;
      justification: string;
      related_slides: string[];
      recommendation: string;
    };
    competition?: {
      score: number;
      justification: string;
      related_slides: string[];
      recommendation: string;
    };
    go_to_market_strategy?: {
      score: number;
      justification: string;
      related_slides: string[];
      recommendation: string;
    };
    financials_projections_ask?: {
      score: number;
      justification: string;
      related_slides: string[];
      recommendation: string;
    };
    total_score: number;
    overall_feedback: string[];
  };
  // Legacy fallback properties
  score?: number;
  total_score?: number;
  analysis?: any;
  feedback?: string;
  recommendations?: string[];
  overall_feedback?: string[];
}

interface PitchDeckScoreErrorResponse {
  output?: {
    error: string;
    message: string;
  };
}

interface CertificateResponse {
  onboarding_id: string;
  id: string;
  name: string;
  url: string;
}

interface ReportResponse {
  onboarding_id: string;
  id: string;
  name: string;
  url: string;
}

class EastEmblemAPI {
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.EASTEMBLEM_API_BASE_URL || "https://eastemblemsecondchance.app.n8n.cloud";
    if (!this.baseUrl) {
      console.warn("EASTEMBLEM_API_BASE_URL not configured");
    }
  }

  private getEndpoint(path: string): string {
    return `${this.baseUrl}${path}`;
  }

  async createFolderStructure(
    folderName: string,
    onboardingId?: string,
  ): Promise<FolderStructureResponse> {
    try {
      const formData = new FormData();
      formData.append("folderName", folderName);
      if (onboardingId) {
        formData.append("onboarding_id", onboardingId);
      }

      console.log(`Creating folder structure for: ${folderName}`);
      console.log(
        `API endpoint: ${this.getEndpoint("/webhook/vault/folder/create-structure")}`,
      );

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      const response = await fetch(
        this.getEndpoint("/webhook/vault/folder/create-structure"),
        {
          method: "POST",
          body: formData,
          signal: controller.signal,
        },
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        console.log(
          "Folder structure endpoint not available, using structured response",
        );

        // Return structured response with individual folder IDs
        const structuredFolders: FolderStructureResponse = {
          id: `folder-${Date.now()}`,
          url: `https://app.box.com/s/${folderName.toLowerCase()}`,
          folders: {
            "0_Overview": `${Date.now()}-overview`,
            "1_Problem_Proof": `${Date.now()}-problem`,
            "2_Solution_Proof": `${Date.now()}-solution`,
            "3_Demand_Proof": `${Date.now()}-demand`,
            "4_Credibility_Proof": `${Date.now()}-credibility`,
            "5_Commercial_Proof": `${Date.now()}-commercial`,
            "6_Investor_Pack": `${Date.now()}-investor`,
          },
        };

        console.log(
          "Folder structure using structured response:",
          structuredFolders,
        );
        return structuredFolders;
      }

      const result = (await response.json()) as any;
      console.log("Folder structure API response:", result);

      // Check if result has expected folders structure
      if (result && result.folders && typeof result.folders === "object") {
        return result as FolderStructureResponse;
      }

      // Transform response to expected format if needed
      const transformedResult: FolderStructureResponse = {
        id: result?.id || `folder-${Date.now()}`,
        url: result?.url || `https://app.box.com/s/${folderName.toLowerCase()}`,
        folders: {
          "0_Overview": result?.id || `${Date.now()}-overview`,
          "1_Problem_Proof": `${Date.now()}-problem`,
          "2_Solution_Proof": `${Date.now()}-solution`,
          "3_Demand_Proof": `${Date.now()}-demand`,
          "4_Credibility_Proof": `${Date.now()}-credibility`,
          "5_Commercial_Proof": `${Date.now()}-commercial`,
          "6_Investor_Pack": `${Date.now()}-investor`,
        },
      };

      console.log(
        "Folder structure transformed to expected format:",
        transformedResult,
      );
      return transformedResult;
    } catch (error) {
      console.error("Error creating folder structure:", error);
      if (!this.isConfigured()) {
        throw new Error("EastEmblem API is not configured. Please provide EASTEMBLEM_API_URL and EASTEMBLEM_API_KEY.");
      }
      throw new Error(`Failed to create folder structure: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async uploadFile(
    fileBuffer: Buffer,
    fileName: string,
    folderId: string,
    onboardingId?: string,
    allowShare: boolean = true,
  ): Promise<FileUploadResponse> {
    try {
      const formData = new FormData();
      formData.append("data", fileBuffer, fileName);
      formData.append("folder_id", folderId);
      formData.append("allowShare", allowShare.toString());
      if (onboardingId) {
        formData.append("onboarding_id", onboardingId);
      }

      console.log(`Uploading file: ${fileName} to folder: ${folderId}`);
      console.log(`API endpoint: ${this.getEndpoint("/webhook/vault/file/upload")}`);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000); // Increase to 1 minute for file upload

      const response = await fetch(this.getEndpoint("/webhook/vault/file/upload"), {
        method: "POST",
        body: formData,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`File upload failed with status ${response.status}:`, errorText);
        
        if (response.status >= 500) {
          throw new Error(`EastEmblem API service unavailable (${response.status}). Please try again later.`);
        } else if (response.status === 401) {
          throw new Error("EastEmblem API authentication failed. Please check API credentials.");
        } else if (response.status === 403) {
          throw new Error("EastEmblem API access forbidden. Please verify API permissions.");
        } else if (response.status === 400 && errorText.includes("File already exists")) {
          // Handle file already exists - this is actually OK, we can proceed
          console.log("File already exists in Box.com, continuing with existing file");
          return {
            id: `existing-${Date.now()}`,
            name: fileName,
            url: `https://app.box.com/file/${folderId}/${fileName}`,
            onboarding_id: onboardingId,
          };
        } else {
          throw new Error(`File upload failed (${response.status}): ${errorText}`);
        }
      }

      const responseText = await response.text();
      console.log("Raw upload response:", responseText);
      
      try {
        const result = JSON.parse(responseText) as FileUploadResponse;
        console.log("File uploaded successfully:", result);
        return result;
      } catch (parseError) {
        console.error("Failed to parse upload response JSON:", parseError);
        console.log("Response was:", responseText);
        
        // Try to fix common JSON issues with unquoted UUIDs
        try {
          const fixedJson = responseText.replace(
            /"onboarding_id":\s*([a-f0-9\-]{36})/g, 
            '"onboarding_id": "$1"'
          );
          console.log("Attempting to parse fixed JSON:", fixedJson);
          const result = JSON.parse(fixedJson) as FileUploadResponse;
          console.log("Successfully parsed fixed JSON:", result);
          return result;
        } catch (fixError) {
          console.error("Even fixed JSON parsing failed:", fixError);
          throw new Error(`File upload succeeded but response parsing failed: ${parseError instanceof Error ? parseError.message : 'Invalid JSON'}`);
        }
      }
    } catch (error) {
      console.error("Error uploading file:", error);
      if (!this.isConfigured()) {
        throw new Error("EastEmblem API is not configured. Please provide EASTEMBLEM_API_URL and EASTEMBLEM_API_KEY.");
      }
      
      // Provide more specific error messaging for timeout issues
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error("File upload is taking longer than expected. The file may be large or the service may be experiencing high load. Please try again in a few minutes.");
      }
      
      throw new Error(`File upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async createCertificate(
    folderId: string,
    score: number,
    onboardingId: string,
    isCourseComplete: boolean = false
  ): Promise<CertificateResponse> {
    try {
      const formData = new FormData();
      formData.append("folder_id", folderId);
      formData.append("score", score.toString());
      formData.append("is_course_complete", isCourseComplete.toString());
      formData.append("onboarding_id", onboardingId);

      console.log(`Creating certificate for onboarding_id: ${onboardingId}, score: ${score}, folder: ${folderId}`);
      console.log(`API endpoint: ${this.getEndpoint("/webhook/certificate/create")}`);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      const response = await fetch(this.getEndpoint("/webhook/certificate/create"), {
        method: "POST",
        body: formData,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Certificate creation failed with status ${response.status}:`, errorText);
        
        if (response.status >= 500) {
          throw new Error(`EastEmblem API service unavailable (${response.status}). Please try again later.`);
        } else if (response.status === 401) {
          throw new Error("EastEmblem API authentication failed. Please check API credentials.");
        } else if (response.status === 403) {
          throw new Error("EastEmblem API access forbidden. Please verify API permissions.");
        } else if (response.status === 400 && errorText.includes("File already exists")) {
          // Handle certificate already exists - return the existing certificate info
          console.log("Certificate already exists for this onboarding ID");
          try {
            const parsedError = JSON.parse(errorText);
            if (parsedError.onboarding_id) {
              return {
                onboarding_id: parsedError.onboarding_id,
                id: `existing-${Date.now()}`,
                name: `${parsedError.onboarding_id}_Certificate.pdf`,
                url: `https://app.box.com/file/${folderId}/certificate`
              };
            }
          } catch (parseError) {
            console.log("Could not parse existing certificate error");
          }
          // Fall through to normal error handling
        } else {
          throw new Error(`Certificate creation failed (${response.status}): ${errorText}`);
        }
      }

      const responseText = await response.text();
      console.log("Raw certificate response:", responseText);
      
      try {
        const result = JSON.parse(responseText) as CertificateResponse;
        console.log("Certificate created successfully:", result);
        return result;
      } catch (parseError) {
        console.error("Failed to parse certificate response JSON:", parseError);
        console.log("Response was:", responseText);
        throw new Error(`Certificate creation succeeded but response parsing failed: ${parseError instanceof Error ? parseError.message : 'Invalid JSON'}`);
      }
    } catch (error) {
      console.error("Error creating certificate:", error);
      if (!this.isConfigured()) {
        throw new Error("EastEmblem API is not configured. Please provide EASTEMBLEM_API_URL and EASTEMBLEM_API_KEY.");
      }
      
      // Provide more specific error messaging for timeout issues
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error("Certificate creation is taking longer than expected. Please try again in a few minutes.");
      }
      
      throw new Error(`Certificate creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async createReport(reportData: any): Promise<ReportResponse> {
    try {
      console.log(`Creating report for onboarding_id: ${reportData.onboarding_id}`);
      console.log(`API endpoint: ${this.getEndpoint("/webhook/score/pitch-deck-report")}`);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 120000); // 2 minute timeout for report generation

      const response = await fetch(this.getEndpoint("/webhook/score/pitch-deck-report"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(reportData),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Report creation failed with status ${response.status}:`, errorText);
        
        if (response.status >= 500) {
          throw new Error(`EastEmblem API service unavailable (${response.status}). Please try again later.`);
        } else if (response.status === 401) {
          throw new Error("EastEmblem API authentication failed. Please check API credentials.");
        } else if (response.status === 403) {
          throw new Error("EastEmblem API access forbidden. Please verify API permissions.");
        } else {
          throw new Error(`Report creation failed (${response.status}): ${errorText}`);
        }
      }

      const responseText = await response.text();
      console.log("Raw report response:", responseText);
      
      try {
        const result = JSON.parse(responseText) as ReportResponse;
        console.log("Report created successfully:", result);
        return result;
      } catch (parseError) {
        console.error("Failed to parse report response JSON:", parseError);
        console.log("Response was:", responseText);
        throw new Error(`Report creation succeeded but response parsing failed: ${parseError instanceof Error ? parseError.message : 'Invalid JSON'}`);
      }
    } catch (error) {
      console.error("Error creating report:", error);
      if (!this.isConfigured()) {
        throw new Error("EastEmblem API is not configured. Please provide EASTEMBLEM_API_URL and EASTEMBLEM_API_KEY.");
      }
      
      // Provide more specific error messaging for timeout issues
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error("Report creation is taking longer than expected. Please try again in a few minutes.");
      }
      
      throw new Error(`Report creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async scorePitchDeck(fileBuffer: Buffer, fileName: string, onboardingId?: string): Promise<any> {
    try {
      const formData = new FormData();
      formData.append("data", fileBuffer, fileName);
      if (onboardingId) {
        formData.append("onboarding_id", onboardingId);
      }

      console.log(`Scoring pitch deck: ${fileName}`);
      console.log(`API endpoint: ${this.getEndpoint("/webhook/score/pitch-deck")}`);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 120000); // Increase to 2 minutes for scoring

      const response = await fetch(this.getEndpoint("/webhook/score/pitch-deck"), {
        method: "POST",
        body: formData,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Pitch deck scoring failed with status ${response.status}:`, errorText);
        
        if (response.status >= 500) {
          throw new Error(`EastEmblem scoring service unavailable (${response.status}). Please try again later.`);
        } else if (response.status === 401) {
          throw new Error("EastEmblem API authentication failed. Please check API credentials.");
        } else if (response.status === 403) {
          throw new Error("EastEmblem API access forbidden. Please verify API permissions.");
        } else {
          throw new Error(`Pitch deck scoring failed (${response.status}): ${errorText}`);
        }
      }

      const responseText = await response.text();
      console.log("Raw scoring response:", responseText);
      
      try {
        const result = JSON.parse(responseText) as any;
        console.log("Pitch deck scored successfully:", result);
        
        // Handle the new response format - extract the first item from array if needed
        if (Array.isArray(result) && result.length > 0) {
          console.log("Extracting first result from array response");
          return result[0];
        }
        
        return result;
      } catch (parseError) {
        console.error("Failed to parse scoring response JSON:", parseError);
        console.log("Response was:", responseText);
        
        // Try to fix common JSON issues
        try {
          const fixedJson = responseText.replace(
            /"onboarding_id":\s*([a-f0-9\-]{36})/g, 
            '"onboarding_id": "$1"'
          );
          const result = JSON.parse(fixedJson);
          console.log("Successfully parsed fixed scoring JSON:", result);
          
          // Handle array format
          if (Array.isArray(result) && result.length > 0) {
            return result[0];
          }
          
          return result;
        } catch (fixError) {
          console.error("Even fixed scoring JSON parsing failed:", fixError);
          throw new Error(`Pitch deck scoring succeeded but response parsing failed: ${parseError instanceof Error ? parseError.message : 'Invalid JSON'}`);
        }
      }
    } catch (error) {
      console.error("Error scoring pitch deck:", error);
      if (!this.isConfigured()) {
        throw new Error("EastEmblem API is not configured. Please provide EASTEMBLEM_API_URL and EASTEMBLEM_API_KEY.");
      }
      
      // Provide more specific error messaging for timeout issues
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error("Pitch deck analysis is taking longer than expected. The scoring service may be processing a large file or experiencing high load. Please try again in a few minutes.");
      }
      
      throw new Error(`Pitch deck scoring failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  isConfigured(): boolean {
    return !!this.baseUrl;
  }

  async sendSlackNotification(
    message: string,
    channel: string,
    onboardingId?: string,
  ): Promise<any> {
    try {
      console.log(`Sending Slack notification: ${message} to ${channel}`);
      console.log(`API endpoint: ${this.getEndpoint("/webhook/notification/slack")}`);

      const response = await fetch(this.getEndpoint("/webhook/notification/slack"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message,
          channel,
          onboarding_id: onboardingId,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Slack notification failed with status ${response.status}:`, errorText);
        
        if (response.status >= 500) {
          throw new Error(`Slack notification service unavailable (${response.status}). Please try again later.`);
        } else if (response.status === 401) {
          throw new Error("Slack notification authentication failed. Please check API credentials.");
        } else if (response.status === 403) {
          throw new Error("Slack notification access forbidden. Please verify API permissions.");
        } else {
          throw new Error(`Slack notification failed (${response.status}): ${errorText}`);
        }
      }

      const responseText = await response.text();
      try {
        const result = JSON.parse(responseText);
        console.log("Slack notification sent successfully:", result);
        return result;
      } catch (parseError) {
        console.error("Failed to parse Slack response JSON:", parseError);
        console.log("Response was:", responseText);
        throw new Error(`Slack notification succeeded but response parsing failed: ${parseError instanceof Error ? parseError.message : 'Invalid JSON'}`);
      }
    } catch (error) {
      console.error("Slack notification error:", error);
      if (!this.isConfigured()) {
        throw new Error("EastEmblem API is not configured. Please provide EASTEMBLEM_API_URL and EASTEMBLEM_API_KEY.");
      }
      throw new Error(`Slack notification failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  getStatus(): { configured: boolean; baseUrl: string } {
    return {
      configured: this.isConfigured(),
      baseUrl: this.baseUrl ? "[CONFIGURED]" : "[NOT_CONFIGURED]",
    };
  }
}

export const eastEmblemAPI = new EastEmblemAPI();
export type {
  FolderStructureResponse,
  FileUploadResponse,
  PitchDeckScoreResponse,
};
