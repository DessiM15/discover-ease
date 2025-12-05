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
import { Plus, FileText, Calendar, User, Hash, Download, Loader2, X, Eye } from "lucide-react";
import { formatBatesRange } from "@/lib/utils";
import { useProductions, useCreateProduction, useProductionDocuments, useGeneratePrivilegeLog } from "@/hooks/use-productions";
import { useCases } from "@/hooks/use-cases";
import { useAuth } from "@/components/providers/auth-provider";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

export default function ProductionsPage() {
  const { user } = useAuth();
  const supabase = createClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewDocumentsDialogOpen, setViewDocumentsDialogOpen] = useState(false);
  const [privilegeLogDialogOpen, setPrivilegeLogDialogOpen] = useState(false);
  const [selectedProduction, setSelectedProduction] = useState<string | null>(null);
  const [newProduction, setNewProduction] = useState({
    name: "",
    caseId: "",
    batesPrefix: "",
    description: "",
  });

  // Get user's firm ID
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
    enabled: !!user,
  });

  const firmId = userData?.firm_id;

  // Get cases
  const { data: cases } = useCases(firmId);

  // Get productions
  const { data: productions, isLoading } = useProductions(firmId);

  // Mock data for demonstration
  const mockProductions = [
    {
      id: "mock-1",
      name: "Initial Production - Smith v. Johnson",
      cases: { name: "Smith v. Johnson" },
      bates_prefix: "SJ",
      bates_start: "SJ-000001",
      bates_end: "SJ-001247",
      produced_date: "2024-11-15",
      produced_to: { company_name: "Johnson Legal" },
      description: "Initial document production including medical records and correspondence",
      is_mock: true,
    },
    {
      id: "mock-2",
      name: "Supplemental Production - Estate of Williams",
      cases: { name: "Estate of Williams" },
      bates_prefix: "EW",
      bates_start: "EW-000001",
      bates_end: "EW-000523",
      produced_date: "2024-11-28",
      produced_to: { company_name: "Estate Counsel" },
      description: "Supplemental production of financial documents",
      is_mock: true,
    },
  ];

  // Combine real productions with mock data (mock data first, then real data)
  const allProductions = [...mockProductions, ...(productions || [])];

  // Get production documents for selected production
  const { data: productionDocuments } = useProductionDocuments(selectedProduction || "");

  const createMutation = useCreateProduction();
  const privilegeLogMutation = useGeneratePrivilegeLog();

  const handleCreateProduction = async () => {
    if (!newProduction.name || !newProduction.caseId || !newProduction.batesPrefix) return;

    const selectedCase = cases?.find((c) => c.id === newProduction.caseId);
    if (!selectedCase) return;

    try {
      await createMutation.mutateAsync({
        caseId: newProduction.caseId,
        name: newProduction.name,
        batesPrefix: newProduction.batesPrefix,
        description: newProduction.description || null,
      });

      setNewProduction({ name: "", caseId: "", batesPrefix: "", description: "" });
      setDialogOpen(false);
    } catch (error: any) {
      console.error("Error creating production:", error);
      alert(error?.message || "Failed to create production. Please check the console for details.");
    }
  };

  const handleViewDocuments = (productionId: string) => {
    setSelectedProduction(productionId);
    setViewDocumentsDialogOpen(true);
  };

  const handleGeneratePrivilegeLog = async (productionId: string) => {
    setSelectedProduction(productionId);
    setPrivilegeLogDialogOpen(true);

    try {
      await privilegeLogMutation.mutateAsync({ productionSetId: productionId, format: "json" });
    } catch (error) {
      console.error("Error generating privilege log:", error);
    }
  };

  const handleDownloadPrivilegeLog = async (productionId: string, format: "csv" | "pdf") => {
    try {
      const blob = await privilegeLogMutation.mutateAsync({
        productionSetId: productionId,
        format,
      });

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `privilege-log-${productionId}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Error downloading privilege log:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
      </div>
    );
  }

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
                <Label>Production Name *</Label>
                <Input
                  value={newProduction.name}
                  onChange={(e) => setNewProduction({ ...newProduction, name: e.target.value })}
                  placeholder="e.g., Initial Production - Case Name"
                  className="mt-1 bg-slate-900/50 border-slate-800"
                />
              </div>
              <div>
                <Label>Case *</Label>
                <Select
                  value={newProduction.caseId}
                  onValueChange={(value) => {
                    setNewProduction({ ...newProduction, caseId: value });
                    const selectedCase = cases?.find((c) => c.id === value);
                    if (selectedCase?.batesPrefix) {
                      setNewProduction((prev) => ({
                        ...prev,
                        caseId: value,
                        batesPrefix: selectedCase.batesPrefix || "",
                      }));
                    }
                  }}
                >
                  <SelectTrigger className="mt-1 bg-slate-900/50 border-slate-800">
                    <SelectValue placeholder="Select case" />
                  </SelectTrigger>
                  <SelectContent>
                    {cases?.map((caseItem) => (
                      <SelectItem key={caseItem.id} value={caseItem.id}>
                        {caseItem.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Bates Prefix *</Label>
                <Input
                  value={newProduction.batesPrefix}
                  onChange={(e) =>
                    setNewProduction({ ...newProduction, batesPrefix: e.target.value.toUpperCase() })
                  }
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
                <Button
                  onClick={handleCreateProduction}
                  disabled={createMutation.isPending || !newProduction.name || !newProduction.caseId || !newProduction.batesPrefix}
                >
                  {createMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create Production"
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {allProductions.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <FileText className="h-12 w-12 mx-auto text-slate-400 mb-4" />
              <p className="text-slate-400">No production sets found</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {allProductions.map((production: any) => {
            const caseName = production.cases?.name || "Unknown Case";
            // For mock data, use a fixed document count; for real data, use actual count
            const documentCount = production.is_mock 
              ? production.id === "mock-1" ? 1247 : 523
              : productionDocuments?.length || 0;

            return (
              <Card key={production.id} className="hover:border-amber-500/20 transition-colors">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg mb-2">{production.name}</CardTitle>
                      <CardDescription>{caseName}</CardDescription>
                    </div>
                    {!production.is_mock && (
                      <Button variant="ghost" size="icon" asChild>
                        <Link href={`/productions/${production.id}`}>
                          <Download className="h-4 w-4" />
                        </Link>
                      </Button>
                    )}
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
                            {production.bates_start && production.bates_end
                              ? formatBatesRange(production.bates_start, production.bates_end)
                              : "Not set"}
                          </span>
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs text-slate-400">Documents</Label>
                        <p className="text-white mt-1">{documentCount.toLocaleString()}</p>
                      </div>
                    </div>
                    {production.produced_date && (
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-xs text-slate-400">Produced Date</Label>
                          <div className="flex items-center gap-2 mt-1">
                            <Calendar className="h-4 w-4 text-slate-400" />
                            <span className="text-white text-sm">
                              {new Date(production.produced_date).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        {production.produced_to && (
                          <div>
                            <Label className="text-xs text-slate-400">Produced To</Label>
                            <div className="flex items-center gap-2 mt-1">
                              <User className="h-4 w-4 text-slate-400" />
                              <span className="text-white text-sm">
                                {production.produced_to.company_name ||
                                  `${production.produced_to.first_name} ${production.produced_to.last_name}`}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    {production.description && (
                      <div>
                        <Label className="text-xs text-slate-400">Description</Label>
                        <p className="text-slate-300 text-sm mt-1">{production.description}</p>
                      </div>
                    )}
                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => handleViewDocuments(production.id)}
                        disabled={production.is_mock}
                      >
                        <FileText className="mr-2 h-4 w-4" />
                        View Documents
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => handleGeneratePrivilegeLog(production.id)}
                        disabled={production.is_mock}
                      >
                        Generate Privilege Log
                      </Button>
                    </div>
                    {production.is_mock && (
                      <Badge variant="outline" className="mt-2 text-xs">
                        Demo Data
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* View Documents Dialog */}
      <Dialog open={viewDocumentsDialogOpen} onOpenChange={setViewDocumentsDialogOpen}>
        <DialogContent className="glass border-slate-800 max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Production Documents</DialogTitle>
            <DialogDescription>
              Documents included in this production set
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 space-y-4">
            {selectedProduction && allProductions.find((p: any) => p.id === selectedProduction)?.is_mock ? (
              <div className="text-center py-8 text-slate-400">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>This is demo data. Create a real production set to view documents.</p>
              </div>
            ) : productionDocuments && productionDocuments.length > 0 ? (
              productionDocuments.map((pd: any) => {
                const doc = pd.documents;
                return (
                  <div
                    key={pd.id}
                    className="flex items-center justify-between p-4 rounded-lg border border-slate-800 bg-slate-900/50"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-white">{doc?.name || "Unknown Document"}</p>
                        {pd.is_privileged && (
                          <Badge variant="outline" className="text-xs">
                            Privileged
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-sm text-slate-400">
                        {pd.bates_number && (
                          <span className="font-mono">{pd.bates_number}</span>
                        )}
                        {doc?.page_count && <span>{doc.page_count} pages</span>}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        window.open(
                          supabase.storage.from("documents").getPublicUrl(doc?.storage_path || "").data.publicUrl,
                          "_blank"
                        );
                      }}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8 text-slate-400">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No documents in this production set</p>
              </div>
            )}
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setViewDocumentsDialogOpen(false)}>
              Close
            </Button>
            {selectedProduction && (
              <Button asChild>
                <Link href={`/productions/${selectedProduction}`}>Manage Production</Link>
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Privilege Log Dialog */}
      <Dialog open={privilegeLogDialogOpen} onOpenChange={setPrivilegeLogDialogOpen}>
        <DialogContent className="glass border-slate-800 max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Privilege Log</DialogTitle>
            <DialogDescription>
              Privileged documents in this production set
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            {privilegeLogMutation.isPending ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
              </div>
            ) : privilegeLogMutation.data?.privilegeLog &&
              privilegeLogMutation.data.privilegeLog.length > 0 ? (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800">
                        <th className="text-left p-2 text-xs text-slate-400">Bates Number</th>
                        <th className="text-left p-2 text-xs text-slate-400">Document Date</th>
                        <th className="text-left p-2 text-xs text-slate-400">Author</th>
                        <th className="text-left p-2 text-xs text-slate-400">Recipients</th>
                        <th className="text-left p-2 text-xs text-slate-400">Document Type</th>
                        <th className="text-left p-2 text-xs text-slate-400">Privilege Claimed</th>
                        <th className="text-left p-2 text-xs text-slate-400">Basis</th>
                      </tr>
                    </thead>
                    <tbody>
                      {privilegeLogMutation.data.privilegeLog.map((log: any, idx: number) => (
                        <tr key={idx} className="border-b border-slate-800">
                          <td className="p-2 text-white font-mono text-sm">{log.batesNumber}</td>
                          <td className="p-2 text-white text-sm">
                            {new Date(log.documentDate).toLocaleDateString()}
                          </td>
                          <td className="p-2 text-white text-sm">{log.author}</td>
                          <td className="p-2 text-white text-sm">
                            {Array.isArray(log.recipients) ? log.recipients.join(", ") : log.recipients}
                          </td>
                          <td className="p-2 text-white text-sm">{log.documentType}</td>
                          <td className="p-2 text-white text-sm">{log.privilegeClaimed}</td>
                          <td className="p-2 text-white text-sm">{log.basis}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button
                    variant="outline"
                    onClick={() => selectedProduction && handleDownloadPrivilegeLog(selectedProduction, "csv")}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download as CSV
                  </Button>
                  <Button variant="outline" onClick={() => setPrivilegeLogDialogOpen(false)}>
                    Close
                  </Button>
                </div>
              </>
            ) : (
              <div className="text-center py-12 text-slate-400">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No privileged documents in this production set</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
