"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, DollarSign, Clock, FileText, AlertCircle, TrendingUp } from "lucide-react";
import Link from "next/link";
import { BillingStats } from "@/components/billing/billing-stats";
import { RevenueChart } from "@/components/billing/revenue-chart";

export default function BillingPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Billing Dashboard</h1>
          <p className="mt-1 text-muted-foreground">Track time, expenses, and manage invoices</p>
        </div>
        <div className="flex gap-2">
          <Button asChild>
            <Link href="/billing/time">
              <Clock className="mr-2 h-4 w-4" />
              New Time Entry
            </Link>
          </Button>
          <Button asChild>
            <Link href="/billing/invoices/new">
              <FileText className="mr-2 h-4 w-4" />
              Create Invoice
            </Link>
          </Button>
        </div>
      </div>

      <BillingStats />

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Monthly Revenue</CardTitle>
            <CardDescription>Last 6 months</CardDescription>
          </CardHeader>
          <CardContent>
            <RevenueChart />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>AR Aging</CardTitle>
            <CardDescription>Outstanding invoices by age</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Current (0-30 days)</span>
                <span className="text-lg font-semibold text-foreground">$45,200</span>
              </div>
              <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-green-500" style={{ width: "65%" }} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">31-60 days</span>
                <span className="text-lg font-semibold text-foreground">$18,500</span>
              </div>
              <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-yellow-500" style={{ width: "27%" }} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">61-90 days</span>
                <span className="text-lg font-semibold text-foreground">$8,200</span>
              </div>
              <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-orange-500" style={{ width: "12%" }} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">90+ days</span>
                <span className="text-lg font-semibold text-red-500">$2,100</span>
              </div>
              <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-red-500" style={{ width: "3%" }} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Time Entries</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { case: "Smith v. Johnson", hours: 2.5, date: "Today" },
                { case: "Estate of Williams", hours: 1.0, date: "Today" },
                { case: "State v. Davis", hours: 3.0, date: "Yesterday" },
              ].map((entry, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-muted">
                  <div>
                    <p className="text-sm font-medium text-foreground">{entry.case}</p>
                    <p className="text-xs text-muted-foreground">{entry.hours} hours • {entry.date}</p>
                  </div>
                  <Button variant="ghost" size="sm">View</Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Invoices Needing Attention</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { number: "INV-2024-001", client: "Smith, Jane", amount: "$5,200", status: "Overdue", days: 15 },
                { number: "INV-2024-002", client: "Williams Estate", amount: "$3,800", status: "Due Soon", days: 3 },
                { number: "INV-2024-003", client: "Davis, John", amount: "$2,100", status: "Sent", days: 5 },
              ].map((invoice, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-muted">
                  <div>
                    <p className="text-sm font-medium text-foreground">{invoice.number}</p>
                    <p className="text-xs text-muted-foreground">{invoice.client} • {invoice.amount}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-1 rounded ${
                      invoice.status === "Overdue" ? "bg-red-500/20 text-red-400" :
                      invoice.status === "Due Soon" ? "bg-yellow-500/20 text-yellow-400" :
                      "bg-blue-500/20 text-blue-400"
                    }`}>
                      {invoice.status}
                    </span>
                    <Button variant="ghost" size="sm">View</Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
