"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, CheckCircle, Circle, Lock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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
  last_completed_day: number | null;
  completed_at: string | null;
}

export default function PlanDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();

  const [plan, setPlan] = useState<ReadingPlan | null>(null);
  const [userPlan, setUserPlan] = useState<UserReadingPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/plans/join?slug=${slug}`);
      const json = await res.json();
      if (json.plan) setPlan(json.plan);
      if (json.userPlan) setUserPlan(json.userPlan);
      setLoading(false);
    }
    load();
  }, [slug]);

  async function startPlan() {
    if (!plan) return;
    setJoining(true);
    const res = await fetch("/api/plans/join", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan_id: plan.id }),
    });
    const json = await res.json();
    if (json.userPlan) {
      setUserPlan(json.userPlan);
    }
    setJoining(false);
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] gap-4">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-rose-100 to-purple-100 flex items-center justify-center animate-pulse">
          <span className="text-3xl">📖</span>
        </div>
        <p className="text-muted-foreground text-sm">Loading plan…</p>
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] gap-4 px-6 text-center">
        <p className="text-muted-foreground">Plan not found.</p>
        <Link href="/plans">
          <Button variant="outline">Back to Plans</Button>
        </Link>
      </div>
    );
  }

  const currentDay = userPlan?.current_day ?? 0;
  const lastCompleted = userPlan?.last_completed_day ?? 0;
  const progress = userPlan
    ? Math.round((currentDay / plan.duration_days) * 100)
    : 0;
  const isStarted = !!userPlan;
  const isCompleted = !!userPlan?.completed_at;

  // The day the user should read next (currentDay + 1 if they've completed currentDay, else currentDay)
  const nextDay = Math.min(
    lastCompleted >= currentDay ? currentDay + 1 : currentDay,
    plan.duration_days
  );
  const readingDay = Math.max(nextDay, 1);

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero gradient header */}
      <div
        className="relative px-4 pt-12 pb-8"
        style={{
          background: `linear-gradient(160deg, ${plan.cover_gradient_from} 0%, ${plan.cover_gradient_to} 100%)`,
        }}
      >
        <Link
          href="/plans"
          className="absolute top-12 left-4 w-9 h-9 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center"
        >
          <ChevronLeft className="h-5 w-5 text-white" />
        </Link>
        <div className="flex flex-col items-center text-center gap-3 pt-4">
          <span className="text-6xl">{plan.cover_emoji}</span>
          <h1 className="text-2xl font-bold text-white leading-tight">
            {plan.title}
          </h1>
          <p className="text-white/80 text-sm leading-relaxed max-w-xs">
            {plan.description}
          </p>
          <span className="text-xs font-semibold uppercase tracking-wider bg-white/20 text-white rounded-full px-3 py-1">
            {plan.duration_days} days
          </span>
        </div>
      </div>

      <div className="flex-1 px-4 pb-28 pt-5 space-y-5">
        {/* Progress section */}
        {isStarted && !isCompleted && (
          <div className="bloom-card space-y-3">
            <div className="flex items-center justify-between">
              <p className="font-semibold text-sm text-foreground">
                Day {currentDay} of {plan.duration_days}
              </p>
              <span className="text-xs text-primary font-medium">{progress}%</span>
            </div>
            <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
            <Button
              className="w-full"
              onClick={() => router.push(`/plans/${slug}/${readingDay}`)}
            >
              Start Today&apos;s Reading →
            </Button>
          </div>
        )}

        {isCompleted && (
          <div className="bloom-card flex items-center gap-3">
            <CheckCircle className="h-6 w-6 text-green-500 flex-shrink-0" />
            <div>
              <p className="font-semibold text-sm text-foreground">
                Plan Complete! 🎉
              </p>
              <p className="text-xs text-muted-foreground">
                You finished all {plan.duration_days} days.
              </p>
            </div>
          </div>
        )}

        {!isStarted && (
          <div className="bloom-card space-y-3 text-center">
            <p className="text-sm text-muted-foreground">
              Ready to begin this {plan.duration_days}-day journey?
            </p>
            <Button
              className="w-full"
              onClick={startPlan}
              disabled={joining}
            >
              {joining ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Begin This Plan"
              )}
            </Button>
          </div>
        )}

        {/* Day list */}
        <div className="space-y-2">
          <p className="font-semibold text-sm text-foreground px-1">
            All Days
          </p>
          {Array.from({ length: plan.duration_days }, (_, i) => {
            const day = i + 1;
            const isCompletedDay = day <= lastCompleted;
            const isCurrent = day === currentDay && !isCompletedDay;
            const isFuture = !isCompletedDay && !isCurrent;

            return (
              <button
                key={day}
                onClick={() => {
                  if (isStarted && day <= readingDay) {
                    router.push(`/plans/${slug}/${day}`);
                  }
                }}
                disabled={!isStarted || day > readingDay}
                className={cn(
                  "w-full flex items-center gap-3 p-4 rounded-2xl border transition-all text-left",
                  isCompletedDay
                    ? "bg-green-50 border-green-200"
                    : isCurrent
                    ? "bg-primary/5 border-primary/30"
                    : "bg-card border-border/70 opacity-60"
                )}
              >
                {/* Day circle */}
                <div
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold",
                    isCompletedDay
                      ? "bg-green-500 text-white"
                      : isCurrent
                      ? "bg-primary text-white"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {isCompletedDay ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    day
                  )}
                </div>

                {/* Day title */}
                <div className="flex-1 min-w-0">
                  <p
                    className={cn(
                      "text-sm font-medium truncate",
                      isCompletedDay
                        ? "text-green-700"
                        : isCurrent
                        ? "text-primary"
                        : "text-muted-foreground"
                    )}
                  >
                    Day {day} — {getDayTitle(plan.theme, day)}
                  </p>
                  {isCompletedDay && (
                    <p className="text-xs text-green-600">Completed</p>
                  )}
                  {isCurrent && (
                    <p className="text-xs text-primary">Current reading</p>
                  )}
                </div>

                {/* Status icon */}
                {isCompletedDay ? (
                  <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                ) : isCurrent ? (
                  <Circle className="h-4 w-4 text-primary flex-shrink-0" />
                ) : (
                  <Lock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function getDayTitle(theme: string, day: number): string {
  const titles: Record<string, string[]> = {
    peace: [
      "Finding Peace in the Storm",
      "Peace That Surpasses Understanding",
      "Still Waters",
      "The God of Peace",
      "Rest for the Weary",
      "Trusting When It's Hard",
      "Walking in Peace",
      "Peace with Others",
      "The Prince of Peace",
      "Overcoming Anxiety",
      "Peace in Uncertainty",
      "God's Presence",
      "Contentment",
      "Releasing Control",
      "Peace as a Practice",
      "Reconciliation",
      "Inner Stillness",
      "Hope-Filled Peace",
      "Peace That Endures",
      "Living at Peace",
      "Peaceful Boundaries",
    ],
    faith: [
      "The Foundation of Faith",
      "Faith Like a Mustard Seed",
      "Walking by Faith",
      "When Faith Is Tested",
      "Trusting God's Timing",
      "Faith and Works",
      "Heroes of Faith",
      "Doubt and Belief",
      "Faith in the Dark",
      "Growing Stronger",
      "Bold Prayer",
      "Stepping Out",
      "Faith Over Fear",
      "Enduring Faith",
      "Community of Believers",
      "Faith and Healing",
      "Persevering Faith",
      "Faith's Reward",
      "Living Faith",
      "Faith That Moves Mountains",
      "Faith in God's Word",
    ],
    grace: [
      "Amazing Grace",
      "Grace for the Broken",
      "Unmerited Favor",
      "Grace Over Law",
      "Extending Grace",
      "Grace in Weakness",
      "Grace and Truth",
      "Saved by Grace",
      "Grace for Today",
      "Generous Grace",
      "Grace in Community",
      "Redeeming Grace",
      "Grace to Forgive",
      "Abundant Grace",
      "Grace and Humility",
      "Transforming Grace",
      "Grace in Suffering",
      "Grace to Grow",
      "Living Gracefully",
      "Grace That Covers",
      "The God of All Grace",
      "Sufficient Grace",
      "Grace Upon Grace",
      "Grace and Freedom",
      "Clothed in Grace",
      "Grace and Mercy",
      "Grace in Action",
      "Receiving Grace",
      "Sharing Grace",
      "Grace — Past, Present, Future",
      "Resting in Grace",
      "Grace Unending",
      "Grace and Strength",
      "Grace-Filled Living",
      "Full of Grace",
      "Grace for Every Season",
      "Grace in the Valley",
      "Grace on the Mountain",
      "Grace for the Journey",
      "Grace Forever",
    ],
  };

  const themeTitles = titles[theme] ?? [];
  if (day <= themeTitles.length) {
    return themeTitles[day - 1];
  }

  // Generic fallback
  const genericTitles = [
    "Beginning the Journey",
    "A New Perspective",
    "Deeper Waters",
    "Pressing Forward",
    "Renewed Strength",
    "Open Hands",
    "Bearing Fruit",
    "A Faithful Heart",
    "Walking in Truth",
    "Rooted and Grounded",
    "Leaning on God",
    "Surrendered Will",
    "Daily Surrender",
    "Abiding in Christ",
    "Eyes on the Eternal",
    "The Path of Life",
    "Set Apart",
    "Vessels of Honor",
    "Transformed Minds",
    "Living Letters",
  ];

  const idx = (day - 1) % genericTitles.length;
  return genericTitles[idx];
}
