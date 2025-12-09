import { Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useHaptics } from '@/hooks/useHaptics';

interface StreakCard3DProps {
  appStreak: number;
  sinFreeStreak: number;
}

export const StreakCard3D = ({ appStreak, sinFreeStreak }: StreakCard3DProps) => {
  const navigate = useNavigate();
  const { triggerHaptic } = useHaptics();
  
  // Calculate dedication: 1 star per 7 days of combined streaks (max 5)
  const totalDays = appStreak + sinFreeStreak;
  const totalDedication = Math.min(Math.floor(totalDays / 7), 5);
  // If no streaks yet, show at least indication of progress towards first star
  const showProgress = totalDays > 0 && totalDedication === 0;
  
  const handleClick = () => {
    triggerHaptic('medium');
    navigate('/sin-log');
  };
  
  return (
    <div 
      className="rounded-2xl overflow-hidden relative shadow-[0_8px_30px_rgba(0,0,0,0.5)] min-h-[180px] cursor-pointer active:scale-[0.98] transition-transform"
      onClick={handleClick}
    >
      {/* Background image with inline style for reliability */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ 
          backgroundImage: `url('/assets/streak-card-bg.jpg')`,
          backgroundColor: '#1a1a2e'
        }}
      />
      {/* Dark overlay for readability */}
      <div className="absolute inset-0 bg-gradient-to-br from-black/50 via-black/40 to-black/60" />
      
      <div className="relative p-5 space-y-4">
        {/* Header with icon thumbnail */}
        <div className="flex items-start gap-3">
          <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-amber-300 via-orange-400 to-orange-500 flex items-center justify-center shadow-md border-2 border-white/30">
            <span className="text-2xl">🕉️</span>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-display text-white drop-shadow-md">Spiritual Journey</h3>
            <p className="text-white/90 text-sm font-sans drop-shadow-sm">Keep the sacred flame alive.</p>
          </div>
        </div>
        
        {/* Stats rows */}
        <div className="space-y-2">
          {/* App Streak row */}
          <div className="flex items-baseline gap-3">
            <span className="text-white/80 text-sm w-20 font-display">App Streak</span>
            <span className="text-white font-bold font-sans">{appStreak} {appStreak === 1 ? 'day' : 'days'}</span>
          </div>
          
          {/* Sin-Free Streak row */}
          <div className="flex items-baseline gap-3">
            <span className="text-white/80 text-sm w-20 font-display">Sin-Free</span>
            <span className="text-white font-bold font-sans">{sinFreeStreak} {sinFreeStreak === 1 ? 'day' : 'days'}</span>
          </div>
          
          {/* Dedication row with stars */}
          <div className="flex items-center gap-4">
            <span className="text-white/80 text-sm w-20 font-display">Dedication</span>
            <div className="flex gap-0.5 items-center">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star 
                  key={star} 
                  className={`h-4 w-4 transition-all ${
                    star <= totalDedication 
                      ? 'text-yellow-400 fill-yellow-400 drop-shadow-[0_0_4px_rgba(250,204,21,0.5)]' 
                      : 'text-white/40 fill-white/10'
                  }`}
                />
              ))}
              {showProgress && (
                <span className="text-white/60 text-xs ml-2">({totalDays}/7 days)</span>
              )}
            </div>
          </div>
        </div>
        
        {/* Motivational quote */}
        <div className="flex items-center justify-center pt-3 border-t border-white/20">
          <span className="text-white/80 text-sm font-sans italic text-center">"Tap to manage your sin-free journey"</span>
        </div>
      </div>
    </div>
  );
};
