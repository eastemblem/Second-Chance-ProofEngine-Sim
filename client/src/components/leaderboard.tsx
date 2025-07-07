import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import GoldMedal from "../assets/rank/gold-medal.svg";
import SilverMedal from "../assets/rank/silver-medal.svg";
import BronzeMedal from "../assets/rank/bronze-medal.svg";

interface LeaderboardEntry {
  ventureName: string;
  totalScore: number;
  rank: number;
  analysisDate?: string;
}

interface LeaderboardResponse {
  success: boolean;
  data: LeaderboardEntry[];
  source: 'real' | 'mixed';
}

function getRankIcon(rank: number) {
  if (rank === 1) return GoldMedal;
  if (rank === 2) return SilverMedal;
  if (rank === 3) return BronzeMedal;
  return null;
}

function getRankColor(rank: number) {
  if (rank === 1) return "text-yellow-600 dark:text-yellow-400";
  if (rank === 2) return "text-gray-500 dark:text-gray-400";
  if (rank === 3) return "text-amber-600 dark:text-amber-500";
  return "text-muted-foreground";
}

export function Leaderboard() {
  const { data, isLoading, error } = useQuery<LeaderboardResponse>({
    queryKey: ['/api/leaderboard'],
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🏆 Validation Leaderboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg border animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-muted rounded-full" />
                  <div className="h-4 bg-muted rounded w-32" />
                </div>
                <div className="h-4 bg-muted rounded w-12" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !data?.success) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🏆 Validation Leaderboard
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

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🏆 Validation Leaderboard
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Top performing ventures by ProofScore validation
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {entries.map((entry, index) => {
            const rankIcon = getRankIcon(entry.rank);
            const rankColor = getRankColor(entry.rank);
            
            return (
              <motion.div
                key={entry.rank}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`flex items-center justify-between p-3 rounded-lg border transition-all duration-200 hover:border-primary/20 hover:shadow-sm ${
                  entry.rank <= 3 ? 'bg-gradient-to-r from-primary/5 to-primary-gold/5' : 'hover:bg-accent/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8">
                    {rankIcon ? (
                      <img 
                        src={rankIcon} 
                        alt={`Rank ${entry.rank}`} 
                        className="w-6 h-6"
                      />
                    ) : (
                      <span className={`text-sm font-bold ${rankColor}`}>
                        {entry.rank}
                      </span>
                    )}
                  </div>
                  
                  <div className="flex flex-col">
                    <span className="font-medium text-foreground text-sm leading-tight">
                      {entry.ventureName}
                    </span>
                    {entry.analysisDate && (
                      <span className="text-xs text-muted-foreground">
                        {new Date(entry.analysisDate).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <div className={`text-sm font-bold ${rankColor}`}>
                      {entry.totalScore}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      points
                    </div>
                  </div>
                  
                  {/* Score visualization bar */}
                  <div className="w-12 h-2 bg-muted rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-primary to-primary-gold"
                      initial={{ width: 0 }}
                      animate={{ width: `${entry.totalScore}%` }}
                      transition={{ delay: index * 0.1 + 0.3, duration: 0.8 }}
                    />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
        
        {data.source === 'mixed' && (
          <div className="mt-4 pt-3 border-t border-border">
            <p className="text-xs text-muted-foreground text-center">
              * Some entries are sample data. Complete your analysis to join the real leaderboard.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}