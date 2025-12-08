import { NextRequest, NextResponse } from "next/server";
import { getStripeClient } from "@/lib/stripe/client";
import { createClient } from "@/lib/supabase/server";
import { sendEmail, emailTemplates } from "@/lib/email/sendgrid";
import type Stripe from "stripe";

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "No signature" }, { status: 400 });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("STRIPE_WEBHOOK_SECRET not configured");
    return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 });
  }

  const stripe = getStripeClient();
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (error) {
    console.error("Webhook signature verification failed:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Invalid signature" },
      { status: 400 }
    );
  }

  const supabase = await createClient();

  try {
    switch (event.type) {
      // Client invoice payment succeeded
      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const invoiceId = paymentIntent.metadata?.invoiceId;
        const firmId = paymentIntent.metadata?.firmId;

        if (invoiceId) {
          // Get invoice details
          const { data: invoice } = await supabase
            .from("invoices")
            .select("*, contacts(*), firms(*), cases(*)")
            .eq("id", invoiceId)
            .single();

          if (invoice) {
            const amountPaid = paymentIntent.amount / 100;
            const newAmountPaid = Number(invoice.amount_paid || 0) + amountPaid;
            const newBalance = Number(invoice.total) - newAmountPaid;
            const isPaidInFull = newBalance <= 0;

            // Update invoice status
            await supabase
              .from("invoices")
              .update({
                status: isPaidInFull ? "paid" : "partial",
                amount_paid: newAmountPaid,
                balance: Math.max(0, newBalance),
                paid_at: isPaidInFull ? new Date().toISOString() : null,
                updated_at: new Date().toISOString(),
              })
              .eq("id", invoiceId);

            // Create payment record
            await supabase.from("payments").insert({
              firm_id: firmId || invoice.firm_id,
              invoice_id: invoiceId,
              contact_id: invoice.contact_id,
              amount: amountPaid,
              method: "credit_card",
              stripe_payment_id: paymentIntent.id,
              received_date: new Date().toISOString(),
              notes: `Stripe payment ${paymentIntent.id}`,
            });

            // Send payment confirmation email
            if (invoice.contacts?.email) {
              const template = emailTemplates.paymentConfirmation({
                clientName: `${invoice.contacts.first_name || ""} ${invoice.contacts.last_name || ""}`.trim() || "Client",
                firmName: invoice.firms?.name || "Your Law Firm",
                invoiceNumber: invoice.invoice_number,
                amount: `$${amountPaid.toFixed(2)}`,
                paymentDate: new Date().toLocaleDateString(),
                paymentMethod: "Credit Card",
                remainingBalance: !isPaidInFull ? `$${newBalance.toFixed(2)}` : undefined,
              });

              await sendEmail({
                to: invoice.contacts.email,
                subject: template.subject,
                html: template.html,
                text: template.text,
              });
            }

            // Create notification for firm
            const { data: firmUsers } = await supabase
              .from("users")
              .select("id")
              .eq("firm_id", invoice.firm_id)
              .in("role", ["owner", "admin", "billing"]);

            if (firmUsers) {
              await supabase.from("notifications").insert(
                firmUsers.map((user) => ({
                  user_id: user.id,
                  type: "payment_received",
                  title: "Payment Received",
                  message: `Payment of $${amountPaid.toFixed(2)} received for Invoice ${invoice.invoice_number}`,
                  entity_type: "invoice",
                  entity_id: invoiceId,
                  action_url: `/billing/invoices/${invoiceId}`,
                }))
              );
            }
          }
        }
        break;
      }

      // Subscription created
      case "customer.subscription.created": {
        const subscription = event.data.object as Stripe.Subscription;
        const firmId = subscription.metadata?.firmId;
        const tier = subscription.metadata?.tier;

        if (firmId) {
          await supabase
            .from("firms")
            .update({
              subscription_tier: tier,
              subscription_status: subscription.status,
              updated_at: new Date().toISOString(),
            })
            .eq("id", firmId);
        }
        break;
      }

      // Subscription updated
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const firmId = subscription.metadata?.firmId;
        const tier = subscription.metadata?.tier;

        if (firmId) {
          await supabase
            .from("firms")
            .update({
              subscription_tier: tier,
              subscription_status: subscription.status,
              updated_at: new Date().toISOString(),
            })
            .eq("id", firmId);
        }
        break;
      }

      // Subscription deleted/cancelled
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const firmId = subscription.metadata?.firmId;

        if (firmId) {
          await supabase
            .from("firms")
            .update({
              subscription_status: "cancelled",
              updated_at: new Date().toISOString(),
            })
            .eq("id", firmId);

          // Notify firm owner
          const { data: owner } = await supabase
            .from("users")
            .select("id, email")
            .eq("firm_id", firmId)
            .eq("role", "owner")
            .single();

          if (owner) {
            await supabase.from("notifications").insert({
              user_id: owner.id,
              type: "subscription_cancelled",
              title: "Subscription Cancelled",
              message: "Your DiscoverEase subscription has been cancelled. Please renew to continue using all features.",
              action_url: "/settings/billing",
            });
          }
        }
        break;
      }

      // Invoice payment failed (subscription)
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;

        // Find firm by customer ID
        const { data: firm } = await supabase
          .from("firms")
          .select("id, name, email")
          .eq("stripe_customer_id", customerId)
          .single();

        if (firm) {
          // Notify firm owner
          const { data: owner } = await supabase
            .from("users")
            .select("id, email")
            .eq("firm_id", firm.id)
            .eq("role", "owner")
            .single();

          if (owner) {
            await supabase.from("notifications").insert({
              user_id: owner.id,
              type: "payment_failed",
              title: "Payment Failed",
              message: "Your subscription payment failed. Please update your payment method to avoid service interruption.",
              action_url: "/settings/billing",
            });
          }
        }
        break;
      }

      // Checkout session completed
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;

        // Handle invoice payment via checkout
        if (session.mode === "payment" && session.metadata?.invoiceId) {
          // Payment processing handled by payment_intent.succeeded
          console.log(`Checkout completed for invoice ${session.metadata.invoiceId}`);
        }

        // Handle subscription checkout
        if (session.mode === "subscription" && session.metadata?.firmId) {
          const firmId = session.metadata.firmId;
          const tier = session.metadata.tier;
          const customerId = session.customer as string;

          await supabase
            .from("firms")
            .update({
              stripe_customer_id: customerId,
              subscription_tier: tier,
              subscription_status: "active",
              updated_at: new Date().toISOString(),
            })
            .eq("id", firmId);
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
  } catch (error) {
    console.error(`Error processing webhook ${event.type}:`, error);
    // Return 200 to acknowledge receipt, even if processing fails
    // Stripe will retry otherwise
  }

  return NextResponse.json({ received: true });
}
