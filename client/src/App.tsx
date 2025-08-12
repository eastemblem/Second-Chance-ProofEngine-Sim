import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
// Removed framer-motion to reduce bundle size
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { lazy, Suspense, useEffect } from "react";
import { SimpleLoader, InlineLoader } from "@/components/simple-loader";
import { initGA } from "./lib/analytics";
import { useAnalytics } from "./hooks/use-analytics";

// Lazy load page components with preload hints
const LandingPage = lazy(() => import("@/pages/landing"));
const OnboardingPage = lazy(() => import("@/pages/onboarding"));
const OnboardingFlow = lazy(() => import("@/pages/onboarding-flow"));
const ScoringPage = lazy(() => import("@/pages/scoring"));
const FeedbackPage = lazy(() => import("@/pages/feedback"));
const PathwayPage = lazy(() => import("@/pages/pathway"));
const DealRoomSalesPage = lazy(() => import("@/pages/deal-room-sales"));
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

// Development-only test pages (conditionally loaded)
const PerformanceTest = import.meta.env.MODE === 'development' ? lazy(() => import("@/pages/performance-test")) : null;
const SentryTest = import.meta.env.MODE === 'development' ? lazy(() => import("@/pages/sentry-test")) : null;
const RoutingDebug = import.meta.env.MODE === 'development' ? lazy(() => import("@/pages/routing-debug")) : null;
const PaymentTestPage = import.meta.env.MODE === 'development' ? lazy(() => import("@/pages/payment-test")) : null;

const SimpleResetPassword = lazy(() => import("@/pages/simple-reset-password"));
const PaymentSuccessPage = lazy(() => import("@/pages/payment-success"));
const PaymentFailedPage = lazy(() => import("@/pages/payment-failed"));
const PaymentCancelledPage = lazy(() => import("@/pages/payment-cancelled"));
const PaymentErrorPage = lazy(() => import("@/pages/payment-error"));
const NextSteps = lazy(() => import("@/pages/next-steps"));

