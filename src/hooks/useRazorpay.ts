import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface RazorpaySubscriptionOptions {
  key: string;
  subscription_id: string;
  name: string;
  description: string;
  prefill: {
    email: string;
    name: string;
  };
  theme: {
    color: string;
  };
  handler: (response: RazorpaySubscriptionResponse) => void;
  modal: {
    ondismiss: () => void;
  };
}

interface RazorpaySubscriptionResponse {
  razorpay_payment_id: string;
  razorpay_subscription_id: string;
  razorpay_signature: string;
}

interface RazorpayInstance {
  open: () => void;
  on: (event: string, handler: (response: { error: { description: string } }) => void) => void;
}

declare global {
  interface Window {
    Razorpay: new (options: RazorpaySubscriptionOptions) => RazorpayInstance;
  }
}

export const useRazorpay = () => {
  const [isLoading, setIsLoading] = useState(false);

  const loadRazorpayScript = useCallback((): Promise<boolean> => {
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
  }, []);

  const initiatePayment = useCallback(async (
    planType: 'weekly' | 'monthly' | 'yearly',
    userId: string,
    userEmail: string,
    userName?: string,
    onSuccess?: () => void,
    onFailure?: (error: string) => void
  ) => {
    setIsLoading(true);

    try {
      // Load Razorpay script
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        throw new Error('Failed to load Razorpay. Please check your internet connection.');
      }

      // Create subscription via edge function
      const { data: subscriptionData, error: subscriptionError } = await supabase.functions.invoke(
        'create-razorpay-order',
        {
          body: { planType, userId, userEmail, userName },
        }
      );

      if (subscriptionError || !subscriptionData?.subscriptionId) {
        throw new Error(subscriptionData?.error || 'Failed to create subscription');
      }

      // Configure Razorpay options for subscription
      const options: RazorpaySubscriptionOptions = {
        key: subscriptionData.keyId,
        subscription_id: subscriptionData.subscriptionId,
        name: 'Dharma AI',
        description: `${planType.charAt(0).toUpperCase() + planType.slice(1)} Subscription`,
        prefill: {
          email: subscriptionData.prefill.email,
          name: subscriptionData.prefill.name || '',
        },
        theme: {
          color: '#FF6B00', // Saffron color
        },
        handler: async (response: RazorpaySubscriptionResponse) => {
          try {
            // Verify payment via edge function
            const { data: verifyData, error: verifyError } = await supabase.functions.invoke(
              'verify-razorpay-payment',
              {
                body: {
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_subscription_id: response.razorpay_subscription_id,
                  razorpay_signature: response.razorpay_signature,
                  planType,
                  userId,
                },
              }
            );

            if (verifyError || !verifyData?.success) {
              throw new Error(verifyData?.error || 'Payment verification failed');
            }

            toast.success('Subscription activated!');
            onSuccess?.();
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Payment verification failed';
            toast.error(errorMessage);
            onFailure?.(errorMessage);
          } finally {
            setIsLoading(false);
          }
        },
        modal: {
          ondismiss: () => {
            setIsLoading(false);
            toast.info('Payment cancelled');
          },
        },
      };

      const razorpay = new window.Razorpay(options);
      
      razorpay.on('payment.failed', (response: { error: { description: string } }) => {
        setIsLoading(false);
        const errorMessage = response.error.description || 'Payment failed';
        toast.error(errorMessage);
        onFailure?.(errorMessage);
      });

      razorpay.open();
    } catch (error) {
      setIsLoading(false);
      const errorMessage = error instanceof Error ? error.message : 'Something went wrong';
      toast.error(errorMessage);
      onFailure?.(errorMessage);
    }
  }, [loadRazorpayScript]);

  return {
    initiatePayment,
    isLoading,
  };
};
