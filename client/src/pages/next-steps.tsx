import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  BookOpen, 
  TrendingUp, 
  Users, 
  FileText, 
  Star, 
  CheckCircle,
  ArrowRight,
  Shield,
  Clock,
  Target,
  Award,
  Lightbulb,
  BarChart3,
  MessageSquare,
  CreditCard,
  Loader2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import Layout from "@/components/layout/layout";
import Navbar from "@/components/layout/navbar";
import { detectUserCurrency, getDealRoomPricing } from "@/lib/currency-utils";

interface NextStepsData {
  sessionId: string;
  ventureName: string;
  proofScore: number;
  analysis?: any;
}

interface PaymentStatus {
  status: 'idle' | 'generating' | 'processing' | 'success' | 'failed' | 'cancelled';
  message?: string;
  telrUrl?: string;
}

export default function NextSteps() {
  const [location] = useLocation();
  const navigate = (path: string) => {
    window.location.href = path;
  };
  const { toast } = useToast();
  const [nextStepsData, setNextStepsData] = useState<NextStepsData | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>({ status: 'idle' });
  const [isLoading, setIsLoading] = useState(true);
  const [currency, setCurrency] = useState<'USD' | 'AED'>('USD');
  const [pricing, setPricing] = useState<any>(null);
  const [isLoadingCurrency, setIsLoadingCurrency] = useState(true);

  // Detect user currency
  useEffect(() => {
    const detectAndSetPricing = async () => {
      try {
        const detectedCurrency = await detectUserCurrency();
        setCurrency(detectedCurrency);
        const newPricing = await getDealRoomPricing(detectedCurrency);
        setPricing(newPricing);
        setIsLoadingCurrency(false);
      } catch (error) {
        console.error('Currency detection failed:', error);
        setIsLoadingCurrency(false);
      }
    };
    
    detectAndSetPricing();
  }, []);

  // Extract session ID from URL parameters
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const sessionId = urlParams.get('sessionId');
    const testScore = urlParams.get('score');
    const testVenture = urlParams.get('venture');
    
    // TEMP: For manual testing, create mock data
    if (testScore && testVenture) {
      setNextStepsData({
        sessionId: sessionId || 'test-session',
        ventureName: decodeURIComponent(testVenture),
        proofScore: parseInt(testScore) || 75,
        analysis: {
          total_score: parseInt(testScore) || 75,
          feedback: { overall_feedback: "Test feedback for manual testing" }
        }
      });
      setIsLoading(false);
      return;
    }
    
    if (!sessionId) {
      toast({
        title: "Session Not Found",
        description: "Please complete the onboarding process first.",
        variant: "destructive",
      });
      navigate('/onboarding');
      return;
    }

    // Load session data from localStorage first
    const existingSession = localStorage.getItem('onboardingSession');
    if (existingSession) {
      try {
        const parsedSession = JSON.parse(existingSession);
        if (parsedSession.sessionId === sessionId && parsedSession.stepData?.processing) {
          const processing = parsedSession.stepData.processing;
          setNextStepsData({
            sessionId,
            ventureName: parsedSession.stepData?.venture?.venture?.name || 'Your Venture',
            proofScore: processing.proofScore || 0,
            analysis: processing.analysis
          });
          setIsLoading(false);
          return;
        }
      } catch (error) {
        console.error("Error parsing session data:", error);
      }
    }

    // Fallback: fetch from server
    fetchSessionData(sessionId);
  }, [location]);

  const fetchSessionData = async (sessionId: string) => {
    try {
      const response = await apiRequest("GET", `/api/onboarding/session/${sessionId}`);
      const data = await response.json();
      
      if (data.success && data.data) {
        const processing = data.data.stepData?.processing;
        setNextStepsData({
          sessionId,
          ventureName: data.data.stepData?.venture?.venture?.name || 'Your Venture',
          proofScore: processing?.proofScore || 0,
          analysis: processing?.analysis
        });
      } else {
        throw new Error("Session data not found");
      }
    } catch (error) {
      console.error("Error fetching session data:", error);
      toast({
        title: "Error Loading Data",
        description: "Unable to load your analysis results. Please try again.",
        variant: "destructive",
      });
      navigate('/onboarding');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePayment = async () => {
    if (!nextStepsData) return;

    setPaymentStatus({ status: 'generating', message: 'Preparing your payment...' });

    try {
      console.log('NEXT-STEPS-DEBUG: FORCING session-based route');
      const sessionEndpoint = "/api/payment/create-next-steps-session";
      console.log('NEXT-STEPS-DEBUG: Endpoint URL is:', sessionEndpoint);
      const response = await apiRequest("POST", sessionEndpoint, {
        sessionId: nextStepsData.sessionId,
        ventureName: nextStepsData.ventureName,
        proofScore: nextStepsData.proofScore,
        amount: pricing?.current?.amount || 99,
        currency: currency,
        packageType: nextStepsData.proofScore < 70 ? 'foundation' : 'investment_ready'
      });

      const data = await response.json();

      if (data.success && data.telrUrl) {
        setPaymentStatus({ 
          status: 'processing', 
          message: 'Opening payment page...', 
          telrUrl: data.telrUrl 
        });

        // Open Telr payment page in new tab
        window.open(data.telrUrl, '_blank');

        // Start polling for payment status
        startPaymentStatusPolling(data.paymentId);

        toast({
          title: "Payment Page Opened",
          description: "Complete your payment in the new tab. We'll update your status here.",
          variant: "success",
        });
      } else {
        throw new Error(data.message || "Failed to create payment");
      }
    } catch (error) {
      console.error("Payment creation error:", error);
      setPaymentStatus({ 
        status: 'failed', 
        message: 'Failed to create payment. Please try again.' 
      });
      toast({
        title: "Payment Error",
        description: "Unable to process payment. Please try again.",
        variant: "destructive",
      });
    }
  };

  const startPaymentStatusPolling = (paymentId: string) => {
    const checkStatus = async () => {
      try {
        const response = await apiRequest("GET", `/api/payment/status/${paymentId}`);
        const data = await response.json();

        if (data.success) {
          switch (data.status) {
            case 'completed':
              setPaymentStatus({ 
                status: 'success', 
                message: 'Payment successful! Welcome to your premium experience.' 
              });
              toast({
                title: "Payment Successful!",
                description: "You now have access to all premium features.",
                variant: "success",
              });
              // Redirect to dashboard or premium content
              setTimeout(() => navigate('/dashboard'), 2000);
              return;
            
            case 'failed':
              setPaymentStatus({ 
                status: 'failed', 
                message: 'Payment failed. Please try again.' 
              });
              return;
            
            case 'cancelled':
              setPaymentStatus({ 
                status: 'cancelled', 
                message: 'Payment was cancelled. You can retry anytime.' 
              });
              return;
            
            default:
              // Continue polling for pending/processing
              setTimeout(checkStatus, 3000);
          }
        }
      } catch (error) {
        console.error("Status polling error:", error);
        setTimeout(checkStatus, 5000); // Retry with longer interval
      }
    };

    // Start polling after a short delay
    setTimeout(checkStatus, 2000);
  };

  const retryPayment = () => {
    setPaymentStatus({ status: 'idle' });
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <Navbar />
        </div>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-foreground">Loading your next steps...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!nextStepsData) {
    return (
      <Layout>
        <div className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <Navbar />
        </div>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center">
            <p className="text-foreground mb-4">Unable to load your analysis data.</p>
            <Button onClick={() => navigate('/onboarding')}>
              Return to Onboarding
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  const isFoundationPath = nextStepsData.proofScore < 70;
  const packageData = isFoundationPath ? {
    title: "Foundation Builder Package",
    subtitle: "Strengthen Your Venture Fundamentals",
    description: "Your venture shows promise but needs strengthening in key areas. Our ProofScaling course will guide you through proven frameworks to boost your score and investment readiness.",
    expectedOutcome: "15-25 point score improvement within 30 days",
    icon: BookOpen,
    color: "from-blue-500 to-indigo-600",
    features: [
      {
        category: "Learning & Development",
        items: [
          "ProofScaling Foundation Course (12 comprehensive modules)",
          "Video lessons from successful entrepreneurs", 
          "Interactive worksheets and templates",
          "Live Q&A sessions (monthly)"
        ]
      },
      {
        category: "Tools & Resources", 
        items: [
          "Personalized Score Improvement Roadmap",
          "Industry Benchmarking Analysis",
          "Venture Development Templates",
          "Financial modeling templates"
        ]
      },
      {
        category: "Support & Community",
        items: [
          "Weekly Email Coaching (4 weeks)",
          "Community Access to Foundation Group",
          "Progress Tracking Dashboard",
          "Peer networking opportunities"
        ]
      }
    ]
  } : {
    title: "Investment Ready Package", 
    subtitle: "Accelerate Your Path to Investment",
    description: "Your venture demonstrates strong fundamentals. Unlock advanced tools and insights to accelerate your path to investment.",
    expectedOutcome: "Investment-ready materials and network access",
    icon: TrendingUp,
    color: "from-green-500 to-emerald-600",
    features: [
      {
        category: "Investment Materials",
        items: [
          "Comprehensive 25-Page Analysis Report",
          "Investor-Ready Deal Room Setup", 
          "Investor Introduction Templates",
          "Pitch deck frameworks"
        ]
      },
      {
        category: "Advanced Analytics",
        items: [
          "Advanced Dashboard with Investor Metrics",
          "Monthly Market Intelligence Reports",
          "Market research methodologies",
          "Progress tracking and benchmarking"
        ]
      },
      {
        category: "Premium Community",
        items: [
          "Community Access to Investment-Ready Group",
          "ProofScaling Mastery Courses (8 modules)",
          "Mentor introductions",
          "Success story sharing platform"
        ]
      }
    ]
  };

  return (
    <Layout>
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <Navbar />
      </div>
      
      <div className="min-h-screen bg-background text-foreground">
        <div className="container mx-auto px-4 py-8">
          {/* Header Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <div className="flex items-center justify-center mb-6">
              <div className="p-3 rounded-full bg-primary/10 border border-primary/20">
                <Target className="w-8 h-8 text-primary" />
              </div>
            </div>
            <div className="mb-4">
              <span className="text-sm text-muted-foreground uppercase tracking-wider">Your ProofScore</span>
              <div className="text-6xl font-bold text-primary mt-2">
                {nextStepsData.proofScore}<span className="text-2xl text-muted-foreground">/100</span>
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              Choose Your Development Path
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Based on your ProofScore, we've curated the perfect package to accelerate your venture's growth
            </p>
          </motion.div>

          {/* Modern Pricing Card */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="max-w-4xl mx-auto"
          >
            <div className="relative">
              {/* Recommended Badge */}
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
                <div className="bg-primary text-primary-foreground px-6 py-2 rounded-full text-sm font-semibold">
                  Recommended for You
                </div>
              </div>
              
              <Card className="border-primary/20 bg-card/50 backdrop-blur-sm overflow-hidden">
                <div className={`h-2 bg-gradient-to-r ${packageData.color}`} />
                
                <CardHeader className="text-center pb-8 pt-8">
                  <div className="flex items-center justify-center mb-6">
                    <div className={`p-4 rounded-2xl bg-gradient-to-r ${packageData.color} bg-opacity-10 border border-current border-opacity-20`}>
                      <packageData.icon className="w-10 h-10 text-primary" />
                    </div>
                  </div>
                  
                  <CardTitle className="text-3xl font-bold text-foreground mb-2">
                    {packageData.title}
                  </CardTitle>
                  <p className="text-lg text-muted-foreground mb-6">
                    {packageData.subtitle}
                  </p>
                  
                  <div className="flex items-center justify-center mb-6">
                    <div className="text-center">
                      <div className="flex items-baseline justify-center">
                        {isLoadingCurrency || !pricing ? (
                          <>
                            <span className="text-5xl font-bold text-foreground animate-pulse">$100</span>
                            <span className="text-lg text-muted-foreground ml-2">USD</span>
                          </>
                        ) : (
                          <>
                            <span className="text-5xl font-bold text-foreground">{pricing.current.amount}</span>
                            <span className="text-lg text-muted-foreground ml-2">{pricing.current.code}</span>
                          </>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">
                        One-time payment {!isLoadingCurrency && (
                          <span className="text-xs">({currency === 'AED' ? 'UAE' : 'International'} pricing)</span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <p className="text-muted-foreground leading-relaxed max-w-2xl mx-auto">
                    {packageData.description}
                  </p>
                </CardHeader>

              <CardContent className="space-y-8">
                {/* Features Grid - Modern Table Style */}
                <div className="grid md:grid-cols-3 gap-6">
                  {packageData.features.map((category, index) => (
                    <motion.div
                      key={category.category}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: 0.3 + index * 0.1 }}
                      className="bg-muted/30 rounded-lg p-6 border border-border/50"
                    >
                      <h3 className="text-lg font-semibold text-foreground mb-4 pb-2 border-b border-border">
                        {category.category}
                      </h3>
                      <ul className="space-y-3">
                        {category.items.map((item, itemIndex) => (
                          <li key={itemIndex} className="flex items-start text-muted-foreground">
                            <CheckCircle className="w-4 h-4 text-primary mr-3 mt-0.5 flex-shrink-0" />
                            <span className="text-sm leading-relaxed">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </motion.div>
                  ))}
                </div>

                {/* Expected Outcome */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.6 }}
                  className="p-6 rounded-lg bg-primary/5 border border-primary/20"
                >
                  <div className="flex items-center mb-3">
                    <Award className="w-6 h-6 text-primary mr-3" />
                    <h3 className="text-lg font-semibold text-foreground">Expected Outcome</h3>
                  </div>
                  <p className="text-foreground text-lg font-medium">
                    {packageData.expectedOutcome}
                  </p>
                </motion.div>

                {/* Payment Section */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.7 }}
                  className="border-t border-border pt-8"
                >
                  {paymentStatus.status === 'idle' && (
                    <div className="text-center space-y-6">
                      <div className="flex items-center justify-center space-x-6 text-sm text-muted-foreground">
                        <div className="flex items-center">
                          <Shield className="w-4 h-4 mr-2 text-primary" />
                          <span>Secure Payment</span>
                        </div>
                        <div className="flex items-center">
                          <Clock className="w-4 h-4 mr-2 text-primary" />
                          <span>Instant Access</span>
                        </div>
                        <div className="flex items-center">
                          <Star className="w-4 h-4 mr-2 text-primary" />
                          <span>Money-back Guarantee</span>
                        </div>
                      </div>
                      
                      <Button
                        onClick={handlePayment}
                        className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-6 text-lg font-semibold rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg"
                        size="lg"
                      >
                        <CreditCard className="w-5 h-5 mr-2" />
                        {isLoadingCurrency ? (
                          'Get Started - $100 USD'
                        ) : (
                          `Get Started - ${pricing.formatted.current}`
                        )}
                        <ArrowRight className="w-5 h-5 ml-2" />
                      </Button>
                      
                      <div className="text-sm text-muted-foreground space-y-1">
                        <p>✓ SSL secured payment processing</p>
                        <p>✓ Instant access to all premium features</p>
                        <p>✓ 30-day money-back guarantee</p>
                      </div>
                    </div>
                  )}

                  {/* Payment Status Display */}
                  {paymentStatus.status !== 'idle' && (
                    <div className="text-center space-y-4">
                      <div className="flex items-center justify-center">
                        {paymentStatus.status === 'generating' && (
                          <Loader2 className="w-6 h-6 animate-spin text-primary mr-2" />
                        )}
                        {paymentStatus.status === 'processing' && (
                          <Clock className="w-6 h-6 text-primary mr-2" />
                        )}
                        {paymentStatus.status === 'success' && (
                          <CheckCircle className="w-6 h-6 text-primary mr-2" />
                        )}
                        {(paymentStatus.status === 'failed' || paymentStatus.status === 'cancelled') && (
                          <Target className="w-6 h-6 text-destructive mr-2" />
                        )}
                        <span className="text-foreground font-medium">
                          {paymentStatus.message}
                        </span>
                      </div>

                      {(paymentStatus.status === 'failed' || paymentStatus.status === 'cancelled') && (
                        <Button
                          onClick={retryPayment}
                          variant="outline"
                        >
                          Try Again
                        </Button>
                      )}
                    </div>
                  )}
                </motion.div>

                {/* FAQ Section */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.8 }}
                  className="border-t border-border pt-6"
                >
                  <h3 className="text-lg font-semibold text-white mb-4 text-center">
                    Frequently Asked Questions
                  </h3>
                  <div className="grid md:grid-cols-3 gap-4 text-sm">
                    <div className="text-center">
                      <p className="text-purple-200 font-medium mb-1">What if I'm not satisfied?</p>
                      <p className="text-purple-300">30-day money-back guarantee</p>
                    </div>
                    <div className="text-center">
                      <p className="text-purple-200 font-medium mb-1">How do I access content?</p>
                      <p className="text-purple-300">Instant email with access links</p>
                    </div>
                    <div className="text-center">
                      <p className="text-purple-200 font-medium mb-1">Is my payment secure?</p>
                      <p className="text-purple-300">Bank-level SSL encryption</p>
                    </div>
                  </div>
                </motion.div>
              </CardContent>
            </Card>
            </div>
          </motion.div>
        </div>
      </div>
    </Layout>
  );
}