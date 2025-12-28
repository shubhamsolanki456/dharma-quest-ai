import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  prefill: {
    email: string;
    name: string;
  };
  theme: {
    color: string;
  };
  handler: (response: RazorpayResponse) => void;
  modal: {
    ondismiss: () => void;
  };
}

interface RazorpayResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

interface RazorpayInstance {
  open: () => void;
  on: (event: string, handler: (response: { error: { description: string } }) => void) => void;
}

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => RazorpayInstance;
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

      // Create order via edge function
      const { data: orderData, error: orderError } = await supabase.functions.invoke(
        'create-razorpay-order',
        {
          body: { planType, userId, userEmail, userName },
        }
      );

      if (orderError || !orderData?.orderId) {
        throw new Error(orderData?.error || 'Failed to create order');
      }

      // Configure Razorpay options
      const options: RazorpayOptions = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'Dharma AI',
        description: `${planType.charAt(0).toUpperCase() + planType.slice(1)} Subscription`,
        order_id: orderData.orderId,
        prefill: {
          email: orderData.prefill.email,
          name: orderData.prefill.name || '',
        },
        theme: {
          color: '#FF6B00', // Saffron color
        },
        handler: async (response: RazorpayResponse) => {
          try {
            // Verify payment via edge function
            const { data: verifyData, error: verifyError } = await supabase.functions.invoke(
              'verify-razorpay-payment',
              {
                body: {
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                  planType,
                  userId,
                },
              }
            );

            if (verifyError || !verifyData?.success) {
              throw new Error(verifyData?.error || 'Payment verification failed');
            }

            toast.success('Payment successful!');
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
