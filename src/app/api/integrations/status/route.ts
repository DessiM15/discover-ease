import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
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

    // Get user's calendar integrations (Google, Outlook)
    const { data: calendarIntegrations } = await supabase
      .from("calendar_integrations")
      .select("provider, is_enabled, last_sync_at")
      .eq("user_id", user.id);

    // Get firm-level integrations (QuickBooks, Slack, Teams)
    const { data: firmIntegrations } = await supabase
      .from("integrations")
      .select("provider, settings")
      .eq("firm_id", dbUser.firm_id);

    // Build status response
    const status: Record<string, { connected: boolean; lastSync?: string }> = {
      "google-calendar": { connected: false },
      outlook: { connected: false },
      quickbooks: { connected: false },
      slack: { connected: false },
      teams: { connected: false },
      stripe: { connected: !!process.env.STRIPE_SECRET_KEY }, // Stripe is API-key based
      dropbox: { connected: false },
    };

    // Update calendar integration status
    calendarIntegrations?.forEach((integration) => {
      const key = integration.provider === "google" ? "google-calendar" : integration.provider;
      if (status[key]) {
        status[key] = {
          connected: integration.is_enabled,
          lastSync: integration.last_sync_at,
        };
      }
    });

    // Update firm integration status
    firmIntegrations?.forEach((integration) => {
      if (status[integration.provider]) {
        status[integration.provider] = {
          connected: true,
        };
      }
    });

    return NextResponse.json({ status });
  } catch (error) {
    console.error("Integration status error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to get integration status" },
      { status: 500 }
    );
  }
}
