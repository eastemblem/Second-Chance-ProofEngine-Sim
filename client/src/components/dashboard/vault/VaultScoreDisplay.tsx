interface VaultScoreDisplayProps {
  vaultScore: number;
  maxScore?: number;
  className?: string;
}

export default function VaultScoreDisplay({ 
  vaultScore, 
  maxScore = 100,
  className = "" 
}: VaultScoreDisplayProps) {
  // Calculate progress percentage (max 100%)
  const progressPercentage = Math.min((vaultScore / maxScore) * 100, 100);

  const getStatusText = () => {
    if (vaultScore >= 80) return "Excellent Progress";
    if (vaultScore >= 60) return "Good Progress"; 
    if (vaultScore >= 40) return "Getting Started";
    if (vaultScore >= 20) return "Early Stage";
    return "Just Started";
  };

  return (
    <div className={`flex flex-col items-center ${className}`}>
      {/* Circular Progress Indicator */}
      <div className="relative w-32 h-32 mb-4">
        {/* Background Circle */}
        <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 100 100">
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
            stroke="url(#vault-gradient)"
            strokeWidth="8"
            fill="none"
            strokeDasharray={`${progressPercentage * 2.51} 251`}
            className="transition-all duration-500 ease-out"
            strokeLinecap="round"
          />
          {/* Gradient Definition */}
          <defs>
            <linearGradient id="vault-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#8b5cf6" />
              <stop offset="50%" stopColor="#a855f7" />
              <stop offset="100%" stopColor="#fbbf24" />
            </linearGradient>
          </defs>
        </svg>
        
        {/* Center Score */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <span className="text-3xl font-bold text-white">
              {vaultScore}
            </span>
          </div>
        </div>
      </div>

      {/* VaultScore Label */}
      <div className="text-center">
        <h3 className="text-lg font-semibold text-white mb-1">VaultScore</h3>
        <p className="text-sm text-gray-400">
          {getStatusText()}
        </p>
      </div>
    </div>
  );
}