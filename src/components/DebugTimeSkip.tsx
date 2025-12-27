import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Clock, FastForward, RotateCcw, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const DebugTimeSkip = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const { subscription, refetch, getDaysRemaining } = useSubscription();

  const skipDays = async (days: number) => {
    if (!user || !subscription) {
      toast.error('No subscription found');
      return;
    }

    setIsLoading(true);

    try {
      // Calculate new dates by subtracting days from trial_end_date
      const updates: Record<string, string> = {};

      if (subscription.plan_type === 'trial' && subscription.trial_end_date) {
        const newTrialEnd = new Date(subscription.trial_end_date);
        newTrialEnd.setDate(newTrialEnd.getDate() - days);
        updates.trial_end_date = newTrialEnd.toISOString();
      }

      if (subscription.subscription_end_date) {
        const newSubEnd = new Date(subscription.subscription_end_date);
        newSubEnd.setDate(newSubEnd.getDate() - days);
        updates.subscription_end_date = newSubEnd.toISOString();
      }

      if (Object.keys(updates).length === 0) {
        toast.error('No dates to update');
        setIsLoading(false);
        return;
      }

      const { error } = await supabase
        .from('user_subscriptions')
        .update(updates)
        .eq('user_id', user.id);

      if (error) throw error;

      await refetch();
      toast.success(`Simulated ${days} day(s) passing`, {
        description: `Time skipped forward by ${days} day(s)`
      });
    } catch (error) {
      console.error('Error skipping time:', error);
      toast.error('Failed to skip time');
    } finally {
      setIsLoading(false);
    }
  };

  const resetTrial = async () => {
    if (!user) {
      toast.error('Not logged in');
      return;
    }

    setIsLoading(true);

    try {
      const now = new Date();
      const trialEnd = new Date();
      trialEnd.setDate(trialEnd.getDate() + 7);

      const { error } = await supabase
        .from('user_subscriptions')
        .update({
          plan_type: 'trial',
          trial_start_date: now.toISOString(),
          trial_end_date: trialEnd.toISOString(),
          subscription_start_date: null,
          subscription_end_date: null,
          is_active: true,
        })
        .eq('user_id', user.id);

      if (error) throw error;

      await refetch();
      toast.success('Trial reset to 7 days');
    } catch (error) {
      console.error('Error resetting trial:', error);
      toast.error('Failed to reset trial');
    } finally {
      setIsLoading(false);
    }
  };

  const daysRemaining = getDaysRemaining();

  return (
    <>
      {/* Floating Debug Button */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className="fixed bottom-24 right-4 z-50 w-12 h-12 rounded-full bg-amber-500 text-white shadow-lg flex items-center justify-center"
        onClick={() => setIsOpen(!isOpen)}
        whileTap={{ scale: 0.9 }}
      >
        <Clock className="h-5 w-5" />
      </motion.button>

      {/* Debug Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-40 right-4 z-50 w-72"
          >
            <Card className="p-4 bg-card/95 backdrop-blur-md border-amber-500/30 shadow-xl">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-display text-sm flex items-center gap-2">
                  <Clock className="h-4 w-4 text-amber-500" />
                  Debug Time Skip
                </h3>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => setIsOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Current Status */}
              <div className="bg-secondary/50 rounded-lg p-3 mb-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Plan</span>
                  <Badge variant="secondary" className="text-xs">
                    {subscription?.plan_type || 'None'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-sm mt-1">
                  <span className="text-muted-foreground">Days Left</span>
                  <span className={`font-medium ${daysRemaining <= 1 ? 'text-destructive' : daysRemaining <= 3 ? 'text-amber-500' : 'text-green-500'}`}>
                    {daysRemaining} days
                  </span>
                </div>
                {subscription?.trial_end_date && (
                  <div className="flex items-center justify-between text-sm mt-1">
                    <span className="text-muted-foreground">End Date</span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(subscription.plan_type === 'trial' 
                        ? subscription.trial_end_date 
                        : subscription.subscription_end_date || subscription.trial_end_date
                      ).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>

              {/* Skip Buttons */}
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground mb-2">
                  Simulate time passing:
                </p>
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => skipDays(1)}
                    disabled={isLoading}
                    className="text-xs"
                  >
                    <FastForward className="h-3 w-3 mr-1" />
                    +1d
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => skipDays(3)}
                    disabled={isLoading}
                    className="text-xs"
                  >
                    <FastForward className="h-3 w-3 mr-1" />
                    +3d
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => skipDays(7)}
                    disabled={isLoading}
                    className="text-xs"
                  >
                    <FastForward className="h-3 w-3 mr-1" />
                    +7d
                  </Button>
                </div>

                <Button
                  variant="secondary"
                  size="sm"
                  onClick={resetTrial}
                  disabled={isLoading}
                  className="w-full text-xs mt-2"
                >
                  <RotateCcw className="h-3 w-3 mr-2" />
                  Reset to 7-Day Trial
                </Button>
              </div>

              <p className="text-[10px] text-muted-foreground mt-3 text-center">
                ⚠️ Debug only - modifies database
              </p>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
