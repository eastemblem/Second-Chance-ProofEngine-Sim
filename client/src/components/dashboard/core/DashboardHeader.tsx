interface User {
  founderId: string;
  email: string;
  isAuthenticated: boolean;
  fullName?: string;
  venture?: {
    name: string;
    ventureId?: string;
  };
}

interface ValidationData {
  proofScore: number;
  proofTagsUnlocked: number;
  totalProofTags: number;
  filesUploaded: number;
  status: string;
  certificateUrl?: string;
  reportUrl?: string;
}

interface DashboardHeaderProps {
  user: User;
  validationData: ValidationData | null;
}

// Helper function to get time-based greeting
function getTimeBasedGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

export function DashboardHeader({ user, validationData }: DashboardHeaderProps) {
  const userName = user?.fullName || user?.email?.split('@')[0] || 'Founder';
  const userInitial = user?.fullName ? user.fullName.charAt(0).toUpperCase() : user?.email?.charAt(0).toUpperCase();
  const proofTagsUnlocked = validationData?.proofTagsUnlocked || 0;
  const totalProofTags = validationData?.totalProofTags || 21;
  const progressPercentage = totalProofTags > 0 ? (proofTagsUnlocked / totalProofTags) * 100 : 0;

  return (
    <div className="border-b border-gray-800 bg-gradient-to-r from-gray-900/80 to-gray-800/50 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-gray-900/40 rounded-2xl border border-gray-700/50 p-6 shadow-xl">
          <div className="flex items-center justify-between">
            
            {/* Left Section: Avatar + Greeting */}
            <div className="flex items-center gap-6">
              {/* Enhanced Avatar */}
              <div className="relative">
                <div className="w-20 h-20 rounded-full bg-gradient-to-r from-purple-500 via-blue-500 to-purple-600 p-0.5 animate-pulse">
                  <div className="w-full h-full rounded-full bg-gradient-to-r from-purple-400 to-yellow-400 flex items-center justify-center font-bold text-2xl text-white shadow-lg">
                    {userInitial}
                  </div>
                </div>
              </div>
              
              {/* Greeting and Welcome */}
              <div className="flex-1">
                {/* Time-based Greeting */}
                <h2 className="text-xl font-semibold text-gray-300 mb-1">
                  {getTimeBasedGreeting()}, {userName}!
                </h2>
                
                {/* Static Welcome Message */}
                <h1 className="text-3xl font-bold text-white mb-2">
                  Welcome to Second Chance!
                </h1>
                
                {/* Investor Ready Badge */}
                {(validationData?.proofScore || 0) >= 70 && (
                  <span className="inline-flex items-center px-3 py-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white text-xs font-bold rounded-full shadow-lg">
                    INVESTOR READY
                  </span>
                )}
              </div>
            </div>

            {/* Right Section: ProofTags Progress */}
            <div className="flex items-center gap-4">
              {/* ProofTags Progress Circle */}
              <div className="relative">
                <div className="w-24 h-24">
                  {/* Background Circle */}
                  <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="none"
                      className="text-gray-700"
                    />
                    {/* Progress Circle */}
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      stroke="url(#gradient)"
                      strokeWidth="8"
                      fill="none"
                      strokeDasharray={`${progressPercentage * 2.51} 251`}
                      className="transition-all duration-500 ease-out"
                      strokeLinecap="round"
                    />
                    {/* Gradient Definition */}
                    <defs>
                      <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#8b5cf6" />
                        <stop offset="50%" stopColor="#a855f7" />
                        <stop offset="100%" stopColor="#fbbf24" />
                      </linearGradient>
                    </defs>
                  </svg>
                  
                  {/* Center Text */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-lg font-bold text-white">
                        {proofTagsUnlocked}
                      </div>
                      <div className="text-xs text-gray-400">
                        /{totalProofTags}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* ProofTags Label */}
              <div className="text-right">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-2xl">💎</span>
                  <span className="text-lg font-semibold text-white">ProofTags</span>
                </div>
                <div className="text-sm text-gray-400">
                  {progressPercentage.toFixed(0)}% Complete
                </div>
                {proofTagsUnlocked > 0 && (
                  <div className="text-xs text-purple-400 font-medium">
                    🎉 {proofTagsUnlocked} Unlocked!
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}