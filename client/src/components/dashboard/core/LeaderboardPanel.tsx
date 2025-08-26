import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, Medal } from "lucide-react";
import { EmptyState } from "../shared";

interface LeaderboardEntry {
  ventureName: string;
  totalScore: number;
  rank: number;
  analysisDate: string;
  isReal: boolean;
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
        <CardTitle className="flex items-center gap-2 text-white">
          <Trophy className="w-5 h-5" />
          Leaderboard
        </CardTitle>
        <CardDescription className="text-gray-400">
          Top performing ventures
        </CardDescription>
      </CardHeader>
      <CardContent>
        {leaderboardData.length > 0 ? (
          <div className="space-y-3">
            {leaderboardData.map((entry) => (
              <div 
                key={entry.rank} 
                className="group relative overflow-hidden rounded-lg bg-gradient-to-br from-gray-800/30 to-gray-900/50 border border-gray-700/50 p-3 hover:border-gray-600/70 transition-all duration-300"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-gray-700/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative flex items-center gap-3">
                  {getMedalIcon(entry.rank)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-white text-sm font-medium truncate">{entry.ventureName}</p>
                      <span className="text-purple-400 text-sm font-bold">{entry.totalScore}</span>
                    </div>
                    <p className="text-gray-500 text-xs">
                      Rank #{entry.rank} • {new Date(entry.analysisDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
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