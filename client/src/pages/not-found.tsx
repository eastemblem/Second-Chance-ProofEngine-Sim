import { useState, useEffect } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Home, ArrowLeft, Compass, Star, Sparkles } from "lucide-react";
import Footer from "@/components/footer";

export default function NotFound() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-background">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-64 h-64 bg-gradient-to-br from-primary/20 to-primary-gold/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-gradient-to-br from-primary-gold/15 to-primary/15 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-gradient-to-r from-primary/10 to-primary-gold/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 flex items-center justify-center min-h-screen px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-2xl mx-auto text-center"
        >
          {/* Animated 404 Number */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mb-8"
          >
            <h1 className="text-8xl md:text-9xl font-bold gradient-text leading-tight">
              404
            </h1>
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className="inline-block"
            >
              <Sparkles className="w-12 h-12 text-primary-gold mx-auto" />
            </motion.div>
          </motion.div>

          {/* Main Content Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <Card className="bg-card/80 backdrop-blur-sm border shadow-xl">
              <CardContent className="pt-8 pb-8 px-8">
                <div className="space-y-6">
                  <div className="space-y-3">
                    <h2 className="text-3xl md:text-4xl font-bold text-foreground">
                      Lost in the Journey?
                    </h2>
                    <p className="text-lg text-muted-foreground max-w-lg mx-auto">
                      Looks like this page took a detour from the Second Chance platform. 
                      Don't worry, every great entrepreneur faces unexpected paths!
                    </p>
                  </div>

                  {/* Popular Actions */}
                  <div className="grid md:grid-cols-3 gap-4 mt-8">
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Link href="/">
                        <Button 
                          size="lg" 
                          className="w-full gradient-button h-auto py-4"
                        >
                          <Home className="w-5 h-5 mr-2" />
                          <div className="text-left">
                            <div className="font-semibold">Home</div>
                            <div className="text-xs opacity-90">Start your journey</div>
                          </div>
                        </Button>
                      </Link>
                    </motion.div>

                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Link href="/onboarding">
                        <Button 
                          size="lg" 
                          variant="outline" 
                          className="w-full border-primary hover:bg-primary/10 h-auto py-4"
                        >
                          <Compass className="w-5 h-5 mr-2 text-primary" />
                          <div className="text-left">
                            <div className="font-semibold">Get Started</div>
                            <div className="text-xs text-muted-foreground">Begin onboarding</div>
                          </div>
                        </Button>
                      </Link>
                    </motion.div>

                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Button 
                        size="lg" 
                        variant="outline" 
                        className="w-full border-primary-gold hover:bg-primary-gold/10 h-auto py-4"
                        onClick={() => window.history.back()}
                      >
                        <ArrowLeft className="w-5 h-5 mr-2 text-primary-gold" />
                        <div className="text-left">
                          <div className="font-semibold">Go Back</div>
                          <div className="text-xs text-muted-foreground">Previous page</div>
                        </div>
                      </Button>
                    </motion.div>
                  </div>

                  {/* Additional Help */}
                  <div className="pt-6 border-t border-border">
                    <p className="text-sm text-muted-foreground mb-4">
                      Still can't find what you're looking for?
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                      <Link href="/privacy">
                        <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80 hover:bg-primary/10">
                          Privacy Policy
                        </Button>
                      </Link>
                      <Link href="/terms">
                        <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80 hover:bg-primary/10">
                          Terms & Conditions
                        </Button>
                      </Link>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-primary hover:text-primary/80 hover:bg-primary/10"
                        onClick={() => window.location.href = "mailto:info@eastemblem.com"}
                      >
                        Contact Support
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Motivational Quote */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="mt-8"
          >
            <div className="bg-gradient-to-r from-primary/10 to-primary-gold/10 rounded-xl p-6 border border-primary/20">
              <div className="flex items-center justify-center mb-3">
                <Star className="w-5 h-5 text-primary-gold mr-2" />
                <span className="text-sm font-medium text-foreground">Second Chance Wisdom</span>
                <Star className="w-5 h-5 text-primary-gold ml-2" />
              </div>
              <blockquote className="text-muted-foreground italic">
                "Every detour is an opportunity to discover a better path. Your second chance starts with your next step."
              </blockquote>
            </div>
          </motion.div>
        </motion.div>
      </div>
      
      <Footer />
    </div>
  );
}
