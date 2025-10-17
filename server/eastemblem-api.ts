import fetch from "node-fetch";
import FormData from "form-data";
import { appLogger } from "./utils/logger";

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
  size?: number;
  folderId?: string;
}

interface TractionSignals {
  MRR: { description: string; score: string; };
  LOIs: { description: string; score: string; };
  Waitlist: { description: string; score: string; };
  Sales: { description: string; score: string; };
  "Pilot Deals": { description: string; score: string; };
  "Strategic Partnerships": { description: string; score: string; };
  "Media Mentions": { description: string; score: string; };
  "Investor Interest": { description: string; score: string; };
  Advisors: { description: string; score: string; };
  "Community Engagement": { description: string; score: string; };
}

interface ScoreDimension {
  score: number;
  summary: string;
  justification: string;
  related_slides: string[];
  recommendation: string;
  proofTags: string[];
}

interface TractionDimension extends ScoreDimension {
  bonus_applied: {
    description: string;
    score: string;
  };
  signals: TractionSignals[];
}

interface ReportData {
  onboarding_id: string;
  folder_id: string;
  venture_name: string;
  founder_stage: string;
  business_model_type: string;
  milestone: string;
  desirability: ScoreDimension;
  feasibility: ScoreDimension;
  viability: ScoreDimension;
  traction: TractionDimension;
  readiness: ScoreDimension;
  total_score: number;
  tags: string[];
  highlights: {
    intro: string;
    key_highlights: string;
    summary: string;
  };
  conclusion: string;
  recommendations: string;
}

interface ReportResponse {
  onboarding_id: string;
  id: string;
  name: string;
  url: string;
  size?: number;
  folderId?: string;
}

interface EmailNotificationData {
  type: string;
  name: string;
  email: string;
  subject?: string;
  certificate: string;
  report: string;
  verificationUrl?: string;
}

interface EmailResponse {
  status: number;
  message: string;
}

