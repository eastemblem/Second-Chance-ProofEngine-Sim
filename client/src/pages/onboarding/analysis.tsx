import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Trophy,
  Users,
  Calendar,
  TrendingUp,
  Shield,
  Briefcase,
  DollarSign,
  Folder,
  FileText,
  CheckCircle,
  Star,
  Target,
  Lightbulb,
  BarChart3,
  ThumbsUp,
  AlertTriangle,
  Download,
  HelpCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import ProgressBar from "@/components/progress-bar";
import { useToast } from "@/hooks/use-toast";
import { ProofScoreResult } from "@shared/schema";
import { Leaderboard } from "@/components/leaderboard";
import { CertificateDownload } from "@/components/certificate-download";
import { ReportDownload } from "@/components/report-download";


// Import score badges
import Badge01 from "../../assets/badges/score/Badge_01.svg";
import Badge02 from "../../assets/badges/score/Badge_02.svg";
import Badge03 from "../../assets/badges/score/Badge_03.svg";
import Badge04 from "../../assets/badges/score/Badge_04.svg";
import Badge05 from "../../assets/badges/score/Badge_05.svg";
import Badge06 from "../../assets/badges/score/Badge_06.svg";
import Badge07 from "../../assets/badges/score/Badge_07.svg";
import Badge08 from "../../assets/badges/score/Badge_08.svg";
import Badge09 from "../../assets/badges/score/Badge_09.svg";

// ProofTag interface for enhanced logic support
interface ProofTag {
  name: string;
  emoji: string;
  scoreThreshold?: number;
  category: string;
  customLogic?: (scoringResult: any, ventureData: any) => boolean;
  description?: string;
  requirements?: string[];
}

// Complete ProofTag system with all 21 tags
const ALL_PROOF_TAGS: ProofTag[] = [
  {
    name: "Problem Hunter",
    emoji: "🧠",
    scoreThreshold: 10,
    category: "desirability",
  },
  {
    name: "Target Locked",
    emoji: "🎯",
    scoreThreshold: 15,
    category: "desirability",
  },
  {
    name: "Signal Chaser",
    emoji: "🛁",
    scoreThreshold: 20,
    category: "desirability",
  },
  {
    name: "Prototype Pilot",
    emoji: "🛠",
    scoreThreshold: 25,
    category: "feasibility",
  },
  {
    name: "Solution Stamped",
    emoji: "✅",
    scoreThreshold: 30,
    category: "feasibility",
  },
  {
    name: "Builder's Blueprint",
    emoji: "🧱",
    scoreThreshold: 35,
    category: "feasibility",
  },
  {
    name: "Revenue Radar",
    emoji: "💰",
    scoreThreshold: 40,
    category: "viability",
  },
  {
    name: "Price Proven",
    emoji: "🧪",
    scoreThreshold: 45,
    category: "viability",
  },
  {
    name: "CAC Commander",
    emoji: "🎯",
    scoreThreshold: 50,
    category: "viability",
  },
  {
    name: "Traction Tracker",
    emoji: "📈",
    scoreThreshold: 55,
    category: "traction",
  },
  {
    name: "Channel Sniper",
    emoji: "🚀",
    scoreThreshold: 60,
    category: "traction",
  },
  {
    name: "Momentum Master",
    emoji: "⚡",
    scoreThreshold: 65,
    category: "traction",
  },
  {
    name: "Vault Ready",
    emoji: "📂",
    scoreThreshold: 70,
    category: "readiness",
  },
  {
    name: "Score Surged",
    emoji: "🔢",
    scoreThreshold: 75,
    category: "readiness",
  },
  {
    name: "Founder Fit Check",
    emoji: "🧠",
    scoreThreshold: 80,
    category: "readiness",
  },
  {
    name: "Metrics Ready",
    emoji: "📊",
    scoreThreshold: 82,
    category: "readiness",
  },
  {
    name: "Data Room Complete",
    emoji: "🗃️",
    scoreThreshold: 85,
    category: "desirability",
  },
  {
    name: "Vision Aligned",
    emoji: "🗺️",
    scoreThreshold: 87,
    category: "desirability",
  },
  {
    name: "Iteration Loop Active",
    emoji: "🔄",
    scoreThreshold: 90,
    category: "desirability",
  },
  {
    name: "Narrative Coherence",
    emoji: "🎤",
    scoreThreshold: 95,
    category: "desirability",
  },
  {
    name: "Moat Identified",
    emoji: "🔬",
    scoreThreshold: 98,
    category: "desirability",
  },
  
  // ============= EXAMPLES: CUSTOM LOGIC PROOF TAGS =============
  // These demonstrate how to add ProofTags with custom logic beyond simple score thresholds
  
  {
    name: "Team Powerhouse",
    emoji: "💪",
    category: "feasibility",
    description: "Strong founding team with complementary skills",
    requirements: ["High team score", "Multiple team members", "Diverse backgrounds"],
    customLogic: (scoringResult: any, ventureData: any) => {
      const teamScore = scoringResult?.output?.team?.score || scoringResult?.team?.score || 0;
      const teamMemberCount = ventureData?.teamMembers?.length || 0;
      
      // Unlock if team score > 15 AND has 2+ team members
      return teamScore > 15 && teamMemberCount >= 2;
    }
  },
  
  {
    name: "Revenue Rocket",
    emoji: "🚀",
    category: "traction", 
    description: "Strong revenue trajectory with multiple income streams",
    requirements: ["Revenue stage: Early Revenue or Scaling", "Business model score > 20"],
    customLogic: (scoringResult: any, ventureData: any) => {
      const businessModelScore = scoringResult?.output?.business_model?.score || 0;
      const revenueStage = ventureData?.venture?.revenueStage;
      
      // Unlock if business model score > 20 AND not pre-revenue
      return businessModelScore > 20 && !['None', 'Pre-Revenue'].includes(revenueStage);
    }
  },
  
  {
    name: "Market Mover",
    emoji: "📊",
    category: "viability",
    description: "Clear market opportunity with validated demand",
    requirements: ["Market opportunity score > 18", "Problem score > 12", "Has testimonials"],
    customLogic: (scoringResult: any, ventureData: any) => {
      const marketScore = scoringResult?.output?.market_opportunity?.score || 0;
      const problemScore = scoringResult?.output?.Problem?.score || 0;
      const hasTestimonials = ventureData?.venture?.hasTestimonials || false;
      
      // Unlock if market score > 18 AND problem score > 12 AND has testimonials
      return marketScore > 18 && problemScore > 12 && hasTestimonials;
    }
  },
  
  {
    name: "Social Proof Star",
    emoji: "⭐",
    category: "traction",
    description: "Strong online presence across multiple platforms",
    requirements: ["Has LinkedIn URL", "Has Twitter/Instagram", "Total score > 40"],
    customLogic: (scoringResult: any, ventureData: any) => {
      const totalScore = scoringResult?.output?.total_score || scoringResult?.total_score || 0;
      const venture = ventureData?.venture || {};
      const socialCount = [venture.linkedinUrl, venture.twitterUrl, venture.instagramUrl]
        .filter(url => url && url.trim()).length;
      
      // Unlock if total score > 40 AND has 2+ social media URLs
      return totalScore > 40 && socialCount >= 2;
    }
  },
  
  {
    name: "Tech Stack Master",
    emoji: "⚙️",
    category: "feasibility",
    description: "Technical founder with launched MVP",
    requirements: ["Founder is technical", "MVP status: Launched", "Product technology score > 15"],
    customLogic: (scoringResult: any, ventureData: any) => {
      const techScore = scoringResult?.output?.product_technology?.score || 0;
      const isTechnical = ventureData?.founder?.isTechnical || false;
      const mvpStatus = ventureData?.venture?.mvpStatus;
      
      // Unlock if founder is technical AND MVP is launched AND tech score > 15
      return isTechnical && mvpStatus === 'Launched' && techScore > 15;
    }
  },
];

