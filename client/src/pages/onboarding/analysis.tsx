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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";

import ProgressBar from "@/components/progress-bar";
import { useToast } from "@/hooks/use-toast";
import { ProofScoreResult } from "@shared/schema";

// Import score badges
import Badge01 from "../../assets/badges/score/Badge_01.svg";
import Badge02 from "../../assets/badges/score/Badge_02.svg";
import Badge03 from "../../assets/badges/score/Badge_03.svg";
import Badge04 from "../../assets/badges/score/Badge_04.svg";
import Badge05 from "../../assets/badges/score/Badge_05.svg";
import Badge06 from "../../assets/badges/score/Badge_06.svg";
import Badge07 from "../../assets/badges/score/Badge_07.svg";
import Badge09 from "../../assets/badges/score/Badge_09.svg";

// Complete ProofTag system with all 21 tags
const ALL_PROOF_TAGS = [
  { name: "Problem Hunter", emoji: "🧠", scoreThreshold: 10 },
  { name: "Target Locked", emoji: "🎯", scoreThreshold: 15 },
  { name: "Signal Chaser", emoji: "🛁", scoreThreshold: 20 },
  { name: "Prototype Pilot", emoji: "🛠", scoreThreshold: 25 },
  { name: "Solution Stamped", emoji: "✅", scoreThreshold: 30 },
  { name: "Builder's Blueprint", emoji: "🧱", scoreThreshold: 35 },
  { name: "Revenue Radar", emoji: "💰", scoreThreshold: 40 },
  { name: "Price Proven", emoji: "🧪", scoreThreshold: 45 },
  { name: "CAC Commander", emoji: "🎯", scoreThreshold: 50 },
  { name: "Traction Tracker", emoji: "📈", scoreThreshold: 55 },
  { name: "Channel Sniper", emoji: "🚀", scoreThreshold: 60 },
  { name: "Momentum Master", emoji: "⚡", scoreThreshold: 65 },
  { name: "Vault Ready", emoji: "📂", scoreThreshold: 70 },
  { name: "Score Surged", emoji: "🔢", scoreThreshold: 75 },
  { name: "Founder Fit Check", emoji: "🧠", scoreThreshold: 80 },
  { name: "Metrics Ready", emoji: "📊", scoreThreshold: 82 },
  { name: "Data Room Complete", emoji: "🗃️", scoreThreshold: 85 },
  { name: "Vision Aligned", emoji: "🗺️", scoreThreshold: 87 },
  { name: "Iteration Loop Active", emoji: "🔄", scoreThreshold: 90 },
  { name: "Narrative Coherence", emoji: "🎤", scoreThreshold: 95 },
  { name: "Moat Identified", emoji: "🔬", scoreThreshold: 98 }
];

// ProofTag icon mapping for backward compatibility
const PROOF_TAG_ICONS: Record<string, string> = ALL_PROOF_TAGS.reduce((acc, tag) => {
  acc[tag.name] = tag.emoji;
  return acc;
}, {} as Record<string, string>);

// Function to get icon for a ProofTag
const getProofTagIcon = (tagName: string): string => {
  // Try exact match first
  if (PROOF_TAG_ICONS[tagName]) {
    return PROOF_TAG_ICONS[tagName];
  }
  
  // Try partial matching for similar names
  const lowerTagName = tagName.toLowerCase();
  for (const [key, icon] of Object.entries(PROOF_TAG_ICONS)) {
    if (key.toLowerCase().includes(lowerTagName) || lowerTagName.includes(key.toLowerCase())) {
      return icon;
    }
  }
  
  // Default fallback
  return "✨";
};

interface AnalysisProps {
  sessionId: string;
  sessionData: any;
  onComplete: () => void;
}

interface FeedbackPageProps {
  onNext: () => void;
  proofScore: ProofScoreResult;
}

