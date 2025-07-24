import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, LogIn } from "lucide-react";
import Logo from "@/components/logo";
import Footer from "@/components/footer";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast({
        title: "Missing Information",
        description: "Please enter both email and password",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Welcome Back!",
          description: `Hello ${data.founder.fullName}, you're now logged in.`,
          duration: 3000,
        });
        
        // Redirect to dashboard/home after successful login
        setTimeout(() => {
          setLocation('/dashboard');
        }, 1000);
      } else {
        throw new Error(data.error || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: "Login Failed",
        description: error instanceof Error ? error.message : "Please check your credentials and try again",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-[#0f0f0f] via-[#1a1a1a] to-[#0f0f0f]">
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="text-center mb-8">
            <Logo size="lg" showTagline={false} />
          </div>

          {/* Header Icon and Title */}
          <div className="text-center mb-6">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-r from-primary to-primary-gold flex items-center justify-center">
              <LogIn className="w-12 h-12 text-white" />
            </div>
            <h1 className="text-3xl font-bold gradient-text mb-3">Welcome Back</h1>
            <p className="text-gray-400 text-lg">
              Sign in to your Second Chance account
            </p>
          </div>

          {/* Login Form */}
          <Card className="bg-[#1a1a1a] border-[#2a2a2a] shadow-2xl">
            <CardHeader className="text-center">
              <CardTitle className="text-xl text-white">Sign In to Continue</CardTitle>
              <CardDescription className="text-gray-400">
                Access your founder dashboard and continue your journey
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-3">
                  <Label htmlFor="email" className="text-white font-medium">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="bg-[#2a2a2a] border-[#3a3a3a] text-white placeholder-gray-500 focus:border-primary focus:ring-primary"
                    required
                  />
                </div>

                <div className="space-y-3">
                  <Label htmlFor="password" className="text-white font-medium">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="pr-10 bg-[#2a2a2a] border-[#3a3a3a] text-white placeholder-gray-500 focus:border-primary focus:ring-primary"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-primary transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full gradient-button py-3 text-lg font-semibold"
                  disabled={isLoading}
                >
                  {isLoading ? "Signing In..." : "Sign In & Continue"}
                </Button>
              </form>

              <div className="mt-6 text-center space-y-4 pt-6 border-t border-[#3a3a3a]">
                <p className="text-sm text-gray-400">
                  <a 
                    href="/forgot-password" 
                    className="text-primary hover:text-primary-gold font-medium transition-colors"
                  >
                    Forgot your password?
                  </a>
                </p>
                <p className="text-sm text-gray-400">
                  Don't have an account?{" "}
                  <button
                    onClick={() => setLocation('/')}
                    className="text-primary hover:text-primary-gold font-medium transition-colors"
                  >
                    Start Your Validation
                  </button>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}