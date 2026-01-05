# ProofVault Rescoring Logic Documentation

## Overview

This document provides comprehensive documentation for the ProofVault artifact upload and rescoring system. It covers the folder structure, artifact configurations per growth stage, score calculation logic, and complete implementation details.

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Folder Structure](#2-folder-structure)
3. [Artifact Configuration](#3-artifact-configuration)
4. [Growth Stage Configurations](#4-growth-stage-configurations)
5. [Score Calculation Logic](#5-score-calculation-logic)
6. [Upload Flow](#6-upload-flow)
7. [Batch Upload Optimization](#7-batch-upload-optimization)
8. [Milestone Events](#8-milestone-events)
9. [API Reference](#9-api-reference)
10. [Database Schema](#10-database-schema)

---

## 1. Architecture Overview

### Rescoring System Flow

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                          PROOFVAULT RESCORING PIPELINE                           │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│   ┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐  │
│   │   Upload     │    │  Artifact    │    │   Score      │    │   Update     │  │
│   │   File       │───▶│   Lookup     │───▶│   Calculate  │───▶│   Venture    │  │
│   │              │    │              │    │              │    │              │  │
│   └──────────────┘    └──────────────┘    └──────────────┘    └──────────────┘  │
│                                                                                  │
│   Steps:                                                                         │
│   1. File uploaded to Box.com via EastEmblem API                                │
│   2. Artifact mapped to category using growth stage config                      │
│   3. scoreAwarded and proofScoreContribution extracted from config              │
│   4. VaultScore recalculated (sum of unique artifacts, max 100)                 │
│   5. ProofScore incremented by contribution (max 95)                            │
│   6. Venture table updated with both scores                                     │
│   7. Milestone events emitted for ProofCoach                                    │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Key Components

| Component | Location | Purpose |
|-----------|----------|---------|
| Artifact Config | `shared/config/artifacts*.ts` | Defines artifacts per growth stage |
| Vault Routes | `server/routes/v1/vault.ts` | Upload endpoints with rescoring |
| Storage | `server/storage.ts` | calculateVaultScore(), updateVenture() |
| Milestone Service | `server/services/vault-milestone-service.ts` | Upload milestone tracking |

---

## 2. Folder Structure

### 7 ProofVault Categories

ProofVault is organized into 7 folders, each containing specific artifact types:

| Folder ID | Name | Purpose |
|-----------|------|---------|
| `0_Overview` | Overview | Core business documents |
| `1_Problem_Proof` | Problem Proof | Problem validation evidence |
| `2_Solution_Proof` | Solution Proof | Solution validation evidence |
| `3_Demand_Proof` | Demand Proof | Market demand evidence |
| `4_Traction_Proof` | Traction Proof | Traction and growth metrics |
| `5_Funding_Proof` | Funding Proof | Funding and financial documents |
| `6_Investor_Pack` | Investor Pack | Investor-ready materials |

### Folder Creation (during venture onboarding)

```typescript
// EastEmblem API creates folder structure on Box.com
const folderStructure = await eastEmblemAPI.createFolderStructure(startupName, sessionId);

// Returns:
{
  id: "parent-folder-id",
  url: "https://app.box.com/folder/...",
  folders: {
    "0_Overview": "box-folder-id-1",
    "1_Problem_Proof": "box-folder-id-2",
    "2_Solution_Proof": "box-folder-id-3",
    "3_Demand_Proof": "box-folder-id-4",
    "4_Traction_Proof": "box-folder-id-5",
    "5_Funding_Proof": "box-folder-id-6",
    "6_Investor_Pack": "box-folder-id-7"
  }
}
```

---

## 3. Artifact Configuration

### ArtifactConfig Type Definition

```typescript
// shared/config/artifacts.ts

export type GrowthStage = "Pre-Seed" | "Seed" | "Series A";
export type Priority = "critical" | "high" | "medium" | "low";

export type ArtifactConfig = {
  name: string;                    // Display name
  description: string;             // Brief description
  allowedFormats: string[];        // [".pdf", ".docx", ".xlsx", etc.]
  maxSizeBytes: number;            // Max file size in bytes
  score: number;                   // VaultScore contribution (0-15)
  proofScoreContribution: number;  // ProofScore contribution (0-5)
  mandatory: boolean;              // Required for completion
  priority: Priority;              // critical | high | medium | low
  fileFolder: "File" | "Folder";   // Single file or folder of files
  uploadGuidelines: string;        // Upload instructions
};

export type CategoryConfig = {
  name: string;
  description: string;
  artifacts: Record<string, ArtifactConfig>;
};

export type ArtifactsConfig = Record<string, CategoryConfig>;
```

### Helper Functions

```typescript
// Get artifacts configuration for a growth stage
export function getArtifactsForStage(stage: GrowthStage | string | null): ArtifactsConfig {
  const normalizedStage = stage?.trim().toLowerCase();
  
  switch (normalizedStage) {
    case 'pre-seed':
    case 'pre seed':
      return PRE_SEED_ARTIFACTS;
    case 'seed':
      return SEED_ARTIFACTS;
    case 'series a':
    case 'seriesa':
      return SERIES_A_ARTIFACTS;
    default:
      return PRE_SEED_ARTIFACTS;  // Default fallback
  }
}

// Get specific artifact config
export function getArtifactConfig(
  stage: GrowthStage | string | null,
  categoryId: string,
  artifactKey: string
): ArtifactConfig | null {
  const stageArtifacts = getArtifactsForStage(stage);
  const category = stageArtifacts[categoryId];
  
  if (!category) return null;
  return category.artifacts[artifactKey] || null;
}
```

---

## 4. Growth Stage Configurations

### 4.1 Pre-Seed Stage Artifacts

#### 0_Overview Category
| Artifact | Score | ProofScore | Mandatory | File/Folder |
|----------|-------|------------|-----------|-------------|
| `pitch_deck` | 3 | 5 | Yes | File |
| `one_pager` | 3 | 2 | Yes | File |
| `proofscore_snapshot` | 3 | 1 | Yes | File |
| `incorporation_docs` | 3 | 1 | Yes | Folder |
| `cap_table` | 3 | 1 | Yes | File |
| `founder_agreement` | 3 | 1 | Yes | File |
| `ip_ownership_statement` | 3 | 0 | No | File |

#### 1_Problem_Proof Category
| Artifact | Score | ProofScore | Mandatory | File/Folder |
|----------|-------|------------|-----------|-------------|
| `problem_validation_artefacts` | 9 | 4 | Yes | Folder |
| `customer_personas` | 3 | 1 | Yes | File |
| `validation_timeline` | 3 | 0 | No | File |

#### 2_Solution_Proof Category
| Artifact | Score | ProofScore | Mandatory | File/Folder |
|----------|-------|------------|-----------|-------------|
| `mvp_test_results` | 9 | 4 | Yes | Folder |
| `product_demo` | 6 | 2 | Yes | File |
| `gtm_hypothesis` | 6 | 2 | Yes | File |
| `competitor_landscape` | 3 | 0 | No | File |
| `market_size_summary` | 3 | 0 | No | File |
| `prooftag_badges` | 3 | 0 | No | File |

#### 3_Demand_Proof Category
| Artifact | Score | ProofScore | Mandatory | File/Folder |
|----------|-------|------------|-----------|-------------|
| `mvp_roadmap` | 6 | 2 | Yes | File |
| `tech_stack_overview` | 3 | 0 | No | File |
| `founder_bios` | 3 | 0 | Yes | File |

### 4.2 Score Comparison by Stage

| Stage | Max VaultScore | Max ProofScore Contribution |
|-------|----------------|----------------------------|
| Pre-Seed | ~60+ | ~25+ |
| Seed | ~80+ | ~30+ |
| Series A | ~100 | ~35+ |

*Note: Exact maximums depend on complete artifact upload*

---

## 5. Score Calculation Logic

### VaultScore Calculation

VaultScore is calculated by summing unique artifact scores, avoiding double-counting.

```typescript
// server/storage.ts

async calculateVaultScore(ventureId: string): Promise<number> {
  // Get all document uploads for this venture
  const documents = await this.getDocumentUploadsByVentureId(ventureId);
  
  // Calculate unique artifact scores (avoid double counting same artifact)
  const uniqueArtifacts = new Map<string, number>();
  
  documents.forEach(doc => {
    if (doc.artifactType && doc.scoreAwarded) {
      // Create unique key from category + artifact type
      const key = `${doc.categoryId}_${doc.artifactType}`;
      if (!uniqueArtifacts.has(key)) {
        uniqueArtifacts.set(key, doc.scoreAwarded);
      }
    }
  });
  
  // Sum all unique artifact scores
  return Array.from(uniqueArtifacts.values()).reduce((sum, score) => sum + score, 0);
}
```

### ProofScore Calculation

ProofScore is incremented by each artifact's `proofScoreContribution`.

```typescript
// In vault.ts upload handler

// Get current ProofScore
const venture = await storage.getVenture(currentVentureId);
currentProofScore = venture?.proofScore || 0;

// Add contribution from new artifact
newProofScore = currentProofScore + proofScoreContribution;

// Cap at 95 (baseline from pitch deck scoring + vault contributions)
newProofScore = Math.min(newProofScore, 95);
```

### Score Caps

| Score | Maximum | Reason |
|-------|---------|--------|
| VaultScore | 100 | Hard cap for normalization |
| ProofScore | 95 | Leaves room for validation experiments |

---

## 6. Upload Flow

### Single File Upload

```typescript
// POST /api/v1/vault/upload

router.post('/upload', authenticateToken, upload.single("file"), async (req, res) => {
  const { folder_id, artifactType, description } = req.body;
  const file = req.file;
  const founderId = req.user?.founderId;

  // Step 1: Get venture for this founder
  const ventures = await storage.getVenturesByFounderId(founderId);
  const currentVentureId = ventures[0]?.ventureId;

  // Step 2: Resolve folder ID from category
  const proofVaultRecords = await storage.getProofVaultsByVentureId(currentVentureId);
  const actualFolderId = proofVaultRecords.find(pv => pv.folderName === folder_id)?.subFolderId;

  // Step 3: Upload to Box.com
  const fileBuffer = fs.readFileSync(file.path);
  const uploadResult = await eastEmblemAPI.uploadFile(
    fileBuffer,
    file.originalname,
    actualFolderId,
    undefined,
    true
  );

  // Step 4: Lookup artifact config for scoring
  let categoryId = folder_id;
  let scoreAwarded = 0;
  let proofScoreContribution = 0;
  
  if (artifactType && currentVentureId) {
    const venture = await storage.getVenture(currentVentureId);
    const growthStage = venture?.growthStage;
    
    const { getArtifactsForStage } = await import("@shared/config/artifacts");
    const stageArtifacts = getArtifactsForStage(growthStage);
    
    // Find which category contains this artifactType
    for (const [catId, categoryData] of Object.entries(stageArtifacts)) {
      if (categoryData.artifacts && categoryData.artifacts[artifactType]) {
        categoryId = catId;
        scoreAwarded = categoryData.artifacts[artifactType].score || 0;
        proofScoreContribution = categoryData.artifacts[artifactType].proofScoreContribution || 0;
        break;
      }
    }
  }

  // Step 5: Create database record
  const uploadRecord = await storage.createDocumentUpload({
    sessionId: null,
    ventureId: currentVentureId,
    fileName: file.originalname,
    originalName: file.originalname,
    filePath: file.path,
    fileSize: file.size,
    mimeType: file.mimetype,
    uploadStatus: 'completed',
    processingStatus: 'completed',
    eastemblemFileId: uploadResult.id,
    sharedUrl: uploadResult.url,
    folderId: actualFolderId,
    artifactType: artifactType || '',
    description: description || '',
    categoryId: categoryId,
    scoreAwarded: scoreAwarded,
    proofScoreContribution: proofScoreContribution,
    uploadSource: 'proof-vault'
  });

  // Step 6: Recalculate and update scores
  const currentVaultScore = await storage.getCurrentVaultScore(currentVentureId);
  const venture = await storage.getVenture(currentVentureId);
  const currentProofScore = venture?.proofScore || 0;
  
  // Calculate new VaultScore (recalculate complete score)
  let newVaultScore = await storage.calculateVaultScore(currentVentureId);
  newVaultScore = Math.min(newVaultScore, 100);  // Cap at 100
  
  // Calculate new ProofScore (add contribution)
  let newProofScore = currentProofScore + proofScoreContribution;
  newProofScore = Math.min(newProofScore, 95);  // Cap at 95
  
  // Update venture table with both scores
  await storage.updateVenture(currentVentureId, {
    vaultScore: newVaultScore,
    proofScore: newProofScore,
    updatedAt: new Date()
  });

  // Step 7: Emit activity events
  await ActivityService.logActivity(context, {
    activityType: 'document',
    action: COACH_EVENTS.VAULT_FILE_UPLOADED,
    title: `Uploaded ${file.originalname}`,
    description: `Uploaded to ProofVault - ${artifactType}`,
    metadata: {
      fileName: file.originalname,
      fileSize: file.size,
      artifactType: artifactType,
      uploadId: uploadRecord.uploadId
    },
    entityId: String(uploadRecord.uploadId),
    entityType: 'document',
  });

  // Step 8: Check milestone events
  await VaultMilestoneService.checkAndEmitMilestones(founderId, currentVentureId, context);

  res.json({
    file: {
      id: uploadResult.id,
      name: uploadResult.name,
      url: uploadResult.url,
      size: file.size,
      category: folder_id,
      folderId: actualFolderId
    },
    scoreAdded: scoreAwarded,
    proofScoreAdded: proofScoreContribution,
    vaultScore: newVaultScore,
    proofScore: newProofScore
  });
});
```

---

## 7. Batch Upload Optimization

For batch uploads (multiple files at once), score updates are optimized to only run on the last file.

### Batch Detection

```typescript
// Headers for batch upload coordination
const batchTotal = parseInt(req.headers['x-batch-total'] as string) || 1;
const batchIndex = parseInt(req.headers['x-batch-index'] as string) || 0;

const isBatchUpload = batchTotal > 1;
const isLastInBatch = batchIndex === batchTotal - 1;

// Only update scores on last file in batch
const shouldUpdateVaultScore = !isBatchUpload || isLastInBatch;
```

### Batch Upload Flow

```
File 1 of 5: Upload → Save → Skip Score Update
File 2 of 5: Upload → Save → Skip Score Update
File 3 of 5: Upload → Save → Skip Score Update
File 4 of 5: Upload → Save → Skip Score Update
File 5 of 5: Upload → Save → Recalculate Both Scores → Update Venture
```

### Implementation

```typescript
if (currentVentureId && shouldUpdateVaultScore) {
  // Get current scores
  currentVaultScore = await storage.getCurrentVaultScore(currentVentureId);
  const venture = await storage.getVenture(currentVentureId);
  currentProofScore = venture?.proofScore || 0;
  
  // Recalculate VaultScore (sum of ALL unique artifacts)
  newVaultScore = await storage.calculateVaultScore(currentVentureId);
  newVaultScore = Math.min(newVaultScore, 100);
  
  // For batch: Sum all proofScoreContributions in this batch
  // This is handled by recalculating from all documents
  newProofScore = await storage.calculateProofScore(currentVentureId);
  newProofScore = Math.min(newProofScore, 95);
  
  // Update venture
  await storage.updateVenture(currentVentureId, {
    vaultScore: newVaultScore,
    proofScore: newProofScore,
    updatedAt: new Date()
  });
  
  appLogger.database(`Scores updated (batch: ${isBatchUpload}, last: ${isLastInBatch})`);
} else if (isBatchUpload && !isLastInBatch) {
  appLogger.database(`Skipping score update (batch file ${batchIndex + 1}/${batchTotal})`);
}
```

---

## 8. Milestone Events

### Vault Upload Milestones

| Event | Trigger | ProofCoach Step |
|-------|---------|-----------------|
| `VAULT_FILE_UPLOADED` | Each file upload | Step 17 |
| `VAULT_FIRST_UPLOAD` | First file in vault | Milestone |
| `VAULT_10_UPLOADS` | 10 files uploaded | Milestone |
| `VAULT_20_UPLOADS` | 20 files uploaded | Milestone |
| `VAULT_30_UPLOADS` | 30 files uploaded | Milestone |
| `VAULT_50_UPLOADS` | 50 files uploaded | Milestone |

### Milestone Service

```typescript
// server/services/vault-milestone-service.ts

export class VaultMilestoneService {
  static async checkAndEmitMilestones(
    founderId: string,
    ventureId: string,
    context: ActivityContext
  ): Promise<void> {
    // Get upload count for this venture
    const uploadCount = await storage.getDocumentUploadCountByVenture(ventureId);
    
    // Check milestones (with duplicate prevention)
    const milestones = [
      { count: 1, event: COACH_EVENTS.VAULT_FIRST_UPLOAD },
      { count: 10, event: COACH_EVENTS.VAULT_10_UPLOADS },
      { count: 20, event: COACH_EVENTS.VAULT_20_UPLOADS },
      { count: 30, event: COACH_EVENTS.VAULT_30_UPLOADS },
      { count: 50, event: COACH_EVENTS.VAULT_50_UPLOADS },
    ];
    
    for (const milestone of milestones) {
      if (uploadCount >= milestone.count) {
        // Check if already logged (scoped by founderId AND ventureId)
        const exists = await this.hasMilestone(founderId, ventureId, milestone.event);
        
        if (!exists) {
          await ActivityService.logActivity(context, {
            activityType: 'document',
            action: milestone.event,
            title: `Milestone: ${milestone.count} Vault Uploads`,
            description: `Reached ${milestone.count} files in ProofVault`,
            metadata: { uploadCount: milestone.count },
            entityId: ventureId,
            entityType: 'venture',
          });
        }
      }
    }
  }
}
```

---

## 9. API Reference

### Upload Endpoints

#### POST /api/v1/vault/upload

Upload a single file to ProofVault.

**Headers:**
```
Authorization: Bearer <jwt-token>
Content-Type: multipart/form-data
X-Batch-Total: 5        (optional, for batch uploads)
X-Batch-Index: 0        (optional, 0-indexed position in batch)
```

**Form Data:**
```
file: <binary>
folder_id: "0_Overview"          (category ID)
artifactType: "pitch_deck"       (artifact key)
description: "Latest pitch deck"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "file": {
      "id": "box-file-id",
      "name": "pitch_deck.pdf",
      "url": "https://app.box.com/s/...",
      "size": 2500000,
      "category": "0_Overview",
      "folderId": "box-folder-id"
    },
    "scoreAdded": 3,
    "proofScoreAdded": 5,
    "vaultScore": 45,
    "proofScore": 72
  }
}
```

#### GET /api/v1/vault/uploaded-artifacts

Get list of uploaded artifacts for filtering.

**Response:**
```json
{
  "success": true,
  "data": {
    "uploadedArtifacts": [
      { "artifactType": "pitch_deck", "categoryId": "0_Overview" },
      { "artifactType": "one_pager", "categoryId": "0_Overview" }
    ],
    "ventureId": "venture-uuid"
  }
}
```

#### POST /api/v1/vault/create-startup-vault

Create folder structure for new venture.

**Request:**
```json
{
  "startupName": "My Startup"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "folderStructure": {
      "id": "parent-folder-id",
      "url": "https://app.box.com/folder/...",
      "folders": {
        "0_Overview": "folder-id-1",
        "1_Problem_Proof": "folder-id-2",
        ...
      }
    },
    "sessionId": "session-uuid"
  }
}
```

---

## 10. Database Schema

### document_upload Table

```sql
CREATE TABLE document_upload (
  upload_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id VARCHAR(255),
  venture_id UUID REFERENCES venture(venture_id),
  file_name VARCHAR(255) NOT NULL,
  original_name VARCHAR(255) NOT NULL,
  file_path VARCHAR(500),
  file_size INTEGER NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  upload_status VARCHAR(50) DEFAULT 'pending',
  processing_status VARCHAR(50) DEFAULT 'pending',
  eastemblem_file_id VARCHAR(255),
  shared_url TEXT,
  folder_id VARCHAR(255),
  
  -- ProofVault scoring fields
  artifact_type VARCHAR(100),
  description TEXT,
  category_id VARCHAR(50),
  score_awarded INTEGER DEFAULT 0,
  proof_score_contribution INTEGER DEFAULT 0,
  upload_source VARCHAR(50) DEFAULT 'proof-vault',
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### venture Table (Score Fields)

```sql
-- Relevant fields for scoring
ALTER TABLE venture ADD COLUMN proof_score INTEGER DEFAULT 0;
ALTER TABLE venture ADD COLUMN vault_score INTEGER DEFAULT 0;
ALTER TABLE venture ADD COLUMN growth_stage VARCHAR(100);
ALTER TABLE venture ADD COLUMN prooftags JSON DEFAULT '[]';
```

### proof_vault Table

```sql
CREATE TABLE proof_vault (
  vault_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venture_id UUID REFERENCES venture(venture_id) NOT NULL,
  artefact_type VARCHAR(50) NOT NULL,
  parent_folder_id VARCHAR(255) NOT NULL,
  sub_folder_id VARCHAR(255) NOT NULL,
  folder_name VARCHAR(100) NOT NULL,
  folder_url TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## Related Documents

- [PITCH_DECK_SCORING_FLOW.md](./PITCH_DECK_SCORING_FLOW.md) - Initial pitch deck scoring
- [ONBOARDING_FLOW_IMPLEMENTATION.md](./ONBOARDING_FLOW_IMPLEMENTATION.md) - Onboarding flow
- [EASTEMBLEM_API_INTEGRATION.md](./EASTEMBLEM_API_INTEGRATION.md) - EastEmblem API reference
- [PLATFORM_WORKFLOWS_DOCUMENTATION.md](./PLATFORM_WORKFLOWS_DOCUMENTATION.md) - Platform workflows
