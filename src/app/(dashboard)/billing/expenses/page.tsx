"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ExpenseForm } from "@/components/billing/expense-form";
import { Plus, Filter, Download, Receipt } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const demoExpenses = [
  {
    id: "1",
    date: "2024-12-10",
    caseName: "Smith v. Johnson",
    category: "Filing Fees",
    vendor: "Superior Court",
    description: "Motion filing fee",
    amount: 250,
    hasReceipt: true,
    isBillable: true,
    isBilled: false,
  },
  {
    id: "2",
    date: "2024-12-09",
    caseName: "Estate of Williams",
    category: "Expert Fees",
    vendor: "Dr. Smith, CPA",
    description: "Financial analysis expert",
    amount: 1500,
    hasReceipt: false,
    isBillable: true,
    isBilled: false,
  },
  {
    id: "3",
    date: "2024-12-08",
    caseName: "State v. Davis",
    category: "Travel",
    vendor: "Delta Airlines",
    description: "Flight to deposition",
    amount: 450,
    hasReceipt: true,
    isBillable: true,
    isBilled: true,
  },
];

export default function ExpensesPage() {
  const [dialogOpen, setDialogOpen] = useState(false);

  const totalAmount = demoExpenses.reduce((sum, e) => sum + e.amount, 0);
  const unbilledAmount = demoExpenses
    .filter((e) => !e.isBilled)
    .reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Expenses</h1>
          <p className="mt-1 text-slate-400">Track and manage case expenses</p>
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
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                New Expense
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl glass border-slate-800">
              <DialogHeader>
                <DialogTitle>New Expense</DialogTitle>
                <DialogDescription>Record a new expense</DialogDescription>
              </DialogHeader>
              <ExpenseForm onSuccess={() => setDialogOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Expense List</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-800">
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400">Case</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400">
                    Category
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400">Vendor</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400">
                    Description
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-slate-400">Amount</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-slate-400">Receipt</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-slate-400">Status</th>
                </tr>
              </thead>
              <tbody>
                {demoExpenses.map((expense) => (
                  <tr
                    key={expense.id}
                    className="border-b border-slate-800/50 hover:bg-slate-900/50 transition-colors"
                  >
                    <td className="px-4 py-3 text-sm text-slate-300">
                      {new Date(expense.date).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-sm text-white">{expense.caseName}</td>
                    <td className="px-4 py-3 text-sm text-slate-300">{expense.category}</td>
                    <td className="px-4 py-3 text-sm text-slate-300">{expense.vendor}</td>
                    <td className="px-4 py-3 text-sm text-slate-300">{expense.description}</td>
                    <td className="px-4 py-3 text-sm text-white font-medium text-right">
                      ${expense.amount.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {expense.hasReceipt ? (
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Receipt className="h-4 w-4 text-amber-500" />
                        </Button>
                      ) : (
                        <span className="text-xs text-slate-500">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {expense.isBilled ? (
                        <Badge variant="success">Billed</Badge>
                      ) : (
                        <Badge variant={expense.isBillable ? "warning" : "outline"}>
                          {expense.isBillable ? "Unbilled" : "Non-billable"}
                        </Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-slate-800">
                  <td colSpan={5} className="px-4 py-4 text-sm font-medium text-white">
                    Totals
                  </td>
                  <td className="px-4 py-4 text-sm font-medium text-white text-right">
                    ${totalAmount.toFixed(2)}
                  </td>
                  <td colSpan={2} className="px-4 py-4 text-sm text-slate-400 text-right">
                    Unbilled: ${unbilledAmount.toFixed(2)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

