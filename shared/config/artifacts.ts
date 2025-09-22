export type GrowthStage = "Pre-Seed" | "Seed" | "Series A";

export type ArtifactConfig = {
  name: string;
  description: string;
  allowedFormats: string[];
  maxSizeBytes: number;
  score: number;
  mandatory: boolean;
  fileFolder: "File" | "Folder";
  stages: GrowthStage[];
  uploadGuidelines: string;
};

export type CategoryConfig = {
  name: string;
  description: string;
  artifacts: Record<string, ArtifactConfig>;
};

export type ArtifactsConfig = Record<string, CategoryConfig>;

export const PROOF_VAULT_ARTIFACTS: ArtifactsConfig = {
  "0_Overview": {
    name: "Overview",
    description: "Core business overview documents",
    artifacts: {
      pitch_deck: {
        name: "Pitch deck",
        description: "Concise, <3 months old, 10–15 slides",
        allowedFormats: [".pdf"],
        maxSizeBytes: 25 * 1024 * 1024,
        score: 6,
        mandatory: true,
        fileFolder: "File",
        stages: ["Pre-Seed", "Seed", "Series A"],
        uploadGuidelines: "Concise, <3 months old, 10–15 slides"
      },
      one_pager: {
        name: "One-pager",
        description: "Includes problem, solution, traction, raise",
        allowedFormats: [".pdf", ".docx"],
        maxSizeBytes: 10 * 1024 * 1024,
        score: 5,
        mandatory: true,
        fileFolder: "File",
        stages: ["Pre-Seed", "Seed", "Series A"],
        uploadGuidelines: "Includes problem, solution, traction, raise"
      },
      proofscore_snapshot: {
        name: "ProofScore snapshot",
        description: "Auto-generated export",
        allowedFormats: [".pdf"],
        maxSizeBytes: 5 * 1024 * 1024,
        score: 4,
        mandatory: true,
        fileFolder: "File",
        stages: ["Pre-Seed", "Seed", "Series A"],
        uploadGuidelines: "Auto-generated export"
      },
      incorporation_docs: {
        name: "Incorporation docs",
        description: "Certificate, articles, scanned originals",
        allowedFormats: [".pdf"],
        maxSizeBytes: 20 * 1024 * 1024,
        score: 2,
        mandatory: true,
        fileFolder: "Folder",
        stages: ["Pre-Seed", "Seed", "Series A"],
        uploadGuidelines: "Certificate, articles, scanned originals"
      },
      cap_table: {
        name: "Cap table",
        description: "Simple layout with founders, option pool, early investors",
        allowedFormats: [".xlsx", ".pdf"],
        maxSizeBytes: 10 * 1024 * 1024,
        score: 3,
        mandatory: true,
        fileFolder: "File",
        stages: ["Pre-Seed", "Seed", "Series A"],
        uploadGuidelines: "Simple layout with founders, option pool, early investors"
      },
      ip_ownership_statement: {
        name: "IP ownership statement",
        description: "One-pager confirming IP belongs to entity",
        allowedFormats: [".pdf"],
        maxSizeBytes: 5 * 1024 * 1024,
        score: 3,
        mandatory: true,
        fileFolder: "File",
        stages: ["Pre-Seed", "Seed", "Series A"],
        uploadGuidelines: "One-pager confirming IP belongs to entity"
      },
      founder_agreement: {
        name: "Founder agreement",
        description: "Signed agreement outlining equity split and roles",
        allowedFormats: [".pdf"],
        maxSizeBytes: 10 * 1024 * 1024,
        score: 3,
        mandatory: true,
        fileFolder: "File",
        stages: ["Pre-Seed", "Seed", "Series A"],
        uploadGuidelines: "Signed agreement outlining equity split and roles"
      },
      board_resolutions: {
        name: "Board resolutions",
        description: "Signed copies, recent board-level decisions",
        allowedFormats: [".pdf"],
        maxSizeBytes: 10 * 1024 * 1024,
        score: 2,
        mandatory: true,
        fileFolder: "File",
        stages: ["Seed", "Series A"],
        uploadGuidelines: "Signed copies, recent board-level decisions"
      },
      option_pool_terms: {
        name: "Option pool terms",
        description: "Legal doc outlining size, vesting, approvals",
        allowedFormats: [".pdf", ".docx"],
        maxSizeBytes: 10 * 1024 * 1024,
        score: 2,
        mandatory: true,
        fileFolder: "File",
        stages: ["Seed", "Series A"],
        uploadGuidelines: "Legal doc outlining size, vesting, approvals"
      },
      shareholder_agreements: {
        name: "Shareholder agreements",
        description: "Includes investor rights, drag/tag, voting rights",
        allowedFormats: [".pdf"],
        maxSizeBytes: 10 * 1024 * 1024,
        score: 3,
        mandatory: true,
        fileFolder: "File",
        stages: ["Series A"],
        uploadGuidelines: "Includes investor rights, drag/tag, voting rights"
      },
      updated_cap_table: {
        name: "Updated cap table (SAFEs converted)",
        description: "Fully diluted cap table, post-SAFE conversion",
        allowedFormats: [".xlsx", ".pdf"],
        maxSizeBytes: 10 * 1024 * 1024,
        score: 3,
        mandatory: true,
        fileFolder: "File",
        stages: ["Series A"],
        uploadGuidelines: "Fully diluted cap table, post-SAFE conversion"
      },
      audited_financials: {
        name: "Audited financials (if revenue)",
        description: "Year-end or interim, accountant-reviewed",
        allowedFormats: [".pdf", ".xlsx"],
        maxSizeBytes: 15 * 1024 * 1024,
        score: 6,
        mandatory: true,
        fileFolder: "File",
        stages: ["Series A"],
        uploadGuidelines: "Year-end or interim, accountant-reviewed"
      }
    }
  },
  "1_Problem_Proof": {
    name: "Problem Proof",
    description: "Evidence of problem validation and market research",
    artifacts: {
      problem_validation_artefacts: {
        name: "Problem validation artefacts",
        description: "Surveys, interviews, insight summaries, labelled by type/date",
        allowedFormats: [".pdf", ".txt", ".docx"],
        maxSizeBytes: 50 * 1024 * 1024,
        score: 6,
        mandatory: true,
        fileFolder: "Folder",
        stages: ["Pre-Seed", "Seed", "Series A"],
        uploadGuidelines: "Surveys, interviews, insight summaries, labelled by type/date"
      },
      customer_personas: {
        name: "Customer personas",
        description: "Synthesised from problem interviews or data",
        allowedFormats: [".pdf", ".docx"],
        maxSizeBytes: 10 * 1024 * 1024,
        score: 3,
        mandatory: true,
        fileFolder: "File",
        stages: ["Pre-Seed", "Seed", "Series A"],
        uploadGuidelines: "Synthesised from problem interviews or data"
      },
      validation_timeline: {
        name: "Validation timeline",
        description: "Chronological summary of discovery, validation, traction",
        allowedFormats: [".pdf"],
        maxSizeBytes: 5 * 1024 * 1024,
        score: 3,
        mandatory: true,
        fileFolder: "File",
        stages: ["Pre-Seed", "Seed", "Series A"],
        uploadGuidelines: "Chronological summary of discovery, validation, traction"
      },
      segment_prioritisation_notes: {
        name: "Segment prioritisation notes",
        description: "Rationale for segment focus, linked to persona + problem insights",
        allowedFormats: [".pdf"],
        maxSizeBytes: 10 * 1024 * 1024,
        score: 3,
        mandatory: true,
        fileFolder: "File",
        stages: ["Seed", "Series A"],
        uploadGuidelines: "Rationale for segment focus, linked to persona + problem insights"
      },
      retention_curves_by_segment: {
        name: "Retention curves by segment",
        description: "Plot retention by customer type/segment",
        allowedFormats: [".pdf", ".xlsx"],
        maxSizeBytes: 10 * 1024 * 1024,
        score: 5,
        mandatory: true,
        fileFolder: "File",
        stages: ["Series A"],
        uploadGuidelines: "Plot retention by customer type/segment"
      },
      feature_adoption_mapping: {
        name: "Feature adoption mapping",
        description: "Matrix: feature usage by persona/segment",
        allowedFormats: [".pdf", ".docx"],
        maxSizeBytes: 10 * 1024 * 1024,
        score: 4,
        mandatory: true,
        fileFolder: "File",
        stages: ["Series A"],
        uploadGuidelines: "Matrix: feature usage by persona/segment"
      }
    }
  },
  "2_Solution_Proof": {
    name: "Solution Proof",
    description: "Evidence of solution validation and technical capabilities",
    artifacts: {
      mvp_test_results: {
        name: "MVP test results",
        description: "Include goal, method, results, insights",
        allowedFormats: [".pdf", ".png", ".jpg", ".jpeg"],
        maxSizeBytes: 50 * 1024 * 1024,
        score: 6,
        mandatory: true,
        fileFolder: "Folder",
        stages: ["Pre-Seed", "Seed", "Series A"],
        uploadGuidelines: "Include goal, method, results, insights"
      },
      product_demo: {
        name: "Product demo",
        description: "Video or image-based walkthrough with captions",
        allowedFormats: [".mp4", ".pdf"],
        maxSizeBytes: 100 * 1024 * 1024,
        score: 3,
        mandatory: true,
        fileFolder: "File",
        stages: ["Pre-Seed", "Seed", "Series A"],
        uploadGuidelines: "Video or image-based walkthrough with captions"
      },
      gtm_hypothesis: {
        name: "GTM hypothesis",
        description: "Channel strategy, assumptions, early experiments",
        allowedFormats: [".pdf", ".docx"],
        maxSizeBytes: 10 * 1024 * 1024,
        score: 4,
        mandatory: true,
        fileFolder: "File",
        stages: ["Pre-Seed", "Seed", "Series A"],
        uploadGuidelines: "Channel strategy, assumptions, early experiments"
      },
      competitor_landscape: {
        name: "Competitor landscape",
        description: "Battlecard/table format. Highlight differentiators",
        allowedFormats: [".pdf", ".xlsx"],
        maxSizeBytes: 10 * 1024 * 1024,
        score: 3,
        mandatory: true,
        fileFolder: "File",
        stages: ["Pre-Seed", "Seed", "Series A"],
        uploadGuidelines: "Battlecard/table format. Highlight differentiators"
      },
      market_size_summary: {
        name: "Market size summary",
        description: "TAM/SAM/SOM with credible sources cited",
        allowedFormats: [".pdf"],
        maxSizeBytes: 10 * 1024 * 1024,
        score: 3,
        mandatory: true,
        fileFolder: "File",
        stages: ["Pre-Seed", "Seed", "Series A"],
        uploadGuidelines: "TAM/SAM/SOM with credible sources cited"
      },
      prooftag_badges: {
        name: "ProofTag badges",
        description: "Badge summary (auto-generated or from platform)",
        allowedFormats: [".pdf"],
        maxSizeBytes: 5 * 1024 * 1024,
        score: 3,
        mandatory: true,
        fileFolder: "File",
        stages: ["Pre-Seed", "Seed", "Series A"],
        uploadGuidelines: "Badge summary (auto-generated or from platform)"
      },
      retention_engagement_metrics: {
        name: "Retention/engagement metrics",
        description: "DAU/MAU, churn, cohort behaviour summaries",
        allowedFormats: [".pdf", ".xlsx"],
        maxSizeBytes: 10 * 1024 * 1024,
        score: 6,
        mandatory: true,
        fileFolder: "File",
        stages: ["Seed", "Series A"],
        uploadGuidelines: "DAU/MAU, churn, cohort behaviour summaries"
      },
      experiments_summary: {
        name: "Experiments summary",
        description: "Overview of MVP, GTM, or pricing tests and outcomes",
        allowedFormats: [".pdf", ".pptx"],
        maxSizeBytes: 20 * 1024 * 1024,
        score: 5,
        mandatory: true,
        fileFolder: "Folder",
        stages: ["Seed", "Series A"],
        uploadGuidelines: "Overview of MVP, GTM, or pricing tests and outcomes"
      },
      updated_gtm_roadmap: {
        name: "Updated GTM roadmap",
        description: "Evolution of GTM strategy with planned experiments",
        allowedFormats: [".pdf"],
        maxSizeBytes: 10 * 1024 * 1024,
        score: 5,
        mandatory: true,
        fileFolder: "File",
        stages: ["Seed", "Series A"],
        uploadGuidelines: "Evolution of GTM strategy with planned experiments"
      },
      competitive_moat_analysis: {
        name: "Competitive moat analysis",
        description: "Defensive positioning beyond basic battlecard",
        allowedFormats: [".pdf"],
        maxSizeBytes: 10 * 1024 * 1024,
        score: 3,
        mandatory: true,
        fileFolder: "File",
        stages: ["Seed", "Series A"],
        uploadGuidelines: "Defensive positioning beyond basic battlecard"
      },
      unit_economics: {
        name: "Unit economics",
        description: "CAC, LTV, payback, margin breakdowns",
        allowedFormats: [".pdf", ".xlsx"],
        maxSizeBytes: 10 * 1024 * 1024,
        score: 6,
        mandatory: true,
        fileFolder: "File",
        stages: ["Series A"],
        uploadGuidelines: "CAC, LTV, payback, margin breakdowns"
      },
      full_gtm_playbook: {
        name: "Full GTM playbook",
        description: "Documented funnel, channel tests, onboarding",
        allowedFormats: [".pdf", ".pptx"],
        maxSizeBytes: 15 * 1024 * 1024,
        score: 6,
        mandatory: true,
        fileFolder: "File",
        stages: ["Series A"],
        uploadGuidelines: "Documented funnel, channel tests, onboarding"
      },
      customer_feedback_loop_summary: {
        name: "Customer feedback loop summary",
        description: "Methodology: how customer input drives iteration",
        allowedFormats: [".pdf"],
        maxSizeBytes: 10 * 1024 * 1024,
        score: 4,
        mandatory: true,
        fileFolder: "File",
        stages: ["Series A"],
        uploadGuidelines: "Methodology: how customer input drives iteration"
      }
    }
  },
  "3_Demand_Proof": {
    name: "Demand Proof",
    description: "Evidence of market demand and customer validation",
    artifacts: {
      mvp_roadmap: {
        name: "MVP roadmap",
        description: "Timeline of builds, milestones, features",
        allowedFormats: [".pdf"],
        maxSizeBytes: 10 * 1024 * 1024,
        score: 4,
        mandatory: true,
        fileFolder: "File",
        stages: ["Pre-Seed", "Seed", "Series A"],
        uploadGuidelines: "Timeline of builds, milestones, features"
      },
      tech_stack_overview: {
        name: "Tech stack overview",
        description: "Diagram or table of technologies and rationale",
        allowedFormats: [".pdf"],
        maxSizeBytes: 10 * 1024 * 1024,
        score: 3,
        mandatory: true,
        fileFolder: "File",
        stages: ["Pre-Seed", "Seed", "Series A"],
        uploadGuidelines: "Diagram or table of technologies and rationale"
      },
      founder_bios: {
        name: "Founder bios",
        description: "1-page per founder, show problem-sector fit",
        allowedFormats: [".pdf"],
        maxSizeBytes: 5 * 1024 * 1024,
        score: 2,
        mandatory: true,
        fileFolder: "File",
        stages: ["Pre-Seed", "Seed", "Series A"],
        uploadGuidelines: "1-page per founder, show problem-sector fit"
      },
      advisors_early_hires: {
        name: "Advisors / early hires",
        description: "Profiles and roles of early contributors",
        allowedFormats: [".pdf"],
        maxSizeBytes: 10 * 1024 * 1024,
        score: 3,
        mandatory: true,
        fileFolder: "File",
        stages: ["Pre-Seed", "Seed", "Series A"],
        uploadGuidelines: "Profiles and roles of early contributors"
      },
      commercial_pipeline_tracker: {
        name: "Commercial pipeline tracker",
        description: "Active deals, stage, value, lead source",
        allowedFormats: [".xlsx", ".pdf"],
        maxSizeBytes: 10 * 1024 * 1024,
        score: 5,
        mandatory: true,
        fileFolder: "File",
        stages: ["Seed", "Series A"],
        uploadGuidelines: "Active deals, stage, value, lead source"
      },
      advisory_letters_partnerships: {
        name: "Advisory letters / partnerships",
        description: "Signed or email-confirmed intent/strategic alignment",
        allowedFormats: [".pdf"],
        maxSizeBytes: 20 * 1024 * 1024,
        score: 3,
        mandatory: true,
        fileFolder: "Folder",
        stages: ["Seed", "Series A"],
        uploadGuidelines: "Signed or email-confirmed intent/strategic alignment"
      },
      tech_architecture_evolution: {
        name: "Tech architecture evolution",
        description: "How system evolved from MVP to scalable infra",
        allowedFormats: [".pdf", ".png", ".jpg"],
        maxSizeBytes: 10 * 1024 * 1024,
        score: 4,
        mandatory: true,
        fileFolder: "File",
        stages: ["Series A"],
        uploadGuidelines: "How system evolved from MVP to scalable infra"
      },
      signed_customer_contracts: {
        name: "Signed customer contracts",
        description: "Executed commercial agreements",
        allowedFormats: [".pdf"],
        maxSizeBytes: 20 * 1024 * 1024,
        score: 6,
        mandatory: true,
        fileFolder: "Folder",
        stages: ["Series A"],
        uploadGuidelines: "Executed commercial agreements"
      },
      security_compliance_overview: {
        name: "Security/compliance overview",
        description: "GDPR, SOC2-lite, ISO controls (if applicable)",
        allowedFormats: [".pdf"],
        maxSizeBytes: 10 * 1024 * 1024,
        score: 3,
        mandatory: true,
        fileFolder: "File",
        stages: ["Series A"],
        uploadGuidelines: "GDPR, SOC2-lite, ISO controls (if applicable)"
      }
    }
  },
  "4_Credibility_Proof": {
    name: "Credibility Proof",
    description: "Legal and compliance documentation establishing credibility",
    artifacts: {
      proofscaling_reflections: {
        name: "ProofScaling reflections",
        description: "Summary of ProofScaling journey and insights",
        allowedFormats: [".pdf"],
        maxSizeBytes: 10 * 1024 * 1024,
        score: 5,
        mandatory: true,
        fileFolder: "File",
        stages: ["Pre-Seed", "Seed", "Series A"],
        uploadGuidelines: "Summary of ProofScaling journey and insights"
      },
      raise_use_of_funds: {
        name: "Raise + use of funds",
        description: "Chart or table linking raise to outcomes",
        allowedFormats: [".pdf", ".xlsx"],
        maxSizeBytes: 10 * 1024 * 1024,
        score: 5,
        mandatory: true,
        fileFolder: "File",
        stages: ["Pre-Seed", "Seed", "Series A"],
        uploadGuidelines: "Chart or table linking raise to outcomes"
      },
      runway_plan: {
        name: "Runway plan",
        description: "Burn rate, assumptions, months runway",
        allowedFormats: [".pdf", ".xlsx"],
        maxSizeBytes: 10 * 1024 * 1024,
        score: 3,
        mandatory: true,
        fileFolder: "File",
        stages: ["Pre-Seed", "Seed", "Series A"],
        uploadGuidelines: "Burn rate, assumptions, months runway"
      },
      assumption_tracker: {
        name: "Assumption tracker",
        description: "List of hypotheses, test status, outcomes",
        allowedFormats: [".pdf", ".xlsx"],
        maxSizeBytes: 10 * 1024 * 1024,
        score: 3,
        mandatory: true,
        fileFolder: "File",
        stages: ["Pre-Seed", "Seed", "Series A"],
        uploadGuidelines: "List of hypotheses, test status, outcomes"
      },
      hiring_pipeline_team_expansion_plan: {
        name: "Hiring pipeline / team expansion plan",
        description: "Role descriptions, timing, rationale",
        allowedFormats: [".pdf"],
        maxSizeBytes: 10 * 1024 * 1024,
        score: 4,
        mandatory: true,
        fileFolder: "File",
        stages: ["Seed", "Series A"],
        uploadGuidelines: "Role descriptions, timing, rationale"
      },
      capital_raised_to_date: {
        name: "Capital raised to date",
        description: "Grants, SAFE amounts, angel contributions",
        allowedFormats: [".pdf", ".xlsx"],
        maxSizeBytes: 10 * 1024 * 1024,
        score: 3,
        mandatory: true,
        fileFolder: "File",
        stages: ["Seed", "Series A"],
        uploadGuidelines: "Grants, SAFE amounts, angel contributions"
      },
      org_chart_role_clarity: {
        name: "Org chart + role clarity",
        description: "Current team + planned hiring roadmap",
        allowedFormats: [".pdf", ".png", ".jpg"],
        maxSizeBytes: 10 * 1024 * 1024,
        score: 3,
        mandatory: true,
        fileFolder: "File",
        stages: ["Series A"],
        uploadGuidelines: "Current team + planned hiring roadmap"
      },
      option_allocations_vesting_plan: {
        name: "Option allocations + vesting plan",
        description: "Detailed equity allocations, vesting schedules",
        allowedFormats: [".pdf", ".xlsx"],
        maxSizeBytes: 10 * 1024 * 1024,
        score: 3,
        mandatory: true,
        fileFolder: "File",
        stages: ["Series A"],
        uploadGuidelines: "Detailed equity allocations, vesting schedules"
      }
    }
  },
  "5_Commercial_Proof": {
    name: "Commercial Proof",
    description: "Financial performance and commercial viability documentation",
    artifacts: {
      pricing_test_outcomes: {
        name: "Pricing test outcomes",
        description: "Learning from price sensitivity, A/Bs or surveys",
        allowedFormats: [".pdf", ".pptx"],
        maxSizeBytes: 10 * 1024 * 1024,
        score: 3,
        mandatory: true,
        fileFolder: "File",
        stages: ["Seed", "Series A"],
        uploadGuidelines: "Learning from price sensitivity, A/Bs or surveys"
      },
      revenue_model_draft: {
        name: "Revenue model draft",
        description: "Pricing, margins, revenue drivers",
        allowedFormats: [".pdf", ".xlsx"],
        maxSizeBytes: 10 * 1024 * 1024,
        score: 3,
        mandatory: true,
        fileFolder: "File",
        stages: ["Seed", "Series A"],
        uploadGuidelines: "Pricing, margins, revenue drivers"
      },
      cac_estimate: {
        name: "CAC estimate",
        description: "Formula, assumptions, source channels",
        allowedFormats: [".pdf", ".xlsx"],
        maxSizeBytes: 10 * 1024 * 1024,
        score: 3,
        mandatory: true,
        fileFolder: "File",
        stages: ["Seed", "Series A"],
        uploadGuidelines: "Formula, assumptions, source channels"
      },
      revenue_performance: {
        name: "Revenue performance",
        description: "MRR/ARR, revenue by cohort or segment",
        allowedFormats: [".pdf", ".xlsx"],
        maxSizeBytes: 10 * 1024 * 1024,
        score: 6,
        mandatory: true,
        fileFolder: "File",
        stages: ["Series A"],
        uploadGuidelines: "MRR/ARR, revenue by cohort or segment"
      },
      cohort_analysis: {
        name: "Cohort analysis",
        description: "Retention, LTV, expansion by cohort",
        allowedFormats: [".pdf", ".xlsx"],
        maxSizeBytes: 10 * 1024 * 1024,
        score: 4,
        mandatory: true,
        fileFolder: "File",
        stages: ["Series A"],
        uploadGuidelines: "Retention, LTV, expansion by cohort"
      },
      financial_model: {
        name: "Financial model (12–24 months)",
        description: "Forecast incl. revenue, cost, hiring, runway",
        allowedFormats: [".xlsx"],
        maxSizeBytes: 15 * 1024 * 1024,
        score: 6,
        mandatory: true,
        fileFolder: "File",
        stages: ["Series A"],
        uploadGuidelines: "Forecast incl. revenue, cost, hiring, runway"
      }
    }
  },
  "6_Investor_Pack": {
    name: "Investor Pack",
    description: "Investor-ready documentation and funding materials",
    artifacts: {
      investor_snapshot_summary: {
        name: "Investor snapshot summary",
        description: "1-page summary: ProofScore, traction, raise ask",
        allowedFormats: [".pdf"],
        maxSizeBytes: 5 * 1024 * 1024,
        score: 3,
        mandatory: true,
        fileFolder: "File",
        stages: ["Pre-Seed", "Seed", "Series A"],
        uploadGuidelines: "1-page summary: ProofScore, traction, raise ask"
      },
      milestone_based_use_of_funds: {
        name: "Milestone-based use of funds",
        description: "Tied to traction goals or ProofTags",
        allowedFormats: [".pdf", ".xlsx"],
        maxSizeBytes: 10 * 1024 * 1024,
        score: 4,
        mandatory: true,
        fileFolder: "File",
        stages: ["Seed", "Series A"],
        uploadGuidelines: "Tied to traction goals or ProofTags"
      },
      twelve_month_proof_traction_plan: {
        name: "12-month proof/traction plan",
        description: "Table/timeline: outcomes per quarter",
        allowedFormats: [".pdf"],
        maxSizeBytes: 10 * 1024 * 1024,
        score: 4,
        mandatory: true,
        fileFolder: "File",
        stages: ["Seed", "Series A"],
        uploadGuidelines: "Table/timeline: outcomes per quarter"
      },
      pre_series_a_investment_memo: {
        name: "Pre-Series A investment memo",
        description: "Narrative for institutional raise: why now, why us, market, proof, ask",
        allowedFormats: [".pdf"],
        maxSizeBytes: 10 * 1024 * 1024,
        score: 4,
        mandatory: true,
        fileFolder: "File",
        stages: ["Series A"],
        uploadGuidelines: "Narrative for institutional raise: why now, why us, market, proof, ask"
      },
      key_risks_mitigation_summary: {
        name: "Key risks + mitigation summary",
        description: "List of current risks + how they're being addressed",
        allowedFormats: [".pdf"],
        maxSizeBytes: 10 * 1024 * 1024,
        score: 4,
        mandatory: true,
        fileFolder: "File",
        stages: ["Series A"],
        uploadGuidelines: "List of current risks + how they're being addressed"
      }
    }
  }
};

