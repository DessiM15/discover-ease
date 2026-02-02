"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ExpenseForm } from "@/components/billing/expense-form";
import { Plus, Filter, Download, Receipt, Loader2, ExternalLink } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";

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
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [receiptDialogOpen, setReceiptDialogOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<any>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [filters, setFilters] = useState({
    status: "all",
    category: "all",
    dateRange: "this_month",
  });

  const totalAmount = demoExpenses.reduce((sum, e) => sum + e.amount, 0);
  const unbilledAmount = demoExpenses
    .filter((e) => !e.isBilled)
    .reduce((sum, e) => sum + e.amount, 0);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      toast.success("Export complete", {
        description: "Expenses exported to CSV file.",
      });
    } catch (error) {
      toast.error("Export failed");
    } finally {
      setIsExporting(false);
    }
  };

  const handleApplyFilters = () => {
    setFiltersOpen(false);
    toast.success("Filters applied");
  };

  const handleViewReceipt = (expense: any) => {
    setSelectedExpense(expense);
    setReceiptDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Expenses</h1>
          <p className="mt-1 text-muted-foreground">Track and manage case expenses</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={filtersOpen} onOpenChange={setFiltersOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Filter className="mr-2 h-4 w-4" />
                Filters
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Filter Expenses</DialogTitle>
                <DialogDescription>Set filters to narrow down your expenses.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={filters.status} onValueChange={(v) => setFilters({ ...filters, status: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Expenses</SelectItem>
                      <SelectItem value="billed">Billed</SelectItem>
                      <SelectItem value="unbilled">Unbilled</SelectItem>
                      <SelectItem value="non_billable">Non-billable</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select value={filters.category} onValueChange={(v) => setFilters({ ...filters, category: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      <SelectItem value="filing_fees">Filing Fees</SelectItem>
                      <SelectItem value="expert_fees">Expert Fees</SelectItem>
                      <SelectItem value="travel">Travel</SelectItem>
                      <SelectItem value="copies">Copies/Printing</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Date Range</Label>
                  <Select value={filters.dateRange} onValueChange={(v) => setFilters({ ...filters, dateRange: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="this_week">This Week</SelectItem>
                      <SelectItem value="this_month">This Month</SelectItem>
                      <SelectItem value="last_month">Last Month</SelectItem>
                      <SelectItem value="this_year">This Year</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setFiltersOpen(false)}>Cancel</Button>
                <Button onClick={handleApplyFilters}>Apply Filters</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Button variant="outline" onClick={handleExport} disabled={isExporting}>
            {isExporting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Export
              </>
            )}
          </Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                New Expense
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl glass border-border">
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
                <tr className="border-b border-border">
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Case</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                    Category
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Vendor</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                    Description
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">Amount</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground">Receipt</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {demoExpenses.map((expense) => (
                  <tr
                    key={expense.id}
                    className="border-b border-border hover:bg-muted transition-colors"
                  >
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {new Date(expense.date).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-sm text-foreground">{expense.caseName}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{expense.category}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{expense.vendor}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{expense.description}</td>
                    <td className="px-4 py-3 text-sm text-foreground font-medium text-right">
                      ${expense.amount.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {expense.hasReceipt ? (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleViewReceipt(expense)}
                        >
                          <Receipt className="h-4 w-4 text-amber-500" />
                        </Button>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
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
                <tr className="border-t-2 border-border">
                  <td colSpan={5} className="px-4 py-4 text-sm font-medium text-foreground">
                    Totals
                  </td>
                  <td className="px-4 py-4 text-sm font-medium text-foreground text-right">
                    ${totalAmount.toFixed(2)}
                  </td>
                  <td colSpan={2} className="px-4 py-4 text-sm text-muted-foreground text-right">
                    Unbilled: ${unbilledAmount.toFixed(2)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Receipt Viewer Dialog */}
      <Dialog open={receiptDialogOpen} onOpenChange={setReceiptDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Receipt</DialogTitle>
            <DialogDescription>
              {selectedExpense?.description} - {selectedExpense?.vendor}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="rounded-lg border border-border bg-muted p-8 text-center">
              <Receipt className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground mb-2">Receipt Image Preview</p>
              <p className="text-2xl font-bold text-foreground">
                ${selectedExpense?.amount?.toFixed(2)}
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                {selectedExpense?.date && new Date(selectedExpense.date).toLocaleDateString()}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReceiptDialogOpen(false)}>
              Close
            </Button>
            <Button onClick={() => toast.success("Receipt downloaded")}>
              <Download className="mr-2 h-4 w-4" />
              Download
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

