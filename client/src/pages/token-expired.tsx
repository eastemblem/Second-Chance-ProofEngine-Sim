import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, Mail, ArrowLeft, RefreshCw } from "lucide-react";
import Logo from "@/components/logo";
import Footer from "@/components/footer";

interface TokenExpiredPageProps {
  reason?: 'expired' | 'already_verified' | 'invalid';
  email?: string;
}

export default function TokenExpiredPage() {
  const [, setLocation] = useLocation();
  const [reason, setReason] = useState<'expired' | 'already_verified' | 'invalid'>('expired');
  const [email, setEmail] = useState<string>('');

  useEffect(() => {
    // Get reason and email from URL params
    const urlParams = new URLSearchParams(window.location.search);
    const reasonParam = urlParams.get('reason') as 'expired' | 'already_verified' | 'invalid';
    const emailParam = urlParams.get('email');
    
    if (reasonParam) setReason(reasonParam);
    if (emailParam) setEmail(emailParam);
  }, []);

  const getTitle = () => {
    switch (reason) {
      case 'already_verified':
        return 'Email Already Verified';
      case 'invalid':
        return 'Invalid Verification Link';
      default:
        return 'Verification Link Expired';
    }
  };

  const getDescription = () => {
    switch (reason) {
      case 'already_verified':
        return 'Your email has already been verified. You can proceed to set your password or log in.';
      case 'invalid':
        return 'This verification link is invalid or malformed. Please check the link or request a new one.';
      default:
        return 'Your verification link has expired. Verification links are valid for 24 hours for security reasons.';
    }
  };

  const getIcon = () => {
    switch (reason) {
      case 'already_verified':
        return <RefreshCw className="w-12 h-12 text-green-500" />;
      case 'invalid':
        return <AlertCircle className="w-12 h-12 text-red-500" />;
      default:
        return <AlertCircle className="w-12 h-12 text-yellow-500" />;
    }
  };

  const getActionButton = () => {
    if (reason === 'already_verified') {
      return (
        <div className="space-y-3">
          <Button 
            className="w-full gradient-button"
            onClick={() => setLocation('/set-password')}
          >
            Set Password
          </Button>
          <Button 
            variant="outline" 
            className="w-full"
            onClick={() => setLocation('/login')}
          >
            Go to Login
          </Button>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        <Button 
          className="w-full gradient-button"
          onClick={() => setLocation('/')}
        >
          <Mail className="w-4 h-4 mr-2" />
          Start New Validation
        </Button>
        <Button 
          variant="outline" 
          className="w-full"
          onClick={() => setLocation('/login')}
        >
          Try Login Instead
        </Button>
      </div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1 bg-gradient-to-br from-background via-card to-background px-4 py-8">
        <div className="max-w-md mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <Logo size="md" />
          </div>

          {/* Main Card */}
          <Card className="shadow-lg border-border/50">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center">
                {getIcon()}
              </div>
              <CardTitle className="text-xl gradient-text">
                {getTitle()}
              </CardTitle>
              <CardDescription className="text-base">
                {getDescription()}
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {email && (
                <div className="p-3 rounded-lg bg-muted/50 border border-border/30">
                  <p className="text-sm text-muted-foreground mb-1">Email Address:</p>
                  <p className="font-medium">{email}</p>
                </div>
              )}

              {reason === 'expired' && (
                <div className="p-4 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
                  <h4 className="font-medium text-yellow-800 dark:text-yellow-200 mb-2">
                    Why did this happen?
                  </h4>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300">
                    For security reasons, verification links expire after 24 hours. 
                    This helps protect your account from unauthorized access.
                  </p>
                </div>
              )}

              {reason === 'already_verified' && (
                <div className="p-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                  <h4 className="font-medium text-green-800 dark:text-green-200 mb-2">
                    Good news!
                  </h4>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    Your email is already verified. You can now set your password or log in to your account.
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              {getActionButton()}

              {/* Back to Home */}
              <Button 
                variant="ghost" 
                className="w-full"
                onClick={() => setLocation('/')}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Home
              </Button>
            </CardContent>
          </Card>

          {/* Help Text */}
          <div className="text-center mt-6">
            <p className="text-sm text-muted-foreground">
              Need help? Contact our support team for assistance.
            </p>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}