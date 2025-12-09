import { CheckCircle, Circle, Star } from 'lucide-react';
import { DharmaCard } from './DharmaCard';
import { Button } from './ui/button';

interface DailyQuestProps {
  title: string;
  description: string;
  points: number;
  completed: boolean;
  onComplete: () => void;
}

export const DailyQuest = ({ title, description, points, completed, onComplete }: DailyQuestProps) => {
  const Icon = completed ? CheckCircle : Circle;

  return (
    <DharmaCard className="p-4">
      <div className="flex items-start gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={onComplete}
          disabled={completed}
          className={`h-6 w-6 p-0 ${completed ? 'text-saffron' : 'text-muted-foreground hover:text-saffron'}`}
        >
          <Icon className="h-5 w-5" />
        </Button>
        
        <div className="flex-1">
          <h4 className={`font-medium ${completed ? 'text-muted-foreground line-through' : 'text-card-foreground'}`}>
            {title}
          </h4>
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        </div>
        
        <div className="flex items-center gap-1 text-dharma">
          <Star className="h-4 w-4 fill-current" />
          <span className="text-sm font-medium">+{points}</span>
        </div>
      </div>
    </DharmaCard>
  );
};