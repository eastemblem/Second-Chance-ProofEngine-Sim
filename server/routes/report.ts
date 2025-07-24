import { Request, Response } from 'express';
import { storage } from '../storage';
import { randomUUID } from 'crypto';

// Function to map scoring response to report format
function mapScoringToReportData(scoringResult: any, sessionId: string, folderStructure: any): any {
  const output = scoringResult.output || scoringResult;
  
  // Extract venture and founder information from session if available
  const ventureInfo = scoringResult.venture_info || {};
  const founderInfo = scoringResult.founder_info || {};
  
  // Initialize default signal structure
  const defaultSignals = [{
    "MRR": {
      "description": "",
      "score": ""
    },
    "LOIs": {
      "description": "",
      "score": ""
    },
    "Waitlist": {
      "description": "",
      "score": ""
    },
    "Sales": {
      "description": "",
      "score": ""
    },
    "Pilot Deals": {
      "description": "",
      "score": ""
    },
    "Strategic Partnerships": {
      "description": "",
      "score": ""
    },
    "Media Mentions": {
      "description": "",
      "score": ""
    },
    "Investor Interest": {
      "description": "",
      "score": ""
    },
    "Advisors": {
      "description": "",
      "score": ""
    },
    "Community Engagement": {
      "description": "",
      "score": ""
    }
  }];

  return {
    onboarding_id: sessionId,
    folder_id: folderStructure?.folders?.["0_Overview"] || "",
    venture_name: ventureInfo.venture_name || output.venture_name || "",
    founder_stage: founderInfo.founder_stage || output.founder_stage || "",
    business_model_type: output.business_model_type || "",
    milestone: output.milestone || "",
    
    // Map scoring dimensions
    desirability: {
      score: output.desirability?.score || 0,
      summary: output.desirability?.summary || "",
      justification: output.desirability?.justification || "",
      related_slides: output.desirability?.related_slides || ["", ""],
      recommendation: output.desirability?.recommendation || "",
      proofTags: output.desirability?.proofTags || ["", ""]
    },
    
    feasibility: {
      score: output.feasibility?.score || 0,
      summary: output.feasibility?.summary || "",
      justification: output.feasibility?.justification || "",
      related_slides: output.feasibility?.related_slides || ["", ""],
      recommendation: output.feasibility?.recommendation || "",
      proofTags: output.feasibility?.proofTags || ["", ""]
    },
    
    viability: {
      score: output.viability?.score || 0,
      summary: output.viability?.summary || "",
      justification: output.viability?.justification || "",
      related_slides: output.viability?.related_slides || ["", ""],
      recommendation: output.viability?.recommendation || "",
      proofTags: output.viability?.proofTags || ["", ""]
    },
    
    traction: {
      score: output.traction?.score || 0,
      summary: output.traction?.summary || "",
      justification: output.traction?.justification || "",
      related_slides: output.traction?.related_slides || ["", ""],
      recommendation: output.traction?.recommendation || "",
      proofTags: output.traction?.proofTags || ["", ""],
      bonus_applied: {
        description: output.traction?.bonus_applied?.description || "",
        score: output.traction?.bonus_applied?.score || ""
      },
      signals: output.traction?.signals?.length > 0 ? output.traction.signals : defaultSignals
    },
    
    readiness: {
      score: output.readiness?.score || 0,
      summary: output.readiness?.summary || "",
      justification: output.readiness?.justification || "",
      related_slides: output.readiness?.related_slides || ["", ""],
      recommendation: output.readiness?.recommendation || "",
      proofTags: output.readiness?.proofTags || ["", ""]
    },
    
    total_score: output.total_score || 0,
    tags: output.tags || ["", ""],
    highlights: {
      intro: output.highlights?.intro || "",
      key_highlights: output.highlights?.key_highlights || "",
      summary: output.highlights?.summary || ""
    },
    conclusion: output.conclusion || "",
    recommendations: output.recommendations || ""
  };
}

