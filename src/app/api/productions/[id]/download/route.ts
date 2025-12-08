import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import Archiver from "archiver";

const MAX_DOWNLOAD_SIZE = 2 * 1024 * 1024 * 1024; // 2GB max
const SIZE_WARNING_THRESHOLD = 500 * 1024 * 1024; // 500MB warning

interface RouteContext {
  params: Promise<{ id: string }>;
}

// Get production download info
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id: productionId } = await context.params;
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get production with documents
    const { data: production } = await supabase
      .from("production_sets")
      .select(`
        *,
        cases(firm_id),
        production_documents(
          document_id,
          documents(id, name, file_size, storage_path)
        )
      `)
      .eq("id", productionId)
      .single();

    if (!production) {
      return NextResponse.json({ error: "Production not found" }, { status: 404 });
    }

    // Verify user has access
    const { data: dbUser } = await supabase
      .from("users")
      .select("firm_id")
      .eq("id", user.id)
      .single();

    if (!dbUser || dbUser.firm_id !== production.cases?.firm_id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Calculate total size
    const documents = production.production_documents || [];
    const totalSize = documents.reduce((sum: number, pd: Record<string, unknown>) => {
      return sum + ((pd.documents as Record<string, unknown>)?.file_size as number || 0);
    }, 0);

    const documentCount = documents.length;
    const exceedsLimit = totalSize > MAX_DOWNLOAD_SIZE;
    const showWarning = totalSize > SIZE_WARNING_THRESHOLD;

    // Calculate split info if needed
    let splitInfo = null;
    if (exceedsLimit) {
      const partsNeeded = Math.ceil(totalSize / MAX_DOWNLOAD_SIZE);
      splitInfo = {
        partsNeeded,
        partSizeLimit: MAX_DOWNLOAD_SIZE,
        totalSize,
      };
    }

    return NextResponse.json({
      productionId,
      productionName: production.name,
      documentCount,
      totalSize,
      totalSizeFormatted: formatBytes(totalSize),
      canDownload: !exceedsLimit,
      showWarning,
      warningMessage: showWarning && !exceedsLimit
        ? `This download is ${formatBytes(totalSize)}. Large downloads may take several minutes.`
        : null,
      exceedsLimit,
      splitInfo,
      maxDownloadSize: MAX_DOWNLOAD_SIZE,
      maxDownloadSizeFormatted: formatBytes(MAX_DOWNLOAD_SIZE),
    });
  } catch (error) {
    console.error("Error getting production info:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to get production info" },
      { status: 500 }
    );
  }
}

