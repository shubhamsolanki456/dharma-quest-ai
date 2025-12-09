import { ReactNode, useEffect } from 'react';
import { BottomNavigation } from './BottomNavigation';

interface MobileLayoutProps {
  children: ReactNode;
  currentPage: string;
}

export const MobileLayout = ({ children, currentPage }: MobileLayoutProps) => {
  // Preload streak card background
  useEffect(() => {
    const img = new Image();
    img.src = '/assets/streak-card-bg.jpg';
  }, []);

  return (
    <div className="min-h-screen bg-background preload-streak-bg">
      <div className="max-w-sm mx-auto h-screen bg-background flex flex-col overflow-hidden">
        <main className="mobile-scroll-container flex-1 overflow-y-auto pb-28 safe-top safe-bottom">
          {children}
        </main>
        <BottomNavigation currentPage={currentPage} />
      </div>
    </div>
  );
};
