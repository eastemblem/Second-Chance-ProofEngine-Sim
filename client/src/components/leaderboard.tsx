import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Crown, Trophy, Medal, Star } from "lucide-react";

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

// Get rank medal icons for podium positions
function getRankMedalIcon(rank: number) {
  if (rank === 1) return <Trophy className="w-8 h-8 text-yellow-400" />;
  if (rank === 2) return <Medal className="w-6 h-6 text-gray-300" />;
  if (rank === 3) return <Medal className="w-6 h-6 text-amber-600" />;
  return null;
}

function getPodiumIcon(rank: number) {
  if (rank === 1) return <Crown className="w-5 h-5 text-yellow-500" />;
  if (rank === 2) return <Trophy className="w-5 h-5 text-gray-400" />;
  if (rank === 3) return <Medal className="w-5 h-5 text-amber-600" />;
  return null;
}

function getRankStyling(rank: number, isCurrentVenture: boolean) {
  const baseClasses = "relative transition-all duration-300 rounded-xl";
  
  if (isCurrentVenture) {
    return `${baseClasses} bg-gradient-to-r from-violet-500/20 to-amber-500/20 border-2 border-violet-400 shadow-lg shadow-violet-500/25`;
  }

  if (rank === 1) {
    return `${baseClasses} bg-gradient-to-r from-yellow-500/10 to-amber-500/10 border border-yellow-400/30`;
  }
  if (rank === 2) {
    return `${baseClasses} bg-gradient-to-r from-gray-400/10 to-slate-400/10 border border-gray-400/30`;
  }
  if (rank === 3) {
    return `${baseClasses} bg-gradient-to-r from-amber-600/10 to-orange-500/10 border border-amber-600/30`;
  }
  
  return `${baseClasses} bg-background/50 border border-border/50 hover:border-primary/20`;
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
            {[...Array(10)].map((_, i) => (
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
    <Card className="w-full bg-gradient-to-br from-background to-background/80 border-border/50 shadow-xl">
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
        {/* Podium - Top 3 */}
        {topThree.length > 0 && (
          <div className="mb-8">
            <div className="flex items-end justify-center gap-4 mb-6">
              {/* Second Place */}
              {topThree[1] && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-center"
                >
                  <div className={getRankStyling(2, topThree[1].ventureName === currentVentureName)}>
                    <div className="p-4 pb-6">
                      <div className="w-16 h-16 mx-auto mb-3 bg-gradient-to-br from-gray-400 to-slate-500 rounded-full flex items-center justify-center">
                        <Medal className="w-8 h-8 text-gray-100" />
                      </div>
                      <h4 className="font-semibold text-sm text-foreground truncate max-w-[120px]">
                        {topThree[1].ventureName}
                      </h4>
                      <div className="flex items-center justify-center gap-2 mt-2">
                        <Star className="w-4 h-4 text-gray-400" />
                        <span className="text-lg font-bold text-gray-400">{topThree[1].totalScore}</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* First Place */}
              {topThree[0] && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="text-center"
                >
                  <div className={getRankStyling(1, topThree[0].ventureName === currentVentureName)}>
                    <div className="p-4 pb-6">
                      <Crown className="w-6 h-6 text-yellow-500 mx-auto mb-2" />
                      <div className="w-20 h-20 mx-auto mb-3 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-full flex items-center justify-center">
                        <Trophy className="w-10 h-10 text-yellow-100" />
                      </div>
                      <h4 className="font-semibold text-foreground truncate max-w-[140px]">
                        {topThree[0].ventureName}
                      </h4>
                      <div className="flex items-center justify-center gap-2 mt-2">
                        <Star className="w-4 h-4 text-yellow-500" />
                        <span className="text-xl font-bold text-yellow-500">{topThree[0].totalScore}</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Third Place */}
              {topThree[2] && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-center"
                >
                  <div className={getRankStyling(3, topThree[2].ventureName === currentVentureName)}>
                    <div className="p-4 pb-6">
                      <div className="w-16 h-16 mx-auto mb-3 bg-gradient-to-br from-amber-600 to-orange-500 rounded-full flex items-center justify-center">
                        <Medal className="w-8 h-8 text-amber-100" />
                      </div>
                      <h4 className="font-semibold text-sm text-foreground truncate max-w-[120px]">
                        {topThree[2].ventureName}
                      </h4>
                      <div className="flex items-center justify-center gap-2 mt-2">
                        <Star className="w-4 h-4 text-amber-600" />
                        <span className="text-lg font-bold text-amber-600">{topThree[2].totalScore}</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        )}

        {/* Rest of rankings */}
        {remaining.length > 0 && (
          <div className="space-y-3">
            {remaining.map((entry, index) => {
              const isCurrentVenture = entry.ventureName === currentVentureName;
              
              return (
                <motion.div
                  key={entry.rank}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: (index + 3) * 0.1 }}
                  className={getRankStyling(entry.rank, isCurrentVenture)}
                >
                  <div className="flex items-center gap-4 p-4">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-muted/50">
                      <span className="text-sm font-bold text-muted-foreground">
                        {entry.rank}
                      </span>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h4 className={`font-semibold truncate ${isCurrentVenture ? 'text-violet-400' : 'text-foreground'}`}>
                        {entry.ventureName}
                        {isCurrentVenture && <span className="ml-2 text-amber-400">(You)</span>}
                      </h4>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className={`text-lg font-bold ${isCurrentVenture ? 'text-violet-400' : 'text-foreground'}`}>
                          {entry.totalScore}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          points
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {isCurrentVenture && (
                    <div className="absolute inset-0 pointer-events-none">
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-r from-violet-400 to-amber-400 rounded-full animate-pulse"></div>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}


      </CardContent>
    </Card>
  );
}