// Standalone function for report generation (no HTTP context needed)
export async function createReportForSession(sessionId: string) {
  try {
    const { db } = await import('../db');
    const { onboardingSession } = await import('@shared/schema');
    const { eq } = await import('drizzle-orm');

    // Get session data
    const [sessionData] = await db
      .select()
      .from(onboardingSession)
      .where(eq(onboardingSession.sessionId, sessionId));

    if (!sessionData) {
      throw new Error('Session not found');
    }

    const session = sessionData;

    // Check if report already exists
    if (session.stepData?.processing?.reportUrl) {
      const existingUrl = session.stepData.processing.reportUrl;
      
      // Still update database even if report exists in session
      try {
        const { documentUpload, venture } = await import('@shared/schema');
        const ventureId = session.stepData?.venture?.ventureId;
        
        if (ventureId) {
          // Update venture table with report URL
          await db
            .update(venture)
            .set({
              reportUrl: existingUrl,
              reportGeneratedAt: new Date(),
              updatedAt: new Date()
            })
            .where(eq(venture.ventureId, ventureId));
          console.log("✓ Venture table updated with existing report URL");
          
          // Try to create document_upload record (ignore if already exists)
          try {
            const { randomUUID } = await import('crypto');
            await db.insert(documentUpload).values({
              uploadId: randomUUID(),
              ventureId: ventureId,
              fileName: 'analysis_report.pdf',
              originalName: 'analysis_report.pdf',
              filePath: '/generated/report.pdf',
              fileType: 'pdf',
              fileSize: 1024000, // Default 1MB for existing reports
              mimeType: 'application/pdf',
              uploadStatus: 'completed',
              processingStatus: 'completed',
              sharedUrl: existingUrl,
              folderId: null, // No folder ID for existing reports
              eastemblemFileId: null, // Will be populated when we have the actual ID
              uploadedBy: 'system'
            });
            console.log("✓ Report document_upload record created");
          } catch (docError) {
            // Document record might already exist, that's ok
            console.log("Report document record might already exist:", docError);
          }
        }
      } catch (error) {
        console.error("Failed to update database with existing report:", error);
      }
      
      return {
        success: true,
        reportUrl: existingUrl,
        message: "Report already exists"
      };
    }

    // Check if we have scoring data
    if (!session.stepData?.processing?.scoringResult) {
      throw new Error('No scoring data available');
    }

    const scoringResult = session.stepData.processing.scoringResult;
    const folderStructure = session.stepData.folderStructure;

    // Map scoring response to report format
    const reportData = mapScoringToReportData(scoringResult, sessionId, folderStructure);

    console.log('Mapped report data structure:', JSON.stringify(reportData, null, 2));

    // Generate report using EastEmblem API
    const { eastEmblemAPI } = await import('../eastemblem-api');
    const reportResult = await eastEmblemAPI.createReport(reportData);

    // Store report URL in session
    const updatedStepData = {
      ...session.stepData,
      processing: {
        ...session.stepData.processing,
        reportUrl: reportResult.url,
        reportGeneratedAt: new Date().toISOString()
      }
    };

    // Update session with report URL
    await db
      .update(onboardingSession)
      .set({
        stepData: updatedStepData,
        updatedAt: new Date()
      })
      .where(eq(onboardingSession.sessionId, sessionId));

    // Create document_upload record for report
    try {
      const { documentUpload } = await import('@shared/schema');
      
      // Get venture ID from session
      const ventureId = session.stepData?.venture?.ventureId;
      if (ventureId) {
        await db.insert(documentUpload).values({
          uploadId: randomUUID(),
          ventureId: ventureId,
          fileName: reportResult.name || 'analysis_report.pdf',
          originalName: reportResult.name || 'analysis_report.pdf',
          filePath: '/generated/report.pdf',
          fileType: 'pdf',
          fileSize: reportResult.size || 1024000, // Use actual size from API or default 1MB
          mimeType: 'application/pdf',
          uploadStatus: 'completed',
          processingStatus: 'completed',
          sharedUrl: reportResult.url,
          folderId: reportResult.folderId || null, // Use actual folder ID from API if available
          eastemblemFileId: reportResult.id,
          uploadedBy: 'system'
        });
        console.log("✓ Report document_upload record created");
        
        // Update venture table with report URL
        const { venture } = await import('@shared/schema');
        await db
          .update(venture)
          .set({
            reportUrl: reportResult.url,
            reportGeneratedAt: new Date(),
            updatedAt: new Date()
          })
          .where(eq(venture.ventureId, ventureId));
        console.log("✓ Venture table updated with report URL");
      }
    } catch (error) {
      console.error("Failed to create report document record:", error);
      // Don't fail the entire process
    }

    return {
      success: true,
      reportUrl: reportResult.url,
      message: "Report created successfully",
      generatedAt: new Date().toISOString(),
      processingNote: "Report may take a few moments to be fully processed by the document service"
    };

  } catch (error) {
    console.error('Report creation error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

export async function generateReport(req: Request, res: Response) {
  try {
    const { ventureId, sessionId } = req.body;

    // Support both ventureId and sessionId
    const identifier = ventureId || sessionId;

    if (!identifier) {
      return res.status(400).json({ 
        success: false, 
        error: 'Venture ID or Session ID is required' 
      });
    }

    // Try to create report for this session
    const result = await createReportForSession(identifier);
    
    if (result.success) {
      return res.json({
        success: true,
        reportUrl: result.reportUrl,
        message: result.message,
        generatedAt: new Date().toISOString()
      });
    } else {
      return res.status(500).json({
        success: false,
        error: result.error
      });
    }

  } catch (error) {
    console.error('Report generation error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
}