import { Router } from 'express';
import { emailService } from '../services/emailService.js';

const router = Router();

/**
 * Send verification email
 */
router.post('/send-verification', async (req, res) => {
  try {
    const { email, userName, verificationUrl } = req.body;
    
    if (!email || !userName || !verificationUrl) {
      return res.status(400).json({ 
        error: 'Missing required fields: email, userName, verificationUrl' 
      });
    }

    const success = await emailService.sendVerificationEmail(email, userName, verificationUrl);
    
    if (success) {
      res.json({ success: true, message: 'Verification email sent successfully' });
    } else {
      res.status(500).json({ error: 'Failed to send verification email' });
    }
  } catch (error) {
    console.error('Error sending verification email:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Send welcome email
 */
router.post('/send-welcome', async (req, res) => {
  try {
    const { email, userName } = req.body;
    
    if (!email || !userName) {
      return res.status(400).json({ 
        error: 'Missing required fields: email, userName' 
      });
    }

    const success = await emailService.sendWelcomeEmail(email, userName);
    
    if (success) {
      res.json({ success: true, message: 'Welcome email sent successfully' });
    } else {
      res.status(500).json({ error: 'Failed to send welcome email' });
    }
  } catch (error) {
    console.error('Error sending welcome email:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Send onboarding completion email with report and certificate
 */
router.post('/send-onboarding', async (req, res) => {
  try {
    const { 
      email, 
      userName, 
      proofScore, 
      scoreBreakdown, 
      proofTags, 
      reportUrl, 
      certificateUrl 
    } = req.body;
    
    if (!email || !userName || proofScore === undefined) {
      return res.status(400).json({ 
        error: 'Missing required fields: email, userName, proofScore' 
      });
    }

    const success = await emailService.sendOnboardingEmail(
      email,
      userName,
      proofScore,
      scoreBreakdown || {},
      proofTags || [],
      reportUrl || '',
      certificateUrl || ''
    );
    
    if (success) {
      res.json({ success: true, message: 'Onboarding completion email sent successfully' });
    } else {
      res.status(500).json({ error: 'Failed to send onboarding email' });
    }
  } catch (error) {
    console.error('Error sending onboarding email:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Send custom email using any template
 */
router.post('/send-template', async (req, res) => {
  try {
    const { email, subject, templateName, templateData } = req.body;
    
    if (!email || !subject || !templateName || !templateData) {
      return res.status(400).json({ 
        error: 'Missing required fields: email, subject, templateName, templateData' 
      });
    }

    const success = await emailService.sendEmail(email, subject, templateName, templateData);
    
    if (success) {
      res.json({ success: true, message: `${templateName} email sent successfully` });
    } else {
      res.status(500).json({ error: `Failed to send ${templateName} email` });
    }
  } catch (error) {
    console.error(`Error sending ${req.body.templateName} email:`, error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Preview email template (for testing)
 */
router.post('/preview-template', async (req, res) => {
  try {
    const { templateName, templateData } = req.body;
    
    if (!templateName || !templateData) {
      return res.status(400).json({ 
        error: 'Missing required fields: templateName, templateData' 
      });
    }

    const html = await emailService.loadTemplate(templateName, templateData);
    res.json({ success: true, html });
  } catch (error) {
    console.error('Error previewing email template:', error);
    res.status(500).json({ error: 'Failed to preview template' });
  }
});

/**
 * List available email templates
 */
router.get('/templates', (req, res) => {
  const templates = [
    'email-verification',
    'welcome-email', 
    'appointment-confirmation',
    'progress-update',
    'payment-confirmation',
    'support-response',
    'program-completion',
    'win-back',
    'newsletter',
    'reminder',
    'onboarding'
  ];
  
  res.json({ templates });
});

export default router;