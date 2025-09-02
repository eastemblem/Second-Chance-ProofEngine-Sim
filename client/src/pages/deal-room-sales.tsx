import { motion } from "framer-motion";
import { useState } from "react";
import { ArrowRight, Star, Users, TrendingUp, Shield, Zap, Crown, Award, DollarSign, Timer, Handshake, CheckCircle2, Target, Trophy, Rocket, PlayCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmailVerificationPopup } from "@/components/ui/email-verification-popup";

// Import reusable components
import { AnimatedSection } from "@/components/deal-room/animated-section";
import { SectionHeader } from "@/components/deal-room/section-header";
import { MetricCard } from "@/components/deal-room/metric-card";
import { FeatureList } from "@/components/deal-room/feature-list";
import { GradientButton } from "@/components/deal-room/gradient-button";
import { TestimonialCard } from "@/components/deal-room/testimonial-card";
import { LogoCarousel } from "@/components/deal-room/logo-carousel";
import { BadgeWithIcon } from "@/components/deal-room/badge-with-icon";
import { AnimatedCounter } from "@/components/deal-room/animated-counter";
import { FloatingElements } from "@/components/deal-room/floating-elements";
import { SuccessIndicator } from "@/components/deal-room/success-indicator";
import { ProgressVisualization } from "@/components/deal-room/progress-visualization";

// Data constants
const heroMetrics = [
  { value: "300%", label: "Success Rate", delay: 0.7 },
  { value: "Founders", label: "more likely to get first meeting", delay: 0.8 },
  { value: "14", label: "Days", delay: 0.9 },
  { value: "50+", label: "Active Investors", delay: 1.0 }
];

const partnerCompanies = [
  { name: "East Emblem", logo: "/assets/logos/east-emblem-logo.png" },
  { name: "Plug and Play Tech Centre", logo: "/assets/logos/plug-and-play-logo.png" },
  { name: "Founders Live", logo: "/assets/logos/founders-live.png" },
  { name: "500Global", logo: "/assets/logos/500-global.png" }
];

const testimonials = [
  {
    name: "Sarah Chen",
    title: "CEO & Founder",
    company: "FinTech Innovations",
    proofScore: 78,
    quote: "The Deal Room connected us with the perfect investors who understood our market. We closed our Series A in just 6 weeks.",
    rating: 5,
    result: "$3.2M Raised",
    avatar: "SC"
  },
  {
    name: "Marcus Rodriguez",
    title: "Co-Founder",
    company: "GreenTech Solutions",
    proofScore: 82,
    quote: "Having our ProofScore validated gave investors confidence. The warm introductions made all the difference.",
    rating: 5,
    result: "$1.8M Raised",
    avatar: "MR"
  },
  {
    name: "Emily Foster",
    title: "Founder",
    company: "HealthTech AI",
    proofScore: 85,
    quote: "The strategic partnerships we gained through Deal Room were as valuable as the funding itself.",
    rating: 5,
    result: "$4.1M Raised",
    avatar: "EF"
  }
];

const features = [
  'Unlimited investor introductions',
  'Complete ProofVault access',
  'Priority deal flow placement',
  'Dedicated success support',
  'Corporate partnership opportunities',
  'Quarterly demo day invitations',
  'Expert network access',
  'Due diligence fast-track'
];

