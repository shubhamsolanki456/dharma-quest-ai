import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Calculate subscription end date
function getEndDate(planType: string): Date {
  const date = new Date();
  if (planType === "weekly") date.setDate(date.getDate() + 7);
  else if (planType === "monthly") date.setMonth(date.getMonth() + 1);
  else if (planType === "yearly") date.setFullYear(date.getFullYear() + 1);
  else date.setMonth(date.getMonth() + 1);
  return date;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    const body = await req.text();
    const event = JSON.parse(body);

    console.log("Webhook event:", event.event);

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // Handle subscription.authenticated (payment successful)
    if (event.event === "subscription.authenticated" || event.event === "subscription.activated") {
      const subscriptionId = event.payload?.subscription?.entity?.id;
      const notes = event.payload?.subscription?.entity?.notes || {};
      const userId = notes.user_id;
      const planType = notes.plan_type || "monthly";

      if (!userId || !subscriptionId) {
        console.log("Missing user_id or subscription_id in webhook");
        return new Response(JSON.stringify({ received: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }

      console.log(`Activating subscription for user ${userId}, plan: ${planType}`);

      const endDate = getEndDate(planType);

      const { error } = await supabase
        .from("user_subscriptions")
        .update({
          plan_type: planType,
          is_active: true,
          subscription_start_date: new Date().toISOString(),
          subscription_end_date: endDate.toISOString(),
          razorpay_subscription_id: subscriptionId,
        })
        .eq("user_id", userId);

      if (error) {
        console.error("Failed to update subscription:", error);
      } else {
        console.log(`Subscription activated for user ${userId}`);
      }
    }

    // Handle subscription.charged (recurring payment)
    if (event.event === "subscription.charged") {
      const notes = event.payload?.subscription?.entity?.notes || {};
      const userId = notes.user_id;
      const planType = notes.plan_type || "monthly";

      if (userId) {
        const endDate = getEndDate(planType);
        await supabase
          .from("user_subscriptions")
          .update({
            is_active: true,
            subscription_end_date: endDate.toISOString(),
          })
          .eq("user_id", userId);
        console.log(`Subscription renewed for user ${userId}`);
      }
    }

    // Handle cancellation/expiry
    if (event.event === "subscription.cancelled" || event.event === "subscription.expired") {
      const notes = event.payload?.subscription?.entity?.notes || {};
      const userId = notes.user_id;

      if (userId) {
        await supabase
          .from("user_subscriptions")
          .update({ is_active: false })
          .eq("user_id", userId);
        console.log(`Subscription cancelled for user ${userId}`);
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Webhook error:", error);
    return new Response(
      JSON.stringify({ error: "Webhook processing failed" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
