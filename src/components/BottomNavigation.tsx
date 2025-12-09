import { Home, MessageCircle, Target, User, BookOpen } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from './ui/button';
import { useScrollHide } from '@/hooks/useScrollHide';

interface BottomNavigationProps {
  currentPage?: string;
}

export const BottomNavigation = ({ currentPage }: BottomNavigationProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const isVisible = useScrollHide();

  const navItems = [
    { icon: Home, label: 'Home', path: '/dashboard' },
    { icon: MessageCircle, label: 'AI Guide', path: '/ai-guide' },
    { icon: Target, label: 'Quests', path: '/quests' },
    { icon: BookOpen, label: 'Shlok', path: '/daily-shlok' },
    { icon: User, label: 'Profile', path: '/profile' },
  ];

  return (
    <div 
      className={`fixed bottom-0 left-0 right-0 max-w-sm mx-auto bg-card border-t border-border safe-bottom z-50 transition-transform duration-300 ease-in-out ${
        isVisible ? 'translate-y-0' : 'translate-y-full'
      }`}
    >
      <div className="flex items-center justify-around px-2 py-2">
        {navItems.map(({ icon: Icon, label, path }) => {
          const isActive = location.pathname === path;
          return (
            <Button
              key={path}
              variant="ghost"
              size="sm"
              onClick={() => navigate(path)}
              className={`flex flex-col items-center gap-1 h-auto py-2 px-3 transition-spiritual ${
                isActive ? 'text-saffron' : 'text-muted-foreground'
              }`}
            >
              <Icon className={`h-5 w-5 ${isActive ? 'text-saffron' : ''}`} />
              <span className="text-xs font-medium">{label}</span>
            </Button>
          );
        })}
      </div>
    </div>
  );
};
