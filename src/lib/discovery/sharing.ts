import { createClient } from "@/lib/supabase/server";
import { sendEmail, emailTemplates } from "@/lib/email/sendgrid";
import crypto from "crypto";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export interface DiscoveryShareLink {
  id: string;
  requestId: string;
  token: string;
  recipientName: string;
  recipientEmail: string;
  expiresAt: Date;
  maxUploads?: number;
  currentUploads: number;
  instructions?: string;
  isActive: boolean;
  createdAt: Date;
  lastAccessedAt?: Date;
}

export interface CreateShareLinkOptions {
  requestId: string;
  recipientName: string;
  recipientEmail: string;
  expirationDays?: number;
  maxUploads?: number;
  instructions?: string;
  createdById: string;
}

// Create a shareable upload link for discovery
export async function createDiscoveryShareLink(
  options: CreateShareLinkOptions
): Promise<{ success: boolean; shareLink?: DiscoveryShareLink; shareUrl?: string; error?: string }> {
  const supabase = await createClient();

  // Verify the discovery request exists
  const { data: request } = await supabase
    .from("discovery_requests")
    .select(`
      *,
      cases(id, name, case_number, firm_id)
    `)
    .eq("id", options.requestId)
    .single();

  if (!request) {
    return { success: false, error: "Discovery request not found" };
  }

  // Generate secure token
  const token = crypto.randomBytes(32).toString("hex");

  // Set expiration (default 30 days)
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + (options.expirationDays || 30));

  // Create the share link record
  const { data: shareLink, error } = await supabase
    .from("discovery_share_links")
    .insert({
      request_id: options.requestId,
      token,
      recipient_name: options.recipientName,
      recipient_email: options.recipientEmail,
      expires_at: expiresAt.toISOString(),
      max_uploads: options.maxUploads,
      current_uploads: 0,
      instructions: options.instructions,
      is_active: true,
      created_by_id: options.createdById,
    })
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  const shareUrl = `${APP_URL}/discovery/upload/${token}`;

  return {
    success: true,
    shareLink: {
      id: shareLink.id,
      requestId: shareLink.request_id,
      token: shareLink.token,
      recipientName: shareLink.recipient_name,
      recipientEmail: shareLink.recipient_email,
      expiresAt: new Date(shareLink.expires_at),
      maxUploads: shareLink.max_uploads,
      currentUploads: shareLink.current_uploads,
      instructions: shareLink.instructions,
      isActive: shareLink.is_active,
      createdAt: new Date(shareLink.created_at),
    },
    shareUrl,
  };
}

// Send discovery share link via email
export async function sendDiscoveryShareEmail(
  shareLinkId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  // Get share link with request and case info
  const { data: shareLink } = await supabase
    .from("discovery_share_links")
    .select(`
      *,
      discovery_requests(
        title,
        due_date,
        cases(name, case_number, firms(name))
      ),
      users!created_by_id(first_name, last_name)
    `)
    .eq("id", shareLinkId)
    .single();

  if (!shareLink) {
    return { success: false, error: "Share link not found" };
  }

  const request = shareLink.discovery_requests;
  const cases = request?.cases;
  const firm = cases?.firms;
  const creator = shareLink.users;

  const shareUrl = `${APP_URL}/discovery/upload/${shareLink.token}`;

  const template = emailTemplates.discoveryShareLink({
    recipientName: shareLink.recipient_name,
    senderName: `${creator?.first_name || ""} ${creator?.last_name || ""}`.trim() || "The attorney",
    firmName: firm?.name || "The law firm",
    caseName: cases?.name || "the matter",
    requestTitle: request?.title || "Discovery Request",
    dueDate: request?.due_date
      ? new Date(request.due_date).toLocaleDateString()
      : "As soon as possible",
    uploadUrl: shareUrl,
    instructions: shareLink.instructions,
  });

  const result = await sendEmail({
    to: shareLink.recipient_email,
    subject: template.subject,
    html: template.html,
    text: template.text,
  });

  if (!result.success) {
    return { success: false, error: result.error };
  }

  // Update last sent timestamp
  await supabase
    .from("discovery_share_links")
    .update({ last_sent_at: new Date().toISOString() })
    .eq("id", shareLinkId);

  return { success: true };
}

// Validate share link and get info
export async function validateShareLink(
  token: string
): Promise<{
  valid: boolean;
  shareLink?: DiscoveryShareLink;
  request?: Record<string, unknown>;
  error?: string;
}> {
  const supabase = await createClient();

  const { data: shareLink } = await supabase
    .from("discovery_share_links")
    .select(`
      *,
      discovery_requests(
        id,
        title,
        description,
        type,
        due_date,
        cases(name, case_number)
      )
    `)
    .eq("token", token)
    .eq("is_active", true)
    .single();

  if (!shareLink) {
    return { valid: false, error: "Invalid or expired link" };
  }

  // Check expiration
  if (new Date(shareLink.expires_at) < new Date()) {
    // Mark as inactive
    await supabase
      .from("discovery_share_links")
      .update({ is_active: false })
      .eq("id", shareLink.id);
    return { valid: false, error: "This link has expired" };
  }

  // Check upload limit
  if (shareLink.max_uploads && shareLink.current_uploads >= shareLink.max_uploads) {
    return { valid: false, error: "Upload limit reached for this link" };
  }

  // Update last accessed
  await supabase
    .from("discovery_share_links")
    .update({ last_accessed_at: new Date().toISOString() })
    .eq("id", shareLink.id);

  return {
    valid: true,
    shareLink: {
      id: shareLink.id,
      requestId: shareLink.request_id,
      token: shareLink.token,
      recipientName: shareLink.recipient_name,
      recipientEmail: shareLink.recipient_email,
      expiresAt: new Date(shareLink.expires_at),
      maxUploads: shareLink.max_uploads,
      currentUploads: shareLink.current_uploads,
      instructions: shareLink.instructions,
      isActive: shareLink.is_active,
      createdAt: new Date(shareLink.created_at),
      lastAccessedAt: shareLink.last_accessed_at
        ? new Date(shareLink.last_accessed_at)
        : undefined,
    },
    request: shareLink.discovery_requests,
  };
}

