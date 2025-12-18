import { Home, Target, User, BookOpen, MessageCircle } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { memo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useScrollHide } from '@/hooks/useScrollHide';
import { useHaptics } from '@/hooks/useHaptics';

interface BottomNavigationProps {
  currentPage?: string;
}

const navItems = [
  { icon: Home, label: 'Home', path: '/dashboard' },
  { icon: MessageCircle, label: 'Chat', path: '/ai-guide' },
  { icon: Target, label: 'Quests', path: '/quests' },
  { icon: BookOpen, label: 'Shlok', path: '/daily-shlok' },
  { icon: User, label: 'Profile', path: '/profile' },
];

export const BottomNavigation = memo(({ currentPage }: BottomNavigationProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const isVisible = useScrollHide();
  const { triggerHaptic } = useHaptics();

  const handleNavigate = useCallback((path: string) => {
    triggerHaptic('light');
    navigate(path);
  }, [navigate, triggerHaptic]);

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ y: 0 }}
        animate={{ y: isVisible ? 0 : 100 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="fixed bottom-0 inset-x-0 w-[360px] mx-auto bg-card border-t border-border safe-bottom z-50 rounded-t-2xl"
      >
        <div className="flex items-center justify-around px-1 py-2.5">
          {navItems.map(({ icon: Icon, label, path }) => {
            const isActive = location.pathname === path;
            return (
              <button
                key={path}
                onClick={() => handleNavigate(path)}
                className={`flex flex-col items-center gap-0.5 h-auto py-1.5 px-2.5 transition-all rounded-lg ${
                  isActive 
                    ? 'text-saffron bg-saffron/10' 
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }`}
              >
                <Icon className={`h-5 w-5 ${isActive ? 'text-saffron' : ''}`} />
                <span className="text-[10px] font-medium">{label}</span>
              </button>
            );
          })}
        </div>
      </motion.div>
    </AnimatePresence>
  );
});

BottomNavigation.displayName = 'BottomNavigation';
