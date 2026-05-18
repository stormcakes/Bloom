import { NextResponse } from "next/server";
import { anthropic } from "@ai-sdk/anthropic";
import { generateObject } from "ai";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const DevotionalSchema = z.object({
  title: z.string().describe("A compelling devotional title tied to the plan theme and day"),
  scripture_reference: z.string().describe("Book Chapter:Verse(s) e.g. John 3:16"),
  scripture_text: z.string().describe("The full scripture text"),
  reflection: z.string().describe("2-3 paragraphs of pastoral reflection"),
  simple_explanation: z.string().describe("1-2 sentences explaining this scripture in plain language"),
  real_life_application: z.string().describe("How this applies to the user's life right now"),
  prayer: z.string().describe("A 3-5 sentence personal prayer in first person"),
  journal_prompt: z.string().describe("One reflective question for honest self-examination"),
  action_step: z.string().describe("One small, specific, doable action step for today"),
});

// Derive a cache key from plan slug + day so we can store in the devotionals table
// without a dedicated plan_devotionals table. Format: plan:{slug}:{day}
function planDateKey(slug: string, day: number): string {
  return `plan:${slug}:${day}`;
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string; day: string }> }
) {
  const { slug, day: dayStr } = await params;
  const dayNum = parseInt(dayStr, 10);

  if (isNaN(dayNum) || dayNum < 1) {
    return NextResponse.json({ error: "Invalid day" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Fetch plan
  const { data: plan, error: planError } = await supabase
    .from("reading_plans")
    .select("*")
    .eq("slug", slug)
    .single();

  if (planError || !plan) {
    return NextResponse.json({ error: "Plan not found" }, { status: 404 });
  }

  if (dayNum > plan.duration_days) {
    return NextResponse.json({ error: "Day exceeds plan duration" }, { status: 400 });
  }

  // Verify user has joined this plan
  const { data: userPlan } = await supabase
    .from("user_reading_plans")
    .select("*")
    .eq("user_id", user.id)
    .eq("plan_id", plan.id)
    .maybeSingle();

  if (!userPlan) {
    return NextResponse.json({ error: "You have not joined this plan" }, { status: 403 });
  }

  // Check cache: we use the date field as "plan:{slug}:{day}" to avoid a new table
  const cacheKey = planDateKey(slug, dayNum);

  const { data: existing } = await supabase
    .from("devotionals")
    .select("*")
    .eq("user_id", user.id)
    .eq("date", cacheKey)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ data: existing });
  }

  // Fetch user profile for personalization
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("user_id", user.id)
    .single();

  const familiarity = profile?.bible_familiarity ?? "beginner";
  const displayName = profile?.display_name ?? "Friend";

  const simplicityMap: Record<string, string> = {
    never_read: "Use very simple language. Explain every term.",
    beginner: "Keep explanations clear and accessible.",
    some_knowledge: "You can reference familiar stories with light explanation.",
    regular_reader: "Assume familiarity with major stories. Go deeper.",
    deep_student: "Full theological depth welcome.",
  };

  const prompt = `Generate a complete devotional for Day ${dayNum} of a ${plan.duration_days}-day reading plan called "${plan.title}".

PLAN CONTEXT:
- Plan theme: ${plan.theme}
- Plan description: ${plan.description}
- Day: ${dayNum} of ${plan.duration_days}
- This devotional should feel like part of a coherent series — reference the plan's theme throughout.

USER PROFILE:
- Name: ${displayName}
- Bible familiarity: ${familiarity}
- Life season: ${profile?.life_season?.replace(/_/g, " ") ?? "growing deeper"}
- Tone: ${profile?.tone_preference?.replace(/_/g, " ") ?? "gentle encouraging"}
- Spiritual goals: ${profile?.emotional_goals?.map((g: string) => g.replace(/_/g, " ")).join(", ") ?? "closer to God"}

SCRIPTURE LEVEL: ${simplicityMap[familiarity] ?? simplicityMap.beginner}

Choose a scripture that naturally fits Day ${dayNum} of a journey on "${plan.theme}". If this is an early day (1-${Math.ceil(plan.duration_days * 0.3)}), start with foundational verses. Middle days should deepen the theme. Later days should bring resolution and application.

Return a devotional that feels like a natural continuation of this multi-day series.`;

  try {
    const { object } = await generateObject({
      model: anthropic("claude-sonnet-4-6"),
      schema: DevotionalSchema,
      system:
        "You are a biblically grounded devotional writer creating content for a structured reading plan. Always use real, well-known Bible verses — never fabricate references. Write with warmth, grace, and emotional intelligence. Center grace over performance. Ensure each day's content builds on the plan's theme in a coherent way.",
      prompt,
    });

    const { data: devotional, error } = await supabase
      .from("devotionals")
      .upsert(
        {
          user_id: user.id,
          date: cacheKey,
          theme: profile?.theme ?? "cozy",
          emotional_goal: profile?.emotional_goals?.[0] ?? null,
          is_completed: false,
          ...object,
        },
        { onConflict: "user_id,date" }
      )
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ data: devotional });
  } catch (err) {
    console.error(`[plans/${slug}/${dayNum}]`, err);
    return NextResponse.json(
      { error: "Failed to generate devotional" },
      { status: 500 }
    );
  }
}

// PATCH — mark day as complete and advance user's current_day
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ slug: string; day: string }> }
) {
  const { slug, day: dayStr } = await params;
  const dayNum = parseInt(dayStr, 10);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { devotional_id } = await request.json();

  // Mark devotional complete
  if (devotional_id) {
    await supabase
      .from("devotionals")
      .update({ is_completed: true, completed_at: new Date().toISOString() })
      .eq("id", devotional_id)
      .eq("user_id", user.id);
  }

  // Fetch plan
  const { data: plan } = await supabase
    .from("reading_plans")
    .select("id, duration_days")
    .eq("slug", slug)
    .single();

  if (!plan) {
    return NextResponse.json({ error: "Plan not found" }, { status: 404 });
  }

  // Advance user_reading_plans
  const nextDay = dayNum + 1;
  const isLastDay = dayNum >= plan.duration_days;

  const updatePayload: Record<string, unknown> = {
    current_day: Math.min(nextDay, plan.duration_days),
    last_completed_day: dayNum,
  };

  if (isLastDay) {
    updatePayload.completed_at = new Date().toISOString();
  }

  const { data: updatedPlan, error } = await supabase
    .from("user_reading_plans")
    .update(updatePayload)
    .eq("user_id", user.id)
    .eq("plan_id", plan.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: updatedPlan });
}
