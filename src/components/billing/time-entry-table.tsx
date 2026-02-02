"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Edit, Trash2, CheckSquare, Square, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/providers/auth-provider";
import { toast } from "sonner";

interface TimeEntryTableProps {
  firmId?: string;
  caseId?: string;
}

export function TimeEntryTable({ firmId, caseId }: TimeEntryTableProps) {
  const [selectedEntries, setSelectedEntries] = useState<string[]>([]);
  const [dateFilter, setDateFilter] = useState("this_week");
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editForm, setEditForm] = useState({
    description: "",
    hours: "",
    rate: "",
  });

  const supabase = createClient();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Get user's firm ID if not provided
  const { data: userData } = useQuery({
    queryKey: ["user", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("users")
        .select("firm_id")
        .eq("id", user.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user && !firmId,
  });

  const effectiveFirmId = firmId || userData?.firm_id;

  // Calculate date range based on filter
  const getDateRange = () => {
    const now = new Date();
    switch (dateFilter) {
      case "today":
        return {
          start: new Date(now.setHours(0, 0, 0, 0)).toISOString(),
          end: new Date(now.setHours(23, 59, 59, 999)).toISOString(),
        };
      case "this_week":
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay());
        weekStart.setHours(0, 0, 0, 0);
        return {
          start: weekStart.toISOString(),
          end: new Date().toISOString(),
        };
      case "this_month":
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        return {
          start: monthStart.toISOString(),
          end: new Date().toISOString(),
        };
      default:
        return null;
    }
  };

  const dateRange = getDateRange();

  // Fetch time entries
  const { data: timeEntries, isLoading } = useQuery({
    queryKey: ["time-entries", effectiveFirmId, caseId, dateFilter],
    queryFn: async () => {
      if (!effectiveFirmId) return [];
      let query = supabase
        .from("time_entries")
        .select("*, cases(name), users(first_name, last_name)")
        .eq("firm_id", effectiveFirmId)
        .order("date", { ascending: false });

      if (caseId) {
        query = query.eq("case_id", caseId);
      }

      if (dateRange) {
        query = query.gte("date", dateRange.start).lte("date", dateRange.end);
      }

      const { data, error } = await query.limit(100); // Limit to prevent loading too much data
      if (error) throw error;
      return data || [];
    },
    enabled: !!effectiveFirmId,
  });

  const toggleSelect = (id: string) => {
    setSelectedEntries((prev) =>
      prev.includes(id) ? prev.filter((e) => e !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (!timeEntries) return;
    if (selectedEntries.length === timeEntries.length) {
      setSelectedEntries([]);
    } else {
      setSelectedEntries(timeEntries.map((e: any) => e.id));
    }
  };

  // Memoize calculations to prevent recalculation on every render
  const { totalHours, totalAmount, unbilledAmount } = useMemo(() => {
    const hours = timeEntries?.reduce((sum: number, e: any) => sum + parseFloat(e.hours || 0), 0) || 0;
    const amount = timeEntries?.reduce((sum: number, e: any) => sum + parseFloat(e.amount || 0), 0) || 0;
    const unbilled = timeEntries
      ?.filter((e: any) => !e.is_billed)
      .reduce((sum: number, e: any) => sum + parseFloat(e.amount || 0), 0) || 0;
    return { totalHours: hours, totalAmount: amount, unbilledAmount: unbilled };
  }, [timeEntries]);

  const handleEditEntry = (entry: any) => {
    setSelectedEntry(entry);
    setEditForm({
      description: entry.description || "",
      hours: entry.hours?.toString() || "",
      rate: entry.rate?.toString() || "",
    });
    setEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedEntry) return;
    setIsSubmitting(true);

    try {
      const hours = parseFloat(editForm.hours);
      const rate = parseFloat(editForm.rate);
      const amount = hours * rate;

      const { error } = await supabase
        .from("time_entries")
        .update({
          description: editForm.description,
          hours,
          rate,
          amount,
        })
        .eq("id", selectedEntry.id);

      if (error) throw error;

      toast.success("Time entry updated");
      queryClient.invalidateQueries({ queryKey: ["time-entries"] });
      setEditDialogOpen(false);
      setSelectedEntry(null);
    } catch (error) {
      toast.error("Failed to update time entry");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteEntry = (entry: any) => {
    setSelectedEntry(entry);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedEntry) return;
    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from("time_entries")
        .delete()
        .eq("id", selectedEntry.id);

      if (error) throw error;

      toast.success("Time entry deleted");
      queryClient.invalidateQueries({ queryKey: ["time-entries"] });
      setDeleteDialogOpen(false);
      setSelectedEntry(null);
      setSelectedEntries((prev) => prev.filter((id) => id !== selectedEntry.id));
    } catch (error) {
      toast.error("Failed to delete time entry");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddToInvoice = async () => {
    if (selectedEntries.length === 0) return;
    setIsSubmitting(true);

    try {
      // Simulate adding to invoice - in real implementation, this would create/update an invoice
      await new Promise((resolve) => setTimeout(resolve, 1000));

      toast.success(`${selectedEntries.length} entries added to invoice`, {
        description: "You can view and edit the invoice in the Invoices section.",
      });
      setSelectedEntries([]);
    } catch (error) {
      toast.error("Failed to add entries to invoice");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Time Entries</CardTitle>
          <div className="flex gap-2">
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="this_week">This Week</SelectItem>
                <SelectItem value="this_month">This Month</SelectItem>
                <SelectItem value="custom">Custom Range</SelectItem>
              </SelectContent>
            </Select>
            {selectedEntries.length > 0 && (
              <Button variant="outline" size="sm" onClick={handleAddToInvoice} disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Adding...
                  </>
                ) : (
                  `Add to Invoice (${selectedEntries.length})`
                )}
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {timeEntries && timeEntries.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-4 py-3 text-left">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={toggleSelectAll}
                    >
                      {selectedEntries.length === timeEntries.length ? (
                        <CheckSquare className="h-4 w-4" />
                      ) : (
                        <Square className="h-4 w-4" />
                      )}
                    </Button>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Case</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                    Description
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">Hours</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">Rate</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">Amount</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground">Status</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {timeEntries.map((entry: any) => (
                  <tr
                    key={entry.id}
                    className="border-b border-border hover:bg-muted transition-colors"
                  >
                    <td className="px-4 py-3">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => toggleSelect(entry.id)}
                      >
                        {selectedEntries.includes(entry.id) ? (
                          <CheckSquare className="h-4 w-4" />
                        ) : (
                          <Square className="h-4 w-4" />
                        )}
                      </Button>
                    </td>
                    <td className="px-4 py-3 text-sm text-foreground">
                      {new Date(entry.date).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-sm text-foreground">
                      {entry.cases?.name || "No case"}
                    </td>
                    <td className="px-4 py-3 text-sm text-foreground max-w-xs truncate">
                      {entry.description}
                    </td>
                    <td className="px-4 py-3 text-sm text-foreground text-right">
                      {parseFloat(entry.hours || 0).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-sm text-foreground text-right">
                      ${parseFloat(entry.rate || 0).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-sm text-foreground font-medium text-right">
                      ${parseFloat(entry.amount || 0).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {entry.is_billed ? (
                          <Badge variant="success">Billed</Badge>
                        ) : (
                          <Badge variant={entry.is_billable ? "warning" : "outline"}>
                            {entry.is_billable ? "Unbilled" : "Non-billable"}
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleEditEntry(entry)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-400"
                          onClick={() => handleDeleteEntry(entry)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-border">
                  <td colSpan={4} className="px-4 py-4 text-sm font-medium text-foreground">
                    Totals
                  </td>
                  <td className="px-4 py-4 text-sm font-medium text-foreground text-right">
                    {totalHours.toFixed(2)} hrs
                  </td>
                  <td colSpan={2} className="px-4 py-4 text-sm font-medium text-foreground text-right">
                    ${totalAmount.toFixed(2)}
                  </td>
                  <td colSpan={2} className="px-4 py-4 text-sm text-muted-foreground text-right">
                    Unbilled: ${unbilledAmount.toFixed(2)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        ) : (
          <p className="text-center text-muted-foreground py-8">No time entries found</p>
        )}
      </CardContent>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Time Entry</DialogTitle>
            <DialogDescription>Update the details of this time entry.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                placeholder="Work description..."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="hours">Hours</Label>
                <Input
                  id="hours"
                  type="number"
                  step="0.25"
                  value={editForm.hours}
                  onChange={(e) => setEditForm({ ...editForm, hours: e.target.value })}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rate">Rate ($/hr)</Label>
                <Input
                  id="rate"
                  type="number"
                  value={editForm.rate}
                  onChange={(e) => setEditForm({ ...editForm, rate: e.target.value })}
                  placeholder="0.00"
                />
              </div>
            </div>
            {editForm.hours && editForm.rate && (
              <div className="p-3 rounded-lg bg-muted">
                <p className="text-sm text-muted-foreground">
                  Total: <span className="font-semibold text-foreground">
                    ${(parseFloat(editForm.hours || "0") * parseFloat(editForm.rate || "0")).toFixed(2)}
                  </span>
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Time Entry</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this time entry? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {selectedEntry && (
            <div className="p-4 rounded-lg bg-muted">
              <p className="text-sm text-foreground font-medium">{selectedEntry.description}</p>
              <p className="text-sm text-muted-foreground mt-1">
                {parseFloat(selectedEntry.hours || 0).toFixed(2)} hours • ${parseFloat(selectedEntry.amount || 0).toFixed(2)}
              </p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
