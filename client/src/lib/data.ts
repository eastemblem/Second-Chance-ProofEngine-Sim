import { ProofScore } from "@shared/schema";

export const generateProofScore = (acceleratorApps: number = 0, founderName?: string): ProofScore => {
  let baseScores;
  
  // Specific journeys based on founder name
  if (founderName === "Louis Ravenscroft") {
    // High score journey (>80) - Investor Deal Room
    baseScores = {
      desirability: 18,
      feasibility: 17, 
      viability: 16,
      traction: 15,
      readiness: 18
    };
  } else if (founderName === "Louis Alexander") {
    // Low score journey (<80) - ProofScaling Referral
    baseScores = {
      desirability: 14,
      feasibility: 12,
      viability: 11,
      traction: 9,
      readiness: 13
    };
  } else {
    // Default randomized scores
    baseScores = {
      desirability: 14 + Math.floor(Math.random() * 6), // 14-19
      feasibility: 12 + Math.floor(Math.random() * 6),  // 12-17
      viability: 10 + Math.floor(Math.random() * 6),    // 10-15
      traction: 8 + Math.floor(Math.random() * 8),      // 8-15
      readiness: 12 + Math.floor(Math.random() * 6)     // 12-17
    };
    
    // Adjust based on accelerator applications (more apps = slightly higher readiness)
    if (acceleratorApps > 5) {
      baseScores.readiness = Math.min(20, baseScores.readiness + 2);
    }
  }

  const total = Object.values(baseScores).reduce((sum, score) => sum + score, 0);

  // Determine unlocked ProofTags based on scores
  const unlockedTags: string[] = [];
  if (baseScores.desirability >= 15) unlockedTags.push("Problem Validated");
  if (baseScores.desirability >= 16) unlockedTags.push("Persona Confirmed");
  if (baseScores.feasibility >= 14) unlockedTags.push("MVP Functional");
  if (baseScores.viability >= 12) unlockedTags.push("Revenue Model Proven");
  if (baseScores.traction >= 12) unlockedTags.push("Traction Validated");
  if (baseScores.readiness >= 15) unlockedTags.push("Investor Ready");

  return {
    total,
    dimensions: baseScores,
    prooTags: {
      unlocked: unlockedTags.length,
      total: 10,
      tags: unlockedTags
    },
    insights: {
      strengths: [
        "Strong problem validation with clear customer pain points",
        "Well-structured pitch deck with compelling narrative",
        "Founder shows deep domain expertise"
      ],
      improvements: [
        "Limited traction evidence - need more customer acquisition data",
        "Revenue model requires additional validation",
        "Financial projections need more detailed assumptions"
      ],
      recommendations: [
        "Focus on acquiring your first 10 paying customers",
        "Strengthen your go-to-market strategy with channel validation",
        "Build out your ProofVault with validation artifacts"
      ]
    }
  };
};

export const analysisSteps = [
  { 
    id: "desirability", 
    label: "Analyzing market desirability",
    icon: "🟩"
  },
  { 
    id: "feasibility", 
    label: "Evaluating technical feasibility",
    icon: "🟦"
  },
  { 
    id: "viability", 
    label: "Assessing business viability",
    icon: "🟧"
  },
  { 
    id: "traction", 
    label: "Measuring traction signals",
    icon: "🟨"
  },
  { 
    id: "readiness", 
    label: "Calculating investor readiness",
    icon: "🟥"
  }
];

export const socialProofMetrics = [
  { value: "$2.3M+", label: "Follow-on Funding" },
  { value: "1000+", label: "Founders Validated" },
  { value: "85%", label: "Success Rate" }
];
