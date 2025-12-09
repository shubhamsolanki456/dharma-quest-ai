import { useState, useEffect, useRef } from 'react';
import { MobileLayout } from '@/components/MobileLayout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Brain, Play, Pause, RotateCcw, Wind, Waves, Sparkles, Moon, Sun, TreeDeciduous } from 'lucide-react';

const meditationTypes = [
  { id: 'breathing', name: 'Pranayama', icon: Wind, description: 'Breath control meditation', color: 'text-saffron' },
  { id: 'mindfulness', name: 'Mindfulness', icon: Brain, description: 'Present moment awareness', color: 'text-lotus' },
  { id: 'mantra', name: 'Mantra', icon: Sparkles, description: 'Om chanting meditation', color: 'text-dharma' },
  { id: 'visualization', name: 'Visualization', icon: Moon, description: 'Inner light meditation', color: 'text-spiritual' },
];

const durations = [
  { minutes: 5, label: '5 min' },
  { minutes: 10, label: '10 min' },
  { minutes: 15, label: '15 min' },
  { minutes: 20, label: '20 min' },
  { minutes: 30, label: '30 min' },
];

const breathingPatterns = [
  { name: 'Box Breathing', inhale: 4, hold1: 4, exhale: 4, hold2: 4 },
  { name: 'Relaxing Breath', inhale: 4, hold1: 7, exhale: 8, hold2: 0 },
  { name: 'Energizing Breath', inhale: 4, hold1: 0, exhale: 4, hold2: 0 },
];

