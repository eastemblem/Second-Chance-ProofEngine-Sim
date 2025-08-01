import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Loader2, Home, Receipt } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

export default function PaymentSuccess() {
  const [, setLocation] = useLocation();
  const [orderRef, setOrderRef] = useState<string | null>(null);

  useEffect(() => {
    // Get order reference from URL params - support both 'ref' and 'payment_id'
    const urlParams = new URLSearchParams(window.location.search);
    const ref = urlParams.get('ref') || urlParams.get('payment_id');
    setOrderRef(ref);
  }, []);

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

  const handleGoHome = () => {
    setLocation('/dashboard');
  };

  const handleViewReceipt = () => {
    if (orderRef) {
      window.open(`/api/v1/payments/receipt/${orderRef}`, '_blank');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <Loader2 className="mx-auto h-12 w-12 animate-spin text-green-600" />
              <h2 className="mt-4 text-lg font-semibold text-gray-900">
                Verifying Payment...
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                Please wait while we confirm your payment
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !paymentStatus) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-rose-100 flex items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="mx-auto h-12 w-12 bg-red-100 rounded-full flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-red-600" />
              </div>
              <h2 className="mt-4 text-lg font-semibold text-gray-900">
                Payment Verification Failed
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                We couldn't verify your payment. Please contact support.
              </p>
              <div className="mt-6">
                <Button onClick={handleGoHome} className="w-full">
                  <Home className="mr-2 h-4 w-4" />
                  Go to Dashboard
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto h-16 w-16 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900 mt-4">
            Payment Successful!
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center space-y-4">
            <p className="text-gray-600">
              Your payment has been processed successfully. Thank you for your purchase!
            </p>
            
            {paymentStatus && (
              <div className="bg-gray-50 rounded-lg p-4 text-left">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Order Reference:</span>
                    <span className="font-mono text-xs">{orderRef}</span>
                  </div>
                  {(paymentStatus as any).amount && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Amount:</span>
                      <span className="font-semibold">
                        {(paymentStatus as any).currency} {(paymentStatus as any).amount}
                      </span>
                    </div>
                  )}
                  {(paymentStatus as any).gatewayTransactionId && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Transaction ID:</span>
                      <span className="font-mono text-xs">{(paymentStatus as any).gatewayTransactionId}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status:</span>
                    <span className="font-semibold text-green-600 capitalize">
                      {(paymentStatus as any).status}
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div className="flex space-x-3 pt-4">
              <Button onClick={handleViewReceipt} variant="outline" className="flex-1">
                <Receipt className="mr-2 h-4 w-4" />
                Receipt
              </Button>
              <Button onClick={handleGoHome} className="flex-1">
                <Home className="mr-2 h-4 w-4" />
                Dashboard
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}