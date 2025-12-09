import { Home, Target, User, BookOpen } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { memo, useCallback } from 'react';

interface BottomNavigationProps {
  currentPage?: string;
}

const navItems = [
  { icon: Home, label: 'Home', path: '/dashboard' },
  { icon: BookOpen, label: 'Shlok', path: '/daily-shlok' },
  { icon: Target, label: 'Habits', path: '/quests' },
  { icon: User, label: 'Profile', path: '/profile' },
];

export const BottomNavigation = memo(({ currentPage }: BottomNavigationProps) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleNavigate = useCallback((path: string) => {
    navigate(path);
  }, [navigate]);

  return (
    <div className="fixed bottom-0 left-0 right-0 max-w-sm mx-auto bg-card safe-bottom z-50">
      <div className="flex items-center justify-around px-2 py-2">
        {navItems.map(({ icon: Icon, label, path }) => {
          const isActive = location.pathname === path;
          return (
            <button
              key={path}
              onClick={() => handleNavigate(path)}
              className={`flex flex-col items-center gap-1 h-auto py-2 px-3 transition-all rounded-lg ${
                isActive 
                  ? 'text-saffron bg-saffron/10' 
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }`}
            >
              <Icon className={`h-5 w-5 ${isActive ? 'text-saffron' : ''}`} />
              <span className="text-xs font-medium">{label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
});

BottomNavigation.displayName = 'BottomNavigation';
