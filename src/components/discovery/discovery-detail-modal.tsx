"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sparkles,
  User,
  Calendar,
  FileText,
  Send,
  Edit,
  CheckCircle,
  X,
  Loader2,
} from "lucide-react";
import { formatDaysRemaining, getDiscoveryTypeLabel, getDiscoveryTypeIcon } from "@/lib/utils";
import { FileSearch } from "lucide-react";
import { toast } from "sonner";

interface DiscoveryDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  request: any;
  items?: any[];
}

export function DiscoveryDetailModal({
  open,
  onOpenChange,
  request,
  items = [],
}: DiscoveryDetailModalProps) {
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [aiDraft, setAiDraft] = useState<string>("");
  const [generating, setGenerating] = useState(false);
  const [responseText, setResponseText] = useState<string>("");
  const [notes, setNotes] = useState<string>(request.notes || "");
  const [fullResponseText, setFullResponseText] = useState<string>(request.responseText || request.response_text || "");
  const [objections, setObjections] = useState<string>(request.objections || "");
  const [isSaving, setIsSaving] = useState(false);

  const handleGenerateAI = async (itemId: string, itemText: string) => {
    setSelectedItemId(itemId);
    setGenerating(true);
    try {
      const response = await fetch("/api/discovery/draft-response", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          itemText, 
          caseContext: request.caseName,
          requestType: request.type 
        }),
      });
      if (!response.ok) throw new Error("Failed to generate response");
      const { draftResponse } = await response.json();
      setAiDraft(draftResponse);
      toast.success("AI response generated successfully");
    } catch (error) {
      toast.error("Failed to generate AI response");
    } finally {
      setGenerating(false);
      setSelectedItemId(null);
    }
  };

  const handleAcceptDraft = () => {
    setResponseText(aiDraft);
    setAiDraft("");
    toast.success("Response draft accepted");
  };

  const handleSaveResponse = async () => {
    setIsSaving(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      toast.success("Response saved successfully", {
        description: "Your discovery response has been saved.",
      });
    } catch (error) {
      toast.error("Failed to save response");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveNotes = async () => {
    setIsSaving(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      toast.success("Notes saved successfully");
    } catch (error) {
      toast.error("Failed to save notes");
    } finally {
      setIsSaving(false);
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "completed":
        return "success";
      case "overdue":
        return "destructive";
      case "response_due":
        return "warning";
      case "served":
        return "default";
      default:
        return "outline";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto glass border-border">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {(() => {
                const Icon = getDiscoveryTypeIcon(request.type);
                return <Icon className="h-5 w-5" />;
              })()}
              <div>
                <DialogTitle className="text-2xl">{request.title}</DialogTitle>
                <DialogDescription className="mt-1">
                  {getDiscoveryTypeLabel(request.type)} • {request.caseName}
                </DialogDescription>
              </div>
            </div>
            <Badge variant={getStatusVariant(request.status)}>
              {request.status?.replace("_", " ") || "Draft"}
            </Badge>
          </div>
        </DialogHeader>

        <Tabs defaultValue="items" className="mt-4">
          <TabsList>
            <TabsTrigger value="items">Items ({items.length})</TabsTrigger>
            <TabsTrigger value="response">Response</TabsTrigger>
            <TabsTrigger value="parties">Parties</TabsTrigger>
            <TabsTrigger value="notes">Notes</TabsTrigger>
          </TabsList>

          <TabsContent value="items" className="space-y-4 mt-4">
            {items.map((item) => (
              <div
                key={item.id}
                className="rounded-lg border border-border bg-card p-4"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline">Item {item.itemNumber || item.item_number}</Badge>
                      {item.status && (
                        <Badge variant="secondary" className="text-xs">
                          {item.status}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">{item.text}</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleGenerateAI(item.id, item.text || "")}
                    disabled={generating && selectedItemId === item.id}
                  >
                    {generating && selectedItemId === item.id ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-4 w-4" />
                        Draft with AI
                      </>
                    )}
                  </Button>
                </div>

                {aiDraft && selectedItemId === item.id && (
                  <div className="mt-3 rounded-lg border border-purple-500/20 bg-purple-500/5 p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-purple-400" />
                        <span className="text-sm font-medium text-purple-400">AI Draft Response</span>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setAiDraft("")}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleAcceptDraft}
                        >
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{aiDraft}</p>
                    <div className="flex gap-2 mt-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setResponseText(aiDraft)}
                      >
                        Use Draft
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleGenerateAI(item.id, item.text || "")}
                      >
                        Regenerate
                      </Button>
                    </div>
                  </div>
                )}

                {item.responseText || item.response_text ? (
                  <div className="mt-3">
                    <Label className="text-xs text-muted-foreground mb-1">Response:</Label>
                    <p className="text-sm text-foreground">{item.responseText || item.response_text}</p>
                  </div>
                ) : (
                  <div className="mt-3">
                    <Label className="text-xs text-muted-foreground mb-1">Response:</Label>
                    <Textarea
                      className="min-h-[100px] bg-card border-border"
                      placeholder="Enter response..."
                      value={responseText}
                      onChange={(e) => setResponseText(e.target.value)}
                    />
                  </div>
                )}
              </div>
            ))}
          </TabsContent>

          <TabsContent value="response" className="mt-4">
            <div className="space-y-4">
              <div>
                <Label>Full Response Text</Label>
                <Textarea
                  className="min-h-[300px] bg-card border-border mt-2"
                  placeholder="Enter complete response..."
                  value={fullResponseText}
                  onChange={(e) => setFullResponseText(e.target.value)}
                />
              </div>
              <div>
                <Label>Objections</Label>
                <Textarea
                  className="min-h-[150px] bg-card border-border mt-2"
                  placeholder="Enter objections..."
                  value={objections}
                  onChange={(e) => setObjections(e.target.value)}
                />
              </div>
              <Button onClick={handleSaveResponse} disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <FileText className="mr-2 h-4 w-4" />
                    Save Response
                  </>
                )}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="parties" className="mt-4">
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-lg border border-border bg-card p-4">
                  <Label className="text-xs text-muted-foreground mb-2">From Party</Label>
                  <div className="flex items-center gap-2">
                    <User className="h-5 w-5 text-muted-foreground" />
                    <span className="text-foreground">
                      {request.fromPartyName || "Not specified"}
                    </span>
                  </div>
                </div>
                <div className="rounded-lg border border-border bg-card p-4">
                  <Label className="text-xs text-muted-foreground mb-2">To Party</Label>
                  <div className="flex items-center gap-2">
                    <User className="h-5 w-5 text-muted-foreground" />
                    <span className="text-foreground">
                      {request.toPartyName || "Not specified"}
                    </span>
                  </div>
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <Label className="text-xs text-muted-foreground">Served Date</Label>
                  <p className="text-foreground mt-1">
                    {request.servedDate || request.served_date
                      ? new Date(request.servedDate || request.served_date).toLocaleDateString()
                      : "Not served"}
                  </p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Due Date</Label>
                  <p className="text-foreground mt-1">
                    {request.dueDate || request.due_date
                      ? new Date(request.dueDate || request.due_date).toLocaleDateString()
                      : "No due date"}
                  </p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Status</Label>
                  <p className="text-foreground mt-1">
                    {formatDaysRemaining(request.dueDate || request.due_date)}
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="notes" className="mt-4">
            <div className="space-y-4">
              <div>
                <Label>Notes</Label>
                <Textarea
                  className="min-h-[200px] bg-card border-border mt-2"
                  placeholder="Add notes about this discovery request..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
              <Button onClick={handleSaveNotes} disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Notes"
                )}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

