import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { CheckCircle, Crown, Zap, Star } from 'lucide-react';

const Pricing = () => {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  const plans = [
    {
      id: 'free',
      name: 'Free',
      price: '₹0',
      period: 'Forever',
      description: 'Start your spiritual journey',
      features: [
        'Basic AI Scripture Chat (5 questions/day)',
        'Simple streak tracking',
        'Daily dharma reminders',
        'Basic progress tracking'
      ],
      buttonText: 'Start Free',
      variant: 'outline' as const,
      icon: Star,
      color: 'text-muted-foreground'
    },
    {
      id: 'monthly',
      name: 'Monthly',
      price: '₹199',
      period: 'per month',
      description: 'Perfect for regular practitioners',
      features: [
        'Unlimited AI Scripture Chat',
        'Advanced streak tracking',
        'Daily personalized quests',
        'Sin tracking & redemption',
        'Detailed progress analytics',
        'Priority support',
        'Offline scripture access'
      ],
      buttonText: 'Start Monthly Plan',
      variant: 'saffron' as const,
      icon: Zap,
      color: 'text-saffron',
      popular: true
    },
    {
      id: 'yearly',
      name: 'Yearly',
      price: '₹2000',
      period: 'per year',
      description: 'Best value for dedicated seekers',
      originalPrice: '₹2388',
      savings: 'Save ₹388',
      features: [
        'Everything in Monthly',
        'Exclusive premium content',
        'Personal spiritual mentor',
        'Advanced achievements',
        'Custom prayer reminders',
        'Sanskrit learning modules',
        'Community access'
      ],
      buttonText: 'Start Yearly Plan',
      variant: 'dharma' as const,
      icon: Crown,
      color: 'text-dharma'
    }
  ];

  const handlePlanSelect = async (planId: string) => {
    if (!user) {
      navigate('/auth');
      return;
    }

    setSelectedPlan(planId);
    setIsLoading(true);

    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));

      toast.success(
        planId === 'free' 
          ? 'Welcome to Bhagvad AI!' 
          : `Successfully subscribed to ${plans.find(p => p.id === planId)?.name} plan!`
      );

      navigate('/dashboard');
    } catch (error) {
      toast.error('Payment failed. Please try again.');
    } finally {
      setIsLoading(false);
      setSelectedPlan(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20 py-8 px-4">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">
            Choose Your Spiritual Path
          </h1>
          <p className="text-xl text-muted-foreground mb-6">
            Start your journey with authentic Hindu wisdom and AI guidance
          </p>
          <div className="bg-gradient-to-r from-saffron/10 to-spiritual/10 rounded-lg p-4 max-w-md mx-auto">
            <p className="text-sm">
              ✨ <strong>Special Offer:</strong> All plans include a 7-day free trial
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {plans.map((plan) => (
            <Card 
              key={plan.id} 
              className={`relative p-6 ${
                plan.popular 
                  ? 'border-saffron shadow-lg shadow-saffron/20 scale-105' 
                  : 'border-border'
              }`}
            >
              {plan.popular && (
                <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-saffron text-primary-foreground">
                  Most Popular
                </Badge>
              )}
              
              <div className="text-center mb-6">
                <div className={`p-3 rounded-full w-fit mx-auto mb-4 ${
                  plan.id === 'free' ? 'bg-muted' :
                  plan.id === 'monthly' ? 'bg-gradient-saffron' : 'bg-gradient-dharma'
                }`}>
                  <plan.icon className={`h-8 w-8 ${
                    plan.id === 'free' ? 'text-muted-foreground' : 'text-primary-foreground'
                  }`} />
                </div>
                
                <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                <div className="mb-2">
                  {plan.originalPrice && (
                    <span className="text-sm text-muted-foreground line-through mr-2">
                      {plan.originalPrice}
                    </span>
                  )}
                  <span className="text-3xl font-bold">{plan.price}</span>
                  <span className="text-muted-foreground">/{plan.period}</span>
                </div>
                {plan.savings && (
                  <Badge variant="secondary" className="mb-2">
                    {plan.savings}
                  </Badge>
                )}
                <p className="text-sm text-muted-foreground">{plan.description}</p>
              </div>

              <ul className="space-y-3 mb-6">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-dharma flex-shrink-0 mt-0.5" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                variant={plan.variant}
                className="w-full"
                onClick={() => handlePlanSelect(plan.id)}
                disabled={isLoading && selectedPlan === plan.id}
              >
                {isLoading && selectedPlan === plan.id ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                    Processing...
                  </div>
                ) : (
                  plan.buttonText
                )}
              </Button>
            </Card>
          ))}
        </div>

        <div className="text-center">
          <p className="text-sm text-muted-foreground mb-4">
            All plans include 24/7 support and can be cancelled anytime
          </p>
          <Button
            variant="link"
            onClick={() => navigate('/dashboard')}
            className="text-sm"
          >
            Continue with Free Plan
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Pricing;