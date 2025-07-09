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

    // Check if venture exists
    const venture = await storage.getVenture(ventureId);
    if (!venture) {
      return res.status(404).json({ 
        success: false, 
        error: 'Venture not found' 
      });
    }

    try {
      // Generate certificate PDF
      const pdfBuffer = await certificateService.generateCertificate(ventureId);
      
      if (!pdfBuffer) {
        return res.status(500).json({
          success: false,
          error: 'Failed to generate certificate PDF'
        });
      }

      console.log('PDF generated successfully, attempting upload...');

      // Try to upload and get URL, but don't fail if upload fails
      const downloadUrl = await certificateService.uploadCertificateAndGetUrl(ventureId, pdfBuffer);
      
      console.log('Upload attempt completed, updating database...');
      
      // Always update the venture with certificate generation status
      await storage.updateVenture(ventureId, {
        certificateUrl: downloadUrl || null,
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