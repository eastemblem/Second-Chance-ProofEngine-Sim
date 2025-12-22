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
const OnboardingFlow = lazy(() => import("@/pages/onboarding-flow"));
const DealRoomSalesPage = lazy(() => import("@/pages/sales/deal-room"));
const ProofScalingSalesPage = lazy(() => import("@/pages/sales/proof-scaling"));
const Privacy = lazy(() => import("@/pages/legal/Privacy"));
const Terms = lazy(() => import("@/pages/legal/Terms"));
const FAQ = lazy(() => import("@/pages/legal/FAQ"));
const SetPasswordPage = lazy(() => import("@/pages/auth/set-password"));
const ResetPasswordPage = lazy(() => import("@/pages/auth/reset-password"));
const LoginPage = lazy(() => import("@/pages/auth/login"));
const ForgotPasswordPage = lazy(() => import("@/pages/auth/forgot-password"));
const Dashboard = lazy(() => import("@/pages/dashboard/legacy"));
const DashboardV2 = lazy(() => import("@/pages/dashboard/main"));
const ValidationMap = lazy(() => import("@/pages/dashboard/validation-map"));
const DealRoomDashboard = lazy(() => import("@/pages/dashboard/deal-room"));
const TokenExpiredPage = lazy(() => import("@/pages/auth/token-expired"));

// Development-only test pages (conditionally loaded)

const SimpleResetPassword = lazy(() => import("@/pages/auth/simple-reset-password"));
const PaymentSuccessPage = lazy(() => import("@/pages/payment/success"));
const PaymentFailedPage = lazy(() => import("@/pages/payment/failed"));
const PaymentCancelledPage = lazy(() => import("@/pages/payment/cancelled"));
const PaymentErrorPage = lazy(() => import("@/pages/payment/error"));
const IndividualAccessPayment = lazy(() => import("@/pages/payment/individual-access"));
const NextSteps = lazy(() => import("@/pages/next-steps"));

// Disable preloading to reduce initial bundle size and blocking
const preloadComponents = () => {
  // Disabled to improve LCP performance
};
import NotFound from "@/pages/not-found";
import { initSentry, SentryErrorBoundary } from "./lib/sentry";
import { TokenAuthProvider } from "@/hooks/use-token-auth";
import { ProofCoachProvider } from "@/contexts/ProofCoachContext";

// Initialize preloading after component definition
preloadComponents();

function Router() {
  // Track page views when routes change
  useAnalytics();
  
  return (
    <Switch>
      <Route path="/" component={() => (
        <Suspense fallback={<SimpleLoader />}>
          <LandingPage onNext={() => {}} />
        </Suspense>
      )} />
      <Route path="/onboarding" component={() => (
        <Suspense fallback={<SimpleLoader />}>
          <OnboardingFlow onComplete={() => window.location.href = '/'} />
        </Suspense>
      )} />
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
      <Route path="/faq" component={() => (
        <Suspense fallback={<SimpleLoader />}>
          <FAQ />
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
      <Route path="/dashboard" component={() => (
        <Suspense fallback={<SimpleLoader />}>
          <DashboardV2 />
        </Suspense>
      )} />
      {/* Development-only old dashboard */}
      {import.meta.env.MODE === 'development' && (
        <Route path="/dashboard-v1" component={() => (
          <Suspense fallback={<SimpleLoader />}>
            <Dashboard />
          </Suspense>
        )} />
      )}
      <Route path="/validation-map" component={() => (
        <Suspense fallback={<SimpleLoader />}>
          <ValidationMap />
        </Suspense>
      )} />
      <Route path="/dashboard/deal-room" component={() => (
        <Suspense fallback={<SimpleLoader />}>
          <DealRoomDashboard />
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
      <Route path="/proof-scaling" component={() => (
        <Suspense fallback={<SimpleLoader />}>
          <ProofScalingSalesPage />
        </Suspense>
      )} />

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
      <Route path="/payment/individual" component={() => (
        <Suspense fallback={<SimpleLoader />}>
          <IndividualAccessPayment />
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
        <ProofCoachProvider>
        <SentryErrorBoundary fallback={({ error, resetError }) => {
        // Check if this is an authentication-related error
        const isAuthError = (error as any)?.message?.includes('vault/session') || 
                           (error as any)?.message?.includes('authentication') ||
                           (error as any)?.message?.includes('token') ||
                           (error as any)?.message?.includes('401');
        
        if (isAuthError) {
          // Clear auth and coach data (preserves onboarding, tutorial flags, etc.)
          localStorage.removeItem('auth_token');
          localStorage.removeItem('auth_user');
          localStorage.removeItem('auth_venture');
          localStorage.removeItem('coach_state');
          localStorage.removeItem('coach_mode_first_seen');
          
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
      </ProofCoachProvider>
      </TokenAuthProvider>
    </QueryClientProvider>
  );
}

export default App;
