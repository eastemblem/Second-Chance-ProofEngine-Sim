import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
// Removed framer-motion to reduce bundle size
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { lazy, Suspense } from "react";
import { SimpleLoader, InlineLoader } from "@/components/simple-loader";

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
const SetPasswordPage = lazy(() => import("@/pages/set-password"));
const LoginPage = lazy(() => import("@/pages/login"));
const Dashboard = lazy(() => import("@/pages/dashboard"));

// Disable preloading to reduce initial bundle size and blocking
const preloadComponents = () => {
  // Disabled to improve LCP performance
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

  // Removed animations to reduce bundle size and improve performance

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
      {renderCurrentPage()}
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
      <Route path="/set-password" component={() => (
        <Suspense fallback={<SimpleLoader />}>
          <SetPasswordPage />
        </Suspense>
      )} />
      <Route path="/login" component={() => (
        <Suspense fallback={<SimpleLoader />}>
          <LoginPage />
        </Suspense>
      )} />
      <Route path="/dashboard" component={() => (
        <Suspense fallback={<SimpleLoader />}>
          <Dashboard />
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
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
