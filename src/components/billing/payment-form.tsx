"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

interface PaymentFormProps {
  invoiceId: string;
  balance: number;
  onSuccess?: () => void;
}

export function PaymentForm({ invoiceId, balance, onSuccess }: PaymentFormProps) {
  const [amount, setAmount] = useState(balance.toString());
  const [method, setMethod] = useState("");
  const [reference, setReference] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // TODO: Save payment to database
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success("Payment recorded successfully");
      onSuccess?.();
    } catch (error) {
      toast.error("Failed to record payment");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label>Amount</Label>
        <Input
          type="number"
          step="0.01"
          min="0"
          max={balance}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="mt-1 bg-slate-900/50 border-slate-800"
          required
        />
        <p className="text-xs text-slate-400 mt-1">Balance due: ${balance.toFixed(2)}</p>
      </div>

      <div>
        <Label>Payment Method</Label>
        <Select value={method} onValueChange={setMethod} required>
          <SelectTrigger className="mt-1 bg-slate-900/50 border-slate-800">
            <SelectValue placeholder="Select method" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="credit_card">Credit Card</SelectItem>
            <SelectItem value="ach">ACH</SelectItem>
            <SelectItem value="check">Check</SelectItem>
            <SelectItem value="cash">Cash</SelectItem>
            <SelectItem value="trust">Trust Transfer</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>Reference Number</Label>
        <Input
          value={reference}
          onChange={(e) => setReference(e.target.value)}
          placeholder="Check #, transaction ID, etc."
          className="mt-1 bg-slate-900/50 border-slate-800"
        />
      </div>

      <div>
        <Label>Date Received</Label>
        <Input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="mt-1 bg-slate-900/50 border-slate-800"
          required
        />
      </div>

      <div>
        <Label>Notes</Label>
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="mt-1 bg-slate-900/50 border-slate-800"
          placeholder="Additional notes..."
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onSuccess}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? "Recording..." : "Record Payment"}
        </Button>
      </div>
    </form>
  );
}

