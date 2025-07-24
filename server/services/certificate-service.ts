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
    // Force fresh generation by adding timestamp to prevent caching
    console.log(`Generating fresh certificate at ${new Date().toISOString()}`);
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
        console.log('No evaluation found for venture - certificate requires completed analysis');
        throw new Error('Certificate cannot be generated without completed pitch deck analysis. Please complete your analysis first.');
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
      const filename = `${venture.name.replace(/[^a-zA-Z0-9]/g, '_')}_Validation_Certificate_${Date.now()}.pdf`;
      
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

      // Only add minimal verification info, no other text overlays

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
        
        // No background rectangle needed for transparent background
        // Just position the text directly over the template
        
        // Draw the replacement text in gold color with script-style font to match template
        // Use italic font to better match the elegant script style in template
        const scriptFont = await pdfDoc.embedFont(StandardFonts.TimesRomanItalic);
        
        // Calculate text width for centering
        const fontSize = 52; // Slightly larger to match template prominence
        const textWidth = scriptFont.widthOfTextAtSize(replacement, fontSize);
        const centerX = (width - textWidth) / 2;
        
        page.drawText(replacement, {
          x: centerX, // Center the text
          y: height * 0.58, // Position higher at 58% from bottom to match new template
          size: fontSize, // Match template size
          font: scriptFont,
          color: rgb(1, 0.84, 0.0), // Gold color (#FFD700)
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
      const badgePath = path.join(process.cwd(), 'server', 'templates', 'badges', `Badge_${badgeNumber}.png`);
      
      console.log(`Looking for badge image: Badge_${badgeNumber}.png`);
      console.log(`Full badge path: ${badgePath}`);
      
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
        
        // Draw the badge image at bottom 12% of certificate
        // Keep badge perfectly centered horizontally
        const centerX = (width - 90) / 2; // Perfect center position
        const badgeY = height * 0.12; // Position at 12% from bottom
        
        firstPage.drawImage(badgeImage, {
          x: centerX, // Perfect center position
          y: badgeY, // Position at 12% from bottom
          width: 90, // Appropriate size to match logo scale
          height: 90, // Maintain aspect ratio
        });
        
        console.log(`Successfully replaced badge with Badge_${badgeNumber}.png`);
      } catch (error) {
        console.log(`Badge image Badge_${badgeNumber}.png not found, skipping badge replacement`);
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
      const fileName = `${venture.name.replace(/[^a-zA-Z0-9]/g, '_')}_Validation_Certificate.pdf`;
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

        // Track certificate in document_upload table with proper folder mapping
        try {
          // Get the Overview folder ID for this venture
          const proofVaultRecords = await storage.getProofVaultsByVentureId(ventureId);
          const overviewFolder = proofVaultRecords.find(pv => pv.folderName === '0_Overview');
          const overviewFolderId = overviewFolder?.subFolderId || null;
          
          await storage.createDocumentUpload({
            ventureId: ventureId,
            fileName: fileName,
            originalName: fileName,
            filePath: `/certificates/${fileName}`,
            fileSize: pdfBuffer.length,
            mimeType: 'application/pdf',
            uploadStatus: 'completed',
            processingStatus: 'completed',
            eastemblemFileId: uploadResult.id,
            sharedUrl: uploadResult.download_url,
            folderId: overviewFolderId, // Map certificate to Overview folder
          });
          console.log('✓ Certificate tracked in document_upload table with folder mapping:', overviewFolderId);
        } catch (error) {
          console.error('Failed to track certificate in document_upload:', error);
        }

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