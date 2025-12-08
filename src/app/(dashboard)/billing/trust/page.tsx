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
import { Plus, Download, AlertTriangle } from "lucide-react";
import { TrustLedger } from "@/components/billing/trust-ledger";

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

export default function TrustAccountsPage() {
  const [selectedAccount, setSelectedAccount] = useState(demoAccounts[0].id);
  const currentAccount = demoAccounts.find((a) => a.id === selectedAccount);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Trust Accounts</h1>
          <p className="mt-1 text-muted-foreground">Manage client trust accounts and transactions</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Generate Statement
          </Button>
          <Button>
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
            <Button variant="outline" className="w-full justify-start">
              Record Deposit
            </Button>
            <Button variant="outline" className="w-full justify-start">
              Record Withdrawal
            </Button>
            <Button variant="outline" className="w-full justify-start">
              Transfer to Operating
            </Button>
            <Button variant="outline" className="w-full justify-start">
              Generate Client Statement
            </Button>
          </CardContent>
        </Card>
      </div>

      <TrustLedger transactions={demoTransactions} />
    </div>
  );
}

