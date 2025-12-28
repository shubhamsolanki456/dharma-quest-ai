import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import { toast } from 'sonner';
import { CheckCircle, Crown, Zap, Sparkles, ArrowLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

declare global {
  interface Window {
    Razorpay: any;
  }
}

const Pricing = () => {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { subscription, hasActiveAccess, getDaysRemaining, refetch } = useSubscription();

  // Load Razorpay script
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => setRazorpayLoaded(true);
    script.onerror = () => toast.error('Failed to load payment gateway');
    document.body.appendChild(script);

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  const plans = [
    {
      id: 'weekly',
      name: 'Weekly',
      price: '₹99',
      period: 'week',
      description: 'Try the full experience',
      features: [
        'Unlimited AI Scripture Chat',
        'Advanced streak tracking',
        'Daily personalized quests',
        'Sin tracking & redemption',
        'Detailed progress analytics'
      ],
      buttonText: 'Start Weekly Plan',
      icon: Zap,
      gradient: 'from-blue-500/20 to-cyan-500/20',
      borderColor: 'border-blue-500/30'
    },
    {
      id: 'monthly',
      name: 'Monthly',
      price: '₹199',
      originalPrice: '₹499',
      period: 'month',
      description: 'Most popular choice',
      savings: 'Save 60%',
      features: [
        'Unlimited AI Scripture Chat',
        'Advanced streak tracking',
        'Daily personalized quests',
        'Sin tracking & redemption',
        'Detailed progress analytics'
      ],
      buttonText: 'Start Monthly Plan',
      icon: Sparkles,
      gradient: 'from-saffron/20 to-dharma/20',
      borderColor: 'border-saffron',
      popular: true
    },
    {
      id: 'yearly',
      name: 'Yearly',
      price: '₹1,999',
      originalPrice: '₹2,499',
      period: 'year',
      description: 'Best value for seekers',
      savings: 'Save 20%',
      features: [
        'Unlimited AI Scripture Chat',
        'Advanced streak tracking',
        'Daily personalized quests',
        'Sin tracking & redemption',
        'Detailed progress analytics'
      ],
      buttonText: 'Start Yearly Plan',
      icon: Crown,
      gradient: 'from-purple-500/20 to-pink-500/20',
      borderColor: 'border-purple-500/30'
    }
  ];

  const handlePlanSelect = async (planId: string) => {
    if (!user) {
      navigate('/auth');
      return;
    }

    if (!razorpayLoaded || !window.Razorpay) {
      toast.error('Payment gateway is loading. Please try again.');
      return;
    }

    setSelectedPlan(planId);
    setIsLoading(true);

    try {
      // Create Razorpay subscription via edge function
      const { data, error } = await supabase.functions.invoke('razorpay-create-subscription', {
        body: { plan_type: planId },
      });

      if (error) {
        throw new Error(error.message || 'Failed to create subscription');
      }

      if (!data || !data.subscription_id) {
        throw new Error('Invalid response from payment server');
      }

      console.log('Subscription created:', data.subscription_id);

      // Open Razorpay checkout
      const options = {
        key: data.key_id,
        subscription_id: data.subscription_id,
        name: 'Dharma AI',
        description: `${planId.charAt(0).toUpperCase() + planId.slice(1)} Subscription`,
        image: '/dharma-logo.png',
        handler: async function () {
          // Payment successful - webhook will activate subscription
          console.log('Payment completed');
          toast.success('Payment successful! Activating your subscription...');
          
          // Wait a moment for webhook to process, then refresh
          setTimeout(async () => {
            await refetch();
            window.location.href = `/payment-success?plan=${planId}`;
          }, 2000);
        },
        prefill: {
          email: user.email,
        },
        notes: {
          user_id: user.id,
          plan_type: planId,
        },
        theme: {
          color: '#FF9933',
        },
        modal: {
          ondismiss: function () {
            setIsLoading(false);
            setSelectedPlan(null);
          },
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.on('payment.failed', function (response: any) {
        console.error('Payment failed:', response?.error);
        toast.error(`Payment failed: ${response?.error?.description || 'Unknown error'}`);
        setIsLoading(false);
        setSelectedPlan(null);
      });

      razorpay.open();
    } catch (error) {
      console.error('Payment error:', error);
      toast.error(error instanceof Error ? error.message : 'Payment failed. Please try again.');
      setIsLoading(false);
      setSelectedPlan(null);
    }
  };

  const isTrialActive = subscription?.plan_type === 'trial' && hasActiveAccess();
  const trialDaysRemaining = isTrialActive ? getDaysRemaining() : 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-secondary/20 py-8 px-4">
      <div className="container mx-auto max-w-5xl">
        {/* Back button */}
        {hasActiveAccess() && (
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        )}

        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-display mb-3 text-gradient-saffron">
            Choose Your Path
          </h1>
          <p className="text-lg text-muted-foreground mb-4">
            Continue your spiritual journey with Dharma AI
          </p>
          
          {/* Trial info or expired message */}
          {isTrialActive ? (
            <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/30 rounded-xl p-4 max-w-md mx-auto">
              <p className="text-sm">
                ✨ <strong className="text-green-400">{trialDaysRemaining} days</strong> remaining in your free trial
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Subscribe now to continue uninterrupted access
              </p>
            </div>
          ) : subscription && !hasActiveAccess() ? (
            <div className="bg-gradient-to-r from-red-500/10 to-orange-500/10 border border-red-500/30 rounded-xl p-4 max-w-md mx-auto">
              <p className="text-sm text-red-400">
                🔒 Your trial has expired
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Choose a plan below to continue your journey
              </p>
            </div>
          ) : !subscription && (
            <div className="bg-gradient-to-r from-saffron/10 to-dharma/10 border border-saffron/30 rounded-xl p-4 max-w-md mx-auto">
              <p className="text-sm">
                🎁 <strong>7-Day Free Trial</strong> • No credit card required
              </p>
            </div>
          )}
        </div>

        {/* Plans Grid */}
        <div className="grid md:grid-cols-3 gap-5 mb-8">
          {plans.map((plan) => (
            <Card 
              key={plan.id} 
              className={`relative p-5 bg-gradient-to-br ${plan.gradient} backdrop-blur-sm ${
                plan.popular 
                  ? 'border-saffron shadow-lg shadow-saffron/20 scale-105 z-10' 
                  : plan.borderColor
              }`}
            >
              {plan.popular && (
                <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-gradient-saffron text-white border-0">
                  Most Popular
                </Badge>
              )}
              
              <div className="text-center mb-5">
                <div className={`p-3 rounded-2xl w-fit mx-auto mb-3 ${
                  plan.popular ? 'bg-gradient-saffron' : 'bg-muted'
                }`}>
                  <plan.icon className={`h-7 w-7 ${
                    plan.popular ? 'text-white' : 'text-foreground'
                  }`} />
                </div>
                
                <h3 className="text-xl font-bold mb-1">{plan.name}</h3>
                <div className="mb-1">
                  {plan.originalPrice && (
                    <span className="text-sm text-muted-foreground line-through mr-2">
                      {plan.originalPrice}
                    </span>
                  )}
                  <span className="text-3xl font-bold">{plan.price}</span>
                  <span className="text-muted-foreground text-sm">/{plan.period}</span>
                </div>
                {plan.savings && (
                  <Badge variant="secondary" className="mb-1 text-xs">
                    {plan.savings}
                  </Badge>
                )}
                <p className="text-xs text-muted-foreground">{plan.description}</p>
              </div>

              <ul className="space-y-2 mb-5">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-dharma flex-shrink-0 mt-0.5" />
                    <span className="text-xs">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                variant={plan.popular ? "saffron" : "outline"}
                className="w-full"
                onClick={() => handlePlanSelect(plan.id)}
                disabled={(isLoading && selectedPlan === plan.id) || !razorpayLoaded}
              >
                {isLoading && selectedPlan === plan.id ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                    Processing...
                  </div>
                ) : !razorpayLoaded ? (
                  'Loading...'
                ) : (
                  plan.buttonText
                )}
              </Button>
            </Card>
          ))}
        </div>

        {/* Footer */}
        <div className="text-center">
          <p className="text-xs text-muted-foreground mb-3">
            🔒 Secure payment via Razorpay • Auto-renewal • Cancel anytime
          </p>
          {isTrialActive && (
            <Button
              variant="link"
              onClick={() => navigate('/dashboard')}
              className="text-sm"
            >
              Continue with trial ({trialDaysRemaining} days left)
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Pricing;
