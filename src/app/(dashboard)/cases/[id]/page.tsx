import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Users, Calendar, DollarSign, FileSearch } from "lucide-react";

export default async function CaseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  // Demo data - will be replaced with real data hooks
  const caseData = {
    id,
    caseNumber: "2024-001",
    name: "Smith v. Johnson",
    type: "personal_injury",
    status: "active",
    description: "Personal injury case involving a motor vehicle accident.",
    court: "Superior Court",
    judge: "Hon. Jane Smith",
    courtCaseNumber: "CV-2024-001234",
    dateOpened: "2024-01-15",
    leadAttorney: "John Doe",
    client: "Smith, Jane",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-white">{caseData.name}</h1>
            <Badge variant="default">Active</Badge>
            <Badge variant="outline">Personal Injury</Badge>
          </div>
          <p className="mt-2 text-slate-400">Case #: {caseData.caseNumber}</p>
        </div>
        <Button>Edit Case</Button>
      </div>

      {/* Case Info Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-400">Client</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold text-white">{caseData.client}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-400">Lead Attorney</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold text-white">{caseData.leadAttorney}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-400">Date Opened</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold text-white">
              {new Date(caseData.dateOpened).toLocaleDateString()}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="discovery">Discovery</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
          <TabsTrigger value="contacts">Contacts</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Case Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-slate-400">Description</p>
                <p className="mt-1 text-white">{caseData.description}</p>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm font-medium text-slate-400">Court</p>
                  <p className="mt-1 text-white">{caseData.court}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-400">Judge</p>
                  <p className="mt-1 text-white">{caseData.judge}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-400">Court Case Number</p>
                  <p className="mt-1 text-white">{caseData.courtCaseNumber}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents">
          <Card>
            <CardHeader>
              <CardTitle>Documents</CardTitle>
              <CardDescription>All documents related to this case</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <FileText className="mb-4 h-12 w-12 text-slate-400" />
                <p className="text-slate-400">No documents yet</p>
                <Button variant="outline" className="mt-4">
                  Upload Document
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="discovery">
          <Card>
            <CardHeader>
              <CardTitle>Discovery</CardTitle>
              <CardDescription>Discovery requests and responses</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <FileSearch className="mb-4 h-12 w-12 text-slate-400" />
                <p className="text-slate-400">No discovery requests yet</p>
                <Button variant="outline" className="mt-4">
                  Create Discovery Request
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="team">
          <Card>
            <CardHeader>
              <CardTitle>Case Team</CardTitle>
              <CardDescription>Team members assigned to this case</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900/50 p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-500/20 text-amber-500">
                      <Users className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-medium text-white">{caseData.leadAttorney}</p>
                      <p className="text-sm text-slate-400">Lead Attorney</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contacts">
          <Card>
            <CardHeader>
              <CardTitle>Case Contacts</CardTitle>
              <CardDescription>Contacts associated with this case</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900/50 p-4">
                  <div>
                    <p className="font-medium text-white">{caseData.client}</p>
                    <p className="text-sm text-slate-400">Client</p>
                  </div>
                  <Badge variant="outline">Primary</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="billing">
          <Card>
            <CardHeader>
              <CardTitle>Billing</CardTitle>
              <CardDescription>Time entries and expenses for this case</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <DollarSign className="mb-4 h-12 w-12 text-slate-400" />
                <p className="text-slate-400">No billing entries yet</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

