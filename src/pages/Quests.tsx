import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { MobileLayout } from "@/components/MobileLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  Plus, Check, AlertCircle, Info, Flame, Star, Trophy, 
  Pencil, Trash2, X, ChevronDown, ChevronUp 
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Quest {
  id: string;
  title: string;
  description: string;
  reward: number;
  type: 'daily' | 'weekly';
  icon: string;
  isCustom?: boolean;
}

// Default daily quests for self-reflection - changes daily at 12 AM IST
const allDefaultQuests: Quest[] = [
  { id: 'meditation', title: 'Morning Meditation', description: 'Spend 10 minutes in silent meditation to center yourself', reward: 30, type: 'daily', icon: '🧘‍♂️' },
  { id: 'scripture', title: 'Scripture Study', description: 'Read and reflect on one shloka from Bhagavad Gita', reward: 25, type: 'daily', icon: '📖' },
  { id: 'kindness', title: 'Act of Kindness', description: 'Perform one selfless act of service today', reward: 35, type: 'daily', icon: '💝' },
  { id: 'gratitude', title: 'Gratitude Practice', description: 'Write down 3 things you are deeply grateful for', reward: 20, type: 'daily', icon: '🙏' },
  { id: 'prayer', title: 'Evening Prayer', description: 'Offer prayers and thanks before sleeping', reward: 25, type: 'daily', icon: '🙏' },
  { id: 'forgiveness', title: 'Forgiveness Practice', description: 'Forgive someone who wronged you, even silently', reward: 35, type: 'daily', icon: '💜' },
  { id: 'mindful', title: 'Mindful Breathing', description: 'Practice 5 minutes of conscious pranayama', reward: 15, type: 'daily', icon: '🌬️' },
  { id: 'detox', title: 'Digital Detox Hour', description: 'Spend 1 hour away from screens in contemplation', reward: 30, type: 'daily', icon: '📵' },
  { id: 'review', title: 'Evening Self-Review', description: 'Review your day and identify moments of ego or attachment', reward: 25, type: 'daily', icon: '🌙' },
  { id: 'truth', title: 'Speak Only Truth', description: 'Be mindful of speaking only satya throughout the day', reward: 40, type: 'daily', icon: '✨' },
  { id: 'serve', title: 'Serve Someone', description: 'Help a family member or stranger without being asked', reward: 35, type: 'daily', icon: '🤝' },
  { id: 'journal', title: 'Self-Reflection Journal', description: 'Reflect on one action that aligned with your dharma', reward: 30, type: 'daily', icon: '📝' },
];

const weeklyQuests: Quest[] = [
  { id: 'temple', title: 'Temple Visit', description: 'Visit a temple or sacred place for worship', reward: 100, type: 'weekly', icon: '🏛️' },
  { id: 'charity', title: 'Charitable Giving', description: 'Donate to a worthy cause or help someone in need', reward: 150, type: 'weekly', icon: '💰' }
];

// Get today's date in IST
const getISTDate = () => {
  const now = new Date();
  // Convert to IST (UTC+5:30)
  const istOffset = 5.5 * 60 * 60 * 1000;
  const istTime = new Date(now.getTime() + istOffset);
  return istTime.toISOString().split('T')[0];
};

// Get 3 random quests seeded by IST date
const getTodaysQuests = (): Quest[] => {
  const todayIST = getISTDate();
  let seed = 0;
  for (let i = 0; i < todayIST.length; i++) {
    seed += todayIST.charCodeAt(i);
  }
  
  const shuffled = [...allDefaultQuests].sort(() => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280 - 0.5;
  });
  
  return shuffled.slice(0, 3);
};

const motivationMessages = [
  "First quest done! Your spiritual journey is beginning! 🌟",
  "Keep going! Every step brings you closer to enlightenment! 🙏",
  "Halfway there! The Divine is pleased with your dedication! ✨"
];

const completionMessages = [
  "All daily quests complete! You are truly walking the path of dharma! 🕉️",
  "Outstanding! Your spiritual discipline is inspiring! 🌸",
  "Perfect day! May Lord Krishna bless your continued journey! 🙏"
];

