import { Star, Award, TrendingUp } from 'lucide-react';
import { DharmaCard } from './DharmaCard';
import { Progress } from './ui/progress';

interface DharmaProgressProps {
  level: number;
  dharmaPoints: number;
  pointsToNext: number;
  title: string;
}

export const DharmaProgress = ({ level, dharmaPoints, pointsToNext, title }: DharmaProgressProps) => {
  const progress = (dharmaPoints / (dharmaPoints + pointsToNext)) * 100;

  return (
    <DharmaCard className="p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-dharma/10 rounded-lg">
            <Award className="h-5 w-5 text-dharma" />
          </div>
          <div>
            <h3 className="font-display text-card-foreground">{title}</h3>
            <p className="text-sm text-muted-foreground">Level {level}</p>
          </div>
        </div>
        <div className="flex items-center gap-1 text-dharma">
          <Star className="h-4 w-4 fill-current" />
          <span className="font-bold">{dharmaPoints}</span>
        </div>
      </div>
      
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Progress to Level {level + 1}</span>
          <span className="text-card-foreground font-display">{pointsToNext} DP needed</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>
    </DharmaCard>
  );
};