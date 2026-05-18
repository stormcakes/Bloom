import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, ChevronRight, CheckCircle, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

// --- Date helpers (no libraries) ---

function todayLocalISO(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function parseYearMonth(raw: string | undefined): { year: number; month: number } {
  if (raw && /^\d{4}-\d{2}$/.test(raw)) {
    const [y, m] = raw.split("-").map(Number);
    if (m >= 1 && m <= 12) return { year: y, month: m - 1 };
  }
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() };
}

function isoForDay(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function prevMonthParam(year: number, month: number): string {
  const d = new Date(year, month - 1, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function nextMonthParam(year: number, month: number): string {
  const d = new Date(year, month + 1, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function formatMonthTitle(year: number, month: number): string {
  return new Date(year, month, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

function formatNiceDate(iso: string): string {
  // Parse as local date to avoid timezone shifts
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

// Build calendar grid: array of weeks, each week is 7 cells (Mon–Sun).
// Cells outside the month have date === null.
function buildCalendarGrid(year: number, month: number): (string | null)[][] {
  const firstDay = new Date(year, month, 1).getDay(); // 0=Sun
  // Convert to Mon-first index: Mon=0 … Sun=6
  const startOffset = firstDay === 0 ? 6 : firstDay - 1;
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: (string | null)[] = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(isoForDay(year, month, d));
  // Pad to complete last week
  while (cells.length % 7 !== 0) cells.push(null);

  const weeks: (string | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}

// Compute longest streak from a set of completed ISO dates
function computeLongestStreak(completedDates: Set<string>): number {
  if (completedDates.size === 0) return 0;
  const sorted = Array.from(completedDates).sort();
  let longest = 1;
  let current = 1;
  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1] + "T12:00:00");
    const curr = new Date(sorted[i] + "T12:00:00");
    const diff = (curr.getTime() - prev.getTime()) / 86400000;
    if (diff === 1) {
      current++;
      longest = Math.max(longest, current);
    } else {
      current = 1;
    }
  }
  return longest;
}

// --- Page ---

interface PageProps {
  searchParams: Promise<{ month?: string }>;
}

export default async function DevotionalHistoryPage({ searchParams }: PageProps) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const params = await searchParams;
  const { year, month } = parseYearMonth(params.month);

  // Fetch profile for streak stats
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("streak_current, devotionals_completed")
    .eq("user_id", user.id)
    .single();

  // Fetch last 60 devotionals (covers ~2 months for calendar + list)
  const { data: devotionals } = await supabase
    .from("devotionals")
    .select("id, date, title, scripture_reference, is_completed")
    .eq("user_id", user.id)
    .order("date", { ascending: false })
    .limit(60);

  const today = todayLocalISO();
  const allDevotionals = devotionals ?? [];

  // Build lookup maps
  const devotionalByDate = new Map<string, typeof allDevotionals[0]>();
  const completedDates = new Set<string>();
  for (const d of allDevotionals) {
    devotionalByDate.set(d.date, d);
    if (d.is_completed) completedDates.add(d.date);
  }

  const longestStreak = computeLongestStreak(completedDates);
  const currentStreak = profile?.streak_current ?? 0;
  const totalCompleted = profile?.devotionals_completed ?? 0;

  // Calendar grid
  const weeks = buildCalendarGrid(year, month);
  const DAY_HEADERS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  // Past devotionals list (last 30, most recent first, exclude today+future)
  const pastDevotionals = allDevotionals
    .filter((d) => d.date < today)
    .slice(0, 30);

  const prevParam = prevMonthParam(year, month);
  const nextParam = nextMonthParam(year, month);
  const currentMonthParam = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`;
  const isCurrentMonth = `${year}-${String(month + 1).padStart(2, "0")}` === currentMonthParam;

  return (
    <div className="flex flex-col min-h-screen px-4 pt-10 pb-28 gap-6 animate-fade-in">

      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard"
          className="w-9 h-9 rounded-full border border-border/60 bg-card flex items-center justify-center shadow-sm flex-shrink-0 active:scale-95 transition-transform"
        >
          <ChevronLeft className="h-4 w-4 text-muted-foreground" strokeWidth={2} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Your Journey 📅</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Track your devotional history</p>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bloom-card flex flex-col items-center gap-1 py-4">
          <span className="text-2xl">🔥</span>
          <span className="text-xl font-bold text-foreground">{currentStreak}</span>
          <span className="text-[11px] text-muted-foreground text-center leading-tight">Current Streak</span>
        </div>
        <div className="bloom-card flex flex-col items-center gap-1 py-4">
          <span className="text-2xl">📖</span>
          <span className="text-xl font-bold text-foreground">{totalCompleted}</span>
          <span className="text-[11px] text-muted-foreground text-center leading-tight">Total Completed</span>
        </div>
        <div className="bloom-card flex flex-col items-center gap-1 py-4">
          <span className="text-2xl">🏆</span>
          <span className="text-xl font-bold text-foreground">{longestStreak}</span>
          <span className="text-[11px] text-muted-foreground text-center leading-tight">Longest Streak</span>
        </div>
      </div>

      {/* Calendar */}
      <div className="bloom-card space-y-4">
        {/* Month nav */}
        <div className="flex items-center justify-between">
          <Link
            href={`/devotional/history?month=${prevParam}`}
            className="w-8 h-8 rounded-full border border-border/60 flex items-center justify-center active:scale-95 transition-transform"
          >
            <ChevronLeft className="h-4 w-4 text-muted-foreground" strokeWidth={2} />
          </Link>
          <p className="font-semibold text-sm text-foreground">{formatMonthTitle(year, month)}</p>
          <Link
            href={isCurrentMonth ? `/devotional/history` : `/devotional/history?month=${nextParam}`}
            className={cn(
              "w-8 h-8 rounded-full border border-border/60 flex items-center justify-center active:scale-95 transition-transform",
              isCurrentMonth && "opacity-30 pointer-events-none"
            )}
            aria-disabled={isCurrentMonth}
          >
            <ChevronRight className="h-4 w-4 text-muted-foreground" strokeWidth={2} />
          </Link>
        </div>

        {/* Day headers Mon–Sun */}
        <div className="grid grid-cols-7 gap-1">
          {DAY_HEADERS.map((h) => (
            <div key={h} className="text-center text-[11px] font-semibold text-muted-foreground py-1">
              {h}
            </div>
          ))}
        </div>

        {/* Weeks */}
        <div className="space-y-1">
          {weeks.map((week, wi) => (
            <div key={wi} className="grid grid-cols-7 gap-1">
              {week.map((iso, di) => {
                if (!iso) {
                  // Outside month
                  return <div key={`empty-${wi}-${di}`} className="aspect-square" />;
                }

                const isFuture = iso > today;
                const isToday = iso === today;
                const devotional = devotionalByDate.get(iso);
                const isCompleted = devotional?.is_completed ?? false;
                const hasDevotional = !!devotional;
                const dayNum = parseInt(iso.split("-")[2], 10);

                return (
                  <div
                    key={iso}
                    className="aspect-square flex items-center justify-center"
                  >
                    {isFuture ? (
                      // Future: very faint dot or day number
                      <div className="w-7 h-7 rounded-full flex items-center justify-center">
                        <span className="text-[11px] text-muted-foreground/30 font-medium">{dayNum}</span>
                      </div>
                    ) : isCompleted ? (
                      // Completed: filled primary circle with checkmark
                      <div className={cn(
                        "w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold",
                        "bg-primary text-primary-foreground",
                        isToday && "ring-2 ring-primary ring-offset-1"
                      )}>
                        ✓
                      </div>
                    ) : hasDevotional ? (
                      // Devotional exists but not completed: outlined circle
                      <div className={cn(
                        "w-7 h-7 rounded-full border-2 flex items-center justify-center text-[11px] font-medium",
                        isToday
                          ? "border-primary text-primary"
                          : "border-border text-muted-foreground"
                      )}>
                        {dayNum}
                      </div>
                    ) : (
                      // No devotional: gray dot or plain number
                      <div className={cn(
                        "w-7 h-7 rounded-full flex items-center justify-center",
                        isToday && "ring-2 ring-primary/40 ring-offset-1"
                      )}>
                        <span className={cn(
                          "text-[11px] font-medium",
                          isToday ? "text-primary font-bold" : "text-muted-foreground/50"
                        )}>
                          {dayNum}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 pt-1 border-t border-border/50">
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded-full bg-primary" />
            <span className="text-[11px] text-muted-foreground">Completed</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded-full border-2 border-border" />
            <span className="text-[11px] text-muted-foreground">Started</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded-full bg-muted/40" />
            <span className="text-[11px] text-muted-foreground">No entry</span>
          </div>
        </div>
      </div>

      {/* Past devotionals list */}
      {pastDevotionals.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Past Devotionals
          </p>
          <div className="flex flex-col gap-2">
            {pastDevotionals.map((d) => (
              <div key={d.id} className="bloom-card flex items-center gap-3">
                <div className={cn(
                  "w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0",
                  d.is_completed
                    ? "bg-primary/10 text-primary"
                    : "bg-muted text-muted-foreground"
                )}>
                  {d.is_completed
                    ? <CheckCircle className="h-4 w-4" />
                    : <BookOpen className="h-4 w-4" />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground">{formatNiceDate(d.date)}</p>
                  <p className="font-medium text-sm text-foreground truncate">{d.title}</p>
                  <p className="text-xs text-muted-foreground truncate">{d.scripture_reference}</p>
                </div>
                {d.is_completed ? (
                  <span className="text-[10px] text-primary bg-primary/10 px-2 py-0.5 rounded-full font-medium flex-shrink-0">
                    Done
                  </span>
                ) : (
                  <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full font-medium flex-shrink-0">
                    Unfinished
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {allDevotionals.length === 0 && (
        <div className="flex flex-col items-center text-center gap-3 py-12">
          <span className="text-4xl">📖</span>
          <div>
            <p className="font-medium text-foreground">No devotionals yet</p>
            <p className="text-xs text-muted-foreground mt-1">Complete your first devotional to start building your journey.</p>
          </div>
          <Link
            href="/devotional"
            className="mt-2 px-5 py-2.5 bg-primary text-primary-foreground text-sm font-semibold rounded-2xl active:scale-95 transition-transform"
          >
            Start Today&apos;s Devotional
          </Link>
        </div>
      )}

    </div>
  );
}
