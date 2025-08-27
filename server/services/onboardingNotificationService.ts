import { appLogger } from '../utils/logger';

interface VentureOnboardingData {
  founderName: string;
  founderEmail: string;
  founderPhone?: string;
  founderRole: string;
  ventureName: string;
  ventureIndustry: string;
  ventureStage: string;
  ventureDescription: string;
  ventureWebsite?: string;
  boxUrl?: string;
  paymentAmount: string;
  paymentDate: string;
  paymentReference: string;
  maskedPaymentDetails: string;
}

export class OnboardingNotificationService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.EASTEMBLEM_API_BASE_URL;
    if (!this.baseUrl) {
      throw new Error('EASTEMBLEM_API_BASE_URL environment variable is required');
    }
  }

  /**
   * Send onboarding success notification to team
   */
  async sendOnboardingSuccessNotification(data: VentureOnboardingData): Promise<boolean> {
    try {
      const subject = `${data.ventureName} has successfully onboarded!`;
      
      const htmlContent = this.generateOnboardingEmailContent(data);
      
      const emailData = {
        to: 'info@get-secondchance.com',
        subject,
        html: htmlContent,
        from: 'notifications@get-secondchance.com'
      };

      const response = await fetch(`${this.baseUrl}/notification/email/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(emailData)
      });

      if (!response.ok) {
        const errorText = await response.text();
        appLogger.email('Failed to send onboarding notification:', {
          status: response.status,
          error: errorText,
          venture: data.ventureName
        });
        return false;
      }

      const result = await response.json();
      appLogger.email('Onboarding notification sent successfully:', {
        venture: data.ventureName,
        founder: data.founderName,
        response: result
      });

      return true;
    } catch (error) {
      appLogger.email('Error sending onboarding notification:', {
        error: error instanceof Error ? error.message : String(error),
        venture: data.ventureName
      });
      return false;
    }
  }

  /**
   * Generate HTML content for onboarding notification email
   */
  private generateOnboardingEmailContent(data: VentureOnboardingData): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>New Venture Onboarded</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #8b5cf6, #fbbf24); padding: 20px; text-align: center; color: white; }
          .content { padding: 20px; background: #f9f9f9; }
          .section { margin-bottom: 20px; padding: 15px; background: white; border-radius: 5px; }
          .section h3 { margin-top: 0; color: #8b5cf6; border-bottom: 2px solid #8b5cf6; padding-bottom: 5px; }
          .info-grid { display: grid; grid-template-columns: 1fr 2fr; gap: 10px; }
          .info-label { font-weight: bold; }
          .highlight { background: #fff3cd; padding: 10px; border-left: 4px solid #fbbf24; margin: 10px 0; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 New Venture Successfully Onboarded!</h1>
            <h2>${data.ventureName}</h2>
          </div>
          
          <div class="content">
            <div class="highlight">
              <strong>A new venture has completed payment and joined the Deal Room review process!</strong>
            </div>
            
            <div class="section">
              <h3>👤 Founder Details</h3>
              <div class="info-grid">
                <div class="info-label">Name:</div>
                <div>${data.founderName}</div>
                <div class="info-label">Email:</div>
                <div>${data.founderEmail}</div>
                <div class="info-label">Role:</div>
                <div>${data.founderRole}</div>
                ${data.founderPhone ? `
                <div class="info-label">Phone:</div>
                <div>${data.founderPhone}</div>
                ` : ''}
              </div>
            </div>
            
            <div class="section">
              <h3>🚀 Venture Details</h3>
              <div class="info-grid">
                <div class="info-label">Company Name:</div>
                <div>${data.ventureName}</div>
                <div class="info-label">Industry:</div>
                <div>${data.ventureIndustry}</div>
                <div class="info-label">Stage:</div>
                <div>${data.ventureStage}</div>
                ${data.ventureWebsite ? `
                <div class="info-label">Website:</div>
                <div><a href="${data.ventureWebsite}" target="_blank">${data.ventureWebsite}</a></div>
                ` : ''}
              </div>
              <div style="margin-top: 15px;">
                <div class="info-label">Description:</div>
                <div style="margin-top: 5px; padding: 10px; background: #f8f9fa; border-radius: 3px;">${data.ventureDescription}</div>
              </div>
            </div>
            
            ${data.boxUrl ? `
            <div class="section">
              <h3>📁 Document Access</h3>
              <div class="info-grid">
                <div class="info-label">Box URL:</div>
                <div><a href="${data.boxUrl}" target="_blank">View Documents</a></div>
              </div>
            </div>
            ` : ''}
            
            <div class="section">
              <h3>💳 Payment Information</h3>
              <div class="info-grid">
                <div class="info-label">Amount:</div>
                <div>${data.paymentAmount}</div>
                <div class="info-label">Date:</div>
                <div>${data.paymentDate}</div>
                <div class="info-label">Reference:</div>
                <div>${data.paymentReference}</div>
                <div class="info-label">Payment Details:</div>
                <div>${data.maskedPaymentDetails}</div>
              </div>
            </div>
            
            <div class="highlight">
              <strong>Next Steps:</strong>
              <ul>
                <li>Venture status has been set to "Reviewing"</li>
                <li>Review the venture documents and complete evaluation</li>
                <li>Update status to "Reviewed" and then "Done" as process completes</li>
              </ul>
            </div>
          </div>
          
          <div class="footer">
            <p>This notification was automatically generated by the Second Chance platform.</p>
            <p>Generated on ${new Date().toLocaleString()}</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}

export const onboardingNotificationService = new OnboardingNotificationService();