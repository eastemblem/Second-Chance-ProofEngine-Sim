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

  return (
    <div className="bg-black text-white">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header Section */}
        <div className="flex items-center gap-4 mb-6">
          {/* Avatar */}
          <div className="w-16 h-16 rounded-full bg-gradient-to-r from-purple-500 to-yellow-500 flex items-center justify-center font-bold text-xl text-white">
            {userInitial}
          </div>
          
          {/* Greeting and Welcome */}
          <div className="flex-1">
            <h2 className="text-2xl text-gray-300 mb-2">
              Hi {userName},
            </h2>
            <h1 className="text-5xl font-bold text-white">
              Welcome to Second Chance!
            </h1>
          </div>
        </div>

        {/* ProofTags Banner */}
        <div className="bg-gray-800/60 rounded-lg px-6 py-3 border border-gray-700/50 max-w-2xl">
          <div className="flex items-center gap-2">
            <span className="text-lg">🎉</span>
            <span className="text-white font-medium text-base">Congratulations!</span>
            <span className="text-gray-300 text-base">You unlocked</span>
            <span className="text-lg">💎</span>
            <span className="text-blue-400 font-bold text-lg">{proofTagsUnlocked}</span>
            <span className="text-gray-300 text-base">ProofTags</span>
            <span className="text-gray-400 text-base">out of {totalProofTags} total</span>
          </div>
        </div>
      </div>
    </div>
  );
}