import fs from 'fs/promises';
import path from 'path';
import { appLogger } from "../utils/logger";

interface EmailTemplateData {
  [key: string]: any;
  HOST_URL: string;
}

export class EmailService {
  private templatesPath = path.join(process.cwd(), 'server/templates/emails');

  /**
   * Load and process an email template with dynamic data
   */
  async loadTemplate(templateName: string, data: EmailTemplateData): Promise<string> {
    try {
      const templatePath = path.join(this.templatesPath, `${templateName}.html`);
      let template = await fs.readFile(templatePath, 'utf-8');
      
      // Ensure HOST_URL is always set
      const processedData = {
        ...data,
        HOST_URL: data.HOST_URL || process.env.FRONTEND_URL || `https://${process.env.REPLIT_DOMAINS?.split(',')[0]}`
      };

      // Replace all template variables with actual data
      template = this.processTemplate(template, processedData);
      
      return template;
    } catch (error) {
      appLogger.email(`Error loading email template ${templateName}:`, error);
      throw new Error(`Failed to load email template: ${templateName}`);
    }
  }

  /**
   * Process template with data replacement
   */
  private processTemplate(template: string, data: EmailTemplateData): string {
    let processedTemplate = template;

    // Debug: Log URL data before processing
    if (data.CERTIFICATE_DOWNLOAD_URL || data.REPORT_DOWNLOAD_URL) {
      appLogger.email("Processing template with URLs:", {
        CERTIFICATE_DOWNLOAD_URL: data.CERTIFICATE_DOWNLOAD_URL,
        REPORT_DOWNLOAD_URL: data.REPORT_DOWNLOAD_URL
      });
    }

    // Replace simple variables {{VARIABLE_NAME}}
    Object.keys(data).forEach(key => {
      const placeholder = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      const value = data[key];
      
      if (value !== undefined && value !== null) {
        processedTemplate = processedTemplate.replace(placeholder, String(value));
        
        // Debug: Log URL replacements specifically
        if (key === 'CERTIFICATE_DOWNLOAD_URL' || key === 'REPORT_DOWNLOAD_URL') {
          appLogger.email(`Replaced {{${key}}} with: ${value}`);
        }
      }
    });

    // Handle conditional blocks {{#CONDITION}} and {{^CONDITION}}
    processedTemplate = this.processConditionalBlocks(processedTemplate, data);

    return processedTemplate;
  }

  /**
   * Process conditional template blocks
   */
  private processConditionalBlocks(template: string, data: EmailTemplateData): string {
    let processedTemplate = template;

    // Handle {{#CONDITION}}...{{/CONDITION}} blocks (show if truthy)
    const positiveBlockRegex = /\{\{#(\w+)\}\}([\s\S]*?)\{\{\/\1\}\}/g;
    processedTemplate = processedTemplate.replace(positiveBlockRegex, (match, condition, content) => {
      const value = data[condition];
      if (value && (Array.isArray(value) ? value.length > 0 : true)) {
        if (Array.isArray(value)) {
          // Handle array iteration
          return value.map(item => this.processTemplate(content, { ...data, ...item })).join('');
        }
        return this.processTemplate(content, data);
      }
      return '';
    });

    // Handle {{^CONDITION}}...{{/CONDITION}} blocks (show if falsy)
    const negativeBlockRegex = /\{\{\^(\w+)\}\}([\s\S]*?)\{\{\/\1\}\}/g;
    processedTemplate = processedTemplate.replace(negativeBlockRegex, (match, condition, content) => {
      const value = data[condition];
      if (!value || (Array.isArray(value) && value.length === 0)) {
        return this.processTemplate(content, data);
      }
      return '';
    });

    return processedTemplate;
  }

  /**
   * Send email via N8N webhook endpoint
   */
  async sendEmail(
    to: string,
    subject: string,
    templateName: string,
    templateData: EmailTemplateData
  ): Promise<boolean> {
    try {
      // Ensure dynamic values are properly set - use environment variable for domain
      const frontendUrl = process.env.FRONTEND_URL || `https://${process.env.REPLIT_DOMAINS?.split(',')[0]}`;
      const logoUrl = process.env.LOGO_URL || 'https://files.replit.com/assets/second_chance_logo_1750269371846.png';
      const enrichedData = {
        ...templateData,
        HOST_URL: frontendUrl,
        FRONTEND_URL: frontendUrl,
        LOGO_URL: logoUrl,
        PRIVACY_URL: `${frontendUrl}/privacy`,
        TERMS_URL: `${frontendUrl}/terms`,
        CURRENT_YEAR: new Date().getFullYear().toString()
      };

      const htmlContent = await this.loadTemplate(templateName, enrichedData);
      
      // CRITICAL DEBUG: Check what URLs are actually in the final HTML
      if (templateName === 'onboarding') {
        const certMatch = htmlContent.match(/href="([^"]*)" class="download-btn btn-certificate"/);
        const reportMatch = htmlContent.match(/href="([^"]*)" class="download-btn btn-report"/);
        appLogger.email("FINAL HTML CONTAINS THESE URLS:");
        appLogger.email("Certificate URL:", certMatch ? certMatch[1] : 'NOT FOUND');
        appLogger.email("Report URL:", reportMatch ? reportMatch[1] : 'NOT FOUND');
        
        // Also check the template data one more time
        appLogger.email("TEMPLATE DATA BEING USED:");
        appLogger.email("CERTIFICATE_DOWNLOAD_URL:", enrichedData.CERTIFICATE_DOWNLOAD_URL);
        appLogger.email("REPORT_DOWNLOAD_URL:", enrichedData.REPORT_DOWNLOAD_URL);
      }
      
      // Call N8N webhook email API using environment variable
      const baseUrl = process.env.EASTEMBLEM_API_BASE_URL;
      if (!baseUrl) {
        throw new Error('EASTEMBLEM_API_BASE_URL environment variable is required');
      }
      const webhookUrl = `${baseUrl}/webhook/notification/email/send`;
      
      // Log the exact data being sent to N8N
      const emailData = {
        to,
        subject,
        html: htmlContent
      };
      
      console.log("🚨 SENDING TO N8N WEBHOOK:", {
        to: emailData.to,
        subject: emailData.subject,
        htmlContainsCertificateUrl: emailData.html.includes('https://app.box.com/s/dr8mbtnqbtvgtisbv1x7604t2qn4ay2c'),
        htmlContainsReportUrl: emailData.html.includes('https://app.box.com/s/sbsfbif11llqhkzjniihmy80t21ujce8'),
        webhookUrl
      });

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(emailData)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Email API error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const result = await response.json();
      console.log(`Email sent successfully to ${to} via N8N webhook`);
      return true;

    } catch (error) {
      console.error(`Failed to send email to ${to}:`, error);
      return false;
    }
  }

