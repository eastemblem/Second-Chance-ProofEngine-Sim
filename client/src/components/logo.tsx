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

  // For large sizes on landing, use optimized rendering
  if (size === 'lg' || size === 'xl') {
    return (
      <div className="flex justify-center mb-2">
        <img 
          src={logoMain} 
          alt="Second Chance - Powered by ProofScaling"
          className="max-w-72 w-auto h-auto"
          style={{ maxWidth: '18rem', height: 'auto' }}
          width="288"
          height="144"
          fetchpriority="high"
          loading="eager"
          decoding="sync"
        />
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
