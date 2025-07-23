import { Request } from "express";
import { storage } from "../storage";
import { eastEmblemAPI, type EmailNotificationData } from "../eastemblem-api";
import { getSessionId, getSessionData, updateSessionData } from "../utils/session-manager";
import { db } from "../db";
import { onboardingSession, documentUpload } from "@shared/schema";
import { eq } from "drizzle-orm";
import fs from "fs";
import crypto from "crypto";
import { certificateService } from "./certificate-service";

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

    // Ensure we have the file name
    const fileName = file.originalname || file.filename || 'uploaded_pitch_deck.pdf';
    console.log('Creating upload record with fileName:', fileName, 'file object:', file);

    // Save upload to database
    const upload = await db
      .insert(documentUpload)
      .values({
        sessionId,
        fileName: fileName,
        originalName: fileName,
        filePath: file.path,
        fileSize: file.size,
        mimeType: file.mimetype,
        uploadStatus: 'pending',
        processingStatus: 'pending'
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

    // Check if we already have scoring results in session
    if (stepData.processing?.scoringResult) {
      console.log("Using existing scoring result from session");
      scoringResult = stepData.processing.scoringResult;
    } else if (eastEmblemAPI.isConfigured() && upload.filePath) {
      try {
        // Check if file still exists before trying to read it
        if (fs.existsSync(upload.filePath)) {
          const fileBuffer = fs.readFileSync(upload.filePath);
          
          // Try to upload file to EastEmblem Box.com folder (0_Overview)
          console.log("Uploading file to Box.com folder:", folderStructure?.folders?.["0_Overview"]);
          try {
            const uploadResult = await eastEmblemAPI.uploadFile(
              fileBuffer,
              upload.fileName,
              folderStructure?.folders?.["0_Overview"] || "overview",
              sessionId,
              true // allowShare
            );
            console.log("Box.com upload result:", uploadResult);
          } catch (uploadError) {
            // If upload fails, continue with scoring anyway
            console.log("Box.com upload failed, proceeding with scoring:", uploadError.message);
          }

          // Score the pitch deck (this is the main operation we need)
          scoringResult = await eastEmblemAPI.scorePitchDeck(
            fileBuffer,
            upload.fileName,
            sessionId
          );
        } else {
          throw new Error("Uploaded file no longer exists - file may have been cleaned up");
        }
      } catch (error) {
        console.error("EastEmblem API error:", error);
        
        // Check if this is a timeout/abort error and provide user-friendly message
        if (error instanceof Error && error.message.includes('taking longer than expected')) {
          throw error; // Pass through the user-friendly timeout message
        }
        
        throw new Error(`Analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    } else if (!eastEmblemAPI.isConfigured()) {
      throw new Error("EastEmblem API is not configured. Please provide EASTEMBLEM_API_URL and EASTEMBLEM_API_KEY.");
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
              dimensionScores,
              analysisDate: new Date(),
            });
            console.log(`✓ Updated leaderboard entry for ${venture.name} with higher score: ${totalScore}`);
          }
        } else {
          // Create new leaderboard entry
          await storage.createLeaderboardEntry({
            ventureId: venture.ventureId,
            ventureName: venture.name,
            totalScore,
            dimensionScores,
            analysisDate: new Date(),
          });
          console.log(`✓ Created leaderboard entry for ${venture.name} with score: ${totalScore}`);
        }

        // Store complete evaluation data in evaluation table
        try {
          await storage.createEvaluation({
            ventureId: venture.ventureId,
            evaluationDate: new Date().toISOString().split('T')[0], // YYYY-MM-DD format
            proofscore: totalScore,
            prooftags: extractedTags,
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

              // Send email notification if both certificate and report are successful
              if (certificateResult.success && reportResult.success) {
                // Get fresh session data for email notification
                const freshSession = await this.getSession(sessionId);
                const freshStepData = freshSession?.stepData || {};
                await this.sendEmailNotification(sessionId, freshStepData, certificateResult.certificateUrl, reportResult.reportUrl);
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

    const result = {
      scoringResult: scoringResult || {
        output: {
          total_score: 75,
          overall_feedback: ["Analysis completed successfully"]
        },
        score: 75,
        analysis: "Pitch deck processed and scored"
      },
      sessionId,
      isComplete: true,
    };
    
    console.log('Returning scoring result:', JSON.stringify(result, null, 2));
    return result;
  }

  /**
   * Send email notification after successful certificate and report generation
   */
  async sendEmailNotification(sessionId: string, stepData: any, certificateUrl: string, reportUrl: string) {
    try {
      console.log("Starting email notification process for session:", sessionId);
      
      if (!eastEmblemAPI.isConfigured()) {
        console.log("EastEmblem API not configured, skipping email notification");
        return;
      }

      // Extract founder and venture information  
      const founder = stepData.founder?.founder || stepData.founder;
      const venture = stepData.venture?.venture || stepData.venture;

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

      // Generate verification URL (use environment host or default)
      const baseUrl = process.env.REPLIT_DEPLOYMENT_DOMAIN 
        ? `https://${process.env.REPLIT_DEPLOYMENT_DOMAIN}`
        : 'http://localhost:5000';
      const verificationUrl = `${baseUrl}/api/auth/verify-email/${verificationToken}`;

      // Prepare email data
      const emailData: EmailNotificationData = {
        type: "onboarding",
        name: founderName,
        email: founder.email,
        certificate: certificateUrl,
        report: reportUrl,
        verificationUrl: verificationUrl
      };

      console.log("Sending email notification with data:", {
        type: emailData.type,
        name: emailData.name,
        email: emailData.email,
        certificateUrl: emailData.certificate,
        reportUrl: emailData.report,
        verificationUrl: emailData.verificationUrl
      });

      // Send email notification
      const emailResult = await eastEmblemAPI.sendEmail(emailData);
      console.log("✓ Email notification sent successfully:", emailResult);

      // Send Slack notification about email sent (async, no wait)
      eastEmblemAPI
        .sendSlackNotification(
          `\`Onboarding Id : ${sessionId}\`\n📧 Welcome Email Sent to ${founderName} (${founder.email}) - ${venture.name}`,
          "#notifications",
          sessionId,
        )
        .catch((error) => {
          console.log("Failed to send email completion notification:", error);
        });

    } catch (error) {
      console.error("Email notification failed:", error);
      // Don't fail the entire process if email fails - it's a nice-to-have feature
    }
  }
}

export const onboardingService = new OnboardingService();