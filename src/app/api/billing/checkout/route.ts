import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  createSubscriptionCheckoutSession,
  getOrCreateStripeCustomer,
  SUBSCRIPTION_TIERS,
  type SubscriptionTier,
} from "@/lib/stripe/payments";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { tier } = await request.json();

    if (!tier || !SUBSCRIPTION_TIERS[tier as SubscriptionTier]) {
      return NextResponse.json(
        { error: "Invalid subscription tier" },
        { status: 400 }
      );
    }

    // Get user's firm
    const { data: userData } = await supabase
      .from("users")
      .select("firm_id")
      .eq("id", user.id)
      .single();

    if (!userData?.firm_id) {
      return NextResponse.json(
        { error: "User is not associated with a firm" },
        { status: 400 }
      );
    }

    // Get firm details
    const { data: firm } = await supabase
      .from("firms")
      .select("*")
      .eq("id", userData.firm_id)
      .single();

    if (!firm) {
      return NextResponse.json({ error: "Firm not found" }, { status: 404 });
    }

    // Create or get Stripe customer
    const customerId = await getOrCreateStripeCustomer({
      id: firm.id,
      name: firm.name,
      email: firm.email,
      stripeCustomerId: firm.stripe_customer_id,
    });

    // Update firm with Stripe customer ID if new
    if (!firm.stripe_customer_id) {
      await supabase
        .from("firms")
        .update({ stripe_customer_id: customerId })
        .eq("id", firm.id);
    }

    // Create checkout session
    const { clientSecret } = await createSubscriptionCheckoutSession({
      firmId: firm.id,
      customerId,
      tier: tier as SubscriptionTier,
    });

    return NextResponse.json({ clientSecret });
  } catch (error: unknown) {
    console.error("Error creating checkout session:", error);
    const message = error instanceof Error ? error.message : "Failed to create checkout session";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
