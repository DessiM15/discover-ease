import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import OpenAI from "openai";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get document
    const { data: document, error: docError } = await supabase
      .from("documents")
      .select("*")
      .eq("id", id)
      .single();

    if (docError || !document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    // Check if summary already exists
    if (document.ai_summary) {
      return NextResponse.json({ summary: document.ai_summary });
    }

    // Get document content (OCR text or description)
    let documentContent = document.ocr_text || document.description || document.name;

    // If no OCR text, try to get file content (for text files)
    if (!document.ocr_text && document.mime_type?.startsWith("text/")) {
      try {
        const { data: fileData } = await supabase.storage
          .from("documents")
          .download(document.storage_path);

        if (fileData) {
          documentContent = await fileData.text();
        }
      } catch (error) {
        console.error("Error reading file:", error);
      }
    }

    if (!documentContent) {
      return NextResponse.json(
        { error: "No content available for summarization" },
        { status: 400 }
      );
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "OpenAI API key is not configured" },
        { status: 500 }
      );
    }

    const openai = new OpenAI({
      apiKey: apiKey,
    });

    // Generate summary
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content:
            "You are a legal assistant helping summarize legal documents. Provide a concise, professional summary that highlights key facts, dates, parties, and important information.",
        },
        {
          role: "user",
          content: `Summarize this legal document:\n\n${documentContent.substring(0, 15000)}`,
        },
      ],
      temperature: 0.7,
      max_tokens: 1000,
    });

    const summary = completion.choices[0]?.message?.content || "";

    // Save summary to document
    const { error: updateError } = await supabase
      .from("documents")
      .update({ ai_summary: summary })
      .eq("id", id);

    if (updateError) {
      console.error("Error saving summary:", updateError);
    }

    return NextResponse.json({ summary });
  } catch (error: any) {
    console.error("Error generating summary:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate summary" },
      { status: 500 }
    );
  }
}

