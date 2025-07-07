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
                <PodiumCard 
                  entry={topThree[1]} 
                  rank={2} 
                  isCurrentVenture={topThree[1].ventureName === currentVentureName}
                  delay={0.2}
                />
              )}

              {/* First Place */}
              {topThree[0] && (
                <PodiumCard 
                  entry={topThree[0]} 
                  rank={1} 
                  isCurrentVenture={topThree[0].ventureName === currentVentureName}
                  delay={0.1}
                />
              )}

              {/* Third Place */}
              {topThree[2] && (
                <PodiumCard 
                  entry={topThree[2]} 
                  rank={3} 
                  isCurrentVenture={topThree[2].ventureName === currentVentureName}
                  delay={0.3}
                />
              )}
            </div>
          </div>
        )}

        {/* Rest of rankings */}
        {remaining.length > 0 && (
          <div className="space-y-3">
            {remaining.map((entry, index) => (
              <ListCard
                key={entry.rank}
                entry={entry}
                isCurrentVenture={entry.ventureName === currentVentureName}
                delay={(index + 3) * 0.1}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Separate component for podium cards
function PodiumCard({ entry, rank, isCurrentVenture, delay }: {
  entry: LeaderboardEntry;
  rank: number;
  isCurrentVenture: boolean;
  delay: number;
}) {
  const getRankIcon = () => {
    if (rank === 1) return <Trophy className="w-10 h-10 text-yellow-100" />;
    if (rank === 2) return <Medal className="w-8 h-8 text-gray-100" />;
    if (rank === 3) return <Medal className="w-8 h-8 text-amber-100" />;
    return null;
  };

  const getRankStyle = () => {
    if (rank === 1) return "w-20 h-20 bg-gradient-to-br from-yellow-400 to-amber-500";
    if (rank === 2) return "w-16 h-16 bg-gradient-to-br from-gray-400 to-slate-500";
    if (rank === 3) return "w-16 h-16 bg-gradient-to-br from-amber-600 to-orange-500";
    return "";
  };

  const getTextColor = () => {
    if (rank === 1) return "text-yellow-500";
    if (rank === 2) return "text-gray-400";
    if (rank === 3) return "text-amber-600";
    return "";
  };

  const getMaxWidth = () => {
    return rank === 1 ? "max-w-[140px]" : "max-w-[120px]";
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="text-center"
    >
      <div className={`relative transition-all duration-300 rounded-xl overflow-hidden ${isCurrentVenture ? 'bg-gradient-to-r from-violet-500/20 to-amber-500/20 border-2 border-transparent shadow-lg shadow-violet-500/25' : 'bg-gradient-to-r from-' + (rank === 1 ? 'yellow-500/10 to-amber-500/10 border border-yellow-400/30' : rank === 2 ? 'gray-400/10 to-slate-400/10 border border-gray-400/30' : 'amber-600/10 to-orange-500/10 border border-amber-600/30')}`}>
        
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
        
        <div className="relative z-10 p-4 pb-6">
          {rank === 1 && <Crown className="w-6 h-6 text-yellow-500 mx-auto mb-2" />}
          <div className={`${getRankStyle()} mx-auto mb-3 rounded-full flex items-center justify-center`}>
            {getRankIcon()}
          </div>
          <h4 className={`font-semibold ${rank === 1 ? 'text-base' : 'text-sm'} truncate ${getMaxWidth()} ${isCurrentVenture ? 'text-violet-400' : 'text-foreground'}`}>
            {entry.ventureName}
            {isCurrentVenture && <span className="block text-xs text-amber-400">(You)</span>}
          </h4>
          <div className="flex items-center justify-center gap-2 mt-2">
            <Star className={`w-4 h-4 ${getTextColor()}`} />
            <span className={`${rank === 1 ? 'text-xl' : 'text-lg'} font-bold ${getTextColor()}`}>
              {entry.totalScore}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// Separate component for list cards
function ListCard({ entry, isCurrentVenture, delay }: {
  entry: LeaderboardEntry;
  isCurrentVenture: boolean;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay }}
      className={`relative transition-all duration-300 rounded-xl overflow-hidden ${isCurrentVenture ? 'bg-gradient-to-r from-violet-500/20 to-amber-500/20 border-2 border-transparent shadow-lg shadow-violet-500/25' : 'bg-background/50 border border-border/50 hover:border-primary/20'}`}
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
    </motion.div>
  );
}