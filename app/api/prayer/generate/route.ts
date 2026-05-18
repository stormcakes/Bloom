import { NextResponse } from "next/server";
import { anthropic } from "@ai-sdk/anthropic";
import { generateText } from "ai";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { situation } = body as { situation: string };

  if (!situation?.trim()) {
    return NextResponse.json({ error: "Situation is required" }, { status: 400 });
  }

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("display_name, tone_preference, theme")
    .eq("user_id", user.id)
    .single();

  const name = profile?.display_name ?? "Friend";
  const tone = profile?.tone_preference ?? "gentle_encouraging";

  const toneMap: Record<string, string> = {
    gentle_encouraging: "warm, gentle, and encouraging",
    direct_firm: "sincere, direct, and grounded in faith",
    conversational_casual: "conversational and heartfelt",
    poetic_reflective: "poetic and deeply reflective",
    teaching_educational: "thoughtful and scripturally rooted",
  };

  const toneDescription = toneMap[tone] ?? "warm and personal";

  const prompt = `Write a personal prayer for ${name} about: "${situation.trim()}".

The prayer should:
- Be written in first person ("Lord, I come to you today…" or "Father, I bring before you…")
- Be exactly 4-6 sentences long
- Feel personal, authentic, and specific to the situation described
- Have a ${toneDescription} tone
- Begin with an address to God (Lord, Father, Heavenly Father, etc.)
- End with trust or surrender (e.g., "In Jesus' name, Amen" or "I trust you with this, Amen")
- Include acknowledgment of God's character or a brief scripture-rooted truth where natural

Return only the prayer text itself — no title, no explanation, no quotes around it.`;

  try {
    const { text } = await generateText({
      model: anthropic("claude-sonnet-4-6"),
      system:
        "You are a compassionate prayer writer helping Christians pray with authenticity and faith. You write personal, first-person prayers that feel genuine, not generic. Every prayer should feel like it was written for exactly this person in exactly this moment.",
      prompt,
      maxTokens: 250,
    });

    return NextResponse.json({ prayer: text.trim() });
  } catch (err) {
    console.error("[prayer/generate]", err);
    return NextResponse.json({ error: "Failed to generate prayer" }, { status: 500 });
  }
}
