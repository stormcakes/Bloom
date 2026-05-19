"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X, Loader2, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type Card = {
  id: string;
  verse_reference: string;
  verse_text: string;
  next_review_at: string;
  interval_days: number;
  repetitions: number;
};

type Difficulty = "hard" | "okay" | "easy";

const STARTER_VERSES = [
  {
    verse_reference: "John 3:16",
    verse_text:
      'For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life.',
  },
  {
    verse_reference: "Philippians 4:13",
    verse_text: "I can do all things through Christ who strengthens me.",
  },
  {
    verse_reference: "Psalm 23:1",
    verse_text: "The Lord is my shepherd, I lack nothing.",
  },
  {
    verse_reference: "Romans 8:28",
    verse_text:
      "And we know that in all things God works for the good of those who love him, who have been called according to his purpose.",
  },
  {
    verse_reference: "Jeremiah 29:11",
    verse_text:
      '"For I know the plans I have for you," declares the Lord, "plans to prosper you and not to harm you, plans to give you hope and a future."',
  },
];

const DIFFICULTY_OPTIONS: { key: Difficulty; label: string; color: string }[] = [
  { key: "hard", label: "Hard 😓", color: "border-red-300 text-red-600 bg-red-50 active:bg-red-100" },
  { key: "okay", label: "Got it 🙂", color: "border-amber-300 text-amber-700 bg-amber-50 active:bg-amber-100" },
  { key: "easy", label: "Easy 🥰", color: "border-green-300 text-green-700 bg-green-50 active:bg-green-100" },
];

