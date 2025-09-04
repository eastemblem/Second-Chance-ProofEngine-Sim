import { appLogger } from '../utils/logger';

export class EmailValidationService {
  // Personal email domains to block
  private static readonly PERSONAL_EMAIL_DOMAINS = [
    'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'live.com',
    'icloud.com', 'me.com', 'mac.com', 'aol.com', 'msn.com', 'comcast.net',
    'verizon.net', 'att.net', 'cox.net', 'charter.net', 'earthlink.net',
    'juno.com', 'netzero.net', 'sbcglobal.net', 'bellsouth.net',
    'protonmail.com', 'tutanota.com', 'yandex.com', 'mail.ru', 'zoho.com'
  ];

  // Common temporary/disposable email domains
  private static readonly TEMP_EMAIL_DOMAINS = [
    '10minutemail.com', 'guerrillamail.com', 'mailinator.com', 'tempmail.org',
    'temp-mail.org', 'throwaway.email', 'maildrop.cc', 'sharklasers.com',
    'guerrillamailblock.com', 'pokemail.net', 'spam4.me', 'tempail.com',
    'temp-mail.io', 'fakemailgenerator.com', 'mohmal.com', 'mytemp.email',
    'emailtemp.org', 'tempemailgen.com', 'disposable.email', 'temp-email.org',
    'burnermail.io', 'minuteinbox.com', 'emailfake.com', 'tempinbox.com',
    'tempmailo.com', 'throwawaymail.com', 'yopmail.com', 'getnada.com',
    'inboxkitten.com', 'tempmail.plus', 'temp.email', 'emaildrop.io',
    'snapmail.cc', 'trashmail.com', 'dispostable.com', 'mailcatch.com',
    'tempmail.ninja', 'fakeinbox.com', 'tempmail.dev', 'emailondeck.com',
    'mailnesia.com', 'tempmail.io', 'tempr.email', 'mail7.io',
    'spamgourmet.com', 'mailexpire.com', 'tempmail.email', 'discard.email'
  ];

  // Pattern recognition for suspicious domains
  private static readonly SUSPICIOUS_PATTERNS = [
    /^\d+[a-z]+\.(com|net|org)$/i,     // Numbers followed by letters
    /^[a-z]{1,4}\d+\.(com|net|org)$/i, // Short letters followed by numbers
    /^temp[a-z0-9]*\./i,               // Starts with "temp"
    /^mail[a-z0-9]*\./i,               // Starts with "mail" (generic)
    /^fake[a-z0-9]*\./i,               // Starts with "fake"
    /^test[a-z0-9]*\./i,               // Starts with "test"
    /^spam[a-z0-9]*\./i,               // Starts with "spam"
    /^trash[a-z0-9]*\./i,              // Starts with "trash"
    /^disposable[a-z0-9]*\./i,         // Starts with "disposable"
    /^throw[a-z0-9]*\./i               // Starts with "throw" (throwaway)
  ];

  /**
   * Validate email against personal and temporary email providers
   */
  static validateEmail(email: string): EmailValidationResult {
    if (!email || typeof email !== 'string') {
      return {
        isValid: false,
        error: 'Please provide a valid email address',
        errorType: 'invalid_format'
      };
    }

    const emailLower = email.toLowerCase().trim();
    const domain = this.extractDomain(emailLower);

    if (!domain) {
      return {
        isValid: false,
        error: 'Please provide a valid email address',
        errorType: 'invalid_format'
      };
    }

    // Check for personal email domains
    if (this.PERSONAL_EMAIL_DOMAINS.includes(domain)) {
      appLogger.auth('Personal email blocked during registration', { 
        email: emailLower, 
        domain, 
        reason: 'personal_email' 
      });
      return {
        isValid: false,
        error: 'Please use your business email address instead of personal email',
        errorType: 'personal_email',
        domain
      };
    }

    // Check for temporary email domains
    if (this.TEMP_EMAIL_DOMAINS.includes(domain)) {
      appLogger.auth('Temporary email blocked during registration', { 
        email: emailLower, 
        domain, 
        reason: 'temp_email' 
      });
      return {
        isValid: false,
        error: 'Temporary email addresses are not permitted. Please use a permanent business email',
        errorType: 'temp_email',
        domain
      };
    }

    // Check for suspicious patterns
    if (this.hasSuspiciousPattern(domain)) {
      appLogger.auth('Suspicious email pattern blocked during registration', { 
        email: emailLower, 
        domain, 
        reason: 'suspicious_pattern' 
      });
      return {
        isValid: false,
        error: 'This email address appears to be temporary. Please use a permanent business email',
        errorType: 'suspicious_pattern',
        domain
      };
    }

    // Email passes all checks
    appLogger.auth('Email validation passed', { 
      email: emailLower, 
      domain, 
      result: 'valid' 
    });
    
    return {
      isValid: true,
      domain
    };
  }

  /**
   * Extract domain from email address
   */
  private static extractDomain(email: string): string | null {
    const emailRegex = /^[^\s@]+@([^\s@]+\.[^\s@]+)$/;
    const match = email.match(emailRegex);
    return match ? match[1].toLowerCase() : null;
  }

  /**
   * Check if domain matches suspicious patterns
   */
  private static hasSuspiciousPattern(domain: string): boolean {
    return this.SUSPICIOUS_PATTERNS.some(pattern => pattern.test(domain));
  }

  /**
   * Get user-friendly suggestion based on error type
   */
  static getEmailSuggestion(errorType: string): string {
    switch (errorType) {
      case 'personal_email':
        return 'Try using your company email (e.g., yourname@yourcompany.com)';
      case 'temp_email':
      case 'suspicious_pattern':
        return 'Use a permanent business email from your organization';
      default:
        return 'Please provide a valid business email address';
    }
  }
}

export interface EmailValidationResult {
  isValid: boolean;
  error?: string;
  errorType?: 'invalid_format' | 'personal_email' | 'temp_email' | 'suspicious_pattern';
  domain?: string;
}