"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { cases } from "@/db/schema";
import { InferInsertModel, InferSelectModel } from "drizzle-orm";

export type CaseInsert = InferInsertModel<typeof cases>;
export type CaseSelect = InferSelectModel<typeof cases>;

export function useCases(firmId?: string, options?: { limit?: number; offset?: number }) {
  const supabase = createClient();
  const limit = options?.limit ?? 100; // Default limit
  const offset = options?.offset ?? 0;

  return useQuery({
    queryKey: ["cases", firmId, options],
    queryFn: async () => {
      let query = supabase.from("cases").select("*", { count: 'exact' });
      if (firmId) {
        query = query.eq("firm_id", firmId);
      }
      const { data, error, count } = await query
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);
      if (error) throw error;
      return { data: data as CaseSelect[], count: count ?? 0 };
    },
  });
}

export function useCase(id: string) {
  const supabase = createClient();

  return useQuery({
    queryKey: ["case", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cases")
        .select("*")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data as CaseSelect;
    },
    enabled: !!id,
  });
}

export function useCreateCase() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (caseData: Partial<CaseInsert>) => {
      const { data, error } = await supabase
        .from("cases")
        .insert(caseData)
        .select()
        .single();
      if (error) throw error;
      return data as CaseSelect;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cases"] });
    },
  });
}

export function useUpdateCase() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Partial<CaseInsert>) => {
      const { data, error } = await supabase
        .from("cases")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data as CaseSelect;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["cases"] });
      queryClient.invalidateQueries({ queryKey: ["case", variables.id] });
    },
  });
}

