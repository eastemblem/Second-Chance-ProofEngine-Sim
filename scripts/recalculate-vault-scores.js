#!/usr/bin/env node

/**
 * One-time script to recalculate VaultScore for all existing ventures
 * This fixes VaultScores for documents uploaded before the feature was implemented
 */

import { db } from '../server/db.js';
import { evaluation, documentUpload } from '../shared/schema.js';
import { eq, sql } from 'drizzle-orm';

async function recalculateAllVaultScores() {
  console.log('🔄 Starting VaultScore recalculation for all ventures...');

  try {
    // Get all ventures that have document uploads with scores
    const venturesWithScores = await db
      .select({
        ventureId: documentUpload.ventureId,
        totalDocuments: sql`COUNT(*)`.as('totalDocuments'),
        totalScore: sql`SUM(CASE WHEN ${documentUpload.scoreAwarded} > 0 THEN ${documentUpload.scoreAwarded} ELSE 0 END)`.as('totalScore')
      })
      .from(documentUpload)
      .where(sql`${documentUpload.ventureId} IS NOT NULL AND ${documentUpload.scoreAwarded} > 0`)
      .groupBy(documentUpload.ventureId);

    console.log(`📊 Found ${venturesWithScores.length} ventures with scored documents`);

    for (const venture of venturesWithScores) {
      const { ventureId, totalScore } = venture;
      
      // Calculate actual VaultScore using the same logic as the storage layer
      const documents = await db
        .select()
        .from(documentUpload)
        .where(eq(documentUpload.ventureId, ventureId));
      
      // Calculate unique artifact scores (avoid double counting same artifact)
      const uniqueArtifacts = new Map();
      documents.forEach(doc => {
        if (doc.artifactType && doc.scoreAwarded && doc.scoreAwarded > 0) {
          const key = `${doc.categoryId}_${doc.artifactType}`;
          if (!uniqueArtifacts.has(key)) {
            uniqueArtifacts.set(key, doc.scoreAwarded);
          }
        }
      });
      
      const calculatedVaultScore = Array.from(uniqueArtifacts.values()).reduce((sum, score) => sum + score, 0);
      
      // Find or create evaluation record
      let currentEval = await db.select()
        .from(evaluation)
        .where(sql`${evaluation.ventureId} = ${ventureId} AND ${evaluation.isCurrent} = true`)
        .limit(1);

      if (currentEval.length > 0) {
        // Update existing evaluation
        await db.update(evaluation)
          .set({ vaultscore: calculatedVaultScore })
          .where(eq(evaluation.evaluationId, currentEval[0].evaluationId));
        
        console.log(`✅ Updated VaultScore to ${calculatedVaultScore} for venture ${ventureId}`);
      } else {
        // Create new evaluation entry
        await db.insert(evaluation).values({
          ventureId,
          proofscore: 0, // Default ProofScore
          vaultscore: calculatedVaultScore,
          isCurrent: true
        });
        
        console.log(`✅ Created evaluation with VaultScore ${calculatedVaultScore} for venture ${ventureId}`);
      }
    }

    console.log('🎉 VaultScore recalculation completed successfully!');
    
    // Show summary
    const updatedScores = await db
      .select({
        ventureId: evaluation.ventureId,
        vaultscore: evaluation.vaultscore
      })
      .from(evaluation)
      .where(sql`${evaluation.vaultscore} > 0`);
    
    console.log(`📈 Summary: ${updatedScores.length} ventures now have VaultScore > 0`);
    updatedScores.forEach(score => {
      console.log(`   - Venture ${score.ventureId}: ${score.vaultscore} points`);
    });
    
  } catch (error) {
    console.error('❌ Error during VaultScore recalculation:', error);
    process.exit(1);
  }
}

// Run the script
recalculateAllVaultScores()
  .then(() => {
    console.log('✅ Script completed successfully');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });