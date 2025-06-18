import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { storage } from "./storage";
import { db } from "./db";
import { onboardingSession, founder, venture, teamMember, documentUpload, type OnboardingSession, type InsertOnboardingSession, type DocumentUpload, type InsertDocumentUpload } from "@shared/schema";
import { eq, and } from "drizzle-orm";
import { eastEmblemAPI } from "./eastemblem-api";

// Validation schemas for each onboarding step
export const founderOnboardingSchema = z.object({
  fullName: z.string().min(1, "Full name is required"),
  email: z.string().email("Invalid email address"),
  positionRole: z.string().min(1, "Position/role is required"),
  age: z.number().optional(),
  linkedinProfile: z.string().optional(),
  gender: z.string().optional(),
  personalLinkedin: z.string().optional(),
  residence: z.string().optional(),
  isTechnical: z.boolean().default(false),
});

export const ventureOnboardingSchema = z.object({
  name: z.string().min(1, "Venture name is required"),
  industry: z.string().min(1, "Industry is required"),
  geography: z.string().min(1, "Geography is required"),
  businessModel: z.string().min(1, "Business model is required"),
  revenueStage: z.enum(["None", "Pre-Revenue", "Early Revenue", "Scaling"]),
  mvpStatus: z.enum(["Mockup", "Prototype", "Launched"]),
  website: z.string().optional().transform(val => val === "" ? undefined : val),
  marketSize: z.string().optional().transform(val => val === "" ? undefined : val),
  valuation: z.string().optional().transform(val => val === "" ? undefined : val),
  pilotsPartnerships: z.string().optional().transform(val => val === "" ? undefined : val),
  customerDiscoveryCount: z.number().or(z.string().transform(val => val === "" ? 0 : Number(val))).default(0),
  userSignups: z.number().or(z.string().transform(val => val === "" ? 0 : Number(val))).default(0),
  lois: z.number().or(z.string().transform(val => val === "" ? 0 : Number(val))).default(0),
  hasTestimonials: z.boolean().default(false),
  description: z.string().min(1, "Startup description is required"),
  linkedinUrl: z.string().optional().transform(val => val === "" ? undefined : val),
  twitterUrl: z.string().optional().transform(val => val === "" ? undefined : val),
  instagramUrl: z.string().optional().transform(val => val === "" ? undefined : val),
});

export const teamMemberSchema = z.object({
  fullName: z.string().min(1, "Full name is required"),
  email: z.string().email("Invalid email address"),
  role: z.string().min(1, "Role is required"),
  experience: z.string().min(1, "Experience is required"),
  linkedinProfile: z.string().optional(),
  background: z.string().optional(),
  isCofounder: z.boolean().default(false),
});

// Onboarding session management
export class OnboardingManager {
  // Initialize or resume session
  async initializeSession(req: Request): Promise<string> {
    // Create new session directly since we're not using express-session
    const [newSession] = await db
      .insert(onboardingSession)
      .values({
        currentStep: "founder",
        stepData: {},
        completedSteps: [],
        isComplete: false,
      })
      .returning();

    console.log("Created new onboarding session:", newSession.sessionId);
    return newSession.sessionId;
  }

  // Get session data
  async getSession(sessionId: string) {
    const [session] = await db
      .select()
      .from(onboardingSession)
      .where(eq(onboardingSession.sessionId, sessionId));
    
    return session;
  }

  // Update session step and data
  async updateSession(
    sessionId: string, 
    step: string, 
    data: any, 
    markCompleted: boolean = false
  ) {
    const session = await this.getSession(sessionId);
    if (!session) throw new Error("Session not found");

    const stepData = session.stepData || {};
    const updatedStepData = { ...stepData, [step]: data };
    const completedSteps = Array.isArray(session.completedSteps) 
      ? session.completedSteps 
      : [];
    
    if (markCompleted && !completedSteps.includes(step)) {
      completedSteps.push(step);
    }

    await db
      .update(onboardingSession)
      .set({
        stepData: updatedStepData,
        completedSteps,
        currentStep: step,
        updatedAt: new Date(),
      })
      .where(eq(onboardingSession.sessionId, sessionId));
  }