export default function MemoryPage() {
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [reviewing, setReviewing] = useState(false);
  const [reviewedCount, setReviewedCount] = useState(0);
  const [done, setDone] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newRef, setNewRef] = useState("");
  const [newText, setNewText] = useState("");
  const [saving, setSaving] = useState(false);

  const totalCards = cards.length;
  const currentCard = cards[currentIndex] ?? null;

  const fetchCards = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/memory");
    const { data } = await res.json();
    const fetched: Card[] = data ?? [];

    if (fetched.length === 0) {
      // Check total card count — seed only if user has zero cards ever
      await seedStarterVerses();
      // Re-fetch after seeding
      const res2 = await fetch("/api/memory");
      const { data: data2 } = await res2.json();
      setCards(data2 ?? []);
    } else {
      setCards(fetched);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchCards();
  }, [fetchCards]);

  async function seedStarterVerses() {
    setSeeding(true);
    await Promise.all(
      STARTER_VERSES.map((v) =>
        fetch("/api/memory", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(v),
        })
      )
    );
    setSeeding(false);
  }

  function handleFlip() {
    if (!isFlipped) setIsFlipped(true);
  }

  async function handleDifficulty(difficulty: Difficulty) {
    if (!currentCard || reviewing) return;
    setReviewing(true);

    await fetch(`/api/memory/${currentCard.id}/review`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ difficulty }),
    });

    const nextIndex = currentIndex + 1;
    setReviewedCount((c) => c + 1);

    if (nextIndex >= totalCards) {
      setDone(true);
    } else {
      setIsFlipped(false);
      // Small delay so unflip animation is visible before advancing
      setTimeout(() => {
        setCurrentIndex(nextIndex);
        setReviewing(false);
      }, 250);
      return;
    }

    setReviewing(false);
  }

  async function handleAddVerse() {
    if (!newRef.trim() || !newText.trim()) return;
    setSaving(true);
    const res = await fetch("/api/memory", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ verse_reference: newRef, verse_text: newText }),
    });
    const { data } = await res.json();
    if (data) {
      setCards((prev) => [...prev, data]);
      // If we were done, un-done so they can review the new card
      if (done) {
        setDone(false);
        setCurrentIndex(totalCards);
      }
    }
    setNewRef("");
    setNewText("");
    setSaving(false);
    setShowAddForm(false);
  }

  // Streak: count cards reviewed this session
  const streakCount = reviewedCount;
  const progress = totalCards > 0 ? reviewedCount / totalCards : 0;

  return (
    <div className="flex flex-col min-h-screen px-4 pt-10 pb-28 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-2xl font-bold text-foreground">Scripture Memory ✨</h1>
      </div>

      {/* Stats row */}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          <span className="text-base">🔥</span>
          <span>{streakCount} reviewed today</span>
        </div>
        {totalCards > 0 && !done && (
          <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <BookOpen className="h-3.5 w-3.5" />
            <span>{totalCards - reviewedCount} cards due</span>
          </div>
        )}
      </div>

      {/* Loading */}
      {(loading || seeding) && (
        <div className="flex flex-col items-center justify-center gap-3 py-24">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          {seeding && (
            <p className="text-sm text-muted-foreground">Adding starter verses…</p>
          )}
        </div>
      )}

      {/* Main content */}
      {!loading && !seeding && (
        <>
          {/* Progress bar */}
          {totalCards > 0 && (
            <div className="mb-6 space-y-1.5">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Progress</span>
                <span>{reviewedCount} of {totalCards}</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-primary rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress * 100}%` }}
                  transition={{ type: "spring", stiffness: 120, damping: 20 }}
                />
              </div>
            </div>
          )}

          {/* Empty state — no cards at all */}
          {totalCards === 0 && (
            <div className="flex flex-col items-center text-center gap-4 py-16">
              <span className="text-5xl">📖</span>
              <div>
                <p className="font-semibold text-foreground">No verses yet</p>
                <p className="text-sm text-muted-foreground mt-1 max-w-xs mx-auto">
                  Add your first verse to start memorizing scripture with spaced repetition.
                </p>
              </div>
              <Button onClick={() => setShowAddForm(true)} className="gap-2">
                <Plus className="h-4 w-4" /> Add a verse
              </Button>
            </div>
          )}

          {/* All caught up */}
          {totalCards > 0 && (cards.length === 0 || done) && (
            <AnimatePresence>
              <motion.div
                key="celebration"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center text-center gap-4 py-16"
              >
                {/* Confetti burst */}
                <motion.div
                  className="text-5xl select-none"
                  animate={{ rotate: [0, -10, 10, -8, 8, 0], scale: [1, 1.2, 1.1, 1.15, 1] }}
                  transition={{ duration: 0.7, ease: "easeOut" }}
                >
                  🎉
                </motion.div>
                <div className="flex gap-2 text-2xl">
                  {Array.from("🌟✨💛🌸✨🌟").map((char, i) => (
                    <motion.span
                      key={i}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 + i * 0.05 }}
                    >
                      {char}
                    </motion.span>
                  ))}
                </div>
                <div>
                  <p className="font-bold text-lg text-foreground">You&apos;re all caught up! 🎉</p>
                  <p className="text-sm text-muted-foreground mt-1 max-w-xs mx-auto">
                    Great work hiding God&apos;s Word in your heart. Come back tomorrow for more!
                  </p>
                </div>
                <Button variant="outline" onClick={() => setShowAddForm(true)} className="gap-2 mt-2">
                  <Plus className="h-4 w-4" /> Add another verse
                </Button>
              </motion.div>
            </AnimatePresence>
          )}

          {/* Flashcard */}
          {currentCard && !done && (
            <div className="flex flex-col items-center gap-6">
              {/* Card */}
              <div
                className="w-full max-w-sm cursor-pointer"
                style={{ perspective: 1000 }}
                onClick={handleFlip}
              >
                <motion.div
                  style={{ transformStyle: "preserve-3d" }}
                  animate={{ rotateY: isFlipped ? 180 : 0 }}
                  transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
                  className="relative w-full"
                >
                  {/* Front face — reference */}
                  <div
                    className="bloom-card flex flex-col items-center justify-center text-center gap-4 min-h-[260px] px-6 py-8 select-none"
                    style={{ backfaceVisibility: "hidden" }}
                  >
                    <span className="text-3xl">📖</span>
                    <p className="text-2xl font-bold text-foreground leading-snug">
                      {currentCard.verse_reference}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Tap to reveal the verse
                    </p>
                  </div>

                  {/* Back face — text */}
                  <div
                    className="bloom-card absolute inset-0 flex flex-col items-center justify-center text-center gap-4 px-6 py-8 select-none"
                    style={{
                      backfaceVisibility: "hidden",
                      transform: "rotateY(180deg)",
                    }}
                  >
                    <p className="text-xs font-semibold text-primary uppercase tracking-wider">
                      {currentCard.verse_reference}
                    </p>
                    <p className="text-base text-foreground leading-relaxed font-medium">
                      &ldquo;{currentCard.verse_text}&rdquo;
                    </p>
                  </div>
                </motion.div>
              </div>

              {/* Response buttons — only visible after flip */}
              <AnimatePresence>
                {isFlipped && (
                  <motion.div
                    key="buttons"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    transition={{ duration: 0.25 }}
                    className="flex gap-3 w-full max-w-sm"
                  >
                    {DIFFICULTY_OPTIONS.map(({ key, label, color }) => (
                      <button
                        key={key}
                        onClick={() => handleDifficulty(key)}
                        disabled={reviewing}
                        className={cn(
                          "flex-1 py-3 rounded-2xl border text-sm font-semibold transition-all active:scale-95 disabled:opacity-50",
                          color
                        )}
                      >
                        {label}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Hint when not yet flipped */}
              {!isFlipped && (
                <p className="text-xs text-muted-foreground">
                  Try to recall the verse, then tap to check
                </p>
              )}
            </div>
          )}
        </>
      )}

      {/* FAB — Add verse */}
      {!loading && !seeding && totalCards > 0 && !done && (
        <motion.button
          onClick={() => setShowAddForm(true)}
          className="fixed bottom-24 right-5 w-14 h-14 rounded-full bg-primary text-white shadow-lg shadow-primary/30 flex items-center justify-center active:scale-95 transition-transform z-40"
          whileTap={{ scale: 0.92 }}
          aria-label="Add a verse"
        >
          <Plus className="h-6 w-6" />
        </motion.button>
      )}

      {/* Add verse sheet */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div
            key="add-sheet"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex flex-col"
            style={{ background: "rgba(0,0,0,0.4)" }}
          >
            <div className="flex-1" onClick={() => setShowAddForm(false)} />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 260 }}
              className="bg-background rounded-t-3xl px-5 pt-5 pb-10 space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-foreground">Add a verse</h3>
                <button onClick={() => setShowAddForm(false)}>
                  <X className="h-5 w-5 text-muted-foreground" />
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
                    Reference
                  </label>
                  <input
                    type="text"
                    value={newRef}
                    onChange={(e) => setNewRef(e.target.value)}
                    placeholder="e.g. John 3:16"
                    className="w-full px-3 py-2.5 rounded-xl border border-border bg-muted/40 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
                    Verse text
                  </label>
                  <Textarea
                    value={newText}
                    onChange={(e) => setNewText(e.target.value)}
                    placeholder="Type or paste the verse here…"
                    rows={4}
                    className="bg-muted/40 border-border focus-visible:ring-1 focus-visible:ring-primary text-sm resize-none"
                  />
                </div>
              </div>

              <Button
                onClick={handleAddVerse}
                disabled={!newRef.trim() || !newText.trim() || saving}
                className="w-full"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save verse"}
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
