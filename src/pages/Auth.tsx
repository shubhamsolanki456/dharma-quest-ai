'use client'
import { useState, useEffect } from 'react';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Mail, Lock, Eye, EyeOff, User } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';

const Auth = () => {
  const navigate = useNavigate();
  const { signIn, signUp, user, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);

  // 3D tilt effect
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useTransform(y, [-100, 100], [5, -5]);
  const rotateY = useTransform(x, [-100, 100], [-5, 5]);

  // Sharp light beam animation
  const beamAngle = useMotionValue(0);
  useEffect(() => {
    const unsubscribe = animate(beamAngle, 360, {
      duration: 4,
      repeat: Infinity,
      ease: "linear"
    });
    return () => unsubscribe.stop();
  }, []);

  // Redirect if already authenticated
  useEffect(() => {
    if (!loading && user) {
      navigate('/dashboard');
    }
  }, [user, loading, navigate]);

  const handleLogin = async () => {
    if (!email || !email.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }

    if (!password || password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await signIn(email, password);
      if (error) {
        toast.error(error.message || 'Invalid credentials. Please try again.');
      } else {
        toast.success('Welcome back!');
      }
    } catch (error) {
      toast.error('Invalid credentials. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async () => {
    if (!email || !email.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }

    if (!password || password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await signUp(email, password, fullName);
      if (error) {
        toast.error(error.message || 'Failed to sign up. Please try again later.');
      } else {
        toast.success('Account created successfully!');
      }
    } catch (error) {
      toast.error('Failed to sign up. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-saffron"></div>
      </div>
    );
  }

  return (
    <div
      className="w-full max-w-md mx-auto min-h-screen flex justify-center items-center relative overflow-hidden px-4"
      style={{
        background: 'radial-gradient(circle at center, hsl(var(--secondary)) 0%, hsl(var(--background)) 70%, hsl(var(--background)) 100%)'
      }}
      onPointerMove={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        x.set(e.clientX - rect.left - rect.width/2);
        y.set(e.clientY - rect.top - rect.height/2);
      }}
    >
      {/* SHARP LIGHT BEAM */}
      <motion.div
        className="absolute pointer-events-none z-0"
        style={{
          width: '100%',
          height: '100%',
          left: '0',
          top: '0',
          background: `conic-gradient(
            from ${beamAngle}deg at 50% 50%,
            transparent 0deg,
            hsl(var(--saffron) / 0.6) 30deg,
            hsl(var(--saffron) / 0.8) 90deg,
            hsl(var(--saffron) / 0.6) 150deg,
            transparent 180deg
          )`,
          borderRadius: '28px',
          opacity: 0.5
        }}
      />

      {/* 3D CARD */}
      <motion.div
        className="w-[105%] h-auto min-h-[600px] bg-gradient-to-br from-card/80 to-muted/70 border border-border/50 rounded-3xl shadow-2xl overflow-hidden relative z-10"
        style={{
          transformStyle: 'preserve-3d',
          rotateX,
          rotateY,
          x: useTransform(x, [-540, 540], [-15, 15]),
          y: useTransform(y, [-960, 960], [-15, 15]),
          backdropFilter: 'none'
        }}
        whileHover={{ scale: 1.005 }}
      >
        {/* Card styling elements */}
        <div className="absolute inset-0 rounded-3xl pointer-events-none"
          style={{
            boxShadow: 'inset 0 0 50px hsl(var(--saffron) / 0.1)',
            background: 'radial-gradient(circle at center, transparent 60%, hsl(var(--saffron) / 0.03) 100%)'
          }}
        />
        <div className="absolute inset-0 rounded-3xl pointer-events-none border border-saffron/30"
          style={{
            boxShadow: 'inset 0 0 20px hsl(var(--saffron) / 0.15)'
          }}
        />

        {/* Card Content */}
        <div className="p-4 h-full flex flex-col justify-center">
          {/* Back button */}
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="absolute top-4 left-2 z-10"
          >
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/')}
              className="text-foreground hover:text-muted-foreground hover:bg-muted/30 border border-border/50"
            >
              <ArrowLeft className="h-6 w-6" />
            </Button>
          </motion.div>

          <div className="text-center mb-8">
            <motion.h1
              className="text-3xl md:text-4xl font-display bg-clip-text text-transparent bg-gradient-saffron mb-4"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              {isSignUp ? 'Create Account' : 'Welcome Back'}
            </motion.h1>
            <motion.p
              className="text-lg text-muted-foreground font-light"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              {isSignUp ? 'Begin your spiritual journey' : 'Continue your spiritual journey'}
            </motion.p>
          </div>

          <div className="space-y-5">
            {/* Full Name field (Sign Up only) */}
            {isSignUp && (
              <div className="space-y-2">
                <label className="text-base font-medium text-muted-foreground">Full Name</label>
                <div className="relative">
                  <Input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Your full name"
                    className="bg-muted/30 border-border/50 text-foreground placeholder:text-muted-foreground/60 pl-12 text-base h-12 focus:bg-muted/50 focus:border-saffron/50"
                  />
                  <User className="absolute left-4 top-3 h-5 w-5 text-muted-foreground" />
                </div>
              </div>
            )}

            {/* Email field */}
            <div className="space-y-2">
              <label className="text-base font-medium text-muted-foreground">Email</label>
              <div className="relative">
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="bg-muted/30 border-border/50 text-foreground placeholder:text-muted-foreground/60 pl-12 text-base h-12 focus:bg-muted/50 focus:border-saffron/50"
                />
                <Mail className="absolute left-4 top-3 h-5 w-5 text-muted-foreground" />
              </div>
            </div>

            {/* Password field */}
            <div className="space-y-2">
              <label className="text-base font-medium text-muted-foreground">Password</label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={isSignUp ? "Create a password" : "Your password"}
                  className="bg-muted/30 border-border/50 text-foreground placeholder:text-muted-foreground/60 pl-12 pr-12 text-base h-12 focus:bg-muted/50 focus:border-saffron/50"
                />
                <Lock className="absolute left-4 top-3 h-5 w-5 text-muted-foreground" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-3 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Confirm Password field (Sign Up only) */}
            {isSignUp && (
              <div className="space-y-2">
                <label className="text-base font-medium text-muted-foreground">Confirm Password</label>
                <div className="relative">
                  <Input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm your password"
                    className="bg-muted/30 border-border/50 text-foreground placeholder:text-muted-foreground/60 pl-12 pr-12 text-base h-12 focus:bg-muted/50 focus:border-saffron/50"
                  />
                  <Lock className="absolute left-4 top-3 h-5 w-5 text-muted-foreground" />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-3 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Submit button */}
            <motion.div
              className="mt-6"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button
                className="w-full bg-gradient-saffron text-primary-foreground hover:opacity-90 font-bold py-4 text-lg rounded-xl shadow-lg transition-all min-h-[44px]"
                onClick={isSignUp ? handleSignUp : handleLogin}
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                    {isSignUp ? 'Creating Account...' : 'Signing In...'}
                  </div>
                ) : (isSignUp ? 'Create Account' : 'Sign In')}
              </Button>
            </motion.div>

            {/* Toggle Sign In/Sign Up */}
            <motion.p
              className="text-center text-muted-foreground text-base mt-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
              <span
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-saffron font-semibold cursor-pointer hover:underline transition-colors"
              >
                {isSignUp ? 'Sign In' : 'Sign Up'}
              </span>
            </motion.p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Auth;
