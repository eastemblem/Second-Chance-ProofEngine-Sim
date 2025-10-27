import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { LogOut, MapPin } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Logo from "@/components/logo";
import { trackEvent } from "@/lib/analytics";
import { useTokenAuth } from "@/hooks/use-token-auth";
import { useQuery } from "@tanstack/react-query";

export function ValidationMapHeader() {
  const [, setLocation] = useLocation();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [userCountry, setUserCountry] = useState<string | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(true);
  const { toast } = useToast();
  const { user, venture } = useTokenAuth();
  
  const userName = user?.fullName || user?.email?.split("@")[0] || "Founder";
  const userInitial = user?.fullName
    ? user.fullName.charAt(0).toUpperCase()
    : user?.email?.charAt(0).toUpperCase();

  // Fetch validation data for ProofTags count
  const { data: validationData, dataUpdatedAt } = useQuery<any>({
    queryKey: ['/api/v1/dashboard/validation'],
    enabled: !!venture,
  });

  const proofTagsUnlocked = validationData?.proofTagsUnlocked || 0;
  const totalProofTags = validationData?.totalProofTags || 21;

  // Debug logging to trace ProofTag updates
  useEffect(() => {
    console.log('🏷️ ValidationMapHeader - ProofTags updated:', {
      count: proofTagsUnlocked,
      total: totalProofTags,
      dataUpdatedAt: new Date(dataUpdatedAt).toLocaleTimeString(),
      rawData: validationData
    });
  }, [proofTagsUnlocked, dataUpdatedAt]);

  // Detect user's geo location
  useEffect(() => {
    const detectLocation = async () => {
      try {
        setIsLoadingLocation(true);
        
        const response = await fetch('https://ipapi.co/json/');
        if (response.ok) {
          const data = await response.json();
          setUserCountry(data.country_name || data.country || null);
        } else {
          console.warn('Location detection failed');
        }
      } catch (error) {
        console.warn('Location detection error:', error);
      } finally {
        setIsLoadingLocation(false);
      }
    };

    detectLocation();
  }, []);

  const handleSignOut = async () => {
    try {
      setIsLoggingOut(true);
      
      const token = localStorage.getItem('auth_token');
      
      const response = await fetch('/api/auth-token/logout', {
        method: 'POST',
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json'
        },
      });

      if (response.ok) {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
        localStorage.removeItem('user_data');
        localStorage.removeItem('dashboard_data');
        
        if ('caches' in window) {
          caches.keys().then(names => {
            names.forEach(name => {
              caches.delete(name);
            });
          });
        }
        
        trackEvent('logout', 'authentication', 'validation_map_logout_success');
        
        toast({
          title: "Signed Out",
          description: "You have been successfully logged out.",
          duration: 3000,
        });
        
        setLocation('/login');
      } else {
        throw new Error('Sign out failed');
      }
    } catch (error) {
      console.error('Sign out error:', error);
      trackEvent('logout_failed', 'authentication', 'validation_map_logout_error');
      toast({
        title: "Sign Out Error",
        description: "Failed to sign out. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <>
      {/* Top Navbar */}
      <nav className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14 sm:h-16">
            <div className="flex-shrink-0">
              <button
                onClick={() => setLocation('/')}
                className="flex items-center hover:opacity-80 transition-opacity p-1 -ml-1"
              >
                <Logo size="md" showTagline={false} />
              </button>
            </div>

            <div className="flex items-center gap-3 sm:gap-4">
              {!isLoadingLocation && userCountry && (
                <div className="flex items-center gap-1.5 text-xs sm:text-sm text-muted-foreground">
                  <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">{userCountry}</span>
                  <span className="sm:hidden">{userCountry.slice(0, 2)}</span>
                </div>
              )}

              <Button
                variant="outline"
                size="sm"
                onClick={handleSignOut}
                disabled={isLoggingOut}
                className="text-xs sm:text-sm"
                data-testid="button-sign-out"
              >
                <LogOut className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                <span className="hidden sm:inline">Sign Out</span>
                <span className="sm:hidden">Out</span>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* User Greeting Section */}
      <div className="text-white" style={{ backgroundColor: '#0E0E12' }}>
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-r from-purple-500 to-yellow-500 flex items-center justify-center font-bold text-xl text-white">
              {userInitial}
            </div>
            <div className="flex-1">
              <h2 className="text-lg text-gray-300 mb-1">Hi {userName},</h2>
              <h1 className="text-2xl sm:text-3xl font-bold text-white mb-0">
                Welcome to Second Chance!
              </h1>
            </div>
          </div>

          {/* ProofTags Banner */}
          <div className="ml-20">
            <div className="bg-gray-800/60 rounded-lg px-4 py-3 border border-gray-700/50 inline-block">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-base">🎉</span>
                <span className="text-white font-medium text-sm">
                  Congratulations!
                </span>
                <span className="text-gray-300 text-sm">You unlocked</span>
                <span className="text-base">💎</span>
                <span className="text-blue-400 font-bold text-base">
                  {proofTagsUnlocked}
                </span>
                <span className="text-gray-300 text-sm">ProofTags</span>
                <span className="text-gray-400 text-sm">
                  out of {totalProofTags} total
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
