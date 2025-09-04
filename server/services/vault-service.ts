import fs from "fs";
import { eastEmblemAPI } from "../eastemblem-api";
import { getSessionData, updateSessionData, getSessionId } from "../utils/session-manager";
import { cleanupUploadedFile } from "../utils/file-cleanup";
import { Request } from "express";
import { ConsistencyValidationService, ConsistencyCheckResult, OnboardingData, PitchDeckAnalysis } from "./consistency-validation-service";
import { appLogger } from "../utils/logger";
import { emailService } from "./emailService";
import { storage } from "../storage";

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
   * Complete scoring workflow: upload file and score with consistency validation
   */
  async completeScoring(req: Request) {
    const sessionId = getSessionId(req);
    const sessionData = await getSessionData(sessionId);
    const uploadedFile = sessionData.uploadedFile;
    const folderStructure = sessionData.folderStructure;

    if (!uploadedFile || !folderStructure) {
      throw new Error("Missing required data for scoring");
    }

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

    const maxRetries = 3;
    let attempt = 0;
    let pitchDeckScore: any;
    let consistencyResult: ConsistencyCheckResult | null = null;

    appLogger.business('Starting scoring with consistency validation', { 
      sessionId, 
      fileName: uploadedFile.originalname,
      maxRetries 
    });

    while (attempt < maxRetries) {
      attempt++;
      appLogger.business(`Scoring attempt ${attempt}/${maxRetries}`, { sessionId, fileName: uploadedFile.originalname });

      try {
        // Score the pitch deck
        pitchDeckScore = await this.scorePitchDeck(
          fileBuffer,
          uploadedFile.originalname,
          sessionId
        );

        // Validate consistency if we have onboarding data
        const onboardingData = this.extractOnboardingData(sessionData);
        if (onboardingData) {
          consistencyResult = ConsistencyValidationService.validateConsistency(
            onboardingData,
            pitchDeckScore as PitchDeckAnalysis
          );

          if (consistencyResult.isValid) {
            appLogger.business('Consistency validation passed', { 
              sessionId, 
              score: consistencyResult.score,
              attempt 
            });
            break; // Success - exit retry loop
          } else {
            appLogger.business('Consistency validation failed', { 
              sessionId, 
              score: consistencyResult.score,
              errors: consistencyResult.errors.map(e => e.type),
              attempt 
            });

            // If this is the last attempt, we'll handle it after the loop
            if (attempt >= maxRetries) {
              break;
            }

            // Wait before retrying (exponential backoff)
            const waitTime = Math.pow(2, attempt - 1) * 1000; // 1s, 2s, 4s
            appLogger.business(`Retrying consistency validation in ${waitTime}ms`, { sessionId, attempt });
            await new Promise(resolve => setTimeout(resolve, waitTime));
          }
        } else {
          appLogger.business('No onboarding data found, skipping consistency validation', { sessionId });
          break; // No validation needed
        }
      } catch (error) {
        appLogger.business(`Scoring attempt ${attempt} failed`, { 
          sessionId, 
          error: error instanceof Error ? error.message : 'Unknown error',
          attempt 
        });

        if (attempt >= maxRetries) {
          throw error; // Re-throw if all attempts failed
        }

        // Wait before retrying
        const waitTime = Math.pow(2, attempt - 1) * 1000;
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }

    // Handle final result
    if (consistencyResult && !consistencyResult.isValid && attempt >= maxRetries) {
      // Max retries reached and validation still failing - mark for manual review and notify team
      await this.markVentureForManualReview(sessionData, consistencyResult, maxRetries);
      await this.sendManualReviewNotification(sessionData, uploadedFile, consistencyResult, sessionId);
      
      const errorMessage = ConsistencyValidationService.getDisplayMessage(consistencyResult);
      throw new Error(errorMessage);
    }

    // Update session with successful result
    const updatedFiles = [...((sessionData as any).uploadedFiles || []), uploadResult];
    updateSessionData(sessionId, { 
      uploadedFiles: updatedFiles,
      pitchDeckScore,
      consistencyResult,
      uploadedFile: undefined // Clear processed file
    });

    // Clean up file after successful analysis
    cleanupUploadedFile(uploadedFile.filepath, uploadedFile.originalname, "Analysis complete");

    return {
      uploadResult,
      pitchDeckScore,
      consistencyResult,
      proofScore: pitchDeckScore.output?.total_score || 
                  pitchDeckScore.total_score || 
                  pitchDeckScore.score || 
                  82
    };
  }

  /**
   * Extract onboarding data from session for consistency validation
   */
  private extractOnboardingData(sessionData: any): OnboardingData | null {
    try {
      const stepData = sessionData.stepData;
      if (!stepData?.founder || !stepData?.venture) {
        return null;
      }

      return {
        founder: {
          fullName: stepData.founder.fullName || stepData.founderData?.fullName,
          email: stepData.founder.email || stepData.founderData?.email,
          positionRole: stepData.founder.positionRole || stepData.founderData?.positionRole || 'Founder'
        },
        venture: {
          name: stepData.venture.name || stepData.founderData?.startupName,
          industry: stepData.venture.industry || 'Technology',
          revenueStage: stepData.venture.revenueStage || 'None',
          mvpStatus: stepData.venture.mvpStatus || stepData.venture.productStatus || 'Mockup',
          geography: stepData.venture.geography || 'Global'
        }
      };
    } catch (error) {
      appLogger.business('Failed to extract onboarding data', { error: error instanceof Error ? error.message : 'Unknown error' });
      return null;
    }
  }

  /**
   * Mark venture for manual review in database
   */
  private async markVentureForManualReview(
    sessionData: any, 
    consistencyResult: ConsistencyCheckResult,
    attemptCount: number
  ): Promise<void> {
    try {
      const onboardingData = this.extractOnboardingData(sessionData);
      if (!onboardingData) {
        appLogger.business('Cannot mark venture for manual review - onboarding data missing');
        return;
      }

      // Find venture by email/founder information
      const founder = await storage.getFounderByEmail(onboardingData.founder.email);
      if (!founder) {
        appLogger.business('Cannot mark venture for manual review - founder not found', { 
          email: onboardingData.founder.email 
        });
        return;
      }

      const ventures = await storage.getVenturesByFounderId(founder.founderId);
      const currentVenture = ventures.find(v => v.name === onboardingData.venture.name);
      
      if (!currentVenture) {
        appLogger.business('Cannot mark venture for manual review - venture not found', { 
          founderId: founder.founderId,
          ventureName: onboardingData.venture.name
        });
        return;
      }

      // Update venture with manual review information
      const manualReviewReason = `Consistency validation failed after ${attemptCount} attempts. ` +
        `Errors: ${consistencyResult.errors.map(e => e.type).join(', ')}. ` +
        `Score: ${consistencyResult.score}/100.`;

      await storage.updateVenture(currentVenture.ventureId, {
        status: 'manual_review',
        manualReviewReason,
        manualReviewRequestedAt: new Date(),
        consistencyCheckAttempts: attemptCount,
        consistencyCheckScore: consistencyResult.score,
        validationErrors: {
          errors: consistencyResult.errors,
          warnings: consistencyResult.warnings,
          timestamp: new Date().toISOString()
        }
      });

      appLogger.business('Venture marked for manual review', {
        ventureId: currentVenture.ventureId,
        ventureName: currentVenture.name,
        reason: manualReviewReason,
        consistencyScore: consistencyResult.score
      });

    } catch (error) {
      appLogger.business('Failed to mark venture for manual review', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Send manual review notification to team
   */
  private async sendManualReviewNotification(
    sessionData: any, 
    uploadedFile: any, 
    consistencyResult: ConsistencyCheckResult,
    sessionId: string
  ): Promise<void> {
    try {
      appLogger.business('Sending manual review notification to team', { 
        sessionId,
        fileName: uploadedFile.originalname,
        consistencyScore: consistencyResult.score,
        errorCount: consistencyResult.errors.length
      });

      const onboardingData = this.extractOnboardingData(sessionData);
      if (!onboardingData) {
        appLogger.business('Cannot send notification - onboarding data missing', { sessionId });
        return;
      }

      // Get Box folder URL from session data
      const folderStructure = sessionData.folderStructure;
      const boxFolderUrl = folderStructure?.url || folderStructure?.folderUrl || '#';

      const templateData = {
        HOST_URL: process.env.FRONTEND_URL || `https://${process.env.REPLIT_DOMAINS?.split(',')[0]}`,
        BOX_FOLDER_URL: boxFolderUrl,
        FOUNDER_NAME: onboardingData.founder.fullName,
        FOUNDER_EMAIL: onboardingData.founder.email,
        FOUNDER_ROLE: onboardingData.founder.positionRole,
        VENTURE_NAME: onboardingData.venture.name,
        VENTURE_INDUSTRY: onboardingData.venture.industry,
        SESSION_ID: sessionId,
        CONSISTENCY_SCORE: consistencyResult.score.toString(),
        FILE_NAME: uploadedFile.originalname,
        UPLOAD_TIME: new Date().toLocaleString(),
        RETRY_ATTEMPTS: '3',
        VALIDATION_ERRORS: consistencyResult.errors.map(error => ({
          type: error.type.replace(/_/g, ' ').toUpperCase(),
          message: error.message
        })),
        VALIDATION_WARNINGS: consistencyResult.warnings.map(warning => ({
          type: warning.type.replace(/_/g, ' ').toUpperCase(),
          message: warning.message
        }))
      };

      const teamEmail = process.env.TEAM_NOTIFICATION_EMAIL || process.env.SUPPORT_EMAIL || 'info@get-secondchance.com';
      
      const success = await emailService.sendEmail(
        teamEmail,
        `🚨 Manual Verification Required: ${onboardingData.venture.name} - Consistency Check Failed`,
        'manual-verification-notification',
        templateData
      );

      if (success) {
        appLogger.business('Manual review notification sent successfully', {
          sessionId,
          venture: onboardingData.venture.name,
          founder: onboardingData.founder.fullName,
          teamEmail
        });
      } else {
        appLogger.business('Failed to send manual review notification', {
          sessionId,
          venture: onboardingData.venture.name,
          founder: onboardingData.founder.fullName,
          teamEmail
        });
      }
    } catch (error) {
      appLogger.business('Error sending manual review notification', {
        sessionId,
        error: error instanceof Error ? error.message : 'Unknown error',
        fileName: uploadedFile.originalname
      });
    }
  }
}

export const vaultService = new VaultService();