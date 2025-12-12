import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';

interface PaywallGuardProps {
  children: React.ReactNode;
}

// Routes that don't require subscription
const PUBLIC_ROUTES = ['/', '/landing', '/auth', '/pricing', '/onboarding', '/start-trial', '/payment-success', '/privacy-policy', '/terms-of-service'];

export const PaywallGuard = ({ children }: PaywallGuardProps) => {
  const { user, loading: authLoading } = useAuth();
  const { subscription, loading: subLoading, hasActiveAccess } = useSubscription();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (authLoading || subLoading) return;

    const isPublicRoute = PUBLIC_ROUTES.includes(location.pathname);
    
    // Not logged in - redirect to landing for protected routes
    if (!user && !isPublicRoute) {
      navigate('/');
      return;
    }

    // Logged in but no subscription - create trial on onboarding
    if (user && !subscription && location.pathname !== '/auth' && location.pathname !== '/onboarding') {
      // Let onboarding handle subscription creation
      if (!isPublicRoute) {
        navigate('/onboarding');
      }
      return;
    }

    // Logged in with subscription
    if (user && subscription) {
      // Not completed onboarding - redirect to onboarding
      if (!subscription.has_completed_onboarding && location.pathname !== '/onboarding') {
        navigate('/onboarding');
        return;
      }

      // Trial/subscription expired - redirect to pricing
      if (!hasActiveAccess() && !isPublicRoute && location.pathname !== '/pricing') {
        navigate('/pricing');
        return;
      }
    }
  }, [user, subscription, authLoading, subLoading, location.pathname, navigate, hasActiveAccess]);

  if (authLoading || subLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return <>{children}</>;
};
