import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";

interface ValidationData {
  proofScore: number;
  proofTagsUnlocked: number;
  totalProofTags: number;
  filesUploaded: number;
  status: string;
  certificateUrl?: string;
  reportUrl?: string;
}

interface DealRoomSectionProps {
  validationData: ValidationData | null;
  hasDealRoomAccess?: boolean;
  onPaymentModalOpen?: () => void;
}

export function DealRoomSection({ validationData, hasDealRoomAccess = false, onPaymentModalOpen }: DealRoomSectionProps) {
  const proofScore = validationData?.proofScore || 0;
  const isUnlocked = proofScore >= 70;

  // Calculate match percentage based on score
  const getMatchPercentage = () => {
    if (proofScore >= 90) return 90;
    if (proofScore >= 80) return 80;
    if (proofScore >= 70) return Math.floor(proofScore);
    return 50; // Default for scores < 70
  };

  const matchPercentage = getMatchPercentage();

  // Get conditional content based on unlock status
  const getMainText = () => {
    if (isUnlocked && hasDealRoomAccess) {
      // Show congratulations message when user has paid
      return (
        <>
          <div className="mb-6">
            <div className="flex items-center justify-center gap-2 mb-4">
              <CheckCircle className="w-6 h-6 text-green-400" />
              <span className="text-green-400 font-bold text-xl">Access Granted</span>
            </div>
            <div className="text-gray-300 text-lg">
              <span className="font-bold">Congratulations for joining the community!</span>
              <br />
              <span>Your venture is now visible to our verified investor network.</span>
            </div>
          </div>
        </>
      );
    } else if (isUnlocked) {
      return (
        <>
          <span className="text-2xl">🚀</span> <span className="font-bold">You've unlocked the Deal Room!</span> <span className="text-2xl">🚀</span>
          <br />
          <span className="font-bold">You're a <span className="text-green-400">{matchPercentage}%</span> match with 3 tier-1 investors.</span>
          <br />
          <span className="font-bold">Book your first investor call today.</span>
        </>
      );
    }
    return (
      <>
        You're a <span className="text-green-400 font-bold">{matchPercentage}%</span> match with tier-1 investors.
        <br />
        Upload 3 more files to unlock your Deal Room
        <br />
        and book your first investor call.
      </>
    );
  };

  const getButtonText = () => {
    return isUnlocked ? "Book your first meeting!" : "Enter the Dealroom";
  };

  const getButtonStyle = () => {
    return isUnlocked 
      ? "bg-blue-600 hover:bg-blue-700 text-white"
      : "bg-gray-600 hover:bg-gray-700 text-gray-300";
  };

  const getExclusiveAccess = () => {
    if (isUnlocked) {
      return `Exclusive access granted — ProofScore ${proofScore}`;
    }
    return null;
  };

  // Handle button click
  const handleButtonClick = () => {
    if (isUnlocked) {
      // Check if user has paid for Deal Room access
      if (hasDealRoomAccess) {
        // Direct to Calendly booking
        window.open('https://calendly.com/get-secondchance-info/30min', '_blank');
      } else {
        // Trigger payment modal
        onPaymentModalOpen?.();
      }
    }
  };

  return (
    <div className="bg-gray-900/60 rounded-xl border border-gray-700/50 p-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Title and Features */}
        <div className="lg:col-span-3">
          <h2 className="text-3xl font-bold text-white mb-6">
            Dealroom
          </h2>
          
          <div className="space-y-1">
            <p className="text-sm text-gray-400 mb-4">
              The Deal Room is your gateway to:
            </p>
            
            <div className="flex items-center gap-3 text-green-400">
              <CheckCircle className="w-4 h-4" />
              <span className="text-sm">Investor introductions</span>
            </div>
            
            <div className="flex items-center gap-3 text-green-400">
              <CheckCircle className="w-4 h-4" />
              <span className="text-sm">Warm matches</span>
            </div>
            
            <div className="flex items-center gap-3 text-green-400">
              <CheckCircle className="w-4 h-4" />
              <span className="text-sm">Faster fundraising conversations.</span>
            </div>
          </div>
        </div>

        {/* Center Column: Main Content */}
        <div className="lg:col-span-6 text-center">
          <div className="text-xl text-gray-300 leading-relaxed mb-6">
            {getMainText()}
          </div>
          
          <Button 
            className={`px-8 py-3 rounded-lg font-semibold transition-all duration-200 ${getButtonStyle()}`}
            disabled={!isUnlocked}
            onClick={handleButtonClick}
          >
            {getButtonText()}
          </Button>

          {/* Status Badge directly below button */}
          {isUnlocked && getExclusiveAccess() && (
            <div className="mt-3">
              <div className="text-sm text-gray-400">
                {getExclusiveAccess()}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Empty */}
        <div className="lg:col-span-3">
          {/* Intentionally empty */}
        </div>
      </div>
    </div>
  );
}