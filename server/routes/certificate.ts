import { Request, Response } from 'express';
import { storage } from '../storage';
import { randomUUID } from 'crypto';
import { appLogger } from '../utils/logger';

// Standalone function for certificate generation (no HTTP context needed)
export async function createCertificateForSession(sessionId: string) {
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

    // Check if certificate already exists
    if (session.stepData?.processing?.certificateUrl) {
      const existingUrl = session.stepData.processing.certificateUrl;
      
      // Still update database even if certificate exists in session
      try {
        const { documentUpload, venture } = await import('@shared/schema');
        const ventureId = session.stepData?.venture?.ventureId;
        
        if (ventureId) {
          // Update venture table with certificate URL
          await db
            .update(venture)
            .set({
              certificateUrl: existingUrl,
              certificateGeneratedAt: new Date(),
              updatedAt: new Date()
            })
            .where(eq(venture.ventureId, ventureId));
          appLogger.business("✓ Venture table updated with existing certificate URL");
          
          // Try to create document_upload record (ignore if already exists)
          try {
            await db.insert(documentUpload).values({
              ventureId: ventureId,
              fileName: 'validation_certificate.pdf',
              originalName: 'validation_certificate.pdf',
              filePath: '/generated/certificate.pdf',
              fileSize: 0,
              mimeType: 'application/pdf',
              uploadStatus: 'completed',
              processingStatus: 'completed',
              sharedUrl: existingUrl
            });
            appLogger.business("✓ Certificate document_upload record created", { ventureId, fileName: 'validation_certificate.pdf' });
          } catch (docError) {
            // Document record might already exist, that's ok
            appLogger.business("Certificate document record might already exist", { ventureId });
          }
        }
      } catch (error) {
        appLogger.business("Failed to update database with existing certificate:", error);
      }
      
      return {
        success: true,
        certificateUrl: existingUrl,
        message: "Certificate already exists"
      };
    }

    // Check if we have scoring data
    if (!session.stepData?.processing?.scoringResult) {
      throw new Error('No scoring data available');
    }

    const scoringResult = session.stepData.processing.scoringResult;
    const totalScore = scoringResult.output?.total_score || 0;
    const folderStructure = session.stepData.folderStructure;
    const overviewFolderId = folderStructure?.folders?.["0_Overview"];

    if (!overviewFolderId || totalScore <= 0) {
      throw new Error('Invalid scoring data or folder structure');
    }

    // Import EastEmblem API
    const { eastEmblemAPI } = await import('../eastemblem-api');

    if (!eastEmblemAPI.isConfigured()) {
      throw new Error('EastEmblem API not configured');
    }

    // Create certificate
    const certificateResult = await eastEmblemAPI.createCertificate(
      overviewFolderId,
      totalScore,
      sessionId,
      false // Set to false for onboarding flow - true only when user completes course
    );

    if (!certificateResult.url) {
      throw new Error('Certificate creation failed');
    }

    // Store certificate URL in session
    const updatedStepData = {
      ...session.stepData,
      processing: {
        ...session.stepData.processing,
        certificateUrl: certificateResult.url,
        certificateGeneratedAt: new Date().toISOString()
      }
    };

    // Update session with certificate URL
    await db
      .update(onboardingSession)
      .set({
        stepData: updatedStepData,
        updatedAt: new Date()
      })
      .where(eq(onboardingSession.sessionId, sessionId));

    // Create document_upload record for certificate
    try {
      const { documentUpload } = await import('@shared/schema');
      
      // Get venture ID from session
      const ventureId = session.stepData?.venture?.ventureId;
      if (ventureId) {
        await db.insert(documentUpload).values({
          ventureId: ventureId,
          fileName: certificateResult.name || 'validation_certificate.pdf',
          originalName: certificateResult.name || 'validation_certificate.pdf',
          filePath: '/generated/certificate.pdf',
          fileSize: certificateResult.size || 1024000, // Use actual size from API or reasonable default
          mimeType: 'application/pdf',
          uploadStatus: 'completed',
          processingStatus: 'completed',
          sharedUrl: certificateResult.url,
          folderId: certificateResult.folderId || overviewFolderId, // Use folder ID from API or session
          eastemblemFileId: certificateResult.id
        });
        appLogger.business("✓ Certificate document_upload record created");
        
        // Update venture table with certificate URL
        const { venture } = await import('@shared/schema');
        await db
          .update(venture)
          .set({
            certificateUrl: certificateResult.url,
            certificateGeneratedAt: new Date(),
            updatedAt: new Date()
          })
          .where(eq(venture.ventureId, ventureId));
        appLogger.business("✓ Venture table updated with certificate URL");
      }
    } catch (error) {
      appLogger.business("Failed to create certificate document record:", error);
      // Don't fail the entire process
    }



    return {
      success: true,
      certificateUrl: certificateResult.url,
      message: "Certificate created successfully"
    };

  } catch (error) {
    appLogger.business('Certificate creation error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

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

    appLogger.business(`Certificate request for identifier: ${identifier}`);
    
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
          appLogger.business(`Found venture via founder ID: ${venture.ventureId}`);
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
          appLogger.business(`Found session: ${session.sessionId}`);
          
          // Try to find venture by founder ID from session
          if (session.founderId) {
            const ventures = await storage.getVenturesByFounderId(session.founderId);
            if (ventures && ventures.length > 0) {
              venture = ventures[0];
              appLogger.business(`Found venture via session founder ID: ${venture.ventureId}`);
            }
          }
        }
      } catch (error) {
        appLogger.business('Error fetching session:', error);
      }
    }

    // Check if we have a venture with certificate
    if (venture && venture.certificateUrl) {
      appLogger.business(`Certificate exists for venture ${venture.name}: ${venture.certificateUrl}`);
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
      appLogger.business(`Certificate found in session data: ${certificateUrl}`);
      
      // Still update database even if certificate exists in session
      try {
        const { db } = await import('../db');
        const { documentUpload, venture } = await import('@shared/schema');
        const { eq } = await import('drizzle-orm');
        const ventureId = session.stepData?.venture?.ventureId;
        
        if (ventureId) {
          // Update venture table with certificate URL
          await db
            .update(venture)
            .set({
              certificateUrl: certificateUrl,
              certificateGeneratedAt: new Date(),
              updatedAt: new Date()
            })
            .where(eq(venture.ventureId, ventureId));
          appLogger.business("✓ Venture table updated with existing certificate URL");
          
          // Try to create document_upload record (ignore if already exists)
          try {
            const { randomUUID } = await import('crypto');
            await db.insert(documentUpload).values({
              uploadId: randomUUID(),
              ventureId: ventureId,
              fileName: 'validation_certificate.pdf',
              originalName: 'validation_certificate.pdf',
              filePath: '/generated/certificate.pdf',
              fileType: 'pdf',
              fileSize: 0,
              mimeType: 'application/pdf',
              uploadStatus: 'completed',
              processingStatus: 'completed',
              sharedUrl: certificateUrl,
              uploadedBy: 'system'
            });
            appLogger.business("✓ Certificate document_upload record created");
          } catch (docError) {
            // Document record might already exist, that's ok
            appLogger.business("Certificate document record might already exist:", docError);
          }
        }
      } catch (error) {
        appLogger.business("Failed to update database with existing certificate:", error);
      }
      
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
            appLogger.business(`Attempting to create certificate for session ${session.sessionId} with score ${totalScore}`);
            
            const certificateResult = await eastEmblemAPI.createCertificate(
              overviewFolderId,
              totalScore,
              session.sessionId,
              false // is_course_complete = false for pitch deck validation
            );
            
            appLogger.business("Certificate created/retrieved successfully:", certificateResult);
            
            // Update session with certificate URL
            const { db } = await import('../db');
            const { onboardingSession, venture, documentUpload } = await import('@shared/schema');
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

            // Update venture table with certificate URL
            const ventureId = session.stepData?.venture?.ventureId;
            if (ventureId) {
              const { venture: ventureTable } = await import('@shared/schema');
              await db
                .update(ventureTable)
                .set({
                  certificateUrl: certificateResult.url,
                  certificateGeneratedAt: new Date(),
                  updatedAt: new Date()
                })
                .where(eq(ventureTable.ventureId, ventureId));
              appLogger.business("✓ Venture table updated with certificate URL");

              // Create document_upload record for certificate
              const { randomUUID } = await import('crypto');
              await db.insert(documentUpload).values({
                uploadId: randomUUID(),
                ventureId: ventureId,
                fileName: certificateResult.name || 'validation_certificate.pdf',
                originalName: certificateResult.name || 'validation_certificate.pdf',
                filePath: '/generated/certificate.pdf',
                fileType: 'pdf',
                fileSize: certificateResult.size || 512000, // Use actual size from API or default 512KB
                mimeType: 'application/pdf',
                uploadStatus: 'completed',
                processingStatus: 'completed',
                sharedUrl: certificateResult.url,
                folderId: certificateResult.folderId || null, // Use actual folder ID from API if available
                eastemblemFileId: certificateResult.id,
                uploadedBy: 'system'
              });
              appLogger.business("✓ Certificate document_upload record created");
            }
            
            return res.json({
              success: true,
              certificateUrl: certificateResult.url,
              message: "Certificate retrieved successfully",
              generatedAt: new Date()
            });
          }
        } catch (error) {
          appLogger.business("Error creating/retrieving certificate:", error);
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
    appLogger.business('Certificate request error:', error);
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
    appLogger.business('Error downloading certificate:', error);
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
    appLogger.business('Certificate status check error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}