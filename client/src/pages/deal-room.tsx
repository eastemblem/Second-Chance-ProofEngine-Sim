import { motion } from "framer-motion";
import { ArrowRight, Users, Calendar, TrendingUp, Shield, Briefcase, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import ProgressBar from "@/components/progress-bar";
import { ProofScore } from "@shared/schema";


interface DealRoomPageProps {
  onNext: () => void;
  proofScore: ProofScore;
}

export default function DealRoomPage({ onNext, proofScore }: DealRoomPageProps) {
  const matchedInvestors = [
    {
      name: "Catalyst Ventures",
      type: "Pre-Seed Fund",
      checkSize: "$250K - $500K",
      focus: "B2B SaaS",
      match: 95,
      logo: "CV"
    },
    {
      name: "Foundry Capital",
      type: "Seed Fund", 
      checkSize: "$500K - $2M",
      focus: "Tech-enabled services",
      match: 87,
      logo: "FC"
    },
    {
      name: "Bridge Partners",
      type: "Early Stage VC",
      checkSize: "$1M - $3M", 
      focus: "Enterprise software",
      match: 82,
      logo: "BP"
    }
  ];

  const dealRoomStats = [
    { value: "12", label: "Active Investors" },
    { value: "89%", label: "Match Success Rate" },
    { value: "3.2x", label: "Avg Valuation Uplift" }
  ];

  return (
    <div className="min-h-screen py-12">
      <div className="max-w-4xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <ProgressBar currentStep={4} totalSteps={4} stepName="Investor Deal Room" />

          {/* Header */}
          <div className="text-center mb-8">
            <motion.div 
              className="w-16 h-16 bg-gradient-to-r from-primary to-primary-gold rounded-full flex items-center justify-center mx-auto mb-4"
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ duration: 0.8, ease: "backOut" }}
            >
              <Briefcase className="text-white text-2xl w-8 h-8" />
            </motion.div>
            <h2 className="text-3xl font-bold mb-4">Welcome to the Deal Room</h2>
            <p className="text-xl text-muted-foreground">
              Your ProofScore of {(proofScore as any).total || proofScore.totalScore} qualifies you for direct investor access
            </p>
          </div>

          {/* Deal Room Stats */}
          <Card className="p-6 border-border bg-card mb-8">
            <h3 className="text-xl font-semibold mb-6 text-center">Deal Room Overview</h3>
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

          {/* Matched Investors */}
          <Card className="p-6 border-border bg-card mb-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold">Your Matched Investors</h3>
              <Badge className="bg-primary text-white">3 Active Matches</Badge>
            </div>
            
            <div className="space-y-4">
              {matchedInvestors.map((investor, index) => (
                <motion.div
                  key={index}
                  className="bg-background border border-border rounded-lg p-6 hover:border-primary transition-colors cursor-pointer"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.02 }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-r from-primary to-primary-gold rounded-full flex items-center justify-center">
                        <span className="text-white font-bold text-sm">{investor.logo}</span>
                      </div>
                      <div>
                        <h4 className="font-semibold text-foreground">{investor.name}</h4>
                        <p className="text-sm text-muted-foreground">{investor.type}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-primary-gold">{investor.match}% Match</div>
                      <div className="text-xs text-muted-foreground">{investor.checkSize}</div>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    <div className="text-xs text-muted-foreground">
                      Focus: {investor.focus}
                    </div>
                    <Button size="sm" className="gradient-button">
                      Request Introduction
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          </Card>

          {/* Next Steps */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <Card className="p-6 border-border bg-card">
              <div className="flex items-start space-x-4">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Schedule Meetings</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    Book intro calls with matched investors through our platform
                  </p>
                  <Button variant="outline" size="sm" className="border-primary text-primary hover:bg-primary hover:text-white">
                    View Calendar
                  </Button>
                </div>
              </div>
            </Card>

            <Card className="p-6 border-border bg-card">
              <div className="flex items-start space-x-4">
                <div className="w-10 h-10 bg-primary-gold/10 rounded-lg flex items-center justify-center">
                  <Shield className="w-5 h-5 text-primary-gold" />
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Due Diligence Ready</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    Your ProofVault is investor-grade and DD-ready
                  </p>
                  <Button variant="outline" size="sm" className="border-primary-gold text-primary-gold hover:bg-primary-gold hover:text-black">
                    Review Data Room
                  </Button>
                </div>
              </div>
            </Card>
          </div>

          {/* Investment Timeline */}
          <Card className="p-6 border-border bg-card mb-8">
            <h3 className="text-xl font-semibold mb-6">Expected Investment Timeline</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-background rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-bold">1</span>
                  </div>
                  <div>
                    <div className="font-medium">Investor Introductions</div>
                    <div className="text-sm text-muted-foreground">Initial calls and interest validation</div>
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
                    <div className="font-medium">Due Diligence Process</div>
                    <div className="text-sm text-muted-foreground">Data room review and validation</div>
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
                    <div className="text-sm text-muted-foreground">Negotiation and final agreements</div>
                  </div>
                </div>
                <div className="text-sm font-medium text-primary-gold">2-3 weeks</div>
              </div>
            </div>
          </Card>

          {/* Document Upload Section */}
          <Card className="p-6 border border-green-200 bg-green-50">
            <div className="text-center">
              <Shield className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-green-800 mb-2">Documents Ready</h3>
              <p className="text-sm text-green-600">
                Your files have been securely uploaded to Box.com with ProofVault organization. 
                Investor-ready data room is prepared with shareable links.
              </p>
            </div>
          </Card>

          {/* CTA */}
          <div className="text-center">
            <Button onClick={onNext} className="gradient-button px-8 py-6 text-lg" size="lg">
              Complete Deal Room Setup
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <p className="text-sm text-muted-foreground mt-4">
              Secure document storage • Ready for investor review • Box.com protected
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}