import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Bell, ChevronRight, Flame } from "lucide-react";
import { GARDEN_MILESTONES, THEMES } from "@/config/themes";
import { getGreeting, todayISO } from "@/lib/utils";

export const dynamic = "force-dynamic";

const QUICK_ACCESS = [
  { href: "/devotional", icon: "📖", label: "Devotional", bg: "bg-rose-50 border-rose-100" },
  { href: "/plans", icon: "🗺️", label: "Plans", bg: "bg-amber-50 border-amber-100" },
  { href: "/prayer-wall", icon: "🙏", label: "Prayer Wall", bg: "bg-purple-50 border-purple-100" },
  { href: "/journal", icon: "📓", label: "Journal", bg: "bg-blue-50 border-blue-100" },
];

function getWeekStart() {
  const now = new Date();
  const day = now.getDay(); // 0=Sun
  const diff = day === 0 ? 6 : day - 1; // days since Monday
  const monday = new Date(now);
  monday.setDate(now.getDate() - diff);
  return monday.toISOString().split("T")[0];
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const weekStart = getWeekStart();

  const [profileRes, devotionalRes, summaryRes] = await Promise.all([
    supabase.from("user_profiles").select("*").eq("user_id", user.id).single(),
    supabase.from("devotionals")
      .select("id, title, is_completed, scripture_reference, scripture_text")
      .eq("user_id", user.id)
      .eq("date", todayISO())
      .maybeSingle(),
    supabase.from("weekly_summaries")
      .select("summary, devotionals_count, dominant_mood, week_start")
      .eq("user_id", user.id)
      .order("week_start", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const profile = profileRes.data;
  const devotional = devotionalRes.data;
  const summary = summaryRes.data;
  const firstName = profile?.display_name?.split(" ")[0] ?? "Friend";
  const streak = profile?.streak_current ?? 0;
  const currentMilestone = GARDEN_MILESTONES.find(m => m.stage === (profile?.garden_stage ?? "seed")) ?? GARDEN_MILESTONES[0];

  const MOOD_EMOJI: Record<string, string> = {
    rough: "😔", meh: "😕", okay: "😐", good: "🙂", great: "🥰",
  };

  return (
    <div className="flex flex-col gap-5 px-4 pt-10 pb-28 animate-fade-in">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">🌸</span>
          <span className="text-lg font-bold text-foreground">Bloom</span>
        </div>
        <Link href="/profile/reminders" className="w-10 h-10 rounded-full bg-card border border-border/60 flex items-center justify-center shadow-sm">
          <Bell className="h-5 w-5 text-muted-foreground" strokeWidth={1.8} />
        </Link>
      </div>

      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          {getGreeting()}, {firstName} 🌸
        </h1>
        <p className="text-muted-foreground text-sm mt-0.5">You are deeply loved.</p>
      </div>

      {/* Today's Verse */}
      <div className="verse-card">
        <p className="text-white/70 text-xs font-semibold uppercase tracking-wider mb-3">Today&apos;s Verse</p>
        {devotional ? (
          <>
            <p className="text-white font-semibold text-base leading-relaxed italic">
              &ldquo;{devotional.scripture_text.length > 120
                ? devotional.scripture_text.slice(0, 120) + "…"
                : devotional.scripture_text}&rdquo;
            </p>
            <p className="text-white/80 text-sm mt-2 font-medium">{devotional.scripture_reference}</p>
          </>
        ) : (
          <>
            <p className="text-white font-semibold text-base leading-relaxed italic">
              &ldquo;I can do all things through Christ who strengthens me.&rdquo;
            </p>
            <p className="text-white/80 text-sm mt-2 font-medium">Philippians 4:13</p>
          </>
        )}
      </div>

      {/* Streak card */}
      <div className="bloom-card">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="font-semibold text-sm text-foreground">Today&apos;s Plan</p>
            <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
              <Flame className="h-3 w-3 text-orange-400" />
              {streak > 0 ? `${streak}-day streak — keep going!` : "Start your streak today"}
            </p>
          </div>
          <Link href="/devotional" className="text-xs text-primary font-medium flex items-center gap-0.5">
            View <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="flex items-center gap-2">
          {["S", "M", "T", "W", "T", "F", "S"].map((day, i) => (
            <div key={i} className="flex flex-col items-center gap-1 flex-1">
              <div className={`w-full h-1.5 rounded-full ${i < streak % 7 ? "bg-primary" : "bg-muted"}`} />
              <span className="text-[10px] text-muted-foreground">{day}</span>
            </div>
          ))}
        </div>

        {devotional && !devotional.is_completed && (
          <Link href="/devotional" className="mt-3 flex items-center justify-center gap-2 w-full h-10 rounded-xl bg-primary/10 text-primary text-sm font-medium active:scale-[0.98] transition-transform">
            Continue today&apos;s devotional →
          </Link>
        )}
        {devotional?.is_completed && (
          <div className="mt-3 flex items-center justify-center gap-2 w-full h-10 rounded-xl bg-green-50 text-green-600 text-sm font-medium">
            ✓ Devotional complete!
          </div>
        )}
      </div>

      {/* Weekly summary (shown if a summary exists) */}
      {summary && (
        <div className="bloom-card space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Your Week in Review 🌿</p>
            {summary.dominant_mood && (
              <span className="text-lg" title={summary.dominant_mood}>
                {MOOD_EMOJI[summary.dominant_mood] ?? "🌸"}
              </span>
            )}
          </div>
          <p className="text-sm text-foreground leading-relaxed">{summary.summary}</p>
          <p className="text-xs text-muted-foreground">
            {summary.devotionals_count} devotional{summary.devotionals_count !== 1 ? "s" : ""} completed this week
          </p>
        </div>
      )}

      {/* Quick Access */}
      <div>
        <p className="font-semibold text-sm text-foreground mb-3">Quick Access</p>
        <div className="grid grid-cols-4 gap-3">
          {QUICK_ACCESS.map(({ href, icon, label, bg }) => (
            <Link key={href} href={href} className="flex flex-col items-center gap-2">
              <div className={`w-full aspect-square rounded-2xl border flex items-center justify-center text-2xl ${bg} active:scale-95 transition-transform`}>
                {icon}
              </div>
              <span className="text-[11px] text-muted-foreground font-medium text-center leading-tight">{label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Memory flashcards teaser */}
      <Link href="/memory" className="bloom-card flex items-center gap-4 active:scale-[0.99] transition-transform">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-100 to-yellow-50 flex items-center justify-center text-2xl flex-shrink-0">
          ✨
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-foreground">Scripture Memory</p>
          <p className="text-xs text-muted-foreground mt-0.5">Review today&apos;s verses</p>
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
      </Link>

      {/* Garden teaser */}
      <Link href="/garden" className="bloom-card flex items-center gap-4 active:scale-[0.99] transition-transform">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-100 to-purple-100 flex items-center justify-center text-2xl flex-shrink-0">
          {currentMilestone.emoji}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-foreground">{currentMilestone.label}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {profile?.devotionals_completed ?? 0} devotionals completed
          </p>
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
      </Link>

      {/* Bible Explorer teaser */}
      <Link href="/bible" className="bloom-card flex items-center gap-4 active:scale-[0.99] transition-transform">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-100 to-indigo-50 flex items-center justify-center text-2xl flex-shrink-0">
          📖
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-foreground">Bible Explorer</p>
          <p className="text-xs text-muted-foreground mt-0.5">Browse all 66 books</p>
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
      </Link>

    </div>
  );
}
