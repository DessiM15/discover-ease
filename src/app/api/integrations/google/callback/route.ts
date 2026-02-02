import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  exchangeGoogleCode,
  verifyGoogleState,
  getGoogleUser,
} from "@/lib/integrations/email/google";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  // Handle OAuth errors
  if (error) {
    console.error("Google OAuth error:", error);
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
    // Verify state (HMAC-signed to prevent tampering)
    const stateData = verifyGoogleState(state);
    if (!stateData) {
      console.error("Google OAuth state verification failed");
      return NextResponse.redirect(
        `${baseUrl}/settings/integrations?error=invalid_state`
      );
    }

    const { userId, firmId, type } = stateData;

    // Exchange code for tokens
    const tokens = await exchangeGoogleCode(code);

    // Get user profile to store email
    const googleUser = await getGoogleUser(tokens.accessToken);

    // Store tokens in database
    const supabase = await createClient();

    if (type === "firm" && firmId) {
      // Firm-level integration
      const { data: existing } = await supabase
        .from("integrations")
        .select("id")
        .eq("firm_id", firmId)
        .eq("provider", "google")
        .single();

      const integrationData = {
        firm_id: firmId,
        provider: "google" as const,
        access_token: tokens.accessToken,
        refresh_token: tokens.refreshToken,
        settings: {
          email: googleUser.email,
          display_name: googleUser.name,
          google_id: googleUser.id,
          picture: googleUser.picture,
          expires_at: new Date(Date.now() + tokens.expiresIn * 1000).toISOString(),
          type: "firm",
        },
      };

      if (existing) {
        await supabase.from("integrations").update(integrationData).eq("id", existing.id);
      } else {
        await supabase.from("integrations").insert(integrationData);
      }

      return NextResponse.redirect(
        `${baseUrl}/settings/integrations?success=google`
      );
    } else {
      // User-level integration
      const { data: existing } = await supabase
        .from("user_integrations")
        .select("id")
        .eq("user_id", userId)
        .eq("provider", "google")
        .single();

      const integrationData = {
        user_id: userId,
        provider: "google",
        access_token: tokens.accessToken,
        refresh_token: tokens.refreshToken,
        email: googleUser.email,
        display_name: googleUser.name,
        provider_user_id: googleUser.id,
        picture: googleUser.picture,
        expires_at: new Date(Date.now() + tokens.expiresIn * 1000).toISOString(),
      };

      if (existing) {
        await supabase.from("user_integrations").update(integrationData).eq("id", existing.id);
      } else {
        await supabase.from("user_integrations").insert(integrationData);
      }

      return NextResponse.redirect(
        `${baseUrl}/settings/account?success=google`
      );
    }
  } catch (err) {
    console.error("Google OAuth callback error:", err);
    return NextResponse.redirect(
      `${baseUrl}/settings/integrations?error=callback_failed`
    );
  }
}
