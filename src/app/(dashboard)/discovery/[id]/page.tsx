"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useDiscoveryRequest, useDiscoveryItems, useGenerateAIResponse } from "@/hooks/use-discovery";
import { Sparkles, AlertCircle, CheckCircle, Clock, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";

export default function DiscoveryDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const [id, setId] = useState<string>("");
  
  useEffect(() => {
    params.then((p) => setId(p.id));
  }, [params]);
  
  const { data: request, isLoading: requestLoading } = useDiscoveryRequest(id);
  const { data: items, isLoading: itemsLoading } = useDiscoveryItems(id);
  const generateAI = useGenerateAIResponse();
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  const handleGenerateAI = async (itemId: string, itemText: string) => {
    setSelectedItemId(itemId);
    try {
      await generateAI.mutateAsync({ itemId, itemText });
      toast.success("AI response generated successfully");
    } catch (error) {
      toast.error("Failed to generate AI response");
    } finally {
      setSelectedItemId(null);
    }
  };

  if (requestLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
      </div>
    );
  }

  if (!request) {
    return <div className="text-center text-slate-400">Discovery request not found</div>;
  }

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "completed":
        return "success";
      case "overdue":
        return "destructive";
      case "response_due":
        return "warning";
      default:
        return "outline";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4" />;
      case "overdue":
        return <AlertCircle className="h-4 w-4" />;
      case "response_due":
        return <Clock className="h-4 w-4" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-white">{request.title}</h1>
            <Badge variant={getStatusVariant(request.status || "draft")}>
              {getStatusIcon(request.status || "draft")}
              <span className="ml-1">{request.status?.replace("_", " ") || "Draft"}</span>
            </Badge>
          </div>
          <p className="mt-2 text-slate-400">Case ID: {request.caseId || request.case_id}</p>
        </div>
        <Button>Edit Request</Button>
      </div>

      {/* Request Info */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-400">Type</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold text-white">{request.type}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-400">Direction</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold text-white">
              {(request as any).isOutgoing || (request as any).is_outgoing ? "Outgoing" : "Incoming"}
            </p>
          </CardContent>
        </Card>
        {((request as any).dueDate || (request as any).due_date) && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-400">Due Date</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-semibold text-white">
                {new Date((request as any).dueDate || (request as any).due_date).toLocaleDateString()}
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Items Tabs */}
      <Tabs defaultValue="items" className="space-y-4">
        <TabsList>
          <TabsTrigger value="items">Items ({items?.length || 0})</TabsTrigger>
          <TabsTrigger value="response">Response</TabsTrigger>
          <TabsTrigger value="objections">Objections</TabsTrigger>
        </TabsList>

        <TabsContent value="items" className="space-y-4">
          {itemsLoading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="h-6 w-6 animate-spin text-amber-500" />
            </div>
          ) : items && items.length > 0 ? (
            items.map((item) => (
              <Card key={item.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Item {(item as any).itemNumber || (item as any).item_number}</CardTitle>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleGenerateAI(item.id, (item as any).text || "")}
                        disabled={selectedItemId === item.id || generateAI.isPending}
                      >
                        {selectedItemId === item.id && generateAI.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <Sparkles className="mr-2 h-4 w-4" />
                            Generate AI Response
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-slate-400 mb-2">Request:</p>
                    <p className="text-white">{item.text}</p>
                  </div>
                  {((item as any).aiDraftResponse || (item as any).ai_draft_response) && (
                    <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Sparkles className="h-4 w-4 text-amber-500" />
                        <p className="text-sm font-medium text-amber-500">AI Draft Response</p>
                      </div>
                      <p className="text-sm text-slate-300 whitespace-pre-wrap">
                        {(item as any).aiDraftResponse || (item as any).ai_draft_response}
                      </p>
                    </div>
                  )}
                  {((item as any).responseText || (item as any).response_text) && (
                    <div>
                      <p className="text-sm font-medium text-slate-400 mb-2">Response:</p>
                      <p className="text-white">{(item as any).responseText || (item as any).response_text}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-slate-400">No items found</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="response">
          <Card>
            <CardHeader>
              <CardTitle>Full Response</CardTitle>
              <CardDescription>Complete response text for this discovery request</CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                className="min-h-[300px] bg-slate-900/50 border-slate-800"
                placeholder="Enter response text..."
                defaultValue={(request as any).responseText || (request as any).response_text || ""}
              />
              <Button className="mt-4">Save Response</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="objections">
          <Card>
            <CardHeader>
              <CardTitle>Objections</CardTitle>
              <CardDescription>Objections to this discovery request</CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                className="min-h-[200px] bg-slate-900/50 border-slate-800"
                placeholder="Enter objections..."
                defaultValue={(request as any).objections || ""}
              />
              <Button className="mt-4">Save Objections</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

