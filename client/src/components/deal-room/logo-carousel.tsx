import { motion } from "framer-motion";
import { useEffect, useState } from "react";

interface Company {
  name: string;
  logo: string;
}

interface LogoCarouselProps {
  companies: Company[];
  autoScrollSpeed?: number;
}

export function LogoCarousel({ companies, autoScrollSpeed = 3000 }: LogoCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  
  // Check if mobile on mount
  useEffect(() => {
    setIsMobile(window.innerWidth < 768);
    
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => {
        const nextIndex = prev + 1;
        // Reset to beginning when we reach the end of original array
        if (nextIndex >= companies.length) {
          return 0;
        }
        return nextIndex;
      });
    }, autoScrollSpeed);

    return () => clearInterval(interval);
  }, [companies.length, autoScrollSpeed]);

  // Calculate visible companies (show 4 on desktop, 2 on mobile)
  const getVisibleCompanies = () => {
    const visibleCount = isMobile ? 2 : 4;
    const result = [];
    
    for (let i = 0; i < visibleCount; i++) {
      const index = (currentIndex + i) % companies.length;
      result.push(companies[index]);
    }
    
    return result;
  };

  const visibleCompanies = getVisibleCompanies();

  return (
    <div className="relative overflow-hidden">
      <motion.div 
        className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto"
        key={currentIndex}
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, ease: "easeInOut" }}
      >
        {visibleCompanies.map((company, index) => (
          <motion.div
            key={`${currentIndex}-${index}`}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: index * 0.1 }}
            whileHover={{ scale: 1.05 }}
            className="relative group"
          >
            <div className="bg-gradient-to-r from-gray-800/30 to-gray-900/50 border border-gray-700/50 rounded-lg p-6 backdrop-blur-sm hover:border-gray-600/70 transition-all duration-300">
              <div className="absolute inset-0 bg-gradient-to-br from-gray-700/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg" />
              
              <div className="relative flex items-center justify-center h-16">
                <img
                  src={company.logo}
                  alt={`${company.name} logo`}
                  className="max-h-full max-w-full object-contain filter brightness-90 group-hover:brightness-100 transition-all duration-300"
                  style={{ aspectRatio: '16/9' }}
                />
              </div>
              
              <div className="mt-3 text-center">
                <div className="text-sm font-medium text-gray-300 group-hover:text-white transition-colors duration-300">
                  {company.name}
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Progress indicators */}
      <div className="flex justify-center mt-6 space-x-2">
        {companies.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              index === currentIndex
                ? "bg-primary-gold shadow-lg shadow-primary-gold/50"
                : "bg-gray-600 hover:bg-gray-500"
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}