import { createClient } from "@/lib/supabase/server";
import { generateText } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { book } = await request.json();

  if (!book || typeof book !== "string") {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { text } = await generateText({
    model: anthropic("claude-sonnet-4-6"),
    maxTokens: 300,
    prompt: `You are a Bible guide for Bloom, a Christian devotional app. For the book of ${book}, give a warm 2-3 sentence introduction and suggest the best starting chapter for a new reader, with a brief reason why. Format: a short paragraph then 'Start at: Chapter X — [one sentence reason]'. Keep it encouraging and accessible.`,
  });

  return NextResponse.json({ suggestion: text });
}
