"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { cases } from "@/db/schema";
import { InferInsertModel, InferSelectModel } from "drizzle-orm";

export type CaseInsert = InferInsertModel<typeof cases>;
export type CaseSelect = InferSelectModel<typeof cases>;

export function useCases(firmId?: string) {
  const supabase = createClient();

  return useQuery({
    queryKey: ["cases", firmId],
    queryFn: async () => {
      let query = supabase.from("cases").select("*");
      if (firmId) {
        query = query.eq("firm_id", firmId);
      }
      const { data, error } = await query.order("created_at", { ascending: false });
      if (error) throw error;
      return data as CaseSelect[];
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

