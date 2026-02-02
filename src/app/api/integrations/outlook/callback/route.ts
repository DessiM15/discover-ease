import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { exchangeCodeForTokens } from "@/lib/calendar/outlook";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  // Handle OAuth errors
  if (error) {
    console.error("Outlook OAuth error:", error, errorDescription);
    return NextResponse.redirect(
      `${baseUrl}/settings/integrations?error=${encodeURIComponent(error)}`
    );
  }

  if (!code || !state) {
    return NextResponse.redirect(
      `${baseUrl}/settings/integrations?error=missing_params`
    );
  }

  try {
    // Parse state to get user context
    const { userId, firmId } = JSON.parse(state);

    if (!userId || !firmId) {
      throw new Error("Invalid state parameter");
    }

    // Exchange code for tokens
    const tokens = await exchangeCodeForTokens(code);

    if (!tokens.accessToken) {
      throw new Error("Failed to obtain access token");
    }

    // Store tokens in database
    const supabase = await createClient();

    // Check if integration already exists
    const { data: existing } = await supabase
      .from("calendar_integrations")
      .select("id")
      .eq("user_id", userId)
      .eq("provider", "outlook")
      .single();

    const integrationData = {
      user_id: userId,
      provider: "outlook" as const,
      access_token: tokens.accessToken,
      refresh_token: tokens.refreshToken,
      expires_at: tokens.expiresIn
        ? new Date(Date.now() + tokens.expiresIn * 1000).toISOString()
        : null,
      calendar_id: "primary",
      is_enabled: true,
      last_sync_at: new Date().toISOString(),
    };

    if (existing) {
      // Update existing integration
      const { error: updateError } = await supabase
        .from("calendar_integrations")
        .update(integrationData)
        .eq("id", existing.id);

      if (updateError) throw updateError;
    } else {
      // Insert new integration
      const { error: insertError } = await supabase
        .from("calendar_integrations")
        .insert(integrationData);

      if (insertError) throw insertError;
    }

    // Redirect back to settings with success
    return NextResponse.redirect(
      `${baseUrl}/settings/integrations?success=outlook`
    );
  } catch (err) {
    console.error("Outlook OAuth callback error:", err);
    return NextResponse.redirect(
      `${baseUrl}/settings/integrations?error=callback_failed`
    );
  }
}
