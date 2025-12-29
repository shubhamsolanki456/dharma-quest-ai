import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type PlanType = 'weekly' | 'monthly' | 'yearly';

type CreateSubscriptionResponse = {
  subscriptionId: string;
  shortUrl?: string | null;
  error?: string;
};

export const useRazorpay = () => {
  const [isLoading, setIsLoading] = useState(false);

  const initiatePayment = useCallback(
    async (
      planType: PlanType,
      userId: string,
      userEmail: string,
      userName?: string,
      _onSuccess?: () => void,
      onFailure?: (error: string) => void
    ) => {
      setIsLoading(true);

      try {
        // Create subscription + get hosted checkout link via backend
        const { data, error } = await supabase.functions.invoke('create-razorpay-order', {
          body: { planType, userId, userEmail, userName },
        });

        if (error) {
          throw new Error(error.message || 'Failed to create subscription');
        }

        const subscriptionData = data as CreateSubscriptionResponse | null;

        if (!subscriptionData?.subscriptionId) {
          throw new Error(subscriptionData?.error || 'Failed to create subscription');
        }

        // Store payment info for verification after redirect
        sessionStorage.setItem(
          'razorpay_pending_payment',
          JSON.stringify({
            planType,
            userId,
            subscriptionId: subscriptionData.subscriptionId,
          })
        );

        if (!subscriptionData.shortUrl) {
          throw new Error('Checkout link could not be generated. Please try again.');
        }

        // Hosted Razorpay page (bypasses registered-website mismatch from checkout.js)
        window.location.href = subscriptionData.shortUrl;
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
