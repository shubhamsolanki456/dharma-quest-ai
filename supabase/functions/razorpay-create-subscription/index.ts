import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Razorpay plan IDs - these should be created in Razorpay Dashboard
// You'll need to create these plans in Razorpay and update these IDs
const RAZORPAY_PLANS: Record<string, { plan_id: string; amount: number }> = {
  weekly: { plan_id: "plan_weekly", amount: 9900 }, // ₹99 in paise
  monthly: { plan_id: "plan_monthly", amount: 19900 }, // ₹199 in paise
  yearly: { plan_id: "plan_yearly", amount: 199900 }, // ₹1999 in paise
};

interface CreateSubscriptionRequest {
  plan_type: "weekly" | "monthly" | "yearly";
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const RAZORPAY_KEY_ID = Deno.env.get("RAZORPAY_KEY_ID");
    const RAZORPAY_KEY_SECRET = Deno.env.get("RAZORPAY_KEY_SECRET");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
      console.error("Razorpay credentials not configured");
      throw new Error("Razorpay credentials not configured");
    }

    // Get the authorization header to extract user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    // Initialize Supabase client
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // Get user from token
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      console.error("User authentication error:", userError);
      throw new Error("Unauthorized");
    }

    const { plan_type }: CreateSubscriptionRequest = await req.json();

    if (!plan_type || !RAZORPAY_PLANS[plan_type]) {
      throw new Error("Invalid plan type");
    }

    console.log(`Creating Razorpay subscription for user ${user.id}, plan: ${plan_type}`);

    // Check if user already has a Razorpay customer ID
    const { data: existingSubscription } = await supabase
      .from("user_subscriptions")
      .select("razorpay_customer_id")
      .eq("user_id", user.id)
      .maybeSingle();

    let customerId = existingSubscription?.razorpay_customer_id;

    // Create customer if doesn't exist
    if (!customerId) {
      const customerResponse = await fetch("https://api.razorpay.com/v1/customers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${btoa(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`)}`,
        },
        body: JSON.stringify({
          name: user.email?.split("@")[0] || "User",
          email: user.email,
          fail_existing: "0", // Return existing customer if email exists
        }),
      });

      if (!customerResponse.ok) {
        const errorText = await customerResponse.text();
        console.error("Razorpay customer creation failed:", errorText);
        throw new Error("Failed to create Razorpay customer");
      }

      const customer = await customerResponse.json();
      customerId = customer.id;
      console.log("Created Razorpay customer:", customerId);
    }

    // Create subscription
    const planConfig = RAZORPAY_PLANS[plan_type];
    const subscriptionResponse = await fetch("https://api.razorpay.com/v1/subscriptions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${btoa(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`)}`,
      },
      body: JSON.stringify({
        plan_id: planConfig.plan_id,
        customer_id: customerId,
        total_count: plan_type === "yearly" ? 10 : 52, // Max billing cycles
        quantity: 1,
        customer_notify: 1,
        notes: {
          user_id: user.id,
          plan_type: plan_type,
        },
      }),
    });

    if (!subscriptionResponse.ok) {
      const errorText = await subscriptionResponse.text();
      console.error("Razorpay subscription creation failed:", errorText);
      throw new Error("Failed to create Razorpay subscription");
    }

    const subscription = await subscriptionResponse.json();
    console.log("Created Razorpay subscription:", subscription.id);

    // Store the subscription ID temporarily
    await supabase
      .from("user_subscriptions")
      .upsert({
        user_id: user.id,
        razorpay_customer_id: customerId,
        razorpay_subscription_id: subscription.id,
        razorpay_plan_id: planConfig.plan_id,
        plan_type: "trial", // Will be updated to actual plan after payment
        is_active: existingSubscription ? undefined : true,
        has_completed_onboarding: existingSubscription ? undefined : true,
      }, { onConflict: "user_id" });

    return new Response(
      JSON.stringify({
        subscription_id: subscription.id,
        key_id: RAZORPAY_KEY_ID,
        amount: planConfig.amount,
        currency: "INR",
        name: "Dharma AI",
        description: `${plan_type.charAt(0).toUpperCase() + plan_type.slice(1)} Subscription`,
        customer_id: customerId,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error in razorpay-create-subscription:", error);
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
