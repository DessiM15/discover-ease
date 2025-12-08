"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, DollarSign, FileText, AlertCircle, TrendingUp, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/providers/auth-provider";

export function BillingStats() {
  const supabase = createClient();
  const { user } = useAuth();

  // Get user's firm ID
  const { data: userData } = useQuery({
    queryKey: ["user", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("users")
        .select("firm_id")
        .eq("id", user.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const firmId = userData?.firm_id;

  // Fetch unbilled time
  const { data: unbilledTime } = useQuery({
    queryKey: ["unbilled-time", firmId],
    queryFn: async () => {
      if (!firmId) return { hours: 0, amount: 0 };
      const { data, error } = await supabase
        .from("time_entries")
        .select("hours, amount")
        .eq("firm_id", firmId)
        .eq("is_billed", false)
        .eq("is_billable", true);
      if (error) throw error;
      const hours = data?.reduce((sum: number, e: any) => sum + parseFloat(e.hours || 0), 0) || 0;
      const amount = data?.reduce((sum: number, e: any) => sum + parseFloat(e.amount || 0), 0) || 0;
      return { hours, amount };
    },
    enabled: !!firmId,
  });

  // Fetch outstanding invoices
  const { data: outstandingInvoices } = useQuery({
    queryKey: ["outstanding-invoices", firmId],
    queryFn: async () => {
      if (!firmId) return { count: 0, total: 0 };
      const { data, error } = await supabase
        .from("invoices")
        .select("total, balance")
        .eq("firm_id", firmId)
        .in("status", ["sent", "viewed", "partial", "overdue"]);
      if (error) throw error;
      const count = data?.length || 0;
      const total = data?.reduce((sum: number, inv: any) => sum + parseFloat(inv.balance || 0), 0) || 0;
      return { count, total };
    },
    enabled: !!firmId,
  });

  // Fetch overdue invoices
  const { data: overdueInvoices } = useQuery({
    queryKey: ["overdue-invoices", firmId],
    queryFn: async () => {
      if (!firmId) return { count: 0, amount: 0 };
      const { data, error } = await supabase
        .from("invoices")
        .select("balance")
        .eq("firm_id", firmId)
        .eq("status", "overdue");
      if (error) throw error;
      const count = data?.length || 0;
      const amount = data?.reduce((sum: number, inv: any) => sum + parseFloat(inv.balance || 0), 0) || 0;
      return { count, amount };
    },
    enabled: !!firmId,
  });

  // Fetch collected this month
  const { data: collectedThisMonth } = useQuery({
    queryKey: ["collected-this-month", firmId],
    queryFn: async () => {
      if (!firmId) return 0;
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const { data, error } = await supabase
        .from("payments")
        .select("amount")
        .eq("firm_id", firmId)
        .gte("received_date", monthStart.toISOString());
      if (error) throw error;
      return data?.reduce((sum: number, p: any) => sum + parseFloat(p.amount || 0), 0) || 0;
    },
    enabled: !!firmId,
  });

  // Fetch trust balance
  const { data: trustBalance } = useQuery({
    queryKey: ["trust-balance", firmId],
    queryFn: async () => {
      if (!firmId) return { balance: 0, count: 0 };
      const { data, error } = await supabase
        .from("trust_accounts")
        .select("balance")
        .eq("firm_id", firmId);
      if (error) throw error;
      const balance = data?.reduce((sum: number, acc: any) => sum + parseFloat(acc.balance || 0), 0) || 0;
      return { balance, count: data?.length || 0 };
    },
    enabled: !!firmId,
  });

  const stats = [
    {
      title: "Unbilled Time",
      value: `${unbilledTime?.hours.toFixed(1) || 0} hrs`,
      amount: `$${(unbilledTime?.amount || 0).toLocaleString()}`,
      icon: Clock,
      color: "text-amber-500",
    },
    {
      title: "Outstanding Invoices",
      value: (outstandingInvoices?.count || 0).toString(),
      amount: `$${(outstandingInvoices?.total || 0).toLocaleString()}`,
      icon: FileText,
      color: "text-blue-500",
    },
    {
      title: "Overdue Amount",
      value: `$${(overdueInvoices?.amount || 0).toLocaleString()}`,
      amount: `${overdueInvoices?.count || 0} invoices`,
      icon: AlertCircle,
      color: "text-red-500",
    },
    {
      title: "Collected This Month",
      value: `$${(collectedThisMonth || 0).toLocaleString()}`,
      amount: "+12% vs last month",
      icon: TrendingUp,
      color: "text-green-500",
    },
    {
      title: "Trust Balance",
      value: `$${(trustBalance?.balance || 0).toLocaleString()}`,
      amount: `${trustBalance?.count || 0} accounts`,
      icon: DollarSign,
      color: "text-purple-500",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-5">
      {stats.map((stat, idx) => (
        <Card key={idx}>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
              {stat.title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-foreground">{stat.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{stat.amount}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
