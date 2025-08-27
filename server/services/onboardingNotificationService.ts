import { appLogger } from '../utils/logger';
import { EmailService } from './emailService';

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
  private emailService: EmailService;

  constructor() {
    this.emailService = new EmailService();
  }

  /**
   * Send onboarding success notification to team using existing email service with template
   */
  async sendOnboardingSuccessNotification(data: VentureOnboardingData): Promise<boolean> {
    try {
      const templateData = {
        FOUNDER_NAME: data.founderName,
        FOUNDER_EMAIL: data.founderEmail,
        FOUNDER_PHONE: data.founderPhone || 'N/A',
        FOUNDER_ROLE: data.founderRole,
        VENTURE_NAME: data.ventureName,
        VENTURE_INDUSTRY: data.ventureIndustry,
        VENTURE_STAGE: data.ventureStage,
        VENTURE_DESCRIPTION: data.ventureDescription,
        VENTURE_WEBSITE: data.ventureWebsite || 'N/A',
        BOX_URL: data.boxUrl || 'N/A',
        PAYMENT_AMOUNT: data.paymentAmount,
        PAYMENT_DATE: data.paymentDate,
        PAYMENT_REFERENCE: data.paymentReference,
        MASKED_PAYMENT_DETAILS: data.maskedPaymentDetails,
        CURRENT_DATE: new Date().toLocaleString()
      };

      const success = await this.emailService.sendEmail(
        'info@get-secondchance.com',
        `${data.ventureName} has successfully onboarded!`,
        'team-payment-notification',
        templateData
      );

      if (success) {
        appLogger.email('Onboarding notification sent successfully:', {
          venture: data.ventureName,
          founder: data.founderName
        });
      } else {
        appLogger.email('Failed to send onboarding notification:', {
          venture: data.ventureName,
          founder: data.founderName
        });
      }

      return success;
    } catch (error) {
      appLogger.email('Error sending onboarding notification:', {
        error: error instanceof Error ? error.message : String(error),
        venture: data.ventureName
      });
      return false;
    }
  }
}

export const onboardingNotificationService = new OnboardingNotificationService();