"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { useDiscoveryRequest, useUpdateDiscoveryRequest } from "@/hooks/use-discovery";
import { toast } from "sonner";

export default function EditDiscoveryPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [id, setId] = useState<string>("");
  const { data: request, isLoading } = useDiscoveryRequest(id);
  const updateRequest = useUpdateDiscoveryRequest();

  useEffect(() => {
    params.then((p) => setId(p.id));
  }, [params]);

  const [formData, setFormData] = useState({
    title: "",
    type: "",
    status: "",
    description: "",
    requestNumber: "",
    isOutgoing: true,
    servedDate: "",
    dueDate: "",
    responseDate: "",
    responseText: "",
    objections: "",
    notes: "",
  });

  useEffect(() => {
    if (request) {
      setFormData({
        title: request.title || "",
        type: request.type || "",
        status: request.status || "draft",
        description: request.description || "",
        requestNumber: (request as any).request_number || "",
        isOutgoing: (request as any).isOutgoing ?? (request as any).is_outgoing ?? true,
        servedDate: (request as any).servedDate || (request as any).served_date
          ? new Date((request as any).servedDate || (request as any).served_date).toISOString().split("T")[0]
          : "",
        dueDate: (request as any).dueDate || (request as any).due_date
          ? new Date((request as any).dueDate || (request as any).due_date).toISOString().split("T")[0]
          : "",
        responseDate: (request as any).responseDate || (request as any).response_date
          ? new Date((request as any).responseDate || (request as any).response_date).toISOString().split("T")[0]
          : "",
        responseText: (request as any).responseText || (request as any).response_text || "",
        objections: request.objections || "",
        notes: request.notes || "",
      });
    }
  }, [request]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !formData.title || !formData.type) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      await updateRequest.mutateAsync({
        id,
        title: formData.title,
        type: formData.type as any,
        status: formData.status as any,
        description: formData.description || null,
        requestNumber: formData.requestNumber || null,
        isOutgoing: formData.isOutgoing,
        servedDate: formData.servedDate ? new Date(formData.servedDate) : null,
        dueDate: formData.dueDate ? new Date(formData.dueDate) : null,
        responseDate: formData.responseDate ? new Date(formData.responseDate) : null,
        responseText: formData.responseText || null,
        objections: formData.objections || null,
        notes: formData.notes || null,
      });
      toast.success("Discovery request updated successfully");
      router.push(`/discovery/${id}`);
    } catch (error: any) {
      toast.error(error.message || "Failed to update discovery request");
    }
  };

  if (isLoading || !id) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!request) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Discovery request not found</p>
        <Button asChild className="mt-4">
          <Link href="/discovery">Back to Discovery</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/discovery/${id}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Edit Discovery Request</h1>
          <p className="mt-1 text-muted-foreground">Update discovery request information</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>Request identification and status</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="mt-1"
                  required
                />
              </div>

              <div>
                <Label htmlFor="type">Type *</Label>
                <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="interrogatory">Interrogatory</SelectItem>
                    <SelectItem value="rfp">Request for Production</SelectItem>
                    <SelectItem value="rfa">Request for Admissions</SelectItem>
                    <SelectItem value="subpoena">Subpoena</SelectItem>
                    <SelectItem value="deposition_notice">Deposition Notice</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="status">Status *</Label>
                <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="served">Served</SelectItem>
                    <SelectItem value="response_due">Response Due</SelectItem>
                    <SelectItem value="overdue">Overdue</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="requestNumber">Request Number</Label>
                <Input
                  id="requestNumber"
                  value={formData.requestNumber}
                  onChange={(e) => setFormData({ ...formData, requestNumber: e.target.value })}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="isOutgoing">Direction</Label>
                <Select
                  value={formData.isOutgoing ? "outgoing" : "incoming"}
                  onValueChange={(value) => setFormData({ ...formData, isOutgoing: value === "outgoing" })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="outgoing">Outgoing</SelectItem>
                    <SelectItem value="incoming">Incoming</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Dates</CardTitle>
              <CardDescription>Important dates for this request</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="servedDate">Served Date</Label>
                <Input
                  id="servedDate"
                  type="date"
                  value={formData.servedDate}
                  onChange={(e) => setFormData({ ...formData, servedDate: e.target.value })}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="dueDate">Due Date</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="responseDate">Response Date</Label>
                <Input
                  id="responseDate"
                  type="date"
                  value={formData.responseDate}
                  onChange={(e) => setFormData({ ...formData, responseDate: e.target.value })}
                  className="mt-1"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Description</CardTitle>
            <CardDescription>Request description and notes</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Enter description..."
                className="bg-card/50 border-border min-h-[100px]"
              />
            </div>
            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Enter notes..."
                className="bg-card/50 border-border min-h-[100px]"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Response & Objections</CardTitle>
            <CardDescription>Response text and objections</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="responseText">Response Text</Label>
              <Textarea
                id="responseText"
                value={formData.responseText}
                onChange={(e) => setFormData({ ...formData, responseText: e.target.value })}
                placeholder="Enter response text..."
                className="bg-card/50 border-border min-h-[150px]"
              />
            </div>
            <div>
              <Label htmlFor="objections">Objections</Label>
              <Textarea
                id="objections"
                value={formData.objections}
                onChange={(e) => setFormData({ ...formData, objections: e.target.value })}
                placeholder="Enter objections..."
                className="bg-card/50 border-border min-h-[100px]"
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" asChild>
            <Link href={`/discovery/${id}`}>Cancel</Link>
          </Button>
          <Button type="submit" disabled={updateRequest.isPending}>
            {updateRequest.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Updating...
              </>
            ) : (
              "Update Request"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}

