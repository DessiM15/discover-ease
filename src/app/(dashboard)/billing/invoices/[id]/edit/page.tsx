"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Save, Send, Loader2 } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";

export default function EditInvoicePage() {
  const params = useParams();
  const router = useRouter();
  const invoiceId = params.id as string;
  const [isSaving, setIsSaving] = useState(false);

  // Demo data - in production, fetch from API
  const invoice = {
    id: invoiceId,
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
    notes: "",
  };

  const [formData, setFormData] = useState({
    invoiceDate: invoice.invoiceDate,
    dueDate: invoice.dueDate,
    notes: invoice.notes,
    status: invoice.status,
  });

  const handleSave = async () => {
    setIsSaving(true);
    // TODO: Implement actual save functionality
    setTimeout(() => {
      setIsSaving(false);
      toast.success("Invoice updated successfully");
      router.push(`/billing/invoices/${invoiceId}`);
    }, 1000);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/billing/invoices/${invoiceId}`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Edit Invoice</h1>
            <p className="mt-1 text-muted-foreground">{invoice.invoiceNumber}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>
          <Button onClick={() => {
            // TODO: Implement send functionality
            alert("Send invoice functionality coming soon");
          }}>
            <Send className="mr-2 h-4 w-4" />
            Send Invoice
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Invoice Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label>Invoice Date</Label>
                  <Input
                    type="date"
                    value={formData.invoiceDate}
                    onChange={(e) => setFormData({ ...formData, invoiceDate: e.target.value })}
                    className="mt-1 bg-card/50 border-border"
                  />
                </div>
                <div>
                  <Label>Due Date</Label>
                  <Input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    className="mt-1 bg-card/50 border-border"
                  />
                </div>
              </div>
              <div>
                <Label>Status</Label>
                <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                  <SelectTrigger className="mt-1 bg-card/50 border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="sent">Sent</SelectItem>
                    <SelectItem value="viewed">Viewed</SelectItem>
                    <SelectItem value="partial">Partial</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="overdue">Overdue</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Notes</Label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="mt-1 bg-card/50 border-border"
                  placeholder="Additional notes..."
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Line Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {invoice.items.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-card/50">
                    <div className="flex-1">
                      <p className="text-sm text-foreground">{item.description}</p>
                      {item.hours && (
                        <p className="text-xs text-muted-foreground">
                          {item.hours} hrs @ ${item.rate}/hr
                        </p>
                      )}
                    </div>
                    <span className="text-sm font-medium text-foreground">${item.amount.toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-4">
                Note: Line item editing will be available in a future update.
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="text-foreground">${invoice.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Tax</span>
                <span className="text-foreground">${invoice.tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Discount</span>
                <span className="text-foreground">-${invoice.discount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between pt-3 border-t border-border">
                <span className="text-lg font-semibold text-foreground">Total</span>
                <span className="text-lg font-semibold text-primary">${invoice.total.toFixed(2)}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

