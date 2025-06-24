import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { lazy, Suspense } from "react";
import { PerformanceMonitor } from "@/components/performance-monitor";
import { MemoryOptimizer } from "@/components/memory-optimizer";
// CriticalLoader removed - optimizations moved to main.tsx

// Lazy load page components with preload hints
const LandingPage = lazy(() => import("@/pages/landing"));
const OnboardingPage = lazy(() => import("@/pages/onboarding"));
const OnboardingFlow = lazy(() => import("@/pages/onboarding-flow"));
const ScoringPage = lazy(() => import("@/pages/scoring"));
const FeedbackPage = lazy(() => import("@/pages/feedback"));
const PathwayPage = lazy(() => import("@/pages/pathway"));
const DealRoomPage = lazy(() => import("@/pages/deal-room"));
const ProofScalingDashboard = lazy(() => import("@/pages/proofscaling-dashboard"));
const FinalPage = lazy(() => import("@/pages/final"));

// Preload likely next components
const preloadComponents = () => {
  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => {
      import("@/pages/onboarding");
      import("@/pages/scoring");
    });
  }
};

// Initialize preloading
setTimeout(preloadComponents, 2000);
import { useSimulation } from "@/hooks/use-simulation";
import NotFound from "@/pages/not-found";

function SimulationFlow() {
  const { 
    state, 
    setCurrentPage, 
    updateFounderData, 
    startAnalysis, 
    resetSimulation 
  } = useSimulation();

  const pageVariants = {
    initial: { opacity: 0, x: 50 },
    in: { opacity: 1, x: 0 },
    out: { opacity: 0, x: -50 }
  };

  const pageTransition = {
    type: "tween",
    ease: "anticipate",
    duration: 0.5
  };

  const renderCurrentPage = () => {
    switch (state.currentPage) {
      case 1:
        return (
          <Suspense fallback={<div className="h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}>
            <LandingPage 
              onNext={() => setCurrentPage(2)} 
            />
          </Suspense>
        );
      case 2:
        return (
          <Suspense fallback={<div className="h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}>
            <OnboardingPage 
              onNext={() => setCurrentPage(3)}
              onDataUpdate={updateFounderData}
            />
          </Suspense>
        );
      case 3:
        return (
          <ScoringPage 
            onNext={() => setCurrentPage(4)}
            analysisProgress={state.analysisProgress}
            isAnalyzing={state.isAnalyzing}
          />
        );
      case 4:
        return state.proofScore ? (
          <FeedbackPage 
            onNext={() => setCurrentPage(5)}
            proofScore={state.proofScore}
          />
        ) : null;
      case 5:
        return state.proofScore ? (
          <PathwayPage 
            onNext={() => setCurrentPage(state.proofScore!.total >= 80 ? 6 : 7)}
            proofScore={state.proofScore}
          />
        ) : null;
      case 6:
        return state.proofScore && state.proofScore.total >= 80 ? (
          <DealRoomPage 
            onNext={() => setCurrentPage(8)}
            proofScore={state.proofScore}
          />
        ) : state.proofScore ? (
          <ProofScalingDashboard 
            onNext={() => setCurrentPage(8)}
            proofScore={state.proofScore}
          />
        ) : null;
      case 7:
        return state.proofScore ? (
          <ProofScalingDashboard 
            onNext={() => setCurrentPage(8)}
            proofScore={state.proofScore}
          />
        ) : null;
      case 8:
        return (
          <FinalPage 
            onReset={resetSimulation}
          />
        );
      default:
        return (
          <LandingPage 
            onNext={() => setCurrentPage(2)} 
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <AnimatePresence mode="wait">
        <motion.div
          key={state.currentPage}
          initial="initial"
          animate="in"
          exit="out"
          variants={pageVariants}
          transition={pageTransition}
        >
          {renderCurrentPage()}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={SimulationFlow} />
      <Route path="/onboarding-flow" component={() => (
        <Suspense fallback={<div className="h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}>
          <OnboardingFlow onComplete={() => window.location.href = '/'} />
        </Suspense>
      )} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <PerformanceMonitor />
        <MemoryOptimizer />
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
