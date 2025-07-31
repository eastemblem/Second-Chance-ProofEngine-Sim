import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Ban, Home, RotateCcw, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

export default function PaymentCancelled() {
  const [, setLocation] = useLocation();
  const [orderRef, setOrderRef] = useState<string | null>(null);

  useEffect(() => {
    // Get order reference from URL params
    const urlParams = new URLSearchParams(window.location.search);
    const ref = urlParams.get('ref');
    setOrderRef(ref);
  }, []);

  // Query payment status to confirm cancellation
  const { data: paymentStatus, isLoading } = useQuery({
    queryKey: ['/api/v1/payments/status', orderRef],
    enabled: !!orderRef,
    retry: 1,
  });

  const handleGoHome = () => {
    setLocation('/dashboard');
  };

  const handleRetryPayment = () => {
    setLocation('/payment-test');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-100 flex items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <Loader2 className="mx-auto h-12 w-12 animate-spin text-orange-600" />
              <h2 className="mt-4 text-lg font-semibold text-gray-900">
                Checking Payment Status...
              </h2>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-100 flex items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto h-16 w-16 bg-orange-100 rounded-full flex items-center justify-center">
            <Ban className="h-8 w-8 text-orange-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900 mt-4">
            Payment Cancelled
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center space-y-4">
            <p className="text-gray-600">
              You cancelled the payment process. No charges have been made to your account.
            </p>
            
            {paymentStatus && orderRef && (
              <div className="bg-gray-50 rounded-lg p-4 text-left">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Order Reference:</span>
                    <span className="font-mono text-xs">{orderRef}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status:</span>
                    <span className="font-semibold text-orange-600 capitalize">
                      Cancelled
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left">
              <h4 className="font-medium text-blue-900 mb-2">What happens next?</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• No charges have been made</li>
                <li>• You can try the payment again anytime</li>
                <li>• Your order has been cancelled</li>
                <li>• Contact support if you need assistance</li>
              </ul>
            </div>

            <div className="flex space-x-3 pt-4">
              <Button onClick={handleRetryPayment} className="flex-1">
                <RotateCcw className="mr-2 h-4 w-4" />
                Try Again
              </Button>
              <Button onClick={handleGoHome} variant="outline" className="flex-1">
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