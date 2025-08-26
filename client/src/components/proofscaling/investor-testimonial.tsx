import { Card } from "@/components/ui/card";
import { Star, Quote } from "lucide-react";

interface InvestorTestimonialProps {
  quote: string;
  name: string;
  title: string;
  company: string;
  avatar?: string;
  rating?: number;
}

export function InvestorTestimonial({ 
  quote, 
  name, 
  title, 
  company, 
  avatar,
  rating = 5 
}: InvestorTestimonialProps) {
  return (
    <Card className="p-6 bg-gradient-to-br from-gray-900/50 to-gray-800/50 border-gray-700 hover:border-purple-500/50 transition-colors">
      <div className="flex items-start gap-4">
        <Quote className="w-8 h-8 text-purple-400 shrink-0 mt-1" />
        
        <div className="flex-1">
          <p className="text-gray-300 mb-4 leading-relaxed italic">"{quote}"</p>
          
          <div className="flex items-center gap-2 mb-2">
            {[...Array(rating)].map((_, i) => (
              <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
            ))}
          </div>
          
          <div className="flex items-center gap-3">
            {avatar ? (
              <img 
                src={avatar} 
                alt={name}
                className="w-10 h-10 rounded-full"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-blue-600 flex items-center justify-center text-white font-bold">
                {name.charAt(0)}
              </div>
            )}
            
            <div>
              <div className="text-white font-medium">{name}</div>
              <div className="text-gray-400 text-sm">{title} at {company}</div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}