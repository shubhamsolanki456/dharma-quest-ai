import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, Crown, ArrowRight, Sparkles, Loader2 } from 'lucide-react';
import { Confetti } from '@/components/Confetti';
import { useSubscription } from '@/hooks/useSubscription';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const planType = searchParams.get('plan') || 'monthly';
  // Subscription flow (new) – subscriptionId is passed
  const subscriptionId = searchParams.get('subscription_id');
  
  const [showContent, setShowContent] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationComplete, setVerificationComplete] = useState(false);
  const { refetch } = useSubscription();

  const planNames: Record<string, string> = {
    weekly: 'Weekly',
    monthly: 'Monthly',
    yearly: 'Yearly'
  };

  useEffect(() => {
    const confirmSubscription = async () => {
      // Subscription flow: webhook handles DB update. We poll for confirmation.
      if (subscriptionId) {
        setIsVerifying(true);
        
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) {
            throw new Error('User not found. Please log in again.');
          }

          // Poll for subscription activation (webhook may take a few seconds)
          let attempts = 0;
          const maxAttempts = 10;
          let activated = false;

          while (attempts < maxAttempts && !activated) {
            const { data: sub } = await supabase
              .from('user_subscriptions')
              .select('is_active, subscription_end_date')
              .eq('user_id', user.id)
              .maybeSingle();

            if (sub?.is_active && sub?.subscription_end_date) {
              activated = true;
              break;
            }

            attempts++;
            await new Promise(r => setTimeout(r, 1500));
          }

          sessionStorage.removeItem('razorpay_pending_payment');
          localStorage.setItem('trial_activated', 'true');

          if (activated) {
            setVerificationComplete(true);
            toast.success('Subscription activated!');
          } else {
            // Webhook may still be processing – let user proceed anyway
            setVerificationComplete(true);
            toast.info('Your subscription is being activated. This may take a moment.');
          }

          await refetch();
        } catch (error) {
          console.error('Subscription confirmation error:', error);
          const errorMessage = error instanceof Error ? error.message : 'Error confirming subscription';
          toast.error(errorMessage);
        } finally {
          setIsVerifying(false);
        }
      } else {
        // Direct navigation or legacy one-time flow fallback
        setVerificationComplete(true);
        localStorage.setItem('trial_activated', 'true');
        await refetch();
      }

      // Show content after verification/wait
      setTimeout(() => setShowContent(true), 500);
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 5000);
    };

    confirmSubscription();
  }, [subscriptionId, planType, refetch]);

  const handleContinue = () => {
    navigate('/dashboard');
  };

  if (isVerifying) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background via-background to-secondary/20 flex items-center justify-center p-4">
        <Card className="p-8 text-center">
          <Loader2 className="h-12 w-12 animate-spin text-saffron mx-auto mb-4" />
          <h2 className="text-xl font-display mb-2">Activating Subscription</h2>
          <p className="text-muted-foreground">Please wait while we confirm your subscription...</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-secondary/20 flex items-center justify-center p-4 relative overflow-hidden">
      {showConfetti && <Confetti />}
      
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-1/4 left-1/4 w-64 h-64 bg-saffron/20 rounded-full blur-3xl"
          animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 3, repeat: Infinity }}
        />
        <motion.div
          className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-dharma/20 rounded-full blur-3xl"
          animate={{ scale: [1.5, 1, 1.5], opacity: [0.6, 0.3, 0.6] }}
          transition={{ duration: 3, repeat: Infinity }}
        />
      </div>

      {showContent && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, type: "spring" }}
          className="w-full max-w-md relative z-10"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="flex justify-center mb-6"
          >
            <div className="relative">
              <div className="bg-gradient-saffron p-5 rounded-full shadow-xl shadow-saffron/40">
                <Crown className="h-12 w-12 text-primary-foreground" />
              </div>
              <motion.div
                className="absolute -top-1 -right-1 bg-green-500 rounded-full p-1"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.5 }}
              >
                <CheckCircle className="h-5 w-5 text-white" />
              </motion.div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-center mb-6"
          >
            <h1 className="text-3xl md:text-4xl font-display mb-3">
              <span className="text-gradient-saffron">Welcome to Premium!</span>
            </h1>
            <p className="text-muted-foreground">
              Your {planNames[planType]} plan is now active
            </p>
          </motion.div>

          <Card className="card-3d-subtle p-6 bg-gradient-to-br from-saffron/10 to-dharma/10 border-saffron/30">
            <div className="text-center mb-6">
              <div className="flex items-center justify-center gap-2 mb-4">
                <Sparkles className="h-5 w-5 text-saffron" />
                <span className="font-display text-lg">You've Unlocked</span>
                <Sparkles className="h-5 w-5 text-saffron" />
              </div>
              
              <div className="space-y-3">
                {[
                  'Unlimited AI Scripture Chat',
                  'Advanced Streak Tracking',
                  'Daily Personalized Quests',
                  'Sin Tracking & Redemption',
                  'Detailed Progress Analytics'
                ].map((feature, index) => (
                  <motion.div
                    key={feature}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + index * 0.1 }}
                    className="flex items-center gap-2 justify-center"
                  >
                    <CheckCircle className="h-4 w-4 text-dharma" />
                    <span className="text-sm">{feature}</span>
                  </motion.div>
                ))}
              </div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1 }}
            >
              <Button
                variant="saffron"
                className="w-full h-14 rounded-full text-lg font-display shadow-lg shadow-saffron/30"
                onClick={handleContinue}
              >
                Start Your Journey
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
            </motion.div>
          </Card>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
            className="text-center text-xs text-muted-foreground mt-6"
          >
            🙏 Thank you for supporting Dharma AI
          </motion.p>
        </motion.div>
      )}
    </div>
  );
};

export default PaymentSuccess;
