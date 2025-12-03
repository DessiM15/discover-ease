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
} from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  // Demo data - will be replaced with real data hooks
  const stats = [
    { label: "Active Cases", value: "24", icon: Briefcase, change: "+12%", trend: "up" },
    { label: "Documents", value: "1,247", icon: FileText, change: "+8%", trend: "up" },
    { label: "Pending Tasks", value: "18", icon: Clock, change: "-5%", trend: "down" },
    { label: "Overdue", value: "3", icon: AlertCircle, change: "-2", trend: "down" },
  ];

  const recentCases = [
    { id: "1", name: "Smith v. Johnson", type: "Personal Injury", status: "active", date: "2024-12-01" },
    { id: "2", name: "Estate of Williams", type: "Estate Planning", status: "active", date: "2024-11-28" },
    { id: "3", name: "State v. Davis", type: "Criminal Defense", status: "pending", date: "2024-11-25" },
  ];

  const upcomingDeadlines = [
    { id: "1", title: "Discovery Response Due", case: "Smith v. Johnson", date: "2024-12-10", type: "deadline" },
    { id: "2", title: "Motion Hearing", case: "Estate of Williams", date: "2024-12-15", type: "court_date" },
    { id: "3", title: "Deposition", case: "State v. Davis", date: "2024-12-20", type: "deposition" },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="glass rounded-xl border border-slate-800 bg-gradient-to-r from-amber-500/10 to-slate-900/80 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Welcome back!</h1>
            <p className="mt-1 text-slate-400">Here's what's happening with your practice today.</p>
          </div>
          <Button>View All Cases</Button>
        </div>
      </div>

      {/* AI Insights Banner */}
      <Card className="border-amber-500/20 bg-gradient-to-r from-amber-500/5 to-slate-900/80">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/20">
              <Sparkles className="h-5 w-5 text-amber-500" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-white">AI Insights Available</h3>
              <p className="mt-1 text-sm text-slate-400">
                Review 3 new AI-generated case summaries and discovery response suggestions.
              </p>
              <Button variant="outline" size="sm" className="mt-3">
                View Insights
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">{stat.label}</CardTitle>
              <stat.icon className="h-4 w-4 text-slate-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stat.value}</div>
              <p className="text-xs text-slate-400 mt-1">
                <span className={stat.trend === "up" ? "text-green-500" : "text-red-500"}>
                  {stat.change}
                </span>{" "}
                from last month
              </p>
            </CardContent>
          </Card>
        ))}
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
              {recentCases.map((caseItem) => (
                <div
                  key={caseItem.id}
                  className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900/50 p-4 hover:bg-slate-900 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-white">{caseItem.name}</h4>
                      <Badge variant="secondary" className="text-xs">
                        {caseItem.type}
                      </Badge>
                    </div>
                    <p className="mt-1 text-xs text-slate-400">
                      Updated {new Date(caseItem.date).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge
                    variant={caseItem.status === "active" ? "default" : "outline"}
                    className="ml-4"
                  >
                    {caseItem.status}
                  </Badge>
                </div>
              ))}
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
              {upcomingDeadlines.map((deadline) => (
                <div
                  key={deadline.id}
                  className="flex items-start gap-4 rounded-lg border border-slate-800 bg-slate-900/50 p-4"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
                    <Calendar className="h-5 w-5 text-amber-500" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-white">{deadline.title}</h4>
                    <p className="mt-1 text-sm text-slate-400">{deadline.case}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {new Date(deadline.date).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {deadline.type.replace("_", " ")}
                  </Badge>
                </div>
              ))}
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
            {[
              { action: "Document uploaded", case: "Smith v. Johnson", user: "John Doe", time: "2 hours ago" },
              { action: "Time entry added", case: "Estate of Williams", user: "Jane Smith", time: "4 hours ago" },
              { action: "Discovery response drafted", case: "State v. Davis", user: "AI Assistant", time: "1 day ago" },
            ].map((activity, idx) => (
              <div key={idx} className="flex items-center gap-4 border-b border-slate-800 pb-4 last:border-0 last:pb-0">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-800">
                  <Activity className="h-4 w-4 text-slate-400" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-white">
                    <span className="font-medium">{activity.action}</span> in{" "}
                    <span className="text-amber-500">{activity.case}</span>
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    by {activity.user} • {activity.time}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

