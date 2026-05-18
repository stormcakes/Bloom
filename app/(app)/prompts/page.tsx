"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Search, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

type Category =
  | "All"
  | "Gratitude"
  | "Anxiety"
  | "Purpose"
  | "Healing"
  | "Faith"
  | "Relationships"
  | "Growth";

interface Prompt {
  id: number;
  category: Exclude<Category, "All">;
  text: string;
}

const CATEGORY_STYLES: Record<Exclude<Category, "All">, string> = {
  Gratitude: "bg-green-100 text-green-700",
  Anxiety: "bg-blue-100 text-blue-700",
  Purpose: "bg-amber-100 text-amber-700",
  Healing: "bg-rose-100 text-rose-700",
  Faith: "bg-violet-100 text-violet-700",
  Relationships: "bg-pink-100 text-pink-700",
  Growth: "bg-orange-100 text-orange-700",
};

const CATEGORIES: Category[] = [
  "All",
  "Gratitude",
  "Anxiety",
  "Purpose",
  "Healing",
  "Faith",
  "Relationships",
  "Growth",
];

const PROMPTS: Prompt[] = [
  // Gratitude
  {
    id: 1,
    category: "Gratitude",
    text: "What are 3 small blessings from this week you almost missed?",
  },
  {
    id: 2,
    category: "Gratitude",
    text: "Describe a moment today where you felt God's presence, even subtly.",
  },
  {
    id: 3,
    category: "Gratitude",
    text: "What person in your life are you most grateful for right now, and why?",
  },
  {
    id: 4,
    category: "Gratitude",
    text: "Write about a season that felt hard at the time but you now see God's hand in. What are you grateful for from that chapter?",
  },
  {
    id: 5,
    category: "Gratitude",
    text: "What is something about your body, mind, or spirit that you tend to overlook being thankful for?",
  },
  {
    id: 6,
    category: "Gratitude",
    text: "Name five things about today — no matter how ordinary — that you can offer back to God as thanks.",
  },

  // Anxiety
  {
    id: 7,
    category: "Anxiety",
    text: "What fear has been taking up the most space in your mind lately? Hand it to God in writing.",
  },
  {
    id: 8,
    category: "Anxiety",
    text: "Write about a time God came through when you were afraid. How does that truth apply to what you're facing now?",
  },
  {
    id: 9,
    category: "Anxiety",
    text: "What would you do today if you weren't afraid?",
  },
  {
    id: 10,
    category: "Anxiety",
    text: "Write out Philippians 4:6-7 in your own words, then apply it directly to the worry on your heart right now.",
  },
  {
    id: 11,
    category: "Anxiety",
    text: "What is the worst-case scenario you keep imagining? Now write what God's presence looks like inside that scenario.",
  },
  {
    id: 12,
    category: "Anxiety",
    text: "Where do you feel anxiety in your body? Sit with it for a moment and write what you sense God saying to that place.",
  },

  // Purpose
  {
    id: 13,
    category: "Purpose",
    text: "What unique gifts has God placed in you that the world needs?",
  },
  {
    id: 14,
    category: "Purpose",
    text: "If God wrote your life story, what chapter are you in right now?",
  },
  {
    id: 15,
    category: "Purpose",
    text: "What would you attempt if you knew God would back you up completely?",
  },
  {
    id: 16,
    category: "Purpose",
    text: "When do you feel most alive and fully yourself? What does that reveal about how God wired you?",
  },
  {
    id: 17,
    category: "Purpose",
    text: "What problem in the world breaks your heart the most? Could that heartbreak be a calling in disguise?",
  },
  {
    id: 18,
    category: "Purpose",
    text: "Describe the legacy you want to leave. Not the accomplishments — the impact on people's lives.",
  },

  // Healing
  {
    id: 19,
    category: "Healing",
    text: "What wound are you still carrying that you haven't fully given to God?",
  },
  {
    id: 20,
    category: "Healing",
    text: "Write a letter to your past self about what God has brought you through.",
  },
  {
    id: 21,
    category: "Healing",
    text: "What does healing look like for you — not as a destination, but as a journey?",
  },
  {
    id: 22,
    category: "Healing",
    text: "Is there someone you need to forgive — including yourself? Write about what forgiveness might feel like, even if you're not there yet.",
  },
  {
    id: 23,
    category: "Healing",
    text: "What lie did you believe about yourself because of your pain? What does God say instead?",
  },
  {
    id: 24,
    category: "Healing",
    text: "Where in your story have you seen God turn something broken into something beautiful?",
  },

  // Faith
  {
    id: 25,
    category: "Faith",
    text: "What does your relationship with God feel like right now — be honest.",
  },
  {
    id: 26,
    category: "Faith",
    text: "What's one thing about God's character you're struggling to believe right now?",
  },
  {
    id: 27,
    category: "Faith",
    text: "If faith is a muscle, what's been exercising it lately?",
  },
  {
    id: 28,
    category: "Faith",
    text: "Write about a time your faith was stretched to its limit. What did you learn about God — and yourself — on the other side?",
  },
  {
    id: 29,
    category: "Faith",
    text: "What would it mean for you to fully trust God in this season, practically and specifically?",
  },
  {
    id: 30,
    category: "Faith",
    text: "What Scripture verse has felt alive to you recently? Write about why it resonates so deeply right now.",
  },

  // Relationships
  {
    id: 31,
    category: "Relationships",
    text: "Who in your life needs grace from you that you haven't given yet?",
  },
  {
    id: 32,
    category: "Relationships",
    text: "Write about a relationship that has shaped your faith.",
  },
  {
    id: 33,
    category: "Relationships",
    text: "Where are you being called to love someone who is difficult to love?",
  },
  {
    id: 34,
    category: "Relationships",
    text: "What kind of friend, partner, or family member do you want to be? Where is there a gap between that vision and today?",
  },
  {
    id: 35,
    category: "Relationships",
    text: "Is there a relationship in your life that needs a difficult conversation? What would it look like to approach it with love and truth?",
  },
  {
    id: 36,
    category: "Relationships",
    text: "Write a prayer for someone in your life who is hurting right now, by name.",
  },

  // Growth
  {
    id: 37,
    category: "Growth",
    text: "What habit or pattern is God asking you to surrender?",
  },
  {
    id: 38,
    category: "Growth",
    text: "How have you changed in the last year — spiritually, emotionally?",
  },
  {
    id: 39,
    category: "Growth",
    text: "What does the person you're becoming look like?",
  },
  {
    id: 40,
    category: "Growth",
    text: "What is one area of your life where you've been playing it safe? What would stepping out in courage look like?",
  },
  {
    id: 41,
    category: "Growth",
    text: "What is God pruning from your life right now, even if it's uncomfortable? What might He be making room for?",
  },
  {
    id: 42,
    category: "Growth",
    text: "Write about a failure or setback that became a turning point. What did God teach you through it?",
  },
];

