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
}

export function LeaderboardPanel({ leaderboardData }: LeaderboardPanelProps) {
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
          Top performing ventures of the week
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
            
            {/* Leaderboard Entries */}
            <div className="space-y-2">
              {leaderboardData.map((entry) => {
                // Generate a consistent avatar based on venture name
                const getAvatarColor = (name: string) => {
                  const colors = [
                    'from-purple-500 to-pink-500',
                    'from-blue-500 to-cyan-500', 
                    'from-green-500 to-emerald-500',
                    'from-yellow-500 to-orange-500',
                    'from-red-500 to-rose-500'
                  ];
                  const index = name.charCodeAt(0) % colors.length;
                  return colors[index];
                };
                
                const avatarGradient = getAvatarColor(entry.ventureName);
                const proofTagsCount = entry.proofTags || Math.floor(entry.totalScore / 15); // Fallback calculation
                const handle = entry.handle || `@${entry.ventureName.toLowerCase().replace(/\s+/g, '')}`;
                
                return (
                  <div 
                    key={entry.rank} 
                    className="flex items-center gap-4 p-4 rounded-lg bg-gradient-to-br from-gray-800/30 to-gray-900/50 border border-gray-700/50 hover:border-gray-600/70 transition-all duration-300"
                  >
                    {/* Rank */}
                    <div className="w-8 text-white text-lg font-bold">
                      {entry.rank}
                    </div>
                    
                    {/* Avatar */}
                    <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${avatarGradient} flex items-center justify-center text-white font-bold text-sm`}>
                      {entry.ventureName.charAt(0).toUpperCase()}
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