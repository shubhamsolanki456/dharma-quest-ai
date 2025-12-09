import { Star } from 'lucide-react';

interface StreakCard3DProps {
  appStreak: number;
  sinFreeStreak: number;
}

export const StreakCard3D = ({ appStreak, sinFreeStreak }: StreakCard3DProps) => {
  const totalDedication = Math.min(Math.floor((appStreak + sinFreeStreak) / 4), 5);
  
  return (
    <div className="rounded-2xl overflow-hidden relative shadow-[0_8px_30px_rgba(0,0,0,0.5)] min-h-[180px]">
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
            <div className="flex gap-0.5">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star 
                  key={star} 
                  className={`h-4 w-4 ${star <= totalDedication ? 'text-yellow-400 fill-yellow-400' : 'text-white/40 fill-white/20'}`}
                />
              ))}
            </div>
          </div>
        </div>
        
        {/* Motivational quote */}
        <div className="flex items-center justify-center pt-3 border-t border-white/20">
          <span className="text-white/80 text-sm font-sans italic text-center">"Your daily sadhana shapes your destiny"</span>
        </div>
      </div>
    </div>
  );
};
