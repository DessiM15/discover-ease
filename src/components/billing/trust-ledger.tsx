"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowDown, ArrowUp, ArrowRightLeft } from "lucide-react";
import { cn } from "@/lib/utils";

interface TrustLedgerProps {
  transactions: any[];
}

export function TrustLedger({ transactions }: TrustLedgerProps) {
  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "Deposit":
        return <ArrowDown className="h-4 w-4 text-green-400" />;
      case "Withdrawal":
        return <ArrowUp className="h-4 w-4 text-red-400" />;
      case "Transfer":
        return <ArrowRightLeft className="h-4 w-4 text-blue-400" />;
      default:
        return null;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Trust Ledger</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-800">
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400">Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400">Client/Case</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400">Type</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400">Description</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-slate-400">Amount</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-slate-400">
                  Running Balance
                </th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((transaction) => (
                <tr
                  key={transaction.id}
                  className="border-b border-slate-800/50 hover:bg-slate-900/50 transition-colors"
                >
                  <td className="px-4 py-3 text-sm text-slate-300">
                    {new Date(transaction.date).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-sm text-white">
                    <div>
                      <p>{transaction.client}</p>
                      <p className="text-xs text-slate-400">{transaction.caseName}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {getTransactionIcon(transaction.type)}
                      <Badge variant="outline">{transaction.type}</Badge>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-300">{transaction.description}</td>
                  <td
                    className={cn(
                      "px-4 py-3 text-sm font-medium text-right",
                      transaction.amount > 0 ? "text-green-400" : "text-red-400"
                    )}
                  >
                    {transaction.amount > 0 ? "+" : ""}${Math.abs(transaction.amount).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-sm text-white font-medium text-right">
                    ${transaction.runningBalance.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

