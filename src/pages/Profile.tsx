import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useSubscription } from "@/hooks/useSubscription";
import { MobileLayout } from "@/components/MobileLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { 
  User, Crown, Star, Target, Calendar, Settings, LogOut, 
  Flame, BookOpen, Heart, Clock, Trophy, TrendingUp 
} from "lucide-react";

interface Stats {
  totalMeditations: number;
  totalJournalEntries: number;
  totalQuestsCompleted: number;
  totalVoiceLogs: number;
}

const Profile = () => {
  const { user, signOut, loading } = useAuth();
  const { profile } = useProfile();
  const { subscription, hasActiveAccess, getDaysRemaining } = useSubscription();
  const navigate = useNavigate();
  const [stats, setStats] = useState<Stats>({
    totalMeditations: 0,
    totalJournalEntries: 0,
    totalQuestsCompleted: 0,
    totalVoiceLogs: 0
  });

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) fetchStats();
  }, [user]);

  const fetchStats = async () => {
    if (!user) return;

    const [meditationsRes, journalRes, questsRes, voiceRes] = await Promise.all([
      supabase.from('meditation_sessions').select('id', { count: 'exact' }).eq('user_id', user.id),
      supabase.from('journal_entries').select('id', { count: 'exact' }).eq('user_id', user.id),
      supabase.from('quest_completions').select('id', { count: 'exact' }).eq('user_id', user.id),
      supabase.from('voice_logs').select('id', { count: 'exact' }).eq('user_id', user.id)
    ]);

    setStats({
      totalMeditations: meditationsRes.count || 0,
      totalJournalEntries: journalRes.count || 0,
      totalQuestsCompleted: questsRes.count || 0,
      totalVoiceLogs: voiceRes.count || 0
    });
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const achievements = [
    { 
      id: 'first-chat', 
      name: 'First Question', 
      description: 'Asked your first spiritual question', 
      icon: '💬',
      earned: stats.totalQuestsCompleted > 0 
    },
    { 
      id: 'week-streak', 
      name: 'Week Warrior', 
      description: '7-day app streak', 
      icon: '🔥',
      earned: (profile?.app_streak || 0) >= 7 
    },
    { 
      id: 'dharma-seeker', 
      name: 'Dharma Seeker', 
      description: 'Earned 100 dharma points', 
      icon: '⭐',
      earned: (profile?.dharma_points || 0) >= 100 
    },
    { 
      id: 'scripture-scholar', 
      name: 'Scripture Scholar', 
      description: 'Completed 10 quests', 
      icon: '📚',
      earned: stats.totalQuestsCompleted >= 10 
    },
    { 
      id: 'meditation-master', 
      name: 'Meditation Master', 
      description: 'Completed 5 meditation sessions', 
      icon: '🧘',
      earned: stats.totalMeditations >= 5 
    },
    { 
      id: 'journal-writer', 
      name: 'Reflective Soul', 
      description: 'Written 10 journal entries', 
      icon: '📝',
      earned: stats.totalJournalEntries >= 10 
    }
  ];

  const earnedAchievements = achievements.filter(a => a.earned).length;
  const levelProgress = ((profile?.dharma_points || 0) % 100);
  const pointsToNextLevel = 100 - levelProgress;

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <MobileLayout currentPage="/profile">
      <div className="space-y-5 pb-20">
        {/* Profile Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card-3d mx-4 p-6 rounded-2xl"
        >
          <div className="flex items-center gap-4 mb-6">
            <Avatar className="w-20 h-20 border-2 border-saffron">
              <AvatarFallback className="bg-gradient-saffron text-primary-foreground text-2xl font-display">
                {profile?.full_name?.charAt(0) || user.email?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1">
              <h1 className="text-xl font-display text-foreground">
                {profile?.full_name || user.email?.split('@')[0] || 'Seeker'}
              </h1>
              <p className="text-sm text-muted-foreground">{user.email}</p>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <Badge className="bg-gradient-saffron text-primary-foreground">
                  <Crown className="h-3 w-3 mr-1" />
                  Level {profile?.current_level || 1}
                </Badge>
                {subscription && (
                  <Badge 
                    className={`${
                      subscription.plan_type === 'trial' 
                        ? 'bg-green-500/20 text-green-500' 
                        : 'bg-saffron/20 text-saffron'
                    } border-0`}
                  >
                    <Clock className="h-3 w-3 mr-1" />
                    {subscription.plan_type === 'trial' 
                      ? `Trial • ${getDaysRemaining()} days` 
                      : `${subscription.plan_type.charAt(0).toUpperCase() + subscription.plan_type.slice(1)} Plan`
                    }
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Level Progress */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Level Progress</span>
              <span className="text-saffron font-medium">{pointsToNextLevel} DP to next level</span>
            </div>
            <Progress value={levelProgress} className="h-2" />
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-4 mt-6">
            <div className="text-center p-3 bg-saffron/10 rounded-xl">
              <Flame className="h-5 w-5 text-saffron mx-auto mb-1" />
              <p className="text-xl font-display text-saffron">{profile?.app_streak || 1}</p>
              <p className="text-xs text-muted-foreground">Day Streak</p>
            </div>
            <div className="text-center p-3 bg-lotus-pink/10 rounded-xl">
              <Star className="h-5 w-5 text-lotus-pink mx-auto mb-1" />
              <p className="text-xl font-display text-lotus-pink">{profile?.dharma_points || 0}</p>
              <p className="text-xs text-muted-foreground">Dharma Points</p>
            </div>
            <div className="text-center p-3 bg-dharma-gold/10 rounded-xl">
              <Target className="h-5 w-5 text-dharma-gold mx-auto mb-1" />
              <p className="text-xl font-display text-dharma-gold">{profile?.sin_free_streak ?? 0}</p>
              <p className="text-xs text-muted-foreground">Sin-Free Days</p>
            </div>
          </div>
        </motion.div>

        {/* Tabs Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mx-4"
        >
          <Tabs defaultValue="stats" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-card border border-border rounded-xl p-1">
              <TabsTrigger 
                value="stats" 
                className="rounded-lg data-[state=active]:bg-gradient-saffron data-[state=active]:text-primary-foreground"
              >
                <TrendingUp className="h-4 w-4 mr-2" />
                Statistics
              </TabsTrigger>
              <TabsTrigger 
                value="achievements"
                className="rounded-lg data-[state=active]:bg-gradient-saffron data-[state=active]:text-primary-foreground"
              >
                <Trophy className="h-4 w-4 mr-2" />
                Achievements
              </TabsTrigger>
            </TabsList>

            <TabsContent value="stats" className="mt-4 space-y-4">
              <Card className="card-3d-subtle p-4 rounded-xl">
                <h3 className="font-display text-foreground mb-4 flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-spiritual-blue" />
                  Your Spiritual Journey
                </h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-secondary/50 p-4 rounded-xl text-center">
                    <div className="text-3xl mb-1">🧘</div>
                    <p className="text-2xl font-display text-spiritual-blue">{stats.totalMeditations}</p>
                    <p className="text-xs text-muted-foreground">Meditations</p>
                  </div>
                  <div className="bg-secondary/50 p-4 rounded-xl text-center">
                    <div className="text-3xl mb-1">📖</div>
                    <p className="text-2xl font-display text-lotus-pink">{stats.totalJournalEntries}</p>
                    <p className="text-xs text-muted-foreground">Journal Entries</p>
                  </div>
                  <div className="bg-secondary/50 p-4 rounded-xl text-center">
                    <div className="text-3xl mb-1">✅</div>
                    <p className="text-2xl font-display text-dharma-gold">{stats.totalQuestsCompleted}</p>
                    <p className="text-xs text-muted-foreground">Quests Done</p>
                  </div>
                  <div className="bg-secondary/50 p-4 rounded-xl text-center">
                    <div className="text-3xl mb-1">🎙️</div>
                    <p className="text-2xl font-display text-saffron">{stats.totalVoiceLogs}</p>
                    <p className="text-xs text-muted-foreground">Voice Logs</p>
                  </div>
                </div>
              </Card>

              {/* Time Stats */}
              <Card className="card-3d-subtle p-4 rounded-xl">
                <h3 className="font-display text-foreground mb-3 flex items-center gap-2">
                  <Clock className="h-5 w-5 text-saffron" />
                  Time Investment
                </h3>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Total meditation time</span>
                  <span className="font-display text-saffron">{stats.totalMeditations * 10} min</span>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="achievements" className="mt-4">
              <Card className="card-3d-subtle p-4 rounded-xl">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-display text-foreground flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-dharma-gold" />
                    Achievements
                  </h3>
                  <Badge variant="secondary" className="bg-dharma-gold/20 text-dharma-gold">
                    {earnedAchievements}/{achievements.length}
                  </Badge>
                </div>
                
                <div className="space-y-3">
                  {achievements.map((achievement, index) => (
                    <motion.div 
                      key={achievement.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                        achievement.earned 
                          ? 'bg-dharma-gold/10 border border-dharma-gold/30' 
                          : 'bg-muted/30 opacity-60'
                      }`}
                    >
                      <div className={`text-2xl ${!achievement.earned && 'grayscale'}`}>
                        {achievement.icon}
                      </div>
                      <div className="flex-1">
                        <p className={`font-medium ${achievement.earned ? 'text-foreground' : 'text-muted-foreground'}`}>
                          {achievement.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {achievement.description}
                        </p>
                      </div>
                      {achievement.earned && (
                        <Badge className="bg-dharma-gold/20 text-dharma-gold text-xs">
                          ✓
                        </Badge>
                      )}
                    </motion.div>
                  ))}
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mx-4 space-y-3"
        >
          <Button 
            variant="outline" 
            className="w-full justify-start rounded-xl h-12" 
            onClick={() => navigate('/settings')}
          >
            <Settings className="h-5 w-5 mr-3" />
            Settings
          </Button>
          
          <Button 
            variant="outline" 
            className="w-full justify-start rounded-xl h-12 text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive" 
            onClick={handleSignOut}
          >
            <LogOut className="h-5 w-5 mr-3" />
            Sign Out
          </Button>
        </motion.div>
      </div>
    </MobileLayout>
  );
};

export default Profile;