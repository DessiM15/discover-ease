"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { events } from "@/db/schema";
import { InferInsertModel, InferSelectModel } from "drizzle-orm";

export type EventInsert = InferInsertModel<typeof events>;
export type EventSelect = InferSelectModel<typeof events>;

export function useEvents(firmId?: string, filters?: {
  startDate?: Date;
  endDate?: Date;
  caseId?: string;
  type?: string;
  limit?: number;
  offset?: number;
}) {
  const supabase = createClient();
  const limit = filters?.limit ?? 100; // Default limit
  const offset = filters?.offset ?? 0;

  return useQuery({
    queryKey: ["events", firmId, filters],
    queryFn: async () => {
      let query = supabase
        .from("events")
        .select(`
          *,
          cases:case_id (
            id,
            name,
            case_number
          ),
          created_by:created_by_id (
            id,
            first_name,
            last_name
          )
        `, { count: 'exact' });

      if (firmId) {
        query = query.eq("firm_id", firmId);
      }
      if (filters?.startDate) {
        query = query.gte("start_date", filters.startDate.toISOString());
      }
      if (filters?.endDate) {
        query = query.lte("start_date", filters.endDate.toISOString());
      }
      if (filters?.caseId) {
        query = query.eq("case_id", filters.caseId);
      }
      if (filters?.type) {
        query = query.eq("type", filters.type);
      }

      const { data, error, count } = await query
        .order("start_date", { ascending: true })
        .range(offset, offset + limit - 1);
      if (error) throw error;
      return { data: data as any[], count: count ?? 0 };
    },
    enabled: !!firmId,
  });
}

export function useEvent(id: string) {
  const supabase = createClient();

  return useQuery({
    queryKey: ["event", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events")
        .select(`
          *,
          cases:case_id (
            id,
            name,
            case_number
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

export function useCreateEvent() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (eventData: Partial<EventInsert>) => {
      const { data, error } = await supabase
        .from("events")
        .insert(eventData)
        .select()
        .single();
      if (error) throw error;
      return data as EventSelect;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
    },
  });
}

export function useUpdateEvent() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Partial<EventInsert>) => {
      const { data, error } = await supabase
        .from("events")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data as EventSelect;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      queryClient.invalidateQueries({ queryKey: ["event", variables.id] });
    },
  });
}

export function useDeleteEvent() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("events")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
    },
  });
}

