import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MobilePaymentModal } from "@/components/ui/mobile-payment-modal";
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
  currentStepIndex?: number;
}

interface PaymentStatus {
  status: 'idle' | 'generating' | 'processing' | 'waiting' | 'success' | 'failed' | 'cancelled';
  message?: string;
  telrUrl?: string;
  paymentId?: string;
}

export default function PaymentOnboarding({ sessionData, onNext, onSkip, onPrev, currentStepIndex = 6 }: PaymentOnboardingProps) {
  const { toast } = useToast();
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>({ status: 'idle' });
  const [isPolling, setIsPolling] = useState(false);
  const [showMobileModal, setShowMobileModal] = useState(false);
  const [isMobileDevice, setIsMobileDevice] = useState(false);
  
  // Extract data from session - early payment doesn't have analysis data yet
  const analysisData = sessionData?.stepData?.processing || {};
  const proofScore = analysisData.total_score || 0;
  const ventureName = sessionData?.stepData?.venture?.name || sessionData?.stepData?.founder?.firstName + "'s Venture" || "Your Venture";
  
  // For early payment: always show Foundation package (course-focused)
  const isEarlyPayment = currentStepIndex === 1; // Payment is step 2 (index 1)
  const isHighScore = !isEarlyPayment && proofScore >= 70;
  
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
        
        if (statusData.success) {
          const status = statusData.status; // Session-based API returns status directly
          console.log(`Payment status check result:`, status);
          
          if (status === 'completed') {
            console.log('✅ Payment completed, stopping polling and showing success');
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
        } else {
          // Payment not found (e.g., after server restart)
          console.log('Payment not found, stopping polling');
          clearInterval(pollInterval);
          setIsPolling(false);
          setPaymentStatus({
            status: 'idle',
            message: 'Session expired. Please try payment again.'
          });
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
          console.log('Payment polling stopped after max attempts');
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

  // Check payment status when tab regains focus
  useEffect(() => {
    const handleFocus = async () => {
      if (paymentStatus.status === 'processing' && paymentStatus.paymentId) {
        console.log('Tab regained focus, checking payment status immediately');
        try {
          const statusResponse = await apiRequest('GET', `/api/payment/status/${paymentStatus.paymentId}`);
          const statusData = await statusResponse.json();
          
          if (statusData.success && statusData.status === 'completed') {
            setPaymentStatus({
              status: 'success',
              message: 'Payment completed successfully!',
              paymentId: paymentStatus.paymentId
            });
            
            toast({
              title: "Payment Successful! 🎉",
              description: "Your package has been activated. Welcome to the next level!",
              variant: "default",
            });
            
            setTimeout(() => onNext(), 3000);
          }
        } catch (error) {
          console.error('Error checking payment status on focus:', error);
        }
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [paymentStatus, onNext, toast]);

  const packageData = (isEarlyPayment || !isHighScore) ? {
    type: "foundation",
    title: "ProofScaling Foundation Course",
    price: 100,
    tagline: isEarlyPayment ? "Early Access • Foundation Course" : "Strengthen Your Venture Fundamentals",
    description: isEarlyPayment 
      ? "Start immediately with comprehensive validation course while we analyze your venture"
      : "Comprehensive course to boost your ProofScore by 15-25 points",
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
  } : {
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
  };

  // Helper function for manual payment status checking
  const checkPaymentStatus = async (paymentId: string) => {
    try {
      console.log('Manual payment status check for:', paymentId);
      const statusResponse = await apiRequest('GET', `/api/payment/status/${paymentId}`);
      const statusData = await statusResponse.json();
      
      if (statusData.success) {
        const status = statusData.status;
        console.log('Manual status check result:', status);
        
        if (status === 'completed') {
          setPaymentStatus({
            status: 'success',
            message: 'Payment completed successfully!',
            paymentId: paymentId
          });
          
          toast({
            title: "Payment Successful! 🎉",
            description: "Your package has been activated.",
            variant: "default",
          });
          
          // Close mobile modal if open
          setShowMobileModal(false);
          
          // Auto-advance after successful payment
          setTimeout(() => {
            onNext();
          }, 2000);
          
        } else if (status === 'failed') {
          setPaymentStatus({
            status: 'failed',
            message: 'Payment was declined. Please try again.',
            paymentId: paymentId
          });
          setShowMobileModal(false);
          
        } else if (status === 'cancelled') {
          setPaymentStatus({
            status: 'cancelled',
            message: 'Payment was cancelled.',
            paymentId: paymentId
          });
          setShowMobileModal(false);
        }
      }
    } catch (error) {
      console.error('Manual payment status check failed:', error);
      toast({
        title: "Status Check Failed",
        description: "Unable to check payment status. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Check for mobile device
  useEffect(() => {
    const checkMobile = () => {
      const userAgent = navigator.userAgent.toLowerCase();
      const isMobile = /android|iphone|ipad|ipod|blackberry|iemobile|opera mini/.test(userAgent);
      const isSmallScreen = window.innerWidth <= 768;
      setIsMobileDevice(isMobile || isSmallScreen);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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
        
        // Enhanced payment flow based on device type
        setTimeout(() => {
          if (isMobileDevice) {
            // Mobile flow: show modal with payment button
            setShowMobileModal(true);
            setPaymentStatus({ 
              status: 'waiting', 
              message: 'Tap "Complete Payment" above to continue securely.',
              telrUrl: paymentData.telrUrl,
              paymentId: paymentData.paymentId
            });
          } else {
            // Desktop flow: open in new tab
            window.open(paymentData.telrUrl, '_blank', 'noopener,noreferrer');
            setPaymentStatus({ 
              status: 'waiting', 
              message: 'Please complete your payment in the new tab. We\'ll check for updates automatically.',
              telrUrl: paymentData.telrUrl,
              paymentId: paymentData.paymentId
            });
          }
          
          // Start polling for payment status for both flows
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
    <div className="min-h-screen bg-background" style={{ backgroundColor: 'hsl(240 10% 6%)' }}>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8"
        >
          <Badge className="mb-4 bg-primary/20 text-primary border-primary/50">
            {isEarlyPayment ? "Step 2 of 7 • Early Access" : "Step 7 of 7 • Final Step"}
          </Badge>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            {isEarlyPayment ? "Secure Your ProofScaling Package" : "Choose Your Next Steps"}
          </h1>
          {isEarlyPayment ? (
            <>
              <p className="text-muted-foreground text-lg mb-2">
                Start your validation journey with <span className="font-bold text-foreground">early access pricing</span>
              </p>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Get immediate access to our ProofScaling Foundation course while we analyze your venture. Perfect your fundamentals and boost your score.
              </p>
            </>
          ) : (
            <>
              <p className="text-muted-foreground text-lg mb-2">
                Based on your ProofScore of <span className="font-bold text-foreground">{proofScore}</span>
              </p>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                {isHighScore 
                  ? "Your venture shows strong fundamentals. Accelerate your path to investment with advanced tools."
                  : "Strengthen your venture foundation and boost your score with our comprehensive course."
                }
              </p>
            </>
          )}
        </motion.div>

        {/* Package Card */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="mb-8"
        >
          <Card className="bg-card border-border backdrop-blur-sm">
            <CardHeader className="text-center pb-6">
              <div className={`mx-auto w-16 h-16 rounded-full bg-${packageData.color}-500/20 flex items-center justify-center mb-4`}>
                <IconComponent className={`w-8 h-8 text-${packageData.color}-400`} />
              </div>
              <CardTitle className="text-2xl font-bold text-foreground mb-2">
                {packageData.title}
              </CardTitle>
              <p className={`text-${packageData.color}-300 text-lg font-medium mb-2`}>
                {packageData.tagline}
              </p>
              <p className="text-muted-foreground">
                {packageData.description}
              </p>
              <div className="text-4xl font-bold text-foreground mt-4">
                ${packageData.price}
                <span className="text-lg font-normal text-muted-foreground">/package</span>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {/* Features and Outcomes - Side by Side */}
              <div className="grid md:grid-cols-2 gap-6">
                {/* Features */}
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-3 flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-400 mr-2" />
                    What's Included
                  </h3>
                  <div className="grid gap-2">
                    {packageData.features.map((feature, index) => (
                      <div key={index} className="flex items-center text-muted-foreground">
                        <div className="w-2 h-2 bg-primary rounded-full mr-3 flex-shrink-0"></div>
                        {feature}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Outcomes */}
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-3 flex items-center">
                    <Target className="w-5 h-5 text-primary mr-2" />
                    Expected Outcomes
                  </h3>
                  <div className="grid gap-2">
                    {packageData.outcomes.map((outcome, index) => (
                      <div key={index} className="flex items-center text-muted-foreground">
                        <div className="w-2 h-2 bg-primary-gold rounded-full mr-3 flex-shrink-0"></div>
                        {outcome}
                      </div>
                    ))}
                  </div>
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
                      className="w-full text-base font-semibold py-4 bg-green-600 hover:bg-green-700 text-white max-w-md mx-auto"
                    >
                      Continue
                      <ArrowRight className="w-4 h-4 ml-2" />
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
                        className="flex-1 text-primary border-primary hover:bg-primary/10"
                      >
                        Reopen Payment
                      </Button>
                      <Button
                        onClick={async () => {
                          if (paymentStatus.paymentId) {
                            try {
                              console.log('Manual payment status check for:', paymentStatus.paymentId);
                              const statusResponse = await apiRequest('GET', `/api/payment/status/${paymentStatus.paymentId}`);
                              const statusData = await statusResponse.json();
                              
                              if (statusData.success && statusData.status === 'completed') {
                                setPaymentStatus({
                                  status: 'success',
                                  message: 'Payment completed successfully!',
                                  paymentId: paymentStatus.paymentId
                                });
                                
                                toast({
                                  title: "Payment Found! 🎉",
                                  description: "Your payment has been completed successfully.",
                                  variant: "default",
                                });
                                
                                setTimeout(() => onNext(), 2000);
                              } else {
                                toast({
                                  title: "Payment Still Pending",
                                  description: "Payment is still being processed. Please wait or complete payment.",
                                  variant: "default",
                                });
                              }
                            } catch (error) {
                              console.error('Manual status check error:', error);
                              toast({
                                title: "Check Failed",
                                description: "Unable to check payment status. Please try again.",
                                variant: "destructive",
                              });
                            }
                          }
                        }}
                        variant="outline"
                        className="flex-1 text-green-300 border-green-500 hover:bg-green-500/10"
                      >
                        Check Status
                      </Button>
                      <Button
                        onClick={() => setPaymentStatus({ status: 'idle' })}
                        variant="outline"
                        className="flex-1 text-muted-foreground border-border hover:bg-secondary"
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
                      className="w-full gradient-button py-4 text-base font-semibold max-w-md mx-auto"
                      size="default"
                    >
                      {paymentStatus.status === 'generating' && (
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      )}
                      {paymentStatus.status === 'processing' && (
                        <CreditCard className="w-4 h-4 mr-2" />
                      )}
                      {paymentStatus.status === 'idle' && (
                        <ArrowRight className="w-4 h-4 mr-2" />
                      )}
                      {paymentStatus.status === 'generating' 
                        ? 'Preparing Payment...'
                        : paymentStatus.status === 'processing'
                        ? 'Opening Payment in New Tab...'
                        : 'Make Payment'
                      }
                    </Button>

                    {paymentStatus.message && paymentStatus.status !== 'processing' && (
                      <p className="text-center text-sm text-primary">
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
                  <div className="flex gap-3 pt-4 border-t border-border">
                    {onPrev && (
                      <Button
                        onClick={onPrev}
                        variant="outline"
                        className="flex-1 text-muted-foreground border-border hover:bg-secondary"
                      >
                        Back to Pathway
                      </Button>
                    )}
                    <Button
                      onClick={onSkip}
                      variant="outline"
                      className="flex-1 text-muted-foreground border-border hover:bg-secondary"
                    >
                      Skip Payment
                    </Button>
                  </div>
                )}
                
                {paymentStatus.status !== 'success' && paymentStatus.status !== 'waiting' && (
                  <div className="text-center">
                    <p className="text-muted-foreground text-sm">
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
          <div className="flex items-center justify-center text-muted-foreground text-sm">
            <Shield className="w-4 h-4 mr-2" />
            Secure payment processing powered by Telr
          </div>
        </motion.div>
      </div>
      
      {/* Mobile Payment Modal */}
      {showMobileModal && paymentStatus.telrUrl && paymentStatus.paymentId && (
        <MobilePaymentModal
          isOpen={showMobileModal}
          onClose={() => setShowMobileModal(false)}
          paymentUrl={paymentStatus.telrUrl}
          paymentId={paymentStatus.paymentId}
          packageType={packageData.type}
          amount={`$${packageData.price}`}
          onStatusCheck={async () => {
            // Manual status check for mobile users
            if (paymentStatus.paymentId) {
              await checkPaymentStatus(paymentStatus.paymentId);
            }
          }}
          currentStatus={paymentStatus.status === 'waiting' ? 'pending' : 
                        paymentStatus.status === 'success' ? 'completed' :
                        paymentStatus.status === 'failed' ? 'failed' : 'processing'}
          statusMessage={paymentStatus.message}
        />
      )}
    </div>
  );
}