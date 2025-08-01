import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Smartphone, 
  ExternalLink, 
  CheckCircle, 
  XCircle, 
  Clock, 
  RefreshCw,
  AlertTriangle 
} from 'lucide-react';

interface MobilePaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  paymentUrl: string;
  paymentId: string;
  packageType: string;
  amount: string;
  onStatusCheck: () => Promise<void>;
  currentStatus: 'pending' | 'completed' | 'failed' | 'cancelled' | 'processing';
  statusMessage?: string;
}

export function MobilePaymentModal({
  isOpen,
  onClose,
  paymentUrl,
  paymentId,
  packageType,
  amount,
  onStatusCheck,
  currentStatus,
  statusMessage
}: MobilePaymentModalProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [hasOpenedPayment, setHasOpenedPayment] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  
  useEffect(() => {
    const checkMobile = () => {
      const userAgent = navigator.userAgent.toLowerCase();
      const isMobileDevice = /android|iphone|ipad|ipod|blackberry|iemobile|opera mini/.test(userAgent);
      const isSmallScreen = window.innerWidth <= 768;
      setIsMobile(isMobileDevice || isSmallScreen);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  const handleOpenPayment = () => {
    setHasOpenedPayment(true);
    
    if (isMobile) {
      // On mobile, open in same tab to avoid popup blockers
      window.location.href = paymentUrl;
    } else {
      // On desktop, open in new tab
      window.open(paymentUrl, '_blank');
    }
  };
  
  const handleStatusCheck = async () => {
    setIsCheckingStatus(true);
    try {
      await onStatusCheck();
    } finally {
      setIsCheckingStatus(false);
    }
  };
  
  const getStatusIcon = () => {
    switch (currentStatus) {
      case 'completed':
        return <CheckCircle className="h-6 w-6 text-green-500" />;
      case 'failed':
        return <XCircle className="h-6 w-6 text-red-500" />;
      case 'cancelled':
        return <AlertTriangle className="h-6 w-6 text-orange-500" />;
      case 'processing':
        return <RefreshCw className="h-6 w-6 text-blue-500 animate-spin" />;
      default:
        return <Clock className="h-6 w-6 text-yellow-500" />;
    }
  };
  
  const getStatusColor = () => {
    switch (currentStatus) {
      case 'completed':
        return 'from-green-500 to-emerald-600';
      case 'failed':
        return 'from-red-500 to-rose-600';
      case 'cancelled':
        return 'from-orange-500 to-amber-600';
      case 'processing':
        return 'from-blue-500 to-indigo-600';
      default:
        return 'from-yellow-500 to-orange-500';
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isMobile ? <Smartphone className="h-5 w-5" /> : <ExternalLink className="h-5 w-5" />}
            {isMobile ? 'Mobile Payment' : 'Payment Window'}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Package Info */}
          <Card>
            <CardContent className="pt-4">
              <div className="text-center space-y-2">
                <h3 className="font-semibold">
                  {packageType === 'foundation' ? 'ProofScaling Foundation Course' : 'Investment Ready Package'}
                </h3>
                <p className="text-2xl font-bold text-primary">{amount} AED</p>
                <p className="text-sm text-muted-foreground">Payment ID: {paymentId}</p>
              </div>
            </CardContent>
          </Card>
          
          {/* Payment Status */}
          <motion.div
            className={`bg-gradient-to-r ${getStatusColor()} rounded-lg p-4 text-white`}
            layout
          >
            <div className="flex items-center gap-3">
              {getStatusIcon()}
              <div>
                <p className="font-medium capitalize">{currentStatus}</p>
                {statusMessage && (
                  <p className="text-sm opacity-90">{statusMessage}</p>
                )}
              </div>
            </div>
          </motion.div>
          
          {/* Instructions */}
          <div className="space-y-3">
            {!hasOpenedPayment ? (
              <div className="text-center space-y-3">
                {isMobile ? (
                  <>
                    <p className="text-sm text-muted-foreground">
                      Tap below to open the secure payment page
                    </p>
                    <Button 
                      onClick={handleOpenPayment} 
                      className="w-full"
                      size="lg"
                    >
                      <Smartphone className="h-4 w-4 mr-2" />
                      Open Payment Page
                    </Button>
                  </>
                ) : (
                  <>
                    <p className="text-sm text-muted-foreground">
                      Click below to open the payment page in a new tab
                    </p>
                    <Button 
                      onClick={handleOpenPayment} 
                      className="w-full"
                      size="lg"
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Open Payment Page
                    </Button>
                  </>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {isMobile ? (
                  <div className="text-center text-sm text-muted-foreground">
                    <p>You'll be redirected to the payment page.</p>
                    <p>Complete your payment and return here to continue.</p>
                  </div>
                ) : (
                  <div className="text-center text-sm text-muted-foreground">
                    <p>Payment page opened in a new tab.</p>
                    <p>Complete your payment and return to this page.</p>
                  </div>
                )}
                
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    onClick={handleOpenPayment}
                    className="flex-1"
                  >
                    {isMobile ? <Smartphone className="h-4 w-4 mr-2" /> : <ExternalLink className="h-4 w-4 mr-2" />}
                    Reopen Payment
                  </Button>
                  <Button 
                    onClick={handleStatusCheck}
                    disabled={isCheckingStatus}
                    className="flex-1"
                  >
                    {isCheckingStatus ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4 mr-2" />
                    )}
                    Check Status
                  </Button>
                </div>
              </div>
            )}
          </div>
          
          {/* Mobile-specific tips */}
          {isMobile && (
            <div className="bg-blue-50 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <Smartphone className="h-4 w-4 text-blue-600 mt-0.5" />
                <div className="text-xs text-blue-800">
                  <p className="font-medium">Mobile Payment Tips:</p>
                  <ul className="list-disc list-inside space-y-1 mt-1">
                    <li>Use your preferred mobile payment method</li>
                    <li>Payment will open in a secure browser page</li>
                    <li>Return to this app after completing payment</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
          
          {/* Auto-status checking notice */}
          {hasOpenedPayment && currentStatus === 'pending' && (
            <div className="text-center text-xs text-muted-foreground">
              <p>Payment status is checked automatically every 10 seconds</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}