import { motion } from 'framer-motion';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface RainbowNotificationProps {
  emoji?: string;
  title: string;
  subtitle: string;
  onDismiss?: () => void;
  isHalfway?: boolean;
}

// Exact match to ExercisePlan.tsx motivation card
export const RainbowNotification = ({ 
  emoji, 
  title, 
  subtitle, 
  onDismiss, 
  isHalfway = false 
}: RainbowNotificationProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={`relative p-[2px] rounded-lg ${
        isHalfway
          ? 'bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-500'
          : 'bg-gradient-to-r from-red-400 via-pink-500 to-purple-500'
      }`}
    >
      <div className="bg-card rounded-lg p-4">
        <div className="flex items-start">
          <div className="flex-1">
            <h3 className="font-bold text-foreground flex items-center">
              <AlertCircle className="h-5 w-5 mr-2" />
              {emoji && <span className="mr-2">{emoji}</span>}
              {title}
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              {subtitle}
            </p>
          </div>
          {onDismiss && (
            <Button
              size="sm"
              className="ml-4 bg-gradient-to-r from-purple-600 to-pink-500 text-white hover:from-purple-700 hover:to-pink-600"
              onClick={onDismiss}
            >
              Got it
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  );
};
