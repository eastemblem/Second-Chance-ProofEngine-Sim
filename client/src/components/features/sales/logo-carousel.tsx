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

export function LogoCarousel({ companies, autoScrollSpeed = 4000 }: LogoCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % companies.length);
    }, autoScrollSpeed);

    return () => clearInterval(interval);
  }, [companies.length, autoScrollSpeed]);

  // Function to get appropriate height for each logo
  const getLogoHeight = (companyName: string) => {
    const heights = {
      "Plug and Play Tech Centre": "h-16", // Large
      "Founders Live": "h-12", // Medium  
      "500Global": "h-14", // Large rectangular
      "East Emblem": "h-10" // Smaller circular
    };
    return heights[companyName as keyof typeof heights] || "h-12";
  };

  return (
    <div className="relative w-full h-20 flex items-center justify-center overflow-hidden">
      {/* Carousel container */}
      <div className="flex items-center justify-center w-full">
        {companies.map((company, index) => {
          const offset = index - currentIndex;
          const isActive = index === currentIndex;
          
          return (
            <motion.div
              key={company.name}
              className="absolute flex items-center justify-center"
              initial={{ opacity: 0, x: 100 }}
              animate={{
                opacity: isActive ? 1 : 0.3,
                x: offset * 200,
                scale: isActive ? 1 : 0.8,
              }}
              transition={{
                duration: 0.8,
                ease: "easeInOut",
              }}
              style={{
                zIndex: isActive ? 10 : 1,
              }}
            >
              <img
                src={company.logo}
                alt={company.name}
                className={`${getLogoHeight(company.name)} object-contain transition-all duration-300`}
              />
            </motion.div>
          );
        })}
      </div>

      {/* Dots indicator */}
      <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 flex space-x-2">
        {companies.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              index === currentIndex
                ? "bg-primary-gold"
                : "bg-gray-400 hover:bg-gray-300"
            }`}
          />
        ))}
      </div>
    </div>
  );
}