import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Star, Users } from 'lucide-react';
import { OmIcon } from '@/components/OmIcon';
const slides = [
  {
    title: "Daily Wisdom",
    description: "700 Bhagavad Gita shlokas with deep explanations"
  },
  {
    title: "AI Scripture Guide", 
    description: "Ask any question, receive authentic Hindu wisdom"
  },
  {
    title: "Streak Tracking",
    description: "Build dharmic habits with gamified progress"
  },
  {
    title: "Sin Tracking",
    description: "Overcome bad habits and grow spiritually"
  },
  {
    title: "Dharma Points",
    description: "Level up your spiritual journey"
  }
];

interface SlideItem {
  title: string;
  description: string;
}

const DotsIndicator = ({ 
  totalSlides, 
  currentIndex, 
  setCurrentIndex 
}: { 
  totalSlides: number; 
  currentIndex: number; 
  setCurrentIndex: (index: number) => void;
}) => (
  <div className="flex justify-center gap-2 mt-10">
    {Array.from({ length: totalSlides }).map((_, index) => (
      <button
        key={index}
        onClick={() => setCurrentIndex(index)}
        className={`w-2 h-2 rounded-full transition-all duration-300 ${
          index === currentIndex
            ? 'bg-saffron shadow-[0_0_15px_hsl(var(--saffron)/0.9)] scale-125'
            : 'bg-muted-foreground/40 hover:bg-muted-foreground/60'
        }`}
        aria-label={`Go to slide ${index + 1}`}
      />
    ))}
  </div>
);

const Landing = () => {
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      if (!isAnimating) {
        setIsAnimating(true);
        setCurrentIndex((prev) => (prev + 1) % slides.length);
        setTimeout(() => setIsAnimating(false), 1000);
      }
    }, 4000);
    return () => clearInterval(interval);
  }, [isAnimating]);

  return (
    <div className="w-full max-w-md mx-auto min-h-screen bg-gradient-to-b from-background to-secondary/30 text-foreground relative px-4">
      {/* Header section */}
      <div className="py-4 flex justify-between items-center">
        <div className="flex items-center">
          <div className="bg-gradient-saffron p-2.5 rounded-full mr-2 flex items-center justify-center">
            <OmIcon className="w-5 h-5 text-primary-foreground" />
          </div>
          <h1 className="text-xl font-display bg-gradient-saffron bg-clip-text text-transparent">
            Dharma AI
          </h1>
        </div>
        <Button
          variant="ghost"
          className="text-foreground hover:bg-saffron/20 hover:text-saffron"
          onClick={() => navigate('/auth')}
        >
          Sign in
        </Button>
      </div>

      {/* Hero section */}
      <div className="pt-8 pb-12 flex flex-col items-center relative">
        <motion.h2
          className="text-2xl md:text-3xl font-display text-center mb-4"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <span className="bg-gradient-saffron bg-clip-text text-transparent">
            Unlock Divine Wisdom
          </span>
          <br />
          <span className="text-foreground">Transform Your Life</span>
        </motion.h2>

        <motion.p
          className="text-center text-muted-foreground text-sm max-w-xs"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          Your AI-powered spiritual companion for authentic Hindu wisdom and dharmic living
        </motion.p>

        {/* Feature Slider */}
        <div className="w-full mt-10 relative">
          <div className="relative h-48 overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentIndex}
                className="absolute inset-0 flex flex-col items-center justify-center"
                initial={{ x: 100, opacity: 0 }}
                animate={{
                  x: 0,
                  opacity: 1,
                  transition: {
                    duration: 0.7,
                    ease: [0.16, 0.77, 0.47, 0.97],
                    delay: 0.2
                  }
                }}
                exit={{
                  x: -100,
                  opacity: 0,
                  transition: {
                    duration: 0.5,
                    ease: [0.7, 0, 0.84, 0]
                  }
                }}
              >
                <div className="bg-gradient-to-br from-saffron/20 to-dharma/20 border border-saffron/30 rounded-2xl p-8 w-full max-w-sm text-center">
                  <div className="bg-gradient-saffron p-4 rounded-full w-fit mx-auto mb-4 flex items-center justify-center">
                    <OmIcon className="w-7 h-7 text-primary-foreground" />
                  </div>
                  <h3 className="text-xl font-display mb-2">{slides[currentIndex].title}</h3>
                  <p className="text-muted-foreground text-sm">{slides[currentIndex].description}</p>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          <DotsIndicator
            totalSlides={slides.length}
            currentIndex={currentIndex}
            setCurrentIndex={setCurrentIndex}
          />
        </div>
      </div>

      {/* Stats and Actions section */}
      <motion.div
        className="bg-card px-0 pt-8 pb-6 rounded-t-3xl -mt-4 relative z-10 flex flex-col items-center min-h-[300px] w-[108%] left-[calc(-4%)] border-t border-border/50"
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.5 }}
      >
        <div className="w-full px-6">
          <div className="flex justify-between mb-6">
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Daily Shlokas</p>
              <h3 className="text-2xl font-display text-saffron">
                700+
              </h3>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Users</p>
              <h3 className="text-2xl font-display text-saffron flex items-center justify-center gap-1">
                <Users className="h-4 w-4" />
                2k+
              </h3>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Rating</p>
              <div className="flex justify-center items-center gap-1">
                <h3 className="text-2xl font-display text-saffron">
                  4.9
                </h3>
                <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
              </div>
            </div>
          </div>

          <h1 className="text-2xl font-display mb-3 text-center">
            Start your spiritual journey
          </h1>
          <p className="text-center text-muted-foreground mb-4 text-sm">
            AI-powered guidance from Bhagavad Gita,
            <br />
            Vedas, and Puranas for modern life
          </p>
        </div>

        <div className="flex-1" />

        <div className="w-full px-6 mt-4 mb-3">
          <Button
            variant="saffron"
            className="w-full h-14 rounded-full text-lg font-display shadow-lg"
            onClick={() => navigate('/auth')}
          >
            Begin Your Journey
          </Button>
        </div>

        <div className="w-full flex flex-col items-center mt-auto mb-4 px-6">
          <div className="bg-gradient-to-r from-saffron/10 to-dharma/10 border border-saffron/20 rounded-xl px-4 py-2 mb-4">
            <p className="text-xs text-center">
              🎁 <strong className="text-saffron">7-Day Free Trial</strong> • No credit card required
            </p>
          </div>
          <div className="flex gap-6 mb-2">
            <button
              className="text-saffron underline text-sm transition hover:text-dharma"
              onClick={() => navigate('/privacy-policy')}
            >
              Privacy Policy
            </button>
            <button
              className="text-saffron underline text-sm transition hover:text-dharma"
              onClick={() => navigate('/terms-of-service')}
            >
              Terms & Conditions
            </button>
          </div>
          <p className="text-xs text-muted-foreground text-center max-w-xs">
            By pressing "Begin Your Journey", you agree to our Privacy Policy and Terms & Conditions.
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Landing;