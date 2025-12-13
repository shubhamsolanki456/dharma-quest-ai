import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import { ArrowRight, ArrowLeft, CheckCircle, Flower2, Sun, Heart, BookOpen, Zap } from 'lucide-react';
import { OmIcon } from '@/components/OmIcon';

interface Question {
  id: string;
  question: string;
  options: { value: string; label: string; icon?: string }[];
  multiSelect?: boolean;
}

const spiritualQuestions: Question[] = [
  {
    id: 'goal',
    question: 'What brings you to your spiritual journey?',
    options: [
      { value: 'peace', label: 'Inner Peace & Calm', icon: '🕊️' },
      { value: 'discipline', label: 'Self-Discipline', icon: '💪' },
      { value: 'knowledge', label: 'Spiritual Knowledge', icon: '📚' },
      { value: 'habits', label: 'Build Better Habits', icon: '✨' },
    ],
  },
  {
    id: 'experience',
    question: 'How familiar are you with Hindu scriptures?',
    options: [
      { value: 'beginner', label: 'Just Starting', icon: '🌱' },
      { value: 'some', label: 'Know Some Basics', icon: '📖' },
      { value: 'familiar', label: 'Quite Familiar', icon: '🙏' },
      { value: 'advanced', label: 'Very Knowledgeable', icon: '🙏' },
    ],
  },
  {
    id: 'practice',
    question: 'What spiritual practices interest you most?',
    options: [
      { value: 'meditation', label: 'Meditation', icon: '🧘' },
      { value: 'mantra', label: 'Mantra Chanting', icon: '🔔' },
      { value: 'prayers', label: 'Daily Prayers', icon: '🙏' },
      { value: 'reading', label: 'Scripture Reading', icon: '📜' },
    ],
    multiSelect: true,
  },
  {
    id: 'time',
    question: 'When do you prefer to practice?',
    options: [
      { value: 'brahma_muhurta', label: 'Brahma Muhurta (4-6 AM)', icon: '🌅' },
      { value: 'morning', label: 'Morning (6-9 AM)', icon: '☀️' },
      { value: 'evening', label: 'Evening (5-8 PM)', icon: '🌆' },
      { value: 'night', label: 'Night (After 9 PM)', icon: '🌙' },
    ],
  },
  {
    id: 'duration',
    question: 'How much time can you dedicate daily?',
    options: [
      { value: '5', label: '5-10 Minutes', icon: '⏱️' },
      { value: '15', label: '15-30 Minutes', icon: '⏰' },
      { value: '30', label: '30-60 Minutes', icon: '🕐' },
      { value: '60', label: '1+ Hours', icon: '🕑' },
    ],
  },
];

const introSteps = [
  {
    title: "🙏 प्रणिपात",
    subtitle: "Welcome to Dharma AI",
    content: (
      <div className="text-center space-y-6">
        <div className="bg-gradient-saffron p-6 rounded-full w-fit mx-auto animate-float">
          <OmIcon className="w-10 h-10 text-primary-foreground" />
        </div>
        <p className="text-lg text-muted-foreground">
          Your AI-powered spiritual companion for authentic Hindu wisdom, 
          habit tracking, and dharmic living.
        </p>
      </div>
    )
  },
  {
    title: "🔥 Track Your Growth",
    subtitle: "Dual Streak System",
    content: (
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <Card className="p-4 text-center bg-saffron/10 border-saffron/20">
            <Sun className="h-8 w-8 mx-auto mb-2 text-saffron" />
            <h4 className="font-display text-sm">App Streak</h4>
            <p className="text-xs text-muted-foreground">Daily engagement</p>
          </Card>
          <Card className="p-4 text-center bg-lotus/10 border-lotus/20">
            <Heart className="h-8 w-8 mx-auto mb-2 text-lotus" />
            <h4 className="font-display text-sm">Sin-Free Days</h4>
            <p className="text-xs text-muted-foreground">Pure living</p>
          </Card>
        </div>
        <p className="text-center text-sm text-muted-foreground">
          Build unbreakable spiritual habits with gamified progress tracking
        </p>
      </div>
    )
  },
  {
    title: "🎁 7-Day Free Trial",
    subtitle: "No Credit Card Required",
    content: (
      <div className="space-y-4">
        <div className="bg-gradient-to-br from-saffron/10 to-dharma/10 p-4 rounded-xl border border-saffron/20">
          <BookOpen className="h-6 w-6 text-dharma mb-2" />
          <ul className="space-y-2 text-sm">
            <li className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-dharma" />
              Full access for 7 days
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-dharma" />
              700 Bhagavad Gita Shlokas
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-dharma" />
              AI-powered scripture guidance
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-dharma" />
              Completely free to start
            </li>
          </ul>
        </div>
      </div>
    )
  },
];

