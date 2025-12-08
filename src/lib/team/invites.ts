import { createClient } from "@/lib/supabase/server";
import { sendEmail, emailTemplates, sendTemplatedEmail } from "@/lib/email/sendgrid";
import crypto from "crypto";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export interface TeamInvite {
  id: string;
  firmId: string;
  email: string;
  role: string;
  invitedById: string;
  token: string;
  expiresAt: Date;
  acceptedAt?: Date;
  status: "pending" | "accepted" | "expired" | "cancelled";
}

// Create and send team invite
export async function sendTeamInvite(options: {
  firmId: string;
  email: string;
  role: string;
  invitedById: string;
  customMessage?: string;
}): Promise<{ success: boolean; inviteId?: string; error?: string }> {
  const supabase = await createClient();

  // Check if user already exists in firm
  const { data: existingUser } = await supabase
    .from("users")
    .select("id")
    .eq("email", options.email)
    .eq("firm_id", options.firmId)
    .single();

  if (existingUser) {
    return { success: false, error: "User is already a member of this firm" };
  }

  // Check for existing pending invite
  const { data: existingInvite } = await supabase
    .from("team_invites")
    .select("id")
    .eq("email", options.email)
    .eq("firm_id", options.firmId)
    .eq("status", "pending")
    .single();

  if (existingInvite) {
    // Cancel existing invite and create new one
    await supabase
      .from("team_invites")
      .update({ status: "cancelled" })
      .eq("id", existingInvite.id);
  }

  // Generate secure token
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

  // Create invite record
  const { data: invite, error: inviteError } = await supabase
    .from("team_invites")
    .insert({
      firm_id: options.firmId,
      email: options.email,
      role: options.role,
      invited_by_id: options.invitedById,
      token,
      expires_at: expiresAt.toISOString(),
      status: "pending",
    })
    .select()
    .single();

  if (inviteError) {
    return { success: false, error: inviteError.message };
  }

  // Get inviter and firm info
  const { data: inviter } = await supabase
    .from("users")
    .select("first_name, last_name")
    .eq("id", options.invitedById)
    .single();

  const { data: firm } = await supabase
    .from("firms")
    .select("name")
    .eq("id", options.firmId)
    .single();

  const inviterName = inviter
    ? `${inviter.first_name} ${inviter.last_name}`
    : "A team member";

  // Generate invite URL
  const inviteUrl = `${APP_URL}/invite/${token}`;

  // Send invitation email
  const template = emailTemplates.teamInvite({
    inviterName,
    firmName: firm?.name || "Your Law Firm",
    inviteUrl,
    role: formatRole(options.role),
  });

  const result = await sendEmail({
    to: options.email,
    subject: template.subject,
    html: template.html,
    text: template.text,
  });

  if (!result.success) {
    // Mark invite as failed
    await supabase
      .from("team_invites")
      .update({ status: "cancelled" })
      .eq("id", invite.id);
    return { success: false, error: result.error || "Failed to send email" };
  }

  return { success: true, inviteId: invite.id };
}

// Verify and accept invite
export async function acceptTeamInvite(token: string): Promise<{
  success: boolean;
  email?: string;
  firmId?: string;
  role?: string;
  error?: string;
}> {
  const supabase = await createClient();

  // Find the invite
  const { data: invite } = await supabase
    .from("team_invites")
    .select("*")
    .eq("token", token)
    .eq("status", "pending")
    .single();

  if (!invite) {
    return { success: false, error: "Invalid or expired invitation" };
  }

  // Check if expired
  if (new Date(invite.expires_at) < new Date()) {
    await supabase
      .from("team_invites")
      .update({ status: "expired" })
      .eq("id", invite.id);
    return { success: false, error: "This invitation has expired" };
  }

  return {
    success: true,
    email: invite.email,
    firmId: invite.firm_id,
    role: invite.role,
  };
}

// Complete invite acceptance (after user registration)
export async function completeInviteAcceptance(
  token: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  // Find and update the invite
  const { data: invite, error } = await supabase
    .from("team_invites")
    .update({
      status: "accepted",
      accepted_at: new Date().toISOString(),
    })
    .eq("token", token)
    .eq("status", "pending")
    .select()
    .single();

  if (error || !invite) {
    return { success: false, error: "Failed to accept invitation" };
  }

  // Update user with firm info
  await supabase
    .from("users")
    .update({
      firm_id: invite.firm_id,
      role: invite.role,
    })
    .eq("id", userId);

  return { success: true };
}

// Resend invite
export async function resendTeamInvite(
  inviteId: string,
  invitedById: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  // Get the invite
  const { data: invite } = await supabase
    .from("team_invites")
    .select("*")
    .eq("id", inviteId)
    .single();

  if (!invite) {
    return { success: false, error: "Invite not found" };
  }

  // Generate new token and extend expiry
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  // Update invite
  await supabase
    .from("team_invites")
    .update({
      token,
      expires_at: expiresAt.toISOString(),
      status: "pending",
    })
    .eq("id", inviteId);

  // Get inviter and firm info
  const { data: inviter } = await supabase
    .from("users")
    .select("first_name, last_name")
    .eq("id", invitedById)
    .single();

  const { data: firm } = await supabase
    .from("firms")
    .select("name")
    .eq("id", invite.firm_id)
    .single();

  const inviterName = inviter
    ? `${inviter.first_name} ${inviter.last_name}`
    : "A team member";

  // Generate invite URL
  const inviteUrl = `${APP_URL}/invite/${token}`;

  // Send invitation email
  const template = emailTemplates.teamInvite({
    inviterName,
    firmName: firm?.name || "Your Law Firm",
    inviteUrl,
    role: formatRole(invite.role),
  });

  const result = await sendEmail({
    to: invite.email,
    subject: template.subject,
    html: template.html,
    text: template.text,
  });

  if (!result.success) {
    return { success: false, error: result.error || "Failed to send email" };
  }

  return { success: true };
}

// Cancel invite
export async function cancelTeamInvite(
  inviteId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("team_invites")
    .update({ status: "cancelled" })
    .eq("id", inviteId);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

// Get pending invites for a firm
export async function getPendingInvites(firmId: string): Promise<TeamInvite[]> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("team_invites")
    .select("*")
    .eq("firm_id", firmId)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  return (data || []).map((invite) => ({
    id: invite.id,
    firmId: invite.firm_id,
    email: invite.email,
    role: invite.role,
    invitedById: invite.invited_by_id,
    token: invite.token,
    expiresAt: new Date(invite.expires_at),
    acceptedAt: invite.accepted_at ? new Date(invite.accepted_at) : undefined,
    status: invite.status,
  }));
}

// Format role for display
function formatRole(role: string): string {
  const roleMap: Record<string, string> = {
    owner: "Owner",
    admin: "Administrator",
    attorney: "Attorney",
    paralegal: "Paralegal",
    secretary: "Secretary",
    billing: "Billing Staff",
  };
  return roleMap[role] || role;
}
