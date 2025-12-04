"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { documents } from "@/db/schema";
import { InferInsertModel, InferSelectModel } from "drizzle-orm";

export type DocumentInsert = InferInsertModel<typeof documents>;
export type DocumentSelect = InferSelectModel<typeof documents>;

export function useDocuments(firmId?: string, filters?: {
  caseId?: string;
  category?: string;
  status?: string;
  search?: string;
}) {
  const supabase = createClient();

  return useQuery({
    queryKey: ["documents", firmId, filters],
    queryFn: async () => {
      let query = supabase
        .from("documents")
        .select(`
          *,
          cases:case_id (
            id,
            name,
            case_number
          ),
          uploaded_by:uploaded_by_id (
            id,
            first_name,
            last_name
          )
        `);

      if (firmId) {
        query = query.eq("firm_id", firmId);
      }
      if (filters?.caseId) {
        query = query.eq("case_id", filters.caseId);
      }
      if (filters?.category) {
        query = query.eq("category", filters.category);
      }
      if (filters?.status) {
        query = query.eq("status", filters.status);
      }
      if (filters?.search) {
        query = query.or(`name.ilike.%${filters.search}%,original_name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
      }

      const { data, error } = await query.order("created_at", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
    enabled: !!firmId,
  });
}

export function useDocument(id: string) {
  const supabase = createClient();

  return useQuery({
    queryKey: ["document", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("documents")
        .select(`
          *,
          cases:case_id (
            id,
            name,
            case_number
          ),
          uploaded_by:uploaded_by_id (
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

export function useUploadDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch("/api/documents/upload", {
        method: "POST",
        body: formData,
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to upload document");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
    },
  });
}

export function useUpdateDocument() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Partial<DocumentInsert>) => {
      const { data, error } = await supabase
        .from("documents")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data as DocumentSelect;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      queryClient.invalidateQueries({ queryKey: ["document", variables.id] });
    },
  });
}

export function useDeleteDocument() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("documents")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
    },
  });
}

export function useGenerateDocumentSummary() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (documentId: string) => {
      const response = await fetch(`/api/documents/${documentId}/summary`, {
        method: "POST",
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to generate summary");
      }
      return response.json();
    },
    onSuccess: (_, documentId) => {
      queryClient.invalidateQueries({ queryKey: ["document", documentId] });
    },
  });
}

