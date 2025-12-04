"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/providers/auth-provider";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import { CreditCard, ExternalLink, Calendar } from "lucide-react";
import { toast } from "sonner";

export default function BillingSettingsPage() {
  const { user } = useAuth();
  const supabase = createClient();
  const router = useRouter();

  const { data: firmData } = useQuery({
    queryKey: ["firm", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data: userData } = await supabase
        .from("users")
        .select("firm_id")
        .eq("id", user.id)
        .single();

      if (!userData?.firm_id) return null;

      const { data } = await supabase
        .from("firms")
        .select("*")
        .eq("id", userData.firm_id)
        .single();

      return data;
    },
    enabled: !!user,
  });

  const subscriptionTier = firmData?.subscription_tier || "Starter";
  const subscriptionStatus = firmData?.subscription_status || "active";

  const handleUpgrade = () => {
    // TODO: Implement Stripe checkout
    toast.info("Upgrade functionality coming soon");
  };

  const handleUpdatePayment = () => {
    // TODO: Implement Stripe payment method update
    toast.info("Payment method update coming soon");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Billing & Subscription</h1>
        <p className="mt-1 text-slate-400">Manage your subscription and payment methods</p>
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
                  <h3 className="text-xl font-semibold text-white">{subscriptionTier}</h3>
                  <Badge
                    variant={subscriptionStatus === "active" ? "success" : "destructive"}
                  >
                    {subscriptionStatus}
                  </Badge>
                </div>
                <p className="mt-1 text-sm text-slate-400">
                  {subscriptionTier === "Starter" && "Perfect for small firms"}
                  {subscriptionTier === "Professional" && "Ideal for growing practices"}
                  {subscriptionTier === "Enterprise" && "For large law firms"}
                </p>
              </div>
              <Button onClick={handleUpgrade}>Upgrade Plan</Button>
            </div>

            <div className="rounded-lg border border-slate-800 p-4">
              <h4 className="mb-2 font-medium text-white">Plan Features</h4>
              <ul className="space-y-1 text-sm text-slate-400">
                <li>• Unlimited cases and contacts</li>
                <li>• Document management</li>
                <li>• Time tracking and billing</li>
                <li>• Calendar and deadlines</li>
                {subscriptionTier !== "Starter" && <li>• Advanced reporting</li>}
                {subscriptionTier === "Enterprise" && <li>• Priority support</li>}
              </ul>
            </div>
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
              <CreditCard className="h-8 w-8 text-slate-400" />
              <div>
                <p className="font-medium text-white">Card ending in •••• 4242</p>
                <p className="text-sm text-slate-400">Expires 12/2025</p>
              </div>
            </div>
            <Button variant="outline" onClick={handleUpdatePayment}>
              Update Payment Method
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
            <div className="flex items-center justify-between rounded-lg border border-slate-800 p-4">
              <div>
                <p className="font-medium text-white">Invoice #INV-2024-001</p>
                <p className="text-sm text-slate-400">December 1, 2024</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="font-medium text-white">$299.00</p>
                  <Badge variant="success">Paid</Badge>
                </div>
                <Button variant="ghost" size="icon">
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <p className="text-sm text-slate-400">No other invoices found</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Next Billing Date</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-slate-400" />
            <p className="text-white">January 1, 2025</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

