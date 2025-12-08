"use client";

import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Users, Calendar, DollarSign, FileSearch, Loader2 } from "lucide-react";
import { useCase } from "@/hooks/use-cases";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

export default function CaseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const [caseId, setCaseId] = React.useState<string | null>(null);
  const supabase = createClient();

  React.useEffect(() => {
    params.then((p) => setCaseId(p.id));
  }, [params]);

  const { data: caseData, isLoading } = useCase(caseId || "");

  // Get case contacts
  const { data: caseContacts } = useQuery({
    queryKey: ["case-contacts", caseId],
    queryFn: async () => {
      if (!caseId) return [];
      const { data, error } = await supabase
        .from("case_contacts")
        .select("*, contacts(*)")
        .eq("case_id", caseId);
      if (error) throw error;
      return data;
    },
    enabled: !!caseId,
  });

  // Get case team
  const { data: caseTeam } = useQuery({
    queryKey: ["case-team", caseId],
    queryFn: async () => {
      if (!caseId) return [];
      const { data, error } = await supabase
        .from("case_team")
        .select("*, users(first_name, last_name, title)")
        .eq("case_id", caseId);
      if (error) throw error;
      return data;
    },
    enabled: !!caseId,
  });

  if (isLoading || !caseId) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
      </div>
    );
  }

  if (!caseData) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Case not found</p>
        <Button asChild className="mt-4">
          <Link href="/cases">Back to Cases</Link>
        </Button>
      </div>
    );
  }

  const getCaseTypeLabel = (type: string) => {
    return type.split("_").map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
  };

  const primaryClient = caseContacts?.find((cc: any) => cc.is_primary && cc.contacts)?.contacts;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-foreground">{caseData.name}</h1>
            <Badge variant={caseData.status === "active" ? "default" : "outline"}>
              {caseData.status}
            </Badge>
            <Badge variant="outline">{getCaseTypeLabel(caseData.type)}</Badge>
          </div>
          <p className="mt-2 text-muted-foreground">Case #: {(caseData as any).case_number || caseData.caseNumber}</p>
        </div>
        <Button>Edit Case</Button>
      </div>

      {/* Case Info Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Client</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold text-foreground">
              {primaryClient
                ? `${primaryClient.first_name || ""} ${primaryClient.last_name || ""}`.trim() ||
                  primaryClient.company_name ||
                  "N/A"
                : "N/A"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Court</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold text-foreground">{caseData.court || "N/A"}</p>
            {caseData.judge && <p className="text-sm text-muted-foreground mt-1">{caseData.judge}</p>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Date Opened</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold text-foreground">
              {((caseData as any).date_opened || caseData.dateOpened)
                ? new Date(((caseData as any).date_opened || caseData.dateOpened) as string).toLocaleDateString()
                : "N/A"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="documents">
            <FileText className="mr-2 h-4 w-4" />
            Documents
          </TabsTrigger>
          <TabsTrigger value="discovery">
            <FileSearch className="mr-2 h-4 w-4" />
            Discovery
          </TabsTrigger>
          <TabsTrigger value="contacts">
            <Users className="mr-2 h-4 w-4" />
            Contacts
          </TabsTrigger>
          <TabsTrigger value="team">
            <Users className="mr-2 h-4 w-4" />
            Team
          </TabsTrigger>
          <TabsTrigger value="billing">
            <DollarSign className="mr-2 h-4 w-4" />
            Billing
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Case Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-foreground">{caseData.description || "No description provided."}</p>
            </CardContent>
          </Card>

          {((caseData as any).trial_date || caseData.trialDate) && (
            <Card>
              <CardHeader>
                <CardTitle>Important Dates</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {((caseData as any).trial_date || caseData.trialDate) && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Trial Date:</span>
                    <span className="text-foreground">
                      {new Date(((caseData as any).trial_date || caseData.trialDate) as string).toLocaleDateString()}
                    </span>
                  </div>
                )}
                {((caseData as any).discovery_cutoff || caseData.discoveryCutoff) && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Discovery Cutoff:</span>
                    <span className="text-foreground">
                      {new Date(((caseData as any).discovery_cutoff || caseData.discoveryCutoff) as string).toLocaleDateString()}
                    </span>
                  </div>
                )}
                {((caseData as any).statute_of_limitations || caseData.statuteOfLimitations) && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Statute of Limitations:</span>
                    <span className="text-foreground">
                      {new Date(((caseData as any).statute_of_limitations || caseData.statuteOfLimitations) as string).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="documents">
          <Card>
            <CardHeader>
              <CardTitle>Documents</CardTitle>
              <CardDescription>Case documents and files</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild>
                <Link href={`/documents?case=${caseId}`}>View All Documents</Link>
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="discovery">
          <Card>
            <CardHeader>
              <CardTitle>Discovery Requests</CardTitle>
              <CardDescription>Manage discovery requests for this case</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild>
                <Link href={`/discovery?case=${caseId}`}>View Discovery Log</Link>
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contacts">
          <Card>
            <CardHeader>
              <CardTitle>Case Contacts</CardTitle>
            </CardHeader>
            <CardContent>
              {caseContacts && caseContacts.length > 0 ? (
                <div className="space-y-3">
                  {caseContacts.map((cc: any) => (
                    <div
                      key={cc.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted"
                    >
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {cc.contacts?.first_name && cc.contacts?.last_name
                            ? `${cc.contacts.first_name} ${cc.contacts.last_name}`
                            : cc.contacts?.company_name || "Unknown"}
                        </p>
                        <p className="text-xs text-muted-foreground">{cc.role}</p>
                      </div>
                      {cc.is_primary && <Badge variant="outline">Primary</Badge>}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No contacts linked to this case</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="team">
          <Card>
            <CardHeader>
              <CardTitle>Case Team</CardTitle>
            </CardHeader>
            <CardContent>
              {caseTeam && caseTeam.length > 0 ? (
                <div className="space-y-3">
                  {caseTeam.map((member: any) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted"
                    >
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {member.users?.first_name} {member.users?.last_name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {member.role} {member.users?.title ? `• ${member.users.title}` : ""}
                        </p>
                      </div>
                      {member.billing_rate && (
                        <p className="text-sm text-muted-foreground">${member.billing_rate}/hr</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No team members assigned</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="billing">
          <Card>
            <CardHeader>
              <CardTitle>Billing</CardTitle>
              <CardDescription>Time entries and invoices for this case</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild>
                <Link href={`/billing/time?case=${caseId}`}>View Time Entries</Link>
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
