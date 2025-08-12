import { motion } from "framer-motion";
import { ArrowRight, Check, Star, Users, TrendingUp, Shield, Zap, Target, Crown, Award, Briefcase, DollarSign, ChevronRight, PlayCircle, Rocket, BarChart3, Lock, Globe, MessageSquare, Calendar, Phone, Mail, CheckCircle2, Trophy, Lightbulb, FileText, PieChart, UserCheck, Timer, Handshake, TrendingDown, Clock } from "lucide-react";
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
                <Button size="lg" className="gradient-button text-lg px-8 py-4 h-auto rounded-full shadow-lg hover:shadow-xl transition-all duration-300">
                  <Rocket className="w-5 h-5 mr-2" />
                  Join Deal Room Now
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </motion.div>
              
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button size="lg" variant="outline" className="border-2 border-foreground text-foreground hover:bg-foreground hover:text-background text-lg px-8 py-4 h-auto rounded-full shadow-lg hover:shadow-xl transition-all duration-300">
                  <PlayCircle className="w-5 h-5 mr-2" />
                  Watch Success Stories
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
                  number: '87%', 
                  label: 'SUCCESS RATE', 
                  sublabel: 'Founders get funded within 90 days',
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
                  number: '300+', 
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
                    <div className={`text-3xl font-bold mb-2 ${stat.color}`}>{stat.number}</div>
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
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto mb-8">
                {[
                  { name: '500Global', color: 'bg-gradient-to-r from-purple-500/20 to-blue-500/20 border-purple-500/30' },
                  { name: 'Plug and Play Tech Centre', color: 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 border-blue-500/30' },
                  { name: 'Antler', color: 'bg-gradient-to-r from-primary-gold/20 to-yellow-500/20 border-primary-gold/30' },
                  { name: 'FlateLabs', color: 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-purple-500/30' },
                  { name: 'Innoway', color: 'bg-gradient-to-r from-green-500/20 to-blue-500/20 border-green-500/30' },
                  { name: 'Pleny', color: 'bg-gradient-to-r from-purple-500/20 to-primary-gold/20 border-purple-500/30' },
                  { name: 'East Emblem', color: 'bg-gradient-to-r from-primary-gold/20 to-orange-500/20 border-primary-gold/30' },
                  { name: 'Beyond Impact', color: 'bg-gradient-to-r from-blue-500/20 to-green-500/20 border-blue-500/30' }
                ].map((partner, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4, delay: 0.4 + index * 0.05 }}
                    whileHover={{ scale: 1.05 }}
                  >
                    <Card className={`p-4 text-center ${partner.color} border backdrop-blur-sm hover:bg-card/80 transition-all duration-300`}>
                      <div className="text-sm font-medium text-foreground">{partner.name}</div>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </motion.div>
            
            {/* Success story cards */}
            <motion.div 
              className="grid md:grid-cols-3 gap-8 mb-16"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.5 }}
            >
              {[
                {
                  company: 'TechFlow AI',
                  achievement: 'Raised $3.2M Series A in 45 days',
                  description: 'Used Deal Room validation data to secure oversubscribed funding round',
                  raised: '$3.2M',
                  timeline: '45 days',
                  investors: '5',
                  icon: <TrendingUp className="w-8 h-8" />,
                  bgColor: 'bg-purple-500/10',
                  borderColor: 'border-purple-500/20',
                  accentColor: 'text-purple-400'
                },
                {
                  company: 'GreenEnergy Corp',
                  achievement: 'Secured 3 strategic investors same week',
                  description: 'Corporate partnerships led to immediate funding opportunities',
                  raised: '$1.8M',
                  timeline: '7 days',
                  investors: '3',
                  icon: <Target className="w-8 h-8" />,
                  bgColor: 'bg-green-500/10',
                  borderColor: 'border-green-500/20',
                  accentColor: 'text-green-400'
                },
                {
                  company: 'HealthTech Innovations',
                  achievement: 'Closed oversubscribed seed round',
                  description: 'Proof-based metrics convinced 12 investors to participate',
                  raised: '$2.1M',
                  timeline: '21 days',
                  investors: '12',
                  icon: <Target className="w-8 h-8" />,
                  bgColor: 'bg-primary-gold/10',
                  borderColor: 'border-primary-gold/20',
                  accentColor: 'text-primary-gold'
                }
              ].map((story, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.6 + index * 0.1 }}
                  whileHover={{ y: -10, scale: 1.02 }}
                >
                  <Card className={`p-8 ${story.bgColor} ${story.borderColor} border bg-card/50 backdrop-blur-sm hover:bg-card/80 transition-all duration-300 h-full`}>
                    <div className={`w-16 h-16 mx-auto mb-6 rounded-2xl ${story.bgColor} flex items-center justify-center ${story.accentColor}`}>
                      {story.icon}
                    </div>
                    <h3 className="text-xl font-bold mb-3 text-foreground">{story.company}</h3>
                    <p className={`text-lg font-semibold mb-4 ${story.accentColor}`}>{story.achievement}</p>
                    <p className="text-sm text-muted-foreground mb-6">{story.description}</p>
                    
                    <div className="flex justify-between items-center pt-4 border-t border-border">
                      <div className="text-center">
                        <div className={`text-2xl font-bold ${story.accentColor}`}>{story.raised}</div>
                        <div className="text-xs text-muted-foreground">Raised</div>
                      </div>
                      <div className="text-center">
                        <div className={`text-2xl font-bold ${story.accentColor}`}>{story.timeline}</div>
                        <div className="text-xs text-muted-foreground">Timeline</div>
                      </div>
                      <div className="text-center">
                        <div className={`text-2xl font-bold ${story.accentColor}`}>{story.investors}</div>
                        <div className="text-xs text-muted-foreground">Investors</div>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </motion.div>

            {/* Testimonials */}
            <motion.div 
              className="grid md:grid-cols-3 gap-8"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.8 }}
            >
              {[
                {
                  name: 'Sarah Chen',
                  title: 'CEO @ HealthTech AI',
                  proofScore: '92',
                  quote: '"The Deal Room cut our fundraising timeline from 8 months to 6 weeks. The quality of investors was exceptional."',
                  result: '$1.2M Series A',
                  avatar: 'SC',
                  bgColor: 'bg-purple-500',
                  rating: 5
                },
                {
                  name: 'Marcus Rodriguez',
                  title: 'Founder @ FinFlow',
                  proofScore: '85',
                  quote: '"Within 24 hours of joining, I had 3 investor meetings scheduled. This platform is a game-changer."',
                  result: '$500K Pre-seed',
                  avatar: 'MR',
                  bgColor: 'bg-primary-gold',
                  rating: 5
                },
                {
                  name: 'Priya Patel',
                  title: 'Co-founder @ EduTech Solutions',
                  proofScore: '89',
                  quote: '"The validation data made our pitch bulletproof. VCs loved the evidence-backed approach."',
                  result: '$800K Seed',
                  avatar: 'PP',
                  bgColor: 'bg-primary',
                  rating: 5
                }
              ].map((testimonial, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.9 + index * 0.1 }}
                  whileHover={{ y: -5, scale: 1.02 }}
                >
                  <Card className="p-6 bg-card/50 backdrop-blur-sm hover:bg-card/80 transition-all duration-300 h-full">
                    <div className="flex items-start mb-4">
                      <div className={`w-12 h-12 rounded-full ${testimonial.bgColor} flex items-center justify-center text-white font-bold text-lg mr-4 flex-shrink-0`}>
                        {testimonial.avatar}
                      </div>
                      <div className="text-left">
                        <h4 className="font-semibold text-foreground text-lg">{testimonial.name}</h4>
                        <p className="text-sm text-muted-foreground">{testimonial.title}</p>
                        <p className="text-sm text-primary font-medium">ProofScore: {testimonial.proofScore}</p>
                      </div>
                    </div>
                    
                    <p className="text-sm text-muted-foreground mb-4 italic">{testimonial.quote}</p>
                    
                    <div className="flex items-center justify-between pt-4 border-t border-border">
                      <div className="flex">
                        {[...Array(testimonial.rating)].map((_, i) => (
                          <Star key={i} className="w-4 h-4 fill-primary-gold text-primary-gold" />
                        ))}
                      </div>
                      <div className="text-sm font-semibold text-primary">{testimonial.result}</div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
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
                description: 'Direct access to 300+ pre-qualified, actively investing VCs and angels',
                benefit: 'Skip the cold outreach',
                bgColor: 'bg-purple-500/10',
                iconBgColor: 'bg-gradient-to-br from-purple-500 to-primary-gold',
                borderColor: 'border-purple-500/20',
                benefitColor: 'text-primary'
              },
              {
                icon: <Zap className="w-8 h-8" />,
                title: 'Lightning-Fast Introductions',
                description: 'Get warm introductions within 48 hours of joining the Deal Room',
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
      <section className="py-20 px-4 bg-gradient-to-br from-primary via-primary-gold to-orange-500">
        <div className="container mx-auto max-w-2xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="text-center mb-12"
          >
            <motion.h2 
              className="text-4xl md:text-5xl font-bold mb-6 text-white"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              Choose Your Access Level
            </motion.h2>
            <motion.p 
              className="text-lg text-white/90 max-w-2xl mx-auto mb-8"
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
              <Badge className="bg-white/20 text-white border-white/30 px-6 py-2 text-sm font-medium backdrop-blur-sm">
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
            className="max-w-lg mx-auto mb-8"
          >
            <Card className="p-8 bg-white shadow-2xl rounded-3xl border-0 overflow-hidden relative">
              {/* Annual Membership Badge */}
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <Badge className="bg-gradient-to-r from-primary-gold to-orange-500 text-white px-6 py-2 text-sm font-semibold rounded-full">
                  Annual Membership
                </Badge>
              </div>

              <div className="text-center mb-8 pt-4">
                <h3 className="text-3xl font-bold mb-4 text-gray-900">Deal Room Access</h3>
                <div className="mb-2">
                  <span className="text-6xl font-bold text-gray-900">$99</span>
                </div>
                <div className="text-gray-500 mb-1">
                  <span className="line-through text-lg">$199</span>
                </div>
                <p className="text-gray-600">per year</p>
              </div>

              <ul className="space-y-4 mb-8">
                {[
                  'Unlimited investor introductions',
                  'Complete ProofVault access',
                  'Priority deal flow placement',
                  'Dedicated success support',
                  'Corporate partnership opportunities',
                  'Quarterly demo day invitations',
                  'Expert network access',
                  'Due diligence fast-track'
                ].map((feature, index) => (
                  <motion.li 
                    key={index} 
                    className="flex items-center space-x-3"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.6 + index * 0.05 }}
                  >
                    <CheckCircle2 className="text-green-500 h-5 w-5 flex-shrink-0" />
                    <span className="text-gray-700">{feature}</span>
                  </motion.li>
                ))}
              </ul>

              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button className="w-full bg-gradient-to-r from-primary via-primary-gold to-orange-500 hover:from-primary/90 hover:via-primary-gold/90 hover:to-orange-500/90 text-white text-lg py-4 h-auto rounded-full font-semibold shadow-lg" size="lg">
                  Join Deal Room
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </motion.div>
            </Card>
          </motion.div>

          {/* Guarantee Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="max-w-md mx-auto"
          >
            <Card className="p-6 bg-white/10 backdrop-blur-sm border-white/20 rounded-2xl">
              <div className="flex items-center space-x-4 text-white">
                <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                  <Shield className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-lg">100% Success Guarantee</h4>
                  <p className="text-white/90 text-sm">Get matched with investors or full refund within 90 days</p>
                </div>
              </div>
            </Card>
          </motion.div>
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