  // Complete founder onboarding step
  async completeFounderStep(sessionId: string, founderData: any) {
    console.log("Completing founder step for session:", sessionId);
    
    // Check if session exists first
    const session = await this.getSession(sessionId);
    if (!session) {
      console.error("Session not found:", sessionId);
      throw new Error("Session not found");
    }
    
    // Validate data
    const validatedData = founderOnboardingSchema.parse(founderData);
    
    // Create or update founder
    let founderId: string;
    const existingFounder = await storage.getFounderByEmail(validatedData.email);
    
    if (existingFounder) {
      await storage.updateFounder(existingFounder.founderId, validatedData);
      founderId = existingFounder.founderId;
    } else {
      const newFounder = await storage.createFounder(validatedData);
      founderId = newFounder.founderId;
    }

    // Update session with founder ID
    await db
      .update(onboardingSession)
      .set({ founderId })
      .where(eq(onboardingSession.sessionId, sessionId));

    // Update session progress
    await this.updateSession(sessionId, "founder", validatedData, true);
    
    console.log("Founder step completed successfully for session:", sessionId);
    return founderId;
  }

  // Complete venture onboarding step
  async completeVentureStep(sessionId: string, ventureData: any) {
    const session = await this.getSession(sessionId);
    if (!session?.founderId) throw new Error("Founder step not completed");

    // Validate data
    const validatedData = ventureOnboardingSchema.parse(ventureData);
    
    // Create venture
    const venture = await storage.createVenture({
      ...validatedData,
      founderId: session.founderId,
    });

    // Create folder structure via EastEmblem API
    let folderStructure = null;
    if (eastEmblemAPI.isConfigured()) {
      try {
        folderStructure = await eastEmblemAPI.createFolderStructure(
          validatedData.name
        );

        // Create proof vault entries for each folder
        if (folderStructure && folderStructure.folders) {
          const folderMappings: Array<{ key: keyof typeof folderStructure.folders; type: 'Pitch Deck' | 'Metrics Dashboard' | 'Demo Video' | 'Product Screenshot' | 'Customer Testimonial' | 'Technical Documentation' | 'Financial Model'; name: string; description: string }> = [
            { key: '0_Overview', type: 'Pitch Deck', name: 'Overview', description: 'Company overview and general information' },
            { key: '1_Problem_Proof', type: 'Technical Documentation', name: 'Problem Proof', description: 'Evidence of problem validation' },
            { key: '2_Solution_Proof', type: 'Demo Video', name: 'Solution Proof', description: 'Solution validation and proof of concept' },
            { key: '3_Demand_Proof', type: 'Metrics Dashboard', name: 'Demand Proof', description: 'Market demand validation' },
            { key: '4_Credibility_Proof', type: 'Customer Testimonial', name: 'Credibility Proof', description: 'Team and company credibility evidence' },
            { key: '5_Commercial_Proof', type: 'Financial Model', name: 'Commercial Proof', description: 'Commercial viability and business model proof' },
            { key: '6_Investor_Pack', type: 'Product Screenshot', name: 'Investor Pack', description: 'Investor presentation materials' }
          ];

          for (const folder of folderMappings) {
            const subFolderId = folderStructure.folders[folder.key];
            if (subFolderId) {
              await storage.createProofVault({
                ventureId: venture.ventureId,
                artefactType: folder.type,
                parentFolderId: folderStructure.id,
                subFolderId: subFolderId,
                sharedUrl: folderStructure.url,
                folderName: folder.name,
                description: folder.description
              });
            }
          }
        }
      } catch (error) {
        console.error("Failed to create folder structure:", error);
      }
    }

    // Update session progress
    await this.updateSession(sessionId, "team", { ventureId: venture.ventureId, folderStructure }, false);
    await this.updateSession(sessionId, "venture", { ...validatedData, ventureId: venture.ventureId }, true);

    return { venture, folderStructure };
  }

  // Add team member
  async addTeamMember(sessionId: string, memberData: any) {
    const session = await this.getSession(sessionId);
    const stepData = session?.stepData as any;
    const ventureId = stepData?.venture?.ventureId || stepData?.team?.ventureId;
    
    if (!ventureId) throw new Error("Venture step not completed");

    // Validate data
    const validatedData = teamMemberSchema.parse(memberData);
    
    // Create team member
    const newTeamMember = await storage.createTeamMember({
      ...validatedData,
      ventureId,
    });

    return newTeamMember;
  }

