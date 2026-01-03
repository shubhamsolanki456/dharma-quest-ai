import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { MobileLayout } from '@/components/MobileLayout';
import { StreakCard3D } from '@/components/StreakCard3D';
import { DharmaProgress } from '@/components/DharmaProgress';
import { DailyQuest } from '@/components/DailyQuest';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Confetti } from '@/components/Confetti';
import { MessageCircle, BookOpen, PenLine, Mic, Brain, Sparkles, Heart, Star, Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { motion, AnimatePresence } from 'framer-motion';
import { useProfile } from '@/hooks/useProfile';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import { usePushNotifications, NotificationScheduler, SPIRITUAL_NOTIFICATIONS } from '@/hooks/usePushNotifications';
import { useSoundEffects } from '@/hooks/useSoundEffects';
import { toast } from 'sonner';
import { shlokas, getTodaysShloka } from '@/data/shlokas';
import { supabase } from '@/integrations/supabase/client';

interface FloatingDP {
  id: string;
  points: number;
  x: number;
  y: number;
}

// Get today's date in IST
const getISTDate = () => {
  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000;
  const istTime = new Date(now.getTime() + istOffset);
  return istTime.toISOString().split('T')[0];
};

// All available self-reflection quests
const allQuests = [
  { id: 1, title: 'Morning Meditation', description: 'Spend 10 minutes in silent meditation to center yourself', points: 25 },
  { id: 2, title: 'Practice Gratitude', description: 'Write down 3 things you are deeply grateful for today', points: 20 },
  { id: 3, title: 'Self-Reflection Journal', description: 'Reflect on one action today that aligned with your dharma', points: 30 },
  { id: 4, title: 'Forgiveness Practice', description: 'Forgive someone who wronged you, even silently in your heart', points: 35 },
  { id: 5, title: 'Act of Kindness', description: 'Perform one selfless act without expecting anything in return', points: 25 },
  { id: 6, title: 'Mindful Breathing', description: 'Practice 5 minutes of conscious pranayama breathing', points: 15 },
  { id: 7, title: 'Digital Detox Hour', description: 'Spend 1 hour away from screens in peaceful contemplation', points: 30 },
  { id: 8, title: 'Evening Review', description: 'Review your day and identify moments of ego or attachment', points: 25 },
  { id: 9, title: 'Speak Only Truth', description: 'Be mindful of speaking only satya (truth) throughout the day', points: 40 },
  { id: 10, title: 'Serve Someone', description: 'Help a family member or stranger without being asked', points: 35 },
];

// Seeded random number generator for consistent results
const seededRandom = (seed: number) => {
  const x = Math.sin(seed++) * 10000;
  return x - Math.floor(x);
};

// Get 3 random quests for today (seeded by IST date for consistency)
const getRandomQuests = (dateStr: string) => {
  // Create a stable seed from date string
  let seed = 0;
  for (let i = 0; i < dateStr.length; i++) {
    seed = seed * 31 + dateStr.charCodeAt(i);
  }
  
  // Fisher-Yates shuffle with seeded random for true consistency
  const questsCopy = [...allQuests];
  for (let i = questsCopy.length - 1; i > 0; i--) {
    const j = Math.floor(seededRandom(seed + i) * (i + 1));
    [questsCopy[i], questsCopy[j]] = [questsCopy[j], questsCopy[i]];
  }
  
  return questsCopy.slice(0, 3);
};

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { profile, addDharmaPoints, updateStreak } = useProfile();
  const { subscription, hasActiveAccess } = useSubscription();
  const { permission, isSupported, requestPermission } = usePushNotifications();
  const { playDPCollect, playQuestComplete } = useSoundEffects();
  const dpContainerRef = useRef<HTMLDivElement>(null);
  
  const [floatingDPs, setFloatingDPs] = useState<FloatingDP[]>([]);
  const [displayedDP, setDisplayedDP] = useState(0);
  const [completedQuestIds, setCompletedQuestIds] = useState<number[]>([]);
  const [isLoadingQuests, setIsLoadingQuests] = useState(true);
  const [currentDate, setCurrentDate] = useState(getISTDate());
  const [showConfetti, setShowConfetti] = useState(false);

  const level = profile?.current_level || 1;
  const totalDP = profile?.dharma_points || 0;
  const avatarUrl = profile?.avatar_url;
  const userName = profile?.full_name || 'User';
  const appStreak = profile?.app_streak || 0;
  const sinFreeStreak = profile?.sin_free_streak || 0;

  // Get today's shlok for the wisdom card
  const todayShlok = getTodaysShloka(shlokas);
  
  // Memoize quests based on current date
  const todaysQuests = useMemo(() => getRandomQuests(currentDate), [currentDate]);
  
  const quests = useMemo(() => 
    todaysQuests.map(q => ({ ...q, completed: completedQuestIds.includes(q.id) })),
    [todaysQuests, completedQuestIds]
  );

  // Check for confetti flag on mount
  useEffect(() => {
    const shouldShowConfetti = sessionStorage.getItem('showDashboardConfetti');
    if (shouldShowConfetti === 'true') {
      setShowConfetti(true);
      sessionStorage.removeItem('showDashboardConfetti');
      // Hide confetti after animation
      setTimeout(() => setShowConfetti(false), 5000);
    }
  }, []);

  // Fetch completed quests for today from database
  const fetchCompletedQuests = useCallback(async () => {
    if (!user) {
      setIsLoadingQuests(false);
      return;
    }
    
    try {
      const todayIST = getISTDate();
      // Create proper timestamp range for today in IST
      // IST is UTC+5:30, so today 00:00 IST = previous day 18:30 UTC
      const startOfDayIST = `${todayIST}T00:00:00+05:30`;
      const endOfDayIST = `${todayIST}T23:59:59+05:30`;
      
      const { data } = await supabase
        .from('quest_completions')
        .select('quest_id')
        .eq('user_id', user.id)
        .gte('completed_at', startOfDayIST)
        .lte('completed_at', endOfDayIST);
      
      if (data) {
        setCompletedQuestIds(data.map(d => d.quest_id));
      }
    } catch (error) {
      console.error('Error fetching quests:', error);
    } finally {
      setIsLoadingQuests(false);
    }
  }, [user]);

  useEffect(() => {
    fetchCompletedQuests();
    // Update streak on page load
    if (user) {
      updateStreak();
    }
  }, [fetchCompletedQuests, user, updateStreak]);

  // Check trial expiry and redirect to pricing if expired
  useEffect(() => {
    if (!subscription) return;
    
    if (subscription.plan_type === 'trial' && subscription.trial_end_date) {
      const isExpired = new Date(subscription.trial_end_date) < new Date();
      if (isExpired) {
        // Redirect to pricing/paywall
        navigate('/pricing');
      }
    }
  }, [subscription, navigate]);

  // Sync displayedDP with profile
  useEffect(() => {
    setDisplayedDP(totalDP);
  }, [totalDP]);

  // Check for midnight refresh - reset quests at midnight IST
  useEffect(() => {
    const checkMidnight = () => {
      const newDate = getISTDate();
      if (newDate !== currentDate) {
        setCurrentDate(newDate);
        setCompletedQuestIds([]); // Reset completed quests for new day
        fetchCompletedQuests();
      }
    };
    
    // Check every minute for date change
    const interval = setInterval(checkMidnight, 60000);
    return () => clearInterval(interval);
  }, [currentDate, fetchCompletedQuests]);

  // Setup notifications on mount
  useEffect(() => {
    if (permission === 'granted') {
      const scheduler = NotificationScheduler.getInstance();
      
      // Schedule daily spiritual notifications
      Object.values(SPIRITUAL_NOTIFICATIONS).forEach(notif => {
        scheduler.scheduleDaily(notif.id, notif.hour, notif.minute, notif.title, notif.body);
      });

      // Schedule trial expiry notifications if on trial
      if (subscription?.plan_type === 'trial' && subscription.trial_end_date) {
        scheduler.scheduleTrialExpiryReminders(new Date(subscription.trial_end_date));
      }
    }
  }, [permission, subscription]);

  const handleQuestComplete = async (questId: number, event: React.MouseEvent) => {
    const quest = quests.find(q => q.id === questId);
    if (!quest || quest.completed || !user) return;

    // Play sound effect
    playQuestComplete();

    // Get click position for animation
    const rect = event.currentTarget.getBoundingClientRect();
    const sourceX = rect.left + rect.width / 2;
    const sourceY = rect.top;

    // Add floating DP animation
    const id = `dp-${Date.now()}`;
    setFloatingDPs(prev => [...prev, { id, points: quest.points, x: sourceX, y: sourceY }]);

    // Optimistically mark as completed
    setCompletedQuestIds(prev => [...prev, questId]);

    try {
      // Save to database
      await supabase.from('quest_completions').insert({
        user_id: user.id,
        quest_id: questId,
        quest_title: quest.title,
        points_earned: quest.points
      });

      // Update displayed DP with animation delay
      setTimeout(() => {
        setFloatingDPs(prev => prev.filter(dp => dp.id !== id));
        setDisplayedDP(prev => prev + quest.points);
        playDPCollect();
      }, 1000);

      // Actually add points to profile
      await addDharmaPoints(quest.points);
      toast.success(`+${quest.points} Dharma Points earned!`);
    } catch (error) {
      // Revert on error
      setCompletedQuestIds(prev => prev.filter(id => id !== questId));
      toast.error('Failed to save quest completion');
    }
  };

  const handleEnableNotifications = async () => {
    const granted = await requestPermission();
    if (granted) {
      const scheduler = NotificationScheduler.getInstance();
      Object.values(SPIRITUAL_NOTIFICATIONS).forEach(notif => {
        scheduler.scheduleDaily(notif.id, notif.hour, notif.minute, notif.title, notif.body);
      });
    }
  };

  const quickFeatures = [
    { icon: PenLine, label: 'Journal', color: 'text-primary-foreground', bgColor: 'bg-cyan-500', path: '/journal' },
    { icon: Mic, label: 'Voice Log', color: 'text-primary-foreground', bgColor: 'bg-saffron', path: '/voice-log' },
    { icon: Brain, label: 'Meditate', color: 'text-primary-foreground', bgColor: 'bg-lotus', path: '/meditation' },
    { icon: Heart, label: 'Mantra', color: 'text-primary-foreground', bgColor: 'bg-red-400', path: '/mantra-jaap' },
    { icon: Sparkles, label: 'Manifest', color: 'text-primary-foreground', bgColor: 'bg-dharma', path: '/manifestation' },
  ];

  // Animation variants for staggered loading
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.4 }
    }
  };

  const _itemVariantsOld = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.4, ease: "easeOut" }
    }
  };

  return (
    <MobileLayout currentPage="/dashboard">
      {/* Confetti Animation */}
      {showConfetti && <Confetti duration={5000} particleCount={100} />}
      
      {/* Top Bar with orange gradient */}
      <div className="sticky top-0 z-50 bg-gradient-to-r from-primary via-saffron to-primary backdrop-blur-sm shadow-lg">
        <div className="flex items-center justify-center px-4 py-3 safe-top">
          {/* Centered content container */}
          <div className="flex items-center justify-between w-full max-w-md">
            {/* Level Badge */}
            <div className="flex items-center gap-2">
              <div className="bg-white/20 backdrop-blur-sm rounded-lg px-3 py-1.5">
                <span className="font-display text-sm text-white">
                  Lvl. {level}
                </span>
              </div>
              
              {/* DP Container */}
              <div 
                ref={dpContainerRef}
                className="flex items-center gap-1.5 bg-white/20 backdrop-blur-sm rounded-lg px-3 py-1.5"
              >
                <Star className="h-4 w-4 text-yellow-300 fill-yellow-300" />
                <motion.span 
                  key={displayedDP}
                  initial={{ scale: 1.3 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.3 }}
                  className="font-display text-sm text-white"
                >
                  {displayedDP}
                </motion.span>
              </div>
            </div>

            {/* Avatar */}
            <button 
              onClick={() => navigate('/profile')}
              className="focus:outline-none focus:ring-2 focus:ring-white/50 rounded-full"
            >
              <Avatar className="h-9 w-9 border-2 border-white/30 shadow-md">
                <AvatarImage src={avatarUrl || undefined} alt={userName} />
                <AvatarFallback className="bg-white/30 text-white text-sm font-display">
                  {userName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </button>
          </div>
        </div>
      </div>

      {/* Floating DP Animations - individual stars flying one by one */}
      <AnimatePresence>
        {floatingDPs.flatMap((dp) => 
          Array.from({ length: Math.min(dp.points, 10) }, (_, i) => (
            <motion.div
              key={`${dp.id}-star-${i}`}
              initial={{ 
                position: 'fixed',
                left: dp.x + (Math.random() - 0.5) * 40,
                top: dp.y + (Math.random() - 0.5) * 20,
                opacity: 1,
                scale: 1,
                zIndex: 100
              }}
              animate={{ 
                left: 130,
                top: 24,
                opacity: 0,
                scale: 0.3
              }}
              exit={{ opacity: 0 }}
              transition={{ 
                duration: 0.8 + i * 0.1,
                delay: i * 0.08,
                ease: [0.25, 0.1, 0.25, 1] 
              }}
              className="pointer-events-none"
            >
              <Star className="h-5 w-5 text-yellow-400 fill-yellow-400 drop-shadow-lg" />
            </motion.div>
          ))
        )}
      </AnimatePresence>

      <motion.div 
        className="p-4 space-y-5 pb-20"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Header with greeting */}
        <motion.div variants={itemVariants} className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-display text-foreground"><span className="font-extrabold tracking-wide">प्रणिपात</span> 🙏</h1>
            <p className="text-sm text-muted-foreground">Continue your spiritual journey</p>
          </div>
          {/* Notification Bell */}
          {isSupported && permission !== 'granted' && (
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleEnableNotifications}
              className="relative"
            >
              <Bell className="h-5 w-5" />
              <span className="absolute top-1 right-1 h-2 w-2 bg-destructive rounded-full" />
            </Button>
          )}
        </motion.div>

        {/* 3D Streak Card */}
        <motion.div variants={itemVariants}>
          <StreakCard3D appStreak={appStreak} sinFreeStreak={sinFreeStreak} />
        </motion.div>

        {/* Progress - 3D style */}
        <motion.div variants={itemVariants} className="card-3d-subtle rounded-xl overflow-hidden">
          <DharmaProgress
            level={level}
            dharmaPoints={displayedDP}
            pointsToNext={100 - (displayedDP % 100)}
            title="Spiritual Growth"
          />
        </motion.div>

        {/* Feature Actions */}
        <motion.div variants={itemVariants} className="card-3d-subtle rounded-xl p-4">
          <h3 className="font-display text-card-foreground mb-3">Spiritual Tools</h3>
          <div className="flex justify-between">
            {quickFeatures.map(({ icon: Icon, label, color, bgColor, path }) => (
              <button
                key={label}
                onClick={() => navigate(path)}
                className="flex flex-col items-center gap-1.5 p-2 rounded-lg hover:bg-muted/50 transition-all"
              >
                <div className={`p-2 rounded-full ${bgColor} ${color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <span className="text-xs text-muted-foreground">{label}</span>
              </button>
            ))}
          </div>
        </motion.div>

        {/* Quick Actions - 3D style */}
        <motion.div variants={itemVariants} className="card-3d-subtle rounded-xl p-4">
          <h3 className="font-display text-card-foreground mb-3">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-3">
            <Button 
              variant="saffron" 
              className="h-20 flex-col gap-2"
              onClick={() => navigate('/ai-guide')}
            >
              <MessageCircle className="h-6 w-6" />
              <span className="text-sm">Ask AI Guide</span>
            </Button>
            <Button 
              variant="spiritual" 
              className="h-20 flex-col gap-2"
              onClick={() => navigate('/daily-shlok')}
            >
              <BookOpen className="h-6 w-6" />
              <span className="text-sm">Daily Shlok</span>
            </Button>
          </div>
        </motion.div>

        {/* Daily Quests */}
        <motion.div variants={itemVariants} className="space-y-3">
          <h3 className="font-display text-foreground">Today's Dharma Quests</h3>
          {quests.map((quest) => (
            <div 
              key={quest.id}
              onClick={(e) => !quest.completed && handleQuestComplete(quest.id, e)}
            >
              <DailyQuest
                title={quest.title}
                description={quest.description}
                points={quest.points}
                completed={quest.completed}
                onComplete={() => {}}
              />
            </div>
          ))}
        </motion.div>

        {/* Today's Wisdom - 3D style with actual shlok */}
        <motion.div variants={itemVariants}>
          <Card 
            className="card-3d rounded-xl overflow-hidden relative cursor-pointer"
            onClick={() => navigate('/daily-shlok')}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-purple-600/80 via-pink-500/70 to-rose-500/60" />
            <div className="relative p-4 text-center">
              <h3 className="font-display text-white mb-2">Today's Wisdom</h3>
              <blockquote className="text-white/90 italic text-sm mb-2 line-clamp-2">
                "{todayShlok.translation}"
              </blockquote>
              <p className="text-white/70 text-xs">- Bhagavad Gita {todayShlok.chapter}.{todayShlok.verse}</p>
              <p className="text-white/60 text-xs mt-2">Tap to read more →</p>
            </div>
          </Card>
        </motion.div>
      </motion.div>
    </MobileLayout>
  );
};

export default Dashboard;
