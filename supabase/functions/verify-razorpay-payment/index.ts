import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface VerifyRequest {
  razorpay_subscription_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  planType: 'weekly' | 'monthly' | 'yearly';
  userId: string;
}

// Razorpay Plan IDs
const PLAN_IDS: Record<string, string> = {
  weekly: "plan_RxMDmARDD8Dt24",
  monthly: "plan_RxMEh5qs9fRzi4",
  yearly: "plan_RxMEyMuVsT9bSU",
};

const PLAN_DURATIONS: Record<string, number> = {
  weekly: 7,
  monthly: 30,
  yearly: 365,
};

async function verifySignature(
  subscriptionId: string,
  paymentId: string,
  signature: string,
  secret: string
): Promise<boolean> {
  const encoder = new TextEncoder();
  const data = encoder.encode(`${paymentId}|${subscriptionId}`);
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
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  
  return computedSignature === signature;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      razorpay_subscription_id, 
      razorpay_payment_id, 
      razorpay_signature, 
      planType, 
      userId 
    } = await req.json() as VerifyRequest;

    if (!razorpay_subscription_id || !razorpay_payment_id || !razorpay_signature || !planType || !userId) {
      throw new Error("Missing required fields");
    }

    const razorpayKeySecret = Deno.env.get("RAZORPAY_KEY_SECRET");
    if (!razorpayKeySecret) {
      throw new Error("Razorpay secret not configured");
    }

    // Verify signature for subscription payments
    const isValid = await verifySignature(
      razorpay_subscription_id,
      razorpay_payment_id,
      razorpay_signature,
      razorpayKeySecret
    );

    if (!isValid) {
      console.error("Invalid payment signature");
      throw new Error("Payment verification failed - invalid signature");
    }

    console.log("Payment signature verified successfully");

    // Initialize Supabase client with service role
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Calculate subscription dates
    const durationDays = PLAN_DURATIONS[planType];
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + durationDays);

    // Update user subscription
    const { data, error } = await supabase
      .from("user_subscriptions")
      .upsert({
        user_id: userId,
        plan_type: planType,
        subscription_start_date: startDate.toISOString(),
        subscription_end_date: endDate.toISOString(),
        is_active: true,
        razorpay_payment_id: razorpay_payment_id,
        razorpay_subscription_id: razorpay_subscription_id,
        razorpay_plan_id: PLAN_IDS[planType],
        updated_at: new Date().toISOString(),
      }, { 
        onConflict: "user_id" 
      })
      .select()
      .single();

    if (error) {
      console.error("Database update error:", error);
      throw new Error(`Failed to update subscription: ${error.message}`);
    }

    console.log("Subscription updated successfully for user:", userId);

    return new Response(
      JSON.stringify({
        success: true,
        subscription: {
          plan_type: data.plan_type,
          subscription_start_date: data.subscription_start_date,
          subscription_end_date: data.subscription_end_date,
        },
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error verifying payment:", error);
    return new Response(
      JSON.stringify({ error: errorMessage, success: false }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
