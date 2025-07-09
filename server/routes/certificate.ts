import { Request, Response } from 'express';
import { certificateService } from '../services/certificate-service';
import { storage } from '../storage';

export async function generateCertificate(req: Request, res: Response) {
  try {
    const { ventureId } = req.body;

    if (!ventureId) {
      return res.status(400).json({ 
        success: false, 
        error: 'Venture ID is required' 
      });
    }

    console.log(`Certificate generation requested for venture: ${ventureId}`);

    // Check if venture exists, or if this is a session ID, find the associated venture
    let venture = await storage.getVenture(ventureId);
    
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
              // Store the PDF temporarily for download
              const filename = `${certificateData.ventureName.replace(/[^a-zA-Z0-9]/g, '_')}_ProofScore_Certificate.pdf`;
              const tempPath = `./uploads/${filename}`;
              
              const fs = await import('fs/promises');
              await fs.writeFile(tempPath, pdfBuffer);
              
              console.log('Session certificate PDF generated successfully');
              return res.status(200).json({
                success: true,
                certificateUrl: `/api/certificate/download/${encodeURIComponent(filename)}`,
                message: 'Certificate generated successfully',
                pdfGenerated: true,
                uploadedToCloud: false,
                filename
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
              const filename = `${certificateData.ventureName.replace(/[^a-zA-Z0-9]/g, '_')}_ProofScore_Certificate.pdf`;
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

      console.log('PDF generated successfully, attempting upload...');

      // Try to upload and get URL, but don't fail if upload fails
      const downloadUrl = await certificateService.uploadCertificateAndGetUrl(venture.ventureId, pdfResult.buffer);
      
      console.log('Upload attempt completed, updating database...');
      
      // Always update the venture with certificate generation status
      await storage.updateVenture(venture.ventureId, {
        certificateUrl: downloadUrl || 'certificate-generated',
        certificateGeneratedAt: new Date()
      });
      
      console.log('Database updated successfully');
      
      return res.json({
        success: true,
        certificateUrl: downloadUrl,
        message: 'Certificate generated successfully',
        pdfGenerated: true,
        uploadedToCloud: !!downloadUrl
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