// Upload document via share link
export async function uploadViaShareLink(
  token: string,
  file: {
    name: string;
    size: number;
    type: string;
    buffer: Buffer;
  },
  uploaderInfo: {
    name: string;
    email: string;
    notes?: string;
  }
): Promise<{ success: boolean; documentId?: string; error?: string }> {
  const supabase = await createClient();

  // Validate the share link
  const validation = await validateShareLink(token);
  if (!validation.valid || !validation.shareLink) {
    return { success: false, error: validation.error || "Invalid link" };
  }

  const shareLink = validation.shareLink;
  const request = validation.request as Record<string, unknown>;

  // Get case and firm info from request
  const { data: discoveryRequest } = await supabase
    .from("discovery_requests")
    .select("case_id, cases(firm_id)")
    .eq("id", shareLink.requestId)
    .single();

  if (!discoveryRequest) {
    return { success: false, error: "Discovery request not found" };
  }

  const casesData = discoveryRequest.cases && typeof discoveryRequest.cases === "object" && !Array.isArray(discoveryRequest.cases)
    ? discoveryRequest.cases as { firm_id?: string }
    : null;
  const firmId = casesData?.firm_id;
  const caseId = discoveryRequest.case_id;

  // Upload file to storage
  const storagePath = `discovery-uploads/${firmId}/${caseId}/${Date.now()}-${file.name}`;

  const { error: uploadError } = await supabase.storage
    .from("documents")
    .upload(storagePath, file.buffer, {
      contentType: file.type,
    });

  if (uploadError) {
    return { success: false, error: `Upload failed: ${uploadError.message}` };
  }

  // Create document record
  const { data: document, error: docError } = await supabase
    .from("documents")
    .insert({
      firm_id: firmId,
      case_id: caseId,
      name: file.name,
      original_name: file.name,
      storage_path: storagePath,
      file_size: file.size,
      mime_type: file.type,
      status: "pending_review",
      category: "discovery_response",
      description: `Uploaded by ${uploaderInfo.name} (${uploaderInfo.email}) via discovery share link${uploaderInfo.notes ? `. Notes: ${uploaderInfo.notes}` : ""}`,
    })
    .select()
    .single();

  if (docError) {
    return { success: false, error: docError.message };
  }

  // Create discovery upload record
  await supabase.from("discovery_uploads").insert({
    share_link_id: shareLink.id,
    document_id: document.id,
    request_id: shareLink.requestId,
    uploader_name: uploaderInfo.name,
    uploader_email: uploaderInfo.email,
    notes: uploaderInfo.notes,
  });

  // Increment upload count
  await supabase
    .from("discovery_share_links")
    .update({ current_uploads: shareLink.currentUploads + 1 })
    .eq("id", shareLink.id);

  // Create notification for the case team
  const { data: caseTeam } = await supabase
    .from("case_team")
    .select("user_id")
    .eq("case_id", caseId);

  if (caseTeam && caseTeam.length > 0) {
    await supabase.from("notifications").insert(
      caseTeam.map((member) => ({
        user_id: member.user_id,
        type: "discovery_upload",
        title: "New Discovery Document Uploaded",
        message: `${uploaderInfo.name} uploaded "${file.name}" in response to discovery request "${(request as Record<string, string>)?.title || "Unknown"}"`,
        entity_type: "document",
        entity_id: document.id,
        action_url: `/documents/${document.id}`,
      }))
    );
  }

  return { success: true, documentId: document.id };
}

// Deactivate share link
export async function deactivateShareLink(
  shareLinkId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("discovery_share_links")
    .update({ is_active: false })
    .eq("id", shareLinkId);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

// Get share links for a discovery request
export async function getShareLinksForRequest(
  requestId: string
): Promise<DiscoveryShareLink[]> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("discovery_share_links")
    .select("*")
    .eq("request_id", requestId)
    .order("created_at", { ascending: false });

  return (data || []).map((link) => ({
    id: link.id,
    requestId: link.request_id,
    token: link.token,
    recipientName: link.recipient_name,
    recipientEmail: link.recipient_email,
    expiresAt: new Date(link.expires_at),
    maxUploads: link.max_uploads,
    currentUploads: link.current_uploads,
    instructions: link.instructions,
    isActive: link.is_active,
    createdAt: new Date(link.created_at),
    lastAccessedAt: link.last_accessed_at
      ? new Date(link.last_accessed_at)
      : undefined,
  }));
}

// Get uploads for a share link
export async function getUploadsForShareLink(
  shareLinkId: string
): Promise<
  Array<{
    id: string;
    documentId: string;
    documentName: string;
    uploaderName: string;
    uploaderEmail: string;
    notes?: string;
    uploadedAt: Date;
  }>
> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("discovery_uploads")
    .select(`
      *,
      documents(name)
    `)
    .eq("share_link_id", shareLinkId)
    .order("created_at", { ascending: false });

  return (data || []).map((upload) => ({
    id: upload.id,
    documentId: upload.document_id,
    documentName: (upload.documents as Record<string, string>)?.name || "Unknown",
    uploaderName: upload.uploader_name,
    uploaderEmail: upload.uploader_email,
    notes: upload.notes,
    uploadedAt: new Date(upload.created_at),
  }));
}
