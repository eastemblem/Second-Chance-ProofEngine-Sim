import { motion } from "framer-motion";
import { Star } from "lucide-react";

interface InvestorTestimonialProps {
  name: string;
  title: string;
  quote: string;
  avatar: string;
  delay?: number;
}

export function InvestorTestimonial({ 
  name, 
  title, 
  quote, 
  avatar, 
  delay = 0 
}: InvestorTestimonialProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay }}
      whileHover={{ 
        scale: 1.02, 
        y: -5,
        transition: { duration: 0.3 }
      }}
      className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl p-6 hover:shadow-lg hover:border-border/80 transition-all duration-300"
    >
      <div className="flex items-start gap-4 mb-4">
        {/* Avatar */}
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-orange-400 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
          {avatar}
        </div>
        
        {/* Name and Title */}
        <div className="flex-1">
          <h4 className="font-bold text-foreground">{name}</h4>
          <p className="text-sm text-muted-foreground">{title}</p>
        </div>
        
        {/* Rating Stars */}
        <div className="flex gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
          ))}
        </div>
      </div>
      
      {/* Quote */}
      <blockquote className="text-foreground text-sm leading-relaxed italic">
        "{quote}"
      </blockquote>
    </motion.div>
  );
}