import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Trophy, Medal } from "lucide-react";

interface LeaderboardEntry {
  ventureName: string;
  totalScore: number;
  rank: number;
  analysisDate?: string;
  isReal?: boolean;
}

interface LeaderboardResponse {
  success: boolean;
  data: LeaderboardEntry[];
  source: 'real' | 'mixed';
}

interface LeaderboardProps {
  currentVentureName?: string;
}

export function Leaderboard({ currentVentureName }: LeaderboardProps) {
  const { data, isLoading, error } = useQuery<LeaderboardResponse>({
    queryKey: ['/api/leaderboard'],
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  if (isLoading) {
    return (
      <Card className="w-full bg-gradient-to-br from-background to-background/80 border-border/50">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-3 text-foreground">
            <div className="p-2 rounded-lg bg-gradient-to-r from-violet-500 to-amber-500">
              <Trophy className="w-5 h-5 text-white" />
            </div>
            Leaderboard
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Top performing ventures by ProofScore
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 p-4 rounded-xl border animate-pulse">
                <div className="w-8 h-8 bg-muted rounded-full" />
                <div className="flex-1">
                  <div className="h-4 bg-muted rounded w-48 mb-2" />
                  <div className="h-3 bg-muted rounded w-24" />
                </div>
                <div className="w-12 h-12 bg-muted rounded-full" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !data?.success) {
    return (
      <Card className="w-full bg-gradient-to-br from-background to-background/80 border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-foreground">
            <div className="p-2 rounded-lg bg-gradient-to-r from-violet-500 to-amber-500">
              <Trophy className="w-5 h-5 text-white" />
            </div>
            Leaderboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <p>Unable to load leaderboard data</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const entries = data.data || [];
  const topThree = entries.slice(0, 3);
  const remaining = entries.slice(3);

  return (
    <Card className="w-full bg-gradient-to-br from-violet-950/40 to-amber-950/20 backdrop-blur-sm shadow-xl border-violet-500/20">
      <CardHeader className="pb-6">
        <CardTitle className="flex items-center gap-3 text-foreground">
          <div className="p-2 rounded-lg bg-gradient-to-r from-violet-500 to-amber-500">
            <Trophy className="w-5 h-5 text-white" />
          </div>
          Leaderboard
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Top performing ventures by ProofScore validation
        </p>
      </CardHeader>
      
      <CardContent>
        {/* All Rankings in Rows */}
        <div className="space-y-2">
          {entries.map((entry, index) => {
            const isCurrentVenture = entry.ventureName.trim() === currentVentureName?.trim();
            const isTopThree = entry.rank <= 3;
            
            return (
              <motion.div
                key={entry.rank}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`relative transition-all duration-300 rounded-xl overflow-hidden ${
                  isCurrentVenture 
                    ? 'bg-gradient-to-r from-violet-500/20 to-amber-500/20 border-2 border-transparent shadow-lg shadow-violet-500/25' 
                    : isTopThree
                    ? 'bg-gradient-to-r from-yellow-500/10 to-amber-500/10 border border-yellow-400/30 shadow-md'
                    : 'bg-background/50 border border-border/50 hover:border-primary/20'
                }`}
              >
                {isCurrentVenture && (
                  <>
                    {/* Animated border */}
                    <div className="absolute inset-0 pointer-events-none rounded-xl">
                      <motion.div 
                        className="absolute inset-0 rounded-xl"
                        style={{
                          background: 'linear-gradient(45deg, #8b5cf6, #f59e0b, #8b5cf6, #f59e0b)',
                          backgroundSize: '400% 400%',
                        }}
                        animate={{
                          backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
                        }}
                        transition={{
                          duration: 3,
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                      />
                      <div className="absolute inset-[2px] bg-background/95 rounded-xl" />
                    </div>
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-r from-violet-400 to-amber-400 rounded-full animate-pulse z-10"></div>
                  </>
                )}
                
                <div className="relative z-10 flex items-center gap-4 p-4">
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
                    isTopThree ? 'bg-gradient-to-r from-yellow-400 to-amber-500' : 'bg-muted/50'
                  }`}>
                    {entry.rank <= 3 ? (
                      entry.rank === 1 ? <Trophy className="w-5 h-5 text-yellow-100" /> :
                      entry.rank === 2 ? <Medal className="w-4 h-4 text-gray-100" /> :
                      <Medal className="w-4 h-4 text-amber-100" />
                    ) : (
                      <span className="text-sm font-bold text-muted-foreground">
                        {entry.rank}
                      </span>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h4 className={`font-semibold truncate ${
                      isCurrentVenture ? 'text-violet-400' : 
                      isTopThree ? 'text-yellow-400' : 'text-foreground'
                    }`}>
                      {entry.ventureName}
                      {isCurrentVenture && <span className="ml-2 text-amber-400">(You)</span>}
                    </h4>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className={`text-lg font-bold ${
                        isCurrentVenture ? 'text-violet-400' : 
                        isTopThree ? 'text-yellow-400' : 'text-foreground'
                      }`}>
                        {entry.totalScore}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        points
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