  // Get team members for session
  async getTeamMembers(sessionId: string) {
    const session = await this.getSession(sessionId);
    const stepData = session?.stepData as any;
    const ventureId = stepData?.venture?.ventureId || stepData?.team?.ventureId;
    
    if (!ventureId) return [];

    return await storage.getTeamMembersByVentureId(ventureId);
  }

  // Complete team step
  async completeTeamStep(sessionId: string) {
    const teamMembers = await this.getTeamMembers(sessionId);
    
    if (teamMembers.length < 3) {
      throw new Error("Minimum 3 team members required");
    }

    // Update session progress
    await this.updateSession(sessionId, "upload", {}, false);
    await this.updateSession(sessionId, "team", { teamMembers }, true);

    return teamMembers;
  }

  // Handle document upload
  async handleDocumentUpload(sessionId: string, file: any) {
    const session = await this.getSession(sessionId);
    const stepData = session?.stepData as any;
    const ventureId = stepData?.venture?.ventureId || stepData?.team?.ventureId;
    
    if (!ventureId) throw new Error("Venture step not completed");

    // Save upload record
    const [upload] = await db
      .insert(documentUpload)
      .values({
        sessionId,
        ventureId,
        fileName: file.filename,
        originalName: file.originalname,
        filePath: file.path,
        fileSize: file.size,
        mimeType: file.mimetype,
        uploadStatus: "completed",
        processingStatus: "pending",
      })
      .returning();

    // Update session progress
    await this.updateSession(sessionId, "processing", { uploadId: upload.uploadId }, false);
    await this.updateSession(sessionId, "upload", { upload }, true);

    return upload;
  }

  // Submit for scoring
  async submitForScoring(sessionId: string) {
    const session = await this.getSession(sessionId);
    const stepData = session?.stepData as any;
    
    // Get all required data
    const upload = stepData?.upload?.upload;
    const venture = stepData?.venture;
    const folderStructure = stepData?.venture?.folderStructure;
    
    if (!upload || !venture) {
      throw new Error("Required onboarding steps not completed");
    }

    let scoringResult = null;
    
    // Process with EastEmblem API if configured
    if (eastEmblemAPI.isConfigured() && upload.filePath) {
      try {
        // Upload file to EastEmblem
        const fs = require('fs');
        const fileBuffer = fs.readFileSync(upload.filePath);
        
        const uploadResult = await eastEmblemAPI.uploadFile(
          fileBuffer,
          upload.originalName,
          folderStructure?.folders?.["0_Overview"] || folderStructure?.id
        );

        // Update upload record with EastEmblem file ID
        await db
          .update(documentUpload)
          .set({ 
            eastemblemFileId: uploadResult.id,
            processingStatus: "uploaded"
          })
          .where(eq(documentUpload.uploadId, upload.uploadId));

        // Score the pitch deck
        scoringResult = await eastEmblemAPI.scorePitchDeck(fileBuffer, upload.originalName);
        
        // Update processing status
        await db
          .update(documentUpload)
          .set({ processingStatus: "scored" })
          .where(eq(documentUpload.uploadId, upload.uploadId));

      } catch (error) {
        console.error("EastEmblem API error:", error);
        
        // Update processing status to error  
        if (upload.uploadId) {
          await db
            .update(documentUpload)
            .set({ processingStatus: "error" })
            .where(eq(documentUpload.uploadId, upload.uploadId));
        }
      }
    }

    // Mark session as complete
    await db
      .update(onboardingSession)
      .set({ 
        isComplete: true,
        updatedAt: new Date()
      })
      .where(eq(onboardingSession.sessionId, sessionId));

    // Update final session data
    await this.updateSession(sessionId, "complete", { 
      scoringResult, 
      completedAt: new Date() 
    }, true);

    return {
      session,
      scoringResult,
      folderStructure,
      venture: stepData?.venture,
      founder: stepData?.founder,
      teamMembers: stepData?.team?.teamMembers || [],
      upload
    };
  }
}

export const onboardingManager = new OnboardingManager();