// Growth stage filtering utility
export const filterArtifactsByGrowthStage = (
  growthStage: GrowthStage | null | undefined
): ArtifactsConfig => {
  if (!growthStage) {
    return PROOF_VAULT_ARTIFACTS;
  }

  const filtered: ArtifactsConfig = {};
  
  Object.entries(PROOF_VAULT_ARTIFACTS).forEach(([categoryKey, category]) => {
    const filteredArtifacts: Record<string, ArtifactConfig> = {};
    
    Object.entries(category.artifacts).forEach(([artifactKey, artifact]) => {
      if (artifact.stages.includes(growthStage)) {
        filteredArtifacts[artifactKey] = artifact;
      }
    });
    
    // Only include category if it has visible artifacts
    if (Object.keys(filteredArtifacts).length > 0) {
      filtered[categoryKey] = {
        ...category,
        artifacts: filteredArtifacts
      };
    }
  });
  
  return filtered;
};

// Utility to get artifacts count by growth stage
export const getArtifactCountByStage = (growthStage: GrowthStage): number => {
  const filtered = filterArtifactsByGrowthStage(growthStage);
  return Object.values(filtered).reduce((total, category) => {
    return total + Object.keys(category.artifacts).length;
  }, 0);
};

// Check if artifact is visible for a growth stage
export const isArtifactVisibleForStage = (
  categoryKey: string,
  artifactKey: string,
  growthStage: GrowthStage | null | undefined
): boolean => {
  if (!growthStage) return true;
  
  const category = (PROOF_VAULT_ARTIFACTS as ArtifactsConfig)[categoryKey];
  if (!category) return false;
  
  const artifact = category.artifacts[artifactKey];
  if (!artifact) return false;
  
  return artifact.stages.includes(growthStage);
};