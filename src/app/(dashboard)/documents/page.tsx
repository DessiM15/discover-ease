"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Plus,
  Search,
  Grid3x3,
  List,
  FileText,
  File,
  Image,
  Download,
  Eye,
  Edit,
  Trash2,
  X,
  Upload,
  Loader2,
  Sparkles,
} from "lucide-react";
import { useDocuments, useUploadDocument, useDeleteDocument, useGenerateDocumentSummary } from "@/hooks/use-documents";
import { useCases } from "@/hooks/use-cases";
import { useAuth } from "@/components/providers/auth-provider";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { formatDistanceToNow } from "date-fns/formatDistanceToNow";
import Link from "next/link";

const DOCUMENT_CATEGORIES = [
  "Medical Records",
  "Correspondence",
  "Pleadings",
  "Discovery",
  "Evidence",
  "Contracts",
  "Financial Records",
  "Other",
];

const DOCUMENT_STATUSES = [
  "draft",
  "pending_review",
  "reviewed",
  "final",
  "filed",
  "served",
];

function getFileIcon(mimeType?: string | null) {
  if (!mimeType) return File;
  if (mimeType.includes("pdf")) return FileText;
  if (mimeType.includes("image")) return Image;
  return File;
}

function formatFileSize(bytes?: number | null) {
  if (!bytes) return "Unknown";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getStatusBadgeVariant(status: string) {
  const variants: Record<string, "default" | "secondary" | "outline"> = {
    draft: "outline",
    pending_review: "secondary",
    reviewed: "default",
    final: "default",
    filed: "default",
    served: "default",
  };
  return variants[status] || "outline";
}

export default function DocumentsPage() {
  const { user } = useAuth();
  const supabase = createClient();
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCase, setSelectedCase] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<any>(null);
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

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

  // Get cases for filter
  const { data: casesData } = useCases(firmId);
  const cases = casesData?.data ?? [];

  // Get documents with filters
  const { data: documentsData, isLoading } = useDocuments(firmId, {
    caseId: selectedCase !== "all" ? selectedCase : undefined,
    category: selectedCategory !== "all" ? selectedCategory : undefined,
    status: selectedStatus !== "all" ? selectedStatus : undefined,
    search: searchQuery || undefined,
  });
  const documents = documentsData?.data ?? [];

  const uploadMutation = useUploadDocument();
  const deleteMutation = useDeleteDocument();
  const summaryMutation = useGenerateDocumentSummary();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setUploadFiles((prev) => [...prev, ...files]);
  };

  const handleUpload = async (formData: FormData) => {
    if (uploadFiles.length === 0) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      for (let i = 0; i < uploadFiles.length; i++) {
        const file = uploadFiles[i];
        const uploadFormData = new FormData();
        uploadFormData.append("file", file);
        uploadFormData.append("caseId", formData.get("caseId") as string);
        uploadFormData.append("category", formData.get("category") as string || "");
        uploadFormData.append("description", formData.get("description") as string || "");
        uploadFormData.append("tags", formData.get("tags") as string || "");
        uploadFormData.append("autoBates", formData.get("autoBates") as string || "true");

        await uploadMutation.mutateAsync(uploadFormData);
        setUploadProgress(((i + 1) / uploadFiles.length) * 100);
      }

      setUploadFiles([]);
      setUploadDialogOpen(false);
    } catch (error) {
      console.error("Upload error:", error);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this document?")) return;
    try {
      await deleteMutation.mutateAsync(id);
    } catch (error) {
      console.error("Delete error:", error);
    }
  };

  const handleGenerateSummary = async (documentId: string) => {
    try {
      await summaryMutation.mutateAsync(documentId);
      // Refresh document data
      if (selectedDocument?.id === documentId) {
        // Document will be refreshed via query invalidation
      }
    } catch (error) {
      console.error("Summary generation error:", error);
    }
  };

  const openDocumentDetail = (doc: any) => {
    setSelectedDocument(doc);
    setDetailDialogOpen(true);
  };

  // Memoize filtered documents to prevent recalculation
  const filteredDocuments = useMemo(() => documents || [], [documents]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Documents</h1>
          <p className="mt-1 text-slate-400">Manage all case documents</p>
        </div>
        <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-amber-500 hover:bg-amber-600">
              <Plus className="mr-2 h-4 w-4" />
              Upload Document
            </Button>
          </DialogTrigger>
          <DialogContent className="glass border-slate-800 max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Upload Document</DialogTitle>
              <DialogDescription>
                Upload one or more documents to your case
              </DialogDescription>
            </DialogHeader>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                handleUpload(formData);
              }}
              className="space-y-4 mt-4"
            >
              {/* File Upload Area */}
              <div className="border-2 border-dashed border-slate-700 rounded-lg p-8 text-center hover:border-amber-500/50 transition-colors">
                <Upload className="h-12 w-12 mx-auto text-slate-400 mb-4" />
                <Label htmlFor="file-upload" className="cursor-pointer">
                  <span className="text-amber-500 hover:text-amber-400">Click to upload</span> or drag and drop
                </Label>
                <Input
                  id="file-upload"
                  type="file"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                />
                {uploadFiles.length > 0 && (
                  <div className="mt-4 space-y-2">
                    {uploadFiles.map((file, idx) => (
                      <div key={idx} className="flex items-center justify-between bg-slate-900/50 p-2 rounded">
                        <span className="text-sm text-white">{file.name}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setUploadFiles(uploadFiles.filter((_, i) => i !== idx))}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Case Selector */}
              <div>
                <Label>Case *</Label>
                <Select name="caseId" required>
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

              {/* Category */}
              <div>
                <Label>Category</Label>
                <Select name="category">
                  <SelectTrigger className="mt-1 bg-slate-900/50 border-slate-800">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {DOCUMENT_CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Description */}
              <div>
                <Label>Description</Label>
                <Textarea
                  name="description"
                  placeholder="Document description..."
                  className="mt-1 bg-slate-900/50 border-slate-800"
                />
              </div>

              {/* Tags */}
              <div>
                <Label>Tags (comma-separated)</Label>
                <Input
                  name="tags"
                  placeholder="tag1, tag2, tag3"
                  className="mt-1 bg-slate-900/50 border-slate-800"
                />
              </div>

              {/* Auto Bates */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="autoBates"
                  id="autoBates"
                  defaultChecked
                  value="true"
                  className="rounded"
                />
                <Label htmlFor="autoBates" className="cursor-pointer">
                  Auto-assign Bates numbers
                </Label>
              </div>

              {/* Upload Progress */}
              {isUploading && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-slate-400">
                    <span>Uploading...</span>
                    <span>{Math.round(uploadProgress)}%</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-2">
                    <div
                      className="bg-amber-500 h-2 rounded-full transition-all"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setUploadDialogOpen(false);
                    setUploadFiles([]);
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isUploading || uploadFiles.length === 0}>
                  {isUploading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    "Upload"
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Search documents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-slate-900/50 border-slate-800"
              />
            </div>
            <Select value={selectedCase} onValueChange={setSelectedCase}>
              <SelectTrigger className="bg-slate-900/50 border-slate-800">
                <SelectValue placeholder="All Cases" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Cases</SelectItem>
                {cases?.map((caseItem) => (
                  <SelectItem key={caseItem.id} value={caseItem.id}>
                    {caseItem.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="bg-slate-900/50 border-slate-800">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {DOCUMENT_CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="bg-slate-900/50 border-slate-800">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {DOCUMENT_STATUSES.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex gap-2">
              <Button
                variant={viewMode === "grid" ? "default" : "outline"}
                size="icon"
                onClick={() => setViewMode("grid")}
              >
                <Grid3x3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "outline"}
                size="icon"
                onClick={() => setViewMode("list")}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Documents List */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
        </div>
      ) : filteredDocuments.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <FileText className="h-12 w-12 mx-auto text-slate-400 mb-4" />
              <p className="text-slate-400">No documents found</p>
            </div>
          </CardContent>
        </Card>
      ) : viewMode === "grid" ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredDocuments.map((doc: any) => {
            const FileIcon = getFileIcon(doc.mime_type);
            const caseName = doc.cases?.name || "No case";
            const uploadedBy = doc.uploaded_by
              ? `${doc.uploaded_by.first_name} ${doc.uploaded_by.last_name}`
              : "Unknown";

            return (
              <Card
                key={doc.id}
                className="hover:border-amber-500/20 transition-colors cursor-pointer"
                onClick={() => openDocumentDetail(doc)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
                        <FileIcon className="h-5 w-5 text-amber-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-base truncate">{doc.name}</CardTitle>
                        <p className="text-xs text-slate-400 mt-1 truncate">{caseName}</p>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {doc.bates_start && doc.bates_end && (
                      <div>
                        <Label className="text-xs text-slate-400">Bates Range</Label>
                        <p className="text-white font-mono text-sm">
                          {doc.bates_start}-{doc.bates_end}
                        </p>
                      </div>
                    )}
                    <div className="flex flex-wrap gap-2">
                      {doc.category && (
                        <Badge variant="secondary" className="text-xs">
                          {doc.category}
                        </Badge>
                      )}
                      <Badge variant={getStatusBadgeVariant(doc.status)} className="text-xs">
                        {doc.status.replace("_", " ").replace(/\b\w/g, (l: string) => l.toUpperCase())}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>{formatFileSize(doc.file_size)}</span>
                      <span>{formatDistanceToNow(new Date(doc.created_at), { addSuffix: true })}</span>
                    </div>
                    <div className="text-xs text-slate-400">
                      Uploaded by {uploadedBy}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              {filteredDocuments.map((doc: any) => {
                const FileIcon = getFileIcon(doc.mime_type);
                const caseName = doc.cases?.name || "No case";
                const uploadedBy = doc.uploaded_by
                  ? `${doc.uploaded_by.first_name} ${doc.uploaded_by.last_name}`
                  : "Unknown";

                return (
                  <div
                    key={doc.id}
                    className="flex items-center gap-4 p-4 rounded-lg border border-slate-800 bg-slate-900/50 hover:bg-slate-900 transition-colors"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
                      <FileIcon className="h-5 w-5 text-amber-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-white truncate">{doc.name}</h3>
                        {doc.category && (
                          <Badge variant="secondary" className="text-xs">
                            {doc.category}
                          </Badge>
                        )}
                        <Badge variant={getStatusBadgeVariant(doc.status)} className="text-xs">
                          {doc.status.replace("_", " ").replace(/\b\w/g, (l: string) => l.toUpperCase())}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-sm text-slate-400">
                        <span>{caseName}</span>
                        {doc.bates_start && doc.bates_end && (
                          <span className="font-mono">
                            {doc.bates_start}-{doc.bates_end}
                          </span>
                        )}
                        <span>{formatFileSize(doc.file_size)}</span>
                        <span>{formatDistanceToNow(new Date(doc.created_at), { addSuffix: true })}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          openDocumentDetail(doc);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(doc.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Document Detail Modal */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="glass border-slate-800 max-w-4xl max-h-[90vh] overflow-y-auto">
          {selectedDocument && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedDocument.name}</DialogTitle>
                <DialogDescription>
                  {selectedDocument.cases?.name || "No case assigned"}
                </DialogDescription>
              </DialogHeader>
              <Tabs defaultValue="preview" className="mt-4">
                <TabsList>
                  <TabsTrigger value="preview">Preview</TabsTrigger>
                  <TabsTrigger value="metadata">Metadata</TabsTrigger>
                </TabsList>
                <TabsContent value="preview" className="mt-4">
                  <div className="border border-slate-800 rounded-lg p-4 bg-slate-900/50 min-h-[400px] flex items-center justify-center">
                    {selectedDocument.mime_type?.includes("pdf") ? (
                      <iframe
                        src={`${supabase.storage.from("documents").getPublicUrl(selectedDocument.storage_path).data.publicUrl}`}
                        className="w-full h-[600px] rounded"
                      />
                    ) : selectedDocument.mime_type?.includes("image") ? (
                      <img
                        src={`${supabase.storage.from("documents").getPublicUrl(selectedDocument.storage_path).data.publicUrl}`}
                        alt={selectedDocument.name}
                        className="max-w-full max-h-[600px] rounded"
                      />
                    ) : (
                      <div className="text-center text-slate-400">
                        <FileText className="h-12 w-12 mx-auto mb-4" />
                        <p>Preview not available for this file type</p>
                        <Button
                          variant="outline"
                          className="mt-4"
                          onClick={() => {
                            const url = supabase.storage
                              .from("documents")
                              .getPublicUrl(selectedDocument.storage_path).data.publicUrl;
                            window.open(url, "_blank");
                          }}
                        >
                          <Download className="mr-2 h-4 w-4" />
                          Download to View
                        </Button>
                      </div>
                    )}
                  </div>
                </TabsContent>
                <TabsContent value="metadata" className="mt-4 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs text-slate-400">File Name</Label>
                      <p className="text-white mt-1">{selectedDocument.original_name}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-slate-400">File Size</Label>
                      <p className="text-white mt-1">{formatFileSize(selectedDocument.file_size)}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-slate-400">File Type</Label>
                      <p className="text-white mt-1">{selectedDocument.mime_type || "Unknown"}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-slate-400">Upload Date</Label>
                      <p className="text-white mt-1">
                        {new Date(selectedDocument.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    {selectedDocument.bates_start && selectedDocument.bates_end && (
                      <>
                        <div>
                          <Label className="text-xs text-slate-400">Bates Start</Label>
                          <p className="text-white font-mono mt-1">{selectedDocument.bates_start}</p>
                        </div>
                        <div>
                          <Label className="text-xs text-slate-400">Bates End</Label>
                          <p className="text-white font-mono mt-1">{selectedDocument.bates_end}</p>
                        </div>
                      </>
                    )}
                    {selectedDocument.category && (
                      <div>
                        <Label className="text-xs text-slate-400">Category</Label>
                        <p className="text-white mt-1">{selectedDocument.category}</p>
                      </div>
                    )}
                    <div>
                      <Label className="text-xs text-slate-400">Status</Label>
                      <Badge variant={getStatusBadgeVariant(selectedDocument.status)} className="mt-1">
                        {selectedDocument.status.replace("_", " ").replace(/\b\w/g, (l: string) => l.toUpperCase())}
                      </Badge>
                    </div>
                  </div>
                  {selectedDocument.description && (
                    <div>
                      <Label className="text-xs text-slate-400">Description</Label>
                      <p className="text-white mt-1">{selectedDocument.description}</p>
                    </div>
                  )}
                  {selectedDocument.tags && selectedDocument.tags.length > 0 && (
                    <div>
                      <Label className="text-xs text-slate-400">Tags</Label>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {selectedDocument.tags.map((tag: string, idx: number) => (
                          <Badge key={idx} variant="outline">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {selectedDocument.ocr_text && (
                    <div>
                      <Label className="text-xs text-slate-400">OCR Text</Label>
                      <div className="mt-1 p-3 bg-slate-900/50 rounded border border-slate-800 max-h-48 overflow-y-auto">
                        <p className="text-sm text-slate-300 whitespace-pre-wrap">
                          {selectedDocument.ocr_text.substring(0, 1000)}
                          {selectedDocument.ocr_text.length > 1000 && "..."}
                        </p>
                      </div>
                    </div>
                  )}
                  <div>
                    <Label className="text-xs text-slate-400">AI Summary</Label>
                    {selectedDocument.ai_summary ? (
                      <div className="mt-1 p-3 bg-slate-900/50 rounded border border-slate-800">
                        <p className="text-sm text-slate-300">{selectedDocument.ai_summary}</p>
                      </div>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-2"
                        onClick={() => handleGenerateSummary(selectedDocument.id)}
                        disabled={summaryMutation.isPending}
                      >
                        {summaryMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <Sparkles className="mr-2 h-4 w-4" />
                            Generate AI Summary
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                  <div className="flex gap-2 pt-4">
                    <Button
                      variant="outline"
                      onClick={() => {
                        const url = supabase.storage
                          .from("documents")
                          .getPublicUrl(selectedDocument.storage_path).data.publicUrl;
                        window.open(url, "_blank");
                      }}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Download
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleDelete(selectedDocument.id)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