// ProofTag icon mapping for backward compatibility
const PROOF_TAG_ICONS: Record<string, string> = ALL_PROOF_TAGS.reduce(
  (acc, tag) => {
    acc[tag.name] = tag.emoji;
    return acc;
  },
  {} as Record<string, string>,
);

// Function to get justification message for a ProofTag based on its category
const getProofTagJustification = (
  tagName: string,
  scoringResult: any,
): string => {
  // Find the ProofTag to get its category
  const proofTag = ALL_PROOF_TAGS.find((tag) => tag.name === tagName);
  if (!proofTag) return "No justification available for this ProofTag.";

  const category = proofTag.category;

  if (import.meta.env.MODE === 'development') {
    console.log("Getting justification for tag:", tagName, "category:", category);
  }

  // Get justification from API response - try both output and direct access
  const output = scoringResult?.output || scoringResult;

  // Direct API field mapping to try all possible fields
  const allApiFields = [
    "Problem",
    "solution",
    "market_opportunity",
    "product_technology",
    "team",
    "business_model",
    "traction_milestones",
    "competition",
    "go_to_market_strategy",
    "financials_projections_ask",
  ];

  // Map ProofTag categories to multiple possible API response fields
  const categoryToFieldsMap: Record<string, string[]> = {
    desirability: ["Problem", "market_opportunity"],
    feasibility: ["solution", "product_technology"],
    viability: ["business_model", "competition", "financials_projections_ask"],
    traction: ["traction_milestones", "go_to_market_strategy"],
    readiness: ["team"],
  };

  const fieldsToCheck = categoryToFieldsMap[category] || [];

  // Check each relevant field for this category
  for (const field of fieldsToCheck) {
    if (output[field]) {
      const categoryData = output[field];
      const justification =
        categoryData.justification || categoryData.recommendation;
      if (import.meta.env.MODE === 'development') {
        console.log(
          `Checking field ${field} for category ${category}:`,
          justification,
        );
      }
      if (justification && justification.length > 10) {
        if (import.meta.env.MODE === 'development') {
          console.log(
            `Found justification for ${tagName} in ${field}:`,
            justification,
          );
        }
        return justification;
      }
    }
  }

  // Try all API fields as fallback
  for (const field of allApiFields) {
    if (output[field]) {
      const categoryData = output[field];
      const justification =
        categoryData.justification || categoryData.recommendation;
      if (justification && justification.length > 10) {
        if (import.meta.env.MODE === 'development') {
          console.log(`Found justification in ${field}:`, justification);
        }
        return justification;
      }
    }
  }

  // Using fallback justification for category: ${category}

  // Final fallback with category description
  const categoryDescriptions: Record<string, string> = {
    desirability:
      "This ProofTag validates your startup's ability to solve real customer problems and create market demand.",
    feasibility:
      "This ProofTag confirms your technical capability to build and deliver your solution effectively.",
    viability:
      "This ProofTag demonstrates your ability to generate sustainable revenue and achieve profitability.",
    traction:
      "This ProofTag shows your success in acquiring customers and building measurable growth momentum.",
    readiness:
      "This ProofTag validates your preparedness to scale operations and attract investment.",
  };

  return (
    categoryDescriptions[category] ||
    `This ${category} ProofTag shows strong validation signals in your startup.`
  );
};

// Function to get icon for a ProofTag
const getProofTagIcon = (tagName: string): string => {
  try {
    if (!tagName || typeof tagName !== 'string') {
      return "✨";
    }

    // Try exact match first
    if (PROOF_TAG_ICONS && PROOF_TAG_ICONS[tagName]) {
      return PROOF_TAG_ICONS[tagName];
    }

    // Try partial matching for similar names
    const lowerTagName = tagName.toLowerCase();
    for (const [key, icon] of Object.entries(PROOF_TAG_ICONS || {})) {
      if (
        key.toLowerCase().includes(lowerTagName) ||
        lowerTagName.includes(key.toLowerCase())
      ) {
        return icon;
      }
    }

    // Default fallback
    return "✨";
  } catch (error) {
    if (import.meta.env.MODE === 'development') {
      console.error('Error in getProofTagIcon:', error);
    }
    return "✨";
  }
};

interface AnalysisProps {
  sessionId: string;
  sessionData: any;
  onNext?: () => void;
  onComplete: () => void;
}

interface FeedbackPageProps {
  onNext: () => void;
  proofScore: ProofScoreResult;
}

