import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe/client";
import { createClient } from "@/lib/supabase/server";

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "No signature" }, { status: 400 });
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (error: any) {
    console.error("Webhook signature verification failed:", error.message);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  if (event.type === "payment_intent.succeeded") {
    const paymentIntent = event.data.object as any;
    const invoiceId = paymentIntent.metadata?.invoiceId;

    if (invoiceId) {
      const supabase = await createClient();

      // Update invoice status
      await supabase
        .from("invoices")
        .update({
          status: "paid",
          amount_paid: paymentIntent.amount / 100,
          paid_at: new Date().toISOString(),
        })
        .eq("id", invoiceId);

      // Create payment record
      await supabase.from("payments").insert({
        invoice_id: invoiceId,
        amount: paymentIntent.amount / 100,
        method: "credit_card",
        stripe_payment_id: paymentIntent.id,
        received_date: new Date().toISOString(),
      });
    }
  }

  return NextResponse.json({ received: true });
}

