"use client";

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
import { Plus, Search, Filter, Loader2 } from "lucide-react";
import Link from "next/link";
import { useCases } from "@/hooks/use-cases";
import { useAuth } from "@/components/providers/auth-provider";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { useState } from "react";

export default function CasesPage() {
  const { user } = useAuth();
  const supabase = createClient();
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Get user's firm ID
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

  const firmId = userData?.firm_id;
  const { data: cases, isLoading } = useCases(firmId);

  const filteredCases = cases?.filter((caseItem: any) => {
    if (statusFilter !== "all" && caseItem.status !== statusFilter) return false;
    if (typeFilter !== "all" && caseItem.type !== typeFilter) return false;
    if (
      searchQuery &&
      !caseItem.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !(caseItem.case_number || caseItem.caseNumber)?.toLowerCase().includes(searchQuery.toLowerCase())
    )
      return false;
    return true;
  });

  const getCaseTypeLabel = (type: string) => {
    return type.split("_").map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
      </div>
    );
  }

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
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
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
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full md:w-[180px] bg-slate-900/50 border-slate-800">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="personal_injury">Personal Injury</SelectItem>
                <SelectItem value="criminal_defense">Criminal Defense</SelectItem>
                <SelectItem value="family_law">Family Law</SelectItem>
                <SelectItem value="divorce">Divorce</SelectItem>
                <SelectItem value="estate_planning">Estate Planning</SelectItem>
                <SelectItem value="contract_dispute">Contract Dispute</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Cases List */}
      <div className="space-y-4">
        {filteredCases && filteredCases.length > 0 ? (
          filteredCases.map((caseItem) => (
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
                      <p>Case #: {(caseItem as any).case_number || caseItem.caseNumber}</p>
                      {caseItem.court && <p>Court: {caseItem.court}</p>}
                      {((caseItem as any).date_opened || caseItem.dateOpened) && (
                        <p>Opened: {new Date(((caseItem as any).date_opened || caseItem.dateOpened) as string).toLocaleDateString()}</p>
                      )}
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/cases/${caseItem.id}`}>View Details</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-slate-400 py-8">No cases found</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
