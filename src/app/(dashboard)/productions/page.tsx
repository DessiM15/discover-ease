"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, FileText, Calendar, User, Hash, Download } from "lucide-react";
import { formatBatesRange } from "@/lib/utils";

export default function ProductionsPage() {
  const [productions, setProductions] = useState([
    {
      id: "1",
      name: "Initial Production - Smith v. Johnson",
      caseName: "Smith v. Johnson",
      batesPrefix: "SJ",
      batesStart: "SJ-000001",
      batesEnd: "SJ-001247",
      producedDate: "2024-11-15",
      producedTo: "Johnson Legal",
      documentCount: 1247,
      description: "Initial document production including medical records and correspondence",
    },
    {
      id: "2",
      name: "Supplemental Production - Estate of Williams",
      caseName: "Estate of Williams",
      batesPrefix: "EW",
      batesStart: "EW-000001",
      batesEnd: "EW-000523",
      producedDate: "2024-11-28",
      producedTo: "Estate Counsel",
      documentCount: 523,
      description: "Supplemental production of financial documents",
    },
  ]);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [newProduction, setNewProduction] = useState({
    name: "",
    caseId: "",
    batesPrefix: "",
    description: "",
  });

  const handleCreateProduction = () => {
    if (!newProduction.name || !newProduction.batesPrefix) return;
    
    const caseNames: Record<string, string> = {
      "1": "Smith v. Johnson",
      "2": "Estate of Williams",
      "3": "State v. Davis",
    };
    
    const production = {
      id: Date.now().toString(),
      name: newProduction.name,
      caseName: caseNames[newProduction.caseId] || "Unknown Case",
      batesPrefix: newProduction.batesPrefix,
      batesStart: `${newProduction.batesPrefix}-000001`,
      batesEnd: `${newProduction.batesPrefix}-000000`,
      producedDate: new Date().toISOString().split("T")[0],
      producedTo: "TBD",
      documentCount: 0,
      description: newProduction.description,
    };
    setProductions([...productions, production]);
    setNewProduction({ name: "", caseId: "", batesPrefix: "", description: "" });
    setDialogOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Productions</h1>
          <p className="mt-1 text-slate-400">Manage document productions and privilege logs</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Production Set
            </Button>
          </DialogTrigger>
          <DialogContent className="glass border-slate-800">
            <DialogHeader>
              <DialogTitle>Create Production Set</DialogTitle>
              <DialogDescription>
                Create a new document production set with Bates numbering
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label>Production Name</Label>
                <Input
                  value={newProduction.name}
                  onChange={(e) => setNewProduction({ ...newProduction, name: e.target.value })}
                  placeholder="e.g., Initial Production - Case Name"
                  className="mt-1 bg-slate-900/50 border-slate-800"
                />
              </div>
              <div>
                <Label>Case</Label>
                <Select
                  value={newProduction.caseId}
                  onValueChange={(value) => setNewProduction({ ...newProduction, caseId: value })}
                >
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
              <div>
                <Label>Bates Prefix</Label>
                <Input
                  value={newProduction.batesPrefix}
                  onChange={(e) => setNewProduction({ ...newProduction, batesPrefix: e.target.value.toUpperCase() })}
                  placeholder="e.g., SJ, EW"
                  className="mt-1 bg-slate-900/50 border-slate-800"
                  maxLength={10}
                />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea
                  value={newProduction.description}
                  onChange={(e) => setNewProduction({ ...newProduction, description: e.target.value })}
                  placeholder="Describe this production set..."
                  className="mt-1 bg-slate-900/50 border-slate-800"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateProduction}>Create Production</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {productions.map((production) => (
          <Card key={production.id} className="hover:border-amber-500/20 transition-colors">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg mb-2">{production.name}</CardTitle>
                  <CardDescription>{production.caseName}</CardDescription>
                </div>
                <Button variant="ghost" size="icon">
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs text-slate-400">Bates Range</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Hash className="h-4 w-4 text-slate-400" />
                      <span className="text-white font-mono text-sm">
                        {formatBatesRange(production.batesStart, production.batesEnd)}
                      </span>
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs text-slate-400">Documents</Label>
                    <p className="text-white mt-1">{production.documentCount.toLocaleString()}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs text-slate-400">Produced Date</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Calendar className="h-4 w-4 text-slate-400" />
                      <span className="text-white text-sm">
                        {new Date(production.producedDate).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs text-slate-400">Produced To</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <User className="h-4 w-4 text-slate-400" />
                      <span className="text-white text-sm">{production.producedTo}</span>
                    </div>
                  </div>
                </div>
                {production.description && (
                  <div>
                    <Label className="text-xs text-slate-400">Description</Label>
                    <p className="text-slate-300 text-sm mt-1">{production.description}</p>
                  </div>
                )}
                <div className="flex gap-2 pt-2">
                  <Button variant="outline" size="sm" className="flex-1">
                    <FileText className="mr-2 h-4 w-4" />
                    View Documents
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1">
                    Generate Privilege Log
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
