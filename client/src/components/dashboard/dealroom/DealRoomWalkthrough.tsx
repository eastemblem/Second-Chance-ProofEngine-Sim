import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Users, Handshake, Zap, Shield, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DealRoomWalkthroughProps {
  onComplete: () => void;
}

const walkthroughScreens = [
  {
    id: 1,
    icon: Users,
    iconColor: "text-purple-400",
    iconBg: "bg-purple-500/20",
    title: "What is the Deal Room?",
    description: "Your gateway to investor introductions, warm matches, and faster fundraising conversations.",
    content: [
      "Investor introductions",
      "Warm matches",
      "Faster fundraising conversations",
    ],
  },
  {
    id: 2,
    icon: Handshake,
    iconColor: "text-blue-400",
    iconBg: "bg-blue-500/20",
    title: "Find Your Investment Match",
    description: "Filter investors by stage, sector, geography, and investment criteria.",
    content: [
      "Browse vetted investors actively seeking opportunities",
      "Filter by growth stage, sector focus, and target geography",
      "See minimum ProofScore requirements for each investor",
    ],
  },
  {
    id: 3,
    icon: Zap,
    iconColor: "text-yellow-400",
    iconBg: "bg-yellow-500/20",
    title: "Request Warm Introductions",
    description: "Connect with investors through our validation expert team.",
    content: [
      "Request introductions to matched investors with one click",
      "Our team reviews your profile for alignment",
      "Receive notification when specialist is ready to connect",
    ],
  },
  {
    id: 4,
    icon: Shield,
    iconColor: "text-green-400",
    iconBg: "bg-green-500/20",
    title: "Clear Evidence for Conversations",
    description: "Your ProofScore and validation data strengthens investor discussions.",
    content: [
      "Investors see your systematic validation approach",
      "ProofTags demonstrate credible traction",
      "Validated founders are 3x more likely to secure investor meetings",
    ],
  },
];

export function DealRoomWalkthrough({ onComplete }: DealRoomWalkthroughProps) {
  const [currentScreen, setCurrentScreen] = useState(0);

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

  const handleSkip = () => {
    onComplete();
  };

  const handleGetStarted = () => {
    onComplete();
  };

  const screen = walkthroughScreens[currentScreen];
  const Icon = screen.icon;
  const isLastScreen = currentScreen === walkthroughScreens.length - 1;

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="rounded-xl border border-gray-700/50 p-8 relative" style={{ backgroundColor: '#0E0E12' }}>
        
        {/* Skip Button */}
        <div className="absolute top-6 right-6">
          <Button
            onClick={handleSkip}
            variant="ghost"
            className="text-gray-400 hover:text-white"
            data-testid="button-skip-walkthrough"
          >
            Skip Tour
          </Button>
        </div>

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
                <div className={`p-6 rounded-full ${screen.iconBg}`}>
                  <Icon className={`h-12 w-12 ${screen.iconColor}`} />
                </div>
              </div>

              {/* Title */}
              <h2 className="text-3xl font-bold text-center text-white mb-4">
                {screen.title}
              </h2>

              {/* Description */}
              <p className="text-lg text-center text-gray-300 mb-8 max-w-2xl mx-auto">
                {screen.description}
              </p>

              {/* Content Points */}
              <div className="space-y-4 max-w-2xl mx-auto">
                {screen.content.map((point, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-start gap-3"
                  >
                    <div className="flex-shrink-0 mt-1">
                      <div className="w-6 h-6 rounded-full bg-purple-600 flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </div>
                    <p className="text-gray-300 text-lg">{point}</p>
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

          {/* Next or Get Started Button */}
          {isLastScreen ? (
            <Button
              onClick={handleGetStarted}
              className="bg-purple-600 hover:bg-purple-700 text-white"
              data-testid="button-get-started"
            >
              Get Started
              <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          ) : (
            <Button
              onClick={handleNext}
              variant="ghost"
              className="text-gray-400 hover:text-white"
              data-testid="button-walkthrough-next"
            >
              Next
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          )}
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
