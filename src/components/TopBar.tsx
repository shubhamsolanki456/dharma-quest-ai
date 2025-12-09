import { Star, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useProfile } from '@/hooks/useProfile';

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
  const [floatingDPs, setFloatingDPs] = useState<FloatingDP[]>([]);
  const [displayedDP, setDisplayedDP] = useState(0);
  const [targetContainerRef, setTargetContainerRef] = useState<DOMRect | null>(null);

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

  const triggerFloatingDP = useCallback((points: number, sourceX: number, sourceY: number) => {
    const id = `dp-${Date.now()}-${Math.random()}`;
    setFloatingDPs(prev => [...prev, { id, points, x: sourceX, y: sourceY }]);
    
    // Remove after animation and increment displayed DP
    setTimeout(() => {
      setFloatingDPs(prev => prev.filter(dp => dp.id !== id));
      setDisplayedDP(prev => prev + points);
    }, 1000);
  }, []);

  return (
    <DPContext.Provider value={{ triggerFloatingDP, displayedDP }}>
      {/* Top Bar */}
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