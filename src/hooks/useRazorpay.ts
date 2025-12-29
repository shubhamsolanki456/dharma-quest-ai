import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type PlanType = 'weekly' | 'monthly' | 'yearly';

interface RazorpayResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  callback_url: string;
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
  modal?: {
    ondismiss?: () => void;
  };
  redirect: boolean;
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

        // Create order via backend
        const { data, error } = await supabase.functions.invoke('create-razorpay-order', {
          body: { planType, userId, userEmail, userName },
        });

        if (error) {
          throw new Error(error.message || 'Failed to create order');
        }

        if (!data?.orderId) {
          throw new Error(data?.error || 'Failed to create order');
        }

        // Store payment info for verification after redirect
        sessionStorage.setItem(
          'razorpay_pending_payment',
          JSON.stringify({
            planType,
            userId,
            orderId: data.orderId,
          })
        );

        // Get current origin for callback URL
        const callbackUrl = `${window.location.origin}/payment-success?plan=${planType}`;

        // Configure Razorpay Standard Checkout with redirect
        const options: RazorpayOptions = {
          key: data.keyId,
          amount: data.amount,
          currency: data.currency,
          name: 'Dharma AI',
          description: data.planName,
          order_id: data.orderId,
          callback_url: callbackUrl,
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
          redirect: true, // Force redirect mode
        };

        console.log('Opening Razorpay checkout with redirect mode');

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
