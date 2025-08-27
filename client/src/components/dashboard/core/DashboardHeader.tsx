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
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export function DashboardHeader({
  user,
  validationData,
}: DashboardHeaderProps) {
  const userName = user?.fullName || user?.email?.split("@")[0] || "Founder";
  const userInitial = user?.fullName
    ? user.fullName.charAt(0).toUpperCase()
    : user?.email?.charAt(0).toUpperCase();
  const proofTagsUnlocked = validationData?.proofTagsUnlocked || 0;
  const totalProofTags = validationData?.totalProofTags || 21;

  return (
    <div className="bg-black text-white">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-4">
          {/* Avatar and Text Container */}
          <div className="flex items-center gap-4">
            {/* Avatar */}
            <div className="w-16 h-16 rounded-full bg-gradient-to-r from-purple-500 to-yellow-500 flex items-center justify-center font-bold text-xl text-white">
              {userInitial}
            </div>

            {/* Greeting and Welcome */}
            <div className="flex-1">
              <h2 className="text-lg text-gray-300 mb-1">Hi {userName},</h2>
              <h1 className="text-2xl sm:text-3xl font-bold text-white mb-0">
                Welcome to Second Chance!
              </h1>
            </div>
          </div>

          {/* ProofTags Banner - Now responsive */}
          <div className="bg-gray-800/60 rounded-lg px-4 py-3 border border-gray-700/50 w-full sm:w-auto mt-2 sm:mt-0">
            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
              <span className="text-base">🎉</span>
              <span className="text-white font-medium text-sm">
                Congratulations!
              </span>
              <span className="text-gray-300 text-sm">You unlocked</span>
              <span className="text-base">💎</span>
              <span className="text-blue-400 font-bold text-base">
                {proofTagsUnlocked}
              </span>
              <span className="text-gray-300 text-sm">ProofTags</span>
              <span className="text-gray-400 text-sm">
                out of {totalProofTags} total
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
