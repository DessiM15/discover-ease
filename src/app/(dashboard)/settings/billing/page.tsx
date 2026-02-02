"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { CreditCard, ExternalLink, Calendar, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

type SubscriptionTier = "solo" | "small" | "medium" | "large" | "enterprise";

interface PaymentMethod {
  type: string;
  brand: string;
  last4: string;
  expMonth: number;
  expYear: number;
}

interface Subscription {
  id: string;
  status: string;
  tier: string;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
}

interface Invoice {
  id: string;
  number: string | null;
  amount: number;
  status: string | null;
  date: string | null;
  pdfUrl: string | null;
  hostedUrl: string | null;
}

interface TierInfo {
  name: string;
  minUsers: number;
  maxUsers: number;
  price: number;
  priceFormatted: string;
  features: string[];
}

interface BillingData {
  subscription: Subscription | null;
  paymentMethod: PaymentMethod | null;
  invoices: Invoice[];
  tiers: Record<SubscriptionTier, TierInfo>;
}

export default function BillingSettingsPage() {
  const queryClient = useQueryClient();
  const [upgradeDialogOpen, setUpgradeDialogOpen] = useState(false);
  const [selectedTier, setSelectedTier] = useState<SubscriptionTier | null>(null);

  const { data: billingData, isLoading } = useQuery<BillingData>({
    queryKey: ["billing-subscription"],
    queryFn: async () => {
      const res = await fetch("/api/billing/subscription");
      if (!res.ok) {
        throw new Error("Failed to fetch billing data");
      }
      return res.json();
    },
  });

  const checkoutMutation = useMutation({
    mutationFn: async (tier: SubscriptionTier) => {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to create checkout session");
      }
      return res.json();
    },
    onSuccess: async (data) => {
      // For embedded checkout, we would use Stripe.js
      // For now, we'll redirect to Stripe's hosted checkout
      toast.success("Redirecting to checkout...");
      // In production, use Stripe.js with the clientSecret for embedded checkout
      // For simplicity, we'll use the customer portal for upgrades
      handleManageBilling();
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const portalMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/billing/portal", {
        method: "POST",
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to open billing portal");
      }
      return res.json();
    },
    onSuccess: (data) => {
      window.open(data.url, "_blank");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const handleUpgrade = (tier: SubscriptionTier) => {
    setSelectedTier(tier);
    if (billingData?.subscription) {
      // If already subscribed, use portal to change plan
      handleManageBilling();
    } else {
      // New subscription
      checkoutMutation.mutate(tier);
    }
    setUpgradeDialogOpen(false);
  };

  const handleManageBilling = () => {
    portalMutation.mutate();
  };

  const formatCardBrand = (brand: string) => {
    const brands: Record<string, string> = {
      visa: "Visa",
      mastercard: "Mastercard",
      amex: "American Express",
      discover: "Discover",
    };
    return brands[brand] || brand.charAt(0).toUpperCase() + brand.slice(1);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const subscription = billingData?.subscription;
  const paymentMethod = billingData?.paymentMethod;
  const invoices = billingData?.invoices || [];
  const tiers = billingData?.tiers;

  const currentTier = subscription?.tier || "none";
  const subscriptionStatus = subscription?.status || "inactive";

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Billing & Subscription</h1>
        <p className="mt-1 text-muted-foreground">Manage your subscription and payment methods</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Current Plan</CardTitle>
          <CardDescription>Your active subscription plan</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-semibold text-foreground">
                    {tiers && currentTier !== "none"
                      ? tiers[currentTier as SubscriptionTier]?.name || "Free"
                      : "No Active Plan"}
                  </h3>
                  {subscription && (
                    <Badge
                      variant={subscriptionStatus === "active" ? "success" : "destructive"}
                    >
                      {subscriptionStatus}
                    </Badge>
                  )}
                  {subscription?.cancelAtPeriodEnd && (
                    <Badge variant="secondary">Cancels at period end</Badge>
                  )}
                </div>
                {subscription?.currentPeriodEnd && (
                  <p className="mt-1 text-sm text-muted-foreground">
                    {subscription.cancelAtPeriodEnd
                      ? `Access until ${formatDate(subscription.currentPeriodEnd)}`
                      : `Renews on ${formatDate(subscription.currentPeriodEnd)}`}
                  </p>
                )}
              </div>
              <Dialog open={upgradeDialogOpen} onOpenChange={setUpgradeDialogOpen}>
                <DialogTrigger asChild>
                  <Button>{subscription ? "Change Plan" : "Subscribe"}</Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl">
                  <DialogHeader>
                    <DialogTitle>Choose a Plan</DialogTitle>
                    <DialogDescription>
                      Select the plan that best fits your firm's needs
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mt-4">
                    {tiers &&
                      (Object.entries(tiers) as [SubscriptionTier, TierInfo][]).map(
                        ([key, tier]) => (
                          <div
                            key={key}
                            className={`rounded-lg border p-4 ${
                              currentTier === key
                                ? "border-primary bg-primary/5"
                                : "border-border"
                            }`}
                          >
                            <h4 className="font-semibold">{tier.name}</h4>
                            <p className="text-2xl font-bold mt-2">{tier.priceFormatted}</p>
                            <p className="text-xs text-muted-foreground mb-3">
                              {tier.minUsers}-{tier.maxUsers === Infinity ? "∞" : tier.maxUsers} users
                            </p>
                            <ul className="space-y-1 mb-4">
                              {tier.features.slice(0, 3).map((feature, i) => (
                                <li key={i} className="text-xs flex items-start gap-1">
                                  <Check className="h-3 w-3 text-green-500 mt-0.5 shrink-0" />
                                  <span>{feature}</span>
                                </li>
                              ))}
                            </ul>
                            <Button
                              size="sm"
                              className="w-full"
                              variant={currentTier === key ? "outline" : "default"}
                              disabled={currentTier === key || checkoutMutation.isPending}
                              onClick={() => handleUpgrade(key)}
                            >
                              {currentTier === key ? "Current" : "Select"}
                            </Button>
                          </div>
                        )
                      )}
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {tiers && currentTier !== "none" && tiers[currentTier as SubscriptionTier] && (
              <div className="rounded-lg border border-border p-4">
                <h4 className="mb-2 font-medium text-foreground">Plan Features</h4>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  {tiers[currentTier as SubscriptionTier].features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Payment Method</CardTitle>
          <CardDescription>Manage your payment information</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CreditCard className="h-8 w-8 text-muted-foreground" />
              {paymentMethod ? (
                <div>
                  <p className="font-medium text-foreground">
                    {formatCardBrand(paymentMethod.brand)} ending in {paymentMethod.last4}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Expires {paymentMethod.expMonth}/{paymentMethod.expYear}
                  </p>
                </div>
              ) : (
                <div>
                  <p className="font-medium text-foreground">No payment method</p>
                  <p className="text-sm text-muted-foreground">
                    Add a payment method to subscribe
                  </p>
                </div>
              )}
            </div>
            <Button
              variant="outline"
              onClick={handleManageBilling}
              disabled={portalMutation.isPending || !billingData?.subscription}
            >
              {portalMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              {paymentMethod ? "Update Payment Method" : "Add Payment Method"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Billing History</CardTitle>
          <CardDescription>View past invoices and payments</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {invoices.length > 0 ? (
              invoices.map((invoice) => (
                <div
                  key={invoice.id}
                  className="flex items-center justify-between rounded-lg border border-border p-4"
                >
                  <div>
                    <p className="font-medium text-foreground">
                      Invoice {invoice.number || invoice.id.slice(0, 8)}
                    </p>
                    <p className="text-sm text-muted-foreground">{formatDate(invoice.date)}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="font-medium text-foreground">
                        ${invoice.amount.toFixed(2)}
                      </p>
                      <Badge
                        variant={invoice.status === "paid" ? "success" : "secondary"}
                      >
                        {invoice.status || "Unknown"}
                      </Badge>
                    </div>
                    {invoice.pdfUrl && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => window.open(invoice.pdfUrl!, "_blank")}
                        title="Download Invoice"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No invoices found</p>
            )}
          </div>
        </CardContent>
      </Card>

      {subscription?.currentPeriodEnd && (
        <Card>
          <CardHeader>
            <CardTitle>Next Billing Date</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <p className="text-foreground">{formatDate(subscription.currentPeriodEnd)}</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
