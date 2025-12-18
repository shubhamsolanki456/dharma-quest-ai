import { motion } from 'framer-motion';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface RainbowNotificationProps {
  emoji: string;
  title: string;
  subtitle: string;
  onDismiss?: () => void;
  isHalfway?: boolean;
}

export const RainbowNotification = ({ emoji, title, subtitle, onDismiss, isHalfway = false }: RainbowNotificationProps) => {
  // Use the exact gradient classes from reference app's ExercisePlan.tsx
  const gradientClass = isHalfway 
    ? 'bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-500'
    : 'bg-gradient-to-r from-red-400 via-pink-500 to-purple-500';

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95, y: -10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: -10 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="relative"
    >
      {/* Outer gradient border wrapper - exactly like ExercisePlan.tsx */}
      <div className={`${gradientClass} p-[2px] rounded-2xl`}>
        {/* Inner content container */}
        <div className="bg-card rounded-2xl p-4 flex items-center gap-4">
          <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-background to-muted flex items-center justify-center">
            <AlertCircle className="w-5 h-5 text-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-display text-foreground text-base leading-tight flex items-center gap-2">
              <span className="text-xl">{emoji}</span>
              {title}
            </p>
            <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>
          </div>
          {onDismiss && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onDismiss}
              className="text-xs px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20"
            >
              Got it
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  );
};
