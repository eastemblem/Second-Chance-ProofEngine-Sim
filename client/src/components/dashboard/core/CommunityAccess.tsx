import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageCircle, Calendar, Users } from "lucide-react";
import { SiWhatsapp, SiSlack } from "react-icons/si";

interface CommunityAccessProps {
  hasDealRoomAccess: boolean;
}

export function CommunityAccess({ hasDealRoomAccess }: CommunityAccessProps) {
  const handleCalendlyClick = () => {
    if (hasDealRoomAccess) {
      window.open('https://calendly.com/get-secondchance-info/30min', '_blank');
    }
  };

  const handleFoundersLiveClick = () => {
    window.open('https://www.founderslive.com/events#schedule', '_blank');
  };

  const handleWhatsAppClick = () => {
    if (hasDealRoomAccess) {
      window.open('https://whatsapp.com/yourlink', '_blank');
    }
  };

  const handleSlackClick = () => {
    if (hasDealRoomAccess) {
      window.open('https://slack.com/yourlink', '_blank');
    }
  };

  return (
    <Card className="border-gray-800" style={{ backgroundColor: '#0E0E12' }} data-testid="community-access-section">
      <CardHeader>
        <CardTitle className="text-white text-3xl font-bold">Community Access</CardTitle>
        <CardDescription className="text-gray-400">
          Connect with founders and join exclusive events
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        
        {/* Community Access Icons */}
        <div className="flex items-center justify-center gap-16">
          {/* WhatsApp */}
          <div 
            className="cursor-not-allowed opacity-30 grayscale transition-all duration-300"
          >
            <SiWhatsapp className="w-12 h-12 text-gray-500" />
          </div>

          {/* Slack */}
          <div 
            className="cursor-not-allowed opacity-30 grayscale transition-all duration-300"
          >
            <SiSlack className="w-12 h-12 text-gray-500" />
          </div>

          {/* Calendly */}
          <div 
            onClick={handleCalendlyClick}
            className={hasDealRoomAccess 
              ? "cursor-pointer transition-all duration-300 hover:scale-110"
              : "cursor-not-allowed opacity-30 grayscale transition-all duration-300"
            }
          >
            <Calendar className={hasDealRoomAccess 
              ? "w-12 h-12 text-blue-400" 
              : "w-12 h-12 text-gray-500"
            } />
          </div>
        </div>

        {/* Events Section */}
        <div>
          <h3 className="text-white text-xl font-bold mb-4">Events</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Founders Live Egypt */}
            <div 
              onClick={handleFoundersLiveClick}
              className="group relative overflow-hidden rounded-lg bg-gradient-to-br from-violet-500/10 to-violet-600/20 border border-violet-500/30 p-4 hover:border-violet-400/50 transition-all duration-300 cursor-pointer"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="relative">
                <div className="border-l-4 border-violet-500 pl-4">
                  <h4 className="text-white font-semibold text-lg">Founders Live Egypt</h4>
                  <p className="text-gray-400 text-sm">August 30th 2025</p>
                  <p className="text-gray-400 text-sm">02:00 PM - 03:00 PM</p>
                </div>
              </div>
            </div>

            {/* Founders Live UAE */}
            <div 
              onClick={handleFoundersLiveClick}
              className="group relative overflow-hidden rounded-lg bg-gradient-to-br from-violet-500/10 to-violet-600/20 border border-violet-500/30 p-4 hover:border-violet-400/50 transition-all duration-300 cursor-pointer"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="relative">
                <div className="border-l-4 border-violet-500 pl-4">
                  <h4 className="text-white font-semibold text-lg">Founders Live UAE</h4>
                  <p className="text-gray-400 text-sm">September 15th 2025</p>
                  <p className="text-gray-400 text-sm">01:00 PM - 02:00 PM</p>
                </div>
              </div>
            </div>
          </div>
        </div>

      </CardContent>
    </Card>
  );
}