"use client";

import { useState, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertCircle,
  CheckCircle,
  Info,
  AlertTriangle,
  Upload,
  FileText,
  Loader2,
  ExternalLink,
  Scale,
} from "lucide-react";
import { toast } from "sonner";

interface FontRequirement {
  id: string;
  name: string;
  type: "federal" | "state" | "local";
  allowedFonts: string[];
  preferredFonts?: string[];
  minFontSize: number;
  notes?: string;
  sourceUrl?: string;
}

interface DetectedFont {
  name: string;
  normalizedName: string;
  size: number;
  pages: number[];
  isBody?: boolean;
  isFootnote?: boolean;
}

interface FontIssue {
  type: string;
  severity: "error" | "warning" | "info";
  font: string;
  detectedSize?: number;
  requiredSize?: number;
  pages: number[];
  message: string;
  suggestion?: string;
}

interface ComplianceResult {
  isCompliant: boolean;
  courtId: string;
  courtName: string;
  documentName: string;
  fontsDetected: DetectedFont[];
  issues: FontIssue[];
  requirements: {
    allowedFonts: string[];
    preferredFonts?: string[];
    disallowedFonts?: string[];
    minFontSize: number;
    maxFontSize?: number;
    footnoteMinSize?: number;
    notes?: string;
    sourceUrl?: string;
  };
  summary: string;
}

interface FontCheckResponse {
  success: boolean;
  warning?: string;
  fontsDetected: DetectedFont[];
  summary: {
    primaryFont: string | null;
    footnoteFont: string | null;
    allFonts: string[];
    sizeRange: { min: number; max: number };
  } | null;
  compliance: ComplianceResult | null;
}

interface CourtsResponse {
  courts: {
    federal: FontRequirement[];
    state: FontRequirement[];
    local: FontRequirement[];
  };
  total: number;
}

interface FontComplianceCheckerProps {
  caseId?: string;
  onComplianceCheck?: (result: ComplianceResult) => void;
}

