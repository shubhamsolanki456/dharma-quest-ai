import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { Flower2, Sparkles, Target, Zap, Star, BookOpen, Heart, Sun } from 'lucide-react';

const Landing = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-16">
          {/* Logo */}
          <div className="flex items-center justify-center mb-8">
            <div className="bg-gradient-saffron p-5 rounded-full shadow-saffron animate-float">
              <Flower2 className="h-14 w-14 text-primary-foreground" />
            </div>
          </div>
          
          {/* Title */}
          <h1 className="text-5xl md:text-7xl font-display bg-gradient-saffron bg-clip-text text-transparent mb-4">
            Bhagvad AI
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-xl mx-auto">
            Your AI-powered spiritual companion for authentic Hindu wisdom, habit tracking, and dharmic living
          </p>
          
          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              variant="saffron"
              onClick={() => navigate('/onboarding')}
              className="text-lg px-10 py-7 font-display"
            >
              Begin Your Journey
              <Sparkles className="ml-2 h-5 w-5" />
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              onClick={() => navigate('/auth')}
              className="text-lg px-10 py-7 border-muted-foreground/30"
            >
              Sign In
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-16">
          <Card className="p-6 text-center card-3d-subtle">
            <div className="bg-saffron/10 p-4 rounded-full w-fit mx-auto mb-4">
              <BookOpen className="h-8 w-8 text-saffron" />
            </div>
            <h3 className="text-xl font-display mb-3">700 Daily Shlokas</h3>
            <p className="text-muted-foreground text-sm">
              Complete Bhagavad Gita with deep explanations, translations, and practical applications
            </p>
          </Card>

          <Card className="p-6 text-center card-3d-subtle">
            <div className="bg-lotus/10 p-4 rounded-full w-fit mx-auto mb-4">
              <Target className="h-8 w-8 text-lotus" />
            </div>
            <h3 className="text-xl font-display mb-3">Dual Streak System</h3>
            <p className="text-muted-foreground text-sm">
              Track App Streak and Sin-Free Days with gamified progress and Dharma Points
            </p>
          </Card>

          <Card className="p-6 text-center card-3d-subtle">
            <div className="bg-dharma/10 p-4 rounded-full w-fit mx-auto mb-4">
              <Zap className="h-8 w-8 text-dharma" />
            </div>
            <h3 className="text-xl font-display mb-3">AI Scripture Guide</h3>
            <p className="text-muted-foreground text-sm">
              Ask any question and receive wisdom from Vedas, Puranas, and Bhagavad Gita
            </p>
          </Card>
        </div>

        {/* Benefits Section */}
        <div className="text-center mb-16">
          <h2 className="text-3xl font-display mb-8">Transform Your Spiritual Life</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { icon: Sun, title: "Daily Wisdom", desc: "New shloka every day" },
              { icon: Target, title: "Habit Building", desc: "Dharmic practices" },
              { icon: Heart, title: "Sin Tracking", desc: "Overcome bad habits" },
              { icon: Flower2, title: "Inner Peace", desc: "Spiritual balance" }
            ].map((benefit, index) => (
              <div key={index} className="text-center p-4">
                <div className="bg-gradient-saffron p-3 rounded-full w-fit mx-auto mb-3">
                  <benefit.icon className="h-5 w-5 text-primary-foreground" />
                </div>
                <h4 className="font-display text-sm mb-1">{benefit.title}</h4>
                <p className="text-xs text-muted-foreground">{benefit.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Pricing Preview */}
        <div className="bg-gradient-to-r from-saffron/5 to-dharma/5 rounded-2xl p-8 text-center border border-saffron/20">
          <h2 className="text-2xl font-display mb-3">Start Your Journey Today</h2>
          <p className="text-muted-foreground mb-6">
            7-day free trial • Monthly ₹199 • Yearly ₹2000
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              variant="saffron"
              onClick={() => navigate('/onboarding')}
              className="font-display"
            >
              Start Free Trial
              <Star className="ml-2 h-4 w-4" />
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              onClick={() => navigate('/pricing')}
              className="border-muted-foreground/30"
            >
              View Plans
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Landing;
