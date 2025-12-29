import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface VerifyRequest {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  planType: 'weekly' | 'monthly' | 'yearly';
  userId: string;
}

// Plan durations in days
const PLAN_DURATIONS: Record<string, number> = {
  weekly: 7,
  monthly: 30,
  yearly: 365,
};

// Verify signature using HMAC SHA256 (as per Razorpay Standard Checkout docs)
// Signature = hmac_sha256(order_id + "|" + razorpay_payment_id, secret)
async function verifySignature(
  orderId: string,
  paymentId: string,
  signature: string,
  secret: string
): Promise<boolean> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  // Generate signature: order_id + "|" + razorpay_payment_id
  const message = `${orderId}|${paymentId}`;
  const signatureBuffer = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(message)
  );

  const generatedSignature = Array.from(new Uint8Array(signatureBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  console.log("Signature verification:", { 
    message, 
    generatedSignature: generatedSignature.slice(0, 20) + "...", 
    providedSignature: signature.slice(0, 20) + "..." 
  });

  return generatedSignature === signature;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json() as VerifyRequest;
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, planType, userId } = body;

    console.log("Verifying payment:", { razorpay_order_id, razorpay_payment_id, planType, userId });

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !planType || !userId) {
      throw new Error("Missing required fields for verification");
    }

    const razorpayKeySecret = Deno.env.get("RAZORPAY_KEY_SECRET");
    if (!razorpayKeySecret) {
      throw new Error("Razorpay secret not configured");
    }

    // Verify signature
    const isValid = await verifySignature(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      razorpayKeySecret
    );

    if (!isValid) {
      console.error("Invalid payment signature");
      return new Response(
        JSON.stringify({ success: false, error: "Invalid payment signature" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    console.log("Payment signature verified successfully");

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Calculate subscription dates
    const now = new Date();
    const durationDays = PLAN_DURATIONS[planType] || 30;
    const endDate = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);

    // Update user subscription in database
    const { error: updateError } = await supabase
      .from("user_subscriptions")
      .upsert({
        user_id: userId,
        is_active: true,
        plan_type: planType,
        razorpay_payment_id: razorpay_payment_id,
        razorpay_subscription_id: razorpay_order_id, // Store order ID here
        subscription_start_date: now.toISOString(),
        subscription_end_date: endDate.toISOString(),
        updated_at: now.toISOString(),
      }, { onConflict: "user_id" });

    if (updateError) {
      console.error("Failed to update subscription:", updateError);
      throw new Error("Failed to update subscription");
    }

    console.log("Subscription activated successfully for user:", userId);

    return new Response(
      JSON.stringify({
        success: true,
        planType,
        subscriptionEndDate: endDate.toISOString(),
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
      JSON.stringify({ success: false, error: errorMessage }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
