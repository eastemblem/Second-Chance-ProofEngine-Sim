import { ArtifactsConfig } from './artifacts';

export const SEED_ARTIFACTS: ArtifactsConfig = {
  "0_Overview": {
    name: "Overview",
    description: "Core business overview documents",
    artifacts: {
      pitch_deck: {
        name: "Pitch deck",
        description: "Concise, <3 months old, 10–15 slides",
        allowedFormats: [".pdf"],
        maxSizeBytes: 26214400,
        score: 3,
        mandatory: true,
        fileFolder: "File",
        uploadGuidelines: "Concise, <3 months old, 10–15 slides",
        proofScoreContribution: 2,
        priority: "critical"
      },
      one_pager: {
        name: "One-pager",
        description: "Includes problem, solution, traction, raise",
        allowedFormats: [".pdf", ".docx"],
        maxSizeBytes: 10485760,
        score: 2,
        mandatory: true,
        fileFolder: "File",
        uploadGuidelines: "Includes problem, solution, traction, raise",
        proofScoreContribution: 1,
        priority: "critical"
      },
      proofscore_snapshot: {
        name: "ProofScore snapshot",
        description: "Auto-generated export",
        allowedFormats: [".pdf"],
        maxSizeBytes: 5242880,
        score: 2,
        mandatory: true,
        fileFolder: "File",
        uploadGuidelines: "Auto-generated export",
        proofScoreContribution: 1,
        priority: "high"
      },
      incorporation_docs: {
        name: "Incorporation docs",
        description: "Certificate, articles, scanned originals",
        allowedFormats: [".pdf"],
        maxSizeBytes: 20971520,
        score: 2,
        mandatory: true,
        fileFolder: "Folder",
        uploadGuidelines: "Certificate, articles, scanned originals",
        proofScoreContribution: 1,
        priority: "high"
      },
      cap_table: {
        name: "Cap table",
        description: "Simple layout with founders, option pool, early investors",
        allowedFormats: [".xlsx", ".pdf"],
        maxSizeBytes: 10485760,
        score: 2,
        mandatory: true,
        fileFolder: "File",
        uploadGuidelines: "Simple layout with founders, option pool, early investors",
        proofScoreContribution: 1,
        priority: "high"
      },
      founder_agreement: {
        name: "Founder agreement",
        description: "Signed agreement outlining equity split and roles",
        allowedFormats: [".pdf"],
        maxSizeBytes: 10485760,
        score: 2,
        mandatory: true,
        fileFolder: "File",
        uploadGuidelines: "Signed agreement outlining equity split and roles",
        proofScoreContribution: 1,
        priority: "high"
      },
      board_resolutions: {
        name: "Board resolutions",
        description: "Signed copies, recent board-level decisions",
        allowedFormats: [".pdf"],
        maxSizeBytes: 10485760,
        score: 2,
        mandatory: true,
        fileFolder: "File",
        uploadGuidelines: "Signed copies, recent board-level decisions",
        proofScoreContribution: 1,
        priority: "high"
      },
      ip_ownership_statement: {
        name: "IP ownership statement",
        description: "One-pager confirming IP belongs to entity",
        allowedFormats: [".pdf"],
        maxSizeBytes: 5242880,
        score: 2,
        mandatory: false,
        fileFolder: "File",
        uploadGuidelines: "One-pager confirming IP belongs to entity",
        proofScoreContribution: 0,
        priority: "medium"
      },
      option_pool_terms: {
        name: "Option pool terms",
        description: "Legal doc outlining size, vesting, approvals",
        allowedFormats: [".pdf", ".docx"],
        maxSizeBytes: 10485760,
        score: 2,
        mandatory: false,
        fileFolder: "File",
        uploadGuidelines: "Legal doc outlining size, vesting, approvals",
        proofScoreContribution: 0,
        priority: "medium"
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
        maxSizeBytes: 52428800,
        score: 4,
        mandatory: true,
        fileFolder: "Folder",
        uploadGuidelines: "Surveys, interviews, insight summaries, labelled by type/date",
        proofScoreContribution: 2,
        priority: "critical"
      },
      customer_personas: {
        name: "Customer personas",
        description: "Synthesised from problem interviews or data",
        allowedFormats: [".pdf", ".docx"],
        maxSizeBytes: 10485760,
        score: 2,
        mandatory: true,
        fileFolder: "File",
        uploadGuidelines: "Synthesised from problem interviews or data",
        proofScoreContribution: 1,
        priority: "high"
      },
      segment_prioritisation_notes: {
        name: "Segment prioritisation notes",
        description: "Rationale for segment focus, linked to persona + problem insights",
        allowedFormats: [".pdf"],
        maxSizeBytes: 10485760,
        score: 2,
        mandatory: true,
        fileFolder: "File",
        uploadGuidelines: "Rationale for segment focus, linked to persona + problem insights",
        proofScoreContribution: 1,
        priority: "medium"
      },
      validation_timeline: {
        name: "Validation timeline",
        description: "Chronological summary of discovery, validation, traction",
        allowedFormats: [".pdf"],
        maxSizeBytes: 5242880,
        score: 2,
        mandatory: false,
        fileFolder: "File",
        uploadGuidelines: "Chronological summary of discovery, validation, traction",
        proofScoreContribution: 0,
        priority: "medium"
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
        maxSizeBytes: 52428800,
        score: 4,
        mandatory: true,
        fileFolder: "Folder",
        uploadGuidelines: "Include goal, method, results, insights",
        proofScoreContribution: 2,
        priority: "critical"
      },
      retention_engagement_metrics: {
        name: "Retention/engagement metrics",
        description: "DAU/MAU, churn, cohort behaviour summaries",
        allowedFormats: [".pdf", ".xlsx"],
        maxSizeBytes: 10485760,
        score: 4,
        mandatory: true,
        fileFolder: "File",
        uploadGuidelines: "DAU/MAU, churn, cohort behaviour summaries",
        proofScoreContribution: 2,
        priority: "critical"
      },
      product_demo: {
        name: "Product demo",
        description: "Video or image-based walkthrough with captions",
        allowedFormats: [".mp4", ".pdf"],
        maxSizeBytes: 104857600,
        score: 2,
        mandatory: true,
        fileFolder: "File",
        uploadGuidelines: "Video or image-based walkthrough with captions",
        proofScoreContribution: 1,
        priority: "high"
      },
      gtm_hypothesis: {
        name: "GTM hypothesis",
        description: "Channel strategy, assumptions, early experiments",
        allowedFormats: [".pdf", ".docx"],
        maxSizeBytes: 10485760,
        score: 2,
        mandatory: true,
        fileFolder: "File",
        uploadGuidelines: "Channel strategy, assumptions, early experiments",
        proofScoreContribution: 1,
        priority: "high"
      },
      experiments_summary: {
        name: "Experiments summary",
        description: "Overview of MVP, GTM, or pricing tests and outcomes",
        allowedFormats: [".pdf", ".pptx"],
        maxSizeBytes: 20971520,
        score: 2,
        mandatory: true,
        fileFolder: "Folder",
        uploadGuidelines: "Overview of MVP, GTM, or pricing tests and outcomes",
        proofScoreContribution: 1,
        priority: "high"
      },
      updated_gtm_roadmap: {
        name: "Updated GTM roadmap",
        description: "Evolution of GTM strategy with planned experiments",
        allowedFormats: [".pdf"],
        maxSizeBytes: 10485760,
        score: 3,
        mandatory: false,
        fileFolder: "File",
        uploadGuidelines: "Evolution of GTM strategy with planned experiments",
        proofScoreContribution: 0,
        priority: "medium"
      },
      competitor_landscape: {
        name: "Competitor landscape",
        description: "Battlecard/table format. Highlight differentiators",
        allowedFormats: [".pdf", ".xlsx"],
        maxSizeBytes: 10485760,
        score: 2,
        mandatory: false,
        fileFolder: "File",
        uploadGuidelines: "Battlecard/table format. Highlight differentiators",
        proofScoreContribution: 0,
        priority: "medium"
      },
      market_size_summary: {
        name: "Market size summary",
        description: "TAM/SAM/SOM with credible sources cited",
        allowedFormats: [".pdf"],
        maxSizeBytes: 10485760,
        score: 2,
        mandatory: false,
        fileFolder: "File",
        uploadGuidelines: "TAM/SAM/SOM with credible sources cited",
        proofScoreContribution: 0,
        priority: "medium"
      },
      prooftag_badges: {
        name: "ProofTag badges",
        description: "Badge summary (auto-generated or from platform)",
        allowedFormats: [".pdf"],
        maxSizeBytes: 5242880,
        score: 2,
        mandatory: false,
        fileFolder: "File",
        uploadGuidelines: "Badge summary (auto-generated or from platform)",
        proofScoreContribution: 0,
        priority: "medium"
      },
      competitive_moat_analysis: {
        name: "Competitive moat analysis",
        description: "Defensive positioning beyond basic battlecard",
        allowedFormats: [".pdf"],
        maxSizeBytes: 10485760,
        score: 2,
        mandatory: false,
        fileFolder: "File",
        uploadGuidelines: "Defensive positioning beyond basic battlecard",
        proofScoreContribution: 0,
        priority: "medium"
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
        maxSizeBytes: 10485760,
        score: 3,
        mandatory: true,
        fileFolder: "File",
        uploadGuidelines: "Timeline of builds, milestones, features",
        proofScoreContribution: 1,
        priority: "high"
      },
      commercial_pipeline_tracker: {
        name: "Commercial pipeline tracker",
        description: "Active deals, stage, value, lead source",
        allowedFormats: [".xlsx", ".pdf"],
        maxSizeBytes: 10485760,
        score: 3,
        mandatory: true,
        fileFolder: "File",
        uploadGuidelines: "Active deals, stage, value, lead source",
        proofScoreContribution: 1,
        priority: "high"
      },
      founder_bios: {
        name: "Founder bios",
        description: "1-page per founder, show problem-sector fit",
        allowedFormats: [".pdf"],
        maxSizeBytes: 5242880,
        score: 2,
        mandatory: true,
        fileFolder: "File",
        uploadGuidelines: "1-page per founder, show problem-sector fit",
        proofScoreContribution: 1,
        priority: "high"
      },
      advisory_letters_partnerships: {
        name: "Advisory letters / partnerships",
        description: "Signed or email-confirmed intent/strategic alignment",
        allowedFormats: [".pdf"],
        maxSizeBytes: 20971520,
        score: 2,
        mandatory: false,
        fileFolder: "Folder",
        uploadGuidelines: "Signed or email-confirmed intent/strategic alignment",
        proofScoreContribution: 0,
        priority: "medium"
      },
      tech_stack_overview: {
        name: "Tech stack overview",
        description: "Diagram or table of technologies and rationale",
        allowedFormats: [".pdf"],
        maxSizeBytes: 10485760,
        score: 2,
        mandatory: false,
        fileFolder: "File",
        uploadGuidelines: "Diagram or table of technologies and rationale",
        proofScoreContribution: 0,
        priority: "medium"
      },
      advisors_early_hires: {
        name: "Advisors / early hires",
        description: "Profiles and roles of early contributors",
        allowedFormats: [".pdf"],
        maxSizeBytes: 10485760,
        score: 2,
        mandatory: false,
        fileFolder: "File",
        uploadGuidelines: "Profiles and roles of early contributors",
        proofScoreContribution: 0,
        priority: "medium"
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
        maxSizeBytes: 10485760,
        score: 3,
        mandatory: true,
        fileFolder: "File",
        uploadGuidelines: "Summary of ProofScaling journey and insights",
        proofScoreContribution: 1,
        priority: "high"
      },
      raise_use_of_funds: {
        name: "Raise + use of funds",
        description: "Chart or table linking raise to outcomes",
        allowedFormats: [".pdf", ".xlsx"],
        maxSizeBytes: 10485760,
        score: 3,
        mandatory: true,
        fileFolder: "File",
        uploadGuidelines: "Chart or table linking raise to outcomes",
        proofScoreContribution: 1,
        priority: "high"
      },
      hiring_pipeline_team_expansion_plan: {
        name: "Hiring pipeline / team expansion plan",
        description: "Role descriptions, timing, rationale",
        allowedFormats: [".pdf"],
        maxSizeBytes: 10485760,
        score: 3,
        mandatory: true,
        fileFolder: "File",
        uploadGuidelines: "Role descriptions, timing, rationale",
        proofScoreContribution: 1,
        priority: "high"
      },
      runway_plan: {
        name: "Runway plan",
        description: "Burn rate, assumptions, months runway",
        allowedFormats: [".pdf", ".xlsx"],
        maxSizeBytes: 10485760,
        score: 2,
        mandatory: false,
        fileFolder: "File",
        uploadGuidelines: "Burn rate, assumptions, months runway",
        proofScoreContribution: 0,
        priority: "medium"
      },
      assumption_tracker: {
        name: "Assumption tracker",
        description: "List of hypotheses, test status, outcomes",
        allowedFormats: [".pdf", ".xlsx"],
        maxSizeBytes: 10485760,
        score: 2,
        mandatory: false,
        fileFolder: "File",
        uploadGuidelines: "List of hypotheses, test status, outcomes",
        proofScoreContribution: 0,
        priority: "medium"
      },
      capital_raised_to_date: {
        name: "Capital raised to date",
        description: "Grants, SAFE amounts, angel contributions",
        allowedFormats: [".pdf", ".xlsx"],
        maxSizeBytes: 10485760,
        score: 2,
        mandatory: false,
        fileFolder: "File",
        uploadGuidelines: "Grants, SAFE amounts, angel contributions",
        proofScoreContribution: 0,
        priority: "medium"
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
        maxSizeBytes: 10485760,
        score: 3,
        mandatory: true,
        fileFolder: "File",
        uploadGuidelines: "Learning from price sensitivity, A/Bs or surveys",
        proofScoreContribution: 1,
        priority: "high"
      },
      revenue_model_draft: {
        name: "Revenue model draft",
        description: "Pricing, margins, revenue drivers",
        allowedFormats: [".pdf", ".xlsx"],
        maxSizeBytes: 10485760,
        score: 3,
        mandatory: true,
        fileFolder: "File",
        uploadGuidelines: "Pricing, margins, revenue drivers",
        proofScoreContribution: 1,
        priority: "high"
      },
      cac_estimate: {
        name: "CAC estimate",
        description: "Formula, assumptions, source channels",
        allowedFormats: [".pdf", ".xlsx"],
        maxSizeBytes: 10485760,
        score: 3,
        mandatory: true,
        fileFolder: "File",
        uploadGuidelines: "Formula, assumptions, source channels",
        proofScoreContribution: 1,
        priority: "high"
      }
    }
  },
  "6_Investor_Pack": {
    name: "Investor Pack",
    description: "Investor-ready documentation and funding materials",
    artifacts: {
      milestone_based_use_of_funds: {
        name: "Milestone-based use of funds",
        description: "Tied to traction goals or ProofTags",
        allowedFormats: [".pdf", ".xlsx"],
        maxSizeBytes: 10485760,
        score: 3,
        mandatory: true,
        fileFolder: "File",
        uploadGuidelines: "Tied to traction goals or ProofTags",
        proofScoreContribution: 1,
        priority: "high"
      },
      twelve_month_proof_traction_plan: {
        name: "12-month proof/traction plan",
        description: "Table/timeline: outcomes per quarter",
        allowedFormats: [".pdf"],
        maxSizeBytes: 10485760,
        score: 3,
        mandatory: true,
        fileFolder: "File",
        uploadGuidelines: "Table/timeline: outcomes per quarter",
        proofScoreContribution: 1,
        priority: "high"
      },
      investor_snapshot_summary: {
        name: "Investor snapshot summary",
        description: "1-page summary: ProofScore, traction, raise ask",
        allowedFormats: [".pdf"],
        maxSizeBytes: 5242880,
        score: 2,
        mandatory: false,
        fileFolder: "File",
        uploadGuidelines: "1-page summary: ProofScore, traction, raise ask",
        proofScoreContribution: 0,
        priority: "medium"
      }
    }
  }
};
