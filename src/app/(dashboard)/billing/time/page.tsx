"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TimerWidget } from "@/components/billing/timer-widget";
import { TimeEntryForm } from "@/components/billing/time-entry-form";
import { TimeEntryTable } from "@/components/billing/time-entry-table";
import { Plus, Filter, Download } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function TimeTrackingPage() {
  const [showTimerForm, setShowTimerForm] = useState(false);
  const [timerHours, setTimerHours] = useState(0);
  const [timerDescription, setTimerDescription] = useState("");
  const [timerCaseId, setTimerCaseId] = useState("");

  const handleTimerStop = (hours: number, description: string, caseId: string) => {
    setTimerHours(hours);
    setTimerDescription(description);
    setTimerCaseId(caseId);
    setShowTimerForm(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Time Tracking</h1>
          <p className="mt-1 text-slate-400">Track billable and non-billable time</p>
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
          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                New Entry
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl glass border-slate-800">
              <DialogHeader>
                <DialogTitle>New Time Entry</DialogTitle>
                <DialogDescription>Add a new time entry manually</DialogDescription>
              </DialogHeader>
              <TimeEntryForm onSuccess={() => setShowTimerForm(false)} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <TimerWidget onStop={handleTimerStop} />

      {showTimerForm && (
        <Dialog open={showTimerForm} onOpenChange={setShowTimerForm}>
          <DialogContent className="max-w-2xl glass border-slate-800">
            <DialogHeader>
              <DialogTitle>Save Time Entry</DialogTitle>
              <DialogDescription>
                Timer recorded {timerHours.toFixed(2)} hours. Review and save.
              </DialogDescription>
            </DialogHeader>
            <TimeEntryForm
              initialHours={timerHours}
              initialDescription={timerDescription}
              initialCaseId={timerCaseId}
              onSuccess={() => {
                setShowTimerForm(false);
                setTimerHours(0);
                setTimerDescription("");
                setTimerCaseId("");
              }}
            />
          </DialogContent>
        </Dialog>
      )}

      <TimeEntryTable firmId={undefined} caseId={undefined} />
    </div>
  );
}

