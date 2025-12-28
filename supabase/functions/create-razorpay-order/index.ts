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

const PLAN_PRICES: Record<string, number> = {
  weekly: 9900,    // ₹99 in paise
  monthly: 19900,  // ₹199 in paise
  yearly: 199900,  // ₹1999 in paise
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

    const amount = PLAN_PRICES[planType];
    if (!amount) {
      throw new Error(`Invalid plan type: ${planType}`);
    }

    const razorpayKeyId = Deno.env.get("RAZORPAY_KEY_ID");
    const razorpayKeySecret = Deno.env.get("RAZORPAY_KEY_SECRET");

    if (!razorpayKeyId || !razorpayKeySecret) {
      throw new Error("Razorpay credentials not configured");
    }

    // Create Razorpay order
    const orderResponse = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Basic ${btoa(`${razorpayKeyId}:${razorpayKeySecret}`)}`,
      },
      body: JSON.stringify({
        amount: amount,
        currency: "INR",
        receipt: `rcpt_${userId.slice(-8)}_${Date.now().toString().slice(-8)}`,
        notes: {
          plan_type: planType,
          user_id: userId,
          user_email: userEmail,
        },
      }),
    });

    if (!orderResponse.ok) {
      const errorData = await orderResponse.text();
      console.error("Razorpay API error:", errorData);
      throw new Error(`Failed to create Razorpay order: ${orderResponse.status}`);
    }

    const orderData = await orderResponse.json();

    console.log("Razorpay order created:", orderData.id);

    return new Response(
      JSON.stringify({
        orderId: orderData.id,
        amount: orderData.amount,
        currency: orderData.currency,
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
    console.error("Error creating Razorpay order:", error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
