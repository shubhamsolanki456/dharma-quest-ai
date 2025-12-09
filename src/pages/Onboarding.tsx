import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ArrowLeft, CheckCircle, Flower2, Sun, Moon, Heart, BookOpen, Zap } from 'lucide-react';

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
      { value: 'advanced', label: 'Very Knowledgeable', icon: '🕉️' },
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
  {
    id: 'deity',
    question: 'Which deities do you connect with?',
    options: [
      { value: 'krishna', label: 'Lord Krishna', icon: '🦚' },
      { value: 'shiva', label: 'Lord Shiva', icon: '🔱' },
      { value: 'hanuman', label: 'Lord Hanuman', icon: '🐵' },
      { value: 'durga', label: 'Maa Durga', icon: '🌸' },
    ],
    multiSelect: true,
  },
  {
    id: 'challenges',
    question: 'What challenges do you face in spiritual practice?',
    options: [
      { value: 'consistency', label: 'Staying Consistent', icon: '📅' },
      { value: 'focus', label: 'Maintaining Focus', icon: '🎯' },
      { value: 'time', label: 'Finding Time', icon: '⏳' },
      { value: 'guidance', label: 'Lack of Guidance', icon: '🧭' },
    ],
    multiSelect: true,
  },
  {
    id: 'sins',
    question: 'Would you like to track and overcome bad habits?',
    options: [
      { value: 'yes', label: 'Yes, Help Me Improve', icon: '✅' },
      { value: 'maybe', label: 'Maybe Later', icon: '🤔' },
      { value: 'no', label: 'Not Interested', icon: '❌' },
    ],
  },
  {
    id: 'reminder',
    question: 'Would you like daily spiritual reminders?',
    options: [
      { value: 'yes', label: 'Yes, Please!', icon: '🔔' },
      { value: 'sometimes', label: 'Occasionally', icon: '📬' },
      { value: 'no', label: 'No Thanks', icon: '🔕' },
    ],
  },
  {
    id: 'language',
    question: 'Preferred language for scriptures?',
    options: [
      { value: 'english', label: 'English Only', icon: '🇬🇧' },
      { value: 'hindi', label: 'Hindi', icon: '🇮🇳' },
      { value: 'sanskrit', label: 'Sanskrit with Translation', icon: '📿' },
      { value: 'both', label: 'All Languages', icon: '🌐' },
    ],
  },
];

const introSteps = [
  {
    title: "प्रणिपात",
    subtitle: "Welcome to Bhagvad AI",
    content: (
      <div className="text-center space-y-6">
        <div className="bg-gradient-saffron p-6 rounded-full w-fit mx-auto animate-float">
          <Flower2 className="h-12 w-12 text-primary-foreground" />
        </div>
        <p className="text-lg text-muted-foreground">
          Your AI-powered spiritual companion for authentic Hindu wisdom, 
          habit tracking, and dharmic living.
        </p>
      </div>
    )
  },
  {
    title: "Track Your Growth",
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
    title: "AI Scripture Guide",
    subtitle: "Ancient Wisdom, Modern Insights",
    content: (
      <div className="space-y-4">
        <div className="bg-dharma/10 p-4 rounded-xl border border-dharma/20">
          <BookOpen className="h-6 w-6 text-dharma mb-2" />
          <ul className="space-y-2 text-sm">
            <li className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-dharma" />
              700 Bhagavad Gita Shlokas
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-dharma" />
              Daily personalized wisdom
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-dharma" />
              AI answers from scriptures
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
  const navigate = useNavigate();

  const totalSteps = introSteps.length + spiritualQuestions.length;
  const isIntroPhase = currentStep < introSteps.length;
  const questionIndex = currentStep - introSteps.length;

  const nextStep = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Save answers and navigate to auth
      localStorage.setItem('onboardingAnswers', JSON.stringify(answers));
      navigate('/auth');
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
            disabled={currentStep === 0}
            className="flex-1"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          
          <Button
            onClick={nextStep}
            variant="saffron"
            disabled={!canProceed()}
            className="flex-1"
          >
            {currentStep === totalSteps - 1 ? 'Get Started' : 'Next'}
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>

        {/* Skip */}
        <div className="text-center mt-4">
          <Button
            variant="link"
            onClick={() => navigate('/auth')}
            className="text-xs text-muted-foreground"
          >
            Skip onboarding
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default Onboarding;
