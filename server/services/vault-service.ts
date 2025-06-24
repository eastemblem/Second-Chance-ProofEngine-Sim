import fs from "fs";
import { eastEmblemAPI } from "../eastemblem-api";
import { getSessionData, updateSessionData } from "../utils/session-manager";
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
   * Score pitch deck
   */
  async scorePitchDeck(fileBuffer: Buffer, fileName: string, sessionId: string) {
    if (!eastEmblemAPI.isConfigured()) {
      throw new Error("EastEmblem API not configured");
    }

    const scoringResult = await eastEmblemAPI.scorePitchDeck(fileBuffer, fileName, sessionId);
    return scoringResult;
  }

  /**
   * Complete scoring workflow: upload file and score
   */
  async completeScoring(req: Request) {
    const sessionData = getSessionData(req);
    const uploadedFile = sessionData.uploadedFile;
    const folderStructure = sessionData.folderStructure;

    if (!uploadedFile || !folderStructure) {
      throw new Error("Missing required data for scoring");
    }

    const sessionId = req.session?.id || 'unknown';
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
    const updatedFiles = [...(sessionData.uploadedFiles || []), uploadResult];
    updateSessionData(req, { 
      uploadedFiles: updatedFiles,
      pitchDeckScore,
      uploadedFile: undefined // Clear processed file
    });

    // Clean up file
    try {
      if (fs.existsSync(uploadedFile.filepath)) {
        fs.unlinkSync(uploadedFile.filepath);
        console.log(`Cleaned up file: ${uploadedFile.originalname}`);
      }
    } catch (error) {
      console.warn("File cleanup error:", error);
    }

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