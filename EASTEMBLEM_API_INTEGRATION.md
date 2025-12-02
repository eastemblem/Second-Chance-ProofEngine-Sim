# EastEmblem API Integration Guide

## Complete Implementation Reference for Proof Scaling Engine

**Version:** 1.0  
**Last Updated:** December 2024

---

## Table of Contents

1. [Overview](#1-overview)
2. [Environment Setup](#2-environment-setup)
3. [TypeScript Interfaces](#3-typescript-interfaces)
4. [Core API Class Structure](#4-core-api-class-structure)
5. [Retry Logic & Error Handling](#5-retry-logic--error-handling)
6. [API Endpoints Implementation](#6-api-endpoints-implementation)
7. [Usage Examples](#7-usage-examples)
8. [Error Categories & Handling](#8-error-categories--handling)
9. [Best Practices](#9-best-practices)
10. [Troubleshooting Guide](#10-troubleshooting-guide)

---

## 1. Overview

EastEmblem is the external service powering Second Chance's validation engine. It provides:

- **File Storage:** Box.com folder/file management
- **AI Scoring:** Pitch deck analysis with ProofScore calculation
- **Certificate Generation:** PDF certificate creation
- **Report Generation:** Detailed validation reports
- **Notifications:** Email and Slack integrations
- **Validation Map:** Experiment assignment algorithms
- **Deal Room:** Investor matching funnel

### API Base URL
```
EASTEMBLEM_API_BASE_URL=https://your-eastemblem-instance.com
```

### Endpoint Summary

| Endpoint | Method | Purpose | Timeout |
|----------|--------|---------|---------|
| `/webhook/vault/folder/create-structure` | POST | Create 7-folder ProofVault | 30s |
| `/webhook/vault/folder/create` | POST | Create single subfolder | 30s |
| `/webhook/vault/file/upload` | POST | Upload file to Box.com | 60s |
| `/webhook/score/pitch-deck` | POST | AI scoring of pitch deck | 180s |
| `/webhook/certificate/create` | POST | Generate validation certificate | 30s |
| `/webhook/score/pitch-deck-report` | POST | Generate detailed report | 120s |
| `/webhook/notification/email` | POST | Send email notification | 30s |
| `/webhook/notification/slack` | POST | Send Slack notification | 30s |
| `/webhook/validation-map` | POST | Get experiment assignments | 30s |
| `/webhook/deal-room-funnel` | POST | Create investor intro funnel | 30s |

---

## 2. Environment Setup

### Required Environment Variables

```env
# Required
EASTEMBLEM_API_BASE_URL=https://your-eastemblem-instance.com

# Optional (if EastEmblem requires authentication)
EASTEMBLEM_API_KEY=your_api_key_here
```

### Dependencies

```bash
npm install node-fetch form-data
npm install -D @types/node
```

### Import Statement

```typescript
import fetch from "node-fetch";
import FormData from "form-data";
```

---

## 3. TypeScript Interfaces

### Folder Structure Response

```typescript
interface FolderStructureResponse {
  id: string;           // Parent folder ID in Box.com
  url: string;          // Box.com URL for parent folder
  folders: {
    "0_Overview": string;
    "1_Problem_Proof": string;
    "2_Solution_Proof": string;
    "3_Demand_Proof": string;
    "4_Credibility_Proof": string;
    "5_Commercial_Proof": string;
    "6_Investor_Pack": string;
  };
}
```

### File Upload Response

```typescript
interface FileUploadResponse {
  id: string;           // File ID in Box.com
  name: string;         // File name
  url?: string;         // View URL
  download_url?: string; // Download URL
}
```

### Pitch Deck Score Response

```typescript
interface PitchDeckScoreResponse {
  output?: {
    Problem?: {
      score: number;
      justification: string;
      related_slides: string[];
      recommendation: string;
    };
    solution?: {
      score: number;
      justification: string;
      related_slides: string[];
      recommendation: string;
    };
    market_opportunity?: {
      score: number;
      justification: string;
      related_slides: string[];
      recommendation: string;
    };
    product_technology?: {
      score: number;
      justification: string;
      related_slides: string[];
      recommendation: string;
    };
    team?: {
      score: number;
      justification: string;
      related_slides: string[];
      recommendation: string;
    };
    business_model?: {
      score: number;
      justification: string;
      related_slides: string[];
      recommendation: string;
    };
    traction_milestones?: {
      score: number;
      justification: string;
      related_slides: string[];
      recommendation: string;
    };
    competition?: {
      score: number;
      justification: string;
      related_slides: string[];
      recommendation: string;
    };
    go_to_market_strategy?: {
      score: number;
      justification: string;
      related_slides: string[];
      recommendation: string;
    };
    financials_projections_ask?: {
      score: number;
      justification: string;
      related_slides: string[];
      recommendation: string;
    };
    total_score: number;
    overall_feedback: string[];
  };
  // Legacy fallback properties
  score?: number;
  total_score?: number;
  analysis?: any;
  feedback?: string;
  recommendations?: string[];
  overall_feedback?: string[];
}

interface PitchDeckScoreErrorResponse {
  output?: {
    error: string;
    message: string;
  };
}
```

### Certificate Response

```typescript
interface CertificateResponse {
  onboarding_id: string;
  id: string;
  name: string;
  url: string;
  size?: number;
  folderId?: string;
}
```

### Report Interfaces

```typescript
interface TractionSignals {
  MRR: { description: string; score: string; };
  LOIs: { description: string; score: string; };
  Waitlist: { description: string; score: string; };
  Sales: { description: string; score: string; };
  "Pilot Deals": { description: string; score: string; };
  "Strategic Partnerships": { description: string; score: string; };
  "Media Mentions": { description: string; score: string; };
  "Investor Interest": { description: string; score: string; };
  Advisors: { description: string; score: string; };
  "Community Engagement": { description: string; score: string; };
}

interface ScoreDimension {
  score: number;
  summary: string;
  justification: string;
  related_slides: string[];
  recommendation: string;
  proofTags: string[];
}

interface TractionDimension extends ScoreDimension {
  bonus_applied: {
    description: string;
    score: string;
  };
  signals: TractionSignals[];
}

interface ReportData {
  onboarding_id: string;
  folder_id: string;
  venture_name: string;
  founder_stage: string;
  business_model_type: string;
  milestone: string;
  desirability: ScoreDimension;
  feasibility: ScoreDimension;
  viability: ScoreDimension;
  traction: TractionDimension;
  readiness: ScoreDimension;
  total_score: number;
  tags: string[];
  highlights: {
    intro: string;
    key_highlights: string;
    summary: string;
  };
  conclusion: string;
  recommendations: string;
}

interface ReportResponse {
  onboarding_id: string;
  id: string;
  name: string;
  url: string;
  size?: number;
  folderId?: string;
}
```

### Email & Notification Interfaces

```typescript
interface EmailNotificationData {
  type: string;
  name: string;
  email: string;
  subject?: string;
  certificate: string;
  report: string;
  verificationUrl?: string;
}

interface EmailResponse {
  status: number;
  message: string;
}
```

---

## 4. Core API Class Structure

```typescript
import fetch from "node-fetch";
import FormData from "form-data";

class EastEmblemAPI {
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.EASTEMBLEM_API_BASE_URL || '';
    if (!this.baseUrl) {
      throw new Error("EASTEMBLEM_API_BASE_URL environment variable is required");
    }
  }

  /**
   * Build full endpoint URL
   */
  private getEndpoint(path: string): string {
    return `${this.baseUrl}${path}`;
  }

  /**
   * Async sleep utility for retry delays
   */
  private async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Check if API is properly configured
   */
  isConfigured(): boolean {
    return !!this.baseUrl;
  }
}

// Export singleton instance
export const eastEmblemAPI = new EastEmblemAPI();
```

---

## 5. Retry Logic & Error Handling

### Exponential Backoff with Jitter

```typescript
private async retryWithBackoff<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000,
  operationName: string = 'API operation'
): Promise<T> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`${operationName} - Attempt ${attempt}/${maxRetries}`);
      const result = await operation();
      if (attempt > 1) {
        console.log(`${operationName} succeeded on attempt ${attempt}`);
      }
      return result;
    } catch (error) {
      const isLastAttempt = attempt === maxRetries;
      const isRetryableError = this.isRetryableError(error);
      
      console.log(`${operationName} failed on attempt ${attempt}:`, 
        error instanceof Error ? error.message : 'Unknown error');
      
      if (isLastAttempt || !isRetryableError) {
        if (!isRetryableError) {
          console.log(`Non-retryable error encountered, failing immediately`);
        }
        throw error;
      }
      
      // Exponential backoff with jitter to prevent thundering herd
      const delay = baseDelay * Math.pow(2, attempt - 1);
      const jitter = Math.random() * 1000;
      const totalDelay = delay + jitter;
      
      console.log(`Retrying ${operationName} in ${Math.round(totalDelay)}ms...`);
      await this.sleep(totalDelay);
    }
  }
  
  throw new Error(`${operationName} failed after ${maxRetries} attempts`);
}
```

### Retryable Error Detection

```typescript
private isRetryableError(error: any): boolean {
  if (error instanceof Error) {
    // Retry on timeout/abort errors
    if (error.name === 'AbortError') {
      return true;
    }
    
    // Retry on 5xx server errors
    const retryableStatusCodes = ['524', '503', '502', '500'];
    for (const code of retryableStatusCodes) {
      if (error.message.includes(code)) {
        return true;
      }
    }
    
    // Retry on timeout-related messages
    if (error.message.includes('service unavailable') ||
        error.message.includes('timeout')) {
      return true;
    }
  }
  
  // Don't retry on authentication (401), forbidden (403), or client errors (4xx)
  return false;
}
```

### Timeout Controller Pattern

```typescript
// Standard pattern for all API calls
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

try {
  const response = await fetch(endpoint, {
    method: "POST",
    body: formData,
    signal: controller.signal,
  });
  clearTimeout(timeoutId);
  // ... process response
} catch (error) {
  clearTimeout(timeoutId);
  throw error;
}
```

---

## 6. API Endpoints Implementation

### 6.1 Create Folder Structure (7 ProofVault Folders)

```typescript
async createFolderStructure(
  folderName: string,
  onboardingId?: string,
): Promise<FolderStructureResponse> {
  try {
    const formData = new FormData();
    formData.append("folderName", folderName);
    if (onboardingId) {
      formData.append("onboarding_id", onboardingId);
    }

    console.log(`Creating folder structure for: ${folderName}`);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    const response = await fetch(
      this.getEndpoint("/webhook/vault/folder/create-structure"),
      {
        method: "POST",
        body: formData,
        signal: controller.signal,
      },
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      console.log("Folder structure endpoint not available, using fallback");

      // Fallback: Return structured mock response
      const structuredFolders: FolderStructureResponse = {
        id: `folder-${Date.now()}`,
        url: `https://app.box.com/s/${folderName.toLowerCase()}`,
        folders: {
          "0_Overview": `${Date.now()}-overview`,
          "1_Problem_Proof": `${Date.now()}-problem`,
          "2_Solution_Proof": `${Date.now()}-solution`,
          "3_Demand_Proof": `${Date.now()}-demand`,
          "4_Credibility_Proof": `${Date.now()}-credibility`,
          "5_Commercial_Proof": `${Date.now()}-commercial`,
          "6_Investor_Pack": `${Date.now()}-investor`,
        },
      };
      return structuredFolders;
    }

    const result = (await response.json()) as any;
    
    // Validate response structure
    if (result && result.folders && typeof result.folders === "object") {
      return result as FolderStructureResponse;
    }

    // Transform if needed
    const transformedResult: FolderStructureResponse = {
      id: result?.id || `folder-${Date.now()}`,
      url: result?.url || `https://app.box.com/s/${folderName.toLowerCase()}`,
      folders: {
        "0_Overview": result?.id || `${Date.now()}-overview`,
        "1_Problem_Proof": `${Date.now()}-problem`,
        "2_Solution_Proof": `${Date.now()}-solution`,
        "3_Demand_Proof": `${Date.now()}-demand`,
        "4_Credibility_Proof": `${Date.now()}-credibility`,
        "5_Commercial_Proof": `${Date.now()}-commercial`,
        "6_Investor_Pack": `${Date.now()}-investor`,
      },
    };

    return transformedResult;
  } catch (error) {
    console.error("Error creating folder structure:", error);
    if (!this.isConfigured()) {
      throw new Error("EastEmblem API is not configured.");
    }
    throw new Error(`Failed to create folder structure: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
```

### 6.2 Create Single Folder

```typescript
async createFolder(
  folderName: string,
  parentFolderId: string,
  onboardingId?: string
): Promise<{ id: string; name: string; url: string }> {
  try {
    const formData = new FormData();
    formData.append("folderName", folderName);
    formData.append("folder_id", parentFolderId);
    if (onboardingId) {
      formData.append("onboarding_id", onboardingId);
    }

    console.log(`Creating folder: ${folderName} in parent: ${parentFolderId}`);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    const response = await fetch(
      this.getEndpoint("/webhook/vault/folder/create"), 
      {
        method: "POST",
        body: formData,
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      
      // Handle 5xx server errors
      if (response.status >= 500) {
        throw new Error(`EastEmblem API service unavailable (${response.status}).`);
      }
      
      // Handle authentication errors
      if (response.status === 401) {
        throw new Error("EastEmblem API authentication failed.");
      }
      if (response.status === 403) {
        throw new Error("EastEmblem API access forbidden.");
      }
      
      // Handle "folder already exists" gracefully
      if (response.status === 400 || response.status === 409 || response.status === 422) {
        if (errorText.toLowerCase().includes('already exists') || 
            errorText.toLowerCase().includes('duplicate') ||
            errorText.toLowerCase().includes('conflict')) {
          console.log(`Folder "${folderName}" already exists - returning parent`);
          return {
            id: parentFolderId,
            name: folderName,
            url: `https://app.box.com/folder/${parentFolderId}`
          };
        }
        throw new Error(`Folder creation failed: ${errorText}`);
      }
      
      throw new Error(`Folder creation failed (${response.status}): ${errorText}`);
    }

    const responseText = await response.text();
    const result = JSON.parse(responseText);
    
    const folderId = result.id;
    if (!folderId) {
      throw new Error("API response missing folder ID");
    }
    
    return {
      id: folderId.toString(),
      name: result.name || folderName,
      url: `https://app.box.com/folder/${folderId}`
    };
  } catch (error) {
    console.error("Error creating folder:", error);
    
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error("Folder creation timed out. Please try again.");
    }
    
    throw new Error(`Folder creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
```

### 6.3 Upload File

```typescript
async uploadFile(
  fileBuffer: Buffer,
  fileName: string,
  folderId: string,
  onboardingId?: string,
  allowShare: boolean = true,
): Promise<FileUploadResponse> {
  try {
    const formData = new FormData();
    formData.append("data", fileBuffer, fileName);
    formData.append("folder_id", folderId);
    formData.append("allowShare", allowShare.toString());
    if (onboardingId) {
      formData.append("onboarding_id", onboardingId);
    }

    console.log(`Uploading file: ${fileName} to folder: ${folderId}`);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 1 minute for uploads

    const response = await fetch(
      this.getEndpoint("/webhook/vault/file/upload"), 
      {
        method: "POST",
        body: formData,
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      
      if (response.status >= 500) {
        throw new Error(`EastEmblem API service unavailable (${response.status}).`);
      }
      if (response.status === 401) {
        throw new Error("EastEmblem API authentication failed.");
      }
      if (response.status === 403) {
        throw new Error("EastEmblem API access forbidden.");
      }
      
      // Handle file already exists
      if (response.status === 400 && errorText.includes("File already exists")) {
        console.log("File already exists in Box.com - using existing reference");
        return {
          id: `existing-${Date.now()}`,
          name: fileName,
          url: `https://app.box.com/file/${folderId}/${fileName}`,
          download_url: `https://app.box.com/file/${folderId}/${fileName}`,
        };
      }
      
      throw new Error(`File upload failed (${response.status}): ${errorText}`);
    }

    const responseText = await response.text();
    
    try {
      const result = JSON.parse(responseText) as FileUploadResponse;
      console.log("File uploaded successfully:", result);
      return result;
    } catch (parseError) {
      // Try to fix common JSON issues (unquoted UUIDs)
      const fixedJson = responseText.replace(
        /"onboarding_id":\s*([a-f0-9\-]{36})/g, 
        '"onboarding_id": "$1"'
      );
      const result = JSON.parse(fixedJson) as FileUploadResponse;
      return result;
    }
  } catch (error) {
    console.error("Error uploading file:", error);
    
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error("File upload timed out. The file may be large or the service is under high load.");
    }
    
    throw new Error(`File upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
```

### 6.4 Score Pitch Deck (with Retry)

```typescript
async scorePitchDeck(
  fileBuffer: Buffer, 
  fileName: string, 
  onboardingId?: string
): Promise<PitchDeckScoreResponse> {
  return this.retryWithBackoff(
    async () => {
      const formData = new FormData();
      formData.append("data", fileBuffer, fileName);
      if (onboardingId) {
        formData.append("onboarding_id", onboardingId);
      }

      console.log(`Scoring pitch deck: ${fileName}`);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 180000); // 3 minutes

      try {
        const response = await fetch(
          this.getEndpoint("/webhook/score/pitch-deck"), 
          {
            method: "POST",
            body: formData,
            signal: controller.signal,
          }
        );

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorText = await response.text();
          
          if (response.status >= 500 || response.status === 524) {
            throw new Error(`Scoring service unavailable (${response.status}).`);
          }
          if (response.status === 401) {
            throw new Error("EastEmblem API authentication failed.");
          }
          if (response.status === 403) {
            throw new Error("EastEmblem API access forbidden.");
          }
          
          // Handle 400 errors (e.g., image-based PDF)
          if (response.status === 400) {
            let errorMessage = "Unable to process the pitch deck file.";
            try {
              const errorJson = JSON.parse(errorText);
              errorMessage = errorJson.message || errorMessage;
            } catch {
              errorMessage = errorText || errorMessage;
            }
            // Non-retryable user error
            const error = new Error(errorMessage);
            (error as any).isUserActionRequired = true;
            (error as any).statusCode = 400;
            throw error;
          }
          
          throw new Error(`Scoring failed (${response.status}): ${errorText}`);
        }

        const responseText = await response.text();
        const result = JSON.parse(responseText);
        
        // Handle array response format
        if (Array.isArray(result) && result.length > 0) {
          return result[0];
        }
        
        return result;
      } catch (error) {
        clearTimeout(timeoutId);
        throw error;
      }
    },
    3,      // Max 3 attempts
    2000,   // 2 second base delay
    'Pitch deck scoring'
  ).catch(error => {
    console.error("Error scoring pitch deck after retries:", error);
    
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error("Pitch deck analysis timed out. Please try again.");
    }
    
    if (error instanceof Error && (error as any).isUserActionRequired) {
      throw error; // Preserve user action required errors
    }
    
    throw new Error(`Pitch deck scoring failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  });
}
```

### 6.5 Create Certificate

```typescript
async createCertificate(
  folderId: string,
  score: number,
  onboardingId: string,
  isCourseComplete: boolean = false
): Promise<CertificateResponse> {
  try {
    const formData = new FormData();
    formData.append("folder_id", folderId);
    formData.append("score", score.toString());
    formData.append("is_course_complete", isCourseComplete.toString());
    formData.append("onboarding_id", onboardingId);

    console.log(`Creating certificate for: ${onboardingId}, score: ${score}`);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    const response = await fetch(
      this.getEndpoint("/webhook/certificate/create"), 
      {
        method: "POST",
        body: formData,
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);

    const responseText = await response.text();
    
    if (!response.ok) {
      if (response.status >= 500) {
        throw new Error(`Certificate service unavailable (${response.status}).`);
      }
      if (response.status === 401) {
        throw new Error("EastEmblem API authentication failed.");
      }
      if (response.status === 403) {
        throw new Error("EastEmblem API access forbidden.");
      }
      
      // Handle certificate already exists
      if (response.status === 400 && responseText.includes("File already exists")) {
        console.log("Certificate already exists - returning existing");
        try {
          const parsedError = JSON.parse(responseText);
          if (parsedError.onboarding_id) {
            return {
              onboarding_id: parsedError.onboarding_id,
              id: `existing-${Date.now()}`,
              name: `${parsedError.onboarding_id}_Certificate.pdf`,
              url: `https://app.box.com/s/${onboardingId}_certificate`
            };
          }
        } catch (parseError) {
          // Fall through
        }
      }
      
      throw new Error(`Certificate creation failed (${response.status}): ${responseText}`);
    }
    
    const result = JSON.parse(responseText) as CertificateResponse;
    console.log("Certificate created successfully:", result);
    return result;
  } catch (error) {
    console.error("Error creating certificate:", error);
    
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error("Certificate creation timed out. Please try again.");
    }
    
    throw new Error(`Certificate creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
```

### 6.6 Create Report

```typescript
async createReport(reportData: ReportData): Promise<ReportResponse> {
  try {
    console.log(`Creating report for: ${reportData.onboarding_id}`);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 120000); // 2 minutes

    const response = await fetch(
      this.getEndpoint("/webhook/score/pitch-deck-report"), 
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(reportData),
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      
      if (response.status >= 500) {
        throw new Error(`Report service unavailable (${response.status}).`);
      }
      if (response.status === 401) {
        throw new Error("EastEmblem API authentication failed.");
      }
      if (response.status === 403) {
        throw new Error("EastEmblem API access forbidden.");
      }
      
      // Handle report already exists
      if (response.status === 400 && errorText.includes("File already exists")) {
        console.log("Report already exists - returning existing");
        try {
          const parsedError = JSON.parse(errorText);
          if (parsedError.onboarding_id) {
            return {
              onboarding_id: parsedError.onboarding_id,
              id: `existing-${Date.now()}`,
              name: `${parsedError.onboarding_id}_Report.pdf`,
              url: `https://app.box.com/file/report/${parsedError.onboarding_id}`
            };
          }
        } catch (parseError) {
          // Fall through
        }
      }
      
      throw new Error(`Report creation failed (${response.status}): ${errorText}`);
    }

    const responseText = await response.text();
    const result = JSON.parse(responseText) as ReportResponse;
    console.log("Report created successfully:", result);
    return result;
  } catch (error) {
    console.error("Error creating report:", error);
    
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error("Report creation timed out. Please try again.");
    }
    
    throw new Error(`Report creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
```

### 6.7 Send Email Notification (with Retry)

```typescript
async sendEmail(emailData: EmailNotificationData): Promise<EmailResponse> {
  const maxRetries = 3;
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Sending email (attempt ${attempt}/${maxRetries}) to: ${emailData.email}`);
      
      // Validate required fields
      if (!emailData.type || !emailData.name || !emailData.email || 
          !emailData.certificate || !emailData.report) {
        throw new Error("Missing required email fields.");
      }

      const formData = new FormData();
      formData.append("type", emailData.type);
      formData.append("name", emailData.name);
      formData.append("email", emailData.email);
      if (emailData.subject) {
        formData.append("subject", emailData.subject);
      }
      formData.append("certificate", emailData.certificate);
      formData.append("report", emailData.report);
      if (emailData.verificationUrl) {
        formData.append("verificationUrl", emailData.verificationUrl);
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      const response = await fetch(
        this.getEndpoint("/webhook/notification/email"), 
        {
          method: "POST",
          body: formData,
          signal: controller.signal,
        }
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        
        if (response.status >= 500) {
          throw new Error(`Email service unavailable (${response.status}).`);
        }
        if (response.status === 401) {
          throw new Error("EastEmblem API authentication failed.");
        }
        if (response.status === 403) {
          throw new Error("EastEmblem API access forbidden.");
        }
        
        throw new Error(`Email notification failed (${response.status}): ${errorText}`);
      }

      const responseText = await response.text();
      const result = JSON.parse(responseText) as EmailResponse;
      console.log("Email sent successfully:", result);
      return result;
    } catch (error) {
      console.error(`Email attempt ${attempt} failed:`, error);
      lastError = error instanceof Error ? error : new Error('Unknown error');
      
      if (error instanceof Error && error.name === 'AbortError') {
        lastError = new Error("Email notification timed out.");
      }
      
      if (attempt === maxRetries) {
        break;
      }
      
      // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, attempt * 1000));
    }
  }

  throw new Error(`Email notification failed after ${maxRetries} attempts: ${lastError?.message}`);
}
```

### 6.8 Send Slack Notification

```typescript
async sendSlackNotification(
  message: string,
  channel: string,
  onboardingId?: string,
): Promise<any> {
  try {
    console.log(`Sending Slack notification to ${channel}`);

    const response = await fetch(
      this.getEndpoint("/webhook/notification/slack"), 
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message,
          channel,
          onboarding_id: onboardingId,
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      
      if (response.status >= 500) {
        throw new Error(`Slack service unavailable (${response.status}).`);
      }
      if (response.status === 401) {
        throw new Error("Slack authentication failed.");
      }
      if (response.status === 403) {
        throw new Error("Slack access forbidden.");
      }
      
      throw new Error(`Slack notification failed (${response.status}): ${errorText}`);
    }

    const responseText = await response.text();
    const result = JSON.parse(responseText);
    console.log("Slack notification sent successfully:", result);
    return result;
  } catch (error) {
    console.error("Slack notification error:", error);
    throw new Error(`Slack notification failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
```

### 6.9 Get Validation Map Assignments

```typescript
async getValidationMapAssignments(
  ventureId: string, 
  ventureName: string,
  proofScore: number,
  recommendations: {
    traction?: string;
    readiness?: string;
    viability?: string;
    feasibility?: string;
    desirability?: string;
  }
): Promise<any> {
  try {
    console.log(`Getting validation map for venture: ${ventureId}`);

    const payload = {
      venture_id: ventureId,
      venture_name: ventureName,
      proofscore: proofScore,
      recommendations: {
        traction: recommendations.traction || "",
        readiness: recommendations.readiness || "",
        viability: recommendations.viability || "",
        feasibility: recommendations.feasibility || "",
        desirability: recommendations.desirability || "",
      }
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    const response = await fetch(
      this.getEndpoint("/webhook/validation-map"), 
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      
      if (response.status >= 500) {
        throw new Error(`Validation map service unavailable (${response.status}).`);
      }
      if (response.status === 401) {
        throw new Error("EastEmblem API authentication failed.");
      }
      if (response.status === 403) {
        throw new Error("EastEmblem API access forbidden.");
      }
      
      throw new Error(`Validation map failed (${response.status}): ${errorText}`);
    }

    const responseText = await response.text();
    const result = JSON.parse(responseText);
    console.log("Validation map assignments retrieved:", result);
    return result;
  } catch (error) {
    console.error("Error getting validation map:", error);
    
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error("Validation map request timed out.");
    }
    
    throw new Error(`Validation map failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
```

### 6.10 Create Deal Room Funnel

```typescript
async createDealRoomFunnel(
  founder: {
    id: string;
    name: string;
    email: string;
    role: string;
  },
  venture: {
    name: string;
    industry: string;
    geography: string;
    growth_stage: string;
    proof_score: number;
    proof_vault: string;
  },
  investor: {
    id: string;
  }
): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    console.log(`Creating Deal Room Funnel for investor ${investor.id}`);

    const payload = {
      founder,
      venture,
      investor
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    const response = await fetch(
      this.getEndpoint("/webhook/deal-room-funnel"), 
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      
      if (response.status >= 500) {
        throw new Error(`Deal Room service unavailable (${response.status}).`);
      }
      if (response.status === 401) {
        throw new Error("Deal Room authentication failed.");
      }
      if (response.status === 403) {
        throw new Error("Deal Room access forbidden.");
      }
      
      throw new Error(`Deal Room funnel creation failed (${response.status}): ${errorText}`);
    }

    const responseText = await response.text();
    try {
      const result = JSON.parse(responseText);
      console.log("Deal Room Funnel created:", result);
      return { success: true, message: 'Deal Room Funnel created successfully' };
    } catch (parseError) {
      console.log("Deal Room response (non-JSON):", responseText);
      return { success: true, message: 'Deal Room Funnel created' };
    }
  } catch (error) {
    console.error("Deal Room Funnel error:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}
```

---

## 7. Usage Examples

### Complete Onboarding Flow

```typescript
import { eastEmblemAPI } from './eastemblem-api';
import fs from 'fs';

async function onboardFounder(
  founderName: string,
  ventureName: string,
  pitchDeckPath: string,
  email: string
) {
  const onboardingId = `onb_${Date.now()}`;
  
  try {
    // Step 1: Create folder structure
    console.log("Step 1: Creating folder structure...");
    const folders = await eastEmblemAPI.createFolderStructure(
      `${ventureName}_${onboardingId}`,
      onboardingId
    );
    console.log("Folder structure created:", folders.id);
    
    // Step 2: Upload pitch deck
    console.log("Step 2: Uploading pitch deck...");
    const pitchDeckBuffer = fs.readFileSync(pitchDeckPath);
    const uploadResult = await eastEmblemAPI.uploadFile(
      pitchDeckBuffer,
      'PitchDeck.pdf',
      folders.folders["0_Overview"],
      onboardingId
    );
    console.log("Pitch deck uploaded:", uploadResult.id);
    
    // Step 3: Score pitch deck
    console.log("Step 3: Scoring pitch deck...");
    const scoreResult = await eastEmblemAPI.scorePitchDeck(
      pitchDeckBuffer,
      'PitchDeck.pdf',
      onboardingId
    );
    const proofScore = scoreResult.output?.total_score || 0;
    console.log("ProofScore:", proofScore);
    
    // Step 4: Create certificate
    console.log("Step 4: Creating certificate...");
    const certificate = await eastEmblemAPI.createCertificate(
      folders.id,
      proofScore,
      onboardingId
    );
    console.log("Certificate created:", certificate.url);
    
    // Step 5: Create report
    console.log("Step 5: Creating report...");
    const reportData = {
      onboarding_id: onboardingId,
      folder_id: folders.id,
      venture_name: ventureName,
      founder_stage: 'Early Stage',
      business_model_type: 'B2B SaaS',
      milestone: 'MVP',
      desirability: scoreResult.output?.Problem || { score: 0, summary: '', justification: '', related_slides: [], recommendation: '', proofTags: [] },
      feasibility: scoreResult.output?.product_technology || { score: 0, summary: '', justification: '', related_slides: [], recommendation: '', proofTags: [] },
      viability: scoreResult.output?.business_model || { score: 0, summary: '', justification: '', related_slides: [], recommendation: '', proofTags: [] },
      traction: { 
        score: 0, 
        summary: '', 
        justification: '', 
        related_slides: [], 
        recommendation: '', 
        proofTags: [],
        bonus_applied: { description: '', score: '0' },
        signals: []
      },
      readiness: scoreResult.output?.team || { score: 0, summary: '', justification: '', related_slides: [], recommendation: '', proofTags: [] },
      total_score: proofScore,
      tags: ['early-stage', 'b2b'],
      highlights: {
        intro: `${ventureName} analysis`,
        key_highlights: 'Key findings from pitch deck analysis',
        summary: 'Summary of validation status'
      },
      conclusion: 'Conclusion and next steps',
      recommendations: 'Recommended actions'
    };
    const report = await eastEmblemAPI.createReport(reportData as any);
    console.log("Report created:", report.url);
    
    // Step 6: Send email notification
    console.log("Step 6: Sending email...");
    await eastEmblemAPI.sendEmail({
      type: 'validation_complete',
      name: founderName,
      email: email,
      subject: `Your ProofScore: ${proofScore}`,
      certificate: certificate.url,
      report: report.url
    });
    console.log("Email sent successfully");
    
    return {
      success: true,
      onboardingId,
      folderId: folders.id,
      proofScore,
      certificateUrl: certificate.url,
      reportUrl: report.url
    };
  } catch (error) {
    console.error("Onboarding failed:", error);
    throw error;
  }
}
```

### Upload Multiple Files to ProofVault

```typescript
async function uploadToVault(
  ventureId: string,
  folderId: string,
  files: { buffer: Buffer; name: string; category: string }[]
) {
  const results = [];
  
  for (const file of files) {
    try {
      const result = await eastEmblemAPI.uploadFile(
        file.buffer,
        file.name,
        folderId,
        ventureId
      );
      results.push({ 
        name: file.name, 
        category: file.category,
        success: true, 
        fileId: result.id 
      });
    } catch (error) {
      results.push({ 
        name: file.name,
        category: file.category,
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  }
  
  return results;
}
```

### Request Investor Introduction

```typescript
async function requestInvestorIntroduction(
  founderId: string,
  founderName: string,
  founderEmail: string,
  ventureName: string,
  industry: string,
  geography: string,
  proofScore: number,
  proofVaultUrl: string,
  investorId: string
) {
  const result = await eastEmblemAPI.createDealRoomFunnel(
    {
      id: founderId,
      name: founderName,
      email: founderEmail,
      role: 'Founder'
    },
    {
      name: ventureName,
      industry,
      geography,
      growth_stage: proofScore >= 70 ? 'Investment Ready' : 'Validation',
      proof_score: proofScore,
      proof_vault: proofVaultUrl
    },
    {
      id: investorId
    }
  );
  
  if (result.success) {
    // Send Slack notification to team
    await eastEmblemAPI.sendSlackNotification(
      `New investor introduction request: ${founderName} (${ventureName}) → Investor ${investorId}`,
      '#deal-room-notifications'
    );
  }
  
  return result;
}
```

---

## 8. Error Categories & Handling

### Error Classification

| Category | HTTP Codes | Retryable | User Action |
|----------|-----------|-----------|-------------|
| **Server Errors** | 500, 502, 503, 524 | Yes | Wait and retry |
| **Timeout** | AbortError | Yes | Wait and retry |
| **Authentication** | 401 | No | Check API credentials |
| **Authorization** | 403 | No | Check permissions |
| **Validation** | 400, 422 | No | Fix input data |
| **Conflict** | 409 | No | Resource already exists |
| **Not Found** | 404 | No | Check resource ID |

### Error Response Format

```typescript
interface ApiError {
  code: string;           // Machine-readable error code
  message: string;        // Human-readable message
  statusCode: number;     // HTTP status code
  isRetryable: boolean;   // Whether client should retry
  isUserActionRequired?: boolean; // User needs to fix something
  details?: any;          // Additional error context
}

function createApiError(
  code: string,
  message: string,
  statusCode: number,
  isRetryable: boolean = false
): ApiError {
  return {
    code,
    message,
    statusCode,
    isRetryable
  };
}
```

### Common Error Codes

```typescript
const ERROR_CODES = {
  // Authentication
  AUTH_FAILED: 'AUTH_FAILED',
  ACCESS_DENIED: 'ACCESS_DENIED',
  
  // Validation
  INVALID_INPUT: 'INVALID_INPUT',
  FILE_TOO_LARGE: 'FILE_TOO_LARGE',
  UNSUPPORTED_FILE_TYPE: 'UNSUPPORTED_FILE_TYPE',
  
  // Resource
  RESOURCE_EXISTS: 'RESOURCE_EXISTS',
  RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND',
  
  // Service
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  TIMEOUT: 'TIMEOUT',
  
  // Processing
  PROCESSING_FAILED: 'PROCESSING_FAILED',
  SCORE_CALCULATION_FAILED: 'SCORE_CALCULATION_FAILED',
};
```

---

## 9. Best Practices

### 1. Always Use Timeout Controllers

```typescript
// Every fetch request should have a timeout
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), 30000);

try {
  const response = await fetch(url, { signal: controller.signal });
  clearTimeout(timeoutId);
  // ...
} catch (error) {
  clearTimeout(timeoutId);
  throw error;
}
```

### 2. Clean Up Temporary Files

```typescript
import fs from 'fs';

async function processFile(filePath: string) {
  try {
    const buffer = fs.readFileSync(filePath);
    const result = await eastEmblemAPI.uploadFile(buffer, 'file.pdf', folderId);
    return result;
  } finally {
    // Always clean up, even on error
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }
}
```

### 3. Log All API Interactions

```typescript
function logApiCall(endpoint: string, method: string, duration: number, success: boolean) {
  console.log({
    timestamp: new Date().toISOString(),
    endpoint,
    method,
    durationMs: duration,
    success
  });
}
```

### 4. Handle Graceful Degradation

```typescript
async function getProofScore(pitchDeckBuffer: Buffer, fileName: string): Promise<number> {
  try {
    const result = await eastEmblemAPI.scorePitchDeck(pitchDeckBuffer, fileName);
    return result.output?.total_score || 0;
  } catch (error) {
    console.error("Scoring failed, using fallback:", error);
    // Return 0 as fallback - don't block the user flow
    return 0;
  }
}
```

### 5. Use Fire-and-Forget for Non-Critical Operations

```typescript
// Notifications shouldn't block the main response
async function completeOnboarding(founderId: string) {
  // ... core logic ...
  
  // Fire and forget - don't await
  sendNotifications(founderId).catch(err => {
    console.error('Notification failed (non-blocking):', err);
  });
  
  // Return immediately
  return { success: true };
}
```

---

## 10. Troubleshooting Guide

### Issue: 524 Timeout Errors

**Symptom:** Pitch deck scoring returns 524 error frequently.

**Solution:**
1. Increase timeout to 180 seconds
2. Implement retry with exponential backoff
3. Check file size (max 10MB)
4. Consider queuing large files

### Issue: "File already exists" Errors

**Symptom:** Upload fails with 400 "File already exists".

**Solution:**
1. Handle gracefully - this is expected for re-uploads
2. Return existing file reference
3. Consider adding timestamp to filename for uniqueness

### Issue: JSON Parse Errors

**Symptom:** Response contains unquoted UUIDs.

**Solution:**
```typescript
// Fix common JSON issues
const fixedJson = responseText.replace(
  /"onboarding_id":\s*([a-f0-9\-]{36})/g, 
  '"onboarding_id": "$1"'
);
const result = JSON.parse(fixedJson);
```

### Issue: AbortError on Large Files

**Symptom:** Large file uploads time out.

**Solution:**
1. Increase timeout to 60-120 seconds for uploads
2. Consider chunked uploads for very large files
3. Compress files before upload if possible

### Issue: Authentication Failures (401)

**Symptom:** All requests return 401.

**Solution:**
1. Verify `EASTEMBLEM_API_BASE_URL` is correct
2. Check if API requires authentication headers
3. Verify API key hasn't expired

### Issue: Rate Limiting

**Symptom:** Requests fail during high load.

**Solution:**
1. Implement request queuing
2. Add delays between bulk operations
3. Use exponential backoff on 429 errors

---

## Appendix: Complete Class Export

```typescript
export { 
  EastEmblemAPI,
  eastEmblemAPI,
  FolderStructureResponse,
  FileUploadResponse,
  PitchDeckScoreResponse,
  PitchDeckScoreErrorResponse,
  CertificateResponse,
  ReportData,
  ReportResponse,
  EmailNotificationData,
  EmailResponse,
};
```

---

*End of EastEmblem API Integration Guide*
