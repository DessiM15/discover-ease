import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getStripeClient } from "@/lib/stripe/client";
import { SUBSCRIPTION_TIERS } from "@/lib/stripe/payments";

export async function GET(request: NextRequest) {
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
      .select("stripe_customer_id, subscription_tier, subscription_status")
      .eq("id", userData.firm_id)
      .single();

    if (!firm?.stripe_customer_id) {
      return NextResponse.json({
        subscription: null,
        paymentMethod: null,
        invoices: [],
        tiers: SUBSCRIPTION_TIERS,
      });
    }

    const stripe = getStripeClient();

    // Get active subscription
    const subscriptions = await stripe.subscriptions.list({
      customer: firm.stripe_customer_id,
      status: "active",
      limit: 1,
      expand: ["data.default_payment_method"],
    });

    let subscription = null;
    let paymentMethod = null;

    if (subscriptions.data.length > 0) {
      const sub = subscriptions.data[0];
      const currentPeriodEnd = (sub as unknown as { current_period_end?: number }).current_period_end;

      subscription = {
        id: sub.id,
        status: sub.status,
        tier: sub.metadata.tier || firm.subscription_tier,
        currentPeriodEnd: currentPeriodEnd
          ? new Date(currentPeriodEnd * 1000).toISOString()
          : null,
        cancelAtPeriodEnd: sub.cancel_at_period_end,
      };

      // Get payment method details
      if (sub.default_payment_method && typeof sub.default_payment_method !== "string") {
        const pm = sub.default_payment_method;
        if (pm.type === "card" && pm.card) {
          paymentMethod = {
            type: "card",
            brand: pm.card.brand,
            last4: pm.card.last4,
            expMonth: pm.card.exp_month,
            expYear: pm.card.exp_year,
          };
        }
      }
    }

    // If no payment method from subscription, try to get from customer
    if (!paymentMethod) {
      const paymentMethods = await stripe.paymentMethods.list({
        customer: firm.stripe_customer_id,
        type: "card",
        limit: 1,
      });

      if (paymentMethods.data.length > 0) {
        const pm = paymentMethods.data[0];
        if (pm.card) {
          paymentMethod = {
            type: "card",
            brand: pm.card.brand,
            last4: pm.card.last4,
            expMonth: pm.card.exp_month,
            expYear: pm.card.exp_year,
          };
        }
      }
    }

    // Get recent invoices
    const stripeInvoices = await stripe.invoices.list({
      customer: firm.stripe_customer_id,
      limit: 10,
    });

    const invoices = stripeInvoices.data.map((inv) => ({
      id: inv.id,
      number: inv.number,
      amount: inv.amount_paid / 100,
      status: inv.status,
      date: inv.created ? new Date(inv.created * 1000).toISOString() : null,
      pdfUrl: inv.invoice_pdf,
      hostedUrl: inv.hosted_invoice_url,
    }));

    return NextResponse.json({
      subscription,
      paymentMethod,
      invoices,
      tiers: SUBSCRIPTION_TIERS,
    });
  } catch (error: unknown) {
    console.error("Error fetching subscription data:", error);
    const message = error instanceof Error ? error.message : "Failed to fetch subscription data";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
