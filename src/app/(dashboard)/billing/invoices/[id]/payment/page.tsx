"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { PaymentForm } from "@/components/billing/payment-form";
import Link from "next/link";

export default function RecordPaymentPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [id, setId] = useState<string>("");
  const [balance, setBalance] = useState<number>(0);
  
  useEffect(() => {
    params.then((p) => setId(p.id));
  }, [params]);

  // In a real app, fetch invoice data to get balance
  // For now, using a placeholder
  useEffect(() => {
    // TODO: Fetch invoice data
    setBalance(1300);
  }, [id]);

  const handleSuccess = () => {
    router.push(`/billing/invoices/${id}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/billing/invoices/${id}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Record Payment</h1>
          <p className="mt-1 text-muted-foreground">Record a payment for this invoice</p>
        </div>
      </div>

      <div className="max-w-md">
        <PaymentForm invoiceId={id} balance={balance} onSuccess={handleSuccess} />
      </div>
    </div>
  );
}










