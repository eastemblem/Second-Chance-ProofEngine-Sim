import { motion } from "framer-motion";
import { ArrowRight, Star, Users, TrendingUp, Shield, Zap, Crown, Award, DollarSign, Timer, Handshake, CheckCircle2, Target, Trophy, Rocket, PlayCircle, Brain, BookOpen, Lightbulb, Search, BarChart3, MessageSquare, Layers, Presentation, Gauge, CheckCircle, User, Lock } from "lucide-react";
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
import { VideoPlayer } from "@/components/proofscaling/video-player";
import { OutcomeCard } from "@/components/proofscaling/outcome-card";
import { TimelineCard } from "@/components/proofscaling/timeline-card";
import { TimelineLine } from "@/components/proofscaling/timeline-line";
import { InvestorTestimonial } from "@/components/proofscaling/investor-testimonial";
import { FeatureCardSimple } from "@/components/proofscaling/feature-card-simple";

// Timeline data
const timelineSteps = [
  {
    week: 0,
    title: "Diagnostic",
    description: "Comprehensive assessment of your startup's current state, identifying strengths and critical gaps in your business model.",
    icon: Search,
    weekColor: "bg-red-500"
  },
  {
    week: 1,
    title: "ProofPlan",
    description: "Strategic roadmap creation with prioritized experiments and validation frameworks tailored to your venture.",
    icon: Target,
    weekColor: "bg-orange-500"
  },
  {
    week: 2,
    title: "Commercial Test",
    description: "Execute market validation experiments to prove demand and refine your value proposition with real customers.",
    icon: BarChart3,
    weekColor: "bg-yellow-500"
  },
  {
    week: 3,
    title: "Desirability Interviews",
    description: "Conduct structured customer interviews to validate problem-solution fit and gather actionable insights.",
    icon: MessageSquare,
    weekColor: "bg-green-500"
  },
  {
    week: 4,
    title: "Feasibility Prototype",
    description: "Build and test minimum viable solutions to demonstrate technical and operational feasibility to investors.",
    icon: Layers,
    weekColor: "bg-blue-500"
  },
  {
    week: 5,
    title: "Traction Deck",
    description: "Compile validated proof points into a compelling investor presentation that showcases measurable progress.",
    icon: Presentation,
    weekColor: "bg-purple-500"
  },
  {
    week: 6,
    title: "Momentum Launch",
    description: "Execute go-to-market strategy with proven metrics, creating sustainable growth momentum for funding rounds.",
    icon: Gauge,
    weekColor: "bg-purple-600"
  }
];

// Investor testimonials data
const investorTestimonials = [
  {
    name: "Sarah Chen",
    title: "Investor @ Beyond Ventures",
    quote: "I'd funded teams before - ProofScaling gave me the hard numbers I needed to fund this one.",
    avatar: "SC"
  },
  {
    name: "Josh B.",
    title: "Cohort #07",
    quote: "Our landing-page smoke test hit 18% conversion in Week 2. That metric alone got us into Antler.",
    avatar: "JB"
  }
];

// ProofScaling features data
const proofScalingFeatures = [
  {
    title: "Self-Paced Learning",
    description: "4 weeks with full proof-first traction framework",
    icon: CheckCircle,
    gradientFrom: "from-purple-500",
    gradientTo: "to-orange-400"
  },
  {
    title: "1:1 Office Hours",
    description: "Direct access to exited, serial entrepreneurs",
    icon: User,
    gradientFrom: "from-blue-500",
    gradientTo: "to-purple-500"
  },
  {
    title: "ProofScaling Platform",
    description: "Full access worth over $40k annually",
    icon: Lock,
    gradientFrom: "from-pink-500",
    gradientTo: "to-red-400"
  }
];

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

      {/* Video and Outcomes Section */}
      <section className="py-20 px-4 bg-card/30">
        <div className="container mx-auto max-w-6xl">
          {/* Video Player */}
          <div className="mb-16">
            <VideoPlayer 
              title="Watch: ProofScaling Explained"
              subtitle="See how founders transform rejection into funding"
              onPlay={() => console.log('Video play clicked')}
            />
          </div>

          {/* Outcomes Text */}
          <div className="text-center mb-12">
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              ProofScaling doesn't just teach theory – it delivers measurable outcomes
            </p>
          </div>

          {/* Outcome Cards */}
          <div className="grid md:grid-cols-3 gap-8">
            <OutcomeCard 
              icon={TrendingUp}
              badge="$1m raised in 30 days"
              title="Founder A jumped from 40 → 70 ProofScore"
              description="and closed a $1m pre-seed round within 30 days."
              delay={0.1}
              gradientColor="from-purple-500 to-pink-500"
            />
            <OutcomeCard 
              icon={Target}
              badge="Weekly experiments"
              title="One flagship experiment per week"
              description="– smoke test, prototype, KPI dashboard. No fluff, all signal."
              delay={0.2}
              gradientColor="from-blue-500 to-purple-500"
            />
            <OutcomeCard 
              icon={Users}
              badge="75% success rate"
              title="75% of alumni receive inbound VC meetings"
              description="within a fortnight of publishing their ProofDeck."
              delay={0.3}
              gradientColor="from-green-500 to-blue-500"
            />
          </div>
        </div>
      </section>

      {/* 6-Week Transformation Journey */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl relative">
          <FloatingElements />
          <AnimatedSection delay={0.2}>
            <SectionHeader 
              title="Your 6-Week Transformation Journey" 
              subtitle="Each week builds systematic proof that investors can't ignore"
            />
          </AnimatedSection>

          <div className="relative mt-16 min-h-[1400px]">
            {/* Timeline Line */}
            <TimelineLine totalSteps={timelineSteps.length} />
            
            {/* Timeline Cards */}
            <div className="relative z-10">
              {timelineSteps.map((step, index) => (
                <TimelineCard
                  key={step.week}
                  week={step.week}
                  title={step.title}
                  description={step.description}
                  icon={step.icon}
                  isLeft={index % 2 === 0}
                  delay={0.3 + index * 0.1}
                  weekColor={step.weekColor}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Trusted by Investors */}
      <section className="py-20 px-4 bg-card/30">
        <div className="container mx-auto max-w-6xl">
          <AnimatedSection delay={0.2}>
            <SectionHeader 
              title="Trusted By The Leading Investors in MENA & GCC" 
              subtitle="See what industry leaders say about ProofScaling graduates"
            />
          </AnimatedSection>

          {/* Investor Testimonials */}
          <div className="grid md:grid-cols-2 gap-8 mt-12 mb-16">
            {investorTestimonials.map((testimonial, index) => (
              <InvestorTestimonial
                key={testimonial.name}
                name={testimonial.name}
                title={testimonial.title}
                quote={testimonial.quote}
                avatar={testimonial.avatar}
                delay={0.3 + index * 0.1}
              />
            ))}
          </div>

          <AnimatedSection delay={0.5}>
            <SectionHeader 
              title="What You Get Inside ProofScaling" 
              subtitle="Everything you need to build investor-ready proof in 6 weeks"
            />
          </AnimatedSection>

          {/* ProofScaling Features */}
          <div className="grid md:grid-cols-3 gap-8 mt-12">
            {proofScalingFeatures.map((feature, index) => (
              <FeatureCardSimple
                key={feature.title}
                title={feature.title}
                description={feature.description}
                icon={feature.icon}
                delay={0.6 + index * 0.1}
                gradientFrom={feature.gradientFrom}
                gradientTo={feature.gradientTo}
              />
            ))}
          </div>
        </div>
      </section>

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