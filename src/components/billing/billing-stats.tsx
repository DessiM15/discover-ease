"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, DollarSign, FileText, AlertCircle, TrendingUp } from "lucide-react";

export function BillingStats() {
  const stats = [
    {
      title: "Unbilled Time",
      value: "127.5 hrs",
      amount: "$19,125",
      icon: Clock,
      color: "text-amber-500",
    },
    {
      title: "Outstanding Invoices",
      value: "12",
      amount: "$74,000",
      icon: FileText,
      color: "text-blue-500",
    },
    {
      title: "Overdue Amount",
      value: "$2,100",
      amount: "3 invoices",
      icon: AlertCircle,
      color: "text-red-500",
    },
    {
      title: "Collected This Month",
      value: "$45,200",
      amount: "+12% vs last month",
      icon: TrendingUp,
      color: "text-green-500",
    },
    {
      title: "Trust Balance",
      value: "$125,000",
      amount: "5 accounts",
      icon: DollarSign,
      color: "text-purple-500",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-5">
      {stats.map((stat, idx) => (
        <Card key={idx}>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-400 flex items-center gap-2">
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
              {stat.title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-white">{stat.value}</p>
            <p className="text-xs text-slate-400 mt-1">{stat.amount}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

