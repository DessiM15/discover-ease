"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { tasks } from "@/db/schema";
import { InferInsertModel, InferSelectModel } from "drizzle-orm";

export type TaskInsert = InferInsertModel<typeof tasks>;
export type TaskSelect = InferSelectModel<typeof tasks>;

export function useTasks(firmId?: string, filters?: {
  status?: string;
  assignedToId?: string;
  caseId?: string;
  dueDate?: Date;
}) {
  const supabase = createClient();

  return useQuery({
    queryKey: ["tasks", firmId, filters],
    queryFn: async () => {
      let query = supabase
        .from("tasks")
        .select(`
          *,
          cases:case_id (
            id,
            name,
            case_number
          ),
          assigned_to:assigned_to_id (
            id,
            first_name,
            last_name
          ),
          created_by:created_by_id (
            id,
            first_name,
            last_name
          )
        `);

      if (firmId) {
        query = query.eq("firm_id", firmId);
      }
      if (filters?.status) {
        query = query.eq("status", filters.status);
      }
      if (filters?.assignedToId) {
        query = query.eq("assigned_to_id", filters.assignedToId);
      }
      if (filters?.caseId) {
        query = query.eq("case_id", filters.caseId);
      }
      if (filters?.dueDate) {
        query = query.lte("due_date", filters.dueDate.toISOString());
      }

      const { data, error } = await query.order("due_date", { ascending: true });
      if (error) throw error;
      return data as any[];
    },
    enabled: !!firmId,
  });
}

export function useTask(id: string) {
  const supabase = createClient();

  return useQuery({
    queryKey: ["task", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tasks")
        .select(`
          *,
          cases:case_id (
            id,
            name,
            case_number
          ),
          assigned_to:assigned_to_id (
            id,
            first_name,
            last_name
          ),
          created_by:created_by_id (
            id,
            first_name,
            last_name
          )
        `)
        .eq("id", id)
        .single();
      if (error) throw error;
      return data as any;
    },
    enabled: !!id,
  });
}

export function useCreateTask() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (taskData: Partial<TaskInsert>) => {
      const { data, error } = await supabase
        .from("tasks")
        .insert(taskData)
        .select()
        .single();
      if (error) throw error;
      return data as TaskSelect;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}

export function useUpdateTask() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Partial<TaskInsert>) => {
      const { data, error } = await supabase
        .from("tasks")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data as TaskSelect;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["task", variables.id] });
    },
  });
}

export function useDeleteTask() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("tasks")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}

