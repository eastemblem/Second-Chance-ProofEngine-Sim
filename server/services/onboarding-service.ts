import { Request } from "express";
import { storage } from "../storage";
import { eastEmblemAPI } from "../eastemblem-api";
import { getSessionId, getSessionData, updateSessionData } from "../utils/session-manager";
import { db } from "../db";
import { onboardingSession, documentUpload } from "@shared/schema";
import { eq } from "drizzle-orm";
import fs from "fs";

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
      sessionId = `onb_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    // Check if founder exists by email
    let founder = await storage.getFounderByEmail(founderData.email);
    
    if (!founder) {
      // Create new founder
      founder = await storage.createFounder(founderData);
    }

    // Update session
    await this.updateSession(sessionId, {
      currentStep: "venture",
      stepData: { founder },
      completedSteps: ["founder"],
    });

    return {
      sessionId,
      founderId: founder.id,
      founder,
    };
  }

  /**
   * Complete venture onboarding step
   */
  async completeVentureStep(sessionId: string, ventureData: any) {
    const session = await this.getSession(sessionId);
    if (!session) {
      throw new Error("Session not found");
    }

    const founderData = session.stepData?.founder;
    if (!founderData) {
      throw new Error("Founder step not completed");
    }

    // Create venture
    const venture = await storage.createVenture({
      ...ventureData,
      founderId: founderData.id,
    });

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

    return { venture, folderStructure };
  }

  /**
   * Handle document upload
   */
  async handleDocumentUpload(sessionId: string, file: any) {
    const session = await this.getSession(sessionId);
    if (!session) {
      throw new Error("Session not found");
    }

    const venture = session.stepData?.venture;
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

    const { upload, venture, folderStructure } = session.stepData;
    if (!upload || !venture) {
      throw new Error("Required onboarding steps not completed");
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

    return {
      scoringResult,
      sessionId,
      isComplete: true,
    };
  }
}

export const onboardingService = new OnboardingService();