const Onboarding = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [isCompleting, setIsCompleting] = useState(false);
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { subscription, createTrialSubscription, completeOnboarding, loading: subLoading } = useSubscription();

  const totalSteps = introSteps.length + spiritualQuestions.length;
  const isIntroPhase = currentStep < introSteps.length;
  const questionIndex = currentStep - introSteps.length;

  // Redirect if no user or already completed onboarding
  useEffect(() => {
    if (authLoading || subLoading) return;
    
    if (!user) {
      navigate('/auth');
      return;
    }

    // If user has completed onboarding and has active access, go to dashboard
    if (subscription?.has_completed_onboarding) {
      navigate('/dashboard');
    }
  }, [user, subscription, authLoading, subLoading, navigate]);

  const handleComplete = async () => {
    setIsCompleting(true);
    
    try {
      // Save onboarding answers
      localStorage.setItem('onboardingAnswers', JSON.stringify(answers));
      
      // Create trial subscription if doesn't exist
      if (!subscription) {
        await createTrialSubscription();
      }
      
      // Mark onboarding as complete
      await completeOnboarding();
      
      // Navigate to start free trial page
      navigate('/start-free-trial');
    } catch (error) {
      console.error('Error completing onboarding:', error);
    } finally {
      setIsCompleting(false);
    }
  };

  const nextStep = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const selectOption = (questionId: string, value: string, multiSelect?: boolean) => {
    if (multiSelect) {
      const current = (answers[questionId] as string[]) || [];
      if (current.includes(value)) {
        setAnswers({ ...answers, [questionId]: current.filter(v => v !== value) });
      } else {
        setAnswers({ ...answers, [questionId]: [...current, value] });
      }
    } else {
      setAnswers({ ...answers, [questionId]: value });
    }
  };

  const isSelected = (questionId: string, value: string) => {
    const answer = answers[questionId];
    if (Array.isArray(answer)) {
      return answer.includes(value);
    }
    return answer === value;
  };

  const canProceed = () => {
    if (isIntroPhase) return true;
    const question = spiritualQuestions[questionIndex];
    const answer = answers[question.id];
    if (question.multiSelect) {
      return Array.isArray(answer) && answer.length > 0;
    }
    return !!answer;
  };

  const progress = ((currentStep + 1) / totalSteps) * 100;

  if (authLoading || subLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md mx-auto p-6 card-3d-subtle">
        {/* Progress */}
        <div className="mb-6">
          <div className="flex justify-between text-xs text-muted-foreground mb-2">
            <span>Step {currentStep + 1} of {totalSteps}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Content */}
        {isIntroPhase ? (
          <>
            <div className="text-center mb-6">
              <h1 className="text-2xl font-display mb-2">
                {introSteps[currentStep].title}
              </h1>
              <p className="text-muted-foreground">
                {introSteps[currentStep].subtitle}
              </p>
            </div>
            <div className="mb-8">
              {introSteps[currentStep].content}
            </div>
          </>
        ) : (
          <>
            <div className="text-center mb-6">
              <div className="bg-gradient-saffron p-3 rounded-full w-fit mx-auto mb-4">
                <Zap className="h-6 w-6 text-primary-foreground" />
              </div>
              <h2 className="text-lg font-display mb-2">
                {spiritualQuestions[questionIndex].question}
              </h2>
              {spiritualQuestions[questionIndex].multiSelect && (
                <p className="text-xs text-muted-foreground">Select all that apply</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 mb-8">
              {spiritualQuestions[questionIndex].options.map((option) => (
                <button
                  key={option.value}
                  onClick={() => selectOption(
                    spiritualQuestions[questionIndex].id,
                    option.value,
                    spiritualQuestions[questionIndex].multiSelect
                  )}
                  className={`p-4 rounded-xl text-left transition-all border ${
                    isSelected(spiritualQuestions[questionIndex].id, option.value)
                      ? 'bg-saffron/20 border-saffron text-foreground'
                      : 'bg-muted/50 border-border hover:border-saffron/50'
                  }`}
                >
                  <span className="text-2xl block mb-1">{option.icon}</span>
                  <span className="text-sm font-medium">{option.label}</span>
                </button>
              ))}
            </div>
          </>
        )}

        {/* Navigation */}
        <div className="flex justify-between gap-4">
          <Button
            variant="outline"
            onClick={prevStep}
            disabled={currentStep === 0 || isCompleting}
            className="flex-1"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          
          <Button
            onClick={nextStep}
            variant="saffron"
            disabled={!canProceed() || isCompleting}
            className="flex-1"
          >
            {isCompleting ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : currentStep === totalSteps - 1 ? (
              'Start Journey'
            ) : (
              'Next'
            )}
            {!isCompleting && <ArrowRight className="h-4 w-4 ml-2" />}
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default Onboarding;
