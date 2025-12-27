import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';

interface PaywallGuardProps {
  children: React.ReactNode;
}

// Routes that don't require auth at all
const PUBLIC_ROUTES = ['/', '/landing', '/auth', '/privacy-policy', '/terms-of-service'];
// Routes that require auth but not active subscription
const AUTH_ONLY_ROUTES = ['/onboarding', '/start-free-trial', '/start-trial', '/pricing', '/payment-success'];

// Helper function to check if trial has expired
const isTrialExpired = (subscription: any): boolean => {
  if (!subscription?.trial_end_date) return false;
  if (subscription.plan_type !== 'trial') return false;
  return new Date(subscription.trial_end_date) < new Date();
};

export const PaywallGuard = ({ children }: PaywallGuardProps) => {
  const { user, loading: authLoading } = useAuth();
  const { subscription, loading: subLoading, hasActiveAccess, isSubscriptionExpired } = useSubscription();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (authLoading || subLoading) return;

    const isPublicRoute = PUBLIC_ROUTES.includes(location.pathname);
    const isAuthOnlyRoute = AUTH_ONLY_ROUTES.includes(location.pathname);
    
    // SCENARIO 1: Not logged in → Allow public routes, redirect others to landing
    if (!user) {
      if (!isPublicRoute) {
        navigate('/');
      }
      return;
    }

    // User is logged in from here on
    
    // SCENARIO 2: Logged in but no subscription record → Go to Onboarding
    if (!subscription) {
      if (!isPublicRoute && !isAuthOnlyRoute && location.pathname !== '/onboarding') {
        navigate('/onboarding');
      }
      return;
    }

    // SCENARIO 3: Logged in, has subscription but NOT completed onboarding → Go to Onboarding
    if (!subscription.has_completed_onboarding) {
      if (location.pathname !== '/onboarding' && !isPublicRoute) {
        navigate('/onboarding');
      }
      return;
    }

    // SCENARIO 4: Has trial/premium but trial has EXPIRED → Go to Pricing/Paywall (check BEFORE trial activation)
    if (isTrialExpired(subscription) || isSubscriptionExpired()) {
      if (!isPublicRoute && !isAuthOnlyRoute) {
        navigate('/pricing');
      }
      return;
    }

    // SCENARIO 5: Completed onboarding but hasn't activated free trial → Go to Activate Trial
    const trialActivated = localStorage.getItem('trial_activated') === 'true';
    if (!trialActivated) {
      if (!isPublicRoute && !isAuthOnlyRoute) {
        navigate('/start-free-trial');
      }
      return;
    }

    // SCENARIO 6: Everything is good (completed onboarding + active trial/premium)
    // Auto-redirect from auth-only routes to dashboard
    if (hasActiveAccess() && trialActivated) {
      if (location.pathname === '/onboarding' || 
          location.pathname === '/start-free-trial' || 
          location.pathname === '/start-trial' ||
          location.pathname === '/') {
        navigate('/dashboard');
      }
    }
  }, [user, subscription, authLoading, subLoading, location.pathname, navigate, hasActiveAccess, isSubscriptionExpired]);

  if (authLoading || subLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return <>{children}</>;
};
