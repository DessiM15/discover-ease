"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
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
import {
  ArrowLeft,
  Hash,
  Calendar,
  User,
  FileText,
  Download,
  Plus,
  Loader2,
  Eye,
  CheckCircle2,
} from "lucide-react";
import { formatBatesRange } from "@/lib/utils";
import {
  useProduction,
  useProductionDocuments,
  useAddDocumentsToProduction,
  useUpdateProductionDocument,
  useUpdateProduction,
  useGeneratePrivilegeLog,
} from "@/hooks/use-productions";
import { useDocuments } from "@/hooks/use-documents";
import { useCase } from "@/hooks/use-cases";
import { useAuth } from "@/components/providers/auth-provider";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

export default function ProductionDetailPage() {
  const params = useParams();
  const productionId = params.id as string;
  const { user } = useAuth();
  const supabase = createClient();
  const [addDocumentsDialogOpen, setAddDocumentsDialogOpen] = useState(false);
  const [selectedDocumentIds, setSelectedDocumentIds] = useState<string[]>([]);
  const [markProducedDialogOpen, setMarkProducedDialogOpen] = useState(false);
  const [producedDate, setProducedDate] = useState(new Date().toISOString().split("T")[0]);
  const [producedToId, setProducedToId] = useState("");

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

  // Get production
  const { data: production, isLoading: productionLoading } = useProduction(productionId);

  // Get production documents
  const { data: productionDocuments, isLoading: documentsLoading } = useProductionDocuments(productionId);

  // Get case documents for adding to production
  const { data: caseDocumentsData } = useDocuments(
    firmId,
    production?.case_id ? { caseId: production.case_id } : undefined
  );
  const caseDocuments = caseDocumentsData?.data ?? [];

  // Get case
  const { data: caseData } = useCase(production?.case_id || "");

  // Get contacts for "produced to" selector
  const { data: contacts } = useQuery({
    queryKey: ["contacts", firmId],
    queryFn: async () => {
      if (!firmId) return [];
      const { data, error } = await supabase
        .from("contacts")
        .select("*")
        .eq("firm_id", firmId);
      if (error) throw error;
      return data;
    },
    enabled: !!firmId,
  });

  const addDocumentsMutation = useAddDocumentsToProduction();
  const updateDocumentMutation = useUpdateProductionDocument();
  const updateProductionMutation = useUpdateProduction();
  const privilegeLogMutation = useGeneratePrivilegeLog();

  const handleAddDocuments = async () => {
    if (selectedDocumentIds.length === 0) return;

    try {
      await addDocumentsMutation.mutateAsync({
        productionSetId: productionId,
        documentIds: selectedDocumentIds,
        batesPrefix: production?.bates_prefix || undefined,
      });
      setSelectedDocumentIds([]);
      setAddDocumentsDialogOpen(false);
    } catch (error) {
      console.error("Error adding documents:", error);
    }
  };

  const handleTogglePrivilege = async (productionDocId: string, isPrivileged: boolean, privilegeReason?: string) => {
    try {
      await updateDocumentMutation.mutateAsync({
        id: productionDocId,
        isPrivileged: isPrivileged,
        privilegeReason: privilegeReason || null,
      });
    } catch (error) {
      console.error("Error updating privilege status:", error);
    }
  };

  const handleMarkAsProduced = async () => {
    if (!producedDate) return;

    try {
      // Convert date string to Date object for timestamp field
      const dateObj = new Date(producedDate + "T00:00:00.000Z");
      
      await updateProductionMutation.mutateAsync({
        id: productionId,
        producedDate: dateObj,
        producedToId: producedToId || null,
      });
      setMarkProducedDialogOpen(false);
    } catch (error) {
      console.error("Error marking as produced:", error);
    }
  };

  const handleDownloadProduction = async () => {
    // This would need to be implemented as an API route to zip all documents
    // For now, we'll just show a message
    alert("Production download feature coming soon. This will create a ZIP file of all documents.");
  };

  const handleDownloadPrivilegeLog = async (format: "csv" | "pdf") => {
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

  // Filter out documents already in production
  const availableDocuments =
    caseDocuments?.filter(
      (doc: any) => !productionDocuments?.some((pd: any) => pd.document_id === doc.id)
    ) || [];

  if (productionLoading || documentsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
      </div>
    );
  }

  if (!production) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Production set not found</p>
        <Button variant="outline" className="mt-4" asChild>
          <Link href="/productions">Back to Productions</Link>
        </Button>
      </div>
    );
  }

  const caseName = production.cases?.name || "Unknown Case";

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/productions">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-foreground">{production.name}</h1>
          <p className="mt-1 text-muted-foreground">{caseName}</p>
        </div>
      </div>

      {/* Production Info Header */}
      <Card>
        <CardHeader>
          <CardTitle>Production Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <Label className="text-xs text-muted-foreground">Bates Range</Label>
              <div className="flex items-center gap-2 mt-1">
                <Hash className="h-4 w-4 text-muted-foreground" />
                <span className="text-foreground font-mono text-sm">
                  {production.bates_start && production.bates_end
                    ? formatBatesRange(production.bates_start, production.bates_end)
                    : "Not set"}
                </span>
              </div>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Documents</Label>
              <p className="text-foreground mt-1">{productionDocuments?.length || 0}</p>
            </div>
            {production.produced_date && (
              <>
                <div>
                  <Label className="text-xs text-muted-foreground">Produced Date</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-foreground text-sm">
                      {new Date(production.produced_date).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                {production.produced_to && (
                  <div>
                    <Label className="text-xs text-muted-foreground">Produced To</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="text-foreground text-sm">
                        {production.produced_to.company_name ||
                          `${production.produced_to.first_name} ${production.produced_to.last_name}`}
                      </span>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
          {production.description && (
            <div className="mt-4">
              <Label className="text-xs text-muted-foreground">Description</Label>
              <p className="text-foreground mt-1">{production.description}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex flex-wrap gap-2">
        <Dialog open={addDocumentsDialogOpen} onOpenChange={setAddDocumentsDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline">
              <Plus className="mr-2 h-4 w-4" />
              Add Documents
            </Button>
          </DialogTrigger>
          <DialogContent className="glass border-border max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add Documents to Production</DialogTitle>
              <DialogDescription>
                Select documents from the case to add to this production set
              </DialogDescription>
            </DialogHeader>
            <div className="mt-4 space-y-4">
              {availableDocuments.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No available documents to add</p>
                </div>
              ) : (
                <>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {availableDocuments.map((doc: any) => (
                      <div
                        key={doc.id}
                        className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card"
                      >
                        <Checkbox
                          checked={selectedDocumentIds.includes(doc.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedDocumentIds([...selectedDocumentIds, doc.id]);
                            } else {
                              setSelectedDocumentIds(selectedDocumentIds.filter((id) => id !== doc.id));
                            }
                          }}
                        />
                        <div className="flex-1">
                          <p className="text-foreground font-medium">{doc.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {doc.category || "No category"} • {doc.status}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setAddDocumentsDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button
                      onClick={handleAddDocuments}
                      disabled={selectedDocumentIds.length === 0 || addDocumentsMutation.isPending}
                    >
                      {addDocumentsMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Adding...
                        </>
                      ) : (
                        `Add ${selectedDocumentIds.length} Document${selectedDocumentIds.length !== 1 ? "s" : ""}`
                      )}
                    </Button>
                  </div>
                </>
              )}
            </div>
          </DialogContent>
        </Dialog>

        <Button variant="outline" onClick={() => setMarkProducedDialogOpen(true)}>
          <CheckCircle2 className="mr-2 h-4 w-4" />
          Mark as Produced
        </Button>

        <Button variant="outline" onClick={() => handleDownloadPrivilegeLog("csv")}>
          <Download className="mr-2 h-4 w-4" />
          Download Privilege Log
        </Button>

        <Button variant="outline" onClick={handleDownloadProduction}>
          <Download className="mr-2 h-4 w-4" />
          Download Production
        </Button>
      </div>

      {/* Documents List */}
      <Card>
        <CardHeader>
          <CardTitle>Production Documents</CardTitle>
          <CardDescription>
            Manage documents in this production set and set privilege status
          </CardDescription>
        </CardHeader>
        <CardContent>
          {productionDocuments && productionDocuments.length > 0 ? (
            <div className="space-y-4">
              {productionDocuments.map((pd: any) => {
                const doc = pd.documents;
                const [privilegeReason, setPrivilegeReason] = useState(pd.privilege_reason || "");

                return (
                  <div
                    key={pd.id}
                    className="flex items-start gap-4 p-4 rounded-lg border border-border bg-card"
                  >
                    <Checkbox
                      checked={pd.is_privileged}
                      onCheckedChange={(checked) => {
                        handleTogglePrivilege(pd.id, checked as boolean, privilegeReason);
                      }}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-foreground">{doc?.name || "Unknown Document"}</p>
                        {pd.is_privileged && (
                          <Badge variant="outline" className="text-xs">
                            Privileged
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                        {pd.bates_number && (
                          <span className="font-mono">{pd.bates_number}</span>
                        )}
                        {doc?.page_count && <span>{doc.page_count} pages</span>}
                        {doc?.file_size && (
                          <span>
                            {(doc.file_size / 1024 / 1024).toFixed(2)} MB
                          </span>
                        )}
                      </div>
                      {pd.is_privileged && (
                        <div className="mt-2">
                          <Label className="text-xs text-muted-foreground">Privilege Reason</Label>
                          <Input
                            value={privilegeReason}
                            onChange={(e) => setPrivilegeReason(e.target.value)}
                            onBlur={() => {
                              if (pd.is_privileged && privilegeReason) {
                                handleTogglePrivilege(pd.id, true, privilegeReason);
                              }
                            }}
                            placeholder="e.g., Attorney-Client Privilege"
                            className="mt-1 bg-background border-border"
                          />
                        </div>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
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
              })}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No documents in this production set</p>
              <Button variant="outline" className="mt-4" onClick={() => setAddDocumentsDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Documents
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Mark as Produced Dialog */}
      <Dialog open={markProducedDialogOpen} onOpenChange={setMarkProducedDialogOpen}>
        <DialogContent className="glass border-border">
          <DialogHeader>
            <DialogTitle>Mark as Produced</DialogTitle>
            <DialogDescription>
              Record when and to whom this production was provided
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label>Produced Date *</Label>
              <Input
                type="date"
                value={producedDate}
                onChange={(e) => setProducedDate(e.target.value)}
                className="mt-1 bg-background border-border"
                required
              />
            </div>
            <div>
              <Label>Produced To</Label>
              <Select value={producedToId} onValueChange={setProducedToId}>
                <SelectTrigger className="mt-1 bg-background border-border">
                  <SelectValue placeholder="Select contact (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {contacts?.map((contact: any) => (
                    <SelectItem key={contact.id} value={contact.id}>
                      {contact.company_name ||
                        `${contact.first_name || ""} ${contact.last_name || ""}`.trim() ||
                        contact.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setMarkProducedDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleMarkAsProduced}
                disabled={!producedDate || updateProductionMutation.isPending}
              >
                {updateProductionMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Mark as Produced"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

