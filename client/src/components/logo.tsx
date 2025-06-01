interface LogoProps {
  size?: "sm" | "md" | "lg";
  showTagline?: boolean;
}

export default function Logo({ size = "md", showTagline = true }: LogoProps) {
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-12 h-12",
    lg: "w-16 h-16"
  };

  const textSizeClasses = {
    sm: "text-lg",
    md: "text-2xl",
    lg: "text-3xl"
  };

  return (
    <div className="flex items-center space-x-3">
      <div className={`${sizeClasses[size]} rounded-full bg-gradient-to-r from-primary to-primary-gold flex items-center justify-center`}>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-1/2 h-1/2 text-white"
        >
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </div>
      <div>
        <h1 className={`${textSizeClasses[size]} font-bold text-foreground`}>
          SECOND CHANCE
        </h1>
        {showTagline && (
          <p className="text-xs text-primary-gold font-medium">
            Powered by ProofScaling
          </p>
        )}
      </div>
    </div>
  );
}
