"use client";

import { Card, CardContent } from "@/components/ui/card";

interface InvoicePreviewProps {
  invoiceNumber: string;
  client: string;
  caseName: string;
  invoiceDate: string;
  dueDate: string;
  items: any[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
}

export function InvoicePreview({
  invoiceNumber,
  client,
  caseName,
  invoiceDate,
  dueDate,
  items,
  subtotal,
  tax,
  discount,
  total,
}: InvoicePreviewProps) {
  return (
    <Card className="print:shadow-none">
      <CardContent className="p-8">
        <div className="space-y-8">
          {/* Header */}
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">DiscoverEase</h1>
              <p className="text-muted-foreground">Legal Practice Management</p>
            </div>
            <div className="text-right">
              <h2 className="text-2xl font-bold text-foreground mb-2">INVOICE</h2>
              <p className="text-muted-foreground">#{invoiceNumber}</p>
            </div>
          </div>

          {/* Client Info */}
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Bill To:</h3>
              <p className="text-foreground font-medium">{client}</p>
              <p className="text-foreground text-sm">{caseName}</p>
            </div>
            <div className="text-right">
              <div className="mb-2">
                <span className="text-sm text-muted-foreground">Invoice Date: </span>
                <span className="text-foreground">{new Date(invoiceDate).toLocaleDateString()}</span>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Due Date: </span>
                <span className="text-foreground">{new Date(dueDate).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          {/* Items */}
          <div>
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Description</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Qty</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Rate</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Amount</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => (
                  <tr key={idx} className="border-b border-border">
                    <td className="py-3 px-4 text-sm text-foreground">{item.description}</td>
                    <td className="py-3 px-4 text-sm text-foreground text-right">
                      {item.hours || item.quantity || 1}
                    </td>
                    <td className="py-3 px-4 text-sm text-foreground text-right">
                      ${item.rate?.toFixed(2) || item.amount?.toFixed(2) || "0.00"}
                    </td>
                    <td className="py-3 px-4 text-sm text-foreground font-medium text-right">
                      ${(item.amount || item.hours * item.rate || 0).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="flex justify-end">
            <div className="w-64 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="text-foreground">${subtotal.toFixed(2)}</span>
              </div>
              {tax > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tax</span>
                  <span className="text-foreground">${tax.toFixed(2)}</span>
                </div>
              )}
              {discount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Discount</span>
                  <span className="text-foreground">-${discount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between pt-2 border-t border-border">
                <span className="text-lg font-semibold text-foreground">Total</span>
                <span className="text-lg font-semibold text-amber-500">${total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="pt-8 border-t border-border">
            <p className="text-xs text-muted-foreground text-center">
              Thank you for your business. Payment is due within the terms specified above.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

