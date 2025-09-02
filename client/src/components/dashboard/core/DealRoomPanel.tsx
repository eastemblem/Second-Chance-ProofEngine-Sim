import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, CheckCircle, TrendingUp, Clock, CreditCard } from "lucide-react";

interface ValidationData {
  proofScore: number;
}

interface DealRoomPanelProps {
  validationData: ValidationData | null;
  hasDealRoomAccess: boolean;
  onPaymentModalOpen: () => void;
}

export function DealRoomPanel({ validationData, hasDealRoomAccess, onPaymentModalOpen }: DealRoomPanelProps) {
  return (
    <Card className="bg-black/50 border-gray-800">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <Shield className="w-5 h-5" />
          Deal Room Access
        </CardTitle>
        <CardDescription className="text-gray-400">
          Connect with verified investors
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {(validationData?.proofScore || 0) >= 70 ? (
            <>
              {hasDealRoomAccess ? (
                <>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                    <span className="text-green-400 text-sm">Access Granted</span>
                  </div>
                  <p className="text-gray-400 text-sm">Your venture is now visible to our verified investor network.</p>
                  <Button 
                    className="w-full bg-gradient-to-r from-purple-500 to-yellow-500 text-white hover:from-purple-600 hover:to-yellow-600"
                    onClick={() => window.location.href = '/deal-room'}
                  >
                    Enter Deal Room →
                  </Button>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-purple-400" />
                    <span className="text-purple-400 text-sm">Investor Ready</span>
                  </div>
                  <div className="bg-gradient-to-r from-purple-900/30 to-yellow-900/30 border border-purple-500/30 rounded-lg p-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-yellow-400 mb-2">
                        {Math.floor(Math.random() * 15) + 12} investors
                      </div>
                      <p className="text-sm text-gray-300 mb-3">are matched and interested in your venture</p>
                    </div>
                  </div>
                  <p className="text-gray-400 text-sm text-center">
                    Access investor matches, personalized certificates, and detailed reports for $1
                  </p>
                  <Button 
                    className="w-full bg-gradient-to-r from-purple-500 to-yellow-500 text-white hover:from-purple-600 hover:to-yellow-600 flex items-center justify-center gap-2"
                    onClick={onPaymentModalOpen}
                  >
                    <CreditCard className="w-4 h-4" />
                    Unlock Deal Room - $1
                  </Button>
                </>
              )}
            </>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-yellow-400" />
                <span className="text-yellow-400 text-sm">Upload Required</span>
              </div>
              <p className="text-gray-400 text-sm">
                Upload more documents to increase your ProofScore to 70+ and unlock Deal Room access.
              </p>
              <div className="bg-gradient-to-r from-yellow-900/30 to-orange-900/30 border border-yellow-500/30 rounded-lg p-4">
                <div className="text-center">
                  <div className="text-lg font-bold text-yellow-400 mb-1">
                    {70 - (validationData?.proofScore || 0)} points needed
                  </div>
                  <p className="text-xs text-gray-400">to unlock investor access</p>
                </div>
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}