import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

export async function POST(request: NextRequest) {
  try {
    const { itemText } = await request.json();

    if (!itemText) {
      return NextResponse.json(
        { error: "Item text is required" },
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

    // Initialize OpenAI client only when the API is called, not at module load
    const openai = new OpenAI({
      apiKey: apiKey,
    });

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are a legal assistant helping draft discovery responses. Provide clear, professional, and legally appropriate responses to discovery requests.",
        },
        {
          role: "user",
          content: `Draft a response to this discovery request item:\n\n${itemText}\n\nProvide a professional legal response.`,
        },
      ],
      temperature: 0.7,
      max_tokens: 1000,
    });

    const draftResponse = completion.choices[0]?.message?.content || "";

    return NextResponse.json({ draftResponse });
  } catch (error: any) {
    console.error("Error generating AI response:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate response" },
      { status: 500 }
    );
  }
}

