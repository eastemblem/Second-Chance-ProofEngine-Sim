import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Trophy, TrendingUp, Users, CreditCard, Upload } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import confetti from "canvas-confetti";

export interface MilestoneCelebrationProps {
  isOpen: boolean;
  onClose: () => void;
  milestone: {
    id: number;
    type: 'first_upload' | 'proofscore_70' | 'proofscore_80' | 'deal_room_unlock' | 'payment_complete';
    title: string;
    message: string;
    icon?: 'upload' | 'trophy' | 'trending' | 'users' | 'credit';
  } | null;
}

const iconMap = {
  upload: Upload,
  trophy: Trophy,
  trending: TrendingUp,
  users: Users,
  credit: CreditCard,
};

export default function MilestoneCelebration({ isOpen, onClose, milestone }: MilestoneCelebrationProps) {
  // Trigger confetti when modal opens
  useEffect(() => {
    if (isOpen && milestone) {
      // Delay confetti slightly to ensure modal is visible
      const timer = setTimeout(() => {
        confetti({
          particleCount: 150,
          spread: 90,
          origin: { y: 0.6 },
          colors: ['#9333ea', '#c026d3', '#8b5cf6', '#fbbf24', '#f59e0b'],
        });
        
        // Second burst for major milestones
        if (milestone.type === 'proofscore_70' || milestone.type === 'proofscore_80' || milestone.type === 'payment_complete') {
          setTimeout(() => {
            confetti({
              particleCount: 100,
              spread: 70,
              origin: { y: 0.6 },
              colors: ['#f59e0b', '#fbbf24', '#fcd34d'],
            });
          }, 300);
        }
      }, 300);

      return () => clearTimeout(timer);
    }
  }, [isOpen, milestone]);

  if (!milestone) return null;

  const Icon = iconMap[milestone.icon || 'trophy'];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100]"
            onClick={onClose}
          />

          {/* Modal */}
          <div className="fixed inset-0 z-[101] flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
            >
              <Card className="max-w-md w-full bg-gradient-to-br from-purple-700/95 via-fuchsia-600/90 to-indigo-700/95 border-purple-400/50 text-white shadow-2xl">
                <CardHeader className="relative">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={onClose}
                    className="absolute top-2 right-2 text-white/80 hover:text-white hover:bg-white/20"
                  >
                    <X className="h-4 w-4" />
                  </Button>

                  <div className="flex flex-col items-center gap-4 pt-4">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                      className="w-20 h-20 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-lg"
                    >
                      <Icon className="h-10 w-10 text-white" />
                    </motion.div>

                    <CardTitle className="text-2xl font-bold text-center text-white">
                      {milestone.title}
                    </CardTitle>
                  </div>
                </CardHeader>

                <CardContent className="text-center space-y-4 pb-6">
                  <p className="text-white/90 leading-relaxed text-base">
                    {milestone.message}
                  </p>

                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                  >
                    <Button
                      onClick={onClose}
                      className="bg-white text-purple-700 hover:bg-gray-100 font-semibold px-8 py-6 text-lg shadow-lg"
                    >
                      Continue Building 🚀
                    </Button>
                  </motion.div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
