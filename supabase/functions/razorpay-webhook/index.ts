import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-razorpay-signature",
};

// Calculate subscription end date based on plan
function getSubscriptionEndDate(planType: string): Date {
  const endDate = new Date();
  switch (planType) {
    case "weekly":
      endDate.setDate(endDate.getDate() + 7);
      break;
    case "monthly":
      endDate.setMonth(endDate.getMonth() + 1);
      break;
    case "yearly":
      endDate.setFullYear(endDate.getFullYear() + 1);
      break;
    default:
      endDate.setMonth(endDate.getMonth() + 1);
  }
  return endDate;
}

// Verify Razorpay webhook signature using HMAC SHA-256
async function verifyWebhookSignature(
  body: string,
  signature: string | null,
  secret: string
): Promise<boolean> {
  if (!signature) {
    console.error("No signature provided in webhook request");
    return false;
  }

  try {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );

    const signatureBytes = await crypto.subtle.sign(
      "HMAC",
      key,
      encoder.encode(body)
    );

    const expectedSignature = Array.from(new Uint8Array(signatureBytes))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    const isValid = expectedSignature === signature;
    console.log("Signature verification result:", isValid ? "valid" : "invalid");
    return isValid;
  } catch (err) {
    console.error("Error verifying signature:", err);
    return false;
  }
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const RAZORPAY_WEBHOOK_SECRET = Deno.env.get("RAZORPAY_WEBHOOK_SECRET");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!RAZORPAY_WEBHOOK_SECRET) {
      console.error("RAZORPAY_WEBHOOK_SECRET not configured");
      throw new Error("Webhook secret not configured");
    }

    const body = await req.text();
    const signature = req.headers.get("x-razorpay-signature");

    console.log("Received webhook with signature:", signature ? "present" : "missing");

    // Verify signature before processing
    const isValid = await verifyWebhookSignature(body, signature, RAZORPAY_WEBHOOK_SECRET);
    if (!isValid) {
      console.error("Invalid webhook signature – rejecting request");
      return new Response(
        JSON.stringify({ error: "Invalid signature" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 401,
        }
      );
    }

    const event = JSON.parse(body);
    console.log("Received Razorpay webhook event:", event.event);

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    const payload = event.payload;

    switch (event.event) {
      case "subscription.activated":
      case "subscription.charged": {
        // Subscription payment successful
        const subscription = payload.subscription?.entity;
        const payment = payload.payment?.entity;

        if (!subscription) {
          console.error("No subscription in payload");
          break;
        }

        const userId = subscription.notes?.user_id;
        const planType = subscription.notes?.plan_type || "monthly";

        if (!userId) {
          console.error("No user_id in subscription notes");
          break;
        }

        console.log(`Processing subscription activation for user ${userId}, plan: ${planType}`);

        const endDate = getSubscriptionEndDate(planType);

        await supabase
          .from("user_subscriptions")
          .update({
            plan_type: planType,
            subscription_start_date: new Date().toISOString(),
            subscription_end_date: endDate.toISOString(),
            is_active: true,
            razorpay_subscription_id: subscription.id,
            razorpay_payment_id: payment?.id || null,
          })
          .eq("user_id", userId);

        console.log(`Subscription activated for user ${userId}`);
        break;
      }

      case "subscription.cancelled":
      case "subscription.expired": {
        // Subscription cancelled or expired
        const subscription = payload.subscription?.entity;

        if (!subscription) {
          console.error("No subscription in payload");
          break;
        }

        const userId = subscription.notes?.user_id;

        if (!userId) {
          console.error("No user_id in subscription notes");
          break;
        }

        console.log(`Subscription cancelled/expired for user ${userId}`);

        await supabase
          .from("user_subscriptions")
          .update({
            is_active: false,
          })
          .eq("user_id", userId);

        break;
      }

      case "subscription.pending": {
        // Payment pending (for UPI, bank transfer, etc.)
        console.log("Subscription payment pending");
        break;
      }

      case "subscription.halted": {
        // Subscription halted due to max retry attempts
        const subscription = payload.subscription?.entity;
        const userId = subscription?.notes?.user_id;

        if (userId) {
          console.log(`Subscription halted for user ${userId}`);
          await supabase
            .from("user_subscriptions")
            .update({ is_active: false })
            .eq("user_id", userId);
        }
        break;
      }

      case "payment.captured": {
        // One-time payment captured (for first subscription payment)
        console.log("Payment captured:", payload.payment?.entity?.id);
        break;
      }

      case "payment.failed": {
        console.log("Payment failed:", payload.payment?.entity?.id);
        break;
      }

      default:
        console.log("Unhandled webhook event:", event.event);
    }

    return new Response(
      JSON.stringify({ received: true }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Webhook error:", error);
    const errorMessage = error instanceof Error ? error.message : "An error occurred";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
