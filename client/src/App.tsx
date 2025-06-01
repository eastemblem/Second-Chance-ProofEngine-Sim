import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Navigation from "@/components/navigation";
import LandingPage from "@/pages/landing";
import OnboardingPage from "@/pages/onboarding";
import ScoringPage from "@/pages/scoring";
import FeedbackPage from "@/pages/feedback";
import PathwayPage from "@/pages/pathway";
import DealRoomPage from "@/pages/deal-room";
import FinalPage from "@/pages/final";
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
          <LandingPage 
            onNext={() => setCurrentPage(2)} 
          />
        );
      case 2:
        return (
          <OnboardingPage 
            onNext={() => setCurrentPage(3)}
            onDataUpdate={updateFounderData}
          />
        );
      case 3:
        return (
          <ScoringPage 
            onNext={() => setCurrentPage(4)}
            onStartAnalysis={startAnalysis}
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
            onNext={() => setCurrentPage(7)}
            proofScore={state.proofScore}
          />
        ) : (
          <FinalPage 
            onReset={resetSimulation}
          />
        );
      case 7:
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
      {state.currentPage !== 1 && state.currentPage !== 6 && state.currentPage !== 7 && <Navigation />}
      
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
