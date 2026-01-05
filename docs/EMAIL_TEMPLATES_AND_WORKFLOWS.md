# Email Templates and Workflows Documentation

## Overview

This document provides comprehensive documentation for the Second Chance platform's email system, including all email templates, the EmailService class, API endpoints, template syntax, and email workflows for various user journeys.

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [EmailService Class](#2-emailservice-class)
3. [Email Templates](#3-email-templates)
4. [Template Syntax](#4-template-syntax)
5. [API Endpoints](#5-api-endpoints)
6. [Email Workflows](#6-email-workflows)
7. [EastEmblem N8N Integration](#7-eastemblem-n8n-integration)
8. [Environment Configuration](#8-environment-configuration)
9. [Testing and Preview](#9-testing-and-preview)

---

## 1. Architecture Overview

### Email System Flow

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              EMAIL SYSTEM ARCHITECTURE                           │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│   ┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐  │
│   │  Trigger     │    │  EmailService│    │  N8N Webhook │    │  Email       │  │
│   │  (Event)     │───▶│  (Template)  │───▶│  (Delivery)  │───▶│  Recipient   │  │
│   │              │    │              │    │              │    │              │  │
│   └──────────────┘    └──────────────┘    └──────────────┘    └──────────────┘  │
│                                                                                  │
│   Triggers:           Processing:          External:           Delivery:         │
│   - Registration      - Load template      - EastEmblem API    - SMTP relay     │
│   - Verification      - Replace vars       - N8N automation    - SendGrid       │
│   - Payment           - Conditional        - Webhook POST      - Mailgun        │
│   - Onboarding        - Generate HTML      - Error handling    - AWS SES        │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Key Components

| Component | Location | Purpose |
|-----------|----------|---------|
| EmailService | `server/services/emailService.ts` | Core service for template loading and email sending |
| Email Routes | `server/routes/emailRoutes.ts` | REST API endpoints for email operations |
| Templates | `server/templates/emails/*.html` | HTML email templates with variable placeholders |
| Notification Service | `server/services/onboardingNotificationService.ts` | Specialized notifications for team alerts |

---

## 2. EmailService Class

### Class Definition

```typescript
// server/services/emailService.ts

interface EmailTemplateData {
  [key: string]: any;
  HOST_URL: string;
  LOGO_URL?: string;
}

export class EmailService {
  private templatesPath = path.join(process.cwd(), 'server/templates/emails');

  // Core methods
  async loadTemplate(templateName: string, data: EmailTemplateData): Promise<string>
  async sendEmail(to: string, subject: string, templateName: string, templateData: EmailTemplateData): Promise<boolean>
  
  // Specialized email methods
  async sendVerificationEmail(to: string, userName: string, verificationUrl: string): Promise<boolean>
  async sendPasswordResetEmail(to: string, founderName: string, resetToken: string): Promise<boolean>
  async sendWelcomeEmail(to: string, userName: string): Promise<boolean>
  async sendOnboardingEmail(to: string, userName: string, proofScore: number, ...): Promise<boolean>
  async sendPaymentSuccessEmail(to: string, userName: string, paymentAmount: string, ...): Promise<boolean>
  async sendInvestorMatchingNextStepsEmail(to: string, userName: string): Promise<boolean>
  async sendIntroductionRequestEmail(...): Promise<boolean>
}

export const emailService = new EmailService();
```

### Core Methods

#### loadTemplate()

Loads an HTML template and processes it with dynamic data.

```typescript
async loadTemplate(templateName: string, data: EmailTemplateData): Promise<string> {
  const templatePath = path.join(this.templatesPath, `${templateName}.html`);
  let template = await fs.readFile(templatePath, 'utf-8');
  
  // Ensure HOST_URL and LOGO_URL are always set
  const processedData = {
    ...data,
    HOST_URL: data.HOST_URL || process.env.FRONTEND_URL || `https://${process.env.REPLIT_DOMAINS?.split(',')[0]}`,
    LOGO_URL: data.LOGO_URL || process.env.LOGO_URL || `${data.HOST_URL}/attached_assets/second_chance_logo_main.png`
  };

  // Replace all template variables
  template = this.processTemplate(template, processedData);
  
  return template;
}
```

#### sendEmail()

Sends an email via the N8N webhook endpoint.

```typescript
async sendEmail(
  to: string,
  subject: string,
  templateName: string,
  templateData: EmailTemplateData
): Promise<boolean> {
  // Enrich template data with common variables
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
  
  // Send via N8N webhook
  const webhookUrl = `${process.env.EASTEMBLEM_API_BASE_URL}/webhook/notification/email/send`;
  
  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ to, subject, html: htmlContent })
  });

  return response.ok;
}
```

### Specialized Email Methods

#### sendVerificationEmail()

```typescript
async sendVerificationEmail(
  to: string, 
  userName: string, 
  verificationUrl: string
): Promise<boolean> {
  return this.sendEmail(
    to,
    '🔐 Verify Your Email - Complete Your Second Chance Registration',
    'email-verification',
    {
      USER_NAME: userName,
      VERIFICATION_URL: verificationUrl,
      HOST_URL: process.env.FRONTEND_URL
    }
  );
}
```

#### sendPasswordResetEmail()

```typescript
async sendPasswordResetEmail(
  to: string, 
  founderName: string, 
  resetToken: string
): Promise<boolean> {
  const frontendUrl = process.env.FRONTEND_URL.replace(/\/+$/, '');
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
```

#### sendWelcomeEmail()

```typescript
async sendWelcomeEmail(
  to: string, 
  userName: string
): Promise<boolean> {
  return this.sendEmail(
    to,
    '🎉 Welcome to Second Chance - Your Startup Journey Begins Now!',
    'welcome-email',
    {
      USER_NAME: userName,
      HOST_URL: process.env.FRONTEND_URL
    }
  );
}
```

#### sendOnboardingEmail()

```typescript
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
  const templateData = {
    USER_NAME: userName,
    PROOF_SCORE: proofScore,
    MILESTONE_LEVEL: this.getMilestoneLevel(proofScore),
    VERIFICATION_URL: verificationUrl || `${frontendUrl}/set-password`,
    HOST_URL: frontendUrl,
    CURRENT_YEAR: new Date().getFullYear(),
    PRIVACY_URL: `${frontendUrl}/privacy`,
    TERMS_URL: `${frontendUrl}/terms`,
    LOGO_URL: `${frontendUrl}/logo.png`
  };
  
  return this.sendEmail(
    to,
    `🎉 Welcome to Second Chance - Complete Your Registration`,
    'onboarding-verification-only',
    templateData
  );
}
```

#### sendPaymentSuccessEmail()

```typescript
async sendPaymentSuccessEmail(
  to: string,
  userName: string,
  paymentAmount: string,
  orderReference: string,
  paymentDate: string
): Promise<boolean> {
  const frontendUrl = process.env.FRONTEND_URL;
  
  const templateData = {
    USER_NAME: userName,
    PAYMENT_AMOUNT: paymentAmount,
    ORDER_REFERENCE: orderReference,
    PAYMENT_DATE: paymentDate,
    DASHBOARD_URL: `${frontendUrl}/dashboard`,
    HOST_URL: frontendUrl,
    CURRENT_YEAR: new Date().getFullYear(),
    PRIVACY_URL: `${frontendUrl}/privacy`,
    TERMS_URL: `${frontendUrl}/terms`
  };
  
  return this.sendEmail(
    to,
    '💳 Payment Confirmed - Deal Room Access Activated',
    'payment-success',
    templateData
  );
}
```

#### sendInvestorMatchingNextStepsEmail()

```typescript
async sendInvestorMatchingNextStepsEmail(
  to: string,
  userName: string
): Promise<boolean> {
  const frontendUrl = process.env.FRONTEND_URL;
  
  const templateData = {
    USER_NAME: userName,
    DASHBOARD_URL: `${frontendUrl}/dashboard`,
    HOST_URL: frontendUrl,
    CURRENT_YEAR: new Date().getFullYear(),
    PRIVACY_URL: `${frontendUrl}/privacy`,
    TERMS_URL: `${frontendUrl}/terms`
  };
  
  return this.sendEmail(
    to,
    '🚀 You\'re in – investor matching request received!',
    'investor-matching-next-steps',
    templateData
  );
}
```

#### sendIntroductionRequestEmail()

Sends introduction request notification to admin team.

```typescript
async sendIntroductionRequestEmail(
  founderName: string,
  founderEmail: string,
  founderRole: string,
  ventureName: string,
  ventureIndustry: string,
  ventureGeography: string,
  ventureGrowthStage: string,
  ventureProofScore: number | null,
  ventureBoxUrl: string | null,
  investorId: string,
  investorStage: string,
  investorSector: string,
  investorGeography: string,
  investorTicketSize: string,
  investorTargetScore: number
): Promise<boolean> {
  const adminEmail = process.env.TEAM_NOTIFICATION_EMAIL || 'team@eastemblem.com';
  
  const templateData = {
    FOUNDER_NAME: founderName,
    FOUNDER_EMAIL: founderEmail,
    FOUNDER_ROLE: founderRole,
    VENTURE_NAME: ventureName,
    VENTURE_INDUSTRY: ventureIndustry || 'N/A',
    VENTURE_GEOGRAPHY: ventureGeography || 'N/A',
    VENTURE_GROWTH_STAGE: ventureGrowthStage || 'N/A',
    VENTURE_PROOF_SCORE: ventureProofScore?.toString() || '',
    VENTURE_BOX_URL: ventureBoxUrl || '',
    INVESTOR_ID: investorId,
    INVESTOR_STAGE: investorStage,
    INVESTOR_SECTOR: investorSector,
    INVESTOR_GEOGRAPHY: investorGeography,
    INVESTOR_TICKET_SIZE: investorTicketSize,
    INVESTOR_TARGET_SCORE: investorTargetScore.toString(),
    REQUEST_DATE: new Date().toLocaleDateString('en-US', { 
      year: 'numeric', month: 'long', day: 'numeric' 
    }),
    HOST_URL: frontendUrl
  };
  
  return this.sendEmail(
    adminEmail,
    `Introduction Requested - ${ventureName}`,
    'introduction-request',
    templateData
  );
}
```

### Helper Methods

#### getMilestoneLevel()

Maps ProofScore to milestone level for display.

```typescript
private getMilestoneLevel(score: number): string {
  if (score >= 80) return 'Investment Ready Leader';
  if (score >= 70) return 'Investor Match Ready';
  if (score >= 60) return 'ProofScaler Candidate';
  if (score >= 40) return 'Validation Builder';
  return 'Foundation Stage';
}
```

---

## 3. Email Templates

### Available Templates

| Template Name | Purpose | Subject Line |
|---------------|---------|--------------|
| `email-verification` | Account email verification | 🔐 Verify Your Email |
| `password-reset` | Password reset link | 🔑 Reset Your Password |
| `welcome-email` | Welcome after registration | 🎉 Welcome to Second Chance |
| `onboarding` | Onboarding completion (full) | 🎉 Your ProofScore Results |
| `onboarding-verification-only` | Onboarding verification | 🎉 Complete Your Registration |
| `payment-success` | Payment confirmation | 💳 Payment Confirmed |
| `investor-matching-next-steps` | Post-payment next steps | 🚀 Investor matching request received |
| `introduction-request` | Admin intro request | Introduction Requested - {venture} |
| `team-payment-notification` | Team payment alert | {venture} has successfully onboarded! |
| `appointment-confirmation` | Appointment scheduled | Appointment Confirmed |
| `progress-update` | Progress notification | Your Progress Update |
| `payment-confirmation` | Generic payment confirm | Payment Confirmation |
| `support-response` | Support ticket response | Support Response |
| `program-completion` | Program completion | Congratulations on Completing |
| `win-back` | Re-engagement email | We Miss You |
| `newsletter` | Newsletter content | Newsletter |
| `reminder` | General reminder | Reminder |

### Template Structure

All templates follow a consistent structure:

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Email Title</title>
    <style>
        /* Inline CSS styles for email client compatibility */
    </style>
</head>
<body>
    <div class="container">
        <!-- Header with logo and title -->
        <div class="header">
            <img src="{{LOGO_URL}}" alt="Second Chance Logo">
            <h1>Email Title</h1>
        </div>

        <!-- Main content -->
        <div class="content">
            <p>Hello {{USER_NAME}},</p>
            <!-- Email body content -->
            <a href="{{CTA_URL}}" class="cta-button">Call to Action</a>
        </div>

        <!-- Footer with links -->
        <div class="footer">
            <a href="{{PRIVACY_URL}}">Privacy Policy</a>
            <a href="{{TERMS_URL}}">Terms & Conditions</a>
            <p>© {{CURRENT_YEAR}} Second Chance</p>
        </div>
    </div>
</body>
</html>
```

### Template Variables Reference

#### Common Variables (Auto-Injected)

| Variable | Description | Example |
|----------|-------------|---------|
| `{{HOST_URL}}` | Frontend base URL | `https://app.get-secondchance.com` |
| `{{FRONTEND_URL}}` | Same as HOST_URL | `https://app.get-secondchance.com` |
| `{{LOGO_URL}}` | Logo image URL | `https://files.replit.com/assets/logo.png` |
| `{{PRIVACY_URL}}` | Privacy policy page | `https://app.get-secondchance.com/privacy` |
| `{{TERMS_URL}}` | Terms page | `https://app.get-secondchance.com/terms` |
| `{{CURRENT_YEAR}}` | Current year | `2025` |

#### User-Related Variables

| Variable | Description | Template(s) |
|----------|-------------|-------------|
| `{{USER_NAME}}` | Founder's display name | All templates |
| `{{VERIFICATION_URL}}` | Email verification link | email-verification |
| `{{RESET_URL}}` | Password reset link | password-reset |

#### Payment Variables

| Variable | Description | Template(s) |
|----------|-------------|-------------|
| `{{PAYMENT_AMOUNT}}` | Payment amount with currency | payment-success |
| `{{ORDER_REFERENCE}}` | Order/transaction reference | payment-success |
| `{{PAYMENT_DATE}}` | Payment date formatted | payment-success |
| `{{DASHBOARD_URL}}` | Dashboard link | payment-success, investor-matching |

#### Onboarding Variables

| Variable | Description | Template(s) |
|----------|-------------|-------------|
| `{{PROOF_SCORE}}` | ProofScore value | onboarding |
| `{{MILESTONE_LEVEL}}` | Milestone level name | onboarding |
| `{{CERTIFICATE_DOWNLOAD_URL}}` | Certificate download link | onboarding |
| `{{REPORT_DOWNLOAD_URL}}` | Report download link | onboarding |

#### Team Notification Variables

| Variable | Description | Template(s) |
|----------|-------------|-------------|
| `{{FOUNDER_NAME}}` | Founder's full name | team-payment-notification, introduction-request |
| `{{FOUNDER_EMAIL}}` | Founder's email | team-payment-notification, introduction-request |
| `{{FOUNDER_PHONE}}` | Founder's phone | team-payment-notification |
| `{{FOUNDER_ROLE}}` | Founder's role | team-payment-notification, introduction-request |
| `{{VENTURE_NAME}}` | Venture name | team-payment-notification, introduction-request |
| `{{VENTURE_INDUSTRY}}` | Industry vertical | team-payment-notification, introduction-request |
| `{{VENTURE_STAGE}}` | Growth stage | team-payment-notification |
| `{{VENTURE_DESCRIPTION}}` | Venture description | team-payment-notification |
| `{{BOX_URL}}` | Box.com folder URL | team-payment-notification |

#### Investor Introduction Variables

| Variable | Description | Template(s) |
|----------|-------------|-------------|
| `{{INVESTOR_ID}}` | Investor identifier | introduction-request |
| `{{INVESTOR_STAGE}}` | Investment stage preference | introduction-request |
| `{{INVESTOR_SECTOR}}` | Sector focus | introduction-request |
| `{{INVESTOR_GEOGRAPHY}}` | Geographic focus | introduction-request |
| `{{INVESTOR_TICKET_SIZE}}` | Investment ticket size | introduction-request |
| `{{INVESTOR_TARGET_SCORE}}` | Target ProofScore | introduction-request |
| `{{REQUEST_DATE}}` | Request submission date | introduction-request |

---

## 4. Template Syntax

### Variable Replacement

Simple variables are replaced using double curly braces:

```html
<p>Hello {{USER_NAME}},</p>
<p>Your score is {{PROOF_SCORE}}</p>
```

### Conditional Blocks

#### Show if truthy: `{{#CONDITION}}...{{/CONDITION}}`

```html
{{#HAS_CERTIFICATE}}
  <a href="{{CERTIFICATE_URL}}">Download Certificate</a>
{{/HAS_CERTIFICATE}}
```

#### Show if falsy: `{{^CONDITION}}...{{/CONDITION}}`

```html
{{^HAS_PAYMENT}}
  <p>Complete your payment to unlock this feature.</p>
{{/HAS_PAYMENT}}
```

### Array Iteration

Arrays can be iterated within conditional blocks:

```html
{{#PROOF_TAGS}}
  <span class="tag">{{TAG_NAME}}</span>
{{/PROOF_TAGS}}
```

### Template Processing Implementation

```typescript
private processTemplate(template: string, data: EmailTemplateData): string {
  let processedTemplate = template;

  // Replace simple variables {{VARIABLE_NAME}}
  Object.keys(data).forEach(key => {
    const placeholder = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
    const value = data[key];
    
    if (value !== undefined && value !== null) {
      processedTemplate = processedTemplate.replace(placeholder, String(value));
    }
  });

  // Handle conditional blocks
  processedTemplate = this.processConditionalBlocks(processedTemplate, data);

  return processedTemplate;
}

private processConditionalBlocks(template: string, data: EmailTemplateData): string {
  let processedTemplate = template;

  // Handle {{#CONDITION}}...{{/CONDITION}} blocks (show if truthy)
  const positiveBlockRegex = /\{\{#(\w+)\}\}([\s\S]*?)\{\{\/\1\}\}/g;
  processedTemplate = processedTemplate.replace(positiveBlockRegex, (match, condition, content) => {
    const value = data[condition];
    if (value && (Array.isArray(value) ? value.length > 0 : true)) {
      if (Array.isArray(value)) {
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
```

---

## 5. API Endpoints

### Email Routes

All email routes are mounted at `/api/email`.

#### POST /api/email/send-verification

Send email verification link.

**Request:**
```json
{
  "email": "founder@example.com",
  "userName": "John Doe",
  "verificationUrl": "https://app.get-secondchance.com/verify?token=abc123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Verification email sent successfully"
}
```

#### POST /api/email/send-welcome

Send welcome email after registration.

**Request:**
```json
{
  "email": "founder@example.com",
  "userName": "John Doe"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Welcome email sent successfully"
}
```

#### POST /api/email/send-onboarding

Send onboarding completion email.

**Request:**
```json
{
  "email": "founder@example.com",
  "userName": "John Doe",
  "proofScore": 72,
  "scoreBreakdown": {
    "desirability": 15,
    "feasibility": 14,
    "viability": 16,
    "traction": 12,
    "readiness": 15
  },
  "proofTags": ["B2B SaaS", "AI/ML", "Enterprise"],
  "reportUrl": "https://app.box.com/s/report123",
  "certificateUrl": "https://app.box.com/s/cert123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Onboarding completion email sent successfully"
}
```

#### POST /api/email/send-template

Send email using any template with custom data.

**Request:**
```json
{
  "email": "founder@example.com",
  "subject": "Custom Subject Line",
  "templateName": "progress-update",
  "templateData": {
    "USER_NAME": "John Doe",
    "PROGRESS_PERCENTAGE": "75",
    "NEXT_MILESTONE": "Complete ProofVault"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "progress-update email sent successfully"
}
```

#### POST /api/email/preview-template

Preview rendered HTML template without sending.

**Request:**
```json
{
  "templateName": "welcome-email",
  "templateData": {
    "USER_NAME": "John Doe",
    "HOST_URL": "https://app.get-secondchance.com"
  }
}
```

**Response:**
```json
{
  "success": true,
  "html": "<!DOCTYPE html>..."
}
```

#### GET /api/email/templates

List all available email templates.

**Response:**
```json
{
  "templates": [
    "email-verification",
    "welcome-email",
    "appointment-confirmation",
    "progress-update",
    "payment-confirmation",
    "support-response",
    "program-completion",
    "win-back",
    "newsletter",
    "reminder",
    "onboarding"
  ]
}
```

---

## 6. Email Workflows

### 6.1 Registration Flow

```
User Signs Up
     │
     ▼
┌────────────────────┐
│ Create Founder     │
│ Record in DB       │
└────────────────────┘
     │
     ▼
┌────────────────────┐
│ Generate           │
│ Verification Token │
└────────────────────┘
     │
     ▼
┌────────────────────┐
│ sendVerificationEmail()
│ Template: email-verification
│ Subject: 🔐 Verify Your Email
└────────────────────┘
     │
     ▼
User Clicks Link
     │
     ▼
┌────────────────────┐
│ Mark Email         │
│ Verified           │
└────────────────────┘
     │
     ▼
┌────────────────────┐
│ sendWelcomeEmail() │
│ Template: welcome-email
│ Subject: 🎉 Welcome to Second Chance
└────────────────────┘
```

### 6.2 Password Reset Flow

```
User Requests Reset
     │
     ▼
┌────────────────────┐
│ Generate Reset     │
│ Token (24hr expiry)│
└────────────────────┘
     │
     ▼
┌────────────────────┐
│ sendPasswordResetEmail()
│ Template: password-reset
│ Subject: 🔑 Reset Your Password
└────────────────────┘
     │
     ▼
User Clicks Link
     │
     ▼
┌────────────────────┐
│ Validate Token     │
│ & Update Password  │
└────────────────────┘
```

### 6.3 Onboarding Completion Flow

```
Pitch Deck Analysis Complete
     │
     ▼
┌────────────────────┐
│ Generate           │
│ Certificate & Report│
└────────────────────┘
     │
     ▼
┌────────────────────┐
│ sendOnboardingEmail()
│ Template: onboarding-verification-only
│ Subject: 🎉 Welcome - Complete Registration
└────────────────────┘
     │
     ▼
User Sets Password
     │
     ▼
┌────────────────────┐
│ Full Access        │
│ to Dashboard       │
└────────────────────┘
```

**Implementation in OnboardingService:**

```typescript
async sendEmailNotification(sessionId: string, stepData: any, certificateUrl?: string, reportUrl?: string) {
  const founder = stepData.founder;
  const venture = stepData.venture;
  const scoringResult = stepData.processing?.scoringResult;

  if (!founder?.email || !scoringResult) {
    console.log("Missing founder email or scoring result for email notification");
    return;
  }

  const totalScore = scoringResult?.output?.total_score || scoringResult?.total_score || 0;
  const proofTags = scoringResult?.output?.tags || [];

  // Generate set password URL with token
  const resetToken = await this.generatePasswordResetToken(founder.founderId);
  const setPasswordUrl = `${frontendUrl}/set-password?token=${resetToken}`;

  await emailService.sendOnboardingEmail(
    founder.email,
    founder.fullName || 'Founder',
    totalScore,
    {}, // scoreBreakdown
    proofTags,
    reportUrl || '',
    certificateUrl || '',
    setPasswordUrl
  );
}
```

### 6.4 Payment Success Flow

```
Payment Webhook Received
     │
     ▼
┌────────────────────┐
│ Validate Payment   │
│ Update Transaction │
└────────────────────┘
     │
     ├──────────────────────────────┐
     ▼                              ▼
┌────────────────────┐    ┌────────────────────┐
│ sendPaymentSuccessEmail()   │ Send Team Notification │
│ To: Founder         │    │ To: team@eastemblem.com │
│ Template: payment-success   │ Template: team-payment-notification│
└────────────────────┘    └────────────────────┘
     │
     ▼
┌────────────────────┐
│ sendInvestorMatchingNextStepsEmail()
│ Template: investor-matching-next-steps
│ Subject: 🚀 Investor matching request received
└────────────────────┘
```

**Dual Email Pattern for Payments:**

```typescript
// In payment webhook handler
async handlePaymentSuccess(paymentData: PaymentWebhookData) {
  const { founderId, amount, orderReference } = paymentData;
  const founder = await storage.getFounder(founderId);

  // Email 1: Immediate payment confirmation
  await emailService.sendPaymentSuccessEmail(
    founder.email,
    founder.fullName,
    `AED ${amount}`,
    orderReference,
    new Date().toLocaleDateString()
  );

  // Email 2: Next steps (sent with delay or immediately)
  await emailService.sendInvestorMatchingNextStepsEmail(
    founder.email,
    founder.fullName
  );

  // Email 3: Team notification
  await onboardingNotificationService.sendOnboardingSuccessNotification({
    founderName: founder.fullName,
    founderEmail: founder.email,
    ventureName: venture.name,
    paymentAmount: `AED ${amount}`,
    paymentDate: new Date().toLocaleDateString(),
    paymentReference: orderReference,
    // ... other fields
  });
}
```

### 6.5 Investor Introduction Request Flow

```
Founder Requests Introduction
     │
     ▼
┌────────────────────┐
│ Validate Deal Room │
│ Access             │
└────────────────────┘
     │
     ▼
┌────────────────────┐
│ sendIntroductionRequestEmail()
│ To: team@eastemblem.com
│ Template: introduction-request
│ Subject: Introduction Requested - {Venture}
└────────────────────┘
     │
     ▼
┌────────────────────┐
│ Team Reviews &     │
│ Facilitates Intro  │
└────────────────────┘
```

---

## 7. EastEmblem N8N Integration

### Webhook Endpoint

All emails are sent through the EastEmblem N8N automation platform.

**Endpoint:** `POST ${EASTEMBLEM_API_BASE_URL}/webhook/notification/email/send`

### Request Format

```typescript
interface EmailWebhookRequest {
  to: string;           // Recipient email address
  subject: string;      // Email subject line
  html: string;         // Rendered HTML content
}
```

### Request Example

```bash
curl -X POST "${EASTEMBLEM_API_BASE_URL}/webhook/notification/email/send" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "founder@example.com",
    "subject": "🎉 Welcome to Second Chance",
    "html": "<!DOCTYPE html>..."
  }'
```

### Response Format

```json
{
  "success": true,
  "messageId": "msg_abc123xyz",
  "status": "queued"
}
```

### Error Handling

```typescript
const response = await fetch(webhookUrl, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(emailData)
});

if (!response.ok) {
  const errorText = await response.text();
  throw new Error(`Email API error: ${response.status} ${response.statusText} - ${errorText}`);
}

const result = await response.json();
appLogger.email(`Email sent successfully to ${to} via N8N webhook`);
return true;
```

### N8N Workflow Configuration

The N8N workflow handles:

1. **Email validation** - Validates recipient address format
2. **Template processing** - Additional processing if needed
3. **SMTP relay** - Routes to configured email provider (SendGrid, Mailgun, AWS SES)
4. **Retry logic** - Automatic retries for transient failures
5. **Logging** - Tracks delivery status and errors

---

## 8. Environment Configuration

### Required Environment Variables

```bash
# Core URLs
FRONTEND_URL=https://app.get-secondchance.com
LOGO_URL=https://files.replit.com/assets/second_chance_logo.png

# EastEmblem API for email delivery
EASTEMBLEM_API_BASE_URL=https://api.eastemblem.com

# Team notifications
TEAM_NOTIFICATION_EMAIL=team@eastemblem.com
SUPPORT_EMAIL=info@get-secondchance.com

# Replit auto-generated (fallback)
REPLIT_DOMAINS=your-app.replit.app
```

### URL Resolution Logic

```typescript
const frontendUrl = process.env.FRONTEND_URL || 
                    `https://${process.env.REPLIT_DOMAINS?.split(',')[0]}`;

const logoUrl = process.env.LOGO_URL || 
                'https://files.replit.com/assets/second_chance_logo_1750269371846.png';
```

---

## 9. Testing and Preview

### Preview Template API

Test template rendering without sending:

```bash
curl -X POST "http://localhost:5000/api/email/preview-template" \
  -H "Content-Type: application/json" \
  -d '{
    "templateName": "welcome-email",
    "templateData": {
      "USER_NAME": "Test User",
      "HOST_URL": "http://localhost:5000"
    }
  }'
```

### Send Test Email

```bash
curl -X POST "http://localhost:5000/api/email/send-template" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "subject": "Test Email",
    "templateName": "welcome-email",
    "templateData": {
      "USER_NAME": "Test User"
    }
  }'
```

### List Available Templates

```bash
curl "http://localhost:5000/api/email/templates"
```

### Debug Logging

The EmailService includes extensive debug logging:

```typescript
appLogger.email("SENDING TO N8N WEBHOOK:", {
  to: emailData.to,
  subject: emailData.subject,
  webhookUrl
});

appLogger.email(`Email sent successfully to ${to} via N8N webhook`);
```

View logs with:
```bash
grep "email" logs/app-*.log
```

---

## Related Documents

- [ONBOARDING_FLOW_IMPLEMENTATION.md](./ONBOARDING_FLOW_IMPLEMENTATION.md) - Onboarding flow details
- [PITCH_DECK_SCORING_FLOW.md](./PITCH_DECK_SCORING_FLOW.md) - Scoring pipeline
- [PLATFORM_WORKFLOWS_DOCUMENTATION.md](./PLATFORM_WORKFLOWS_DOCUMENTATION.md) - Platform workflows
