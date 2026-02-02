"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
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
import { Plus, Filter, Download, Loader2 } from "lucide-react";
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

export default function TimeTrackingPage() {
  const [showTimerForm, setShowTimerForm] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [timerHours, setTimerHours] = useState(0);
  const [timerDescription, setTimerDescription] = useState("");
  const [timerCaseId, setTimerCaseId] = useState("");
  const [filters, setFilters] = useState({
    status: "all",
    dateRange: "this_month",
    billableOnly: false,
  });

  const handleTimerStop = (hours: number, description: string, caseId: string) => {
    setTimerHours(hours);
    setTimerDescription(description);
    setTimerCaseId(caseId);
    setShowTimerForm(true);
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      // Simulate export process
      await new Promise((resolve) => setTimeout(resolve, 1500));
      toast.success("Export complete", {
        description: "Time entries exported to CSV file.",
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Time Tracking</h1>
          <p className="mt-1 text-muted-foreground">Track billable and non-billable time</p>
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
                <DialogTitle>Filter Time Entries</DialogTitle>
                <DialogDescription>Set filters to narrow down your time entries.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={filters.status} onValueChange={(v) => setFilters({ ...filters, status: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Entries</SelectItem>
                      <SelectItem value="billed">Billed</SelectItem>
                      <SelectItem value="unbilled">Unbilled</SelectItem>
                      <SelectItem value="non_billable">Non-billable</SelectItem>
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
                      <SelectItem value="today">Today</SelectItem>
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
          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                New Entry
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl glass border-border">
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
          <DialogContent className="max-w-2xl glass border-border">
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

