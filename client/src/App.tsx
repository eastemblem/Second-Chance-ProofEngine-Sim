// Temporarily removed wouter imports to fix React hooks error
// import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
// Removed framer-motion to reduce bundle size
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
// Removed TooltipProvider to fix React hooks error
import React, { lazy, Suspense } from "react";
import { SimpleLoader, InlineLoader } from "@/components/simple-loader";
import { initGA } from "./lib/analytics";
// Removed useAnalytics import to fix React hooks error
// import { useAnalytics } from "./hooks/use-analytics";

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
const ResetPasswordPage = lazy(() => import("@/pages/reset-password"));
const ResetPasswordDebugPage = lazy(() => import("@/pages/reset-password-debug"));
const SimpleResetTest = lazy(() => import("@/pages/simple-reset-test"));
const LoginPage = lazy(() => import("@/pages/login"));
const ForgotPasswordPage = lazy(() => import("@/pages/forgot-password"));
const Dashboard = lazy(() => import("@/pages/dashboard"));
const TokenExpiredPage = lazy(() => import("@/pages/token-expired"));
const PerformanceTest = lazy(() => import("@/pages/performance-test"));
const SentryTest = lazy(() => import("@/pages/sentry-test"));
const RoutingDebug = lazy(() => import("@/pages/routing-debug"));
const SimpleResetPassword = lazy(() => import("@/pages/simple-reset-password"));

// Disable preloading to reduce initial bundle size and blocking
const preloadComponents = () => {
  // Disabled to improve LCP performance
};
import { useSimulation } from "@/hooks/use-simulation";
import NotFound from "@/pages/not-found";
import { initSentry, SentryErrorBoundary } from "./lib/sentry";

// Initialize preloading after component definition
preloadComponents();

function SimulationFlow() {
  // Temporarily disabled useSimulation to fix React hooks error
  const state = { currentPage: 1, analysisProgress: 0, isAnalyzing: false, proofScore: null };
  const setCurrentPage = () => {};
  const updateFounderData = () => {};
  const startAnalysis = () => {};
  const resetSimulation = () => {};
  // const { 
  //   state, 
  //   setCurrentPage, 
  //   updateFounderData, 
  //   startAnalysis, 
  //   resetSimulation 
  // } = useSimulation();

  // Temporarily disabled analytics to fix React hooks error
  // useAnalytics();

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
  // Simple routing without wouter hooks to avoid React null issue
  // Just return the SimulationFlow which includes the landing page
  return <SimulationFlow />;
}

function App() {
  // Temporarily disabled monitoring initialization to fix React hooks error
  // useEffect(() => {
  //   initSentry();
  //   if (!import.meta.env.VITE_GA_MEASUREMENT_ID) {
  //     console.warn('Missing required Google Analytics key: VITE_GA_MEASUREMENT_ID');
  //   } else {
  //     initGA();
  //   }
  // }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <SentryErrorBoundary fallback={({ error, resetError }) => (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Something went wrong</h1>
            <p className="text-gray-600 mb-6">
              An unexpected error occurred. Our team has been notified and is working on a fix.
            </p>
            <div className="space-y-3">
              <button 
                onClick={resetError}
                className="w-full bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors"
              >
                Try Again
              </button>
              <button 
                onClick={() => window.location.reload()}
                className="w-full bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300 transition-colors"
              >
                Reload Page
              </button>
            </div>
          </div>
        </div>
      )}>
        <Toaster />
        <Router />
      </SentryErrorBoundary>
    </QueryClientProvider>
  );
}

export default App;
