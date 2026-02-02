import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { extractFontsFromPDF, getFontSummary } from "@/lib/court-fonts/extractor";
import { validateFonts, ComplianceResult } from "@/lib/court-fonts/validator";
import { getGroupedCourts, getCourtById, ALL_COURTS } from "@/lib/court-fonts/requirements";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const courtId = formData.get("courtId") as string | null;
    const documentName = formData.get("documentName") as string | null;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    if (!courtId) {
      return NextResponse.json(
        { error: "No court selected" },
        { status: 400 }
      );
    }

    // Verify court exists
    const court = getCourtById(courtId);
    if (!court) {
      return NextResponse.json(
        { error: "Invalid court ID" },
        { status: 400 }
      );
    }

    // Verify file is a PDF
    if (!file.type.includes("pdf")) {
      return NextResponse.json(
        { error: "File must be a PDF document" },
        { status: 400 }
      );
    }

    // Read file buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Extract fonts from PDF
    const fonts = await extractFontsFromPDF(buffer);

    if (fonts.length === 0) {
      return NextResponse.json({
        success: true,
        warning: "No fonts detected in the document. The PDF may be image-based or have embedded fonts that couldn't be read.",
        fontsDetected: [],
        summary: null,
        compliance: null,
      });
    }

    // Get font summary
    const summary = getFontSummary(fonts);

    // Validate against court requirements
    const compliance = validateFonts(
      fonts,
      courtId,
      documentName || file.name
    );

    return NextResponse.json({
      success: true,
      fontsDetected: fonts,
      summary,
      compliance,
    });
  } catch (error: unknown) {
    console.error("Font check error:", error);
    const message = error instanceof Error ? error.message : "Failed to analyze document";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// GET endpoint to fetch available courts
export async function GET() {
  try {
    const courts = getGroupedCourts();
    return NextResponse.json({
      courts,
      total: ALL_COURTS.length,
    });
  } catch (error: unknown) {
    console.error("Error fetching courts:", error);
    const message = error instanceof Error ? error.message : "Failed to fetch courts";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
