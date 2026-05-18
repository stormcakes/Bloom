"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  CheckCircle,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Devotional } from "@/types";

export default function PlanDayPage() {
  const { slug, day } = useParams<{ slug: string; day: string }>();
  const router = useRouter();
  const dayNum = parseInt(day, 10);

  const [devotional, setDevotional] = useState<Devotional | null>(null);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [section, setSection] = useState<"reflection" | "prayer">("reflection");

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/plans/${slug}/${day}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const json = await res.json();
      if (json.data) {
        setDevotional(json.data);
        if (json.data.is_completed) setCompleted(true);
      }
      setLoading(false);
    }
    load();
  }, [slug, day]);

  async function completeDay() {
    if (!devotional || completed) return;
    setCompleting(true);

    // Mark devotional as completed
    await fetch(`/api/plans/${slug}/${day}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ devotional_id: devotional.id }),
    });

    setCompleted(true);
    setCompleting(false);
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] gap-5">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-rose-100 to-purple-100 flex items-center justify-center animate-pulse">
          <span className="text-4xl">📖</span>
        </div>
        <p className="text-muted-foreground text-sm">
          Preparing Day {dayNum}…
        </p>
      </div>
    );
  }

  if (!devotional) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] gap-4 px-6 text-center">
        <p className="text-muted-foreground">
          Something went wrong. Please try again.
        </p>
        <Button onClick={() => window.location.reload()}>Retry</Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-10 pb-4">
        <Link
          href={`/plans/${slug}`}
          className="w-9 h-9 rounded-full bg-card border border-border/60 flex items-center justify-center shadow-sm"
        >
          <ChevronLeft className="h-5 w-5 text-foreground" />
        </Link>
        <div className="text-center">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
            Day {dayNum}
          </p>
        </div>
        <div className="w-9" />
      </div>

      <div className="flex-1 px-4 pb-28 space-y-6">
        {/* Title */}
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-foreground leading-tight">
            {devotional.title}
          </h1>
        </div>

        {/* Scripture */}
        <div className="bloom-card space-y-3">
          <p className="text-xs font-semibold text-primary uppercase tracking-wider">
            {devotional.scripture_reference}
          </p>
          <div className="border-l-2 border-primary/40 pl-4">
            <p className="scripture-text text-foreground/80 text-sm leading-relaxed">
              &ldquo;{devotional.scripture_text}&rdquo;
            </p>
          </div>
        </div>

        {/* Body */}
        <div className="bloom-card space-y-4">
          <p className="text-sm text-foreground/85 leading-relaxed">
            {devotional.reflection}
          </p>
          <div className="p-3 rounded-xl bg-muted/60">
            <p className="text-xs text-muted-foreground font-medium mb-1">
              IN PLAIN WORDS
            </p>
            <p className="text-sm text-foreground leading-relaxed">
              {devotional.simple_explanation}
            </p>
          </div>
          <p className="text-sm text-foreground/80 leading-relaxed">
            {devotional.real_life_application}
          </p>
        </div>

        {/* Tabs */}
        <div>
          <div className="flex gap-1 p-1 bg-muted rounded-xl mb-4">
            {(["reflection", "prayer"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setSection(tab)}
                className={cn(
                  "flex-1 py-2 text-xs font-semibold rounded-lg capitalize transition-all",
                  section === tab
                    ? "bg-white text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {tab === "reflection" ? "Reflection" : "🙏 Prayer"}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {section === "reflection" && (
              <motion.div
                key="reflection"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="bloom-card space-y-3"
              >
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Reflection
                </p>
                <p className="text-sm text-muted-foreground italic leading-relaxed">
                  {devotional.journal_prompt}
                </p>
                <div className="flex items-start gap-3 pt-1">
                  <div className="w-6 h-6 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-primary text-xs font-bold">→</span>
                  </div>
                  <p className="text-sm text-foreground leading-relaxed">
                    {devotional.action_step}
                  </p>
                </div>
              </motion.div>
            )}

            {section === "prayer" && (
              <motion.div
                key="prayer"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="verse-card space-y-2"
              >
                <p className="text-white/70 text-xs font-semibold uppercase tracking-wider">
                  Prayer
                </p>
                <p className="text-white text-sm leading-relaxed italic">
                  {devotional.prayer}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Complete / advance button */}
        {!completed ? (
          <Button
            size="lg"
            onClick={completeDay}
            disabled={completing}
            className="w-full h-14 text-base shadow-lg shadow-primary/20"
          >
            {completing ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              "✓ Complete Day"
            )}
          </Button>
        ) : (
          <div className="space-y-3">
            <div className="w-full h-14 rounded-[var(--radius)] bg-green-50 border border-green-200 flex items-center justify-center gap-2 text-green-600 font-semibold">
              <CheckCircle className="h-5 w-5" />
              Day {dayNum} Complete! 🌸
            </div>
            {dayNum < 999 && (
              <Button
                variant="outline"
                size="lg"
                className="w-full"
                onClick={() => router.push(`/plans/${slug}`)}
              >
                Back to Plan Overview
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
