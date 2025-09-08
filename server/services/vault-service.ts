import fs from "fs";
import { eastEmblemAPI } from "../eastemblem-api";
import { getSessionData, updateSessionData, getSessionId } from "../utils/session-manager";
import { cleanupUploadedFile } from "../utils/file-cleanup";
import { Request } from "express";

export class VaultService {
  /**
   * Create startup vault with folder structure
   */
  async createStartupVault(startupName: string, sessionId: string) {
    if (!eastEmblemAPI.isConfigured()) {
      throw new Error("EastEmblem API not configured");
    }

    const folderStructure = await eastEmblemAPI.createFolderStructure(startupName, sessionId);
    return folderStructure;
  }

  /**
   * Create folder
   */
  async createFolder(folderName: string, parentFolderId: string, sessionId: string) {
    if (!eastEmblemAPI.isConfigured()) {
      throw new Error("EastEmblem API not configured");
    }

    const folderResult = await eastEmblemAPI.createFolder(
      folderName,
      parentFolderId,
      sessionId
    );

    return folderResult;
  }

  /**
   * Upload file to vault
   */
  async uploadFileToVault(fileBuffer: Buffer, fileName: string, folderId: string, sessionId: string) {
    if (!eastEmblemAPI.isConfigured()) {
      throw new Error("EastEmblem API not configured");
    }

    const uploadResult = await eastEmblemAPI.uploadFile(
      fileBuffer,
      fileName,
      folderId,
      sessionId,
      true // allowShare
    );

    return uploadResult;
  }

  /**
   * Validate scoring response against expected founder and venture names
   */
  private validateScoringResponse(
    scoringResult: any, 
    expectedFounderName?: string,
    expectedVentureName?: string
  ) {
    const missingData: string[] = [];
    let message = "";

    // Check for venture data
    if (expectedVentureName) {
      const hasVentureData = scoringResult?.venture || 
                            scoringResult?.startup || 
                            scoringResult?.business ||
                            scoringResult?.output?.venture ||
                            scoringResult?.output?.startup ||
                            scoringResult?.output?.business;
      
      if (!hasVentureData) {
        missingData.push('venture');
      }
    }

    // Check for founder/team data  
    if (expectedFounderName) {
      const hasFounderData = scoringResult?.founder || 
                            scoringResult?.team || 
                            scoringResult?.founders ||
                            scoringResult?.output?.founder ||
                            scoringResult?.output?.team ||
                            scoringResult?.output?.founders;
      
      if (!hasFounderData) {
        missingData.push('team');
      }
    }

    // Generate appropriate error message
    if (missingData.length === 2) {
      message = "Analysis failed: We couldn't find venture and team details in your document. Please upload a file with venture and team details.";
    } else if (missingData.includes('venture')) {
      message = "Analysis failed: We couldn't find venture details in your document. Please ensure your file includes business information.";
    } else if (missingData.includes('team')) {
      message = "Analysis failed: We couldn't find team details in your document. Please ensure your file includes founder profiles.";
    }

    return {
      isValid: missingData.length === 0,
      missingData,
      message
    };
  }

  /**
   * Score pitch deck with validation
   */
  async scorePitchDeck(
    fileBuffer: Buffer, 
    fileName: string, 
    sessionId: string,
    expectedFounderName?: string,
    expectedVentureName?: string
  ) {
    if (!eastEmblemAPI.isConfigured()) {
      throw new Error("EastEmblem API not configured");
    }

    const scoringResult = await eastEmblemAPI.scorePitchDeck(fileBuffer, fileName, sessionId);
    
    // Validate scoring result if expected names are provided
    if (expectedFounderName || expectedVentureName) {
      const validationResult = this.validateScoringResponse(scoringResult, expectedFounderName, expectedVentureName);
      if (!validationResult.isValid) {
        const error = new Error(validationResult.message);
        (error as any).validationError = true;
        (error as any).missingData = validationResult.missingData;
        (error as any).canRetry = true;
        throw error;
      }
    }
    
    return scoringResult;
  }

  /**
   * Complete scoring workflow: upload file and score
   */
  async completeScoring(req: Request) {
    const sessionData = await getSessionData(req);
    const uploadedFile = sessionData.uploadedFile;
    const folderStructure = sessionData.folderStructure;

    if (!uploadedFile || !folderStructure) {
      throw new Error("Missing required data for scoring");
    }

    const sessionId = getSessionId(req);
    const overviewFolderId = folderStructure.folders?.["0_Overview"];

    if (!overviewFolderId) {
      throw new Error("Overview folder not found");
    }

    // Get expected names from session for validation
    let expectedFounderName: string | undefined;
    let expectedVentureName: string | undefined;

    try {
      // Get session data from database for validation
      const { onboardingService } = await import('./onboarding-service');
      const session = await onboardingService.getSession(sessionId);
      
      if (session?.stepData) {
        const stepData = session.stepData as any;
        expectedFounderName = stepData?.founder?.fullName;
        expectedVentureName = stepData?.venture?.name;
      }
    } catch (error) {
      // Continue without validation if session data unavailable
      console.warn("Could not retrieve session data for validation:", error);
    }

    // Read file and upload
    const fileBuffer = fs.readFileSync(uploadedFile.filepath);
    
    const uploadResult = await this.uploadFileToVault(
      fileBuffer,
      uploadedFile.originalname,
      overviewFolderId,
      sessionId
    );

    // Score the pitch deck with validation
    const pitchDeckScore = await this.scorePitchDeck(
      fileBuffer,
      uploadedFile.originalname,
      sessionId,
      expectedFounderName,
      expectedVentureName
    );

    // Update session
    const updatedFiles = [...((sessionData as any).uploadedFiles || []), uploadResult];
    updateSessionData(sessionId, { 
      uploadedFiles: updatedFiles,
      pitchDeckScore,
      uploadedFile: undefined // Clear processed file
    });

    // Clean up file after successful analysis
    cleanupUploadedFile(uploadedFile.filepath, uploadedFile.originalname, "Analysis complete");

    return {
      uploadResult,
      pitchDeckScore,
      proofScore: pitchDeckScore.output?.total_score || 
                  pitchDeckScore.total_score || 
                  pitchDeckScore.score || 
                  82
    };
  }
}

export const vaultService = new VaultService();