export default function Meditation() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [selectedType, setSelectedType] = useState(meditationTypes[0]);
  const [selectedDuration, setSelectedDuration] = useState(durations[1]);
  const [selectedPattern, setSelectedPattern] = useState(breathingPatterns[0]);
  const [isActive, setIsActive] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [breathPhase, setBreathPhase] = useState<'inhale' | 'hold1' | 'exhale' | 'hold2'>('inhale');
  const [breathCount, setBreathCount] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const breathIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (breathIntervalRef.current) clearInterval(breathIntervalRef.current);
    };
  }, []);

  const startMeditation = () => {
    setTimeRemaining(selectedDuration.minutes * 60);
    setIsActive(true);
    setBreathCount(0);
    setBreathPhase('inhale');
    
    intervalRef.current = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          endMeditation();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    if (selectedType.id === 'breathing') {
      startBreathingCycle();
    }
  };

  const startBreathingCycle = () => {
    const pattern = selectedPattern;
    let phase: 'inhale' | 'hold1' | 'exhale' | 'hold2' = 'inhale';
    let countdown = pattern.inhale;

    breathIntervalRef.current = setInterval(() => {
      countdown--;
      if (countdown <= 0) {
        if (phase === 'inhale') {
          phase = 'hold1';
          countdown = pattern.hold1 || 0;
          if (countdown === 0) { phase = 'exhale'; countdown = pattern.exhale; }
        } else if (phase === 'hold1') {
          phase = 'exhale';
          countdown = pattern.exhale;
        } else if (phase === 'exhale') {
          phase = 'hold2';
          countdown = pattern.hold2 || 0;
          if (countdown === 0) { 
            phase = 'inhale'; 
            countdown = pattern.inhale;
            setBreathCount(c => c + 1);
          }
        } else if (phase === 'hold2') {
          phase = 'inhale';
          countdown = pattern.inhale;
          setBreathCount(c => c + 1);
        }
        setBreathPhase(phase);
      }
    }, 1000);
  };

  const pauseMeditation = () => {
    setIsActive(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (breathIntervalRef.current) clearInterval(breathIntervalRef.current);
  };

  const resumeMeditation = () => {
    setIsActive(true);
    intervalRef.current = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          endMeditation();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    if (selectedType.id === 'breathing') startBreathingCycle();
  };

  const endMeditation = async () => {
    setIsActive(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (breathIntervalRef.current) clearInterval(breathIntervalRef.current);

    if (user) {
      const duration = selectedDuration.minutes * 60 - timeRemaining;
      await supabase.from('meditation_sessions').insert({
        user_id: user.id,
        duration_seconds: duration,
        meditation_type: selectedType.id,
        completed: timeRemaining === 0,
      });
    }

    toast({ title: 'Meditation complete 🧘', description: 'Namaste. May peace be with you.' });
    setTimeRemaining(0);
  };

  const resetMeditation = () => {
    pauseMeditation();
    setTimeRemaining(0);
    setBreathCount(0);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getBreathInstruction = () => {
    switch (breathPhase) {
      case 'inhale': return 'Breathe In...';
      case 'hold1': return 'Hold...';
      case 'exhale': return 'Breathe Out...';
      case 'hold2': return 'Hold...';
    }
  };

  return (
    <MobileLayout currentPage="/meditation">
      <div className="p-4 space-y-6">
        <div className="flex items-center gap-3">
          <Brain className="h-6 w-6 text-lotus" />
          <h1 className="text-xl font-display">Meditation</h1>
        </div>

        {timeRemaining === 0 ? (
          <>
            {/* Meditation Type Selection */}
            <div className="space-y-3">
              <h3 className="text-sm text-muted-foreground">Choose Practice</h3>
              <div className="grid grid-cols-2 gap-3">
                {meditationTypes.map((type) => (
                  <button
                    key={type.id}
                    onClick={() => setSelectedType(type)}
                    className={`p-4 rounded-xl text-left transition-all ${
                      selectedType.id === type.id
                        ? 'bg-saffron/20 border-2 border-saffron'
                        : 'card-3d-subtle'
                    }`}
                  >
                    <type.icon className={`h-6 w-6 ${type.color} mb-2`} />
                    <div className="font-medium text-sm">{type.name}</div>
                    <div className="text-xs text-muted-foreground">{type.description}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Duration Selection */}
            <div className="space-y-3">
              <h3 className="text-sm text-muted-foreground">Duration</h3>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {durations.map((dur) => (
                  <button
                    key={dur.minutes}
                    onClick={() => setSelectedDuration(dur)}
                    className={`px-4 py-2 rounded-full text-sm flex-shrink-0 transition-all ${
                      selectedDuration.minutes === dur.minutes
                        ? 'bg-saffron text-background'
                        : 'bg-muted hover:bg-muted/80'
                    }`}
                  >
                    {dur.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Breathing Pattern (for pranayama) */}
            {selectedType.id === 'breathing' && (
              <div className="space-y-3">
                <h3 className="text-sm text-muted-foreground">Breathing Pattern</h3>
                <div className="space-y-2">
                  {breathingPatterns.map((pattern) => (
                    <button
                      key={pattern.name}
                      onClick={() => setSelectedPattern(pattern)}
                      className={`w-full p-3 rounded-xl text-left transition-all ${
                        selectedPattern.name === pattern.name
                          ? 'bg-spiritual-blue/30 border-2 border-spiritual'
                          : 'bg-muted hover:bg-muted/80'
                      }`}
                    >
                      <div className="font-medium text-sm">{pattern.name}</div>
                      <div className="text-xs text-muted-foreground">
                        Inhale {pattern.inhale}s {pattern.hold1 ? `• Hold ${pattern.hold1}s ` : ''}
                        • Exhale {pattern.exhale}s {pattern.hold2 ? `• Hold ${pattern.hold2}s` : ''}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <Button variant="saffron" className="w-full h-14 text-lg" onClick={startMeditation}>
              <Play className="h-5 w-5 mr-2" /> Begin Meditation
            </Button>
          </>
        ) : (
          /* Active Meditation Session */
          <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-8">
            {/* Timer Circle */}
            <div className="relative w-64 h-64">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50" cy="50" r="45"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="text-muted"
                />
                <circle
                  cx="50" cy="50" r="45"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="4"
                  strokeLinecap="round"
                  className="text-saffron transition-all duration-1000"
                  strokeDasharray={`${(timeRemaining / (selectedDuration.minutes * 60)) * 283} 283`}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-5xl font-display">{formatTime(timeRemaining)}</span>
                {selectedType.id === 'breathing' && (
                  <span className="text-lg text-saffron mt-2 animate-pulse">{getBreathInstruction()}</span>
                )}
              </div>
            </div>

            {/* Breath Counter */}
            {selectedType.id === 'breathing' && (
              <div className="text-center">
                <span className="text-2xl font-display text-dharma">{breathCount}</span>
                <span className="text-muted-foreground ml-2">breaths</span>
              </div>
            )}

            {/* Controls */}
            <div className="flex gap-4">
              <Button variant="outline" size="icon" className="h-14 w-14" onClick={resetMeditation}>
                <RotateCcw className="h-6 w-6" />
              </Button>
              <Button
                variant="saffron"
                size="icon"
                className="h-14 w-14"
                onClick={isActive ? pauseMeditation : resumeMeditation}
              >
                {isActive ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
              </Button>
              <Button variant="destructive" className="h-14 px-6" onClick={endMeditation}>
                End
              </Button>
            </div>
          </div>
        )}
      </div>
    </MobileLayout>
  );
}
