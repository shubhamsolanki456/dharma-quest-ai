import { motion } from 'framer-motion';

interface RainbowNotificationProps {
  emoji: string;
  title: string;
  subtitle: string;
}

export const RainbowNotification = ({ emoji, title, subtitle }: RainbowNotificationProps) => {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95, y: -10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: -10 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="relative rounded-2xl p-[2px] overflow-hidden"
    >
      {/* Animated rainbow border using conic gradient */}
      <div 
        className="absolute inset-0 rounded-2xl"
        style={{
          background: 'conic-gradient(from 0deg, #FF6B6B, #FF8E53, #FFCD56, #4BC0C0, #36A2EB, #9966FF, #FF6384, #FF6B6B)',
          animation: 'spin 4s linear infinite',
        }}
      />
      
      {/* Inner glow overlay */}
      <div 
        className="absolute inset-[1px] rounded-2xl opacity-50"
        style={{
          background: 'conic-gradient(from 180deg, #FF6B6B, #FF8E53, #FFCD56, #4BC0C0, #36A2EB, #9966FF, #FF6384, #FF6B6B)',
          animation: 'spin 4s linear infinite reverse',
          filter: 'blur(8px)',
        }}
      />
      
      {/* Content container */}
      <div className="relative bg-card rounded-2xl m-[2px] p-4 flex items-center gap-4">
        <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-background to-muted flex items-center justify-center">
          <span className="text-3xl">{emoji}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-display text-foreground text-base leading-tight">{title}</p>
          <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>
        </div>
      </div>
    </motion.div>
  );
};
