import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { exchangeCodeForTokens, verifyState } from "@/lib/integrations/quickbooks";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const realmId = searchParams.get("realmId");
  const error = searchParams.get("error");

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  // Handle OAuth errors
  if (error) {
    console.error("QuickBooks OAuth error:", error);
    return NextResponse.redirect(
      `${baseUrl}/settings/integrations?error=${encodeURIComponent(error)}`
    );
  }

  if (!code || !state || !realmId) {
    return NextResponse.redirect(
      `${baseUrl}/settings/integrations?error=missing_params`
    );
  }

  try {
    // Verify and parse state (HMAC-signed to prevent tampering)
    const decodedState = verifyState(state);
    if (!decodedState) {
      console.error("QuickBooks OAuth state verification failed");
      return NextResponse.redirect(
        `${baseUrl}/settings/integrations?error=invalid_state`
      );
    }
    const { userId, firmId } = decodedState;

    // Exchange code for tokens
    const tokens = await exchangeCodeForTokens(code);

    if (!tokens.accessToken) {
      throw new Error("Failed to obtain access token");
    }

    // Store tokens in database
    const supabase = await createClient();

    // Check if integration already exists
    const { data: existing } = await supabase
      .from("integrations")
      .select("id")
      .eq("firm_id", firmId)
      .eq("provider", "quickbooks")
      .single();

    const integrationData = {
      firm_id: firmId,
      provider: "quickbooks" as const,
      access_token: tokens.accessToken,
      refresh_token: tokens.refreshToken,
      settings: {
        realm_id: realmId,
        expires_at: new Date(Date.now() + tokens.expiresIn * 1000).toISOString(),
      },
    };

    if (existing) {
      // Update existing integration
      const { error: updateError } = await supabase
        .from("integrations")
        .update(integrationData)
        .eq("id", existing.id);

      if (updateError) throw updateError;
    } else {
      // Insert new integration
      const { error: insertError } = await supabase
        .from("integrations")
        .insert(integrationData);

      if (insertError) throw insertError;
    }

    // Redirect back to settings with success
    return NextResponse.redirect(
      `${baseUrl}/settings/integrations?success=quickbooks`
    );
  } catch (err) {
    console.error("QuickBooks OAuth callback error:", err);
    return NextResponse.redirect(
      `${baseUrl}/settings/integrations?error=callback_failed`
    );
  }
}
