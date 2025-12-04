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
import { Switch } from "@/components/ui/switch";
import { Upload } from "lucide-react";
import { toast } from "sonner";

interface ExpenseFormProps {
  onSuccess?: () => void;
}

export function ExpenseForm({ onSuccess }: ExpenseFormProps) {
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [caseId, setCaseId] = useState("");
  const [category, setCategory] = useState("");
  const [vendor, setVendor] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [isBillable, setIsBillable] = useState(true);
  const [loading, setLoading] = useState(false);

  const categories = [
    "Filing Fees",
    "Court Costs",
    "Expert Fees",
    "Travel",
    "Copies",
    "Postage",
    "Other",
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // TODO: Save to database
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success("Expense saved successfully");
      onSuccess?.();
    } catch (error) {
      toast.error("Failed to save expense");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <Label>Date</Label>
          <Input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="mt-1 bg-slate-900/50 border-slate-800"
            required
          />
        </div>
        <div>
          <Label>Case</Label>
          <Select value={caseId} onValueChange={setCaseId} required>
            <SelectTrigger className="mt-1 bg-slate-900/50 border-slate-800">
              <SelectValue placeholder="Select case" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Smith v. Johnson</SelectItem>
              <SelectItem value="2">Estate of Williams</SelectItem>
              <SelectItem value="3">State v. Davis</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <Label>Category</Label>
          <Select value={category} onValueChange={setCategory} required>
            <SelectTrigger className="mt-1 bg-slate-900/50 border-slate-800">
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((cat) => (
                <SelectItem key={cat} value={cat.toLowerCase().replace(" ", "_")}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Vendor</Label>
          <Input
            value={vendor}
            onChange={(e) => setVendor(e.target.value)}
            placeholder="Vendor name"
            className="mt-1 bg-slate-900/50 border-slate-800"
            required
          />
        </div>
      </div>

      <div>
        <Label>Description</Label>
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe the expense..."
          className="mt-1 bg-slate-900/50 border-slate-800"
          required
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <Label>Amount</Label>
          <Input
            type="number"
            step="0.01"
            min="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className="mt-1 bg-slate-900/50 border-slate-800"
            required
          />
        </div>
        <div className="flex items-center justify-between pt-8">
          <Label htmlFor="billable">Billable</Label>
          <Switch id="billable" checked={isBillable} onCheckedChange={setIsBillable} />
        </div>
      </div>

      <div>
        <Label>Receipt</Label>
        <div className="mt-1 flex items-center gap-2">
          <Input
            type="file"
            accept="image/*,application/pdf"
            className="bg-slate-900/50 border-slate-800"
          />
          <Button type="button" variant="outline" size="icon">
            <Upload className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onSuccess}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? "Saving..." : "Save Expense"}
        </Button>
      </div>
    </form>
  );
}

