import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type PlanType = 'weekly' | 'monthly' | 'yearly';

interface RazorpaySubscriptionOptions {
  key: string;
  subscription_id: string;
  name: string;
  description: string;
  prefill: {
    email: string;
    name: string;
  };
  notes: {
    plan_type: string;
    user_id: string;
  };
  theme: {
    color: string;
  };
  handler?: (response: RazorpaySubscriptionResponse) => void;
  modal?: {
    ondismiss?: () => void;
  };
}

interface RazorpaySubscriptionResponse {
  razorpay_payment_id: string;
  razorpay_subscription_id: string;
  razorpay_signature: string;
}

interface RazorpayInstance {
  open: () => void;
  on: (event: string, callback: () => void) => void;
}

declare global {
  interface Window {
    Razorpay: new (options: RazorpaySubscriptionOptions) => RazorpayInstance;
  }
}

// Load Razorpay checkout script
const loadRazorpayScript = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export const useRazorpay = () => {
  const [isLoading, setIsLoading] = useState(false);

  // Load script on mount
  useEffect(() => {
    loadRazorpayScript();
  }, []);

  const initiatePayment = useCallback(
    async (
      planType: PlanType,
      userId: string,
      userEmail: string,
      userName?: string,
      onSuccess?: () => void,
      onFailure?: (error: string) => void
    ) => {
      setIsLoading(true);

      try {
        // Ensure script is loaded
        const scriptLoaded = await loadRazorpayScript();
        if (!scriptLoaded) {
          throw new Error('Failed to load payment gateway');
        }

        // Create subscription via backend
        const { data, error } = await supabase.functions.invoke('create-razorpay-subscription', {
          body: { planType, userId, userEmail, userName },
        });

        if (error) {
          throw new Error(error.message || 'Failed to create subscription');
        }

        if (!data?.subscriptionId) {
          throw new Error(data?.error || 'Failed to create subscription');
        }

        // Store subscription info for verification after payment
        sessionStorage.setItem(
          'razorpay_pending_payment',
          JSON.stringify({
            planType,
            userId,
            subscriptionId: data.subscriptionId,
          })
        );

        console.log('Opening Razorpay checkout for subscription:', data.subscriptionId);

        // Configure Razorpay Subscription Checkout
        const options: RazorpaySubscriptionOptions = {
          key: data.keyId,
          subscription_id: data.subscriptionId,
          name: 'Dharma AI',
          description: data.planName,
          prefill: {
            email: data.prefill.email,
            name: data.prefill.name,
          },
          notes: {
            plan_type: planType,
            user_id: userId,
          },
          theme: {
            color: '#FF9933', // Saffron color
          },
          handler: async (response: RazorpaySubscriptionResponse) => {
            console.log('Payment successful:', response);
            toast.success('Payment successful! Activating your subscription...');
            sessionStorage.removeItem('razorpay_pending_payment');
            localStorage.setItem('trial_activated', 'true');

            // The webhook will activate the subscription in DB.
            // Navigate user to payment success page for confirmation.
            window.location.href = `/payment-success?plan=${planType}&subscription_id=${response.razorpay_subscription_id}`;
          },
          modal: {
            ondismiss: () => {
              console.log('Razorpay modal dismissed');
              setIsLoading(false);
              onFailure?.('Payment cancelled');
            },
          },
        };

        // Open Razorpay checkout
        const razorpay = new window.Razorpay(options);
        razorpay.open();

      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Payment initiation failed';
        console.error('Payment error:', err);
        toast.error(errorMessage);
        onFailure?.(errorMessage);
        setIsLoading(false);
      }
    },
    []
  );

  return { initiatePayment, isLoading };
};
