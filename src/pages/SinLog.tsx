import { useEffect, useState, useCallback } from "react";
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
  Plus, AlertTriangle, Trash2, RefreshCw, Heart, X
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

interface SinLog {
  id: string;
  sin_type: string;
  description: string | null;
  logged_at: string;
}

const sinTypes = [
  { id: 'anger', label: 'Anger (Krodha)', icon: '😠', description: 'Lost temper or got angry' },
  { id: 'greed', label: 'Greed (Lobha)', icon: '💰', description: 'Excessive desire for material things' },
  { id: 'lust', label: 'Lust (Kama)', icon: '💔', description: 'Inappropriate desires or thoughts' },
  { id: 'attachment', label: 'Attachment (Moha)', icon: '🔗', description: 'Excessive attachment to worldly things' },
  { id: 'pride', label: 'Pride (Mada)', icon: '👑', description: 'Arrogance or ego' },
  { id: 'jealousy', label: 'Jealousy (Matsarya)', icon: '💚', description: 'Envy of others' },
  { id: 'lying', label: 'Lying (Asatya)', icon: '🤥', description: 'Speaking untruth' },
  { id: 'violence', label: 'Violence (Himsa)', icon: '👊', description: 'Harmful actions or words' },
  { id: 'other', label: 'Other', icon: '⚠️', description: 'Other wrongful action' },
];

