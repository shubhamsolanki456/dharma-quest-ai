import { useEffect } from 'react';
import confetti from 'canvas-confetti';

interface ConfettiProps {
  duration?: number;
  particleCount?: number;
}

export const Confetti = ({ duration = 5000, particleCount = 100 }: ConfettiProps) => {
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const timer = setTimeout(() => {
        // Left side burst
        confetti({
          particleCount: 125,
          angle: 60,
          spread: 85,
          startVelocity: 75,
          origin: { x: 0, y: 1 },
          colors: ['#FF0000', '#00FF00', '#0000FF', '#FFFF00'],
        });

        // Right side burst
        confetti({
          particleCount: 75,
          angle: 120,
          spread: 85,
          startVelocity: 75,
          origin: { x: 1, y: 1 },
          colors: ['#FF0000', '#00FF00', '#0000FF', '#FFFF00'],
        });
      }, 1500);

      return () => clearTimeout(timer);
    }
  }, []);

  // This component doesn't render anything - confetti is drawn on canvas
  return null;
};

export default Confetti;