// Disable preloading to reduce initial bundle size and blocking
const preloadComponents = () => {
  // Disabled to improve LCP performance
};
import { useSimulation } from "@/hooks/use-simulation";
import { useAuthCheck } from "@/hooks/use-auth-check";
import NotFound from "@/pages/not-found";
import { initSentry, SentryErrorBoundary } from "./lib/sentry";
import { TokenAuthProvider } from "@/hooks/use-token-auth";

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
  
  const { isAuthenticated } = useAuthCheck();

  // Track page views when routes change
  useAnalytics();

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
            onNext={() => setCurrentPage(state.proofScore!.total >= 70 ? 6 : 7)}
            proofScore={state.proofScore}
          />
        ) : null;
      case 6:
        return state.proofScore && state.proofScore.total >= 70 ? (
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
  // Track page views when routes change
  useAnalytics();
  
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
      <Route path="/forgot-password" component={() => (
        <Suspense fallback={<SimpleLoader />}>
          <ForgotPasswordPage />
        </Suspense>
      )} />
      <Route path="/reset-password" component={() => (
        <Suspense fallback={<SimpleLoader />}>
          <ResetPasswordPage />
        </Suspense>
      )} />
      <Route path="/reset-password/:token" component={() => (
        <Suspense fallback={<SimpleLoader />}>
          <ResetPasswordPage />
        </Suspense>
      )} />
      {/* Development-only reset password debug route */}
      {import.meta.env.MODE === 'development' && ResetPasswordDebugPage && (
        <Route path="/reset-password-debug" component={() => (
          <Suspense fallback={<SimpleLoader />}>
            <ResetPasswordDebugPage />
          </Suspense>
        )} />
      )}
      <Route path="/dashboard" component={() => (
        <Suspense fallback={<SimpleLoader />}>
          <Dashboard />
        </Suspense>
      )} />
      <Route path="/token-expired" component={() => (
        <Suspense fallback={<SimpleLoader />}>
          <TokenExpiredPage />
        </Suspense>
      )} />
      <Route path="/next-steps" component={() => (
        <Suspense fallback={<SimpleLoader />}>
          <NextSteps />
        </Suspense>
      )} />
      <Route path="/deal-room" component={() => (
        <Suspense fallback={<SimpleLoader />}>
          <DealRoomSalesPage />
        </Suspense>
      )} />
      <Route path="/proofscaling" component={() => (
        <Suspense fallback={<SimpleLoader />}>
          <ProofScalingDashboard />
        </Suspense>
      )} />
      {/* Development-only test routes */}
      {import.meta.env.MODE === 'development' && PerformanceTest && (
        <Route path="/performance-test" component={() => (
          <Suspense fallback={<SimpleLoader />}>
            <PerformanceTest />
          </Suspense>
        )} />
      )}
      {import.meta.env.MODE === 'development' && SentryTest && (
        <Route path="/sentry-test" component={() => (
          <Suspense fallback={<SimpleLoader />}>
            <SentryTest />
          </Suspense>
        )} />
      )}
      {import.meta.env.MODE === 'development' && RoutingDebug && (
        <Route path="/routing-debug" component={() => (
          <Suspense fallback={<SimpleLoader />}>
            <RoutingDebug />
          </Suspense>
        )} />
      )}
      {import.meta.env.MODE === 'development' && PaymentTestPage && (
        <Route path="/payment-test" component={() => (
          <Suspense fallback={<SimpleLoader />}>
            <PaymentTestPage />
          </Suspense>
        )} />
      )}

      <Route path="/payment/success" component={() => (
        <Suspense fallback={<SimpleLoader />}>
          <PaymentSuccessPage />
        </Suspense>
      )} />
      <Route path="/payment/failed" component={() => (
        <Suspense fallback={<SimpleLoader />}>
          <PaymentFailedPage />
        </Suspense>
      )} />
      <Route path="/payment/cancelled" component={() => (
        <Suspense fallback={<SimpleLoader />}>
          <PaymentCancelledPage />
        </Suspense>
      )} />
      <Route path="/payment/error" component={() => (
        <Suspense fallback={<SimpleLoader />}>
          <PaymentErrorPage />
        </Suspense>
      )} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  // Initialize monitoring services when app loads
  useEffect(() => {
    // Initialize Sentry for client-side error tracking
    initSentry();
    
    // Initialize Google Analytics
    if (!import.meta.env.VITE_GA_MEASUREMENT_ID) {
      console.warn('Missing required Google Analytics key: VITE_GA_MEASUREMENT_ID');
    } else {
      initGA();
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TokenAuthProvider>
        <SentryErrorBoundary fallback={({ error, resetError }) => {
        // Check if this is an authentication-related error
        const isAuthError = (error as any)?.message?.includes('vault/session') || 
                           (error as any)?.message?.includes('authentication') ||
                           (error as any)?.message?.includes('token') ||
                           (error as any)?.message?.includes('401');
        
        if (isAuthError) {
          // Clear any stale auth data and redirect to clean landing
          localStorage.removeItem('auth_token');
          localStorage.removeItem('auth_user');
          
          return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-card to-background">
              <div className="max-w-md w-full bg-card rounded-lg shadow-lg p-8 text-center border">
                <div className="text-primary text-6xl mb-4">🔐</div>
                <h1 className="text-2xl font-bold text-foreground mb-4">Session Expired</h1>
                <p className="text-muted-foreground mb-6">
                  Your session has expired. Please refresh the page to continue.
                </p>
                <div className="space-y-3">
                  <button 
                    onClick={() => window.location.href = '/'}
                    className="w-full bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors"
                  >
                    Go to Homepage
                  </button>
                  <button 
                    onClick={() => window.location.href = '/login'}
                    className="w-full bg-secondary text-secondary-foreground px-4 py-2 rounded-md hover:bg-secondary/90 transition-colors"
                  >
                    Sign In
                  </button>
                </div>
              </div>
            </div>
          );
        }
        
        // Generic error fallback
        return (
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
        );
      }}>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </SentryErrorBoundary>
      </TokenAuthProvider>
    </QueryClientProvider>
  );
}

export default App;
