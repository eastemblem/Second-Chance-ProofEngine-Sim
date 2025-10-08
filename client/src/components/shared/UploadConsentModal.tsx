import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";

interface UploadConsentModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  consentConfirmed: boolean;
  setConsentConfirmed: (confirmed: boolean) => void;
}

export function UploadConsentModal({ 
  isOpen, 
  onConfirm, 
  onCancel, 
  consentConfirmed, 
  setConsentConfirmed 
}: UploadConsentModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="bg-gray-900 border-gray-700 text-white max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl">
            ProofVault Upload Process
          </DialogTitle>
          <DialogDescription className="text-gray-300">
            Here's how the ProofVault upload process works:
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* How It Works */}
          <div className="space-y-3">
            <h3 className="font-semibold text-blue-400 text-base">How It Works:</h3>
            <div className="space-y-3 text-sm">
              <div>
                <strong className="text-green-400">1. Upload Files to ProofVault</strong>
                <div className="text-gray-300 ml-4">Upload to specific folder structure in ProofVault. Each folder represents a proof category with designated artifacts and file size limits.</div>
              </div>
              <div>
                <strong className="text-green-400">2. Earn ProofScore Points</strong>
                <div className="text-gray-300 ml-4">Each artifact has a specific point value that adds to your ProofScore. Building a strong ProofScore helps validate your startup's readiness.</div>
              </div>
              <div>
                <strong className="text-green-400">3. Get Your Results</strong>
                <div className="text-gray-300 ml-4">View your updated ProofScore in real-time and track progress across all categories.</div>
              </div>
              <div>
                <strong className="text-green-400">4. Unlock Opportunities</strong>
                <div className="text-gray-300 ml-4">Higher scores unlock investor matching services. Access Deal Room features at 70+ ProofScore points.</div>
              </div>
              <div>
                <strong className="text-yellow-400">5. What You Need to Do</strong>
                <div className="text-gray-300 ml-4">Upload authentic business documents, follow folder-specific file type requirements, and stay within size limits.</div>
              </div>
            </div>
          </div>

          {/* Links */}
          <div className="space-y-2 text-sm bg-gray-800 p-3 rounded-lg">
            <h4 className="font-semibold text-gray-300">Need More Details?</h4>
            <div className="space-y-1">
              <div>• <a href="/faq" target="_blank" className="text-blue-400 hover:text-blue-300 underline">Upload FAQ</a> - File formats, scoring, folder structure</div>
              <div>• <a href="/terms" target="_blank" className="text-blue-400 hover:text-blue-300 underline">Terms & Conditions</a> - Usage terms and data processing</div>
              <div>• <a href="/privacy" target="_blank" className="text-blue-400 hover:text-blue-300 underline">Privacy Policy</a> - Data protection and privacy rights</div>
            </div>
          </div>

          {/* Confirmation Checkbox */}
          <div className="bg-gray-800 p-4 rounded-lg border border-gray-600">
            <div className="flex items-start gap-3">
              <Checkbox 
                id="consent-checkbox"
                checked={consentConfirmed}
                onCheckedChange={(checked) => setConsentConfirmed(checked === true)}
                className="mt-1"
              />
              <label 
                htmlFor="consent-checkbox" 
                className="text-sm cursor-pointer leading-relaxed"
              >
                I understand the ProofVault upload process and agree to the <a href="/terms" target="_blank" className="text-blue-400 hover:text-blue-300 underline">Terms & Conditions</a> and <a href="/privacy" target="_blank" className="text-blue-400 hover:text-blue-300 underline">Privacy Policy</a>.
              </label>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-3">
          <Button 
            variant="outline" 
            onClick={onCancel}
            className="border-gray-600 text-gray-300 hover:bg-gray-800"
          >
            Cancel
          </Button>
          <Button 
            onClick={onConfirm}
            disabled={!consentConfirmed}
            className="bg-gradient-to-r from-purple-500 to-yellow-500 text-white hover:from-purple-600 hover:to-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Continue Upload
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}