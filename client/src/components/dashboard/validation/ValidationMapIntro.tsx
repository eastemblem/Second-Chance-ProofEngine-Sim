import { CheckCircle } from "lucide-react";

export function ValidationMapIntro() {
  return (
    <div className="rounded-xl border border-gray-700/50 p-8 mb-6" style={{ backgroundColor: '#0E0E12' }}>
      <h2 className="text-3xl font-bold text-white mb-6">
        Validation Map
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Column 1 */}
        <div className="space-y-3">
          <div className="flex items-center gap-3 text-green-400">
            <CheckCircle className="w-4 h-4 flex-shrink-0" />
            <span className="text-sm">AI-curated experiments tailored to your startup</span>
          </div>
          
          <div className="flex items-center gap-3 text-green-400">
            <CheckCircle className="w-4 h-4 flex-shrink-0" />
            <span className="text-sm">Structured validation across 4 key spheres</span>
          </div>
        </div>

        {/* Column 2 */}
        <div className="space-y-3">
          <div className="flex items-center gap-3 text-green-400">
            <CheckCircle className="w-4 h-4 flex-shrink-0" />
            <span className="text-sm">ProofTag unlocks as you validate assumptions</span>
          </div>
          
          <div className="flex items-center gap-3 text-green-400">
            <CheckCircle className="w-4 h-4 flex-shrink-0" />
            <span className="text-sm">Clear evidence for investor conversations</span>
          </div>
        </div>
      </div>
    </div>
  );
}
