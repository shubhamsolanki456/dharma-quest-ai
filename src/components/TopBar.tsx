import { Star, User, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useCallback, createContext, useContext, useRef } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useProfile } from '@/hooks/useProfile';
import { useSoundEffects } from '@/hooks/useSoundEffects';

interface FloatingDP {
  id: string;
  points: number;
  x: number;
  y: number;
}

interface DPContextType {
  triggerFloatingDP: (points: number, sourceX: number, sourceY: number) => void;
  displayedDP: number;
}

const DPContext = createContext<DPContextType | undefined>(undefined);

export const useDPAnimation = () => {
  const context = useContext(DPContext);
  if (!context) {
    throw new Error('useDPAnimation must be used within a TopBar');
  }
  return context;
};

interface TopBarProps {
  children?: React.ReactNode;
}

export const TopBarProvider = ({ children }: TopBarProps) => {
  const navigate = useNavigate();
  const { profile, loading } = useProfile();
  const { playDPCollect, playLevelUp } = useSoundEffects();
  const [floatingDPs, setFloatingDPs] = useState<FloatingDP[]>([]);
  const [displayedDP, setDisplayedDP] = useState(0);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [newLevel, setNewLevel] = useState(1);
  const previousLevelRef = useRef<number | null>(null);

  const level = profile?.current_level || 1;
  const totalDP = profile?.dharma_points || 0;
  const avatarUrl = profile?.avatar_url;
  const userName = profile?.full_name || 'User';

  // Sync displayedDP with actual DP
  useEffect(() => {
    if (!loading) {
      setDisplayedDP(totalDP);
    }
  }, [totalDP, loading]);

  // Detect level up
  useEffect(() => {
    if (!loading && level > 0) {
      if (previousLevelRef.current !== null && level > previousLevelRef.current) {
        setNewLevel(level);
        setShowLevelUp(true);
        playLevelUp(); // Play level up sound
        setTimeout(() => setShowLevelUp(false), 3000);
      }
      previousLevelRef.current = level;
    }
  }, [level, loading, playLevelUp]);

  const triggerFloatingDP = useCallback((points: number, sourceX: number, sourceY: number) => {
    const id = `dp-${Date.now()}-${Math.random()}`;
    setFloatingDPs(prev => [...prev, { id, points, x: sourceX, y: sourceY }]);
    playDPCollect(); // Play DP collection sound
    
    // Remove after animation and increment displayed DP
    setTimeout(() => {
      setFloatingDPs(prev => prev.filter(dp => dp.id !== id));
      setDisplayedDP(prev => prev + points);
    }, 1000);
  }, [playDPCollect]);

  return (
    <DPContext.Provider value={{ triggerFloatingDP, displayedDP }}>
      {/* Level Up Celebration */}
      <AnimatePresence>
        {showLevelUp && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center bg-background/80 backdrop-blur-sm"
            onClick={() => setShowLevelUp(false)}
          >
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ type: "spring", damping: 15, stiffness: 300 }}
              className="relative flex flex-col items-center gap-4 p-8"
            >
              {/* Sparkle particles */}
              {[...Array(12)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ 
                    opacity: [0, 1, 0],
                    scale: [0, 1, 0],
                    x: Math.cos(i * 30 * Math.PI / 180) * 100,
                    y: Math.sin(i * 30 * Math.PI / 180) * 100,
                  }}
                  transition={{ duration: 1.5, delay: i * 0.05, repeat: 1 }}
                  className="absolute"
                >
                  <Sparkles className="h-6 w-6 text-dharma" />
                </motion.div>
              ))}
              
              {/* Level badge */}
              <motion.div
                initial={{ y: 20 }}
                animate={{ y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-gradient-to-br from-dharma to-primary rounded-full p-6 shadow-2xl"
              >
                <span className="font-display text-5xl text-primary-foreground font-bold">
                  {newLevel}
                </span>
              </motion.div>
              
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-2xl font-display text-primary font-bold"
              >
                Level Up!
              </motion.p>
              
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="text-muted-foreground text-center"
              >
                You've reached Level {newLevel}!<br />
                Keep up the great work 🙏
              </motion.p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Bar */}
      <div className="sticky top-0 z-50 bg-gradient-to-r from-primary/90 via-primary to-primary/90 backdrop-blur-sm">
        <div className="flex items-center justify-between px-4 py-3 safe-top">
          {/* Level Badge */}
          <div className="flex items-center gap-2">
            <motion.div 
              key={level}
              initial={{ scale: 1 }}
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 0.3 }}
              className="bg-background/20 backdrop-blur-sm rounded-lg px-3 py-1.5"
            >
              <span className="font-display text-sm text-primary-foreground">
                Lvl. {level}
              </span>
            </motion.div>
            
            {/* DP Container */}
            <div 
              className="flex items-center gap-1.5 bg-background/20 backdrop-blur-sm rounded-lg px-3 py-1.5"
              id="dp-target-container"
            >
              <Star className="h-4 w-4 text-dharma fill-dharma" />
              <motion.span 
                key={displayedDP}
                initial={{ scale: 1.2 }}
                animate={{ scale: 1 }}
                className="font-display text-sm text-primary-foreground"
              >
                {displayedDP}
              </motion.span>
            </div>
          </div>

          {/* Avatar */}
          <button 
            onClick={() => navigate('/profile')}
            className="focus:outline-none focus:ring-2 focus:ring-ring rounded-full"
          >
            <Avatar className="h-9 w-9 border-2 border-background/30">
              <AvatarImage src={avatarUrl || undefined} alt={userName} />
              <AvatarFallback className="bg-background/30 text-primary-foreground text-sm">
                {userName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </button>
        </div>
      </div>

      {/* Floating DP Animations */}
      <AnimatePresence>
        {floatingDPs.map((dp) => (
          <motion.div
            key={dp.id}
            initial={{ 
              position: 'fixed',
              left: dp.x,
              top: dp.y,
              opacity: 1,
              scale: 1,
              zIndex: 100
            }}
            animate={{ 
              left: 120, // Target x position (DP container)
              top: 24, // Target y position (DP container)
              opacity: 0,
              scale: 0.5
            }}
            exit={{ opacity: 0 }}
            transition={{ 
              duration: 1,
              ease: [0.25, 0.1, 0.25, 1]
            }}
            className="pointer-events-none"
          >
            <div className="flex items-center gap-1 bg-dharma text-background px-2 py-1 rounded-full shadow-lg">
              <Star className="h-3 w-3 fill-current" />
              <span className="text-xs font-bold">+{dp.points}</span>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      {children}
    </DPContext.Provider>
  );
};

export const TopBar = () => {
  const navigate = useNavigate();
  const { profile, loading } = useProfile();

  const level = profile?.current_level || 1;
  const totalDP = profile?.dharma_points || 0;
  const avatarUrl = profile?.avatar_url;
  const userName = profile?.full_name || 'User';

  return (
    <div className="sticky top-0 z-50 bg-gradient-to-r from-primary/90 via-primary to-primary/90 backdrop-blur-sm">
      <div className="flex items-center justify-between px-4 py-3 safe-top">
        {/* Level Badge */}
        <div className="flex items-center gap-2">
          <div className="bg-background/20 backdrop-blur-sm rounded-lg px-3 py-1.5">
            <span className="font-display text-sm text-primary-foreground">
              Lvl. {level}
            </span>
          </div>
          
          {/* DP Container */}
          <div className="flex items-center gap-1.5 bg-background/20 backdrop-blur-sm rounded-lg px-3 py-1.5">
            <Star className="h-4 w-4 text-dharma fill-dharma" />
            <span className="font-display text-sm text-primary-foreground">
              {totalDP}
            </span>
          </div>
        </div>

        {/* Avatar */}
        <button 
          onClick={() => navigate('/profile')}
          className="focus:outline-none focus:ring-2 focus:ring-ring rounded-full"
        >
          <Avatar className="h-9 w-9 border-2 border-background/30">
            <AvatarImage src={avatarUrl || undefined} alt={userName} />
            <AvatarFallback className="bg-background/30 text-primary-foreground text-sm">
              {userName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </button>
      </div>
    </div>
  );
};