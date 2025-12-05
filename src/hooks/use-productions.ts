"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { productionSets, productionDocuments } from "@/db/schema";
import { InferInsertModel, InferSelectModel } from "drizzle-orm";

export type ProductionSetInsert = InferInsertModel<typeof productionSets>;
export type ProductionSetSelect = InferSelectModel<typeof productionSets>;
export type ProductionDocumentInsert = InferInsertModel<typeof productionDocuments>;
export type ProductionDocumentSelect = InferSelectModel<typeof productionDocuments>;

export function useProductions(firmId?: string, caseId?: string) {
  const supabase = createClient();

  return useQuery({
    queryKey: ["productions", firmId, caseId],
    queryFn: async () => {
      let query = supabase
        .from("production_sets")
        .select(`
          *,
          cases:case_id (
            id,
            name,
            case_number,
            firm_id
          ),
          produced_to:produced_to_id (
            id,
            first_name,
            last_name,
            company_name
          )
        `);

      // Filter by case_id if provided
      if (caseId) {
        query = query.eq("case_id", caseId);
      }

      const { data, error } = await query.order("created_at", { ascending: false });
      if (error) throw error;
      
      // Filter by firm_id through the case relationship if firmId is provided
      let filteredData = data as any[];
      if (firmId && data) {
        filteredData = data.filter((prod: any) => prod.cases?.firm_id === firmId);
      }
      
      return filteredData;
    },
    enabled: !!firmId,
  });
}

export function useProduction(id: string) {
  const supabase = createClient();

  return useQuery({
    queryKey: ["production", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("production_sets")
        .select(`
          *,
          cases:case_id (
            id,
            name,
            case_number,
            bates_prefix
          ),
          produced_to:produced_to_id (
            id,
            first_name,
            last_name,
            company_name
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

export function useProductionDocuments(productionSetId: string) {
  const supabase = createClient();

  return useQuery({
    queryKey: ["production-documents", productionSetId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("production_documents")
        .select(`
          *,
          documents:document_id (
            id,
            name,
            original_name,
            file_size,
            page_count,
            mime_type,
            storage_path,
            bates_start,
            bates_end
          )
        `)
        .eq("production_set_id", productionSetId)
        .order("bates_number", { ascending: true });
      if (error) throw error;
      return data as any[];
    },
    enabled: !!productionSetId,
  });
}

export function useCreateProduction() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (productionData: Partial<ProductionSetInsert>) => {
      const { data, error } = await supabase
        .from("production_sets")
        .insert(productionData)
        .select()
        .single();
      if (error) {
        console.error("Production creation error:", error);
        throw new Error(error.message || "Failed to create production");
      }
      return data as ProductionSetSelect;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["productions"] });
    },
  });
}

export function useUpdateProduction() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Partial<ProductionSetInsert>) => {
      // Convert Date objects to ISO strings for Supabase
      const updatesForSupabase = { ...updates };
      if (updatesForSupabase.producedDate instanceof Date) {
        updatesForSupabase.producedDate = updatesForSupabase.producedDate.toISOString() as any;
      }
      
      const { data, error } = await supabase
        .from("production_sets")
        .update(updatesForSupabase as any)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data as ProductionSetSelect;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["productions"] });
      queryClient.invalidateQueries({ queryKey: ["production", variables.id] });
    },
  });
}

export function useAddDocumentsToProduction() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      productionSetId,
      documentIds,
      batesPrefix,
    }: {
      productionSetId: string;
      documentIds: string[];
      batesPrefix?: string;
    }) => {
      // Get current max bates number for this production
      const { data: existingDocs } = await supabase
        .from("production_documents")
        .select("bates_number")
        .eq("production_set_id", productionSetId)
        .order("bates_number", { ascending: false })
        .limit(1);

      let currentBates = 0;
      if (existingDocs && existingDocs.length > 0 && existingDocs[0].bates_number) {
        const lastBates = existingDocs[0].bates_number;
        const match = lastBates.match(/-(\d+)$/);
        if (match) {
          currentBates = parseInt(match[1], 10);
        }
      }

      // Get documents to add
      const { data: documents } = await supabase
        .from("documents")
        .select("id, page_count")
        .in("id", documentIds);

      if (!documents) throw new Error("Documents not found");

      // Create production document entries
      const productionDocs = documents.map((doc: { id: string; page_count: number | null }, index: number) => {
        const batesNumber = batesPrefix
          ? `${batesPrefix}-${String(currentBates + index + 1).padStart(6, "0")}`
          : null;

        return {
          production_set_id: productionSetId,
          document_id: doc.id,
          bates_number: batesNumber,
          is_privileged: false,
        };
      });

      const { data, error } = await supabase
        .from("production_documents")
        .insert(productionDocs)
        .select();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["production-documents", variables.productionSetId] });
      queryClient.invalidateQueries({ queryKey: ["production", variables.productionSetId] });
    },
  });
}

export function useUpdateProductionDocument() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: {
      id: string;
    } & Partial<ProductionDocumentInsert>) => {
      const { data, error } = await supabase
        .from("production_documents")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data as ProductionDocumentSelect;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["production-documents", data.productionSetId] });
    },
  });
}

export function useGeneratePrivilegeLog() {
  return useMutation({
    mutationFn: async ({ productionSetId, format }: { productionSetId: string; format?: "json" | "csv" | "pdf" }) => {
      const response = await fetch(`/api/productions/${productionSetId}/privilege-log?format=${format || "json"}`, {
        method: "GET",
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to generate privilege log");
      }
      if (format === "csv" || format === "pdf") {
        const blob = await response.blob();
        return blob;
      }
      return response.json();
    },
  });
}

