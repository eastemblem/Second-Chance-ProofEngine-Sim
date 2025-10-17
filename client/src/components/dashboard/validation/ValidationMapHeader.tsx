import { useTokenAuth } from "@/hooks/use-token-auth";

export function ValidationMapHeader() {
  const { user, venture } = useTokenAuth();
  
  const userName = user?.fullName || user?.email?.split("@")[0] || "Founder";
  const userInitial = user?.fullName
    ? user.fullName.charAt(0).toUpperCase()
    : user?.email?.charAt(0).toUpperCase();

  return (
    <div className="text-white" style={{ backgroundColor: '#0E0E12' }}>
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-r from-purple-500 to-yellow-500 flex items-center justify-center font-bold text-xl text-white">
            {userInitial}
          </div>
          <div className="flex-1">
            <h2 className="text-lg text-gray-300 mb-1">Hi {userName},</h2>
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-0">
              Validation Map
            </h1>
          </div>
        </div>
      </div>
    </div>
  );
}
