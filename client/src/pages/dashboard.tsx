import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { LogOut, User, Settings } from "lucide-react";
import Logo from "@/components/logo";
import Footer from "@/components/footer";

interface User {
  founderId: string;
  email: string;
  isAuthenticated: boolean;
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const response = await fetch('/api/auth/me');
      
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      } else {
        // Redirect to login if not authenticated
        setLocation('/login');
      }
    } catch (error) {
      console.error('Auth check error:', error);
      setLocation('/login');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
      });

      if (response.ok) {
        toast({
          title: "Logged Out",
          description: "You have been successfully logged out.",
          duration: 3000,
        });
        
        setTimeout(() => {
          setLocation('/');
        }, 1000);
      } else {
        throw new Error('Logout failed');
      }
    } catch (error) {
      console.error('Logout error:', error);
      toast({
        title: "Logout Error",
        description: "Failed to logout. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-card to-background">
        <div className="text-center">
          <div className="w-8 h-8 mx-auto mb-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1 bg-gradient-to-br from-background via-card to-background px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <Logo size="md" />
            <h1 className="text-3xl font-bold gradient-text mt-4 mb-2">Welcome to Your Dashboard</h1>
            <p className="text-muted-foreground">
              Hello {user?.email}! Manage your Second Chance journey from here.
            </p>
          </div>

          {/* Main Dashboard Cards */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {/* Profile Card */}
            <Card>
              <CardHeader>
                <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-gradient-to-r from-primary to-primary-gold flex items-center justify-center">
                  <User className="w-6 h-6 text-white" />
                </div>
                <CardTitle className="text-center">Your Profile</CardTitle>
                <CardDescription className="text-center">
                  Manage your account information
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Email:</span>
                    <span>{user?.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status:</span>
                    <span className="text-green-600">Verified</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Validation Journey Card */}
            <Card>
              <CardHeader>
                <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-gradient-to-r from-primary to-primary-gold flex items-center justify-center">
                  <Settings className="w-6 h-6 text-white" />
                </div>
                <CardTitle className="text-center">Validation Journey</CardTitle>
                <CardDescription className="text-center">
                  Continue your startup validation process
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  className="w-full gradient-button"
                  onClick={() => setLocation('/')}
                >
                  Start New Validation
                </Button>
              </CardContent>
            </Card>

            {/* Account Actions Card */}
            <Card>
              <CardHeader>
                <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-gradient-to-r from-primary to-primary-gold flex items-center justify-center">
                  <LogOut className="w-6 h-6 text-white" />
                </div>
                <CardTitle className="text-center">Account Actions</CardTitle>
                <CardDescription className="text-center">
                  Manage your session and preferences
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={handleLogout}
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Welcome Message */}
          <Card className="bg-gradient-to-r from-primary/10 to-primary-gold/10 border-primary/20">
            <CardContent className="p-6 text-center">
              <h2 className="text-xl font-semibold gradient-text mb-2">
                🎉 Welcome to Second Chance!
              </h2>
              <p className="text-muted-foreground mb-4">
                Your email has been verified and your account is ready. You can now access all platform features and start your validation journey.
              </p>
              <Button 
                className="gradient-button"
                onClick={() => setLocation('/')}
              >
                Explore Platform Features
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}