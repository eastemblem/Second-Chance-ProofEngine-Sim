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
  status: 'idle' | 'generating' | 'processing' | 'waiting' | 'success' | 'failed' | 'cancelled';
  message?: string;
  telrUrl?: string;
  paymentId?: string;
}

export default function PaymentOnboarding({ sessionData, onNext, onSkip, onPrev }: PaymentOnboardingProps) {
  const { toast } = useToast();
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>({ status: 'idle' });
  const [isPolling, setIsPolling] = useState(false);
  
  // Extract analysis data from session
  const analysisData = sessionData?.stepData?.processing || {};
  const proofScore = analysisData.total_score || 0;
  const ventureName = sessionData?.stepData?.venture?.name || "Your Venture";
  
  // Determine package based on score
  const isHighScore = proofScore >= 70;
  
  // Payment status polling function
  const startPaymentStatusPolling = (paymentId: string) => {
    if (isPolling) return; // Prevent multiple polling instances
    
    setIsPolling(true);
    let pollCount = 0;
    const maxPolls = 60; // Poll for up to 10 minutes (every 10 seconds)
    
    const pollInterval = setInterval(async () => {
      try {
        pollCount++;
        console.log(`Polling payment status (${pollCount}/${maxPolls}):`, paymentId);
        
        const statusResponse = await apiRequest('GET', `/api/payment/status/${paymentId}`);
        const statusData = await statusResponse.json();
        
        if (statusData.success && statusData.transaction) {
          const { status } = statusData.transaction;
          
          if (status === 'completed') {
            clearInterval(pollInterval);
            setIsPolling(false);
            setPaymentStatus({
              status: 'success',
              message: 'Payment completed successfully!',
              paymentId
            });
            
            toast({
              title: "Payment Successful! 🎉",
              description: "Your package has been activated. Welcome to the next level!",
              variant: "default",
            });
            
            // Auto-advance after successful payment
            setTimeout(() => {
              onNext();
            }, 3000);
            
          } else if (status === 'failed') {
            clearInterval(pollInterval);
            setIsPolling(false);
            setPaymentStatus({
              status: 'failed',
              message: 'Payment was not completed. Please try again.',
              paymentId
            });
            
          } else if (status === 'cancelled') {
            clearInterval(pollInterval);
            setIsPolling(false);
            setPaymentStatus({
              status: 'cancelled',
              message: 'Payment was cancelled. You can try again when ready.',
              paymentId
            });
          }
        }
        
        // Stop polling after max attempts
        if (pollCount >= maxPolls) {
          clearInterval(pollInterval);
          setIsPolling(false);
          setPaymentStatus({
            status: 'waiting',
            message: 'Still waiting for payment completion. The page will update automatically once payment is processed.',
            paymentId
          });
        }
        
      } catch (error) {
        console.error('Error polling payment status:', error);
        // Continue polling on errors, but stop after max attempts
        if (pollCount >= maxPolls) {
          clearInterval(pollInterval);
          setIsPolling(false);
        }
      }
    }, 10000); // Poll every 10 seconds
  };

  // Clean up polling on component unmount
  useEffect(() => {
    return () => {
      setIsPolling(false);
    };
  }, []);

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
          message: 'Opening secure payment in new tab...',
          telrUrl: paymentData.telrUrl,
          paymentId: paymentData.paymentId
        });
        
        // Open Telr payment page in new tab
        setTimeout(() => {
          window.open(paymentData.telrUrl, '_blank', 'noopener,noreferrer');
          
          // Start waiting for payment completion
          setPaymentStatus({ 
            status: 'waiting', 
            message: 'Please complete your payment in the new tab. We\'ll check for updates automatically.',
            telrUrl: paymentData.telrUrl,
            paymentId: paymentData.paymentId
          });
          
          // Start polling for payment status
          startPaymentStatusPolling(paymentData.paymentId);
        }, 1500);
        
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
                {paymentStatus.status === 'success' ? (
                  <div className="space-y-4">
                    <div className="p-4 bg-green-500/20 border border-green-500/50 rounded-lg text-center">
                      <CheckCircle className="w-8 h-8 text-green-400 mx-auto mb-2" />
                      <p className="text-green-300 font-semibold mb-1">
                        Payment Successful! 🎉
                      </p>
                      <p className="text-green-200 text-sm">
                        Your {packageData.title} has been activated. Redirecting to your dashboard...
                      </p>
                    </div>
                    <Button
                      onClick={onNext}
                      className="w-full text-lg font-semibold py-6 bg-green-600 hover:bg-green-700 text-white"
                    >
                      Continue to Dashboard
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </Button>
                  </div>
                ) : paymentStatus.status === 'waiting' ? (
                  <div className="space-y-4">
                    <div className="p-4 bg-blue-500/20 border border-blue-500/50 rounded-lg text-center">
                      <Clock className="w-8 h-8 text-blue-400 mx-auto mb-2 animate-pulse" />
                      <p className="text-blue-300 font-semibold mb-1">
                        Waiting for Payment
                      </p>
                      <p className="text-blue-200 text-sm">
                        {paymentStatus.message}
                      </p>
                    </div>
                    <div className="flex gap-3">
                      <Button
                        onClick={() => paymentStatus.telrUrl && window.open(paymentStatus.telrUrl, '_blank')}
                        variant="outline"
                        className="flex-1 text-blue-300 border-blue-500 hover:bg-blue-500/10"
                      >
                        Reopen Payment
                      </Button>
                      <Button
                        onClick={() => setPaymentStatus({ status: 'idle' })}
                        variant="outline"
                        className="flex-1 text-gray-300 border-gray-600 hover:bg-gray-700/50"
                      >
                        Try Again
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
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
                        ? 'Opening Payment in New Tab...'
                        : `Get ${packageData.title}`
                      }
                    </Button>

                    {paymentStatus.message && paymentStatus.status !== 'processing' && (
                      <p className="text-center text-sm text-purple-300">
                        {paymentStatus.message}
                      </p>
                    )}
                    
                    {(paymentStatus.status === 'failed' || paymentStatus.status === 'cancelled') && (
                      <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg">
                        <p className="text-red-300 text-sm text-center">
                          {paymentStatus.message}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Navigation Options - Only show when not in success or waiting state */}
                {paymentStatus.status !== 'success' && paymentStatus.status !== 'waiting' && (
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
                )}
                
                {paymentStatus.status !== 'success' && paymentStatus.status !== 'waiting' && (
                  <div className="text-center">
                    <p className="text-gray-400 text-sm">
                      Not ready yet? You can access this later from your dashboard.
                    </p>
                  </div>
                )}
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