const Quests = () => {
  const { user, loading } = useAuth();
  const { profile, addDharmaPoints } = useProfile();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [completedQuests, setCompletedQuests] = useState<string[]>([]);
  const [showMotivationCard, setShowMotivationCard] = useState(false);
  const [motivationMessage, setMotivationMessage] = useState("");
  const [showCompletionCard, setShowCompletionCard] = useState(false);
  const [hasShownFirstMessage, setHasShownFirstMessage] = useState(false);
  const [loadingQuestId, setLoadingQuestId] = useState<string | null>(null);
  const [customQuests, setCustomQuests] = useState<Quest[]>([]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [editingQuest, setEditingQuest] = useState<Quest | null>(null);
  const [newQuest, setNewQuest] = useState({ title: '', description: '', reward: 25 });
  const [showWeekly, setShowWeekly] = useState(false);

  // Get today's random quests
  const dailyQuests = useMemo(() => {
    return [...getTodaysQuests(), ...customQuests.filter(q => q.type === 'daily')];
  }, [customQuests]);

  // Quest ID to database number mapping
  const getQuestNumericId = (questId: string): number => {
    const mapping: Record<string, number> = {
      'meditation': 1, 'scripture': 2, 'kindness': 3, 'gratitude': 4, 'prayer': 5,
      'forgiveness': 6, 'mindful': 7, 'detox': 8, 'review': 9, 'truth': 10,
      'serve': 11, 'journal': 12, 'temple': 101, 'charity': 102
    };
    return mapping[questId] || parseInt(questId.replace('custom-', '')) + 1000;
  };

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      fetchCompletedQuests();
      loadCustomQuests();
    }
  }, [user]);

  const loadCustomQuests = () => {
    const saved = localStorage.getItem(`custom_quests_${user?.id}`);
    if (saved) {
      setCustomQuests(JSON.parse(saved));
    }
  };

  const saveCustomQuests = (quests: Quest[]) => {
    localStorage.setItem(`custom_quests_${user?.id}`, JSON.stringify(quests));
    setCustomQuests(quests);
  };

  const fetchCompletedQuests = async () => {
    if (!user) return;
    
    const todayIST = getISTDate();
    const { data } = await supabase
      .from('quest_completions')
      .select('quest_id, quest_title')
      .eq('user_id', user.id)
      .gte('completed_at', todayIST);
    
    if (data) {
      // Get completed quest IDs
      const completedIds = data.map(d => {
        // Try to find by numeric ID first
        const numId = d.quest_id;
        for (const quest of [...allDefaultQuests, ...weeklyQuests]) {
          if (getQuestNumericId(quest.id) === numId) return quest.id;
        }
        // Check custom quests
        if (numId >= 1000) return `custom-${numId - 1000}`;
        return d.quest_title; // fallback to title
      }).filter(Boolean);
      setCompletedQuests(completedIds);
    }
  };

  // Auto emoji picker based on quest title keywords
  const getAutoEmoji = (title: string): string => {
    const lower = title.toLowerCase();
    if (lower.includes('meditat')) return '🧘';
    if (lower.includes('pray') || lower.includes('prayer')) return '🙏';
    if (lower.includes('read') || lower.includes('study') || lower.includes('scripture')) return '📖';
    if (lower.includes('gratitude') || lower.includes('grateful') || lower.includes('thank')) return '💛';
    if (lower.includes('kind') || lower.includes('help') || lower.includes('serve')) return '💝';
    if (lower.includes('forgive')) return '💜';
    if (lower.includes('breath') || lower.includes('pranayama')) return '🌬️';
    if (lower.includes('detox') || lower.includes('digital')) return '📵';
    if (lower.includes('journal') || lower.includes('write') || lower.includes('reflect')) return '📝';
    if (lower.includes('temple') || lower.includes('worship')) return '🏛️';
    if (lower.includes('mantra') || lower.includes('chant')) return '🕉️';
    if (lower.includes('yoga')) return '🧘‍♂️';
    if (lower.includes('fast') || lower.includes('vrat')) return '🍃';
    if (lower.includes('morning') || lower.includes('sunrise')) return '🌅';
    if (lower.includes('evening') || lower.includes('night') || lower.includes('sleep')) return '🌙';
    if (lower.includes('water') || lower.includes('drink')) return '💧';
    if (lower.includes('walk') || lower.includes('exercise')) return '🚶';
    if (lower.includes('family')) return '👨‍👩‍👧';
    if (lower.includes('love') || lower.includes('heart')) return '❤️';
    if (lower.includes('peace') || lower.includes('calm')) return '☮️';
    if (lower.includes('truth') || lower.includes('honest')) return '✨';
    return '⭐';
  };

  const handleAddQuest = () => {
    if (!newQuest.title.trim()) {
      toast({ title: 'Please enter a quest title', variant: 'destructive' });
      return;
    }

    const autoEmoji = getAutoEmoji(newQuest.title);

    const quest: Quest = {
      id: `custom-${Date.now()}`,
      title: newQuest.title,
      description: newQuest.description || 'Complete this spiritual practice',
      reward: newQuest.reward,
      type: 'daily',
      icon: autoEmoji,
      isCustom: true
    };

    saveCustomQuests([...customQuests, quest]);
    setNewQuest({ title: '', description: '', reward: 25 });
    setShowAddDialog(false);
    toast({ title: 'Quest added successfully! 🙏' });
  };

  const handleEditQuest = () => {
    if (!editingQuest) return;

    const updated = customQuests.map(q => 
      q.id === editingQuest.id ? { ...editingQuest } : q
    );
    saveCustomQuests(updated);
    setShowEditDialog(false);
    setEditingQuest(null);
    toast({ title: 'Quest updated! 🙏' });
  };

  const handleDeleteQuest = () => {
    if (!editingQuest) return;

    const filtered = customQuests.filter(q => q.id !== editingQuest.id);
    saveCustomQuests(filtered);
    setShowDeleteDialog(false);
    setEditingQuest(null);
    toast({ title: 'Quest deleted' });
  };

  const handleToggleQuest = async (quest: Quest) => {
    if (!user) return;
    
    const isCompleted = completedQuests.includes(quest.id);
    setLoadingQuestId(quest.id);

    const numericQuestId = getQuestNumericId(quest.id);
    
    try {
      if (isCompleted) {
        // Uncomplete quest
        await supabase
          .from('quest_completions')
          .delete()
          .eq('user_id', user.id)
          .eq('quest_id', numericQuestId);
        
        setCompletedQuests(prev => prev.filter(id => id !== quest.id));
      } else {
        // Complete quest
        await supabase
          .from('quest_completions')
          .insert({
            user_id: user.id,
            quest_id: numericQuestId,
            quest_title: quest.title,
            points_earned: quest.reward
          });
        
        await addDharmaPoints(quest.reward);
        
        const newCompleted = [...completedQuests, quest.id];
        setCompletedQuests(newCompleted);

        // Show motivation messages
        const dailyCompleted = newCompleted.filter(id => 
          dailyQuests.some(q => q.id === id)
        ).length;

        if (dailyCompleted === 1 && !hasShownFirstMessage) {
          setMotivationMessage(motivationMessages[0]);
          setShowMotivationCard(true);
          setHasShownFirstMessage(true);
        } else if (dailyCompleted === Math.ceil(dailyQuests.length / 2)) {
          setMotivationMessage(motivationMessages[2]);
          setShowMotivationCard(true);
        } else if (dailyCompleted === dailyQuests.length) {
          setShowCompletionCard(true);
        } else {
          toast({ 
            title: `+${quest.reward} Dharma Points earned! 🙏`,
            description: quest.title + " completed!"
          });
        }
      }
    } catch (error) {
      toast({ title: 'Error updating quest', variant: 'destructive' });
    } finally {
      setLoadingQuestId(null);
    }
  };

  const dailyCompleted = completedQuests.filter(id => 
    dailyQuests.some(q => q.id === id)
  ).length;

  const totalDailyPoints = completedQuests
    .filter(id => dailyQuests.some(q => q.id === id))
    .reduce((acc, id) => {
      const quest = dailyQuests.find(q => q.id === id);
      return acc + (quest?.reward || 0);
    }, 0);

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <MobileLayout currentPage="/quests">
      <div className="space-y-6 pb-32 p-4">
        {/* Motivation Card */}
        <AnimatePresence>
          {showMotivationCard && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="relative p-[2px] rounded-2xl bg-gradient-to-r from-saffron via-lotus-pink to-dharma-gold"
            >
              <div className="bg-card rounded-2xl p-4">
                <div className="flex items-start">
                  <div className="flex-1">
                    <h3 className="font-bold text-foreground flex items-center">
                      <AlertCircle className="h-5 w-5 mr-2 text-saffron" />
                      Keep going!
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {motivationMessage}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    className="ml-4 bg-gradient-saffron text-primary-foreground"
                    onClick={() => setShowMotivationCard(false)}
                  >
                    Got it
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Content */}
        <motion.div
          className="card-3d rounded-2xl p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-display text-foreground">Daily Quests</h2>
              <p className="text-muted-foreground text-sm">
                Refreshes daily at 12 AM IST
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowAddDialog(true)}
                className="gap-1"
              >
                <Plus className="h-4 w-4" />
                Add
              </Button>
              <div className="bg-muted rounded-full px-3 py-1.5">
                <span className="text-sm font-medium text-foreground">
                  {dailyCompleted}/{dailyQuests.length}
                </span>
              </div>
            </div>
          </div>

          {/* Progress Stats */}
          <div className="flex items-center gap-4 mb-6 text-sm">
            <div className="flex items-center gap-1.5 bg-saffron/10 px-3 py-1.5 rounded-full">
              <Star className="h-4 w-4 text-saffron" />
              <span className="text-saffron font-medium">{totalDailyPoints} DP earned</span>
            </div>
            <div className="flex items-center gap-1.5 bg-lotus-pink/10 px-3 py-1.5 rounded-full">
              <Flame className="h-4 w-4 text-lotus-pink" />
              <span className="text-lotus-pink font-medium">{profile?.app_streak || 1} day streak</span>
            </div>
          </div>

          {/* Quest List */}
          <div className="space-y-4">
            {dailyQuests.map((quest, index) => {
              const isCompleted = completedQuests.includes(quest.id);
              const isLoading = loadingQuestId === quest.id;
              
              return (
                <motion.div
                  key={quest.id}
                  className={`rounded-2xl p-4 flex items-center justify-between transition-all ${
                    isCompleted ? 'bg-muted/50' : 'bg-secondary/50'
                  }`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.08 }}
                >
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="h-12 w-12 flex items-center justify-center text-3xl shrink-0">
                      {quest.icon}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="relative">
                        <motion.span
                          className={`text-lg font-semibold block truncate ${isCompleted ? 'text-muted-foreground' : 'text-foreground'}`}
                          animate={{ opacity: isCompleted ? 0.6 : 1 }}
                        >
                          {quest.title}
                        </motion.span>
                        {isCompleted && (
                          <motion.div
                            className="absolute top-1/2 left-0 right-0 h-0.5 bg-muted-foreground"
                            initial={{ scaleX: 0, originX: 0 }}
                            animate={{ scaleX: 1 }}
                            transition={{ duration: 0.3 }}
                          />
                        )}
                      </div>
                      <p className={`text-sm truncate ${isCompleted ? 'text-muted-foreground/60' : 'text-muted-foreground'}`}>
                        +{quest.reward} DP • {quest.description}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 shrink-0">
                    {quest.isCustom && (
                      <>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingQuest(quest);
                            setShowEditDialog(true);
                          }}
                        >
                          <Pencil className="h-4 w-4 text-muted-foreground" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingQuest(quest);
                            setShowDeleteDialog(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </>
                    )}
                    <Button
                      className={`h-12 w-12 rounded-full flex items-center justify-center transition-all ${
                        isCompleted
                          ? 'bg-muted hover:bg-muted/80'
                          : 'bg-gradient-saffron hover:opacity-90'
                      }`}
                      onClick={() => handleToggleQuest(quest)}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-current" />
                      ) : isCompleted ? (
                        <Check className="h-6 w-6 text-muted-foreground" />
                      ) : (
                        <Plus className="h-6 w-6 text-primary-foreground" />
                      )}
                    </Button>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Info Card */}
          <div className="mt-6 bg-secondary/50 rounded-xl p-4 flex items-start gap-3">
            <Info className="h-5 w-5 text-saffron shrink-0 mt-0.5" />
            <p className="text-sm text-muted-foreground">
              Complete daily quests to build spiritual discipline. Quests refresh at midnight IST. Completed quests stay marked for that day only. 🙏
            </p>
          </div>
        </motion.div>

        {/* Weekly Quests */}
        <motion.div
          className="card-3d rounded-2xl overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <button
            onClick={() => setShowWeekly(!showWeekly)}
            className="w-full p-6 flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-dharma-gold" />
              <h3 className="text-xl font-display text-foreground">Weekly Quests</h3>
              <span className="text-xs bg-dharma-gold/20 text-dharma-gold px-2 py-1 rounded-full">
                Bonus
              </span>
            </div>
            {showWeekly ? (
              <ChevronUp className="h-5 w-5 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-5 w-5 text-muted-foreground" />
            )}
          </button>

          <AnimatePresence>
            {showWeekly && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="px-6 pb-6 space-y-4"
              >
                {weeklyQuests.map((quest, index) => {
                  const isCompleted = completedQuests.includes(quest.id);
                  const isLoading = loadingQuestId === quest.id;
                  
                  return (
                    <motion.div
                      key={quest.id}
                      className={`rounded-2xl p-4 flex items-center justify-between transition-all ${
                        isCompleted ? 'bg-muted/50' : 'bg-secondary/50'
                      }`}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.08 }}
                    >
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 flex items-center justify-center text-3xl">
                          {quest.icon}
                        </div>
                        <div>
                          <span className={`text-lg font-semibold ${isCompleted ? 'text-muted-foreground' : 'text-foreground'}`}>
                            {quest.title}
                          </span>
                          <p className="text-sm text-muted-foreground">
                            +{quest.reward} DP • {quest.description}
                          </p>
                        </div>
                      </div>
                      <Button
                        className={`h-12 w-12 rounded-full flex items-center justify-center ${
                          isCompleted
                            ? 'bg-muted hover:bg-muted/80'
                            : 'bg-gradient-dharma hover:opacity-90'
                        }`}
                        onClick={() => handleToggleQuest(quest)}
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-current" />
                        ) : isCompleted ? (
                          <Check className="h-6 w-6 text-muted-foreground" />
                        ) : (
                          <Plus className="h-6 w-6 text-primary-foreground" />
                        )}
                      </Button>
                    </motion.div>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Add Quest Dialog */}
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogContent className="max-w-sm mx-4">
            <DialogHeader>
              <DialogTitle className="font-display">Add Custom Quest</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <label className="text-sm font-medium text-foreground">Title</label>
                <Input
                  value={newQuest.title}
                  onChange={(e) => setNewQuest({ ...newQuest, title: e.target.value })}
                  placeholder="e.g., Read Scriptures"
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Description</label>
                <Textarea
                  value={newQuest.description}
                  onChange={(e) => setNewQuest({ ...newQuest, description: e.target.value })}
                  placeholder="What should be done?"
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Reward (DP)</label>
                <Input
                  type="number"
                  value={newQuest.reward}
                  onChange={(e) => setNewQuest({ ...newQuest, reward: parseInt(e.target.value) || 25 })}
                  min={5}
                  max={100}
                  className="mt-1"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddDialog(false)}>Cancel</Button>
              <Button variant="saffron" onClick={handleAddQuest}>Add Quest</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Quest Dialog */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="max-w-sm mx-4">
            <DialogHeader>
              <DialogTitle className="font-display">Edit Quest</DialogTitle>
            </DialogHeader>
            {editingQuest && (
              <div className="space-y-4 py-4">
                <div>
                  <label className="text-sm font-medium text-foreground">Title</label>
                  <Input
                    value={editingQuest.title}
                    onChange={(e) => setEditingQuest({ ...editingQuest, title: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">Description</label>
                  <Textarea
                    value={editingQuest.description}
                    onChange={(e) => setEditingQuest({ ...editingQuest, description: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">Reward (DP)</label>
                  <Input
                    type="number"
                    value={editingQuest.reward}
                    onChange={(e) => setEditingQuest({ ...editingQuest, reward: parseInt(e.target.value) || 25 })}
                    min={5}
                    max={100}
                    className="mt-1"
                  />
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowEditDialog(false)}>Cancel</Button>
              <Button variant="saffron" onClick={handleEditQuest}>Save Changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation */}
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent className="max-w-sm mx-4">
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Quest?</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{editingQuest?.title}"? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleDeleteQuest}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Completion Modal */}
        <AnimatePresence>
          {showCompletionCard && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="card-3d rounded-2xl p-8 max-w-sm w-full text-center"
              >
                <div className="text-6xl mb-4">🏆</div>
                <h3 className="text-2xl font-display text-foreground mb-2">
                  All Quests Complete!
                </h3>
                <p className="text-muted-foreground mb-6">
                  {completionMessages[Math.floor(Math.random() * completionMessages.length)]}
                </p>
                <Button
                  className="bg-gradient-saffron text-primary-foreground w-full"
                  onClick={() => setShowCompletionCard(false)}
                >
                  Continue Journey
                </Button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </MobileLayout>
  );
};

export default Quests;
