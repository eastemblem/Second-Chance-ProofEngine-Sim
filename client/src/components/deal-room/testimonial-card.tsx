import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Star } from "lucide-react";

interface TestimonialData {
  name: string;
  title: string;
  company: string;
  proofScore: number;
  quote: string;
  rating: number;
  result: string;
  avatar: string;
}

interface TestimonialCardProps {
  testimonial: TestimonialData;
  delay?: number;
}

export function TestimonialCard({ testimonial, delay = 0 }: TestimonialCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay }}
      whileHover={{ y: -5, scale: 1.02 }}
      className="h-full"
    >
      <Card className="p-6 bg-card border-border h-full hover:bg-card/80 transition-all duration-300">
        <div className="flex items-start space-x-4 mb-4">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary-gold flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
            {testimonial.avatar}
          </div>
          <div className="text-left">
            <h4 className="font-semibold text-foreground text-lg">{testimonial.name}</h4>
            <p className="text-sm text-muted-foreground">{testimonial.title}</p>
            <p className="text-sm text-primary font-medium">ProofScore: {testimonial.proofScore}</p>
          </div>
        </div>
        
        <p className="text-sm text-muted-foreground mb-4 italic">{testimonial.quote}</p>
        
        <div className="flex items-center justify-between pt-4 border-t border-border">
          <div className="flex">
            {[...Array(testimonial.rating)].map((_, i) => (
              <Star key={i} className="w-4 h-4 fill-primary-gold text-primary-gold" />
            ))}
          </div>
          <div className="text-sm font-semibold text-primary">{testimonial.result}</div>
        </div>
      </Card>
    </motion.div>
  );
}