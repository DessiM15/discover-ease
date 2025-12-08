import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Get notifications
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get("type");
    const unreadOnly = searchParams.get("unread") === "true";
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    let query = supabase
      .from("notifications")
      .select("*", { count: "exact" })
      .eq("user_id", user.id)
      .order("timestamp", { ascending: false })
      .range(offset, offset + limit - 1);

    if (type) {
      query = query.eq("type", type);
    }

    if (unreadOnly) {
      query = query.eq("is_read", false);
    }

    const { data: notifications, count, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Get unread count
    const { count: unreadCount } = await supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("is_read", false);

    return NextResponse.json({
      notifications: notifications || [],
      total: count || 0,
      unreadCount: unreadCount || 0,
    });
  } catch (error) {
    console.error("Error getting notifications:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to get notifications" },
      { status: 500 }
    );
  }
}

// Mark notifications as read
export async function PATCH(request: NextRequest) {
  try {
    const { notificationIds, markAllAsRead, filter } = await request.json();

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (markAllAsRead) {
      // Mark all visible/filtered notifications as read (Option B from requirements)
      let query = supabase
        .from("notifications")
        .update({
          is_read: true,
          read_at: new Date().toISOString(),
        })
        .eq("user_id", user.id)
        .eq("is_read", false);

      // Apply filter if provided (only mark filtered notifications as read)
      if (filter?.type) {
        query = query.eq("type", filter.type);
      }

      const { error } = await query;

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    } else if (notificationIds && notificationIds.length > 0) {
      // Mark specific notifications as read
      const { error } = await supabase
        .from("notifications")
        .update({
          is_read: true,
          read_at: new Date().toISOString(),
        })
        .eq("user_id", user.id)
        .in("id", notificationIds);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    } else {
      return NextResponse.json(
        { error: "Either notificationIds or markAllAsRead is required" },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error marking notifications as read:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update notifications" },
      { status: 500 }
    );
  }
}

// Delete notifications
export async function DELETE(request: NextRequest) {
  try {
    const { notificationIds, deleteAll } = await request.json();

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (deleteAll) {
      // Delete all read notifications
      const { error } = await supabase
        .from("notifications")
        .delete()
        .eq("user_id", user.id)
        .eq("is_read", true);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    } else if (notificationIds && notificationIds.length > 0) {
      const { error } = await supabase
        .from("notifications")
        .delete()
        .eq("user_id", user.id)
        .in("id", notificationIds);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    } else {
      return NextResponse.json(
        { error: "Either notificationIds or deleteAll is required" },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting notifications:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete notifications" },
      { status: 500 }
    );
  }
}
