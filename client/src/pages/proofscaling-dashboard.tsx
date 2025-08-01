import { motion } from "framer-motion";
import { ArrowRight, BookOpen, CheckCircle, Lock, Download, Play, Users, Target, TrendingUp, FileText, Lightbulb, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ProofScoreResult } from "@shared/schema";

interface ProofScalingDashboardProps {
  onNext: () => void;
  proofScore: ProofScoreResult;
}

export default function ProofScalingDashboard({ onNext, proofScore }: ProofScalingDashboardProps) {
  const modules = [
    {
      id: 1,
      title: "Desirability Framework",
      description: "Problem validation and customer discovery methodology",
      status: "available",
      progress: 0,
      duration: "2 weeks",
      icon: Target,
      color: "bg-green-500"
    },
    {
      id: 2, 
      title: "Feasibility Validation",
      description: "MVP development and technical proof validation",
      status: "locked",
      progress: 0,
      duration: "3 weeks", 
      icon: CheckCircle,
      color: "bg-blue-500"
    },
    {
      id: 3,
      title: "Viability Testing",
      description: "Business model and revenue validation framework",
      status: "locked",
      progress: 0,
      duration: "2 weeks",
      icon: TrendingUp,
      color: "bg-orange-500"
    },
    {
      id: 4,
      title: "Traction Building",
      description: "Customer acquisition and growth strategies",
      status: "locked", 
      progress: 0,
      duration: "4 weeks",
      icon: Users,
      color: "bg-yellow-500"
    },
    {
      id: 5,
      title: "Investor Readiness", 
      description: "Pitch optimization and investor preparation",
      status: "locked",
      progress: 0,
      duration: "2 weeks",
      icon: FileText,
      color: "bg-red-500"
    }
  ];

  const playbooks = [
    {
      title: "Customer Interview Playbook",
      description: "Step-by-step guide to conducting validation interviews",
      pages: 24,
      status: "available"
    },
    {
      title: "MVP Testing Framework",
      description: "Structured approach to building and testing your MVP",
      pages: 32,
      status: "available"
    },
    {
      title: "Business Model Canvas 2.0",
      description: "Enhanced canvas for startup validation",
      pages: 18,
      status: "locked"
    },
    {
      title: "Investor Pitch Template",
      description: "Proven deck structure with validation focus",
      pages: 28,
      status: "locked"
    }
  ];

  const resources = [
    {
      title: "ProofVault Template",
      type: "Template",
      description: "Structured data room for validation artifacts"
    },
    {
      title: "Validation Checklist",
      type: "Checklist", 
      description: "200+ validation checkpoints across all dimensions"
    },
    {
      title: "Founder Community",
      type: "Community",
      description: "Private Slack with 1000+ validated founders"
    },
    {
      title: "Weekly Office Hours",
      type: "Live Session",
      description: "1:1 coaching calls with validation experts"
    }
  ];

  return (
    <div className="min-h-screen py-12 bg-background">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Header */}
          <div className="text-center mb-8">
            <motion.div 
              className="w-16 h-16 bg-gradient-to-r from-primary to-primary-gold rounded-full flex items-center justify-center mx-auto mb-4"
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ duration: 0.8, ease: "backOut" }}
            >
              <BookOpen className="text-white text-2xl w-8 h-8" />
            </motion.div>
            <h1 className="text-3xl font-bold mb-4">ProofScaling Dashboard</h1>
            <p className="text-xl text-muted-foreground mb-2">
              Transform your validation approach with structured frameworks
            </p>
            <Badge className="bg-primary-gold text-black font-semibold">
              $99 Credit Applied
            </Badge>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Modules */}
            <div className="lg:col-span-2 space-y-6">
              <Card className="p-6 border-border bg-card">
                <h2 className="text-xl font-semibold mb-6">Validation Modules</h2>
                <div className="space-y-4">
                  {modules.map((module, index) => (
                    <motion.div
                      key={module.id}
                      className={`p-4 rounded-lg border transition-all duration-300 ${
                        module.status === "available" 
                          ? "border-primary bg-primary/5 hover:bg-primary/10 cursor-pointer" 
                          : "border-border bg-background opacity-75"
                      }`}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      whileHover={module.status === "available" ? { scale: 1.02 } : {}}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className={`w-10 h-10 ${module.color} rounded-lg flex items-center justify-center`}>
                            <module.icon className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-foreground">{module.title}</h3>
                            <p className="text-sm text-muted-foreground">{module.description}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          {module.status === "available" ? (
                            <Button size="sm" className="gradient-button">
                              <Play className="w-4 h-4 mr-1" />
                              Start
                            </Button>
                          ) : (
                            <div className="flex items-center text-muted-foreground">
                              <Lock className="w-4 h-4 mr-1" />
                              <span className="text-xs">{module.duration}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      {module.status === "available" && (
                        <div className="mt-3">
                          <div className="flex justify-between text-xs text-muted-foreground mb-1">
                            <span>Progress</span>
                            <span>{module.progress}%</span>
                          </div>
                          <Progress value={module.progress} className="h-2" />
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              </Card>

              {/* Playbooks */}
              <Card className="p-6 border-border bg-card">
                <h2 className="text-xl font-semibold mb-6">Validation Playbooks</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {playbooks.map((playbook, index) => (
                    <motion.div
                      key={index}
                      className={`p-4 rounded-lg border transition-all duration-300 ${
                        playbook.status === "available"
                          ? "border-primary-gold bg-primary-gold/5 hover:bg-primary-gold/10 cursor-pointer"
                          : "border-border bg-background opacity-75"
                      }`}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      whileHover={playbook.status === "available" ? { scale: 1.02 } : {}}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-primary-gold/20 rounded-lg flex items-center justify-center">
                            <FileText className="w-4 h-4 text-primary-gold" />
                          </div>
                          <div>
                            <h4 className="font-medium text-foreground">{playbook.title}</h4>
                            <p className="text-xs text-muted-foreground">{playbook.pages} pages</p>
                          </div>
                        </div>
                        {playbook.status === "available" ? (
                          <Button size="sm" variant="outline" className="border-primary-gold text-primary-gold hover:bg-primary-gold hover:text-black">
                            <Download className="w-3 h-3" />
                          </Button>
                        ) : (
                          <Lock className="w-4 h-4 text-muted-foreground" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{playbook.description}</p>
                    </motion.div>
                  ))}
                </div>
              </Card>
            </div>

            {/* Right Column - Progress & Resources */}
            <div className="space-y-6">
              {/* Current ProofScore */}
              <Card className="p-6 border-border bg-card">
                <h3 className="text-lg font-semibold mb-4">Your ProofScore</h3>
                <div className="text-center mb-4">
                  <div className="text-4xl font-bold gradient-text mb-2">{proofScore.total}</div>
                  <p className="text-sm text-muted-foreground">Current Score</p>
                </div>
                
                <div className="space-y-3">
                  {Object.entries(proofScore.dimensions).map(([dimension, score]) => (
                    <div key={dimension}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="capitalize">{dimension}</span>
                        <span>{score}/20</span>
                      </div>
                      <Progress value={(score / 20) * 100} className="h-2" />
                    </div>
                  ))}
                </div>
                
                <div className="mt-4 p-3 bg-background rounded-lg">
                  <div className="text-sm font-medium mb-1">Target Score</div>
                  <div className="text-2xl font-bold text-primary-gold">85</div>
                  <div className="text-xs text-muted-foreground">Investor Ready Threshold</div>
                </div>
              </Card>

              {/* ProofTags Progress */}
              <Card className="p-6 border-border bg-card">
                <h3 className="text-lg font-semibold mb-4">ProofTags Progress</h3>
                <div className="text-center mb-4">
                  <div className="text-2xl font-bold text-primary mb-1">
                    {proofScore.prooTags.unlocked}/{proofScore.prooTags.total}
                  </div>
                  <p className="text-sm text-muted-foreground">Tags Unlocked</p>
                </div>
                
                <div className="grid grid-cols-5 gap-2 mb-4">
                  {Array.from({ length: proofScore.prooTags.total }).map((_, index) => (
                    <div
                      key={index}
                      className={`aspect-square rounded-lg flex items-center justify-center ${
                        index < proofScore.prooTags.unlocked
                          ? index % 2 === 0 ? "bg-primary" : "bg-primary-gold"
                          : "bg-border"
                      }`}
                    >
                      {index < proofScore.prooTags.unlocked ? (
                        <CheckCircle className="w-4 h-4 text-white" />
                      ) : (
                        <Lock className="w-3 h-3 text-muted-foreground" />
                      )}
                    </div>
                  ))}
                </div>
                
                <div className="space-y-1">
                  {proofScore.prooTags.tags.map((tag, index) => (
                    <div key={index} className="text-xs text-primary font-medium">
                      ✓ {tag}
                    </div>
                  ))}
                </div>
              </Card>

              {/* Resources */}
              <Card className="p-6 border-border bg-card">
                <h3 className="text-lg font-semibold mb-4">Resources & Support</h3>
                <div className="space-y-3">
                  {resources.map((resource, index) => (
                    <div key={index} className="flex items-start space-x-3 p-3 bg-background rounded-lg hover:bg-background/80 transition-colors cursor-pointer">
                      <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Lightbulb className="w-4 h-4 text-primary" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="font-medium text-foreground text-sm">{resource.title}</h4>
                        <p className="text-xs text-muted-foreground mb-1">{resource.description}</p>
                        <Badge variant="outline" className="text-xs">
                          {resource.type}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Next Steps */}
              <Card className="p-6 border-border bg-card">
                <h3 className="text-lg font-semibold mb-4">Recommended Next Steps</h3>
                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-white text-xs font-bold">1</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Start Module 1</p>
                      <p className="text-xs text-muted-foreground">Begin with Desirability Framework</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-primary-gold rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-black text-xs font-bold">2</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Schedule Office Hours</p>
                      <p className="text-xs text-muted-foreground">Book your first 1:1 coaching call</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-border rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-muted-foreground text-xs font-bold">3</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Join Community</p>
                      <p className="text-xs text-muted-foreground">Connect with other founders</p>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>

          {/* Footer CTA */}
          <div className="text-center mt-8">
            <Button onClick={onNext} variant="outline" className="border-border text-muted-foreground hover:border-primary hover:text-primary">
              Back to Journey
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}