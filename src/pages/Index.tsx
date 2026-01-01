import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import { useProfile } from '@/hooks/useProfile';
import Landing from './Landing';

const Index = () => {
  const { user, loading: authLoading } = useAuth();
  const { subscription, loading: subLoading, hasActiveAccess, isPaidSubscriber } = useSubscription();
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

    // SCENARIO 5: Paid subscriber with active access → Dashboard
    if (isPaidSubscriber() && hasActiveAccess()) {
      navigate('/dashboard');
      return;
    }

    // SCENARIO 6: Trial user flow
    if (subscription.plan_type === 'trial') {
      const trialActivated = localStorage.getItem('trial_activated') === 'true';
      
      // Trial not activated → Start Free Trial page
      if (!trialActivated) {
        navigate('/start-free-trial');
        return;
      }
      
      // Trial activated and active → Dashboard
      if (hasActiveAccess()) {
        navigate('/dashboard');
        return;
      }
      
      // Trial expired → Pricing
      navigate('/pricing');
      return;
    }

    // SCENARIO 7: Paid subscription expired → Pricing
    if (!hasActiveAccess()) {
      navigate('/pricing');
      return;
    }

    // Default: Dashboard
    navigate('/dashboard');
  }, [user, profile, subscription, authLoading, subLoading, profileLoading, navigate, hasActiveAccess, isPaidSubscriber]);

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
