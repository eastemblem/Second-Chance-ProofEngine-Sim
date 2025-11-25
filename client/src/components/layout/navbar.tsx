import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { LogOut, User, MapPin, LayoutDashboard, Map, Building2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import Logo from "@/components/logo";
import { trackEvent } from "@/lib/analytics";
import { detectUserCurrency } from "@/lib/currency-utils";

interface NavbarProps {
  showSignOut?: boolean;
  showSignIn?: boolean;
  logoOnly?: boolean;
}

export default function Navbar({ showSignOut = false, showSignIn = false, logoOnly = false }: NavbarProps) {
  const [location, setLocation] = useLocation();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [userCountry, setUserCountry] = useState<string | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(true);
  const { toast } = useToast();
  
  // Determine which page we're on
  const isOnDashboard = location === '/dashboard';
  const isOnValidationMap = location === '/validation-map';
  const isOnDealRoom = location === '/dashboard/deal-room';
  const showDashboardLink = (isOnValidationMap || isOnDealRoom) || (showSignOut && !isOnDashboard);
  const showValidationMapLink = isOnDashboard || isOnDealRoom;

  // Fetch deal room access status from payments API (same as dashboard)
  const { data: dealRoomData } = useQuery<{ success?: boolean; hasAccess?: boolean; ventureStatus?: string }>({
    queryKey: ['/api/v1/payments/deal-room-access'],
    queryFn: async () => {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/v1/payments/deal-room-access', {
        credentials: 'include',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      });
      if (!response.ok) throw new Error('Deal room access check failed');
      return response.json();
    },
    enabled: showSignOut, // Only fetch if user is logged in
    staleTime: 15 * 60 * 1000, // 15 minutes
  });

  // Check if user has deal room access
  const hasDealRoomAccess = dealRoomData?.hasAccess === true;
  // Always show Deal Room link when logged in and on dashboard/validation map
  const showDealRoomLink = showSignOut && (isOnDashboard || isOnValidationMap);

  // Detect user's geo location
  useEffect(() => {
    const detectLocation = async () => {
      try {
        setIsLoadingLocation(true);
        
        // Use the existing IP geolocation API
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
      
      // Get JWT token from localStorage
      const token = localStorage.getItem('auth_token');
      
      const response = await fetch('/api/auth-token/logout', {
        method: 'POST',
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json'
        },
      });

      if (response.ok) {
        // Clear auth and coach data (preserves onboarding, tutorial flags, etc.)
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
        localStorage.removeItem('auth_venture');
        localStorage.removeItem('coach_state');
        localStorage.removeItem('coach_mode_first_seen');
        
        // Clear any browser cached data
        if ('caches' in window) {
          caches.keys().then(names => {
            names.forEach(name => {
              caches.delete(name);
            });
          });
        }
        
        // Track successful logout event
        trackEvent('logout', 'authentication', 'navbar_logout_success');
        
        toast({
          title: "Signed Out",
          description: "You have been successfully logged out.",
          duration: 3000,
        });
        
        // CRITICAL FIX: Redirect immediately without delay
        setLocation('/login');
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
              {/* Location Display */}
              {userCountry && (
                <div className="flex items-center space-x-1 px-3 py-1 bg-primary/10 rounded-lg border border-primary/20">
                  <MapPin className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium text-primary">
                    {isLoadingLocation ? 'Detecting...' : userCountry}
                  </span>
                </div>
              )}
              
              {/* Dashboard Link - shown when NOT on dashboard */}
              {showDashboardLink && (
                <Button
                  variant="ghost"
                  onClick={() => setLocation('/dashboard')}
                  className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors"
                  data-testid="link-dashboard"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span className="hidden sm:inline">Dashboard</span>
                </Button>
              )}

              {/* Validation Map Link - shown when on dashboard or deal room */}
              {showValidationMapLink && (
                <Button
                  variant="ghost"
                  onClick={() => setLocation('/validation-map')}
                  className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors"
                  data-testid="link-validation-map"
                >
                  <Map className="w-4 h-4" />
                  <span className="hidden sm:inline">Validation Map</span>
                </Button>
              )}

              {/* Deal Room Link - only shown when user has access */}
              {showDealRoomLink && hasDealRoomAccess && (
                <Button
                  variant="ghost"
                  onClick={() => setLocation('/dashboard/deal-room')}
                  className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors"
                  data-testid="link-deal-room"
                >
                  <Building2 className="w-4 h-4" />
                  <span className="hidden sm:inline">Deal Room</span>
                </Button>
              )}
              
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