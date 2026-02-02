"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Plus, Download, AlertTriangle, Loader2 } from "lucide-react";
import { TrustLedger } from "@/components/billing/trust-ledger";
import { toast } from "sonner";

const demoAccounts = [
  { id: "1", name: "Main Trust Account", balance: 125000, minimum: 10000 },
  { id: "2", name: "Escrow Account", balance: 45000, minimum: 5000 },
];

const demoTransactions = [
  {
    id: "1",
    date: "2024-12-10",
    client: "Smith, Jane",
    caseName: "Smith v. Johnson",
    type: "Deposit",
    description: "Retainer deposit",
    amount: 5000,
    runningBalance: 125000,
  },
  {
    id: "2",
    date: "2024-12-08",
    client: "Williams Estate",
    caseName: "Estate of Williams",
    type: "Withdrawal",
    description: "Fee payment",
    amount: -2000,
    runningBalance: 120000,
  },
  {
    id: "3",
    date: "2024-12-05",
    client: "Davis, John",
    caseName: "State v. Davis",
    type: "Transfer",
    description: "Transfer to operating",
    amount: -3000,
    runningBalance: 122000,
  },
];

type TransactionType = "deposit" | "withdrawal" | "transfer" | null;

export default function TrustAccountsPage() {
  const [selectedAccount, setSelectedAccount] = useState(demoAccounts[0].id);
  const [transactionDialogOpen, setTransactionDialogOpen] = useState(false);
  const [transactionType, setTransactionType] = useState<TransactionType>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [transactionForm, setTransactionForm] = useState({
    client: "",
    caseName: "",
    amount: "",
    description: "",
  });

  const currentAccount = demoAccounts.find((a) => a.id === selectedAccount);

  const openTransactionDialog = (type: TransactionType) => {
    setTransactionType(type);
    setTransactionForm({ client: "", caseName: "", amount: "", description: "" });
    setTransactionDialogOpen(true);
  };

  const handleSubmitTransaction = async () => {
    if (!transactionForm.client || !transactionForm.amount) {
      toast.error("Please fill in required fields");
      return;
    }

    setIsSubmitting(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const typeLabel = transactionType === "deposit" ? "Deposit" :
                      transactionType === "withdrawal" ? "Withdrawal" : "Transfer";

    toast.success(`${typeLabel} recorded successfully`, {
      description: `$${parseFloat(transactionForm.amount).toLocaleString()} for ${transactionForm.client}`,
    });

    setIsSubmitting(false);
    setTransactionDialogOpen(false);
    setTransactionType(null);
  };

  const handleGenerateStatement = async (clientSpecific = false) => {
    toast.info(clientSpecific ? "Generating client statement..." : "Generating account statement...");

    // Simulate generation
    await new Promise((resolve) => setTimeout(resolve, 1500));

    toast.success("Statement generated", {
      description: "Your statement has been downloaded.",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Trust Accounts</h1>
          <p className="mt-1 text-muted-foreground">Manage client trust accounts and transactions</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => handleGenerateStatement(false)}>
            <Download className="mr-2 h-4 w-4" />
            Generate Statement
          </Button>
          <Button onClick={() => openTransactionDialog("deposit")}>
            <Plus className="mr-2 h-4 w-4" />
            New Transaction
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Account Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Select Account</Label>
              <Select value={selectedAccount} onValueChange={setSelectedAccount}>
                <SelectTrigger className="mt-1 bg-card border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {demoAccounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {currentAccount && (
              <>
                <div className="p-4 rounded-lg bg-muted">
                  <p className="text-sm text-muted-foreground mb-2">Current Balance</p>
                  <p className="text-4xl font-bold text-foreground">
                    ${currentAccount.balance.toLocaleString()}
                  </p>
                </div>
                {currentAccount.balance < currentAccount.minimum && (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                    <AlertTriangle className="h-4 w-4 text-red-400" />
                    <p className="text-sm text-red-400">
                      Balance below minimum required (${currentAccount.minimum.toLocaleString()})
                    </p>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button variant="outline" className="w-full justify-start" onClick={() => openTransactionDialog("deposit")}>
              Record Deposit
            </Button>
            <Button variant="outline" className="w-full justify-start" onClick={() => openTransactionDialog("withdrawal")}>
              Record Withdrawal
            </Button>
            <Button variant="outline" className="w-full justify-start" onClick={() => openTransactionDialog("transfer")}>
              Transfer to Operating
            </Button>
            <Button variant="outline" className="w-full justify-start" onClick={() => handleGenerateStatement(true)}>
              Generate Client Statement
            </Button>
          </CardContent>
        </Card>
      </div>

      <TrustLedger transactions={demoTransactions} />

      {/* Transaction Dialog */}
      <Dialog open={transactionDialogOpen} onOpenChange={setTransactionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {transactionType === "deposit" && "Record Deposit"}
              {transactionType === "withdrawal" && "Record Withdrawal"}
              {transactionType === "transfer" && "Transfer to Operating"}
            </DialogTitle>
            <DialogDescription>
              {transactionType === "deposit" && "Record a new deposit to the trust account."}
              {transactionType === "withdrawal" && "Record a withdrawal from the trust account."}
              {transactionType === "transfer" && "Transfer funds from trust to operating account."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="client">Client Name *</Label>
              <Input
                id="client"
                placeholder="Enter client name"
                value={transactionForm.client}
                onChange={(e) => setTransactionForm({ ...transactionForm, client: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="caseName">Case Name</Label>
              <Input
                id="caseName"
                placeholder="Enter case name (optional)"
                value={transactionForm.caseName}
                onChange={(e) => setTransactionForm({ ...transactionForm, caseName: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Amount *</Label>
              <Input
                id="amount"
                type="number"
                placeholder="0.00"
                value={transactionForm.amount}
                onChange={(e) => setTransactionForm({ ...transactionForm, amount: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Enter description"
                value={transactionForm.description}
                onChange={(e) => setTransactionForm({ ...transactionForm, description: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setTransactionDialogOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button onClick={handleSubmitTransaction} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                "Submit"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

