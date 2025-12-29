import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface OrderRequest {
  planType: 'weekly' | 'monthly' | 'yearly';
  userId: string;
  userEmail: string;
  userName?: string;
}

// Razorpay Plan IDs
const PLAN_IDS: Record<string, string> = {
  weekly: "plan_RxMDmARDD8Dt24",
  monthly: "plan_RxMEh5qs9fRzi4",
  yearly: "plan_RxMEyMuVsT9bSU",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { planType, userId, userEmail, userName } = await req.json() as OrderRequest;

    if (!planType || !userId || !userEmail) {
      throw new Error("Missing required fields: planType, userId, or userEmail");
    }

    const planId = PLAN_IDS[planType];
    if (!planId) {
      throw new Error(`Invalid plan type: ${planType}`);
    }

    const razorpayKeyId = Deno.env.get("RAZORPAY_KEY_ID");
    const razorpayKeySecret = Deno.env.get("RAZORPAY_KEY_SECRET");

    if (!razorpayKeyId || !razorpayKeySecret) {
      throw new Error("Razorpay credentials not configured");
    }

    const authHeader = `Basic ${btoa(`${razorpayKeyId}:${razorpayKeySecret}`)}`;

    // First, create or get customer
    let customerId: string;

    // Check if user already has a customer ID in our database
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: existingSubscription } = await supabase
      .from("user_subscriptions")
      .select("razorpay_customer_id")
      .eq("user_id", userId)
      .single();

    if (existingSubscription?.razorpay_customer_id) {
      customerId = existingSubscription.razorpay_customer_id;
      console.log("Using existing customer:", customerId);
    } else {
      // Create new Razorpay customer
      const customerResponse = await fetch("https://api.razorpay.com/v1/customers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": authHeader,
        },
        body: JSON.stringify({
          name: userName || userEmail.split("@")[0],
          email: userEmail,
          notes: {
            user_id: userId,
          },
        }),
      });

      if (!customerResponse.ok) {
        const errorData = await customerResponse.text();
        console.error("Failed to create customer:", errorData);
        throw new Error("Failed to create Razorpay customer");
      }

      const customerData = await customerResponse.json();
      customerId = customerData.id;
      console.log("Created new customer:", customerId);

      // Save customer ID to database
      await supabase
        .from("user_subscriptions")
        .upsert({
          user_id: userId,
          razorpay_customer_id: customerId,
          updated_at: new Date().toISOString(),
        }, { onConflict: "user_id" });
    }

    // Create Razorpay subscription
    const subscriptionResponse = await fetch("https://api.razorpay.com/v1/subscriptions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": authHeader,
      },
      body: JSON.stringify({
        plan_id: planId,
        customer_id: customerId,
        total_count: planType === "yearly" ? 10 : 12, // Number of billing cycles
        customer_notify: 0, // We'll handle notifications
        notes: {
          plan_type: planType,
          user_id: userId,
        },
      }),
    });

    if (!subscriptionResponse.ok) {
      const errorData = await subscriptionResponse.text();
      console.error("Razorpay subscription error:", errorData);
      throw new Error(`Failed to create Razorpay subscription: ${subscriptionResponse.status}`);
    }

    const subscriptionData = await subscriptionResponse.json();
    console.log("Razorpay subscription created:", subscriptionData.id);

    return new Response(
      JSON.stringify({
        subscriptionId: subscriptionData.id,
        keyId: razorpayKeyId,
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
