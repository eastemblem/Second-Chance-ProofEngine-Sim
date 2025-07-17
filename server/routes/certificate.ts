import { Request, Response } from 'express';
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

    console.log(`Certificate request for venture: ${ventureId}`);
    
    // Check if venture exists
    let venture = await storage.getVenture(ventureId);
    
    if (!venture) {
      // Try to find venture by founder ID
      const ventures = await storage.getVenturesByFounderId(ventureId);
      if (ventures && ventures.length > 0) {
        venture = ventures[0];
        console.log(`Found venture via founder ID: ${venture.ventureId}`);
      }
    }
    
    if (!venture) {
      return res.status(404).json({ 
        success: false, 
        error: 'Venture not found' 
      });
    }

    // Check if certificate already exists
    if (venture.certificateUrl) {
      console.log(`Certificate exists for venture ${venture.name}: ${venture.certificateUrl}`);
      return res.json({
        success: true,
        certificateUrl: venture.certificateUrl,
        message: "Certificate already exists",
        generatedAt: venture.certificateGeneratedAt
      });
    }

    // No certificate found - it should be generated automatically after scoring
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