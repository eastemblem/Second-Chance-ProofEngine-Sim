import logoMain from "@assets/second_chance_logo_main.png";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  showTagline?: boolean;
}

export default function Logo({ size = "md", showTagline = true }: LogoProps) {
  const imageSize = {
    sm: "h-8",
    md: "h-12", 
    lg: "h-16"
  };

  return (
    <div className="flex items-center space-x-3">
      <img 
        src={logoMain} 
        alt="Second Chance Logo"
        className={`${imageSize[size]} w-auto`}
      />
    </div>
  );
}
