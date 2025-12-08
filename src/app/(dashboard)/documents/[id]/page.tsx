"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Download, Trash2, ArrowLeft, Sparkles, Loader2 } from "lucide-react";
import { useDocument, useDeleteDocument, useGenerateDocumentSummary } from "@/hooks/use-documents";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import Link from "next/link";

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

export default function DocumentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const supabase = createClient();
  const [id, setId] = useState<string>("");
  
  useEffect(() => {
    params.then((p) => setId(p.id));
  }, [params]);
  
  const { data: document, isLoading } = useDocument(id);
  const deleteMutation = useDeleteDocument();
  const summaryMutation = useGenerateDocumentSummary();

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this document?")) return;
    try {
      await deleteMutation.mutateAsync(id);
      toast.success("Document deleted successfully");
      router.push("/documents");
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Failed to delete document");
    }
  };

  const handleGenerateSummary = async () => {
    try {
      await summaryMutation.mutateAsync(id);
      toast.success("AI summary generated successfully");
    } catch (error) {
      console.error("Summary generation error:", error);
      toast.error("Failed to generate summary");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!document) {
    return (
      <div className="text-center text-muted-foreground">Document not found</div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/documents">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">{document.name}</h1>
            <p className="mt-1 text-muted-foreground">
              {document.cases?.name || "No case assigned"}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => {
              const url = supabase.storage
                .from("documents")
                .getPublicUrl(document.storage_path).data.publicUrl;
              window.open(url, "_blank");
            }}
          >
            <Download className="mr-2 h-4 w-4" />
            Download
          </Button>
          <Button variant="destructive" onClick={handleDelete}>
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      <Tabs defaultValue="preview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="preview">Preview</TabsTrigger>
          <TabsTrigger value="metadata">Metadata</TabsTrigger>
        </TabsList>
        <TabsContent value="preview" className="space-y-4">
          <div className="border border-border rounded-lg p-4 bg-card/50 min-h-[400px] flex items-center justify-center">
            {document.mime_type?.includes("pdf") ? (
              <iframe
                src={`${supabase.storage.from("documents").getPublicUrl(document.storage_path).data.publicUrl}`}
                className="w-full h-[600px] rounded"
              />
            ) : document.mime_type?.includes("image") ? (
              <img
                src={`${supabase.storage.from("documents").getPublicUrl(document.storage_path).data.publicUrl}`}
                alt={document.name}
                className="max-w-full max-h-[600px] rounded"
              />
            ) : (
              <div className="text-center text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4" />
                <p>Preview not available for this file type</p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => {
                    const url = supabase.storage
                      .from("documents")
                      .getPublicUrl(document.storage_path).data.publicUrl;
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
        <TabsContent value="metadata" className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs text-muted-foreground">File Name</Label>
              <p className="text-foreground mt-1">{document.original_name}</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">File Size</Label>
              <p className="text-foreground mt-1">{formatFileSize(document.file_size)}</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">File Type</Label>
              <p className="text-foreground mt-1">{document.mime_type || "Unknown"}</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Upload Date</Label>
              <p className="text-foreground mt-1">
                {new Date(document.created_at).toLocaleDateString()}
              </p>
            </div>
            {document.bates_start && document.bates_end && (
              <>
                <div>
                  <Label className="text-xs text-muted-foreground">Bates Start</Label>
                  <p className="text-foreground font-mono mt-1">{document.bates_start}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Bates End</Label>
                  <p className="text-foreground font-mono mt-1">{document.bates_end}</p>
                </div>
              </>
            )}
            {document.category && (
              <div>
                <Label className="text-xs text-muted-foreground">Category</Label>
                <p className="text-foreground mt-1">{document.category}</p>
              </div>
            )}
            <div>
              <Label className="text-xs text-muted-foreground">Status</Label>
              <Badge variant={getStatusBadgeVariant(document.status)} className="mt-1">
                {document.status.replace("_", " ").replace(/\b\w/g, (l: string) => l.toUpperCase())}
              </Badge>
            </div>
          </div>
          {document.description && (
            <div>
              <Label className="text-xs text-muted-foreground">Description</Label>
              <p className="text-foreground mt-1">{document.description}</p>
            </div>
          )}
          {document.tags && document.tags.length > 0 && (
            <div>
              <Label className="text-xs text-muted-foreground">Tags</Label>
              <div className="flex flex-wrap gap-2 mt-1">
                {document.tags.map((tag: string, idx: number) => (
                  <Badge key={idx} variant="outline">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          {document.ocr_text && (
            <div>
              <Label className="text-xs text-muted-foreground">OCR Text</Label>
              <div className="mt-1 p-3 bg-card/50 rounded border border-border max-h-48 overflow-y-auto">
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {document.ocr_text.substring(0, 1000)}
                  {document.ocr_text.length > 1000 && "..."}
                </p>
              </div>
            </div>
          )}
          <div>
            <Label className="text-xs text-muted-foreground">AI Summary</Label>
            {document.ai_summary ? (
              <div className="mt-1 p-3 bg-card/50 rounded border border-border">
                <p className="text-sm text-muted-foreground">{document.ai_summary}</p>
              </div>
            ) : (
              <Button
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={handleGenerateSummary}
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
        </TabsContent>
      </Tabs>
    </div>
  );
}

