import { Card } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface TimelineCardProps {
  week: number;
  title: string;
  description: string;
  icon: LucideIcon;
  weekColor?: string;
  isActive?: boolean;
}

export function TimelineCard({ 
  week, 
  title, 
  description, 
  icon: Icon, 
  weekColor = "bg-blue-500",
  isActive = false 
}: TimelineCardProps) {
  return (
    <Card className={`p-6 transition-all duration-300 ${
      isActive 
        ? 'bg-gradient-to-br from-purple-900/50 to-blue-900/50 border-purple-500/50 scale-105' 
        : 'bg-gray-900/30 border-gray-800 hover:border-gray-700'
    }`}>
      <div className="flex items-start gap-4">
        <div className={`${weekColor} w-12 h-12 rounded-full flex items-center justify-center text-white font-bold shrink-0`}>
          W{week}
        </div>
        
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Icon className="w-5 h-5 text-purple-400" />
            <h3 className="text-lg font-semibold text-white">{title}</h3>
          </div>
          <p className="text-gray-400 text-sm leading-relaxed">{description}</p>
        </div>
      </div>
    </Card>
  );
}