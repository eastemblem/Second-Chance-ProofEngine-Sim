import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageCircle, Calendar, Users } from "lucide-react";
import { SiWhatsapp, SiSlack } from "react-icons/si";

interface CommunityAccessProps {
  hasDealRoomAccess: boolean;
}

export function CommunityAccess({ hasDealRoomAccess }: CommunityAccessProps) {
  const handleCalendlyClick = () => {
    window.open('https://calendly.com/get-secondchance-info/30min', '_blank');
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
    <Card className="bg-black/50 border-gray-800">
      <CardHeader>
        <CardTitle className="text-white text-3xl font-bold">Community Access</CardTitle>
        <CardDescription className="text-gray-400">
          Connect with founders and join exclusive events
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        
        {/* Community Access Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* WhatsApp */}
          <div className={`group relative overflow-hidden rounded-lg border p-6 transition-all duration-300 ${
            hasDealRoomAccess 
              ? 'bg-gradient-to-br from-green-500/10 to-green-600/20 border-green-500/30 hover:border-green-400/50 cursor-pointer' 
              : 'bg-gradient-to-br from-gray-500/10 to-gray-600/20 border-gray-500/30 cursor-not-allowed opacity-60'
          }`}>
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="relative text-center">
              <div className="p-3 rounded-lg bg-green-500/20 inline-block mb-3">
                <SiWhatsapp className="w-8 h-8 text-green-400" />
              </div>
              <h3 className="text-white font-semibold mb-2">WhatsApp</h3>
              <Button 
                onClick={handleWhatsAppClick}
                className={`w-full text-white border-0 shadow-lg transition-all duration-300 ${
                  hasDealRoomAccess
                    ? 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 hover:shadow-green-500/25'
                    : 'bg-gray-600 cursor-not-allowed'
                }`}
                disabled={!hasDealRoomAccess}
              >
                {hasDealRoomAccess ? 'Join Group' : 'Payment Required'}
              </Button>
            </div>
          </div>

          {/* Slack */}
          <div className={`group relative overflow-hidden rounded-lg border p-6 transition-all duration-300 ${
            hasDealRoomAccess 
              ? 'bg-gradient-to-br from-purple-500/10 to-purple-600/20 border-purple-500/30 hover:border-purple-400/50 cursor-pointer' 
              : 'bg-gradient-to-br from-gray-500/10 to-gray-600/20 border-gray-500/30 cursor-not-allowed opacity-60'
          }`}>
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="relative text-center">
              <div className="p-3 rounded-lg bg-purple-500/20 inline-block mb-3">
                <SiSlack className="w-8 h-8 text-purple-400" />
              </div>
              <h3 className="text-white font-semibold mb-2">Slack</h3>
              <Button 
                onClick={handleSlackClick}
                className={`w-full text-white border-0 shadow-lg transition-all duration-300 ${
                  hasDealRoomAccess
                    ? 'bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 hover:shadow-purple-500/25'
                    : 'bg-gray-600 cursor-not-allowed'
                }`}
                disabled={!hasDealRoomAccess}
              >
                {hasDealRoomAccess ? 'Join Workspace' : 'Payment Required'}
              </Button>
            </div>
          </div>

          {/* Calendly */}
          <div className="group relative overflow-hidden rounded-lg bg-gradient-to-br from-blue-500/10 to-blue-600/20 border border-blue-500/30 p-6 hover:border-blue-400/50 transition-all duration-300 cursor-pointer">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="relative text-center">
              <div className="p-3 rounded-lg bg-blue-500/20 inline-block mb-3">
                <Calendar className="w-8 h-8 text-blue-400" />
              </div>
              <h3 className="text-white font-semibold mb-2">Calendly</h3>
              <Button 
                onClick={handleCalendlyClick}
                className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white border-0 shadow-lg hover:shadow-blue-500/25 transition-all duration-300"
              >
                Schedule Meeting
              </Button>
            </div>
          </div>
        </div>

        {/* Events Section */}
        <div>
          <h3 className="text-white text-xl font-bold mb-4">Events</h3>
          <div className="space-y-4">
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