import { Badge } from "@/components/ui/badge";
import { Clock, Users } from "lucide-react";

export function UrgencyBanner() {
  return (
    <Badge variant="outline" className="bg-gradient-to-r from-orange-500/20 to-red-500/20 border-orange-500/50 text-orange-200 px-6 py-2 text-sm font-medium">
      <Clock className="w-4 h-4 mr-2" />
      Limited spots available - Join 1,247 founders scaling their startups
      <Users className="w-4 h-4 ml-2" />
    </Badge>
  );
}