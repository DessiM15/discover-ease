import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createCustomerPortalSession } from "@/lib/stripe/payments";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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

    // Get firm with Stripe customer ID
    const { data: firm } = await supabase
      .from("firms")
      .select("stripe_customer_id")
      .eq("id", userData.firm_id)
      .single();

    if (!firm?.stripe_customer_id) {
      return NextResponse.json(
        { error: "No billing account found. Please subscribe to a plan first." },
        { status: 400 }
      );
    }

    // Create portal session
    const { url } = await createCustomerPortalSession(firm.stripe_customer_id);

    return NextResponse.json({ url });
  } catch (error: unknown) {
    console.error("Error creating portal session:", error);
    const message = error instanceof Error ? error.message : "Failed to create portal session";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
