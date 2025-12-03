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
import { Plus, Search, Filter } from "lucide-react";
import Link from "next/link";

export default function CasesPage() {
  // Demo data - will be replaced with real data hooks
  const cases = [
    {
      id: "1",
      caseNumber: "2024-001",
      name: "Smith v. Johnson",
      type: "personal_injury",
      status: "active",
      leadAttorney: "John Doe",
      dateOpened: "2024-01-15",
      client: "Smith, Jane",
    },
    {
      id: "2",
      caseNumber: "2024-002",
      name: "Estate of Williams",
      type: "estate_planning",
      status: "active",
      leadAttorney: "Jane Smith",
      dateOpened: "2024-02-01",
      client: "Williams Family",
    },
    {
      id: "3",
      caseNumber: "2024-003",
      name: "State v. Davis",
      type: "criminal_defense",
      status: "pending",
      leadAttorney: "John Doe",
      dateOpened: "2024-02-15",
      client: "Davis, Robert",
    },
  ];

  const getCaseTypeLabel = (type: string) => {
    return type.split("_").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "active":
        return "default";
      case "pending":
        return "outline";
      case "closed":
        return "secondary";
      default:
        return "outline";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Cases</h1>
          <p className="mt-1 text-slate-400">Manage all your legal cases</p>
        </div>
        <Button asChild>
          <Link href="/cases/new">
            <Plus className="mr-2 h-4 w-4" />
            New Case
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 md:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Search cases..."
                className="pl-10 bg-slate-900/50 border-slate-800"
              />
            </div>
            <Select defaultValue="all">
              <SelectTrigger className="w-full md:w-[180px] bg-slate-900/50 border-slate-800">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
            <Select defaultValue="all">
              <SelectTrigger className="w-full md:w-[180px] bg-slate-900/50 border-slate-800">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="personal_injury">Personal Injury</SelectItem>
                <SelectItem value="criminal_defense">Criminal Defense</SelectItem>
                <SelectItem value="family_law">Family Law</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Cases List */}
      <div className="space-y-4">
        {cases.map((caseItem) => (
          <Card key={caseItem.id} className="hover:border-amber-500/20 transition-colors">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <Link
                      href={`/cases/${caseItem.id}`}
                      className="text-lg font-semibold text-white hover:text-amber-500 transition-colors"
                    >
                      {caseItem.name}
                    </Link>
                    <Badge variant={getStatusVariant(caseItem.status)}>
                      {caseItem.status}
                    </Badge>
                    <Badge variant="outline">{getCaseTypeLabel(caseItem.type)}</Badge>
                  </div>
                  <div className="mt-2 space-y-1 text-sm text-slate-400">
                    <p>Case #: {caseItem.caseNumber}</p>
                    <p>Client: {caseItem.client}</p>
                    <p>Lead Attorney: {caseItem.leadAttorney}</p>
                    <p>Opened: {new Date(caseItem.dateOpened).toLocaleDateString()}</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" asChild>
                  <Link href={`/cases/${caseItem.id}`}>View Details</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

