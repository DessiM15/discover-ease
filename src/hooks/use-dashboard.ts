"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";

export function useDashboardStats(firmId: string) {
  const supabase = createClient();

  return useQuery({
    queryKey: ["dashboard-stats", firmId],
    queryFn: async () => {
      // Run all count queries in parallel for better performance
      // First, get case IDs for this firm to filter discovery requests
      const { data: firmCases } = await supabase
        .from("cases")
        .select("id")
        .eq("firm_id", firmId);
      
      const caseIds = firmCases?.map((c) => c.id) || [];

      const [activeCasesResult, documentsResult, pendingTasksResult, overdueResult] = await Promise.all([
        supabase
          .from("cases")
          .select("*", { count: "exact", head: true })
          .eq("firm_id", firmId)
          .eq("status", "active"),
        supabase
          .from("documents")
          .select("*", { count: "exact", head: true })
          .eq("firm_id", firmId),
        supabase
          .from("tasks")
          .select("*", { count: "exact", head: true })
          .eq("firm_id", firmId)
          .eq("status", "pending"),
        caseIds.length > 0
          ? supabase
              .from("discovery_requests")
              .select("*", { count: "exact", head: true })
              .in("case_id", caseIds)
              .eq("status", "overdue")
          : { count: 0, error: null },
      ]);

      return {
        activeCases: activeCasesResult.count || 0,
        documents: documentsResult.count || 0,
        pendingTasks: pendingTasksResult.count || 0,
        overdue: overdueResult.count || 0,
      };
    },
    staleTime: 2 * 60 * 1000, // Cache for 2 minutes
    enabled: !!firmId,
  });
}

export function useRecentCases(firmId: string) {
  const supabase = createClient();

  return useQuery({
    queryKey: ["recent-cases", firmId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cases")
        .select("*")
        .eq("firm_id", firmId)
        .order("updated_at", { ascending: false })
        .limit(5);
      if (error) throw error;
      return data;
    },
    staleTime: 2 * 60 * 1000, // Cache for 2 minutes
    enabled: !!firmId,
  });
}

export function useUpcomingDeadlines(firmId: string) {
  const supabase = createClient();

  return useQuery({
    queryKey: ["upcoming-deadlines", firmId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events")
        .select("*, cases(name)")
        .eq("firm_id", firmId)
        .gte("start_date", new Date().toISOString())
        .order("start_date", { ascending: true })
        .limit(10);
      if (error) throw error;
      return data;
    },
    staleTime: 2 * 60 * 1000, // Cache for 2 minutes
    enabled: !!firmId,
  });
}

export function useRecentActivity(firmId: string) {
  const supabase = createClient();

  return useQuery({
    queryKey: ["recent-activity", firmId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("activity_log")
        .select("*, users(first_name, last_name)")
        .eq("firm_id", firmId)
        .order("timestamp", { ascending: false })
        .limit(10);
      if (error) throw error;
      return data;
    },
    staleTime: 2 * 60 * 1000, // Cache for 2 minutes
    enabled: !!firmId,
  });
}

