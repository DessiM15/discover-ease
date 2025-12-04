import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

export async function POST(request: NextRequest) {
  try {
    const { itemText, caseContext, requestType } = await request.json();

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

    const openai = new OpenAI({
      apiKey: apiKey,
    });

    const systemPrompt = `You are a legal assistant helping draft discovery responses. Provide clear, professional, and legally appropriate responses to discovery requests. 
    
For ${requestType || "discovery requests"}, provide responses that are:
- Factually accurate and complete
- Legally appropriate
- Professional in tone
- Concise but thorough
- Include proper objections when applicable

If the request is objectionable, include appropriate objection language.`;

    const userPrompt = `Draft a response to this discovery request item${caseContext ? ` in the case: ${caseContext}` : ""}:

${itemText}

Provide a professional legal response. If objections are appropriate, include them.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: userPrompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 1500,
    });

    const draftResponse = completion.choices[0]?.message?.content || "";

    return NextResponse.json({ draftResponse });
  } catch (error: any) {
    console.error("Error generating discovery response:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate response" },
      { status: 500 }
    );
  }
}

