import { useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, Crown, ArrowRight, Sparkles } from 'lucide-react';

// CSS-based confetti component
const Confetti = () => {
  const [particles, setParticles] = useState<Array<{
    id: number;
    x: number;
    delay: number;
    duration: number;
    color: string;
  }>>([]);

  useEffect(() => {
    const colors = ['#FF6B35', '#FFB347', '#FFD700', '#FF8C00', '#FFA500', '#E65100', '#FF5722'];
    const newParticles = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      delay: Math.random() * 2,
      duration: 2 + Math.random() * 2,
      color: colors[Math.floor(Math.random() * colors.length)],
    }));
    setParticles(newParticles);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-50">
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute w-3 h-3 rounded-sm"
          style={{
            left: `${particle.x}%`,
            backgroundColor: particle.color,
            top: '-20px',
          }}
          initial={{ y: -20, rotate: 0, opacity: 1 }}
          animate={{
            y: window.innerHeight + 100,
            rotate: 360 * (Math.random() > 0.5 ? 1 : -1),
            opacity: [1, 1, 0],
          }}
          transition={{
            duration: particle.duration,
            delay: particle.delay,
            ease: 'easeOut',
          }}
        />
      ))}
    </div>
  );
};

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const planType = searchParams.get('plan') || 'monthly';
  const [showContent, setShowContent] = useState(false);
  const [showConfetti, setShowConfetti] = useState(true);

  const planNames: Record<string, string> = {
    weekly: 'Weekly',
    monthly: 'Monthly',
    yearly: 'Yearly'
  };

  useEffect(() => {
    // Show content after a small delay
    setTimeout(() => setShowContent(true), 500);
    
    // Hide confetti after animation
    setTimeout(() => setShowConfetti(false), 5000);
  }, []);

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
                onClick={() => navigate('/dashboard')}
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