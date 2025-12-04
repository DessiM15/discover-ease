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
              <h1 className="text-3xl font-bold text-white mb-2">DiscoverEase</h1>
              <p className="text-slate-400">Legal Practice Management</p>
            </div>
            <div className="text-right">
              <h2 className="text-2xl font-bold text-white mb-2">INVOICE</h2>
              <p className="text-slate-400">#{invoiceNumber}</p>
            </div>
          </div>

          {/* Client Info */}
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-sm font-medium text-slate-400 mb-2">Bill To:</h3>
              <p className="text-white font-medium">{client}</p>
              <p className="text-slate-300 text-sm">{caseName}</p>
            </div>
            <div className="text-right">
              <div className="mb-2">
                <span className="text-sm text-slate-400">Invoice Date: </span>
                <span className="text-white">{new Date(invoiceDate).toLocaleDateString()}</span>
              </div>
              <div>
                <span className="text-sm text-slate-400">Due Date: </span>
                <span className="text-white">{new Date(dueDate).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          {/* Items */}
          <div>
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-800">
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Description</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-slate-400">Qty</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-slate-400">Rate</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-slate-400">Amount</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => (
                  <tr key={idx} className="border-b border-slate-800/50">
                    <td className="py-3 px-4 text-sm text-white">{item.description}</td>
                    <td className="py-3 px-4 text-sm text-slate-300 text-right">
                      {item.hours || item.quantity || 1}
                    </td>
                    <td className="py-3 px-4 text-sm text-slate-300 text-right">
                      ${item.rate?.toFixed(2) || item.amount?.toFixed(2) || "0.00"}
                    </td>
                    <td className="py-3 px-4 text-sm text-white font-medium text-right">
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
                <span className="text-slate-400">Subtotal</span>
                <span className="text-white">${subtotal.toFixed(2)}</span>
              </div>
              {tax > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Tax</span>
                  <span className="text-white">${tax.toFixed(2)}</span>
                </div>
              )}
              {discount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Discount</span>
                  <span className="text-white">-${discount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between pt-2 border-t border-slate-800">
                <span className="text-lg font-semibold text-white">Total</span>
                <span className="text-lg font-semibold text-amber-500">${total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="pt-8 border-t border-slate-800">
            <p className="text-xs text-slate-400 text-center">
              Thank you for your business. Payment is due within the terms specified above.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

