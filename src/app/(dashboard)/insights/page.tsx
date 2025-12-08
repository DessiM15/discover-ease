"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, FileText, TrendingUp, AlertCircle, CheckCircle2, Clock, Link as LinkIcon } from "lucide-react";
import Link from "next/link";

export default function InsightsPage() {
  const insights = [
    {
      id: "1",
      type: "case_summary",
      title: "Smith v. Johnson - Case Summary",
      description: "AI-generated summary of case progress, key deadlines, and recent activities",
      caseName: "Smith v. Johnson",
      caseId: "1",
      generatedAt: "2 hours ago",
      status: "new",
      priority: "high",
    },
    {
      id: "2",
      type: "discovery_response",
      title: "Discovery Response Suggestion",
      description: "Suggested response for Interrogatory #15 based on case documents and precedents",
      caseName: "State v. Davis",
      caseId: "2",
      generatedAt: "5 hours ago",
      status: "reviewed",
      priority: "medium",
    },
    {
      id: "3",
      type: "deadline_alert",
      title: "Upcoming Deadline Analysis",
      description: "Analysis of 3 approaching deadlines with recommended action items",
      caseName: "Multiple Cases",
      caseId: null,
      generatedAt: "1 day ago",
      status: "new",
      priority: "urgent",
    },
  ];

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "case_summary":
        return FileText;
      case "discovery_response":
        return Sparkles;
      case "deadline_alert":
        return AlertCircle;
      default:
        return Sparkles;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "case_summary":
        return "Case Summary";
      case "discovery_response":
        return "Discovery Response";
      case "deadline_alert":
        return "Deadline Alert";
      default:
        return "Insight";
    }
  };

  const getPriorityVariant = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "destructive";
      case "high":
        return "default";
      case "medium":
        return "secondary";
      default:
        return "outline";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">AI Insights</h1>
          <p className="mt-1 text-muted-foreground">AI-generated summaries, suggestions, and analysis for your practice</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">New Insights</CardTitle>
            <Sparkles className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {insights.filter((i) => i.status === "new").length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Require review</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">This Week</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{insights.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Total insights generated</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Reviewed</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {insights.filter((i) => i.status === "reviewed").length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Already reviewed</p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        {insights.map((insight) => {
          const Icon = getTypeIcon(insight.type);
          return (
            <Card key={insight.id} className="hover:border-amber-500/20 transition-colors">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="rounded-lg bg-amber-500/10 p-2">
                      <Icon className="h-5 w-5 text-amber-500" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <CardTitle className="text-lg">{insight.title}</CardTitle>
                        <Badge variant={getPriorityVariant(insight.priority)}>{insight.priority}</Badge>
                        <Badge variant={insight.status === "new" ? "default" : "secondary"}>
                          {insight.status === "new" ? "New" : "Reviewed"}
                        </Badge>
                      </div>
                      <CardDescription>{insight.description}</CardDescription>
                      <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                        {insight.caseName && (
                          <div className="flex items-center gap-1">
                            <FileText className="h-3 w-3" />
                            <span>{insight.caseName}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>{insight.generatedAt}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {insight.caseId && (
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/cases/${insight.caseId}`}>
                          <LinkIcon className="mr-2 h-4 w-4" />
                          View Case
                        </Link>
                      </Button>
                    )}
                    <Button variant="default" size="sm">
                      View Details
                    </Button>
                  </div>
                </div>
              </CardHeader>
            </Card>
          );
        })}
      </div>

      {insights.length === 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <Sparkles className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No insights available yet</p>
              <p className="text-sm text-muted-foreground mt-2">
                AI insights will appear here as they are generated
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

