import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { XCircle, Home, RotateCcw, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

export default function PaymentFailed() {
  const [, setLocation] = useLocation();
  const [orderRef, setOrderRef] = useState<string | null>(null);

  useEffect(() => {
    // Get order reference from URL params
    const urlParams = new URLSearchParams(window.location.search);
    const ref = urlParams.get('ref');
    setOrderRef(ref);
  }, []);

  // Query payment status to get failure details
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
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-rose-100 flex items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <Loader2 className="mx-auto h-12 w-12 animate-spin text-red-600" />
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
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-rose-100 flex items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto h-16 w-16 bg-red-100 rounded-full flex items-center justify-center">
            <XCircle className="h-8 w-8 text-red-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900 mt-4">
            Payment Failed
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center space-y-4">
            <p className="text-gray-600">
              Your payment could not be processed. Please try again or contact support if the problem persists.
            </p>
            
            {paymentStatus && (
              <div className="bg-gray-50 rounded-lg p-4 text-left">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Order Reference:</span>
                    <span className="font-mono text-xs">{orderRef}</span>
                  </div>
                  {(paymentStatus as any).gatewayStatus && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Reason:</span>
                      <span className="text-red-600 font-medium">
                        {(paymentStatus as any).gatewayStatus}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status:</span>
                    <span className="font-semibold text-red-600 capitalize">
                      {(paymentStatus as any).status}
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left">
              <h4 className="font-medium text-blue-900 mb-2">Common Solutions:</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Check your card details and try again</li>
                <li>• Ensure you have sufficient funds</li>
                <li>• Try a different payment method</li>
                <li>• Contact your bank if issues persist</li>
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