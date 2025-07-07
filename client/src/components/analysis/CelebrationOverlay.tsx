import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Particle {
  id: number;
  x: number;
  y: number;
  color: string;
  size: number;
  velocity: { x: number; y: number };
}

interface CelebrationOverlayProps {
  show: boolean;
  onComplete?: () => void;
}

export const CelebrationOverlay = ({ show, onComplete }: CelebrationOverlayProps) => {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    if (!show) return;

    // Create initial particles
    const newParticles: Particle[] = [];
    for (let i = 0; i < 50; i++) {
      newParticles.push({
        id: i,
        x: Math.random() * window.innerWidth,
        y: window.innerHeight + 10,
        color: ["#8B5CF6", "#F59E0B", "#10B981", "#F472B6", "#06B6D4"][Math.floor(Math.random() * 5)],
        size: Math.random() * 8 + 4,
        velocity: {
          x: (Math.random() - 0.5) * 4,
          y: -(Math.random() * 8 + 8)
        }
      });
    }
    setParticles(newParticles);

    // Animation loop
    const animateParticles = () => {
      setParticles(prev => prev.map(particle => ({
        ...particle,
        x: particle.x + particle.velocity.x,
        y: particle.y + particle.velocity.y,
        velocity: {
          ...particle.velocity,
          y: particle.velocity.y + 0.3 // gravity
        }
      })).filter(particle => particle.y < window.innerHeight + 100));
    };

    const interval = setInterval(animateParticles, 16);

    // Auto-complete after animation
    const timeout = setTimeout(() => {
      onComplete?.();
    }, 3000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [show, onComplete]);

  if (!show) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 pointer-events-none z-50"
      >
        {particles.map(particle => (
          <motion.div
            key={particle.id}
            className="absolute rounded-full"
            style={{
              left: particle.x,
              top: particle.y,
              width: particle.size,
              height: particle.size,
              backgroundColor: particle.color,
            }}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.3 }}
          />
        ))}
      </motion.div>
    </AnimatePresence>
  );
};