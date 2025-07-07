import { motion } from "framer-motion";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { getProofTagIcon, getProofTagJustification } from "@/utils/proofTagUtils";

interface ProofTagCardProps {
  tag: string;
  isLocked?: boolean;
  index: number;
  totalUnlocked?: number;
  scoringResult?: any;
  lockedTagData?: {
    name: string;
    emoji: string;
    currentScore: number;
    neededScore: number;
    pointsNeeded: number;
  };
}

export const ProofTagCard = ({ 
  tag, 
  isLocked = false, 
  index, 
  totalUnlocked = 0, 
  scoringResult,
  lockedTagData 
}: ProofTagCardProps) => {
  const emoji = lockedTagData?.emoji || getProofTagIcon(tag);
  const displayName = lockedTagData?.name || tag;
  
  const cardContent = (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{
        delay: isLocked 
          ? 0.6 + (totalUnlocked + index) * 0.1
          : 0.6 + index * 0.1,
        type: "spring",
        stiffness: 200,
        damping: 20,
      }}
      className="group"
    >
      <div className={`relative ${
        isLocked 
          ? "bg-background border border-primary/10 rounded-lg p-3 hover:border-primary/20 transition-all duration-300 opacity-60"
          : "bg-gradient-to-br from-primary/10 to-primary-gold/10 border border-primary/20 rounded-lg p-3 hover:border-primary/30 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10"
      }`}>
        {isLocked && (
          <div className="absolute inset-0 bg-background/80 rounded-lg" />
        )}

        {/* Achievement icon */}
        <div className="relative flex items-center justify-center mb-2">
          <div className={`w-8 h-8 ${
            isLocked 
              ? "bg-muted/50 rounded-full flex items-center justify-center"
              : "bg-primary/10 rounded-full flex items-center justify-center"
          }`}>
            <div className={`text-lg ${isLocked ? "opacity-40" : ""}`}>
              {emoji}
            </div>
          </div>
        </div>

        {/* Tag text */}
        <p className={`relative text-center text-xs font-medium leading-tight ${
          isLocked 
            ? "text-foreground/60 mb-1"
            : "text-foreground leading-tight"
        }`}>
          {displayName}
        </p>
      </div>
    </motion.div>
  );

  if (isLocked) {
    return cardContent;
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        {cardContent}
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-sm p-3">
        <p className="text-sm">{getProofTagJustification(tag, scoringResult)}</p>
      </TooltipContent>
    </Tooltip>
  );
};