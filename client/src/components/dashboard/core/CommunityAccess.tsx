import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { MessageCircle, Calendar, Users, ChevronLeft, ChevronRight } from "lucide-react";
import { SiWhatsapp, SiSlack } from "react-icons/si";
import { apiRequest } from "@/lib/queryClient";
import { useQuery } from "@tanstack/react-query";
import { formatEventDate, formatEventTime } from "@/lib/date-utils";
import useEmblaCarousel from "embla-carousel-react";
import { useCallback } from "react";

interface CommunityAccessProps {
  hasDealRoomAccess: boolean;
}

interface UpcomingEvent {
  id: string;
  urlId: string;
  title: string;
  startDate: string;
  endDate: string;
  location: string;
  url: string;
}

export function CommunityAccess({ hasDealRoomAccess }: CommunityAccessProps) {
  // Fetch upcoming events from API
  const { data: eventsResponse, isLoading, error } = useQuery<{ success: boolean; data: UpcomingEvent[] }>({
    queryKey: ['/api/v1/events/upcoming'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/v1/events/upcoming');
      return await response.json();
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  const events = eventsResponse?.data || [];

  // Embla Carousel setup
  const [emblaRef, emblaApi] = useEmblaCarousel({ 
    loop: true, 
    align: 'start',
    slidesToScroll: 1
  });

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  const handleCalendlyClick = () => {
    if (hasDealRoomAccess) {
      window.open('https://calendly.com/get-secondchance-info/30min', '_blank');
    }
  };

  const handleEventClick = (url: string) => {
    window.open(url, '_blank');
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
            data-testid="button-calendly-booking"
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
          
          {/* Loading State */}
          {isLoading && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Skeleton className="h-24 bg-gray-800" />
              <Skeleton className="h-24 bg-gray-800" />
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="text-gray-400 text-sm p-4 border border-gray-800 rounded-lg">
              Unable to load upcoming events. Please try again later.
            </div>
          )}

          {/* Events Carousel */}
          {!isLoading && !error && events.length > 0 && (
            <div className="relative">
              {/* Carousel Container */}
              <div className="overflow-hidden" ref={emblaRef}>
                <div className="flex gap-4">
                  {events.map((event) => (
                    <div 
                      key={event.id}
                      className="flex-[0_0_100%] min-w-0 md:flex-[0_0_calc(50%-0.5rem)]"
                    >
                      <div 
                        onClick={() => handleEventClick(event.url)}
                        className="group relative overflow-hidden rounded-lg bg-gradient-to-br from-violet-500/10 to-violet-600/20 border border-violet-500/30 p-4 hover:border-violet-400/50 transition-all duration-300 cursor-pointer h-full"
                        data-testid={`event-card-${event.urlId}`}
                      >
                        <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        <div className="relative">
                          <div className="border-l-4 border-violet-500 pl-4">
                            <h4 className="text-white font-semibold text-lg">{event.title}</h4>
                            <p className="text-gray-400 text-sm">{formatEventDate(event.startDate)}</p>
                            <p className="text-gray-400 text-sm">{formatEventTime(event.startDate, event.endDate)}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Navigation Buttons */}
              {events.length > 2 && (
                <>
                  <button
                    onClick={scrollPrev}
                    className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 bg-violet-600/80 hover:bg-violet-500/90 text-white p-2 rounded-full transition-all duration-300 shadow-lg"
                    data-testid="carousel-prev-button"
                    aria-label="Previous event"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                  <button
                    onClick={scrollNext}
                    className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 bg-violet-600/80 hover:bg-violet-500/90 text-white p-2 rounded-full transition-all duration-300 shadow-lg"
                    data-testid="carousel-next-button"
                    aria-label="Next event"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                </>
              )}
            </div>
          )}

          {/* No Events State */}
          {!isLoading && !error && events.length === 0 && (
            <div className="text-gray-400 text-sm p-4 border border-gray-800 rounded-lg">
              No upcoming events at the moment. Check back soon!
            </div>
          )}
        </div>

      </CardContent>
    </Card>
  );
}