import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Home, RotateCcw, HelpCircle } from 'lucide-react';
import { trackEvent, trackPageView } from '@/lib/analytics';

export default function PaymentError() {
  const [, setLocation] = useLocation();
  const [errorMessage, setErrorMessage] = useState<string>('');

  // GA tracking for payment error
  useEffect(() => {
    trackPageView('/payment/error');
    trackEvent('funnel_payment_error', 'conversion', 'payment_error');
  }, []);

  useEffect(() => {
    // Get error message from URL params
    const urlParams = new URLSearchParams(window.location.search);
    const error = urlParams.get('error');
    setErrorMessage(error || 'An unknown error occurred');
  }, []);

  const handleGoHome = () => {
    setLocation('/dashboard');
  };

  const handleRetryPayment = () => {
    setLocation('/payment-test');
  };

  const handleContactSupport = () => {
    // In a real app, this would open a support form or email
    window.open('mailto:support@secondchance.com?subject=Payment Error&body=' + 
                encodeURIComponent(`I encountered a payment error: ${errorMessage}`), '_blank');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto h-16 w-16 bg-red-100 rounded-full flex items-center justify-center">
            <AlertTriangle className="h-8 w-8 text-red-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900 mt-4">
            Payment Error
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center space-y-4">
            <p className="text-gray-600">
              An error occurred while processing your payment. Please try again or contact support.
            </p>
            
            {errorMessage && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-left">
                <h4 className="font-medium text-red-900 mb-2">Error Details:</h4>
                <p className="text-sm text-red-800 font-mono bg-red-100 p-2 rounded">
                  {errorMessage}
                </p>
              </div>
            )}

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left">
              <h4 className="font-medium text-blue-900 mb-2">Troubleshooting Steps:</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Check your internet connection</li>
                <li>• Try refreshing the page and starting over</li>
                <li>• Clear your browser cache and cookies</li>
                <li>• Try using a different browser or device</li>
                <li>• Contact support if the problem persists</li>
              </ul>
            </div>

            <div className="space-y-3 pt-4">
              <div className="flex space-x-3">
                <Button onClick={handleRetryPayment} className="flex-1">
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Try Again
                </Button>
                <Button onClick={handleGoHome} variant="outline" className="flex-1">
                  <Home className="mr-2 h-4 w-4" />
                  Dashboard
                </Button>
              </div>
              
              <Button 
                onClick={handleContactSupport} 
                variant="ghost" 
                className="w-full text-gray-600 hover:text-gray-800"
              >
                <HelpCircle className="mr-2 h-4 w-4" />
                Contact Support
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}