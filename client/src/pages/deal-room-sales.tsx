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
        <div className="container mx-auto max-w-6xl relative">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-12"
          >
            <Badge className="mb-6 bg-primary-gold/20 text-primary-gold border-primary-gold/30 px-6 py-2 text-lg font-semibold">
              <Crown className="w-5 h-5 mr-2" />
              PREMIUM DEAL ROOM ACCESS
            </Badge>
            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
              Welcome to the
              <span className="block gradient-text">Deal Room</span>
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto leading-relaxed">
              Your ProofScore qualifies you for our exclusive investor network. Connect with pre-vetted investors, 
              access premium resources, and accelerate your fundraising journey.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="gradient-button text-lg px-8 py-6 h-auto">
                <Rocket className="w-6 h-6 mr-2" />
                Start Your Journey
              </Button>
              <Button size="lg" variant="outline" className="border-primary-gold text-primary-gold hover:bg-primary-gold hover:text-black text-lg px-8 py-6 h-auto">
                <Calendar className="w-6 h-6 mr-2" />
                Book Strategy Session
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Why Deal Room Section */}
      <section className="py-16 px-4 bg-card/30">
        <div className="container mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-6">Why Deal Room Works</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Traditional fundraising is broken. 98% of startups never raise capital. We're changing that.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-12 items-center mb-16">
            <div>
              <h3 className="text-2xl font-bold mb-6 text-red-400">The Traditional Way (Broken)</h3>
              <div className="space-y-4">
                {[
                  'Cold outreach to investors (2% response rate)',
                  'Generic pitch decks that don\'t convert',
                  'No investor matching or qualification',
                  'Months of wasted time and rejection',
                  'No feedback or guidance from experts'
                ].map((item, index) => (
                  <div key={index} className="flex items-center">
                    <TrendingDown className="w-5 h-5 text-red-400 mr-3 flex-shrink-0" />
                    <span className="text-muted-foreground">{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h3 className="text-2xl font-bold mb-6 gradient-text">The Deal Room Way (Proven)</h3>
              <div className="space-y-4">
                {[
                  'Warm introductions to qualified investors',
                  'AI-optimized pitch decks with proven frameworks',
                  'Smart matching based on your specific needs',
                  'Average 6-week funding timeline',
                  'Expert guidance at every step'
                ].map((item, index) => (
                  <div key={index} className="flex items-center">
                    <CheckCircle2 className="w-5 h-5 text-primary-gold mr-3 flex-shrink-0" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="text-center">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 items-center">
              {[
                { number: '400+', label: 'Successful Raises' },
                { number: '$127M+', label: 'Capital Raised' },
                { number: '92%', label: 'Success Rate' },
                { number: '50+', label: 'Partner VCs' }
              ].map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="text-3xl font-bold gradient-text mb-2">{stat.number}</div>
                  <div className="text-muted-foreground">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6">How Deal Room Works</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Our proven 3-step process has helped 400+ startups raise over $127M in funding
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 mb-16">
            {[
              {
                step: "1",
                icon: <UserCheck className="w-8 h-8" />,
                title: "Qualify & Match",
                description: "Our AI analyzes your startup profile and matches you with the most relevant investors in our network of 50+ VCs and angels.",
                features: ["ProofScore validation", "Industry matching", "Stage-appropriate investors"]
              },
              {
                step: "2",
                icon: <FileText className="w-8 h-8" />,
                title: "Optimize & Prepare",
                description: "We optimize your pitch deck and fundraising materials using proven frameworks that have closed $127M+ in funding.",
                features: ["Pitch deck optimization", "Financial model review", "Market validation"]
              },
              {
                step: "3",
                icon: <Handshake className="w-8 h-8" />,
                title: "Connect & Close",
                description: "Get warm introductions to qualified investors and expert support throughout your fundraising process.",
                features: ["Warm introductions", "Expert guidance", "Closing support"]
              }
            ].map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 + index * 0.1 }}
                className="relative"
              >
                <Card className="p-8 h-full border-border bg-card hover:border-primary-gold/30 transition-colors relative">
                  <div className="absolute -top-4 left-8">
                    <div className="w-8 h-8 bg-primary-gold rounded-full flex items-center justify-center text-black font-bold">
                      {step.step}
                    </div>
                  </div>
                  <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-6 text-primary mt-4">
                    {step.icon}
                  </div>
                  <h3 className="text-2xl font-bold mb-4">{step.title}</h3>
                  <p className="text-muted-foreground mb-6 leading-relaxed">{step.description}</p>
                  <ul className="space-y-2">
                    {step.features.map((item, i) => (
                      <li key={i} className="flex items-center text-sm">
                        <Check className="w-4 h-4 text-primary-gold mr-2 flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </Card>
              </motion.div>
            ))}
          </div>

          <div className="text-center">
            <p className="text-muted-foreground mb-6">
              Average time from application to first investor meeting: <span className="text-primary-gold font-semibold">2 weeks</span>
            </p>
            <Button size="lg" className="gradient-button text-lg px-8 py-6 h-auto">
              <Timer className="w-6 h-6 mr-2" />
              Start Your 2-Week Journey
            </Button>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 px-4 bg-card/30">
        <div className="container mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6">Choose Your Investment Package</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Flexible pricing designed to maximize your fundraising success
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                name: "Starter",
                price: "$497",
                period: "one-time",
                description: "Perfect for early-stage startups ready to connect with investors",
                features: [
                  "Basic investor matching (10 matches)",
                  "Standard data room (30 days)",
                  "Email support",
                  "Basic analytics",
                  "Pitch deck review"
                ],
                popular: false
              },
              {
                name: "Professional",
                price: "$1,497",
                period: "one-time",
                description: "Comprehensive solution for serious fundraising campaigns",
                features: [
                  "Advanced investor matching (50 matches)",
                  "Premium data room (90 days)",
                  "Priority support",
                  "Advanced analytics & tracking",
                  "Expert pitch deck optimization",
                  "Warm investor introductions",
                  "Monthly strategy calls"
                ],
                popular: true
              },
              {
                name: "Enterprise",
                price: "$3,997",
                period: "one-time",
                description: "White-glove service for high-growth companies seeking Series A+",
                features: [
                  "Unlimited investor matching",
                  "Enterprise data room (1 year)",
                  "Dedicated account manager",
                  "Real-time investor intelligence",
                  "Custom pitch deck development",
                  "Executive introductions",
                  "Weekly strategy sessions",
                  "Legal document templates",
                  "Due diligence preparation"
                ],
                popular: false
              }
            ].map((plan, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.6 + index * 0.1 }}
              >
                <Card className={`p-8 h-full relative ${plan.popular ? 'border-primary-gold bg-primary-gold/5' : 'border-border bg-card'}`}>
                  {plan.popular && (
                    <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-primary-gold text-black px-4 py-1">
                      <Award className="w-4 h-4 mr-1" />
                      Most Popular
                    </Badge>
                  )}
                  <div className="text-center mb-8">
                    <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                    <div className="mb-4">
                      <span className="text-4xl font-bold gradient-text">{plan.price}</span>
                      <span className="text-muted-foreground ml-2">{plan.period}</span>
                    </div>
                    <p className="text-muted-foreground">{plan.description}</p>
                  </div>
                  
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start">
                        <Check className="w-5 h-5 text-primary-gold mr-3 flex-shrink-0 mt-0.5" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <Button 
                    size="lg" 
                    className={`w-full h-12 ${plan.popular ? 'gradient-button' : 'border-primary-gold text-primary-gold hover:bg-primary-gold hover:text-black'}`}
                    variant={plan.popular ? "default" : "outline"}
                  >
                    Get Started
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.7 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6">Success Stories</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              See how other founders used our Deal Room to secure their funding
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8">
            {[
              {
                quote: "The Deal Room connected us with exactly the right investors. We closed our Series A in just 6 weeks.",
                author: "Sarah Chen",
                company: "TechFlow AI",
                amount: "$2.5M Series A",
                avatar: "SC"
              },
              {
                quote: "Premium investor matching and expert guidance made all the difference. Worth every penny.",
                author: "Marcus Rodriguez",
                company: "GreenScale",
                amount: "$750K Seed",
                avatar: "MR"
              }
            ].map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.8 + index * 0.1 }}
              >
                <Card className="p-8 border-border bg-card">
                  <div className="flex mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 fill-primary-gold text-primary-gold" />
                    ))}
                  </div>
                  <blockquote className="text-lg mb-6 leading-relaxed">"{testimonial.quote}"</blockquote>
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mr-4">
                      <span className="text-sm font-bold text-primary">{testimonial.avatar}</span>
                    </div>
                    <div>
                      <div className="font-semibold">{testimonial.author}</div>
                      <div className="text-sm text-muted-foreground">{testimonial.company} • {testimonial.amount}</div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 px-4 bg-card/30">
        <div className="container mx-auto max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.9 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6">Frequently Asked Questions</h2>
          </motion.div>

          <div className="space-y-6">
            {[
              {
                question: "How does the investor matching work?",
                answer: "Our AI algorithm analyzes your startup profile, industry, funding stage, and goals to match you with investors who have a proven track record in your sector."
              },
              {
                question: "What makes this different from other fundraising platforms?",
                answer: "We focus exclusively on high-quality, pre-qualified startups (ProofScore 70+) and maintain curated relationships with premium investors, ensuring higher success rates."
              },
              {
                question: "How long does it take to see results?",
                answer: "Most clients start receiving investor introductions within 48 hours of onboarding, with initial meetings typically scheduled within 2 weeks."
              },
              {
                question: "Is there a money-back guarantee?",
                answer: "Yes, we offer a 30-day satisfaction guarantee. If you're not completely satisfied with the service, we'll provide a full refund."
              }
            ].map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 1.0 + index * 0.1 }}
              >
                <Card className="p-6 border-border bg-card">
                  <h3 className="text-lg font-semibold mb-3">{faq.question}</h3>
                  <p className="text-muted-foreground leading-relaxed">{faq.answer}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-primary/20 via-background to-primary-gold/20">
        <div className="container mx-auto max-w-4xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.2 }}
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6">Ready to Access the Deal Room?</h2>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Join the exclusive network of high-performing startups and connect with premium investors today
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="gradient-button text-lg px-12 py-6 h-auto">
                <Zap className="w-6 h-6 mr-2" />
                Start Now - Professional
              </Button>
              <Button size="lg" variant="outline" className="border-primary-gold text-primary-gold hover:bg-primary-gold hover:text-black text-lg px-12 py-6 h-auto">
                <Shield className="w-6 h-6 mr-2" />
                Book Free Consultation
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mt-4">
              30-day money-back guarantee • No setup fees • Cancel anytime
            </p>
          </motion.div>
        </div>
      </section>
    </div>
  );
}