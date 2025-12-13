import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';

interface PaywallGuardProps {
  children: React.ReactNode;
}

// Routes that don't require subscription
const PUBLIC_ROUTES = ['/', '/landing', '/auth', '/privacy-policy', '/terms-of-service'];
// Routes that require auth but not subscription
const AUTH_ONLY_ROUTES = ['/onboarding', '/start-free-trial', '/start-trial', '/pricing', '/payment-success'];

export const PaywallGuard = ({ children }: PaywallGuardProps) => {
  const { user, loading: authLoading } = useAuth();
  const { subscription, loading: subLoading, hasActiveAccess } = useSubscription();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (authLoading || subLoading) return;

    const isPublicRoute = PUBLIC_ROUTES.includes(location.pathname);
    const isAuthOnlyRoute = AUTH_ONLY_ROUTES.includes(location.pathname);
    
    // Not logged in - redirect to landing for protected routes
    if (!user) {
      if (!isPublicRoute) {
        navigate('/');
      }
      return;
    }

    // User is logged in
    if (user) {
      // No subscription yet - go to onboarding (unless already there or on auth-only routes)
      if (!subscription) {
        if (!isPublicRoute && !isAuthOnlyRoute) {
          navigate('/onboarding');
        }
        return;
      }

      // Has subscription but not completed onboarding - redirect to onboarding
      if (subscription && !subscription.has_completed_onboarding) {
        if (location.pathname !== '/onboarding') {
          navigate('/onboarding');
        }
        return;
      }

      // Trial/subscription expired - redirect to pricing
      if (!hasActiveAccess()) {
        if (!isPublicRoute && !isAuthOnlyRoute) {
          navigate('/pricing');
        }
        return;
      }

      // User has active access and is on auth-only routes - redirect to dashboard
      if (hasActiveAccess() && subscription.has_completed_onboarding) {
        if (location.pathname === '/onboarding' || location.pathname === '/start-free-trial' || location.pathname === '/start-trial') {
          navigate('/dashboard');
        }
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
