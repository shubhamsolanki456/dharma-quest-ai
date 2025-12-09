import { useEffect, useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useHaptics } from "@/hooks/useHaptics";
import { MobileLayout } from "@/components/MobileLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Check, MoreVertical, Trash2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import { LevelUpCelebration } from "@/components/LevelUpCelebration";
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

// Default habits
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
        setHabits(data.map(h => ({
          id: h.id,
          title: h.title,
          description: h.description || '',
          icon: h.icon || '⭐',
          target_value: h.target_value || 1,
          unit: h.unit || ''
        })));
      } else {
        // Initialize with default habits
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
        
        // Check for level up
        if (result.leveledUp && result.newLevel) {
          setNewLevel(result.newLevel);
          setShowLevelUp(true);
        }
        
        toast({ 
          title: `+10 Dharma Points earned! 🙏`,
          description: `${habit.title} completed!`
        });
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

  if (loading || !user || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <MobileLayout currentPage="/quests">
      <div className="space-y-6 pb-32 p-4">
        {/* Header */}
        <div className="flex justify-between items-center">
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
        </div>

        {/* Quest List */}
        <div className="space-y-4">
          <AnimatePresence>
            {habits.map((habit, index) => {
              const isCompleted = completedHabits.includes(habit.id);
              
              return (
                <motion.div
                  key={habit.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
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
          <Button
            variant="outline"
            className="w-full rounded-3xl py-6 border-2 border-dashed border-border bg-card text-foreground hover:bg-muted hover:text-foreground flex items-center justify-center gap-2"
            onClick={() => setShowAddDialog(true)}
          >
            <Plus className="h-6 w-6" />
            Add custom quest
          </Button>
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
              <DialogTitle>Add Custom Quest</DialogTitle>
              <p className="text-sm text-muted-foreground">
                Track a new quest that matters to you
              </p>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label className="text-muted-foreground">Quest Name</Label>
                <Input
                  placeholder="e.g., Drink Water"
                  value={newHabit.title}
                  onChange={(e) => setNewHabit({ ...newHabit, title: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-muted-foreground">Target/Duration</Label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="Target"
                    value={newHabit.target_value}
                    onChange={(e) => setNewHabit({ ...newHabit, target_value: parseInt(e.target.value) || 1 })}
                    className="w-24"
                  />
                  <Input
                    placeholder="Unit (L, min, etc.)"
                    value={newHabit.unit}
                    onChange={(e) => setNewHabit({ ...newHabit, unit: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>Emoji:</span>
                <span className="text-xl">
                  {newHabit.title ? getAutoEmoji(newHabit.title) : '⭐'}
                </span>
                <span className="text-xs text-muted-foreground">
                  (auto-selected based on name)
                </span>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddHabit} className="bg-saffron hover:bg-saffron/80 text-white">
                Add Quest
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Quest Dialog */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="max-w-[320px]">
            <DialogHeader>
              <DialogTitle>Edit Quest</DialogTitle>
              <p className="text-sm text-muted-foreground">
                Update the quest information as needed
              </p>
            </DialogHeader>
            {editingHabit && (
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Quest Name</Label>
                  <Input
                    placeholder="Quest name"
                    value={editingHabit.title}
                    onChange={(e) => setEditingHabit({ ...editingHabit, title: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Target/Duration</Label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      placeholder="Target"
                      value={editingHabit.target_value}
                      onChange={(e) => setEditingHabit({ ...editingHabit, target_value: parseInt(e.target.value) || 1 })}
                      className="w-24"
                    />
                    <Input
                      placeholder="Unit"
                      value={editingHabit.unit}
                      onChange={(e) => setEditingHabit({ ...editingHabit, unit: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            )}
            <DialogFooter className="flex items-center justify-between">
              <button
                onClick={() => {
                  setShowEditDialog(false);
                  setShowDeleteDialog(true);
                }}
                className="text-destructive hover:text-destructive/80"
                title="Delete"
              >
                <Trash2 className="h-5 w-5" />
              </button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleEditHabit} className="bg-saffron hover:bg-saffron/80 text-white">
                  Save
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent className="max-w-[320px] p-4">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-lg">Delete Habit?</AlertDialogTitle>
              <AlertDialogDescription className="text-sm">
                This will permanently delete "{editingHabit?.title}".
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="gap-2">
              <AlertDialogCancel className="h-9">Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteHabit} className="bg-destructive text-destructive-foreground h-9">
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
      </div>
    </MobileLayout>
  );
};

export default Quests;