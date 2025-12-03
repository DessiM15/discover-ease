"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";

export function useDashboardStats(firmId: string) {
  const supabase = createClient();

  return useQuery({
    queryKey: ["dashboard-stats", firmId],
    queryFn: async () => {
      // Get active cases count
      const { count: activeCases } = await supabase
        .from("cases")
        .select("*", { count: "exact", head: true })
        .eq("firm_id", firmId)
        .eq("status", "active");

      // Get documents count
      const { count: documents } = await supabase
        .from("documents")
        .select("*", { count: "exact", head: true })
        .eq("firm_id", firmId);

      // Get pending tasks count
      const { count: pendingTasks } = await supabase
        .from("tasks")
        .select("*", { count: "exact", head: true })
        .eq("firm_id", firmId)
        .eq("status", "pending");

      // Get overdue discovery requests
      const { count: overdue } = await supabase
        .from("discovery_requests")
        .select("*", { count: "exact", head: true })
        .eq("status", "overdue");

      return {
        activeCases: activeCases || 0,
        documents: documents || 0,
        pendingTasks: pendingTasks || 0,
        overdue: overdue || 0,
      };
    },
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
  });
}

