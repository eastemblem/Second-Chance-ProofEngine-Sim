export const PROOF_VAULT_ARTIFACTS = {
  overview: {
    name: "Overview",
    description: "Core business overview documents",
    artifacts: {
      pitch_deck: {
        name: "Pitch Deck",
        description: "Main investor presentation covering problem, solution, market, team, and financials",
        allowedFormats: [".pdf", ".pptx", ".ppt"],
        maxSizeBytes: 50 * 1024 * 1024, // 50MB
        score: 5,
        mandatory: true
      },
      teaser: {
        name: "Teaser / One-pager",
        description: "Single page business summary with key value propositions and competitive advantages",
        allowedFormats: [".pdf", ".docx", ".png", ".jpg"],
        maxSizeBytes: 10 * 1024 * 1024, // 10MB
        score: 4,
        mandatory: true
      },
      mission_vision: {
        name: "Mission / Vision",
        description: "Company mission statement and long-term vision for the future",
        allowedFormats: [".pdf", ".docx"],
        maxSizeBytes: 5 * 1024 * 1024, // 5MB
        score: 3,
        mandatory: false
      },
      founder_video: {
        name: "Founder Video / Intro",
        description: "Personal introduction video from founders explaining their background and motivation",
        allowedFormats: [".mp4", ".mov", ".avi"],
        maxSizeBytes: 100 * 1024 * 1024, // 100MB
        score: 2,
        mandatory: false
      },
      team_bios: {
        name: "Team Bios",
        description: "Detailed biographies and credentials of core team members",
        allowedFormats: [".pdf", ".docx"],
        maxSizeBytes: 15 * 1024 * 1024, // 15MB
        score: 4,
        mandatory: true
      },
      roadmap: {
        name: "Roadmap",
        description: "Product development roadmap with key milestones and timelines",
        allowedFormats: [".pdf", ".pptx", ".xlsx"],
        maxSizeBytes: 20 * 1024 * 1024, // 20MB
        score: 4,
        mandatory: true
      },
      milestones: {
        name: "Milestones",
        description: "Achievement milestones and key performance indicators reached",
        allowedFormats: [".pdf", ".xlsx", ".docx"],
        maxSizeBytes: 15 * 1024 * 1024, // 15MB
        score: 4,
        mandatory: true
      }
    }
  },
  problem_proofs: {
    name: "Problem Proofs",
    description: "Evidence of problem validation and market research",
    artifacts: {
      discovery_summary: {
        name: "Discovery Summary",
        description: "Customer discovery findings and problem validation insights from user interviews",
        allowedFormats: [".pdf", ".docx"],
        maxSizeBytes: 15 * 1024 * 1024, // 15MB
        score: 3,
        mandatory: false
      },
      market_analysis: {
        name: "Market Sizing & Analysis", 
        description: "Comprehensive market size analysis with TAM/SAM/SOM breakdown and competitive landscape",
        allowedFormats: [".pdf", ".xlsx", ".docx"],
        maxSizeBytes: 25 * 1024 * 1024, // 25MB
        score: 5,
        mandatory: true
      },
      mentor_reports: {
        name: "Mentor Reports / Expert Validation",
        description: "Validation reports and recommendations from industry mentors and domain experts",
        allowedFormats: [".pdf", ".docx"],
        maxSizeBytes: 10 * 1024 * 1024, // 10MB
        score: 2,
        mandatory: false
      }
    }
  },
  solution_proofs: {
    name: "Solution Proofs",
    description: "Evidence of solution validation and technical capabilities",
    artifacts: {
      product_demo: {
        name: "Product Demo / Video",
        description: "Product demonstration video or interactive demo showing key features and user workflow",
        allowedFormats: [".mp4", ".mov", ".pdf", ".pptx"],
        maxSizeBytes: 100 * 1024 * 1024, // 100MB
        score: 5,
        mandatory: true
      },
      tech_stack: {
        name: "Tech Stack Docs",
        description: "Technical architecture documentation detailing technology choices and system design",
        allowedFormats: [".pdf", ".docx"],
        maxSizeBytes: 20 * 1024 * 1024, // 20MB
        score: 3,
        mandatory: false
      },
      kpis_dashboard: {
        name: "KPIs Dashboard",
        description: "Key performance indicators dashboard showing product metrics and user analytics",
        allowedFormats: [".pdf", ".xlsx", ".png", ".jpg"],
        maxSizeBytes: 15 * 1024 * 1024, // 15MB
        score: 4,
        mandatory: true
      },
      funnels: {
        name: "Funnels (activation, conversion)",
        description: "User activation and conversion funnels showing customer journey and optimization metrics",
        allowedFormats: [".pdf", ".xlsx", ".png"],
        maxSizeBytes: 10 * 1024 * 1024, // 10MB
        score: 3,
        mandatory: false
      },
      gtm_plan: {
        name: "GTM Plan",
        description: "Go-to-market strategy including customer acquisition channels and marketing approach",
        allowedFormats: [".pdf", ".pptx", ".docx"],
        maxSizeBytes: 20 * 1024 * 1024, // 20MB
        score: 4,
        mandatory: true
      },
      sales_playbook: {
        name: "Sales Playbook",
        description: "Sales methodology, process documentation, and conversion strategies",
        allowedFormats: [".pdf", ".docx"],
        maxSizeBytes: 15 * 1024 * 1024, // 15MB
        score: 3,
        mandatory: false
      }
    }
  },
  demand_proofs: {
    name: "Demand Proofs",
    description: "Evidence of market demand and customer validation",
    artifacts: {
      lois: {
        name: "LOIs (Letters of Intent)",
        description: "Signed letters of intent from potential customers showing purchase commitment",
        allowedFormats: [".pdf", ".docx"],
        maxSizeBytes: 10 * 1024 * 1024, // 10MB
        score: 5,
        mandatory: true
      },
      partnerships: {
        name: "Partnerships / MOUs",
        description: "Partnership agreements and memorandums of understanding with strategic partners",
        allowedFormats: [".pdf", ".docx"],
        maxSizeBytes: 15 * 1024 * 1024, // 15MB
        score: 4,
        mandatory: false
      },
      testimonials: {
        name: "Customer Testimonials",
        description: "Customer testimonials, case studies, and success stories from early users",
        allowedFormats: [".pdf", ".docx", ".mp4", ".mov"],
        maxSizeBytes: 50 * 1024 * 1024, // 50MB
        score: 2,
        mandatory: false
      },
      traction_metrics: {
        name: "Traction Metrics (Users, MRR growth)",
        description: "Key traction metrics including user growth, monthly recurring revenue, and engagement data",
        allowedFormats: [".pdf", ".xlsx", ".png"],
        maxSizeBytes: 10 * 1024 * 1024, // 10MB
        score: 5,
        mandatory: true
      }
    }
  },
  credibility_proofs: {
    name: "Credibility Proofs",
    description: "Legal and compliance documentation establishing credibility",
    artifacts: {
      incorporation: {
        name: "Incorporation Certificate",
        description: "Official company incorporation certificate and business registration documents",
        allowedFormats: [".pdf"],
        maxSizeBytes: 5 * 1024 * 1024, // 5MB
        score: 5,
        mandatory: true
      },
      cap_table: {
        name: "Cap Table",
        description: "Current capitalization table showing ownership structure and equity distribution",
        allowedFormats: [".pdf", ".xlsx"],
        maxSizeBytes: 5 * 1024 * 1024, // 5MB
        score: 5,
        mandatory: true
      },
      ip_agreements: {
        name: "IP Agreements",
        description: "Intellectual property agreements, patents, trademarks, and IP assignment documents",
        allowedFormats: [".pdf", ".docx"],
        maxSizeBytes: 20 * 1024 * 1024, // 20MB
        score: 4,
        mandatory: true
      },
      legal_contracts: {
        name: "Legal Contracts (NDAs, SHA, SSA)",
        description: "Legal contracts including NDAs, shareholder agreements, and service agreements",
        allowedFormats: [".pdf", ".docx"],
        maxSizeBytes: 25 * 1024 * 1024, // 25MB
        score: 5,
        mandatory: true
      },
      compliance_certs: {
        name: "Compliance Certificates (ISO, SOC2, GDPR)",
        description: "Compliance certifications including ISO, SOC2, GDPR, and industry-specific certifications",
        allowedFormats: [".pdf"],
        maxSizeBytes: 10 * 1024 * 1024, // 10MB
        score: 3,
        mandatory: false
      },
      proofvault_index: {
        name: "ProofVault Index",
        description: "Comprehensive index document organizing all proofs and supporting materials",
        allowedFormats: [".pdf", ".xlsx"],
        maxSizeBytes: 5 * 1024 * 1024, // 5MB
        score: 2,
        mandatory: false
      }
    }
  },
  commercial_proofs: {
    name: "Commercial Proofs",
    description: "Financial performance and commercial viability documentation",
    artifacts: {
      mrr_data: {
        name: "MRR Data (detailed)",
        description: "Detailed monthly recurring revenue data with breakdown by customer segments and pricing tiers",
        allowedFormats: [".pdf", ".xlsx"],
        maxSizeBytes: 15 * 1024 * 1024, // 15MB
        score: 5,
        mandatory: true
      },
      historical_financials: {
        name: "Historical Financials",
        description: "Historical financial statements including P&L, balance sheet, and cash flow statements",
        allowedFormats: [".pdf", ".xlsx"],
        maxSizeBytes: 20 * 1024 * 1024, // 20MB
        score: 5,
        mandatory: true
      },
      projections: {
        name: "Projections (3–5 yrs)",
        description: "Financial projections for 3-5 years including revenue forecasts and growth assumptions",
        allowedFormats: [".pdf", ".xlsx"],
        maxSizeBytes: 15 * 1024 * 1024, // 15MB
        score: 5,
        mandatory: true
      },
      burn_rate: {
        name: "Burn Rate & Runway",
        description: "Monthly burn rate analysis and runway calculations with cash flow projections",
        allowedFormats: [".pdf", ".xlsx"],
        maxSizeBytes: 10 * 1024 * 1024, // 10MB
        score: 5,
        mandatory: true
      },
      hiring_plan: {
        name: "Hiring Plan",
        description: "Detailed hiring plan with role descriptions, compensation, and timeline for team expansion",
        allowedFormats: [".pdf", ".xlsx", ".docx"],
        maxSizeBytes: 10 * 1024 * 1024, // 10MB
        score: 3,
        mandatory: false
      },
      tax_filings: {
        name: "Tax Filings / Returns",
        description: "Corporate tax filings and returns demonstrating financial compliance and history",
        allowedFormats: [".pdf"],
        maxSizeBytes: 15 * 1024 * 1024, // 15MB
        score: 4,
        mandatory: true
      },
      debt_obligations: {
        name: "Loan Agreements / Debt Obligations",
        description: "Loan agreements, credit facilities, and outstanding debt obligations documentation",
        allowedFormats: [".pdf", ".docx"],
        maxSizeBytes: 20 * 1024 * 1024, // 20MB
        score: 3,
        mandatory: false
      }
    }
  },
  investor_pack: {
    name: "Investor Pack",
    description: "Investor-ready documentation and funding materials",
    artifacts: {
      funding_terms: {
        name: "Terms (Funding Round)",
        description: "Current funding round terms including valuation, equity offering, and investor rights",
        allowedFormats: [".pdf", ".docx"],
        maxSizeBytes: 10 * 1024 * 1024, // 10MB
        score: 5,
        mandatory: true
      },
      investor_updates: {
        name: "Investor Updates / Past Reports",
        description: "Historical investor updates and reports demonstrating regular communication and transparency",
        allowedFormats: [".pdf", ".docx"],
        maxSizeBytes: 25 * 1024 * 1024, // 25MB
        score: 3,
        mandatory: false
      },
      master_summary: {
        name: "Master Summary (Index)",
        description: "Master summary document providing complete overview and index of all investor materials",
        allowedFormats: [".pdf", ".docx"],
        maxSizeBytes: 15 * 1024 * 1024, // 15MB
        score: 4,
        mandatory: true
      }
    }
  }
};

export type ArtifactConfig = {
  name: string;
  description: string;
  allowedFormats: string[];
  maxSizeBytes: number;
  score: number;
  mandatory: boolean;
};

export type CategoryConfig = {
  name: string;
  description: string;
  artifacts: Record<string, ArtifactConfig>;
};