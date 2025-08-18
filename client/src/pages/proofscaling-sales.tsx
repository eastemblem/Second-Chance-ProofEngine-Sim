import { motion } from "framer-motion";
import { ArrowRight, Star, Users, TrendingUp, Shield, Zap, Crown, Award, DollarSign, Timer, Handshake, CheckCircle2, Target, Trophy, Rocket, PlayCircle, Brain, BookOpen, Lightbulb } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

// Import ProofScaling components
import { AnimatedSection } from "@/components/proofscaling/animated-section";
import { SectionHeader } from "@/components/proofscaling/section-header";
import { MetricCard } from "@/components/proofscaling/metric-card";
import { FeatureList } from "@/components/proofscaling/feature-list";
import { GradientButton } from "@/components/proofscaling/gradient-button";
import { TestimonialCard } from "@/components/proofscaling/testimonial-card";
import { CompanyLogoGrid } from "@/components/proofscaling/company-logo";
import { BadgeWithIcon } from "@/components/proofscaling/badge-with-icon";
import { AnimatedCounter } from "@/components/proofscaling/animated-counter";
import { FloatingElements } from "@/components/proofscaling/floating-elements";
import { SuccessIndicator } from "@/components/proofscaling/success-indicator";
import { ProgressVisualization } from "@/components/proofscaling/progress-visualization";
import { MetricCardsHero } from "@/components/proofscaling/metric-card-hero";
import { UrgencyBanner } from "@/components/proofscaling/urgency-banner";

// Data for ProofScaling
const heroMetrics = [
  { value: "94%", label: "Improvement Rate", icon: TrendingUp, delay: 0.4 },
  { value: "12", label: "Weeks Average", icon: Timer, delay: 0.6 },
  { value: "250+", label: "Startups Scaled", icon: Users, delay: 0.8 },
  { value: "73%", label: "Reach Funding", icon: DollarSign, delay: 1.0 }
];

const partnerPrograms = [
  "YC Startup School", "Techstars Accelerator", "500 Global", "Founder Institute", 
  "MassChallenge", "SOSV"
];

const testimonials = [
  {
    name: "Alex Chen",
    title: "CEO & Founder",
    company: "EcoTech Solutions",
    proofScore: 47,
    quote: "ProofScaling helped me identify and fix 8 critical gaps in my business model. My score went from 47 to 78 in just 10 weeks, and I closed my seed round two months later.",
    rating: 5,
    result: "Score: 47→78",
    avatar: "AC"
  },
  {
    name: "Maria Santos", 
    title: "Co-Founder",
    company: "HealthAI Labs",
    proofScore: 52,
    quote: "The structured curriculum and expert mentorship were game-changers. I finally understood what investors actually look for and built exactly that.",
    rating: 5,
    result: "Score: 52→81",
    avatar: "MS"
  },
  {
    name: "David Kim",
    title: "Founder",
    company: "FinanceFlow",
    proofScore: 38,
    quote: "I was completely stuck at 38 points for months. ProofScaling's systematic approach got me investor-ready in 3 months. Now I'm raising my Series A.",
    rating: 5,
    result: "Score: 38→84",
    avatar: "DK"
  }
];

const curriculumModules = [
  { 
    icon: Target, 
    title: "Market Validation", 
    description: "Learn proven frameworks to validate your market size, customer needs, and competitive positioning with real data" 
  },
  { 
    icon: Users, 
    title: "Team Building", 
    description: "Build the right founding team, advisory board, and early employees that investors want to back" 
  },
  { 
    icon: Rocket, 
    title: "Product Development", 
    description: "Create MVP strategies, product roadmaps, and development processes that demonstrate execution capability" 
  },
  { 
    icon: TrendingUp, 
    title: "Business Model", 
    description: "Design sustainable revenue models, pricing strategies, and growth plans that scale profitably" 
  },
  { 
    icon: DollarSign, 
    title: "Financial Planning", 
    description: "Master financial modeling, projections, and key metrics that investors use to evaluate startups" 
  },
  { 
    icon: Brain, 
    title: "Investor Readiness", 
    description: "Prepare compelling pitch materials, due diligence documents, and presentation skills for fundraising" 
  }
];

