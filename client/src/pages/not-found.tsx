import { useState, useEffect } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Home, ArrowLeft, Search, Compass, Star, Sparkles } from "lucide-react";

export default function NotFound() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-amber-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-purple-50 via-white to-amber-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-64 h-64 bg-gradient-to-br from-purple-200/30 to-amber-200/30 dark:from-purple-500/20 dark:to-amber-500/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-gradient-to-br from-amber-200/20 to-purple-200/20 dark:from-amber-500/15 dark:to-purple-500/15 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-gradient-to-r from-purple-100/10 to-amber-100/10 dark:from-purple-600/10 dark:to-amber-600/10 rounded-full blur-3xl"></div>
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
            <h1 className="text-8xl md:text-9xl font-bold bg-gradient-to-r from-purple-600 via-purple-500 to-amber-500 dark:from-purple-400 dark:via-purple-300 dark:to-amber-400 bg-clip-text text-transparent leading-tight">
              404
            </h1>
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className="inline-block"
            >
              <Sparkles className="w-12 h-12 text-amber-400 dark:text-amber-300 mx-auto" />
            </motion.div>
          </motion.div>

          {/* Main Content Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-purple-100 dark:border-purple-800 shadow-xl">
              <CardContent className="pt-8 pb-8 px-8">
                <div className="space-y-6">
                  <div className="space-y-3">
                    <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
                      Lost in the Journey?
                    </h2>
                    <p className="text-lg text-gray-600 dark:text-gray-300 max-w-lg mx-auto">
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
                          className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white shadow-lg border-0 h-auto py-4"
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
                          className="w-full border-purple-200 dark:border-purple-700 hover:bg-purple-50 dark:hover:bg-purple-900/30 dark:text-white h-auto py-4"
                        >
                          <Compass className="w-5 h-5 mr-2 text-purple-600 dark:text-purple-400" />
                          <div className="text-left">
                            <div className="font-semibold">Get Started</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">Begin onboarding</div>
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
                        className="w-full border-amber-200 dark:border-amber-700 hover:bg-amber-50 dark:hover:bg-amber-900/30 dark:text-white h-auto py-4"
                        onClick={() => window.history.back()}
                      >
                        <ArrowLeft className="w-5 h-5 mr-2 text-amber-600 dark:text-amber-400" />
                        <div className="text-left">
                          <div className="font-semibold">Go Back</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">Previous page</div>
                        </div>
                      </Button>
                    </motion.div>
                  </div>

                  {/* Additional Help */}
                  <div className="pt-6 border-t border-gray-100 dark:border-gray-700">
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                      Still can't find what you're looking for?
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                      <Link href="/privacy">
                        <Button variant="ghost" size="sm" className="text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-900/30">
                          Privacy Policy
                        </Button>
                      </Link>
                      <Link href="/terms">
                        <Button variant="ghost" size="sm" className="text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-900/30">
                          Terms & Conditions
                        </Button>
                      </Link>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-900/30"
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
            <div className="bg-gradient-to-r from-purple-500/10 to-amber-500/10 dark:from-purple-500/20 dark:to-amber-500/20 rounded-xl p-6 border border-purple-200/50 dark:border-purple-700/50">
              <div className="flex items-center justify-center mb-3">
                <Star className="w-5 h-5 text-amber-500 dark:text-amber-400 mr-2" />
                <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Second Chance Wisdom</span>
                <Star className="w-5 h-5 text-amber-500 dark:text-amber-400 ml-2" />
              </div>
              <blockquote className="text-gray-700 dark:text-gray-300 italic">
                "Every detour is an opportunity to discover a better path. Your second chance starts with your next step."
              </blockquote>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
