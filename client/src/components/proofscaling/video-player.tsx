import { motion } from "framer-motion";
import { Play } from "lucide-react";
import { useState } from "react";

interface VideoPlayerProps {
  title: string;
  subtitle: string;
  thumbnail?: string;
  onPlay?: () => void;
}

export function VideoPlayer({ title, subtitle, thumbnail, onPlay }: VideoPlayerProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="relative w-full max-w-2xl mx-auto"
    >
      <div
        className="relative bg-gradient-to-br from-purple-600 to-orange-500 rounded-2xl py-24 px-16 cursor-pointer overflow-hidden"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={onPlay}
      >
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-8 left-8 w-32 h-32 bg-white/20 rounded-full blur-xl" />
          <div className="absolute bottom-8 right-8 w-24 h-24 bg-white/10 rounded-full blur-lg" />
        </div>

        {/* Play Button */}
        <motion.div
          animate={{ scale: isHovered ? 1.1 : 1 }}
          transition={{ duration: 0.3 }}
          className="relative z-10 flex flex-col items-center text-center text-white"
        >
          <motion.div
            animate={{ scale: isHovered ? 1.1 : 1 }}
            transition={{ duration: 0.3 }}
            className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mb-6 hover:bg-white/30 transition-colors"
          >
            <Play className="w-8 h-8 ml-1" />
          </motion.div>

          <h3 className="text-2xl font-bold mb-2">{title}</h3>
          <p className="text-white/80 text-lg">{subtitle}</p>
        </motion.div>
      </div>
    </motion.div>
  );
}