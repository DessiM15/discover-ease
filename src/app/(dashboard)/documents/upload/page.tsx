"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
import { Upload, ArrowLeft, X, Loader2 } from "lucide-react";
import { useUploadDocument } from "@/hooks/use-documents";
import { useCases } from "@/hooks/use-cases";
import { useAuth } from "@/components/providers/auth-provider";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
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

export default function UploadDocumentPage() {
  const router = useRouter();
  const { user } = useAuth();
  const supabase = createClient();
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

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

  const { data: casesData } = useCases(firmId);
  const cases = casesData?.data ?? [];

  const uploadMutation = useUploadDocument();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setUploadFiles((prev) => [...prev, ...files]);
  };

  const handleUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (uploadFiles.length === 0) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData(e.currentTarget);
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
      toast.success("Documents uploaded successfully");
      router.push("/documents");
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload documents");
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/documents">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Upload Document</h1>
          <p className="mt-1 text-muted-foreground">Upload one or more documents to your case</p>
        </div>
      </div>

      <form onSubmit={handleUpload} className="max-w-2xl space-y-4">
        {/* File Upload Area */}
        <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors">
          <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <Label htmlFor="file-upload" className="cursor-pointer">
            <span className="text-primary hover:text-primary/80">Click to upload</span> or drag and drop
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
                <div key={idx} className="flex items-center justify-between bg-muted/50 p-2 rounded">
                  <span className="text-sm text-foreground">{file.name}</span>
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
            <SelectTrigger className="mt-1">
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
            <SelectTrigger className="mt-1">
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
            className="mt-1"
          />
        </div>

        {/* Tags */}
        <div>
          <Label>Tags (comma-separated)</Label>
          <Input
            name="tags"
            placeholder="tag1, tag2, tag3"
            className="mt-1"
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
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Uploading...</span>
              <span>{Math.round(uploadProgress)}%</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
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
            onClick={() => router.push("/documents")}
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
    </div>
  );
}

