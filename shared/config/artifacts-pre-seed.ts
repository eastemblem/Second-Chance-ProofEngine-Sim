import { ArtifactsConfig } from './artifacts';

export const PRE_SEED_ARTIFACTS: ArtifactsConfig = {
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
        proofScoreContribution: 5,
        priority: "critical"
      },
      one_pager: {
        name: "One-pager",
        description: "Includes problem, solution, traction, raise",
        allowedFormats: [".pdf", ".docx"],
        maxSizeBytes: 10485760,
        score: 3,
        mandatory: true,
        fileFolder: "File",
        uploadGuidelines: "Includes problem, solution, traction, raise",
        proofScoreContribution: 2,
        priority: "critical"
      },
      proofscore_snapshot: {
        name: "ProofScore snapshot",
        description: "Auto-generated export",
        allowedFormats: [".pdf"],
        maxSizeBytes: 5242880,
        score: 3,
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
        score: 3,
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
        score: 3,
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
        score: 3,
        mandatory: true,
        fileFolder: "File",
        uploadGuidelines: "Signed agreement outlining equity split and roles",
        proofScoreContribution: 1,
        priority: "high"
      },
      ip_ownership_statement: {
        name: "IP ownership statement",
        description: "One-pager confirming IP belongs to entity",
        allowedFormats: [".pdf"],
        maxSizeBytes: 5242880,
        score: 3,
        mandatory: false,
        fileFolder: "File",
        uploadGuidelines: "One-pager confirming IP belongs to entity",
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
        score: 9,
        mandatory: true,
        fileFolder: "Folder",
        uploadGuidelines: "Surveys, interviews, insight summaries, labelled by type/date",
        proofScoreContribution: 4,
        priority: "critical"
      },
      customer_personas: {
        name: "Customer personas",
        description: "Synthesised from problem interviews or data",
        allowedFormats: [".pdf", ".docx"],
        maxSizeBytes: 10485760,
        score: 3,
        mandatory: true,
        fileFolder: "File",
        uploadGuidelines: "Synthesised from problem interviews or data",
        proofScoreContribution: 1,
        priority: "high"
      },
      validation_timeline: {
        name: "Validation timeline",
        description: "Chronological summary of discovery, validation, traction",
        allowedFormats: [".pdf"],
        maxSizeBytes: 5242880,
        score: 3,
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
        score: 9,
        mandatory: true,
        fileFolder: "Folder",
        uploadGuidelines: "Include goal, method, results, insights",
        proofScoreContribution: 4,
        priority: "critical"
      },
      product_demo: {
        name: "Product demo",
        description: "Video or image-based walkthrough with captions",
        allowedFormats: [".mp4", ".pdf"],
        maxSizeBytes: 104857600,
        score: 6,
        mandatory: true,
        fileFolder: "File",
        uploadGuidelines: "Video or image-based walkthrough with captions",
        proofScoreContribution: 2,
        priority: "high"
      },
      gtm_hypothesis: {
        name: "GTM hypothesis",
        description: "Channel strategy, assumptions, early experiments",
        allowedFormats: [".pdf", ".docx"],
        maxSizeBytes: 10485760,
        score: 6,
        mandatory: true,
        fileFolder: "File",
        uploadGuidelines: "Channel strategy, assumptions, early experiments",
        proofScoreContribution: 2,
        priority: "high"
      },
      competitor_landscape: {
        name: "Competitor landscape",
        description: "Battlecard/table format. Highlight differentiators",
        allowedFormats: [".pdf", ".xlsx"],
        maxSizeBytes: 10485760,
        score: 3,
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
        score: 3,
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
        score: 3,
        mandatory: false,
        fileFolder: "File",
        uploadGuidelines: "Badge summary (auto-generated or from platform)",
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
        score: 6,
        mandatory: true,
        fileFolder: "File",
        uploadGuidelines: "Timeline of builds, milestones, features",
        proofScoreContribution: 2,
        priority: "high"
      },
      tech_stack_overview: {
        name: "Tech stack overview",
        description: "Diagram or table of technologies and rationale",
        allowedFormats: [".pdf"],
        maxSizeBytes: 10485760,
        score: 3,
        mandatory: false,
        fileFolder: "File",
        uploadGuidelines: "Diagram or table of technologies and rationale",
        proofScoreContribution: 0,
        priority: "medium"
      },
      founder_bios: {
        name: "Founder bios",
        description: "1-page per founder, show problem-sector fit",
        allowedFormats: [".pdf"],
        maxSizeBytes: 5242880,
        score: 3,
        mandatory: true,
        fileFolder: "File",
        uploadGuidelines: "1-page per founder, show problem-sector fit",
        proofScoreContribution: 1,
        priority: "high"
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
        score: 6,
        mandatory: true,
        fileFolder: "File",
        uploadGuidelines: "Summary of ProofScaling journey and insights",
        proofScoreContribution: 2,
        priority: "high"
      },
      raise_use_of_funds: {
        name: "Raise + use of funds",
        description: "Chart or table linking raise to outcomes",
        allowedFormats: [".pdf", ".xlsx"],
        maxSizeBytes: 10485760,
        score: 6,
        mandatory: true,
        fileFolder: "File",
        uploadGuidelines: "Chart or table linking raise to outcomes",
        proofScoreContribution: 2,
        priority: "high"
      },
      runway_plan: {
        name: "Runway plan",
        description: "Burn rate, assumptions, months runway",
        allowedFormats: [".pdf", ".xlsx"],
        maxSizeBytes: 10485760,
        score: 3,
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
        maxSizeBytes: 5242880,
        score: 3,
        mandatory: false,
        fileFolder: "File",
        uploadGuidelines: "1-page summary: ProofScore, traction, raise ask",
        proofScoreContribution: 0,
        priority: "medium"
      }
    }
  }
};
