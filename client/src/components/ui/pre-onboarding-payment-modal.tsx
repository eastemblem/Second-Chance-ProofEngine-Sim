import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle, XCircle, AlertTriangle, Loader2, CreditCard, Rocket, Award, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface PreOnboardingPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (reservationToken: string) => void;
  customerEmail: string;
  customerName: string;
  customerPhone?: string;
}

type PaymentStep = 'form' | 'processing' | 'iframe' | 'success' | 'failed' | 'cancelled';

interface PaymentResult {
  orderReference: string;
  paymentUrl: string;
  reservationToken: string;
}

export function PreOnboardingPaymentModal({
  isOpen,
  onClose,
  onSuccess,
  customerEmail,
  customerName,
  customerPhone
}: PreOnboardingPaymentModalProps) {
  const [step, setStep] = useState<PaymentStep>('form');
  const [paymentData, setPaymentData] = useState<PaymentResult | null>(null);
  const [error, setError] = useState<string>('');
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      setStep('form');
      setPaymentData(null);
      setError('');
      setIsCreating(false);
    }
  }, [isOpen]);

  const createPayment = async () => {
    setIsCreating(true);
    try {
      const response = await apiRequest("POST", "/api/v1/pre-onboarding-payments/initiate", {
        email: customerEmail,
        name: customerName,
        phone: customerPhone,
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || "Payment creation failed");
      }

      const result = await response.json();
      
      if (result.success && result.paymentUrl) {
        setPaymentData({
          orderReference: result.orderReference,
          paymentUrl: result.paymentUrl,
          reservationToken: result.reservationToken,
        });
        setStep('iframe');
        
        toast({
          title: "Payment Created",
          description: `Order reference: ${result.orderReference}`,
        });
      } else {
        throw new Error(result.error || "Payment creation failed");
      }
    } catch (error) {
      console.error("Payment creation error:", error);
      setError(error instanceof Error ? error.message : "Unknown error occurred");
      setStep('failed');
      
      toast({
        title: "Payment Creation Failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      if (!paymentData?.orderReference) return;

      if (event.data && typeof event.data === 'string') {
        if (event.data.includes('payment_successful') || event.data.includes('authorised') || event.data.includes('completed')) {
          setStep('processing');
          
          setTimeout(async () => {
            try {
              const response = await apiRequest("GET", `/api/v1/pre-onboarding-payments/status/${paymentData.orderReference}`);
              const result = await response.json();
              
              if (result.success && result.status === 'completed') {
                setStep('success');
                toast({
                  title: "Payment Successful!",
                  description: "Redirecting you to create your account...",
                });
                if (paymentData?.reservationToken) {
                  setTimeout(() => onSuccess(paymentData.reservationToken), 1500);
                }
              } else {
                setStep('failed');
                setError(result.error || 'Payment could not be verified. Please try again or contact support.');
              }
            } catch (error) {
              console.error('Payment verification error:', error);
              setStep('failed');
              setError('Payment verification failed');
            }
          }, 2000);
        } else if (event.data.includes('payment_failed') || event.data.includes('declined')) {
          setStep('failed');
          setError('Payment was declined by your bank or card issuer');
        } else if (event.data.includes('payment_cancelled') || event.data.includes('cancelled')) {
          setStep('cancelled');
        }
      }

      if (event.data && typeof event.data === 'object') {
        if (event.data.type === 'PAYMENT_SUCCESS') {
          console.log('[Payment Modal] Received PAYMENT_SUCCESS message:', event.data);
          // Server already verified the payment is completed, trust it
          setStep('success');
          toast({
            title: "Payment Successful!",
            description: "Redirecting you to create your account...",
          });
          
          // Use the token from the message if available, otherwise fall back to paymentData
          const tokenToUse = event.data.reservationToken || paymentData?.reservationToken;
          if (tokenToUse) {
            setTimeout(() => onSuccess(tokenToUse), 1500);
          }
        } else if (event.data.type === 'PAYMENT_PENDING') {
          // Payment is still being verified - continue polling, don't change state
          console.log('[Payment Modal] Received PAYMENT_PENDING message, continuing to poll...');
          // Just log and let the polling mechanism handle it
        } else if (event.data.type === 'PAYMENT_ERROR') {
          setStep('failed');
          setError(event.data.error || 'Payment failed');
          
          toast({
            title: "Payment Failed",
            description: event.data.error || 'Payment could not be completed',
            variant: "destructive",
          });
        } else if (event.data.type === 'PAYMENT_CANCELLED') {
          setStep('cancelled');
          
          toast({
            title: "Payment Cancelled",
            description: "You cancelled the payment process",
            variant: "default",
          });
        }
      }
    };

    if (step === 'iframe') {
      window.addEventListener('message', handleMessage);
      return () => window.removeEventListener('message', handleMessage);
    }
  }, [step, paymentData, toast, onSuccess]);

  useEffect(() => {
    if (step !== 'iframe' || !paymentData?.orderReference) return;

    let pollCount = 0;
    const maxPolls = 60; // Poll for up to 2 minutes (every 2 seconds)

    const pollPaymentStatus = async () => {
      pollCount++;
      console.log(`[Payment Modal] Polling payment status (${pollCount}/${maxPolls}) for ${paymentData.orderReference}`);
      
      try {
        const response = await apiRequest("GET", `/api/v1/pre-onboarding-payments/status/${paymentData.orderReference}`);
        const result = await response.json();
        
        console.log('[Payment Modal] Poll result:', result);
        
        if (result.success && result.status === 'completed') {
          console.log('[Payment Modal] Payment completed! Transitioning to success...');
          setStep('success');
          toast({
            title: "Payment Successful!",
            description: "Redirecting you to create your account...",
          });
          if (paymentData?.reservationToken) {
            setTimeout(() => onSuccess(paymentData.reservationToken), 1500);
          }
        } else if (result.success && result.status === 'failed') {
          console.log('[Payment Modal] Payment failed');
          setStep('failed');
          setError(result.error || 'Payment was declined. Please check your payment details and try again.');
        } else if (pollCount >= maxPolls) {
          console.log('[Payment Modal] Max polls reached, still pending');
        }
      } catch (error) {
        console.error('[Payment Modal] Polling error:', error);
      }
    };

    // Start polling immediately after a short delay
    const initialDelay = setTimeout(() => pollPaymentStatus(), 1000);
    const pollInterval = setInterval(pollPaymentStatus, 2000);
    
    return () => {
      clearTimeout(initialDelay);
      clearInterval(pollInterval);
    };
  }, [step, paymentData, toast, onSuccess]);

  const handleCancel = async () => {
    setStep('cancelled');
  };

  const handleClose = (openState?: boolean) => {
    if (step === 'iframe' || step === 'processing') {
      return;
    }
    
    if (openState === false) {
      onClose();
    }
  };

  const handleContinueToOnboarding = () => {
    if (paymentData?.reservationToken) {
      onSuccess(paymentData.reservationToken);
    }
  };

  const features = [
    { icon: Rocket, text: "Full Platform Access" },
    { icon: CheckCircle, text: "ProofScore Analysis" },
    { icon: Users, text: "Investor Matching (when qualified)" },
    { icon: Award, text: "Validation Certificate" },
  ];

  const renderContent = () => {
    switch (step) {
      case 'form':
        return (
          <div className="space-y-6">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto bg-gradient-to-r from-purple-500 to-primary-gold rounded-full flex items-center justify-center">
                <CreditCard className="w-8 h-8 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-foreground mb-2">Platform Access</h3>
                <p className="text-muted-foreground">One-time payment for full access to Second Chance</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {features.map((feature, index) => (
                <div key={index} className="flex items-center gap-2 text-sm" data-testid={`modal-feature-${index}`}>
                  <feature.icon className="w-4 h-4 text-primary" />
                  <span className="text-muted-foreground">{feature.text}</span>
                </div>
              ))}
            </div>

            <Card className="bg-muted/50">
              <CardContent className="p-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Service:</span>
                  <span className="font-medium">Platform Access</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Email:</span>
                  <span className="font-medium">{customerEmail}</span>
                </div>
                <hr className="border-border" />
                <div className="flex justify-between font-semibold text-lg">
                  <span>Total:</span>
                  <span className="text-primary-gold">$99 USD</span>
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => onClose()} className="flex-1">
                Cancel
              </Button>
              <Button 
                onClick={createPayment} 
                disabled={isCreating}
                className="flex-1 gradient-button"
                data-testid="button-confirm-payment"
              >
                {isCreating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  "Pay $99 USD"
                )}
              </Button>
            </div>
            
            <div className="text-center pt-4 border-t border-border/50">
              <p className="text-sm text-muted-foreground font-medium">
                Secure payment processing powered by PayTabs
              </p>
            </div>
          </div>
        );

      case 'iframe':
        return (
          <div className="h-[calc(95vh-8rem)] flex flex-col bg-background">
            <div className="text-center px-4 pb-3 shrink-0 bg-background/95 border-b border-border/50">
              <p className="text-xs text-muted-foreground">
                Order Reference: {paymentData?.orderReference}
              </p>
            </div>
            
            <div className="flex-1 mx-4 my-3 border-2 border-border rounded-lg overflow-hidden bg-white shadow-lg min-h-0">
              {paymentData?.paymentUrl ? (
                <iframe
                  src={paymentData.paymentUrl}
                  width="100%"
                  height="100%"
                  frameBorder="0"
                  className="w-full h-full block"
                  title="Payment Gateway"
                  sandbox="allow-forms allow-modals allow-popups-to-escape-sandbox allow-popups allow-scripts allow-top-navigation allow-same-origin"
                />
              ) : (
                <div className="h-full flex items-center justify-center bg-muted/50">
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-4 bg-red-500/20 rounded-full flex items-center justify-center">
                      <XCircle className="w-8 h-8 text-red-500" />
                    </div>
                    <p className="text-sm text-muted-foreground">Payment URL not available</p>
                  </div>
                </div>
              )}
            </div>
            
            <div className="px-4 pb-4 shrink-0 bg-background/95 border-t border-border/50 space-y-2">
              <Button 
                variant="outline" 
                onClick={handleCancel} 
                className="w-full border-2 border-red-500/20 hover:border-red-500/40 hover:bg-red-500/10 text-foreground"
              >
                Cancel Payment
              </Button>
              <div className="text-center">
                <p className="text-sm text-muted-foreground font-medium bg-muted/30 px-3 py-2 rounded-md">
                  Secure payment processing powered by PayTabs
                </p>
              </div>
            </div>
          </div>
        );

      case 'processing':
        return (
          <div className="space-y-6 text-center py-8">
            <div className="w-16 h-16 mx-auto bg-blue-500/20 rounded-full flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-foreground mb-2">Processing Payment</h3>
              <p className="text-muted-foreground">Please wait while we verify your payment...</p>
            </div>
          </div>
        );

      case 'success':
        return (
          <div className="space-y-6 text-center py-8">
            <div className="w-16 h-16 mx-auto bg-green-500/20 rounded-full flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-green-600 mb-2">Payment Successful!</h3>
              <p className="text-muted-foreground mb-4">
                Your payment has been confirmed. You now have access to:
              </p>
              <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 mb-4">
                <div className="space-y-2 text-sm text-green-700 dark:text-green-400">
                  <p>Full platform access</p>
                  <p>ProofScore analysis</p>
                  <p>Investor matching when qualified (ProofScore 70+)</p>
                  <p>Validation certificate</p>
                </div>
              </div>
              <div className="bg-muted/50 border rounded-lg p-3">
                <p className="text-xs text-muted-foreground">
                  Order Reference: {paymentData?.orderReference}
                </p>
              </div>
            </div>
            <Button 
              onClick={handleContinueToOnboarding} 
              className="w-full gradient-button"
              data-testid="button-continue-onboarding"
            >
              Continue to Create Account
            </Button>
            
            <div className="text-center pt-4 border-t">
              <p className="text-sm text-muted-foreground font-medium">
                Secure payment processing powered by PayTabs
              </p>
            </div>
          </div>
        );

      case 'failed':
        return (
          <div className="space-y-6 text-center py-8">
            <div className="w-16 h-16 mx-auto bg-red-500/20 rounded-full flex items-center justify-center">
              <XCircle className="w-8 h-8 text-red-500" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-red-600 mb-2">Payment Failed</h3>
              <div className="mb-4">
                <p className="text-muted-foreground mb-2">
                  {error || "Your payment could not be processed. Please try again or contact support."}
                </p>
                {error && error !== 'Payment failed' && (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                    <p className="text-sm text-red-700 dark:text-red-400 font-medium">
                      Reason: {error}
                    </p>
                  </div>
                )}
              </div>
              {paymentData?.orderReference && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                  <p className="text-sm text-red-700 dark:text-red-400">
                    Order Reference: {paymentData.orderReference}
                  </p>
                </div>
              )}
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={onClose} className="flex-1">
                Close
              </Button>
              <Button onClick={() => setStep('form')} className="flex-1">
                Try Again
              </Button>
            </div>
          </div>
        );

      case 'cancelled':
        return (
          <div className="space-y-6 text-center py-8">
            <div className="w-16 h-16 mx-auto bg-orange-500/20 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-orange-500" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-orange-600 mb-2">Payment Cancelled</h3>
              <p className="text-muted-foreground">
                You cancelled the payment process. No charges have been made to your account.
              </p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={onClose} className="flex-1">
                Close
              </Button>
              <Button onClick={() => setStep('form')} className="flex-1">
                Try Again
              </Button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className={step === 'iframe' ? "max-w-[850px] w-[95vw] h-[95vh] max-h-[95vh] overflow-hidden p-0 flex flex-col" : "sm:max-w-md overflow-y-visible"}>
        <DialogHeader className={step === 'iframe' ? "p-4 pb-2 shrink-0" : ""}>
          <DialogTitle className={step === 'iframe' ? "text-center text-lg" : "sr-only"}>
            {step === 'iframe' ? "Complete Your Payment" : "Payment Modal"}
          </DialogTitle>
        </DialogHeader>
        <div className={step === 'iframe' ? "flex-1 overflow-hidden min-h-0" : "pb-4"}>
          {renderContent()}
        </div>
      </DialogContent>
    </Dialog>
  );
}
