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

const PLAN_IDS: Record<string, string> = {
  weekly: 'plan_RwjapeZbxoyVMQ',
  monthly: 'plan_RwjcY0BC3l7xiH',
  yearly: 'plan_RwjeABJvraSqIX',
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

    // Create Razorpay subscription
    const subscriptionResponse = await fetch("https://api.razorpay.com/v1/subscriptions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Basic ${btoa(`${razorpayKeyId}:${razorpayKeySecret}`)}`,
      },
      body: JSON.stringify({
        plan_id: planId,
        customer_notify: 1,
        total_count: planType === 'yearly' ? 10 : 12,
        notes: {
          plan_type: planType,
          user_id: userId,
          user_email: userEmail,
        },
      }),
    });

    if (!subscriptionResponse.ok) {
      const errorData = await subscriptionResponse.text();
      console.error("Razorpay API error:", errorData);
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
