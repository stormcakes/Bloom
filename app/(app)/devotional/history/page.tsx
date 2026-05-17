import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, ChevronRight, BookOpen, CheckCircle } from "lucide-react";
import { formatDate, todayISO } from "@/lib/utils";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const DAYS = ["S", "M", "T", "W", "T", "F", "S"];

export default async function PlansPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("streak_current, devotionals_completed")
    .eq("user_id", user.id)
    .single();

  // Fetch last 30 devotionals
  const { data: devotionals } = await supabase
    .from("devotionals")
    .select("id, date, title, scripture_reference, is_completed, emotional_goal")
    .eq("user_id", user.id)
    .order("date", { ascending: false })
    .limit(30);

  const today = todayISO();
  const todayDevotional = devotionals?.find(d => d.date === today);

  // Build this week's day completion map
  const weekDates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().split("T")[0];
  });
  const completedDates = new Set(devotionals?.filter(d => d.is_completed).map(d => d.date));

  return (
    <div className="flex flex-col min-h-screen px-4 pt-10 pb-28 gap-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Plans</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Your devotional journey</p>
      </div>

      {/* This week */}
      <div className="bloom-card space-y-3">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">This Week</p>
        <div className="flex gap-1.5">
          {weekDates.map((date, i) => {
            const isToday = date === today;
            const done = completedDates.has(date);
            const dayLabel = DAYS[new Date(date + "T12:00:00").getDay()];
            return (
              <div key={date} className="flex-1 flex flex-col items-center gap-1.5">
                <span className={cn("text-[11px] font-medium", isToday ? "text-primary" : "text-muted-foreground")}>
                  {dayLabel}
                </span>
                <div className={cn(
                  "w-full aspect-square rounded-xl flex items-center justify-center text-sm border transition-all",
                  done && "bg-primary border-primary text-primary-foreground",
                  isToday && !done && "border-primary bg-primary/10 text-primary",
                  !done && !isToday && "border-border/50 bg-muted/30 text-muted-foreground"
                )}>
                  {done ? "✓" : isToday ? "·" : ""}
                </div>
              </div>
            );
          })}
        </div>
        <div className="flex items-center gap-4 pt-1 text-sm">
          <div className="flex items-center gap-1.5">
            <span className="text-lg">🔥</span>
            <span className="font-bold text-foreground">{profile?.streak_current ?? 0}</span>
            <span className="text-muted-foreground text-xs">day streak</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-lg">📖</span>
            <span className="font-bold text-foreground">{profile?.devotionals_completed ?? 0}</span>
            <span className="text-muted-foreground text-xs">total</span>
          </div>
        </div>
      </div>

      {/* Today's devotional CTA */}
      {todayDevotional ? (
        <Link href="/devotional">
          <div className={cn(
            "bloom-card flex items-center gap-4 active:scale-[0.99] transition-transform",
            todayDevotional.is_completed ? "border-green-200 bg-green-50/30" : "border-primary/30 bg-primary/5"
          )}>
            <div className={cn(
              "w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 text-xl",
              todayDevotional.is_completed ? "bg-green-100" : "bg-primary/10"
            )}>
              {todayDevotional.is_completed ? "✅" : "📖"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground font-medium mb-0.5">Today</p>
              <p className="font-semibold text-sm text-foreground truncate">{todayDevotional.title}</p>
              <p className="text-xs text-muted-foreground">{todayDevotional.scripture_reference}</p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          </div>
        </Link>
      ) : (
        <Link href="/devotional">
          <div className="bloom-card flex items-center gap-4 border-primary/30 bg-primary/5 active:scale-[0.99] transition-transform">
            <div className="w-11 h-11 rounded-2xl bg-primary/10 flex items-center justify-center text-xl flex-shrink-0">
              🌸
            </div>
            <div className="flex-1">
              <p className="font-semibold text-sm text-foreground">Start today&apos;s devotional</p>
              <p className="text-xs text-muted-foreground mt-0.5">Your personalized devotional is ready</p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          </div>
        </Link>
      )}

      {/* Past devotionals */}
      {devotionals && devotionals.length > 1 && (
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Past Devotionals</p>
          <div className="flex flex-col gap-2">
            {devotionals
              .filter(d => d.date !== today)
              .map((d) => (
                <div key={d.id} className="bloom-card flex items-center gap-3">
                  <div className={cn(
                    "w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-sm",
                    d.is_completed ? "bg-green-50 text-green-600" : "bg-muted text-muted-foreground"
                  )}>
                    {d.is_completed ? <CheckCircle className="h-4 w-4" /> : <BookOpen className="h-4 w-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground">{formatDate(d.date)}</p>
                    <p className="font-medium text-sm text-foreground truncate">{d.title}</p>
                    <p className="text-xs text-muted-foreground">{d.scripture_reference}</p>
                  </div>
                  {d.is_completed && (
                    <span className="text-[10px] text-green-600 bg-green-50 px-2 py-0.5 rounded-full font-medium flex-shrink-0">
                      Done
                    </span>
                  )}
                </div>
              ))}
          </div>
        </div>
      )}

      {(!devotionals || devotionals.length === 0) && (
        <div className="flex flex-col items-center text-center gap-3 py-12">
          <span className="text-4xl">📖</span>
          <div>
            <p className="font-medium text-foreground">No devotionals yet</p>
            <p className="text-xs text-muted-foreground mt-1">Start your first one today.</p>
          </div>
          <Link
            href="/devotional"
            className="mt-2 px-5 py-2.5 bg-primary text-primary-foreground text-sm font-semibold rounded-2xl"
          >
            Start Today&apos;s Devotional
          </Link>
        </div>
      )}
    </div>
  );
}
