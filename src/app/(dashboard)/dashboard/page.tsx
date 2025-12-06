"use client";

import { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Briefcase,
  FileText,
  Clock,
  AlertCircle,
  TrendingUp,
  Calendar,
  Activity,
  Sparkles,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { useDashboardStats, useRecentCases, useUpcomingDeadlines, useRecentActivity } from "@/hooks/use-dashboard";
import { useAuth } from "@/components/providers/auth-provider";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { formatDistanceToNow } from "date-fns/formatDistanceToNow";

export default function DashboardPage() {
  const { user } = useAuth();
  const supabase = createClient();

  // Get user's firm ID and name
  const { data: userData, isLoading: userDataLoading } = useQuery({
    queryKey: ["user", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("users")
        .select("firm_id, first_name, last_name")
        .eq("id", user.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const firmId = userData?.firm_id;
  const { data: dashboardStats, isLoading: statsLoading } = useDashboardStats(firmId || "");
  const { data: recentCases, isLoading: casesLoading } = useRecentCases(firmId || "");
  const { data: deadlines, isLoading: deadlinesLoading } = useUpcomingDeadlines(firmId || "");
  const { data: recentActivity, isLoading: activityLoading } = useRecentActivity(firmId || "");

  // Mock data fallback when no real data exists (for demo purposes)
  // Use useMemo to ensure stable dates that don't cause hydration mismatches
  // Fixed date ensures consistent server/client rendering
  const mockCases = useMemo(() => {
    // Use a fixed recent date for stable hydration (Jan 1, 2025)
    const baseTime = new Date("2025-01-01T12:00:00Z").getTime();
    return [
      {
        id: "mock-1",
        name: "Johnson v. ABC Manufacturing Corp.",
        type: "personal_injury",
        status: "active",
        updated_at: new Date(baseTime - 2 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: "mock-2",
        name: "Estate of Williams",
        type: "estate_planning",
        status: "active",
        updated_at: new Date(baseTime - 5 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: "mock-3",
        name: "State v. Davis",
        type: "criminal_defense",
        status: "pending",
        updated_at: new Date(baseTime - 24 * 60 * 60 * 1000).toISOString(),
      },
    ];
  }, []);

  const mockDeadlines = useMemo(() => {
    // Use a fixed recent date for stable hydration (Jan 1, 2025)
    const baseTime = new Date("2025-01-01T12:00:00Z").getTime();
    return [
      {
        id: "mock-1",
        title: "Discovery Response Due",
        type: "deadline",
        start_date: new Date(baseTime + 3 * 24 * 60 * 60 * 1000).toISOString(),
        cases: { name: "Johnson v. ABC Manufacturing Corp." },
      },
      {
        id: "mock-2",
        title: "Status Conference",
        type: "court_date",
        start_date: new Date(baseTime + 7 * 24 * 60 * 60 * 1000).toISOString(),
        cases: { name: "Martinez v. Martinez" },
      },
      {
        id: "mock-3",
        title: "Client Meeting",
        type: "meeting",
        start_date: new Date(baseTime + 10 * 24 * 60 * 60 * 1000).toISOString(),
        cases: { name: "Estate of Williams" },
      },
    ];
  }, []);

  const mockActivity = useMemo(() => {
    // Use a fixed recent date for stable hydration (Jan 1, 2025)
    const baseTime = new Date("2025-01-01T12:00:00Z").getTime();
    return [
      {
        id: "mock-1",
        action: "Document uploaded",
        entity_type: "document",
        details: { case_name: "Johnson v. ABC Manufacturing Corp." },
        users: { first_name: "John", last_name: "Doe" },
        timestamp: new Date(baseTime - 2 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: "mock-2",
        action: "Time entry added",
        entity_type: "time_entry",
        details: { case_name: "Estate of Williams" },
        users: { first_name: "Jane", last_name: "Smith" },
        timestamp: new Date(baseTime - 4 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: "mock-3",
        action: "Discovery response drafted",
        entity_type: "discovery_request",
        details: { case_name: "State v. Davis" },
        users: { first_name: "AI", last_name: "Assistant" },
        timestamp: new Date(baseTime - 24 * 60 * 60 * 1000).toISOString(),
      },
    ];
  }, []);

  // Use real data if available, otherwise fall back to mock data
  const displayCases = recentCases && recentCases.length > 0 ? recentCases : mockCases;
  const displayDeadlines = deadlines && deadlines.length > 0 ? deadlines : mockDeadlines;
  const displayActivity = recentActivity && recentActivity.length > 0 ? recentActivity : mockActivity;

  // Memoize stats to prevent recalculation on every render
  const stats = useMemo(() => [
    {
      label: "Active Cases",
      value: dashboardStats?.activeCases?.toString() || "0",
      icon: Briefcase,
      change: "+12%",
      trend: "up" as const,
    },
    {
      label: "Documents",
      value: dashboardStats?.documents?.toLocaleString() || "0",
      icon: FileText,
      change: "+8%",
      trend: "up" as const,
    },
    {
      label: "Pending Tasks",
      value: dashboardStats?.pendingTasks?.toString() || "0",
      icon: Clock,
      change: "-5%",
      trend: "down" as const,
    },
    {
      label: "Overdue",
      value: dashboardStats?.overdue?.toString() || "0",
      icon: AlertCircle,
      change: "-2",
      trend: "down" as const,
    },
  ], [dashboardStats]);

  // Show skeleton/loading state progressively instead of blocking
  // Only show loading if userData is loading, or if we have a firmId and dashboard queries are loading
  const isLoading = userDataLoading || (firmId && (statsLoading || casesLoading || deadlinesLoading));

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Welcome Banner */}
      <div className="rounded-xl border border-border bg-gradient-to-r from-primary/10 to-card p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Welcome back{userData?.first_name ? `, ${userData.first_name}` : ""}!
            </h1>
            <p className="mt-1 text-muted-foreground">Here's what's happening with your practice today.</p>
          </div>
          <Button asChild>
            <Link href="/cases">View All Cases</Link>
          </Button>
        </div>
      </div>

      {/* AI Insights Banner */}
      <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-card">
        <CardContent>
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/20">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-foreground">AI Insights Available</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Review 3 new AI-generated case summaries and discovery response suggestions.
              </p>
              <Button variant="outline" size="sm" className="mt-3" asChild>
                <Link href="/insights">View Insights</Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards - Show skeleton while loading */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {isLoading ? (
          // Skeleton loading state
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                <div className="h-4 w-4 bg-muted animate-pulse rounded" />
              </CardHeader>
              <CardContent>
                <div className="h-8 w-16 bg-muted animate-pulse rounded mb-2" />
                <div className="h-3 w-32 bg-muted animate-pulse rounded" />
              </CardContent>
            </Card>
          ))
        ) : (
          stats.map((stat) => (
            <Card key={stat.label}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{stat.label}</CardTitle>
                <stat.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{stat.value}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  <span className={stat.trend === "up" ? "text-emerald-500" : "text-destructive"}>
                    {stat.change}
                  </span>{" "}
                  from last month
                </p>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Recent Cases */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Recent Cases</CardTitle>
                <CardDescription>Your most recently updated cases</CardDescription>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/cases">View All</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {casesLoading ? (
                // Loading skeleton
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="rounded-lg border border-border bg-muted/50 p-4">
                    <div className="h-4 w-32 bg-muted animate-pulse rounded mb-2" />
                    <div className="h-3 w-24 bg-muted animate-pulse rounded" />
                  </div>
                ))
              ) : displayCases && displayCases.length > 0 ? (
                displayCases.map((caseItem: any) => (
                  <div
                    key={caseItem.id}
                    className="flex items-center justify-between rounded-lg border border-border bg-muted/50 p-4 hover:bg-muted transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/cases/${caseItem.id}`}
                          className="font-medium text-foreground hover:text-primary"
                        >
                          {caseItem.name}
                        </Link>
                        <Badge variant="secondary" className="text-xs">
                          {caseItem.type?.replace("_", " ") || "Other"}
                        </Badge>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground" suppressHydrationWarning>
                        Updated {formatDistanceToNow(new Date(caseItem.updated_at), { addSuffix: true })}
                      </p>
                    </div>
                    <Badge
                      variant={caseItem.status === "active" ? "default" : "outline"}
                      className="ml-4"
                    >
                      {caseItem.status}
                    </Badge>
                  </div>
                ))
              ) : (
                <p className="text-center text-muted-foreground py-8">No cases found</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Deadlines */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Upcoming Deadlines</CardTitle>
                <CardDescription>Important dates and deadlines</CardDescription>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/calendar">View Calendar</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {deadlinesLoading ? (
                // Loading skeleton
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="rounded-lg border border-border bg-muted/50 p-3">
                    <div className="h-4 w-40 bg-muted animate-pulse rounded mb-2" />
                    <div className="h-3 w-28 bg-muted animate-pulse rounded" />
                  </div>
                ))
              ) : displayDeadlines && displayDeadlines.length > 0 ? (
                displayDeadlines.map((deadline: any) => (
                  <div
                    key={deadline.id}
                    className="flex items-start gap-4 rounded-lg border border-border bg-muted/50 p-4"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <Calendar className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-foreground">{deadline.title}</h4>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {deadline.cases?.name || "No case"}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {new Date(deadline.start_date).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {deadline.type?.replace("_", " ") || "Other"}
                    </Badge>
                  </div>
                ))
              ) : (
                <p className="text-center text-muted-foreground py-8">No upcoming deadlines</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Activity Feed */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest updates across your practice</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {activityLoading ? (
              // Loading skeleton
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 border-b border-border pb-4 last:border-0 last:pb-0">
                  <div className="h-8 w-8 bg-muted animate-pulse rounded-full" />
                  <div className="flex-1">
                    <div className="h-4 w-48 bg-muted animate-pulse rounded mb-2" />
                    <div className="h-3 w-32 bg-muted animate-pulse rounded" />
                  </div>
                </div>
              ))
            ) : displayActivity && displayActivity.length > 0 ? (
              displayActivity.map((activity: any) => {
                const userName = activity.users
                  ? `${activity.users.first_name || ""} ${activity.users.last_name || ""}`.trim() || "Unknown User"
                  : "System";
                const actionText = `${activity.action} ${activity.entity_type || ""}`;
                return (
                  <div
                    key={activity.id}
                    className="flex items-center gap-4 border-b border-border pb-4 last:border-0 last:pb-0"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                      <Activity className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-foreground">
                        <span className="font-medium">{actionText}</span>
                        {activity.details?.case_name && (
                          <>
                            {" "}in{" "}
                            <span className="text-primary">{activity.details.case_name}</span>
                          </>
                        )}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground" suppressHydrationWarning>
                        by {userName} • {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-center text-muted-foreground py-8">No recent activity</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
