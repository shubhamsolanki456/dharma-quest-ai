import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface VerifyPaymentRequest {
  razorpay_payment_id: string;
  razorpay_subscription_id: string;
  razorpay_signature: string;
  plan_type: "weekly" | "monthly" | "yearly";
}

// Calculate subscription end date based on plan
function getSubscriptionEndDate(planType: string): Date {
  const endDate = new Date();
  switch (planType) {
    case "weekly":
      endDate.setDate(endDate.getDate() + 7);
      break;
    case "monthly":
      endDate.setMonth(endDate.getMonth() + 1);
      break;
    case "yearly":
      endDate.setFullYear(endDate.getFullYear() + 1);
      break;
    default:
      endDate.setMonth(endDate.getMonth() + 1);
  }
  return endDate;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const RAZORPAY_KEY_SECRET = Deno.env.get("RAZORPAY_KEY_SECRET");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!RAZORPAY_KEY_SECRET) {
      throw new Error("Razorpay secret not configured");
    }

    // Get the authorization header to extract user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // Get user from token
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      throw new Error("Unauthorized");
    }

    const { 
      razorpay_payment_id, 
      razorpay_subscription_id, 
      razorpay_signature,
      plan_type 
    }: VerifyPaymentRequest = await req.json();

    console.log(`Verifying payment for user ${user.id}, subscription: ${razorpay_subscription_id}`);

    // Verify signature
    const crypto = await import("https://deno.land/std@0.190.0/crypto/mod.ts");
    const encoder = new TextEncoder();
    const key = await crypto.crypto.subtle.importKey(
      "raw",
      encoder.encode(RAZORPAY_KEY_SECRET),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );

    const signatureData = `${razorpay_payment_id}|${razorpay_subscription_id}`;
    const signatureBytes = await crypto.crypto.subtle.sign(
      "HMAC",
      key,
      encoder.encode(signatureData)
    );

    const expectedSignature = Array.from(new Uint8Array(signatureBytes))
      .map(b => b.toString(16).padStart(2, "0"))
      .join("");

    if (expectedSignature !== razorpay_signature) {
      console.error("Signature verification failed");
      throw new Error("Payment verification failed");
    }

    console.log("Payment signature verified successfully");

    // Update subscription in database
    const endDate = getSubscriptionEndDate(plan_type);

    const { error: updateError } = await supabase
      .from("user_subscriptions")
      .update({
        plan_type: plan_type,
        subscription_start_date: new Date().toISOString(),
        subscription_end_date: endDate.toISOString(),
        is_active: true,
        razorpay_payment_id: razorpay_payment_id,
        razorpay_subscription_id: razorpay_subscription_id,
      })
      .eq("user_id", user.id);

    if (updateError) {
      console.error("Failed to update subscription:", updateError);
      throw new Error("Failed to update subscription");
    }

    console.log(`Subscription activated for user ${user.id}, plan: ${plan_type}`);

    return new Response(
      JSON.stringify({ success: true, plan_type }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Payment verification error:", error);
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
