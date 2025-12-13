import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useHaptics } from "@/hooks/useHaptics";
import { useSoundEffects } from "@/hooks/useSoundEffects";
import { MobileLayout } from "@/components/MobileLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Check, MoreVertical, Trash2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import { LevelUpCelebration } from "@/components/LevelUpCelebration";
import { RainbowNotification } from "@/components/RainbowNotification";
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

interface Habit {
  id: string;
  title: string;
  description: string;
  icon: string;
  target_value: number;
  unit: string;
  is_default?: boolean;
}

// Default habits - exactly 5
const defaultHabits: Habit[] = [
  { id: 'water', title: 'Drink Water', description: 'Stay hydrated throughout the day', icon: '💧', target_value: 4, unit: 'L', is_default: true },
  { id: 'exercise', title: 'Exercise', description: 'Physical activity for a healthy body', icon: '🏋️', target_value: 30, unit: 'min', is_default: true },
  { id: 'reading', title: 'Read Scripture', description: 'Read spiritual texts daily', icon: '📖', target_value: 15, unit: 'min', is_default: true },
  { id: 'sleep', title: 'Sleep Early', description: 'Go to bed before 10:30 PM', icon: '🌙', target_value: 1, unit: '', is_default: true },
  { id: 'fruits', title: 'Eat Fruits', description: 'Consume healthy fruits daily', icon: '🍎', target_value: 2, unit: 'servings', is_default: true },
];

// Get today's date in IST
const getISTDate = () => {
  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000;
  const istTime = new Date(now.getTime() + istOffset);
  return istTime.toISOString().split('T')[0];
};

