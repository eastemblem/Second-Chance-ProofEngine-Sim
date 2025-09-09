import { Request } from "express";
import { storage } from "../storage";
import { ActivityService } from "./activity-service";
import { eastEmblemAPI, type EmailNotificationData } from "../eastemblem-api";
import { getSessionId, getSessionData, updateSessionData } from "../utils/session-manager";
import { db } from "../db";
import { onboardingSession, documentUpload, founder } from "@shared/schema";
import { eq, and, sql } from "drizzle-orm";

// Utility function to extract MIME type from file extension
function getMimeTypeFromExtension(fileName: string): string {
  const extension = fileName.toLowerCase().split('.').pop();
  const mimeTypes: Record<string, string> = {
    'pdf': 'application/pdf',
    'doc': 'application/msword',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'ppt': 'application/vnd.ms-powerpoint',
    'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'xls': 'application/vnd.ms-excel',
    'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'mp4': 'video/mp4',
    'avi': 'video/x-msvideo',
    'txt': 'text/plain',
    'csv': 'text/csv'
  };
  return mimeTypes[extension || ''] || 'application/octet-stream';
}
import fs from "fs";
import crypto from "crypto";
import { certificateService } from "./certificate-service";

export class OnboardingService {
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
   * Initialize onboarding session
   */
  async initializeSession(req: Request): Promise<string> {
    const sessionId = getSessionId(req);
    
    // Check if session already exists in database
    const existingSession = await db
      .select()
      .from(onboardingSession)
      .where(eq(onboardingSession.sessionId, sessionId))
      .limit(1);

    if (existingSession.length === 0) {
      // Create new session in database
      await db.insert(onboardingSession).values({
        sessionId,
        currentStep: "founder",
        stepData: {},
        completedSteps: [],
        isComplete: false,
      });

      // Send Slack notification for onboarding start (async, no wait)
      if (eastEmblemAPI.isConfigured()) {
        eastEmblemAPI
          .sendSlackNotification(
            `\`Onboarding Id : ${sessionId}\`\n🚀 New Onboarding Session Started`,
            "#notifications",
            sessionId,
          )
          .catch((error) => {
            console.log("Failed to send onboarding start notification:", error);
          });
      }
    }

    return sessionId;
  }

  /**
   * Get session from database
   */
  async getSession(sessionId: string) {
    const sessions = await db
      .select()
      .from(onboardingSession)
      .where(eq(onboardingSession.sessionId, sessionId))
      .limit(1);

    return sessions[0] || null;
  }

  /**
   * Ensure session exists in database  
   */
  async ensureSession(sessionId: string) {
    const existingSession = await this.getSession(sessionId);
    if (!existingSession) {
      await db.insert(onboardingSession).values({
        sessionId,
        currentStep: "founder",
        stepData: {},
        completedSteps: [],
        isComplete: false,
      });
    }
  }

