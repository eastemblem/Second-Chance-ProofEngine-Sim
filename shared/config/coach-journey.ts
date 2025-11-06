import { Rocket, FileText, BarChart3, Award, Upload, CheckCircle, Users, CreditCard, MapPin, TrendingUp, Target, FolderOpen } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface JourneyStep {
  id: number;
  title: string;
  description: string;
  page: string; // Which page this step relates to
  duration: string;
  icon: LucideIcon;
  color: string;
  action: string; // CTA button text
  route?: string; // Optional route to navigate to
  selector?: string; // Optional data-testid for highlighting
  coachGuidance: {
    intro: string;
    instruction: string;
    tip?: string;
    nextStep?: string;
  };
  completionCriteria?: {
    checkField?: string; // Field to check in user/venture data
    minValue?: number; // For scores
    required?: boolean;
  };
  scoreThreshold?: {
    // Show different messages based on score
    low?: { max: number; message: string };
    medium?: { min: number; max: number; message: string };
    high?: { min: number; message: string };
  };
}

export const COACH_JOURNEY_STEPS: JourneyStep[] = [
  {
    id: 0,
    title: "Welcome to Second Chance",
    description: "Start your validation journey",
    page: "landing",
    duration: "2 min",
    icon: Rocket,
    color: "bg-blue-500",
    action: "Start Validation",
    route: "/onboarding-flow",
    coachGuidance: {
      intro: "Welcome! Let's transform your startup idea into an investor-ready venture.",
      instruction: "Click 'Start Validation' to begin your onboarding journey.",
      tip: "This process takes about 15 minutes and will give you your first ProofScore.",
      nextStep: "You'll provide founder details, venture information, and upload your pitch deck.",
    },
  },
  {
    id: 1,
    title: "Complete Onboarding",
    description: "Share your founder and venture details",
    page: "onboarding",
    duration: "10 min",
    icon: FileText,
    color: "bg-purple-500",
    action: "Continue Onboarding",
    route: "/onboarding-flow",
    coachGuidance: {
      intro: "Let's get your startup profile set up.",
      instruction: "Complete all onboarding steps: Founder Info → Venture Details → Team → Pitch Deck Upload.",
      tip: "Provide detailed information to get a more accurate ProofScore.",
      nextStep: "After completion, you'll receive your AI-powered ProofScore analysis.",
    },
    completionCriteria: {
      checkField: "onboardingComplete",
      required: true,
    },
  },
  {
    id: 2,
    title: "Review Your ProofScore",
    description: "Understand your validation score and insights",
    page: "dashboard",
    duration: "5 min",
    icon: BarChart3,
    color: "bg-green-500",
    action: "View Dashboard",
    route: "/dashboard",
    selector: "[data-testid='proofscore-display']",
    coachGuidance: {
      intro: "Your ProofScore reveals your startup's investment readiness.",
      instruction: "Review your score, dimension breakdown, and unlocked ProofTags.",
      tip: "ProofScores range from 0-100. Scores of 70+ unlock Deal Room access.",
      nextStep: "Explore the Validation Map to strengthen weak areas.",
    },
    scoreThreshold: {
      low: { max: 40, message: "Focus on building foundational proof through experiments." },
      medium: { min: 40, max: 70, message: "You're making progress! Complete validation experiments to boost your score." },
      high: { min: 70, message: "Excellent! You're ready for Deal Room access." },
    },
  },
  {
    id: 3,
    title: "Explore Validation Map",
    description: "Discover your personalized experiments",
    page: "validation-map",
    duration: "10 min",
    icon: MapPin,
    color: "bg-yellow-500",
    action: "Open Validation Map",
    route: "/validation-map",
    selector: "[data-testid='validation-map-grid']",
    coachGuidance: {
      intro: "Your Validation Map contains AI-curated experiments tailored to your startup.",
      instruction: "Review assigned experiments across Desirability, Feasibility, Viability, and Scaling spheres.",
      tip: "Each experiment tests a critical assumption about your business model.",
      nextStep: "Start running experiments and documenting results.",
    },
  },
  {
    id: 4,
    title: "Complete Your First Experiment",
    description: "Run and document a validation experiment",
    page: "validation-map",
    duration: "1-2 weeks",
    icon: Target,
    color: "bg-orange-500",
    action: "Start Experiment",
    route: "/validation-map",
    coachGuidance: {
      intro: "Time to validate your assumptions with real-world data!",
      instruction: "Pick an experiment, define your hypothesis, run it, and record your results.",
      tip: "Completed experiments unlock ProofTags and boost your credibility with investors.",
      nextStep: "Continue completing experiments to strengthen your validation.",
    },
    completionCriteria: {
      checkField: "hasCompletedExperiment",
      required: false,
    },
  },
  {
    id: 5,
    title: "Build Your ProofVault",
    description: "Upload validation documents and proof artifacts",
    page: "dashboard",
    duration: "15 min",
    icon: FolderOpen,
    color: "bg-indigo-500",
    action: "Upload to ProofVault",
    route: "/dashboard",
    selector: "[data-testid='proof-vault-section']",
    coachGuidance: {
      intro: "ProofVault is your organized repository of validation evidence.",
      instruction: "Upload documents like customer testimonials, metrics dashboards, demo videos, and financial models.",
      tip: "Each upload increases your VaultScore, showing investors you have systematic proof.",
      nextStep: "Aim for a VaultScore of 50+ by uploading diverse proof artifacts.",
    },
    completionCriteria: {
      checkField: "vaultScore",
      minValue: 30,
    },
  },
  {
    id: 6,
    title: "Download Your Certificate",
    description: "Get your ProofScore certificate",
    page: "dashboard",
    duration: "1 min",
    icon: Award,
    color: "bg-pink-500",
    action: "Download Certificate",
    route: "/dashboard",
    selector: "[data-testid='button-download-certificate']",
    coachGuidance: {
      intro: "Your ProofScore certificate validates your systematic approach.",
      instruction: "Download and share your certificate with accelerators, investors, or on LinkedIn.",
      tip: "This certificate demonstrates you've gone beyond a pitch deck to validate your venture.",
      nextStep: "Keep improving your score to increase your credibility.",
    },
  },
  {
    id: 7,
    title: "Unlock Deal Room Access",
    description: "Connect with verified investors",
    page: "dashboard",
    duration: "5 min",
    icon: Users,
    color: "bg-emerald-500",
    action: "Access Deal Room",
    route: "/dashboard",
    selector: "[data-testid='deal-room-section']",
    coachGuidance: {
      intro: "Deal Room connects high-scoring founders with active investors.",
      instruction: "If your ProofScore is 70+, you can unlock premium investor access.",
      tip: "Deal Room members get investor introductions, pitch practice, and fundraising support.",
      nextStep: "Complete payment to activate your Deal Room membership.",
    },
    completionCriteria: {
      checkField: "proofScore",
      minValue: 70,
    },
    scoreThreshold: {
      low: { max: 70, message: "Increase your ProofScore to 70+ to unlock Deal Room access." },
      high: { min: 70, message: "Congratulations! You qualify for Deal Room access." },
    },
  },
  {
    id: 8,
    title: "Activate Premium Features",
    description: "Unlock full platform access",
    page: "dashboard",
    duration: "3 min",
    icon: CreditCard,
    color: "bg-violet-500",
    action: "Upgrade Now",
    route: "/dashboard",
    coachGuidance: {
      intro: "Premium access unlocks investor matching, pitch coaching, and priority support.",
      instruction: "Complete payment to activate your Deal Room membership.",
      tip: "Investment: AED 499 or $149. Founders who use Deal Room are 3x more likely to secure meetings.",
      nextStep: "After payment, you'll get immediate access to our investor network.",
    },
    completionCriteria: {
      checkField: "hasDealRoomAccess",
      required: false,
    },
  },
  {
    id: 9,
    title: "Keep Building Proof",
    description: "Continuous validation journey",
    page: "dashboard",
    duration: "Ongoing",
    icon: TrendingUp,
    color: "bg-teal-500",
    action: "View Progress",
    route: "/dashboard",
    coachGuidance: {
      intro: "Validation is an ongoing process, not a one-time event.",
      instruction: "Keep running experiments, uploading proof, and improving your ProofScore.",
      tip: "Regular updates show investors you're making progress and learning from data.",
      nextStep: "Use the Validation Map and ProofVault to systematically strengthen your case.",
    },
  },
];