export default function DealRoomSalesPage() {
  const [showEmailPopup, setShowEmailPopup] = useState(false);

  const handleJoinClick = () => {
    setShowEmailPopup(true);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Hero Section */}
      <section className="relative py-20 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-primary-gold/10" />
        <FloatingElements />
        <div className="container mx-auto max-w-5xl relative">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            {/* Badge with crown icons */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <Badge className="mb-8 bg-primary-gold/20 text-primary-gold border-primary-gold/30 px-6 py-3 text-sm font-medium">
                <Crown className="w-4 h-4 mr-2" />
                Exclusive Deal Room Access - Limited to 100 Founders
                <Crown className="w-4 h-4 ml-2" />
              </Badge>
            </motion.div>

            {/* Main heading with gradient */}
            <motion.h1 
              className="text-5xl md:text-7xl font-bold mb-6 leading-tight bg-gradient-to-r from-primary via-primary-gold to-primary bg-clip-text text-transparent"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              Deal Room
            </motion.h1>

            {/* Subheading */}
            <motion.h2 
              className="text-2xl md:text-4xl font-bold mb-8 text-foreground"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              Where Proof Meets Capital
            </motion.h2>

            {/* Description with highlighted text */}
            <motion.p 
              className="text-lg md:text-xl text-muted-foreground mb-10 max-w-3xl mx-auto leading-relaxed"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              Join the <span className="text-primary font-semibold">most exclusive network</span> of validated startups. Get 
              direct access to top-tier investors who understand the value of evidence-based ventures.
            </motion.p>

            {/* Animated buttons */}
            <motion.div 
              className="flex flex-col sm:flex-row gap-4 justify-center mb-16"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
            >
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button 
                  onClick={handleJoinClick}
                  size="lg" 
                  className="gradient-button text-lg px-8 py-4 h-auto rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  <Rocket className="w-5 h-5 mr-2" />
                  Join Deal Room Now
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </motion.div>
              

            </motion.div>
            
            {/* Stats cards with icons */}
            <motion.div 
              className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-5xl mx-auto"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
            >
              {[
                { 
                  number: '300%', 
                  label: 'SUCCESS RATE', 
                  sublabel: 'Founders more likely to get first meeting',
                  color: 'text-green-400',
                  bgColor: 'bg-green-500/10',
                  borderColor: 'border-green-500/20',
                  icon: <Trophy className="w-6 h-6" />
                },
                { 
                  number: '$2.4M', 
                  label: 'AVG. RAISE', 
                  sublabel: 'Per successful introduction',
                  color: 'text-primary',
                  bgColor: 'bg-primary/10',
                  borderColor: 'border-primary/20',
                  icon: <TrendingUp className="w-6 h-6" />
                },
                { 
                  number: '14', 
                  label: 'DAYS AVG', 
                  sublabel: 'From intro to term sheet',
                  color: 'text-primary-gold',
                  bgColor: 'bg-primary-gold/10',
                  borderColor: 'border-primary-gold/20',
                  icon: <Timer className="w-6 h-6" />
                },
                { 
                  number: '50+', 
                  label: 'ACTIVE INVESTORS', 
                  sublabel: 'Ready to invest right now',
                  color: 'text-blue-400',
                  bgColor: 'bg-blue-500/10',
                  borderColor: 'border-blue-500/20',
                  icon: <Users className="w-6 h-6" />
                }
              ].map((stat, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.7 + index * 0.1 }}
                  whileHover={{ y: -5, scale: 1.02 }}
                >
                  <Card className={`p-6 text-center ${stat.bgColor} ${stat.borderColor} border bg-card/50 backdrop-blur-sm hover:bg-card/80 transition-all duration-300`}>
                    <div className={`w-12 h-12 mx-auto mb-4 rounded-2xl ${stat.bgColor} flex items-center justify-center ${stat.color}`}>
                      {stat.icon}
                    </div>
                    <AnimatedCounter 
                      value={stat.number}
                      className={`text-3xl font-bold mb-2 ${stat.color}`}
                      duration={2}
                      delay={0.2 + index * 0.1}
                    />
                    <div className="text-sm font-semibold text-foreground mb-1">{stat.label}</div>
                    <div className="text-xs text-muted-foreground">{stat.sublabel}</div>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Trusted by Top Founders */}
      <section className="py-20 px-4 bg-card/30">
        <div className="container mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-center mb-16"
          >
            {/* Main heading */}
            <motion.h2 
              className="text-4xl md:text-5xl font-bold mb-6 text-foreground"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              Trusted by Top Founders
            </motion.h2>
            
            {/* Subtitle */}
            <motion.p 
              className="text-lg text-muted-foreground mb-12 max-w-2xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              See how validated startups are raising faster and bigger rounds through the Deal Room
            </motion.p>

            {/* Partner logos section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="mb-16"
            >
              <p className="text-sm text-muted-foreground mb-8">
                Trusted by leading accelerators and partners:
              </p>
              
              <LogoCarousel companies={partnerCompanies} autoScrollSpeed={4000} />
            </motion.div>
            


            {/* Testimonials */}
            <AnimatedSection delay={0.8} className="grid md:grid-cols-3 gap-8">
              {testimonials.map((testimonial, index) => (
                <TestimonialCard
                  key={testimonial.name}
                  testimonial={{
                    ...testimonial,
                    company: testimonial.company,
                    proofScore: testimonial.proofScore
                  }}
                  delay={0.9 + index * 0.1}
                />
              ))}
            </AnimatedSection>
          </motion.div>
        </div>
      </section>

      {/* Why Our Deal Room Works */}
      <section className="py-20 px-4 bg-background">
        <div className="container mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="text-center mb-16"
          >
            <motion.h2 
              className="text-4xl md:text-5xl font-bold mb-6 text-foreground"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              Why Our Deal Room Works
            </motion.h2>
            <motion.p 
              className="text-lg text-muted-foreground max-w-2xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              Our proven system connects validated startups with the right investors at the perfect time
            </motion.p>
          </motion.div>

          <motion.div 
            className="grid md:grid-cols-2 gap-8 mb-16"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            {[
              {
                icon: <Crown className="w-8 h-8" />,
                title: 'VIP Investor Network',
                description: 'Direct access to 50+ pre-qualified, actively investing VCs and angels',
                benefit: 'Skip the cold outreach',
                bgColor: 'bg-purple-500/10',
                iconBgColor: 'bg-gradient-to-br from-purple-500 to-primary-gold',
                borderColor: 'border-purple-500/20',
                benefitColor: 'text-primary'
              },
              {
                icon: <Zap className="w-8 h-8" />,
                title: 'Lightning-Fast Introductions',
                description: 'Get warm introductions within 3 days of your Deal Room application being submitted',
                benefit: '2x faster than traditional methods',
                bgColor: 'bg-primary-gold/10',
                iconBgColor: 'bg-gradient-to-br from-primary-gold to-orange-500',
                borderColor: 'border-primary-gold/20',
                benefitColor: 'text-primary'
              },
              {
                icon: <Shield className="w-8 h-8" />,
                title: 'Due Diligence Ready',
                description: 'Your ProofVault contains everything investors need for quick decisions',
                benefit: 'Reduce diligence time by 75%',
                bgColor: 'bg-blue-500/10',
                iconBgColor: 'bg-gradient-to-br from-blue-500 to-purple-500',
                borderColor: 'border-blue-500/20',
                benefitColor: 'text-primary'
              },
              {
                icon: <Handshake className="w-8 h-8" />,
                title: 'Strategic Partnerships',
                description: 'Connect with Fortune 500 companies looking for innovation partners',
                benefit: 'Revenue + funding opportunities',
                bgColor: 'bg-green-500/10',
                iconBgColor: 'bg-gradient-to-br from-green-500 to-primary-gold',
                borderColor: 'border-green-500/20',
                benefitColor: 'text-primary'
              }
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.5 + index * 0.1 }}
                whileHover={{ y: -10, scale: 1.02 }}
              >
                <Card className={`p-8 ${feature.bgColor} ${feature.borderColor} border bg-card/50 backdrop-blur-sm hover:bg-card/80 transition-all duration-300 h-full`}>
                  <div className="text-left">
                    <div className={`w-16 h-16 rounded-2xl ${feature.iconBgColor} flex items-center justify-center text-white mb-6`}>
                      {feature.icon}
                    </div>
                    <h3 className="text-xl font-bold mb-4 text-foreground">{feature.title}</h3>
                    <p className="text-muted-foreground mb-6 leading-relaxed">{feature.description}</p>
                    <div className={`flex items-center ${feature.benefitColor} text-sm font-semibold`}>
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      {feature.benefit}
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Choose Your Access Level */}
      <section className="py-20 px-4 bg-gradient-to-br from-primary/20 via-background to-primary-gold/20">
        <div className="container mx-auto max-w-2xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="text-center mb-12"
          >
            <motion.h2 
              className="text-4xl md:text-5xl font-bold mb-6 text-foreground"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              Choose Your Access Level
            </motion.h2>
            <motion.p 
              className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              Investment in your success. Join thousands of founders who've accelerated their fundraising
            </motion.p>

            {/* Limited Time Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <Badge className="bg-primary/10 text-primary border-primary/20 px-6 py-2 text-sm font-medium backdrop-blur-sm">
                <Timer className="w-4 h-4 mr-2" />
                Limited Time: 50% Off All Plans
              </Badge>
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            whileHover={{ y: -5 }}
            className="max-w-lg mx-auto mb-8 relative"
          >
            {/* Annual Membership Badge - positioned with proper spacing */}
            <div className="flex justify-center mb-4">
              <Badge className="bg-gradient-to-r from-primary-gold to-orange-500 text-white px-6 py-2 text-sm font-semibold rounded-full">
                Annual Membership
              </Badge>
            </div>

            <Card className="p-8 bg-card shadow-2xl rounded-3xl border border-border">
              <div className="text-center mb-8">
                <h3 className="text-3xl font-bold mb-4 text-foreground">Deal Room Access</h3>
                <div className="mb-2">
                  <span className="text-6xl font-bold text-foreground">$99</span>
                </div>
                <div className="text-muted-foreground mb-1">
                  <span className="line-through text-lg">$199</span>
                </div>
                <p className="text-muted-foreground">per year</p>
              </div>

              <FeatureList 
                features={features}
                startDelay={0.6}
                className="mb-8"
                iconColor="text-green-500"
              />

              <div className="flex justify-center">
                <GradientButton rightIcon={ArrowRight} size="lg" onClick={handleJoinClick}>
                  Join Deal Room
                </GradientButton>
              </div>
            </Card>
          </motion.div>

          {/* Guarantee Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="max-w-md mx-auto"
          >
            <Card className="p-6 bg-card/50 backdrop-blur-sm border-border rounded-2xl">
              <div className="flex items-center space-x-4 text-foreground">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Shield className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h4 className="font-bold text-lg">100% Success Guarantee</h4>
                  <p className="text-muted-foreground text-sm">Unlock your proof or full refund within 90 days</p>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>
      </section>



      {/* Ready to Accelerate */}
      <section className="py-20 px-4 bg-gradient-to-br from-primary/5 via-background to-primary-gold/5">
        <div className="container mx-auto max-w-4xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <motion.h2 
              className="text-4xl md:text-6xl font-bold mb-6 text-foreground"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              Ready to <span className="bg-gradient-to-r from-primary via-primary-gold to-orange-500 bg-clip-text text-transparent">Accelerate</span> Your Fundraising?
            </motion.h2>
            
            <motion.p 
              className="text-lg text-muted-foreground mb-10 max-w-3xl mx-auto leading-relaxed"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              Join the most exclusive network of validated startups and get direct access to investors who understand the value of evidence-based ventures.
            </motion.p>
            
            <AnimatedSection delay={0.3} className="mb-10 flex justify-center">
              <GradientButton leftIcon={Crown} rightIcon={ArrowRight} size="xl" onClick={handleJoinClick}>
                Join Deal Room Now
              </GradientButton>
            </AnimatedSection>
            
            <AnimatedSection delay={0.4} className="flex flex-col md:flex-row items-center justify-center gap-8 mb-12 text-sm">
              <BadgeWithIcon text="No setup fees" icon={CheckCircle2} variant="default" />
              <BadgeWithIcon text="Cancel anytime" icon={CheckCircle2} variant="default" />
              <BadgeWithIcon text="Money-back guarantee" icon={CheckCircle2} variant="default" />
            </AnimatedSection>

            {/* Limited spots banner */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="max-w-2xl mx-auto"
            >
              <Card className="p-6 bg-gradient-to-r from-primary/10 to-primary-gold/10 border border-primary/20 rounded-2xl backdrop-blur-sm">
                <div className="flex items-center justify-center text-center">
                  <Timer className="w-6 h-6 text-primary mr-3 flex-shrink-0" />
                  <p className="text-primary font-semibold">
                    <span className="text-base">Limited spots available - Only </span>
                    <span className="text-lg font-bold">43</span>
                    <span className="text-base"> remaining this month</span>
                  </p>
                </div>
              </Card>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Email Verification Popup */}
      <EmailVerificationPopup 
        isOpen={showEmailPopup}
        onClose={() => setShowEmailPopup(false)}
      />
    </div>
  );
}