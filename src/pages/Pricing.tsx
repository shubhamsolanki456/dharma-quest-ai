import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import { toast } from 'sonner';
import { CheckCircle, Crown, Zap, Sparkles, ArrowLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const Pricing = () => {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { subscription, hasActiveAccess, getDaysRemaining, refetch } = useSubscription();

  const plans = [
    {
      id: 'weekly',
      name: 'Weekly',
      price: '₹49',
      period: '/week',
      description: 'Perfect for trying out',
      features: [
        'Full app access',
        'All meditation sessions',
        'Daily shlokas',
        'Basic AI guidance',
      ],
      icon: Zap,
      color: 'from-blue-500 to-cyan-500',
      buttonText: 'Start Weekly Plan',
    },
    {
      id: 'monthly',
      name: 'Monthly',
      price: '₹149',
      period: '/month',
      description: 'Most popular choice',
      popular: true,
      features: [
        'Everything in Weekly',
        'Unlimited AI conversations',
        'Advanced analytics',
        'Priority support',
        'Exclusive content',
      ],
      icon: Crown,
      color: 'from-saffron to-orange-500',
      buttonText: 'Start Monthly Plan',
    },
    {
      id: 'yearly',
      name: 'Yearly',
      price: '₹999',
      period: '/year',
      originalPrice: '₹1,788',
      savings: 'Save 44%',
      description: 'Best value for seekers',
      features: [
        'Everything in Monthly',
        'Personal dharma coach',
        'Lifetime streak protection',
        'Early access to features',
        'Community access',
        'Annual spiritual report',
      ],
      icon: Sparkles,
      color: 'from-purple-500 to-pink-500',
      buttonText: 'Start Yearly Plan',
    },
  ];

  // Helper to calculate subscription end date
  const getEndDate = (planType: string): Date => {
    const date = new Date();
    if (planType === 'weekly') date.setDate(date.getDate() + 7);
    else if (planType === 'monthly') date.setMonth(date.getMonth() + 1);
    else if (planType === 'yearly') date.setFullYear(date.getFullYear() + 1);
    else date.setMonth(date.getMonth() + 1);
    return date;
  };

  const handlePlanSelect = async (planId: string) => {
    if (!user) {
      navigate('/auth');
      return;
    }

    setSelectedPlan(planId);
    setIsLoading(true);

    try {
      // Simulated payment - directly update subscription in database
      const endDate = getEndDate(planId);

      const { error } = await supabase
        .from('user_subscriptions')
        .update({
          plan_type: planId,
          is_active: true,
          subscription_start_date: new Date().toISOString(),
          subscription_end_date: endDate.toISOString(),
        })
        .eq('user_id', user.id);

      if (error) {
        throw new Error(error.message || 'Failed to activate subscription');
      }

      toast.success('Payment successful!');
      
      // Refetch and navigate to success page
      await refetch();
      navigate(`/payment-success?plan=${planId}`);
    } catch (error) {
      console.error('Payment error:', error);
      toast.error(error instanceof Error ? error.message : 'Payment failed. Please try again.');
    } finally {
      setIsLoading(false);
      setSelectedPlan(null);
    }
  };

  const isTrialActive = subscription?.plan_type === 'trial' && hasActiveAccess;
  const daysRemaining = getDaysRemaining();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-br from-saffron/20 via-background to-maroon/10 pt-8 pb-12 px-4">
        <div className="max-w-4xl mx-auto text-center">
          {hasActiveAccess && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(-1)}
              className="absolute left-4 top-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          )}
          
          <div className="inline-flex items-center gap-2 bg-saffron/20 text-saffron px-4 py-2 rounded-full mb-6">
            <Crown className="h-4 w-4" />
            <span className="text-sm font-medium">Choose Your Path</span>
          </div>
          
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Unlock Your Spiritual Journey
          </h1>
          
          {isTrialActive && daysRemaining !== null && daysRemaining > 0 ? (
            <p className="text-muted-foreground text-lg">
              You have <span className="text-saffron font-semibold">{daysRemaining} days</span> left in your free trial.
              <br />Subscribe now to continue your journey.
            </p>
          ) : (
            <p className="text-muted-foreground text-lg">
              Your trial has expired. Subscribe to continue your spiritual practice.
            </p>
          )}
        </div>
      </div>

      {/* Plans */}
      <div className="max-w-4xl mx-auto px-4 -mt-6 pb-8">
        <div className="grid md:grid-cols-3 gap-6">
          {plans.map((plan) => {
            const Icon = plan.icon;
            return (
              <Card
                key={plan.id}
                className={`relative p-6 ${
                  plan.popular
                    ? 'border-saffron shadow-lg shadow-saffron/20 scale-105'
                    : 'border-border'
                }`}
              >
                {plan.popular && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-saffron text-white">
                    Most Popular
                  </Badge>
                )}
                
                {plan.savings && (
                  <Badge variant="secondary" className="absolute -top-3 right-4 bg-green-500/20 text-green-400">
                    {plan.savings}
                  </Badge>
                )}

                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${plan.color} flex items-center justify-center mb-4`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>

                <h3 className="text-xl font-bold text-foreground mb-1">{plan.name}</h3>
                <p className="text-muted-foreground text-sm mb-4">{plan.description}</p>

                <div className="mb-6">
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold text-foreground">{plan.price}</span>
                    <span className="text-muted-foreground">{plan.period}</span>
                  </div>
                  {plan.originalPrice && (
                    <p className="text-sm text-muted-foreground line-through">{plan.originalPrice}/year</p>
                  )}
                </div>

                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-saffron shrink-0 mt-0.5" />
                      <span className="text-sm text-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  variant={plan.popular ? "saffron" : "outline"}
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
            );
          })}
        </div>

        {/* Trust badges */}
        <div className="mt-12 text-center">
          <p className="text-muted-foreground text-sm mb-4">Secure payment • Cancel anytime • 7-day money-back guarantee</p>
          <div className="flex items-center justify-center gap-6 opacity-60">
            <div className="text-xs text-muted-foreground">🔒 SSL Secured</div>
            <div className="text-xs text-muted-foreground">✓ Instant Access</div>
            <div className="text-xs text-muted-foreground">💳 All Cards Accepted</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Pricing;
