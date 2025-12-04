import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const searchParams = request.nextUrl.searchParams;
    const format = searchParams.get("format") || "json";

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get production set
    const { data: productionSet, error: prodError } = await supabase
      .from("production_sets")
      .select("*")
      .eq("id", id)
      .single();

    if (prodError || !productionSet) {
      return NextResponse.json({ error: "Production set not found" }, { status: 404 });
    }

    // Get privileged documents in this production
    const { data: privilegedDocs, error: docsError } = await supabase
      .from("production_documents")
      .select(`
        *,
        documents:document_id (
          id,
          name,
          original_name,
          created_at,
          ocr_text
        )
      `)
      .eq("production_set_id", id)
      .eq("is_privileged", true);

    if (docsError) {
      return NextResponse.json({ error: "Failed to fetch documents" }, { status: 500 });
    }

    // Get privilege log entries for these documents
    const documentIds = privilegedDocs?.map((pd: any) => pd.document_id) || [];
    let privilegeLogs: any[] = [];
    if (documentIds.length > 0) {
      const { data, error } = await supabase
        .from("privilege_log")
        .select("*")
        .in("document_id", documentIds);
      if (!error && data) {
        privilegeLogs = data;
      }
    }

    // Format privilege log data
    const privilegeLog = (privilegedDocs || []).map((pd: any) => {
      const doc = pd.documents;
      const log = (privilegeLogs || []).find((pl: any) => pl.document_id === pd.document_id) || {};

      return {
        batesNumber: pd.bates_number || "N/A",
        documentDate: log.document_date || doc?.created_at || "N/A",
        author: log.author || "N/A",
        recipients: log.recipients || [],
        documentType: doc?.name || "Unknown",
        privilegeClaimed: log.privilege_type || "Attorney-Client Privilege",
        basis: log.basis || pd.privilege_reason || "N/A",
        description: log.description || doc?.name || "N/A",
      };
    });

    if (format === "json") {
      return NextResponse.json({ privilegeLog, productionSet });
    }

    if (format === "csv") {
      const csvHeader = "Bates Number,Document Date,Author,Recipients,Document Type,Privilege Claimed,Basis,Description\n";
      const csvRows = privilegeLog.map((log: any) => {
        const recipients = Array.isArray(log.recipients) ? log.recipients.join("; ") : log.recipients;
        return [
          log.batesNumber,
          log.documentDate,
          log.author,
          recipients,
          log.documentType,
          log.privilegeClaimed,
          log.basis,
          log.description,
        ]
          .map((field) => `"${String(field).replace(/"/g, '""')}"`)
          .join(",");
      });

      const csv = csvHeader + csvRows.join("\n");
      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="privilege-log-${id}.csv"`,
        },
      });
    }

    if (format === "pdf") {
      // For PDF generation, you would use a library like pdfkit or puppeteer
      // For now, return JSON with a note that PDF generation needs implementation
      return NextResponse.json(
        { error: "PDF generation not yet implemented. Please use CSV format." },
        { status: 501 }
      );
    }

    return NextResponse.json({ privilegeLog, productionSet });
  } catch (error: any) {
    console.error("Error generating privilege log:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate privilege log" },
      { status: 500 }
    );
  }
}

