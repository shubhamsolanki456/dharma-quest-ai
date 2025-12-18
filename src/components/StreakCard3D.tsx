import { useNavigate } from 'react-router-dom';
import { Star } from 'lucide-react';
import { useHaptics } from '@/hooks/useHaptics';
import { OmIconNew } from '@/components/icons';

interface StreakCard3DProps {
  appStreak: number;
  sinFreeStreak: number;
}

export const StreakCard3D = ({ appStreak, sinFreeStreak }: StreakCard3DProps) => {
  const navigate = useNavigate();
  const { triggerHaptic } = useHaptics();
  
  // Calculate dedication: 1 star per 7 days of APP STREAK ONLY (max 5)
  const totalDedication = Math.min(Math.floor(appStreak / 7), 5);
  // If no streaks yet, show at least indication of progress towards first star
  const showProgress = appStreak > 0 && totalDedication === 0;
  
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
            <OmIconNew className="w-7 h-7" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-display text-white drop-shadow-md">Spiritual Journey</h3>
            <p className="text-white/90 text-sm font-sans drop-shadow-sm">Keep the sacred flame alive.</p>
          </div>
        </div>
        
        {/* Dedication Stars */}
        <div className="flex items-center gap-1.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star 
              key={i} 
              className={`w-5 h-5 transition-all duration-300 ${
                i < totalDedication 
                  ? 'text-yellow-400 fill-yellow-400 drop-shadow-[0_0_6px_rgba(250,204,21,0.8)]' 
                  : showProgress && i === 0 
                    ? 'text-yellow-400/50 fill-yellow-400/30' 
                    : 'text-white/30 fill-white/10'
              }`}
            />
          ))}
          <span className="ml-2 text-white/80 text-sm font-sans">
            {totalDedication > 0 
              ? `${totalDedication}/5 Dedication`
              : showProgress 
                ? `${appStreak}/7 days to first star`
                : 'Start your journey'
            }
          </span>
        </div>
        
        {/* Streak Stats Row */}
        <div className="flex gap-4 pt-2">
          <div className="flex-1 bg-black/30 backdrop-blur-sm rounded-xl p-3 border border-white/10">
            <p className="text-white/70 text-xs font-sans mb-1">App Streak</p>
            <p className="text-2xl font-display text-white">{appStreak} <span className="text-base text-white/70">days</span></p>
          </div>
          <div className="flex-1 bg-black/30 backdrop-blur-sm rounded-xl p-3 border border-white/10">
            <p className="text-white/70 text-xs font-sans mb-1">Sin-Free Journey</p>
            <p className="text-2xl font-display text-white">{sinFreeStreak} <span className="text-base text-white/70">days</span></p>
          </div>
        </div>
        
        {/* Tap to manage */}
        <p className="text-center text-white/50 text-xs mt-2">Tap to manage your journey</p>
      </div>
    </div>
  );
};
