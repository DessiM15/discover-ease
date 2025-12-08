import { getStripeClient } from "./client";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

// Subscription pricing tiers based on user count
export const SUBSCRIPTION_TIERS = {
  solo: {
    name: "Solo",
    minUsers: 1,
    maxUsers: 2,
    price: 25000, // $250.00 in cents
    priceFormatted: "$250/month",
    features: [
      "Case Management",
      "Document Storage (50GB)",
      "Billing & Invoicing",
      "Calendar Integration",
      "Email Support",
    ],
  },
  small: {
    name: "Small",
    minUsers: 3,
    maxUsers: 5,
    price: 35000, // $350.00
    priceFormatted: "$350/month",
    features: [
      "Everything in Solo",
      "Document Storage (200GB)",
      "Team Collaboration",
      "Workflow Automation",
      "Priority Support",
    ],
  },
  medium: {
    name: "Medium",
    minUsers: 6,
    maxUsers: 10,
    price: 55000, // $550.00
    priceFormatted: "$550/month",
    features: [
      "Everything in Small",
      "Document Storage (500GB)",
      "Advanced Reporting",
      "API Access",
      "Phone Support",
    ],
  },
  large: {
    name: "Large",
    minUsers: 11,
    maxUsers: 20,
    price: 65000, // $650.00
    priceFormatted: "$650/month",
    features: [
      "Everything in Medium",
      "Document Storage (1TB)",
      "Custom Integrations",
      "Dedicated Account Manager",
      "SLA Guarantee",
    ],
  },
  enterprise: {
    name: "Enterprise",
    minUsers: 21,
    maxUsers: Infinity,
    price: 85000, // $850.00
    priceFormatted: "$850/month",
    features: [
      "Everything in Large",
      "Unlimited Storage",
      "White-label Options",
      "Custom Development",
      "24/7 Support",
    ],
  },
} as const;

export type SubscriptionTier = keyof typeof SUBSCRIPTION_TIERS;

// Get recommended tier based on user count
export function getRecommendedTier(userCount: number): SubscriptionTier {
  if (userCount <= 2) return "solo";
  if (userCount <= 5) return "small";
  if (userCount <= 10) return "medium";
  if (userCount <= 20) return "large";
  return "enterprise";
}

// Create or get Stripe customer for a firm
export async function getOrCreateStripeCustomer(firm: {
  id: string;
  name: string;
  email: string;
  stripeCustomerId?: string | null;
}): Promise<string> {
  const stripe = getStripeClient();

  if (firm.stripeCustomerId) {
    return firm.stripeCustomerId;
  }

  const customer = await stripe.customers.create({
    name: firm.name,
    email: firm.email,
    metadata: {
      firmId: firm.id,
    },
  });

  return customer.id;
}

// Create embedded checkout session for firm subscription
export async function createSubscriptionCheckoutSession(options: {
  firmId: string;
  customerId: string;
  tier: SubscriptionTier;
  successUrl?: string;
  cancelUrl?: string;
}): Promise<{ clientSecret: string }> {
  const stripe = getStripeClient();
  const tierInfo = SUBSCRIPTION_TIERS[options.tier];

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: options.customerId,
    ui_mode: "embedded",
    return_url: options.successUrl || `${APP_URL}/settings/billing?success=true`,
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: `DiscoverEase ${tierInfo.name} Plan`,
            description: tierInfo.features.join(", "),
          },
          unit_amount: tierInfo.price,
          recurring: {
            interval: "month",
          },
        },
        quantity: 1,
      },
    ],
    metadata: {
      firmId: options.firmId,
      tier: options.tier,
    },
    subscription_data: {
      metadata: {
        firmId: options.firmId,
        tier: options.tier,
      },
    },
  });

  if (!session.client_secret) {
    throw new Error("Failed to create checkout session");
  }

  return { clientSecret: session.client_secret };
}

