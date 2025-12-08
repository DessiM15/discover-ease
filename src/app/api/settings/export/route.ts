import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import Archiver from "archiver";
import { Readable } from "stream";

// Export all firm data
export async function POST(request: NextRequest) {
  try {
    const { includeDocuments } = await request.json();

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's firm and verify they're an admin
    const { data: dbUser } = await supabase
      .from("users")
      .select("firm_id, role")
      .eq("id", user.id)
      .single();

    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (!["owner", "admin"].includes(dbUser.role)) {
      return NextResponse.json(
        { error: "Only owners and admins can export data" },
        { status: 403 }
      );
    }

    const firmId = dbUser.firm_id;

    // Fetch all data
    const [
      firmResult,
      usersResult,
      casesResult,
      contactsResult,
      documentsResult,
      timeEntriesResult,
      expensesResult,
      invoicesResult,
      paymentsResult,
      eventsResult,
      tasksResult,
      discoveryResult,
      workflowsResult,
    ] = await Promise.all([
      supabase.from("firms").select("*").eq("id", firmId).single(),
      supabase.from("users").select("*").eq("firm_id", firmId),
      supabase.from("cases").select("*").eq("firm_id", firmId),
      supabase.from("contacts").select("*").eq("firm_id", firmId),
      supabase.from("documents").select("*").eq("firm_id", firmId),
      supabase.from("time_entries").select("*").eq("firm_id", firmId),
      supabase.from("expenses").select("*").eq("firm_id", firmId),
      supabase.from("invoices").select("*").eq("firm_id", firmId),
      supabase.from("payments").select("*").eq("firm_id", firmId),
      supabase.from("events").select("*").eq("firm_id", firmId),
      supabase.from("tasks").select("*").eq("firm_id", firmId),
      supabase.from("discovery_requests").select("*").eq("case_id", firmId),
      supabase.from("workflows").select("*").eq("firm_id", firmId),
    ]);

    // Build export data
    const exportData = {
      exportDate: new Date().toISOString(),
      firmInfo: firmResult.data,
      users: (usersResult.data || []).map((u) => ({
        ...u,
        // Remove sensitive fields
        password: undefined,
      })),
      cases: casesResult.data || [],
      contacts: contactsResult.data || [],
      documents: (documentsResult.data || []).map((d) => ({
        ...d,
        // Don't include file paths in export
        storage_path: undefined,
      })),
      timeEntries: timeEntriesResult.data || [],
      expenses: expensesResult.data || [],
      invoices: invoicesResult.data || [],
      payments: paymentsResult.data || [],
      events: eventsResult.data || [],
      tasks: tasksResult.data || [],
      discoveryRequests: discoveryResult.data || [],
      workflows: workflowsResult.data || [],
    };

    // Create ZIP archive
    const chunks: Uint8Array[] = [];
    const archive = Archiver("zip", { zlib: { level: 9 } });

    archive.on("data", (chunk) => chunks.push(chunk));

    // Add JSON data
    archive.append(JSON.stringify(exportData, null, 2), {
      name: "data.json",
    });

    // Add individual CSV files for easier viewing
    archive.append(convertToCSV(exportData.cases), {
      name: "cases.csv",
    });
    archive.append(convertToCSV(exportData.contacts), {
      name: "contacts.csv",
    });
    archive.append(convertToCSV(exportData.timeEntries), {
      name: "time_entries.csv",
    });
    archive.append(convertToCSV(exportData.expenses), {
      name: "expenses.csv",
    });
    archive.append(convertToCSV(exportData.invoices), {
      name: "invoices.csv",
    });
    archive.append(convertToCSV(exportData.payments), {
      name: "payments.csv",
    });

    // Add README
    const readme = `# DiscoverEase Data Export

Exported on: ${new Date().toLocaleString()}
Firm: ${exportData.firmInfo?.name || "Unknown"}

## Files Included

- data.json - Complete data export in JSON format
- cases.csv - All cases
- contacts.csv - All contacts
- time_entries.csv - All time entries
- expenses.csv - All expenses
- invoices.csv - All invoices
- payments.csv - All payments

## Notes

- This export contains all your firm's data from DiscoverEase
- Document files are not included in this export for security
- To import this data back, contact DiscoverEase support

© ${new Date().getFullYear()} DiscoverEase
`;
    archive.append(readme, { name: "README.md" });

    await archive.finalize();

    // Combine chunks
    const buffer = Buffer.concat(chunks);

    // Return as downloadable file
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="discoverease-export-${new Date().toISOString().split("T")[0]}.zip"`,
        "Content-Length": buffer.length.toString(),
      },
    });
  } catch (error) {
    console.error("Error exporting data:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to export data" },
      { status: 500 }
    );
  }
}

// Convert array to CSV
function convertToCSV(data: Record<string, unknown>[]): string {
  if (!data || data.length === 0) {
    return "";
  }

  const headers = Object.keys(data[0]);
  const csvRows = [headers.join(",")];

  for (const row of data) {
    const values = headers.map((header) => {
      const value = row[header];
      if (value === null || value === undefined) {
        return "";
      }
      if (typeof value === "object") {
        return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
      }
      const stringValue = String(value);
      if (stringValue.includes(",") || stringValue.includes('"') || stringValue.includes("\n")) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
    });
    csvRows.push(values.join(","));
  }

  return csvRows.join("\n");
}

// Get export status / info
export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: dbUser } = await supabase
      .from("users")
      .select("firm_id, role")
      .eq("id", user.id)
      .single();

    if (!dbUser || !["owner", "admin"].includes(dbUser.role)) {
      return NextResponse.json(
        { error: "Only owners and admins can export data" },
        { status: 403 }
      );
    }

    // Get data counts
    const [casesCount, contactsCount, documentsCount, invoicesCount] =
      await Promise.all([
        supabase
          .from("cases")
          .select("*", { count: "exact", head: true })
          .eq("firm_id", dbUser.firm_id),
        supabase
          .from("contacts")
          .select("*", { count: "exact", head: true })
          .eq("firm_id", dbUser.firm_id),
        supabase
          .from("documents")
          .select("*", { count: "exact", head: true })
          .eq("firm_id", dbUser.firm_id),
        supabase
          .from("invoices")
          .select("*", { count: "exact", head: true })
          .eq("firm_id", dbUser.firm_id),
      ]);

    return NextResponse.json({
      canExport: true,
      dataCounts: {
        cases: casesCount.count || 0,
        contacts: contactsCount.count || 0,
        documents: documentsCount.count || 0,
        invoices: invoicesCount.count || 0,
      },
    });
  } catch (error) {
    console.error("Error getting export info:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to get export info" },
      { status: 500 }
    );
  }
}
