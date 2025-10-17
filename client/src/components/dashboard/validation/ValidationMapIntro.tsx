import { CheckCircle } from "lucide-react";

export function ValidationMapIntro() {
  return (
    <div className="rounded-xl border border-gray-700/50 p-8 mb-6" style={{ backgroundColor: '#0E0E12' }}>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Title and Features */}
        <div className="lg:col-span-4">
          <h2 className="text-3xl font-bold text-white mb-6">
            Validation Map
          </h2>
          
          <div className="space-y-1">
            <p className="text-sm text-gray-400 mb-4">
              The Validation Map is your systematic pathway to:
            </p>
            
            <div className="flex items-center gap-3 text-green-400">
              <CheckCircle className="w-4 h-4" />
              <span className="text-sm">AI-curated experiments tailored to your startup</span>
            </div>
            
            <div className="flex items-center gap-3 text-green-400">
              <CheckCircle className="w-4 h-4" />
              <span className="text-sm">Structured validation across 4 key spheres</span>
            </div>
            
            <div className="flex items-center gap-3 text-green-400">
              <CheckCircle className="w-4 h-4" />
              <span className="text-sm">ProofTag unlocks as you validate assumptions</span>
            </div>
            
            <div className="flex items-center gap-3 text-green-400">
              <CheckCircle className="w-4 h-4" />
              <span className="text-sm">Clear evidence for investor conversations</span>
            </div>
          </div>
        </div>

        {/* Right Column: Additional Info */}
        <div className="lg:col-span-8">
          <div className="text-gray-300 leading-relaxed">
            <p className="mb-4">
              Track your validation journey through carefully designed experiments that test your business assumptions. Each completed experiment brings you closer to investment readiness.
            </p>
            <p className="text-sm text-gray-400">
              Complete experiments to unlock ProofTags and strengthen your pitch with real validation data.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