  /**
   * Send verification email
   */
  async sendVerificationEmail(to: string, userName: string, verificationUrl: string): Promise<boolean> {
    return this.sendEmail(
      to,
      '🔐 Verify Your Email - Complete Your Second Chance Registration',
      'email-verification',
      {
        USER_NAME: userName,
        VERIFICATION_URL: verificationUrl,
        HOST_URL: process.env.FRONTEND_URL || `https://${process.env.REPLIT_DOMAINS?.split(',')[0]}`
      }
    );
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(to: string, founderName: string, resetToken: string): Promise<boolean> {
    const frontendUrl = (process.env.FRONTEND_URL || `https://${process.env.REPLIT_DOMAINS?.split(',')[0]}`).replace(/\/+$/, '');
    const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}`;
    
    return this.sendEmail(
      to,
      '🔑 Reset Your Password - Second Chance Platform',
      'password-reset',
      {
        USER_NAME: founderName,
        RESET_URL: resetUrl,
        HOST_URL: frontendUrl
      }
    );
  }

  /**
   * Send welcome email
   */
  async sendWelcomeEmail(to: string, userName: string): Promise<boolean> {
    return this.sendEmail(
      to,
      '🎉 Welcome to Second Chance - Your Startup Journey Begins Now!',
      'welcome-email',
      {
        USER_NAME: userName,
        HOST_URL: process.env.FRONTEND_URL || `https://${process.env.REPLIT_DOMAINS?.split(',')[0]}`
      }
    );
  }

  /**
   * Send onboarding completion email with report and certificate
   */
  async sendOnboardingEmail(
    to: string,
    userName: string,
    proofScore: number,
    scoreBreakdown: any,
    proofTags: string[],
    reportUrl: string,
    certificateUrl: string,
    verificationUrl?: string
  ): Promise<boolean> {
    console.log("📧 EmailService.sendOnboardingEmail called with URLs:", {
      reportUrl,
      certificateUrl,
      verificationUrl
    });
    
    const templateData = {
      USER_NAME: userName,
      PROOF_SCORE: proofScore,
      MILESTONE_LEVEL: this.getMilestoneLevel(proofScore),
      DESIRABILITY_SCORE: scoreBreakdown.desirability || 0,
      FEASIBILITY_SCORE: scoreBreakdown.feasibility || 0,
      VIABILITY_SCORE: scoreBreakdown.viability || 0,
      TRACTION_SCORE: scoreBreakdown.traction || 0,
      READINESS_SCORE: scoreBreakdown.readiness || 0,
      DESIRABILITY_PERCENTAGE: ((scoreBreakdown.desirability || 0) / 20) * 100,
      FEASIBILITY_PERCENTAGE: ((scoreBreakdown.feasibility || 0) / 20) * 100,
      VIABILITY_PERCENTAGE: ((scoreBreakdown.viability || 0) / 20) * 100,
      TRACTION_PERCENTAGE: ((scoreBreakdown.traction || 0) / 20) * 100,
      READINESS_PERCENTAGE: ((scoreBreakdown.readiness || 0) / 20) * 100,
      PROOF_TAGS: proofTags.map(tag => ({ TAG_NAME: tag })),
      REPORT_DOWNLOAD_URL: reportUrl,
      CERTIFICATE_DOWNLOAD_URL: certificateUrl,
      VERIFICATION_URL: verificationUrl || `${(process.env.FRONTEND_URL || `https://${process.env.REPLIT_DOMAINS?.split(',')[0]}`).replace(/\/+$/, '')}/set-password`,
      HOST_URL: process.env.FRONTEND_URL || `https://${process.env.REPLIT_DOMAINS?.split(',')[0]}`
    };
    
    console.log("📧 Template data URLs being sent:", {
      REPORT_DOWNLOAD_URL: templateData.REPORT_DOWNLOAD_URL,
      CERTIFICATE_DOWNLOAD_URL: templateData.CERTIFICATE_DOWNLOAD_URL
    });
    
    return this.sendEmail(
      to,
      `🎉 Welcome to Second Chance - Your Documents Are Ready !`,
      'onboarding',
      templateData
    );
  }

  /**
   * Get milestone level based on ProofScore
   */
  private getMilestoneLevel(score: number): string {
    if (score >= 80) return 'Investment Ready Leader';
    if (score >= 70) return 'Investor Match Ready';
    if (score >= 60) return 'ProofScaler Candidate';
    if (score >= 40) return 'Validation Builder';
    return 'Foundation Stage';
  }
}

export const emailService = new EmailService();