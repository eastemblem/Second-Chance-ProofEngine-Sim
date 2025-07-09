import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import fs from "fs";
import { storage } from "./storage";
import { db } from "./db";
import {
  onboardingSession,
  founder,
  venture,
  teamMember,
  documentUpload,
  type OnboardingSession,
  type InsertOnboardingSession,
  type DocumentUpload,
  type InsertDocumentUpload,
} from "@shared/schema";
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
  productStatus: z.enum(["Mockup", "Prototype", "Launched"]),
  website: z
    .string()
    .optional()
    .transform((val) => (val === "" ? undefined : val)),
  hasTestimonials: z.boolean().default(false),
  description: z.string().min(1, "Startup description is required"),
  linkedinUrl: z
    .string()
    .optional()
    .transform((val) => (val === "" ? undefined : val)),
  twitterUrl: z
    .string()
    .optional()
    .transform((val) => (val === "" ? undefined : val)),
  instagramUrl: z
    .string()
    .optional()
    .transform((val) => (val === "" ? undefined : val)),
});

export const teamMemberSchema = z.object({
  fullName: z.string().min(1, "Full name is required"),
  email: z.string().email("Invalid email address"),
  role: z.string().min(1, "Role is required"),
  experience: z.string().min(1, "Experience is required"),
  linkedinProfile: z
    .string()
    .optional()
    .transform((val) => (val === "" ? undefined : val)),
  background: z
    .string()
    .optional()
    .transform((val) => (val === "" ? undefined : val)),
  twitterUrl: z
    .string()
    .optional()
    .transform((val) => (val === "" ? undefined : val)),
  instagramUrl: z
    .string()
    .optional()
    .transform((val) => (val === "" ? undefined : val)),
  githubUrl: z
    .string()
    .optional()
    .transform((val) => (val === "" ? undefined : val)),
  age: z
    .number()
    .or(z.string().transform((val) => (val === "" ? undefined : Number(val))))
    .optional(),
  gender: z
    .string()
    .optional()
    .transform((val) => (val === "" ? undefined : val)),
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

    // Send Slack notification for session start (async, no wait)
    if (eastEmblemAPI.isConfigured()) {
      eastEmblemAPI
        .sendSlackNotification(
          `\`Onboarding Id : ${newSession.sessionId}\`\nℹ️ Started Onboarding !`,
          "#notifications",
          newSession.sessionId,
        )
        .catch((error) => {
          console.log("Failed to send session start notification:", error);
        });
    }

    return newSession.sessionId;
  }

  // Get session data
  async getSession(sessionId: string) {
    try {
      const [session] = await db
        .select()
        .from(onboardingSession)
        .where(eq(onboardingSession.sessionId, sessionId));

      return session || null;
    } catch (error) {
      console.error("Error getting session:", error);
      return null;
    }
  }

  // Update session step and data
  async updateSession(
    sessionId: string,
    step: string,
    data: any,
    markCompleted: boolean = false,
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

    // Check if session exists first, create if not
    let session = await this.getSession(sessionId);
    if (!session) {
      console.log(
        "Session not found, creating new session with provided ID:",
        sessionId,
      );
      try {
        // Use the provided sessionId instead of generating a new one
        const [newSession] = await db
          .insert(onboardingSession)
          .values({
            sessionId: sessionId, // Use the provided sessionId
            currentStep: "founder",
            isComplete: false,
            stepData: {},
          })
          .returning();

        session = newSession;
      } catch (error) {
        console.error("Error creating session:", error);
        throw new Error("Failed to create session");
      }
    }

    // Validate data
    const validatedData = founderOnboardingSchema.parse(founderData);

    // Create or update founder
    let founderId: string;
    const existingFounder = await storage.getFounderByEmail(
      validatedData.email,
    );

    if (existingFounder) {
      await storage.updateFounder(existingFounder.founderId, validatedData);
      founderId = existingFounder.founderId;
    } else {
      try {
        const newFounder = await storage.createFounder(validatedData);
        founderId = newFounder.founderId;
      } catch (error: any) {
        // Handle any creation errors
        console.error("Error creating founder:", error);
        throw error;
      }
    }

    // Update session with founder ID
    await db
      .update(onboardingSession)
      .set({ founderId })
      .where(eq(onboardingSession.sessionId, sessionId));

    // Update session progress
    await this.updateSession(sessionId, "founder", validatedData, true);

    console.log("Founder step completed successfully for session:", sessionId);

    // Send Slack notification for founder step completion (async, no wait)
    if (eastEmblemAPI.isConfigured()) {
      eastEmblemAPI
        .sendSlackNotification(
          `\`Onboarding Id : ${sessionId}\`\n✅ Founder Details Completed - ${validatedData.fullName}`,
          "#notifications",
          sessionId,
        )
        .catch((error) => {
          console.log("Failed to send founder completion notification:", error);
        });
    }

    return { sessionId, founderId };
  }

  // Complete venture onboarding step
  async completeVentureStep(sessionId: string, inputData: any) {
    console.log("Completing venture step for session:", sessionId);
    const session = await this.getSession(sessionId);
    if (!session) {
      console.log("Session not found for ID:", sessionId);
      throw new Error("Session not found");
    }
    if (!session.founderId) {
      console.log("Session data:", session);
      throw new Error("Founder step not completed - no founderId in session");
    }

    // Validate data
    const validatedData = ventureOnboardingSchema.parse(inputData);

    // Create venture with mapped fields
    const venture = await storage.createVenture({
      founderId: session.founderId,
      name: validatedData.name,
      description: validatedData.description,
      industry: validatedData.industry,
      geography: validatedData.geography,
      businessModel: validatedData.businessModel,
      revenueStage: validatedData.revenueStage,
      mvpStatus: validatedData.productStatus, // Map productStatus to mvpStatus
      website: validatedData.website,
      hasTestimonials: validatedData.hasTestimonials,
      linkedinUrl: validatedData.linkedinUrl,
      twitterUrl: validatedData.twitterUrl,
      instagramUrl: validatedData.instagramUrl,
    });

    // Create folder structure via EastEmblem API
    let folderStructure = null;
    if (eastEmblemAPI.isConfigured()) {
      try {
        folderStructure = await eastEmblemAPI.createFolderStructure(
          validatedData.name,
          sessionId,
        );

        // Create proof vault entries for each folder
        if (folderStructure && folderStructure.folders) {
          const folderMappings: Array<{
            key: keyof typeof folderStructure.folders;
            type:
              | "Pitch Deck"
              | "Metrics Dashboard"
              | "Demo Video"
              | "Product Screenshot"
              | "Customer Testimonial"
              | "Technical Documentation"
              | "Financial Model";
            name: string;
            description: string;
          }> = [
            {
              key: "0_Overview",
              type: "Pitch Deck",
              name: "Overview",
              description: "Company overview and general information",
            },
            {
              key: "1_Problem_Proof",
              type: "Technical Documentation",
              name: "Problem Proof",
              description: "Evidence of problem validation",
            },
            {
              key: "2_Solution_Proof",
              type: "Demo Video",
              name: "Solution Proof",
              description: "Solution validation and proof of concept",
            },
            {
              key: "3_Demand_Proof",
              type: "Metrics Dashboard",
              name: "Demand Proof",
              description: "Market demand validation",
            },
            {
              key: "4_Credibility_Proof",
              type: "Customer Testimonial",
              name: "Credibility Proof",
              description: "Team and company credibility evidence",
            },
            {
              key: "5_Commercial_Proof",
              type: "Financial Model",
              name: "Commercial Proof",
              description: "Commercial viability and business model proof",
            },
            {
              key: "6_Investor_Pack",
              type: "Product Screenshot",
              name: "Investor Pack",
              description: "Investor presentation materials",
            },
          ];

          console.log(`Creating ${folderMappings.length} proof vault entries for venture ${venture.ventureId}`);
          
          for (const folder of folderMappings) {
            const subFolderId = folderStructure.folders[folder.key];
            if (subFolderId) {
              try {
                const proofVaultEntry = await storage.createProofVault({
                  ventureId: venture.ventureId,
                  artefactType: folder.type,
                  parentFolderId: folderStructure.id,
                  subFolderId: subFolderId,
                  sharedUrl: folderStructure.url,
                  folderName: folder.name,
                  description: folder.description,
                });
                console.log(`✓ Created proof vault entry for ${folder.name}: ${proofVaultEntry.vaultId}`);
              } catch (proofVaultError) {
                console.error(`✗ Failed to create proof vault entry for ${folder.name}:`, proofVaultError);
              }
            } else {
              console.warn(`⚠ Missing subFolderId for ${folder.key} in folder structure`);
            }
          }
          
          console.log('Completed proof vault entries creation');
        }
      } catch (error) {
        console.error("Failed to create folder structure or proof vault entries:", error);
        // Still continue with venture creation even if folder structure fails
      }
    }

    // Update session with venture data and folderStructure
    await this.updateSession(
      sessionId,
      "venture",
      {
        ...validatedData,
        venture: venture,
        ventureId: venture.ventureId,
        folderStructure,
      },
      true,
    );

    // Store folderStructure at session root level for easy access
    const currentSession = await this.getSession(sessionId);
    const [updatedSession] = await db
      .update(onboardingSession)
      .set({
        stepData: currentSession.stepData,
        folderStructure: folderStructure,
        ventureId: venture.ventureId,
        currentStep: "team",
        updatedAt: new Date(),
      })
      .where(eq(onboardingSession.sessionId, sessionId))
      .returning();

    // Send Slack notification for venture step completion (async, no wait)
    if (eastEmblemAPI.isConfigured()) {
      eastEmblemAPI
        .sendSlackNotification(
          `\`Onboarding Id : ${sessionId}\`\n🏢 Venture Info Completed - ${validatedData.name}`,
          "#notifications",
          sessionId,
        )
        .catch((error) => {
          console.log("Failed to send venture completion notification:", error);
        });
    }

    return { venture, folderStructure };
  }

  // Add team member
  async addTeamMember(sessionId: string, memberData: any) {
    const session = await this.getSession(sessionId);
    if (!session) throw new Error("Session not found");

    const stepData = session?.stepData as any;
    let ventureId = stepData?.venture?.ventureId || stepData?.team?.ventureId;

    // If no venture ID in step data, get from founder's ventures
    if (!ventureId && stepData?.founder?.founderId) {
      const ventures = await storage.getVenturesByFounderId(
        stepData.founder.founderId,
      );
      if (ventures.length > 0) {
        ventureId = ventures[ventures.length - 1].ventureId;
      }
    }

    if (!ventureId) {
      throw new Error("Venture step not completed");
    }

    // Validate member data
    const validatedData = teamMemberSchema.parse(memberData);

    // Create team member
    const newTeamMember = await storage.createTeamMember({
      ...validatedData,
      ventureId,
    });
    return { success: true, teamMember: newTeamMember };
  }

  // Get team members for session
  async getTeamMembers(sessionId: string) {
    const session = await this.getSession(sessionId);
    if (!session) {
      return [];
    }

    const stepData = session?.stepData as any;
    let ventureId = stepData?.venture?.ventureId || stepData?.team?.ventureId;

    // If no venture ID in step data, try to find from founder's ventures
    if (!ventureId && stepData?.founder?.founderId) {
      const ventures = await storage.getVenturesByFounderId(
        stepData.founder.founderId,
      );
      if (ventures.length > 0) {
        ventureId = ventures[ventures.length - 1].ventureId; // Get the most recent venture
      }
    }

    if (!ventureId) {
      return [];
    }

    const teamMembers = await storage.getTeamMembersByVentureId(ventureId);
    return teamMembers;
  }

  // Update team member
  async updateTeamMember(memberId: string, memberData: any) {
    const validatedData = teamMemberSchema.parse(memberData);
    const updatedMember = await storage.updateTeamMember(
      memberId,
      validatedData,
    );

    return {
      success: true,
      teamMember: updatedMember,
    };
  }

  // Delete team member
  async deleteTeamMember(memberId: string) {
    await storage.deleteTeamMember(memberId);
    return { success: true };
  }

  // Complete team step
  async completeTeamStep(sessionId: string) {
    const teamMembers = await this.getTeamMembers(sessionId);

    // Allow completing team step with any number of members (0-4)
    console.log(`Completing team step with ${teamMembers.length} team members`);

    // Update session progress
    await this.updateSession(sessionId, "upload", {}, false);
    await this.updateSession(sessionId, "team", { teamMembers }, true);

    // Send Slack notification for team step completion (async, no wait)
    if (eastEmblemAPI.isConfigured()) {
      eastEmblemAPI
        .sendSlackNotification(
          `\`Onboarding Id : ${sessionId}\`\n👥 Team Details Completed - ${teamMembers.length} member(s)`,
          "#notifications",
          sessionId,
        )
        .catch((error) => {
          console.log("Failed to send team completion notification:", error);
        });
    }

    return teamMembers;
  }

  // Handle document upload
  async handleDocumentUpload(sessionId: string, file: any) {
    const session = await this.getSession(sessionId);
    if (!session) throw new Error("Session not found");

    console.log("Full session data:", JSON.stringify(session, null, 2));

    const stepData = session?.stepData as any;
    console.log("Step Data keys:", Object.keys(stepData || {}));
    console.log("Venture step data:", stepData?.venture);

    // Check multiple locations for folderStructure
    const folderStructure =
      stepData?.venture?.folderStructure ||
      session?.folderStructure ||
      stepData?.folderStructure;

    // Check multiple locations for ventureId
    const ventureId =
      stepData?.venture?.ventureId ||
      stepData?.venture?.venture?.ventureId ||
      stepData?.team?.ventureId ||
      session?.ventureId;

    console.log("Found ventureId:", ventureId);
    console.log("Found folderStructure:", folderStructure);

    if (!ventureId) throw new Error("Venture step not completed");

    let eastemblemFileId = null;
    let sharedUrl = null;

    // Upload to EastEmblem API if folder structure exists
    if (
      eastEmblemAPI.isConfigured() &&
      folderStructure?.folders?.["0_Overview"]
    ) {
      try {
        console.log(
          "Uploading file to EastEmblem API in 0_Overview folder:",
          folderStructure.folders["0_Overview"],
        );
        const fileBuffer = require("fs").readFileSync(file.path);

        const uploadResult = await eastEmblemAPI.uploadFile(
          fileBuffer,
          file.originalname,
          folderStructure.folders["0_Overview"],
          sessionId,
          true
        );

        eastemblemFileId = uploadResult.id;
        sharedUrl = uploadResult.url || uploadResult.download_url;

        console.log("File uploaded successfully to EastEmblem:", {
          fileId: eastemblemFileId,
          sharedUrl,
        });
      } catch (error) {
        console.error("Failed to upload to EastEmblem API:", error);
      }
    }

    // Save upload record with EastEmblem data
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
        eastemblemFileId: eastemblemFileId,
        sharedUrl: sharedUrl,
      })
      .returning();

    // Update session with complete upload info
    await this.updateSession(
      sessionId,
      "upload",
      {
        upload: {
          ...upload,
          folderStructure: folderStructure,
          uploadedToBox: !!eastemblemFileId,
        },
      },
      true,
    );

    // Send Slack notification for document upload (async, no wait)
    if (eastEmblemAPI.isConfigured()) {
      eastEmblemAPI
        .sendSlackNotification(
          `\`Onboarding Id : ${sessionId}\`\n📄 Document Uploaded - ${file.originalname}`,
          "#notifications",
          sessionId,
        )
        .catch((error) => {
          console.log("Failed to send document upload notification:", error);
        });
    }

    return {
      ...upload,
      uploadedToBox: !!eastemblemFileId,
      folderStructure: folderStructure,
    };
  }

  // Submit for scoring
  async submitForScoring(sessionId: string) {
    const session = await this.getSession(sessionId);
    const stepData = session?.stepData as any;

    // Get all required data with safe property access
    const upload = stepData?.upload?.upload || stepData?.upload;
    const venture = stepData?.venture?.venture || stepData?.venture;
    const folderStructure = stepData?.venture?.folderStructure || stepData?.folderStructure;

    console.log("Submit for scoring : ", folderStructure);

    if (!upload || !venture) {
      throw new Error("Required onboarding steps not completed");
    }

    // Use folder structure from venture step or fall back to basic structure
    const finalFolderStructure = folderStructure || {
      id: venture?.ventureId || sessionId,
      url: "#",
      folders: {
        "0_Overview": "overview",
        "1_Problem_Proof": "problem",
        "2_Solution_Proof": "solution",
        "3_Demand_Proof": "demand",
        "4_Credibility_Proof": "credibility",
        "5_Commercial_Proof": "commercial",
        "6_Investor_Pack": "investor",
      },
    };

    let scoringResult = null;

    // Process with EastEmblem API if configured
    if (eastEmblemAPI.isConfigured() && upload.filePath) {
      try {
        // Upload file to existing EastEmblem folder structure (created in venture step)
        const fileBuffer = fs.readFileSync(upload.filePath);

        const overviewFolderId = finalFolderStructure?.folders?.["0_Overview"];
        if (!overviewFolderId) {
          console.log(
            "No overview folder found, proceeding with direct scoring",
          );
        } else {
          const uploadResult = await eastEmblemAPI.uploadFile(
            fileBuffer,
            upload.originalName,
            overviewFolderId,
            undefined,
            true
          );

          // Update upload record with EastEmblem file ID
          await db
            .update(documentUpload)
            .set({
              eastemblemFileId: uploadResult.id,
              processingStatus: "uploaded",
            })
            .where(eq(documentUpload.uploadId, upload.uploadId));
        }

        // Score the pitch deck
        console.log(
          "Starting pitch deck scoring for file:",
          upload.originalName,
        );
        scoringResult = await eastEmblemAPI.scorePitchDeck(
          fileBuffer,
          upload.originalName,
        );

        console.log("Pitch deck scoring completed successfully");
        console.log(
          "Raw scoring result:",
          JSON.stringify(scoringResult, null, 2),
        );
      } catch (error: any) {
        console.error("Failed to score pitch deck:", error);
        throw new Error(`Scoring failed: ${error.message}`);
      }
    } else {
      throw new Error("EastEmblem API not configured or no file uploaded");
    }

    // Update session with complete scoring results
    await this.updateSession(
      sessionId,
      "processing",
      {
        scoringResult,
        isComplete: true,
        completedAt: new Date().toISOString(),
      },
      true,
    );

    // Mark session as complete
    await db
      .update(onboardingSession)
      .set({
        isComplete: true,
        stepData: {
          ...(session?.stepData || {}),
          processing: {
            scoringResult,
            isComplete: true,
            completedAt: new Date().toISOString(),
          },
        },
      })
      .where(eq(onboardingSession.sessionId, sessionId));

    // Send Slack notification for analysis completion (async, no wait)
    if (eastEmblemAPI.isConfigured()) {
      const totalScore = scoringResult?.output?.total_score || 0;
      eastEmblemAPI
        .sendSlackNotification(
          `\`Onboarding Id : ${sessionId}\`\n🎯 Analysis Completed - Pitch Deck Score: ${totalScore}/100`,
          "#notifications",
          sessionId,
        )
        .catch((error) => {
          console.log(
            "Failed to send analysis completion notification:",
            error,
          );
        });
    }

    // Generate certificate automatically in async mode (no wait)
    console.log("Starting async certificate generation for session:", sessionId);
    (async () => {
      try {
        const { generateCertificate } = await import('./routes/certificate');
        
        // Create mock request/response for certificate generation
        const mockReq = {
          body: { ventureId: sessionId }
        } as any;
        
        const mockRes = {
          status: (code: number) => ({
            json: (data: any) => {
              console.log(`Certificate generation result (${code}):`, data);
              if (data.success && data.uploadedToCloud) {
                console.log("✓ Certificate successfully uploaded to 0_Overview folder:", data.certificateUrl);
              } else if (data.success) {
                console.log("✓ Certificate generated locally:", data.certificateUrl);
              } else {
                console.log("✗ Certificate generation failed:", data.error);
              }
            }
          })
        } as any;
        
        await generateCertificate(mockReq, mockRes);
      } catch (error) {
        console.log("Async certificate generation failed:", error);
      }
    })();

    return {
      session: {
        sessionId,
        scoringResult,
        isComplete: true,
        stepData: {
          ...(session?.stepData || {}),
          processing: {
            scoringResult,
            isComplete: true,
          },
        },
      },
    };
  }
}

export const onboardingManager = new OnboardingManager();