interface ProofScalingSalesPageProps {
  onNext?: () => void;
  proofScore?: any;
}

export default function ProofScalingSalesPage(props?: ProofScalingSalesPageProps) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Hero Section */}
      <section className="relative pt-8 pb-20 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-background to-green-500/10" />
        <FloatingElements />
        <div className="container mx-auto max-w-5xl relative">
          <div className="text-center">
            {/* Metric Cards */}
            <MetricCardsHero />
            
            {/* Urgency Banner */}
            <div className="flex justify-center mb-12">
              <UrgencyBanner />
            </div>

            {/* Main heading */}
            <motion.h1 
              className="text-5xl md:text-7xl font-bold mb-6 leading-tight"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.5 }}
            >
              Turn rejection into<br />
              <span className="bg-gradient-to-r from-blue-500 via-green-400 to-blue-600 bg-clip-text text-transparent">
                investor-ready proof
              </span>
            </motion.h1>

            {/* Subheading */}
            <motion.p 
              className="text-2xl md:text-3xl font-bold mb-8 text-foreground"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
            >
              in just 4 weeks
            </motion.p>

            {/* Description */}
            <motion.p 
              className="text-lg md:text-xl text-muted-foreground mb-12 max-w-3xl mx-auto leading-relaxed"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.7 }}
            >
              A practical sprint that upgrades your ProofScore, derisks your venture, and magnetizes capital.
            </motion.p>

            {/* Quote Section */}
            <motion.div
              className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 mb-12 max-w-4xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.8 }}
            >
              <div className="text-2xl md:text-3xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-green-400 bg-clip-text text-transparent">
                "Investors don't fund ideas – they fund evidence."
              </div>
              <p className="text-muted-foreground text-base md:text-lg">
                ProofScaling is the only fast-track curriculum that turns gut-feel into data VCs can underwrite. Follow our weekly experiments, upload the artefacts, and watch your ProofTags turn gold.
              </p>
            </motion.div>


          </div>
        </div>
      </section>

      {/* Trusted by Programs */}
      <section className="py-20 px-4 bg-card/30">
        <div className="container mx-auto max-w-6xl">
          <AnimatedSection delay={0.2}>
            <SectionHeader 
              title="Trusted by Top Accelerators" 
              subtitle="ProofScaling curriculum is recommended by leading startup programs worldwide"
            />
          </AnimatedSection>

          <CompanyLogoGrid companies={partnerPrograms} />

          {/* Testimonials */}
          <div className="mt-20">
            <AnimatedSection delay={0.6}>
              <SectionHeader 
                title="Success Stories" 
                subtitle="See how founders transformed their startups through ProofScaling"
              />
            </AnimatedSection>

            <div className="grid md:grid-cols-3 gap-8 mt-12">
              {testimonials.map((testimonial, index) => (
                <TestimonialCard 
                  key={testimonial.name}
                  testimonial={testimonial}
                  delay={index * 0.2}
                />
              ))}
            </div>

            {/* Live activity indicator */}
            <motion.div 
              className="mt-12 text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.8 }}
            >
              <div className="inline-flex items-center space-x-3 bg-gradient-to-r from-green-500/20 to-blue-500/20 px-6 py-3 rounded-full border border-green-500/30">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                <span className="text-sm font-medium text-foreground">
                  <span className="text-green-500 font-bold">Live:</span> 7 founders started this week
                </span>
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <TrendingUp className="w-4 h-4 text-green-500" />
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Why ProofScaling Works */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl relative">
          <FloatingElements />
          <AnimatedSection delay={0.2}>
            <SectionHeader 
              title="Why Most Startups Fail" 
              subtitle="DIY approach vs. The ProofScaling systematic framework"
            />
          </AnimatedSection>

          <div className="grid md:grid-cols-2 gap-8 mb-16 relative z-10">
            {/* DIY approach */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              whileHover={{ scale: 1.02, y: -5 }}
              className="group"
            >
              <Card className="p-8 bg-gradient-to-br from-red-500/5 to-red-500/10 border-red-500/20 h-full hover:border-red-500/40 transition-all duration-300 hover:shadow-xl hover:shadow-red-500/10 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-20 h-20 bg-red-500/10 rounded-full -translate-y-10 translate-x-10" />
                <h3 className="text-xl font-bold text-red-400 mb-6 flex items-center">
                  <Timer className="w-5 h-5 mr-2" />
                  DIY Approach
                </h3>
                <ul className="space-y-4">
                  {[
                    "Building without market validation",
                    "Guessing what investors want", 
                    "No structured growth framework",
                    "Learning from expensive mistakes",
                    "90% failure rate in first 5 years"
                  ].map((item, index) => (
                    <motion.li 
                      key={index} 
                      className="flex items-center text-muted-foreground group-hover:text-foreground transition-colors"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.5, delay: 0.4 + index * 0.1 }}
                    >
                      <div className="w-2 h-2 bg-red-400 rounded-full mr-3 flex-shrink-0" />
                      {item}
                    </motion.li>
                  ))}
                </ul>
              </Card>
            </motion.div>

            {/* ProofScaling way */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              whileHover={{ scale: 1.02, y: -5 }}
              className="group"
            >
              <Card className="p-8 bg-gradient-to-br from-green-500/5 to-green-500/10 border-green-500/20 h-full hover:border-green-500/40 transition-all duration-300 hover:shadow-xl hover:shadow-green-500/10 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-20 h-20 bg-green-500/10 rounded-full -translate-y-10 translate-x-10" />
                <h3 className="text-xl font-bold text-green-400 mb-6 flex items-center">
                  <Rocket className="w-5 h-5 mr-2" />
                  The ProofScaling Way
                </h3>
                <ul className="space-y-4">
                  {[
                    "Validate before you build anything",
                    "Follow proven investor frameworks",
                    "Systematic approach to growth",
                    "Learn from expert mentors",
                    "94% complete the transformation"
                  ].map((item, index) => (
                    <motion.li 
                      key={index} 
                      className="flex items-center text-foreground"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.5, delay: 0.5 + index * 0.1 }}
                    >
                      <motion.div
                        whileHover={{ scale: 1.2, rotate: 360 }}
                        transition={{ duration: 0.3 }}
                      >
                        <CheckCircle2 className="w-5 h-5 text-green-400 mr-3 flex-shrink-0" />
                      </motion.div>
                      {item}
                    </motion.li>
                  ))}
                </ul>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Curriculum Overview */}
      <AnimatedSection className="py-20 px-4 bg-card/30">
        <div className="container mx-auto max-w-6xl">
          <SectionHeader 
            title="Complete Curriculum" 
            subtitle="Six comprehensive modules designed to transform your startup into an investment-ready business"
          />
          
          <ProgressVisualization />
          
          <div className="mt-16">
            <FeatureList 
              features={curriculumModules}
              columns={2}
            />
          </div>

          {/* Program details */}
          <div className="mt-16 grid md:grid-cols-3 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <Card className="p-6 bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20 text-center">
                <BookOpen className="w-12 h-12 text-blue-500 mx-auto mb-4" />
                <h3 className="text-xl font-bold mb-2">12-Week Program</h3>
                <p className="text-muted-foreground">Intensive curriculum with weekly milestones and expert feedback</p>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
            >
              <Card className="p-6 bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20 text-center">
                <Users className="w-12 h-12 text-green-500 mx-auto mb-4" />
                <h3 className="text-xl font-bold mb-2">Expert Mentorship</h3>
                <p className="text-muted-foreground">1-on-1 guidance from successful founders and investors</p>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
            >
              <Card className="p-6 bg-gradient-to-br from-purple-500/10 to-purple-500/5 border-purple-500/20 text-center">
                <Trophy className="w-12 h-12 text-purple-500 mx-auto mb-4" />
                <h3 className="text-xl font-bold mb-2">Graduation Promise</h3>
                <p className="text-muted-foreground">ProofScore 70+ guaranteed or your money back</p>
              </Card>
            </motion.div>
          </div>
        </div>
      </AnimatedSection>

      {/* Pricing Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <AnimatedSection delay={0.2}>
            <SectionHeader 
              title="Transform Your Startup" 
              subtitle="Choose the program that fits your stage and ambition"
            />
          </AnimatedSection>

          <div className="grid md:grid-cols-2 gap-8 mt-12">
            {/* Standard Program */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <Card className="p-8 border-border hover:border-blue-500/50 transition-all duration-300 relative">
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold mb-2">ProofScaling Standard</h3>
                  <div className="text-4xl font-bold text-blue-500 mb-2">$2,997</div>
                  <p className="text-muted-foreground">12-week transformation program</p>
                </div>
                
                <ul className="space-y-3 mb-8">
                  {[
                    "Complete 6-module curriculum",
                    "Weekly group mentorship calls",
                    "Private community access",
                    "Templates & frameworks",
                    "Certificate of completion"
                  ].map((feature, index) => (
                    <li key={index} className="flex items-center">
                      <CheckCircle2 className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>

                <GradientButton className="w-full" size="lg">
                  Start Standard Program
                </GradientButton>
              </Card>
            </motion.div>

            {/* Premium Program */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <Card className="p-8 border-primary bg-gradient-to-br from-primary/5 to-primary/10 relative">
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground px-4 py-1">
                    <Crown className="w-4 h-4 mr-1" />
                    Most Popular
                  </Badge>
                </div>
                
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold mb-2">ProofScaling Premium</h3>
                  <div className="text-4xl font-bold text-primary mb-2">$4,997</div>
                  <p className="text-muted-foreground">Premium with 1-on-1 mentoring</p>
                </div>
                
                <ul className="space-y-3 mb-8">
                  {[
                    "Everything in Standard +",
                    "Weekly 1-on-1 mentor sessions",
                    "Personal success manager",
                    "Direct investor introductions",
                    "Money-back guarantee"
                  ].map((feature, index) => (
                    <li key={index} className="flex items-center">
                      <CheckCircle2 className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>

                <GradientButton className="w-full" size="lg">
                  Start Premium Program
                </GradientButton>
              </Card>
            </motion.div>
          </div>

          {/* Money-back guarantee */}
          <motion.div 
            className="text-center mt-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            <div className="inline-flex items-center space-x-3 bg-green-500/20 px-6 py-3 rounded-full border border-green-500/30">
              <Shield className="w-5 h-5 text-green-500" />
              <span className="text-sm font-medium">
                <span className="text-green-500 font-bold">ProofScore 70+ Guarantee:</span> Reach investor readiness or get your money back
              </span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 px-4 bg-gradient-to-br from-primary/10 via-background to-blue-500/10">
        <div className="container mx-auto max-w-4xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Ready to Build Something 
              <span className="bg-gradient-to-r from-blue-500 to-green-500 bg-clip-text text-transparent"> Investors Want?</span>
            </h2>
            
            <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
              Join 250+ founders who transformed their startups through ProofScaling. Start your 12-week journey to investor readiness today.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <GradientButton leftIcon={Rocket} rightIcon={ArrowRight} size="xl">
                Start Your Transformation
              </GradientButton>
              
              <motion.div whileHover={{ scale: 1.05 }}>
                <Button size="lg" variant="outline" className="text-lg px-8 py-4 h-auto">
                  Schedule a Call
                </Button>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}