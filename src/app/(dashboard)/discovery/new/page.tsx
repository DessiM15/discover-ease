"use client";

import { useState } from "react";
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
import { useCreateDiscoveryRequest } from "@/hooks/use-discovery";
import { useAuth } from "@/components/providers/auth-provider";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

export default function NewDiscoveryPage() {
  const router = useRouter();
  const { user } = useAuth();
  const supabase = createClient();
  const createRequest = useCreateDiscoveryRequest();

  // Get user's firm ID and cases
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

  const { data: cases } = useQuery({
    queryKey: ["cases", userData?.firm_id],
    queryFn: async () => {
      if (!userData?.firm_id) return [];
      const { data, error } = await supabase
        .from("cases")
        .select("id, name")
        .eq("firm_id", userData.firm_id);
      if (error) throw error;
      return data;
    },
    enabled: !!userData?.firm_id,
  });

  const [formData, setFormData] = useState({
    caseId: "",
    title: "",
    type: "",
    status: "draft",
    description: "",
    requestNumber: "",
    isOutgoing: true,
    servedDate: "",
    dueDate: "",
    notes: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.caseId || !formData.title || !formData.type) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      const result = await createRequest.mutateAsync({
        caseId: formData.caseId,
        title: formData.title,
        type: formData.type as any,
        status: formData.status as any,
        description: formData.description || null,
        requestNumber: formData.requestNumber || null,
        isOutgoing: formData.isOutgoing,
        servedDate: formData.servedDate ? new Date(formData.servedDate) : null,
        dueDate: formData.dueDate ? new Date(formData.dueDate) : null,
        notes: formData.notes || null,
      });
      toast.success("Discovery request created successfully");
      router.push(`/discovery/${result.id}`);
    } catch (error: any) {
      toast.error(error.message || "Failed to create discovery request");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/discovery">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-foreground">New Discovery Request</h1>
          <p className="mt-1 text-muted-foreground">Create a new discovery request</p>
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
                <Label htmlFor="caseId">Case *</Label>
                <Select value={formData.caseId} onValueChange={(value) => setFormData({ ...formData, caseId: value })}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select case" />
                  </SelectTrigger>
                  <SelectContent>
                    {cases?.map((caseItem: any) => (
                      <SelectItem key={caseItem.id} value={caseItem.id}>
                        {caseItem.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

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

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" asChild>
            <Link href="/discovery">Cancel</Link>
          </Button>
          <Button type="submit" disabled={createRequest.isPending}>
            {createRequest.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              "Create Request"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}

