import { Loader2, CheckCircle, Lightbulb, Target, TrendingUp, Award } from "lucide-react";

export function ValidationMapLoadingScreen() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      {/* Main Loading Card */}
      <div className="rounded-xl border border-gray-700/50 p-8 mb-6" style={{ backgroundColor: '#0E0E12' }}>
        
        {/* Header with Loading Spinner */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-white mb-2">
              Generating Your Validation Map
            </h2>
            <p className="text-gray-400">
              AI is curating personalized experiments based on your pitch analysis...
            </p>
          </div>
          <div className="flex-shrink-0">
            <Loader2 className="h-12 w-12 animate-spin text-purple-500" data-testid="loader-validation-map" />
          </div>
        </div>

        {/* What is Validation Map Section */}
        <div className="border-t border-gray-700/50 pt-8 mb-8">
          <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
            <Lightbulb className="mr-2 h-5 w-5 text-yellow-400" />
            What is the Validation Map?
          </h3>
          <p className="text-gray-300 leading-relaxed mb-4">
            The Validation Map is your strategic roadmap to validate business assumptions before you invest heavily in building. 
            It transforms abstract ideas into concrete, testable experiments that provide real-world evidence about your startup's viability.
          </p>
        </div>

        {/* What You Can Do Section */}
        <div className="border-t border-gray-700/50 pt-8">
          <h3 className="text-xl font-semibold text-white mb-6 flex items-center">
            <Target className="mr-2 h-5 w-5 text-purple-400" />
            What You Can Do With It
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Feature 1 */}
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center mt-1">
                <CheckCircle className="h-5 w-5 text-green-400" />
              </div>
              <div>
                <h4 className="text-white font-medium mb-1">Test Critical Assumptions</h4>
                <p className="text-sm text-gray-400">
                  Each experiment tests a specific "leap of faith" assumption about your business model, helping you validate or invalidate key hypotheses.
                </p>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center mt-1">
                <TrendingUp className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <h4 className="text-white font-medium mb-1">Track Real Metrics</h4>
                <p className="text-sm text-gray-400">
                  Define target metrics, measure actual results, and document insights to build a data-driven case for your startup's potential.
                </p>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center mt-1">
                <Award className="h-5 w-5 text-purple-400" />
              </div>
              <div>
                <h4 className="text-white font-medium mb-1">Unlock ProofTags</h4>
                <p className="text-sm text-gray-400">
                  Complete experiments to earn ProofTags—badges that signal to investors you've systematically validated your business model.
                </p>
              </div>
            </div>

            {/* Feature 4 */}
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-yellow-500/20 flex items-center justify-center mt-1">
                <Lightbulb className="h-5 w-5 text-yellow-400" />
              </div>
              <div>
                <h4 className="text-white font-medium mb-1">Make Informed Decisions</h4>
                <p className="text-sm text-gray-400">
                  Based on results, decide whether to measure more, build the feature, pivot your approach, or stop pursuing a dead end.
                </p>
              </div>
            </div>

          </div>
        </div>

        {/* Bottom Note */}
        <div className="mt-8 pt-6 border-t border-gray-700/50">
          <p className="text-sm text-gray-400 text-center">
            💡 <span className="text-gray-300 font-medium">Pro Tip:</span> Founders who complete validation experiments are 3x more likely to secure investor meetings
          </p>
        </div>

      </div>
    </div>
  );
}
