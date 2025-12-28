import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Razorpay Plan IDs - create these in Razorpay Dashboard first
const PLANS: Record<string, string> = {
  weekly: "plan_RwjapeZbxoyVMQ",
  monthly: "plan_RwjcY0BC3l7xiH",
  yearly: "plan_RwjeABJvraSqIX",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const RAZORPAY_KEY_ID = Deno.env.get("RAZORPAY_KEY_ID");
    const RAZORPAY_KEY_SECRET = Deno.env.get("RAZORPAY_KEY_SECRET");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
      throw new Error("Razorpay credentials not configured");
    }

    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      throw new Error("Unauthorized");
    }

    const { plan_type } = await req.json();
    if (!plan_type || !PLANS[plan_type]) {
      throw new Error("Invalid plan type");
    }

    console.log(`Creating subscription for user ${user.id}, plan: ${plan_type}`);

    const authString = btoa(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`);

    // Create Razorpay subscription directly
    const subResponse = await fetch("https://api.razorpay.com/v1/subscriptions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${authString}`,
      },
      body: JSON.stringify({
        plan_id: PLANS[plan_type],
        total_count: 12,
        customer_notify: 1,
        notes: {
          user_id: user.id,
          plan_type: plan_type,
        },
      }),
    });

    if (!subResponse.ok) {
      const errorText = await subResponse.text();
      console.error("Razorpay error:", errorText);
      throw new Error("Failed to create subscription");
    }

    const subscription = await subResponse.json();
    console.log("Created subscription:", subscription.id);

    // Store subscription ID in database
    await supabase
      .from("user_subscriptions")
      .update({
        razorpay_subscription_id: subscription.id,
        razorpay_plan_id: PLANS[plan_type],
      })
      .eq("user_id", user.id);

    return new Response(
      JSON.stringify({
        subscription_id: subscription.id,
        short_url: subscription.short_url,
        key_id: RAZORPAY_KEY_ID,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Error" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
