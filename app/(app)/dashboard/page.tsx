import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Bell, ChevronRight, Flame, Zap } from "lucide-react";
import { GARDEN_MILESTONES, THEMES } from "@/config/themes";
import { getGreeting, todayISO } from "@/lib/utils";
import { AnimatedVerseCard } from "@/components/AnimatedVerseCard";

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
  const isGamer = profile?.theme === "gamer";

  // XP/level derived from devotionals_completed — no new DB columns needed
  const xpPerDevo = 120;
  const xpPerLevel = 250;
  const totalXP = (profile?.devotionals_completed ?? 0) * xpPerDevo;
  const level = Math.floor(totalXP / xpPerLevel) + 1;
  const xpIntoLevel = totalXP % xpPerLevel;
  const xpPct = Math.round((xpIntoLevel / xpPerLevel) * 100);

  const MOOD_EMOJI: Record<string, string> = {
    rough: "😔", meh: "😕", okay: "😐", good: "🙂", great: "🥰",
  };

  return (
    <div className="flex flex-col gap-5 px-4 pt-10 pb-28">

      {/* Header */}
      <div className="flex items-center justify-between animate-fade-in stagger-1">
        <div className="flex items-center gap-2">
          <span className="text-xl">{isGamer ? "⚔️" : "🌸"}</span>
          <span className={`text-lg font-bold ${isGamer ? "text-purple-300" : "text-foreground"}`} style={isGamer ? { textShadow: "0 0 10px rgba(139,92,246,0.6)" } : {}}>
            {isGamer ? "BLOOM.GG" : "Bloom"}
          </span>
        </div>
        <Link href="/profile/reminders" className="w-10 h-10 rounded-full bg-card border border-border/60 flex items-center justify-center shadow-sm active:scale-90 transition-transform">
          <Bell className="h-5 w-5 text-muted-foreground" strokeWidth={1.8} />
        </Link>
      </div>

      {/* Greeting */}
      <div className={`animate-fade-in stagger-2 ${isGamer ? "gamer-greeting-bar pl-3" : ""}`}>
        <h1 className="text-2xl font-bold text-foreground">
          {isGamer ? `WELCOME BACK, ${firstName.toUpperCase()}` : `${getGreeting()}, ${firstName} 🌸`}
        </h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          {isGamer ? `LV. ${level} Seeker — keep grinding` : "You are deeply loved."}
        </p>
      </div>

      {/* Today's Verse — animated card */}
      <div className="animate-fade-in stagger-3">
        <AnimatedVerseCard
          text={devotional?.scripture_text ?? "I can do all things through Christ who strengthens me."}
          reference={devotional?.scripture_reference ?? "Philippians 4:13"}
        />
      </div>

      {/* Streak / Today's Plan card */}
      <div className="bloom-card animate-fade-in stagger-4">
        {isGamer ? (
          /* Gamer plan card — cross icon + XP integrated, matching reference */
          <div className="space-y-3">
            <div className="flex items-start gap-4">
              {/* Glowing cross */}
              <div className="flex-shrink-0 w-14 h-14 flex items-center justify-center relative">
                <div className="absolute inset-0 rounded-xl bg-purple-500/20 blur-md" />
                <svg viewBox="0 0 40 40" className="relative w-10 h-10" fill="none">
                  <rect x="16" y="4" width="8" height="32" rx="2" fill="url(#crossGrad)" />
                  <rect x="4" y="13" width="32" height="8" rx="2" fill="url(#crossGrad)" />
                  <defs>
                    <linearGradient id="crossGrad" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#c084fc" />
                      <stop offset="100%" stopColor="#7c3aed" />
                    </linearGradient>
                  </defs>
                  <filter id="glow">
                    <feGaussianBlur stdDeviation="2" result="blur" />
                    <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                  </filter>
                </svg>
              </div>
              {/* XP + streak info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="gamer-section-label text-xs font-bold">TODAY&apos;S PLAN</p>
                  <Link href="/devotional" className="text-xs text-cyan-400 font-bold flex items-center gap-0.5">
                    View <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                  <Flame className="h-3 w-3 text-orange-400" />
                  {streak > 0 ? `${streak}-day streak — keep going!` : "Start your streak today"}
                </p>
                <p className="text-cyan-300 font-bold text-lg mt-1 leading-none">
                  {xpIntoLevel} XP <span className="text-white/40 font-normal text-sm">/ {xpPerLevel} XP</span>
                </p>
                <div className="xp-bar-track mt-2">
                  <div className="xp-bar-fill" style={{ width: `${xpPct}%` }} />
                </div>
              </div>
            </div>

            {/* Day pills */}
            <div className="flex items-center gap-1.5">
              {["S", "M", "T", "W", "T", "F", "S"].map((day, i) => {
                const active = i < streak % 7;
                const isToday = i === new Date().getDay();
                return (
                  <div
                    key={i}
                    className={`flex-1 h-8 rounded-lg flex items-center justify-center text-[11px] font-bold transition-all duration-300 ${
                      isToday
                        ? "bg-purple-500 text-white shadow-[0_0_12px_rgba(139,92,246,0.6)]"
                        : active
                        ? "bg-purple-500/30 text-purple-300 border border-purple-500/40"
                        : "bg-white/5 text-white/30 border border-white/10"
                    }`}
                  >
                    {day}
                  </div>
                );
              })}
            </div>

            {devotional && !devotional.is_completed && (
              <Link href="/devotional" className="flex items-center justify-center gap-2 w-full h-10 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/40 text-sm font-bold tracking-wide active:scale-[0.97] transition-transform">
                ► START MISSION
              </Link>
            )}
            {devotional?.is_completed && (
              <div className="flex items-center justify-center gap-2 w-full h-10 rounded-xl bg-cyan-400/10 text-cyan-400 border border-cyan-400/30 text-sm font-bold tracking-wide">
                ✓ MISSION COMPLETE · +120 XP
              </div>
            )}
          </div>
        ) : (
          /* Default plan card */
          <>
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="font-semibold text-sm text-foreground">Today&apos;s Plan</p>
                <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                  <Flame className="h-3 w-3 text-orange-400 animate-flame" />
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
                  <div className={`w-full h-1.5 rounded-full transition-all duration-500 ${i < streak % 7 ? "bg-primary" : "bg-muted"}`} />
                  <span className="text-[10px] text-muted-foreground">{day}</span>
                </div>
              ))}
            </div>
            {devotional && !devotional.is_completed && (
              <Link href="/devotional" className="mt-3 flex items-center justify-center gap-2 w-full h-10 rounded-xl bg-primary/10 text-primary text-sm font-medium active:scale-[0.97] transition-transform">
                Continue today&apos;s devotional →
              </Link>
            )}
            {devotional?.is_completed && (
              <div className="mt-3 flex items-center justify-center gap-2 w-full h-10 rounded-xl bg-green-50 text-green-600 text-sm font-medium">
                ✓ Devotional complete!
              </div>
            )}
          </>
        )}
      </div>

      {/* Weekly summary */}
      {summary && (
        <div className="bloom-card space-y-3 animate-fade-in stagger-5">
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
      <div className="animate-fade-in stagger-5">
        <p className={`font-semibold text-sm mb-3 ${isGamer ? "gamer-section-label" : "text-foreground"}`}>
          {isGamer ? "QUICK ACCESS" : "Quick Access"}
        </p>
        {isGamer ? (
          <div className="grid grid-cols-4 gap-2">
            {QUICK_ACCESS.map(({ href, icon, label }) => (
              <Link key={href} href={href} className="flex flex-col items-center gap-2 active:scale-90 transition-transform duration-100">
                <div className="gamer-quick-card w-full aspect-square flex flex-col items-center justify-center gap-1 relative overflow-hidden">
                  {/* Corner accent */}
                  <div className="absolute top-0 left-0 w-2.5 h-2.5 border-t border-l border-cyan-400/40" />
                  <div className="absolute bottom-0 right-0 w-2.5 h-2.5 border-b border-r border-purple-400/40" />
                  <div className="gamer-icon-hex w-11 h-11 flex items-center justify-center text-2xl">
                    {icon}
                  </div>
                </div>
                <span className="text-[9px] text-cyan-300/70 font-bold tracking-widest uppercase text-center leading-tight">
                  {label}
                </span>
              </Link>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-3">
            {QUICK_ACCESS.map(({ href, icon, label, bg }) => (
              <Link key={href} href={href} className="flex flex-col items-center gap-2">
                <div className={`w-full aspect-square rounded-2xl border flex items-center justify-center text-2xl ${bg} active:scale-90 transition-transform duration-100`}>
                  {icon}
                </div>
                <span className="text-[11px] text-muted-foreground font-medium text-center leading-tight">{label}</span>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Memory flashcards teaser */}
      <Link href="/memory" className="bloom-card flex items-center gap-4 active:scale-[0.97] transition-transform duration-100 animate-fade-in stagger-6">
        <div className={`w-12 h-12 flex items-center justify-center text-2xl flex-shrink-0 ${isGamer ? "gamer-icon-hex" : "rounded-2xl bg-gradient-to-br from-amber-100 to-yellow-50"}`}>
          {isGamer ? "⚡" : "✨"}
        </div>
        <div className="flex-1 min-w-0">
          <p className={`font-semibold text-sm ${isGamer ? "text-white" : "text-foreground"}`}>
            {isGamer ? "MEMORY VAULT" : "Scripture Memory"}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {isGamer ? "Review your saved verses" : "Review today's verses"}
          </p>
        </div>
        {isGamer ? <span className="lv-badge text-[10px]">+50 XP</span> : <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />}
      </Link>

      {/* Garden / Achievement teaser */}
      <Link href="/garden" className="bloom-card flex items-center gap-4 active:scale-[0.97] transition-transform duration-100 animate-fade-in stagger-7">
        <div className={`w-12 h-12 flex items-center justify-center text-2xl flex-shrink-0 ${isGamer ? "gamer-icon-hex" : "rounded-2xl bg-gradient-to-br from-rose-100 to-purple-100"}`}>
          {isGamer ? "🏆" : currentMilestone.emoji}
        </div>
        <div className="flex-1 min-w-0">
          <p className={`font-semibold text-sm ${isGamer ? "text-white" : "text-foreground"}`}>
            {isGamer ? "ACHIEVEMENTS" : currentMilestone.label}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {isGamer ? `LV. ${level} Seeker · ${profile?.devotionals_completed ?? 0} missions done` : `${profile?.devotionals_completed ?? 0} devotionals completed`}
          </p>
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
      </Link>

      {/* Bible Explorer teaser */}
      <Link href="/bible" className="bloom-card flex items-center gap-4 active:scale-[0.97] transition-transform duration-100 animate-fade-in stagger-7">
        <div className={`w-12 h-12 flex items-center justify-center text-2xl flex-shrink-0 ${isGamer ? "gamer-icon-hex" : "rounded-2xl bg-gradient-to-br from-blue-100 to-indigo-50"}`}>
          📖
        </div>
        <div className="flex-1 min-w-0">
          <p className={`font-semibold text-sm ${isGamer ? "text-white" : "text-foreground"}`}>
            {isGamer ? "SCRIPTURE DATABASE" : "Bible Explorer"}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">Browse all 66 books</p>
        </div>
        {isGamer ? <span className="lv-badge text-[10px]">66 BOOKS</span> : <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />}
      </Link>

    </div>
  );
}
