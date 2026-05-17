import { NextResponse } from "next/server";
import { anthropic } from "@ai-sdk/anthropic";
import { generateObject } from "ai";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const VerseSchema = z.object({
  reference: z.string().describe("The exact Bible reference e.g. John 3:16"),
  text: z.string().describe("The full scripture text (NIV preferred)"),
  context: z.string().describe("1-2 sentences of historical/literary context for this passage"),
  explanation: z.string().describe("2-3 sentences explaining what this means and why it matters for everyday life"),
});

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { query } = await request.json();
  if (!query?.trim()) return NextResponse.json({ error: "Query required" }, { status: 400 });

  try {
    const { object } = await generateObject({
      model: anthropic("claude-sonnet-4-6"),
      schema: VerseSchema,
      system:
        "You are a biblical reference assistant. Always use real, accurate Bible verses — never fabricate. If given a topic, find the most relevant and well-known verse. Use NIV translation by default.",
      prompt: `Look up this Bible reference or topic and return the verse with explanation: "${query}"`,
    });

    return NextResponse.json(object);
  } catch (err) {
    console.error("[bible/lookup]", err);
    return NextResponse.json({ error: "Lookup failed" }, { status: 500 });
  }
}