export default function PromptsPage() {
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState<Category>("All");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredPrompts = useMemo(() => {
    return PROMPTS.filter((p) => {
      const matchesCategory =
        activeCategory === "All" || p.category === activeCategory;
      const matchesSearch =
        searchQuery.trim() === "" ||
        p.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.category.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, searchQuery]);

  function handleStartWriting(promptText: string) {
    router.push(`/journal?prompt=${encodeURIComponent(promptText)}`);
  }

  return (
    <div className="flex flex-col min-h-screen px-4 pt-10 pb-28 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => router.push("/journal")}
          className="w-9 h-9 rounded-full border border-border flex items-center justify-center active:scale-95 transition-transform"
          aria-label="Back to Journal"
        >
          <ArrowLeft className="h-4 w-4 text-foreground" />
        </button>
        <h1 className="text-2xl font-bold text-foreground">Journal Prompts ✍️</h1>
      </div>

      {/* Search bar */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <input
          type="text"
          placeholder="Search prompts…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className={cn(
            "w-full h-10 pl-9 pr-9 rounded-xl border border-border bg-muted/40",
            "text-sm text-foreground placeholder:text-muted-foreground",
            "focus:outline-none focus:ring-2 focus:ring-primary/30 transition-shadow"
          )}
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2"
            aria-label="Clear search"
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        )}
      </div>

      {/* Category filter tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-5 no-scrollbar">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={cn(
              "flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all active:scale-95",
              activeCategory === cat
                ? "bg-primary text-white border-primary shadow-sm"
                : "border-border text-muted-foreground bg-transparent hover:border-primary/40"
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Results count */}
      <p className="text-xs text-muted-foreground mb-4">
        {filteredPrompts.length} {filteredPrompts.length === 1 ? "prompt" : "prompts"}
      </p>

      {/* Prompt grid */}
      <motion.div layout className="flex flex-col gap-3">
        <AnimatePresence mode="popLayout">
          {filteredPrompts.map((prompt) => (
            <motion.div
              key={prompt.id}
              layout
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={{ duration: 0.18 }}
            >
              <div className="bloom-card space-y-3">
                {/* Category badge */}
                <span
                  className={cn(
                    "inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide",
                    CATEGORY_STYLES[prompt.category]
                  )}
                >
                  {prompt.category}
                </span>

                {/* Prompt text */}
                <p className="text-sm font-medium text-foreground leading-relaxed">
                  {prompt.text}
                </p>

                {/* CTA */}
                <button
                  onClick={() => handleStartWriting(prompt.text)}
                  className={cn(
                    "text-xs font-semibold text-primary flex items-center gap-1",
                    "active:opacity-70 transition-opacity"
                  )}
                >
                  Start Writing →
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      {/* Empty state */}
      {filteredPrompts.length === 0 && (
        <div className="flex flex-col items-center text-center gap-3 py-16">
          <span className="text-4xl">🔍</span>
          <div>
            <p className="font-medium text-foreground text-sm">No prompts found</p>
            <p className="text-xs text-muted-foreground mt-1">
              Try a different keyword or category.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
