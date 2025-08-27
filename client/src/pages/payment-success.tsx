import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Loader2, Star, Shield, Trophy, Sparkles, Clock } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

export default function PaymentSuccess() {
  const [, setLocation] = useLocation();
  const [orderRef, setOrderRef] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    // Get order reference from URL params - support both 'ref' and 'payment_id'
    const urlParams = new URLSearchParams(window.location.search);
    const ref = urlParams.get('ref') || urlParams.get('payment_id');
    setOrderRef(ref);
  }, []);

  // Countdown timer to auto-close page
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      // Close the window/tab when countdown reaches 0
      window.close();
    }
  }, [countdown]);

  // Query payment status to verify success - try session-based endpoint first, then V1
  const { data: paymentStatus, isLoading, error } = useQuery({
    queryKey: ['/api/payment/status', orderRef],
    enabled: !!orderRef,
    retry: 3,
    retryDelay: 1000,
    queryFn: async () => {
      try {
        // Try session-based endpoint first (for onboarding payments)
        const sessionResponse = await fetch(`/api/payment/status/${orderRef}`);
        if (sessionResponse.ok) {
          return await sessionResponse.json();
        }
        
        // Fall back to V1 endpoint (for dashboard payments)
        const v1Response = await fetch(`/api/v1/payments/status/${orderRef}`);
        if (v1Response.ok) {
          return await v1Response.json();
        }
        
        throw new Error('Payment not found');
      } catch (error) {
        throw new Error('Failed to verify payment status');
      }
    },
  });



  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="w-full max-w-md bg-card border-border">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="relative">
                  <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
                  <div className="absolute inset-0 bg-primary/20 rounded-full animate-pulse" />
                </div>
                <h2 className="mt-4 text-lg font-semibold text-foreground">
                  Verifying Payment...
                </h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Please wait while we confirm your payment
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  if (error || !paymentStatus) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="w-full max-w-md bg-card border-border">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="mx-auto h-12 w-12 bg-destructive/20 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-destructive" />
                </div>
                <h2 className="mt-4 text-lg font-semibold text-foreground">
                  Payment Verification Failed
                </h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  We couldn't verify your payment. Please contact support.
                </p>
                <div className="mt-6">
                  <div className="text-center text-sm text-muted-foreground">
                    This page will close automatically in {countdown} seconds...
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="container mx-auto max-w-2xl">
        
        {/* Success Animation */}
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, type: "spring", stiffness: 100 }}
          className="text-center mb-8"
        >
          <div className="relative">
            <div className="mx-auto h-24 w-24 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center shadow-2xl">
              <CheckCircle className="h-12 w-12 text-white" />
            </div>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, duration: 0.8, type: "spring" }}
              className="absolute -top-2 -right-2"
            >
              <div className="h-8 w-8 bg-primary-gold rounded-full flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-yellow-800" />
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Main Success Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          <Card className="bg-card border-border shadow-2xl">
            <CardHeader className="text-center pb-4">
              <Badge variant="secondary" className="mx-auto mb-4 bg-purple-500/20 text-purple-300 border-purple-500/30">
                <Trophy className="w-3 h-3 mr-1" />
                Payment Successful
              </Badge>
              <CardTitle className="text-3xl font-bold text-foreground mb-2">
                Congratulations! 🎉
              </CardTitle>
              <p className="text-muted-foreground text-lg">
                Your Deal Room access has been activated! You now have access to:
              </p>
              <div className="mt-4 flex items-center justify-center space-x-2 text-sm text-primary">
                <Clock className="w-4 h-4" />
                <span>Auto-closing in {countdown} seconds</span>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {/* Payment Details */}
              {paymentStatus && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4, duration: 0.5 }}
                  className="bg-secondary/50 rounded-lg p-4 border border-border"
                >
                  <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Transaction Details
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Order Reference:</span>
                      <span className="font-mono text-xs text-foreground bg-secondary px-2 py-1 rounded">
                        {orderRef}
                      </span>
                    </div>
                    {(paymentStatus as any).amount && (
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Amount:</span>
                        <span className="font-semibold text-foreground">
                          {(paymentStatus as any).currency} {(paymentStatus as any).amount}
                        </span>
                      </div>
                    )}
                    {(paymentStatus as any).gatewayTransactionId && (
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Transaction ID:</span>
                        <span className="font-mono text-xs text-foreground bg-secondary px-2 py-1 rounded">
                          {(paymentStatus as any).gatewayTransactionId}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Status:</span>
                      <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        {(paymentStatus as any).status}
                      </Badge>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Next Steps */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.5 }}
                className="bg-gradient-to-r from-primary/10 to-primary-gold/10 rounded-lg p-4 border border-primary/20"
              >
                <h3 className="text-sm font-semibold text-primary mb-3 flex items-center">
                  <Star className="w-4 h-4 mr-2" />
                  What's Next?
                </h3>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center text-purple-300">
                    <CheckCircle className="w-4 h-4 mr-3 text-purple-400" />
                    Verified investor matches
                  </div>
                  <div className="flex items-center text-purple-300">
                    <CheckCircle className="w-4 h-4 mr-3 text-purple-400" />
                    Investment certificates and reports
                  </div>
                  <div className="flex items-center text-purple-300">
                    <CheckCircle className="w-4 h-4 mr-3 text-purple-400" />
                    Direct investor connections
                  </div>
                </div>
              </motion.div>

              {/* Auto-close Notice */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8, duration: 0.5 }}
                className="text-center pt-4"
              >
                <div className="bg-primary/10 rounded-lg p-4 border border-primary/20">
                  <div className="flex items-center justify-center space-x-3 text-primary">
                    <div className="relative">
                      <Clock className="w-6 h-6" />
                      <motion.div
                        className="absolute inset-0 border-2 border-primary rounded-full"
                        initial={{ scale: 1, opacity: 0.7 }}
                        animate={{ scale: 1.5, opacity: 0 }}
                        transition={{ duration: 1, repeat: Infinity }}
                      />
                    </div>
                    <div>
                      <div className="font-semibold text-lg">{countdown}</div>
                      <div className="text-xs text-muted-foreground">seconds remaining</div>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    Continue to Dashboard
                  </p>
                </div>
              </motion.div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Security Notice */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.0, duration: 0.6 }}
          className="text-center mt-6"
        >
          <div className="flex items-center justify-center text-muted-foreground text-sm">
            <Shield className="w-4 h-4 mr-2" />
            Secure payment processing powered by Telr
          </div>
        </motion.div>
      </div>
    </div>
  );
}