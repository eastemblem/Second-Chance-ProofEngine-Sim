import { Badge } from "@/components/ui/badge";
import { CheckCircle } from "lucide-react";

export default function BoxConnectionStatus() {
  return (
    <div className="flex items-center gap-2 mb-6">
      <CheckCircle className="h-4 w-4 text-green-600" />
      <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
        ProofVault Ready
      </Badge>
    </div>
  );
}