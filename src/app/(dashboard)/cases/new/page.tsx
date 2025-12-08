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
import { useAuth } from "@/components/providers/auth-provider";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

export default function NewCasePage() {
  const router = useRouter();
  const { user } = useAuth();
  const supabase = createClient();
  const queryClient = useQueryClient();

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

  const [formData, setFormData] = useState({
    caseNumber: "",
    name: "",
    type: "",
    status: "intake",
    description: "",
    court: "",
    judge: "",
    courtCaseNumber: "",
    jurisdiction: "",
    dateOpened: "",
    statuteOfLimitations: "",
    trialDate: "",
    discoveryCutoff: "",
    billingType: "",
  });

  const createCase = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (!userData?.firm_id) throw new Error("Firm ID not found");

      const { data: caseData, error } = await supabase
        .from("cases")
        .insert({
          firm_id: userData.firm_id,
          case_number: data.caseNumber,
          name: data.name,
          type: data.type,
          status: data.status,
          description: data.description || null,
          court: data.court || null,
          judge: data.judge || null,
          court_case_number: data.courtCaseNumber || null,
          jurisdiction: data.jurisdiction || null,
          date_opened: data.dateOpened ? new Date(data.dateOpened).toISOString() : null,
          statute_of_limitations: data.statuteOfLimitations ? new Date(data.statuteOfLimitations).toISOString() : null,
          trial_date: data.trialDate ? new Date(data.trialDate).toISOString() : null,
          discovery_cutoff: data.discoveryCutoff ? new Date(data.discoveryCutoff).toISOString() : null,
          billing_type: data.billingType || null,
        })
        .select()
        .single();

      if (error) throw error;
      return caseData;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["cases"] });
      toast.success("Case created successfully");
      router.push(`/cases/${data.id}`);
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to create case");
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.caseNumber || !formData.name || !formData.type) {
      toast.error("Please fill in all required fields");
      return;
    }
    createCase.mutate(formData);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/cases">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-foreground">New Case</h1>
          <p className="mt-1 text-muted-foreground">Create a new case file</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>Case identification and status</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="caseNumber">Case Number *</Label>
                <Input
                  id="caseNumber"
                  value={formData.caseNumber}
                  onChange={(e) => setFormData({ ...formData, caseNumber: e.target.value })}
                  className="mt-1"
                  required
                />
              </div>

              <div>
                <Label htmlFor="name">Case Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="mt-1"
                  required
                />
              </div>

              <div>
                <Label htmlFor="type">Case Type *</Label>
                <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select case type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="personal_injury">Personal Injury</SelectItem>
                    <SelectItem value="medical_malpractice">Medical Malpractice</SelectItem>
                    <SelectItem value="family_law">Family Law</SelectItem>
                    <SelectItem value="divorce">Divorce</SelectItem>
                    <SelectItem value="criminal_defense">Criminal Defense</SelectItem>
                    <SelectItem value="employment">Employment</SelectItem>
                    <SelectItem value="real_estate">Real Estate</SelectItem>
                    <SelectItem value="contract_dispute">Contract Dispute</SelectItem>
                    <SelectItem value="immigration">Immigration</SelectItem>
                    <SelectItem value="bankruptcy">Bankruptcy</SelectItem>
                    <SelectItem value="estate_planning">Estate Planning</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
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
                    <SelectItem value="intake">Intake</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="on_hold">On Hold</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="billingType">Billing Type</Label>
                <Select value={formData.billingType} onValueChange={(value) => setFormData({ ...formData, billingType: value })}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select billing type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hourly">Hourly</SelectItem>
                    <SelectItem value="flat_fee">Flat Fee</SelectItem>
                    <SelectItem value="contingency">Contingency</SelectItem>
                    <SelectItem value="hybrid">Hybrid</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Court Information</CardTitle>
              <CardDescription>Court and jurisdiction details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="court">Court</Label>
                <Input
                  id="court"
                  value={formData.court}
                  onChange={(e) => setFormData({ ...formData, court: e.target.value })}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="judge">Judge</Label>
                <Input
                  id="judge"
                  value={formData.judge}
                  onChange={(e) => setFormData({ ...formData, judge: e.target.value })}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="courtCaseNumber">Court Case Number</Label>
                <Input
                  id="courtCaseNumber"
                  value={formData.courtCaseNumber}
                  onChange={(e) => setFormData({ ...formData, courtCaseNumber: e.target.value })}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="jurisdiction">Jurisdiction</Label>
                <Input
                  id="jurisdiction"
                  value={formData.jurisdiction}
                  onChange={(e) => setFormData({ ...formData, jurisdiction: e.target.value })}
                  className="mt-1"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Important Dates</CardTitle>
            <CardDescription>Key deadlines and dates</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div>
                <Label htmlFor="dateOpened">Date Opened</Label>
                <Input
                  id="dateOpened"
                  type="date"
                  value={formData.dateOpened}
                  onChange={(e) => setFormData({ ...formData, dateOpened: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="statuteOfLimitations">Statute of Limitations</Label>
                <Input
                  id="statuteOfLimitations"
                  type="date"
                  value={formData.statuteOfLimitations}
                  onChange={(e) => setFormData({ ...formData, statuteOfLimitations: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="trialDate">Trial Date</Label>
                <Input
                  id="trialDate"
                  type="date"
                  value={formData.trialDate}
                  onChange={(e) => setFormData({ ...formData, trialDate: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="discoveryCutoff">Discovery Cutoff</Label>
                <Input
                  id="discoveryCutoff"
                  type="date"
                  value={formData.discoveryCutoff}
                  onChange={(e) => setFormData({ ...formData, discoveryCutoff: e.target.value })}
                  className="mt-1"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Description</CardTitle>
            <CardDescription>Case description and notes</CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Enter case description..."
              className="min-h-[120px]"
            />
          </CardContent>
        </Card>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" asChild>
            <Link href="/cases">Cancel</Link>
          </Button>
          <Button type="submit" disabled={createCase.isPending}>
            {createCase.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              "Create Case"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}

