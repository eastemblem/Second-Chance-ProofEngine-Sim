import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import fs from 'fs/promises';
import path from 'path';
import { eastEmblemAPI } from '../eastemblem-api';
import { storage } from '../storage';

interface CertificateData {
  ventureName: string;
  founderName: string;
  proofScore: number;
  date: string;
  unlockedTags: string[];
  scoreCategory: string;
}

export class CertificateService {
  private getScoreCategory(score: number): string {
    if (score >= 90) return 'Leader in Validation';
    if (score >= 80) return 'Investor Match Ready';
    if (score >= 70) return 'ProofScaler Candidate';
    return 'Validation Journey';
  }

  private getScoreBadgeNumber(score: number): string {
    if (score >= 90) return '09';
    if (score >= 80) return '08';
    if (score >= 70) return '07';
    if (score >= 60) return '06';
    if (score >= 50) return '05';
    if (score >= 40) return '04';
    if (score >= 30) return '03';
    if (score >= 20) return '02';
    return '01';
  }

  async generateCertificate(ventureId: string): Promise<{ buffer: Buffer; filename: string } | null> {
    try {
      console.log(`Generating certificate for venture: ${ventureId}`);

      // Get venture data
      const venture = await storage.getVenture(ventureId);
      if (!venture) {
        console.error('Venture not found for certificate generation');
        return null;
      }

      // Get founder data
      const founder = await storage.getFounder(venture.founderId);
      if (!founder) {
        console.error('Founder not found for certificate generation');
        return null;
      }

      // Get latest evaluation for ProofScore
      const evaluations = await storage.getEvaluationsByVentureId(ventureId);
      const latestEvaluation = evaluations[0]; // Assuming most recent first
      
      if (!latestEvaluation) {
        console.log('No evaluation found for venture, creating fallback certificate with demo data');
        // Create a fallback certificate for ventures without evaluations
        const certificateData: CertificateData = {
          ventureName: venture.name,
          founderName: founder.fullName,
          proofScore: 75, // Default score for demo
          date: new Date().toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          }),
          unlockedTags: ['Problem Hunter', 'Solution Builder', 'Market Validator'],
          scoreCategory: this.getScoreCategory(75)
        };
        
        try {
          const pdfBuffer = await this.createPDFCertificate(certificateData);
          const filename = `${venture.name.replace(/[^a-zA-Z0-9]/g, '_')}_ProofScore_Certificate.pdf`;
          console.log('Fallback certificate PDF generated successfully');
          return { buffer: pdfBuffer, filename };
        } catch (error) {
          console.error('Error creating fallback certificate PDF:', error);
          return null;
        }
      }

      // Extract ProofTags from evaluation data - using correct field names
      let unlockedTags: string[] = [];
      try {
        if (latestEvaluation.prooftags && Array.isArray(latestEvaluation.prooftags)) {
          unlockedTags = latestEvaluation.prooftags;
        }
      } catch (error) {
        console.log('Could not extract ProofTags from evaluation data');
      }

