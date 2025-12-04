"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Edit, Trash2, CheckSquare, Square } from "lucide-react";
import { cn } from "@/lib/utils";

const demoEntries = [
  {
    id: "1",
    date: "2024-12-10",
    caseName: "Smith v. Johnson",
    description: "Draft motion for summary judgment",
    hours: 2.5,
    rate: 300,
    amount: 750,
    activityCode: "Drafting",
    isBillable: true,
    isBilled: false,
  },
  {
    id: "2",
    date: "2024-12-10",
    caseName: "Estate of Williams",
    description: "Client meeting - estate planning",
    hours: 1.0,
    rate: 300,
    amount: 300,
    activityCode: "Meeting",
    isBillable: true,
    isBilled: false,
  },
  {
    id: "3",
    date: "2024-12-09",
    caseName: "State v. Davis",
    description: "Research case law on search and seizure",
    hours: 3.0,
    rate: 300,
    amount: 900,
    activityCode: "Research",
    isBillable: true,
    isBilled: true,
  },
];

export function TimeEntryTable() {
  const [selectedEntries, setSelectedEntries] = useState<string[]>([]);
  const [dateFilter, setDateFilter] = useState("this_week");

  const toggleSelect = (id: string) => {
    setSelectedEntries((prev) =>
      prev.includes(id) ? prev.filter((e) => e !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedEntries.length === demoEntries.length) {
      setSelectedEntries([]);
    } else {
      setSelectedEntries(demoEntries.map((e) => e.id));
    }
  };

  const totalHours = demoEntries.reduce((sum, e) => sum + e.hours, 0);
  const totalAmount = demoEntries.reduce((sum, e) => sum + e.amount, 0);
  const unbilledAmount = demoEntries
    .filter((e) => !e.isBilled)
    .reduce((sum, e) => sum + e.amount, 0);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Time Entries</CardTitle>
          <div className="flex gap-2">
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-[180px] bg-slate-900/50 border-slate-800">
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
              <Button variant="outline" size="sm">
                Add to Invoice ({selectedEntries.length})
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-800">
                <th className="px-4 py-3 text-left">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={toggleSelectAll}
                  >
                    {selectedEntries.length === demoEntries.length ? (
                      <CheckSquare className="h-4 w-4" />
                    ) : (
                      <Square className="h-4 w-4" />
                    )}
                  </Button>
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400">Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400">Case</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400">
                  Description
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-slate-400">Hours</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-slate-400">Rate</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-slate-400">Amount</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-slate-400">Status</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-slate-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {demoEntries.map((entry) => (
                <tr
                  key={entry.id}
                  className="border-b border-slate-800/50 hover:bg-slate-900/50 transition-colors"
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
                  <td className="px-4 py-3 text-sm text-slate-300">
                    {new Date(entry.date).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-sm text-white">{entry.caseName}</td>
                  <td className="px-4 py-3 text-sm text-slate-300 max-w-xs truncate">
                    {entry.description}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-300 text-right">
                    {entry.hours.toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-300 text-right">
                    ${entry.rate.toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-sm text-white font-medium text-right">
                    ${entry.amount.toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                      {entry.isBilled ? (
                        <Badge variant="success">Billed</Badge>
                      ) : (
                        <Badge variant={entry.isBillable ? "warning" : "outline"}>
                          {entry.isBillable ? "Unbilled" : "Non-billable"}
                        </Badge>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-red-400">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-slate-800">
                <td colSpan={4} className="px-4 py-4 text-sm font-medium text-white">
                  Totals
                </td>
                <td className="px-4 py-4 text-sm font-medium text-white text-right">
                  {totalHours.toFixed(2)} hrs
                </td>
                <td colSpan={2} className="px-4 py-4 text-sm font-medium text-white text-right">
                  ${totalAmount.toFixed(2)}
                </td>
                <td colSpan={2} className="px-4 py-4 text-sm text-slate-400 text-right">
                  Unbilled: ${unbilledAmount.toFixed(2)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

