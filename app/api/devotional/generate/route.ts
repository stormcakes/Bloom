import { NextResponse } from "next/server";
import { anthropic } from "@ai-sdk/anthropic";
import { generateObject } from "ai";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { buildDevotionalPrompt } from "@/lib/prompts/system-prompt";
import { todayISO } from "@/lib/utils";

const DevotionalSchema = z.object({
  title: z.string().describe("A compelling, personal devotional title"),
  scripture_reference: z.string().describe("Book Chapter:Verse(s) e.g. John 3:16"),
  scripture_text: z.string().describe("The full scripture text"),
  reflection: z.string().describe("2-3 paragraphs of pastoral reflection"),
  simple_explanation: z.string().describe("1-2 sentences explaining this scripture in plain language"),
  real_life_application: z.string().describe("How this applies to the user's life right now"),
  prayer: z.string().describe("A 3-5 sentence personal prayer in first person"),
  journal_prompt: z.string().describe("One reflective question for honest self-examination"),
  action_step: z.string().describe("One small, specific, doable action step for today"),
});

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { date = todayISO(), focusGoal } = body;

  // Return cached devotional if it already exists for today
  const { data: existing } = await supabase
    .from("devotionals")
    .select("*")
    .eq("user_id", user.id)
    .eq("date", date)
    .single();

  if (existing) return NextResponse.json({ data: existing });

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (!profile) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

  const prompt = buildDevotionalPrompt(profile, date, focusGoal);

  try {
    const { object } = await generateObject({
      model: anthropic("claude-sonnet-4-6"),
      schema: DevotionalSchema,
      system:
        "You are a biblically grounded devotional writer. Always use real, well-known Bible verses — never fabricate references. Write with warmth, grace, and emotional intelligence. Center grace over performance.",
      prompt,
    });

    const { data: devotional, error } = await supabase
      .from("devotionals")
      .upsert(
        {
          user_id: user.id,
          date,
          theme: profile.theme,
          emotional_goal: profile.emotional_goals?.[0] ?? null,
          ...object,
        },
        { onConflict: "user_id,date" }
      )
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ data: devotional });
  } catch (err) {
    console.error("[devotional/generate]", err);
    return NextResponse.json({ error: "Failed to generate devotional" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { devotional_id } = await request.json();

  const { data, error } = await supabase
    .from("devotionals")
    .update({ is_completed: true, completed_at: new Date().toISOString() })
    .eq("id", devotional_id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Increment devotionals_completed on profile
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("devotionals_completed, streak_current, streak_longest, last_active_date")
    .eq("user_id", user.id)
    .single();

  let newStreak: number | null = null;

  if (profile) {
    const today = todayISO();
    const lastActive = profile.last_active_date;
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split("T")[0];

    newStreak =
      lastActive === yesterdayStr
        ? profile.streak_current + 1
        : lastActive === today
        ? profile.streak_current
        : 1;

    await supabase
      .from("user_profiles")
      .update({
        devotionals_completed: (profile.devotionals_completed ?? 0) + 1,
        streak_current: newStreak,
        streak_longest: Math.max(profile.streak_longest ?? 0, newStreak ?? 0),
        last_active_date: today,
      })
      .eq("user_id", user.id);
  }

  return NextResponse.json({ data, streak: newStreak });
}
