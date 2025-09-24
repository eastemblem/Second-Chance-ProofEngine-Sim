import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Shield } from "lucide-react";

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
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Shield className="w-5 h-5 text-blue-400" />
            File Upload Requirements & Consent
          </DialogTitle>
          <DialogDescription className="text-gray-300">
            Before uploading your documents, please confirm that your files meet the following requirements:
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* File Validity Checklist */}
          <div className="space-y-3">
            <h3 className="font-semibold text-green-400 flex items-center gap-2">
              ✅ File Validity Checklist:
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-start gap-2">
                <span className="text-green-400 mt-0.5">✓</span>
                <span><strong>Authentic Documents:</strong> All files contain genuine, up-to-date business information</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-green-400 mt-0.5">✓</span>
                <span><strong>File Format:</strong> Documents are in the correct format (PDF, DOCX, XLSX, PPT, PNG, JPG, etc.)</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-green-400 mt-0.5">✓</span>
                <span><strong>File Size:</strong> Each file is under the specified size limit (5MB - 25MB depending on document type)</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-green-400 mt-0.5">✓</span>
                <span><strong>Document Quality:</strong> Files are clear, legible, and professionally formatted</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-green-400 mt-0.5">✓</span>
                <span><strong>Current Information:</strong> Documents reflect your startup's current status (pitch decks &lt;3 months old)</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-green-400 mt-0.5">✓</span>
                <span><strong>Complete Content:</strong> Documents contain all required information as specified in the guidelines</span>
              </div>
            </div>
          </div>

          {/* Data Processing Consent */}
          <div className="space-y-3">
            <h3 className="font-semibold text-blue-400 flex items-center gap-2">
              🛡️ Data Processing Consent:
            </h3>
            <div className="space-y-2 text-sm">
              <p>By uploading files, you confirm that:</p>
              <div className="space-y-1 ml-4">
                <div>• All documents are accurate and represent your business truthfully</div>
                <div>• You have the right to upload and share these documents</div>
                <div>• You understand files will be processed to calculate your <strong>ProofScore</strong></div>
                <div>• Documents may be reviewed as part of investor matching services</div>
              </div>
            </div>
          </div>

          {/* Important Notes */}
          <div className="space-y-3">
            <h3 className="font-semibold text-yellow-400 flex items-center gap-2">
              ⚠️ Important Notes:
            </h3>
            <div className="space-y-2 text-sm">
              <div>• Invalid or incomplete files may affect your <strong>ProofScore</strong> calculation</div>
              <div>• Uploading fraudulent information violates our terms of service</div>
              <div>• Files are securely stored and processed according to our privacy policy</div>
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
                I confirm that all files I'm uploading are valid, accurate, and meet the above requirements
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