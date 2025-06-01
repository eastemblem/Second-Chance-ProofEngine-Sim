import { z } from "zod";

export const founderSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  startupName: z.string().min(1, "Startup name is required"),
  stage: z.enum(["idea", "mvp", "traction", "growth"]),
  acceleratorApplications: z.number().min(0).default(0),
  pitchDeck: z.string().optional(),
  dataRoom: z.string().optional(),
});

export type FounderData = z.infer<typeof founderSchema>;

export interface ProofScore {
  total: number;
  dimensions: {
    desirability: number;
    feasibility: number;
    viability: number;
    traction: number;
    readiness: number;
  };
  prooTags: {
    unlocked: number;
    total: number;
    tags: string[];
  };
  insights: {
    strengths: string[];
    improvements: string[];
    recommendations: string[];
  };
}

export interface SimulationState {
  currentPage: number;
  founderData: Partial<FounderData>;
  proofScore: ProofScore | null;
  analysisProgress: number;
  isAnalyzing: boolean;
}
