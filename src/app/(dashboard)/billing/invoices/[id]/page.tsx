"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { InvoicePreview } from "@/components/billing/invoice-preview";
import { PaymentForm } from "@/components/billing/payment-form";
import { Edit, Send, Download, DollarSign, Mail } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function InvoiceDetailPage({ params }: { params: { id: string } }) {
  // Demo data - replace with real data fetch
  const invoice = {
    id: params.id,
    invoiceNumber: "INV-2024-001",
    client: "Smith, Jane",
    caseName: "Smith v. Johnson",
    invoiceDate: "2024-11-15",
    dueDate: "2024-12-01",
    status: "overdue",
    items: [
      { description: "Draft motion for summary judgment", hours: 2.5, rate: 300, amount: 750 },
      { description: "Client meeting", hours: 1.0, rate: 300, amount: 300 },
      { description: "Filing fee", amount: 250 },
    ],
    subtotal: 1300,
    tax: 0,
    discount: 0,
    total: 1300,
    paidAmount: 0,
    balance: 1300,
  };

  const payments = [
    { date: "2024-11-20", amount: 500, method: "Credit Card", reference: "ch_1234" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/billing/invoices">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-white">{invoice.invoiceNumber}</h1>
              <Badge variant={invoice.status === "overdue" ? "destructive" : "default"}>
                {invoice.status}
              </Badge>
            </div>
            <p className="mt-1 text-slate-400">{invoice.client} • {invoice.caseName}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </Button>
          <Button variant="outline">
            <Send className="mr-2 h-4 w-4" />
            Send
          </Button>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Download PDF
          </Button>
          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <DollarSign className="mr-2 h-4 w-4" />
                Record Payment
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md glass border-slate-800">
              <DialogHeader>
                <DialogTitle>Record Payment</DialogTitle>
                <DialogDescription>Record a payment for this invoice</DialogDescription>
              </DialogHeader>
              <PaymentForm invoiceId={invoice.id} balance={invoice.balance} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <InvoicePreview
            invoiceNumber={invoice.invoiceNumber}
            client={invoice.client}
            caseName={invoice.caseName}
            invoiceDate={invoice.invoiceDate}
            dueDate={invoice.dueDate}
            items={invoice.items}
            subtotal={invoice.subtotal}
            tax={invoice.tax}
            discount={invoice.discount}
            total={invoice.total}
          />
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Payment Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-slate-400">Total</span>
                <span className="text-white font-medium">${invoice.total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Paid</span>
                <span className="text-green-400">${invoice.paidAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-800">
                <span className="text-white font-semibold">Balance</span>
                <span className="text-amber-500 font-semibold">${invoice.balance.toFixed(2)}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Payment History</CardTitle>
            </CardHeader>
            <CardContent>
              {payments.length > 0 ? (
                <div className="space-y-3">
                  {payments.map((payment, idx) => (
                    <div key={idx} className="p-3 rounded-lg bg-slate-900/50">
                      <div className="flex justify-between mb-1">
                        <span className="text-sm text-white">${payment.amount.toFixed(2)}</span>
                        <span className="text-xs text-slate-400">
                          {new Date(payment.date).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400">{payment.method} • {payment.reference}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-400 text-center py-4">No payments recorded</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

