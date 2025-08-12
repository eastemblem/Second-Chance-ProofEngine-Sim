import { motion } from "framer-motion";
import { ArrowRight, Check, Star, Users, TrendingUp, Shield, Zap, Target, Crown, Award, Briefcase, DollarSign, ChevronRight, PlayCircle, Rocket, BarChart3, Lock, Globe, MessageSquare, Calendar, Phone, Mail, CheckCircle2, Trophy, Lightbulb, FileText, PieChart, UserCheck, Timer, Handshake, TrendingDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function DealRoomSalesPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Hero Section */}
      <section className="relative py-20 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-primary-gold/10" />
        <div className="container mx-auto max-w-5xl relative">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <Badge className="mb-6 bg-primary-gold/20 text-primary-gold border-primary-gold/30 px-4 py-2 text-sm font-medium">
              Limited Deal Room Access - Curated Investment
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
              Deal Room
            </h1>
            <h2 className="text-2xl md:text-3xl font-semibold mb-6 gradient-text">
              Where Proof Meets Capital
            </h2>
            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-3xl mx-auto leading-relaxed">
              Exclusive network where validated startups connect with qualified investors. 
              Your ProofScore qualifies you for curated investment opportunities.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Button size="lg" className="gradient-button text-lg px-8 py-4 h-auto">
                Get Investment Ready
              </Button>
              <Button size="lg" variant="outline" className="border-primary-gold text-primary-gold hover:bg-primary-gold hover:text-black text-lg px-8 py-4 h-auto">
                Watch Product Demo
              </Button>
            </div>
            
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
              {[
                { number: '87%', label: 'Success Rate', color: 'text-green-400' },
                { number: '$2.4M', label: 'Average Round', color: 'text-blue-400' },
                { number: '14', label: 'Days to Close', color: 'text-primary-gold' },
                { number: '300+', label: 'Funded Startups', color: 'text-primary' }
              ].map((stat, index) => (
                <div key={index} className="text-center">
                  <div className={`text-3xl font-bold mb-1 ${stat.color}`}>{stat.number}</div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Trusted by Top Founders */}
      <section className="py-16 px-4 bg-card/30">
        <div className="container mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-8">Trusted by Top Founders</h2>
            
            {/* Founder Profile Cards */}
            <div className="grid md:grid-cols-3 gap-6 mb-16">
              {[
                {
                  name: 'TechFlow',
                  subtitle: 'AI-Powered Analytics',
                  amount: '$2.1M',
                  stage: 'Series A',
                  avatar: '🚀',
                  bgColor: 'bg-blue-500/10',
                  borderColor: 'border-blue-500/20'
                },
                {
                  name: 'GreenScale',
                  subtitle: 'Sustainable Energy',
                  amount: '$1.8M',
                  stage: 'Seed Round',
                  avatar: '🌱',
                  bgColor: 'bg-green-500/10',
                  borderColor: 'border-green-500/20'
                },
                {
                  name: 'HealthTech Connect',
                  subtitle: 'Digital Healthcare',
                  amount: '$3.2M',
                  stage: 'Series A',
                  avatar: '❤️',
                  bgColor: 'bg-red-500/10',
                  borderColor: 'border-red-500/20'
                }
              ].map((founder, index) => (
                <Card key={index} className={`p-6 ${founder.bgColor} ${founder.borderColor} border bg-card/50`}>
                  <div className="text-center">
                    <div className="w-12 h-12 bg-background rounded-full flex items-center justify-center text-2xl mb-4 mx-auto border">
                      {founder.avatar}
                    </div>
                    <h3 className="font-bold mb-1">{founder.name}</h3>
                    <p className="text-sm text-muted-foreground mb-3">{founder.subtitle}</p>
                    <div className="flex justify-between items-center text-sm">
                      <span className="font-semibold text-primary-gold">{founder.amount}</span>
                      <span className="text-muted-foreground">{founder.stage}</span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {/* Testimonials */}
            <div className="grid md:grid-cols-3 gap-6">
              {[
                {
                  name: 'Alex Chen',
                  company: 'TechFlow',
                  quote: 'Deal Room connected us with the perfect investors. Closed our Series A in 6 weeks.',
                  avatar: 'AC'
                },
                {
                  name: 'Sarah Martinez',
                  company: 'GreenScale',
                  quote: 'The curated network saved us months of outreach. Highly recommend.',
                  avatar: 'SM'
                },
                {
                  name: 'David Kim',
                  company: 'HealthTech',
                  quote: 'Professional process from start to finish. Great investor matching.',
                  avatar: 'DK'
                }
              ].map((testimonial, index) => (
                <Card key={index} className="p-6 bg-card border-border">
                  <div className="flex items-start space-x-4">
                    <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white text-sm font-bold">
                      {testimonial.avatar}
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-muted-foreground text-sm mb-2">"{testimonial.quote}"</p>
                      <div>
                        <div className="font-semibold text-sm">{testimonial.name}</div>
                        <div className="text-muted-foreground text-xs">{testimonial.company}</div>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
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
            <h2 className="text-4xl md:text-5xl font-bold mb-6">Why Our Deal Room Works</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Four key advantages that set successful founders apart
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8 mb-16">
            {[
              {
                icon: '📊',
                title: 'AI-Powered Matching',
                description: 'Advanced algorithms match startups with investors based on industry, stage, check size, and portfolio fit.',
                bgColor: 'bg-blue-500/10',
                textColor: 'text-blue-400',
                borderColor: 'border-blue-500/20'
              },
              {
                icon: '🎯',
                title: 'Curated Investor Network',
                description: 'Access to pre-qualified investors who actively invest in your sector and stage.',
                bgColor: 'bg-green-500/10',
                textColor: 'text-green-400',
                borderColor: 'border-green-500/20'
              },
              {
                icon: '📈',
                title: 'Pitch Optimization',
                description: 'Data-driven improvements to your pitch deck and materials based on successful raises.',
                bgColor: 'bg-primary-gold/10',
                textColor: 'text-primary-gold',
                borderColor: 'border-primary-gold/20'
              },
              {
                icon: '🤝',
                title: 'Strategic Partnerships',
                description: 'Beyond funding - access to strategic partners, customers, and growth opportunities.',
                bgColor: 'bg-primary/10',
                textColor: 'text-primary',
                borderColor: 'border-primary/20'
              }
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 + index * 0.1 }}
              >
                <Card className={`p-8 h-full ${feature.bgColor} ${feature.borderColor} border bg-card`}>
                  <div className="flex items-start space-x-4">
                    <div className="text-4xl mb-4">{feature.icon}</div>
                    <div className="flex-1">
                      <h3 className={`text-xl font-bold mb-3 ${feature.textColor}`}>{feature.title}</h3>
                      <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Choose Your Access Level */}
      <section className="py-20 px-4 bg-gradient-to-br from-primary/20 via-background to-primary-gold/20">
        <div className="container mx-auto max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6">Choose Your Access Level</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Get started with our proven fundraising system
            </p>
          </motion.div>

          <div className="max-w-md mx-auto">
            <Card className="p-8 bg-card border-primary-gold/20 shadow-2xl">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold mb-2">Deal Room Access</h3>
                <div className="mb-4">
                  <span className="text-5xl font-bold gradient-text">$99</span>
                  <span className="text-muted-foreground ml-2">one-time</span>
                </div>
                <p className="text-muted-foreground">Complete access to our investor network and resources</p>
              </div>
              
              <ul className="space-y-4 mb-8">
                {[
                  "Curated investor matching",
                  "Pitch deck optimization",
                  "Direct investor introductions",
                  "Fundraising strategy sessions",
                  "Deal room dashboard access",
                  "Expert mentorship calls",
                  "Success metrics tracking"
                ].map((feature, i) => (
                  <li key={i} className="flex items-start">
                    <Check className="w-5 h-5 text-primary-gold mr-3 flex-shrink-0 mt-0.5" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              
              <Button 
                size="lg" 
                className="w-full h-12 gradient-button text-lg font-semibold"
              >
                Get Started Now
              </Button>
              
              <p className="text-center text-sm text-muted-foreground mt-4">
                30-day money-back guarantee • No monthly fees
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Ready to Accelerate */}
      <section className="py-20 px-4 bg-card/30">
        <div className="container mx-auto max-w-4xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.2 }}
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Ready to <span className="gradient-text">Accelerate</span> Your Fundraising?
            </h2>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Join 300+ startups that have successfully raised capital through our Deal Room
            </p>
            
            <Button size="lg" className="gradient-button text-lg px-12 py-6 h-auto mb-8">
              Join Deal Room Today
            </Button>
            
            <div className="bg-gradient-to-r from-primary/10 to-primary-gold/10 rounded-2xl p-8 max-w-2xl mx-auto border border-primary-gold/20">
              <div className="flex items-center justify-center space-x-8 text-sm text-muted-foreground">
                <div className="flex items-center">
                  <CheckCircle2 className="w-5 h-5 text-primary-gold mr-2" />
                  <span>Instant Access</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle2 className="w-5 h-5 text-primary-gold mr-2" />
                  <span>30-Day Guarantee</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle2 className="w-5 h-5 text-primary-gold mr-2" />
                  <span>Expert Support</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}