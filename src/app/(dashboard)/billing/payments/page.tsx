"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PaymentForm } from "@/components/billing/payment-form";
import { Plus, Filter, Download } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const demoPayments = [
  {
    id: "1",
    date: "2024-12-10",
    client: "Smith, Jane",
    invoiceNumber: "INV-2024-001",
    amount: 500,
    method: "Credit Card",
    reference: "ch_1234567890",
    status: "deposited",
  },
  {
    id: "2",
    date: "2024-12-08",
    client: "Williams Estate",
    invoiceNumber: "INV-2024-002",
    amount: 2000,
    method: "Check",
    reference: "Check #1234",
    status: "pending",
  },
  {
    id: "3",
    date: "2024-12-05",
    client: "Davis, John",
    invoiceNumber: "INV-2024-003",
    amount: 1000,
    method: "ACH",
    reference: "ACH-2024-001",
    status: "deposited",
  },
];

export default function PaymentsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Payments</h1>
          <p className="mt-1 text-muted-foreground">Track and manage client payments</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Filter className="mr-2 h-4 w-4" />
            Filters
          </Button>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Record Payment
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md glass border-border">
              <DialogHeader>
                <DialogTitle>Record Payment</DialogTitle>
                <DialogDescription>Record a new payment</DialogDescription>
              </DialogHeader>
              <PaymentForm invoiceId="" balance={0} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Payment List</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Client</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Invoice</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">Amount</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Method</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Reference</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {demoPayments.map((payment) => (
                  <tr
                    key={payment.id}
                    className="border-b border-border hover:bg-muted transition-colors"
                  >
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {new Date(payment.date).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-sm text-foreground">{payment.client}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{payment.invoiceNumber}</td>
                    <td className="px-4 py-3 text-sm text-foreground font-medium text-right">
                      ${payment.amount.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{payment.method}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{payment.reference}</td>
                    <td className="px-4 py-3 text-center">
                      <Badge variant={payment.status === "deposited" ? "success" : "warning"}>
                        {payment.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

