import { Flame, Calendar } from 'lucide-react';
import { DharmaCard } from './DharmaCard';

interface StreakCounterProps {
  type: 'app' | 'sin-free';
  count: number;
  title: string;
  subtitle: string;
}

export const StreakCounter = ({ type, count, title, subtitle }: StreakCounterProps) => {
  const isAppStreak = type === 'app';
  const gradient = isAppStreak ? 'saffron' : 'spiritual';
  const icon = isAppStreak ? Calendar : Flame;
  const Icon = icon;

  return (
    <DharmaCard gradient={gradient} glow className="p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-black/10 rounded-lg">
            <Icon className="h-6 w-6 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-white">{title}</h3>
            <p className="text-sm text-white/80">{subtitle}</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-white">{count}</div>
          <div className="text-xs text-white/80">days</div>
        </div>
      </div>
    </DharmaCard>
  );
};