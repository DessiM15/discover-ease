"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Eye, Send, DollarSign, FileText, Download } from "lucide-react";
import Link from "next/link";

const demoInvoices = [
  {
    id: "1",
    invoiceNumber: "INV-2024-001",
    client: "Smith, Jane",
    caseName: "Smith v. Johnson",
    amount: 5200,
    status: "overdue",
    sentDate: "2024-11-15",
    dueDate: "2024-12-01",
    daysOverdue: 9,
  },
  {
    id: "2",
    invoiceNumber: "INV-2024-002",
    client: "Williams Estate",
    caseName: "Estate of Williams",
    amount: 3800,
    status: "sent",
    sentDate: "2024-12-05",
    dueDate: "2024-12-20",
    daysOverdue: 0,
  },
  {
    id: "3",
    invoiceNumber: "INV-2024-003",
    client: "Davis, John",
    caseName: "State v. Davis",
    amount: 2100,
    status: "partial",
    sentDate: "2024-11-20",
    dueDate: "2024-12-05",
    daysOverdue: 0,
    paidAmount: 1000,
  },
  {
    id: "4",
    invoiceNumber: "INV-2024-004",
    client: "ABC Corp",
    caseName: "Johnson v. ABC Corp",
    amount: 7500,
    status: "paid",
    sentDate: "2024-11-10",
    dueDate: "2024-11-25",
    daysOverdue: 0,
  },
];

export default function InvoicesPage() {
  const [activeTab, setActiveTab] = useState("all");

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "paid":
        return "success";
      case "overdue":
        return "destructive";
      case "partial":
        return "warning";
      case "sent":
        return "default";
      case "viewed":
        return "default";
      default:
        return "outline";
    }
  };

  const filteredInvoices =
    activeTab === "all"
      ? demoInvoices
      : demoInvoices.filter((inv) => inv.status === activeTab);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Invoices</h1>
          <p className="mt-1 text-muted-foreground">Create and manage client invoices</p>
        </div>
        <Button asChild>
          <Link href="/billing/invoices/new">
            <Plus className="mr-2 h-4 w-4" />
            Create Invoice
          </Link>
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="draft">Draft</TabsTrigger>
          <TabsTrigger value="sent">Sent</TabsTrigger>
          <TabsTrigger value="viewed">Viewed</TabsTrigger>
          <TabsTrigger value="partial">Partial</TabsTrigger>
          <TabsTrigger value="paid">Paid</TabsTrigger>
          <TabsTrigger value="overdue">Overdue</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Invoice List</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                        Invoice #
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Client</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Case</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">Amount</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Sent</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Due</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredInvoices.map((invoice) => (
                      <tr
                        key={invoice.id}
                        className="border-b border-border hover:bg-muted transition-colors"
                      >
                        <td className="px-4 py-3 text-sm font-medium text-foreground">
                          {invoice.invoiceNumber}
                        </td>
                        <td className="px-4 py-3 text-sm text-foreground">{invoice.client}</td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">{invoice.caseName}</td>
                        <td className="px-4 py-3 text-sm text-foreground font-medium text-right">
                          ${invoice.amount.toLocaleString()}
                          {invoice.paidAmount && (
                            <span className="block text-xs text-muted-foreground">
                              Paid: ${invoice.paidAmount.toLocaleString()}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Badge variant={getStatusVariant(invoice.status)}>
                            {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                            {invoice.daysOverdue > 0 && ` (${invoice.daysOverdue}d)`}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">
                          {new Date(invoice.sentDate).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">
                          {new Date(invoice.dueDate).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-2">
                            <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                              <Link href={`/billing/invoices/${invoice.id}`}>
                                <Eye className="h-4 w-4" />
                              </Link>
                            </Button>
                            {invoice.status === "draft" && (
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <Send className="h-4 w-4" />
                              </Button>
                            )}
                            {invoice.status !== "paid" && (
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <DollarSign className="h-4 w-4" />
                              </Button>
                            )}
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