  /**
   * Update session data
   */
  async updateSession(sessionId: string, updates: Partial<any>) {
    await db
      .update(onboardingSession)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(onboardingSession.sessionId, sessionId));
  }

  /**
   * Check if a founder has any incomplete onboarding sessions
   */
  async hasIncompleteOnboardingSession(founderId: string): Promise<boolean> {
    try {
      const [session] = await db
        .select()
        .from(onboardingSession)
        .where(
          and(
            eq(onboardingSession.founderId, founderId),
            eq(onboardingSession.isComplete, false)
          )
        )
        .limit(1);
      
      return !!session;
    } catch (error) {
      console.error("❌ Error checking incomplete sessions:", error);
      return false; // Default to false on error to be safe
    }
  }

  /**
   * Complete founder onboarding step
   */
  async completeFounderStep(sessionId: string | null, founderData: any) {
    if (!sessionId) {
      sessionId = crypto.randomUUID();
    }

    // Ensure session exists in database (this handles both new and existing sessions)
    await this.ensureSession(sessionId);

    // Check if founder exists by email
    let founderRecord = await storage.getFounderByEmail(founderData.email);
    
    if (!founderRecord) {
      // Create new founder
      try {
        if (process.env.NODE_ENV === 'development') {
          console.log("Creating founder with data:", JSON.stringify(founderData, null, 2));
        }
        founderRecord = await storage.createFounder(founderData);
        if (process.env.NODE_ENV === 'development') {
          console.log("Founder created successfully:", founderRecord.founderId);
        }
      } catch (error) {
        console.error("❌ Failed to create founder:", error);
        throw new Error(`Failed to create founder: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    } else {
      // Founder exists - check if they have any incomplete sessions
      const hasIncompleteSession = await this.hasIncompleteOnboardingSession(founderRecord.founderId);
      
      if (hasIncompleteSession) {
        // Allow re-registration by updating existing founder data
        try {
          if (process.env.NODE_ENV === 'development') {
            console.log("Updating existing founder with incomplete session:", founderRecord.founderId);
          }
          
          // Update the existing founder with new data
          await db
            .update(founder)
            .set({
              fullName: founderData.fullName,
              email: founderData.email,
              linkedinProfile: founderData.linkedinProfile,
              gender: founderData.gender,
              age: founderData.age,
              positionRole: founderData.positionRole,
              residence: founderData.residence,
              isTechnical: founderData.isTechnical,
              phone: founderData.phone,
              street: founderData.street,
              city: founderData.city,
              state: founderData.state,
              country: founderData.country,
              updatedAt: new Date(),
            })
            .where(eq(founder.founderId, founderRecord.founderId));
          
          // Get updated founder data
          const [updatedFounder] = await db
            .select()
            .from(founder)
            .where(eq(founder.founderId, founderRecord.founderId));
          
          founderRecord = updatedFounder;
          
          if (process.env.NODE_ENV === 'development') {
            console.log("Founder updated successfully for restart:", founderRecord.founderId);
          }
        } catch (error) {
          console.error("❌ Failed to update founder:", error);
          throw new Error(`Failed to update founder data: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      } else {
        // Email already exists and has completed sessions - check if start over allows reuse
        const emailCheck = await this.canReuseEmail(founderData.email, sessionId);
        if (!emailCheck.canReuse) {
          throw new Error(emailCheck.reason || "Email already taken");
        }
        
        // Email can be reused during start over - use existing founder
        console.log("Email reused during start over:", founderData.email, emailCheck.reason);
      }
    }

    // Update session with founder data and ID
    const founderId = founderRecord.founderId;
    
    if (!founderId) {
      throw new Error("Failed to create founder - no ID returned");
    }
    
    // Store founder ID separately for reliable access
    await this.updateSession(sessionId, {
      currentStep: "venture",
      stepData: { 
        founder: founderRecord,
        founderId: founderId,
      },
      completedSteps: ["founder"],
    });

    // Send Slack notification for founder step completion (async, no wait)
    if (eastEmblemAPI.isConfigured()) {
      eastEmblemAPI
        .sendSlackNotification(
          `\`Onboarding Id : ${sessionId}\`\n👤 Founder Profile Completed - ${founderRecord.fullName} (${founderRecord.email})`,
          "#notifications",
          sessionId,
        )
        .catch((error) => {
          console.log("Failed to send founder completion notification:", error);
        });
    }

    return {
      sessionId,
      founderId: founderRecord.founderId,
      founder: founderRecord,
    };
  }

  /**
   * Complete venture onboarding step
   */
  async completeVentureStep(sessionId: string, ventureData: any) {
    if (process.env.NODE_ENV === 'development') {
      console.log(`Getting session for venture step: ${sessionId}`);
    }
    const session = await this.getSession(sessionId);
    console.log(`Session found:`, session ? 'YES' : 'NO', session?.currentStep);
    console.log(`Session data:`, JSON.stringify(session, null, 2));
    
    if (!session) {
      console.error(`❌ Session null/undefined for ID: ${sessionId}`);
      throw new Error("Session not found - founder step must be completed first");
    }

    // Try to get founder data from session first
    let founderData = session.stepData?.founder;
    let founderId = session.stepData?.founderId || founderData?.founderId;
    
    // If session data is empty/corrupted, provide clear guidance
    if (!founderData || !founderId) {
      console.warn(`⚠️ Session stepData missing for ${sessionId}. Session may be corrupted.`);
      console.warn(`Session created:`, session.createdAt);
      console.warn(`Current step:`, session.currentStep);
      console.warn(`Completed steps:`, session.completedSteps);
      console.warn(`Session stepData:`, session.stepData);
      
      // Calculate session age
      const sessionAge = Date.now() - new Date(session.createdAt).getTime();
      const ageInHours = Math.floor(sessionAge / (1000 * 60 * 60));
      
      // Provide clear guidance based on session state
      if (ageInHours > 24) {
        throw new Error(`This session is ${ageInHours} hours old and appears to be expired. Please start a new onboarding session by completing the founder step first.`);
      } else {
        throw new Error(`The founder step has not been completed for this session. Please complete the founder information step first before proceeding to venture details. Session ID: ${sessionId}`);
      }
    }
    
    // Map productStatus to mvpStatus for database schema compatibility
    const ventureForDb = {
      ...ventureData,
      founderId: founderId,
      mvpStatus: ventureData.productStatus || ventureData.mvpStatus,
    };
    
    let venture;
    try {
      console.log("Creating venture with data:", JSON.stringify(ventureForDb, null, 2));
      venture = await storage.createVenture(ventureForDb);
      console.log("✓ Venture created successfully:", venture.ventureId);
      
      // Log venture creation activity
      await ActivityService.logVentureActivity(
        { founderId, ventureId: venture.ventureId },
        'create',
        'Venture profile created',
        venture.ventureId,
        `Created venture "${venture.name}" in ${venture.industry} industry`,
        {
          ventureName: venture.name,
          industry: venture.industry,
          geography: venture.geography,
          sessionId
        }
      );
    } catch (error) {
      console.error("❌ Failed to create venture:", error);
      throw new Error(`Failed to create venture: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // Create folder structure with EastEmblem API
    let folderStructure = null;
    if (eastEmblemAPI.isConfigured()) {
      try {
        folderStructure = await eastEmblemAPI.createFolderStructure(
          venture.name, 
          sessionId
        );
        
        // Save folder structure to venture table
        if (folderStructure) {
          await storage.updateVenture(venture.ventureId, {
            folderStructure: folderStructure
          });
          console.log('✓ Folder structure saved to venture table');
          
          // Populate proof_vault table with folder structure
          if (folderStructure.folders) {
            const folderMappings = [
              { key: "0_Overview", type: "Pitch Deck", description: "Company overview and general information" },
              { key: "1_Problem_Proof", type: "Technical Documentation", description: "Evidence of problem validation and market research" },
              { key: "2_Solution_Proof", type: "Demo Video", description: "Solution validation and proof of concept materials" },
              { key: "3_Demand_Proof", type: "Metrics Dashboard", description: "Market demand validation and customer feedback" },
              { key: "4_Credibility_Proof", type: "Customer Testimonial", description: "Team credibility and company validation materials" },
              { key: "5_Commercial_Proof", type: "Financial Model", description: "Business model and financial projections" },
              { key: "6_Investor_Pack", type: "Pitch Deck", description: "Investor-ready materials and data room documents" }
            ];
            
            for (const folder of folderMappings) {
              const subFolderId = folderStructure.folders[folder.key];
              if (subFolderId) {
                try {
                  await storage.createProofVault({
                    ventureId: venture.ventureId,
                    artefactType: folder.type as any,
                    parentFolderId: folderStructure.id,
                    subFolderId: subFolderId,
                    sharedUrl: folderStructure.url,
                    folderName: folder.key,
                    description: folder.description
                  });
                  console.log(`✓ Created proof_vault entry for ${folder.key}: ${subFolderId}`);
                } catch (error) {
                  console.error(`Failed to create proof_vault entry for ${folder.key}:`, error);
                }
              }
            }
          }
        }
      } catch (error) {
        console.warn("Failed to create folder structure:", error);
      }
    }

    // Update session
    await this.updateSession(sessionId, {
      currentStep: "team",
      stepData: {
        ...session.stepData,
        venture,
        folderStructure,
      },
      completedSteps: [...session.completedSteps, "venture"],
    });

    // Send Slack notification for venture step completion (async, no wait)
    if (eastEmblemAPI.isConfigured()) {
      eastEmblemAPI
        .sendSlackNotification(
          `\`Onboarding Id : ${sessionId}\`\n🏢 Venture Info Completed - ${venture.name} (${venture.industry})`,
          "#notifications",
          sessionId,
        )
        .catch((error) => {
          console.log("Failed to send venture completion notification:", error);
        });
    }

    return { venture, folderStructure };
  }

  /**
   * Add team member
   */
  async addTeamMember(sessionId: string, memberData: any) {
    if (!sessionId || sessionId === 'undefined') {
      throw new Error("Invalid session ID provided");
    }

    const session = await this.getSession(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found - onboarding may have expired`);
    }

    // Look for venture data in session or get most recent venture for the founder
    let venture = session.stepData?.venture;
    
    if (!venture || !venture.ventureId) {
      // Fallback: get venture by founder ID from session
      const founderData = session.stepData?.founder;
      if (founderData?.founderId) {
        const ventures = await storage.getVenturesByFounderId(founderData.founderId);
        if (ventures && ventures.length > 0) {
          venture = ventures[0]; // Use most recent venture
        }
      }
    }

    if (!venture || !venture.ventureId) {
      throw new Error("Venture information missing - please complete the venture step first");
    }
    const teamMember = await storage.createTeamMember({
      ...memberData,
      ventureId: venture.ventureId,
    });

    // Send Slack notification for team member addition (async, no wait)
    if (eastEmblemAPI.isConfigured()) {
      eastEmblemAPI
        .sendSlackNotification(
          `\`Onboarding Id : ${sessionId}\`\n👤 Team Member Added - ${memberData.fullName} (${memberData.role})`,
          "#notifications",
          sessionId,
        )
        .catch((error) => {
          console.log("Failed to send team member addition notification:", error);
        });
    }

    return teamMember;
  }

  /**
   * Get team members
   */
  async getTeamMembers(sessionId: string) {
    const session = await this.getSession(sessionId);
    if (!session) {
      return [];
    }

    // Look for venture data in session or get most recent venture for the founder
    let venture = session.stepData?.venture;
    
    if (!venture || !venture.ventureId) {
      // Fallback: get venture by founder ID from session
      const founderData = session.stepData?.founder;
      if (founderData?.founderId) {
        const ventures = await storage.getVenturesByFounderId(founderData.founderId);
        if (ventures && ventures.length > 0) {
          venture = ventures[0]; // Use most recent venture
        }
      }
    }

    if (!venture || !venture.ventureId) {
      return [];
    }

    return await storage.getTeamMembersByVentureId(venture.ventureId);
  }

  /**
   * Update team member
   */
  async updateTeamMember(memberId: string, memberData: any) {
    return await storage.updateTeamMember(memberId, memberData);
  }

  /**
   * Delete team member
   */
  async deleteTeamMember(memberId: string) {
    return await storage.deleteTeamMember(memberId);
  }

  /**
   * Complete team step
   */
  async completeTeamStep(sessionId: string) {
    const session = await this.getSession(sessionId);
    if (!session) {
      throw new Error("Session not found");
    }

    await this.updateSession(sessionId, {
      currentStep: "upload",
      completedSteps: ["founder", "venture", "team"],
    });

    return { nextStep: "upload" };
  }

  /**
   * Handle document upload
   */
  async handleDocumentUpload(sessionId: string, file: any) {
    let session = await this.getSession(sessionId);
    if (!session) {
      // Try to find session by looking up venture with this sessionId as founderId
      const ventures = await storage.getVenturesByFounderId(sessionId);
      if (ventures.length > 0) {
        // Get the founder data to create a proper session context
        const founder = await storage.getFounder(sessionId);
        session = {
          sessionId,
          currentStep: 'upload',
          stepData: { 
            founder: founder ? { founderId: founder.founderId, ...founder } : { founderId: sessionId },
            venture: { ventureId: ventures[0].ventureId, ...ventures[0] },
            founderId: sessionId,
            ventureId: ventures[0].ventureId 
          },
          completedSteps: ['founder', 'venture', 'team'],
          isComplete: false
        };
      } else {
        throw new Error(`Session not found for ID: ${sessionId}`);
      }
    }

    const stepData = session.stepData || {};
    const venture = stepData.venture;
    if (!venture) {
      throw new Error("Venture step not completed");
    }

    // Ensure we have the file name - use the actual saved filename from multer
    const fileName = file.filename || file.originalname || 'uploaded_pitch_deck.pdf';
    console.log('Creating upload record with fileName:', fileName, 'originalname:', file.originalname, 'file object:', file);

    // Get the Overview folder ID for onboarding pitch decks
    let overviewFolderId = null;
    try {
      if (venture.ventureId) {
        const proofVaultRecords = await storage.getProofVaultsByVentureId(venture.ventureId);
        const overviewFolder = proofVaultRecords.find(pv => pv.folderName === '0_Overview');
        if (overviewFolder && overviewFolder.subFolderId) {
          overviewFolderId = overviewFolder.subFolderId;
          console.log(`📁 Mapping onboarding pitch deck to Overview folder: ${overviewFolderId}`);
          console.log(`📁 Venture ID: ${venture.ventureId}, ProofVault records:`, proofVaultRecords.length);
        } else {
          console.log(`⚠️ No Overview folder found in ProofVault. Available folders:`, proofVaultRecords.map(pv => pv.folderName));
        }
      } else {
        console.log('⚠️ No venture.ventureId available for folder mapping');
      }
    } catch (error) {
      console.log('Warning: Could not find Overview folder for venture:', venture.ventureId, error);
    }

    // Save upload to database
    const upload = await db
      .insert(documentUpload)
      .values({
        sessionId,
        ventureId: venture.ventureId, // Ensure venture ID is set
        fileName: fileName,
        originalName: file.originalname,
        filePath: file.path,
        fileSize: file.size,
        mimeType: file.mimetype,
        uploadStatus: 'pending',
        processingStatus: 'pending',
        folderId: overviewFolderId // Map to Overview folder
      })
      .returning();

    // Update session
    await this.updateSession(sessionId, {
      currentStep: "processing",
      stepData: {
        ...session.stepData,
        upload: upload[0],
      },
      completedSteps: [...session.completedSteps, "upload"],
    });

    // Send Slack notification for document upload (async, no wait)
    if (eastEmblemAPI.isConfigured()) {
      eastEmblemAPI
        .sendSlackNotification(
          `\`Onboarding Id : ${sessionId}\`\n📄 Document Uploaded - ${file.originalname} (${Math.round(file.size / 1024)}KB)`,
          "#notifications",
          sessionId,
        )
        .catch((error) => {
          console.log("Failed to send document upload notification:", error);
        });
    }

    return { upload: upload[0] };
  }

  /**
   * Submit for scoring
   */
  async submitForScoring(sessionId: string) {
    console.log(`[SCORING] Starting submitForScoring for session: ${sessionId}`);
    const session = await this.getSession(sessionId);
    if (!session) {
      throw new Error("Session not found");
    }
    console.log(`[SCORING] Session found, processing...`);

    const stepData = session.stepData || {};
    const upload = stepData.upload;
    const venture = stepData.venture;
    const folderStructure = stepData.folderStructure;
    
    if (!upload) {
      throw new Error("Document upload step not completed");
    }
    
    if (!venture) {
      throw new Error("Venture step not completed");
    }

    let scoringResult = null;

    // Check if we already have scoring results in session
    if (stepData.processing?.scoringResult) {
      console.log("Using existing scoring result from session");
      scoringResult = stepData.processing.scoringResult;
    } else if (eastEmblemAPI.isConfigured() && upload.filePath) {
      console.log(`[SCORING] Attempting to process file: ${upload.filePath}`);
      try {
        // Check if file still exists before trying to read it
        if (fs.existsSync(upload.filePath)) {
          console.log(`[SCORING] File exists, reading: ${upload.filePath}`);
          const fileBuffer = fs.readFileSync(upload.filePath);
          
          // Try to upload file to EastEmblem Box.com folder (0_Overview)
          // Use the folderId from upload record (which was set during handleDocumentUpload)
          const targetFolderId = upload.folderId || folderStructure?.folders?.["0_Overview"] || "overview";
          console.log("Uploading file to Box.com folder:");
          console.log("  - upload.folderId:", upload.folderId);
          console.log("  - session folderStructure['0_Overview']:", folderStructure?.folders?.["0_Overview"]);
          console.log("  - final targetFolderId:", targetFolderId);
          try {
            const uploadResult = await eastEmblemAPI.uploadFile(
              fileBuffer,
              upload.fileName,
              targetFolderId,
              sessionId,
              true // allowShare
            );
            console.log("Box.com upload result:", uploadResult);
            
            // Update document_upload record with EastEmblem response
            if (uploadResult) {
              const mimeType = getMimeTypeFromExtension(uploadResult.name || upload.fileName);
              
              await db
                .update(documentUpload)
                .set({
                  sharedUrl: uploadResult.url,           // Map url -> shared_url
                  folderId: uploadResult.folderId,       // Map folderId -> folder_id  
                  eastemblemFileId: uploadResult.id,     // Store Box.com file ID
                  fileSize: uploadResult.size || upload.fileSize, // Use Box.com size if available
                  mimeType: mimeType,                    // Extract from file extension
                  uploadStatus: 'completed',
                  processingStatus: 'processing'
                })
                .where(eq(documentUpload.uploadId, upload.uploadId));
              
              console.log("✓ Updated document record with EastEmblem upload data");
            }
          } catch (uploadError) {
            // If upload fails, continue with scoring anyway but ensure we have some basic info
            console.log("Box.com upload failed, proceeding with scoring:", uploadError.message);
            
            // Still update the upload status even if Box.com upload failed
            await db
              .update(documentUpload)
              .set({
                uploadStatus: 'completed',
                processingStatus: 'processing',
                // Keep the folderId that was set during initial creation
              })
              .where(eq(documentUpload.uploadId, upload.uploadId));
            
            console.log("✓ Updated document record status (without Box.com data)");
          }

          // Score the pitch deck (this is the main operation we need)
          console.log(`[SCORING] Calling EastEmblem API for scoring file: ${upload.fileName}`);
          console.log(`[SCORING] File buffer size: ${fileBuffer.length} bytes`);
          scoringResult = await eastEmblemAPI.scorePitchDeck(
            fileBuffer,
            upload.fileName,
            sessionId
          );
          console.log(`[SCORING] Received scoring result:`, scoringResult);

          // Validate scoring result against expected founder and venture names
          const expectedFounderName = stepData?.founder?.fullName;
          const expectedVentureName = stepData?.venture?.name;
          
          if (expectedFounderName || expectedVentureName) {
            console.log(`[SCORING] Validating result against expected names:`, {
              expectedFounderName,
              expectedVentureName,
              sessionId
            });
            
            const validationResult = this.validateScoringResponse(scoringResult, expectedFounderName, expectedVentureName);
            
            if (!validationResult.isValid) {
              console.log(`[SCORING] Validation failed:`, {
                sessionId,
                missingData: validationResult.missingData,
                message: validationResult.message
              });
              
              // Update document record with validation error
              await db
                .update(documentUpload)
                .set({
                  processingStatus: 'failed',
                  errorMessage: validationResult.message,
                  retryCount: (upload.retryCount || 0) + 1,
                  canRetry: true
                })
                .where(eq(documentUpload.uploadId, upload.uploadId));

              // Track upload attempt in session for start over workflow
              await this.trackUploadAttempt(sessionId);
              
              // Create validation error result
              scoringResult = {
                hasError: true,
                errorMessage: validationResult.message,
                errorType: 'validation_failed',
                canRetry: true,
                missingData: validationResult.missingData,
                statusCode: 400
              };
            } else {
              console.log(`[SCORING] Validation passed:`, {
                sessionId,
                expectedFounderName,
                expectedVentureName
              });
            }
          } else {
            console.log(`[SCORING] No validation performed - missing expected names:`, {
              sessionId,
              expectedFounderName,
              expectedVentureName
            });
          }
        } else {
          throw new Error("Uploaded file no longer exists - file may have been cleaned up");
        }
      } catch (error) {
        console.error("EastEmblem API error:", error);
        
        // Handle user action required errors (like image-based PDF)
        if (error instanceof Error && (error as any).isUserActionRequired) {
          console.log("User action required error detected, updating database with error state");
          
          // Update document record with error information
          await db
            .update(documentUpload)
            .set({
              processingStatus: 'error',
              errorMessage: error.message,
              retryCount: (upload.retryCount || 0), // Keep current retry count
              canRetry: true // Allow user to retry with different file
            })
            .where(eq(documentUpload.uploadId, upload.uploadId));

          // Track upload attempt in session for start over workflow
          await this.trackUploadAttempt(sessionId);
          
          // Create error result instead of throwing - this allows frontend to handle gracefully
          scoringResult = {
            hasError: true,
            errorMessage: error.message,
            errorType: 'user_action_required',
            canRetry: true,
            statusCode: (error as any).statusCode || 400
          };
        } else {
          // Check if this is a timeout/abort error and provide user-friendly message
          if (error instanceof Error && error.message.includes('taking longer than expected')) {
            throw error; // Pass through the user-friendly timeout message
          }
          
          throw new Error(`Analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
    } else if (!eastEmblemAPI.isConfigured()) {
      throw new Error("EastEmblem API is not configured. Please provide EASTEMBLEM_API_URL and EASTEMBLEM_API_KEY.");
    }

    // Only proceed with post-processing if scoring was successful (no error)
    if (scoringResult?.hasError) {
      console.log(`[SCORING] Scoring failed with error: ${scoringResult.errorMessage}`);
      
      // Return error result without any further processing
      const result = {
        scoringResult,
        hasError: true,
        errorMessage: scoringResult.errorMessage,
        canRetry: scoringResult.canRetry || false
      };
      
      console.log('Returning error result without generating reports:', JSON.stringify(result, null, 2));
      return result;
    }

    // Clean up uploaded file after successful analysis
    if (upload.filePath) {
      try {
        if (fs.existsSync(upload.filePath)) {
          fs.unlinkSync(upload.filePath);
          console.log(`✓ Analysis complete - cleaned up file: ${upload.fileName}`);
        }
      } catch (error) {
        console.error("File cleanup error:", error);
        // Don't fail the request for cleanup errors
      }
    }

    // Extract team members from scoring result and add to venture
    if (scoringResult?.output?.team && Array.isArray(scoringResult.output.team)) {
      const venture = stepData.venture?.venture || stepData.venture;
      if (venture?.ventureId) {
        console.log("Adding team members from analysis to venture:", venture.ventureId);
        
        // Check existing team members to avoid duplicates
        const existingMembers = await storage.getTeamMembersByVentureId(venture.ventureId);
        const existingNames = existingMembers.map(m => m.fullName.toLowerCase());
        
        for (const teamMember of scoringResult.output.team) {
          try {
            // Skip if team member already exists
            if (existingNames.includes(teamMember.name?.toLowerCase())) {
              console.log(`Skipping duplicate team member: ${teamMember.name}`);
              continue;
            }
            
            await storage.createTeamMember({
              ventureId: venture.ventureId,
              fullName: teamMember.name || 'Unknown',
              email: '', // Not provided in analysis
              role: teamMember.role || 'Team Member',
              linkedinProfile: '',
              isTechnical: teamMember.role?.toLowerCase().includes('cto') || teamMember.role?.toLowerCase().includes('tech'),
              experience: teamMember.experience || teamMember.background || '',
              background: teamMember.background || '',
              isCofounder: teamMember.role?.toLowerCase().includes('founder') || teamMember.role?.toLowerCase().includes('ceo'),
              age: null,
              gender: null,
              twitterUrl: '',
              instagramUrl: '',
              githubUrl: ''
            });
            console.log(`✓ Added team member: ${teamMember.name} (${teamMember.role})`);
            
            // Send Slack notification for team member from analysis (async, no wait)
            if (eastEmblemAPI.isConfigured()) {
              eastEmblemAPI
                .sendSlackNotification(
                  `\`Onboarding Id : ${sessionId}\`\n👤 Team Member Auto-Added from Analysis - ${teamMember.name} (${teamMember.role})`,
                  "#notifications",
                  sessionId,
                )
                .catch((error) => {
                  console.log("Failed to send auto team member notification:", error);
                });
            }
          } catch (error) {
            console.warn(`Failed to add team member ${teamMember.name}:`, error);
          }
        }
      }
    }

    // Update session as complete with scoring results
    await this.updateSession(sessionId, {
      currentStep: "complete",
      stepData: {
        ...session.stepData,
        scoringResult,
        processing: {
          scoringResult,
          isComplete: true
        }
      },
      completedSteps: [...session.completedSteps, "scoring"],
      isComplete: true,
    });

    // Create leaderboard entry after successful scoring
    if (scoringResult && venture) {
      try {
        const totalScore = scoringResult?.output?.total_score || scoringResult?.total_score || 0;
        const extractedTags = scoringResult?.output?.tags || [];
        
        // Extract dimension scores safely - map API categories to our 5 dimensions
        const dimensionScores = {
          desirability: (scoringResult?.output?.problem?.score || 0) + (scoringResult?.output?.market_opportunity?.score || 0),
          feasibility: (scoringResult?.output?.solution?.score || 0) + (scoringResult?.output?.product_technology?.score || 0),
          viability: (scoringResult?.output?.business_model?.score || 0) + (scoringResult?.output?.financials_projections_ask?.score || 0),
          traction: (scoringResult?.output?.traction?.score || 0) + (scoringResult?.output?.go_to_market_strategy?.score || 0),
          readiness: (scoringResult?.output?.readiness?.score || 0) + (scoringResult?.output?.team?.score || 0),
        };

        // Check if leaderboard entry already exists for this venture
        const existingEntry = await storage.getLeaderboardByVentureId(venture.ventureId);
        
        if (existingEntry) {
          // Update existing entry if new score is higher
          if (totalScore > existingEntry.totalScore) {
            await storage.updateLeaderboard(existingEntry.leaderboardId, {
              totalScore,
              proofTagsCount: Array.isArray(extractedTags) ? extractedTags.length : 0,
              dimensionScores,
              analysisDate: new Date(),
            });
            console.log(`✓ Updated leaderboard entry for ${venture.name} with higher score: ${totalScore}, ProofTags: ${Array.isArray(extractedTags) ? extractedTags.length : 0}`);
          }
        } else {
          // Create new leaderboard entry
          await storage.createLeaderboardEntry({
            ventureId: venture.ventureId,
            ventureName: venture.name,
            totalScore,
            proofTagsCount: Array.isArray(extractedTags) ? extractedTags.length : 0,
            dimensionScores,
            analysisDate: new Date(),
          });
          console.log(`✓ Created leaderboard entry for ${venture.name} with score: ${totalScore}, ProofTags: ${Array.isArray(extractedTags) ? extractedTags.length : 0}`);
        }

        // Store complete evaluation data in evaluation table
        try {
          await storage.createEvaluation({
            ventureId: venture.ventureId,
            evaluationDate: new Date().toISOString().split('T')[0], // YYYY-MM-DD format
            proofscore: totalScore,
            prooftags: extractedTags,
            // STORE COMPLETE API RESPONSE for rich insights and advanced ProofTag logic
            fullApiResponse: scoringResult, // Complete scoring API response
            dimensionScores: dimensionScores, // Mapped dimension scores for easy access
            folderId: folderStructure?.id || null,
            folderUrl: folderStructure?.url || null,
            isCurrent: true,
          });
          console.log(`✓ Created evaluation record for ${venture.name}`);
          
          // Generate certificate and report in background after successful evaluation
          console.log("Starting async certificate and report generation for venture:", venture.ventureId);
          (async () => {
            try {
              const { createCertificateForSession } = await import('../routes/certificate');
              const { createReportForSession } = await import('../routes/report');
              
              // Generate certificate
              const certificateResult = await createCertificateForSession(sessionId);
              if (certificateResult.success) {
                console.log("✓ Certificate generated successfully:", certificateResult.certificateUrl);
              } else {
                console.log("✗ Certificate generation failed:", certificateResult.error);
              }

              // Generate report
              const reportResult = await createReportForSession(sessionId);
              if (reportResult.success) {
                console.log("✓ Report generated successfully:", reportResult.reportUrl);
              } else {
                console.log("✗ Report generation failed:", reportResult.error);
              }

              // Send email notification if both certificate and report are successful OR if they already exist
              if (certificateResult.success && reportResult.success) {
                // Get fresh session data for email notification
                const freshSession = await this.getSession(sessionId);
                const freshStepData = freshSession?.stepData || {};
                await this.sendEmailNotification(sessionId, freshStepData, certificateResult.certificateUrl, reportResult.reportUrl);
              } else {
                // If certificate/report generation failed but files might already exist, try email with fallback URLs
                console.log("Certificate/report generation failed, attempting email with fallback URLs");
                const fallbackCertificateUrl = `https://app.box.com/s/${sessionId}_certificate`;
                const fallbackReportUrl = `https://app.box.com/s/${sessionId}_report`;
                
                try {
                  const freshSession = await this.getSession(sessionId);
                  const freshStepData = freshSession?.stepData || {};
                  await this.sendEmailNotification(sessionId, freshStepData, fallbackCertificateUrl, fallbackReportUrl);
                  console.log("✓ Email notification sent with fallback URLs");
                } catch (emailError) {
                  console.log("✗ Fallback email notification also failed:", emailError);
                }
              }
            } catch (error) {
              console.log("Async certificate/report generation failed for venture:", venture.name, error);
            }
          })();
            
        } catch (evaluationError) {
          console.error("Failed to create evaluation record:", evaluationError);
          // Don't fail the entire scoring process if evaluation creation fails
        }
      } catch (leaderboardError) {
        console.error("Failed to create leaderboard entry:", leaderboardError);
        // Don't fail the entire scoring process if leaderboard creation fails
      }
    }

    // Send Slack notification for scoring completion (async, no wait)
    if (eastEmblemAPI.isConfigured()) {
      const totalScore = scoringResult?.output?.total_score || scoringResult?.total_score || 0;
      eastEmblemAPI
        .sendSlackNotification(
          `\`Onboarding Id : ${sessionId}\`\n🎯 ProofScore Analysis Complete - Total Score: ${totalScore}/100`,
          "#notifications",
          sessionId,
        )
        .catch((error) => {
          console.log("Failed to send scoring completion notification:", error);
        });
    }

    // Don't provide fallback scoring data if there's an error
    const result = {
      scoringResult,
      sessionId,
      isComplete: scoringResult && !scoringResult.hasError, // Only complete if no error
    };
    
    console.log('Returning scoring result:', JSON.stringify(result, null, 2));
    return result;
  }

  /**
   * Send email notification after successful certificate and report generation
   */
  async sendEmailNotification(sessionId: string, stepData: any, certificateUrl?: string, reportUrl?: string) {
    try {
      console.log("Starting email notification process for session:", sessionId);
      
      // Extract founder and venture information  
      const founder = stepData.founder?.founder || stepData.founder;
      const venture = stepData.venture?.venture || stepData.venture;

      // Define base URL using environment variables (remove trailing slash)
      const baseUrl = (process.env.FRONTEND_URL || `https://${process.env.REPLIT_DOMAINS?.split(',')[0]}`).replace(/\/+$/, '');
      
      // Fetch certificate and report URLs from session state (generated during onboarding)
      let latestCertificateUrl = certificateUrl || stepData.processing?.certificateUrl;
      let latestReportUrl = reportUrl || stepData.processing?.reportUrl;
      
      console.log("URLs from session state:", {
        certificate: latestCertificateUrl,
        report: latestReportUrl,
        processing: stepData.processing
      });
      
      // If URLs not in session state, use server endpoints as fallback
      if (!latestCertificateUrl || !latestReportUrl) {
        latestCertificateUrl = latestCertificateUrl || `${baseUrl}/api/download/certificate?sessionId=${sessionId}`;
        latestReportUrl = latestReportUrl || `${baseUrl}/api/download/report?sessionId=${sessionId}`;
        console.log("Using fallback server endpoints for missing URLs");
      }
      
      console.log("Final URLs for email:", {
        certificate: latestCertificateUrl,
        report: latestReportUrl
      });

      // Extract founder name (handle both firstName and fullName formats)
      let founderName = 'Founder';
      
      if (founder?.firstName) {
        founderName = founder.firstName;
      } else if (founder?.fullName) {
        founderName = founder.fullName.split(' ')[0];
      } else if (founder?.name) {
        founderName = founder.name.split(' ')[0];
      }
      
      console.log("Email notification for founder:", founderName);

      // Validate required fields
      if (!founderName || !founder?.email || !venture?.name) {
        console.error("Missing required email fields:", {
          founderName,
          email: founder?.email,
          ventureName: venture?.name
        });
        return;
      }

      // Generate verification token and update founder record
      const { generateVerificationToken, generateTokenExpiry } = await import('../utils/auth');
      const verificationToken = generateVerificationToken();
      const tokenExpiry = generateTokenExpiry();
      
      // Update founder with verification token
      if (founder.founderId) {
        await storage.updateFounder(founder.founderId, {
          verificationToken,
          tokenExpiresAt: tokenExpiry,
          updatedAt: new Date()
        });
      }

      // Get actual score data from evaluation 
      let proofScore = 85;
      let scoreBreakdown = {
        desirability: 17,
        feasibility: 16,
        viability: 18,
        traction: 17,
        readiness: 17
      };

      if (venture?.ventureId) {
        try {
          const latestEvaluation = await storage.getLatestEvaluationByVentureId(venture.ventureId);
          if (latestEvaluation) {
            proofScore = latestEvaluation.proofscore;
            console.log("Using actual ProofScore from evaluation:", proofScore);
          }
        } catch (evalError) {
          console.log("Could not fetch evaluation data, using default score:", evalError);
        }
      }

      // Generate verification URL - try different format to bypass N8N URL replacement
      const verificationUrl = `${baseUrl}/api/auth/verify-email?token=${verificationToken}`;

      // Send email notification using new N8N webhook endpoint  
      console.log("🔗 Sending email with URLs:", {
        reportUrl: latestReportUrl,
        certificateUrl: latestCertificateUrl,
        verificationUrl: verificationUrl
      });
      
      const { emailService } = await import('./emailService');
      const emailResult = await emailService.sendOnboardingEmail(
        founder.email,
        founderName,
        proofScore,
        scoreBreakdown,
        [], // ProofTags will be populated from database by EmailService
        latestReportUrl,
        latestCertificateUrl,
        verificationUrl
      );
      console.log("✓ Email notification sent successfully via N8N webhook:", emailResult);

      // Send Slack notification about email sent (async, no wait)
      if (eastEmblemAPI.isConfigured()) {
        eastEmblemAPI
          .sendSlackNotification(
            `\`Onboarding Id : ${sessionId}\`\n📧 Welcome Email Sent to ${founderName} (${founder.email}) - ${venture.name}`,
            "#notifications",
            sessionId,
          )
          .catch((error) => {
            console.log("Failed to send email completion notification:", error);
          });
      }

    } catch (error) {
      console.error("Email notification failed:", error);
      // Don't fail the entire process if email fails - it's a nice-to-have feature
    }
  }

  /**
   * Retry scoring for a completed session
   */
  async retryScoring(sessionId: string, uploadData: any) {
    console.log(`🔄 Retrying scoring for session: ${sessionId}`);
    
    // Check if file still exists
    if (!fs.existsSync(uploadData.filePath)) {
      throw new Error("Original uploaded file no longer exists");
    }

    // Read the file
    const fileBuffer = fs.readFileSync(uploadData.filePath);
    
    // Get the scoring result by calling East Emblem API again
    const scoringResult = await eastEmblemAPI.scorePitchDeck(
      fileBuffer,
      uploadData.fileName,
      sessionId
    );

    // Update the session with new scoring result
    const session = await this.getSession(sessionId);
    await this.updateSession(sessionId, {
      stepData: {
        ...session.stepData,
        scoringResult,
        processing: {
          scoringResult
        }
      }
    });

    console.log(`✅ Scoring retry completed for session: ${sessionId}`);
    return scoringResult;
  }

  /**
   * Start Over Workflow Methods
   */

  /**
   * Check if user can start over (not exceeded max start-overs)
   */
  async canStartOver(sessionId: string): Promise<{ canStartOver: boolean; reason?: string; showContactSupport: boolean }> {
    const session = await this.getSession(sessionId);
    if (!session) {
      return { canStartOver: false, reason: "Session not found", showContactSupport: true };
    }

    // Check if start over is explicitly disabled
    if (session.startOverDisabled) {
      return { canStartOver: false, reason: "Start over disabled after maximum attempts", showContactSupport: true };
    }

    // Check start over count (max 1 start over allowed)
    const startOverCount = session.startOverCount || 0;
    if (startOverCount >= 1) {
      return { canStartOver: false, reason: "Maximum start over attempts reached", showContactSupport: true };
    }

    // Check upload attempt count (should be >= 3 to show start over)
    const uploadAttemptCount = session.uploadAttemptCount || 0;
    if (uploadAttemptCount < 3) {
      return { canStartOver: false, reason: "Not enough failed attempts to start over", showContactSupport: false };
    }

    return { canStartOver: true, showContactSupport: false };
  }

  /**
   * Track upload attempt (increment count)
   */
  async trackUploadAttempt(sessionId: string): Promise<void> {
    await db
      .update(onboardingSession)
      .set({
        uploadAttemptCount: sql`COALESCE(upload_attempt_count, 0) + 1`,
        updatedAt: new Date()
      })
      .where(eq(onboardingSession.sessionId, sessionId));
  }

  /**
   * Determine if upload failed 3 times and show start over
   */
  async getUploadStatus(sessionId: string): Promise<{ 
    uploadAttemptCount: number; 
    showStartOver: boolean; 
    showContactSupport: boolean;
    canStartOver: boolean;
  }> {
    const session = await this.getSession(sessionId);
    if (!session) {
      return { uploadAttemptCount: 0, showStartOver: false, showContactSupport: true, canStartOver: false };
    }

    const uploadAttemptCount = session.uploadAttemptCount || 0;
    const startOverCount = session.startOverCount || 0;
    const startOverDisabled = session.startOverDisabled || false;

    // Show start over if:
    // 1. Failed 3+ times
    // 2. Haven't used start over yet (max 1)
    // 3. Start over not disabled
    const showStartOver = uploadAttemptCount >= 3 && startOverCount === 0 && !startOverDisabled;

    // Show contact support if:
    // 1. Start over disabled, OR
    // 2. Already used start over once and failed again
    const showContactSupport = startOverDisabled || (startOverCount >= 1 && uploadAttemptCount >= 6);

    const canStartOver = showStartOver;

    return {
      uploadAttemptCount,
      showStartOver,
      showContactSupport,
      canStartOver
    };
  }

  /**
   * Execute start over - reset session while preserving attempt history
   */
  async executeStartOver(sessionId: string, founderEmail: string): Promise<{ newSessionId: string; message: string }> {
    const oldSession = await this.getSession(sessionId);
    if (!oldSession) {
      throw new Error("Session not found");
    }

    // Check if start over is allowed
    const { canStartOver, reason } = await this.canStartOver(sessionId);
    if (!canStartOver) {
      throw new Error(reason || "Start over not allowed");
    }

    // Increment start over count and preserve attempt history
    const newUploadAttemptCount = (oldSession.uploadAttemptCount || 0);
    const newStartOverCount = (oldSession.startOverCount || 0) + 1;
    
    // Disable start over if this is the second time (after first start over)
    const shouldDisableStartOver = newStartOverCount >= 1;

    // Create a new session for start over (clean slate approach)
    const newSessionId = crypto.randomUUID();
    
    // Update old session to mark it as abandoned but preserve attempt tracking
    await db
      .update(onboardingSession)
      .set({
        startOverCount: newStartOverCount,
        startOverDisabled: shouldDisableStartOver,
        founderEmail: founderEmail,
        updatedAt: new Date(),
        isComplete: false
      })
      .where(eq(onboardingSession.sessionId, sessionId));

    // Create new fresh session with preserved attempt counts
    await db
      .insert(onboardingSession)
      .values({
        sessionId: newSessionId,
        currentStep: "founder",
        stepData: {},
        completedSteps: [],
        isComplete: false,
        uploadAttemptCount: newUploadAttemptCount,
        startOverCount: newStartOverCount,
        startOverDisabled: shouldDisableStartOver,
        founderEmail: founderEmail,
        founderId: null,
        createdAt: new Date(),
        updatedAt: new Date()
      });

    return { 
      newSessionId: newSessionId, // Return new session ID
      message: `Start over initiated with fresh session. You have ${3 - newUploadAttemptCount} remaining attempts before requiring support contact.`
    };
  }

  /**
   * Check if email can be reused during start over
   */
  async canReuseEmail(email: string, sessionId?: string): Promise<{ canReuse: boolean; reason?: string }> {
    // Look for existing founder with this email
    const existingFounder = await db
      .select()
      .from(founder)
      .where(eq(founder.email, email))
      .limit(1);

    if (existingFounder.length === 0) {
      return { canReuse: true }; // Email not in use
    }

    // Check if there's an incomplete onboarding session for this email
    const incompleteSession = await db
      .select()
      .from(onboardingSession)
      .where(
        and(
          eq(onboardingSession.founderEmail, email),
          eq(onboardingSession.isComplete, false)
        )
      )
      .limit(1);

    if (incompleteSession.length > 0) {
      // If this is the same session ID, allow reuse
      if (sessionId && incompleteSession[0].sessionId === sessionId) {
        return { canReuse: true };
      }
      // Otherwise, allow reuse since onboarding is incomplete
      return { canReuse: true, reason: "Email associated with incomplete onboarding - allowing reuse" };
    }

    // Check if this is a start over session by looking for sessions with this email
    if (sessionId) {
      // Check if current session is a start over session (has startOverCount > 0)
      const currentSession = await db
        .select()
        .from(onboardingSession)
        .where(eq(onboardingSession.sessionId, sessionId))
        .limit(1);

      if (currentSession.length > 0) {
        const session = currentSession[0];
        // Allow reuse if this is a start over session
        if (session.startOverCount && session.startOverCount > 0) {
          return { canReuse: true, reason: "Email reuse allowed during start over workflow" };
        }
        
        // Check if the session has the same founder email (start over in progress)
        if (session.founderEmail === email) {
          return { canReuse: true, reason: "Email matches current start over session" };
        }
      }

      // Also check if there are any start over sessions for this email
      const startOverSession = await db
        .select()
        .from(onboardingSession)
        .where(
          and(
            eq(onboardingSession.founderEmail, email),
            sql`start_over_count > 0`
          )
        )
        .limit(1);

      if (startOverSession.length > 0) {
        return { canReuse: true, reason: "Email associated with start over workflow - allowing reuse" };
      }
    }

    return { canReuse: false, reason: "Email already associated with completed founder profile" };
  }
}

export const onboardingService = new OnboardingService();