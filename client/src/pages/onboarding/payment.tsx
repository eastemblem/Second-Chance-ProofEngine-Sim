import { useState, useEffect } from "react";
import { motion } from "framer-motion";
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

interface PaymentOnboardingProps {
  sessionData: any;
  onNext: () => void;
  onSkip: () => void;
  onPrev?: () => void;
}

interface PaymentStatus {
  status: 'idle' | 'generating' | 'processing' | 'success' | 'failed' | 'cancelled';
  message?: string;
  telrUrl?: string;
}

export default function PaymentOnboarding({ sessionData, onNext, onSkip, onPrev }: PaymentOnboardingProps) {
  const { toast } = useToast();
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>({ status: 'idle' });
  
  // Extract analysis data from session
  const analysisData = sessionData?.stepData?.processing || {};
  const proofScore = analysisData.total_score || 0;
  const ventureName = sessionData?.stepData?.venture?.name || "Your Venture";
  
  // Determine package based on score
  const isHighScore = proofScore >= 70;
  
  const packageData = isHighScore ? {
    type: "investment",
    title: "Investment Ready Package",
    price: 100,
    tagline: "Accelerate Your Path to Investment",
    description: "Advanced tools and strategies for investment-ready ventures",
    icon: TrendingUp,
    color: "emerald",
    features: [
      "Investor Deck Enhancement Guide",
      "Financial Model Template",
      "Due Diligence Checklist",
      "Investment Process Roadmap",
      "Pitch Strategy Session (1-hour)",
      "Investor Network Introduction",
      "Monthly Progress Check-ins (3 months)"
    ],
    outcomes: [
      "Professional investor materials",
      "Enhanced fundraising readiness",
      "Strategic investor connections",
      "Accelerated path to funding"
    ]
  } : {
    type: "foundation",
    title: "ProofScaling Foundation Course",
    price: 100,
    tagline: "Strengthen Your Venture Fundamentals",
    description: "Comprehensive course to boost your ProofScore by 15-25 points",
    icon: BookOpen,
    color: "blue",
    features: [
      "Market Validation Framework",
      "Business Model Optimization",
      "Value Proposition Design",
      "Customer Discovery Methods",
      "Competitive Analysis Tools",
      "Growth Strategy Planning",
      "Monthly Mentorship Sessions (3 months)"
    ],
    outcomes: [
      "Stronger venture fundamentals",
      "15-25 point ProofScore increase",
      "Validated business model",
      "Clear go-to-market strategy"
    ]
  };

  const handlePurchasePackage = async () => {
    setPaymentStatus({ status: 'generating', message: 'Preparing your payment...' });
    
    try {
      console.log('Creating payment for package:', packageData.type);
      
      console.log('PAYMENT-DEBUG: FORCING session-based route');
      const sessionEndpoint = '/api/payment/create-next-steps-session';
      console.log('PAYMENT-DEBUG: Endpoint URL is:', sessionEndpoint);
      const response = await apiRequest('POST', sessionEndpoint, {
        sessionId: sessionData.sessionId,
        packageType: packageData.type,
        amount: packageData.price,
        ventureName: ventureName,
        proofScore: proofScore
      });
      
      const paymentData = await response.json();
      console.log('Payment response:', paymentData);
      
      if (paymentData.success && paymentData.telrUrl) {
        setPaymentStatus({ 
          status: 'processing', 
          message: 'Redirecting to secure payment...',
          telrUrl: paymentData.telrUrl 
        });
        
        // Redirect to Telr payment page
        setTimeout(() => {
          window.location.href = paymentData.telrUrl;
        }, 2000);
        
      } else {
        throw new Error(paymentData.message || 'Failed to create payment');
      }
      
    } catch (error) {
      console.error('Payment creation failed:', error);
      setPaymentStatus({ 
        status: 'failed', 
        message: error instanceof Error ? error.message : 'Payment creation failed' 
      });
      
      toast({
        title: "Payment Error",
        description: "Unable to process payment. Please try again.",
        variant: "destructive",
      });
    }
  };

  const IconComponent = packageData.icon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8"
        >
          <Badge className="mb-4 bg-purple-500/20 text-purple-200 border-purple-500/50">
            Step 7 of 7 • Final Step
          </Badge>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Choose Your Next Steps
          </h1>
          <p className="text-purple-200 text-lg mb-2">
            Based on your ProofScore of <span className="font-bold text-white">{proofScore}</span>
          </p>
          <p className="text-purple-300 max-w-2xl mx-auto">
            {isHighScore 
              ? "Your venture shows strong fundamentals. Accelerate your path to investment with advanced tools."
              : "Strengthen your venture foundation and boost your score with our comprehensive course."
            }
          </p>
        </motion.div>

        {/* Package Card */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="mb-8"
        >
          <Card className="bg-gray-800/50 border-gray-700/50 backdrop-blur-sm">
            <CardHeader className="text-center pb-6">
              <div className={`mx-auto w-16 h-16 rounded-full bg-${packageData.color}-500/20 flex items-center justify-center mb-4`}>
                <IconComponent className={`w-8 h-8 text-${packageData.color}-400`} />
              </div>
              <CardTitle className="text-2xl font-bold text-white mb-2">
                {packageData.title}
              </CardTitle>
              <p className={`text-${packageData.color}-300 text-lg font-medium mb-2`}>
                {packageData.tagline}
              </p>
              <p className="text-gray-300">
                {packageData.description}
              </p>
              <div className="text-4xl font-bold text-white mt-4">
                ${packageData.price}
                <span className="text-lg font-normal text-gray-400">/package</span>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {/* Features */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-3 flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-400 mr-2" />
                  What's Included
                </h3>
                <div className="grid gap-2">
                  {packageData.features.map((feature, index) => (
                    <div key={index} className="flex items-center text-gray-300">
                      <div className="w-2 h-2 bg-purple-400 rounded-full mr-3 flex-shrink-0"></div>
                      {feature}
                    </div>
                  ))}
                </div>
              </div>

              {/* Outcomes */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-3 flex items-center">
                  <Target className="w-5 h-5 text-blue-400 mr-2" />
                  Expected Outcomes
                </h3>
                <div className="grid gap-2">
                  {packageData.outcomes.map((outcome, index) => (
                    <div key={index} className="flex items-center text-gray-300">
                      <div className="w-2 h-2 bg-blue-400 rounded-full mr-3 flex-shrink-0"></div>
                      {outcome}
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-6 space-y-4">
                <Button
                  onClick={handlePurchasePackage}
                  disabled={paymentStatus.status === 'generating' || paymentStatus.status === 'processing'}
                  className="w-full gradient-button py-6 text-lg font-semibold"
                  size="lg"
                >
                  {paymentStatus.status === 'generating' && (
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  )}
                  {paymentStatus.status === 'processing' && (
                    <CreditCard className="w-5 h-5 mr-2" />
                  )}
                  {paymentStatus.status === 'idle' && (
                    <ArrowRight className="w-5 h-5 mr-2" />
                  )}
                  {paymentStatus.status === 'generating' 
                    ? 'Preparing Payment...'
                    : paymentStatus.status === 'processing'
                    ? 'Redirecting...'
                    : `Get ${packageData.title}`
                  }
                </Button>

                {paymentStatus.message && (
                  <p className="text-center text-sm text-purple-300">
                    {paymentStatus.message}
                  </p>
                )}

                {/* Navigation Options */}
                <div className="flex gap-3 pt-4 border-t border-gray-700/50">
                  {onPrev && (
                    <Button
                      onClick={onPrev}
                      variant="outline"
                      className="flex-1 text-gray-300 border-gray-600 hover:bg-gray-700/50"
                    >
                      Back to Pathway
                    </Button>
                  )}
                  <Button
                    onClick={onSkip}
                    variant="outline"
                    className="flex-1 text-gray-300 border-gray-600 hover:bg-gray-700/50"
                  >
                    Continue to Dashboard
                  </Button>
                </div>
                
                <div className="text-center">
                  <p className="text-gray-400 text-sm">
                    Not ready yet? You can access this later from your dashboard.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Security Notice */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.6 }}
          className="text-center"
        >
          <div className="flex items-center justify-center text-gray-400 text-sm">
            <Shield className="w-4 h-4 mr-2" />
            Secure payment processing powered by Telr
          </div>
        </motion.div>
      </div>
    </div>
  );
}