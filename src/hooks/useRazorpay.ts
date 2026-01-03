import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type PlanType = 'weekly' | 'monthly' | 'yearly';

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  order_id: string;
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
  handler?: (response: RazorpayResponse) => void;
  modal?: {
    ondismiss?: () => void;
  };
}

interface RazorpayResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

interface RazorpayInstance {
  open: () => void;
  on: (event: string, callback: () => void) => void;
}

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => RazorpayInstance;
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

        // Create order via backend (one-time payment)
        const { data, error } = await supabase.functions.invoke('create-razorpay-order', {
          body: { planType, userId, userEmail, userName },
        });

        if (error) {
          throw new Error(error.message || 'Failed to create order');
        }

        if (!data?.orderId) {
          throw new Error(data?.error || 'Failed to create order');
        }

        // Store order info for verification after payment
        sessionStorage.setItem(
          'razorpay_pending_payment',
          JSON.stringify({
            planType,
            userId,
            orderId: data.orderId,
          })
        );

        console.log('Opening Razorpay checkout for order:', data.orderId);

        // Configure Razorpay Standard Checkout (one-time payment)
        const options: RazorpayOptions = {
          key: data.keyId,
          amount: data.amount,
          currency: data.currency,
          order_id: data.orderId,
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
          handler: async (response: RazorpayResponse) => {
            console.log('Payment successful:', response);
            toast.success('Payment successful! Activating your subscription...');
            sessionStorage.removeItem('razorpay_pending_payment');
            localStorage.setItem('trial_activated', 'true');

            // Verify payment and activate subscription
            try {
              const { error: verifyError } = await supabase.functions.invoke('verify-razorpay-payment', {
                body: {
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_signature: response.razorpay_signature,
                  plan_type: planType,
                  user_id: userId,
                },
              });

              if (verifyError) {
                console.error('Payment verification error:', verifyError);
              }
            } catch (verifyErr) {
              console.error('Payment verification failed:', verifyErr);
            }

            // Navigate to payment success page
            window.location.href = `/payment-success?plan=${planType}&order_id=${response.razorpay_order_id}`;
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