const SinLog = () => {
  const { user, loading } = useAuth();
  const { profile, updateProfile, refetch } = useProfile();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [sinLogs, setSinLogs] = useState<SinLog[]>([]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [selectedSin, setSelectedSin] = useState<string | null>(null);
  const [deletingLog, setDeletingLog] = useState<SinLog | null>(null);
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  const loadSinLogs = useCallback(async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('sin_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('logged_at', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      
      setSinLogs(data || []);
    } catch (error) {
      console.error('Error loading sin logs:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      loadSinLogs();
    }
  }, [user, loadSinLogs]);

  const handleLogSin = async () => {
    if (!selectedSin || !user) {
      toast({ title: 'Please select a sin type', variant: 'destructive' });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('sin_logs')
        .insert({
          user_id: user.id,
          sin_type: selectedSin,
          description: description || null
        })
        .select()
        .single();

      if (error) throw error;

      // Reset sin-free streak to 0 and refetch to update UI
      await updateProfile({ sin_free_streak: 0 });
      refetch(); // Force refetch to clear cache and get fresh data

      setSinLogs(prev => [data, ...prev]);
      setShowAddDialog(false);
      setSelectedSin(null);
      setDescription('');
      
      toast({ 
        title: 'Sin logged',
        description: 'Your sin-free streak has been reset. Use this as motivation to stay strong! 🙏'
      });
    } catch (error) {
      console.error('Error logging sin:', error);
      toast({ title: 'Failed to log sin', variant: 'destructive' });
    }
  };

  const handleDeleteLog = async () => {
    if (!deletingLog || !user) return;

    try {
      const { error } = await supabase
        .from('sin_logs')
        .delete()
        .eq('id', deletingLog.id)
        .eq('user_id', user.id);

      if (error) throw error;

      setSinLogs(prev => prev.filter(l => l.id !== deletingLog.id));
      setShowDeleteDialog(false);
      setDeletingLog(null);
      toast({ title: 'Log deleted' });
    } catch (error) {
      console.error('Error deleting log:', error);
      toast({ title: 'Failed to delete log', variant: 'destructive' });
    }
  };

  const handleResetStreak = async () => {
    if (!user) return;

    try {
      await updateProfile({ sin_free_streak: 0 });
      refetch(); // Force refetch to clear cache and get fresh data
      setShowResetDialog(false);
      toast({ 
        title: 'Streak reset',
        description: 'Your sin-free streak has been reset to 0.'
      });
    } catch (error) {
      console.error('Error resetting streak:', error);
      toast({ title: 'Failed to reset streak', variant: 'destructive' });
    }
  };

  const getSinTypeInfo = (sinType: string) => {
    return sinTypes.find(s => s.id === sinType) || { label: sinType, icon: '⚠️' };
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', { 
      day: 'numeric', 
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading || !user || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <MobileLayout currentPage="/sin-log">
      <div className="space-y-5 pb-20 p-4">
        {/* Header Card */}
        <motion.div
          className="card-3d rounded-2xl p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
                <Heart className="h-6 w-6 text-red-500" />
              </div>
              <div>
                <h2 className="text-2xl font-display text-foreground">Sin-Free Journey</h2>
                <p className="text-sm text-muted-foreground">Track and overcome your weaknesses</p>
              </div>
            </div>
          </div>

          {/* Current Streak */}
          <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-xl p-4 mb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Current Sin-Free Streak</p>
                <p className="text-3xl font-display text-green-500">
                  {profile?.sin_free_streak || 0} days
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowResetDialog(true)}
                className="gap-1 text-destructive border-destructive/30"
              >
                <RefreshCw className="h-4 w-4" />
                Reset
              </Button>
            </div>
          </div>

          {/* Log Sin Button */}
          <Button
            className="w-full gap-2 bg-red-500 hover:bg-red-600 text-white"
            onClick={() => setShowAddDialog(true)}
          >
            <AlertTriangle className="h-4 w-4" />
            Log a Sin
          </Button>
        </motion.div>

        {/* Recent Logs */}
        <motion.div
          className="card-3d rounded-2xl p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h3 className="text-lg font-display text-foreground mb-4">Recent Logs</h3>
          
          {sinLogs.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No sins logged yet. Stay strong! 🙏</p>
            </div>
          ) : (
            <div className="space-y-3">
              {sinLogs.map((log) => {
                const sinInfo = getSinTypeInfo(log.sin_type);
                return (
                  <motion.div
                    key={log.id}
                    className="bg-card rounded-xl p-4 flex items-start justify-between border border-border"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">{sinInfo.icon}</span>
                      <div>
                        <p className="font-medium text-foreground">{sinInfo.label}</p>
                        {log.description && (
                          <p className="text-sm text-muted-foreground">{log.description}</p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">{formatDate(log.logged_at)}</p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => {
                        setDeletingLog(log);
                        setShowDeleteDialog(true);
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>

        {/* Add Sin Dialog */}
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogContent className="max-w-[340px] p-4">
            <DialogHeader>
              <DialogTitle className="text-lg">Log a Sin</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Acknowledging our mistakes is the first step to overcoming them.
              </p>
              
              {/* Sin Type Selection */}
              <div className="grid grid-cols-3 gap-2">
                {sinTypes.map((sin) => (
                  <button
                    key={sin.id}
                    onClick={() => setSelectedSin(sin.id)}
                    className={`p-3 rounded-xl text-center transition-all ${
                      selectedSin === sin.id
                        ? 'bg-red-500/20 border-2 border-red-500'
                        : 'bg-muted border-2 border-transparent'
                    }`}
                  >
                    <span className="text-2xl block mb-1">{sin.icon}</span>
                    <span className="text-xs text-foreground">{sin.label.split(' ')[0]}</span>
                  </button>
                ))}
              </div>

              {selectedSin && (
                <Textarea
                  placeholder="Add notes (optional)"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                />
              )}
            </div>
            <DialogFooter className="gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowAddDialog(false)}>
                Cancel
              </Button>
              <Button 
                size="sm" 
                onClick={handleLogSin}
                className="bg-red-500 hover:bg-red-600"
                disabled={!selectedSin}
              >
                Log Sin
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation */}
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent className="max-w-[320px] p-4">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-lg">Delete Log?</AlertDialogTitle>
              <AlertDialogDescription className="text-sm">
                This will permanently delete this sin log.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="gap-2">
              <AlertDialogCancel className="h-9">Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteLog} className="bg-destructive text-destructive-foreground h-9">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Reset Streak Confirmation */}
        <AlertDialog open={showResetDialog} onOpenChange={setShowResetDialog}>
          <AlertDialogContent className="max-w-[320px] p-4">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-lg">Reset Streak?</AlertDialogTitle>
              <AlertDialogDescription className="text-sm">
                This will reset your sin-free streak to 0. Are you sure?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="gap-2">
              <AlertDialogCancel className="h-9">Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleResetStreak} className="bg-destructive text-destructive-foreground h-9">
                Reset
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </MobileLayout>
  );
};

export default SinLog;