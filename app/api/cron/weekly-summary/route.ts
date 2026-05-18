import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { anthropic } from "@ai-sdk/anthropic";
import { generateText } from "ai";

// Vercel cron: runs every Sunday at 8am UTC
// Add to vercel.json: { "crons": [{ "path": "/api/cron/weekly-summary", "schedule": "0 8 * * 0" }] }
export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function GET(request: Request) {
  // Verify cron secret to prevent unauthorized triggers
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createClient();

  // Get the week range (Mon–Sun)
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - 6);
  weekStart.setHours(0, 0, 0, 0);
  const weekStartISO = weekStart.toISOString().split("T")[0];

  // Get all users who completed at least one devotional this week
  const { data: activeUsers } = await supabase
    .from("devotionals")
    .select("user_id")
    .gte("date", weekStartISO)
    .eq("is_completed", true);

  if (!activeUsers?.length) return NextResponse.json({ ok: true, processed: 0 });

  const uniqueUserIds = [...new Set(activeUsers.map((r) => r.user_id))];
  let processed = 0;

  for (const userId of uniqueUserIds) {
    try {
      // Skip if summary already exists for this week
      const { data: existing } = await supabase
        .from("weekly_summaries")
        .select("id")
        .eq("user_id", userId)
        .eq("week_start", weekStartISO)
        .maybeSingle();

      if (existing) continue;

      // Fetch this week's devotionals
      const { data: devotionals } = await supabase
        .from("devotionals")
        .select("title, scripture_reference, is_completed, date")
        .eq("user_id", userId)
        .gte("date", weekStartISO)
        .order("date", { ascending: true });

      // Fetch this week's moods
      const { data: moods } = await supabase
        .from("mood_checkins")
        .select("mood, date")
        .eq("user_id", userId)
        .gte("date", weekStartISO);

      // Fetch user profile for personalization
      const { data: profile } = await supabase
        .from("user_profiles")
        .select("display_name, theme, tone_preference")
        .eq("user_id", userId)
        .single();

      const completedCount = devotionals?.filter((d) => d.is_completed).length ?? 0;
      const moodList = moods?.map((m) => m.mood) ?? [];
      const moodCounts = moodList.reduce<Record<string, number>>((acc, m) => {
        acc[m] = (acc[m] ?? 0) + 1;
        return acc;
      }, {});
      const dominantMood = Object.entries(moodCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

      const scriptures = devotionals
        ?.filter((d) => d.is_completed)
        .map((d) => `${d.title} (${d.scripture_reference})`)
        .join(", ") ?? "";

      const { text: summary } = await generateText({
        model: anthropic("claude-sonnet-4-6"),
        maxTokens: 300,
        system: "You are Bloom, a warm and encouraging Christian devotional companion. Write brief, personal, scripture-grounded weekly reflections. Be concise, warm, and specific.",
        prompt: `Write a 3-4 sentence personal weekly reflection for ${profile?.display_name ?? "a user"} who completed ${completedCount} devotional(s) this week.
${scriptures ? `Scriptures they explored: ${scriptures}.` : ""}
${dominantMood ? `Their overall mood this week was: ${dominantMood}.` : ""}
Acknowledge their consistency, reference something specific from their week, and offer a brief encouragement for the week ahead. End with a short blessing.`,
      });

      await supabase.from("weekly_summaries").insert({
        user_id: userId,
        week_start: weekStartISO,
        summary,
        devotionals_count: completedCount,
        dominant_mood: dominantMood,
      });

      processed++;
    } catch (err) {
      console.error(`[weekly-summary] Failed for user ${userId}:`, err);
    }
  }

  return NextResponse.json({ ok: true, processed });
}
