import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { lazy, Suspense } from "react";
import { PerformanceMonitor } from "@/components/performance-monitor";
import { MemoryOptimizer } from "@/components/memory-optimizer";
import { PerformanceBoundary } from "@/components/performance-boundary";
import { SimpleLoader, InlineLoader } from "@/components/simple-loader";
import { CriticalStyles } from "@/components/critical-styles";

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
const Privacy = lazy(() => import("@/pages/Privacy"));
const Terms = lazy(() => import("@/pages/Terms"));

// Simplified preloading to prevent blocking
const preloadComponents = () => {
  setTimeout(() => {
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => {
        try {
          import("@/pages/onboarding").catch(() => {});
          import("@/pages/scoring").catch(() => {});
        } catch (e) {
          // Silently handle preload errors
        }
      });
    }
  }, 3000); // Delayed to prevent blocking initial render
};
import { useSimulation } from "@/hooks/use-simulation";
import NotFound from "@/pages/not-found";

// Initialize preloading after component definition
preloadComponents();

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
          <Suspense fallback={<SimpleLoader />}>
            <LandingPage 
              onNext={() => setCurrentPage(2)} 
            />
          </Suspense>
        );
      case 2:
        return (
          <Suspense fallback={<SimpleLoader />}>
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
          <Suspense fallback={<SimpleLoader />}>
            <LandingPage 
              onNext={() => setCurrentPage(2)} 
            />
          </Suspense>
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
        <Suspense fallback={<SimpleLoader />}>
          <OnboardingFlow onComplete={() => window.location.href = '/'} />
        </Suspense>
      )} />
      <Route path="/privacy" component={() => (
        <Suspense fallback={<SimpleLoader />}>
          <Privacy />
        </Suspense>
      )} />
      <Route path="/terms" component={() => (
        <Suspense fallback={<SimpleLoader />}>
          <Terms />
        </Suspense>
      )} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <PerformanceBoundary>
      <CriticalStyles />
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <PerformanceMonitor />
          <MemoryOptimizer />
          <Toaster />
          <Router />
        </TooltipProvider>
      </QueryClientProvider>
    </PerformanceBoundary>
  );
}

export default App;
