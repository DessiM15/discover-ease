import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getFirmId } from "@/lib/get-firm-id";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const firmId = await getFirmId();
    if (!firmId) {
      return NextResponse.json({ error: "Firm not found" }, { status: 400 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const caseId = formData.get("caseId") as string;
    const category = formData.get("category") as string;
    const description = formData.get("description") as string;
    const tags = formData.get("tags") as string;
    const autoBates = formData.get("autoBates") === "true";

    if (!file) {
      return NextResponse.json({ error: "File is required" }, { status: 400 });
    }

    if (!caseId) {
      return NextResponse.json({ error: "Case is required" }, { status: 400 });
    }

    // Get case to check for bates prefix
    const { data: caseData } = await supabase
      .from("cases")
      .select("bates_prefix, current_bates_number")
      .eq("id", caseId)
      .single();

    if (!caseData) {
      return NextResponse.json({ error: "Case not found" }, { status: 404 });
    }

    // Generate file path
    const fileExt = file.name.split(".").pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `${firmId}/${caseId}/${fileName}`;

    // Ensure documents bucket exists (this will fail gracefully if it already exists)
    const { error: bucketError } = await supabase.storage.createBucket("documents", {
      public: false,
      fileSizeLimit: 52428800, // 50MB
    });
    // Ignore error if bucket already exists
    if (bucketError && !bucketError.message.includes("already exists")) {
      console.error("Bucket creation error:", bucketError);
    }

    // Upload file to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("documents")
      .upload(filePath, file, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return NextResponse.json({ error: "Failed to upload file" }, { status: 500 });
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from("documents").getPublicUrl(filePath);

    // Calculate Bates numbers if auto-bates is enabled
    let batesStart: string | null = null;
    let batesEnd: string | null = null;
    let currentBatesNumber = caseData.current_bates_number || 0;

    if (autoBates && caseData.bates_prefix) {
      // Estimate pages (for PDFs, this would need actual parsing)
      // For now, we'll use a default or calculate from file size
      const estimatedPages = Math.max(1, Math.floor(file.size / 50000)); // Rough estimate
      const startNumber = currentBatesNumber + 1;
      const endNumber = currentBatesNumber + estimatedPages;

      batesStart = `${caseData.bates_prefix}-${String(startNumber).padStart(6, "0")}`;
      batesEnd = `${caseData.bates_prefix}-${String(endNumber).padStart(6, "0")}`;

      // Update case bates number
      await supabase
        .from("cases")
        .update({ current_bates_number: endNumber })
        .eq("id", caseId);
    }

    // Parse tags
    const tagsArray = tags ? tags.split(",").map((t) => t.trim()).filter(Boolean) : [];

    // Create document record
    const { data: document, error: docError } = await supabase
      .from("documents")
      .insert({
        firm_id: firmId,
        case_id: caseId,
        name: file.name,
        original_name: file.name,
        description: description || null,
        storage_path: filePath,
        file_size: file.size,
        mime_type: file.type,
        bates_start: batesStart,
        bates_end: batesEnd,
        category: category || null,
        tags: tagsArray.length > 0 ? tagsArray : null,
        status: "draft",
        uploaded_by_id: user.id,
      })
      .select()
      .single();

    if (docError) {
      console.error("Document creation error:", docError);
      // Try to clean up uploaded file
      await supabase.storage.from("documents").remove([filePath]);
      return NextResponse.json({ error: "Failed to create document record" }, { status: 500 });
    }

    return NextResponse.json({ document, publicUrl });
  } catch (error: any) {
    console.error("Error uploading document:", error);
    return NextResponse.json({ error: error.message || "Failed to upload document" }, { status: 500 });
  }
}