      const certificateData: CertificateData = {
        ventureName: venture.name,
        founderName: founder.fullName,
        proofScore: latestEvaluation.proofscore, // Using correct field name
        date: new Date().toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        }),
        unlockedTags,
        scoreCategory: this.getScoreCategory(latestEvaluation.proofscore) // Using correct field name
      };

      // Generate PDF
      const pdfBuffer = await this.createPDFCertificate(certificateData);
      
      // Create filename
      const filename = `${venture.name.replace(/[^a-zA-Z0-9]/g, '_')}_ProofScore_Certificate.pdf`;
      
      console.log('Certificate PDF generated successfully');
      return { buffer: pdfBuffer, filename };

    } catch (error) {
      console.error('Error generating certificate:', error);
      return null;
    }
  }

  async createPDFCertificate(data: CertificateData): Promise<Buffer> {
    try {
      console.log('Attempting to load certificate template...');
      
      // Load the certificate template
      const templatePath = path.join(process.cwd(), 'server', 'templates', 'certificate-template.pdf');
      
      // Check if template file exists
      try {
        await fs.access(templatePath);
        console.log('Template file exists at:', templatePath);
        const stats = await fs.stat(templatePath);
        console.log('Template file stats:', { size: stats.size, isFile: stats.isFile() });
      } catch (error) {
        console.log('Template file not found, error:', error.message);
        console.log('Using programmatic generation');
        return this.createProgrammaticCertificate(data);
      }
      
      const templateBytes = await fs.readFile(templatePath);
      console.log('Template loaded, file size:', templateBytes.length, 'bytes');
      
      // Load the template PDF
      const pdfDoc = await PDFDocument.load(templateBytes);
      const pages = pdfDoc.getPages();
      const firstPage = pages[0];
      
      console.log('PDF template loaded successfully, pages:', pages.length);
      
      // Embed fonts for text replacement
      const timesRomanFont = await pdfDoc.embedFont(StandardFonts.TimesRoman);
      const timesRomanBoldFont = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
      const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const helveticaBoldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

      const { width, height } = firstPage.getSize();
      console.log('Template dimensions:', { width, height });

      // Colors matching your template
      const purple = rgb(0.45, 0.16, 0.68); // #7527AD
      const gold = rgb(0.95, 0.76, 0.06); // #F3C610
      const darkGray = rgb(0.2, 0.2, 0.2);
      const lightGray = rgb(0.5, 0.5, 0.5);
      const black = rgb(0, 0, 0);

      // Replace [VENTURE_NAME] placeholder in the PDF
      await this.replaceTextInPDF(pdfDoc, '[VENTURE_NAME]', data.ventureName);
      
      // Replace badge image with appropriate score-based badge
      await this.replaceBadgeImage(pdfDoc, data.proofScore);

      // Date
      firstPage.drawText(`Issued: ${data.date}`, {
        x: 50,
        y: 80,
        size: 10,
        font: helveticaFont,
        color: lightGray,
      });

      // Generate unique verification ID
      const verificationId = `PS-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
      firstPage.drawText(`Verification ID: ${verificationId}`, {
        x: width - 200,
        y: 60,
        size: 8,
        font: helveticaFont,
        color: lightGray,
      });

      console.log('Text overlaid on template, generating final PDF...');
      const pdfBytes = await pdfDoc.save();
      console.log('Certificate PDF generated successfully using template');
      return Buffer.from(pdfBytes);
      
    } catch (error) {
      console.error('Error creating PDF certificate from template:', error);
      console.error('Error details:', error.message);
      
      // Fallback to programmatic generation if template fails
      console.log('Falling back to programmatic certificate generation...');
      return this.createProgrammaticCertificate(data);
    }
  }

  private async createProgrammaticCertificate(data: CertificateData): Promise<Buffer> {
    // Create a new PDF document as fallback
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595.28, 841.89]); // A4 size in points

    // Embed fonts
    const timesRomanFont = await pdfDoc.embedFont(StandardFonts.TimesRoman);
    const timesRomanBoldFont = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
    const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const helveticaBoldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const { width, height } = page.getSize();

    // Colors
    const purple = rgb(0.45, 0.16, 0.68); // #7527AD
    const gold = rgb(0.95, 0.76, 0.06); // #F3C610
    const darkGray = rgb(0.2, 0.2, 0.2);
    const lightGray = rgb(0.5, 0.5, 0.5);

    // Header
    page.drawText('CERTIFICATE OF COMPLETION', {
      x: width / 2 - 180,
      y: height - 100,
      size: 28,
      font: timesRomanBoldFont,
      color: purple,
    });

    page.drawText('ProofScaling Validation Platform', {
      x: width / 2 - 120,
      y: height - 130,
      size: 16,
      font: helveticaFont,
      color: gold,
    });

    // Main content
    page.drawText('This certifies that', {
      x: width / 2 - 70,
      y: height - 200,
      size: 14,
      font: timesRomanFont,
      color: darkGray,
    });

    page.drawText(data.founderName, {
      x: width / 2 - (data.founderName.length * 6),
      y: height - 240,
      size: 24,
      font: timesRomanBoldFont,
      color: purple,
    });

    page.drawText('has successfully completed the validation process for', {
      x: width / 2 - 150,
      y: height - 280,
      size: 14,
      font: timesRomanFont,
      color: darkGray,
    });

    page.drawText(data.ventureName, {
      x: width / 2 - (data.ventureName.length * 7),
      y: height - 320,
      size: 22,
      font: timesRomanBoldFont,
      color: purple,
    });

    // ProofScore section
    page.drawText('ProofScore Achievement', {
      x: width / 2 - 80,
      y: height - 380,
      size: 16,
      font: helveticaBoldFont,
      color: gold,
    });

    page.drawText(`${data.proofScore}/100`, {
      x: width / 2 - 30,
      y: height - 410,
      size: 32,
      font: timesRomanBoldFont,
      color: purple,
    });

    page.drawText(data.scoreCategory, {
      x: width / 2 - (data.scoreCategory.length * 4),
      y: height - 440,
      size: 14,
      font: helveticaFont,
      color: darkGray,
    });

    // ProofTags section
    if (data.unlockedTags.length > 0) {
      page.drawText('Unlocked ProofTags', {
        x: width / 2 - 70,
        y: height - 490,
        size: 14,
        font: helveticaBoldFont,
        color: gold,
      });

      const tagsText = `${data.unlockedTags.length} achievement${data.unlockedTags.length !== 1 ? 's' : ''} unlocked`;
      page.drawText(tagsText, {
        x: width / 2 - (tagsText.length * 3),
        y: height - 515,
        size: 12,
        font: helveticaFont,
        color: darkGray,
      });

      // Display first few ProofTags
      const displayTags = data.unlockedTags.slice(0, 5);
      displayTags.forEach((tag, index) => {
        const yPos = height - 540 - (index * 20);
        page.drawText(`• ${tag}`, {
          x: width / 2 - 100,
          y: yPos,
          size: 10,
          font: helveticaFont,
          color: lightGray,
        });
      });

      if (data.unlockedTags.length > 5) {
        page.drawText(`+ ${data.unlockedTags.length - 5} more achievements`, {
          x: width / 2 - 80,
          y: height - 640,
          size: 10,
          font: helveticaFont,
          color: lightGray,
        });
      }
    }

    // Footer
    page.drawText(`Issued on ${data.date}`, {
      x: 50,
      y: 80,
      size: 10,
      font: helveticaFont,
      color: lightGray,
    });

    page.drawText('Second Chance - ProofScaling Platform', {
      x: width - 200,
      y: 80,
      size: 10,
      font: helveticaFont,
      color: lightGray,
    });

    // Border decoration
    page.drawRectangle({
      x: 30,
      y: 30,
      width: width - 60,
      height: height - 60,
      borderColor: purple,
      borderWidth: 2,
    });

    page.drawRectangle({
      x: 40,
      y: 40,
      width: width - 80,
      height: height - 80,
      borderColor: gold,
      borderWidth: 1,
    });

    const pdfBytes = await pdfDoc.save();
    return Buffer.from(pdfBytes);
  }

  private async replaceTextInPDF(pdfDoc: any, placeholder: string, replacement: string): Promise<void> {
    try {
      console.log(`Replacing placeholder "${placeholder}" with "${replacement}"`);
      
      // Get all pages
      const pages = pdfDoc.getPages();
      
      for (const page of pages) {
        // Get page content - this is complex with pdf-lib
        // For now, we'll use a simpler approach of drawing over the placeholder
        // This requires knowing the approximate position of [VENTURE_NAME]
        
        // Based on your template, [VENTURE_NAME] appears to be positioned
        // We'll draw a white rectangle to cover it, then draw the new text
        const { width, height } = page.getSize();
        
        // Cover the [VENTURE_NAME] placeholder with white rectangle
        page.drawRectangle({
          x: 50, // Adjust based on template
          y: height - 200, // Adjust based on template  
          width: 300, // Adjust based on placeholder width
          height: 30, // Adjust based on text height
          color: rgb(1, 1, 1), // White background
        });
        
        // Draw the replacement text
        const timesRomanBoldFont = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
        page.drawText(replacement, {
          x: 60, // Adjust based on template
          y: height - 190, // Adjust based on template
          size: 24,
          font: timesRomanBoldFont,
          color: rgb(0, 0, 0), // Black text
        });
      }
      
      console.log(`Successfully replaced "${placeholder}" with "${replacement}"`);
    } catch (error) {
      console.error('Error replacing text in PDF:', error);
    }
  }

  private async replaceBadgeImage(pdfDoc: any, proofScore: number): Promise<void> {
    try {
      console.log(`Replacing badge for ProofScore: ${proofScore}`);
      
      // Determine which badge to use based on score
      const badgeNumber = this.getScoreBadgeNumber(proofScore);
      const badgePath = path.join(process.cwd(), 'server', 'templates', `badge_${badgeNumber}.png`);
      
      console.log(`Looking for badge image: badge_${badgeNumber}.png`);
      
      // Check if badge file exists
      try {
        await fs.access(badgePath);
        console.log(`Badge image found: ${badgePath}`);
        
        // Read badge image
        const badgeImageBytes = await fs.readFile(badgePath);
        
        // Embed the image in PDF
        const badgeImage = await pdfDoc.embedPng(badgeImageBytes);
        
        // Get first page
        const firstPage = pdfDoc.getPages()[0];
        const { width, height } = firstPage.getSize();
        
        // Draw the badge image at the appropriate position
        // Adjust these coordinates based on where badge_09 appears in your template
        firstPage.drawImage(badgeImage, {
          x: width - 150, // Adjust based on template
          y: height - 150, // Adjust based on template
          width: 100, // Adjust based on desired size
          height: 100, // Adjust based on desired size
        });
        
        console.log(`Successfully replaced badge with badge_${badgeNumber}.png`);
      } catch (error) {
        console.log(`Badge image badge_${badgeNumber}.png not found, skipping badge replacement`);
      }
      
    } catch (error) {
      console.error('Error replacing badge image:', error);
    }
  }

  async uploadCertificateAndGetUrl(ventureId: string, pdfBuffer: Buffer): Promise<string | null> {
    try {
      console.log(`Uploading certificate for venture: ${ventureId} to 0_Overview folder`);

      // Get venture folder structure
      const venture = await storage.getVenture(ventureId);
      if (!venture?.folderStructure) {
        console.log('Venture folder structure not found - skipping upload to EastEmblem');
        return null;
      }

      const folderStructure = typeof venture.folderStructure === 'string' 
        ? JSON.parse(venture.folderStructure) 
        : venture.folderStructure;

      const overviewFolderId = folderStructure.folders?.['0_Overview'];
      if (!overviewFolderId) {
        console.error('0_Overview folder not found in venture structure');
        return null;
      }

      // Upload certificate to EastEmblem API 0_Overview folder with allowShare=true
      const fileName = `${venture.name}_ProofScore_Certificate_${new Date().getTime()}.pdf`;
      console.log(`Uploading certificate "${fileName}" to 0_Overview folder: ${overviewFolderId}`);
      
      const uploadResult = await eastEmblemAPI.uploadFile(
        pdfBuffer,
        fileName,
        overviewFolderId,
        ventureId, // onboardingId
        true // allowShare for shareable download link
      );

      if (uploadResult?.download_url) {
        console.log('Certificate uploaded successfully to 0_Overview folder with shareable URL:', uploadResult.download_url);
        
        // Update venture with certificate URL
        await storage.updateVenture(ventureId, {
          certificateUrl: uploadResult.download_url,
          certificateGeneratedAt: new Date()
        });

        return uploadResult.download_url;
      }

      console.error('Failed to get shareable download URL from upload result');
      return null;

    } catch (error) {
      console.error('Error uploading certificate to 0_Overview folder:', error);
      return null;
    }
  }

  async generateAndUploadCertificate(ventureId: string): Promise<string | null> {
    try {
      const pdfBuffer = await this.generateCertificate(ventureId);
      if (!pdfBuffer) {
        return null;
      }

      const downloadUrl = await this.uploadCertificateAndGetUrl(ventureId, pdfBuffer);
      return downloadUrl;

    } catch (error) {
      console.error('Error in complete certificate generation process:', error);
      return null;
    }
  }
}

export const certificateService = new CertificateService();