// Download production ZIP
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { id: productionId } = await context.params;
    const { part } = await request.json().catch(() => ({ part: undefined }));

    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get production with documents
    const { data: production } = await supabase
      .from("production_sets")
      .select(`
        *,
        cases(firm_id, name, case_number),
        production_documents(
          document_id,
          bates_number,
          is_privileged,
          privilege_reason,
          documents(id, name, original_name, file_size, storage_path, mime_type)
        )
      `)
      .eq("id", productionId)
      .single();

    if (!production) {
      return NextResponse.json({ error: "Production not found" }, { status: 404 });
    }

    // Verify user has access
    const { data: dbUser } = await supabase
      .from("users")
      .select("firm_id")
      .eq("id", user.id)
      .single();

    if (!dbUser || dbUser.firm_id !== production.cases?.firm_id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const documents = (production.production_documents || []).filter(
      (pd: Record<string, unknown>) => pd.documents && !(pd.is_privileged)
    );

    // Calculate total size
    const totalSize = documents.reduce((sum: number, pd: Record<string, unknown>) => {
      return sum + ((pd.documents as Record<string, unknown>)?.file_size as number || 0);
    }, 0);

    if (totalSize > MAX_DOWNLOAD_SIZE && part === undefined) {
      return NextResponse.json(
        {
          error: "Production exceeds maximum download size. Please download in parts.",
          totalSize,
          maxSize: MAX_DOWNLOAD_SIZE,
          partsNeeded: Math.ceil(totalSize / MAX_DOWNLOAD_SIZE),
        },
        { status: 400 }
      );
    }

    // If downloading in parts, filter documents for this part
    let documentsToInclude = documents;
    if (part !== undefined) {
      const partIndex = parseInt(part);
      const partsNeeded = Math.ceil(totalSize / MAX_DOWNLOAD_SIZE);

      if (partIndex < 0 || partIndex >= partsNeeded) {
        return NextResponse.json({ error: "Invalid part number" }, { status: 400 });
      }

      // Distribute documents across parts
      let currentSize = 0;
      let currentPart = 0;
      documentsToInclude = [];

      for (const doc of documents) {
        const docSize = (doc.documents as Record<string, number>)?.file_size || 0;

        if (currentPart === partIndex) {
          documentsToInclude.push(doc);
        }

        currentSize += docSize;
        if (currentSize >= MAX_DOWNLOAD_SIZE) {
          currentPart++;
          currentSize = 0;
        }
      }
    }

    // Create ZIP archive
    const chunks: Uint8Array[] = [];
    const archive = Archiver("zip", { zlib: { level: 6 } });

    archive.on("data", (chunk) => chunks.push(chunk));
    archive.on("error", (err) => {
      throw err;
    });

    // Add documents to archive
    for (const pd of documentsToInclude) {
      const doc = pd.documents as Record<string, unknown>;
      if (!doc?.storage_path) continue;

      // Get file from Supabase storage
      const { data: fileData, error: fileError } = await supabase.storage
        .from("documents")
        .download(doc.storage_path as string);

      if (fileError || !fileData) {
        console.error(`Failed to download document ${doc.id}:`, fileError);
        continue;
      }

      // Create filename with Bates number if available
      const batesPrefix = pd.bates_number ? `${pd.bates_number}_` : "";
      const fileName = `${batesPrefix}${doc.original_name || doc.name}`;

      archive.append(Buffer.from(await fileData.arrayBuffer()), {
        name: `documents/${fileName}`,
      });
    }

    // Add privilege log if there are privileged documents
    const privilegedDocs = (production.production_documents || []).filter(
      (pd: Record<string, unknown>) => pd.is_privileged
    );

    if (privilegedDocs.length > 0) {
      const privilegeLog = generatePrivilegeLog(privilegedDocs);
      archive.append(privilegeLog, { name: "privilege_log.csv" });
    }

    // Add index/manifest
    const manifest = generateManifest(production, documentsToInclude);
    archive.append(manifest, { name: "index.csv" });

    // Add README
    const readme = generateReadme(production, documentsToInclude.length, part);
    archive.append(readme, { name: "README.txt" });

    await archive.finalize();

    // Combine chunks
    const buffer = Buffer.concat(chunks);

    // Generate filename
    const partSuffix = part !== undefined ? `_part${parseInt(part) + 1}` : "";
    const filename = `${production.name.replace(/[^a-zA-Z0-9]/g, "_")}${partSuffix}.zip`;

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": buffer.length.toString(),
      },
    });
  } catch (error) {
    console.error("Error downloading production:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to download production" },
      { status: 500 }
    );
  }
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

function generatePrivilegeLog(privilegedDocs: Record<string, unknown>[]): string {
  const headers = [
    "Bates Number",
    "Document Name",
    "Privilege Type",
    "Reason",
  ];
  const rows = [headers.join(",")];

  for (const pd of privilegedDocs) {
    const doc = pd.documents as Record<string, unknown>;
    rows.push([
      pd.bates_number || "",
      `"${((doc?.name as string) || "").replace(/"/g, '""')}"`,
      "Attorney-Client Privilege / Work Product",
      `"${((pd.privilege_reason as string) || "").replace(/"/g, '""')}"`,
    ].join(","));
  }

  return rows.join("\n");
}

function generateManifest(
  production: Record<string, unknown>,
  documents: Record<string, unknown>[]
): string {
  const headers = [
    "Bates Number",
    "Document Name",
    "Original Name",
    "File Size",
    "Type",
  ];
  const rows = [headers.join(",")];

  for (const pd of documents) {
    const doc = pd.documents as Record<string, unknown>;
    rows.push([
      (pd.bates_number as string) || "",
      `"${((doc?.name as string) || "").replace(/"/g, '""')}"`,
      `"${((doc?.original_name as string) || "").replace(/"/g, '""')}"`,
      (doc?.file_size as number) || 0,
      (doc?.mime_type as string) || "",
    ].join(","));
  }

  return rows.join("\n");
}

function generateReadme(
  production: Record<string, unknown>,
  documentCount: number,
  part?: number
): string {
  const cases = production.cases as Record<string, string>;
  return `PRODUCTION SET: ${production.name}
${"=".repeat(50)}

Case: ${cases?.name || "N/A"} (${cases?.case_number || "N/A"})
Production Date: ${production.produced_date ? new Date(production.produced_date as string).toLocaleDateString() : "N/A"}
Bates Range: ${production.bates_start || "N/A"} - ${production.bates_end || "N/A"}
${part !== undefined ? `Part: ${parseInt(String(part)) + 1}` : ""}

Documents Included: ${documentCount}

FILES:
- documents/ - Production documents
- index.csv - Document manifest
- privilege_log.csv - Privilege log (if applicable)
- README.txt - This file

Generated by DiscoverEase
${new Date().toLocaleString()}
`;
}
