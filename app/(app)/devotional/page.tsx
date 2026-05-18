"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft, Bookmark, Share2, CheckCircle,
  Loader2, Music
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { todayISO } from "@/lib/utils";
import type { Devotional } from "@/types";
import Link from "next/link";
import { cn } from "@/lib/utils";
import MilestoneCelebration from "@/components/MilestoneCelebration";
import MilestoneShareCard from "@/components/MilestoneShareCard";

const MOODS = [
  { value: "rough", emoji: "😔", label: "Rough" },
  { value: "meh", emoji: "😕", label: "Meh" },
  { value: "okay", emoji: "😐", label: "Okay" },
  { value: "good", emoji: "🙂", label: "Good" },
  { value: "great", emoji: "🥰", label: "Great" },
];

const MILESTONE_DAYS = [7, 21, 30, 100] as const;

function getHitMilestone(streak: number): number | null {
  return MILESTONE_DAYS.find((m) => m === streak) ?? null;
}

function milestoneSessionKey(milestone: number) {
  return `bloom_milestone_shown_${milestone}`;
}

export default function DevotionalPage() {
  const [mood, setMood] = useState<string | null>(null);
  const [moodSubmitted, setMoodSubmitted] = useState(false);
  const [devotional, setDevotional] = useState<Devotional | null>(null);
  const [loading, setLoading] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [journalText, setJournalText] = useState("");
  const [journalSaved, setJournalSaved] = useState(false);
  const [savingJournal, setSavingJournal] = useState(false);
  const [section, setSection] = useState<"reflection" | "prayer" | "journal">("reflection");

  // Milestone state
  const [activeMilestone, setActiveMilestone] = useState<number | null>(null);
  const [showShareCard, setShowShareCard] = useState(false);
  // We'll store the user's display name for the share card
  const [userName, setUserName] = useState("Friend");

  // Check if mood already logged today
  useEffect(() => {
    fetch(`/api/mood?date=${todayISO()}`)
      .then((r) => r.json())
      .then(({ data }) => {
        if (data?.mood) {
          setMood(data.mood);
          setMoodSubmitted(true);
          loadDevotional();
        }
      });
  }, []);

  // Fetch user's name for the share card
  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.json())
      .then(({ data }) => {
        if (data?.name) setUserName(data.name);
        else if (data?.full_name) setUserName(data.full_name);
      })
      .catch(() => {/* silently ignore */});
  }, []);

  async function submitMood(selected: string) {
    setMood(selected);
    await fetch("/api/mood", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mood: selected, date: todayISO() }),
    });
    setMoodSubmitted(true);
    loadDevotional();
  }

  async function loadDevotional() {
    setLoading(true);
    const res = await fetch("/api/devotional/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date: todayISO() }),
    });
    const { data } = await res.json();
    setDevotional(data);
    setLoading(false);
  }

  async function markComplete() {
    if (!devotional || devotional.is_completed) return;
    setCompleting(true);

    const res = await fetch("/api/devotional/generate", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ devotional_id: devotional.id }),
    });
    const { streak } = await res.json();

    setDevotional((d) => d ? { ...d, is_completed: true } : d);
    setCompleting(false);

    // Check for milestone
    if (typeof streak === "number") {
      const hit = getHitMilestone(streak);
      if (hit !== null) {
        const key = milestoneSessionKey(hit);
        if (!sessionStorage.getItem(key)) {
          sessionStorage.setItem(key, "1");
          setActiveMilestone(hit);
        }
      }
    }
  }

  async function saveJournal() {
    if (!journalText.trim() || !devotional) return;
    setSavingJournal(true);
    await fetch("/api/journal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: journalText,
        devotional_id: devotional.id,
        title: `Reflection: ${devotional.title}`,
      }),
    });
    setJournalSaved(true);
    setSavingJournal(false);
  }

  // ── Mood check-in screen ──────────────────────────────────────────────────
  if (!moodSubmitted) {
    return (
      <div className="flex flex-col min-h-screen px-6 pt-16 pb-28 items-center justify-center gap-8 animate-fade-in">
        <div className="text-center space-y-2">
          <p className="text-4xl">🌸</p>
          <h1 className="text-2xl font-bold text-foreground">Good morning!</h1>
          <p className="text-muted-foreground text-sm">How are you feeling today?</p>
        </div>

        <div className="grid grid-cols-5 gap-3 w-full max-w-xs">
          {MOODS.map(({ value, emoji, label }) => (
            <button
              key={value}
              onClick={() => submitMood(value)}
              className={cn(
                "flex flex-col items-center gap-1.5 p-3 rounded-2xl border-2 transition-all active:scale-95",
                mood === value
                  ? "border-primary bg-primary/10"
                  : "border-border bg-card hover:border-primary/40"
              )}
            >
              <span className="text-2xl">{emoji}</span>
              <span className="text-[10px] font-medium text-muted-foreground">{label}</span>
            </button>
          ))}
        </div>

        <p className="text-xs text-muted-foreground text-center max-w-[200px]">
          Your mood helps Bloom personalize your devotional
        </p>
      </div>
    );
  }

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] gap-5">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-rose-100 to-purple-100 flex items-center justify-center animate-bloom-pulse">
          <span className="text-4xl">🌸</span>
        </div>
        <p className="text-muted-foreground text-sm">Preparing your devotional…</p>
      </div>
    );
  }

  if (!devotional) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] gap-4 px-6 text-center">
        <p className="text-muted-foreground">Something went wrong. Please try again.</p>
        <Button onClick={loadDevotional}>Retry</Button>
      </div>
    );
  }

  // ── Devotional ────────────────────────────────────────────────────────────
  return (
    <>
      <div className="flex flex-col min-h-screen">
        <div className="flex items-center justify-between px-4 pt-10 pb-4">
          <Link href="/dashboard" className="w-9 h-9 rounded-full bg-card border border-border/60 flex items-center justify-center shadow-sm">
            <ChevronLeft className="h-5 w-5 text-foreground" />
          </Link>
          <div className="flex items-center gap-2">
            {/* Mood badge */}
            <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-muted text-sm">
              <span>{MOODS.find(m => m.value === mood)?.emoji}</span>
              <span className="text-xs text-muted-foreground">{MOODS.find(m => m.value === mood)?.label}</span>
            </div>
            <button className="w-9 h-9 rounded-full bg-card border border-border/60 flex items-center justify-center shadow-sm">
              <Bookmark className="h-4 w-4 text-muted-foreground" strokeWidth={1.8} />
            </button>
            <button className="w-9 h-9 rounded-full bg-card border border-border/60 flex items-center justify-center shadow-sm">
              <Share2 className="h-4 w-4 text-muted-foreground" strokeWidth={1.8} />
            </button>
          </div>
        </div>

        <div className="flex-1 px-4 pb-28 space-y-6">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Today&apos;s Devotional</p>
            <h1 className="text-2xl font-bold text-foreground leading-tight">
              {devotional.title} 🌸
            </h1>
          </div>

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

          <div className="bloom-card space-y-4">
            <p className="text-sm text-foreground/85 leading-relaxed">{devotional.reflection}</p>
            <div className="p-3 rounded-xl bg-muted/60">
              <p className="text-xs text-muted-foreground font-medium mb-1">IN PLAIN WORDS</p>
              <p className="text-sm text-foreground leading-relaxed">{devotional.simple_explanation}</p>
            </div>
            <p className="text-sm text-foreground/80 leading-relaxed">{devotional.real_life_application}</p>
          </div>

          <div>
            <div className="flex gap-1 p-1 bg-muted rounded-xl mb-4">
              {(["reflection", "prayer", "journal"] as const).map((tab) => (
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
                  {tab === "reflection" ? "Reflection" : tab === "prayer" ? "🙏 Prayer" : "📓 Journal"}
                </button>
              ))}
            </div>

            <AnimatePresence mode="wait">
              {section === "reflection" && (
                <motion.div key="reflection" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="bloom-card space-y-3">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Reflection</p>
                  <p className="text-sm text-muted-foreground italic leading-relaxed">{devotional.journal_prompt}</p>
                  <div className="flex items-start gap-3 pt-1">
                    <div className="w-6 h-6 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-primary text-xs font-bold">→</span>
                    </div>
                    <p className="text-sm text-foreground leading-relaxed">{devotional.action_step}</p>
                  </div>
                </motion.div>
              )}

              {section === "prayer" && (
                <motion.div key="prayer" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="verse-card space-y-2">
                  <p className="text-white/70 text-xs font-semibold uppercase tracking-wider">Prayer</p>
                  <p className="text-white text-sm leading-relaxed italic">{devotional.prayer}</p>
                </motion.div>
              )}

              {section === "journal" && (
                <motion.div key="journal" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="bloom-card space-y-3">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Your Response</p>
                  <p className="text-sm text-muted-foreground italic">{devotional.journal_prompt}</p>
                  <Textarea
                    value={journalText}
                    onChange={(e) => setJournalText(e.target.value)}
                    placeholder="Write your thoughts here…"
                    rows={4}
                    disabled={journalSaved}
                    className="bg-muted/40 border-0 focus-visible:ring-1"
                  />
                  {!journalSaved ? (
                    <Button size="sm" variant="outline" onClick={saveJournal} disabled={!journalText.trim() || savingJournal} className="w-full">
                      {savingJournal ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Save to Journal"}
                    </Button>
                  ) : (
                    <p className="text-xs text-green-600 flex items-center gap-1 justify-center">
                      <CheckCircle className="h-3.5 w-3.5" /> Saved to your journal
                    </p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {!devotional.is_completed ? (
            <Button size="lg" onClick={markComplete} disabled={completing} className="w-full h-14 text-base shadow-lg shadow-primary/20">
              {completing ? <Loader2 className="h-5 w-5 animate-spin" /> : "✓ Mark as Complete"}
            </Button>
          ) : (
            <div className="w-full h-14 rounded-[var(--radius)] bg-green-50 border border-green-200 flex items-center justify-center gap-2 text-green-600 font-semibold">
              <CheckCircle className="h-5 w-5" />
              Completed today 🌸
            </div>
          )}

          <div className="bloom-card flex items-center gap-3 py-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-400 to-rose-400 flex items-center justify-center flex-shrink-0">
              <Music className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm text-foreground truncate">Bloom in His Peace</p>
              <p className="text-xs text-muted-foreground">Lo-Fi Worship</p>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <span className="text-lg">⏮</span>
              <button className="w-9 h-9 rounded-full bg-primary flex items-center justify-center">
                <span className="text-white text-sm">▶</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Milestone celebration overlay */}
      <AnimatePresence>
        {activeMilestone !== null && !showShareCard && (
          <MilestoneCelebration
            key="milestone-celebration"
            milestone={activeMilestone}
            onClose={() => setActiveMilestone(null)}
            onShare={() => setShowShareCard(true)}
          />
        )}
        {activeMilestone !== null && showShareCard && (
          <MilestoneShareCard
            key="milestone-share"
            milestone={activeMilestone}
            name={userName}
            onClose={() => {
              setShowShareCard(false);
              setActiveMilestone(null);
            }}
          />
        )}
      </AnimatePresence>
    </>
  );
}
