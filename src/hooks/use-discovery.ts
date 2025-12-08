"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { discoveryRequests, discoveryItems } from "@/db/schema";
import { InferInsertModel, InferSelectModel } from "drizzle-orm";

export type DiscoveryRequestInsert = InferInsertModel<typeof discoveryRequests>;
export type DiscoveryRequestSelect = InferSelectModel<typeof discoveryRequests>;
export type DiscoveryItemInsert = InferInsertModel<typeof discoveryItems>;
export type DiscoveryItemSelect = InferSelectModel<typeof discoveryItems>;

export function useDiscoveryRequests(caseId?: string) {
  const supabase = createClient();

  return useQuery({
    queryKey: ["discovery-requests", caseId],
    queryFn: async () => {
      let query = supabase.from("discovery_requests").select("*");
      if (caseId) {
        query = query.eq("case_id", caseId);
      }
      const { data, error } = await query.order("created_at", { ascending: false });
      if (error) throw error;
      // Supabase returns snake_case, but we'll use it as-is and handle in components
      return data as any[];
    },
  });
}

export function useDiscoveryRequest(id: string) {
  const supabase = createClient();

  return useQuery({
    queryKey: ["discovery-request", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("discovery_requests")
        .select("*")
        .eq("id", id)
        .single();
      if (error) throw error;
      // Supabase returns snake_case
      return data as any;
    },
    enabled: !!id,
  });
}

export function useDiscoveryItems(requestId: string) {
  const supabase = createClient();

  return useQuery({
    queryKey: ["discovery-items", requestId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("discovery_items")
        .select("*")
        .eq("request_id", requestId)
        .order("item_number", { ascending: true });
      if (error) throw error;
      // Supabase returns snake_case
      return data as any[];
    },
    enabled: !!requestId,
  });
}

export function useCreateDiscoveryRequest() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (requestData: Partial<DiscoveryRequestInsert>) => {
      const { data, error } = await supabase
        .from("discovery_requests")
        .insert(requestData)
        .select()
        .single();
      if (error) throw error;
      return data as DiscoveryRequestSelect;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["discovery-requests"] });
    },
  });
}

export function useUpdateDiscoveryRequest() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (requestData: { id: string } & Partial<{
      title: string;
      type: string;
      status: string;
      description: string | null;
      requestNumber: string | null;
      isOutgoing: boolean;
      servedDate: Date | null;
      dueDate: Date | null;
      responseDate: Date | null;
      responseText: string | null;
      objections: string | null;
      notes: string | null;
    }>) => {
      const { id, ...updateData } = requestData;

      // Convert camelCase to snake_case for Supabase
      const snakeCaseData: Record<string, any> = {};
      if (updateData.title !== undefined) snakeCaseData.title = updateData.title;
      if (updateData.type !== undefined) snakeCaseData.type = updateData.type;
      if (updateData.status !== undefined) snakeCaseData.status = updateData.status;
      if (updateData.description !== undefined) snakeCaseData.description = updateData.description;
      if (updateData.requestNumber !== undefined) snakeCaseData.request_number = updateData.requestNumber;
      if (updateData.isOutgoing !== undefined) snakeCaseData.is_outgoing = updateData.isOutgoing;
      if (updateData.servedDate !== undefined) snakeCaseData.served_date = updateData.servedDate;
      if (updateData.dueDate !== undefined) snakeCaseData.due_date = updateData.dueDate;
      if (updateData.responseDate !== undefined) snakeCaseData.response_date = updateData.responseDate;
      if (updateData.responseText !== undefined) snakeCaseData.response_text = updateData.responseText;
      if (updateData.objections !== undefined) snakeCaseData.objections = updateData.objections;
      if (updateData.notes !== undefined) snakeCaseData.notes = updateData.notes;
      snakeCaseData.updated_at = new Date().toISOString();

      const { data, error } = await supabase
        .from("discovery_requests")
        .update(snakeCaseData)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data as DiscoveryRequestSelect;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["discovery-requests"] });
      queryClient.invalidateQueries({ queryKey: ["discovery-request", data.id] });
    },
  });
}

export function useGenerateAIResponse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ itemId, itemText }: { itemId: string; itemText: string }) => {
      const response = await fetch("/api/ai/discovery-response", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemText }),
      });
      if (!response.ok) throw new Error("Failed to generate response");
      const { draftResponse } = await response.json();

      // Update the discovery item with AI response
      const supabase = createClient();
      const { error } = await supabase
        .from("discovery_items")
        .update({ ai_draft_response: draftResponse })
        .eq("id", itemId);
      if (error) throw error;

      return draftResponse;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["discovery-items"] });
    },
  });
}

