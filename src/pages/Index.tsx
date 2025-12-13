import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import Landing from './Landing';

const Index = () => {
  const { user, loading: authLoading } = useAuth();
  const { subscription, loading: subLoading, hasActiveAccess } = useSubscription();
  const navigate = useNavigate();

  useEffect(() => {
    if (authLoading || subLoading) return;

    // User is logged in
    if (user) {
      // Has subscription and completed onboarding and has access - go to dashboard
      if (subscription?.has_completed_onboarding && hasActiveAccess()) {
        navigate('/dashboard');
        return;
      }
      
      // Has subscription but not completed onboarding - go to onboarding
      if (subscription && !subscription.has_completed_onboarding) {
        navigate('/onboarding');
        return;
      }

      // No subscription yet - go to onboarding to create one
      if (!subscription) {
        navigate('/onboarding');
        return;
      }

      // Trial/subscription expired - go to pricing
      if (!hasActiveAccess()) {
        navigate('/pricing');
        return;
      }
    }
  }, [user, subscription, authLoading, subLoading, navigate, hasActiveAccess]);

  // Show loading while checking auth
  if (authLoading || subLoading) {
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
