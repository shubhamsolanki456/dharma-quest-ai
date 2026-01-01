import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';

type PlanType = 'trial' | 'weekly' | 'monthly' | 'yearly';

interface Subscription {
  id: string;
  user_id: string;
  plan_type: PlanType;
  trial_start_date: string;
  trial_end_date: string;
  subscription_start_date: string | null;
  subscription_end_date: string | null;
  is_active: boolean;
  has_completed_onboarding: boolean;
}

export const useSubscription = () => {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSubscription = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      if (data) {
        setSubscription({ ...data, plan_type: data.plan_type as PlanType });
      }
    } catch (error) {
      console.error('Error fetching subscription:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchSubscription();
  }, [fetchSubscription]);

  const createTrialSubscription = async () => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('user_subscriptions')
        .insert({
          user_id: user.id,
          plan_type: 'trial',
          is_active: true,
          has_completed_onboarding: false
        })
        .select()
        .single();

      if (error) throw error;
      if (data) {
        setSubscription({ ...data, plan_type: data.plan_type as PlanType });
      }
      return data;
    } catch (error) {
      console.error('Error creating trial subscription:', error);
      return null;
    }
  };

  const completeOnboarding = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('user_subscriptions')
        .update({ has_completed_onboarding: true })
        .eq('user_id', user.id);

      if (error) throw error;
      setSubscription(prev => (prev ? { ...prev, has_completed_onboarding: true } : prev));
    } catch (error) {
      console.error('Error completing onboarding:', error);
    }
  };

  const subscribeToPlan = async (planType: 'weekly' | 'monthly' | 'yearly') => {
    if (!user) return false;

    const durationDays = planType === 'weekly' ? 7 : planType === 'monthly' ? 30 : 365;
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + durationDays);

    try {
      const { data, error } = await supabase
        .from('user_subscriptions')
        .upsert({
          user_id: user.id,
          plan_type: planType,
          subscription_start_date: new Date().toISOString(),
          subscription_end_date: endDate.toISOString(),
          is_active: true,
          has_completed_onboarding: subscription?.has_completed_onboarding ?? true
        }, { onConflict: 'user_id' })
        .select()
        .single();

      if (error) throw error;
      if (data) {
        setSubscription({ ...data, plan_type: data.plan_type as PlanType });
      }
      return true;
    } catch (error) {
      console.error('Error subscribing to plan:', error);
      return false;
    }
  };

  const isTrialExpired = (): boolean => {
    if (!subscription) return false;
    if (subscription.plan_type !== 'trial') return false;
    
    const trialEnd = new Date(subscription.trial_end_date);
    return new Date() > trialEnd;
  };

  const isSubscriptionExpired = (): boolean => {
    if (!subscription) return true;
    if (subscription.plan_type === 'trial') return isTrialExpired();
    
    if (!subscription.subscription_end_date) return true;
    const subEnd = new Date(subscription.subscription_end_date);
    return new Date() > subEnd;
  };

  // Check if user has a PAID subscription (not trial)
  const isPaidSubscriber = (): boolean => {
    if (!subscription) return false;
    return subscription.plan_type !== 'trial';
  };

  const hasActiveAccess = (): boolean => {
    if (!subscription) return false;
    if (!subscription.is_active) return false;
    
    if (subscription.plan_type === 'trial') {
      return !isTrialExpired();
    }
    
    // For paid plans, check if subscription is still valid
    return !isSubscriptionExpired();
  };

  const getDaysRemaining = (): number => {
    if (!subscription) return 0;
    
    const endDate = subscription.plan_type === 'trial' 
      ? new Date(subscription.trial_end_date)
      : subscription.subscription_end_date 
        ? new Date(subscription.subscription_end_date)
        : new Date();
    
    const now = new Date();
    const diffTime = endDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  const cancelSubscription = async (): Promise<boolean> => {
    if (!user || !subscription) return false;
    
    // Only allow cancellation for paid plans, not trial
    if (subscription.plan_type === 'trial') return false;

    try {
      // Set is_active to false - subscription continues until end date, then no renewal
      const { error } = await supabase
        .from('user_subscriptions')
        .update({ is_active: false })
        .eq('user_id', user.id);

      if (error) throw error;
      
      setSubscription(prev => prev ? { ...prev, is_active: false } : prev);
      return true;
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      return false;
    }
  };

  const isCancelled = (): boolean => {
    if (!subscription) return false;
    if (subscription.plan_type === 'trial') return false;
    return !subscription.is_active;
  };

  return {
    subscription,
    loading,
    createTrialSubscription,
    completeOnboarding,
    subscribeToPlan,
    cancelSubscription,
    isTrialExpired,
    isSubscriptionExpired,
    hasActiveAccess,
    isPaidSubscriber,
    getDaysRemaining,
    isCancelled,
    refetch: fetchSubscription
  };
};
