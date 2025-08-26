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

export function DashboardHeader({ user, validationData }: DashboardHeaderProps) {
  return (
    <div className="border-b border-gray-800 bg-gray-900/50">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-500 to-yellow-500 flex items-center justify-center font-bold text-lg">
            {user?.fullName ? user.fullName.charAt(0).toUpperCase() : user?.email?.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-white">Welcome {user?.fullName || user?.email?.split('@')[0] || 'Founder'}</h1>
              {(validationData?.proofScore || 0) >= 70 && (
                <span className="px-3 py-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white text-xs font-bold rounded-full shadow-lg">
                  INVESTOR READY
                </span>
              )}
            </div>
            <p className="text-gray-400">
              {user?.venture?.name || 'Your Venture'} Dashboard
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}