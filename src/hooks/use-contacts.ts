"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { contacts } from "@/db/schema";
import { InferInsertModel, InferSelectModel } from "drizzle-orm";

export type ContactInsert = InferInsertModel<typeof contacts>;
export type ContactSelect = InferSelectModel<typeof contacts>;

export function useContacts(firmId?: string) {
  const supabase = createClient();

  return useQuery({
    queryKey: ["contacts", firmId],
    queryFn: async () => {
      let query = supabase.from("contacts").select("*");
      if (firmId) {
        query = query.eq("firm_id", firmId);
      }
      const { data, error } = await query.order("created_at", { ascending: false });
      if (error) throw error;
      return data as ContactSelect[];
    },
  });
}

export function useContact(id: string) {
  const supabase = createClient();

  return useQuery({
    queryKey: ["contact", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contacts")
        .select("*")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data as ContactSelect;
    },
    enabled: !!id,
  });
}

export function useCreateContact() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (contactData: Partial<ContactInsert>) => {
      const { data, error } = await supabase
        .from("contacts")
        .insert(contactData)
        .select()
        .single();
      if (error) throw error;
      return data as ContactSelect;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
    },
  });
}

