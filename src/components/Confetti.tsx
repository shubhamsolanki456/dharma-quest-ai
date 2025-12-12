import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface ConfettiParticle {
  id: number;
  x: number;
  delay: number;
  duration: number;
  color: string;
  size: number;
  rotation: number;
  swingAmplitude: number;
}

interface ConfettiProps {
  duration?: number;
  particleCount?: number;
}

export const Confetti = ({ duration = 5000, particleCount = 80 }: ConfettiProps) => {
  const [particles, setParticles] = useState<ConfettiParticle[]>([]);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const colors = [
      '#FF6B35', '#FFB347', '#FFD700', '#FF8C00', '#FFA500', 
      '#E65100', '#FF5722', '#4CAF50', '#2196F3', '#9C27B0',
      '#FF4081', '#00BCD4', '#FFEB3B', '#8BC34A'
    ];
    
    const newParticles = Array.from({ length: particleCount }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      delay: Math.random() * 1.5,
      duration: 2.5 + Math.random() * 2.5,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: 6 + Math.random() * 8,
      rotation: Math.random() * 360,
      swingAmplitude: 20 + Math.random() * 40,
    }));
    
    setParticles(newParticles);

    const timer = setTimeout(() => setIsVisible(false), duration);
    return () => clearTimeout(timer);
  }, [duration, particleCount]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-[100]">
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute"
          style={{
            left: `${particle.x}%`,
            width: particle.size,
            height: particle.size * 0.6,
            backgroundColor: particle.color,
            borderRadius: '2px',
            top: '-20px',
          }}
          initial={{ 
            y: -20, 
            rotate: particle.rotation, 
            opacity: 1,
            x: 0 
          }}
          animate={{
            y: window.innerHeight + 100,
            rotate: particle.rotation + 720 * (Math.random() > 0.5 ? 1 : -1),
            opacity: [1, 1, 1, 0.8, 0],
            x: [0, particle.swingAmplitude, -particle.swingAmplitude, particle.swingAmplitude / 2, 0],
          }}
          transition={{
            duration: particle.duration,
            delay: particle.delay,
            ease: [0.25, 0.46, 0.45, 0.94],
            x: {
              duration: particle.duration,
              delay: particle.delay,
              ease: "easeInOut",
              times: [0, 0.25, 0.5, 0.75, 1]
            }
          }}
        />
      ))}
    </div>
  );
};

export default Confetti;
