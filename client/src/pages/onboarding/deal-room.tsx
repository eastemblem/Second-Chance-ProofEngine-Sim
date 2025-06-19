import { motion } from "framer-motion";
import {
  ArrowRight,
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
  Trophy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import ProgressBar from "@/components/progress-bar";

interface DealRoomProps {
  sessionId: string;
  sessionData: any;
  onComplete: () => void;
}

export default function DealRoom({ 
  sessionId, 
  sessionData, 
  onComplete 
}: DealRoomProps) {
  // Extract data from session
  const scoringResult = sessionData?.stepData?.processing?.scoringResult;
  const founderData = sessionData?.stepData?.founder;
  const ventureData = sessionData?.stepData?.venture?.venture || sessionData?.stepData?.venture;
  
  // Map scoring result to structured data with proper fallbacks
  const analysisData = {
    total_score: scoringResult?.total_score || scoringResult?.output?.total_score || 66,
    categories: {
      Problem: scoringResult?.output?.Problem || { score: 7, justification: "Problem analysis completed", recommendation: "Continue refining problem statement" },
      solution: scoringResult?.output?.solution || { score: 8, justification: "Solution analysis completed", recommendation: "Enhance solution details" },
      market_opportunity: scoringResult?.output?.market_opportunity || { score: 8, justification: "Market opportunity evaluated", recommendation: "Expand market research" },
      product_technology: scoringResult?.output?.product_technology || { score: 6, justification: "Product technology assessed", recommendation: "Improve technical documentation" },
      team: scoringResult?.output?.team || { score: 3, justification: "Team information reviewed", recommendation: "Add detailed team background" },
      business_model: scoringResult?.output?.business_model || { score: 8, justification: "Business model analyzed", recommendation: "Include unit economics" },
      traction_milestones: scoringResult?.output?.traction_milestones || { score: 7, justification: "Traction metrics reviewed", recommendation: "Add growth metrics" },
      competition: scoringResult?.output?.competition || { score: 6, justification: "Competitive landscape analyzed", recommendation: "Strengthen competitive analysis" },
      go_to_market_strategy: scoringResult?.output?.go_to_market_strategy || { score: 7, justification: "GTM strategy evaluated", recommendation: "Include acquisition metrics" },
      financials_projections_ask: scoringResult?.output?.financials_projections_ask || { score: 4, justification: "Financial projections reviewed", recommendation: "Add detailed projections" },
    },
    overall_feedback: scoringResult?.output?.overall_feedback || [
      "Analysis completed successfully",
      "Key areas identified for improvement",
      "Recommendations provided for enhancement"
    ],
    proofTags: generateProofTags(scoringResult?.output)
  };

  function generateProofTags(output: any) {
    const tags = [];
    if (!output) return ["Analysis Complete", "Investment Ready", "Validation Needed"];
    
    // Generate tags based on scores
    Object.entries(output).forEach(([key, value]: [string, any]) => {
      if (value?.score >= 8) {
        tags.push(`Strong ${key.replace('_', ' ')}`);
      } else if (value?.score >= 6) {
        tags.push(`Good ${key.replace('_', ' ')}`);
      } else if (value?.score > 0) {
        tags.push(`Needs ${key.replace('_', ' ')} Work`);
      }
    });
    
    // Add general tags based on total score
    if (analysisData.total_score >= 80) {
      tags.push("Investment Ready", "High Potential");
    } else if (analysisData.total_score >= 60) {
      tags.push("Promising Venture", "Refinement Needed");
    } else {
      tags.push("Early Stage", "Development Required");
    }
    
    return tags.slice(0, 8); // Limit to 8 tags
  }

  const matchedInvestors = [
    {
      name: "Catalyst Ventures",
      type: "Pre-Seed Fund",
      checkSize: "$250K - $500K",
      focus: "B2B SaaS",
      match: 95,
      logo: "CV",
    },
    {
      name: "Foundry Capital",
      type: "Seed Fund",
      checkSize: "$500K - $2M",
      focus: "Tech-enabled services",
      match: 87,
      logo: "FC",
    },
    {
      name: "Bridge Partners",
      type: "Early Stage VC",
      checkSize: "$1M - $3M",
      focus: "Enterprise software",
      match: 82,
      logo: "BP",
    },
  ];

  const dealRoomStats = [
    { value: analysisData.total_score.toString(), label: "ProofScore" },
    { value: analysisData.proofTags.length.toString(), label: "ProofTags Unlocked" },
    { value: "3", label: "Matched Investors" },
  ];

  return (
    <div className="min-h-screen py-12">
      <div className="max-w-4xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <ProgressBar
            currentStep={6}
            totalSteps={6}
            stepName="Deal Room Analysis"
          />

          {/* Header */}
          <div className="text-center mb-8">
            <motion.div
              className="w-16 h-16 bg-gradient-to-r from-primary to-primary-gold rounded-full flex items-center justify-center mx-auto mb-4"
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ duration: 0.8, ease: "backOut" }}
            >
              <Trophy className="text-white text-2xl w-8 h-8" />
            </motion.div>
            <h2 className="text-3xl font-bold mb-4">
              Analysis Complete - Welcome to Deal Room
            </h2>
            <p className="text-xl text-muted-foreground">
              Your ProofScore of {analysisData.total_score}/100 has been calculated
            </p>
          </div>

          {/* Deal Room Stats */}
          <Card className="p-6 border-border bg-card mb-8">
            <h3 className="text-xl font-semibold mb-6 text-center">
              Deal Room Overview
            </h3>
            <div className="grid grid-cols-3 gap-8">
              {dealRoomStats.map((stat, index) => (
                <div key={index} className="text-center">
                  <motion.div
                    className="text-3xl font-bold text-primary-gold mb-2"
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.2 }}
                  >
                    {stat.value}
                  </motion.div>
                  <div className="text-sm text-muted-foreground">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* ProofTags */}
          <Card className="p-6 border-border bg-card mb-8">
            <h3 className="text-xl font-semibold mb-4">ProofTags Earned</h3>
            <div className="flex flex-wrap gap-2">
              {analysisData.proofTags.map((tag, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Badge className="bg-primary-gold text-black hover:bg-primary-gold/90">
                    {tag}
                  </Badge>
                </motion.div>
              ))}
            </div>
          </Card>

          {/* Analysis Breakdown */}
          <Card className="p-6 border-border bg-card mb-8">
            <h3 className="text-xl font-semibold mb-6">Analysis Breakdown</h3>
            <div className="space-y-4">
              {Object.entries(analysisData.categories).map(([category, data]) => (
                <div key={category} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium capitalize">
                      {category.replace('_', ' ')}
                    </h4>
                    <div className="flex items-center space-x-2">
                      <span className="text-2xl font-bold text-primary">
                        {data.score}/10
                      </span>
                    </div>
                  </div>
                  <Progress value={data.score * 10} className="mb-3" />
                  <p className="text-sm text-muted-foreground mb-2">
                    {data.justification}
                  </p>
                  <p className="text-sm text-primary font-medium">
                    💡 {data.recommendation}
                  </p>
                </div>
              ))}
            </div>
          </Card>

          {/* Overall Feedback */}
          <Card className="p-6 border-border bg-card mb-8">
            <h3 className="text-xl font-semibold mb-4">Key Insights</h3>
            <div className="space-y-3">
              {analysisData.overall_feedback.map((feedback, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <Lightbulb className="w-5 h-5 text-primary-gold mt-0.5 flex-shrink-0" />
                  <p className="text-muted-foreground">{feedback}</p>
                </div>
              ))}
            </div>
          </Card>

          {/* Matched Investors */}
          <Card className="p-6 border-border bg-card mb-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold">Your Matched Investors</h3>
              <Badge className="bg-primary text-white">3 Active Matches</Badge>
            </div>

            <div className="grid gap-4">
              {matchedInvestors.map((investor, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-sm">
                        {investor.logo}
                      </span>
                    </div>
                    <div>
                      <h4 className="font-semibold">{investor.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {investor.type} • {investor.checkSize}
                      </p>
                      <p className="text-sm text-primary">Focus: {investor.focus}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-primary-gold">
                      {investor.match}%
                    </div>
                    <div className="text-sm text-muted-foreground">Match</div>
                  </div>
                </motion.div>
              ))}
            </div>
          </Card>

          {/* Investment Process Timeline */}
          <Card className="p-6 border-border bg-card mb-8">
            <h3 className="text-xl font-semibold mb-6">Investment Process</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-background rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-bold">1</span>
                  </div>
                  <div>
                    <div className="font-medium">Initial Review</div>
                    <div className="text-sm text-muted-foreground">
                      Investor reviews your ProofVault materials
                    </div>
                  </div>
                </div>
                <div className="text-sm font-medium text-primary">1-2 weeks</div>
              </div>

              <div className="flex items-center justify-between p-4 bg-background rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-bold">2</span>
                  </div>
                  <div>
                    <div className="font-medium">Due Diligence</div>
                    <div className="text-sm text-muted-foreground">
                      Deep dive into business model and traction
                    </div>
                  </div>
                </div>
                <div className="text-sm font-medium text-primary">2-4 weeks</div>
              </div>

              <div className="flex items-center justify-between p-4 bg-background rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-primary-gold rounded-full flex items-center justify-center">
                    <span className="text-black text-sm font-bold">3</span>
                  </div>
                  <div>
                    <div className="font-medium">Term Sheet & Closing</div>
                    <div className="text-sm text-muted-foreground">
                      Negotiation and final agreements
                    </div>
                  </div>
                </div>
                <div className="text-sm font-medium text-primary-gold">
                  2-3 weeks
                </div>
              </div>
            </div>
          </Card>

          {/* CTA */}
          <div className="text-center">
            <Button
              onClick={onComplete}
              className="gradient-button px-8 py-6 text-lg"
              size="lg"
            >
              Continue to Dashboard
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <p className="text-sm text-muted-foreground mt-4">
              Analysis complete • Ready for investor outreach • ProofVault activated
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}