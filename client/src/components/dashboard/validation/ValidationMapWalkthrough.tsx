import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Lightbulb, Target, TrendingUp, Award, CheckCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ValidationMapWalkthroughProps {
  isLoading: boolean;
  onLoadingComplete?: () => void;
}

const walkthroughScreens = [
  {
    id: 1,
    icon: Lightbulb,
    iconColor: "text-yellow-400",
    iconBg: "bg-yellow-500/20",
    title: "What is the Validation Map?",
    description: "Your strategic roadmap to validate business assumptions before you invest heavily in building.",
    content: [
      "Transform abstract ideas into concrete, testable experiments",
      "Get real-world evidence about your startup's viability",
      "Validate or invalidate key business hypotheses systematically",
    ],
  },
  {
    id: 2,
    icon: Target,
    iconColor: "text-purple-400",
    iconBg: "bg-purple-500/20",
    title: "AI-Curated Experiments",
    description: "Each experiment is personalized based on your pitch analysis and business model.",
    content: [
      "Tests specific 'leap of faith' assumptions about your business",
      "Covers 4 validation spheres: Desirability, Viability, Feasibility, and Scaling",
      "Designed to provide maximum learning with minimum resources",
    ],
  },
  {
    id: 3,
    icon: TrendingUp,
    iconColor: "text-blue-400",
    iconBg: "bg-blue-500/20",
    title: "Track & Measure Results",
    description: "Build a data-driven case for your startup's potential with real metrics.",
    content: [
      "Define target metrics for each experiment",
      "Record actual results and observations",
      "Document insights and learnings along the way",
    ],
  },
  {
    id: 4,
    icon: Award,
    iconColor: "text-green-400",
    iconBg: "bg-green-500/20",
    title: "Unlock ProofTags",
    description: "Complete experiments to earn validation badges that signal credibility to investors.",
    content: [
      "Each completed experiment unlocks a ProofTag",
      "ProofTags show systematic validation to investors",
      "Founders with completed validations are 3x more likely to secure meetings",
    ],
  },
];

export function ValidationMapWalkthrough({ isLoading, onLoadingComplete }: ValidationMapWalkthroughProps) {
  const [currentScreen, setCurrentScreen] = useState(0);

  // Auto-advance when loading completes
  useEffect(() => {
    if (!isLoading && onLoadingComplete) {
      onLoadingComplete();
    }
  }, [isLoading, onLoadingComplete]);

  const handleNext = () => {
    if (currentScreen < walkthroughScreens.length - 1) {
      setCurrentScreen(currentScreen + 1);
    }
  };

  const handlePrev = () => {
    if (currentScreen > 0) {
      setCurrentScreen(currentScreen - 1);
    }
  };

  const handleDotClick = (index: number) => {
    setCurrentScreen(index);
  };

  const screen = walkthroughScreens[currentScreen];
  const Icon = screen.icon;

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="rounded-xl border border-gray-700/50 p-8" style={{ backgroundColor: '#0E0E12' }}>
        
        {/* Loading Status Bar */}
        {isLoading && (
          <div className="mb-8 flex items-center justify-center gap-3 p-4 bg-purple-500/10 border border-purple-500/20 rounded-lg">
            <Loader2 className="h-5 w-5 animate-spin text-purple-400" />
            <p className="text-purple-300 text-sm">
              Generating your personalized validation experiments...
            </p>
          </div>
        )}

        {/* Walkthrough Content */}
        <div className="min-h-[400px] relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentScreen}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              {/* Icon */}
              <div className="flex justify-center mb-6">
                <div className={`w-20 h-20 rounded-full ${screen.iconBg} flex items-center justify-center`}>
                  <Icon className={`h-10 w-10 ${screen.iconColor}`} />
                </div>
              </div>

              {/* Title */}
              <h2 className="text-3xl font-bold text-white text-center mb-4">
                {screen.title}
              </h2>

              {/* Description */}
              <p className="text-lg text-gray-300 text-center max-w-2xl mx-auto mb-8">
                {screen.description}
              </p>

              {/* Content Points */}
              <div className="max-w-2xl mx-auto space-y-4">
                {screen.content.map((point, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 + index * 0.1 }}
                    className="flex items-start gap-3"
                  >
                    <CheckCircle className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
                    <p className="text-gray-300">{point}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Navigation */}
        <div className="mt-12 flex items-center justify-between">
          {/* Previous Button */}
          <Button
            onClick={handlePrev}
            disabled={currentScreen === 0}
            variant="ghost"
            className="text-gray-400 hover:text-white disabled:opacity-30"
            data-testid="button-walkthrough-prev"
          >
            <ChevronLeft className="mr-1 h-4 w-4" />
            Previous
          </Button>

          {/* Dots Navigation */}
          <div className="flex gap-2">
            {walkthroughScreens.map((_, index) => (
              <button
                key={index}
                onClick={() => handleDotClick(index)}
                className={`w-2.5 h-2.5 rounded-full transition-all ${
                  index === currentScreen
                    ? "bg-purple-500 w-8"
                    : "bg-gray-600 hover:bg-gray-500"
                }`}
                data-testid={`dot-walkthrough-${index}`}
                aria-label={`Go to screen ${index + 1}`}
              />
            ))}
          </div>

          {/* Next Button */}
          <Button
            onClick={handleNext}
            disabled={currentScreen === walkthroughScreens.length - 1}
            variant="ghost"
            className="text-gray-400 hover:text-white disabled:opacity-30"
            data-testid="button-walkthrough-next"
          >
            Next
            <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        </div>

        {/* Progress Indicator */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            {currentScreen + 1} of {walkthroughScreens.length}
          </p>
        </div>
      </div>
    </div>
  );
}