const Quests = () => {
  const { user, loading } = useAuth();
  const { profile, addDharmaPoints } = useProfile();
  const { triggerHaptic } = useHaptics();
  const { playQuestComplete, playDPCollect } = useSoundEffects();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [habits, setHabits] = useState<Habit[]>([]);
  const [completedHabits, setCompletedHabits] = useState<string[]>([]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [newHabit, setNewHabit] = useState({ title: '', description: '', target_value: 1, unit: '' });
  const [currentDate, setCurrentDate] = useState(getISTDate());
  const [isLoading, setIsLoading] = useState(true);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [newLevel, setNewLevel] = useState(1);
  const [firstTaskToast, setFirstTaskToast] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  // Load habits from database or use defaults
  const loadHabits = useCallback(async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('habits')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true);
      
      if (error) throw error;
      
      if (data && data.length > 0) {
        // Filter out any duplicates by title
        const uniqueHabits = data.reduce((acc: Habit[], curr) => {
          const exists = acc.find(h => h.title === curr.title);
          if (!exists) {
            acc.push({
              id: curr.id,
              title: curr.title,
              description: curr.description || '',
              icon: curr.icon || '⭐',
              target_value: curr.target_value || 1,
              unit: curr.unit || ''
            });
          }
          return acc;
        }, []);
        setHabits(uniqueHabits);
      } else {
        // Initialize with default habits - only 5
        const habitsToInsert = defaultHabits.map(h => ({
          user_id: user.id,
          title: h.title,
          description: h.description,
          icon: h.icon,
          target_value: h.target_value,
          unit: h.unit,
          is_active: true
        }));
        
        const { data: inserted, error: insertError } = await supabase
          .from('habits')
          .insert(habitsToInsert)
          .select();
        
        if (insertError) throw insertError;
        
        if (inserted) {
          setHabits(inserted.map(h => ({
            id: h.id,
            title: h.title,
            description: h.description || '',
            icon: h.icon || '⭐',
            target_value: h.target_value || 1,
            unit: h.unit || ''
          })));
        }
      }
    } catch (error) {
      console.error('Error loading habits:', error);
      // Fallback to default habits without saving
      setHabits(defaultHabits);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Load completed habits for today
  const loadCompletedHabits = useCallback(async () => {
    if (!user) return;
    
    try {
      const todayIST = getISTDate();
      const { data, error } = await supabase
        .from('habit_completions')
        .select('habit_id')
        .eq('user_id', user.id)
        .eq('completed_at', todayIST);
      
      if (error) throw error;
      
      if (data) {
        setCompletedHabits(data.map(d => d.habit_id));
      }
    } catch (error) {
      console.error('Error loading completed habits:', error);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      loadHabits();
      loadCompletedHabits();
    }
  }, [user, loadHabits, loadCompletedHabits]);

  // Check for midnight refresh
  useEffect(() => {
    const checkMidnight = () => {
      const newDate = getISTDate();
      if (newDate !== currentDate) {
        setCurrentDate(newDate);
        setCompletedHabits([]);
        loadCompletedHabits();
      }
    };
    
    const interval = setInterval(checkMidnight, 60000);
    return () => clearInterval(interval);
  }, [currentDate, loadCompletedHabits]);

  const getAutoEmoji = (title: string): string => {
    const lower = title.toLowerCase();
    if (lower.includes('water') || lower.includes('drink')) return '💧';
    if (lower.includes('exercise') || lower.includes('gym') || lower.includes('workout')) return '🏋️';
    if (lower.includes('read') || lower.includes('book') || lower.includes('scripture')) return '📖';
    if (lower.includes('sleep') || lower.includes('bed')) return '🌙';
    if (lower.includes('fruit') || lower.includes('vegetable') || lower.includes('eat')) return '🍎';
    if (lower.includes('meditat')) return '🧘';
    if (lower.includes('pray')) return '🙏';
    if (lower.includes('walk') || lower.includes('run')) return '🚶';
    if (lower.includes('yoga')) return '🧘‍♂️';
    if (lower.includes('journal') || lower.includes('write')) return '📝';
    return '⭐';
  };

  const handleAddHabit = async () => {
    if (!newHabit.title.trim() || !user) {
      toast({ title: 'Please enter a habit title', variant: 'destructive' });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('habits')
        .insert({
          user_id: user.id,
          title: newHabit.title,
          description: newHabit.description || 'Complete this habit daily',
          icon: getAutoEmoji(newHabit.title),
          target_value: newHabit.target_value || 1,
          unit: newHabit.unit || '',
          is_active: true
        })
        .select()
        .single();

      if (error) throw error;

      if (data) {
        setHabits(prev => [...prev, {
          id: data.id,
          title: data.title,
          description: data.description || '',
          icon: data.icon || '⭐',
          target_value: data.target_value || 1,
          unit: data.unit || ''
        }]);
      }

      setNewHabit({ title: '', description: '', target_value: 1, unit: '' });
      setShowAddDialog(false);
      toast({ title: 'Habit added successfully! 🙏' });
    } catch (error) {
      console.error('Error adding habit:', error);
      toast({ title: 'Failed to add habit', variant: 'destructive' });
    }
  };

  const handleEditHabit = async () => {
    if (!editingHabit || !user) return;

    try {
      const { error } = await supabase
        .from('habits')
        .update({
          title: editingHabit.title,
          description: editingHabit.description,
          icon: getAutoEmoji(editingHabit.title),
          target_value: editingHabit.target_value,
          unit: editingHabit.unit
        })
        .eq('id', editingHabit.id)
        .eq('user_id', user.id);

      if (error) throw error;

      setHabits(prev => prev.map(h => 
        h.id === editingHabit.id ? { ...editingHabit, icon: getAutoEmoji(editingHabit.title) } : h
      ));
      setShowEditDialog(false);
      setEditingHabit(null);
      toast({ title: 'Habit updated! 🙏' });
    } catch (error) {
      console.error('Error updating habit:', error);
      toast({ title: 'Failed to update habit', variant: 'destructive' });
    }
  };

  const handleDeleteHabit = async () => {
    if (!editingHabit || !user) return;

    try {
      const { error } = await supabase
        .from('habits')
        .delete()
        .eq('id', editingHabit.id)
        .eq('user_id', user.id);

      if (error) throw error;

      setHabits(prev => prev.filter(h => h.id !== editingHabit.id));
      setShowDeleteDialog(false);
      setEditingHabit(null);
      toast({ title: 'Habit deleted' });
    } catch (error) {
      console.error('Error deleting habit:', error);
      toast({ title: 'Failed to delete habit', variant: 'destructive' });
    }
  };

  const handleToggleHabit = async (habit: Habit) => {
    if (!user) return;
    
    const isCompleted = completedHabits.includes(habit.id);
    const todayIST = getISTDate();
    const wasFirstTask = completedHabits.length === 0 && !isCompleted;
    
    triggerHaptic(isCompleted ? 'light' : 'success');
    
    try {
      if (isCompleted) {
        // Uncomplete habit
        await supabase
          .from('habit_completions')
          .delete()
          .eq('user_id', user.id)
          .eq('habit_id', habit.id)
          .eq('completed_at', todayIST);
        
        setCompletedHabits(prev => prev.filter(id => id !== habit.id));
        toast({ title: 'Quest unmarked' });
      } else {
        // Play sound effect
        playQuestComplete();
        
        // Complete habit
        await supabase
          .from('habit_completions')
          .insert({
            user_id: user.id,
            habit_id: habit.id,
            completed_at: todayIST,
            value: habit.target_value
          });
        
        setCompletedHabits(prev => [...prev, habit.id]);
        
        // Award 10 DP per habit completion
        const result = await addDharmaPoints(10);
        
        // Play DP collect sound after delay
        setTimeout(() => playDPCollect(), 300);
        
        // Check for level up
        if (result.leveledUp && result.newLevel) {
          setNewLevel(result.newLevel);
          setShowLevelUp(true);
        }
        
        // Show first task notification
        if (wasFirstTask) {
          toast({ 
            title: '🎉 First task of the day!',
            description: 'Great start! Keep going to complete all quests.'
          });
        } else {
          toast({ 
            title: `+10 Dharma Points earned! 🙏`,
            description: `${habit.title} completed!`
          });
        }
      }
    } catch (error) {
      console.error('Error toggling habit:', error);
      triggerHaptic('error');
      toast({ title: 'Error updating quest', variant: 'destructive' });
    }
  };

  const completedCount = completedHabits.length;
  const totalHabits = habits.length;
  const progress = totalHabits > 0 ? (completedCount / totalHabits) * 100 : 0;

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
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

  const _oldItemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1, 
      y: 0,
      transition: { duration: 0.4, ease: "easeOut" }
    }
  };

  if (loading || !user || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <MobileLayout currentPage="/quests">
      <motion.div 
        className="space-y-5 pb-20 p-4"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Header */}
        <motion.div variants={itemVariants} className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-display text-foreground">Today's Quests</h2>
            <p className="text-muted-foreground text-sm">
              Complete quests to earn Dharma Points
            </p>
          </div>
          <div className="bg-gradient-saffron rounded-full px-3 py-1.5">
            <span className="text-sm font-medium text-white">
              {completedCount}/{totalHabits} completed
            </span>
          </div>
        </motion.div>

        {/* Rainbow Notification Banners */}
        <AnimatePresence mode="wait">
          {completedCount === 0 && (
            <RainbowNotification
              key="start-banner"
              emoji="🌅"
              title="Start your day strong!"
              subtitle="Complete your first quest to begin earning points"
            />
          )}

          {completedCount === 1 && (
            <RainbowNotification
              key="first-task-banner"
              emoji="🎉"
              title="First task of the day!"
              subtitle="Great start! Keep going to complete all quests."
            />
          )}

          {completedCount >= Math.floor(totalHabits / 2) && completedCount < totalHabits && completedCount > 1 && (
            <RainbowNotification
              key="halfway-banner"
              emoji="🔥"
              title="Halfway there!"
              subtitle="You're doing amazing. Keep the momentum going!"
            />
          )}

          {completedCount === totalHabits && totalHabits > 0 && (
            <RainbowNotification
              key="complete-banner"
              emoji="🏆"
              title="All quests completed!"
              subtitle="You're a true dharma warrior! Come back tomorrow."
            />
          )}
        </AnimatePresence>

        {/* Quest List */}
        <div className="space-y-4">
          <AnimatePresence>
            {habits.map((habit, index) => {
              const isCompleted = completedHabits.includes(habit.id);
              
              return (
                <motion.div
                  key={habit.id}
                  variants={itemVariants}
                  className={`rounded-3xl p-4 flex items-center justify-between ${
                    isCompleted ? 'bg-muted/70' : 'bg-card border border-border'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    {/* Three-dot menu */}
                    <button
                      onClick={() => {
                        setEditingHabit(habit);
                        setShowEditDialog(true);
                      }}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <MoreVertical className="h-5 w-5" />
                    </button>
                    
                    {/* Emoji */}
                    <span className="text-3xl">
                      {habit.icon || getAutoEmoji(habit.title)}
                    </span>
                    
                    {/* Title and Description */}
                    <div>
                      <div className="relative">
                        <motion.span
                          className={`text-lg font-semibold ${isCompleted ? 'text-muted-foreground' : 'text-foreground'}`}
                          initial={false}
                          animate={{ opacity: isCompleted ? 0.7 : 1 }}
                        >
                          {habit.title}
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
                      <div className="relative">
                        <motion.span
                          className={`text-sm ${isCompleted ? 'text-muted-foreground' : 'text-muted-foreground'}`}
                          initial={false}
                          animate={{ opacity: isCompleted ? 0.7 : 1 }}
                        >
                          {habit.target_value} {habit.unit} • +10 DP
                        </motion.span>
                        {isCompleted && (
                          <motion.div
                            className="absolute top-1/2 left-0 right-0 h-0.5 bg-muted-foreground"
                            initial={{ scaleX: 0, originX: 0 }}
                            animate={{ scaleX: 1 }}
                            transition={{ duration: 0.3, delay: 0.1 }}
                          />
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {habit.description}
                      </div>
                    </div>
                  </div>
                  
                  {/* Toggle Button */}
                  <Button
                    className={`h-12 w-12 rounded-full flex items-center justify-center ${
                      isCompleted
                        ? 'bg-muted hover:bg-muted/80'
                        : 'bg-saffron hover:bg-saffron/80'
                    }`}
                    onClick={() => handleToggleHabit(habit)}
                  >
                    {isCompleted ? (
                      <Check className="h-6 w-6 text-foreground" />
                    ) : (
                      <Plus className="h-6 w-6 text-white" />
                    )}
                  </Button>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {/* Add Custom Quest Button */}
          <motion.div variants={itemVariants}>
            <Button
              variant="outline"
              className="w-full rounded-3xl py-6 border-2 border-dashed border-border bg-card text-foreground hover:bg-muted hover:text-foreground flex items-center justify-center gap-2"
              onClick={() => setShowAddDialog(true)}
            >
              <Plus className="h-6 w-6" />
              Add custom quest
            </Button>
          </motion.div>
        </div>

        {habits.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No quests yet. Add your first quest!</p>
          </div>
        )}

        {/* Add Quest Dialog */}
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogContent className="max-w-[320px]">
            <DialogHeader>
              <DialogTitle className="font-display">Add New Quest</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="title">Quest Name</Label>
                <Input
                  id="title"
                  placeholder="e.g., Morning Walk"
                  value={newHabit.title}
                  onChange={(e) => setNewHabit({ ...newHabit, title: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  placeholder="e.g., Walk for 30 minutes"
                  value={newHabit.description}
                  onChange={(e) => setNewHabit({ ...newHabit, description: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="target">Target</Label>
                  <Input
                    id="target"
                    type="number"
                    min={1}
                    value={newHabit.target_value}
                    onChange={(e) => setNewHabit({ ...newHabit, target_value: parseInt(e.target.value) || 1 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="unit">Unit</Label>
                  <Input
                    id="unit"
                    placeholder="e.g., min, L"
                    value={newHabit.unit}
                    onChange={(e) => setNewHabit({ ...newHabit, unit: e.target.value })}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                Cancel
              </Button>
              <Button variant="saffron" onClick={handleAddHabit}>
                Add Quest
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Quest Dialog */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="max-w-[320px]">
            <DialogHeader>
              <DialogTitle className="font-display">Edit Quest</DialogTitle>
            </DialogHeader>
            {editingHabit && (
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-title">Quest Name</Label>
                  <Input
                    id="edit-title"
                    value={editingHabit.title}
                    onChange={(e) => setEditingHabit({ ...editingHabit, title: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-description">Description</Label>
                  <Input
                    id="edit-description"
                    value={editingHabit.description}
                    onChange={(e) => setEditingHabit({ ...editingHabit, description: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-target">Target</Label>
                    <Input
                      id="edit-target"
                      type="number"
                      min={1}
                      value={editingHabit.target_value}
                      onChange={(e) => setEditingHabit({ ...editingHabit, target_value: parseInt(e.target.value) || 1 })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-unit">Unit</Label>
                    <Input
                      id="edit-unit"
                      value={editingHabit.unit}
                      onChange={(e) => setEditingHabit({ ...editingHabit, unit: e.target.value })}
                    />
                  </div>
                </div>
                <Button
                  variant="outline"
                  className="w-full text-destructive border-destructive/30 hover:bg-destructive/10"
                  onClick={() => {
                    setShowEditDialog(false);
                    setShowDeleteDialog(true);
                  }}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Quest
                </Button>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                Cancel
              </Button>
              <Button variant="saffron" onClick={handleEditHabit}>
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Quest?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete "{editingHabit?.title}". This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={handleDeleteHabit}
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Level Up Celebration */}
        <LevelUpCelebration
          isOpen={showLevelUp}
          onClose={() => setShowLevelUp(false)}
          newLevel={newLevel}
        />
      </motion.div>
    </MobileLayout>
  );
};

export default Quests;
