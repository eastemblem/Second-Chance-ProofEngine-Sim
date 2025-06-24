import { Request } from "express";
import { storage } from "../storage";
import { eastEmblemAPI } from "../eastemblem-api";
import { getSessionId, getSessionData, updateSessionData } from "../utils/session-manager";
import { db } from "../db";
import { onboardingSession, documentUpload } from "@shared/schema";
import { eq } from "drizzle-orm";
import fs from "fs";
import crypto from "crypto";

export class OnboardingService {
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
   * Complete founder onboarding step
   */
  async completeFounderStep(sessionId: string | null, founderData: any) {
    if (!sessionId) {
      sessionId = crypto.randomUUID();
    }

    // Check if founder exists by email
    let founder = await storage.getFounderByEmail(founderData.email);
    
    if (!founder) {
      // Create new founder
      founder = await storage.createFounder(founderData);
    }

    // Update session with founder data and ID
    const founderId = founder.founderId;
    
    if (!founderId) {
      throw new Error("Failed to create founder - no ID returned");
    }
    
    // Store founder ID separately for reliable access
    await this.updateSession(sessionId, {
      currentStep: "venture",
      stepData: { 
        founder: founder,
        founderId: founderId,
      },
      completedSteps: ["founder"],
    });

    // Send Slack notification for founder step completion (async, no wait)
    if (eastEmblemAPI.isConfigured()) {
      eastEmblemAPI
        .sendSlackNotification(
          `\`Onboarding Id : ${sessionId}\`\n👤 Founder Profile Completed - ${founder.fullName} (${founder.email})`,
          "#notifications",
          sessionId,
        )
        .catch((error) => {
          console.log("Failed to send founder completion notification:", error);
        });
    }

    return {
      sessionId,
      founderId: founder.founderId,
      founder,
    };
  }

  /**
   * Complete venture onboarding step
   */
  async completeVentureStep(sessionId: string, ventureData: any) {
    const session = await this.getSession(sessionId);
    
    if (!session) {
      throw new Error("Session not found - founder step must be completed first");
    }

    const founderData = session.stepData?.founder;
    const founderId = session.stepData?.founderId || founderData?.founderId;
    
    if (!founderData) {
      throw new Error("Founder step not completed");
    }

    if (!founderId) {
      throw new Error("Founder ID not found in session data - founder step may not have completed properly");
    }
    
    // Map productStatus to mvpStatus for database schema compatibility
    const ventureForDb = {
      ...ventureData,
      founderId: founderId,
      mvpStatus: ventureData.productStatus || ventureData.mvpStatus,
    };
    
    const venture = await storage.createVenture(ventureForDb);

    // Create folder structure with EastEmblem API
    let folderStructure = null;
    if (eastEmblemAPI.isConfigured()) {
      try {
        folderStructure = await eastEmblemAPI.createFolderStructure(
          venture.name, 
          sessionId
        );
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
    const session = await this.getSession(sessionId);
    if (!session) {
      throw new Error("Session not found");
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
      throw new Error("Venture step not completed or venture ID missing");
    }
    const teamMember = await storage.createTeamMember({
      ...memberData,
      ventureId: venture.ventureId,
    });

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
    const session = await this.getSession(sessionId);
    if (!session) {
      throw new Error("Session not found");
    }

    const stepData = session.stepData || {};
    const venture = stepData.venture;
    if (!venture) {
      throw new Error("Venture step not completed");
    }

    // Save upload to database
    const upload = await db
      .insert(documentUpload)
      .values({
        sessionId,
        fileName: file.originalname,
        filePath: file.path,
        fileSize: file.size,
        mimeType: file.mimetype,
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
    const session = await this.getSession(sessionId);
    if (!session) {
      throw new Error("Session not found");
    }

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

    // Process with EastEmblem API if configured
    if (eastEmblemAPI.isConfigured() && upload.filePath) {
      try {
        const fileBuffer = fs.readFileSync(upload.filePath);
        
        // Upload file to EastEmblem
        await eastEmblemAPI.uploadFile(
          fileBuffer,
          upload.fileName,
          folderStructure?.folders?.["6_Investor_Pack"] || "investor-pack",
          sessionId
        );

        // Score the pitch deck
        scoringResult = await eastEmblemAPI.scorePitchDeck(
          fileBuffer,
          upload.fileName,
          sessionId
        );
      } catch (error) {
        console.warn("EastEmblem API error:", error);
      }
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

    // Update session as complete
    await this.updateSession(sessionId, {
      currentStep: "complete",
      stepData: {
        ...session.stepData,
        scoringResult,
      },
      completedSteps: [...session.completedSteps, "scoring"],
      isComplete: true,
    });

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

    return {
      scoringResult,
      sessionId,
      isComplete: true,
    };
  }
}

export const onboardingService = new OnboardingService();