import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, Medal } from "lucide-react";
import { EmptyState } from "../shared";

interface LeaderboardEntry {
  ventureName: string;
  totalScore: number;
  rank: number;
  analysisDate: string;
  isReal: boolean;
  proofTags?: number;
  handle?: string;
}

interface LeaderboardPanelProps {
  leaderboardData: LeaderboardEntry[];
  currentUserProofTags?: number;
}

export function LeaderboardPanel({ leaderboardData, currentUserProofTags }: LeaderboardPanelProps) {
  // Get medal component based on rank
  const getMedalIcon = (rank: number) => {
    if (rank === 1) return <Medal className="w-5 h-5 text-yellow-400" />;
    if (rank === 2) return <Medal className="w-5 h-5 text-gray-300" />;
    if (rank === 3) return <Medal className="w-5 h-5 text-amber-600" />;
    return <div className="w-5 h-5 rounded-full bg-gray-600 flex items-center justify-center text-xs text-white font-bold">{rank}</div>;
  };

  return (
    <Card className="bg-black/50 border-gray-800">
      <CardHeader>
        <CardTitle className="text-white text-3xl font-bold">
          Leaderboard
        </CardTitle>
        <CardDescription className="text-gray-400">
          Top 3 performing ventures
        </CardDescription>
      </CardHeader>
      <CardContent>
        {leaderboardData.length > 0 ? (
          <div className="space-y-4">
            {/* Column Headers */}
            <div className="flex items-center text-gray-400 text-sm font-medium px-4">
              <div className="flex-1"></div>
              <div className="w-20 text-center">Score</div>
              <div className="w-24 text-center">ProofTags</div>
            </div>
            
            {/* Leaderboard Entries - Top 3 Only */}
            <div className="space-y-2">
              {leaderboardData.slice(0, 3).map((entry) => {
                const proofTagsCount = entry.proofTags || 0;
                const handle = entry.handle || `@${entry.ventureName.toLowerCase().replace(/\s+/g, '')}`;
                
                // Medal icon and colors based on rank
                const getMedalDisplay = (rank: number) => {
                  if (rank === 1) return { icon: <Trophy className="w-8 h-8 text-yellow-400" />, bg: 'bg-yellow-400/20 border-yellow-400/30' };
                  if (rank === 2) return { icon: <Medal className="w-8 h-8 text-gray-300" />, bg: 'bg-gray-400/20 border-gray-400/30' };
                  if (rank === 3) return { icon: <Medal className="w-8 h-8 text-amber-600" />, bg: 'bg-amber-600/20 border-amber-600/30' };
                };
                
                const medalDisplay = getMedalDisplay(entry.rank);
                
                return (
                  <div 
                    key={entry.rank} 
                    className="flex items-center gap-4 p-4 rounded-lg bg-gradient-to-br from-gray-800/30 to-gray-900/50 border border-gray-700/50 hover:border-gray-600/70 transition-all duration-300"
                  >
                    {/* Rank */}
                    <div className="w-8 text-white text-lg font-bold">
                      {entry.rank}
                    </div>
                    
                    {/* Medal Icon */}
                    <div className={`w-12 h-12 rounded-full ${medalDisplay?.bg} flex items-center justify-center border`}>
                      {medalDisplay?.icon}
                    </div>
                    
                    {/* Venture Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium truncate">{entry.ventureName}</p>
                      <p className="text-gray-400 text-sm truncate">{handle}</p>
                    </div>
                    
                    {/* Score */}
                    <div className="w-20 text-center">
                      <span className="text-white text-lg font-bold">{entry.totalScore}</span>
                    </div>
                    
                    {/* ProofTags */}
                    <div className="w-24 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <span className="text-blue-400">💎</span>
                        <span className="text-blue-400 font-bold">{proofTagsCount}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <EmptyState
            icon={Trophy}
            title="Complete onboarding to see your leaderboard position"
          />
        )}
      </CardContent>
    </Card>
  );
}