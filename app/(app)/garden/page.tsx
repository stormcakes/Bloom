import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { GARDEN_MILESTONES } from "@/config/themes";
import { cn } from "@/lib/utils";
import MoodChart from "@/components/MoodChart";

export const dynamic = "force-dynamic";

export default async function GardenPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("display_name, streak_current, streak_longest, devotionals_completed, garden_stage")
    .eq("user_id", user.id)
    .single();

  // Fetch last 30 days of mood check-ins
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);
  const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split("T")[0];

  const { data: moodCheckins } = await supabase
    .from("mood_checkins")
    .select("date, mood")
    .eq("user_id", user.id)
    .gte("date", thirtyDaysAgoStr)
    .order("date", { ascending: true });

  const moodEntries = (moodCheckins ?? []).map((c) => ({
    date: c.date as string,
    mood: c.mood as string,
  }));

  const completed = profile?.devotionals_completed ?? 0;
  const streak = profile?.streak_current ?? 0;
  const currentStageIndex = GARDEN_MILESTONES.findIndex(m => m.stage === (profile?.garden_stage ?? "seed"));
  const currentMilestone = GARDEN_MILESTONES[currentStageIndex] ?? GARDEN_MILESTONES[0];
  const nextMilestone = GARDEN_MILESTONES[currentStageIndex + 1];
  const nextProgress = nextMilestone
    ? Math.min(Math.round((completed / nextMilestone.devotionalsRequired) * 100), 100)
    : 100;

  return (
    <div className="flex flex-col min-h-screen px-4 pt-10 pb-28 gap-6 animate-fade-in">

      {/* Hero streak card */}
      <div
        className="rounded-3xl p-6 text-center text-white space-y-3 relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #5C3D8F 0%, #7B52AB 40%, #9B6EC7 100%)" }}
      >
        {/* Glow circles */}
        <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-white/10 blur-xl" />
        <div className="absolute -bottom-6 -left-6 w-24 h-24 rounded-full bg-purple-300/20 blur-lg" />

        <p className="text-white/80 font-medium text-sm relative">You&apos;re Growing! 🌸</p>
        <p className="text-white/70 text-xs relative">Keep building your faith every day.</p>

        {/* Flower pot illustration */}
        <div className="relative flex justify-center py-2">
          <div className="relative">
            {/* Glow effect */}
            <div className="absolute inset-0 bg-pink-300/30 rounded-full blur-2xl scale-150" />
            <div className="relative text-center space-y-0">
              <div className="text-6xl animate-bloom-pulse">{currentMilestone.emoji}</div>
              <div className="text-2xl">🪴</div>
            </div>
          </div>
        </div>

        {/* Streak number */}
        <div>
          <p className="text-6xl font-bold text-white leading-none">{streak}</p>
          <p className="text-white/80 text-sm font-medium mt-1">Day Streak</p>
        </div>

        <p className="text-white/90 text-sm font-medium relative">
          Keep it up! God is so proud of you! ⭐
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { value: completed, label: "Completed", emoji: "📖" },
          { value: streak, label: "Current Streak", emoji: "🔥" },
          { value: profile?.streak_longest ?? 0, label: "Best Streak", emoji: "⭐" },
        ].map(({ value, label, emoji }) => (
          <div key={label} className="bloom-card text-center py-4 space-y-1">
            <p className="text-xl">{emoji}</p>
            <p className="text-2xl font-bold text-foreground">{value}</p>
            <p className="text-[11px] text-muted-foreground leading-tight">{label}</p>
          </div>
        ))}
      </div>

      {/* Progress to next */}
      {nextMilestone && (
        <div className="bloom-card space-y-4">
          <div className="flex items-center justify-between">
            <p className="font-semibold text-sm text-foreground">Growing toward…</p>
            <span className="text-xs text-muted-foreground">{completed}/{nextMilestone.devotionalsRequired}</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-3xl">{nextMilestone.emoji}</span>
            <div className="flex-1 space-y-1.5">
              <p className="font-semibold text-sm text-foreground">{nextMilestone.label}</p>
              <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary to-primary/70 rounded-full transition-all duration-700"
                  style={{ width: `${nextProgress}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {nextMilestone.devotionalsRequired - completed} more devotionals
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Growth Journey */}
      <div>
        <p className="font-semibold text-sm text-foreground mb-3">Your Growth Journey</p>
        <div className="space-y-2">
          {GARDEN_MILESTONES.map((milestone) => {
            const achieved = completed >= milestone.devotionalsRequired;
            const isCurrent = milestone.stage === (profile?.garden_stage ?? "seed");

            return (
              <div
                key={milestone.stage}
                className={cn(
                  "flex items-center gap-4 p-4 rounded-2xl border transition-all",
                  isCurrent && "border-primary/40 bg-primary/5",
                  achieved && !isCurrent && "border-border/50 bg-card",
                  !achieved && "border-dashed border-border/30 opacity-50 bg-transparent"
                )}
              >
                <span className={cn("text-2xl", !achieved && "grayscale")}>{milestone.emoji}</span>
                <div className="flex-1">
                  <p className={cn("font-semibold text-sm", !achieved && "text-muted-foreground")}>
                    {milestone.label}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {milestone.devotionalsRequired === 0 ? "Starting point" : `${milestone.devotionalsRequired} devotionals`}
                  </p>
                </div>
                {achieved && (
                  <span className="text-xs font-semibold text-primary bg-primary/10 px-2.5 py-1 rounded-full">
                    ✓ Done
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Emotional Journey */}
      <div>
        <p className="font-semibold text-sm text-foreground mb-3">Your Emotional Journey</p>
        <MoodChart entries={moodEntries} />
      </div>

      {/* Scripture */}
      <div className="bloom-card text-center py-5 bg-primary/5 border-primary/20">
        <p className="text-sm italic text-muted-foreground leading-relaxed">
          &ldquo;He who began a good work in you will carry it on to completion.&rdquo;
          <br />
          <span className="font-semibold text-foreground not-italic">Philippians 1:6</span>
        </p>
      </div>
    </div>
  );
}
