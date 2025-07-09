import { Request, Response } from 'express';
import { certificateService } from '../services/certificate-service';
import { storage } from '../storage';

export async function generateCertificate(req: Request, res: Response) {
  try {
    const { ventureId, forceRegenerate = false } = req.body;

    if (!ventureId) {
      return res.status(400).json({ 
        success: false, 
        error: 'Venture ID is required' 
      });
    }

    console.log(`Certificate generation requested for venture: ${ventureId}`);
    
    // Check EastEmblem API availability first
    const { eastEmblemAPI } = await import('../eastemblem-api');
    console.log('EastEmblem API status at start:', eastEmblemAPI.getStatus());

    // Check if venture exists, or if this is a session ID, find the associated venture
    let venture = await storage.getVenture(ventureId);
    
    // First check if this venture already has a certificate (unless forcing regeneration)
    if (venture && venture.certificateUrl && !forceRegenerate) {
      console.log(`Certificate already exists for venture ${venture.name}: ${venture.certificateUrl}`);
      return res.json({
        success: true,
        certificateUrl: venture.certificateUrl,
        message: "Certificate already exists",
        pdfGenerated: false,
        uploadedToCloud: true,
        useExistingCertificate: true
      });
    }
    
    if (!venture) {
      // Try to find venture by founder ID if this is a session/founder ID
      const ventures = await storage.getVenturesByFounderId(ventureId);
      if (ventures && ventures.length > 0) {
        venture = ventures[0]; // Use the most recent venture
        console.log(`Found venture via founder ID: ${venture.ventureId}`);
      } else {
        // If this is a session ID, try to get session data for fallback certificate
        try {
          const { onboardingManager } = await import('../onboarding');
          const session = await onboardingManager.getSession(ventureId);
          console.log('Session data found:', !!session);
          if (session) {
            // Check if session already has a certificate URL (unless forcing regeneration)
            const existingCertificateUrl = session.stepData?.certificate?.certificateUrl;
            if (existingCertificateUrl && !forceRegenerate) {
              console.log(`Certificate already exists for session ${ventureId}: ${existingCertificateUrl}`);
              return res.json({
                success: true,
                certificateUrl: existingCertificateUrl,
                message: "Certificate already exists for this session",
                pdfGenerated: false,
                uploadedToCloud: true,
                useExistingCertificate: true
              });
            }
            
            console.log('Creating certificate from session data');
            console.log('Session structure keys:', Object.keys(session));
            
            // Extract data from session (stepData contains the actual data)
            const stepData = session.stepData || session;
            const founderData = stepData.founder || {};
            const ventureData = stepData.venture || {};
            const processingData = stepData.processing || {};
            const scoringResult = processingData.scoringResult || {};
            
            console.log('Extracted venture name:', ventureData.name);
            console.log('Extracted founder name:', founderData.fullName);
            console.log('Extracted score:', scoringResult.output?.total_score);
            
            // Use actual scoring data if available
            const actualScore = scoringResult.output?.total_score || 75;
            const actualTags = scoringResult.output?.tags || ['Problem Hunter', 'Solution Builder', 'Market Validator'];
            
            // Create certificate directly from session data
            const certificateData = {
              ventureName: ventureData.name || 'Your Venture',
              founderName: founderData.fullName || 'Founder',
              proofScore: actualScore,
              date: new Date().toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              }),
              unlockedTags: actualTags.slice(0, 5), // Limit to first 5 tags
              scoreCategory: actualScore >= 90 ? 'Leader in Validation' : 
                           actualScore >= 80 ? 'Investor Match Ready' : 
                           actualScore >= 70 ? 'ProofScaler Candidate' : 'Validation Journey'
            };
            
            console.log('Certificate data:', certificateData);
            
            const { certificateService } = await import('../services/certificate-service');
            const pdfBuffer = await certificateService.createPDFCertificate(certificateData);
            
            if (pdfBuffer) {
              // Try to upload to 0_Overview folder if folder structure exists
              let shareableUrl = null;
              
              // Check multiple locations for folder structure
              console.log('Checking session for folder structure...');
              console.log('Session stepData keys:', Object.keys(session.stepData || {}));
              
              let folderStructure = null;
              
              // Try to find folder structure in different locations
              if (session.stepData?.venture?.folderStructure) {
                folderStructure = session.stepData.venture.folderStructure;
                console.log('Found folder structure in venture');
              } else if (session.stepData?.processing?.folderStructure) {
                folderStructure = session.stepData.processing.folderStructure;
                console.log('Found folder structure in processing');
              } else if (session.stepData?.folderStructure) {
                folderStructure = session.stepData.folderStructure;
                console.log('Found folder structure in stepData root');
              }
              
              if (folderStructure) {
                console.log('Session has folder structure, attempting upload to 0_Overview folder...');
                console.log('Folder structure found:', folderStructure);
                
                try {
                  const { certificateService } = await import('../services/certificate-service');
                  
                  console.log('EastEmblem API status for upload:', eastEmblemAPI.getStatus());
                  
                  if (!eastEmblemAPI.isConfigured()) {
                    console.log('EastEmblem API not configured, skipping cloud upload');
                  } else {
                    console.log('EastEmblem API is configured, proceeding with upload to 0_Overview folder');
                    
                    // Extract 0_Overview folder ID from session
                    const overviewFolderId = folderStructure.folders?.['0_Overview'];
                    if (overviewFolderId) {
                      console.log(`Uploading certificate to 0_Overview folder: ${overviewFolderId}`);
                      
                      const fileName = `${certificateData.ventureName.replace(/[^a-zA-Z0-9]/g, '_')}_Validation_Certificate_${Date.now()}.pdf`;
                      
                      // Direct upload to EastEmblem API with allowShare=true
                      const uploadResult = await eastEmblemAPI.uploadFile(
                        pdfBuffer,
                        fileName,
                        overviewFolderId,
                        ventureId, // onboardingId
                        true // allowShare for shareable download link
                      );
                      
                      console.log('Checking upload result for URL...');
                      console.log('uploadResult.url:', uploadResult?.url);
                      console.log('uploadResult.download_url:', uploadResult?.download_url);
                      
                      if (uploadResult?.url || uploadResult?.download_url) {
                        shareableUrl = uploadResult.url || uploadResult.download_url;
                        console.log('Certificate uploaded successfully with shareable URL:', shareableUrl);
                      } else {
                        console.log('Upload succeeded but no shareable download URL received');
                        console.log('Upload result:', uploadResult);
                      }
                    } else {
                      console.log('0_Overview folder ID not found in folder structure');
                    }
                  }
                } catch (uploadError) {
                  console.log('Upload failed for session certificate:', uploadError);
                }
              } else {
                console.log('No folder structure found in session stepData');
                console.log('Available stepData:', JSON.stringify(session.stepData, null, 2));
              }
              
              // Fallback: Store locally if no shareable URL
              if (!shareableUrl) {
                const filename = `${certificateData.ventureName.replace(/[^a-zA-Z0-9]/g, '_')}_Validation_Certificate.pdf`;
                const tempPath = `./uploads/${filename}`;
                
                const fs = await import('fs/promises');
                await fs.writeFile(tempPath, pdfBuffer);
                shareableUrl = `/api/certificate/download/${encodeURIComponent(filename)}`;
              }
              
              // Save certificate URL to session data for future requests
              try {
                await onboardingManager.updateSession(ventureId, "certificate", {
                  certificateUrl: shareableUrl,
                  certificateGeneratedAt: new Date().toISOString()
                });
                console.log('Certificate URL saved to session data');
              } catch (sessionUpdateError) {
                console.log('Could not update session with certificate URL:', sessionUpdateError);
              }
              
              // Try to update venture with certificate URL if this is a session linked to a venture
              try {
                const ventureData = stepData.venture;
                if (ventureData && ventureData.ventureId) {
                  console.log(`Updating venture ${ventureData.ventureId} with certificate URL`);
                  await storage.updateVenture(ventureData.ventureId, {
                    certificateUrl: shareableUrl,
                    certificateGeneratedAt: new Date()
                  });
                }
              } catch (updateError) {
                console.log('Could not update venture with certificate URL:', updateError);
              }
              
              console.log('Session certificate PDF generated successfully');
              return res.status(200).json({
                success: true,
                certificateUrl: shareableUrl,
                message: shareableUrl.startsWith('/api/') ? 'Certificate generated locally' : 'Certificate generated and uploaded to 0_Overview folder',
                pdfGenerated: true,
                uploadedToCloud: !shareableUrl.startsWith('/api/'),
                useShareableUrl: !shareableUrl.startsWith('/api/')
              });
            }
          } else {
            // Create a generic demo certificate if no session data
            console.log('No session data found, creating generic demo certificate');
            const certificateData = {
              ventureName: 'Demo Venture',
              founderName: 'Demo Founder',
              proofScore: 75,
              date: new Date().toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              }),
              unlockedTags: ['Problem Hunter', 'Solution Builder', 'Market Validator'],
              scoreCategory: 'ProofScaler Candidate'
            };
            
            const { certificateService } = await import('../services/certificate-service');
            const pdfBuffer = await certificateService.createPDFCertificate(certificateData);
            
            if (pdfBuffer) {
              // Store the PDF temporarily for download
              const filename = `${certificateData.ventureName.replace(/[^a-zA-Z0-9]/g, '_')}_Validation_Certificate.pdf`;
              const tempPath = `./uploads/${filename}`;
              
              const fs = await import('fs/promises');
              await fs.writeFile(tempPath, pdfBuffer);
              
              console.log('Demo certificate PDF generated successfully');
              return res.status(200).json({
                success: true,
                certificateUrl: `/api/certificate/download/${encodeURIComponent(filename)}`,
                message: 'Demo certificate generated successfully',
                pdfGenerated: true,
                uploadedToCloud: false,
                filename
              });
            }
          }
        } catch (error) {
          console.log('Error in certificate generation:', error);
        }
      }
    }
    
    if (!venture) {
      return res.status(404).json({ 
        success: false, 
        error: 'Venture not found' 
      });
    }

    try {
      // Generate certificate PDF using the actual venture ID
      const pdfResult = await certificateService.generateCertificate(venture.ventureId);
      
      if (!pdfResult) {
        return res.status(500).json({
          success: false,
          error: 'Failed to generate certificate PDF'
        });
      }

      console.log('PDF generated successfully, attempting upload to 0_Overview folder...');

      // Try to upload to 0_Overview folder and get shareable URL
      const shareableUrl = await certificateService.uploadCertificateAndGetUrl(venture.ventureId, pdfResult.buffer);
      
      console.log('Upload attempt completed, updating database...');
      
      // Always update the venture with certificate generation status
      await storage.updateVenture(venture.ventureId, {
        certificateUrl: shareableUrl || 'certificate-generated',
        certificateGeneratedAt: new Date()
      });
      
      console.log('Database updated successfully');
      
      return res.json({
        success: true,
        certificateUrl: shareableUrl,
        message: shareableUrl ? 'Certificate generated and uploaded to 0_Overview folder' : 'Certificate generated locally',
        pdfGenerated: true,
        uploadedToCloud: !!shareableUrl,
        useShareableUrl: !!shareableUrl
      });
      
    } catch (innerError) {
      console.error('Inner certificate generation error:', innerError);
      throw innerError;
    }

  } catch (error) {
    console.error('Certificate generation error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to generate certificate'
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