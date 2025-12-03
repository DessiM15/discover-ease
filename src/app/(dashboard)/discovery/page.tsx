import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Search, FileSearch, AlertCircle, CheckCircle, Clock } from "lucide-react";
import Link from "next/link";

export default function DiscoveryPage() {
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
      items: 25,
      respondedItems: 15,
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
    },
    {
      id: "3",
      caseName: "State v. Davis",
      type: "subpoena",
      title: "Subpoena Duces Tecum",
      isOutgoing: false,
      status: "overdue",
      dueDate: "2024-12-01",
      items: 8,
      respondedItems: 0,
    },
  ];

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      interrogatory: "Interrogatory",
      rfp: "Request for Production",
      rfa: "Request for Admission",
      subpoena: "Subpoena",
      deposition_notice: "Deposition Notice",
    };
    return labels[type] || type;
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Discovery Log</h1>
          <p className="mt-1 text-slate-400">Track and manage discovery requests and responses</p>
        </div>
        <Button asChild>
          <Link href="/discovery/new">
            <Plus className="mr-2 h-4 w-4" />
            New Request
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-400">Total Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-white">{requests.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-400">Response Due</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-amber-500">
              {requests.filter((r) => r.status === "response_due").length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-400">Overdue</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-500">
              {requests.filter((r) => r.status === "overdue").length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-400">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-500">
              {requests.filter((r) => r.status === "completed").length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 md:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Search discovery requests..."
                className="pl-10 bg-slate-900/50 border-slate-800"
              />
            </div>
            <Select defaultValue="all">
              <SelectTrigger className="w-full md:w-[180px] bg-slate-900/50 border-slate-800">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="response_due">Response Due</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
            <Select defaultValue="all">
              <SelectTrigger className="w-full md:w-[180px] bg-slate-900/50 border-slate-800">
                <SelectValue placeholder="Direction" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="incoming">Incoming</SelectItem>
                <SelectItem value="outgoing">Outgoing</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Requests List */}
      <div className="space-y-4">
        {requests.map((request) => (
          <Card
            key={request.id}
            className="hover:border-amber-500/20 transition-colors cursor-pointer"
          >
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <Link
                      href={`/discovery/${request.id}`}
                      className="text-lg font-semibold text-white hover:text-amber-500 transition-colors"
                    >
                      {request.title}
                    </Link>
                    <Badge variant={getStatusVariant(request.status)}>
                      <span className="flex items-center gap-1">
                        {getStatusIcon(request.status)}
                        {request.status.replace("_", " ")}
                      </span>
                    </Badge>
                    <Badge variant="outline">{getTypeLabel(request.type)}</Badge>
                    <Badge variant="secondary">
                      {request.isOutgoing ? "Outgoing" : "Incoming"}
                    </Badge>
                  </div>
                  <div className="mt-2 space-y-1 text-sm text-slate-400">
                    <p>Case: {request.caseName}</p>
                    <p>
                      Items: {request.respondedItems} / {request.items} responded
                    </p>
                    {request.dueDate && (
                      <p>
                        Due:{" "}
                        <span
                          className={
                            request.status === "overdue" ? "text-red-500 font-medium" : ""
                          }
                        >
                          {new Date(request.dueDate).toLocaleDateString()}
                        </span>
                      </p>
                    )}
                    {request.servedDate && (
                      <p>Served: {new Date(request.servedDate).toLocaleDateString()}</p>
                    )}
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/discovery/${request.id}`}>View Details</Link>
                  </Button>
                  {!request.isOutgoing && request.status !== "completed" && (
                    <Button variant="outline" size="sm">
                      Draft Response
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