export default function Analysis({
  sessionId,
  sessionData,
  onComplete,
}: AnalysisProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [sessionFromAPI, setSessionFromAPI] = useState<any>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const { toast } = useToast();
  const celebrationTriggered = useRef(false);

  // Extract data from session with comprehensive checking
  console.log("Analysis component received sessionData:", sessionData);
  console.log("SessionData stepData:", sessionData?.stepData);
  console.log("Processing step data:", sessionData?.stepData?.processing);
  
  let scoringResult = sessionData?.scoringResult || 
                     sessionData?.stepData?.processing?.scoringResult || 
                     sessionData?.stepData?.scoringResult ||
                     sessionData?.processing?.scoringResult;
  
  console.log("Initial scoringResult found:", scoringResult);

  const founderData = sessionData?.stepData?.founder;
  const ventureData =
    sessionData?.stepData?.venture?.venture || sessionData?.stepData?.venture;

  console.log("Analysis component - scoringResult:", scoringResult);
  console.log(
    "Analysis component - sessionData keys:",
    Object.keys(sessionData || {}),
  );

  // Try to fetch session data from API if not available
  useEffect(() => {
    if (!scoringResult && sessionId) {
      setIsLoading(true);
      const fetchSessionData = async () => {
        try {
          const response = await fetch(`/api/onboarding/session/${sessionId}`);
          if (response.ok) {
            const data = await response.json();
            console.log("Fetched session data from API:", data);
            setSessionFromAPI(data?.data || data?.session || data);
          }
        } catch (error) {
          console.error("Failed to fetch session data:", error);
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
    const currentScoringResult = sessionFromAPI?.stepData?.processing?.scoringResult ||
                                sessionFromAPI?.stepData?.scoringResult ||
                                sessionFromAPI?.scoringResult ||
                                scoringResult;
    
    // Check multiple possible score fields
    const totalScore = currentScoringResult?.total_score || 
                      currentScoringResult?.output?.total_score || 
                      currentScoringResult?.score;
    

    
    if (totalScore > 70 && !showCelebration && !celebrationTriggered.current) {
      celebrationTriggered.current = true;
      
      const timer = setTimeout(() => {
        setShowCelebration(true);
        
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
  }, [sessionFromAPI, scoringResult, showCelebration]);

  // Use API data if available (prioritize fresh API data)
  if (sessionFromAPI) {
    const apiScoringResult = sessionFromAPI?.stepData?.processing?.scoringResult ||
                            sessionFromAPI?.stepData?.scoringResult ||
                            sessionFromAPI?.scoringResult;
    if (apiScoringResult) {
      console.log("Using scoring result from API:", apiScoringResult);
      scoringResult = apiScoringResult;
    } else {
      console.log("No scoring result in API data. SessionFromAPI stepData:", sessionFromAPI?.stepData);
      console.log("Full sessionFromAPI:", sessionFromAPI);
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
    console.error("No scoring result found in sessionData:", sessionData);
    console.error("No scoring result found in sessionFromAPI:", sessionFromAPI);
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

  console.log("Analysis data for ProofTags:", analysisData);

  // Extract ProofTags from API response or calculate from score
  function extractProofTags(scoringResult: any) {
    console.log("Extracting ProofTags from scoring result:", scoringResult);
    
    const currentScore = analysisData?.total_score || 0;
    
    // Get tags directly from API response first
    const apiTags = scoringResult?.output?.tags || [];
    console.log("API provided tags:", apiTags);
    
    // Use API tags if available, otherwise calculate based on score thresholds
    const unlockedTags: string[] = apiTags.length > 0 ? 
      apiTags : 
      ALL_PROOF_TAGS.filter(tag => currentScore >= tag.scoreThreshold).map(tag => tag.name);
    
    const lockedTags: {
      name: string;
      emoji: string;
      currentScore: number;
      neededScore: number;
      pointsNeeded: number;
    }[] = [];
    
    // Find which tags are NOT unlocked (these are locked)
    ALL_PROOF_TAGS.forEach(tag => {
      const isUnlocked = unlockedTags.includes(tag.name);
      
      if (!isUnlocked) {
        lockedTags.push({
          name: tag.name,
          emoji: tag.emoji,
          currentScore: currentScore,
          neededScore: tag.scoreThreshold,
          pointsNeeded: Math.max(0, tag.scoreThreshold - currentScore)
        });
      }
    });
    
    console.log("Current score:", currentScore);
    console.log("Final unlocked tags:", unlockedTags);
    console.log("Final locked tags with requirements:", lockedTags);
    
    return {
      unlocked: unlockedTags.length,
      total: ALL_PROOF_TAGS.length,
      unlockedTags,
      lockedTags
    };
  }

  // Extract ProofTags data
  const extractedProofTags = extractProofTags(scoringResult);

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

  console.log("Extracted ProofTags result:", extractedProofTags);

  // Score badge mapping function
  function getScoreBadge(score: number): string | null {
    const badges = {
      1: Badge01,
      2: Badge02,
      3: Badge03,
      4: Badge04,
      5: Badge05,
      6: Badge06,
      7: Badge07,
      8: Badge07, // Using Badge07 as fallback since Badge08 is missing
      9: Badge09,
    };

    if (score < 10) return null; // No badge for scores below 10
    if (score >= 91) return badges[9]; // Score 91-100 → Badge 9
    
    // Calculate badge number (10-90 maps to badges 1-8)
    const badgeNumber = Math.ceil((score - 10) / 10) + 1;
    const clampedBadgeNumber = Math.min(Math.max(badgeNumber, 1), 9);
    
    return badges[clampedBadgeNumber as keyof typeof badges] || null;
  }

  // Get badge for current score
  const scoreBadge = getScoreBadge(analysisData.total_score);
  const badgeNumber = analysisData.total_score >= 91 ? 9 : Math.ceil((analysisData.total_score - 10) / 10) + 1;
  
  console.log("Score Badge Debug:", {
    totalScore: analysisData.total_score,
    badgeNumber,
    scoreBadge: scoreBadge ? "Found" : "Not found"
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
    financials_projections_ask: analysisData.categories.financials_projections_ask?.score
  });

  // Map to ProofScore format for consistency with feedback.tsx
  const proofScore: ProofScoreResult = {
    total: analysisData.total_score,
    dimensions: {
      desirability: analysisData.categories.Problem?.score || analysisData.categories.desirability?.score || 0,
      feasibility: analysisData.categories.product_technology?.score || analysisData.categories.feasibility?.score || 0,
      viability: analysisData.categories.business_model?.score || analysisData.categories.viability?.score || 0,
      traction: analysisData.categories.traction_milestones?.score || analysisData.categories.traction?.score || 0,
      readiness: analysisData.categories.financials_projections_ask?.score || analysisData.categories.readiness?.score || 0,
    },
    prooTags: {
      unlocked: extractedProofTags.unlocked,
      total: extractedProofTags.total,
      tags: extractedProofTags.unlockedTags
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
    <div className="min-h-screen py-12 relative">
      {/* Celebration Animation */}
      {showCelebration && (
        <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
          {/* Confetti particles */}
          {Array.from({ length: 50 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 rounded-full"
              style={{
                background: i % 3 === 0 ? '#8B5CF6' : i % 3 === 1 ? '#F59E0B' : '#EC4899',
                left: `${Math.random() * 100}%`,
                top: '-10px',
              }}
              animate={{
                y: [0, typeof window !== 'undefined' ? window.innerHeight + 100 : 800],
                x: [0, (Math.random() - 0.5) * 200],
                rotate: [0, Math.random() * 360],
                opacity: [1, 0],
              }}
              transition={{
                duration: 2 + Math.random() * 2,
                delay: Math.random() * 0.5,
                ease: "easeOut",
              }}
            />
          ))}
          

        </div>
      )}



      <div className="max-w-4xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Score Header */}
          <Card className="p-8 border-border bg-card mb-8 text-center">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <div className="flex items-center justify-center gap-3 mb-4">
                <motion.span
                  animate={{ 
                    rotate: [0, 10, -10, 0],
                    scale: [1, 1.1, 1]
                  }}
                  transition={{ 
                    duration: 2,
                    repeat: Infinity,
                    repeatDelay: 3
                  }}
                  className="text-3xl"
                >
                  🎯
                </motion.span>
                <h2 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary-gold bg-clip-text text-transparent">
                  Congratulations Founder!
                </h2>
                <motion.span
                  animate={{ 
                    rotate: [0, -10, 10, 0],
                    scale: [1, 1.1, 1]
                  }}
                  transition={{ 
                    duration: 2,
                    repeat: Infinity,
                    repeatDelay: 3,
                    delay: 0.5
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
                <span className="text-lg text-muted-foreground">You are </span>
                <span className="text-xl font-bold bg-gradient-to-r from-primary to-primary-gold bg-clip-text text-transparent">
                  {(() => {
                    if (proofScore.total > 90) return "Leader in Validation";
                    if (proofScore.total >= 80) return "Investor Match Ready";
                    return "ProofScaler Candidate";
                  })()}
                </span>
              </motion.div>
            </motion.div>
            
            {/* Score Badge */}
            {scoreBadge && (
              <motion.div
                className="flex justify-center mb-6"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.1 }}
              >
                <div className="relative">
                  <img 
                    src={scoreBadge} 
                    alt={`Score Badge ${badgeNumber}`}
                    className="w-32 h-32 drop-shadow-lg"
                  />
                  <motion.div
                    className="absolute inset-0 rounded-full bg-primary/10"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1.1 }}
                    transition={{ 
                      duration: 1.5, 
                      repeat: Infinity, 
                      repeatType: "reverse",
                      delay: 0.5 
                    }}
                  />
                </div>
              </motion.div>
            )}
            
            <div className="mb-6">
              <motion.div
                className="text-6xl font-black gradient-text mb-2"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                {proofScore.total}
              </motion.div>
              <p className="text-xl text-muted-foreground">out of 100</p>
              
              {/* Badge Achievement Text */}
              {scoreBadge && (
                <motion.p 
                  className="text-sm text-primary font-medium mt-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.8 }}
                >
                  Achievement Badge #{badgeNumber} Unlocked!
                </motion.p>
              )}
            </div>

            {/* ProofTags Achievement Section */}
            <div className="bg-gradient-to-br from-primary/5 to-primary-gold/5 rounded-xl p-8 mb-6 border border-primary/10">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-center mb-6"
              >
                <h3 className="text-2xl font-bold mb-2 gradient-text">
                  🏆 ProofTag Validation Progress
                </h3>
                <p className="text-lg text-muted-foreground mb-2">
                  {proofScore.prooTags.unlocked} of {proofScore.prooTags.total} validation milestones unlocked
                </p>
                {/* Progress Tracker */}
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full border border-primary/20">
                  <Target className="w-4 h-4 text-primary" />
                  <span className="text-sm font-semibold text-primary">
                    {proofScore.prooTags.unlocked}/{proofScore.prooTags.total} Tags Unlocked
                  </span>
                  {proofScore.prooTags.unlocked < proofScore.prooTags.total && (
                    <span className="text-sm text-muted-foreground">
                      - {proofScore.prooTags.total - proofScore.prooTags.unlocked} to go
                    </span>
                  )}
                </div>
              </motion.div>

              {/* Achievement Progress Ring */}
              <div className="flex justify-center mb-8">
                <div className="relative w-32 h-32">
                  <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 100 100">
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
                        strokeDashoffset: 2 * Math.PI * 40 * (1 - proofScore.prooTags.unlocked / proofScore.prooTags.total)
                      }}
                      transition={{ duration: 1.5, delay: 0.5 }}
                    />
                    <defs>
                      <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="hsl(var(--primary))" />
                        <stop offset="100%" stopColor="hsl(var(--primary-gold))" />
                      </linearGradient>
                    </defs>
                  </svg>
                  {/* Center text */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <motion.div
                      className="text-center"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.8 }}
                    >
                      <div className="text-2xl font-bold gradient-text">
                        {Math.round((proofScore.prooTags.unlocked / proofScore.prooTags.total) * 100)}%
                      </div>
                      <div className="text-xs text-muted-foreground">Complete</div>
                    </motion.div>
                  </div>
                </div>
              </div>

              {/* ProofTags Grid - Unlocked and Locked */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {/* Unlocked Tags */}
                {proofScore.prooTags.tags.map((tag, index) => (
                  <motion.div
                    key={`unlocked-${index}`}
                    initial={{ opacity: 0, scale: 0.8, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ 
                      delay: 0.6 + index * 0.1,
                      type: "spring",
                      stiffness: 200,
                      damping: 20
                    }}
                    className="group"
                  >
                    <div className="relative bg-card border border-primary/20 rounded-lg p-3 hover:border-primary/40 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10">
                      {/* Achievement glow effect */}
                      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-primary-gold/5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      
                      {/* Achievement icon */}
                      <div className="relative flex items-center justify-center mb-2">
                        <div className="w-8 h-8 bg-gradient-to-r from-primary to-primary-gold rounded-full flex items-center justify-center">
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.8 + index * 0.1, duration: 0.6 }}
                            className="text-lg"
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
                      <p className="relative text-center text-xs font-medium text-foreground leading-tight">
                        {tag}
                      </p>
                    </div>
                  </motion.div>
                ))}

                {/* Locked Tags */}
                {extractedProofTags.lockedTags.map((lockedTag, index) => (
                  <motion.div
                    key={`locked-${index}`}
                    initial={{ opacity: 0, scale: 0.8, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ 
                      delay: 0.6 + (proofScore.prooTags.tags.length + index) * 0.1,
                      type: "spring",
                      stiffness: 200,
                      damping: 20
                    }}
                    className="group"
                  >
                    <div className="relative bg-background border border-primary/10 rounded-lg p-3 hover:border-primary/20 transition-all duration-300 opacity-60">
                      {/* Locked overlay with theme colors */}
                      <div className="absolute inset-0 bg-background/80 rounded-lg" />
                      
                      {/* Achievement icon */}
                      <div className="relative flex items-center justify-center mb-2">
                        <div className="w-8 h-8 bg-muted/50 rounded-full flex items-center justify-center">
                          <div className="text-lg opacity-40">
                            {lockedTag.emoji}
                          </div>
                        </div>
                      </div>
                      
                      {/* Tag text with theme colors */}
                      <p className="relative text-center text-xs font-medium text-foreground/60 leading-tight mb-1">
                        {lockedTag.name}
                      </p>
                      
                      {/* Score requirement */}
                      <div className="relative text-center">
                        <p className="text-[10px] text-primary/60 font-medium">
                          {lockedTag.pointsNeeded > 0 ? `+${lockedTag.pointsNeeded} pts` : `${lockedTag.neededScore} pts`}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Unlock Requirements Section */}
              {extractedProofTags.lockedTags.length > 0 && (
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
                    {extractedProofTags.lockedTags.slice(0, 3).map((lockedTag, index) => (
                      <div key={index} className="flex items-center justify-between text-xs">
                        <span className="text-foreground/70">{lockedTag.name}</span>
                        <span className="text-primary/80">
                          {lockedTag.pointsNeeded > 0 ? `+${lockedTag.pointsNeeded} pts` : `${lockedTag.neededScore} pts`}
                        </span>
                      </div>
                    ))}
                    {extractedProofTags.lockedTags.length > 3 && (
                      <p className="text-xs text-foreground/60 text-center pt-2">
                        +{extractedProofTags.lockedTags.length - 3} more tags to unlock
                      </p>
                    )}
                  </div>
                </motion.div>
              )}

              {/* Achievement celebration */}
              {proofScore.prooTags.unlocked > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.5 }}
                  className="text-center mt-6 p-4 bg-primary/5 rounded-lg border border-primary/10"
                >
                  <Star className="w-6 h-6 text-primary-gold mx-auto mb-2" />
                  <p className="text-sm font-medium text-primary">
                    Great progress! You've validated {proofScore.prooTags.unlocked} key aspects of your startup.
                  </p>
                </motion.div>
              )}
            </div>
          </Card>

          {/* Score Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Dimension Scores */}
            <Card className="p-6 border-border bg-card">
              <h3 className="text-xl font-semibold mb-6">
                Validation Dimensions
              </h3>
              <div className="space-y-4">
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
                      <div key={dimension}>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-medium">
                            {
                              dimensionLabels[
                                dimension as keyof typeof dimensionLabels
                              ]
                            }
                          </span>
                          <span className="text-sm font-bold">
                            {score}/{maxScore}
                          </span>
                        </div>
                        <div className="w-full bg-border rounded-full h-2">
                          <motion.div
                            className={`h-2 rounded-full ${dimensionColors[dimension as keyof typeof dimensionColors]}`}
                            initial={{ width: 0 }}
                            animate={{ width: `${percentage}%` }}
                            transition={{ duration: 1, delay: 0.5 }}
                          />
                        </div>
                      </div>
                    );
                  },
                )}
              </div>
            </Card>

            {/* Key Insights */}
            <Card className="p-6 border-border bg-card">
              <h3 className="text-xl font-semibold mb-6">Key Insights</h3>
              <div className="space-y-4">
                {proofScore.insights.strengths
                  .slice(0, 2)
                  .map((strength: any, index: number) => (
                    <div key={index} className="flex items-start space-x-3">
                      <ThumbsUp className="text-green-500 mt-1 w-4 h-4 flex-shrink-0" />
                      <div>
                        <h4 className="font-medium text-green-400 text-sm">
                          {strength.title || "Strength"}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {strength.description || strength}
                        </p>
                      </div>
                    </div>
                  ))}
                {proofScore.insights.improvements
                  .slice(0, 2)
                  .map((improvement: any, index: number) => (
                    <div key={index} className="flex items-start space-x-3">
                      <AlertTriangle className="text-yellow-500 mt-1 w-4 h-4 flex-shrink-0" />
                      <div>
                        <h4 className="font-medium text-yellow-400 text-sm">
                          {improvement.title || "Area for Improvement"}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {improvement.description || improvement}
                        </p>
                      </div>
                    </div>
                  ))}
                {proofScore.insights.recommendations
                  .slice(0, 1)
                  .map((recommendation: any, index: number) => (
                    <div key={index} className="flex items-start space-x-3">
                      <TrendingUp className="text-primary mt-1 w-4 h-4 flex-shrink-0" />
                      <div>
                        <h4 className="font-medium text-primary text-sm">
                          {recommendation.title || "Recommendation"}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {recommendation.description || recommendation}
                        </p>
                      </div>
                    </div>
                  ))}
              </div>
            </Card>
          </div>

          {/* Generated Report */}
          <Card className="p-6 border-border bg-card mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold mb-2">
                  Your Detailed Analysis Report
                </h3>
                <p className="text-muted-foreground">
                  Comprehensive pitch deck analysis with actionable
                  recommendations
                </p>
              </div>
              <Button className="gradient-button">
                <Download className="mr-2 w-4 h-4" />
                Download PDF
              </Button>
            </div>
          </Card>

          {/* Continue Button */}
          <div className="text-center">
            <Button
              onClick={onComplete}
              className="gradient-button px-8 py-6 text-lg"
              size="lg"
            >
              See My Pathway
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
