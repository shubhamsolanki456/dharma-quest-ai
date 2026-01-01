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

export const PaywallGuard = ({ children }: PaywallGuardProps) => {
  const { user, loading: authLoading } = useAuth();
  const { subscription, loading: subLoading, hasActiveAccess, isPaidSubscriber } = useSubscription();
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
      if (location.pathname !== '/onboarding' && !isPublicRoute) {
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

    // SCENARIO 4: Paid subscriber with active access → Allow all routes, redirect from setup pages to dashboard
    if (isPaidSubscriber() && hasActiveAccess()) {
      if (location.pathname === '/onboarding' || 
          location.pathname === '/start-free-trial' || 
          location.pathname === '/start-trial' ||
          location.pathname === '/') {
        navigate('/dashboard');
      }
      return;
    }

    // SCENARIO 5: Trial user - check if trial was activated via localStorage
    if (subscription.plan_type === 'trial') {
      const trialActivated = localStorage.getItem('trial_activated') === 'true';
      const trialEnd = new Date(subscription.trial_end_date);
      const isTrialValid = new Date() < trialEnd;
      
      // Trial not activated yet → Go to Start Free Trial
      if (!trialActivated) {
        if (!isPublicRoute && !isAuthOnlyRoute) {
          navigate('/start-free-trial');
        }
        return;
      }
      
      // Trial activated but expired → Go to Pricing
      if (!isTrialValid) {
        if (!isPublicRoute && !isAuthOnlyRoute) {
          navigate('/pricing');
        }
        return;
      }
      
      // Trial is active → redirect from setup pages to dashboard
      if (location.pathname === '/onboarding' || 
          location.pathname === '/start-free-trial' || 
          location.pathname === '/start-trial' ||
          location.pathname === '/') {
        navigate('/dashboard');
      }
      return;
    }

    // SCENARIO 6: Paid subscription but expired → Go to Pricing
    if (!hasActiveAccess()) {
      if (!isPublicRoute && !isAuthOnlyRoute) {
        navigate('/pricing');
      }
    }
  }, [user, subscription, authLoading, subLoading, location.pathname, navigate, hasActiveAccess, isPaidSubscriber]);

  if (authLoading || subLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return <>{children}</>;
};
