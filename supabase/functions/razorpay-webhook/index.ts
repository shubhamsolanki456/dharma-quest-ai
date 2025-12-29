import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-razorpay-signature",
};

const PLAN_DURATIONS: Record<string, number> = {
  weekly: 7,
  monthly: 30,
  yearly: 365,
};

async function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): Promise<boolean> {
  const encoder = new TextEncoder();
  const data = encoder.encode(payload);
  const key = encoder.encode(secret);

  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    key,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signatureBuffer = await crypto.subtle.sign("HMAC", cryptoKey, data);
  const computedSignature = Array.from(new Uint8Array(signatureBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  return computedSignature === signature;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const signature = req.headers.get("x-razorpay-signature");
    if (!signature) {
      console.error("Missing Razorpay signature");
      return new Response(JSON.stringify({ error: "Missing signature" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const webhookSecret = Deno.env.get("RAZORPAY_WEBHOOK_SECRET");
    if (!webhookSecret) {
      console.error("Webhook secret not configured");
      return new Response(JSON.stringify({ error: "Webhook secret not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const payload = await req.text();
    
    // Verify webhook signature
    const isValid = await verifyWebhookSignature(payload, signature, webhookSecret);
    if (!isValid) {
      console.error("Invalid webhook signature");
      return new Response(JSON.stringify({ error: "Invalid signature" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const event = JSON.parse(payload);
    console.log("Received Razorpay webhook event:", event.event);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Handle different event types
    switch (event.event) {
      case "subscription.activated":
      case "subscription.charged": {
        const subscription = event.payload.subscription.entity;
        const planId = subscription.plan_id;
        const customerId = subscription.customer_id;
        const subscriptionId = subscription.id;

        console.log("Processing subscription event:", { planId, customerId, subscriptionId });

        // Find user by razorpay_customer_id
        const { data: existingUser, error: findError } = await supabase
          .from("user_subscriptions")
          .select("user_id")
          .eq("razorpay_customer_id", customerId)
          .single();

        if (findError || !existingUser) {
          console.error("User not found for customer:", customerId);
          break;
        }

        // Determine plan type from plan_id (you'll need to map these)
        let planType = "monthly"; // default
        const currentPeriodEnd = new Date(subscription.current_end * 1000);

        const { error: updateError } = await supabase
          .from("user_subscriptions")
          .update({
            is_active: true,
            razorpay_subscription_id: subscriptionId,
            razorpay_plan_id: planId,
            subscription_start_date: new Date().toISOString(),
            subscription_end_date: currentPeriodEnd.toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", existingUser.user_id);

        if (updateError) {
          console.error("Failed to update subscription:", updateError);
        } else {
          console.log("Subscription activated for user:", existingUser.user_id);
        }
        break;
      }

      case "subscription.cancelled":
      case "subscription.halted": {
        const subscription = event.payload.subscription.entity;
        const customerId = subscription.customer_id;

        console.log("Processing subscription cancellation for customer:", customerId);

        const { error: cancelError } = await supabase
          .from("user_subscriptions")
          .update({
            is_active: false,
            updated_at: new Date().toISOString(),
          })
          .eq("razorpay_customer_id", customerId);

        if (cancelError) {
          console.error("Failed to cancel subscription:", cancelError);
        }
        break;
      }

      case "payment.captured": {
        const payment = event.payload.payment.entity;
        console.log("Payment captured:", payment.id);
        // Payment captured - subscription should already be active
        break;
      }

      case "payment.failed": {
        const payment = event.payload.payment.entity;
        console.log("Payment failed:", payment.id, payment.error_description);
        break;
      }

      default:
        console.log("Unhandled event type:", event.event);
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Webhook processing error:", error);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
