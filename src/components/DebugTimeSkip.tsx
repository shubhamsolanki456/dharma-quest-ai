import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Clock, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export const DebugTimeSkip = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const skipDays = async (days: number) => {
    if (!user) return;
    setIsProcessing(true);

    try {
      // Get current subscription
      const { data: subscription, error: fetchError } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (fetchError) throw fetchError;
      if (!subscription) {
        toast({ title: 'No subscription found', variant: 'destructive' });
        return;
      }

      // Calculate new dates by subtracting days (simulating time passed)
      const newTrialEnd = new Date(subscription.trial_end_date);
      newTrialEnd.setDate(newTrialEnd.getDate() - days);

      const newTrialStart = new Date(subscription.trial_start_date);
      newTrialStart.setDate(newTrialStart.getDate() - days);

      let updateData: Record<string, string | null> = {
        trial_end_date: newTrialEnd.toISOString(),
        trial_start_date: newTrialStart.toISOString(),
      };

      // Also update subscription dates if they exist
      if (subscription.subscription_end_date) {
        const newSubEnd = new Date(subscription.subscription_end_date);
        newSubEnd.setDate(newSubEnd.getDate() - days);
        updateData.subscription_end_date = newSubEnd.toISOString();
      }

      if (subscription.subscription_start_date) {
        const newSubStart = new Date(subscription.subscription_start_date);
        newSubStart.setDate(newSubStart.getDate() - days);
        updateData.subscription_start_date = newSubStart.toISOString();
      }

      const { error: updateError } = await supabase
        .from('user_subscriptions')
        .update(updateData)
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      toast({ 
        title: `⏰ Simulated ${days} day(s) passing`,
        description: 'Refresh the page to see the effect'
      });

      // Reload page to reflect changes
      setTimeout(() => window.location.reload(), 1000);
    } catch (error) {
      console.error('Error skipping time:', error);
      toast({ title: 'Failed to skip time', variant: 'destructive' });
    } finally {
      setIsProcessing(false);
    }
  };

  if (!user) return null;

  return (
    <div className="fixed bottom-24 right-4 z-50">
      {isOpen ? (
        <div className="bg-card border border-border rounded-xl p-3 shadow-lg space-y-2">
          <div className="flex items-center justify-between gap-4 mb-2">
            <span className="text-xs font-medium text-muted-foreground">Debug: Skip Time</span>
            <button onClick={() => setIsOpen(false)} className="text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="flex flex-col gap-2">
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => skipDays(1)}
              disabled={isProcessing}
              className="text-xs"
            >
              +1 Day
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => skipDays(3)}
              disabled={isProcessing}
              className="text-xs"
            >
              +3 Days
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => skipDays(7)}
              disabled={isProcessing}
              className="text-xs"
            >
              +7 Days (End Trial)
            </Button>
          </div>
        </div>
      ) : (
        <Button
          size="icon"
          variant="outline"
          className="h-10 w-10 rounded-full bg-card shadow-lg border-amber-500/50 text-amber-500"
          onClick={() => setIsOpen(true)}
        >
          <Clock className="h-5 w-5" />
        </Button>
      )}
    </div>
  );
};
