import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Crown, Sparkles, Star } from 'lucide-react';

interface LevelUpCelebrationProps {
  isOpen: boolean;
  onClose: () => void;
  newLevel: number;
}

export const LevelUpCelebration = ({ isOpen, onClose, newLevel }: LevelUpCelebrationProps) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: 180 }}
            transition={{ type: 'spring', damping: 15, stiffness: 150 }}
            className="relative bg-gradient-to-br from-saffron/20 via-background to-dharma/20 rounded-3xl p-8 max-w-sm mx-4 text-center border border-saffron/30 shadow-2xl"
          >
            {/* Floating particles */}
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 0, x: 0 }}
                animate={{
                  opacity: [0, 1, 0],
                  y: [-20, -60],
                  x: [0, (i % 2 === 0 ? 1 : -1) * 30],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  delay: i * 0.3,
                }}
                className="absolute top-1/4"
                style={{ left: `${20 + i * 12}%` }}
              >
                <Sparkles className="h-4 w-4 text-saffron" />
              </motion.div>
            ))}

            {/* Crown icon */}
            <motion.div
              initial={{ y: -20 }}
              animate={{ y: 0 }}
              transition={{ type: 'spring', delay: 0.2 }}
              className="mb-4"
            >
              <div className="mx-auto w-20 h-20 rounded-full bg-gradient-saffron flex items-center justify-center shadow-lg">
                <Crown className="h-10 w-10 text-white" />
              </div>
            </motion.div>

            {/* Level up text */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <h2 className="text-2xl font-display text-foreground mb-2">Level Up!</h2>
              <p className="text-muted-foreground mb-4">
                You've reached a new milestone
              </p>
            </motion.div>

            {/* Level display */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', delay: 0.5, stiffness: 200 }}
              className="mb-6"
            >
              <div className="flex items-center justify-center gap-2">
                <Star className="h-6 w-6 text-saffron fill-saffron" />
                <span className="text-5xl font-bold text-gradient-saffron">
                  {newLevel}
                </span>
                <Star className="h-6 w-6 text-saffron fill-saffron" />
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Dharma Level
              </p>
            </motion.div>

            {/* Encouragement */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="text-sm text-muted-foreground mb-6"
            >
              Keep walking the path of dharma! 🙏
            </motion.p>

            {/* Close button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
            >
              <Button
                onClick={onClose}
                variant="saffron"
                className="w-full"
              >
                Continue Journey
              </Button>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