export default function Analysis({
  sessionId,
  sessionData,
  onNext,
  onComplete,
}: AnalysisProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [sessionFromAPI, setSessionFromAPI] = useState<any>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const { toast } = useToast();
  const celebrationTriggered = useRef(false);

  // Extract data from session with comprehensive checking
  if (import.meta.env.MODE === 'development') {
    console.log("Analysis component received sessionData:", sessionData);
    console.log("SessionData stepData:", sessionData?.stepData);
    console.log("Processing step data:", sessionData?.stepData?.processing);
  }

  let scoringResult =
    sessionData?.scoringResult ||
    sessionData?.stepData?.processing?.scoringResult ||
    sessionData?.stepData?.scoringResult ||
    sessionData?.processing?.scoringResult;

  if (import.meta.env.MODE === 'development') {
    console.log("Initial scoringResult found:", scoringResult);
  }

  const founderData = sessionData?.stepData?.founder;
  const ventureData =
    sessionData?.stepData?.venture?.venture || sessionData?.stepData?.venture;

  // Also check sessionFromAPI for venture name
  const apiVentureData =
    sessionFromAPI?.stepData?.venture?.venture ||
    sessionFromAPI?.stepData?.venture;

  const ventureName = ventureData?.name || apiVentureData?.name;

  // Extract report and certificate URLs from processing step data
  const reportUrl = sessionFromAPI?.stepData?.processing?.reportUrl || ventureData?.reportUrl;
  const certificateUrl = sessionFromAPI?.stepData?.processing?.certificateUrl || ventureData?.certificateUrl;

  if (import.meta.env.MODE === 'development') {
    console.log("Analysis component - scoringResult:", scoringResult);
    console.log(
      "Analysis component - sessionData keys:",
      Object.keys(sessionData || {}),
    );
  }

  // Try to fetch session data from API if not available
  useEffect(() => {
    if (!scoringResult && sessionId) {
      setIsLoading(true);
      const fetchSessionData = async () => {
        try {
          const response = await fetch(`/api/onboarding/session/${sessionId}`);
          if (response.ok) {
            const data = await response.json();
            if (import.meta.env.MODE === 'development') {
              console.log("Fetched session data from API:", data);
            }
            setSessionFromAPI(data?.data || data?.session || data);
          }
        } catch (error) {
          if (import.meta.env.MODE === 'development') {
            console.error("Failed to fetch session data:", error);
          }
        } finally {
          setIsLoading(false);
        }
      };

      fetchSessionData();
    }
  }, [sessionId, scoringResult]);

  // Celebration effect - moved to top level to maintain hook order
  useEffect(() => {
    // Only trigger celebration if we have valid scoring data
    const currentScoringResult =
      sessionFromAPI?.stepData?.processing?.scoringResult ||
      sessionFromAPI?.stepData?.scoringResult ||
      sessionFromAPI?.scoringResult ||
      scoringResult;

    // Check multiple possible score fields
    const totalScore =
      currentScoringResult?.total_score ||
      currentScoringResult?.output?.total_score ||
      currentScoringResult?.score;

    if (import.meta.env.MODE === 'development') {
      console.log("Celebration Debug:");
      console.log("- currentScoringResult:", currentScoringResult);
      console.log("- totalScore:", totalScore);
      console.log("- showCelebration:", showCelebration);
      console.log(
        "- celebrationTriggered.current:",
        celebrationTriggered.current,
      );
      console.log("- Score > 50?", totalScore > 50);
    }

    if (totalScore > 50 && !showCelebration && !celebrationTriggered.current) {
      if (import.meta.env.MODE === 'development') {
        console.log("🎉 TRIGGERING CELEBRATION ANIMATION!");
      }
      celebrationTriggered.current = true;

      const timer = setTimeout(() => {
        setShowCelebration(true);
        if (import.meta.env.MODE === 'development') {
          console.log("Celebration animation started!");
        }

        // Show toast notification
        toast({
          title: "🎉 Outstanding Score!",
          description: `Your startup achieved ${totalScore} points - excellent validation signals!`,
          duration: 5000,
        });

        // Auto-hide celebration after 3 seconds
        setTimeout(() => setShowCelebration(false), 3000);
      }, 1500); // Delay to let other animations settle

      return () => clearTimeout(timer);
    }
  }, [sessionFromAPI, scoringResult, showCelebration, toast]);

  // Use API data if available (prioritize fresh API data)
  if (sessionFromAPI) {
    const apiScoringResult =
      sessionFromAPI?.stepData?.processing?.scoringResult ||
      sessionFromAPI?.stepData?.scoringResult ||
      sessionFromAPI?.scoringResult;
    if (apiScoringResult) {
      if (import.meta.env.MODE === 'development') {
        console.log("Using scoring result from API:", apiScoringResult);
      }
      scoringResult = apiScoringResult;
    } else {
      if (import.meta.env.MODE === 'development') {
        console.log(
          "No scoring result in API data. SessionFromAPI stepData:",
          sessionFromAPI?.stepData,
        );
        console.log("Full sessionFromAPI:", sessionFromAPI);
      }
    }
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-6 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Loading Analysis...</h2>
          <p className="text-muted-foreground">
            Retrieving your scoring results...
          </p>
        </div>
      </div>
    );
  }

  // If still no scoring result, try to use sessionFromAPI data directly
  if (!scoringResult && sessionFromAPI?.stepData?.processing?.scoringResult) {
    scoringResult = sessionFromAPI.stepData.processing.scoringResult;
  }

  // Check if we have valid scoring data
  if (!scoringResult) {
    if (import.meta.env.MODE === 'development') {
      console.error("No scoring result found in sessionData:", sessionData);
      console.error("No scoring result found in sessionFromAPI:", sessionFromAPI);
    }
    return (
      <div className="min-h-screen bg-background p-6 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Analysis Not Available</h2>
          <p className="text-muted-foreground">
            Please complete the scoring process first.
          </p>
        </div>
      </div>
    );
  }

  // Use real scoring data only
  const analysisData = {
    total_score:
      scoringResult?.output?.total_score || scoringResult?.total_score || 0,
    categories: scoringResult?.output || {},
    overall_feedback: scoringResult?.output?.overall_feedback || [],
    proofTags: scoringResult?.output?.tags || scoringResult?.tags || [],
  };

  if (import.meta.env.MODE === 'development') {
    console.log("Analysis data for ProofTags:", analysisData);
  }

  // Extract ProofTags from API response or calculate from score
  function extractProofTags(scoringResult: any) {
    if (import.meta.env.MODE === 'development') {
      console.log("Extracting ProofTags from scoring result:", scoringResult);
    }

    const currentScore = analysisData?.total_score || 0;

    // Get tags directly from API response first
    const apiTags = scoringResult?.output?.tags || [];
    if (import.meta.env.MODE === 'development') {
      console.log("API provided tags:", apiTags);
    }

    // Use API tags if available, otherwise calculate based on score thresholds
    const unlockedTags: string[] =
      apiTags.length > 0
        ? apiTags
        : ALL_PROOF_TAGS.filter(
            (tag) => currentScore >= (tag.scoreThreshold || 0),
          ).map((tag) => tag.name);

    const lockedTags: {
      name: string;
      emoji: string;
      currentScore: number;
      neededScore: number;
      pointsNeeded: number;
    }[] = [];

    // Find which tags are NOT unlocked (these are locked)
    ALL_PROOF_TAGS.forEach((tag) => {
      // Check if tag is in the unlocked list (case-insensitive comparison)
      const isUnlocked = unlockedTags.some(
        (unlockedTag) =>
          unlockedTag.toLowerCase().trim() === tag.name.toLowerCase().trim(),
      );

      if (!isUnlocked) {
        lockedTags.push({
          name: tag.name,
          emoji: tag.emoji,
          currentScore: currentScore,
          neededScore: tag.scoreThreshold || 0,
          pointsNeeded: Math.max(0, (tag.scoreThreshold || 0) - currentScore),
        });
      }
    });

    if (import.meta.env.MODE === 'development') {
      console.log("Debug filtering - Unlocked tags:", unlockedTags);
      console.log("Debug filtering - Locked tags:", lockedTags.map(t => t.name));

      console.log(
        "ProofTags extracted - Unlocked:",
        unlockedTags.length,
        "Locked:",
        lockedTags.length,
      );
    }

    return {
      unlocked: unlockedTags.length,
      total: ALL_PROOF_TAGS.length,
      unlockedTags,
      lockedTags,
    };
  }

  // Extract ProofTags data with error handling
  const extractedProofTags = (() => {
    try {
      const result = extractProofTags(scoringResult);
      if (!result || result.total <= 0) {
        return {
          unlocked: 0,
          total: ALL_PROOF_TAGS.length || 1,
          unlockedTags: [],
          lockedTags: ALL_PROOF_TAGS.map(tag => ({
            name: tag.name,
            emoji: tag.emoji,
            currentScore: 0,
            neededScore: tag.scoreThreshold,
            pointsNeeded: tag.scoreThreshold
          }))
        };
      }
      return result;
    } catch (error) {
      if (import.meta.env.MODE === 'development') {
        console.error('Error extracting ProofTags:', error);
      }
      return {
        unlocked: 0,
        total: ALL_PROOF_TAGS.length || 1,
        unlockedTags: [],
        lockedTags: ALL_PROOF_TAGS.map(tag => ({
          name: tag.name,
          emoji: tag.emoji,
          currentScore: 0,
          neededScore: tag.scoreThreshold,
          pointsNeeded: tag.scoreThreshold
        }))
      };
    }
  })();

  const dimensionColors = {
    desirability: "bg-green-500",
    feasibility: "bg-blue-500",
    viability: "bg-orange-500",
    traction: "bg-yellow-500",
    readiness: "bg-red-500",
  };

  const dimensionLabels = {
    desirability: "🟩 Desirability",
    feasibility: "🟦 Feasibility",
    viability: "🟧 Viability",
    traction: "🟨 Traction",
    readiness: "🟥 Readiness",
  };

  if (import.meta.env.MODE === 'development') {
    console.log("Extracted ProofTags result:", extractedProofTags);
  }

  // Score badge mapping function - matches certificate service logic
  function getScoreBadge(score: number): string | null {
    const badges = {
      1: Badge01,
      2: Badge02,
      3: Badge03,
      4: Badge04,
      5: Badge05,
      6: Badge06,
      7: Badge07,
      8: Badge08,
      9: Badge09,
    };

    // Match certificate service logic exactly
    let badgeNumber: number;
    if (score >= 90) badgeNumber = 9;
    else if (score >= 80) badgeNumber = 8;
    else if (score >= 70) badgeNumber = 7;
    else if (score >= 60) badgeNumber = 6;
    else if (score >= 50) badgeNumber = 5;
    else if (score >= 40) badgeNumber = 4;
    else if (score >= 30) badgeNumber = 3;
    else if (score >= 20) badgeNumber = 2;
    else badgeNumber = 1;

    return badges[badgeNumber as keyof typeof badges] || null;
  }

  // Get badge for current score
  const scoreBadge = getScoreBadge(analysisData.total_score);
  // Calculate badge number using same logic as certificate service
  const getBadgeNumber = (score: number): number => {
    if (score >= 90) return 9;
    else if (score >= 80) return 8;
    else if (score >= 70) return 7;
    else if (score >= 60) return 6;
    else if (score >= 50) return 5;
    else if (score >= 40) return 4;
    else if (score >= 30) return 3;
    else if (score >= 20) return 2;
    else return 1;
  };
  
  const badgeNumber = getBadgeNumber(analysisData.total_score);

  if (import.meta.env.MODE === 'development') {
    console.log("Score Badge Debug:", {
      totalScore: analysisData.total_score,
      badgeNumber,
      scoreBadge: scoreBadge ? "Found" : "Not found",
    });

    console.log("ProofTag Debug - Categories from API:", analysisData.categories);
    console.log("ProofTag Debug - Extracted tags:", extractedProofTags);
    console.log("ProofTag Debug - All category scores:", {
    Problem: analysisData.categories.Problem?.score,
    solution: analysisData.categories.solution?.score,
    market_opportunity: analysisData.categories.market_opportunity?.score,
    product_technology: analysisData.categories.product_technology?.score,
    team: analysisData.categories.team?.score,
    business_model: analysisData.categories.business_model?.score,
    traction_milestones: analysisData.categories.traction_milestones?.score,
    competition: analysisData.categories.competition?.score,
    go_to_market_strategy: analysisData.categories.go_to_market_strategy?.score,
      financials_projections_ask:
        analysisData.categories.financials_projections_ask?.score,
    });
  }

  // Map to ProofScore format for consistency with feedback.tsx
  const proofScore: ProofScoreResult = {
    total: analysisData.total_score,
    dimensions: {
      desirability:
        analysisData.categories.Problem?.score ||
        analysisData.categories.desirability?.score ||
        0,
      feasibility:
        analysisData.categories.product_technology?.score ||
        analysisData.categories.feasibility?.score ||
        0,
      viability:
        analysisData.categories.business_model?.score ||
        analysisData.categories.viability?.score ||
        0,
      traction:
        analysisData.categories.traction_milestones?.score ||
        analysisData.categories.traction?.score ||
        0,
      readiness:
        analysisData.categories.financials_projections_ask?.score ||
        analysisData.categories.readiness?.score ||
        0,
    },
    prooTags: {
      unlocked: extractedProofTags.unlocked,
      total: extractedProofTags.total,
      tags: extractedProofTags.unlockedTags,
    },
    insights: {
      strengths:
        scoringResult?.output?.key_insights?.filter(
          (insight: any) => insight.title === "Strong Foundation",
        ) ||
        scoringResult?.key_insights?.filter(
          (insight: any) => insight.title === "Strong Foundation",
        ) ||
        [],
      improvements:
        scoringResult?.output?.key_insights?.filter(
          (insight: any) => insight.title === "Needs Attention",
        ) ||
        scoringResult?.key_insights?.filter(
          (insight: any) => insight.title === "Needs Attention",
        ) ||
        [],
      recommendations:
        scoringResult?.output?.key_insights?.filter(
          (insight: any) => insight.title === "Next Steps",
        ) ||
        scoringResult?.key_insights?.filter(
          (insight: any) => insight.title === "Next Steps",
        ) ||
        [],
    },
  };

  return (
    <TooltipProvider>
      <div className="min-h-screen py-12 relative">
        {/* Enhanced Celebration Animation */}
        {showCelebration && (
          <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
            {/* Sparkle Stars */}
            {Array.from({ length: 30 }).map((_, i) => (
              <motion.div
                key={`star-${i}`}
                className="absolute text-2xl"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                }}
                initial={{ scale: 0, opacity: 0 }}
                animate={{
                  scale: [0, 1.5, 0],
                  opacity: [0, 1, 0],
                  rotate: [0, 180, 360],
                }}
                transition={{
                  duration: 1.5 + Math.random(),
                  delay: Math.random() * 2,
                  ease: "easeInOut",
                }}
              >
                ✨
              </motion.div>
            ))}

            {/* Floating Emojis */}
            {Array.from({ length: 15 }).map((_, i) => {
              const emojis = ["🎉", "🚀", "🏆", "⭐", "💎", "🎯", "🔥"];
              const emoji = emojis[i % emojis.length];
              return (
                <motion.div
                  key={`emoji-${i}`}
                  className="absolute text-3xl"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: "100%",
                  }}
                  animate={{
                    y: [0, -window.innerHeight - 100],
                    x: [0, (Math.random() - 0.5) * 300],
                    rotate: [0, Math.random() * 720 - 360],
                    scale: [1, 1.2, 0.8, 1],
                  }}
                  transition={{
                    duration: 3 + Math.random() * 2,
                    delay: Math.random() * 1,
                    ease: "easeOut",
                  }}
                >
                  {emoji}
                </motion.div>
              );
            })}

            {/* Gradient Confetti */}
            {Array.from({ length: 40 }).map((_, i) => {
              const shapes = ["circle", "square", "triangle"];
              const shape = shapes[i % shapes.length];
              const colors = [
                "linear-gradient(45deg, #8B5CF6, #EC4899)",
                "linear-gradient(45deg, #F59E0B, #EF4444)",
                "linear-gradient(45deg, #10B981, #3B82F6)",
                "linear-gradient(45deg, #F97316, #84CC16)",
              ];

              return (
                <motion.div
                  key={`confetti-${i}`}
                  className={`absolute ${shape === "circle" ? "rounded-full" : shape === "square" ? "rounded-sm" : ""}`}
                  style={{
                    width: shape === "triangle" ? "0" : "6px",
                    height: shape === "triangle" ? "0" : "6px",
                    background:
                      shape === "triangle"
                        ? "transparent"
                        : colors[i % colors.length],
                    borderLeft:
                      shape === "triangle" ? "3px solid transparent" : "none",
                    borderRight:
                      shape === "triangle" ? "3px solid transparent" : "none",
                    borderBottom:
                      shape === "triangle"
                        ? `6px solid ${["#8B5CF6", "#F59E0B", "#EC4899", "#10B981"][i % 4]}`
                        : "none",
                    left: `${Math.random() * 100}%`,
                    top: "-10px",
                    boxShadow: "0 0 10px rgba(139, 92, 246, 0.3)",
                  }}
                  animate={{
                    y: [0, window.innerHeight + 100],
                    x: [0, (Math.random() - 0.5) * 400],
                    rotate: [0, Math.random() * 1080],
                    scale: [1, 0.8, 1.1, 0],
                    opacity: [1, 0.8, 0.6, 0],
                  }}
                  transition={{
                    duration: 2.5 + Math.random() * 1.5,
                    delay: Math.random() * 0.8,
                    ease: "easeOut",
                  }}
                />
              );
            })}

            {/* Pulsing Rings */}
            {Array.from({ length: 8 }).map((_, i) => (
              <motion.div
                key={`ring-${i}`}
                className="absolute border-2 border-primary/30 rounded-full"
                style={{
                  left: "50%",
                  top: "50%",
                  width: "20px",
                  height: "20px",
                  marginLeft: "-10px",
                  marginTop: "-10px",
                }}
                animate={{
                  scale: [0, 8],
                  opacity: [0.8, 0],
                  borderWidth: [2, 0],
                }}
                transition={{
                  duration: 2,
                  delay: i * 0.2,
                  ease: "easeOut",
                }}
              />
            ))}
          </div>
        )}

        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* Score Header */}
            {/* <Card className="p-8 border-border mb-8 text-center"> */}
            <div className="p-3 sm:p-4 border-border mb-3 sm:mb-4 text-center">
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
              >
                <div className="flex items-center justify-center gap-3 mb-4">
                  <motion.span
                    animate={{
                      rotate: [0, 10, -10, 0],
                      scale: [1, 1.1, 1],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      repeatDelay: 3,
                    }}
                    className="text-3xl"
                  >
                    🎯
                  </motion.span>
                  <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-primary to-primary-gold bg-clip-text text-transparent">
                    Congratulations Venture!
                  </h2>
                  <motion.span
                    animate={{
                      rotate: [0, -10, 10, 0],
                      scale: [1, 1.1, 1],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      repeatDelay: 3,
                      delay: 0.5,
                    }}
                    className="text-3xl"
                  >
                    🚀
                  </motion.span>
                </div>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.8 }}
                  className="text-center"
                >
                  <span className="text-lg text-muted-foreground">
                    You are{" "}
                  </span>
                  <span className="text-xl font-bold bg-gradient-to-r from-primary to-primary-gold bg-clip-text text-transparent">
                    {(() => {
                      if (proofScore.total > 90) return "Leader in Validation";
                      if (proofScore.total >= 80) return "Investor Match Ready";
                      return "ProofScaler Candidate";
                    })()}
                  </span>
                </motion.div>
              </motion.div>

              {/* Badge and Score Side by Side */}
              <div className="flex items-center justify-center gap-6 sm:gap-12 my-8 sm:my-12 mx-4 sm:mx-8">
                {/* Score Badge on Left */}
                {scoreBadge && (
                  <motion.div
                    className="flex justify-center mr-4"
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.6, delay: 0.1 }}
                  >
                    <div className="relative">
                      <img
                        src={scoreBadge}
                        alt={`Score Badge ${badgeNumber}`}
                        className="w-28 h-28 drop-shadow-lg"
                      />
                      <motion.div
                        className="absolute inset-0 rounded-full bg-primary/10"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1.1 }}
                        transition={{
                          duration: 1.5,
                          repeat: Infinity,
                          repeatType: "reverse",
                          delay: 0.5,
                        }}
                      />
                    </div>
                  </motion.div>
                )}

                {/* Score Display on Right */}
                <div className="text-center ml-2 sm:ml-4">
                  <motion.div
                    className="text-3xl sm:text-4xl font-black gradient-text mb-1 sm:mb-2"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                  >
                    {proofScore.total}
                  </motion.div>
                  <p className="text-sm sm:text-lg text-muted-foreground">out of 100</p>
                </div>
              </div>

              {/* ProofTags Achievement Section - Full width, no box */}
              <div className="mb-3 sm:mb-4">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="text-center mb-3 sm:mb-4"
                >
                  <h3 className="text-xl sm:text-2xl font-bold mb-2 sm:mb-3 gradient-text">
                    🏆 ProofTag Validation Progress
                  </h3>

                  {/* Milestones Text - Center Aligned */}
                  <div className="text-center mb-4">
                    <p className="text-sm sm:text-lg text-muted-foreground mb-2">
                      {extractedProofTags.unlocked} of{" "}
                      {extractedProofTags.total} validation milestones
                      unlocked
                    </p>
                    <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 bg-primary/10 rounded-full border border-primary/20">
                      <Target className="w-4 h-4 text-primary" />
                      <span className="text-sm font-semibold text-primary">
                        {extractedProofTags.unlocked}/
                        {extractedProofTags.total} Tags Unlocked
                      </span>
                      {extractedProofTags.unlocked <
                        extractedProofTags.total && (
                        <span className="text-sm text-muted-foreground">
                          -{" "}
                          {extractedProofTags.total -
                            extractedProofTags.unlocked}{" "}
                          to go
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Progress Bar - Center Aligned */}
                  <div className="flex justify-center mb-4">
                    <div className="flex-shrink-0">
                      <div className="relative w-20 h-20 sm:w-24 sm:h-24">
                        <svg
                          className="w-20 h-20 sm:w-24 sm:h-24 transform -rotate-90"
                          viewBox="0 0 100 100"
                        >
                          {/* Background circle */}
                          <circle
                            cx="50"
                            cy="50"
                            r="40"
                            stroke="currentColor"
                            strokeWidth="8"
                            fill="none"
                            className="text-border"
                          />
                          {/* Progress circle */}
                          <motion.circle
                            cx="50"
                            cy="50"
                            r="40"
                            stroke="url(#progressGradient)"
                            strokeWidth="8"
                            fill="none"
                            strokeLinecap="round"
                            strokeDasharray={`${2 * Math.PI * 40}`}
                            initial={{ strokeDashoffset: 2 * Math.PI * 40 }}
                            animate={{
                              strokeDashoffset:
                                2 *
                                Math.PI *
                                40 *
                                (1 -
                                  (extractedProofTags.total > 0 ? 
                                    extractedProofTags.unlocked / extractedProofTags.total 
                                    : 0)),
                            }}
                            transition={{ duration: 1.5, delay: 0.5 }}
                          />
                          <defs>
                            <linearGradient
                              id="progressGradient"
                              x1="0%"
                              y1="0%"
                              x2="100%"
                              y2="100%"
                            >
                              <stop
                                offset="0%"
                                stopColor="hsl(var(--primary))"
                              />
                              <stop
                                offset="100%"
                                stopColor="hsl(var(--primary-gold))"
                              />
                            </linearGradient>
                          </defs>
                        </svg>

                        {/* Percentage in center */}
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-lg font-bold text-primary">
                            {Math.round(
                              extractedProofTags.total > 0 ? 
                                (extractedProofTags.unlocked / extractedProofTags.total) * 100 
                                : 0,
                            )}
                            %
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* ProofTags Grid - Mobile optimized for readability */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-4 2xl:grid-cols-5 gap-2 sm:gap-3">
                  {/* Unlocked Tags */}
                  {(extractedProofTags.unlockedTags || []).map((tag, index) => (
                    <motion.div
                      key={`unlocked-${index}`}
                      initial={{ opacity: 0, scale: 0.8, y: 20 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      transition={{
                        delay: 0.6 + index * 0.1,
                        type: "spring",
                        stiffness: 200,
                        damping: 20,
                      }}
                      className="group"
                    >
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="relative bg-card border border-primary/20 rounded-lg p-2 sm:p-3 hover:border-primary/40 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10 cursor-pointer min-h-[90px] sm:min-h-[100px]">
                            {/* Achievement glow effect */}
                            <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-primary-gold/5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                            {/* Achievement icon */}
                            <div className="relative flex items-center justify-center mb-1 sm:mb-2">
                              <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-r from-primary to-primary-gold rounded-full flex items-center justify-center">
                                <motion.div
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  transition={{
                                    delay: 0.8 + index * 0.1,
                                    duration: 0.6,
                                  }}
                                  className="text-sm sm:text-lg"
                                >
                                  {getProofTagIcon(tag)}
                                </motion.div>
                              </div>
                              {/* Sparkle effect */}
                              <motion.div
                                className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-primary-gold rounded-full"
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ delay: 1 + index * 0.1 }}
                              />
                            </div>

                            {/* Tag text */}
                            <p className="relative text-center text-xs sm:text-sm font-medium text-foreground leading-tight px-1">
                              {tag}
                            </p>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-sm p-3">
                          <p className="text-sm">
                            {getProofTagJustification(tag, scoringResult)}
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </motion.div>
                  ))}

                  {/* Locked Tags */}
                  {(extractedProofTags.lockedTags || []).map((lockedTag, index) => (
                    <motion.div
                      key={`locked-${index}`}
                      initial={{ opacity: 0, scale: 0.8, y: 20 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      transition={{
                        delay:
                          0.6 +
                          (extractedProofTags.unlockedTags.length + index) *
                            0.1,
                        type: "spring",
                        stiffness: 200,
                        damping: 20,
                      }}
                      className="group"
                    >
                      <div className="relative bg-background border border-primary/10 rounded-lg p-2 sm:p-3 hover:border-primary/20 transition-all duration-300 opacity-60 min-h-[90px] sm:min-h-[100px]">
                        {/* Locked overlay with theme colors */}
                        <div className="absolute inset-0 bg-background/80 rounded-lg" />

                        {/* Achievement icon */}
                        <div className="relative flex items-center justify-center mb-1 sm:mb-2">
                          <div className="w-7 h-7 sm:w-8 sm:h-8 bg-muted/50 rounded-full flex items-center justify-center">
                            <div className="text-sm sm:text-lg opacity-40">
                              {lockedTag.emoji}
                            </div>
                          </div>
                        </div>

                        {/* Tag text with theme colors */}
                        <p className="relative text-center text-xs sm:text-sm font-medium text-foreground/60 leading-tight mb-1 px-1">
                          {lockedTag.name}
                        </p>

                        {/* Score requirement */}
                        {/* <div className="relative text-center">
                        <p className="text-[10px] text-primary/60 font-medium">
                          {lockedTag.pointsNeeded > 0 ? `+${lockedTag.pointsNeeded}` : `${lockedTag.neededScore}`}
                        </p>
                      </div> */}
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Unlock Requirements Section - Hidden per user request */}
                {/* {extractedProofTags.lockedTags.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.2 }}
                  className="mt-8 p-4 bg-primary/5 rounded-lg border border-primary/10"
                >
                  <h4 className="text-sm font-semibold text-primary mb-3 flex items-center gap-2">
                    <Target className="w-4 h-4 text-primary" />
                    Unlock Requirements
                  </h4>
                  <div className="space-y-2">
                    {extractedProofTags.lockedTags
                      .slice(0, 3)
                      .map((lockedTag, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between text-xs"
                        >
                          <span className="text-foreground/70">
                            {lockedTag.name}
                          </span>
                          <span className="text-primary/80">
                            {lockedTag.pointsNeeded > 0
                              ? `+${lockedTag.pointsNeeded}`
                              : `${lockedTag.neededScore}`}
                          </span>
                        </div>
                      ))}
                    {extractedProofTags.lockedTags.length > 3 && (
                      <p className="text-xs text-foreground/60 text-center pt-2">
                        +{extractedProofTags.lockedTags.length - 3} more tags to
                        unlock
                      </p>
                    )}
                  </div>
                </motion.div>
              )} */}
              </div>
              {/* </Card> */}
            </div>

            {/* Mobile-First Layout: Stack all content vertically, side-by-side on larger screens */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 lg:gap-8 mt-6 lg:mt-8 mb-6 lg:mb-8">
              {/* Left Column: Stacked Validation Dimensions and Key Insights */}
              <div className="space-y-6">
                {/* Validation Dimensions */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.8, duration: 0.6 }}
                  className="space-y-3"
                >
                  <h3 className="text-lg font-semibold mb-4 bg-gradient-to-r from-violet-400 to-amber-400 bg-clip-text text-transparent flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-gradient-to-r from-violet-500 to-amber-500 shadow-lg">
                      <BarChart3 className="w-4 h-4 text-white" />
                    </div>
                    Validation Dimensions
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Your venture's performance across the five critical validation areas
                    <span className="block text-xs mt-1 opacity-75">
                      Each dimension is scored against industry benchmarks and investor criteria
                    </span>
                  </p>
                  <div className="space-y-3">
                    {Object.entries(proofScore.dimensions).map(
                      ([dimension, score]) => {
                        const maxScores = {
                          desirability: 20,
                          feasibility: 15,
                          viability: 15,
                          traction: 40,
                          readiness: 10,
                        };
                        const maxScore =
                          maxScores[dimension as keyof typeof maxScores];
                        const percentage = (score / maxScore) * 100;

                        return (
                          <div
                            key={dimension}
                            className="bg-gradient-to-r from-violet-950/30 to-amber-950/10 rounded-lg p-3 border border-violet-500/30 shadow-md backdrop-blur-sm"
                          >
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-sm font-semibold text-violet-200">
                                {
                                  dimensionLabels[
                                    dimension as keyof typeof dimensionLabels
                                  ]
                                }
                              </span>
                              <span className="text-sm font-bold bg-gradient-to-r from-violet-300 to-amber-300 bg-clip-text text-transparent">
                                {score}/{maxScore}
                              </span>
                            </div>
                            <div className="w-full bg-violet-950/40 rounded-full h-3 shadow-inner border border-violet-800/50">
                              <motion.div
                                className={`h-3 rounded-full ${dimensionColors[dimension as keyof typeof dimensionColors]} shadow-lg ring-1 ring-white/20`}
                                initial={{ width: 0 }}
                                animate={{ width: `${percentage}%` }}
                                transition={{
                                  duration: 1.2,
                                  delay:
                                    1.0 +
                                    Object.keys(proofScore.dimensions).indexOf(
                                      dimension,
                                    ) *
                                      0.1,
                                }}
                              />
                            </div>
                          </div>
                        );
                      },
                    )}
                  </div>
                </motion.div>

                {/* Key Insights */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 1.2, duration: 0.6 }}
                  className="space-y-3"
                >
                  <h3 className="text-lg font-semibold mb-4 bg-gradient-to-r from-violet-400 to-amber-400 bg-clip-text text-transparent flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-gradient-to-r from-violet-500 to-amber-500 shadow-lg">
                      <Lightbulb className="w-4 h-4 text-white" />
                    </div>
                    Key Insights
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    AI-powered analysis of your venture's strengths and improvement opportunities
                    <span className="block text-xs mt-1 opacity-75">
                      Personalized recommendations based on your pitch deck and venture data
                    </span>
                  </p>
                  <div className="space-y-3">
                    {proofScore.insights.strengths
                      .slice(0, 2)
                      .map((strength: any, index: number) => (
                        <motion.div
                          key={index}
                          className="flex items-start space-x-3 bg-gradient-to-r from-green-950/40 to-emerald-950/20 rounded-lg p-3 border border-green-500/30 shadow-md backdrop-blur-sm"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 1.4 + index * 0.1 }}
                        >
                          <ThumbsUp className="text-green-400 mt-1 w-4 h-4 flex-shrink-0" />
                          <div>
                            <h4 className="font-semibold text-green-300 text-base mb-1">
                              {strength.title || "Strong Foundation"}
                            </h4>
                            <p className="text-xs text-green-100/80 leading-relaxed">
                              {strength.description || strength}
                            </p>
                          </div>
                        </motion.div>
                      ))}
                    {proofScore.insights.improvements
                      .slice(0, 2)
                      .map((improvement: any, index: number) => (
                        <motion.div
                          key={index}
                          className="flex items-start space-x-3 bg-gradient-to-r from-yellow-950/40 to-orange-950/20 rounded-lg p-3 border border-yellow-500/30 shadow-md backdrop-blur-sm"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 1.6 + index * 0.1 }}
                        >
                          <AlertTriangle className="text-yellow-400 mt-1 w-4 h-4 flex-shrink-0" />
                          <div>
                            <h4 className="font-semibold text-yellow-300 text-base mb-1">
                              {improvement.title || "Needs Attention"}
                            </h4>
                            <p className="text-xs text-yellow-100/80 leading-relaxed">
                              {improvement.description || improvement}
                            </p>
                          </div>
                        </motion.div>
                      ))}
                    {proofScore.insights.recommendations
                      .slice(0, 1)
                      .map((recommendation: any, index: number) => (
                        <motion.div
                          key={index}
                          className="flex items-start space-x-3 bg-gradient-to-r from-violet-950/40 to-purple-950/20 rounded-lg p-3 border border-violet-500/30 shadow-md backdrop-blur-sm"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 1.8 + index * 0.1 }}
                        >
                          <TrendingUp className="text-violet-400 mt-1 w-4 h-4 flex-shrink-0" />
                          <div>
                            <h4 className="font-semibold text-violet-300 text-base mb-1">
                              {recommendation.title || "Next Steps"}
                            </h4>
                            <p className="text-xs text-violet-100/80 leading-relaxed">
                              {recommendation.description || recommendation}
                            </p>
                          </div>
                        </motion.div>
                      ))}
                  </div>
                </motion.div>
              </div>

              {/* Right Column: Leaderboard */}
              <div className="lg:sticky lg:top-8 lg:self-start">
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 1.0, duration: 0.6 }}
                >
                  <Leaderboard currentVentureName={ventureName} />
                </motion.div>
              </div>
            </div>

            {/* Generated Report */}
            {(ventureData?.ventureId || sessionId) && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.8, duration: 0.6 }}
                className="mb-8"
              >
                <ReportDownload 
                  ventureId={ventureData?.ventureId}
                  sessionId={sessionId}
                  existingReportUrl={reportUrl}
                />
              </motion.div>
            )}

            {/* Certificate Download */}
            {(ventureData?.ventureId || sessionId) && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 2.0, duration: 0.6 }}
                className="mb-8"
              >
                <CertificateDownload
                  ventureId={ventureData?.ventureId}
                  sessionId={sessionId}
                  ventureName={ventureName || ventureData?.name || "Your Venture"}
                  existingCertificateUrl={certificateUrl}
                />
              </motion.div>
            )}

            {/* Next Steps Button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 2.2, duration: 0.6 }}
              className="text-center mb-8"
            >
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-white mb-3">
                  Ready for Your Next Steps?
                </h3>
                <p className="text-purple-200 mb-6 max-w-2xl mx-auto">
                  {analysisData.total_score < 70 
                    ? "Strengthen your venture fundamentals with our ProofScaling course and boost your score by 15-25 points."
                    : "Unlock advanced tools and investor-ready materials to accelerate your path to investment."
                  }
                </p>
                <Button
                  onClick={() => {
                    if (onNext) {
                      onNext();
                    }
                  }}
                  className="gradient-button px-6 sm:px-8 py-4 sm:py-6 text-base sm:text-lg w-full sm:w-auto min-h-[48px] mb-4"
                  size="lg"
                >
                  Continue to Next Steps
                  <ArrowRight className="ml-2 w-4 h-4 sm:w-5 sm:h-5" />
                </Button>

              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </TooltipProvider>
  );
}
