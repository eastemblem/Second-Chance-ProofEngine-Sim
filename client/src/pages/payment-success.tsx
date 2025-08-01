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
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="w-full max-w-md bg-white/10 backdrop-blur-lg border-white/20">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="relative">
                  <Loader2 className="mx-auto h-12 w-12 animate-spin text-blue-400" />
                  <div className="absolute inset-0 bg-blue-400/20 rounded-full animate-pulse" />
                </div>
                <h2 className="mt-4 text-lg font-semibold text-white">
                  Verifying Payment...
                </h2>
                <p className="mt-2 text-sm text-gray-300">
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
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="w-full max-w-md bg-white/10 backdrop-blur-lg border-white/20">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="mx-auto h-12 w-12 bg-red-500/20 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-red-400" />
                </div>
                <h2 className="mt-4 text-lg font-semibold text-white">
                  Payment Verification Failed
                </h2>
                <p className="mt-2 text-sm text-gray-300">
                  We couldn't verify your payment. Please contact support.
                </p>
                <div className="mt-6">
                  <div className="text-center text-sm text-gray-400">
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
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-6">
      <div className="container mx-auto max-w-2xl">
        
        {/* Success Animation */}
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, type: "spring", stiffness: 100 }}
          className="text-center mb-8"
        >
          <div className="relative">
            <div className="mx-auto h-24 w-24 bg-gradient-to-br from-green-400 to-emerald-600 rounded-full flex items-center justify-center shadow-2xl">
              <CheckCircle className="h-12 w-12 text-white" />
            </div>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, duration: 0.8, type: "spring" }}
              className="absolute -top-2 -right-2"
            >
              <div className="h-8 w-8 bg-yellow-400 rounded-full flex items-center justify-center">
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
          <Card className="bg-white/10 backdrop-blur-lg border-white/20 shadow-2xl">
            <CardHeader className="text-center pb-4">
              <Badge variant="secondary" className="mx-auto mb-4 bg-green-500/20 text-green-300 border-green-500/30">
                <Trophy className="w-3 h-3 mr-1" />
                Payment Successful
              </Badge>
              <CardTitle className="text-3xl font-bold text-white mb-2">
                Welcome to ProofScaling! 🎉
              </CardTitle>
              <p className="text-gray-300 text-lg">
                Your payment has been processed successfully. Your journey to investment readiness begins now!
              </p>
              <div className="mt-4 flex items-center justify-center space-x-2 text-sm text-blue-300">
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
                  className="bg-white/5 backdrop-blur-sm rounded-lg p-4 border border-white/10"
                >
                  <h3 className="text-sm font-semibold text-gray-300 mb-3 flex items-center">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Transaction Details
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Order Reference:</span>
                      <span className="font-mono text-xs text-white bg-white/10 px-2 py-1 rounded">
                        {orderRef}
                      </span>
                    </div>
                    {(paymentStatus as any).amount && (
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Amount:</span>
                        <span className="font-semibold text-white">
                          {(paymentStatus as any).currency} {(paymentStatus as any).amount}
                        </span>
                      </div>
                    )}
                    {(paymentStatus as any).gatewayTransactionId && (
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Transaction ID:</span>
                        <span className="font-mono text-xs text-white bg-white/10 px-2 py-1 rounded">
                          {(paymentStatus as any).gatewayTransactionId}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Status:</span>
                      <Badge className="bg-green-500/20 text-green-300 border-green-500/30">
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
                className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-lg p-4 border border-blue-500/20"
              >
                <h3 className="text-sm font-semibold text-blue-300 mb-3 flex items-center">
                  <Star className="w-4 h-4 mr-2" />
                  What's Next?
                </h3>
                <div className="space-y-2 text-sm text-gray-300">
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-blue-400 rounded-full mr-3"></div>
                    Access your ProofScaling course materials
                  </div>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-purple-400 rounded-full mr-3"></div>
                    Complete your venture analysis dashboard
                  </div>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-green-400 rounded-full mr-3"></div>
                    Start implementing your personalized roadmap
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
                <div className="bg-blue-500/10 rounded-lg p-4 border border-blue-500/20">
                  <div className="flex items-center justify-center space-x-3 text-blue-300">
                    <div className="relative">
                      <Clock className="w-6 h-6" />
                      <motion.div
                        className="absolute inset-0 border-2 border-blue-400 rounded-full"
                        initial={{ scale: 1, opacity: 0.7 }}
                        animate={{ scale: 1.5, opacity: 0 }}
                        transition={{ duration: 1, repeat: Infinity }}
                      />
                    </div>
                    <div>
                      <div className="font-semibold text-lg">{countdown}</div>
                      <div className="text-xs text-gray-400">seconds remaining</div>
                    </div>
                  </div>
                  <p className="text-sm text-gray-300 mt-2">
                    This window will close automatically. You can return to your dashboard anytime.
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
          <div className="flex items-center justify-center text-gray-400 text-sm">
            <Shield className="w-4 h-4 mr-2" />
            Secure payment processing powered by Telr
          </div>
        </motion.div>
      </div>
    </div>
  );
}