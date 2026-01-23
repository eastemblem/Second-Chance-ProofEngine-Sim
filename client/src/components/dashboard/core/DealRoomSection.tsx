import { Button } from "@/components/ui/button";
import { CheckCircle, Clock, Eye, Check, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { trackEvent } from "@/lib/analytics";

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
  ventureStatus?: 'pending' | 'reviewing' | 'reviewed' | 'done';
  priceDisplay?: string;
  userType?: 'individual' | 'residency';
}

export function DealRoomSection({ validationData, hasDealRoomAccess = false, onPaymentModalOpen, ventureStatus = 'pending', priceDisplay = '$99 USD', userType = 'residency' }: DealRoomSectionProps) {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const proofScore = validationData?.proofScore || 0;
  const isUnlocked = proofScore >= 70;
  
  // Individual users get Deal Room access automatically when ProofScore >= 70
  const isIndividualUser = userType === 'individual';
  const effectiveHasDealRoomAccess = isIndividualUser ? (isUnlocked) : hasDealRoomAccess;

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
    if (isUnlocked && effectiveHasDealRoomAccess) {
      // Show congratulations message when user has access
      return (
        <>
          <div className="mb-6">
            <div className="flex items-center justify-center gap-2 mb-4">
              <CheckCircle className="w-6 h-6 text-green-400" />
              <span className="text-green-400 font-bold text-xl">Access Granted</span>
            </div>
            <div className="text-gray-300 text-lg">
              <span className="font-bold">Congrats! Your application has been approved and you have been granted access to the deal room of vetted investors, potential customers and partners.</span>
            </div>
          </div>
        </>
      );
    } else if (isUnlocked && isIndividualUser) {
      // Individual user has reached ProofScore >= 70 and auto-unlocked
      return (
        <>
          <span className="text-2xl">🚀</span> <span className="font-bold">You've unlocked the Deal Room!</span> <span className="text-2xl">🚀</span>
          <br />
          <span className="font-bold">You're a <span className="text-green-400">{matchPercentage}%</span> match with 3 tier-1 investors.</span>
          <br />
          <span className="font-bold">Book your first investor call today.</span>
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
    } else if (isIndividualUser) {
      // Individual user needs to reach ProofScore >= 70 to unlock
      return (
        <>
          You're a <span className="text-green-400 font-bold">{matchPercentage}%</span> match with tier-1 investors.
          <br />
          Complete your validation (reach ProofScore 70+) to unlock Deal Room access.
          <br />
          <span className="text-purple-400 font-medium">Upload more proof files to boost your score!</span>
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
    if (isUnlocked) {
      return "Book your first meeting!";
    }
    if (isIndividualUser) {
      return "Reach ProofScore 70+ to unlock";
    }
    return `Enter the Dealroom - ${priceDisplay}`;
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
  const handleButtonClick = async () => {
    // Check score requirement first
    if (proofScore < 70) {
      trackEvent('funnel_dealroom_blocked', 'engagement', 'score_below_70', proofScore);
      toast({
        title: "Access Restricted",
        description: "You have to achieve more than 70 in order to access deal room",
        variant: "destructive",
      });
      return;
    }

    if (isUnlocked) {
      trackEvent('funnel_dealroom_button_clicked', 'engagement', 'deal_room_unlocked', proofScore);
      // Emit DEAL_ROOM_VIEWED event when user views Deal Room with ProofScore >= 70
      try {
        await apiRequest('POST', '/api/v1/coach/track-event', { 
          eventType: 'deal_room_viewed',
          metadata: { proofScore }
        });
        console.log('✅ DEAL_ROOM_VIEWED event logged');
      } catch (error) {
        console.error('Failed to log DEAL_ROOM_VIEWED event:', error);
        // Don't block the UI if event logging fails
      }

      // Check if user has Deal Room access (paid or individual with score >= 70)
      if (effectiveHasDealRoomAccess) {
        // Direct to Calendly booking
        window.open('https://calendly.com/get-secondchance-info/30min', '_blank');
      } else if (!isIndividualUser) {
        // Trigger payment modal (only for residency users)
        onPaymentModalOpen?.();
      }
    }
  };

  return (
    <div className="rounded-xl border border-gray-700/50 p-8" style={{ backgroundColor: '#0E0E12' }} data-testid="deal-room-section">
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
          
          {/* Show Access Deal Room button when status is Done, otherwise show payment/booking button */}
          {(ventureStatus?.toLowerCase?.() === 'done') && effectiveHasDealRoomAccess ? (
            <Button 
              className="px-8 py-3 rounded-lg font-semibold transition-all duration-200 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
              onClick={() => {
                trackEvent('funnel_access_dealroom_clicked', 'engagement', 'deal_room_accessed');
                setLocation('/dashboard/deal-room');
              }}
              data-testid="button-access-deal-room"
            >
              Access Deal Room
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button 
              className={`px-8 py-3 rounded-lg font-semibold transition-all duration-200 ${getButtonStyle()}`}
              disabled={!isUnlocked}
              onClick={handleButtonClick}
              data-testid="button-book-meeting"
            >
              {getButtonText()}
            </Button>
          )}

          {/* Status Badge directly below button */}
          {isUnlocked && getExclusiveAccess() && (
            <div className="mt-3">
              <div className="text-sm text-gray-400">
                {getExclusiveAccess()}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Status Icons (only when user has access) */}
        <div className="lg:col-span-3">
          {isUnlocked && effectiveHasDealRoomAccess && (
            <div className="flex flex-col items-center gap-4 pt-8">
              {/* Reviewing */}
              <div className={`flex flex-col items-center gap-2 ${ventureStatus !== 'reviewing' ? 'opacity-50' : ''}`}>
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  ventureStatus === 'reviewing' 
                    ? 'bg-orange-400/20' 
                    : 'bg-gray-600'
                }`}>
                  <Clock className={`w-6 h-6 ${
                    ventureStatus === 'reviewing' 
                      ? 'text-orange-400 animate-pulse' 
                      : 'text-gray-400'
                  }`} />
                </div>
                <span className={`text-sm ${
                  ventureStatus === 'reviewing' 
                    ? 'text-orange-400 font-medium' 
                    : 'text-gray-400'
                }`}>Reviewing</span>
              </div>
              
              {/* Reviewed */}
              <div className={`flex flex-col items-center gap-2 ${ventureStatus !== 'reviewed' ? 'opacity-50' : ''}`}>
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  ventureStatus === 'reviewed' 
                    ? 'bg-blue-400/20' 
                    : 'bg-gray-600'
                }`}>
                  <Eye className={`w-6 h-6 ${
                    ventureStatus === 'reviewed' 
                      ? 'text-blue-400' 
                      : 'text-gray-400'
                  }`} />
                </div>
                <span className={`text-sm ${
                  ventureStatus === 'reviewed' 
                    ? 'text-blue-400 font-medium' 
                    : 'text-gray-400'
                }`}>Reviewed</span>
              </div>
              
              {/* Done */}
              <div className={`flex flex-col items-center gap-2 ${ventureStatus !== 'done' ? 'opacity-50' : ''}`}>
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  ventureStatus === 'done' 
                    ? 'bg-green-400/20' 
                    : 'bg-gray-600'
                }`}>
                  <Check className={`w-6 h-6 ${
                    ventureStatus === 'done' 
                      ? 'text-green-400' 
                      : 'text-gray-400'
                  }`} />
                </div>
                <span className={`text-sm ${
                  ventureStatus === 'done' 
                    ? 'text-green-400 font-medium' 
                    : 'text-gray-400'
                }`}>Done</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}