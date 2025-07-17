import { Request, Response } from 'express';
import { storage } from '../storage';

export async function generateCertificate(req: Request, res: Response) {
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

    console.log(`Certificate request for identifier: ${identifier}`);
    
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
          console.log(`Found venture via founder ID: ${venture.ventureId}`);
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
          console.log(`Found session: ${session.sessionId}`);
          
          // Try to find venture by founder ID from session
          if (session.founderId) {
            const ventures = await storage.getVenturesByFounderId(session.founderId);
            if (ventures && ventures.length > 0) {
              venture = ventures[0];
              console.log(`Found venture via session founder ID: ${venture.ventureId}`);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching session:', error);
      }
    }

    // Check if we have a venture with certificate
    if (venture && venture.certificateUrl) {
      console.log(`Certificate exists for venture ${venture.name}: ${venture.certificateUrl}`);
      return res.json({
        success: true,
        certificateUrl: venture.certificateUrl,
        message: "Certificate already exists",
        generatedAt: venture.certificateGeneratedAt
      });
    }

    // Check if session has certificate URL in stepData
    if (session && session.stepData && session.stepData.processing && session.stepData.processing.certificateUrl) {
      const certificateUrl = session.stepData.processing.certificateUrl;
      console.log(`Certificate found in session data: ${certificateUrl}`);
      return res.json({
        success: true,
        certificateUrl: certificateUrl,
        message: "Certificate found in session",
        generatedAt: session.stepData.processing.certificateGeneratedAt || null
      });
    }

    // No certificate found in stored data, but let's try to create one for this session
    // since it might already exist in EastEmblem API
    if (session && session.stepData && session.stepData.processing && session.stepData.processing.scoringResult) {
      const scoringResult = session.stepData.processing.scoringResult;
      const totalScore = scoringResult.output?.total_score || 0;
      const folderStructure = session.stepData.folderStructure;
      const overviewFolderId = folderStructure?.folders?.["0_Overview"];
      
      if (overviewFolderId && totalScore > 0) {
        try {
          const { eastEmblemAPI } = await import('../eastemblem-api');
          
          if (eastEmblemAPI.isConfigured()) {
            console.log(`Attempting to create certificate for session ${session.sessionId} with score ${totalScore}`);
            
            const certificateResult = await eastEmblemAPI.createCertificate(
              overviewFolderId,
              totalScore,
              session.sessionId,
              false // is_course_complete = false for pitch deck validation
            );
            
            console.log("Certificate created/retrieved successfully:", certificateResult);
            
            // Update session with certificate URL
            const { db } = await import('../db');
            const { onboardingSession } = await import('@shared/schema');
            const { eq } = await import('drizzle-orm');
            
            await db
              .update(onboardingSession)
              .set({
                stepData: {
                  ...session.stepData,
                  processing: {
                    ...session.stepData.processing,
                    certificateUrl: certificateResult.url,
                    certificateGeneratedAt: new Date()
                  }
                }
              })
              .where(eq(onboardingSession.sessionId, session.sessionId));
            
            return res.json({
              success: true,
              certificateUrl: certificateResult.url,
              message: "Certificate retrieved successfully",
              generatedAt: new Date()
            });
          }
        } catch (error) {
          console.error("Error creating/retrieving certificate:", error);
        }
      }
    }

    // No certificate found
    return res.status(404).json({
      success: false,
      error: 'Certificate not found. Please complete the pitch deck analysis first.',
      message: 'Certificates are generated automatically after successful pitch deck scoring.'
    });

  } catch (error) {
    console.error('Certificate request error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve certificate'
    });
  }
}

export async function downloadCertificate(req: Request, res: Response) {
  try {
    const { filename } = req.params;
    const filePath = `./uploads/${filename}`;
    
    const fs = await import('fs/promises');
    
    // Check if file exists
    try {
      await fs.access(filePath);
    } catch (error) {
      return res.status(404).json({
        success: false,
        error: 'Certificate file not found'
      });
    }
    
    // Set headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    
    // Stream the file
    const fileBuffer = await fs.readFile(filePath);
    res.send(fileBuffer);
    
  } catch (error) {
    console.error('Error downloading certificate:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to download certificate'
    });
  }
}

export async function getCertificateStatus(req: Request, res: Response) {
  try {
    const { ventureId } = req.params;

    if (!ventureId) {
      return res.status(400).json({ 
        success: false, 
        error: 'Venture ID is required' 
      });
    }

    const venture = await storage.getVenture(ventureId);
    if (!venture) {
      return res.status(404).json({ 
        success: false, 
        error: 'Venture not found' 
      });
    }

    return res.json({
      success: true,
      hasCertificate: !!venture.certificateUrl,
      certificateUrl: venture.certificateUrl || null,
      generatedAt: venture.certificateGeneratedAt || null
    });

  } catch (error) {
    console.error('Certificate status check error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}