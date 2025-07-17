import { Request, Response } from 'express';
import { storage } from '../storage';
import { writeFileSync } from 'fs';
import { join } from 'path';

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

// Generate report locally using existing scoring data
async function generateLocalReport(reportData: any, session: any) {
  try {
    const ventureName = reportData.venture_name || session.stepData?.venture?.name || 'Your Venture';
    const founderName = session.stepData?.founder?.firstName || 'Founder';
    const totalScore = reportData.total_score || 0;
    
    // Generate HTML report similar to the existing HTML report system
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Validation Report - ${ventureName}</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
        }
        .container {
            background: white;
            border-radius: 12px;
            padding: 40px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
        }
        .header {
            text-align: center;
            margin-bottom: 40px;
            padding-bottom: 20px;
            border-bottom: 3px solid #7C3AED;
        }
        .header h1 {
            color: #7C3AED;
            margin: 0;
            font-size: 2.5em;
            font-weight: 700;
        }
        .header h2 {
            color: #F59E0B;
            margin: 10px 0 0 0;
            font-size: 1.3em;
            font-weight: 600;
        }
        .score-summary {
            background: linear-gradient(135deg, #7C3AED 0%, #F59E0B 100%);
            color: white;
            padding: 30px;
            border-radius: 8px;
            text-align: center;
            margin: 30px 0;
        }
        .score-summary h3 {
            margin: 0 0 15px 0;
            font-size: 1.5em;
        }
        .score-value {
            font-size: 3em;
            font-weight: bold;
            margin: 10px 0;
        }
        .dimensions {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            margin: 30px 0;
        }
        .dimension {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            border-left: 4px solid #7C3AED;
        }
        .dimension h4 {
            color: #7C3AED;
            margin: 0 0 10px 0;
            font-size: 1.2em;
        }
        .dimension-score {
            font-size: 1.8em;
            font-weight: bold;
            color: #F59E0B;
            margin: 5px 0;
        }
        .insights {
            background: #f8f9fa;
            padding: 25px;
            border-radius: 8px;
            margin: 30px 0;
        }
        .insights h3 {
            color: #7C3AED;
            margin: 0 0 15px 0;
        }
        .tags {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            margin: 20px 0;
        }
        .tag {
            background: #7C3AED;
            color: white;
            padding: 6px 12px;
            border-radius: 20px;
            font-size: 0.9em;
            font-weight: 500;
        }
        .footer {
            text-align: center;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e9ecef;
            color: #666;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Validation Report</h1>
            <h2>${ventureName}</h2>
            <p>Generated on ${new Date().toLocaleDateString()}</p>
        </div>

        <div class="score-summary">
            <h3>Overall ProofScore</h3>
            <div class="score-value">${totalScore}/100</div>
            <p>Your venture's investment readiness score</p>
        </div>

        <div class="dimensions">
            <div class="dimension">
                <h4>Desirability</h4>
                <div class="dimension-score">${reportData.desirability?.score || 0}/20</div>
                <p>${reportData.desirability?.summary || 'Market validation and problem-solution fit assessment.'}</p>
            </div>
            <div class="dimension">
                <h4>Feasibility</h4>
                <div class="dimension-score">${reportData.feasibility?.score || 0}/20</div>
                <p>${reportData.feasibility?.summary || 'Technical capability and execution readiness evaluation.'}</p>
            </div>
            <div class="dimension">
                <h4>Viability</h4>
                <div class="dimension-score">${reportData.viability?.score || 0}/20</div>
                <p>${reportData.viability?.summary || 'Business model sustainability and financial health analysis.'}</p>
            </div>
            <div class="dimension">
                <h4>Traction</h4>
                <div class="dimension-score">${reportData.traction?.score || 0}/20</div>
                <p>${reportData.traction?.summary || 'Customer acquisition and growth momentum indicators.'}</p>
            </div>
            <div class="dimension">
                <h4>Readiness</h4>
                <div class="dimension-score">${reportData.readiness?.score || 0}/20</div>
                <p>${reportData.readiness?.summary || 'Investment and scaling preparedness assessment.'}</p>
            </div>
        </div>

        <div class="insights">
            <h3>Key Insights</h3>
            <ul>
                ${(reportData.key_insights || []).map((insight: string) => `<li>${insight}</li>`).join('')}
            </ul>
        </div>

        <div class="insights">
            <h3>ProofTags Achieved</h3>
            <div class="tags">
                ${(reportData.tags || []).map((tag: string) => `<span class="tag">${tag}</span>`).join('')}
            </div>
        </div>

        <div class="insights">
            <h3>Recommendations</h3>
            <p>${reportData.strategic_feedback || 'Continue building proof points and validating your venture across all dimensions.'}</p>
        </div>

        <div class="footer">
            <p>Generated by Second Chance ProofScaling Platform</p>
            <p>Report ID: ${session.sessionId}</p>
        </div>
    </div>
</body>
</html>`;

    // Save HTML report to file
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `${ventureName.replace(/[^a-zA-Z0-9]/g, '_')}_validation_report_${timestamp}.html`;
    const filepath = join(process.cwd(), 'uploads', filename);
    
    writeFileSync(filepath, html);
    
    // Create a shareable URL (local file access)
    const reportUrl = `/uploads/${filename}`;
    
    return {
      url: reportUrl,
      id: session.sessionId,
      name: filename
    };
    
  } catch (error) {
    console.error('Local report generation error:', error);
    throw new Error('Failed to generate local report');
  }
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

    // Generate report locally using existing scoring data
    const reportResult = await generateLocalReport(reportData, session);

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