// Create hosted checkout session for client invoice payment
export async function createInvoicePaymentSession(options: {
  invoiceId: string;
  firmId: string;
  clientEmail: string;
  clientName: string;
  amount: number; // in dollars
  invoiceNumber: string;
  caseName?: string;
  successUrl?: string;
  cancelUrl?: string;
}): Promise<{ url: string; sessionId: string }> {
  const stripe = getStripeClient();

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: options.clientEmail,
    success_url: options.successUrl || `${APP_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: options.cancelUrl || `${APP_URL}/payment/cancel`,
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: `Invoice ${options.invoiceNumber}`,
            description: options.caseName ? `Payment for ${options.caseName}` : "Legal Services",
          },
          unit_amount: Math.round(options.amount * 100), // Convert to cents
        },
        quantity: 1,
      },
    ],
    metadata: {
      invoiceId: options.invoiceId,
      firmId: options.firmId,
      invoiceNumber: options.invoiceNumber,
    },
    payment_intent_data: {
      metadata: {
        invoiceId: options.invoiceId,
        firmId: options.firmId,
        invoiceNumber: options.invoiceNumber,
      },
    },
  });

  if (!session.url) {
    throw new Error("Failed to create payment session");
  }

  return { url: session.url, sessionId: session.id };
}

// Create payment link for invoice (can be shared via email or portal)
export async function createInvoicePaymentLink(options: {
  invoiceId: string;
  firmId: string;
  amount: number; // in dollars
  invoiceNumber: string;
  caseName?: string;
}): Promise<{ url: string; paymentLinkId: string }> {
  const stripe = getStripeClient();

  const paymentLink = await stripe.paymentLinks.create({
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: `Invoice ${options.invoiceNumber}`,
            description: options.caseName ? `Payment for ${options.caseName}` : "Legal Services",
          },
          unit_amount: Math.round(options.amount * 100),
        },
        quantity: 1,
      },
    ],
    metadata: {
      invoiceId: options.invoiceId,
      firmId: options.firmId,
      invoiceNumber: options.invoiceNumber,
    },
    after_completion: {
      type: "redirect",
      redirect: {
        url: `${APP_URL}/payment/success?link_id={CHECKOUT_SESSION_ID}`,
      },
    },
  });

  return { url: paymentLink.url, paymentLinkId: paymentLink.id };
}

// Get subscription status
export async function getSubscriptionStatus(customerId: string): Promise<{
  status: string;
  currentPeriodEnd: Date | null;
  cancelAtPeriodEnd: boolean;
  tier: SubscriptionTier | null;
} | null> {
  const stripe = getStripeClient();

  const subscriptions = await stripe.subscriptions.list({
    customer: customerId,
    status: "active",
    limit: 1,
  });

  if (subscriptions.data.length === 0) {
    return null;
  }

  const subscription = subscriptions.data[0];
  // Access current_period_end from subscription items or use 0 as fallback
  const periodEnd = (subscription as unknown as { current_period_end?: number }).current_period_end ?? 0;
  return {
    status: subscription.status,
    currentPeriodEnd: new Date(periodEnd * 1000),
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
    tier: (subscription.metadata.tier as SubscriptionTier) || null,
  };
}

// Cancel subscription at period end
export async function cancelSubscription(subscriptionId: string): Promise<void> {
  const stripe = getStripeClient();
  await stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: true,
  });
}

// Resume cancelled subscription
export async function resumeSubscription(subscriptionId: string): Promise<void> {
  const stripe = getStripeClient();
  await stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: false,
  });
}

// Update payment method
export async function createSetupSession(customerId: string): Promise<{ clientSecret: string }> {
  const stripe = getStripeClient();

  const session = await stripe.checkout.sessions.create({
    mode: "setup",
    customer: customerId,
    ui_mode: "embedded",
    return_url: `${APP_URL}/settings/billing?payment_updated=true`,
  });

  if (!session.client_secret) {
    throw new Error("Failed to create setup session");
  }

  return { clientSecret: session.client_secret };
}

// Get customer portal session (for managing subscription)
export async function createCustomerPortalSession(customerId: string): Promise<{ url: string }> {
  const stripe = getStripeClient();

  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${APP_URL}/settings/billing`,
  });

  return { url: session.url };
}

// Process refund
export async function processRefund(options: {
  paymentIntentId: string;
  amount?: number; // Partial refund in cents, omit for full refund
  reason?: "duplicate" | "fraudulent" | "requested_by_customer";
}): Promise<{ refundId: string; status: string }> {
  const stripe = getStripeClient();

  const refund = await stripe.refunds.create({
    payment_intent: options.paymentIntentId,
    amount: options.amount,
    reason: options.reason,
  });

  return { refundId: refund.id, status: refund.status || "unknown" };
}

// Get payment intent details
export async function getPaymentIntent(paymentIntentId: string) {
  const stripe = getStripeClient();
  return stripe.paymentIntents.retrieve(paymentIntentId);
}

// Get checkout session details
export async function getCheckoutSession(sessionId: string) {
  const stripe = getStripeClient();
  return stripe.checkout.sessions.retrieve(sessionId, {
    expand: ["payment_intent", "subscription"],
  });
}
