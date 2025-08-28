import { Card } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface FeatureCardSimpleProps {
  icon: LucideIcon;
  title: string;
  description: string;
  delay?: number;
  gradientFrom?: string;
  gradientTo?: string;
}

export function FeatureCardSimple({ 
  icon: Icon, 
  title, 
  description,
  delay = 0,
  gradientFrom = "from-purple-500",
  gradientTo = "to-blue-600"
}: FeatureCardSimpleProps) {
  return (
    <Card className="p-6 bg-gray-900/30 border-gray-800 hover:border-purple-500/50 transition-all duration-300 group">
      <div className="text-center">
        <div className={`w-12 h-12 bg-gradient-to-r ${gradientFrom} ${gradientTo} rounded-lg p-3 mx-auto mb-4 group-hover:scale-110 transition-transform`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        
        <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
        <p className="text-gray-400 text-sm leading-relaxed">{description}</p>
      </div>
    </Card>
  );
}