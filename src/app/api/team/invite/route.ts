import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  sendTeamInvite,
  resendTeamInvite,
  cancelTeamInvite,
  getPendingInvites,
} from "@/lib/team/invites";

// Send new invite
export async function POST(request: NextRequest) {
  try {
    const { email, role } = await request.json();

    if (!email || !role) {
      return NextResponse.json(
        { error: "Email and role are required" },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's firm and verify they can invite
    const { data: dbUser } = await supabase
      .from("users")
      .select("firm_id, role")
      .eq("id", user.id)
      .single();

    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Only owners and admins can invite
    if (!["owner", "admin"].includes(dbUser.role)) {
      return NextResponse.json(
        { error: "You don't have permission to invite team members" },
        { status: 403 }
      );
    }

    const result = await sendTeamInvite({
      firmId: dbUser.firm_id,
      email,
      role,
      invitedById: user.id,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      inviteId: result.inviteId,
    });
  } catch (error) {
    console.error("Error sending invite:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to send invite" },
      { status: 500 }
    );
  }
}

// Get pending invites
export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: dbUser } = await supabase
      .from("users")
      .select("firm_id, role")
      .eq("id", user.id)
      .single();

    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Only owners and admins can view invites
    if (!["owner", "admin"].includes(dbUser.role)) {
      return NextResponse.json(
        { error: "You don't have permission to view invites" },
        { status: 403 }
      );
    }

    const invites = await getPendingInvites(dbUser.firm_id);

    return NextResponse.json({ invites });
  } catch (error) {
    console.error("Error getting invites:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to get invites" },
      { status: 500 }
    );
  }
}

// Resend or cancel invite
export async function PATCH(request: NextRequest) {
  try {
    const { inviteId, action } = await request.json();

    if (!inviteId || !action) {
      return NextResponse.json(
        { error: "Invite ID and action are required" },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: dbUser } = await supabase
      .from("users")
      .select("firm_id, role")
      .eq("id", user.id)
      .single();

    if (!dbUser || !["owner", "admin"].includes(dbUser.role)) {
      return NextResponse.json(
        { error: "You don't have permission to manage invites" },
        { status: 403 }
      );
    }

    let result;
    if (action === "resend") {
      result = await resendTeamInvite(inviteId, user.id);
    } else if (action === "cancel") {
      result = await cancelTeamInvite(inviteId);
    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error managing invite:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to manage invite" },
      { status: 500 }
    );
  }
}
