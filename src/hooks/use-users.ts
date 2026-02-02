"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { users } from "@/db/schema";
import { InferInsertModel, InferSelectModel } from "drizzle-orm";

export type UserInsert = InferInsertModel<typeof users>;
export type UserSelect = InferSelectModel<typeof users>;

export function useUsers(firmId?: string) {
  const supabase = createClient();

  return useQuery({
    queryKey: ["users", firmId],
    queryFn: async () => {
      let query = supabase.from("users").select("*");
      if (firmId) {
        query = query.eq("firm_id", firmId);
      }
      const { data, error } = await query.order("created_at", { ascending: false });
      if (error) throw error;
      return data as UserSelect[];
    },
    enabled: !!firmId,
  });
}

export function useUser(id: string) {
  const supabase = createClient();

  return useQuery({
    queryKey: ["user", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data as UserSelect;
    },
    enabled: !!id,
  });
}

export function useCreateUser() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userData: Partial<UserInsert>) => {
      const { data, error } = await supabase
        .from("users")
        .insert(userData)
        .select()
        .single();
      if (error) throw error;
      return data as UserSelect;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
}

export function useUpdateUser() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Partial<UserInsert>) => {
      const { data, error } = await supabase
        .from("users")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data as UserSelect;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["user", variables.id] });
    },
  });
}

export function useDeleteUser() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("users")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
}