export function FontComplianceChecker({ caseId, onComplianceCheck }: FontComplianceCheckerProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedCourt, setSelectedCourt] = useState<string>("");
  const [dragActive, setDragActive] = useState(false);
  const [result, setResult] = useState<FontCheckResponse | null>(null);

  // Fetch available courts
  const { data: courtsData, isLoading: loadingCourts } = useQuery<CourtsResponse>({
    queryKey: ["courts-font-requirements"],
    queryFn: async () => {
      const res = await fetch("/api/documents/font-check");
      if (!res.ok) throw new Error("Failed to fetch courts");
      return res.json();
    },
  });

  // Font check mutation
  const checkMutation = useMutation({
    mutationFn: async ({ file, courtId }: { file: File; courtId: string }) => {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("courtId", courtId);
      formData.append("documentName", file.name);

      const res = await fetch("/api/documents/font-check", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to check fonts");
      }

      return res.json() as Promise<FontCheckResponse>;
    },
    onSuccess: (data) => {
      setResult(data);
      if (data.compliance) {
        onComplianceCheck?.(data.compliance);
        if (data.compliance.isCompliant) {
          toast.success("Document is compliant with court font requirements!");
        } else {
          toast.error("Document has font compliance issues");
        }
      } else if (data.warning) {
        toast.warning(data.warning);
      }
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Handle file selection
  const handleFileChange = useCallback((file: File | null) => {
    if (file && !file.type.includes("pdf")) {
      toast.error("Please upload a PDF document");
      return;
    }
    setSelectedFile(file);
    setResult(null);
  }, []);

  // Handle drag and drop
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files?.[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  }, [handleFileChange]);

  // Handle check submission
  const handleCheck = () => {
    if (!selectedFile || !selectedCourt) {
      toast.error("Please select a file and court");
      return;
    }
    checkMutation.mutate({ file: selectedFile, courtId: selectedCourt });
  };

  const getSeverityIcon = (severity: "error" | "warning" | "info") => {
    switch (severity) {
      case "error":
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case "info":
        return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  const getSeverityBadge = (severity: "error" | "warning" | "info") => {
    switch (severity) {
      case "error":
        return <Badge variant="destructive">Error</Badge>;
      case "warning":
        return <Badge variant="secondary">Warning</Badge>;
      case "info":
        return <Badge variant="outline">Info</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Scale className="h-5 w-5" />
            Court Font Compliance Checker
          </CardTitle>
          <CardDescription>
            Verify your document meets court-specific font requirements before filing
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Court Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Select Court</label>
            <Select value={selectedCourt} onValueChange={setSelectedCourt}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a court..." />
              </SelectTrigger>
              <SelectContent>
                {loadingCourts ? (
                  <SelectItem value="loading" disabled>Loading courts...</SelectItem>
                ) : courtsData?.courts ? (
                  <>
                    <SelectGroup>
                      <SelectLabel>Federal Courts</SelectLabel>
                      {courtsData.courts.federal.map((court) => (
                        <SelectItem key={court.id} value={court.id}>
                          {court.name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                    <SelectGroup>
                      <SelectLabel>State Courts</SelectLabel>
                      {courtsData.courts.state.map((court) => (
                        <SelectItem key={court.id} value={court.id}>
                          {court.name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                    <SelectGroup>
                      <SelectLabel>Local Courts</SelectLabel>
                      {courtsData.courts.local.map((court) => (
                        <SelectItem key={court.id} value={court.id}>
                          {court.name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </>
                ) : null}
              </SelectContent>
            </Select>
          </div>

          {/* File Upload */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Upload Document</label>
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                dragActive
                  ? "border-primary bg-primary/5"
                  : selectedFile
                  ? "border-green-500 bg-green-50 dark:bg-green-950/20"
                  : "border-muted-foreground/25 hover:border-muted-foreground/50"
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              {selectedFile ? (
                <div className="flex flex-col items-center gap-2">
                  <FileText className="h-8 w-8 text-green-500" />
                  <p className="font-medium">{selectedFile.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleFileChange(null)}
                  >
                    Remove
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <Upload className="h-8 w-8 text-muted-foreground" />
                  <p className="text-muted-foreground">
                    Drag and drop a PDF here, or click to browse
                  </p>
                  <input
                    type="file"
                    accept=".pdf,application/pdf"
                    className="hidden"
                    id="font-check-upload"
                    onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => document.getElementById("font-check-upload")?.click()}
                  >
                    Browse Files
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Check Button */}
          <Button
            className="w-full"
            onClick={handleCheck}
            disabled={!selectedFile || !selectedCourt || checkMutation.isPending}
          >
            {checkMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Analyzing Document...
              </>
            ) : (
              <>
                <Scale className="h-4 w-4 mr-2" />
                Check Compliance
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Results */}
      {result && (
        <>
          {/* Compliance Summary */}
          {result.compliance && (
            <Card className={result.compliance.isCompliant ? "border-green-500" : "border-red-500"}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {result.compliance.isCompliant ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-red-500" />
                  )}
                  Compliance Result
                </CardTitle>
                <CardDescription>
                  {result.compliance.summary}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Court Requirements */}
                <div className="rounded-lg bg-muted p-4">
                  <h4 className="font-medium mb-2">
                    {result.compliance.courtName} Requirements
                  </h4>
                  <div className="grid gap-2 text-sm">
                    <div>
                      <span className="font-medium">Allowed Fonts: </span>
                      <span className="text-muted-foreground">
                        {result.compliance.requirements.allowedFonts.join(", ")}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium">Minimum Size: </span>
                      <span className="text-muted-foreground">
                        {result.compliance.requirements.minFontSize}pt
                      </span>
                    </div>
                    {result.compliance.requirements.footnoteMinSize && (
                      <div>
                        <span className="font-medium">Footnote Min Size: </span>
                        <span className="text-muted-foreground">
                          {result.compliance.requirements.footnoteMinSize}pt
                        </span>
                      </div>
                    )}
                    {result.compliance.requirements.notes && (
                      <div>
                        <span className="font-medium">Notes: </span>
                        <span className="text-muted-foreground">
                          {result.compliance.requirements.notes}
                        </span>
                      </div>
                    )}
                    {result.compliance.requirements.sourceUrl && (
                      <a
                        href={result.compliance.requirements.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-primary hover:underline"
                      >
                        View Official Rules
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                </div>

                {/* Issues */}
                {result.compliance.issues.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-medium">Issues Found</h4>
                    {result.compliance.issues.map((issue, index) => (
                      <div
                        key={index}
                        className={`rounded-lg border p-3 ${
                          issue.severity === "error"
                            ? "border-red-200 bg-red-50 dark:bg-red-950/20"
                            : issue.severity === "warning"
                            ? "border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20"
                            : "border-blue-200 bg-blue-50 dark:bg-blue-950/20"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          {getSeverityIcon(issue.severity)}
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{issue.font}</span>
                              {getSeverityBadge(issue.severity)}
                            </div>
                            <p className="text-sm">{issue.message}</p>
                            {issue.suggestion && (
                              <p className="text-sm text-muted-foreground">
                                {issue.suggestion}
                              </p>
                            )}
                            <p className="text-xs text-muted-foreground">
                              Found on page{issue.pages.length > 1 ? "s" : ""}: {issue.pages.join(", ")}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Detected Fonts */}
          {result.fontsDetected.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Fonts Detected</CardTitle>
                <CardDescription>
                  All fonts found in your document
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {result.fontsDetected.map((font, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between rounded-lg border p-3"
                    >
                      <div>
                        <span className="font-medium">{font.normalizedName}</span>
                        {font.isBody && (
                          <Badge variant="secondary" className="ml-2">Body</Badge>
                        )}
                        {font.isFootnote && (
                          <Badge variant="outline" className="ml-2">Footnote</Badge>
                        )}
                        <p className="text-sm text-muted-foreground">
                          Original: {font.name}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="font-mono text-lg">{font.size}pt</span>
                        <p className="text-xs text-muted-foreground">
                          Page{font.pages.length > 1 ? "s" : ""}: {font.pages.slice(0, 5).join(", ")}
                          {font.pages.length > 5 && `... +${font.pages.length - 5} more`}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Warning for no fonts */}
          {result.warning && (
            <Card className="border-yellow-500">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-yellow-500" />
                  <div>
                    <p className="font-medium">Warning</p>
                    <p className="text-sm text-muted-foreground">{result.warning}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
