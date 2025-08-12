import { motion } from "framer-motion";
import { ArrowRight, Check, Star, Users, TrendingUp, Shield, Zap, Target, Crown, Award, Briefcase, DollarSign, ChevronRight, PlayCircle } from "lucide-react";
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
              Your Gateway to
              <span className="block gradient-text">Investor Success</span>
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto leading-relaxed">
              Join the exclusive Deal Room where high-performing startups connect with premium investors. 
              Your ProofScore of 70+ unlocks access to curated opportunities and accelerated growth.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="gradient-button text-lg px-8 py-6 h-auto">
                <PlayCircle className="w-6 h-6 mr-2" />
                Watch Demo Video
              </Button>
              <Button size="lg" variant="outline" className="border-primary-gold text-primary-gold hover:bg-primary-gold hover:text-black text-lg px-8 py-6 h-auto">
                <Target className="w-6 h-6 mr-2" />
                Schedule Strategy Call
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Social Proof Section */}
      <section className="py-16 px-4 bg-card/50">
        <div className="container mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-6">Trusted by High-Growth Startups</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 items-center">
              {['200+ Startups', '$50M+ Raised', '85% Success Rate', '30+ VCs'].map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="text-3xl font-bold gradient-text mb-2">{stat.split(' ')[0]}</div>
                  <div className="text-muted-foreground">{stat.split(' ').slice(1).join(' ')}</div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6">Everything You Need to Succeed</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Access premium tools, exclusive networks, and expert guidance designed for investor-ready startups
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: <Users className="w-8 h-8" />,
                title: "Curated Investor Matching",
                description: "Connect with pre-qualified investors who match your industry, stage, and funding requirements",
                features: ["AI-powered matching", "Warm introductions", "Direct contact details"]
              },
              {
                icon: <Briefcase className="w-8 h-8" />,
                title: "Premium Data Room",
                description: "Professional-grade virtual data room with advanced analytics and investor tracking",
                features: ["Secure document sharing", "Investor activity tracking", "Professional templates"]
              },
              {
                icon: <TrendingUp className="w-8 h-8" />,
                title: "Growth Acceleration",
                description: "Access exclusive resources, mentorship, and strategic partnerships for rapid scaling",
                features: ["Expert mentorship", "Strategic partnerships", "Exclusive events"]
              }
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 + index * 0.1 }}
              >
                <Card className="p-8 h-full border-border bg-card hover:border-primary-gold/30 transition-colors">
                  <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-6 text-primary">
                    {feature.icon}
                  </div>
                  <h3 className="text-2xl font-bold mb-4">{feature.title}</h3>
                  <p className="text-muted-foreground mb-6 leading-relaxed">{feature.description}</p>
                  <ul className="space-y-2">
                    {feature.features.map((item, i) => (
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