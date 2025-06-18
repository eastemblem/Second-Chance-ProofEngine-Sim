import logoMain from "@assets/second_chance_logo_1750269371846.png";

interface LogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  showTagline?: boolean;
}

export default function Logo({ size = "md", showTagline = true }: LogoProps) {
  const imageSize = {
    sm: "h-6",
    md: "h-8", 
    lg: "h-60",
    xl: "h-60"
  };

  return (
    <div className="flex items-center space-x-3">
      <img 
        src={logoMain} 
        alt="Second Chance - Powered by ProofScaling"
        className={`${size === 'lg' || size === 'xl' ? 'w-60' : imageSize[size]} w-auto`}
        style={size === 'lg' || size === 'xl' ? { width: '15rem', height: 'auto' } : {}}
      />
    </div>
  );
}