// Page-specific tutorial mechanics
export interface TutorialMechanic {
  id: string;
  page: string;
  title: string;
  description: string;
  selector: string; // data-testid to highlight
  tips?: string;
  location: string; // Where on screen to look
  order: number; // Sequence within page tutorial
}

export const TUTORIAL_MECHANICS: Record<string, TutorialMechanic[]> = {
  dashboard: [
    {
      id: "dashboard-header",
      page: "dashboard",
      title: "Dashboard Overview",
      description: "Your central hub for tracking validation progress, ProofScore, and accessing key features.",
      selector: "[data-testid='dashboard-header']",
      location: "Top of page",
      order: 1,
    },
    {
      id: "proofscore-card",
      page: "dashboard",
      title: "ProofScore Display",
      description: "Your current validation score (0-100). This reflects your startup's investment readiness based on uploaded proof and completed experiments.",
      selector: "[data-testid='proofscore-display']",
      location: "Upper left section",
      order: 2,
    },
    {
      id: "proof-vault",
      page: "dashboard",
      title: "ProofVault Section",
      description: "Upload and organize validation documents. Each upload increases your VaultScore and strengthens your investor case.",
      selector: "[data-testid='proof-vault-section']",
      tips: "Upload diverse artifacts: testimonials, metrics, videos, financial models.",
      location: "Middle section",
      order: 3,
    },
    {
      id: "deal-room",
      page: "dashboard",
      title: "Deal Room Access",
      description: "Unlock investor matching and fundraising support with a ProofScore of 70+.",
      selector: "[data-testid='deal-room-section']",
      location: "Right section",
      order: 4,
    },
  ],
  "validation-map": [
    {
      id: "validation-intro",
      page: "validation-map",
      title: "Validation Map Introduction",
      description: "Your personalized experiment roadmap for validating key business assumptions.",
      selector: "[data-testid='validation-map-intro']",
      location: "Top of page",
      order: 1,
    },
    {
      id: "experiment-grid",
      page: "validation-map",
      title: "Experiment Grid",
      description: "AI-curated experiments across four validation spheres: Desirability, Feasibility, Viability, and Scaling.",
      selector: "[data-testid='validation-map-grid']",
      tips: "Click any experiment to view details, edit hypothesis, or mark complete.",
      location: "Main content area",
      order: 2,
    },
    {
      id: "experiment-filters",
      page: "validation-map",
      title: "Filter & Search",
      description: "Filter experiments by status or sphere, or search by keyword.",
      selector: "[data-testid='experiment-filters']",
      location: "Above experiment grid",
      order: 3,
    },
  ],
};

// Helper function to get journey step by ID
export function getJourneyStepById(id: number): JourneyStep | undefined {
  return COACH_JOURNEY_STEPS.find(step => step.id === id);
}

// Helper function to get next uncompleted step
export function getNextStep(completedSteps: number[]): JourneyStep | undefined {
  return COACH_JOURNEY_STEPS.find(step => !completedSteps.includes(step.id));
}

// Helper function to get tutorials for a specific page
export function getTutorialsForPage(page: string): TutorialMechanic[] {
  return TUTORIAL_MECHANICS[page] || [];
}
