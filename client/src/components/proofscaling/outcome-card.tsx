import { Card } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface OutcomeCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  stat?: string;
  gradient?: string;
  badge?: string;
  gradientColor?: string;
}

export function OutcomeCard({ 
  icon: Icon, 
  title, 
  description, 
  stat,
  gradient = "from-blue-500 to-purple-600",
  badge,
  gradientColor 
}: OutcomeCardProps) {
  return (
    <Card className="p-6 bg-gray-900/50 border-gray-800 hover:border-purple-500/50 transition-colors group">
      {badge && (
        <div className="mb-3">
          <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${gradientColor || 'bg-purple-500/20 text-purple-300'}`}>
            {badge}
          </span>
        </div>
      )}
      
      <div className={`w-12 h-12 rounded-lg bg-gradient-to-r ${gradient} p-3 mb-4 group-hover:scale-110 transition-transform`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      
      <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
      <p className="text-gray-400 mb-4">{description}</p>
      
      {stat && (
        <div className={`text-2xl font-bold bg-gradient-to-r ${gradient} bg-clip-text text-transparent`}>
          {stat}
        </div>
      )}
    </Card>
  );
}