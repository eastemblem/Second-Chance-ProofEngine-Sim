import { Request, Response } from 'express';
import { storage } from '../storage';

// Function to map scoring response to report format
function mapScoringToReportData(scoringResult: any, sessionId: string, folderStructure: any): any {
  const output = scoringResult.output || scoringResult;
  
  // Extract venture and founder information from session if available
  const ventureInfo = scoringResult.venture_info || {};
  const founderInfo = scoringResult.founder_info || {};
  
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
      related_slides: output.desirability?.related_slides || [],
      recommendation: output.desirability?.recommendation || "",
      proofTags: output.desirability?.proofTags || []
    },
    
    feasibility: {
      score: output.feasibility?.score || 0,
      summary: output.feasibility?.summary || "",
      justification: output.feasibility?.justification || "",
      related_slides: output.feasibility?.related_slides || [],
      recommendation: output.feasibility?.recommendation || "",
      proofTags: output.feasibility?.proofTags || []
    },
    
    viability: {
      score: output.viability?.score || 0,
      summary: output.viability?.summary || "",
      justification: output.viability?.justification || "",
      related_slides: output.viability?.related_slides || [],
      recommendation: output.viability?.recommendation || "",
      proofTags: output.viability?.proofTags || []
    },
    
    traction: {
      score: output.traction?.score || 0,
      summary: output.traction?.summary || "",
      justification: output.traction?.justification || "",
      related_slides: output.traction?.related_slides || [],
      recommendation: output.traction?.recommendation || "",
      proofTags: output.traction?.proofTags || [],
      bonus_applied: output.traction?.bonus_applied || {},
      signals: output.traction?.signals || []
    },
    
    readiness: {
      score: output.readiness?.score || 0,
      summary: output.readiness?.summary || "",
      justification: output.readiness?.justification || "",
      related_slides: output.readiness?.related_slides || [],
      recommendation: output.readiness?.recommendation || "",
      proofTags: output.readiness?.proofTags || []
    },
    
    total_score: output.total_score || 0,
    tags: output.tags || [],
    key_insights: output.key_insights || [],
    missing_tags: output.missing_tags || [],
    action_plan: output.action_plan || "",
    strategic_feedback: output.strategic_feedback || "",
    overall_summary: output.overall_summary || ""
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
      return {
        success: true,
        reportUrl: session.stepData.processing.reportUrl,
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

    // Import EastEmblem API
    const { eastEmblemAPI } = await import('../eastemblem-api');

    if (!eastEmblemAPI.isConfigured()) {
      throw new Error('EastEmblem API not configured');
    }

    // Create report
    const reportResult = await eastEmblemAPI.createReport(reportData);

    if (!reportResult.url) {
      throw new Error('Report creation failed');
    }

    // Store report URL in session
    const updatedStepData = {
      ...session.stepData,
      processing: {
        ...session.stepData.processing,
        reportUrl: reportResult.url,
        reportGeneratedAt: new Date().toISOString()
      }
    };

    await db
      .update(onboardingSession)
      .set({ stepData: updatedStepData })
      .where(eq(onboardingSession.sessionId, sessionId));

    return {
      success: true,
      reportUrl: reportResult.url,
      message: "Report created successfully"
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

    let venture = null;
    let session = null;

    // First try to find by venture ID
    if (ventureId) {
      venture = await storage.getVenture(ventureId);
      
      if (!venture) {
        // Try to find venture by founder ID
        const ventures = await storage.getVenturesByFounderId(ventureId);
        if (ventures && ventures.length > 0) {
          venture = ventures[0];
        }
      }
    }

    // If no venture found, try session-based lookup
    if (!venture) {
      const { db } = await import('../db');
      const { onboardingSession } = await import('@shared/schema');
      const { eq } = await import('drizzle-orm');

      try {
        const [sessionData] = await db
          .select()
          .from(onboardingSession)
          .where(eq(onboardingSession.sessionId, identifier));

        if (sessionData) {
          session = sessionData;
          
          // Try to find venture by founder ID from session
          if (session.founderId) {
            const ventures = await storage.getVenturesByFounderId(session.founderId);
            if (ventures && ventures.length > 0) {
              venture = ventures[0];
            }
          }
        }
      } catch (error) {
        console.error('Error fetching session:', error);
      }
    }

    // Check if we have a venture with report
    if (venture && venture.reportUrl) {
      return res.json({
        success: true,
        reportUrl: venture.reportUrl,
        message: "Report already exists",
        generatedAt: venture.reportGeneratedAt
      });
    }

    // Check if we have session with report
    if (session && session.stepData?.processing?.reportUrl) {
      return res.json({
        success: true,
        reportUrl: session.stepData.processing.reportUrl,
        message: "Report found in session",
        generatedAt: session.stepData.processing.reportGeneratedAt || null
      });
    }

    // No report found in stored data, try to create one for this session
    if (session && session.stepData && session.stepData.processing && session.stepData.processing.scoringResult) {
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
    }

    // No scoring data found
    return res.status(404).json({
      success: false,
      error: "Report not found. Please complete the pitch deck analysis first.",
      message: "Reports are generated automatically after successful pitch deck scoring."
    });

  } catch (error) {
    console.error('Report generation error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
}