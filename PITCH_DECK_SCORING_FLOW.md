# Pitch Deck Scoring Flow

## Overview

This document details the complete pitch deck upload, scoring, and artifact generation flow for the Second Chance platform. The flow processes founder pitch decks through AI-powered analysis, generates scores, creates certificates and reports, and updates all relevant database records.

---

## Table of Contents

1. [Flow Diagram](#1-flow-diagram)
2. [Step 1: Document Upload](#2-step-1-document-upload)
3. [Step 2: Box.com Storage](#3-step-2-boxcom-storage)
4. [Step 3: AI Scoring](#4-step-3-ai-scoring)
5. [Step 4: Post-Processing](#5-step-4-post-processing)
6. [Step 5: Certificate Generation](#6-step-5-certificate-generation)
7. [Step 6: Report Generation](#7-step-6-report-generation)
8. [Scoring Response Structure](#8-scoring-response-structure)
9. [Report Data Mapping](#9-report-data-mapping)
10. [Error Handling](#10-error-handling)
11. [Database Updates](#11-database-updates)
12. [EastEmblem API Reference](#12-eastemblem-api-reference)

---

## 1. Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         PITCH DECK SCORING PIPELINE                              │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│   ┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐  │
│   │   UPLOAD     │    │   STORAGE    │    │   SCORING    │    │   ARTIFACTS  │  │
│   │              │    │              │    │              │    │              │  │
│   │  PDF/PPT     │───▶│  Box.com     │───▶│  AI Engine   │───▶│ Certificate  │  │
│   │  ≤50MB       │    │  Cloud       │    │  Analysis    │    │   Report     │  │
│   └──────────────┘    └──────────────┘    └──────────────┘    └──────────────┘  │
│         │                   │                   │                   │           │
│         ▼                   ▼                   ▼                   ▼           │
│   ┌──────────────────────────────────────────────────────────────────────────┐  │
│   │                        DATABASE UPDATES                                   │  │
│   ├──────────────────────────────────────────────────────────────────────────┤  │
│   │  document_upload │ venture │ leaderboard │ evaluation │ team_member      │  │
│   └──────────────────────────────────────────────────────────────────────────┘  │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Sequence Diagram

```
Client              Server                      EastEmblem API           Box.com
  │                   │                              │                      │
  │──POST /upload────▶│                              │                      │
  │   (multipart)     │                              │                      │
  │                   │──handleDocumentUpload()      │                      │
  │                   │   └──INSERT document_upload  │                      │
  │◀──{ upload }──────│                              │                      │
  │                   │                              │                      │
  │──POST /scoring───▶│                              │                      │
  │                   │──submitForScoring()          │                      │
  │                   │   │                          │                      │
  │                   │   ├──uploadFile()───────────▶│                      │
  │                   │   │  POST /vault/file/upload │──────────────────────▶│
  │                   │   │◀─────────────────────────│◀─{ id, url }─────────│
  │                   │   │                          │                      │
  │                   │   ├──scorePitchDeck()───────▶│                      │
  │                   │   │  POST /score/pitch-deck  │                      │
  │                   │   │◀─{ output: scores }──────│                      │
  │                   │   │                          │                      │
  │                   │   ├──Update: leaderboard     │                      │
  │                   │   ├──Update: evaluation      │                      │
  │                   │   ├──Update: venture         │                      │
  │                   │   ├──Extract: team members   │                      │
  │                   │   │                          │                      │
  │                   │   ├──[ASYNC] createCertificate()                    │
  │                   │   │  POST /certificate/create│──────────────────────▶│
  │                   │   │◀─{ url }─────────────────│◀─{ certificate }─────│
  │                   │   │                          │                      │
  │                   │   ├──[ASYNC] createReport()  │                      │
  │                   │   │  POST /pitch-deck-report │──────────────────────▶│
  │                   │   │◀─{ url }─────────────────│◀─{ report }──────────│
  │                   │   │                          │                      │
  │                   │   └──sendEmailNotification() │                      │
  │◀──{ scoringResult }│                              │                      │
  │                   │                              │                      │
```

---

## 2. Step 1: Document Upload

### Endpoint

**POST** `/api/onboarding/upload-pitch-deck`

### Request Format

```
Content-Type: multipart/form-data

Fields:
- pitchDeck: File (PDF, PPT, PPTX)
- sessionId: string (UUID)
- artifactType: string (default: "pitch_deck")
- description: string (optional)
- scoreAwarded: number (default: 5)
```

### File Validation

| Constraint | Value |
|------------|-------|
| Max file size | 50 MB |
| Allowed MIME types | `application/pdf`, `application/vnd.ms-powerpoint`, `application/vnd.openxmlformats-officedocument.presentationml.presentation` |
| File extensions | `.pdf`, `.ppt`, `.pptx` |

### Multer Configuration

```typescript
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadDir = path.join(process.cwd(), "uploads");
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname);
      const baseName = path.basename(file.originalname, ext);
      const uploadDir = path.join(process.cwd(), "uploads");
      
      let counter = 0;
      let filename = file.originalname;
      
      // Prevent overwrites with incrementing counter
      while (fs.existsSync(path.join(uploadDir, filename))) {
        counter++;
        filename = `${baseName}-${counter}${ext}`;
      }
      
      cb(null, filename);
    },
  }),
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      "application/pdf",
      "application/vnd.ms-powerpoint",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type. Only PDF, PPT, and PPTX allowed."));
    }
  },
});
```

### handleDocumentUpload() Implementation

```typescript
async handleDocumentUpload(
  sessionId: string, 
  file: Express.Multer.File,
  uploadMetadata?: { 
    artifactType: string; 
    description: string; 
    scoreAwarded: number; 
    categoryId: string 
  }
) {
  // 1. Get or reconstruct session
  let session = await this.getSession(sessionId);
  if (!session) {
    const ventures = await storage.getVenturesByFounderId(sessionId);
    if (ventures.length > 0) {
      const founder = await storage.getFounder(sessionId);
      session = {
        sessionId,
        currentStep: 'upload',
        stepData: { 
          founder: { founderId: founder?.founderId || sessionId, ...founder },
          venture: { ventureId: ventures[0].ventureId, ...ventures[0] },
        },
        completedSteps: ['founder', 'venture', 'team'],
        isComplete: false
      };
    } else {
      throw new Error(`Session not found for ID: ${sessionId}`);
    }
  }

  const stepData = session.stepData as any || {};
  const venture = stepData.venture;
  if (!venture) {
    throw new Error("Venture step not completed");
  }

  // 2. Get Overview folder from ProofVault
  let overviewFolderId = null;
  if (venture.ventureId) {
    const proofVaultRecords = await storage.getProofVaultsByVentureId(venture.ventureId);
    const overviewFolder = proofVaultRecords.find(pv => pv.folderName === '0_Overview');
    if (overviewFolder?.subFolderId) {
      overviewFolderId = overviewFolder.subFolderId;
    }
  }

  // 3. Create document_upload record
  const fileName = file.filename || file.originalname || 'uploaded_pitch_deck.pdf';
  
  const upload = await db
    .insert(documentUploadTable)
    .values({
      sessionId,
      ventureId: venture.ventureId,
      fileName: fileName,
      originalName: file.originalname,
      filePath: file.path,
      fileSize: file.size,
      mimeType: file.mimetype,
      uploadStatus: 'pending',
      processingStatus: 'pending',
      folderId: overviewFolderId,
      categoryId: '0_Overview',
      artifactType: uploadMetadata?.artifactType || 'pitch_deck',
      description: uploadMetadata?.description || 'Main investor presentation',
      scoreAwarded: uploadMetadata?.scoreAwarded || 5,
      uploadSource: 'onboarding'
    })
    .returning();

  // 4. Update session state
  await this.updateSession(sessionId, {
    currentStep: "processing",
    stepData: { ...stepData, upload: upload[0] },
    completedSteps: [...session.completedSteps, "upload"],
  });

  // 5. Send Slack notification (fire-and-forget)
  if (eastEmblemAPI.isConfigured()) {
    eastEmblemAPI.sendSlackNotification(
      `\`Onboarding Id : ${sessionId}\`\n📄 Document Uploaded - ${file.originalname} (${Math.round(file.size / 1024)}KB)`,
      "#notifications",
      sessionId
    ).catch(console.log);
  }

  return { upload: upload[0] };
}
```

### Response

```json
{
  "upload": {
    "uploadId": "uuid-v4",
    "sessionId": "session-uuid",
    "ventureId": "venture-uuid",
    "fileName": "startup_pitch.pdf",
    "originalName": "startup_pitch.pdf",
    "filePath": "/uploads/startup_pitch.pdf",
    "fileSize": 2500000,
    "mimeType": "application/pdf",
    "uploadStatus": "pending",
    "processingStatus": "pending",
    "folderId": "box-folder-id",
    "categoryId": "0_Overview",
    "artifactType": "pitch_deck",
    "uploadSource": "onboarding"
  }
}
```

---

## 3. Step 2: Box.com Storage

### EastEmblem uploadFile() Method

```typescript
async uploadFile(
  fileBuffer: Buffer,
  fileName: string,
  folderId: string,
  onboardingId?: string,
  allowShare: boolean = true,
): Promise<FileUploadResponse> {
  const formData = new FormData();
  formData.append("data", fileBuffer, fileName);
  formData.append("folder_id", folderId);
  formData.append("allowShare", allowShare.toString());
  if (onboardingId) {
    formData.append("onboarding_id", onboardingId);
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 60000); // 1 min timeout

  const response = await fetch(this.getEndpoint("/webhook/vault/file/upload"), {
    method: "POST",
    body: formData,
    signal: controller.signal,
  });

  clearTimeout(timeoutId);

  if (!response.ok) {
    const errorText = await response.text();
    
    // Handle "file already exists" gracefully
    if (response.status === 400 && errorText.includes("File already exists")) {
      return {
        id: `existing-${Date.now()}`,
        name: fileName,
        url: `https://app.box.com/file/${folderId}/${fileName}`,
        download_url: `https://app.box.com/file/${folderId}/${fileName}`,
      };
    }
    
    throw new Error(`File upload failed (${response.status}): ${errorText}`);
  }

  return await response.json() as FileUploadResponse;
}
```

### FileUploadResponse Interface

```typescript
interface FileUploadResponse {
  id: string;            // Box.com file ID
  name: string;          // File name
  url: string;           // Shared URL for viewing
  download_url: string;  // Direct download URL
  folderId?: string;     // Parent folder ID
  size?: number;         // File size in bytes
}
```

### Database Update After Upload

```typescript
await db
  .update(documentUploadTable)
  .set({
    sharedUrl: uploadResult.url,
    folderId: uploadResult.folderId,
    eastemblemFileId: uploadResult.id,
    fileSize: uploadResult.size || upload.fileSize,
    mimeType: getMimeTypeFromExtension(uploadResult.name),
    uploadStatus: 'completed',
    processingStatus: 'processing'
  })
  .where(eq(documentUploadTable.uploadId, upload.uploadId));
```

---

## 4. Step 3: AI Scoring

### EastEmblem scorePitchDeck() Method

```typescript
async scorePitchDeck(
  fileBuffer: Buffer, 
  fileName: string, 
  onboardingId?: string
): Promise<ScoringResult> {
  return this.retryWithBackoff(
    async () => {
      const formData = new FormData();
      formData.append("data", fileBuffer, fileName);
      if (onboardingId) {
        formData.append("onboarding_id", onboardingId);
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 180000); // 3 min timeout

      try {
        const response = await fetch(this.getEndpoint("/webhook/score/pitch-deck"), {
          method: "POST",
          body: formData,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorText = await response.text();
          
          // Handle specific HTTP status codes
          if (response.status >= 500 || response.status === 524) {
            throw new Error(`EastEmblem scoring service unavailable (${response.status})`);
          } else if (response.status === 401) {
            throw new Error("EastEmblem API authentication failed");
          } else if (response.status === 403) {
            throw new Error("EastEmblem API access forbidden");
          } else if (response.status === 400) {
            // User action required (e.g., image-based PDF)
            let errorMessage = "Unable to process the pitch deck file.";
            try {
              const errorJson = JSON.parse(errorText);
              errorMessage = errorJson.message || errorMessage;
            } catch {
              errorMessage = errorText || errorMessage;
            }
            const error = new Error(errorMessage);
            (error as any).isUserActionRequired = true;
            (error as any).statusCode = 400;
            throw error;
          }
          throw new Error(`Pitch deck scoring failed (${response.status}): ${errorText}`);
        }

        const result = JSON.parse(await response.text());
        
        // Handle array response format - extract first item
        if (Array.isArray(result) && result.length > 0) {
          return result[0];
        }
        
        return result;
      } catch (error) {
        clearTimeout(timeoutId);
        throw error;
      }
    },
    3,     // Max 3 retry attempts
    2000,  // Start with 2 second backoff delay
    'Pitch deck scoring'
  );
}
```

### Retry Logic

```typescript
async retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  initialDelay: number = 1000,
  operationName: string = 'Operation'
): Promise<T> {
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      // Don't retry user action required errors
      if ((error as any).isUserActionRequired) {
        throw error;
      }
      
      if (attempt < maxRetries) {
        const delay = initialDelay * Math.pow(2, attempt - 1); // Exponential backoff
        console.log(`${operationName} attempt ${attempt} failed, retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError;
}
```

### Scoring Result Validation

```typescript
validateScoringResponse(
  scoringResult: any, 
  expectedFounderName?: string, 
  expectedVentureName?: string
): { isValid: boolean; message: string; missingData: string[] } {
  const missingData: string[] = [];
  
  // Check for required output structure
  if (!scoringResult?.output) {
    return {
      isValid: false,
      message: "Scoring response missing output data",
      missingData: ["output"]
    };
  }
  
  // Check total score exists
  if (typeof scoringResult.output.total_score !== 'number') {
    missingData.push("total_score");
  }
  
  // Validate founder/venture name matching (optional)
  if (expectedFounderName && scoringResult.founder_info?.name) {
    const similarity = this.calculateSimilarity(
      expectedFounderName.toLowerCase(),
      scoringResult.founder_info.name.toLowerCase()
    );
    if (similarity < 0.6) {
      missingData.push("founder_name_mismatch");
    }
  }
  
  return {
    isValid: missingData.length === 0,
    message: missingData.length > 0 
      ? `Validation failed: ${missingData.join(", ")}`
      : "Validation passed",
    missingData
  };
}
```

---

## 5. Step 4: Post-Processing

After successful scoring, the following operations are performed:

### 5.1 Team Member Extraction

```typescript
if (scoringResult?.output?.team && Array.isArray(scoringResult.output.team)) {
  const existingMembers = await storage.getTeamMembersByVentureId(venture.ventureId);
  const existingNames = existingMembers.map(m => m.fullName.toLowerCase());
  
  for (const teamMember of scoringResult.output.team) {
    // Skip duplicates
    if (existingNames.includes(teamMember.name?.toLowerCase())) {
      continue;
    }
    
    await storage.createTeamMember({
      ventureId: venture.ventureId,
      fullName: teamMember.name || 'Unknown',
      email: '',
      role: teamMember.role || 'Team Member',
      linkedinProfile: '',
      isTechnical: teamMember.role?.toLowerCase().includes('cto') || 
                   teamMember.role?.toLowerCase().includes('tech'),
      experience: teamMember.experience || teamMember.background || '',
      background: teamMember.background || '',
      isCofounder: teamMember.role?.toLowerCase().includes('founder') || 
                   teamMember.role?.toLowerCase().includes('ceo'),
    });
  }
}
```

### 5.2 Leaderboard Update

```typescript
const totalScore = scoringResult?.output?.total_score || 0;
const extractedTags = scoringResult?.output?.tags || [];

const dimensionScores = {
  desirability: (scoringResult?.output?.problem?.score || 0) + 
                (scoringResult?.output?.market_opportunity?.score || 0),
  feasibility: (scoringResult?.output?.solution?.score || 0) + 
               (scoringResult?.output?.product_technology?.score || 0),
  viability: (scoringResult?.output?.business_model?.score || 0) + 
             (scoringResult?.output?.financials_projections_ask?.score || 0),
  traction: (scoringResult?.output?.traction?.score || 0) + 
            (scoringResult?.output?.go_to_market_strategy?.score || 0),
  readiness: (scoringResult?.output?.readiness?.score || 0) + 
             (scoringResult?.output?.team?.score || 0),
};

const existingEntry = await storage.getLeaderboardByVentureId(venture.ventureId);

if (existingEntry) {
  // Only update if new score is higher
  if (totalScore > existingEntry.totalScore) {
    await storage.updateLeaderboard(existingEntry.leaderboardId, {
      totalScore,
      proofTagsCount: extractedTags.length,
      dimensionScores,
      analysisDate: new Date(),
    });
  }
} else {
  await storage.createLeaderboardEntry({
    ventureId: venture.ventureId,
    ventureName: venture.name,
    totalScore,
    proofTagsCount: extractedTags.length,
    dimensionScores,
    analysisDate: new Date(),
  });
}
```

### 5.3 Evaluation Record Creation

```typescript
await storage.createEvaluation({
  ventureId: venture.ventureId,
  evaluationDate: new Date().toISOString().split('T')[0],
  proofscore: totalScore,
  prooftags: extractedTags,
  fullApiResponse: scoringResult,  // Complete API response stored
  dimensionScores: dimensionScores,
  folderId: folderStructure?.id || null,
  folderUrl: folderStructure?.url || null,
  isCurrent: true,
});
```

### 5.4 Venture Update

```typescript
const founderStage = scoringResult?.founder_stage || 
                     scoringResult?.output?.founder_stage || 
                     scoringResult?.founder_info?.founder_stage;

await storage.updateVenture(venture.ventureId, {
  growthStage: founderStage,
  proofScore: totalScore,
  vaultScore: pitchDeckConfig?.score || 5,
  prooftags: extractedTags,
  status: 'done',
  updatedAt: new Date()
});
```

### 5.5 Activity Events for ProofCoach

```typescript
// Log ProofScore received event
await ActivityService.logActivity(
  { founderId, ventureId: venture.ventureId },
  {
    activityType: 'venture',
    action: COACH_EVENTS.PROOFSCORE_RECEIVED,
    title: `ProofScore Received: ${totalScore}`,
    description: `Received initial ProofScore of ${totalScore} from pitch deck analysis`,
    metadata: {
      proofScore: totalScore,
      growthStage: founderStage,
      proofTagsCount: extractedTags?.length || 0,
    },
    entityId: venture.ventureId,
    entityType: 'venture',
  }
);

// Log milestone events based on score thresholds
if (totalScore >= 80) {
  await ActivityService.logActivity(/* PROOFSCORE_80_REACHED */);
}
if (totalScore >= 70) {
  await ActivityService.logActivity(/* PROOFSCORE_70_REACHED */);
}
if (totalScore >= 65) {
  await ActivityService.logActivity(/* PROOFSCORE_65_REACHED */);
}
```

---

## 6. Step 5: Certificate Generation

### Trigger (Async Background)

```typescript
(async () => {
  const { createCertificateForSession } = await import('../routes/certificate');
  const certificateResult = await createCertificateForSession(sessionId);
})();
```

### createCertificateForSession() Implementation

```typescript
export async function createCertificateForSession(sessionId: string) {
  const [sessionData] = await db
    .select()
    .from(onboardingSession)
    .where(eq(onboardingSession.sessionId, sessionId));

  if (!sessionData) throw new Error('Session not found');

  const stepData = sessionData.stepData as any;
  
  // Check if certificate already exists
  if (stepData?.processing?.certificateUrl) {
    return {
      success: true,
      certificateUrl: stepData.processing.certificateUrl,
      message: "Certificate already exists"
    };
  }

  // Validate scoring data exists
  if (!stepData?.processing?.scoringResult) {
    throw new Error('No scoring data available');
  }

  const scoringResult = stepData.processing.scoringResult;
  const totalScore = scoringResult.output?.total_score || 0;
  const overviewFolderId = stepData.folderStructure?.folders?.["0_Overview"];

  if (!overviewFolderId || totalScore <= 0) {
    throw new Error('Invalid scoring data or folder structure');
  }

  // Call EastEmblem API
  const { eastEmblemAPI } = await import('../eastemblem-api');
  
  const certificateResult = await eastEmblemAPI.createCertificate(
    overviewFolderId,
    totalScore,
    sessionId,
    false  // isCourseComplete
  );

  if (!certificateResult.url) {
    throw new Error('Certificate creation failed');
  }

  // Update session with certificate URL
  await db
    .update(onboardingSession)
    .set({
      stepData: {
        ...stepData,
        processing: {
          ...stepData.processing,
          certificateUrl: certificateResult.url,
          certificateGeneratedAt: new Date().toISOString()
        }
      }
    })
    .where(eq(onboardingSession.sessionId, sessionId));

  // Update venture table
  const ventureId = stepData?.venture?.ventureId;
  if (ventureId) {
    await db
      .update(venture)
      .set({
        certificateUrl: certificateResult.url,
        certificateGeneratedAt: new Date()
      })
      .where(eq(venture.ventureId, ventureId));
  }

  return {
    success: true,
    certificateUrl: certificateResult.url,
    message: "Certificate created successfully"
  };
}
```

### EastEmblem createCertificate() Method

```typescript
async createCertificate(
  folderId: string,
  score: number,
  onboardingId: string,
  isCourseComplete: boolean = false
): Promise<CertificateResponse> {
  const formData = new FormData();
  formData.append("folder_id", folderId);
  formData.append("score", score.toString());
  formData.append("is_course_complete", isCourseComplete.toString());
  formData.append("onboarding_id", onboardingId);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 sec timeout

  const response = await fetch(this.getEndpoint("/webhook/certificate/create"), {
    method: "POST",
    body: formData,
    signal: controller.signal,
  });

  clearTimeout(timeoutId);

  if (!response.ok) {
    const errorText = await response.text();
    
    // Handle certificate already exists
    if (response.status === 400 && errorText.includes("File already exists")) {
      return {
        onboarding_id: onboardingId,
        id: `existing-${Date.now()}`,
        name: `${onboardingId}_Certificate.pdf`,
        url: `https://app.box.com/s/${onboardingId}_certificate`
      };
    }
    throw new Error(`Certificate creation failed (${response.status})`);
  }

  return JSON.parse(await response.text()) as CertificateResponse;
}
```

### CertificateResponse Interface

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

---

## 7. Step 6: Report Generation

### Trigger (Async Background)

```typescript
(async () => {
  const { createReportForSession } = await import('../routes/report');
  const reportResult = await createReportForSession(sessionId);
})();
```

### createReportForSession() Implementation

```typescript
export async function createReportForSession(sessionId: string) {
  const [sessionData] = await db
    .select()
    .from(onboardingSession)
    .where(eq(onboardingSession.sessionId, sessionId));

  if (!sessionData) throw new Error('Session not found');

  // Check if report already exists
  if ((sessionData.stepData as any)?.processing?.reportUrl) {
    return {
      success: true,
      reportUrl: (sessionData.stepData as any).processing.reportUrl,
      message: "Report already exists"
    };
  }

  // Get scoring data
  const scoringResult = (sessionData.stepData as any).processing.scoringResult;
  const folderStructure = (sessionData.stepData as any).folderStructure;

  // Map scoring response to report format
  const reportData = mapScoringToReportData(scoringResult, sessionId, folderStructure);

  // Call EastEmblem API
  const { eastEmblemAPI } = await import('../eastemblem-api');
  const reportResult = await eastEmblemAPI.createReport(reportData);

  // Update session
  await db
    .update(onboardingSession)
    .set({
      stepData: {
        ...(sessionData.stepData as any),
        processing: {
          ...(sessionData.stepData as any).processing,
          reportUrl: reportResult.url
        }
      }
    })
    .where(eq(onboardingSession.sessionId, sessionId));

  // Update venture table
  const ventureId = (sessionData.stepData as any)?.venture?.ventureId;
  if (ventureId) {
    await db
      .update(venture)
      .set({
        reportUrl: reportResult.url,
        reportGeneratedAt: new Date()
      })
      .where(eq(venture.ventureId, ventureId));
  }

  return {
    success: true,
    reportUrl: reportResult.url
  };
}
```

### EastEmblem createReport() Method

```typescript
async createReport(reportData: ReportData): Promise<ReportResponse> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 120000); // 2 min timeout

  const response = await fetch(this.getEndpoint("/webhook/score/pitch-deck-report"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(reportData),
    signal: controller.signal,
  });

  clearTimeout(timeoutId);

  if (!response.ok) {
    const errorText = await response.text();
    
    // Handle report already exists
    if (response.status === 400 && errorText.includes("File already exists")) {
      return {
        onboarding_id: reportData.onboarding_id,
        id: `existing-${Date.now()}`,
        name: `${reportData.onboarding_id}_Report.pdf`,
        url: `https://app.box.com/file/report/${reportData.onboarding_id}`
      };
    }
    throw new Error(`Report creation failed (${response.status})`);
  }

  return JSON.parse(await response.text()) as ReportResponse;
}
```

---

## 8. Scoring Response Structure

### Complete ScoringResult Interface

```typescript
interface ScoringResult {
  output?: {
    // Dimension scores
    problem?: DimensionScore;
    solution?: DimensionScore;
    market_opportunity?: DimensionScore;
    product_technology?: DimensionScore;
    team?: DimensionScore;
    business_model?: DimensionScore;
    traction?: TractionScore;
    competition?: DimensionScore;
    go_to_market_strategy?: DimensionScore;
    financials_projections_ask?: DimensionScore;
    readiness?: DimensionScore;
    
    // Aggregated scores
    desirability?: DimensionScore;
    feasibility?: DimensionScore;
    viability?: DimensionScore;
    
    // Summary data
    total_score: number;
    overall_feedback: string[];
    tags: string[];
    
    // Highlights
    highlights?: {
      intro: string;
      key_highlights: string;
      summary: string;
    };
    
    conclusion?: string;
    recommendations?: string;
  };
  
  founder_stage?: string;
  founder_info?: {
    name?: string;
    founder_stage?: string;
  };
  venture_info?: {
    venture_name?: string;
  };
}

interface DimensionScore {
  score: number;
  justification: string;
  recommendation: string;
  summary?: string;
  related_slides?: string[];
  proofTags?: string[];
}

interface TractionScore extends DimensionScore {
  signals?: TractionSignal[];
  bonus_applied?: {
    description: string;
    score: string;
  };
}

interface TractionSignal {
  MRR?: { description: string; score: string };
  LOIs?: { description: string; score: string };
  Waitlist?: { description: string; score: string };
  Sales?: { description: string; score: string };
  "Pilot Deals"?: { description: string; score: string };
  "Strategic Partnerships"?: { description: string; score: string };
  "Media Mentions"?: { description: string; score: string };
  "Investor Interest"?: { description: string; score: string };
  Advisors?: { description: string; score: string };
  "Community Engagement"?: { description: string; score: string };
}
```

### Example Scoring Response

```json
{
  "output": {
    "problem": {
      "score": 8,
      "justification": "Clear problem statement with quantified market pain",
      "recommendation": "Add more customer testimonials"
    },
    "solution": {
      "score": 7,
      "justification": "Innovative approach with clear differentiation",
      "recommendation": "Provide more technical details"
    },
    "market_opportunity": {
      "score": 9,
      "justification": "Large TAM with clear growth trajectory",
      "recommendation": "Include competitive landscape analysis"
    },
    "total_score": 72,
    "tags": ["B2B SaaS", "AI/ML", "Enterprise", "Series A Ready"],
    "highlights": {
      "intro": "Strong early-stage startup with clear market fit",
      "key_highlights": "Impressive traction with 50% MoM growth",
      "summary": "Investment-ready with minor improvements needed"
    }
  },
  "founder_stage": "growth"
}
```

---

## 9. Report Data Mapping

### mapScoringToReportData() Function

```typescript
function mapScoringToReportData(
  scoringResult: any, 
  sessionId: string, 
  folderStructure: any
): ReportData {
  const output = scoringResult.output || scoringResult;
  const ventureInfo = scoringResult.venture_info || {};
  const founderInfo = scoringResult.founder_info || {};

  const defaultSignals = [{
    "MRR": { "description": "", "score": "" },
    "LOIs": { "description": "", "score": "" },
    "Waitlist": { "description": "", "score": "" },
    "Sales": { "description": "", "score": "" },
    "Pilot Deals": { "description": "", "score": "" },
    "Strategic Partnerships": { "description": "", "score": "" },
    "Media Mentions": { "description": "", "score": "" },
    "Investor Interest": { "description": "", "score": "" },
    "Advisors": { "description": "", "score": "" },
    "Community Engagement": { "description": "", "score": "" }
  }];

  return {
    onboarding_id: sessionId,
    folder_id: folderStructure?.folders?.["0_Overview"] || "",
    venture_name: ventureInfo.venture_name || output.venture_name || "",
    founder_stage: founderInfo.founder_stage || output.founder_stage || "",
    business_model_type: output.business_model_type || "",
    milestone: output.milestone || "",
    
    desirability: {
      score: output.desirability?.score || 0,
      summary: output.desirability?.summary || "",
      justification: output.desirability?.justification || "",
      related_slides: output.desirability?.related_slides || ["", ""],
      recommendation: output.desirability?.recommendation || "",
      proofTags: output.desirability?.proofTags || ["", ""]
    },
    
    feasibility: {
      score: output.feasibility?.score || 0,
      summary: output.feasibility?.summary || "",
      justification: output.feasibility?.justification || "",
      related_slides: output.feasibility?.related_slides || ["", ""],
      recommendation: output.feasibility?.recommendation || "",
      proofTags: output.feasibility?.proofTags || ["", ""]
    },
    
    viability: {
      score: output.viability?.score || 0,
      summary: output.viability?.summary || "",
      justification: output.viability?.justification || "",
      related_slides: output.viability?.related_slides || ["", ""],
      recommendation: output.viability?.recommendation || "",
      proofTags: output.viability?.proofTags || ["", ""]
    },
    
    traction: {
      score: output.traction?.score || 0,
      summary: output.traction?.summary || "",
      justification: output.traction?.justification || "",
      related_slides: output.traction?.related_slides || ["", ""],
      recommendation: output.traction?.recommendation || "",
      proofTags: output.traction?.proofTags || ["", ""],
      bonus_applied: {
        description: output.traction?.bonus_applied?.description || "",
        score: output.traction?.bonus_applied?.score || ""
      },
      signals: output.traction?.signals?.length > 0 
        ? output.traction.signals 
        : defaultSignals
    },
    
    readiness: {
      score: output.readiness?.score || 0,
      summary: output.readiness?.summary || "",
      justification: output.readiness?.justification || "",
      related_slides: output.readiness?.related_slides || ["", ""],
      recommendation: output.readiness?.recommendation || "",
      proofTags: output.readiness?.proofTags || ["", ""]
    },
    
    total_score: output.total_score || 0,
    tags: output.tags || ["", ""],
    highlights: {
      intro: output.highlights?.intro || "",
      key_highlights: output.highlights?.key_highlights || "",
      summary: output.highlights?.summary || ""
    },
    conclusion: output.conclusion || "",
    recommendations: output.recommendations || ""
  };
}
```

### ReportData Interface

```typescript
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
  signals: TractionSignal[];
}
```

---

## 10. Error Handling

### Error Types Summary

| Error Type | HTTP Status | Retryable | User Action Required |
|------------|-------------|-----------|---------------------|
| Invalid file type | 400 | No | Re-upload correct format |
| File too large | 400 | No | Compress file |
| Image-based PDF | 400 | No | Re-upload text-based PDF |
| Box.com upload fails | - | - | None (graceful degradation) |
| Scoring timeout | 524 | Yes (3x) | Wait and retry |
| API unavailable | 500+ | Yes (3x) | Wait and retry |
| Authentication failed | 401 | No | Check API credentials |
| Access forbidden | 403 | No | Verify API permissions |
| Validation failed | 400 | Yes | Re-upload with correct data |
| Session not found | 404 | No | Restart onboarding |

### Error Handling in submitForScoring()

```typescript
try {
  scoringResult = await eastEmblemAPI.scorePitchDeck(fileBuffer, fileName, sessionId);
} catch (error) {
  // Handle user action required errors (like image-based PDF)
  if (error instanceof Error && (error as any).isUserActionRequired) {
    await db
      .update(documentUploadTable)
      .set({
        processingStatus: 'error',
        errorMessage: error.message,
        canRetry: true
      })
      .where(eq(documentUploadTable.uploadId, upload.uploadId));
    
    return {
      hasError: true,
      errorMessage: error.message,
      errorType: 'user_action_required',
      canRetry: true,
      statusCode: (error as any).statusCode || 400
    };
  }
  
  // Handle timeout errors
  if (error instanceof Error && error.message.includes('taking longer than expected')) {
    throw error;
  }
  
  throw new Error(`Analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
}
```

---

## 11. Database Updates

### Tables Updated During Flow

| Table | Step | Fields Updated |
|-------|------|----------------|
| `document_upload` | Upload | `uploadStatus`, `processingStatus`, `fileName`, `filePath`, etc. |
| `document_upload` | Box.com | `sharedUrl`, `folderId`, `eastemblemFileId`, `uploadStatus: 'completed'` |
| `document_upload` | Scoring | `processingStatus: 'completed'` or `'error'` |
| `onboarding_session` | All steps | `stepData`, `currentStep`, `completedSteps` |
| `team_member` | Post-process | New records for extracted team |
| `leaderboard` | Post-process | `totalScore`, `proofTagsCount`, `dimensionScores` |
| `evaluation` | Post-process | `proofscore`, `prooftags`, `fullApiResponse` |
| `venture` | Post-process | `proofScore`, `vaultScore`, `growthStage`, `prooftags`, `status` |
| `venture` | Certificate | `certificateUrl`, `certificateGeneratedAt` |
| `venture` | Report | `reportUrl`, `reportGeneratedAt` |
| `user_activity` | Events | Activity events for ProofCoach |

### Example Database State After Complete Flow

```sql
-- document_upload
uploadId: "uuid"
ventureId: "venture-uuid"
fileName: "startup_pitch.pdf"
uploadStatus: "completed"
processingStatus: "completed"
sharedUrl: "https://app.box.com/s/..."
eastemblemFileId: "box-file-id"
uploadSource: "onboarding"

-- venture
ventureId: "venture-uuid"
proofScore: 72
vaultScore: 5
growthStage: "growth"
prooftags: ["B2B SaaS", "AI/ML", "Enterprise"]
status: "done"
certificateUrl: "https://app.box.com/s/certificate..."
reportUrl: "https://app.box.com/s/report..."

-- leaderboard
ventureId: "venture-uuid"
totalScore: 72
proofTagsCount: 4
dimensionScores: { desirability: 17, feasibility: 14, viability: 16, ... }

-- evaluation
ventureId: "venture-uuid"
proofscore: 72
prooftags: ["B2B SaaS", "AI/ML", "Enterprise"]
fullApiResponse: { /* complete scoring response */ }
isCurrent: true
```

---

## 12. EastEmblem API Reference

### Endpoints

| Endpoint | Method | Purpose | Timeout |
|----------|--------|---------|---------|
| `/webhook/vault/file/upload` | POST | Upload file to Box.com | 60s |
| `/webhook/score/pitch-deck` | POST | AI scoring of pitch deck | 180s |
| `/webhook/certificate/create` | POST | Generate PDF certificate | 30s |
| `/webhook/score/pitch-deck-report` | POST | Generate analysis report | 120s |
| `/webhook/notification/slack` | POST | Send Slack notification | 10s |

### Request/Response Summary

#### File Upload
```
POST /webhook/vault/file/upload
Content-Type: multipart/form-data

data: <file buffer>
folder_id: "box-folder-id"
allowShare: "true"
onboarding_id: "session-uuid"

Response: { id, name, url, download_url, folderId, size }
```

#### Pitch Deck Scoring
```
POST /webhook/score/pitch-deck
Content-Type: multipart/form-data

data: <file buffer>
onboarding_id: "session-uuid"

Response: { output: { total_score, tags, problem, solution, ... }, founder_stage }
```

#### Certificate Creation
```
POST /webhook/certificate/create
Content-Type: multipart/form-data

folder_id: "box-folder-id"
score: "72"
is_course_complete: "false"
onboarding_id: "session-uuid"

Response: { onboarding_id, id, name, url }
```

#### Report Creation
```
POST /webhook/score/pitch-deck-report
Content-Type: application/json

{
  onboarding_id, folder_id, venture_name, founder_stage,
  desirability, feasibility, viability, traction, readiness,
  total_score, tags, highlights, conclusion, recommendations
}

Response: { onboarding_id, id, name, url, size, folderId }
```

---

## Related Documents

- [ONBOARDING_FLOW_IMPLEMENTATION.md](./ONBOARDING_FLOW_IMPLEMENTATION.md) - Complete onboarding flow
- [EASTEMBLEM_API_INTEGRATION.md](./EASTEMBLEM_API_INTEGRATION.md) - EastEmblem API reference
- [PLATFORM_WORKFLOWS_DOCUMENTATION.md](./PLATFORM_WORKFLOWS_DOCUMENTATION.md) - Platform workflows
