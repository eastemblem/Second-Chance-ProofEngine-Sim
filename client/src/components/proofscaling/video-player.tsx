import { useState } from "react";
import { PlayCircle, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface VideoPlayerProps {
  thumbnail?: string;
  title?: string;
  duration?: string;
}

export function VideoPlayer({ thumbnail, title = "ProofScaling Demo", duration = "3:45" }: VideoPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <div className="relative bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl overflow-hidden shadow-2xl max-w-2xl mx-auto">
      <div className="aspect-video bg-gradient-to-br from-purple-900/50 to-blue-900/50 flex items-center justify-center">
        {!isPlaying ? (
          <Button
            onClick={() => setIsPlaying(true)}
            variant="ghost"
            size="lg"
            className="text-white hover:text-purple-200 hover:bg-white/10"
          >
            <PlayCircle className="w-16 h-16" />
          </Button>
        ) : (
          <div className="text-white text-center">
            <Volume2 className="w-8 h-8 mx-auto mb-2" />
            <p>Video would play here</p>
          </div>
        )}
      </div>
      
      <div className="p-4 bg-gray-900/80">
        <div className="flex items-center justify-between">
          <h4 className="text-white font-medium">{title}</h4>
          <span className="text-gray-400 text-sm">{duration}</span>
        </div>
      </div>
    </div>
  );
}