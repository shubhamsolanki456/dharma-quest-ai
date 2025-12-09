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
import { Plus, Check, Star, Pencil, Trash2 } from "lucide-react";
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
        await addDharmaPoints(10);
        
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
      <div className="space-y-4 pb-32 p-4">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-xl font-display text-foreground">Daily Quests</h1>
            <p className="text-muted-foreground text-sm">
              {completedCount}/{totalHabits} completed • {completedCount * 10} DP earned
            </p>
          </div>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setShowAddDialog(true)}
            className="h-10 w-10 rounded-full bg-saffron/10 text-saffron hover:bg-saffron/20"
          >
            <Plus className="h-5 w-5" />
          </Button>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-muted rounded-full h-1.5">
          <motion.div 
            className="bg-saffron h-1.5 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>

        {/* Quest List */}
        <div className="space-y-3">
          <AnimatePresence>
            {habits.map((habit, index) => {
              const isCompleted = completedHabits.includes(habit.id);
              
              return (
                <motion.div
                  key={habit.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-card border border-border rounded-xl p-4 transition-all hover:scale-[1.01]"
                >
                  <div className="flex items-start gap-3">
                    {/* Checkbox */}
                    <button
                      onClick={() => handleToggleHabit(habit)}
                      className={`mt-0.5 h-6 w-6 rounded-full border-2 flex items-center justify-center transition-all ${
                        isCompleted 
                          ? 'bg-saffron border-saffron' 
                          : 'border-muted-foreground hover:border-saffron'
                      }`}
                    >
                      {isCompleted && <Check className="h-4 w-4 text-white" />}
                    </button>
                    
                    {/* Content */}
                    <div 
                      className="flex-1 cursor-pointer"
                      onClick={() => handleToggleHabit(habit)}
                    >
                      <h4 className={`font-medium ${isCompleted ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
                        {habit.title}
                      </h4>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {habit.description}
                      </p>
                    </div>
                    
                    {/* Points & Actions */}
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1 text-dharma">
                        <Star className="h-4 w-4 fill-current" />
                        <span className="text-sm font-medium">+10</span>
                      </div>
                      <div className="flex items-center">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingHabit(habit);
                            setShowEditDialog(true);
                          }}
                        >
                          <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingHabit(habit);
                            setShowDeleteDialog(true);
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {habits.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No quests yet. Add your first quest!</p>
          </div>
        )}

        {/* Add Habit Dialog */}
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogContent className="max-w-[320px] p-4">
            <DialogHeader>
              <DialogTitle className="text-lg">Add New Habit</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <Input
                placeholder="Habit name (e.g., Drink Water)"
                value={newHabit.title}
                onChange={(e) => setNewHabit({ ...newHabit, title: e.target.value })}
              />
              <Input
                placeholder="Description (optional)"
                value={newHabit.description}
                onChange={(e) => setNewHabit({ ...newHabit, description: e.target.value })}
              />
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="Target"
                  value={newHabit.target_value}
                  onChange={(e) => setNewHabit({ ...newHabit, target_value: parseInt(e.target.value) || 1 })}
                  className="w-20"
                />
                <Input
                  placeholder="Unit (L, min, etc.)"
                  value={newHabit.unit}
                  onChange={(e) => setNewHabit({ ...newHabit, unit: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowAddDialog(false)}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleAddHabit}>
                Add Habit
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Habit Dialog */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="max-w-[320px] p-4">
            <DialogHeader>
              <DialogTitle className="text-lg">Edit Habit</DialogTitle>
            </DialogHeader>
            {editingHabit && (
              <div className="space-y-3">
                <Input
                  placeholder="Habit name"
                  value={editingHabit.title}
                  onChange={(e) => setEditingHabit({ ...editingHabit, title: e.target.value })}
                />
                <Input
                  placeholder="Description"
                  value={editingHabit.description}
                  onChange={(e) => setEditingHabit({ ...editingHabit, description: e.target.value })}
                />
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="Target"
                    value={editingHabit.target_value}
                    onChange={(e) => setEditingHabit({ ...editingHabit, target_value: parseInt(e.target.value) || 1 })}
                    className="w-20"
                  />
                  <Input
                    placeholder="Unit"
                    value={editingHabit.unit}
                    onChange={(e) => setEditingHabit({ ...editingHabit, unit: e.target.value })}
                  />
                </div>
              </div>
            )}
            <DialogFooter className="gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowEditDialog(false)}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleEditHabit}>
                Save
              </Button>
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
      </div>
    </MobileLayout>
  );
};

export default Quests;