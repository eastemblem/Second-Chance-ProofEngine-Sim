import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { LogOut, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Logo from "@/components/logo";
import { trackEvent } from "@/lib/analytics";

interface NavbarProps {
  showSignOut?: boolean;
  showSignIn?: boolean;
  logoOnly?: boolean;
}

export default function Navbar({ showSignOut = false, showSignIn = false, logoOnly = false }: NavbarProps) {
  const [, setLocation] = useLocation();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const { toast } = useToast();

  const handleSignOut = async () => {
    try {
      setIsLoggingOut(true);
      
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
      });

      if (response.ok) {
        // Track successful logout event
        trackEvent('logout', 'authentication', 'navbar_logout_success');
        
        toast({
          title: "Signed Out",
          description: "You have been successfully signed out.",
          duration: 3000,
        });
        
        setTimeout(() => {
          setLocation('/');
        }, 1000);
      } else {
        throw new Error('Sign out failed');
      }
    } catch (error) {
      console.error('Sign out error:', error);
      // Track failed logout event
      trackEvent('logout_failed', 'authentication', 'navbar_logout_error');
      toast({
        title: "Sign Out Error",
        description: "Failed to sign out. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleSignIn = () => {
    setLocation('/login');
  };

  return (
    <nav className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-14 sm:h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <button
              onClick={() => setLocation('/')}
              className="flex items-center hover:opacity-80 transition-opacity p-1 -ml-1"
            >
              <Logo size="md" showTagline={false} />
            </button>
          </div>

          {/* Navigation Items */}
          {!logoOnly && (
            <div className="flex items-center space-x-2 sm:space-x-4">
              {showSignIn && (
                <Button
                  variant="outline"
                  onClick={handleSignIn}
                  className="px-4 py-2 text-sm border-primary-gold text-primary-gold hover:bg-primary-gold hover:text-background transition-all duration-300"
                >
                  Sign In
                </Button>
              )}

              {showSignOut && (
                <Button
                  variant="outline"
                  onClick={handleSignOut}
                  disabled={isLoggingOut}
                  className="px-4 py-2 text-sm border-primary-gold text-primary-gold hover:bg-primary-gold hover:text-background transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoggingOut ? 'Signing Out...' : 'Sign Out'}
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}