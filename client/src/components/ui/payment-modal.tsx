import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, XCircle, AlertTriangle, Loader2, CreditCard } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  amount: number;
  currency: string;
  description: string;
  customerEmail?: string;
  customerName?: string;
  metadata?: {
    purpose: string;
    founderId: string;
    ventureId: string;
  };
}

type PaymentStep = 'form' | 'processing' | 'iframe' | 'success' | 'failed' | 'cancelled';

interface PaymentResult {
  orderReference: string;
  paymentUrl: string;
}

export function PaymentModal({
  isOpen,
  onClose,
  onSuccess,
  amount,
  currency,
  description,
  customerEmail,
  customerName,
  metadata
}: PaymentModalProps) {
  const [step, setStep] = useState<PaymentStep>('form');
  const [paymentData, setPaymentData] = useState<PaymentResult | null>(null);
  const [error, setError] = useState<string>('');
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();

  // Reset state when modal opens/closes
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
      const response = await apiRequest("POST", "/api/v1/payments/create", {
        amount,
        currency,
        description,
        purpose: metadata?.purpose || 'Payment',
        planType: "one-time",
        gatewayProvider: "telr",
        customerEmail,
        customerName,
        metadata
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || "Payment creation failed");
      }

      const result = await response.json();
      
      if (result.success) {
        setPaymentData({
          orderReference: result.orderReference,
          paymentUrl: result.paymentUrl
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

  // Handle iframe messages for payment completion
  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      if (!paymentData?.orderReference) return;

      // Handle Telr payment completion messages
      if (event.data && typeof event.data === 'string') {
        if (event.data.includes('payment_successful') || event.data.includes('authorised')) {
          setStep('processing');
          
          // Wait a moment then check payment status
          setTimeout(async () => {
            try {
              const response = await apiRequest("GET", `/api/v1/payments/status/${paymentData.orderReference}`);
              const result = await response.json();
              
              if (result.success && result.transaction?.status === 'completed') {
                setStep('success');
                toast({
                  title: "Payment Successful",
                  description: "Deal Room access granted successfully!",
                });
              } else {
                setStep('failed');
                setError('Payment could not be verified');
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
    };

    if (step === 'iframe') {
      window.addEventListener('message', handleMessage);
      return () => window.removeEventListener('message', handleMessage);
    }
  }, [step, paymentData]);

  const handleClose = () => {
    if (step === 'success') {
      onSuccess();
    }
    onClose();
  };

  const renderContent = () => {
    switch (step) {
      case 'form':
        return (
          <div className="space-y-6">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto bg-gradient-to-r from-purple-500 to-yellow-500 rounded-full flex items-center justify-center">
                <CreditCard className="w-8 h-8 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-foreground mb-2">Deal Room Access</h3>
                <p className="text-muted-foreground">{description}</p>
              </div>
            </div>

            <Card className="bg-muted/50">
              <CardContent className="p-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Service:</span>
                  <span className="font-medium">{metadata?.purpose || 'Payment'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Amount:</span>
                  <span className="font-medium">{amount.toFixed(2)} {currency}</span>
                </div>
                <hr className="border-border" />
                <div className="flex justify-between font-semibold">
                  <span>Total:</span>
                  <span>{amount.toFixed(2)} {currency}</span>
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-3">
              <Button variant="outline" onClick={onClose} className="flex-1">
                Cancel
              </Button>
              <Button 
                onClick={createPayment} 
                disabled={isCreating}
                className="flex-1 bg-gradient-to-r from-purple-500 to-yellow-500 hover:from-purple-600 hover:to-yellow-600"
              >
                {isCreating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  `Pay ${amount.toFixed(2)} ${currency}`
                )}
              </Button>
            </div>
          </div>
        );

      case 'iframe':
        return (
          <div className="space-y-4">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-foreground mb-2">Complete Your Payment</h3>
              <p className="text-sm text-muted-foreground">
                Order Reference: {paymentData?.orderReference}
              </p>
            </div>
            
            <div className="border border-border rounded-lg overflow-hidden">
              <iframe
                src={paymentData?.paymentUrl}
                width="100%"
                height="600"
                frameBorder="0"
                className="w-full"
                title="Payment Gateway"
              />
            </div>
            
            <Button variant="outline" onClick={onClose} className="w-full">
              Cancel Payment
            </Button>
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
                Your Deal Room access has been activated. You can now view your investor matches and start connecting with potential funders.
              </p>
              <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                <p className="text-sm text-green-700 dark:text-green-400">
                  Order Reference: {paymentData?.orderReference}
                </p>
              </div>
            </div>
            <Button onClick={handleClose} className="w-full bg-green-600 hover:bg-green-700">
              Continue to Deal Room
            </Button>
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
              <p className="text-muted-foreground mb-4">
                {error || "Your payment could not be processed. Please try again or contact support."}
              </p>
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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="sr-only">Payment Modal</DialogTitle>
        </DialogHeader>
        {renderContent()}
      </DialogContent>
    </Dialog>
  );
}