import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface RazorpaySubscriptionOptions {
  key: string;
  subscription_id: string;
  name: string;
  description: string;
  callback_url: string;
  redirect: boolean;
  prefill: {
    email: string;
    name: string;
  };
  theme: {
    color: string;
  };
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
      // Create subscription via edge function (server side)
      const { data: subscriptionData, error: subscriptionError } = await supabase.functions.invoke(
        'create-razorpay-order',
        {
          body: { planType, userId, userEmail, userName },
        }
      );

      if (subscriptionError || !subscriptionData?.subscriptionId) {
        throw new Error(subscriptionData?.error || 'Failed to create subscription');
      }

      // Store payment info for verification after redirect/callback
      sessionStorage.setItem(
        'razorpay_pending_payment',
        JSON.stringify({
          planType,
          userId,
          subscriptionId: subscriptionData.subscriptionId,
        })
      );

      const redirectToUrl = (url: string) => {
        try {
          // If embedded, try top-level redirect; if blocked, fallback to a new tab.
          if (window.top && window.top !== window.self) {
            window.top.location.href = url;
            return;
          }
          window.location.href = url;
        } catch {
          window.open(url, '_blank', 'noopener,noreferrer');
        }
      };

      // Production-friendly path: redirect to Razorpay-hosted subscription URL.
      // This avoids the "website does not match registered website(s)" restriction.
      if (subscriptionData?.shortUrl) {
        toast.message('Opening secure payment page…');
        setIsLoading(false);
        redirectToUrl(subscriptionData.shortUrl);
        return;
      }

      // Fallback: Checkout.js (requires your domain to be whitelisted in Razorpay settings)
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        throw new Error('Failed to load Razorpay. Please check your internet connection.');
      }

      // Get the current origin for callback URL
      const callbackUrl = `${window.location.origin}/payment-success?plan=${planType}&subscription_id=${subscriptionData.subscriptionId}`;

      const options: RazorpaySubscriptionOptions = {
        key: subscriptionData.keyId,
        subscription_id: subscriptionData.subscriptionId,
        name: 'Dharma AI',
        description: `${planType.charAt(0).toUpperCase() + planType.slice(1)} Subscription`,
        callback_url: callbackUrl,
        redirect: true,
        prefill: {
          email: subscriptionData.prefill.email,
          name: subscriptionData.prefill.name || '',
        },
        theme: {
          color: '#FF6B00',
        },
      };

      const razorpay = new window.Razorpay(options);

      razorpay.on('payment.failed', (response: { error: { description: string } }) => {
        const errorMessage = response.error?.description || 'Payment failed';
        toast.error(errorMessage);
        onFailure?.(errorMessage);
        setIsLoading(false);
      });

      razorpay.open();

      // Note: With redirect mode, the page will redirect to Razorpay
      // After payment, user will be redirected back to callback_url
      // The onSuccess callback won't be called here as the page navigates away

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Payment initiation failed';
      console.error('Payment error:', error);
      toast.error(errorMessage);
      onFailure?.(errorMessage);
      setIsLoading(false);
    }
  }, [loadRazorpayScript]);

  return { initiatePayment, isLoading };
};
