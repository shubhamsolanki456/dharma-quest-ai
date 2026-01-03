import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SubscriptionRequest {
  planType: 'weekly' | 'monthly' | 'yearly';
  userId: string;
  userEmail: string;
  userName?: string;
}

// Plan IDs must be created in Razorpay Dashboard → Products → Plans
const RAZORPAY_PLAN_IDS: Record<string, string> = {
  weekly:  Deno.env.get("RAZORPAY_PLAN_WEEKLY") || "",
  monthly: Deno.env.get("RAZORPAY_PLAN_MONTHLY") || "",
  yearly:  Deno.env.get("RAZORPAY_PLAN_YEARLY") || "",
};

const PLAN_NAMES: Record<string, string> = {
  weekly: "Weekly Plan",
  monthly: "Monthly Plan",
  yearly: "Yearly Plan",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { planType, userId, userEmail, userName } = await req.json() as SubscriptionRequest;

    if (!planType || !userId || !userEmail) {
      throw new Error("Missing required fields: planType, userId, or userEmail");
    }

    const razorpayPlanId = RAZORPAY_PLAN_IDS[planType];
    if (!razorpayPlanId) {
      throw new Error(`Plan ID not configured for plan type: ${planType}`);
    }

    const razorpayKeyId = Deno.env.get("RAZORPAY_KEY_ID");
    const razorpayKeySecret = Deno.env.get("RAZORPAY_KEY_SECRET");

    if (!razorpayKeyId || !razorpayKeySecret) {
      throw new Error("Razorpay credentials not configured");
    }

    const authHeader = `Basic ${btoa(`${razorpayKeyId}:${razorpayKeySecret}`)}`;

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Step 1: Create or get Razorpay Customer
    let customerId: string | null = null;

    // Check if user already has a customer_id in our database
    const { data: existingSub } = await supabase
      .from("user_subscriptions")
      .select("razorpay_customer_id")
      .eq("user_id", userId)
      .maybeSingle();

    if (existingSub?.razorpay_customer_id) {
      customerId = existingSub.razorpay_customer_id;
      console.log("Using existing Razorpay customer from DB:", customerId);
    } else {
      // Try to create a new customer, but handle "already exists" error
      console.log("Creating Razorpay customer for:", userEmail);
      const customerResponse = await fetch("https://api.razorpay.com/v1/customers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": authHeader,
        },
        body: JSON.stringify({
          name: userName || userEmail.split("@")[0],
          email: userEmail,
          notes: { user_id: userId },
        }),
      });

      if (customerResponse.ok) {
        const customerData = await customerResponse.json();
        customerId = customerData.id;
        console.log("Created new Razorpay customer:", customerId);
      } else {
        const errorData = await customerResponse.json();
        console.log("Customer creation response:", JSON.stringify(errorData));
        
        // If customer already exists, fetch by email
        if (errorData?.error?.description?.includes("already exists")) {
          console.log("Customer already exists, fetching by email:", userEmail);
          
          const fetchCustomerResponse = await fetch(
            `https://api.razorpay.com/v1/customers?email=${encodeURIComponent(userEmail)}`,
            {
              method: "GET",
              headers: {
                "Authorization": authHeader,
              },
            }
          );

          if (fetchCustomerResponse.ok) {
            const customersData = await fetchCustomerResponse.json();
            if (customersData.items && customersData.items.length > 0) {
              customerId = customersData.items[0].id;
              console.log("Found existing Razorpay customer:", customerId);
            }
          }
        }
        
        if (!customerId) {
          console.error("Failed to create/find Razorpay customer:", JSON.stringify(errorData));
          throw new Error("Failed to create customer");
        }
      }

      // Save customer ID to database
      if (customerId) {
        await supabase
          .from("user_subscriptions")
          .upsert({
            user_id: userId,
            razorpay_customer_id: customerId,
            updated_at: new Date().toISOString(),
          }, { onConflict: "user_id" });
        console.log("Saved customer ID to database:", customerId);
      }
    }

    // Step 2: Create Razorpay Subscription
    console.log("Creating Razorpay subscription:", { planType, razorpayPlanId, customerId, userId });

    const subscriptionResponse = await fetch("https://api.razorpay.com/v1/subscriptions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": authHeader,
      },
      body: JSON.stringify({
        plan_id: razorpayPlanId,
        customer_id: customerId,
        total_count: planType === "yearly" ? 10 : 52, // 10 years for yearly or 1 year for weekly/monthly
        quantity: 1,
        customer_notify: 1,
        notes: {
          plan_type: planType,
          user_id: userId,
        },
      }),
    });

    if (!subscriptionResponse.ok) {
      const errorData = await subscriptionResponse.text();
      console.error("Razorpay subscription creation error:", errorData);
      throw new Error(`Failed to create Razorpay subscription: ${subscriptionResponse.status}`);
    }

    const subscriptionData = await subscriptionResponse.json();
    console.log("Razorpay subscription created:", subscriptionData.id);

    // Save subscription ID to database
    await supabase
      .from("user_subscriptions")
      .upsert({
        user_id: userId,
        razorpay_subscription_id: subscriptionData.id,
        razorpay_plan_id: razorpayPlanId,
        razorpay_customer_id: customerId,
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id" });

    return new Response(
      JSON.stringify({
        subscriptionId: subscriptionData.id,
        shortUrl: subscriptionData.short_url,
        keyId: razorpayKeyId,
        planName: PLAN_NAMES[planType],
        prefill: {
          email: userEmail,
          name: userName || "",
        },
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error creating Razorpay subscription:", error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