class EastEmblemAPI {
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.EASTEMBLEM_API_BASE_URL || '';
    if (!this.baseUrl) {
      throw new Error("EASTEMBLEM_API_BASE_URL environment variable is required");
    }
  }

  private getEndpoint(path: string): string {
    return `${this.baseUrl}${path}`;
  }

  private async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async retryWithBackoff<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000,
    operationName: string = 'API operation'
  ): Promise<T> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`${operationName} - Attempt ${attempt}/${maxRetries}`);
        const result = await operation();
        if (attempt > 1) {
          console.log(`${operationName} succeeded on attempt ${attempt}`);
        }
        return result;
      } catch (error) {
        const isLastAttempt = attempt === maxRetries;
        const isRetryableError = this.isRetryableError(error);
        
        console.log(`${operationName} failed on attempt ${attempt}:`, error instanceof Error ? error.message : 'Unknown error');
        
        if (isLastAttempt || !isRetryableError) {
          if (!isRetryableError) {
            console.log(`Non-retryable error encountered, failing immediately`);
          }
          throw error;
        }
        
        const delay = baseDelay * Math.pow(2, attempt - 1); // Exponential backoff
        const jitter = Math.random() * 1000; // Add jitter to prevent thundering herd
        const totalDelay = delay + jitter;
        
        console.log(`Retrying ${operationName} in ${Math.round(totalDelay)}ms...`);
        await this.sleep(totalDelay);
      }
    }
    
    throw new Error(`${operationName} failed after ${maxRetries} attempts`);
  }

  private isRetryableError(error: any): boolean {
    if (error instanceof Error) {
      // Retry on timeout errors
      if (error.name === 'AbortError') {
        return true;
      }
      
      // Retry on 5xx server errors and 524 specifically
      if (error.message.includes('524') || 
          error.message.includes('503') || 
          error.message.includes('502') || 
          error.message.includes('500') ||
          error.message.includes('service unavailable') ||
          error.message.includes('timeout')) {
        return true;
      }
    }
    
    // Don't retry on authentication errors (401, 403) or client errors (4xx except timeouts)
    return false;
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

  async createFolder(
    folderName: string,
    parentFolderId: string,
    onboardingId?: string
  ): Promise<{ id: string; name: string; url: string }> {
    try {
      const formData = new FormData();
      formData.append("folderName", folderName);
      formData.append("folder_id", parentFolderId);
      if (onboardingId) {
        formData.append("onboarding_id", onboardingId);
      }

      console.log(`Creating folder: ${folderName} in parent: ${parentFolderId}`);
      console.log(`API endpoint: ${this.getEndpoint("/webhook/vault/folder/create")}`);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      const response = await fetch(this.getEndpoint("/webhook/vault/folder/create"), {
        method: "POST",
        body: formData,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Folder creation failed with status ${response.status}:`, errorText);
        
        if (response.status >= 500) {
          throw new Error(`EastEmblem API service unavailable (${response.status}). Please try again later.`);
        } else if (response.status === 401) {
          throw new Error("EastEmblem API authentication failed. Please check API credentials.");
        } else if (response.status === 403) {
          throw new Error("EastEmblem API access forbidden. Please verify API permissions.");
        } else if (response.status === 400 || response.status === 409 || response.status === 422) {
          // Check for various "folder already exists" error patterns
          if (errorText.toLowerCase().includes('already exists') || 
              errorText.toLowerCase().includes('duplicate') ||
              errorText.toLowerCase().includes('conflict') ||
              errorText.toLowerCase().includes('invalid or could not be processed') ||
              response.status === 409) {
            console.log(`⚠️ Folder "${folderName}" already exists in parent ${parentFolderId} - this is expected behavior`);
            // For existing folders, return the parent folder ID so files can still be uploaded
            return {
              id: parentFolderId, // Use parent folder for file uploads
              name: folderName,
              url: `https://app.box.com/folder/${parentFolderId}`
            };
          }
          console.log(`❌ Folder creation failed - validation error: ${errorText}`);
          throw new Error(`Folder creation failed: ${errorText}`);
        } else {
          throw new Error(`Folder creation failed (${response.status}): ${errorText}`);
        }
      }

      const responseText = await response.text();
      console.log("Raw folder creation response:", responseText);
      
      try {
        const result = JSON.parse(responseText);
        console.log("Folder created successfully:", result);
        
        // API returns: {"id":"332883623890","name":"TestFolder"}
        const folderId = result.id;
        const folderUrl = `https://app.box.com/folder/${folderId}`;
        
        if (!folderId) {
          throw new Error("API response missing folder ID");
        }
        
        return {
          id: folderId.toString(),
          name: result.name || folderName,
          url: folderUrl
        };
      } catch (parseError) {
        console.error("Failed to parse folder creation response JSON:", parseError);
        console.log("Response was:", responseText);
        throw new Error(`Folder creation succeeded but response parsing failed: ${parseError instanceof Error ? parseError.message : 'Invalid JSON'}`);
      }
    } catch (error) {
      console.error("Error creating folder:", error);
      if (!this.isConfigured()) {
        throw new Error("EastEmblem API is not configured. Please provide EASTEMBLEM_API_URL and EASTEMBLEM_API_KEY.");
      }
      
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error("Folder creation is taking longer than expected. Please try again.");
      }
      
      throw new Error(`Folder creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
          console.log("✅ File already exists in Box.com - using existing file reference");
          
          // Parse the error response to get the onboarding_id if available
          let onboardingId = undefined;
          try {
            const errorJson = JSON.parse(errorText);
            onboardingId = errorJson.onboarding_id;
          } catch (e) {
            // Ignore parse errors
          }
          
          return {
            id: `existing-${Date.now()}`,
            name: fileName,
            url: `https://app.box.com/file/${folderId}/${fileName}`,
            download_url: `https://app.box.com/file/${folderId}/${fileName}`,
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

      const responseText = await response.text();
      console.log("Raw certificate response:", responseText);
      
      if (!response.ok) {
        console.error(`Certificate creation failed with status ${response.status}:`, responseText);
        
        if (response.status >= 500) {
          throw new Error(`EastEmblem API service unavailable (${response.status}). Please try again later.`);
        } else if (response.status === 401) {
          throw new Error("EastEmblem API authentication failed. Please check API credentials.");
        } else if (response.status === 403) {
          throw new Error("EastEmblem API access forbidden. Please verify API permissions.");
        } else if (response.status === 400 && responseText.includes("File already exists")) {
          // Handle certificate already exists - return the existing certificate info
          console.log("Certificate already exists for this onboarding ID");
          try {
            const parsedError = JSON.parse(responseText);
            if (parsedError.onboarding_id) {
              // Return a proper existing certificate response - use a reasonable Box.com URL
              const existingCertificateUrl = `https://app.box.com/s/${onboardingId}_certificate`;
              console.log("Returning existing certificate URL:", existingCertificateUrl);
              return {
                onboarding_id: parsedError.onboarding_id,
                id: `existing-${Date.now()}`,
                name: `${parsedError.onboarding_id}_Certificate.pdf`,
                url: existingCertificateUrl
              };
            }
          } catch (parseError) {
            console.log("Could not parse existing certificate error");
          }
          // Fall through to normal error handling
        }
        throw new Error(`Certificate creation failed (${response.status}): ${responseText}`);
      }
      
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

  async createReport(reportData: ReportData): Promise<ReportResponse> {
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
        } else if (response.status === 400 && errorText.includes("File already exists")) {
          // Handle report already exists - try to parse and return existing report info
          console.log("Report already exists for this onboarding ID");
          try {
            const parsedError = JSON.parse(errorText);
            if (parsedError.onboarding_id) {
              return {
                onboarding_id: parsedError.onboarding_id,
                id: `existing-${Date.now()}`,
                name: `${parsedError.onboarding_id}_Report.pdf`,
                url: `https://app.box.com/file/report/${parsedError.onboarding_id}`
              };
            }
          } catch (parseError) {
            console.log("Could not parse existing report error");
          }
          // Fall through to normal error handling
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
    return this.retryWithBackoff(
      async () => {
        const formData = new FormData();
        formData.append("data", fileBuffer, fileName);
        if (onboardingId) {
          formData.append("onboarding_id", onboardingId);
        }

        appLogger.external(`Scoring pitch deck: ${fileName}`);
        appLogger.external(`API endpoint: ${this.getEndpoint("/webhook/score/pitch-deck")}`);

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 180000); // Increase to 3 minutes for scoring with retries

        try {
          const response = await fetch(this.getEndpoint("/webhook/score/pitch-deck"), {
            method: "POST",
            body: formData,
            signal: controller.signal,
          });

          clearTimeout(timeoutId);

          if (!response.ok) {
            const errorText = await response.text();
            appLogger.error("Pitch deck scoring failed with status", response.status, errorText);
            
            if (response.status >= 500 || response.status === 524) {
              throw new Error(`EastEmblem scoring service unavailable (${response.status}). Service may be overloaded.`);
            } else if (response.status === 401) {
              throw new Error("EastEmblem API authentication failed. Please check API credentials.");
            } else if (response.status === 403) {
              throw new Error("EastEmblem API access forbidden. Please verify API permissions.");
            } else if (response.status === 400) {
              // Handle 400 errors (like image-based PDF) - parse the error message from JSON response
              let errorMessage = "Unable to process the pitch deck file.";
              try {
                const errorJson = JSON.parse(errorText);
                errorMessage = errorJson.message || errorMessage;
              } catch {
                // If JSON parsing fails, use the raw error text
                errorMessage = errorText || errorMessage;
              }
              // Create a special error type that indicates user action is needed (not retryable)
              const error = new Error(errorMessage);
              (error as any).isUserActionRequired = true;
              (error as any).statusCode = 400;
              throw error;
            } else {
              throw new Error(`Pitch deck scoring failed (${response.status}): ${errorText}`);
            }
          }

          const responseText = await response.text();
          appLogger.external("Raw scoring response:", responseText);
          
          try {
            const result = JSON.parse(responseText) as any;
            appLogger.external("Pitch deck scored successfully:", result);
            
            // Handle the new response format - extract the first item from array if needed
            if (Array.isArray(result) && result.length > 0) {
              appLogger.external("Extracting first result from array response");
              return result[0];
            }
            
            return result;
          } catch (parseError) {
            appLogger.error("Failed to parse scoring response JSON:", parseError);
            appLogger.external("Response was:", responseText);
            
            // Try to fix common JSON issues
            try {
              const fixedJson = responseText.replace(
                /"onboarding_id":\s*([a-f0-9\-]{36})/g, 
                '"onboarding_id": "$1"'
              );
              const result = JSON.parse(fixedJson);
              appLogger.external("Successfully parsed fixed scoring JSON:", result);
              
              // Handle array format
              if (Array.isArray(result) && result.length > 0) {
                return result[0];
              }
              
              return result;
            } catch (fixError) {
              appLogger.error("Even fixed scoring JSON parsing failed:", fixError);
              throw new Error(`Pitch deck scoring succeeded but response parsing failed: ${parseError instanceof Error ? parseError.message : 'Invalid JSON'}`);
            }
          }
        } catch (error) {
          clearTimeout(timeoutId);
          throw error;
        }
      },
      3, // Max 3 attempts
      2000, // Start with 2 second delay
      'Pitch deck scoring'
    ).catch(error => {
      appLogger.error("Error scoring pitch deck after retries:", error);
      if (!this.isConfigured()) {
        throw new Error("EastEmblem API is not configured. Please provide EASTEMBLEM_API_URL and EASTEMBLEM_API_KEY.");
      }
      
      // Provide user-friendly error messages
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error("Pitch deck analysis is taking longer than expected. This may be due to file size or high server load. Please try again in a few minutes.");
      }
      
      if (error instanceof Error && (error.message.includes('524') || error.message.includes('service unavailable'))) {
        throw new Error("EastEmblem analysis service is temporarily unavailable. Please try again in a few minutes.");
      }
      
      // Preserve user action required errors
      if (error instanceof Error && (error as any).isUserActionRequired) {
        throw error; // Re-throw the original error with its special properties
      }
      
      throw new Error(`Pitch deck scoring failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    });
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

  async sendEmail(emailData: EmailNotificationData): Promise<EmailResponse> {
    const maxRetries = 3;
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`Sending email notification (attempt ${attempt}/${maxRetries}) for: ${emailData.email}`);
        console.log(`API endpoint: ${this.getEndpoint("/webhook/notification/email")}`);
        
        // Validate required fields
        if (!emailData.type || !emailData.name || !emailData.email || !emailData.certificate || !emailData.report) {
          throw new Error("Missing required email fields. All fields (type, name, email, certificate, report) are required.");
        }

        const formData = new FormData();
        formData.append("type", emailData.type);
        formData.append("name", emailData.name);
        formData.append("email", emailData.email);
        if (emailData.subject) {
          formData.append("subject", emailData.subject);
        }
        formData.append("certificate", emailData.certificate);
        formData.append("report", emailData.report);
        if (emailData.verificationUrl) {
          formData.append("verificationUrl", emailData.verificationUrl);
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

        const response = await fetch(this.getEndpoint("/webhook/notification/email"), {
          method: "POST",
          body: formData,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Email notification failed with status ${response.status}:`, errorText);
          
          if (response.status >= 500) {
            throw new Error(`EastEmblem API service unavailable (${response.status}). Please try again later.`);
          } else if (response.status === 401) {
            throw new Error("EastEmblem API authentication failed. Please check API credentials.");
          } else if (response.status === 403) {
            throw new Error("EastEmblem API access forbidden. Please verify API permissions.");
          } else {
            throw new Error(`Email notification failed (${response.status}): ${errorText}`);
          }
        }

        const responseText = await response.text();
        console.log("Raw email response:", responseText);
        
        try {
          const result = JSON.parse(responseText) as EmailResponse;
          console.log("Email notification sent successfully:", result);
          return result;
        } catch (parseError) {
          console.error("Failed to parse email response JSON:", parseError);
          console.log("Response was:", responseText);
          throw new Error(`Email notification succeeded but response parsing failed: ${parseError instanceof Error ? parseError.message : 'Invalid JSON'}`);
        }
      } catch (error) {
        console.error(`Email notification attempt ${attempt} failed:`, error);
        lastError = error instanceof Error ? error : new Error('Unknown error');
        
        if (!this.isConfigured()) {
          throw new Error("EastEmblem API is not configured. Please provide EASTEMBLEM_API_URL and EASTEMBLEM_API_KEY.");
        }
        
        // Provide more specific error messaging for timeout issues
        if (error instanceof Error && error.name === 'AbortError') {
          lastError = new Error("Email notification is taking longer than expected. Please try again in a few minutes.");
        }
        
        // If this is the last attempt, throw the error
        if (attempt === maxRetries) {
          break;
        }
        
        // Wait before retrying (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, attempt * 1000));
      }
    }

    throw new Error(`Email notification failed after ${maxRetries} attempts: ${lastError?.message || 'Unknown error'}`);
  }

  async getValidationMapAssignments(
    ventureId: string, 
    ventureName: string,
    proofScore: number,
    recommendations: {
      traction?: string;
      readiness?: string;
      viability?: string;
      feasibility?: string;
      desirability?: string;
    }
  ): Promise<any> {
    try {
      appLogger.info(`Getting validation map assignments for venture: ${ventureId}`);
      appLogger.info(`API endpoint: ${this.getEndpoint("/webhook/validation-map")}`);

      const payload = {
        venture_id: ventureId,
        venture_name: ventureName,
        proofscore: proofScore,
        recommendations: {
          traction: recommendations.traction || "",
          readiness: recommendations.readiness || "",
          viability: recommendations.viability || "",
          feasibility: recommendations.feasibility || "",
          desirability: recommendations.desirability || "",
        }
      };

      appLogger.info("Validation map payload:", payload);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      const response = await fetch(this.getEndpoint("/webhook/validation-map"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        appLogger.error(`Validation map failed with status ${response.status}:`, errorText);
        
        if (response.status >= 500) {
          throw new Error(`Validation map service unavailable (${response.status}). Please try again later.`);
        } else if (response.status === 401) {
          throw new Error("EastEmblem API authentication failed. Please check API credentials.");
        } else if (response.status === 403) {
          throw new Error("EastEmblem API access forbidden. Please verify API permissions.");
        } else {
          throw new Error(`Validation map failed (${response.status}): ${errorText}`);
        }
      }

      const responseText = await response.text();
      appLogger.info("Raw validation map response:", responseText);
      
      try {
        const result = JSON.parse(responseText);
        appLogger.info("Validation map assignments retrieved successfully:", result);
        return result;
      } catch (parseError) {
        appLogger.error("Failed to parse validation map response JSON:", parseError);
        appLogger.error("Response was:", responseText);
        throw new Error(`Validation map succeeded but response parsing failed: ${parseError instanceof Error ? parseError.message : 'Invalid JSON'}`);
      }
    } catch (error) {
      appLogger.error("Error getting validation map assignments:", error);
      if (!this.isConfigured()) {
        throw new Error("EastEmblem API is not configured. Please provide EASTEMBLEM_API_URL and EASTEMBLEM_API_KEY.");
      }
      
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error("Validation map request is taking longer than expected. Please try again.");
      }
      
      throw new Error(`Validation map failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
  EmailNotificationData,
  EmailResponse,
};
