"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { ExpenseForm } from "@/components/billing/expense-form";
import Link from "next/link";

export default function NewExpensePage() {
  const router = useRouter();

  const handleSuccess = () => {
    router.push("/billing/expenses");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/billing/expenses">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-foreground">New Expense</h1>
          <p className="mt-1 text-muted-foreground">Record a new expense</p>
        </div>
      </div>

      <div className="max-w-2xl">
        <ExpenseForm onSuccess={handleSuccess} />
      </div>
    </div>
  );
}

