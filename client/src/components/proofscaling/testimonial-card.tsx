import { motion } from "framer-motion";
import { Star } from "lucide-react";
import { Card } from "@/components/ui/card";

export interface TestimonialData {
  name: string;
  title: string;
  company: string;
  avatar: string;
  rating: number;
  quote: string;
  result: string;
  proofScore: number;
}

interface TestimonialCardProps {
  testimonial: TestimonialData;
  delay?: number;
}

export function TestimonialCard({ testimonial, delay = 0 }: TestimonialCardProps) {
  const getFounderImage = (name: string) => {
    // Generate a consistent gradient based on name
    const colors = [
      'from-blue-500 to-green-500',
      'from-green-500 to-teal-500', 
      'from-teal-500 to-blue-500',
      'from-indigo-500 to-blue-500',
      'from-blue-500 to-purple-500'
    ];
    const index = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
    return colors[index];
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay }}
      whileHover={{ 
        y: -10, 
        scale: 1.03,
        transition: { duration: 0.3 }
      }}
      className="h-full group"
    >
      <Card className="p-6 bg-gradient-to-br from-card/50 to-card/80 backdrop-blur-sm border border-border/50 h-full hover:border-blue-500/30 transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/10 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-blue-500/10 to-transparent rounded-full -translate-y-16 translate-x-16 group-hover:scale-150 transition-transform duration-500" />
        
        <div className="flex items-start space-x-4 mb-6 relative">
          <motion.div 
            className={`w-14 h-14 rounded-full bg-gradient-to-br ${getFounderImage(testimonial.name)} flex items-center justify-center text-white font-bold text-lg flex-shrink-0 ring-2 ring-blue-500/20 group-hover:ring-blue-500/40 transition-all duration-300`}
            whileHover={{ scale: 1.1, rotate: 5 }}
          >
            {testimonial.avatar}
          </motion.div>
          <div className="text-left flex-1">
            <h4 className="font-bold text-foreground text-lg group-hover:text-blue-500 transition-colors">{testimonial.name}</h4>
            <p className="text-sm text-muted-foreground font-medium">{testimonial.title}</p>
            <p className="text-sm font-semibold mt-1">
              <span className="text-muted-foreground">at </span>
              <span className="text-blue-500">{testimonial.company}</span>
            </p>
            <div className="mt-2 flex items-center space-x-2">
              <div className="text-xs font-bold px-2 py-1 bg-blue-500/20 text-blue-500 rounded-full">
                ProofScore: {testimonial.proofScore}
              </div>
            </div>
          </div>
        </div>
        
        <div className="relative">
          <p className="text-sm text-muted-foreground mb-6 italic leading-relaxed">"{testimonial.quote}"</p>
          
          <div className="flex items-center justify-between pt-4 border-t border-border/50">
            <div className="flex space-x-1">
              {[...Array(testimonial.rating)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.3, delay: delay + 0.1 * i }}
                >
                  <Star className="w-4 h-4 fill-blue-500 text-blue-500" />
                </motion.div>
              ))}
            </div>
            <div className="text-right">
              <div className="text-lg font-bold bg-gradient-to-r from-blue-500 to-green-500 bg-clip-text text-transparent">
                {testimonial.result}
              </div>
              <div className="text-xs text-muted-foreground">improvement</div>
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}