import { useState, useEffect, useRef } from "react";
import { useToast } from "@/hooks/use-toast";

export const useCelebrationAnimation = (totalScore: number) => {
  const [showCelebration, setShowCelebration] = useState(false);
  const celebrationTriggered = useRef(false);
  const { toast } = useToast();

  useEffect(() => {
    if (totalScore > 50 && !showCelebration && !celebrationTriggered.current) {
      celebrationTriggered.current = true;

      const timer = setTimeout(() => {
        setShowCelebration(true);

        // Show toast notification
        toast({
          title: "🎉 Outstanding Score!",
          description: `You've achieved ${totalScore} points! 🎉`,
          duration: 5000,
        });
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [totalScore, showCelebration, toast]);

  return {
    showCelebration,
    celebrationTriggered: celebrationTriggered.current
  };
};