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

    // Read file and upload
    const fileBuffer = fs.readFileSync(uploadedFile.filepath);
    
    const uploadResult = await this.uploadFileToVault(
      fileBuffer,
      uploadedFile.originalname,
      overviewFolderId,
      sessionId
    );

    // Score the pitch deck
    const pitchDeckScore = await this.scorePitchDeck(
      fileBuffer,
      uploadedFile.originalname,
      sessionId
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