"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Plus,
  Search,
  FileSearch,
  AlertCircle,
  CheckCircle,
  Clock,
  Sparkles,
  X,
  Send,
  Edit,
  Eye,
  TrendingUp,
} from "lucide-react";
import { DiscoveryDetailModal } from "@/components/discovery/discovery-detail-modal";
import { FollowUpEmailModal } from "@/components/discovery/follow-up-email-modal";
import {
  getDiscoveryTypeIcon,
  getDiscoveryTypeLabel,
  formatDaysRemaining,
  calculateDaysRemaining,
} from "@/lib/utils";
import { cn } from "@/lib/utils";

export default function DiscoveryPage() {
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [dismissedInsights, setDismissedInsights] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Demo data - will be replaced with real data hooks
  const requests = [
    {
      id: "1",
      caseName: "Smith v. Johnson",
      type: "interrogatory",
      title: "First Set of Interrogatories",
      isOutgoing: false,
      status: "response_due",
      dueDate: "2024-12-10",
      servedDate: "2024-11-20",
      items: 25,
      respondedItems: 15,
      fromPartyName: "Johnson Legal",
      toPartyName: "Smith & Associates",
    },
    {
      id: "2",
      caseName: "Estate of Williams",
      type: "rfp",
      title: "Request for Production of Documents",
      isOutgoing: true,
      status: "served",
      servedDate: "2024-11-28",
      items: 12,
      respondedItems: 0,
      fromPartyName: "Williams Law Firm",
      toPartyName: "Estate Counsel",
    },
    {
      id: "3",
      caseName: "State v. Davis",
      type: "subpoena",
      title: "Subpoena Duces Tecum",
      isOutgoing: false,
      status: "overdue",
      dueDate: "2024-12-01",
      servedDate: "2024-11-15",
      items: 8,
      respondedItems: 0,
      fromPartyName: "State Attorney",
      toPartyName: "Davis Defense",
    },
    {
      id: "4",
      caseName: "Johnson v. ABC Corp",
      type: "rfa",
      title: "Request for Admissions",
      isOutgoing: false,
      status: "response_due",
      dueDate: "2024-12-15",
      servedDate: "2024-11-25",
      items: 30,
      respondedItems: 20,
      fromPartyName: "ABC Legal",
      toPartyName: "Johnson Counsel",
    },
  ];

  const discoveryItems = {
    "1": [
      { id: "1", itemNumber: 1, text: "State your full name and any aliases.", status: "answered" },
      { id: "2", itemNumber: 2, text: "Describe the events leading up to the incident.", status: "answered" },
      { id: "3", itemNumber: 3, text: "Identify all witnesses to the incident.", status: "pending" },
    ],
    "2": [
      { id: "1", itemNumber: 1, text: "All medical records related to the incident.", status: "pending" },
      { id: "2", itemNumber: 2, text: "All correspondence between parties.", status: "pending" },
    ],
    "3": [
      { id: "1", itemNumber: 1, text: "All financial records for the period 2020-2024.", status: "pending" },
    ],
    "4": [
      { id: "1", itemNumber: 1, text: "Admit that the contract was signed on January 15, 2024.", status: "answered" },
    ],
  };

  const aiInsights = [
    "3 discovery responses are due this week",
    "RFP Set 2 has 5 items pending review",
    "Consider requesting maintenance logs for Johnson case",
  ];

  const filteredRequests = requests.filter((req) => {
    if (activeTab !== "all" && req.type !== activeTab) return false;
    if (searchQuery && !req.title.toLowerCase().includes(searchQuery.toLowerCase()) && 
        !req.caseName.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const stats = {
    total: requests.length,
    pending: requests.filter((r) => r.status === "response_due").length,
    overdue: requests.filter((r) => r.status === "overdue").length,
    completed: requests.filter((r) => r.status === "completed").length,
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4" />;
      case "overdue":
        return <AlertCircle className="h-4 w-4" />;
      case "response_due":
        return <Clock className="h-4 w-4" />;
      default:
        return <FileSearch className="h-4 w-4" />;
    }
  };

  const handleViewDetails = (request: any) => {
    setSelectedRequest(request);
    setDetailModalOpen(true);
  };

  const handleSendFollowUp = (request: any) => {
    setSelectedRequest(request);
    setEmailModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Discovery Log</h1>
          <p className="mt-1 text-muted-foreground">Track and manage discovery requests and responses</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          New Request
        </Button>
      </div>

      {/* AI Insights Banner */}
      {!dismissedInsights && (
        <Card className="border-purple-500/20 bg-gradient-to-r from-purple-500/10 to-transparent">
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4 flex-1">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/20">
                  <Sparkles className="h-5 w-5 text-purple-400" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground mb-2">AI Insights</h3>
                  <ul className="space-y-1">
                    {aiInsights.map((insight, idx) => (
                      <li key={idx} className="text-sm text-foreground flex items-center gap-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-purple-400" />
                        {insight}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setDismissedInsights(true)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters & Stats Row */}
      <div className="space-y-4">
        {/* Type Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="interrogatory">Interrogatories</TabsTrigger>
            <TabsTrigger value="rfp">RFPs</TabsTrigger>
            <TabsTrigger value="rfa">RFAs</TabsTrigger>
            <TabsTrigger value="subpoena">Subpoenas</TabsTrigger>
            <TabsTrigger value="deposition_notice">Depositions</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Quick Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Requests</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-foreground">{stats.total}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pending Responses</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-amber-500">{stats.pending}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Overdue Items</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-red-500">{stats.overdue}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Completed</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-green-500">{stats.completed}</p>
            </CardContent>
          </Card>
        </div>

        {/* Search Bar */}
        <Card>
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search discovery requests..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Discovery Requests List */}
      <div className="space-y-4">
        {filteredRequests.map((request) => {
          const daysRemaining = calculateDaysRemaining(request.dueDate || null);
          const isOverdue = daysRemaining !== null && daysRemaining < 0;
          const progress = request.items > 0 ? (request.respondedItems / request.items) * 100 : 0;

          return (
            <Card
              key={request.id}
              className={cn(
                "hover:border-amber-500/20 transition-colors",
                isOverdue && "border-red-500/30"
              )}
            >
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="text-muted-foreground">
                        {(() => {
                          const Icon = getDiscoveryTypeIcon(request.type);
                          return <Icon className="h-5 w-5" />;
                        })()}
                      </div>
                      <h3 className="text-lg font-semibold text-foreground hover:text-amber-500 transition-colors cursor-pointer">
                        {request.title}
                      </h3>
                      <Badge
                        variant={getStatusVariant(request.status)}
                        className={cn(
                          isOverdue && "animate-pulse"
                        )}
                      >
                        <span className="flex items-center gap-1">
                          {getStatusIcon(request.status)}
                          {request.status.replace("_", " ")}
                        </span>
                      </Badge>
                      <Badge variant="outline">{getDiscoveryTypeLabel(request.type)}</Badge>
                      <Badge variant="secondary">
                        {request.isOutgoing ? "Outgoing" : "Incoming"}
                      </Badge>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2 mb-3">
                      <div className="space-y-1 text-sm">
                        <p className="text-muted-foreground">
                          <span className="font-medium text-foreground">Case:</span> {request.caseName}
                        </p>
                        <p className="text-muted-foreground">
                          <span className="font-medium text-foreground">From:</span> {request.fromPartyName} →{" "}
                          <span className="font-medium text-foreground">To:</span> {request.toPartyName}
                        </p>
                        {request.dueDate && (
                          <p className={cn(
                            "text-sm",
                            isOverdue ? "text-red-500 font-medium" : "text-muted-foreground"
                          )}>
                            <span className="font-medium text-foreground">Due:</span>{" "}
                            {new Date(request.dueDate).toLocaleDateString()} •{" "}
                            {formatDaysRemaining(request.dueDate || null)}
                          </p>
                        )}
                        {request.servedDate && (
                          <p className="text-sm text-muted-foreground">
                            <span className="font-medium text-foreground">Served:</span>{" "}
                            {new Date(request.servedDate).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Progress</span>
                          <span className="text-foreground">
                            {request.respondedItems} / {request.items} items
                          </span>
                        </div>
                        <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-amber-500 transition-all"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 ml-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleViewDetails(request)}
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      View
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </Button>
                    {!request.isOutgoing && request.status !== "completed" && (
                      <>
                        <Button variant="outline" size="sm">
                          <Sparkles className="mr-2 h-4 w-4" />
                          AI Draft
                        </Button>
                        {isOverdue && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSendFollowUp(request)}
                            className="text-red-400 border-red-500/20 hover:bg-red-500/10"
                          >
                            <Send className="mr-2 h-4 w-4" />
                            Follow-up
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Modals */}
      {selectedRequest && (
        <>
          <DiscoveryDetailModal
            open={detailModalOpen}
            onOpenChange={setDetailModalOpen}
            request={selectedRequest}
            items={discoveryItems[selectedRequest.id as keyof typeof discoveryItems] || []}
          />
          <FollowUpEmailModal
            open={emailModalOpen}
            onOpenChange={setEmailModalOpen}
            request={selectedRequest}
            party={{ name: selectedRequest.toPartyName, email: "counsel@example.com" }}
          />
        </>
      )}
    </div>
  );
}
