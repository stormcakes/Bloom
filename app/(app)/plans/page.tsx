import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

export const dynamic = "force-dynamic";

interface ReadingPlan {
  id: string;
  slug: string;
  title: string;
  description: string;
  duration_days: number;
  theme: string;
  cover_emoji: string;
  cover_gradient_from: string;
  cover_gradient_to: string;
}

interface UserReadingPlan {
  id: string;
  plan_id: string;
  current_day: number;
  started_at: string;
  completed_at: string | null;
}

export default async function PlansPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [plansRes, userPlansRes] = await Promise.all([
    supabase.from("reading_plans").select("*").order("duration_days"),
    supabase
      .from("user_reading_plans")
      .select("*")
      .eq("user_id", user.id)
      .is("completed_at", null),
  ]);

  const plans: ReadingPlan[] = plansRes.data ?? [];
  const userPlans: UserReadingPlan[] = userPlansRes.data ?? [];

  const userPlanMap = new Map(userPlans.map((up) => [up.plan_id, up]));

  return (
    <div className="flex flex-col gap-5 px-4 pt-10 pb-28 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Reading Plans 📖</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Follow a guided journey through scripture.
        </p>
      </div>

      {/* Plans grid */}
      {plans.length === 0 ? (
        <div className="bloom-card text-center py-12">
          <p className="text-4xl mb-3">📖</p>
          <p className="text-muted-foreground text-sm">
            No reading plans available yet.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {plans.map((plan) => {
            const userPlan = userPlanMap.get(plan.id);
            const inProgress = !!userPlan;
            const currentDay = userPlan?.current_day ?? 0;
            const progress = inProgress
              ? Math.round((currentDay / plan.duration_days) * 100)
              : 0;

            return (
              <Link
                key={plan.id}
                href={`/plans/${plan.slug}`}
                className="flex flex-col rounded-2xl overflow-hidden border border-border/70 shadow-sm bg-card active:scale-[0.98] transition-transform"
              >
                {/* Gradient header */}
                <div
                  className="flex flex-col items-center justify-center pt-6 pb-4 px-3 gap-2"
                  style={{
                    background: `linear-gradient(135deg, ${plan.cover_gradient_from} 0%, ${plan.cover_gradient_to} 100%)`,
                  }}
                >
                  <span className="text-4xl">{plan.cover_emoji}</span>
                </div>

                {/* Card body */}
                <div className="flex flex-col gap-2 p-3 flex-1">
                  <h2 className="font-semibold text-sm text-foreground leading-tight line-clamp-1">
                    {plan.title}
                  </h2>
                  <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                    {plan.description}
                  </p>

                  {/* Duration badge */}
                  <span className="self-start text-[10px] font-semibold uppercase tracking-wider bg-primary/10 text-primary rounded-full px-2 py-0.5">
                    {plan.duration_days} days
                  </span>

                  {/* Progress */}
                  {inProgress && (
                    <div className="mt-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-muted-foreground">
                          Day {currentDay} of {plan.duration_days}
                        </span>
                        <span className="text-[10px] text-primary font-medium">
                          {progress}%
                        </span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full bg-primary transition-all"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* CTA button */}
                  <div
                    className={`mt-2 w-full h-8 rounded-xl flex items-center justify-center text-xs font-semibold transition-colors ${
                      inProgress
                        ? "bg-primary text-white"
                        : "bg-muted text-foreground"
                    }`}
                  >
                    {inProgress ? "Continue" : "Start Plan"}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
