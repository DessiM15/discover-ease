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
import { toast } from "sonner";

interface TimeEntryFormProps {
  initialHours?: number;
  initialDescription?: string;
  initialCaseId?: string;
  onSuccess?: () => void;
}

export function TimeEntryForm({
  initialHours = 0,
  initialDescription = "",
  initialCaseId = "",
  onSuccess,
}: TimeEntryFormProps) {
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [caseId, setCaseId] = useState(initialCaseId);
  const [description, setDescription] = useState(initialDescription);
  const [hours, setHours] = useState(initialHours.toString());
  const [rate, setRate] = useState("300");
  const [activityCode, setActivityCode] = useState("");
  const [isBillable, setIsBillable] = useState(true);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // TODO: Save to database
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success("Time entry saved successfully");
      onSuccess?.();
    } catch (error) {
      toast.error("Failed to save time entry");
    } finally {
      setLoading(false);
    }
  };

  const amount = parseFloat(hours) * parseFloat(rate) || 0;

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

      <div>
        <Label>Description</Label>
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe the work performed..."
          className="mt-1 bg-slate-900/50 border-slate-800"
          required
        />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div>
          <Label>Hours</Label>
          <Input
            type="number"
            step="0.25"
            min="0"
            value={hours}
            onChange={(e) => setHours(e.target.value)}
            className="mt-1 bg-slate-900/50 border-slate-800"
            required
          />
        </div>
        <div>
          <Label>Rate ($/hr)</Label>
          <Input
            type="number"
            step="0.01"
            min="0"
            value={rate}
            onChange={(e) => setRate(e.target.value)}
            className="mt-1 bg-slate-900/50 border-slate-800"
            required
          />
        </div>
        <div>
          <Label>Amount</Label>
          <Input
            type="text"
            value={`$${amount.toFixed(2)}`}
            readOnly
            className="mt-1 bg-slate-800/50 border-slate-800"
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <Label>Activity Code</Label>
          <Select value={activityCode} onValueChange={setActivityCode}>
            <SelectTrigger className="mt-1 bg-slate-900/50 border-slate-800">
              <SelectValue placeholder="Select activity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="research">Research</SelectItem>
              <SelectItem value="drafting">Drafting</SelectItem>
              <SelectItem value="review">Review</SelectItem>
              <SelectItem value="court">Court</SelectItem>
              <SelectItem value="meeting">Meeting</SelectItem>
              <SelectItem value="travel">Travel</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center justify-between pt-8">
          <Label htmlFor="billable">Billable</Label>
          <Switch
            id="billable"
            checked={isBillable}
            onCheckedChange={setIsBillable}
          />
        </div>
      </div>

      <div>
        <Label>Notes</Label>
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Additional notes..."
          className="mt-1 bg-slate-900/50 border-slate-800"
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onSuccess}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? "Saving..." : "Save Entry"}
        </Button>
      </div>
    </form>
  );
}

