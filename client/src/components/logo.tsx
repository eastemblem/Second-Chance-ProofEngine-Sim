import logoMain from "@assets/second_chance_logo_1750269371846.png";

interface LogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  showTagline?: boolean;
}

export default function Logo({ size = "md", showTagline = true }: LogoProps) {
  const imageSize = {
    sm: "h-6",
    md: "h-8", 
    lg: "h-72",
    xl: "h-80"
  };

  // For large sizes, create an inline SVG version for instant rendering
  if (size === 'lg' || size === 'xl') {
    return (
      <div className="flex items-center justify-center mb-6">
        {/* Inline SVG for instant rendering - LCP optimization */}
        <svg 
          width="288" 
          height="144" 
          viewBox="0 0 288 144" 
          className="max-w-72 w-auto h-auto"
          style={{ maxWidth: '18rem' }}
        >
          {/* Background */}
          <rect width="288" height="144" fill="hsl(240 10% 6%)" />
          
          {/* Purple dashed circle */}
          <circle 
            cx="40" 
            cy="72" 
            r="28" 
            fill="none" 
            stroke="#8B5CF6" 
            strokeWidth="4" 
            strokeDasharray="8,4"
          />
          
          {/* Gold checkmark */}
          <path 
            d="M25 72 L35 82 L55 58" 
            fill="none" 
            stroke="#D97706" 
            strokeWidth="4" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          />
          
          {/* SECOND text */}
          <text 
            x="90" 
            y="65" 
            fill="white" 
            fontSize="24" 
            fontWeight="bold" 
            fontFamily="system-ui, -apple-system, sans-serif"
          >
            SECOND
          </text>
          
          {/* CHANCE text */}
          <text 
            x="90" 
            y="92" 
            fill="white" 
            fontSize="24" 
            fontWeight="bold" 
            fontFamily="system-ui, -apple-system, sans-serif"
          >
            CHANCE
          </text>
          
          {/* Powered by ProofScaling */}
          <text 
            x="90" 
            y="110" 
            fill="#D97706" 
            fontSize="10" 
            fontFamily="system-ui, -apple-system, sans-serif"
          >
            Powered by ProofScaling
          </text>
        </svg>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-3">
      <img 
        src={logoMain} 
        alt="Second Chance - Powered by ProofScaling"
        className={imageSize[size]}
        loading="lazy"
        decoding="async"
      />
    </div>
  );
}
