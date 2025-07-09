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
      // Load the certificate template
      const templatePath = path.join(process.cwd(), 'server', 'templates', 'certificate-template.pdf');
      const templateBytes = await fs.readFile(templatePath);
      
      // Load the template PDF
      const pdfDoc = await PDFDocument.load(templateBytes);
      const pages = pdfDoc.getPages();
      const firstPage = pages[0];
      
      // Embed fonts for text replacement
      const timesRomanFont = await pdfDoc.embedFont(StandardFonts.TimesRoman);
      const timesRomanBoldFont = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
      const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const helveticaBoldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

      const { width, height } = firstPage.getSize();

      // Colors
      const purple = rgb(0.45, 0.16, 0.68); // #7527AD
      const gold = rgb(0.95, 0.76, 0.06); // #F3C610
      const darkGray = rgb(0.2, 0.2, 0.2);
      const lightGray = rgb(0.5, 0.5, 0.5);

      // Replace placeholder text with actual data
      // These positions may need adjustment based on your template layout
      
      // Founder Name
      firstPage.drawText(data.founderName, {
        x: width / 2 - (data.founderName.length * 6),
        y: height - 240,
        size: 24,
        font: timesRomanBoldFont,
        color: purple,
      });

      // Venture Name
      firstPage.drawText(data.ventureName, {
        x: width / 2 - (data.ventureName.length * 7),
        y: height - 320,
        size: 22,
        font: timesRomanBoldFont,
        color: purple,
      });

      // ProofScore
      firstPage.drawText(`${data.proofScore}/100`, {
        x: width / 2 - 30,
        y: height - 410,
        size: 32,
        font: timesRomanBoldFont,
        color: purple,
      });

      // Score Category
      firstPage.drawText(data.scoreCategory, {
        x: width / 2 - (data.scoreCategory.length * 4),
        y: height - 440,
        size: 14,
        font: helveticaFont,
        color: darkGray,
      });

      // ProofTags count
      if (data.unlockedTags.length > 0) {
        const tagsText = `${data.unlockedTags.length} ProofTag${data.unlockedTags.length !== 1 ? 's' : ''} Unlocked`;
        firstPage.drawText(tagsText, {
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
          firstPage.drawText(`• ${tag}`, {
            x: width / 2 - 100,
            y: yPos,
            size: 10,
            font: helveticaFont,
            color: lightGray,
          });
        });

        if (data.unlockedTags.length > 5) {
          firstPage.drawText(`+ ${data.unlockedTags.length - 5} more achievements`, {
            x: width / 2 - 80,
            y: height - 640,
            size: 10,
            font: helveticaFont,
            color: lightGray,
          });
        }
      }

      // Date
      firstPage.drawText(`Issued on ${data.date}`, {
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

      const pdfBytes = await pdfDoc.save();
      return Buffer.from(pdfBytes);
    } catch (error) {
      console.error('Error creating PDF certificate from template:', error);
      
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