import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import { motion } from 'framer-motion';
import { Sparkles, CheckCircle, Gift, ArrowRight } from 'lucide-react';
import { Confetti } from '@/components/Confetti';

const StartFreeTrial = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { subscription, loading: subLoading, hasActiveAccess } = useSubscription();
  const [isStarting, setIsStarting] = useState(false);
  const [showConfetti, setShowConfetti] = useState(true);

  useEffect(() => {
    // Hide confetti after animation
    const timer = setTimeout(() => setShowConfetti(false), 5000);
    return () => clearTimeout(timer);
  }, []);

  // Redirect checks - only redirect if definitely not authenticated
  useEffect(() => {
    if (authLoading || subLoading) return;
    
    if (!user) {
      navigate('/auth');
      return;
    }
    
    // Don't redirect back to onboarding - if we got here, onboarding is done
    // The PaywallGuard handles the overall routing logic
  }, [user, authLoading, subLoading, navigate]);

  const handleStartTrial = async () => {
    setIsStarting(true);
    // Mark trial as activated
    localStorage.setItem('trial_activated', 'true');
    // Set flag to show confetti on dashboard
    sessionStorage.setItem('showDashboardConfetti', 'true');
    // Small delay for animation feel
    await new Promise(resolve => setTimeout(resolve, 800));
    // Use hard navigation to ensure clean state
    window.location.href = '/dashboard';
  };

  const features = [
    { icon: '🕉️', text: '700 Bhagavad Gita Shlokas' },
    { icon: '🤖', text: 'Unlimited AI Scripture Chat' },
    { icon: '🔥', text: 'Advanced Streak Tracking' },
    { icon: '🙏', text: 'Daily Personalized Quests' },
    { icon: '📊', text: 'Progress Analytics' },
  ];

  if (authLoading || subLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-secondary/20 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Confetti Animation */}
      {showConfetti && <Confetti />}
      
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-20 left-10 w-32 h-32 bg-saffron/10 rounded-full blur-3xl"
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 4, repeat: Infinity }}
        />
        <motion.div
          className="absolute bottom-20 right-10 w-40 h-40 bg-dharma/10 rounded-full blur-3xl"
          animate={{ scale: [1.2, 1, 1.2], opacity: [0.5, 0.3, 0.5] }}
          transition={{ duration: 5, repeat: Infinity }}
        />
        <motion.div
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-lotus/5 rounded-full blur-3xl"
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        {/* Gift Badge */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="flex justify-center mb-6"
        >
          <div className="bg-gradient-saffron p-4 rounded-full shadow-xl shadow-saffron/30">
            <Gift className="h-10 w-10 text-primary-foreground" />
          </div>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-3xl md:text-4xl font-display text-center mb-3"
        >
          <span className="text-gradient-saffron">
            Your 7-Day Free Trial
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-center text-muted-foreground mb-8"
        >
          Experience the full power of Dharma AI completely free. No credit card required.
        </motion.p>

        <Card className="card-3d-subtle p-6 bg-gradient-to-br from-saffron/10 to-dharma/10 border-saffron/30">
          {/* Features List */}
          <div className="space-y-4 mb-6">
            {features.map((feature, index) => (
              <motion.div
                key={feature.text}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + index * 0.1 }}
                className="flex items-center gap-3"
              >
                <span className="text-2xl">{feature.icon}</span>
                <span className="text-foreground">{feature.text}</span>
                <CheckCircle className="h-4 w-4 text-dharma ml-auto" />
              </motion.div>
            ))}
          </div>

          {/* Trial Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1 }}
            className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-xl p-4 mb-6 text-center"
          >
            <div className="flex items-center justify-center gap-2 mb-1">
              <Sparkles className="h-5 w-5 text-green-400" />
              <span className="font-display text-green-400">100% FREE</span>
              <Sparkles className="h-5 w-5 text-green-400" />
            </div>
            <p className="text-sm text-muted-foreground">
              Full access for 7 days • Cancel anytime
            </p>
          </motion.div>

          {/* Start Button */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.1 }}
          >
            <Button
              variant="saffron"
              className="w-full h-14 rounded-full text-lg font-display shadow-lg shadow-saffron/30"
              onClick={handleStartTrial}
              disabled={isStarting}
            >
              {isStarting ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Starting...
                </div>
              ) : (
                <>
                  Start Free Trial
                  <ArrowRight className="h-5 w-5 ml-2" />
                </>
              )}
            </Button>
          </motion.div>
        </Card>

        {/* Footer note */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.3 }}
          className="text-center text-xs text-muted-foreground mt-6"
        >
          🔒 Your data is secure • No payment required
        </motion.p>
      </motion.div>
    </div>
  );
};

export default StartFreeTrial;
