"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, CheckCircle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const QUICK_CHIPS = [
  "Job interview",
  "Anxiety & worry",
  "Healing",
  "Relationship conflict",
  "Gratitude",
  "Purpose & direction",
  "Grief",
  "A big decision",
];

const MAX_CHARS = 200;

export default function PrayerPage() {
  const [situation, setSituation] = useState("");
  const [prayer, setPrayer] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  function selectChip(chip: string) {
    setSituation(chip);
    setPrayer(null);
    setSaved(false);
    setError(null);
  }

  function handleSituationChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    if (e.target.value.length <= MAX_CHARS) {
      setSituation(e.target.value);
      setPrayer(null);
      setSaved(false);
      setError(null);
    }
  }

  async function generatePrayer() {
    if (!situation.trim()) return;
    setLoading(true);
    setError(null);
    setPrayer(null);
    setSaved(false);

    try {
      const res = await fetch("/api/prayer/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ situation }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to generate prayer");
      setPrayer(json.prayer);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function savePrayer() {
    if (!prayer) return;
    setSaving(true);
    try {
      await fetch("/api/journal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: prayer,
          title: `Prayer: ${situation.slice(0, 60)}${situation.length > 60 ? "…" : ""}`,
          is_prayer: true,
        }),
      });
      setSaved(true);
    } catch {
      // silently ignore save errors
    } finally {
      setSaving(false);
    }
  }

  function generateAnother() {
    setPrayer(null);
    setSaved(false);
    setError(null);
  }

  return (
    <div className="flex flex-col min-h-screen px-4 pt-10 pb-28 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <Link
          href="/dashboard"
          className="w-9 h-9 rounded-full bg-card border border-border/60 flex items-center justify-center shadow-sm flex-shrink-0"
        >
          <ChevronLeft className="h-5 w-5 text-foreground" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-foreground leading-tight">
            Prayer Generator 🙏
          </h1>
          <p className="text-xs text-muted-foreground">
            Share your heart — we&apos;ll help you pray
          </p>
        </div>
      </div>

      {/* Input area */}
      <div className="space-y-4">
        <div className="relative">
          <Textarea
            value={situation}
            onChange={handleSituationChange}
            placeholder="What would you like to pray about?"
            rows={4}
            className="bg-card border-border/70 focus-visible:ring-primary/40 resize-none pr-14 text-sm leading-relaxed"
          />
          <span
            className={cn(
              "absolute bottom-3 right-3 text-[11px] font-medium tabular-nums transition-colors",
              situation.length >= MAX_CHARS
                ? "text-rose-400"
                : situation.length >= MAX_CHARS * 0.8
                ? "text-amber-400"
                : "text-muted-foreground/50"
            )}
          >
            {situation.length}/{MAX_CHARS}
          </span>
        </div>

        {/* Quick chips */}
        <div className="flex flex-wrap gap-2">
          {QUICK_CHIPS.map((chip) => (
            <button
              key={chip}
              onClick={() => selectChip(chip)}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-medium border transition-all active:scale-95",
                situation === chip
                  ? "bg-primary text-primary-foreground border-primary shadow-sm shadow-primary/20"
                  : "bg-card text-muted-foreground border-border/70 hover:border-primary/40 hover:text-foreground"
              )}
            >
              {chip}
            </button>
          ))}
        </div>

        {/* Generate button */}
        <Button
          size="lg"
          onClick={generatePrayer}
          disabled={!situation.trim() || loading}
          className="w-full h-13 text-sm font-semibold shadow-md shadow-primary/20"
        >
          {loading ? null : "Generate My Prayer"}
        </Button>
      </div>

      {/* Loading state */}
      <AnimatePresence>
        {loading && (
          <motion.div
            key="loading"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-3 mt-10"
          >
            <span className="text-4xl animate-spin inline-block">🌸</span>
            <p className="text-muted-foreground text-sm">Writing your prayer…</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error state */}
      <AnimatePresence>
        {error && !loading && (
          <motion.p
            key="error"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-6 text-center text-sm text-rose-500"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>

      {/* Prayer result */}
      <AnimatePresence>
        {prayer && !loading && (
          <motion.div
            key="prayer-result"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="mt-8 space-y-4"
          >
            {/* Prayer card */}
            <div className="verse-card space-y-3">
              <p className="text-white/70 text-xs font-semibold uppercase tracking-wider">
                Your Prayer
              </p>
              <p className="text-white text-sm leading-relaxed italic">{prayer}</p>
            </div>

            {/* Action buttons */}
            <div className="flex gap-3">
              {!saved ? (
                <Button
                  size="sm"
                  onClick={savePrayer}
                  disabled={saving}
                  className="flex-1 font-medium"
                >
                  {saving ? (
                    <span className="text-base animate-spin inline-block mr-1">🌸</span>
                  ) : (
                    "Save to Journal 🙏"
                  )}
                </Button>
              ) : (
                <div className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-[var(--radius)] bg-green-50 border border-green-200 text-green-600 text-sm font-medium">
                  <CheckCircle className="h-4 w-4" />
                  Saved to your prayers ✓
                </div>
              )}

              <Button
                size="sm"
                variant="outline"
                onClick={generateAnother}
                className="flex-1 font-medium"
              >
                Generate Another
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
