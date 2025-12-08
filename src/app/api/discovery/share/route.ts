import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  createDiscoveryShareLink,
  sendDiscoveryShareEmail,
  getShareLinksForRequest,
  deactivateShareLink,
} from "@/lib/discovery/sharing";

// Create share link
export async function POST(request: NextRequest) {
  try {
    const {
      requestId,
      recipientName,
      recipientEmail,
      expirationDays,
      maxUploads,
      instructions,
      sendEmail,
    } = await request.json();

    if (!requestId || !recipientName || !recipientEmail) {
      return NextResponse.json(
        { error: "Request ID, recipient name, and email are required" },
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

    // Verify user has access to this discovery request
    const { data: discoveryRequest } = await supabase
      .from("discovery_requests")
      .select("cases(firm_id)")
      .eq("id", requestId)
      .single();

    if (!discoveryRequest) {
      return NextResponse.json(
        { error: "Discovery request not found" },
        { status: 404 }
      );
    }

    const { data: dbUser } = await supabase
      .from("users")
      .select("firm_id")
      .eq("id", user.id)
      .single();

    const caseFirmId = discoveryRequest.cases && typeof discoveryRequest.cases === "object" && !Array.isArray(discoveryRequest.cases)
      ? (discoveryRequest.cases as { firm_id?: string }).firm_id
      : null;
    if (!dbUser || dbUser.firm_id !== caseFirmId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Create the share link
    const result = await createDiscoveryShareLink({
      requestId,
      recipientName,
      recipientEmail,
      expirationDays,
      maxUploads,
      instructions,
      createdById: user.id,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    // Send email if requested
    if (sendEmail && result.shareLink) {
      await sendDiscoveryShareEmail(result.shareLink.id);
    }

    return NextResponse.json({
      success: true,
      shareLink: result.shareLink,
      shareUrl: result.shareUrl,
    });
  } catch (error) {
    console.error("Error creating share link:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create share link" },
      { status: 500 }
    );
  }
}

// Get share links for a request
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const requestId = searchParams.get("requestId");

    if (!requestId) {
      return NextResponse.json(
        { error: "Request ID is required" },
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

    // Verify access
    const { data: discoveryRequest } = await supabase
      .from("discovery_requests")
      .select("cases(firm_id)")
      .eq("id", requestId)
      .single();

    if (!discoveryRequest) {
      return NextResponse.json(
        { error: "Discovery request not found" },
        { status: 404 }
      );
    }

    const { data: dbUser } = await supabase
      .from("users")
      .select("firm_id")
      .eq("id", user.id)
      .single();

    const getCaseFirmId = discoveryRequest.cases && typeof discoveryRequest.cases === "object" && !Array.isArray(discoveryRequest.cases)
      ? (discoveryRequest.cases as { firm_id?: string }).firm_id
      : null;
    if (!dbUser || dbUser.firm_id !== getCaseFirmId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const shareLinks = await getShareLinksForRequest(requestId);

    return NextResponse.json({ shareLinks });
  } catch (error) {
    console.error("Error getting share links:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to get share links" },
      { status: 500 }
    );
  }
}

// Resend email or deactivate link
export async function PATCH(request: NextRequest) {
  try {
    const { shareLinkId, action } = await request.json();

    if (!shareLinkId || !action) {
      return NextResponse.json(
        { error: "Share link ID and action are required" },
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

    // Verify access
    const { data: shareLink } = await supabase
      .from("discovery_share_links")
      .select(`
        *,
        discovery_requests(cases(firm_id))
      `)
      .eq("id", shareLinkId)
      .single();

    if (!shareLink) {
      return NextResponse.json(
        { error: "Share link not found" },
        { status: 404 }
      );
    }

    const { data: dbUser } = await supabase
      .from("users")
      .select("firm_id")
      .eq("id", user.id)
      .single();

    const discoveryReqs = shareLink.discovery_requests;
    const firmId = discoveryReqs && typeof discoveryReqs === "object" && !Array.isArray(discoveryReqs)
      ? ((discoveryReqs as { cases?: { firm_id?: string } }).cases?.firm_id ?? null)
      : null;
    if (!dbUser || dbUser.firm_id !== firmId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    if (action === "resend") {
      const result = await sendDiscoveryShareEmail(shareLinkId);
      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }
    } else if (action === "deactivate") {
      const result = await deactivateShareLink(shareLinkId);
      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }
    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error managing share link:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to manage share link" },
      { status: 500 }
    );
  }
}
