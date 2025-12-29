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

// Plan amounts in paise (smallest currency unit)
const PLAN_AMOUNTS: Record<string, number> = {
  weekly: 9900,      // ₹99
  monthly: 19900,    // ₹199
  yearly: 199900,    // ₹1999
};

// Plan display names for receipt
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
    const { planType, userId, userEmail, userName } = await req.json() as OrderRequest;

    if (!planType || !userId || !userEmail) {
      throw new Error("Missing required fields: planType, userId, or userEmail");
    }

    const amount = PLAN_AMOUNTS[planType];
    if (!amount) {
      throw new Error(`Invalid plan type: ${planType}`);
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

    // Generate unique receipt ID
    const receiptId = `rcpt_${Date.now()}_${userId.slice(0, 8)}`;

    // Create Razorpay Order (as per Standard Checkout docs)
    console.log("Creating Razorpay order for:", { planType, amount, userId });
    
    const orderResponse = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": authHeader,
      },
      body: JSON.stringify({
        amount: amount,
        currency: "INR",
        receipt: receiptId,
        notes: {
          plan_type: planType,
          user_id: userId,
          user_email: userEmail,
        },
      }),
    });

    if (!orderResponse.ok) {
      const errorData = await orderResponse.text();
      console.error("Razorpay order creation error:", errorData);
      throw new Error(`Failed to create Razorpay order: ${orderResponse.status}`);
    }

    const orderData = await orderResponse.json();
    console.log("Razorpay order created:", orderData.id);

    // Store the order in database for later verification
    await supabase
      .from("user_subscriptions")
      .upsert({
        user_id: userId,
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id" });

    return new Response(
      JSON.stringify({
        orderId: orderData.id,
        amount: orderData.amount,
        currency: orderData.currency,
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
