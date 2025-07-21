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

  // For large sizes on landing, render SVG inline first, then replace with PNG
  if (size === 'lg' || size === 'xl') {
    return (
      <div className="flex items-center justify-center">
        <div 
          className="relative max-w-72"
          style={{ maxWidth: '18rem', height: '200px' }}
        >
          {/* Inline SVG for instant rendering */}
          <svg 
            viewBox="0 0 400 200" 
            className="w-full h-full absolute inset-0"
            style={{ maxWidth: '18rem' }}
          >
            {/* Purple circle with gold checkmark */}
            <circle cx="50" cy="100" r="40" fill="none" stroke="#8B5CF6" strokeWidth="6" strokeDasharray="10,5"/>
            <path d="M30 100 L45 115 L70 85" fill="none" stroke="#D97706" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round"/>
            
            {/* Text */}
            <text x="120" y="85" fill="white" fontSize="32" fontWeight="bold" fontFamily="system-ui">SECOND</text>
            <text x="120" y="120" fill="white" fontSize="32" fontWeight="bold" fontFamily="system-ui">CHANCE</text>
            <text x="120" y="145" fill="#D97706" fontSize="14" fontFamily="system-ui">Powered by ProofScaling</text>
          </svg>
          
          {/* Load actual PNG after initial render */}
          <img 
            src={logoMain} 
            alt="Second Chance - Powered by ProofScaling"
            className="absolute inset-0 w-full h-auto opacity-0 transition-opacity duration-300"
            style={{ maxWidth: '18rem' }}
            onLoad={(e) => {
              const img = e.target as HTMLImageElement;
              const svg = img.previousElementSibling as SVGElement;
              img.style.opacity = '1';
              if (svg) svg.style.display = 'none';
            }}
            fetchpriority="low"
            loading="lazy"
            decoding="async"
          />
        </div>
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
