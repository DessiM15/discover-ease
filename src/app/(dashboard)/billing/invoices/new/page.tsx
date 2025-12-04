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
import { Checkbox } from "@/components/ui/checkbox";
import { InvoiceBuilder } from "@/components/billing/invoice-builder";
import { InvoicePreview } from "@/components/billing/invoice-preview";
import { ArrowLeft, Save, Send } from "lucide-react";
import Link from "next/link";

export default function CreateInvoicePage() {
  const [clientId, setClientId] = useState("");
  const [caseId, setCaseId] = useState("");
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split("T")[0]);
  const [dueDate, setDueDate] = useState("");
  const [paymentTerms, setPaymentTerms] = useState("Net 30");
  const [notes, setNotes] = useState("");
  const [taxRate, setTaxRate] = useState("0");
  const [discount, setDiscount] = useState("0");
  const [discountType, setDiscountType] = useState("percent");
  const [selectedTimeEntries, setSelectedTimeEntries] = useState<string[]>([]);
  const [selectedExpenses, setSelectedExpenses] = useState<string[]>([]);
  const [lineItems, setLineItems] = useState<any[]>([]);
  const [showPreview, setShowPreview] = useState(false);

  const unbilledTime = [
    { id: "1", description: "Draft motion for summary judgment", hours: 2.5, rate: 300, amount: 750 },
    { id: "2", description: "Client meeting", hours: 1.0, rate: 300, amount: 300 },
  ];

  const unbilledExpenses = [
    { id: "1", description: "Filing fee", amount: 250 },
    { id: "2", description: "Expert fee", amount: 1500 },
  ];

  const subtotal = [...unbilledTime.filter(t => selectedTimeEntries.includes(t.id)), ...unbilledExpenses.filter(e => selectedExpenses.includes(e.id)), ...lineItems].reduce((sum, item) => sum + (item.amount || 0), 0);
  const tax = subtotal * (parseFloat(taxRate) / 100);
  const discountAmount = discountType === "percent" ? subtotal * (parseFloat(discount) / 100) : parseFloat(discount);
  const total = subtotal + tax - discountAmount;

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
            <h1 className="text-3xl font-bold text-white">Create Invoice</h1>
            <p className="mt-1 text-slate-400">Generate a new invoice for a client</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowPreview(!showPreview)}>
            {showPreview ? "Hide Preview" : "Preview"}
          </Button>
          <Button variant="outline">
            <Save className="mr-2 h-4 w-4" />
            Save Draft
          </Button>
          <Button>
            <Send className="mr-2 h-4 w-4" />
            Send Invoice
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Client & Case</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Client</Label>
                <Select value={clientId} onValueChange={setClientId} required>
                  <SelectTrigger className="mt-1 bg-slate-900/50 border-slate-800">
                    <SelectValue placeholder="Select client" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Smith, Jane</SelectItem>
                    <SelectItem value="2">Williams Estate</SelectItem>
                    <SelectItem value="3">Davis, John</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Case</Label>
                <Select value={caseId} onValueChange={setCaseId} required>
                  <SelectTrigger className="mt-1 bg-slate-900/50 border-slate-800">
                    <SelectValue placeholder="Select case" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Smith v. Johnson</SelectItem>
                    <SelectItem value="2">Estate of Williams</SelectItem>
                    <SelectItem value="3">State v. Davis</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Unbilled Time Entries</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {unbilledTime.map((entry) => (
                  <div key={entry.id} className="flex items-center gap-3 p-3 rounded-lg bg-slate-900/50">
                    <Checkbox
                      checked={selectedTimeEntries.includes(entry.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedTimeEntries([...selectedTimeEntries, entry.id]);
                        } else {
                          setSelectedTimeEntries(selectedTimeEntries.filter(id => id !== entry.id));
                        }
                      }}
                    />
                    <div className="flex-1">
                      <p className="text-sm text-white">{entry.description}</p>
                      <p className="text-xs text-slate-400">{entry.hours} hrs @ ${entry.rate}/hr</p>
                    </div>
                    <span className="text-sm font-medium text-white">${entry.amount.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Unbilled Expenses</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {unbilledExpenses.map((expense) => (
                  <div key={expense.id} className="flex items-center gap-3 p-3 rounded-lg bg-slate-900/50">
                    <Checkbox
                      checked={selectedExpenses.includes(expense.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedExpenses([...selectedExpenses, expense.id]);
                        } else {
                          setSelectedExpenses(selectedExpenses.filter(id => id !== expense.id));
                        }
                      }}
                    />
                    <div className="flex-1">
                      <p className="text-sm text-white">{expense.description}</p>
                    </div>
                    <span className="text-sm font-medium text-white">${expense.amount.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <InvoiceBuilder lineItems={lineItems} setLineItems={setLineItems} />

          <Card>
            <CardHeader>
              <CardTitle>Invoice Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label>Invoice Date</Label>
                  <Input
                    type="date"
                    value={invoiceDate}
                    onChange={(e) => setInvoiceDate(e.target.value)}
                    className="mt-1 bg-slate-900/50 border-slate-800"
                  />
                </div>
                <div>
                  <Label>Due Date</Label>
                  <Input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="mt-1 bg-slate-900/50 border-slate-800"
                  />
                </div>
              </div>
              <div>
                <Label>Payment Terms</Label>
                <Select value={paymentTerms} onValueChange={setPaymentTerms}>
                  <SelectTrigger className="mt-1 bg-slate-900/50 border-slate-800">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Net 15">Net 15</SelectItem>
                    <SelectItem value="Net 30">Net 30</SelectItem>
                    <SelectItem value="Net 45">Net 45</SelectItem>
                    <SelectItem value="Custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Notes to Client</Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="mt-1 bg-slate-900/50 border-slate-800"
                  placeholder="Additional notes or instructions..."
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Subtotal</span>
                <span className="text-white">${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Label className="text-sm text-slate-400">Tax Rate</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={taxRate}
                    onChange={(e) => setTaxRate(e.target.value)}
                    className="w-20 h-8 bg-slate-900/50 border-slate-800"
                  />
                  <span className="text-sm text-slate-400">%</span>
                </div>
                <span className="text-sm text-white">${tax.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Label className="text-sm text-slate-400">Discount</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={discount}
                    onChange={(e) => setDiscount(e.target.value)}
                    className="w-20 h-8 bg-slate-900/50 border-slate-800"
                  />
                  <Select value={discountType} onValueChange={setDiscountType}>
                    <SelectTrigger className="w-20 h-8 bg-slate-900/50 border-slate-800">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percent">%</SelectItem>
                      <SelectItem value="fixed">$</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <span className="text-sm text-white">-${discountAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between pt-3 border-t border-slate-800">
                <span className="text-lg font-semibold text-white">Total</span>
                <span className="text-lg font-semibold text-amber-500">${total.toFixed(2)}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {showPreview && (
          <div className="lg:sticky lg:top-6 lg:h-fit">
            <InvoicePreview
              invoiceNumber="INV-2024-005"
              client="Smith, Jane"
              caseName="Smith v. Johnson"
              invoiceDate={invoiceDate}
              dueDate={dueDate}
              items={[
                ...unbilledTime.filter(t => selectedTimeEntries.includes(t.id)),
                ...unbilledExpenses.filter(e => selectedExpenses.includes(e.id)),
                ...lineItems,
              ]}
              subtotal={subtotal}
              tax={tax}
              discount={discountAmount}
              total={total}
            />
          </div>
        )}
      </div>
    </div>
  );
}

