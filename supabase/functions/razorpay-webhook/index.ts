import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-razorpay-signature",
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
      case "subscription.authenticated":
      case "subscription.activated":
      case "subscription.charged": {
        const subscription = event.payload.subscription.entity;
        const subscriptionId = subscription.id;
        const customerId = subscription.customer_id;
        const planId = subscription.plan_id;
        const currentPeriodEnd = subscription.current_end
          ? new Date(subscription.current_end * 1000)
          : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

        console.log("Activating/renewing subscription:", { subscriptionId, customerId, planId });

        // Find user by razorpay_subscription_id (set when we create the subscription)
        let userId: string | null = null;

        // Try finding by subscription_id first
        const { data: subMatch } = await supabase
          .from("user_subscriptions")
          .select("user_id")
          .eq("razorpay_subscription_id", subscriptionId)
          .maybeSingle();

        if (subMatch) {
          userId = subMatch.user_id;
        } else {
          // Fallback to customer_id
          const { data: custMatch } = await supabase
            .from("user_subscriptions")
            .select("user_id")
            .eq("razorpay_customer_id", customerId)
            .maybeSingle();

          if (custMatch) {
            userId = custMatch.user_id;
          }
        }

        if (!userId) {
          console.error("User not found for subscription:", subscriptionId, "customer:", customerId);
          break;
        }

        // Determine plan type from notes or plan_id mapping
        const notes = subscription.notes || {};
        let planType = notes.plan_type || "monthly";

        const { error: updateError } = await supabase
          .from("user_subscriptions")
          .update({
            is_active: true,
            plan_type: planType,
            razorpay_subscription_id: subscriptionId,
            razorpay_plan_id: planId,
            razorpay_customer_id: customerId,
            subscription_start_date: new Date().toISOString(),
            subscription_end_date: currentPeriodEnd.toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", userId);

        if (updateError) {
          console.error("Failed to activate subscription:", updateError);
        } else {
          console.log("Subscription activated/renewed for user:", userId, "until:", currentPeriodEnd.toISOString());
        }
        break;
      }

      case "subscription.pending":
      case "subscription.halted":
      case "subscription.cancelled": {
        const subscription = event.payload.subscription.entity;
        const subscriptionId = subscription.id;

        console.log("Subscription cancelled/halted:", subscriptionId);

        // We set is_active to false but keep the end date – user keeps access until then
        const { error: cancelError } = await supabase
          .from("user_subscriptions")
          .update({
            is_active: false,
            updated_at: new Date().toISOString(),
          })
          .eq("razorpay_subscription_id", subscriptionId);

        if (cancelError) {
          console.error("Failed to mark subscription cancelled:", cancelError);
        } else {
          console.log("Subscription marked cancelled for:", subscriptionId);
        }
        break;
      }

      case "subscription.completed": {
        // Subscription completed its total_count cycles
        const subscription = event.payload.subscription.entity;
        console.log("Subscription completed:", subscription.id);

        await supabase
          .from("user_subscriptions")
          .update({
            is_active: false,
            updated_at: new Date().toISOString(),
          })
          .eq("razorpay_subscription_id", subscription.id);
        break;
      }

      case "payment.authorized":
      case "payment.captured": {
        const payment = event.payload.payment.entity;
        console.log("Payment captured:", payment.id, "amount:", payment.amount);
        // Subscription charged event typically follows – no action needed here
        break;
      }

      case "payment.failed": {
        const payment = event.payload.payment.entity;
        console.log("Payment failed:", payment.id, payment.error_description);
        // Razorpay will retry; if all retries fail, subscription.halted fires
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
