import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getQuickBooksAuthUrl } from "@/lib/integrations/quickbooks";
import { getMicrosoftAuthUrl } from "@/lib/integrations/email/microsoft";
import { getGoogleAuthUrl } from "@/lib/integrations/email/google";

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
    const { provider, type = "firm" } = body; // type can be "firm" or "user"

    if (!provider) {
      return NextResponse.json({ error: "Provider is required" }, { status: 400 });
    }

    let authUrl: string;

    switch (provider) {
      case "microsoft":
        authUrl = getMicrosoftAuthUrl(user.id, dbUser.firm_id, type);
        break;

      case "google":
        authUrl = getGoogleAuthUrl(user.id, dbUser.firm_id, type);
        break;

      case "quickbooks":
        authUrl = getQuickBooksAuthUrl(user.id, dbUser.firm_id);
        break;

      // Legacy support for old provider names
      case "google-calendar":
        authUrl = getGoogleAuthUrl(user.id, dbUser.firm_id, type);
        break;

      case "outlook":
        authUrl = getMicrosoftAuthUrl(user.id, dbUser.firm_id, type);
        break;

      default:
        return NextResponse.json({ error: "Unsupported provider" }, { status: 400 });
    }

    return NextResponse.json({ authUrl });
  } catch (error) {
    console.error("Integration connect error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate auth URL" },
      { status: 500 }
    );
  }
}
