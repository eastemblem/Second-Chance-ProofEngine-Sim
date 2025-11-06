import { CheckCircle } from "lucide-react";

export function ValidationMapIntro() {
  return (
    <div className="rounded-xl border border-gray-700/50 p-8 mb-6" style={{ backgroundColor: '#0E0E12' }} data-testid="validation-map-intro">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left Column - Title and Bullets */}
        <div>
          <h2 className="text-3xl font-bold text-white mb-4">
            Validation Map
          </h2>
          
          <p className="text-gray-400 text-sm mb-6">
            The Validation Map is your systematic pathway to:
          </p>
          
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 flex-shrink-0 text-green-400 mt-0.5" />
              <span className="text-sm text-green-400">AI-curated experiments tailored to your startup</span>
            </div>
            
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 flex-shrink-0 text-green-400 mt-0.5" />
              <span className="text-sm text-green-400">Structured validation across 4 key spheres</span>
            </div>
            
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 flex-shrink-0 text-green-400 mt-0.5" />
              <span className="text-sm text-green-400">ProofTag unlocks as you validate assumptions</span>
            </div>
            
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 flex-shrink-0 text-green-400 mt-0.5" />
              <span className="text-sm text-green-400">Clear evidence for investor conversations</span>
            </div>
          </div>
        </div>

        {/* Right Column - Description */}
        <div className="flex flex-col justify-center space-y-4">
          <p className="text-gray-300 text-sm leading-relaxed">
            Track your validation journey through carefully designed experiments that test your business assumptions. 
            Each completed experiment brings you closer to investment readiness.
          </p>
          
          <p className="text-gray-300 text-sm leading-relaxed">
            Complete experiments to unlock ProofTags and strengthen your pitch with real validation data.
          </p>
        </div>
      </div>
    </div>
  );
}
