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
  const razorpayPaymentId = searchParams.get('razorpay_payment_id');
  const razorpaySubscriptionId = searchParams.get('razorpay_subscription_id') || searchParams.get('subscription_id');
  const razorpaySignature = searchParams.get('razorpay_signature');
  
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
    const verifyPayment = async () => {
      // If we have Razorpay redirect params, verify the payment
      if (razorpayPaymentId && razorpaySubscriptionId && razorpaySignature) {
        setIsVerifying(true);
        
        try {
          // Get stored payment info
          const pendingPayment = sessionStorage.getItem('razorpay_pending_payment');
          let userId = '';
          let storedPlanType = planType;
          
          if (pendingPayment) {
            const parsed = JSON.parse(pendingPayment);
            userId = parsed.userId;
            storedPlanType = parsed.planType || planType;
          } else {
            // Try to get user from auth
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
              userId = user.id;
            }
          }

          if (!userId) {
            throw new Error('User not found. Please try again.');
          }

          // Verify payment via edge function
          const { data: verifyData, error: verifyError } = await supabase.functions.invoke(
            'verify-razorpay-payment',
            {
              body: {
                razorpay_subscription_id: razorpaySubscriptionId,
                razorpay_payment_id: razorpayPaymentId,
                razorpay_signature: razorpaySignature,
                planType: storedPlanType,
                userId,
              },
            }
          );

          if (verifyError || !verifyData?.success) {
            throw new Error(verifyData?.error || 'Payment verification failed');
          }

          // Clear stored payment info
          sessionStorage.removeItem('razorpay_pending_payment');
          
          // Payment verified successfully
          setVerificationComplete(true);
          toast.success('Payment verified successfully!');
          
        } catch (error) {
          console.error('Payment verification error:', error);
          const errorMessage = error instanceof Error ? error.message : 'Payment verification failed';
          toast.error(errorMessage);
          // Still show the page but indicate there might be an issue
        } finally {
          setIsVerifying(false);
        }
      } else {
        // No redirect params, payment was probably verified in the modal handler
        // or this is a direct navigation
        setVerificationComplete(true);
      }

      // Mark trial as activated (user now has premium)
      localStorage.setItem('trial_activated', 'true');
      
      // Refresh subscription state
      await refetch();
      
      // Show content after verification
      setTimeout(() => setShowContent(true), 500);
      setShowConfetti(true);
      
      // Hide confetti after animation
      setTimeout(() => setShowConfetti(false), 5000);
    };

    verifyPayment();
  }, [razorpayPaymentId, razorpaySubscriptionId, razorpaySignature, planType, refetch]);

  const handleContinue = () => {
    // Use hard navigation to ensure clean state
    window.location.href = '/dashboard';
  };

  if (isVerifying) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background via-background to-secondary/20 flex items-center justify-center p-4">
        <Card className="p-8 text-center">
          <Loader2 className="h-12 w-12 animate-spin text-saffron mx-auto mb-4" />
          <h2 className="text-xl font-display mb-2">Verifying Payment</h2>
          <p className="text-muted-foreground">Please wait while we confirm your subscription...</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-secondary/20 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Confetti Animation */}
      {showConfetti && <Confetti />}
      
      {/* Background glow effects */}
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
          {/* Success Icon */}
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
              <span className="text-gradient-saffron">
                Welcome to Premium!
              </span>
            </h1>
            <p className="text-muted-foreground">
              Your {planNames[planType]} plan is now active
            </p>
          </motion.div>

          <Card className="card-3d-subtle p-6 bg-gradient-to-br from-saffron/10 to-dharma/10 border-saffron/30">
            {/* What's unlocked */}
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

            {/* Continue Button */}
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
