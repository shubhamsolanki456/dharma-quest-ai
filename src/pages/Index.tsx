import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import { useProfile } from '@/hooks/useProfile';
import Landing from './Landing';

// Helper function to check if trial has expired
const isTrialExpired = (subscription: any): boolean => {
  if (!subscription?.trial_end_date) return false;
  if (subscription.plan_type !== 'trial') return false;
  return new Date(subscription.trial_end_date) < new Date();
};

const Index = () => {
  const { user, loading: authLoading } = useAuth();
  const { subscription, loading: subLoading, hasActiveAccess, isSubscriptionExpired } = useSubscription();
  const { profile, loading: profileLoading } = useProfile();
  const navigate = useNavigate();

  useEffect(() => {
    if (authLoading || subLoading || profileLoading) return;

    // SCENARIO 1: Not logged in → Show Landing Page
    if (!user) {
      return; // Show landing page (handled by return below)
    }

    // SCENARIO 2: Logged in but no profile yet → Go to Onboarding
    if (!profile) {
      navigate('/onboarding');
      return;
    }

    // SCENARIO 3: No subscription yet → Go to Onboarding
    if (!subscription) {
      navigate('/onboarding');
      return;
    }

    // SCENARIO 4: Has subscription but NOT completed onboarding → Go to Onboarding
    if (!subscription.has_completed_onboarding) {
      navigate('/onboarding');
      return;
    }

    // SCENARIO 5: Completed onboarding but hasn't activated free trial → Go to Activate Trial
    const trialActivated = localStorage.getItem('trial_activated') === 'true';
    if (!trialActivated) {
      navigate('/start-free-trial');
      return;
    }

    // SCENARIO 6: Has trial/premium but trial has EXPIRED → Go to Pricing/Paywall
    if (isTrialExpired(subscription) || isSubscriptionExpired()) {
      navigate('/pricing');
      return;
    }

    // SCENARIO 7: Everything is good (completed onboarding + active trial/premium) → Dashboard
    if (hasActiveAccess()) {
      navigate('/dashboard');
      return;
    }

    // Default fallback: show pricing
    navigate('/pricing');
  }, [user, profile, subscription, authLoading, subLoading, profileLoading, navigate, hasActiveAccess, isSubscriptionExpired]);

  // Show loading while checking auth and profile
  if (authLoading || subLoading || profileLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Show landing page for unauthenticated users
  return <Landing />;
};

export default Index;
