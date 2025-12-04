"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2 } from "lucide-react";

interface InvoiceBuilderProps {
  lineItems: any[];
  setLineItems: (items: any[]) => void;
}

export function InvoiceBuilder({ lineItems, setLineItems }: InvoiceBuilderProps) {
  const addLineItem = () => {
    setLineItems([
      ...lineItems,
      {
        id: Date.now().toString(),
        description: "",
        quantity: 1,
        rate: 0,
        amount: 0,
      },
    ]);
  };

  const updateLineItem = (id: string, field: string, value: any) => {
    setLineItems(
      lineItems.map((item) => {
        if (item.id === id) {
          const updated = { ...item, [field]: value };
          if (field === "quantity" || field === "rate") {
            updated.amount = (updated.quantity || 1) * (updated.rate || 0);
          }
          return updated;
        }
        return item;
      })
    );
  };

  const removeLineItem = (id: string) => {
    setLineItems(lineItems.filter((item) => item.id !== id));
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Custom Line Items</CardTitle>
          <Button variant="outline" size="sm" onClick={addLineItem}>
            <Plus className="mr-2 h-4 w-4" />
            Add Item
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {lineItems.map((item) => (
            <div key={item.id} className="p-4 rounded-lg border border-slate-800 bg-slate-900/50">
              <div className="grid gap-4 md:grid-cols-12">
                <div className="md:col-span-6">
                  <Label>Description</Label>
                  <Textarea
                    value={item.description}
                    onChange={(e) => updateLineItem(item.id, "description", e.target.value)}
                    className="mt-1 bg-slate-900/50 border-slate-800"
                    placeholder="Item description..."
                  />
                </div>
                <div className="md:col-span-2">
                  <Label>Quantity</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.quantity}
                    onChange={(e) => updateLineItem(item.id, "quantity", parseFloat(e.target.value) || 0)}
                    className="mt-1 bg-slate-900/50 border-slate-800"
                  />
                </div>
                <div className="md:col-span-2">
                  <Label>Rate</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.rate}
                    onChange={(e) => updateLineItem(item.id, "rate", parseFloat(e.target.value) || 0)}
                    className="mt-1 bg-slate-900/50 border-slate-800"
                  />
                </div>
                <div className="md:col-span-1">
                  <Label>Amount</Label>
                  <Input
                    type="text"
                    value={`$${item.amount.toFixed(2)}`}
                    readOnly
                    className="mt-1 bg-slate-800/50 border-slate-800"
                  />
                </div>
                <div className="md:col-span-1 flex items-end">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeLineItem(item.id)}
                    className="text-red-400"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
          {lineItems.length === 0 && (
            <p className="text-center text-slate-400 py-8">No custom line items. Click "Add Item" to create one.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

