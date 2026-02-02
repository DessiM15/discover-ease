import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's firm
    const { data: dbUser } = await supabase
      .from("users")
      .select("firm_id")
      .eq("id", user.id)
      .single();

    if (!dbUser?.firm_id) {
      return NextResponse.json({ error: "User not associated with a firm" }, { status: 400 });
    }

    const body = await request.json();
    const { provider } = body;

    if (!provider) {
      return NextResponse.json({ error: "Provider is required" }, { status: 400 });
    }

    // Handle calendar integrations (user-level)
    if (provider === "google-calendar" || provider === "outlook") {
      const calendarProvider = provider === "google-calendar" ? "google" : "outlook";

      const { error: deleteError } = await supabase
        .from("calendar_integrations")
        .delete()
        .eq("user_id", user.id)
        .eq("provider", calendarProvider);

      if (deleteError) {
        throw deleteError;
      }

      return NextResponse.json({ success: true });
    }

    // Handle firm-level integrations (QuickBooks, Slack, Teams)
    const { error: deleteError } = await supabase
      .from("integrations")
      .delete()
      .eq("firm_id", dbUser.firm_id)
      .eq("provider", provider);

    if (deleteError) {
      throw deleteError;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Integration disconnect error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to disconnect integration" },
      { status: 500 }
    );
  }
}
